"""
services/tally_client.py

Tally XML/HTTP client.

Responsibilities:

1. Fetch StockItem master data.
2. Fetch voucher collections by voucher type and date range.
3. Filter StockItem XML by NAME prefix.
4. Parse Tally XML into normalized Python structures.
5. Convert Sales/Purchase Order vouchers into staging-ready dictionaries.
"""

from __future__ import annotations
from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert as pg_insert

from database.models import (
    StagingOrderHeader,
    StagingOrderItem,
)
import os
import re
import xml.etree.ElementTree as ET

from datetime import date, datetime
from decimal import Decimal
from pathlib import Path

import requests


# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

TALLY_RAW_DIR = Path("tally_raw")

TALLY_HOST = os.environ.get(
    "TALLY_HOST",
    "http://localhost:9000",
)

TALLY_COMPANY = os.environ.get(
    "TALLY_COMPANY",
    "TEMPO INSTRUMENTS PRIVATE LIMITED - (from 1-Apr-25)",
)

TALLY_TIMEOUT_SECONDS = int(
    os.environ.get("TALLY_TIMEOUT_SECONDS", "120")
)


# ---------------------------------------------------------------------------
# XML escaping
# ---------------------------------------------------------------------------

def _xml_escape(value: str) -> str:
    """
    Escape XML text safely.
    """
    return (
        value
        .replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace('"', "&quot;")
        .replace("'", "&apos;")
    )


# ---------------------------------------------------------------------------
# Tally XML cleaning
# ---------------------------------------------------------------------------

_CONTROL_CHAR_DECIMAL = re.compile(
    r"&#(?:0|[1-8]|11|12|1[4-9]|2[0-9]|3[01]);"
)

_CONTROL_CHAR_HEX = re.compile(
    r"&#x(?:0?[0-8]|0?B|0?C|0?[E-F]|1[0-9A-F]);",
    re.IGNORECASE,
)

_BARE_AMPERSAND = re.compile(
    r"&(?!amp;|lt;|gt;|apos;|quot;|#\d+;|#x[0-9A-Fa-f]+;)"
)


def clean_tally_xml(xml_text: str) -> str:
    """
    Clean common malformed constructs found in Tally XML.
    """

    cleaned = _CONTROL_CHAR_DECIMAL.sub("", xml_text)
    cleaned = _CONTROL_CHAR_HEX.sub("", cleaned)

    # Tally UDF tags can contain undeclared namespace prefixes.
    cleaned = cleaned.replace("UDF:", "UDF_")

    # Escape genuinely bare ampersands.
    cleaned = _BARE_AMPERSAND.sub("&amp;", cleaned)

    return cleaned


# ---------------------------------------------------------------------------
# XML parser
# ---------------------------------------------------------------------------

def _parse_node(node: ET.Element):
    """
    Structure-preserving recursive XML parser.

    Object attributes are retained.

    Example:

        <VOUCHER VCHTYPE="Sales Order">
            ...
        </VOUCHER>

    becomes:

        {
            "VCHTYPE": "Sales Order",
            ...
        }
    """

    children = list(node)

    if not children:
        return node.text.strip() if node.text else ""

    result = dict(node.attrib)

    for child in children:
        value = _parse_node(child)

        if child.tag not in result:
            result[child.tag] = value
        else:
            if not isinstance(result[child.tag], list):
                result[child.tag] = [
                    result[child.tag]
                ]

            result[child.tag].append(value)

    return result


def tally_xml_to_json(xml_string: str) -> dict:
    """
    Generic structure-preserving XML -> dict.
    """

    try:
        root = ET.fromstring(
            clean_tally_xml(xml_string)
        )

        return {
            root.tag: _parse_node(root)
        }

    except Exception as exc:
        return {
            "error": str(exc),
            "raw": xml_string[:2000],
        }


# ---------------------------------------------------------------------------
# Key normalization
# ---------------------------------------------------------------------------

