# services/tally_client.py

"""
Low-level Tally XML/HTTP client.

Responsibilities
----------------

1. Build Tally requests.
2. Send HTTP requests to Tally.
3. Clean malformed Tally XML.
4. Parse XML.
5. Normalize Tally keys.
6. Convert Tally vouchers into application staging dictionaries.
7. Convert Tally StockItems into normalized dictionaries.
8. Persist raw XML / intermediate JSON artifacts.

NOT responsible for:
    - database sessions;
    - PostgreSQL;
    - ORM models;
    - ClientCompany;
    - ItemMaster persistence;
    - StagingOrder persistence.

Database/application persistence belongs to tally_service.
"""

from __future__ import annotations

import html
import json
import os
import re
import xml.etree.ElementTree as ET

from datetime import date, datetime
from decimal import Decimal
from pathlib import Path

import requests


# ===========================================================================
# Configuration
# ===========================================================================

TALLY_RAW_DIR = Path(os.environ.get("TALLY_RAW_DIR", "tally_raw",))

TALLY_JSON_DIR = Path(os.environ.get("TALLY_JSON_DIR", "tally_json",))

TALLY_HOST = os.environ.get("TALLY_HOST", "http://localhost:9000",)

TALLY_COMPANY = os.environ.get("TALLY_COMPANY", "TEMPO INSTRUMENTS PRIVATE LIMITED - (from 1-Apr-25)",)

TALLY_TIMEOUT_SECONDS = int(os.environ.get("TALLY_TIMEOUT_SECONDS", "120",))


# ===========================================================================
# XML escaping
# ===========================================================================

def _xml_escape(value: str) -> str:
    """
    Escape arbitrary text for insertion into XML.

    html.escape() correctly handles:
        &
        <
        >
        "
        '
    """

    return html.escape(str(value), quote=True,)


# ===========================================================================
# Tally XML cleaning
# ===========================================================================

_CONTROL_CHAR_DECIMAL = re.compile(r"&#(?:0|[1-8]|11|12|1[4-9]|2[0-9]|3[01]);")

_CONTROL_CHAR_HEX = re.compile(r"&#x(?:0?[0-8]|0?B|0?C|0?[E-F]|1[0-9A-F]);", re.IGNORECASE,)

_BARE_AMPERSAND = re.compile(r"&(?!(?:amp|lt|gt|apos|quot);|#\d+;|#x[0-9A-Fa-f]+;)")


def clean_tally_xml(xml_text: str,) -> str:
    """
    Clean common malformed constructs found in Tally XML.
    """

    cleaned = _CONTROL_CHAR_DECIMAL.sub("", xml_text,)

    cleaned = _CONTROL_CHAR_HEX.sub("", cleaned,)

    # Tally UDF tags can contain undeclared namespace prefixes.
    cleaned = cleaned.replace("UDF:", "UDF_",)

    # Escape genuinely bare ampersands.
    cleaned = _BARE_AMPERSAND.sub("&amp;", cleaned,)

    return cleaned


# ===========================================================================
# XML parser
# ===========================================================================

def _parse_node(node: ET.Element,):
    """
    Structure-preserving recursive XML parser.

    XML attributes are preserved.

    Example:

        <VOUCHER VCHTYPE="Sales Order" ISCANCELLED="Yes">
            ...
        </VOUCHER>

    becomes a dictionary containing:

        {
            "VCHTYPE": "Sales Order",
            "ISCANCELLED": "Yes",
            ...
        }
    """

    children = list(node)

    if not children:
        return (node.text.strip() if node.text else "")

    result = dict(node.attrib)

    for child in children:

        value = _parse_node(child)

        if child.tag not in result:

            result[child.tag] = value

        else:

            if not isinstance(result[child.tag], list,):
                result[child.tag] = [result[child.tag]]

            result[child.tag].append(value)

    return result


def tally_xml_to_json(xml_string: str,) -> dict:
    """
    Generic structure-preserving XML -> dict.
    """

    try:

        root = ET.fromstring(clean_tally_xml(
                xml_string
            )
        )

        return {
            root.tag: _parse_node(root)
        }

    except Exception as exc:

        return {
            "error": str(exc),
            "raw": xml_string[:2000],
        }


# ===========================================================================
# Key normalization
# ===========================================================================

