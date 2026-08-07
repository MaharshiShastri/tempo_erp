"""
services/tally_client.py

Single source of truth for talking to Tally's XML/HTTP interface.

Two request families, because Tally itself has two incompatible ways of
exporting data:

1. build_voucher_collection_xml() -- ad-hoc TDL COLLECTION over TYPE=Voucher.
   Use for anything that's fundamentally "a list of vouchers in a date
   range, optionally of one type": Sales Order, Purchase Order, Sales,
   Purchase, or Day Book (voucher_type=None => every type).

2. build_native_report_xml() -- Tally's built-in named reports (Trial
   Balance, Balance Sheet, Profit & Loss, Stock Summary, List of Accounts,
   Ledger Vouchers). These aren't voucher lists and don't share a schema,
   so we don't attempt to normalize them into the staging shape -- callers
   get back the generic parsed JSON for inspection/display only.

Everything downstream (normalize_keys, xml_to_staging_json,
voucher_to_preview_dict) only applies to family #1.
"""

import os
import re
import xml.etree.ElementTree as ET

import requests

TALLY_HOST = os.environ.get("TALLY_HOST", "http://192.168.0.119:9000")
TALLY_COMPANY = os.environ.get("TALLY_COMPANY", "TEMPO INSTRUMENTS PRIVATE LIMITED - (from 1-Apr-25)")
TALLY_TIMEOUT_SECONDS = int(os.environ.get("TALLY_TIMEOUT_SECONDS", "120"))

# Report names that are genuine ad-hoc voucher-type pulls (family #1).
# Value is the exact $VoucherTypeName to filter on, or None for "all types"
# (Day Book).
VOUCHER_TYPE_REPORTS = {
    "Sales Order": "Sales Order",
    "Purchase Order": "Purchase Order",
    "Sales": "Sales",
    "Purchase": "Purchase",
    "Day Book": None,
}

# Everything else falls back to the built-in-report pattern (family #2).
NATIVE_REPORTS = {
    "Trial Balance",
    "Profit & Loss",
    "Balance Sheet",
    "Stock Summary",
    "Ledger Vouchers",
    "List of Accounts",
}

FETCH_FIELDS = (
    "GUID,DATE,VOUCHERNUMBER,VOUCHERTYPENAME,PARTYLEDGERNAME,PARTYNAME,"
    "PARTYGSTIN,REFERENCE,REFERENCEDATE,BASICBUYERADDRESS,BASICORDERTERMS,"
    "BASICDUEDATEOFPYMT,BASICSHIPPEDBY,NARRATION,"
    "ALLINVENTORYENTRIES.LIST,LEDGERENTRIES.LIST"
)


# ---------------------------------------------------------------------------
# Request builders
# ---------------------------------------------------------------------------

def _xml_escape(value: str) -> str:
    return (value.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace('"', "&quot;"))


def build_voucher_collection_xml(voucher_type: str | None, from_date: str, to_date: str,company: str = TALLY_COMPANY,) -> str:
    """
    from_date / to_date: 'YYYY-MM-DD' or 'YYYYMMDD'.
    voucher_type=None -> no type filter, returns every voucher in range
    (Day Book). Date bounds are enforced INSIDE the filter formula via
    $$Date:##SVFROMDATE / ##SVTODATE -- plain SVFROMDATE/SVTODATE alone do
    not reliably bound an ad-hoc Voucher collection in this Tally version.
    """
    from_dt = from_date.replace("-", "")
    to_dt = to_date.replace("-", "")
    company_esc = _xml_escape(company)

    date_clause = "($Date &gt;= $$Date:##SVFROMDATE) AND ($Date &lt;= $$Date:##SVTODATE)"
    if voucher_type:
        type_esc = _xml_escape(voucher_type)
        formula_body = f'($VoucherTypeName = "{type_esc}") AND {date_clause}'
    else:
        formula_body = date_clause

    return (
        "<ENVELOPE><HEADER><VERSION>1</VERSION><TALLYREQUEST>EXPORT</TALLYREQUEST>"
        "<TYPE>COLLECTION</TYPE><ID>VoucherRangeCollection</ID></HEADER><BODY><DESC>"
        "<STATICVARIABLES><SVEXPORTFORMAT>$$SysName:XML</SVEXPORTFORMAT>"
        f"<SVFROMDATE>{from_dt}</SVFROMDATE><SVTODATE>{to_dt}</SVTODATE>"
        f"<SVCURRENTDATE>{to_dt}</SVCURRENTDATE>"
        f"<SVCURRENTCOMPANY>{company_esc}</SVCURRENTCOMPANY></STATICVARIABLES>"
        "<TDL><TDLMESSAGE>"
        '<COLLECTION NAME="VoucherRangeCollection" ISMODIFY="No">'
        f"<TYPE>Voucher</TYPE><FILTER>VoucherRangeFilter</FILTER>"
        f"<FETCH>{FETCH_FIELDS}</FETCH></COLLECTION>"
        f'<SYSTEM TYPE="Formulae" NAME="VoucherRangeFilter">{formula_body}</SYSTEM>'
        "</TDLMESSAGE></TDL></DESC></BODY></ENVELOPE>"
    )


