from __future__ import annotations

from decimal import Decimal, ROUND_HALF_UP
from pathlib import Path
import re

from num2words import num2words
from xml.sax.saxutils import escape

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import (
    BaseDocTemplate,
    Frame,
    PageTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
)

from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

from sqlalchemy import select

from database.repository import SessionLocal
from database.models import (
    BillHeader,
    BillItem,
    OrderHeader,
    OrderItem,
)


# =========================================================
# Configuration
# =========================================================

INVOICE_STORAGE_DIR = Path("storage/invoices")
ORDER_STORAGE_DIR = Path("storage/orders")


SELLER = {
    "name": "TEMPO INSTRUMENTS PRIVATE LIMITED",
    "address": [
        "TOP SYRINGE COMPOUND, 126, W.E. HIGHWAY",
        "BEHIND SAMRAT HOTEL, PANDURANG WADI",
        "POST. MIRA, DIST. THANE (MH.) -401104",
    ],
    "mobile": "96197 41622 / 98204 64003",
    "gstin": "27AAMCS6280R1ZB",
    "state": "Maharashtra",
    "state_code": "27",
    "cin": "U29268MH2008PTC186404",
    "pan": "AAMCS6280R",
}


# =========================================================
# Helpers
# =========================================================

def money(
    value: Decimal | int | float | str | None,
) -> Decimal:
    """
    Normalize any numeric value to 2 decimal places.
    """
    if value is None or value == "":
        value = 0

    return Decimal(str(value)).quantize(
        Decimal("0.01"),
        rounding=ROUND_HALF_UP,
    )


def decimal_value(
    value: Decimal | int | float | str | None,
) -> Decimal:
    """
    Convert a value to Decimal without forcing 2 decimal places.
    Useful for quantities.
    """
    if value is None or value == "":
        return Decimal("0")

    return Decimal(str(value))


def money_text(
    value: Decimal | int | float | str | None,
) -> str:
    """
    Format a numeric amount using Indian invoice-style
    comma grouping.
    """
    return f"{money(value):,.2f}"


def safe_filename(value: str) -> str:
    """
    Make a value safe for use as a filename.
    """
    cleaned = re.sub(
        r"[^A-Za-z0-9_.-]+",
        "_",
        str(value),
    )

    return cleaned.strip("._") or "document"


def date_text(value) -> str:
    """
    Tally-style date format:
    13-Jul-26
    """
    if not value:
        return ""

    if hasattr(value, "strftime"):
        return value.strftime("%d-%b-%y")

    return str(value)


def amount_in_words(
    value: Decimal | int | float | str | None,
) -> str:
    """
    Convert an amount to Indian Rupees in words.
    """
    value = money(value)

    rupees = int(value)

    paise = int(
        (
            value - Decimal(rupees)
        ) * 100
    )

    text = num2words(
        rupees,
        lang="en_IN",
    ).title()

    result = f"Indian Rupees {text}"

    if paise:
        result += (
            " and "
            f"{num2words(paise, lang='en_IN').title()}"
            " Paise"
        )

    return result + " Only"


def paragraph(text, style):
    """
    Plain text ReportLab Paragraph.

    Text is escaped before passing to ReportLab.
    """
    text = "" if text is None else str(text)

    text = escape(text)

    return Paragraph(
        text.replace("\n", "<br/>"),
        style,
    )


def markup_paragraph(text, style):
    """
    ReportLab markup Paragraph.

    Use this when text intentionally contains:
    <b>, <i>, <br/>, etc.
    """
    text = "" if text is None else str(text)

    return Paragraph(
        text.replace("\n", "<br/>"),
        style,
    )


def obj_value(
    obj,
    *names,
    default="",
):
    """
    Safely retrieve the first available non-empty attribute
    from an object.

    This is intentionally tolerant because different versions
    of OrderHeader / BillHeader may not contain every Tally
    metadata field.
    """
    if obj is None:
        return default

    for name in names:
        if not hasattr(obj, name):
            continue

        value = getattr(obj, name)

        if value is not None and str(value).strip():
            return value

    return default


def first_non_empty(
    *values,
    default="",
):
    """
    Return the first non-empty value.
    """
    for value in values:
        if value is not None and str(value).strip():
            return value

    return default


def normalize_state(value) -> str:
    """
    Normalize state names for comparisons.
    """
    return str(value or "").strip().lower()


def multiline_address(value) -> list[str]:
    """
    Convert an address into lines.

    Supports:
    - None
    - strings
    - lists/tuples
    """
    if value is None:
        return []

    if isinstance(value, (list, tuple)):
        return [
            str(x).strip()
            for x in value
            if str(x).strip()
        ]

    return [
        line.strip()
        for line in str(value).splitlines()
        if line.strip()
    ]


# =========================================================
# Service
# =========================================================