def normalize_keys(obj,):
    """
    Normalize Tally keys.

    Examples:

        VOUCHERNUMBER
            -> vouchernumber

        ALLINVENTORYENTRIES.LIST
            -> allinventoryentries

    Repeated fields become lists.
    """

    if isinstance(
        obj,
        dict,
    ):

        normalized = {}

        for key, value in obj.items():

            clean_key = key.lower()

            if clean_key.endswith(
                ".list"
            ):
                clean_key = clean_key[:-5]

            cleaned_value = normalize_keys(
                value
            )

            # Collapse wrappers such as:
            #
            # {
            #     "basicbuyeraddress": {
            #         "basicbuyeraddress": [...]
            #     }
            # }
            if (
                isinstance(
                    cleaned_value,
                    dict,
                )
                and len(cleaned_value) == 1
                and clean_key in cleaned_value
            ):
                cleaned_value = (
                    cleaned_value[clean_key]
                )

            if clean_key in normalized:

                if not isinstance(
                    normalized[clean_key],
                    list,
                ):
                    normalized[clean_key] = [
                        normalized[clean_key]
                    ]

                if isinstance(
                    cleaned_value,
                    list,
                ):
                    normalized[clean_key].extend(
                        cleaned_value
                    )
                else:
                    normalized[clean_key].append(
                        cleaned_value
                    )

            else:

                normalized[clean_key] = (
                    cleaned_value
                )

        return normalized

    if isinstance(
        obj,
        list,
    ):

        return [
            normalize_keys(item)
            for item in obj
        ]

    return obj


# ===========================================================================
# Voucher request
# ===========================================================================

