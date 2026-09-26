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
    Quotation,
)


# =========================================================
# Configuration
# =========================================================

INVOICE_STORAGE_DIR = Path("storage/invoices")
ORDER_STORAGE_DIR = Path("storage/orders")
QUOTATION_STORAGE_DIR = Path("storage/quotations")

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

def money(value: Decimal | int | float | str | None,) -> Decimal:
    if value is None or value == "":
        value = 0

    return Decimal(str(value)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP,)

def rate_text(value) -> str:
    d = money(value).normalize()
    if d == d.to_integral():
        return str(int(d))
    return str(d)

def decimal_value(value: Decimal | int | float | str | None,) -> Decimal:
    if value is None or value == "":
        return Decimal("0")

    return Decimal(str(value))


def money_text(value: Decimal | int | float | str | None,) -> str:
    return f"{money(value):,.2f}"


def safe_filename(value: str) -> str:
    cleaned = re.sub(r"[^A-Za-z0-9_.-]+", "_", str(value),)
    return cleaned.strip("._") or "document"


def date_text(value) -> str:
    if not value:
        return ""

    if hasattr(value, "strftime"):
        return value.strftime("%d-%b-%y")

    return str(value)


def amount_in_words(value: Decimal | int | float | str | None,) -> str:
    value = money(value)

    rupees = int(value)
    paise = int((value - Decimal(rupees)) * 100)

    text = num2words(rupees, lang="en_IN",).title()

    result = f"Indian Rupees {text}"

    if paise:
        result += (f" and {num2words(paise, lang='en_IN').title()} Paise")

    return result + " Only"


def paragraph(text, style):
    text = "" if text is None else str(text)
    text = escape(text)

    return Paragraph(text.replace("\n", "<br/>"), style,)


def markup_paragraph(text, style):
    text = "" if text is None else str(text)

    return Paragraph(text.replace("\n", "<br/>"), style,)


def obj_value(obj, *names, default="",):
    if obj is None:
        return default

    for name in names:
        if not hasattr(obj, name):
            continue

        value = getattr(obj, name)

        if value is not None and str(value).strip():
            return value

    return default


def first_non_empty(*values, default="",):
    for value in values:
        if value is not None and str(value).strip():
            return value

    return default


def normalize_state(value) -> str:
    return str(value or "").strip().lower()


def multiline_address(value) -> list[str]:
    if value is None:
        return []

    if isinstance(value, (list, tuple)):
        return [str(x).strip() for x in value if str(x).strip()]

    return [line.strip() for line in str(value).splitlines() if line.strip()]


def yes_no(value) -> str:
    return "YES" if bool(value) else "NO"


# =========================================================
# Service
# =========================================================