def build_native_report_xml(report_name: str, from_date: str | None = None, to_date: str | None = None, ledger_name: str | None = None, company: str = TALLY_COMPANY,) -> str:
    """
    Built-in Tally report export (Trial Balance, Balance Sheet, P&L, Stock
    Summary, List of Accounts, Ledger Vouchers). Report names must match
    Tally's internal names exactly -- these vary by Tally version, so treat
    this as best-effort and confirm against your installation if a report
    comes back with a LINEERROR.
    """
    static_vars = ['<SVEXPORTFORMAT>$$SysName:XML</SVEXPORTFORMAT>']
    if from_date:
        static_vars.append(f"<SVFROMDATE>{from_date.replace('-', '')}</SVFROMDATE>")
    if to_date:
        static_vars.append(f"<SVTODATE>{to_date.replace('-', '')}</SVTODATE>")
    if company:
        static_vars.append(f"<SVCURRENTCOMPANY>{_xml_escape(company)}</SVCURRENTCOMPANY>")
    if ledger_name:
        static_vars.append(f"<SVLEDGERNAME>{_xml_escape(ledger_name)}</SVLEDGERNAME>")

    static_vars_xml = "".join(static_vars)

    return (
        "<ENVELOPE><HEADER><TALLYREQUEST>Export Data</TALLYREQUEST></HEADER>"
        "<BODY><EXPORTDATA><REQUESTDESC>"
        f"<REPORTNAME>{_xml_escape(report_name)}</REPORTNAME>"
        f"<STATICVARIABLES>{static_vars_xml}</STATICVARIABLES>"
        "</REQUESTDESC></EXPORTDATA></BODY></ENVELOPE>"
    )


def build_single_voucher_xml(guid: str) -> str:
    """Full exploded detail for one voucher by GUID -- family #2 style (Object/SUBTYPE)."""
    guid_esc = _xml_escape(guid)
    return (
        "<ENVELOPE><HEADER><TALLYREQUEST>Export</TALLYREQUEST><TYPE>Object</TYPE>"
        f"<SUBTYPE>Voucher</SUBTYPE><ID>{guid_esc}</ID></HEADER>"
        "<BODY><DESC><STATICVARIABLES><EXPLODEFLAG>Yes</EXPLODEFLAG>"
        "<SVEXPORTFORMAT>$$SysName:XML</SVEXPORTFORMAT></STATICVARIABLES></DESC></BODY></ENVELOPE>"
    )


# ---------------------------------------------------------------------------
# Sending
# ---------------------------------------------------------------------------

def send_to_tally(xml_payload: str, tally_url: str = TALLY_HOST) -> str:
    response = requests.post(tally_url, data=xml_payload.encode("utf-8"), headers={"Content-Type": "text/xml"}, timeout=TALLY_TIMEOUT_SECONDS,)
    response.raise_for_status()
    text = response.text
    if "<LINEERROR>" in text or "Unknown Request" in text:
        raise ValueError(f"Tally rejected the request: {text[:500]}")
    return text


# ---------------------------------------------------------------------------
# XML cleaning + generic parsing
# ---------------------------------------------------------------------------

_CONTROL_CHAR_DECIMAL = re.compile(r"&#(?:0|[1-8]|11|12|1[4-9]|2[0-9]|3[01]);")
_CONTROL_CHAR_HEX = re.compile(r"&#x(?:0?[0-8]|0?B|0?C|0?[E-F]|1[0-9A-F]);", re.IGNORECASE)