def normalize_keys(obj):
    """
    Normalize Tally keys:

        VOUCHERNUMBER
        -> vouchernumber

        ALLINVENTORYENTRIES.LIST
        -> allinventoryentries

    Also collapses:

        BASICBUYERADDRESS.LIST
            BASICBUYERADDRESS
            BASICBUYERADDRESS

    into a simple list.
    """

    if isinstance(obj, dict):

        normalized = {}

        for key, value in obj.items():

            clean_key = key.lower()

            if clean_key.endswith(".list"):
                clean_key = clean_key[:-5]

            cleaned_value = normalize_keys(value)

            if (
                isinstance(cleaned_value, dict)
                and len(cleaned_value) == 1
                and clean_key in cleaned_value
            ):
                cleaned_value = cleaned_value[clean_key]

            if clean_key in normalized:

                if not isinstance(normalized[clean_key], list):
                    normalized[clean_key] = [
                        normalized[clean_key]
                    ]

                if isinstance(cleaned_value, list):
                    normalized[clean_key].extend(
                        cleaned_value
                    )
                else:
                    normalized[clean_key].append(
                        cleaned_value
                    )

            else:
                normalized[clean_key] = cleaned_value

        return normalized

    if isinstance(obj, list):
        return [
            normalize_keys(item)
            for item in obj
        ]

    return obj


# ---------------------------------------------------------------------------
# Tally request
# ---------------------------------------------------------------------------

FETCH_FIELDS = (
    "GUID,"
    "DATE,"
    "VOUCHERNUMBER,"
    "VOUCHERTYPENAME,"
    "PARTYLEDGERNAME,"
    "PARTYNAME,"
    "PARTYGSTIN,"
    "REFERENCE,"
    "REFERENCEDATE,"
    "BASICBUYERADDRESS,"
    "BASICORDERTERMS,"
    "BASICDUEDATEOFPYMT,"
    "BASICSHIPPEDBY,"
    "STATENAME,"
    "PLACEOFSUPPLY,"
    "NARRATION,"
    "ALLINVENTORYENTRIES.LIST,"
    "LEDGERENTRIES.LIST"
)


def build_voucher_collection_xml(
    voucher_type: str,
    from_date: str,
    to_date: str,
    company: str = TALLY_COMPANY,
) -> str:

    from_dt = from_date.replace("-", "")
    to_dt = to_date.replace("-", "")

    voucher_type_esc = _xml_escape(voucher_type)
    company_esc = _xml_escape(company)

    return f"""
<ENVELOPE>
    <HEADER>
        <VERSION>1</VERSION>
        <TALLYREQUEST>EXPORT</TALLYREQUEST>
        <TYPE>COLLECTION</TYPE>
        <ID>VoucherRangeCollection</ID>
    </HEADER>

    <BODY>
        <DESC>

            <STATICVARIABLES>
                <SVEXPORTFORMAT>$$SysName:XML</SVEXPORTFORMAT>
                <SVFROMDATE>{from_dt}</SVFROMDATE>
                <SVTODATE>{to_dt}</SVTODATE>
                <SVCURRENTCOMPANY>{company_esc}</SVCURRENTCOMPANY>
            </STATICVARIABLES>

            <TDL>
                <TDLMESSAGE>

                    <COLLECTION
                        NAME="VoucherRangeCollection"
                        ISMODIFY="No"
                        ISFIXED="No"
                        ISINITIALIZE="Yes"
                        ISOPTION="No"
                        ISINTERNAL="No"
                    >

                        <TYPE>Voucher</TYPE>

                        <FETCH>
                            DATE,
                            REFERENCEDATE,
                            GUID,
                            STATENAME,
                            NARRATION,
                            PARTYGSTIN,
                            PLACEOFSUPPLY,
                            VOUCHERTYPENAME,
                            PARTYNAME,
                            PARTYLEDGERNAME,
                            VOUCHERNUMBER,
                            REFERENCE,
                            BASICBUYERADDRESS.*,
                            BASICORDERTERMS.*,
                            BASICDUEDATEOFPYMT,
                            BASICSHIPPEDBY,
                            ISDELETED,
                            ASORIGINAL,
                            ISDEEMEDPOSITIVE,
                            EFFECTIVEDATE,
                            ISINVOICE,
                            MASTERID,
                            VOUCHERKEY,
                            VOUCHERRETAINKEY,
                            VOUCHERNUMBERSERIES,
                            ALLINVENTORYENTRIES.*,
                            BATCHALLOCATIONS.*,
                            ACCOUNTINGALLOCATIONS.*,
                            LEDGERENTRIES.*
                        </FETCH>

                        <FILTER>
                            VoucherDateFilter,
                            VoucherTypeFilter
                        </FILTER>

                    </COLLECTION>

                    <SYSTEM
                        TYPE="Formulae"
                        NAME="VoucherDateFilter"
                    >
                        $Date &gt;= ##SVFROMDATE
                        AND
                        $Date &lt;= ##SVTODATE
                    </SYSTEM>

                    <SYSTEM
                        TYPE="Formulae"
                        NAME="VoucherTypeFilter"
                    >
                        $VoucherTypeName = "{voucher_type_esc}"
                    </SYSTEM>

                </TDLMESSAGE>
            </TDL>

        </DESC>
    </BODY>
</ENVELOPE>
"""
# ---------------------------------------------------------------------------
# Sending
# ---------------------------------------------------------------------------