def build_voucher_collection_xml(
    voucher_type: str,
    from_date: str,
    to_date: str,
    company: str = TALLY_COMPANY,
) -> str:
    """
    Build a Tally voucher collection request.

    Explicitly fetches cancellation/deletion flags because the
    service needs to distinguish:

        valid order
        cancelled order
        deleted voucher
    """

    from_dt = from_date.replace(
        "-",
        "",
    )

    to_dt = to_date.replace(
        "-",
        "",
    )

    voucher_type_esc = _xml_escape(
        voucher_type
    )

    company_esc = _xml_escape(
        company
    )

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
                            VCHTYPE,
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

                            ISCANCELLED,
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
""".strip()


# ===========================================================================
# HTTP
# ===========================================================================

def send_to_tally(
    xml_payload: str,
    tally_url: str = TALLY_HOST,
) -> str:
    """
    Send XML to Tally and return the raw response.
    """

    response = requests.post(
        tally_url,
        data=xml_payload.encode(
            "utf-8"
        ),
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


# ===========================================================================
# Voucher fetch
# ===========================================================================

def fetch_voucher_range(
    voucher_type: str | None,
    from_date: str,
    to_date: str,
    company: str = TALLY_COMPANY,
    tally_url: str = TALLY_HOST,
) -> str:
    """
    Fetch a voucher range from Tally.
    """

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


# ===========================================================================
# Voucher XML -> normalized JSON
# ===========================================================================

def xml_to_staging_json(
    xml_text: str,
) -> dict:
    """
    Parse Tally voucher XML into normalized Tally dictionaries.

    This is still Tally representation.

    Application field mapping happens in:
        voucher_to_staging_order()
    """

    root = ET.fromstring(
        clean_tally_xml(
            xml_text
        )
    )

    vouchers = [
        voucher
        for voucher in root.findall(
            ".//VOUCHER"
        )
        if (
            "VCHTYPE" in voucher.attrib
            or "VOUCHERTYPENAME" in voucher.attrib
        )
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


# ===========================================================================
# Helpers
# ===========================================================================

def _as_list(
    value,
):
    """
    Normalize a Tally collection into a list.
    """

    if value is None:
        return []

    if isinstance(
        value,
        list,
    ):
        return value

    if isinstance(
        value,
        dict,
    ):
        return [value]

    return [value]


def _join_text_list(
    value,
) -> str:
    """
    Convert Tally text/list/wrapper structures into clean text.

    Never stringify Tally metadata dictionaries directly.
    """

    if value is None:
        return ""

    if isinstance(
        value,
        dict,
    ):

        meaningful_values = []

        for key, nested_value in value.items():

            if key.lower() in {
                "type",
                "languageid",
            }:
                continue

            text = _join_text_list(
                nested_value
            )

            if text:
                meaningful_values.append(
                    text
                )

        return "\n".join(
            meaningful_values
        ).strip()

    if isinstance(
        value,
        list,
    ):

        return "\n".join(
            _join_text_list(item)
            for item in value
            if item is not None
            and _join_text_list(item)
        ).strip()

    return str(value).strip()


def _parse_decimal(
    value,
) -> Decimal:
    """
    Parse a Tally numeric field.
    """

    if value is None:
        return Decimal("0")

    text = str(value).strip()

    if not text:
        return Decimal("0")

    text = text.replace(
        ",",
        "",
    )

    match = re.search(
        r"[-+]?\d+(?:\.\d+)?",
        text,
    )

    if not match:
        return Decimal("0")

    return Decimal(
        match.group()
    )


def _parse_date(
    value,
):
    """
    Parse common Tally date formats.
    """

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


# ===========================================================================
# Voucher -> staging
# ===========================================================================

def voucher_to_staging_order(
    voucher: dict,
) -> dict:
    """
    Convert normalized Tally voucher -> application staging shape.

    This function does NOT touch PostgreSQL.
    """

    voucher_type = (
        voucher.get("vouchertypename")
        or voucher.get("vchtype")
        or ""
    )

    tally_guid = str(
        voucher.get("guid")
        or ""
    ).strip()

    order_acceptance_id = (
        voucher.get("vouchernumber")
    )

    order_acceptance_date = _parse_date(
        voucher.get("date")
    )

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
        voucher.get(
            "basicbuyeraddress"
        )
    )

    terms_of_delivery = _join_text_list(
        voucher.get(
            "basicorderterms"
        )
    )

    payment_terms = (
        voucher.get(
            "basicduedateofpymt"
        )
        or ""
    )

    dispatched_through = (
        voucher.get(
            "basicshippedby"
        )
        or ""
    )

    state_name = (
        voucher.get(
            "statename"
        )
        or ""
    )

    buyer_gstin = (
        voucher.get(
            "partygstin"
        )
        or ""
    )

    destination = (
        voucher.get(
            "placeofsupply"
        )
        or ""
    )

    # -------------------------------------------------------------------
    # Items
    # -------------------------------------------------------------------

    items = []

    inventory_entries = _as_list(
        voucher.get(
            "allinventoryentries"
        )
    )

    for inventory in inventory_entries:

        if not isinstance(
            inventory,
            dict,
        ):
            continue

        stockitemname = (
            inventory.get(
                "stockitemname"
            )
            or ""
        )

        quantity = _parse_decimal(
            inventory.get(
                "actualqty"
            )
        )

        rate = _parse_decimal(
            inventory.get(
                "rate"
            )
        )

        discount = _parse_decimal(
            inventory.get(
                "discount"
            )
        )

        amount = abs(
            _parse_decimal(
                inventory.get(
                    "amount"
                )
            )
        )

        # Tally may contain item-specific description/user
        # description structures.
        additional_spec_text = _join_text_list(
            inventory.get(
                "basicuserdescription"
            )
            or inventory.get(
                "description"
            )
        )

        hsn_code = (
            inventory.get(
                "gsthsncode"
            )
            or inventory.get(
                "gsthsnname"
            )
            or ""
        )

        due_date = None

        # Some Tally configurations expose due dates through
        # inventory allocations. Keep this conservative until
        # the exact allocation shape is confirmed.
        #
        # We therefore leave due_date as None rather than
        # inventing a date.

        items.append(
            {
                "item_code": stockitemname,
                "additional_spec_text": (
                    additional_spec_text
                ),
                "hsn_code": hsn_code,
                "quantity": quantity,
                "rate": rate,
                "discount_percentage": discount,
                "amount": amount,
                "due_date": due_date,
            }
        )

    # -------------------------------------------------------------------
    # Ledger entries
    # -------------------------------------------------------------------

    freight_charges = Decimal("0")
    tax_amount = Decimal("0")
    grand_total = Decimal("0")

    ledger_entries = _as_list(
        voucher.get(
            "ledgerentries"
        )
    )

    for ledger in ledger_entries:

        if not isinstance(
            ledger,
            dict,
        ):
            continue

        ledger_name = (
            ledger.get(
                "ledgername"
            )
            or ""
        ).strip()

        ledger_name_upper = (
            ledger_name.upper()
        )

        ledger_amount = _parse_decimal(
            ledger.get(
                "amount"
            )
        )

        absolute_amount = abs(
            ledger_amount
        )

        if (
            ledger_name.casefold()
            == "freight charges".casefold()
        ):
            freight_charges += (
                absolute_amount
            )

        if any(
            tax_name in ledger_name_upper
            for tax_name in (
                "CGST",
                "SGST",
                "IGST",
            )
        ):
            tax_amount += (
                absolute_amount
            )

        # Existing application behavior treats ledger totals
        # as contributing to the staging financial snapshot.
        grand_total += (
            absolute_amount
        )

    return {
        "voucher_type": voucher_type,

        "tally_guid": tally_guid,

        "order_acceptance_id": (
            order_acceptance_id
        ),

        "order_acceptance_date": (
            order_acceptance_date
        ),

        "purchase_order_number": (
            purchase_order_number
        ),

        "purchase_order_date": None,

        "billing_name": billing_name,

        "billing_address": billing_address,

        "payment_terms": payment_terms,

        # Insert default only. Service preserves existing ERP status
        # during an update.
        "status": "PENDING",

        "customer_code": customer_code,

        "dispatched_through": (
            dispatched_through
        ),

        "ordered_by": "",

        "packing_charges": Decimal("0"),

        "freight_charges": (
            freight_charges
        ),

        "tax_rate": Decimal("18"),

        "buyer_gstin": buyer_gstin,

        "destination": destination,

        "terms_of_delivery": (
            terms_of_delivery
        ),

        "tax_amount": tax_amount,

        "grand_total": grand_total,

        "state_name": state_name,

        "items": items,
    }


# ===========================================================================
# Item Master
# ===========================================================================

def build_stock_item_collection_xml(
    company: str = TALLY_COMPANY,
) -> str:
    """
    Build StockItem collection request.
    """

    company_esc = _xml_escape(
        company
    )

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
    """
    Fetch StockItem collection from Tally.
    """

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
    Keep only StockItems whose NAME starts with prefix.
    """

    prefix = (
        name_prefix
        .strip()
        .casefold()
    )

    root = ET.fromstring(
        clean_tally_xml(
            xml_text
        )
    )

    for parent in root.iter():

        for stock_item in list(
            parent
        ):

            if stock_item.tag != "STOCKITEM":
                continue

            name = (
                stock_item.attrib
                .get(
                    "NAME",
                    "",
                )
                .strip()
            )

            if not name.casefold().startswith(
                prefix
            ):
                parent.remove(
                    stock_item
                )

    return ET.tostring(
        root,
        encoding="unicode",
    )