def clean_tally_xml(xml_text: str) -> str:
    """
    Tally's raw export has a few things standard XML parsers choke on:
    - Illegal control-character entity references (&#4; etc.)
    - Custom "UDF:FieldName" tags with an undeclared namespace prefix
      (ElementTree raises 'unbound prefix' on these)
    - Loose & that isn't part of a valid entity
    """
    cleaned = _CONTROL_CHAR_DECIMAL.sub("", xml_text)
    cleaned = _CONTROL_CHAR_HEX.sub("", cleaned)
    cleaned = cleaned.replace("UDF:", "UDF_")
    cleaned = cleaned.replace("&", "&amp;").replace("&amp;amp;", "&amp;")
    return cleaned


def _parse_node(node):
    children = list(node)
    if not children:
        return node.text.strip() if node.text else ""

    result = {}
    for child in children:
        if child.tag not in result:
            result[child.tag] = _parse_node(child)
        else:
            if not isinstance(result[child.tag], list):
                result[child.tag] = [result[child.tag]]
            result[child.tag].append(_parse_node(child))
    return result


def tally_xml_to_json(xml_string: str) -> dict:
    """Generic, structure-preserving XML->dict. Keys keep Tally's raw casing
    (VOUCHERNUMBER, ALLINVENTORYENTRIES.LIST, ...). Use for family #2
    reports / raw display -- NOT for staging ingestion (see
    xml_to_staging_json for that)."""
    try:
        root = ET.fromstring(clean_tally_xml(xml_string))
        return {root.tag: _parse_node(root)}
    except Exception as e:
        return {"error": str(e), "raw": xml_string[:2000]}


# ---------------------------------------------------------------------------
# Normalization for staging ingestion (family #1 / voucher collections only)
# ---------------------------------------------------------------------------

def normalize_keys(obj):
    """
    Recursively lowercase every dict key and strip a trailing '.LIST'.
    'ALLINVENTORYENTRIES.LIST' -> 'allinventoryentries'
    'VOUCHERNUMBER'            -> 'vouchernumber'

    Also collapses Tally's "wrapper == child name" pattern, e.g.
    BASICBUYERADDRESS.LIST containing repeated <BASICBUYERADDRESS> children:
    after stripping ".LIST" both keys collide, so { "basicbuyeraddress":
    { "basicbuyeraddress": [...] } } is flattened to
    { "basicbuyeraddress": [...] }.
    """
    if isinstance(obj, dict):
        normalized = {}
        for key, value in obj.items():
            clean_key = key.lower()
            if clean_key.endswith(".list"):
                clean_key = clean_key[: -len(".list")]
            cleaned_value = normalize_keys(value)
            if (
                isinstance(cleaned_value, dict)
                and len(cleaned_value) == 1
                and clean_key in cleaned_value
            ):
                cleaned_value = cleaned_value[clean_key]
            normalized[clean_key] = cleaned_value
        return normalized
    if isinstance(obj, list):
        return [normalize_keys(item) for item in obj]
    return obj


def xml_to_staging_json(xml_text: str) -> dict:
    """
    Parse a voucher-collection response into {"tallymessage": [voucher, ...]}
    with fully normalized (lowercase, no ".LIST") keys -- the exact shape
    database.repository.EDBR.ingest_tally_json() expects.
    """
    root = ET.fromstring(clean_tally_xml(xml_text))

    # <CMPINFO> contains an unrelated same-named <VOUCHER>0</VOUCHER> COUNT
    # field. Only real voucher records carry a VCHTYPE attribute.
    vouchers = [v for v in root.findall(".//VOUCHER") if "VCHTYPE" in v.attrib]

    voucher_dicts = [_parse_node(v) for v in vouchers]
    normalized = [normalize_keys(v) for v in voucher_dicts]
    return {"tallymessage": normalized}


# ---------------------------------------------------------------------------
# Lightweight preview shape (for UI review before committing to staging --
# does NOT touch the database; EDBR.ingest_tally_json does the real commit)
# ---------------------------------------------------------------------------

def _parse_qty(qty):
    if not qty:
        return 0
    m = re.search(r"[\d.]+", str(qty))
    return float(m.group()) if m else 0


def _parse_rate(rate):
    if not rate:
        return 0
    m = re.search(r"[\d.]+", str(rate))
    return float(m.group()) if m else 0