def send_to_tally(
    xml_payload: str,
    tally_url: str = TALLY_HOST,
) -> str:

    response = requests.post(
        tally_url,
        data=xml_payload.encode("utf-8"),
        headers={
            "Content-Type": "text/xml",
        },
        timeout=TALLY_TIMEOUT_SECONDS,
    )

    response.raise_for_status()

    text = response.text

    if (
        "<LINEERROR>" in text
        or "Unknown Request" in text
    ):
        raise ValueError(
            "Tally rejected the request: "
            f"{text[:1000]}"
        )

    return text


# ---------------------------------------------------------------------------
# Voucher fetch
# ---------------------------------------------------------------------------

def fetch_voucher_range(
    voucher_type: str | None,
    from_date: str,
    to_date: str,
    company: str = TALLY_COMPANY,
    tally_url: str = TALLY_HOST,
) -> str:

    payload = build_voucher_collection_xml(
        voucher_type=voucher_type,
        from_date=from_date,
        to_date=to_date,
        company=company,
    )

    return send_to_tally(
        payload,
        tally_url=tally_url,
    )


# ---------------------------------------------------------------------------
# Voucher -> normalized JSON
# ---------------------------------------------------------------------------

def xml_to_staging_json(
    xml_text: str,
) -> dict:

    root = ET.fromstring(
        clean_tally_xml(xml_text)
    )

    vouchers = [
        voucher
        for voucher in root.findall(".//VOUCHER")
        if "VCHTYPE" in voucher.attrib
    ]

    voucher_dicts = [
        _parse_node(voucher)
        for voucher in vouchers
    ]

    normalized = [
        normalize_keys(voucher)
        for voucher in voucher_dicts
    ]

    return {
        "tallymessage": normalized
    }


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _as_list(value):
    """
    Normalize a Tally collection into a list.

    Tally may return:
        None
        ""
        {}
        {}
        [{...}, ""]
        {...}

    Empty/non-object collection entries are ignored by callers
    that require structured records.
    """

    if value is None:
        return []

    if isinstance(value, list):
        return value

    if isinstance(value, dict):
        return [value]

    return [value]

def _join_text_list(value) -> str:
    """
    Convert Tally text/list structures into a clean string.

    Handles:

        "30 DAYS"

        ["LINE 1", "LINE 2"]

        {
            "type": "String",
            "basicbuyeraddress": [
                "LINE 1",
                "LINE 2",
            ],
        }

    Never stringify a Tally metadata dictionary directly.
    """

    if value is None:
        return ""

    # ---------------------------------------------------------
    # Tally wrapper dictionary
    # ---------------------------------------------------------

    if isinstance(value, dict):

        # Remove Tally metadata such as:
        #
        # {"type": "String", ...}
        #
        # and recursively process the actual value.

        meaningful_values = []

        for key, nested_value in value.items():

            if key.lower() == "type":
                continue

            meaningful_values.append(
                _join_text_list(nested_value)
            )

        return " ".join(
            item
            for item in meaningful_values
            if item
        ).strip()

    # ---------------------------------------------------------
    # Lists
    # ---------------------------------------------------------

    if isinstance(value, list):

        return " ".join(
            _join_text_list(item)
            for item in value
            if item is not None
        ).strip()

    # ---------------------------------------------------------
    # Scalar
    # ---------------------------------------------------------

    return str(value).strip()