class BillingInvoiceService:

    # =====================================================
    # Public API - Tax Invoice
    # =====================================================

    @classmethod
    def generate_invoice_pdf(cls, bill_num: str, document_title: str = "Tax Invoice",) -> Path:
        INVOICE_STORAGE_DIR.mkdir(parents=True, exist_ok=True,)

        output_path = (INVOICE_STORAGE_DIR / f"{safe_filename(bill_num)}.pdf")

        with SessionLocal() as session:
            bill = session.scalar(select(BillHeader).where(BillHeader.bill_num == bill_num))

            if not bill:
                raise ValueError(f"Bill '{bill_num}' was not found.")

            order = None
            bill_order_id = obj_value(bill, "order_id", default=None,)

            if bill_order_id is not None:
                order = session.scalar(select(OrderHeader).where(OrderHeader.order_id == bill_order_id))

            bill_items = list(
                session.scalars(select(BillItem).where(BillItem.bill_num == bill_num).order_by(BillItem.bill_item_id))
            )

            if not bill_items:
                raise ValueError(f"Bill '{bill_num}' has no bill items.")

            order_items = {}
            if order:
                rows = session.scalars(select(OrderItem).where(OrderItem.order_id == order.order_id))
                order_items = {item.order_item_id: item for item in rows}

            invoice_data = cls._build_invoice_data(bill=bill, order=order, bill_items=bill_items, order_items=order_items,)

        cls._render_pdf(invoice_data, output_path, document_title=document_title,)

        return output_path

    @classmethod
    def get_or_generate_invoice_pdf(cls, bill_num: str, document_title: str = "Tax Invoice",) -> Path:
        INVOICE_STORAGE_DIR.mkdir(parents=True, exist_ok=True,)

        output_path = INVOICE_STORAGE_DIR / f"{safe_filename(bill_num)}.pdf"

        if output_path.exists():
            print(f"Returning existing invoice PDF: {output_path}")
            return output_path

        print(f"Generating new invoice PDF: {output_path}")

        return cls.generate_invoice_pdf(bill_num, document_title=document_title,)

    # =====================================================
    # Public API - Ordered Sales
    # =====================================================

    @classmethod
    def get_or_generate_order_pdf(cls, order_acceptance_id: str, document_title: str = "Ordered Sales",) -> Path:
        if not order_acceptance_id:
            raise ValueError("order_acceptance_id is required.")

        ORDER_STORAGE_DIR.mkdir(parents=True, exist_ok=True,)

        output_path = ORDER_STORAGE_DIR / f"{safe_filename(order_acceptance_id)}.pdf"

        if output_path.exists():
            print(f"Returning existing {document_title} PDF: {output_path}")
            return output_path

        print(f"Generating new {document_title} PDF: {output_path}")

        return cls.generate_order_pdf(order_acceptance_id, document_title=document_title,)

    @classmethod
    def generate_order_pdf(cls, order_acceptance_id: str, document_title: str = "Ordered Sales",) -> Path:
        if not order_acceptance_id:
            raise ValueError("order_acceptance_id is required.")

        ORDER_STORAGE_DIR.mkdir(parents=True, exist_ok=True,)

        output_path = ORDER_STORAGE_DIR / f"{safe_filename(order_acceptance_id)}.pdf"
        with SessionLocal() as session:
            order = session.scalars(select(OrderHeader)
                .where(OrderHeader.order_acceptance_id == order_acceptance_id)
                .limit(1)
            ).first()

            if not order:
                raise ValueError("Order with order_acceptance_id " f"'{order_acceptance_id}' was not found.")

            order_items = list(
                session.scalars(
                    select(OrderItem)
                    .where(OrderItem.order_id == order.order_id)
                    .order_by(OrderItem.order_item_id)
                )
            )

            if not order_items:
                raise ValueError("Order with order_acceptance_id " f"'{order_acceptance_id}' has no order items.")

            data = cls._build_order_data(order=order, order_items=order_items,)

        cls._render_pdf(data, output_path, document_title=document_title,)

        return output_path

    # =====================================================
    # Public API - Quotation -> Order Booking PDF
    # =====================================================

    @classmethod
    def get_or_generate_quotation_order_pdf(cls, quote_number: str, document_title: str = "Order Booking",) -> Path:
        quote_number = str(quote_number or "").strip()

        if not quote_number:
            raise ValueError("quote_number is required.")

        QUOTATION_STORAGE_DIR.mkdir(parents=True, exist_ok=True,)

        output_path = QUOTATION_STORAGE_DIR / (f"{safe_filename(quote_number)}_order_booking.pdf")

        if output_path.exists():
            print(f"Returning existing quotation order booking PDF: {output_path}")
            return output_path

        print(f"Generating quotation order booking PDF: {output_path}")

        return cls.generate_quotation_order_pdf(quote_number=quote_number, document_title=document_title,)
    
    @classmethod
    def generate_quotation_order_pdf(cls, quote_number: str, document_title: str = "Order Booking",) -> Path:
        quote_number = str(quote_number or "").strip()

        if not quote_number:
            raise ValueError("quote_number is required.")

        QUOTATION_STORAGE_DIR.mkdir(parents=True, exist_ok=True,)

        output_path = QUOTATION_STORAGE_DIR / (f"{safe_filename(quote_number)}_order_booking.pdf")

        with SessionLocal() as session:

            quotation = session.scalar(select(Quotation).where(Quotation.quote_number == quote_number))

            if not quotation:
                raise ValueError(f"Quotation '{quote_number}' was not found.")

            data = cls._build_quotation_order_data(quotation)

        cls._render_quotation_order_pdf(data=data, output_path=output_path, document_title=document_title,)

        return output_path

    # =====================================================
    # Tax helper
    # =====================================================

    @classmethod
    def _calculate_tax(cls, taxable_value: Decimal, tax_rate: Decimal, buyer_state,):
        taxable_value = money(taxable_value)
        tax_rate = money(tax_rate)

        tax_amount = money(taxable_value * tax_rate / Decimal("100"))

        seller_state = normalize_state(SELLER["state"])
        normalized_buyer_state = normalize_state(buyer_state)

        is_intrastate = bool(seller_state and normalized_buyer_state and seller_state == normalized_buyer_state)

        if is_intrastate:
            cgst = money(tax_amount / Decimal("2"))
            sgst = money(tax_amount - cgst)
            igst = Decimal("0.00")

            cgst_rate = money(tax_rate / Decimal("2"))
            sgst_rate = money(tax_rate / Decimal("2"))
            igst_rate = Decimal("0.00")
        else:
            cgst = Decimal("0.00")
            sgst = Decimal("0.00")
            igst = tax_amount

            cgst_rate = Decimal("0.00")
            sgst_rate = Decimal("0.00")
            igst_rate = tax_rate

        grand_total = money(taxable_value + tax_amount)

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
    def _build_invoice_data(cls, bill, order, bill_items, order_items,):
        items = []
        goods_total = Decimal("0.00")

        for bill_item in bill_items:
            order_item = order_items.get(bill_item.order_item_id)

            item_code = first_non_empty(
                obj_value(bill_item, "item_code"),
                obj_value(order_item, "item_code"),
                default="",
            )

            quantity = decimal_value(
                obj_value(bill_item, "quantity_shipped", "quantity", default=0,)
            )

            rate_value = first_non_empty(
                obj_value(bill_item, "rate", default=None),
                obj_value(order_item, "rate", default=None),
                default=0,
            )
            rate = money(rate_value)

            discount_value = first_non_empty(
                obj_value(bill_item, "discount", "discount_percent", default=None,),
                obj_value(order_item, "discount", "discount_percent", default=None,),
                default=0,
            )
            discount = money(discount_value)

            amount_value = first_non_empty(
                obj_value(bill_item, "amount", default=None),
                default=None,
            )

            if amount_value is None:
                gross_amount = quantity * rate
                discount_amount = (gross_amount * discount / Decimal("100"))
                amount = money(gross_amount - discount_amount)
            else:
                amount = money(amount_value)

            goods_total += amount

            description = first_non_empty(
                obj_value(order_item, "additional_spec_text"),
                obj_value(bill_item, "additional_spec_text"),
                default="",
            )

            hsn = first_non_empty(
                obj_value(bill_item, "hsn_code"),
                obj_value(order_item, "hsn_code"),
                default="",
            )

            um = first_non_empty(
                obj_value(order_item, "um"),
                obj_value(bill_item, "um"),
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

        packing = money(obj_value(order, "packing_charges", default=0))
        freight = money(obj_value(order, "freight_charges", default=0))

        taxable_value = money(goods_total + packing + freight)

        tax_rate = money(obj_value(order, "tax_rate", default=18))

        buyer_name = first_non_empty(
            obj_value(order, "billing_name"),
            obj_value(order, "buyer_name"),
            obj_value(bill, "buyer_name"),
            default="",
        )

        buyer_address = first_non_empty(
            obj_value(order, "billing_address"),
            obj_value(order, "buyer_address"),
            obj_value(bill, "buyer_address"),
            default="",
        )

        buyer_gstin = first_non_empty(
            obj_value(order, "buyer_gstin"),
            obj_value(order, "billing_gstin"),
            obj_value(bill, "buyer_gstin"),
            default="",
        )

        buyer_state = first_non_empty(
            obj_value(order, "state_name"),
            obj_value(bill, "indian_state"),
            default="",
        )

        buyer_state_code = first_non_empty(
            obj_value(order, "state_code"),
            obj_value(bill, "state_code"),
            default="",
        )

        consignee_name = first_non_empty(
            obj_value(order, "shipping_name"),
            obj_value(order, "consignee_name"),
            buyer_name,
            default="",
        )

        consignee_address = first_non_empty(
            obj_value(order, "shipping_address"),
            obj_value(order, "consignee_address"),
            buyer_address,
            default="",
        )

        consignee_gstin = first_non_empty(
            obj_value(order, "shipping_gstin"),
            obj_value(order, "consignee_gstin"),
            buyer_gstin,
            default="",
        )

        consignee_state = first_non_empty(
            obj_value(order, "shipping_state"),
            obj_value(order, "consignee_state"),
            buyer_state,
            default="",
        )

        consignee_state_code = first_non_empty(
            obj_value(order, "shipping_state_code"),
            obj_value(order, "consignee_state_code"),
            buyer_state_code,
            default="",
        )

        tax_data = cls._calculate_tax(taxable_value=taxable_value, tax_rate=tax_rate, buyer_state=buyer_state,)

        invoice_metadata = {
            "invoice_no": first_non_empty(
                obj_value(bill, "bill_num"),
                default="",
            ),
            "invoice_date": obj_value(bill, "bill_date", default=None,),
            "delivery_note": first_non_empty(
                obj_value(bill, "delivery_note"),
                obj_value(order, "delivery_note"),
                default="",
            ),
            "payment_terms": first_non_empty(
                obj_value(order, "payment_terms"),
                obj_value(bill, "payment_terms"),
                default="",
            ),
            "reference_no": first_non_empty(
                obj_value(order, "order_acceptance_id"),
                obj_value(order, "reference_no"),
                default="",
            ),
            "reference_date": first_non_empty(
                obj_value(order, "order_acceptance_date"),
                obj_value(order, "reference_date"),
                default=None,
            ),
            "other_references": first_non_empty(
                obj_value(order, "other_references"),
                obj_value(bill, "other_references"),
                default="",
            ),
            "buyers_order_no": first_non_empty(
                obj_value(order, "purchase_order_number"),
                obj_value(order, "buyers_order_no"),
                default="",
            ),
            "buyers_order_date": first_non_empty(
                obj_value(order, "purchase_order_date"),
                obj_value(order, "buyers_order_date"),
                default=None,
            ),
            "dispatch_doc_no": first_non_empty(
                obj_value(order, "dispatch_doc_no"),
                obj_value(order, "dispatch_document_no"),
                obj_value(bill, "dispatch_doc_no"),
                default="",
            ),
            "delivery_note_date": first_non_empty(
                obj_value(order, "delivery_note_date"),
                obj_value(bill, "delivery_note_date"),
                default=None,
            ),
            "dispatched_through": first_non_empty(
                obj_value(order, "dispatched_through"),
                obj_value(order, "transport_mode"),
                default="",
            ),
            "destination": first_non_empty(
                obj_value(order, "destination"),
                consignee_state,
                buyer_state,
                default="",
            ),
            "delivery_terms": first_non_empty(
                obj_value(order, "delivery_terms"),
                obj_value(order, "terms_of_delivery"),
                default="",
            ),
            "eway_bill_no": first_non_empty(
               obj_value(bill, "eway_bill_no", "e_way_bill_no", default=None),
               obj_value(order, "eway_bill_no", "e_way_bill_no", default=None),
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
                    obj_value(order, "buyer_pan"),
                    obj_value(bill, "buyer_pan"),
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
                "order_id": obj_value(order, "order_id", default=None,),
                "order_acceptance_id": obj_value(order, "order_acceptance_id", default="",),
                "order_acceptance_date": obj_value(order, "order_acceptance_date", default=None,),
                "purchase_order_number": obj_value(order, "purchase_order_number", default="",),
                "purchase_order_date": obj_value(order, "purchase_order_date", default=None,),
                "payment_terms": obj_value(order, "payment_terms", default="",),
                "dispatched_through": obj_value(order, "dispatched_through", default="",),
                "destination": obj_value(order, "destination", default="",),
                "delivery_terms": obj_value(order, "delivery_terms", default="",),

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
    def _build_order_data(cls, order, order_items,):
        items = []
        goods_total = Decimal("0.00")

        for order_item in order_items:
            item_code = first_non_empty(obj_value(order_item, "item_code"), default="",)

            quantity = decimal_value(obj_value(order_item, "quantity", default=0))

            rate = money(obj_value(order_item, "rate", default=0))

            discount = money(first_non_empty(obj_value(order_item, "discount", "discount_percent", default=None,),default=0,))

            gross_amount = quantity * rate
            discount_amount = (gross_amount * discount / Decimal("100"))
            amount = money(gross_amount - discount_amount)

            goods_total += amount

            description = first_non_empty(obj_value(order_item, "additional_spec_text",),default="",)

            hsn = first_non_empty(obj_value(order_item, "hsn_code"), default="",)

            um = first_non_empty(obj_value(order_item, "um", "unit_measure",), default="Nos.",)

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

        packing = money(obj_value(order, "packing_charges", default=0))
        freight = money(obj_value(order, "freight_charges", default=0))

        taxable_value = money(goods_total + packing + freight)

        tax_rate = money(obj_value(order, "tax_rate", default=18))

        buyer_name = first_non_empty(
            obj_value(order, "billing_name"),
            obj_value(order, "buyer_name"),
            default="",
        )

        buyer_address = first_non_empty(
            obj_value(order, "billing_address"),
            obj_value(order, "buyer_address"),
            default="",
        )

        buyer_gstin = first_non_empty(
            obj_value(order, "buyer_gstin"),
            obj_value(order, "billing_gstin"),
            default="",
        )

        buyer_state = first_non_empty(
            obj_value(order, "state_name"),
            default="",
        )

        buyer_state_code = first_non_empty(
            obj_value(order, "state_code"),
            default="",
        )

        consignee_name = first_non_empty(
            obj_value(order, "shipping_name"),
            obj_value(order, "consignee_name"),
            buyer_name,
            default="",
        )

        consignee_address = first_non_empty(
            obj_value(order, "shipping_address"),
            obj_value(order, "consignee_address"),
            buyer_address,
            default="",
        )

        consignee_gstin = first_non_empty(
            obj_value(order, "shipping_gstin"),
            obj_value(order, "consignee_gstin"),
            buyer_gstin,
            default="",
        )

        consignee_state = first_non_empty(
            obj_value(order, "shipping_state"),
            obj_value(order, "consignee_state"),
            buyer_state,
            default="",
        )

        consignee_state_code = first_non_empty(
            obj_value(order, "shipping_state_code"),
            obj_value(order, "consignee_state_code"),
            buyer_state_code,
            default="",
        )

        tax_data = cls._calculate_tax(
            taxable_value=taxable_value,
            tax_rate=tax_rate,
            buyer_state=buyer_state,
        )

        oa_number = first_non_empty(obj_value(order, "order_acceptance_id"), default="",)

        if not oa_number:
            raise ValueError("Order cannot be rendered because order_acceptance_id is empty.")

        invoice_metadata = {
            "invoice_no": oa_number,
            "invoice_date": first_non_empty(
                obj_value(order, "order_date"),
                obj_value(order, "order_acceptance_date"),
                default=None,
            ),
            "delivery_note": obj_value(order, "delivery_note", default="",),
            "payment_terms": obj_value(order, "payment_terms", default="",),
            "reference_no": oa_number,
            "reference_date": obj_value(order, "order_acceptance_date", default=None,),
            "other_references": obj_value(order, "other_references", default="",),
            "buyers_order_no": obj_value(order, "purchase_order_number", default="",),
            "buyers_order_date": obj_value(order, "purchase_order_date", default=None,),
            "dispatch_doc_no": obj_value(order, "dispatch_doc_no", "dispatch_document_no", default="",),
            "delivery_note_date": obj_value(order, "delivery_note_date", default=None,),
            "dispatched_through": obj_value(order, "dispatched_through", "transport_mode", default="",),
            "destination": first_non_empty(obj_value(order, "destination"), consignee_state, buyer_state, default="",),
            "delivery_terms": obj_value(order, "delivery_terms", "terms_of_delivery", default="",),
            "eway_bill_no": obj_value(order, "eway_bill_no", "e_way_bill_no", default=""),

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
                "pan": obj_value(order, "buyer_pan", default="",),
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
                "order_id": obj_value(order, "order_id", default=None,),
                "order_acceptance_id": oa_number,
                "order_acceptance_date": obj_value(order, "order_acceptance_date", default=None,),
                "purchase_order_number": obj_value(order, "purchase_order_number", default="",),
                "purchase_order_date": obj_value(order, "purchase_order_date", default=None,),
                "payment_terms": obj_value(order, "payment_terms", default="",),
                "dispatched_through": obj_value(order, "dispatched_through", default="",),
                "destination": obj_value(order, "destination", default="",),
                "delivery_terms": obj_value(order, "delivery_terms", default="",),
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
    # Build quotation -> order booking model
    # =====================================================

    @classmethod
    def _build_quotation_order_data(cls, quotation,):
        if quotation is None:
            raise ValueError("Quotation record is required.")

        return {
            "seller": SELLER,
            "quote_number": quotation.quote_number,
            "enquiry_date": quotation.enquiry_date,
            "generated_at": quotation.generated_at,
            "status": quotation.status,
            "is_active": quotation.is_active,
            "converted_order_id": quotation.converted_order_id,
            "customer": {
                "company": quotation.client_company or "",
                "address": quotation.client_address_line1 or "",
                "city": quotation.client_city or "",
                "postal_code": quotation.client_postal_code or "",
                "email": quotation.client_email or "",
            },
            "buyer": {
                "name": quotation.buyer_name or "",
                "phone": quotation.buyer_phone_number or "",
            },
            "product": {
                "name": quotation.product_name or "",
            },
            "commercial": {
                "supply": quotation.supply or "",
                "installation": quotation.installation or "",
                "freight": quotation.freight or "",
            },
            "flags": {
                "is_dealer": bool(quotation.is_dealer),
                "is_special_model": bool(quotation.is_special_model),
            },
            "sales": {"name": quotation.sales_user_name or "", "email": quotation.sales_user_email or "",},
        }

    @classmethod
    def _find_fonts(cls):
        base_dir = Path(__file__).resolve().parent

        regular_candidates = ["DejaVuSans.ttf"]
        bold_candidates = ["DejaVuSans-Bold.ttf"]
        italic_candidates = ["DejaVuSans-Oblique.ttf", "DejaVuSans-Italic.ttf"]
        bold_italic_candidates = ["DejaVuSans-BoldOblique.ttf", "DejaVuSans-BoldItalic.ttf"]

        def find_font(candidates):
            for name in candidates:
                p = base_dir / name
                if p.exists():
                    return str(p)

            return None

        regular_font = find_font(regular_candidates)
        bold_font = find_font(bold_candidates)
        italic_font = find_font(italic_candidates)
        bold_italic_font = find_font(bold_italic_candidates)

        if not regular_font or not bold_font:
            raise RuntimeError(
                "A Unicode TTF font supporting the ₹ glyph is required "
                "to render ERP PDFs. Expected files: "
                "./services/DejaVuSans.ttf and "
                "./services/DejaVuSans-Bold.ttf"
                "./services/DejaVuSans-BoldOblique.ttf"
            )

        if not italic_font:
            print("Unable to load italic font")
            italic_font = bold_italic_font or regular_font

        if not bold_italic_font:
            print("Unable to load bold italic font")
            bold_italic_font = bold_font

        if "InvoiceDejaVu" not in pdfmetrics.getRegisteredFontNames():
            pdfmetrics.registerFont(TTFont("InvoiceDejaVu", regular_font))

        if "InvoiceDejaVu-Bold" not in pdfmetrics.getRegisteredFontNames():
            pdfmetrics.registerFont(TTFont("InvoiceDejaVu-Bold", bold_font))

        if "InvoiceDejaVu-BoldOblique" not in pdfmetrics.getRegisteredFontNames():
            pdfmetrics.registerFont(TTFont("InvoiceDejaVu-BoldOblique", bold_italic_font))

        if "InvoiceDejaVu-Italic" not in pdfmetrics.getRegisteredFontNames():
            pdfmetrics.registerFont(TTFont("InvoiceDejaVu-Italic", italic_font))
        pdfmetrics.registerFontFamily(
            "InvoiceDejaVu",
            normal="InvoiceDejaVu",
            bold="InvoiceDejaVu-Bold",
            italic="InvoiceDejaVu-Italic",
            boldItalic="InvoiceDejaVu-BoldOblique"
            )

    @classmethod
    def _common_styles(cls):
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

        italic = ParagraphStyle(
            "InvoiceItalic",
            parent=normal,
            fontName="InvoiceDejaVu-Italic",
        )

        bold_italic = ParagraphStyle(
            "InvoiceBoldOblique",
            parent=normal,
            fontName="InvoiceDejaVu-BoldOblique",
        )

        title = ParagraphStyle(
            "InvoiceTitle",
            parent=normal,
            fontName="InvoiceDejaVu-Bold",
            fontSize=14,
            leading=16,
            alignment=TA_CENTER,
        )

        section_title = ParagraphStyle(
            "InvoiceSectionTitle",
            parent=normal,
            fontName="InvoiceDejaVu-Bold",
            fontSize=9,
            leading=11,
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

        return {
            "normal": normal,
            "small": small,
            "tiny": tiny,
            "bold": bold,
            "title": title,
            "italic": italic,
            "bold_italic": bold_italic,
            "section_title": section_title,
            "right": right,
            "center": center,
            "header_label": header_label,
            "metadata_value": metadata_value,
            "metadata_value_bold": metadata_value_bold,
        }

    @classmethod
    def _page_geometry(cls):
        page_width, page_height = A4

        left_margin = 10 * mm
        right_margin = 10 * mm
        top_margin = 7 * mm
        bottom_margin = 14 * mm
        footer_height = 8 * mm

        content_width = page_width - left_margin - right_margin

        return (
            page_width,
            page_height,
            left_margin,
            right_margin,
            top_margin,
            bottom_margin,
            footer_height,
            content_width,
        )

    @classmethod
    def _make_frame(cls, left_margin, bottom_margin, footer_height, page_width, page_height, top_margin, content_width,):
        return Frame(
            left_margin,
            bottom_margin + footer_height,
            content_width,
            page_height - top_margin - bottom_margin - footer_height,
            id="erp_body",
            leftPadding=0,
            rightPadding=0,
            topPadding=0,
            bottomPadding=0,
        )

    @classmethod
    def _draw_footer(cls, canvas, doc, page_width, right_margin,):
        canvas.saveState()

        footer_y = 7 * mm

        canvas.setFont("InvoiceDejaVu", 7,)

        canvas.drawCentredString(page_width / 2, footer_y, "SUBJECT TO MUMBAI JURISDICTION",)

        canvas.drawRightString(page_width - right_margin, footer_y, f"Page {doc.page}",)

        canvas.restoreState()

    @classmethod
    def _table_style(cls, *, valign="TOP", padding=3, grid=True,):
        commands = []

        if grid:
            commands.append(("GRID", (0, 0), (-1, -1), 0.5, colors.black,))

        commands.extend(
            [
                ("VALIGN", (0, 0), (-1, -1), valign,),
                ("LEFTPADDING", (0, 0), (-1, -1), padding,),
                ("RIGHTPADDING", (0, 0), (-1, -1), padding,),
                ("TOPPADDING", (0, 0), (-1, -1), padding,),
                ("BOTTOMPADDING", (0, 0), (-1, -1), padding,),
            ]
        )

        return TableStyle(commands)

    # =====================================================
    # Shared Tally-style header pieces
    # =====================================================

    @classmethod
    def _render_header_block(cls, data, story, content_width, styles):
        normal = styles["normal"]
        header_label = styles["header_label"]
        metadata_value = styles["metadata_value"]
        metadata_value_bold = styles["metadata_value_bold"]

        right_col_width = 88 * mm
        left_col_width = content_width - right_col_width

        seller_address = "<br/>".join(escape(line) for line in data["seller"]["address"])

        seller_block = markup_paragraph(
            "<b>Seller</b><br/>"
            f"<b>{escape(data["seller"]["name"])}</b><br/>"
            f"{seller_address}<br/>"
            f"MOB. {escape(data["seller"]["mobile"])}<br/>"
            f"GSTIN/UIN: {escape(data["seller"]["gstin"])}<br/>"
            f"State Name: {escape(data["seller"]["state"])}, "
            f"Code: {escape(data["seller"]["state_code"])}<br/>"
            f"CIN: {escape(data["seller"]["cin"])}",
            normal,
        )

        def party_block(title_text, party):
            address = "<br/>".join(escape(line) for line in multiline_address(party["address"]))
            name = escape(str(party.get("name") or ""))
            text = f"<b>{escape(title_text)}</b><br/><b>{name}</b>"
            
            if address:
                text += f"<br/>{address}"

            if party.get("gstin"):
                text += f"<br/>GSTIN/UIN: {escape(str(party['gstin']))}"

            if party.get("pan"):
                text += f"<br/>PAN/IT No: {escape(str(party['pan']))}"

            if party.get("state"):
                text += f"<br/>State Name: {escape(str(party['state']))}"

                if party.get("state_code"):
                    text += f", Code: {escape(str(party['state_code']))}"

            return  markup_paragraph(text, normal)            

        consignee_block = party_block("Consignee (Ship To)", data["consignee"])
        buyer_block = party_block("Buyer (Bill To)", data["buyer"])

        left_stack = Table([[seller_block], [consignee_block], [buyer_block]], colWidths=[left_col_width])
        left_stack.setStyle(cls._table_style(padding=3))

        metadata = data["invoice_metadata"]
        invoice_row = Table(
            [
                [
                    markup_paragraph("<b>Invoice No.</b>", header_label),
                    markup_paragraph("<b>e-Way Bill no.</b>", header_label),
                    markup_paragraph("<b>Dated</b>", header_label),
                ],
                [
                    markup_paragraph(f"<b>{escape(str(metadata['invoice_no']))}</b>", metadata_value_bold),
                    paragraph(metadata.get("eway_bill_no", ""), metadata_value,),
                    markup_paragraph(f"<b>{escape(date_text(metadata['invoice_date']))}</b>", metadata_value_bold),
                ],
            ],
            colWidths=[right_col_width * 0.34, right_col_width * 0.36, right_col_width * 0.3],
        )
        invoice_row.setStyle(cls._table_style(padding=2))

        def label_value_row(label_text, value_text, bold_value=False):
            value_style = metadata_value_bold if bold_value else metadata_value
            return [markup_paragraph(f"<b>{escape(label_text)}</b>", header_label), paragraph(value_text, value_style),]

        reset_rows = [
            label_value_row("Delivery Note", metadata['delivery_note']),
            label_value_row("Mode/Terms of Payment", metadata["payment_terms"]),
            [
                markup_paragraph("<b>Reference no. &amp; Date</b>", header_label),
                markup_paragraph(escape(str(metadata["reference_no"] or "")) + 
                                 ("<br/>" + escape(date_text(metadata["reference_date"])) if metadata["reference_date"] else ""),
                                  metadata_value),
            ],
            label_value_row("Other References", metadata["other_references"]),
            label_value_row("Buyer's Order No.", metadata["buyers_order_no"]),
            label_value_row("Dated", date_text(metadata["buyers_order_date"])),
            label_value_row("Dispatch Doc. No.", metadata["dispatch_doc_no"]),
            label_value_row("Dispatched Through", metadata["dispatched_through"]),
            label_value_row("Destination", metadata["destination"]),
            label_value_row("Terms of Delivery", metadata["delivery_terms"]),
        ]

        reset_metadata_table = Table(reset_rows, colWidths=[right_col_width * 0.4, right_col_width * 0.6])
        reset_metadata_table.setStyle(cls._table_style(padding=2))
        right_stack = [invoice_row, reset_metadata_table]

        top_header = Table([[left_stack, right_stack]], colWidths=[left_col_width, right_col_width],)

        top_header.setStyle(cls._table_style(padding=0))

        story.append(top_header)
    # =====================================================
    # Tax invoice renderer
    # =====================================================

    @classmethod
    def _render_pdf(cls, data, output_path: Path, document_title: str,):
        cls._find_fonts()
        styles = cls._common_styles()

        (page_width, page_height, left_margin, right_margin, top_margin, bottom_margin, footer_height, content_width,) = cls._page_geometry()

        frame = cls._make_frame(left_margin, bottom_margin, footer_height, page_width, page_height, top_margin, content_width,)

        invoice_no = data["invoice_metadata"].get("invoice_no", "",)

        doc = BaseDocTemplate(
            str(output_path),
            pagesize=A4,
            leftMargin=left_margin,
            rightMargin=right_margin,
            topMargin=top_margin,
            bottomMargin=bottom_margin,
            title=f"{document_title} {invoice_no}",
            author=data["seller"]["name"],
            subject=f"{document_title} {invoice_no}",
            keywords=(f"{document_title}, Tempo Instruments, {invoice_no}"),
        )

        doc.addPageTemplates(
            [
                PageTemplate(
                    id="erp_document",
                    frames=[frame],
                    onPageEnd=lambda canvas, current_doc: cls._draw_footer(canvas, current_doc, page_width, right_margin,),
                )
            ]
        )

        story = []
        title = styles["title"]
        normal = styles["normal"]
        center = styles["center"]
        right = styles["right"]
        italic = styles["italic"]
        bold_italic = styles["bold_italic"]

        # Title
        story.append(Paragraph((f"{escape(document_title)} " "- GENERATED FROM INTERNAL-ERP" ), title,))
        story.append(Spacer(1, 2 * mm))

        # Seller + metadata
        cls._render_header_block(data=data, story=story, content_width=content_width, styles=styles)
        story.append(Spacer(1, 2 * mm))

        # Items
        item_rows = [
            [
                markup_paragraph("<b>Sr<br/>No.</b>", center),
                markup_paragraph("<b>Description of Goods</b>", center),
                markup_paragraph("<b>HSN/SAC</b>", center),
                markup_paragraph("<b>Quantity</b>", center),
                markup_paragraph("<b>Rate</b>", center),
                markup_paragraph("<b>per</b>", center),
                markup_paragraph("<b>Disc. %</b>", center),
                markup_paragraph("<b>Amount</b>", center),
            ]
        ]

        for index, item in enumerate(data["items"], start=1):
            item_code = escape(str(item["item_code"] or ""))
            description = f"<b>{item_code}</b>"

            if item["description"]:
                description += ("<br/><i>" + escape(str(item["description"])).replace("\n", "<br/>",)+ "</i>")

            item_rows.append(
                [
                    paragraph(str(index), center),
                    markup_paragraph(description, normal),
                    paragraph(item["hsn"], center),
                    markup_paragraph((f"<b>{item['quantity']:g} " f"{escape(str(item['um']))}</b>"), center,),
                    paragraph(money_text(item["rate"]), right),
                    paragraph(item["um"], center),
                    paragraph(rate_text(item["discount"]) if item["discount"] else "", center),
                    markup_paragraph(f"<b>{money_text(item['amount'])}</b>", right,),
                ]
            )

        if data["freight"]:
            item_rows.append(
                [
                    "",
                    markup_paragraph("<b>Freight Charges</b>", right),
                    "", "", "", "", "",
                    markup_paragraph(f"<b>{money_text(data['freight'])}</b>", right,),
                ]
            )

        if data["packing"]:
            item_rows.append(
                [
                    "",
                    markup_paragraph("<b>Packing Charges</b>", right),
                    "", "", "", "", "", 
                    markup_paragraph(f"<b>{money_text(data['packing'])}</b>", right, ),
                ]
            )
        if data["is_intrastate"]:
            if data["cgst"]:
                item_rows.append(
                    [
                        "",
                        markup_paragraph(f"<b><i>OUTPUT CGST @ {rate_text(data['cgst_rate'])}%</i></b>", right),
                        "", "",
                        paragraph(rate_text(data["cgst_rate"]), center),
                        paragraph("%", center),
                        "",
                        markup_paragraph(f"<b>{money_text(data['cgst'])}</b>", right),
                    ]
                )
            if data["sgst"]:
                item_rows.append(
                    [
                        "",
                        markup_paragraph(f"<b><i>OUTPUT SGST @ {rate_text(data['sgst_rate'])}%</i></b>", right),
                        "", "",
                        paragraph(rate_text(data["sgst_rate"]), center),
                        paragraph("%", center),
                        "",
                        markup_paragraph(f"<b>{money_text(data['sgst'])}</b>", right),
                    ]
                )
        
        else:
            if data["igst"]:
                item_rows.append(
                    [
                    "",
                    markup_paragraph(f"<b><i>OUTPUT IGST @ {rate_text(data['igst_rate'])}%</i></b>", right),
                    "", "",
                    paragraph(rate_text(data["igst_rate"]), center),
                    paragraph("%", center),
                    "",
                    markup_paragraph(f"<b>{money_text(data['igst'])}</b>", right),
                    ]
                )
                
        total_quantity = sum((item["quantity"] for item in data["items"]), Decimal("0"),)
        
        item_rows.append(
            [
                "",
                markup_paragraph("<b>Total</b>", right),
                "",
                markup_paragraph(f"<b>{total_quantity:g} Nos.</b>", center, ),
                "", "", "",
                markup_paragraph(f"<b>₹ {money_text(data['grand_total'])}</b>", right,),
            ]
        )

        item_table = Table(
            item_rows,
            colWidths=[8 * mm, 59 * mm, 17 * mm, 20 * mm, 21 * mm, 12 * mm, 15 * mm, 26 * mm,],
            repeatRows=1,
            splitByRow=1,
        )
        item_table.setStyle(cls._table_style(padding=2))
        story.append(item_table)

        # Amount chargeable
        story.append(Spacer(1, 1 * mm))
        amount_words = amount_in_words(data["grand_total"])

        amount_table = Table(
            [
                [
                    markup_paragraph("<b>Amount Chargeable (in words)</b>", normal,),
                    markup_paragraph("<b>E. &amp; O.E</b>", right),
                ],
                [
                    markup_paragraph(f"<b>{escape(amount_words)}</b>", normal,),
                    "",
                ],
            ],
            colWidths=[content_width - 35 * mm, 35 * mm,],
        )
        amount_table.setStyle(cls._table_style(padding=3, valign="MIDDLE"))
        story.append(amount_table)

        # Tax table
        story.append(Spacer(1, 2 * mm))

        if data["is_intrastate"]:
            tax_rows = [
                [
                    markup_paragraph("<b>HSN/SAC</b>", center),
                    markup_paragraph("<b>Taxable Value</b>", center),
                    markup_paragraph("<b>CGST Rate</b>", center),
                    markup_paragraph("<b>CGST Amount</b>", center),
                    markup_paragraph("<b>SGST Rate</b>", center),
                    markup_paragraph("<b>SGST Amount</b>", center),
                    markup_paragraph("<b>Total Tax</b>", center),
                ],
                [
                    paragraph(data["items"][0]["hsn"] if data["items"] else "", center,),
                    paragraph(money_text(data["taxable_value"]), right),
                    paragraph(f"{money_text(data['cgst_rate'])}%", center),
                    paragraph(money_text(data["cgst"]), right),
                    paragraph(f"{money_text(data['sgst_rate'])}%", center),
                    paragraph(money_text(data["sgst"]), right),
                    paragraph(money_text(data["tax_amount"]), right),
                ],
                [
                    markup_paragraph("<b>Total</b>", right),
                    markup_paragraph(f"<b>{money_text(data['taxable_value'])}</b>", right,),
                    "",
                    markup_paragraph(f"<b>{money_text(data['cgst'])}</b>", right,),
                    "",
                    markup_paragraph(f"<b>{money_text(data['sgst'])}</b>", right,),
                    markup_paragraph(f"<b>{money_text(data['tax_amount'])}</b>", right,),
                ],
            ]
            tax_col_widths = [24 * mm, 30 * mm, 21 * mm, 27 * mm, 21 * mm, 27 * mm, 32 * mm,]

        else:
            tax_rows = [
                [
                    markup_paragraph("<b>HSN/SAC</b>", center),
                    markup_paragraph("<b>Taxable Value</b>", center),
                    markup_paragraph("<b>IGST Rate</b>", center),
                    markup_paragraph("<b>IGST Amount</b>", center),
                    markup_paragraph("<b>Total Tax</b>", center),
                ],
                [
                    paragraph(data["items"][0]["hsn"] if data["items"] else "", center,),
                    paragraph(money_text(data["taxable_value"]), right),
                    paragraph(f"{money_text(data['igst_rate'])}%", center),
                    paragraph(money_text(data["igst"]), right),
                    paragraph(money_text(data["tax_amount"]), right),
                ],
                [
                    markup_paragraph("<b>Total</b>", right),
                    markup_paragraph(f"<b>{money_text(data['taxable_value'])}</b>", right,),
                    "",
                    markup_paragraph(f"<b>{money_text(data['igst'])}</b>", right,),
                    markup_paragraph(f"<b>{money_text(data['tax_amount'])}</b>", right,),
                ],
            ]
            tax_col_widths = [32 * mm, 42 * mm, 30 * mm, 40 * mm, 35 * mm,]

        tax_table = Table(tax_rows, colWidths=tax_col_widths, repeatRows=1, splitByRow=1,)
        tax_table.setStyle(cls._table_style(padding=3, valign="MIDDLE"))
        story.append(tax_table)

        # Tax amount words
        story.append(Spacer(1, 3 * mm))
        story.append(
            markup_paragraph(
                ("<b>Tax Amount (in words):</b> " f"{escape(amount_in_words(data['tax_amount']))}" ), normal,
            )
        )

        # PAN
        story.append(Spacer(1, 3 * mm))
        story.append(markup_paragraph(("<b>Company's PAN :</b> " f"{escape(data['seller']['pan'])}" ), normal,))

        # Declaration
        story.append(Spacer(1, 4 * mm))
        declaration = Table(
            [
                [
                    markup_paragraph(
                        "<b>Declaration</b><br/>"
                        "We declare that this invoice shows "
                        "the actual price of the goods described "
                        "and that all particulars are true and correct.",
                        normal,
                    ),
                    markup_paragraph(
                        (
                            f"<b>for "
                            f"{escape(data['seller']['name'])}</b>"
                            "<br/><br/><br/>"
                            "Authorised Signatory"
                        ),
                        right,
                    ),
                ]
            ],
            colWidths=[content_width - 80 * mm, 80 * mm,],
        )
        declaration.setStyle(cls._table_style(padding=3))
        story.append(declaration)

        doc.build(story)

    # =====================================================
    # Quotation -> Order Booking renderer
    # =====================================================

    @classmethod
    def _render_quotation_order_pdf(cls, data, output_path: Path, document_title: str,):
        cls._find_fonts()
        styles = cls._common_styles()

        (page_width, page_height, left_margin, right_margin, top_margin, bottom_margin, footer_height, content_width,) = cls._page_geometry()

        frame = cls._make_frame(
            left_margin,
            bottom_margin,
            footer_height,
            page_width,
            page_height,
            top_margin,
            content_width,
        )

        title = styles["title"]
        normal = styles["normal"]
        small = styles["small"]
        center = styles["center"]
        right = styles["right"]
        header_label = styles["header_label"]
        metadata_value = styles["metadata_value"]
        metadata_value_bold = styles["metadata_value_bold"]
        section_title = styles["section_title"]

        quote_number = data["quote_number"]
        generated_text = date_text(data["generated_at"])

        subject = f"{document_title} {quote_number}"

        doc = BaseDocTemplate(
            str(output_path),
            pagesize=A4,
            leftMargin=left_margin,
            rightMargin=right_margin,
            topMargin=top_margin,
            bottomMargin=bottom_margin,
            title=subject,
            author=data["sales"]["name"] or data["seller"]["name"],
            subject=subject,
            keywords=(f"{document_title}, Quotation, Tempo Instruments, {quote_number}"),
        )

        doc.addPageTemplates(
            [
                PageTemplate(
                    id="quotation_order_booking",
                    frames=[frame],
                    onPageEnd=lambda canvas, current_doc: cls._draw_footer(canvas, current_doc, page_width, right_margin,),
                )
            ]
        )

        story = []

        # -------------------------------------------------
        # Title
        # -------------------------------------------------

        story.append(Paragraph((f"{escape(document_title)} - GENERATED FROM QUOTATION"), title,))
        story.append(Spacer(1, 2 * mm))

        # -------------------------------------------------
        # Seller + quotation metadata
        # -------------------------------------------------

        seller_address = "<br/>".join(escape(line) for line in data["seller"]["address"])

        seller_block = markup_paragraph(
            "<b>Seller</b><br/>"
            f"<b>{escape(data['seller']['name'])}</b><br/>"
            f"{seller_address}<br/>"
            f"MOB. {escape(data['seller']['mobile'])}<br/>"
            "GSTIN/UIN : " f"{escape(data['seller']['gstin'])}<br/>"
            "State Name : " f"{escape(data['seller']['state'])}, " 
            "Code : " f"{escape(data['seller']['state_code'])}<br/>"
            "CIN: " f"{escape(data['seller']['cin'])}",
            normal,
        )

        quotation_metadata_rows = [
            [
                markup_paragraph("<b>Quotation No.</b>", header_label,),
                markup_paragraph(f"<b>{escape(str(quote_number))}</b>", metadata_value_bold,),
            ],
            [
                markup_paragraph("<b>Enquiry Date</b>", header_label,),
                markup_paragraph(f"<b>{escape(date_text(data['enquiry_date']))}</b>", metadata_value_bold,),
            ],
            [
                markup_paragraph("<b>Generated At</b>", header_label,),
                paragraph(generated_text, metadata_value,),
            ],
            [
                markup_paragraph("<b>Quotation Status</b>", header_label,),
                paragraph(data["status"], metadata_value,),
            ],
            [
                markup_paragraph("<b>Active</b>", header_label,),
                paragraph(yes_no(data["is_active"]), metadata_value,),
            ],
            [
                markup_paragraph("<b>Tally Order</b>", header_label,),
                paragraph((str(data["converted_order_id"]) if data["converted_order_id"] is not None else "Not yet converted"), metadata_value,),
            ],
        ]

        quotation_metadata_table = Table(quotation_metadata_rows, colWidths=[38 * mm, 50 * mm],)
        quotation_metadata_table.setStyle(cls._table_style(padding=2))

        top_header = Table(
            [[seller_block, quotation_metadata_table]],
            colWidths=[content_width - 88 * mm, 88 * mm,],
        )
        top_header.setStyle(cls._table_style(padding=3))

        story.append(top_header)

        story.append(Spacer(1, 2 * mm))

        # -------------------------------------------------
        # Customer / Buyer
        # -------------------------------------------------

        customer = data["customer"]
        buyer = data["buyer"]

        customer_text = (
            "<b>Customer / Bill To</b><br/>"
            f"<b>{escape(customer['company'])}</b><br/>"
            f"{escape(customer['address'])}<br/>"
            f"{escape(customer['city'])}"
        )

        if customer["postal_code"]:
            customer_text += f" - {escape(customer['postal_code'])}"

        if customer["email"]:
            customer_text += f"<br/>Email: {escape(customer['email'])}"

        customer_text += "<br/><br/>" "<b>Buyer Contact</b><br/>" f"{escape(buyer['name'])}"

        if buyer["phone"]:
            customer_text += f"<br/>Phone: {escape(buyer['phone'])}"

        customer_table = Table([[markup_paragraph(customer_text, normal)]], colWidths=[content_width],)

        customer_table.setStyle(cls._table_style(padding=4))
        story.append(customer_table)

        story.append(Spacer(1, 2 * mm))

        # -------------------------------------------------
        # Product / order details
        # -------------------------------------------------

        story.append(Paragraph("Order / Commercial Details", section_title,))
        story.append(Spacer(1, 1 * mm))

        product = data["product"]
        commercial = data["commercial"]

        details_rows = [
            [
                markup_paragraph("<b>Product</b>", header_label),
                paragraph(product["name"], normal),
            ],
            [
                markup_paragraph("<b>Supply</b>", header_label),
                paragraph(commercial["supply"], normal),
            ],
            [
                markup_paragraph("<b>Installation</b>", header_label),
                paragraph(commercial["installation"], normal),
            ],
            [
                markup_paragraph("<b>Freight</b>", header_label),
                paragraph(commercial["freight"], normal),
            ],
        ]

        details_table = Table(details_rows, colWidths=[42 * mm, content_width - 42 * mm,],)
        details_table.setStyle(cls._table_style(padding=3))
        story.append(details_table)

        story.append(Spacer(1, 2 * mm))

        # -------------------------------------------------
        # Classification
        # -------------------------------------------------

        story.append(Paragraph("Order Classification", section_title,))
        story.append(Spacer(1, 1 * mm))

        classification_table = Table(
            [
                [
                    markup_paragraph("<b>Dealer</b>", header_label),
                    paragraph(yes_no(data["flags"]["is_dealer"]), center,),
                    markup_paragraph("<b>Special Model</b>", header_label,),
                    paragraph(yes_no(data["flags"]["is_special_model"]), center,),
                ]
            ],
            colWidths=[35 * mm, 25 * mm, 40 * mm, 25 * mm,],
        )

        classification_table.setStyle(cls._table_style(padding=3, valign="MIDDLE"))
        story.append(classification_table)

        story.append(Spacer(1, 2 * mm))

        # -------------------------------------------------
        # Sales person - explicit provenance section
        # -------------------------------------------------

        story.append(Paragraph("Sales Responsibility", section_title,))
        story.append(Spacer(1, 1 * mm))

        sales = data["sales"]

        sales_table = Table(
            [
                [
                    markup_paragraph("<b>Sales Person</b>", header_label,),
                    markup_paragraph(f"<b>{escape(str(sales['name'] or ''))}</b>",normal,),
                ],
                [
                    markup_paragraph("<b>Sales Email</b>", header_label,),
                    paragraph(sales["email"], normal,),
                ],
            ],
            colWidths=[42 * mm, content_width - 42 * mm,],
        )

        sales_table.setStyle(cls._table_style(padding=3))

        story.append(sales_table)

        story.append(Spacer(1, 2 * mm))

        # -------------------------------------------------
        # Conversion / workflow section
        # -------------------------------------------------

        story.append(Paragraph("ERP Conversion Status", section_title,))

        story.append(Spacer(1, 1 * mm))

        if data["converted_order_id"] is None:
            conversion_status = "This quotation has not yet been converted into an ERP order."
        else:
            conversion_status = f"This quotation has already been converted into ERP order {data['converted_order_id']}."

        conversion_table = Table(
            [
                [
                    markup_paragraph("<b>Quotation Reference</b>", header_label,),
                    paragraph(quote_number, normal,),
                ],
                [
                    markup_paragraph("<b>Conversion Status</b>", header_label,),
                    paragraph(conversion_status, normal,),
                ],
            ],
            colWidths=[42 * mm, content_width - 42 * mm,],
        )
        conversion_table.setStyle(cls._table_style(padding=3))
        story.append(conversion_table)

        story.append(Spacer(1, 3 * mm))

        # -------------------------------------------------
        # Disclaimer / operational note
        # -------------------------------------------------

        disclaimer = Table(
            [
                [
                    markup_paragraph(
                        "<b>Order Booking Note</b><br/>"
                        "This document is generated from the stored quotation "
                        "and is intended for internal order-booking and review. "
                        "It is not a tax invoice and does not create commercial "
                        "values that are not present in the quotation record.",
                        small,
                    )
                ]
            ],
            colWidths=[content_width],
        )
        disclaimer.setStyle(cls._table_style(padding=4))
        story.append(disclaimer)

        story.append(Spacer(1, 5 * mm))

        # -------------------------------------------------
        # Signature block
        # -------------------------------------------------

        signature = Table(
            [
                [
                    markup_paragraph(
                        "<b>Prepared By</b><br/>"
                        f"{escape(str(sales['name'] or ''))}<br/>"
                        f"{escape(str(sales['email'] or ''))}",
                        normal,
                    ),
                    markup_paragraph(
                        (
                            f"<b>for "
                            f"{escape(data['seller']['name'])}</b>"
                            "<br/><br/><br/>"
                            "Authorised Signatory"
                        ),
                        right,
                    ),
                ]
            ],
            colWidths=[content_width - 80 * mm, 80 * mm,],
        )
        signature.setStyle(cls._table_style(padding=4))
        story.append(signature)

        doc.build(story)