def _as_list(value):
    if value is None:
        return []
    if isinstance(value, list):
        return value
    if isinstance(value, dict):
        return [value]
    return [value]


def _join_text_list(value):
    items = _as_list(value)
    return " ".join(str(x) for x in items if isinstance(x, str)).strip()


def voucher_to_preview_dict(voucher: dict) -> dict:
    """
    voucher: one already-normalized entry from xml_to_staging_json()'s
    "tallymessage" list. Produces the flat shape the React upload/preview
    tables expect (purchase_order_number, billing_name, items[...]), for
    on-screen review BEFORE anything is written to the staging tables.
    """
    date_str = voucher.get("date", "")
    order_date = None
    if date_str:
        from datetime import datetime
        try:
            order_date = datetime.strptime(date_str, "%Y%m%d").date().isoformat()
        except ValueError:
            order_date = date_str  # leave as-is rather than crash the preview

    address = _join_text_list(voucher.get("basicbuyeraddress"))
    payment_terms = _join_text_list(voucher.get("basicorderterms"))

    items = []
    for item in _as_list(voucher.get("allinventoryentries")):
        items.append(
            {
                "item_code": item.get("stockitemname"),
                "additional_spec_text": _join_text_list(item.get("basicuserdescription")),
                "hsn_code": item.get("gsthsnname", ""),
                "quantity": _parse_qty(item.get("billedqty") or item.get("actualqty")),
                "rate": _parse_rate(item.get("rate")),
                "discount_percentage": 0,
            }
        )

    return {
        "purchase_order_number": voucher.get("vouchernumber"),
        "order_acceptance_date": order_date,
        "customer_code": voucher.get("partyledgername"),
        "billing_name": voucher.get("partyname") or voucher.get("partyledgername"),
        "billing_address": address,
        "payment_terms": payment_terms,
        "reference": voucher.get("reference"),
        "items": items,
    }


# ---------------------------------------------------------------------------
# One-call convenience wrappers
# ---------------------------------------------------------------------------

def fetch_voucher_range(
    voucher_type: str | None,
    from_date: str,
    to_date: str,
    company: str = TALLY_COMPANY,
    tally_url: str = TALLY_HOST,
) -> str:
    payload = build_voucher_collection_xml(voucher_type, from_date, to_date, company)
    return send_to_tally(payload, tally_url)


def fetch_and_stage_json(
    voucher_type: str | None,
    from_date: str,
    to_date: str,
    company: str = TALLY_COMPANY,
    tally_url: str = TALLY_HOST,
) -> dict:
    """Fetch + normalize in one call -> {"tallymessage": [...]}."""
    raw_xml = fetch_voucher_range(voucher_type, from_date, to_date, company, tally_url)
    return xml_to_staging_json(raw_xml)


def fetch_and_preview(
    voucher_type: str | None,
    from_date: str,
    to_date: str,
    company: str = TALLY_COMPANY,
    tally_url: str = TALLY_HOST,
) -> dict:
    """Fetch + normalize + flatten to preview shape, plus raw XML for display."""
    raw_xml = fetch_voucher_range(voucher_type, from_date, to_date, company, tally_url)
    staged = xml_to_staging_json(raw_xml)
    preview = [voucher_to_preview_dict(v) for v in staged["tallymessage"]]
    return {"normalized": preview, "raw": raw_xml, "staging_json": staged}


# ---------------------------------------------------------------------------
# Known gaps in EDBR.ingest_tally_json() worth patching there directly
# (not fixed here since that's your tested DB-commit code, just flagging):
#
# 1. `ledger.get("ispartyledger", False)` never fires -- ISPARTYLEDGER is
#    not present on voucher-level LEDGERENTRIES.LIST in this Tally version.
#    grand_total silently stays 0.0. Fix: match by name instead --
#    `elif ledger.get("ledgername") == voucher.get("partyledgername"):`
#
# 2. `orderduedate` (inside batchallocations) is formatted "24-Jun-26"
#    (DD-Mon-YY), not "20260624" like every other Tally date field.
#    `_parse_tally_date()`'s `strptime(date_str, "%Y%m%d")` will raise on
#    it. Needs its own parser: `datetime.strptime(date_str, "%d-%b-%y")`.
# ---------------------------------------------------------------------------