def _parse_decimal(value) -> Decimal:

    if value is None:
        return Decimal("0")

    text = str(value).strip()

    # Remove commas.
    text = text.replace(",", "")

    # Tally quantities/rates can look like:
    # 72385.00/Nos.
    #
    # Amounts can look like:
    # -259192.90
    match = re.search(
        r"-?\d+(?:\.\d+)?",
        text,
    )

    if not match:
        return Decimal("0")

    return Decimal(match.group())


def _parse_date(value):

    if not value:
        return None

    value = str(value).strip()

    for fmt in (
        "%Y%m%d",
        "%d-%b-%y",
        "%d-%b-%Y",
    ):
        try:
            return datetime.strptime(
                value,
                fmt,
            ).date()

        except ValueError:
            continue

    return None


# ---------------------------------------------------------------------------
# Sales / Purchase Order staging mapper
# ---------------------------------------------------------------------------

def voucher_to_staging_order(
    voucher: dict,
) -> dict:
    """
    Convert one normalized Tally Sales Order / Purchase Order
    into the staging shape.

    Mapping:

    Header
    ------
    GUID                -> tally_guid
    VOUCHERNUMBER       -> order_acceptance_id
    DATE                -> order_acceptance_date
    REFERENCE           -> purchase_order_number
    PARTYLEDGERNAME     -> billing_name
    PARTYNAME           -> customer_code
    BASICBUYERADDRESS   -> billing_address
    BASICORDERTERMS     -> terms_of_delivery
    BASICDUEDATEOFPYMT  -> payment_terms
    BASICSHIPPEDBY      -> dispatched_through
    STATENAME           -> state_name
    PARTYGSTIN          -> buyer_gstin
    PLACEOFSUPPLY       -> destination

    Items
    -----

    STOCKITEMNAME       -> item_code
    RATE                -> rate
    DISCOUNT            -> discount_percentage
    AMOUNT              -> amount
    ACTUALQTY           -> quantity

    Ledger
    ------

    Freight Charges AMOUNT -> freight_charges
    """

    voucher_type = (
        voucher.get("vouchertypename")
        or voucher.get("vchtype")
        or ""
    )

    # ---------------------------------------------------------
    # Header
    # ---------------------------------------------------------
    tally_guid = (voucher.get("guid") or "").strip()

    order_acceptance_id = (
        voucher.get("vouchernumber")
    )

    order_acceptance_date = _parse_date(
        voucher.get("date")
    )

    # Based on the sample:
    #
    # REFERENCE = 4700001598
    #
    # This is preserved as purchase_order_number.
    purchase_order_number = (
        voucher.get("reference")
    )

    billing_name = (
        voucher.get("partyledgername")
        or ""
    )

    customer_code = (
        voucher.get("partyname")
        or ""
    )

    billing_address = _join_text_list(
        voucher.get("basicbuyeraddress")
    )

    terms_of_delivery = _join_text_list(
        voucher.get("basicorderterms")
    )

    payment_terms = (
        voucher.get("basicduedateofpymt")
        or ""
    )

    dispatched_through = (
        voucher.get("basicshippedby")
        or ""
    )

    state_name = (
        voucher.get("statename")
        or ""
    )

    buyer_gstin = (
        voucher.get("partygstin")
        or ""
    )

    destination = (
        voucher.get("placeofsupply")
        or ""
    )

    # ---------------------------------------------------------
    # Items
    # ---------------------------------------------------------

    items = []
    skipped_inventory_entries = 0
    inventory_entries = _as_list(
        voucher.get("allinventoryentries")
    )

    for inventory in inventory_entries:

        if not isinstance(inventory, dict):
            skipped_inventory_entries += 1
            continue

        stockitemname = (
            inventory.get("stockitemname")
            or ""
        )

        quantity = _parse_decimal(
            inventory.get("actualqty")
        )

        rate = _parse_decimal(
            inventory.get("rate")
        )

        discount = _parse_decimal(
            inventory.get("discount")
        )

        amount = abs(
            _parse_decimal(
                inventory.get("amount")
            )
        )

        item = {
            "item_code": stockitemname,
            "additional_spec_text": "",
            "hsn_code": "",
            "quantity": quantity,
            "rate": rate,
            "discount_percentage": discount,
            "amount": amount,
            "due_date": None,
        }

        items.append(item)

    # ---------------------------------------------------------
    # Ledger entries
    # ---------------------------------------------------------

    freight_charges = Decimal("0")
    tax_amount = Decimal("0")
    grand_total = Decimal("0")

    ledger_entries = _as_list(
        voucher.get("ledgerentries")
    )

    for ledger in ledger_entries:

        if not isinstance(ledger, dict):
            continue

        ledger_name = (
            ledger.get("ledgername")
            or ""
        ).strip()

        ledger_amount = _parse_decimal(
            ledger.get("amount")
        )

        # IMPORTANT:
        #
        # Do not treat every AMOUNT as freight.
        #
        # Only the ledger named Freight Charges
        # contributes to freight_charges.

        if ledger_name.casefold() == "freight charges".casefold():

            freight_charges += abs(
                ledger_amount
            )

        # We can improve tax classification later.
        if (
            "CGST" in ledger_name.upper()
            or "SGST" in ledger_name.upper()
            or "IGST" in ledger_name.upper()
        ):
            tax_amount += abs(
                ledger_amount
            )

        grand_total += abs(
            ledger_amount
        )

    return {
        "voucher_type": voucher_type,
        "tally_guid": tally_guid,
        "order_acceptance_id": order_acceptance_id,
        "order_acceptance_date": order_acceptance_date,

        "purchase_order_number": purchase_order_number,

        "purchase_order_date": None,

        "billing_name": billing_name,
        "billing_address": billing_address,

        "payment_terms": payment_terms,

        "status": "PENDING",

        "customer_code": customer_code,

        "dispatched_through": dispatched_through,

        "ordered_by": "",

        "packing_charges": Decimal("0"),

        "freight_charges": freight_charges,

        "tax_rate": Decimal("18"),

        "buyer_gstin": buyer_gstin,

        "destination": destination,

        "terms_of_delivery": terms_of_delivery,

        "tax_amount": tax_amount,

        "grand_total": grand_total,

        "state_name": state_name,

        "items": items,
    }