def xml_to_item_master_json(
    xml_text: str,
) -> list[dict]:
    """
    Convert StockItem XML -> normalized dictionaries.
    """

    root = ET.fromstring(
        clean_tally_xml(
            xml_text
        )
    )

    items = root.findall(
        ".//STOCKITEM"
    )

    result = []

    for item in items:

        parsed = normalize_keys(
            _parse_node(item)
        )

        if isinstance(
            parsed,
            dict,
        ):
            result.append(
                parsed
            )

    return result


# ===========================================================================
# Raw XML persistence
# ===========================================================================

def save_raw_tally_xml(
    xml_text: str,
    dataset: str,
    fetched_at: datetime | None = None,
) -> Path:
    """
    Save raw/filtered Tally XML.

    Directory:

        tally_raw/
            dataset/
                YYYY-MM-DD/
                    HHMMSS_microseconds.xml
    """

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


# ===========================================================================
# JSON persistence
# ===========================================================================

def _json_default(
    value,
):
    """
    Convert Decimal/date/datetime to JSON-safe values.

    Decimal remains a string intentionally.
    """

    if isinstance(
        value,
        Decimal,
    ):
        return str(value)

    if isinstance(
        value,
        (
            date,
            datetime,
        ),
    ):
        return value.isoformat()

    raise TypeError(
        f"Object of type "
        f"{type(value).__name__} "
        f"is not JSON serializable"
    )


def save_json(
    data,
    dataset: str,
    suffix: str = "",
    fetched_at: datetime | None = None,
) -> Path:
    """
    Save normalized/staging JSON.
    """

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