class BillingInvoiceService:

    # =====================================================
    # Public API
    # =====================================================

    @classmethod
    def generate_invoice_pdf(
        cls,
        bill_num: str,
        document_title: str = "Tax Invoice",
    ) -> Path:
        """
        Generate a tax invoice PDF from a BillHeader/BillItem.

        Bill lookup is performed using bill_num.
        """
        INVOICE_STORAGE_DIR.mkdir(
            parents=True,
            exist_ok=True,
        )

        output_path = (
            INVOICE_STORAGE_DIR
            / f"{safe_filename(bill_num)}.pdf"
        )

        with SessionLocal() as session:

            # ---------------------------------------------
            # Bill
            # ---------------------------------------------

            bill = session.scalar(
                select(BillHeader)
                .where(
                    BillHeader.bill_num == bill_num
                )
            )

            if not bill:
                raise ValueError(
                    f"Bill '{bill_num}' was not found."
                )

            # ---------------------------------------------
            # Order
            #
            # BillHeader uses order_id as the relationship
            # to OrderHeader, so order_id is correct here.
            # ---------------------------------------------

            order = None

            bill_order_id = obj_value(
                bill,
                "order_id",
                default=None,
            )

            if bill_order_id is not None:
                order = session.scalar(
                    select(OrderHeader)
                    .where(
                        OrderHeader.order_id
                        == bill_order_id
                    )
                )

            # ---------------------------------------------
            # Bill items
            # ---------------------------------------------

            bill_items = list(
                session.scalars(
                    select(BillItem)
                    .where(
                        BillItem.bill_num == bill_num
                    )
                    .order_by(
                        BillItem.bill_item_id
                    )
                )
            )

            if not bill_items:
                raise ValueError(
                    f"Bill '{bill_num}' has no bill items."
                )

            # ---------------------------------------------
            # Order items
            # ---------------------------------------------

            order_items = {}

            if order:
                rows = session.scalars(
                    select(OrderItem)
                    .where(
                        OrderItem.order_id
                        == order.order_id
                    )
                )

                order_items = {
                    item.order_item_id: item
                    for item in rows
                }

            # ---------------------------------------------
            # Build model
            # ---------------------------------------------

            invoice_data = cls._build_invoice_data(
                bill=bill,
                order=order,
                bill_items=bill_items,
                order_items=order_items,
            )

        # ---------------------------------------------
        # Render
        # ---------------------------------------------

        cls._render_pdf(
            invoice_data,
            output_path,
            document_title=document_title,
        )

        return output_path

    @classmethod
    def get_or_generate_invoice_pdf(
        cls,
        bill_num: str,
        document_title: str = "Tax Invoice",
    ) -> Path:
        """
        Return an existing invoice PDF if available;
        otherwise generate it.
        """
        INVOICE_STORAGE_DIR.mkdir(
            parents=True,
            exist_ok=True,
        )

        output_path = (
            INVOICE_STORAGE_DIR
            / f"{safe_filename(bill_num)}.pdf"
        )

        if output_path.exists():
            print(
                f"Returning existing invoice PDF: "
                f"{output_path}"
            )

            return output_path

        print(
            f"Generating new invoice PDF: "
            f"{output_path}"
        )

        return cls.generate_invoice_pdf(
            bill_num,
            document_title=document_title,
        )

    @classmethod
    def get_or_generate_order_pdf(
        cls,
        order_acceptance_id: str,
        document_title: str = "Ordered Sales",
    ) -> Path:
        """
        Return an existing Ordered Sales PDF if available;
        otherwise generate it.

        IMPORTANT:
        Orders are identified by order_acceptance_id,
        not order_id.
        """
        ORDER_STORAGE_DIR.mkdir(
            parents=True,
            exist_ok=True,
        )

        output_path = (
            ORDER_STORAGE_DIR
            / f"{safe_filename(order_acceptance_id)}.pdf"
        )

        if output_path.exists():
            print(
                f"Returning existing {document_title} PDF: "
                f"{output_path}"
            )

            return output_path

        print(
            f"Generating new {document_title} PDF: "
            f"{output_path}"
        )

        return cls.generate_order_pdf(
            order_acceptance_id,
            document_title=document_title,
        )

    @classmethod
    def generate_order_pdf(
        cls,
        order_acceptance_id: str,
        document_title: str = "Ordered Sales",
    ) -> Path:
        """
        Generate an Ordered Sales PDF.

        IMPORTANT:
        OrderHeader is searched using order_acceptance_id.

        Once the correct OrderHeader is found, its internal
        order_id is used to fetch OrderItem records.
        """
        ORDER_STORAGE_DIR.mkdir(
            parents=True,
            exist_ok=True,
        )

        output_path = (
            ORDER_STORAGE_DIR
            / f"{safe_filename(order_acceptance_id)}.pdf"
        )

        with SessionLocal() as session:

            # ---------------------------------------------
            # Order
            #
            # IMPORTANT:
            # Search by Order Acceptance ID.
            # ---------------------------------------------

            order = session.scalars(
                select(OrderHeader)
                .where(
                    OrderHeader.order_acceptance_id
                    == order_acceptance_id
                )
                .limit(1)
            ).first()

            if not order:
                raise ValueError(
                    "Order with "
                    f"order_acceptance_id "
                    f"'{order_acceptance_id}' "
                    "was not found."
                )

            # ---------------------------------------------
            # Order items
            #
            # After locating the order by OA number,
            # use its internal order_id to retrieve items.
            # ---------------------------------------------

            order_items = list(
                session.scalars(
                    select(OrderItem)
                    .where(
                        OrderItem.order_id
                        == order.order_id
                    )
                    .order_by(
                        OrderItem.order_item_id
                    )
                )
            )

            if not order_items:
                raise ValueError(
                    "Order with "
                    f"order_acceptance_id "
                    f"'{order_acceptance_id}' "
                    "has no order items."
                )

            # ---------------------------------------------
            # Build common PDF model
            # ---------------------------------------------

            data = cls._build_order_data(
                order=order,
                order_items=order_items,
            )

        # ---------------------------------------------
        # Render
        # ---------------------------------------------

        cls._render_pdf(
            data,
            output_path,
            document_title=document_title,
        )

        return output_path

    # =====================================================
    # Tax helper
    # =====================================================

    @classmethod
    def _calculate_tax(
        cls,
        taxable_value: Decimal,
        tax_rate: Decimal,
        buyer_state,
    ):
        """
        Calculate CGST/SGST for Maharashtra buyers and
        IGST for inter-state buyers.
        """
        taxable_value = money(taxable_value)
        tax_rate = money(tax_rate)

        tax_amount = money(
            taxable_value
            * tax_rate
            / Decimal("100")
        )

        seller_state = normalize_state(
            SELLER["state"]
        )

        normalized_buyer_state = normalize_state(
            buyer_state
        )

        is_intrastate = bool(
            seller_state
            and normalized_buyer_state
            and seller_state == normalized_buyer_state
        )

        if is_intrastate:

            cgst = money(
                tax_amount / Decimal("2")
            )

            sgst = money(
                tax_amount - cgst
            )

            igst = Decimal("0.00")

            cgst_rate = money(
                tax_rate / Decimal("2")
            )

            sgst_rate = money(
                tax_rate / Decimal("2")
            )

            igst_rate = Decimal("0.00")

        else:

            cgst = Decimal("0.00")
            sgst = Decimal("0.00")

            igst = tax_amount

            cgst_rate = Decimal("0.00")
            sgst_rate = Decimal("0.00")

            igst_rate = tax_rate

        grand_total = money(
            taxable_value
            + tax_amount
        )

        return {
            "tax_amount": tax_amount,
            "cgst": cgst,
            "sgst": sgst,
            "igst": igst,
            "cgst_rate": cgst_rate,
            "sgst_rate": sgst_rate,
            "igst_rate": igst_rate,
            "grand_total": grand_total,
            "is_intrastate": is_intrastate,
        }

    # =====================================================
    # Build invoice calculation model
    # =====================================================

    @classmethod
    def _build_invoice_data(
        cls,
        bill,
        order,
        bill_items,
        order_items,
    ):
        items = []

        goods_total = Decimal("0.00")

        # -------------------------------------------------
        # Items
        # -------------------------------------------------

        for bill_item in bill_items:

            order_item = order_items.get(
                bill_item.order_item_id
            )

            item_code = first_non_empty(
                obj_value(
                    bill_item,
                    "item_code",
                ),
                obj_value(
                    order_item,
                    "item_code",
                ),
                default="",
            )

            quantity = decimal_value(
                obj_value(
                    bill_item,
                    "quantity_shipped",
                    "quantity",
                    default=0,
                )
            )

            rate_value = first_non_empty(
                obj_value(
                    bill_item,
                    "rate",
                    default=None,
                ),
                obj_value(
                    order_item,
                    "rate",
                    default=None,
                ),
                default=0,
            )

            rate = money(rate_value)

            # ---------------------------------------------
            # Discount
            #
            # IMPORTANT:
            # This must be calculated BEFORE amount.
            # The original code referenced `discount`
            # before assigning it.
            # ---------------------------------------------

            discount_value = first_non_empty(
                obj_value(
                    bill_item,
                    "discount",
                    "discount_percent",
                    default=None,
                ),
                obj_value(
                    order_item,
                    "discount",
                    "discount_percent",
                    default=None,
                ),
                default=0,
            )

            discount = money(discount_value)

            # ---------------------------------------------
            # Amount
            # ---------------------------------------------

            amount_value = first_non_empty(
                obj_value(
                    bill_item,
                    "amount",
                    default=None,
                ),
                default=None,
            )

            if amount_value is None:

                gross_amount = (
                    quantity * rate
                )

                discount_amount = (
                    gross_amount
                    * discount
                    / Decimal("100")
                )

                amount = money(
                    gross_amount
                    - discount_amount
                )

            else:
                amount = money(amount_value)

            goods_total += amount

            # ---------------------------------------------
            # Description
            # ---------------------------------------------

            description = first_non_empty(
                obj_value(
                    order_item,
                    "additional_spec_text",
                ),
                obj_value(
                    bill_item,
                    "additional_spec_text",
                ),
                default="",
            )

            # ---------------------------------------------
            # HSN
            # ---------------------------------------------

            hsn = first_non_empty(
                obj_value(
                    bill_item,
                    "hsn_code",
                ),
                obj_value(
                    order_item,
                    "hsn_code",
                ),
                default="",
            )

            # ---------------------------------------------
            # Unit
            # ---------------------------------------------

            um = first_non_empty(
                obj_value(
                    order_item,
                    "um",
                ),
                obj_value(
                    bill_item,
                    "um",
                ),
                default="Nos.",
            )

            items.append(
                {
                    "item_code": item_code,
                    "description": description,
                    "hsn": hsn,
                    "quantity": quantity,
                    "um": um,
                    "rate": rate,
                    "discount": discount,
                    "amount": amount,
                }
            )

        # -------------------------------------------------
        # Charges
        # -------------------------------------------------

        packing = money(
            obj_value(
                order,
                "packing_charges",
                default=0,
            )
        )

        freight = money(
            obj_value(
                order,
                "freight_charges",
                default=0,
            )
        )

        taxable_value = money(
            goods_total
            + packing
            + freight
        )

        # -------------------------------------------------
        # Tax rate
        # -------------------------------------------------

        tax_rate = money(
            obj_value(
                order,
                "tax_rate",
                default=18,
            )
        )

        # -------------------------------------------------
        # Buyer information
        # -------------------------------------------------

        buyer_name = first_non_empty(
            obj_value(
                order,
                "billing_name",
            ),
            obj_value(
                order,
                "buyer_name",
            ),
            obj_value(
                bill,
                "buyer_name",
            ),
            default="",
        )

        buyer_address = first_non_empty(
            obj_value(
                order,
                "billing_address",
            ),
            obj_value(
                order,
                "buyer_address",
            ),
            obj_value(
                bill,
                "buyer_address",
            ),
            default="",
        )

        buyer_gstin = first_non_empty(
            obj_value(
                order,
                "buyer_gstin",
            ),
            obj_value(
                order,
                "billing_gstin",
            ),
            obj_value(
                bill,
                "buyer_gstin",
            ),
            default="",
        )

        buyer_state = first_non_empty(
            obj_value(
                order,
                "state_name",
            ),
            obj_value(
                bill,
                "indian_state",
            ),
            default="",
        )

        buyer_state_code = first_non_empty(
            obj_value(
                order,
                "state_code",
            ),
            obj_value(
                bill,
                "state_code",
            ),
            default="",
        )

        # -------------------------------------------------
        # Consignee / shipping information
        # -------------------------------------------------

        consignee_name = first_non_empty(
            obj_value(
                order,
                "shipping_name",
            ),
            obj_value(
                order,
                "consignee_name",
            ),
            buyer_name,
            default="",
        )

        consignee_address = first_non_empty(
            obj_value(
                order,
                "shipping_address",
            ),
            obj_value(
                order,
                "consignee_address",
            ),
            buyer_address,
            default="",
        )

        consignee_gstin = first_non_empty(
            obj_value(
                order,
                "shipping_gstin",
            ),
            obj_value(
                order,
                "consignee_gstin",
            ),
            buyer_gstin,
            default="",
        )

        consignee_state = first_non_empty(
            obj_value(
                order,
                "shipping_state",
            ),
            obj_value(
                order,
                "consignee_state",
            ),
            buyer_state,
            default="",
        )

        consignee_state_code = first_non_empty(
            obj_value(
                order,
                "shipping_state_code",
            ),
            obj_value(
                order,
                "consignee_state_code",
            ),
            buyer_state_code,
            default="",
        )

        # -------------------------------------------------
        # Tax
        # -------------------------------------------------

        tax_data = cls._calculate_tax(
            taxable_value=taxable_value,
            tax_rate=tax_rate,
            buyer_state=buyer_state,
        )

        # -------------------------------------------------
        # Tally-style invoice metadata
        # -------------------------------------------------

        invoice_metadata = {
            "invoice_no": first_non_empty(
                obj_value(
                    bill,
                    "bill_num",
                ),
                default="",
            ),

            "invoice_date": obj_value(
                bill,
                "bill_date",
                default=None,
            ),

            "delivery_note": first_non_empty(
                obj_value(
                    bill,
                    "delivery_note",
                ),
                obj_value(
                    order,
                    "delivery_note",
                ),
                default="",
            ),

            "payment_terms": first_non_empty(
                obj_value(
                    order,
                    "payment_terms",
                ),
                obj_value(
                    bill,
                    "payment_terms",
                ),
                default="",
            ),

            "reference_no": first_non_empty(
                obj_value(
                    order,
                    "order_acceptance_id",
                ),
                obj_value(
                    order,
                    "reference_no",
                ),
                default="",
            ),

            "reference_date": first_non_empty(
                obj_value(
                    order,
                    "order_acceptance_date",
                ),
                obj_value(
                    order,
                    "reference_date",
                ),
                default=None,
            ),

            "other_references": first_non_empty(
                obj_value(
                    order,
                    "other_references",
                ),
                obj_value(
                    bill,
                    "other_references",
                ),
                default="",
            ),

            "buyers_order_no": first_non_empty(
                obj_value(
                    order,
                    "purchase_order_number",
                ),
                obj_value(
                    order,
                    "buyers_order_no",
                ),
                default="",
            ),

            "buyers_order_date": first_non_empty(
                obj_value(
                    order,
                    "purchase_order_date",
                ),
                obj_value(
                    order,
                    "buyers_order_date",
                ),
                default=None,
            ),

            "dispatch_doc_no": first_non_empty(
                obj_value(
                    order,
                    "dispatch_doc_no",
                ),
                obj_value(
                    order,
                    "dispatch_document_no",
                ),
                obj_value(
                    bill,
                    "dispatch_doc_no",
                ),
                default="",
            ),

            "delivery_note_date": first_non_empty(
                obj_value(
                    order,
                    "delivery_note_date",
                ),
                obj_value(
                    bill,
                    "delivery_note_date",
                ),
                default=None,
            ),

            "dispatched_through": first_non_empty(
                obj_value(
                    order,
                    "dispatched_through",
                ),
                obj_value(
                    order,
                    "transport_mode",
                ),
                default="",
            ),

            "destination": first_non_empty(
                obj_value(
                    order,
                    "destination",
                ),
                consignee_state,
                buyer_state,
                default="",
            ),

            "delivery_terms": first_non_empty(
                obj_value(
                    order,
                    "delivery_terms",
                ),
                obj_value(
                    order,
                    "terms_of_delivery",
                ),
                default="",
            ),
        }

        return {
            "bill_num": bill.bill_num,
            "bill_date": bill.bill_date,

            "seller": SELLER,

            "buyer": {
                "name": buyer_name,
                "address": buyer_address,
                "gstin": buyer_gstin,
                "state": buyer_state,
                "state_code": buyer_state_code,
                "pan": first_non_empty(
                    obj_value(
                        order,
                        "buyer_pan",
                    ),
                    obj_value(
                        bill,
                        "buyer_pan",
                    ),
                    default="",
                ),
            },

            "consignee": {
                "name": consignee_name,
                "address": consignee_address,
                "gstin": consignee_gstin,
                "state": consignee_state,
                "state_code": consignee_state_code,
            },

            "invoice_metadata": invoice_metadata,

            "order": {
                "order_id": obj_value(
                    order,
                    "order_id",
                    default=None,
                ),

                "order_acceptance_id": obj_value(
                    order,
                    "order_acceptance_id",
                    default="",
                ),

                "order_acceptance_date": obj_value(
                    order,
                    "order_acceptance_date",
                    default=None,
                ),

                "purchase_order_number": obj_value(
                    order,
                    "purchase_order_number",
                    default="",
                ),

                "purchase_order_date": obj_value(
                    order,
                    "purchase_order_date",
                    default=None,
                ),

                "payment_terms": obj_value(
                    order,
                    "payment_terms",
                    default="",
                ),

                "dispatched_through": obj_value(
                    order,
                    "dispatched_through",
                    default="",
                ),

                "destination": obj_value(
                    order,
                    "destination",
                    default="",
                ),

                "delivery_terms": obj_value(
                    order,
                    "delivery_terms",
                    default="",
                ),
            },

            "items": items,

            "packing": packing,
            "freight": freight,

            "goods_total": goods_total,
            "taxable_value": taxable_value,

            "tax_rate": tax_rate,

            "cgst_rate": tax_data["cgst_rate"],
            "sgst_rate": tax_data["sgst_rate"],
            "igst_rate": tax_data["igst_rate"],

            "cgst": tax_data["cgst"],
            "sgst": tax_data["sgst"],
            "igst": tax_data["igst"],

            "tax_amount": tax_data["tax_amount"],
            "grand_total": tax_data["grand_total"],

            "is_intrastate": tax_data["is_intrastate"],
        }

    # =====================================================
    # Build order calculation model
    # =====================================================

    @classmethod
    def _build_order_data(
        cls,
        order,
        order_items,
    ):
        items = []

        goods_total = Decimal("0.00")

        # -------------------------------------------------
        # Items
        # -------------------------------------------------

        for order_item in order_items:

            item_code = first_non_empty(
                obj_value(
                    order_item,
                    "item_code",
                ),
                default="",
            )

            quantity = decimal_value(
                obj_value(
                    order_item,
                    "quantity",
                    default=0,
                )
            )

            rate = money(
                obj_value(
                    order_item,
                    "rate",
                    default=0,
                )
            )

            # -------------------------------------------------
            # Discount
            # -------------------------------------------------

            discount = money(
                first_non_empty(
                    obj_value(
                        order_item,
                        "discount",
                        "discount_percent",
                        default=None,
                    ),
                    default=0,
                )
            )

            # -------------------------------------------------
            # Amount
            # -------------------------------------------------

            gross_amount = (
                quantity * rate
            )

            discount_amount = (
                gross_amount
                * discount
                / Decimal("100")
            )

            amount = money(
                gross_amount
                - discount_amount
            )

            goods_total += amount

            # -------------------------------------------------
            # Description
            # -------------------------------------------------

            description = first_non_empty(
                obj_value(
                    order_item,
                    "additional_spec_text",
                ),
                default="",
            )

            # -------------------------------------------------
            # HSN
            # -------------------------------------------------

            hsn = first_non_empty(
                obj_value(
                    order_item,
                    "hsn_code",
                ),
                default="",
            )

            # -------------------------------------------------
            # Unit
            # -------------------------------------------------

            um = first_non_empty(
                obj_value(
                    order_item,
                    "um",
                    "unit_measure",
                ),
                default="Nos.",
            )

            items.append(
                {
                    "item_code": item_code,
                    "description": description,
                    "hsn": hsn,
                    "quantity": quantity,
                    "um": um,
                    "rate": rate,
                    "discount": discount,
                    "amount": amount,
                }
            )

        # -------------------------------------------------
        # Charges
        # -------------------------------------------------

        packing = money(
            obj_value(
                order,
                "packing_charges",
                default=0,
            )
        )

        freight = money(
            obj_value(
                order,
                "freight_charges",
                default=0,
            )
        )

        taxable_value = money(
            goods_total
            + packing
            + freight
        )

        # -------------------------------------------------
        # Tax
        # -------------------------------------------------

        tax_rate = money(
            obj_value(
                order,
                "tax_rate",
                default=18,
            )
        )

        # -------------------------------------------------
        # Buyer
        # -------------------------------------------------

        buyer_name = first_non_empty(
            obj_value(
                order,
                "billing_name",
            ),
            obj_value(
                order,
                "buyer_name",
            ),
            default="",
        )

        buyer_address = first_non_empty(
            obj_value(
                order,
                "billing_address",
            ),
            obj_value(
                order,
                "buyer_address",
            ),
            default="",
        )

        buyer_gstin = first_non_empty(
            obj_value(
                order,
                "buyer_gstin",
            ),
            obj_value(
                order,
                "billing_gstin",
            ),
            default="",
        )

        buyer_state = first_non_empty(
            obj_value(
                order,
                "state_name",
            ),
            default="",
        )

        buyer_state_code = first_non_empty(
            obj_value(
                order,
                "state_code",
            ),
            default="",
        )

        # -------------------------------------------------
        # Consignee
        # -------------------------------------------------

        consignee_name = first_non_empty(
            obj_value(
                order,
                "shipping_name",
            ),
            obj_value(
                order,
                "consignee_name",
            ),
            buyer_name,
            default="",
        )

        consignee_address = first_non_empty(
            obj_value(
                order,
                "shipping_address",
            ),
            obj_value(
                order,
                "consignee_address",
            ),
            buyer_address,
            default="",
        )

        consignee_gstin = first_non_empty(
            obj_value(
                order,
                "shipping_gstin",
            ),
            obj_value(
                order,
                "consignee_gstin",
            ),
            buyer_gstin,
            default="",
        )

        consignee_state = first_non_empty(
            obj_value(
                order,
                "shipping_state",
            ),
            obj_value(
                order,
                "consignee_state",
            ),
            buyer_state,
            default="",
        )

        consignee_state_code = first_non_empty(
            obj_value(
                order,
                "shipping_state_code",
            ),
            obj_value(
                order,
                "consignee_state_code",
            ),
            buyer_state_code,
            default="",
        )

        # -------------------------------------------------
        # Tax
        # -------------------------------------------------

        tax_data = cls._calculate_tax(
            taxable_value=taxable_value,
            tax_rate=tax_rate,
            buyer_state=buyer_state,
        )

        # -------------------------------------------------
        # Tally-style metadata
        #
        # IMPORTANT:
        # OA number is the document number.
        # -------------------------------------------------

        oa_number = first_non_empty(
            obj_value(
                order,
                "order_acceptance_id",
            ),
            default="",
        )

        if not oa_number:
            raise ValueError(
                "Order cannot be rendered because "
                "order_acceptance_id is empty."
            )

        invoice_metadata = {
            "invoice_no": oa_number,

            "invoice_date": first_non_empty(
                obj_value(
                    order,
                    "order_date",
                ),
                obj_value(
                    order,
                    "order_acceptance_date",
                ),
                default=None,
            ),

            "delivery_note": obj_value(
                order,
                "delivery_note",
                default="",
            ),

            "payment_terms": obj_value(
                order,
                "payment_terms",
                default="",
            ),

            "reference_no": oa_number,

            "reference_date": obj_value(
                order,
                "order_acceptance_date",
                default=None,
            ),

            "other_references": obj_value(
                order,
                "other_references",
                default="",
            ),

            "buyers_order_no": obj_value(
                order,
                "purchase_order_number",
                default="",
            ),

            "buyers_order_date": obj_value(
                order,
                "purchase_order_date",
                default=None,
            ),

            "dispatch_doc_no": obj_value(
                order,
                "dispatch_doc_no",
                "dispatch_document_no",
                default="",
            ),

            "delivery_note_date": obj_value(
                order,
                "delivery_note_date",
                default=None,
            ),

            "dispatched_through": obj_value(
                order,
                "dispatched_through",
                "transport_mode",
                default="",
            ),

            "destination": first_non_empty(
                obj_value(
                    order,
                    "destination",
                ),
                consignee_state,
                buyer_state,
                default="",
            ),

            "delivery_terms": obj_value(
                order,
                "delivery_terms",
                "terms_of_delivery",
                default="",
            ),
        }

        return {
            "bill_num": "",
            "bill_date": None,

            "seller": SELLER,

            "buyer": {
                "name": buyer_name,
                "address": buyer_address,
                "gstin": buyer_gstin,
                "state": buyer_state,
                "state_code": buyer_state_code,
                "pan": obj_value(
                    order,
                    "buyer_pan",
                    default="",
                ),
            },

            "consignee": {
                "name": consignee_name,
                "address": consignee_address,
                "gstin": consignee_gstin,
                "state": consignee_state,
                "state_code": consignee_state_code,
            },

            "invoice_metadata": invoice_metadata,

            "order": {
                "order_id": obj_value(
                    order,
                    "order_id",
                    default=None,
                ),

                "order_acceptance_id": oa_number,

                "order_acceptance_date": obj_value(
                    order,
                    "order_acceptance_date",
                    default=None,
                ),

                "purchase_order_number": obj_value(
                    order,
                    "purchase_order_number",
                    default="",
                ),

                "purchase_order_date": obj_value(
                    order,
                    "purchase_order_date",
                    default=None,
                ),

                "payment_terms": obj_value(
                    order,
                    "payment_terms",
                    default="",
                ),

                "dispatched_through": obj_value(
                    order,
                    "dispatched_through",
                    default="",
                ),

                "destination": obj_value(
                    order,
                    "destination",
                    default="",
                ),

                "delivery_terms": obj_value(
                    order,
                    "delivery_terms",
                    default="",
                ),
            },

            "items": items,

            "packing": packing,
            "freight": freight,

            "goods_total": goods_total,
            "taxable_value": taxable_value,

            "tax_rate": tax_rate,

            "cgst_rate": tax_data["cgst_rate"],
            "sgst_rate": tax_data["sgst_rate"],
            "igst_rate": tax_data["igst_rate"],

            "cgst": tax_data["cgst"],
            "sgst": tax_data["sgst"],
            "igst": tax_data["igst"],

            "tax_amount": tax_data["tax_amount"],
            "grand_total": tax_data["grand_total"],

            "is_intrastate": tax_data["is_intrastate"],
        }

    # =====================================================
    # PDF renderer
    # =====================================================

    @classmethod
    def _render_pdf(
        cls,
        data,
        output_path: Path,
        document_title: str,
    ):
        # -------------------------------------------------
        # Fonts
        # -------------------------------------------------

        font_paths = [
            "./services/DejaVuSans.ttf",
            "./services/DejaVuSans-Bold.ttf",
        ]

        regular_font = next(
            (
                path
                for path in font_paths
                if "DejaVuSans.ttf" in path
                and "Bold" not in path
                and Path(path).exists()
            ),
            None,
        )

        bold_font = next(
            (
                path
                for path in font_paths
                if "DejaVuSans-Bold.ttf" in path
                and Path(path).exists()
            ),
            None,
        )

        if not regular_font or not bold_font:
            raise RuntimeError(
                "A Unicode TTF font supporting the ₹ glyph "
                "is required to render invoices."
            )

        # -------------------------------------------------
        # Register fonts
        # -------------------------------------------------

        if "InvoiceDejaVu" not in pdfmetrics.getRegisteredFontNames():
            pdfmetrics.registerFont(
                TTFont(
                    "InvoiceDejaVu",
                    regular_font,
                )
            )

        if "InvoiceDejaVu-Bold" not in pdfmetrics.getRegisteredFontNames():
            pdfmetrics.registerFont(
                TTFont(
                    "InvoiceDejaVu-Bold",
                    bold_font,
                )
            )

        # -------------------------------------------------
        # Styles
        # -------------------------------------------------

        styles = getSampleStyleSheet()

        normal = ParagraphStyle(
            "InvoiceNormal",
            parent=styles["Normal"],
            fontName="InvoiceDejaVu",
            fontSize=8,
            leading=10,
            spaceAfter=0,
            alignment=TA_LEFT,
        )

        small = ParagraphStyle(
            "InvoiceSmall",
            parent=normal,
            fontSize=7,
            leading=8.5,
        )

        tiny = ParagraphStyle(
            "InvoiceTiny",
            parent=normal,
            fontSize=6.5,
            leading=7.5,
        )

        bold = ParagraphStyle(
            "InvoiceBold",
            parent=normal,
            fontName="InvoiceDejaVu-Bold",
        )

        title = ParagraphStyle(
            "InvoiceTitle",
            parent=normal,
            fontName="InvoiceDejaVu-Bold",
            fontSize=14,
            leading=16,
            alignment=TA_CENTER,
        )

        right = ParagraphStyle(
            "InvoiceRight",
            parent=normal,
            alignment=TA_RIGHT,
        )

        center = ParagraphStyle(
            "InvoiceCenter",
            parent=normal,
            alignment=TA_CENTER,
        )

        header_label = ParagraphStyle(
            "InvoiceHeaderLabel",
            parent=normal,
            fontName="InvoiceDejaVu-Bold",
            fontSize=7,
            leading=8,
        )

        metadata_value = ParagraphStyle(
            "InvoiceMetadataValue",
            parent=normal,
            fontSize=7.5,
            leading=9,
        )

        metadata_value_bold = ParagraphStyle(
            "InvoiceMetadataValueBold",
            parent=metadata_value,
            fontName="InvoiceDejaVu-Bold",
        )

        # -------------------------------------------------
        # Page geometry
        # -------------------------------------------------

        page_width, page_height = A4

        left_margin = 10 * mm
        right_margin = 10 * mm

        top_margin = 7 * mm
        bottom_margin = 14 * mm

        footer_height = 8 * mm

        content_width = (
            page_width
            - left_margin
            - right_margin
        )

        frame = Frame(
            left_margin,
            bottom_margin + footer_height,
            content_width,
            (
                page_height
                - top_margin
                - bottom_margin
                - footer_height
            ),
            id="invoice_body",
            leftPadding=0,
            rightPadding=0,
            topPadding=0,
            bottomPadding=0,
        )

        # -------------------------------------------------
        # Footer
        # -------------------------------------------------

        def draw_footer(canvas, doc):
            canvas.saveState()

            footer_y = 7 * mm

            canvas.setFont(
                "InvoiceDejaVu",
                7,
            )

            canvas.drawCentredString(
                page_width / 2,
                footer_y,
                "SUBJECT TO MUMBAI JURISDICTION",
            )

            canvas.drawRightString(
                page_width - right_margin,
                footer_y,
                f"Page {doc.page}",
            )

            canvas.restoreState()

        # -------------------------------------------------
        # PDF metadata
        # -------------------------------------------------

        invoice_no = data["invoice_metadata"].get(
            "invoice_no",
            "",
        )

        doc = BaseDocTemplate(
            str(output_path),
            pagesize=A4,
            leftMargin=left_margin,
            rightMargin=right_margin,
            topMargin=top_margin,
            bottomMargin=bottom_margin,
            title=(
                f"{document_title} "
                f"{invoice_no}"
            ),
            author=data["seller"]["name"],
            subject=(
                f"{document_title} "
                f"{invoice_no}"
            ),
            keywords=(
                f"{document_title}, "
                "Tempo Instruments, "
                f"{invoice_no}"
            ),
        )

        doc.addPageTemplates(
            [
                PageTemplate(
                    id="invoice",
                    frames=[frame],
                    onPageEnd=draw_footer,
                )
            ]
        )

        story = []

        # =================================================
        # TITLE
        # =================================================

        story.append(
            Paragraph(
                (
                    f"{escape(document_title)} "
                    "- GENERATED FROM Internal-ERP"
                ),
                title,
            )
        )

        story.append(
            Spacer(
                1,
                2 * mm,
            )
        )

        # =================================================
        # SELLER + INVOICE METADATA
        # =================================================

        seller_address = "<br/>".join(
            escape(line)
            for line in data["seller"]["address"]
        )

        seller_block = markup_paragraph(
            "<b>Seller</b><br/>"
            f"<b>{escape(data['seller']['name'])}</b><br/>"
            f"{seller_address}<br/>"
            f"MOB. {escape(data['seller']['mobile'])}<br/>"
            "GSTIN/UIN : "
            f"{escape(data['seller']['gstin'])}<br/>"
            "State Name : "
            f"{escape(data['seller']['state'])}, "
            "Code : "
            f"{escape(data['seller']['state_code'])}<br/>"
            "CIN: "
            f"{escape(data['seller']['cin'])}",
            normal,
        )

        metadata = data["invoice_metadata"]

        invoice_meta_rows = [
            [
                markup_paragraph(
                    "<b>Invoice No.</b>",
                    header_label,
                ),
                markup_paragraph(
                    (
                        f"<b>"
                        f"{escape(str(metadata['invoice_no']))}"
                        f"</b>"
                    ),
                    metadata_value_bold,
                ),
            ],
            [
                markup_paragraph(
                    "<b>Dated</b>",
                    header_label,
                ),
                markup_paragraph(
                    (
                        f"<b>"
                        f"{escape(date_text(metadata['invoice_date']))}"
                        f"</b>"
                    ),
                    metadata_value_bold,
                ),
            ],
            [
                markup_paragraph(
                    "<b>Delivery Note</b>",
                    header_label,
                ),
                paragraph(
                    metadata["delivery_note"],
                    metadata_value,
                ),
            ],
            [
                markup_paragraph(
                    "<b>Mode/Terms of Payment</b>",
                    header_label,
                ),
                paragraph(
                    metadata["payment_terms"],
                    metadata_value,
                ),
            ],
            [
                markup_paragraph(
                    "<b>Reference No. &amp; Date</b>",
                    header_label,
                ),
                markup_paragraph(
                    escape(
                        str(
                            metadata["reference_no"]
                            or ""
                        )
                    )
                    + (
                        "<br/>"
                        + escape(
                            date_text(
                                metadata["reference_date"]
                            )
                        )
                        if metadata["reference_date"]
                        else ""
                    ),
                    metadata_value,
                ),
            ],
            [
                markup_paragraph(
                    "<b>Other References</b>",
                    header_label,
                ),
                paragraph(
                    metadata["other_references"],
                    metadata_value,
                ),
            ],
            [
                markup_paragraph(
                    "<b>Buyer's Order No.</b>",
                    header_label,
                ),
                paragraph(
                    metadata["buyers_order_no"],
                    metadata_value,
                ),
            ],
            [
                markup_paragraph(
                    "<b>Dated</b>",
                    header_label,
                ),
                paragraph(
                    date_text(
                        metadata["buyers_order_date"]
                    ),
                    metadata_value,
                ),
            ],
            [
                markup_paragraph(
                    "<b>Dispatch Doc. No.</b>",
                    header_label,
                ),
                paragraph(
                    metadata["dispatch_doc_no"],
                    metadata_value,
                ),
            ],
            [
                markup_paragraph(
                    "<b>Delivery Note Date</b>",
                    header_label,
                ),
                paragraph(
                    date_text(
                        metadata["delivery_note_date"]
                    ),
                    metadata_value,
                ),
            ],
            [
                markup_paragraph(
                    "<b>Dispatched Through</b>",
                    header_label,
                ),
                paragraph(
                    metadata["dispatched_through"],
                    metadata_value,
                ),
            ],
            [
                markup_paragraph(
                    "<b>Destination</b>",
                    header_label,
                ),
                paragraph(
                    metadata["destination"],
                    metadata_value,
                ),
            ],
            [
                markup_paragraph(
                    "<b>Terms of Delivery</b>",
                    header_label,
                ),
                paragraph(
                    metadata["delivery_terms"],
                    metadata_value,
                ),
            ],
        ]

        metadata_table = Table(
            invoice_meta_rows,
            colWidths=[
                38 * mm,
                50 * mm,
            ],
        )

        metadata_table.setStyle(
            TableStyle(
                [
                    (
                        "GRID",
                        (0, 0),
                        (-1, -1),
                        0.5,
                        colors.black,
                    ),
                    (
                        "VALIGN",
                        (0, 0),
                        (-1, -1),
                        "TOP",
                    ),
                    (
                        "LEFTPADDING",
                        (0, 0),
                        (-1, -1),
                        2,
                    ),
                    (
                        "RIGHTPADDING",
                        (0, 0),
                        (-1, -1),
                        2,
                    ),
                    (
                        "TOPPADDING",
                        (0, 0),
                        (-1, -1),
                        2,
                    ),
                    (
                        "BOTTOMPADDING",
                        (0, 0),
                        (-1, -1),
                        2,
                    ),
                ]
            )
        )

        top_header = Table(
            [
                [
                    seller_block,
                    metadata_table,
                ]
            ],
            colWidths=[
                content_width - 88 * mm,
                88 * mm,
            ],
        )

        top_header.setStyle(
            TableStyle(
                [
                    (
                        "BOX",
                        (0, 0),
                        (-1, -1),
                        0.5,
                        colors.black,
                    ),
                    (
                        "INNERGRID",
                        (0, 0),
                        (-1, -1),
                        0.5,
                        colors.black,
                    ),
                    (
                        "VALIGN",
                        (0, 0),
                        (-1, -1),
                        "TOP",
                    ),
                    (
                        "LEFTPADDING",
                        (0, 0),
                        (-1, -1),
                        3,
                    ),
                    (
                        "RIGHTPADDING",
                        (0, 0),
                        (-1, -1),
                        3,
                    ),
                    (
                        "TOPPADDING",
                        (0, 0),
                        (-1, -1),
                        3,
                    ),
                    (
                        "BOTTOMPADDING",
                        (0, 0),
                        (-1, -1),
                        3,
                    ),
                ]
            )
        )

        story.append(top_header)

        # =================================================
        # PARTY BLOCKS
        # =================================================

        def party_block(
            title_text,
            party,
        ):
            address = "<br/>".join(
                escape(line)
                for line in multiline_address(
                    party["address"]
                )
            )

            text = (
                f"<b>{escape(title_text)}</b><br/>"
                f"<b>{escape(party['name'])}</b>"
            )

            if address:
                text += f"<br/>{address}"

            if party["gstin"]:
                text += (
                    "<br/>GSTIN/UIN : "
                    f"{escape(party['gstin'])}"
                )

            if party["state"]:
                text += (
                    "<br/>State Name : "
                    f"{escape(party['state'])}"
                )

                if party["state_code"]:
                    text += (
                        ", Code : "
                        f"{escape(party['state_code'])}"
                    )

            return markup_paragraph(
                text,
                normal,
            )

        consignee = party_block(
            "Consignee (Ship to)",
            data["consignee"],
        )

        buyer = party_block(
            "Buyer (Bill to)",
            data["buyer"],
        )

        party_table = Table(
            [
                [
                    consignee,
                    buyer,
                ]
            ],
            colWidths=[
                content_width / 2,
                content_width / 2,
            ],
        )

        party_table.setStyle(
            TableStyle(
                [
                    (
                        "BOX",
                        (0, 0),
                        (-1, -1),
                        0.5,
                        colors.black,
                    ),
                    (
                        "INNERGRID",
                        (0, 0),
                        (-1, -1),
                        0.5,
                        colors.black,
                    ),
                    (
                        "VALIGN",
                        (0, 0),
                        (-1, -1),
                        "TOP",
                    ),
                    (
                        "LEFTPADDING",
                        (0, 0),
                        (-1, -1),
                        3,
                    ),
                    (
                        "RIGHTPADDING",
                        (0, 0),
                        (-1, -1),
                        3,
                    ),
                    (
                        "TOPPADDING",
                        (0, 0),
                        (-1, -1),
                        3,
                    ),
                    (
                        "BOTTOMPADDING",
                        (0, 0),
                        (-1, -1),
                        3,
                    ),
                ]
            )
        )

        story.append(party_table)

        story.append(
            Spacer(
                1,
                2 * mm,
            )
        )

        # =================================================
        # ITEM TABLE
        # =================================================

        item_rows = [
            [
                markup_paragraph(
                    "<b>Sl<br/>No.</b>",
                    center,
                ),
                markup_paragraph(
                    "<b>Description of Goods</b>",
                    center,
                ),
                markup_paragraph(
                    "<b>HSN/SAC</b>",
                    center,
                ),
                markup_paragraph(
                    "<b>Quantity</b>",
                    center,
                ),
                markup_paragraph(
                    "<b>Rate</b>",
                    center,
                ),
                markup_paragraph(
                    "<b>per</b>",
                    center,
                ),
                markup_paragraph(
                    "<b>Disc. %</b>",
                    center,
                ),
                markup_paragraph(
                    "<b>Amount</b>",
                    center,
                ),
            ]
        ]

        for index, item in enumerate(
            data["items"],
            start=1,
        ):
            item_code = escape(
                str(item["item_code"] or "")
            )

            description = f"<b>{item_code}</b>"

            if item["description"]:
                description += (
                    "<br/><i>"
                    + escape(
                        str(item["description"])
                    ).replace(
                        "\n",
                        "<br/>",
                    )
                    + "</i>"
                )

            item_rows.append(
                [
                    paragraph(
                        str(index),
                        center,
                    ),

                    markup_paragraph(
                        description,
                        normal,
                    ),

                    paragraph(
                        item["hsn"],
                        center,
                    ),

                    markup_paragraph(
                        (
                            f"<b>"
                            f"{item['quantity']:g} "
                            f"{escape(str(item['um']))}"
                            f"</b>"
                        ),
                        center,
                    ),

                    paragraph(
                        money_text(item["rate"]),
                        right,
                    ),

                    paragraph(
                        item["um"],
                        center,
                    ),

                    paragraph(
                        money_text(item["discount"]),
                        center,
                    ),

                    markup_paragraph(
                        (
                            f"<b>"
                            f"{money_text(item['amount'])}"
                            f"</b>"
                        ),
                        right,
                    ),
                ]
            )

        # -------------------------------------------------
        # Freight
        # -------------------------------------------------

        if data["freight"]:
            item_rows.append(
                [
                    "",
                    markup_paragraph(
                        "<b>Freight Charges</b>",
                        right,
                    ),
                    "",
                    "",
                    "",
                    "",
                    "",
                    markup_paragraph(
                        (
                            f"<b>"
                            f"{money_text(data['freight'])}"
                            f"</b>"
                        ),
                        right,
                    ),
                ]
            )

        # -------------------------------------------------
        # Packing
        # -------------------------------------------------

        if data["packing"]:
            item_rows.append(
                [
                    "",
                    markup_paragraph(
                        "<b>Packing Charges</b>",
                        right,
                    ),
                    "",
                    "",
                    "",
                    "",
                    "",
                    markup_paragraph(
                        (
                            f"<b>"
                            f"{money_text(data['packing'])}"
                            f"</b>"
                        ),
                        right,
                    ),
                ]
            )

        # -------------------------------------------------
        # Total row
        # -------------------------------------------------

        total_quantity = sum(
            (
                item["quantity"]
                for item in data["items"]
            ),
            Decimal("0"),
        )

        item_rows.append(
            [
                "",
                markup_paragraph(
                    "<b>Total</b>",
                    right,
                ),
                "",
                markup_paragraph(
                    (
                        f"<b>"
                        f"{total_quantity:g} Nos."
                        f"</b>"
                    ),
                    center,
                ),
                "",
                "",
                "",
                markup_paragraph(
                    (
                        f"<b>₹ "
                        f"{money_text(data['grand_total'])}"
                        f"</b>"
                    ),
                    right,
                ),
            ]
        )

        item_table = Table(
            item_rows,
            colWidths=[
                8 * mm,
                59 * mm,
                17 * mm,
                20 * mm,
                21 * mm,
                12 * mm,
                15 * mm,
                26 * mm,
            ],
            repeatRows=1,
            splitByRow=1,
        )

        item_table.setStyle(
            TableStyle(
                [
                    (
                        "GRID",
                        (0, 0),
                        (-1, -1),
                        0.5,
                        colors.black,
                    ),
                    (
                        "VALIGN",
                        (0, 0),
                        (-1, -1),
                        "TOP",
                    ),
                    (
                        "LEFTPADDING",
                        (0, 0),
                        (-1, -1),
                        2,
                    ),
                    (
                        "RIGHTPADDING",
                        (0, 0),
                        (-1, -1),
                        2,
                    ),
                    (
                        "TOPPADDING",
                        (0, 0),
                        (-1, -1),
                        3,
                    ),
                    (
                        "BOTTOMPADDING",
                        (0, 0),
                        (-1, -1),
                        3,
                    ),
                ]
            )
        )

        story.append(item_table)

        # =================================================
        # AMOUNT CHARGEABLE
        # =================================================

        story.append(
            Spacer(
                1,
                1 * mm,
            )
        )

        amount_words = amount_in_words(
            data["grand_total"]
        )

        amount_table = Table(
            [
                [
                    markup_paragraph(
                        "<b>Amount Chargeable "
                        "(in words)</b>",
                        normal,
                    ),
                    markup_paragraph(
                        "<b>E. &amp; O.E</b>",
                        right,
                    ),
                ],
                [
                    markup_paragraph(
                        (
                            f"<b>"
                            f"{escape(amount_words)}"
                            f"</b>"
                        ),
                        normal,
                    ),
                    "",
                ],
            ],
            colWidths=[
                content_width - 35 * mm,
                35 * mm,
            ],
        )

        amount_table.setStyle(
            TableStyle(
                [
                    (
                        "GRID",
                        (0, 0),
                        (-1, -1),
                        0.5,
                        colors.black,
                    ),
                    (
                        "VALIGN",
                        (0, 0),
                        (-1, -1),
                        "MIDDLE",
                    ),
                    (
                        "LEFTPADDING",
                        (0, 0),
                        (-1, -1),
                        3,
                    ),
                    (
                        "RIGHTPADDING",
                        (0, 0),
                        (-1, -1),
                        3,
                    ),
                    (
                        "TOPPADDING",
                        (0, 0),
                        (-1, -1),
                        3,
                    ),
                    (
                        "BOTTOMPADDING",
                        (0, 0),
                        (-1, -1),
                        3,
                    ),
                ]
            )
        )

        story.append(amount_table)

        # =================================================
        # TAX TABLE
        # =================================================

        story.append(
            Spacer(
                1,
                2 * mm,
            )
        )

        if data["is_intrastate"]:

            tax_rows = [
                [
                    markup_paragraph(
                        "<b>HSN/SAC</b>",
                        center,
                    ),
                    markup_paragraph(
                        "<b>Taxable Value</b>",
                        center,
                    ),
                    markup_paragraph(
                        "<b>CGST Rate</b>",
                        center,
                    ),
                    markup_paragraph(
                        "<b>CGST Amount</b>",
                        center,
                    ),
                    markup_paragraph(
                        "<b>SGST Rate</b>",
                        center,
                    ),
                    markup_paragraph(
                        "<b>SGST Amount</b>",
                        center,
                    ),
                    markup_paragraph(
                        "<b>Total Tax</b>",
                        center,
                    ),
                ],
                [
                    paragraph(
                        data["items"][0]["hsn"]
                        if data["items"]
                        else "",
                        center,
                    ),
                    paragraph(
                        money_text(
                            data["taxable_value"]
                        ),
                        right,
                    ),
                    paragraph(
                        (
                            f"{money_text(data['cgst_rate'])}%"
                        ),
                        center,
                    ),
                    paragraph(
                        money_text(data["cgst"]),
                        right,
                    ),
                    paragraph(
                        (
                            f"{money_text(data['sgst_rate'])}%"
                        ),
                        center,
                    ),
                    paragraph(
                        money_text(data["sgst"]),
                        right,
                    ),
                    paragraph(
                        money_text(data["tax_amount"]),
                        right,
                    ),
                ],
                [
                    markup_paragraph(
                        "<b>Total</b>",
                        right,
                    ),
                    markup_paragraph(
                        (
                            f"<b>"
                            f"{money_text(data['taxable_value'])}"
                            f"</b>"
                        ),
                        right,
                    ),
                    "",
                    markup_paragraph(
                        (
                            f"<b>"
                            f"{money_text(data['cgst'])}"
                            f"</b>"
                        ),
                        right,
                    ),
                    "",
                    markup_paragraph(
                        (
                            f"<b>"
                            f"{money_text(data['sgst'])}"
                            f"</b>"
                        ),
                        right,
                    ),
                    markup_paragraph(
                        (
                            f"<b>"
                            f"{money_text(data['tax_amount'])}"
                            f"</b>"
                        ),
                        right,
                    ),
                ],
            ]

            tax_col_widths = [
                24 * mm,
                30 * mm,
                21 * mm,
                27 * mm,
                21 * mm,
                27 * mm,
                32 * mm,
            ]

        else:

            tax_rows = [
                [
                    markup_paragraph(
                        "<b>HSN/SAC</b>",
                        center,
                    ),
                    markup_paragraph(
                        "<b>Taxable Value</b>",
                        center,
                    ),
                    markup_paragraph(
                        "<b>IGST Rate</b>",
                        center,
                    ),
                    markup_paragraph(
                        "<b>IGST Amount</b>",
                        center,
                    ),
                    markup_paragraph(
                        "<b>Total Tax</b>",
                        center,
                    ),
                ],
                [
                    paragraph(
                        data["items"][0]["hsn"]
                        if data["items"]
                        else "",
                        center,
                    ),
                    paragraph(
                        money_text(
                            data["taxable_value"]
                        ),
                        right,
                    ),
                    paragraph(
                        (
                            f"{money_text(data['igst_rate'])}%"
                        ),
                        center,
                    ),
                    paragraph(
                        money_text(data["igst"]),
                        right,
                    ),
                    paragraph(
                        money_text(data["tax_amount"]),
                        right,
                    ),
                ],
                [
                    markup_paragraph(
                        "<b>Total</b>",
                        right,
                    ),
                    markup_paragraph(
                        (
                            f"<b>"
                            f"{money_text(data['taxable_value'])}"
                            f"</b>"
                        ),
                        right,
                    ),
                    "",
                    markup_paragraph(
                        (
                            f"<b>"
                            f"{money_text(data['igst'])}"
                            f"</b>"
                        ),
                        right,
                    ),
                    markup_paragraph(
                        (
                            f"<b>"
                            f"{money_text(data['tax_amount'])}"
                            f"</b>"
                        ),
                        right,
                    ),
                ],
            ]

            tax_col_widths = [
                32 * mm,
                42 * mm,
                30 * mm,
                40 * mm,
                35 * mm,
            ]

        tax_table = Table(
            tax_rows,
            colWidths=tax_col_widths,
            repeatRows=1,
            splitByRow=1,
        )

        tax_table.setStyle(
            TableStyle(
                [
                    (
                        "GRID",
                        (0, 0),
                        (-1, -1),
                        0.5,
                        colors.black,
                    ),
                    (
                        "VALIGN",
                        (0, 0),
                        (-1, -1),
                        "MIDDLE",
                    ),
                    (
                        "ALIGN",
                        (1, 1),
                        (-1, -1),
                        "RIGHT",
                    ),
                    (
                        "LEFTPADDING",
                        (0, 0),
                        (-1, -1),
                        3,
                    ),
                    (
                        "RIGHTPADDING",
                        (0, 0),
                        (-1, -1),
                        3,
                    ),
                    (
                        "TOPPADDING",
                        (0, 0),
                        (-1, -1),
                        3,
                    ),
                    (
                        "BOTTOMPADDING",
                        (0, 0),
                        (-1, -1),
                        3,
                    ),
                ]
            )
        )

        story.append(tax_table)

        # =================================================
        # TAX AMOUNT IN WORDS
        # =================================================

        story.append(
            Spacer(
                1,
                3 * mm,
            )
        )

        story.append(
            markup_paragraph(
                (
                    "<b>Tax Amount (in words):</b> "
                    f"{escape(amount_in_words(data['tax_amount']))}"
                ),
                normal,
            )
        )

        # =================================================
        # PAN
        # =================================================

        story.append(
            Spacer(
                1,
                3 * mm,
            )
        )

        story.append(
            markup_paragraph(
                (
                    "<b>Company's PAN :</b> "
                    f"{escape(data['seller']['pan'])}"
                ),
                normal,
            )
        )

        # =================================================
        # DECLARATION + SIGNATURE
        # =================================================

        story.append(
            Spacer(
                1,
                4 * mm,
            )
        )

        declaration = Table(
            [
                [
                    markup_paragraph(
                        "<b>Declaration</b><br/>"
                        "We declare that this invoice shows "
                        "the actual price of the goods described "
                        "and that all particulars are true and "
                        "correct.",
                        normal,
                    ),
                    markup_paragraph(
                        (
                            f"<b>for "
                            f"{escape(data['seller']['name'])}"
                            f"</b><br/><br/><br/>"
                            "Authorised Signatory"
                        ),
                        right,
                    ),
                ]
            ],
            colWidths=[
                content_width - 80 * mm,
                80 * mm,
            ],
        )

        declaration.setStyle(
            TableStyle(
                [
                    (
                        "BOX",
                        (0, 0),
                        (-1, -1),
                        0.5,
                        colors.black,
                    ),
                    (
                        "VALIGN",
                        (0, 0),
                        (-1, -1),
                        "TOP",
                    ),
                    (
                        "LEFTPADDING",
                        (0, 0),
                        (-1, -1),
                        3,
                    ),
                    (
                        "RIGHTPADDING",
                        (0, 0),
                        (-1, -1),
                        3,
                    ),
                    (
                        "TOPPADDING",
                        (0, 0),
                        (-1, -1),
                        3,
                    ),
                    (
                        "BOTTOMPADDING",
                        (0, 0),
                        (-1, -1),
                        3,
                    ),
                ]
            )
        )

        story.append(declaration)

        # =================================================
        # BUILD
        # =================================================

        doc.build(story)