# ---------------------------------------------------------------------------
# Item Master
# ---------------------------------------------------------------------------

def build_stock_item_collection_xml(
    company: str = TALLY_COMPANY,
) -> str:

    company_esc = _xml_escape(company)

    fetch_fields = (
        "NAME,"
        "PARTNO,"
        "PARENT,"
        "BASEUNITS,"
        "GSTHSNNAME,"
        "GSTHSNCODE,"
        "GSTRATE,"
        "CLOSINGBALANCE,"
        "DESCRIPTION"
    )

    return (
        "<ENVELOPE>"
        "<HEADER>"
        "<VERSION>1</VERSION>"
        "<TALLYREQUEST>EXPORT</TALLYREQUEST>"
        "<TYPE>COLLECTION</TYPE>"
        "<ID>ItemMasterCollection</ID>"
        "</HEADER>"

        "<BODY>"
        "<DESC>"

        "<STATICVARIABLES>"
        "<SVEXPORTFORMAT>$$SysName:XML</SVEXPORTFORMAT>"
        f"<SVCURRENTCOMPANY>{company_esc}</SVCURRENTCOMPANY>"
        "</STATICVARIABLES>"

        "<TDL>"
        "<TDLMESSAGE>"

        '<COLLECTION NAME="ItemMasterCollection" '
        'ISMODIFY="No">'

        "<TYPE>StockItem</TYPE>"
        f"<FETCH>{fetch_fields}</FETCH>"

        "</COLLECTION>"

        "</TDLMESSAGE>"
        "</TDL>"

        "</DESC>"
        "</BODY>"
        "</ENVELOPE>"
    )


def fetch_item_master(
    company: str = TALLY_COMPANY,
    tally_url: str = TALLY_HOST,
) -> str:

    payload = build_stock_item_collection_xml(
        company
    )

    return send_to_tally(
        payload,
        tally_url=tally_url,
    )


def filter_item_master_xml(
    xml_text: str,
    name_prefix: str = "TI",
) -> str:
    """
    Keep only:

        <STOCKITEM NAME="TI...">

    The complete response is filtered in memory and
    the resulting XML retains the original Tally
    response structure.
    """

    prefix = (
        name_prefix
        .strip()
        .casefold()
    )

    root = ET.fromstring(
        clean_tally_xml(xml_text)
    )

    for parent in root.iter():

        for stock_item in list(parent):

            if stock_item.tag != "STOCKITEM":
                continue

            name = (
                stock_item.attrib
                .get("NAME", "")
                .strip()
            )

            if not name.casefold().startswith(prefix):
                parent.remove(stock_item)

    return ET.tostring(
        root,
        encoding="unicode",
    )


