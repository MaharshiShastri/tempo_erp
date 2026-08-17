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
    voucher_type: str | None,
    from_date: str,
    to_date: str,
    company: str = TALLY_COMPANY,
) -> str:
    """
    Build a Tally voucher collection request.
 
    from_date / to_date: 'YYYY-MM-DD' or 'YYYYMMDD'.
    voucher_type=None -> no type filter, returns every voucher in range
    (Day Book).
 
    Explicitly fetches cancellation/deletion flags because the
    service needs to distinguish:
 
        valid order
        cancelled order
        deleted voucher
 
    Date bounds are enforced INSIDE the filter formula via
    $$Date:##SVFROMDATE / ##SVTODATE -- plain SVFROMDATE/SVTODATE alone,
    or $Date >= ##SVFROMDATE without the $$Date: type-coercion wrapper,
    do not reliably bound an ad-hoc Voucher collection in this Tally
    version (the comparison silently matches everything instead of
    raising an error, which makes this bug easy to miss).
    """
    from_dt = from_date.replace("-", "")
    to_dt = to_date.replace("-", "")
    company_esc = _xml_escape(company)
 
    date_clause = "($Date &gt;= $$Date:##SVFROMDATE) AND ($Date &lt;= $$Date:##SVTODATE)"
    if voucher_type:
        voucher_type_esc = _xml_escape(voucher_type)
        filter_formula = f'($VoucherTypeName = "{voucher_type_esc}") AND {date_clause}'
    else:
        filter_formula = date_clause
 
    print("Date range from: ", from_dt, " to: ", to_dt)
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
                            <FETCH>DATE,
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
                            <FILTER>VoucherRangeFilter</FILTER>
    
                        </COLLECTION>
    
                        <SYSTEM
                            TYPE="Formulae"
                            NAME="VoucherRangeFilter"
                        >{filter_formula}</SYSTEM>
    
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
        voucher_to_order()
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


def _parse_date(value): 
    """ Parse dates coming from different Tally fields. Tally / user-entered dates may appear as: 20260406 
    2026-04-06 
    06-Apr-26 
    06-Apr-2026 
    30.04.2026 
    30/04/2026 
    30-04-2026 """ 
    if value is None: 
        return None # Tally wrappers / lists 

    if isinstance(value, dict): # Prefer the actual field value over metadata. 
        values = [ nested for key, nested in value.items() if key.lower() != "type" ] 
        for nested in values: 
            parsed = _parse_date(nested) 
            if parsed: 
                return parsed 

            return None 

    if isinstance(value, list): 
        for item in value: 
            parsed = _parse_date(item) 
            if parsed: 
                return parsed 
        return None 

    text = str(value).strip() 
    if not text: 
        return None # Tally commonly returns YYYYMMDD. 
    formats = ( "%Y%m%d", "%Y-%m-%d", "%d-%b-%y", "%d-%b-%Y", "%d.%m.%Y", "%d/%m/%Y", "%d-%m-%Y", "%d.%m.%y", "%d/%m/%y", "%d-%m-%y", ) 
    for fmt in formats: 
        try: 
            return datetime.strptime( text, fmt, ).date() 

        except ValueError: 
            pass 

    return None
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