def xml_to_item_master_json(
    xml_text: str,
) -> list[dict]:

    root = ET.fromstring(
        clean_tally_xml(xml_text)
    )

    items = root.findall(
        ".//STOCKITEM"
    )

    result = []

    for item in items:

        parsed = normalize_keys(
            _parse_node(item)
        )

        if isinstance(parsed, dict):
            result.append(parsed)

    return result


# ---------------------------------------------------------------------------
# Raw XML saving
# ---------------------------------------------------------------------------

def save_raw_tally_xml(
    xml_text: str,
    dataset: str,
    fetched_at: datetime | None = None,
) -> Path:

    fetched_at = (
        fetched_at
        or datetime.now().astimezone()
    )

    day = fetched_at.strftime(
        "%Y-%m-%d"
    )

    timestamp = fetched_at.strftime(
        "%H%M%S_%f"
    )

    output_dir = (
        TALLY_RAW_DIR
        / dataset
        / day
    )

    output_dir.mkdir(
        parents=True,
        exist_ok=True,
    )

    output_path = (
        output_dir
        / f"{timestamp}.xml"
    )

    output_path.write_text(
        xml_text,
        encoding="utf-8",
    )

    return output_path

TALLY_JSON_DIR = Path("tally_json")

def _json_default(value):
    """
    Convert Python values used by the Tally staging mapper
    into JSON-safe values.

    Decimal is intentionally stored as a string.

    This is important for money/quantity values because
    converting Decimal -> float would introduce precision loss.

    date/datetime are stored as ISO strings.
    """

    if isinstance(value, Decimal):
        return str(value)

    if isinstance(value, (date, datetime)):
        return value.isoformat()

    raise TypeError(
        f"Object of type {type(value).__name__} "
        f"is not JSON serializable"
    )


def save_json(
    data,
    dataset: str,
    suffix: str = "",
    fetched_at: datetime | None = None,
) -> Path:
    """
    Save JSON alongside the corresponding Tally XML.

    Example:

        tally_json/
            sales_orders/
                2026-08-08/
                    123303_292933_staging.json
    """

    import json

    fetched_at = (
        fetched_at
        or datetime.now().astimezone()
    )

    day = fetched_at.strftime(
        "%Y-%m-%d"
    )

    timestamp = fetched_at.strftime(
        "%H%M%S_%f"
    )

    output_dir = (
        TALLY_JSON_DIR
        / dataset
        / day
    )

    output_dir.mkdir(
        parents=True,
        exist_ok=True,
    )

    suffix_text = (
        f"_{suffix}"
        if suffix
        else ""
    )

    output_path = (
        output_dir
        / f"{timestamp}{suffix_text}.json"
    )

    output_path.write_text(
        json.dumps(
            data,
            indent=2,
            ensure_ascii=False,
            default=_json_default,
        ),
        encoding="utf-8",
    )

    return output_path


def xml_to_staging_order_json(
    xml_text: str,
) -> dict:
    """
    Convert Tally voucher XML directly into
    application/staging field names.

    This does NOT touch the database.

    Output shape:

    {
        "tallymessage": [
            {
                "voucher_type": "Sales Order",
                "order_acceptance_id": "...",
                ...
                "items": [...]
            }
        ]
    }
    """

    normalized = xml_to_staging_json(
        xml_text
    )

    vouchers = normalized.get(
        "tallymessage",
        []
    )

    staging_orders = [voucher_to_staging_order(voucher) for voucher in normalized["tallymessage"]]

    return {
        "tallymessage": staging_orders
    }

# ---------------------------------------------------------------------------
# Staging DB ingestion
# ---------------------------------------------------------------------------

def stage_orders_to_db(
    staging_data: dict,
    session,
) -> dict:
    """
    Synchronize Tally staging data into PostgreSQL.

    Identity:
        tally_guid

    Tally owns:
        customer/order/item/financial snapshot fields.

    ERP owns:
        workflow status.

    Therefore:
        INSERT -> status = PENDING
        UPDATE -> preserve existing status

    Child items are replaced with the latest Tally snapshot.
    """

    vouchers = staging_data.get(
        "tallymessage",
        [],
    )

    inserted = 0
    updated = 0
    skipped = 0
    items_written = 0

    for order in vouchers:

        tally_guid = (
            order.get("tally_guid")
            or ""
        ).strip()

        if not tally_guid:
            skipped += 1
            continue

        # -----------------------------------------------------
        # INSERT / UPDATE HEADER
        # -----------------------------------------------------

        stmt = pg_insert(StagingOrderHeader).values(
        tally_guid=tally_guid,
        order_acceptance_id=order.get("order_acceptance_id"),
        order_acceptance_date=order.get("order_acceptance_date"),
        purchase_order_number=order.get("purchase_order_number"),
        billing_name=order.get("billing_name"),
        billing_address=order.get("billing_address"),
        payment_terms=order.get("payment_terms"),
        customer_code=order.get("customer_code"),
        dispatched_through=order.get("dispatched_through"),
        ordered_by=order.get("ordered_by"),
        packing_charges=order.get("packing_charges"),
        freight_charges=order.get("freight_charges"),
        tax_rate=order.get("tax_rate"),
        buyer_gstin=order.get("buyer_gstin"),
        destination=order.get("destination"),
        terms_of_delivery=order.get("terms_of_delivery"),
        tax_amount=order.get("tax_amount"),
        grand_total=order.get("grand_total"),
        state_name=order.get("state_name"),
        )

        update_values = {
            "order_acceptance_id": stmt.excluded.order_acceptance_id,
            "order_acceptance_date": stmt.excluded.order_acceptance_date,
            "purchase_order_number": stmt.excluded.purchase_order_number,
            "billing_name": stmt.excluded.billing_name,
            "billing_address": stmt.excluded.billing_address,
            "payment_terms": stmt.excluded.payment_terms,
            "customer_code": stmt.excluded.customer_code,
            "dispatched_through": stmt.excluded.dispatched_through,
            "ordered_by": stmt.excluded.ordered_by,
            "packing_charges": stmt.excluded.packing_charges,
            "freight_charges": stmt.excluded.freight_charges,
            "tax_rate": stmt.excluded.tax_rate,
            "buyer_gstin": stmt.excluded.buyer_gstin,
            "destination": stmt.excluded.destination,
            "terms_of_delivery": stmt.excluded.terms_of_delivery,
            "tax_amount": stmt.excluded.tax_amount,
            "grand_total": stmt.excluded.grand_total,
            "state_name": stmt.excluded.state_name,
        }
        stmt = stmt.on_conflict_do_update(index_elements=[StagingOrderHeader.tally_guid],set_=update_values,).returning(StagingOrderHeader.staging_id, StagingOrderHeader.status,)

        result = session.execute(stmt)

        staging_id, existing_status = result.one()

        # -----------------------------------------------------
        # Determine insert/update for reporting
        # -----------------------------------------------------

        if existing_status == "PENDING":
            # This isn't a perfect way to distinguish insert/update,
            # so don't rely on this for accounting.
            pass

        # -----------------------------------------------------
        # Replace child item snapshot
        # -----------------------------------------------------

        session.query(
            StagingOrderItem
        ).filter(
            StagingOrderItem.staging_header_id
            == staging_id
        ).delete(
            synchronize_session=False
        )

        for item in order.get("items", []):

            session.add(
                StagingOrderItem(
                    staging_header_id=staging_id,

                    item_code=item.get(
                        "item_code"
                    ),

                    additional_spec_text=item.get(
                        "additional_spec_text"
                    ),

                    hsn_code=item.get(
                        "hsn_code"
                    ),

                    quantity=item.get(
                        "quantity"
                    ),

                    rate=item.get(
                        "rate"
                    ),

                    discount_percentage=item.get(
                        "discount_percentage"
                    ),

                    amount=item.get(
                        "amount"
                    ),

                    due_date=item.get(
                        "due_date"
                    ),
                )
            )

            items_written += 1

        # For now count every successfully synchronized voucher
        # as processed. If you want exact inserted/updated counts,
        # we can add xmax/RETURNING logic later.

        inserted += 1

    session.flush()

    return {
        "received": len(vouchers),
        "processed": inserted,
        "skipped": skipped,
        "items_written": items_written,
    }