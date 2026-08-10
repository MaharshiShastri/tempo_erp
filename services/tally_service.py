"""
Application service for the Tally synchronization pipeline.

## Architecture

tally_fetcher
    -> tally_service
        -> tally_client
            -> Tally HTTP / XML / JSON helpers

The service owns:

    Tally response
        -> raw XML persistence
        -> normalized JSON
        -> application mapping
        -> ItemMaster upsert
        -> StagingOrderHeader upsert
        -> StagingOrderItem replacement
        -> cancellation handling

NOT responsible for:

    - Tally HTTP implementation;
    - XML parsing;
    - ClientCompany creation/update;
    - Sales/client master data;
    - client contact information;
    - client address maintenance.

IMPORTANT CLIENT OWNERSHIP RULE
--------------------------------

ClientCompany is maintained exclusively by the Sales team.

Tally synchronization MUST NOT:

    - create ClientCompany records;
    - update ClientCompany records;
    - populate client contact information;
    - populate client address information;
    - infer client city/pincode/contact details;
    - delete ClientCompany records.

Tally data is used only for ERP/order synchronization.

The staging order may contain Tally-provided customer/order fields
such as customer_code, billing_name, billing_address, state_name,
buyer_gstin, etc. These fields belong to the Tally order snapshot and
must NOT be treated as ClientCompany master-data updates.

Database persistence belongs to this service.
"""

from __future__ import annotations

import re

from datetime import datetime
from decimal import Decimal

from sqlalchemy import delete
from sqlalchemy.dialects.postgresql import insert as pg_insert

from database.models import (
    ItemMaster,
    StagingOrderHeader,
    StagingOrderItem,
)

from services.tally_client import (
    fetch_item_master,
    fetch_voucher_range,
    filter_item_master_xml,
    save_raw_tally_xml,
    save_json,
    xml_to_item_master_json,
    xml_to_staging_json,
    voucher_to_staging_order,
)


# ===========================================================================
# Generic helpers
# ===========================================================================


def _clean_text(value) -> str:
    """
    Convert a Tally scalar into a clean string.

    Empty values become "".
    """

    if value is None:
        return ""

    return str(value).strip()


def _parse_decimal(value, default: Decimal | None = None,) -> Decimal | None:
    """
    Parse Tally numeric values safely.

    Examples:

        1,234.50
        72385.00/Nos.
        -259192.90
    """

    if value is None:
        return default

    text = _clean_text(value)

    if not text:
        return default

    text = text.replace(",", "")

    match = re.search(r"[-+]?\d+(?:\.\d+)?", text,)

    if not match:
        return default

    return Decimal(match.group())


def _parse_integer(value, default: int = 0,) -> int:
    """
    Parse a Tally quantity/stock value into an integer.
    """

    parsed = _parse_decimal(value)

    if parsed is None:
        return default

    return int(parsed)


# ===========================================================================
# Item Master persistence
# ===========================================================================


def _map_tally_item_to_application(item: dict,) -> dict | None:
    """
    Convert normalized Tally StockItem -> ItemMaster schema.

    Current application ItemMaster schema includes:

        item_code
        item_name
        item_group
        rate
        unit_measure
        additional_spec_text
        hsn_code
        revision_no
        available_stock

    Tally currently provides:

        NAME
        PARENT
        BASEUNITS
        GSTHSNCODE
        CLOSINGBALANCE
        DESCRIPTION

    Tally's GSTRATE is NOT treated as item selling price.
    """

    item_name = _clean_text(item.get("name"))

    if not item_name:
        return None

    return {
        "item_code": item_name,

        "item_name": item_name,

        "item_group": (_clean_text(item.get("parent")) or None),

        "unit_measure": (_clean_text(item.get("baseunits"))or "NOS"),

        "additional_spec_text": (_clean_text(item.get("description"))or None),

        "hsn_code": (_clean_text(item.get("gsthsncode"))or None),

        "available_stock": _parse_integer(item.get("closingbalance"), default=0,),
    }


def upsert_item_master(session, items: list[dict],) -> dict:
    """
    Upsert Tally StockItems into ItemMaster.

    Tally is authoritative for:

        - item name
        - item group
        - unit
        - specification
        - HSN
        - available stock

    Tally's GSTRATE is NOT treated as item selling price.

    Existing ItemMaster.rate is therefore preserved unless another
    authoritative pricing source is introduced.
    """

    upserted = 0
    skipped = 0

    for tally_item in items:

        mapped = _map_tally_item_to_application(tally_item)

        if not mapped:
            skipped += 1
            continue

        item_code = mapped["item_code"]

        stmt = pg_insert(ItemMaster).values(
            item_code=item_code,
            item_name=mapped["item_name"],
            item_group=mapped["item_group"],
            unit_measure=mapped["unit_measure"],
            additional_spec_text=(mapped["additional_spec_text"]),
            hsn_code=mapped["hsn_code"],
            available_stock=(mapped["available_stock"]),
        )

        stmt = stmt.on_conflict_do_update(
            index_elements=[ItemMaster.item_code],
            set_={
                "item_name": (stmt.excluded.item_name),

                "item_group": (stmt.excluded.item_group),

                "unit_measure": (stmt.excluded.unit_measure),

                "additional_spec_text": (stmt.excluded.additional_spec_text),

                "hsn_code": (stmt.excluded.hsn_code),

                "available_stock": (stmt.excluded.available_stock),

                "is_active": True,
            },
        )

        session.execute(stmt)

        upserted += 1

    return {
        "received": len(items),
        "upserted": upserted,
        "skipped": skipped,
    }


# ===========================================================================
# Cancellation
# ===========================================================================


CANCELLED_TRUE_VALUES = {"yes", "y", "true", "1",}

CANCELLED_FALSE_VALUES = {"", "no", "n", "false", "0",}


def _is_truthy_tally_flag(value,) -> bool:
    """
    Interpret Tally boolean-like values.

    Examples:

        YES
        Yes
        TRUE
        1
        NO
        FALSE
        0
    """

    text = _clean_text(value).casefold()

    if text in CANCELLED_TRUE_VALUES:
        return True

    if text in CANCELLED_FALSE_VALUES:
        return False

    return False


def _is_cancelled_voucher(voucher: dict,) -> bool:
    """
    Determine whether Tally explicitly marks a voucher
    cancelled or deleted.

    We intentionally do NOT use:

        - empty billing address;
        - missing client information;
        - missing contact information;
        - incomplete ClientCompany data

    as cancellation evidence.

    ClientCompany is completely outside the Tally
    synchronization lifecycle.
    """

    if _is_truthy_tally_flag(voucher.get("iscancelled")):
        return True

    if _is_truthy_tally_flag(voucher.get("isdeleted")):
        return True

    return False


def _delete_staging_order_by_guid(session, tally_guid: str,) -> bool:
    """
    Delete a staging order by Tally GUID.

    StagingOrderItem has ON DELETE CASCADE, so deleting the
    header removes its child snapshot.

    IMPORTANT:

    This operation affects only the Tally staging order.

    It does NOT affect ClientCompany or Sales-maintained
    client master data.
    """

    if not tally_guid:
        return False

    result = session.execute(delete(StagingOrderHeader).where(StagingOrderHeader.tally_guid == tally_guid))

    return result.rowcount > 0


# ===========================================================================
# Voucher staging persistence
# ===========================================================================


def upsert_staging_order(session, order: dict, ) -> dict:
    """
    Upsert one mapped staging order.

    Identity:

        tally_guid

    Tally owns the ERP/order snapshot:

        - customer code
        - billing name
        - billing address
        - order identifiers
        - financial values
        - GST information
        - item snapshot
        - shipping/order information

    ERP owns:

        workflow status

    Therefore:

        INSERT -> PENDING
        UPDATE -> preserve current ERP workflow status

    IMPORTANT:

    This function does NOT touch ClientCompany.

    Sales-owned client master data is completely independent
    from Tally staging synchronization.
    """

    tally_guid = _clean_text(order.get("tally_guid"))

    if not tally_guid:
        return {
            "status": "skipped",
            "reason": "missing_tally_guid",
            "items_written": 0,
        }

    # -----------------------------------------------------------------------
    # Upsert header.
    #
    # Deliberately do NOT update status on conflict.
    # -----------------------------------------------------------------------

    stmt = pg_insert(StagingOrderHeader).values(
        tally_guid=tally_guid,
        order_acceptance_id=order.get("order_acceptance_id"),
        order_acceptance_date=order.get("order_acceptance_date"),

        purchase_order_number=order.get("purchase_order_number"),

        purchase_order_date=order.get("purchase_order_date"),

        billing_name=order.get("billing_name"),

        billing_address=order.get("billing_address"),

        payment_terms=order.get("payment_terms"),

        status="PENDING",

        due_date=order.get("due_date"),

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
        "order_acceptance_id": (stmt.excluded.order_acceptance_id),

        "order_acceptance_date": (stmt.excluded.order_acceptance_date),

        "purchase_order_number": (stmt.excluded.purchase_order_number),

        "purchase_order_date": (stmt.excluded.purchase_order_date),

        "billing_name": (stmt.excluded.billing_name),

        "billing_address": (stmt.excluded.billing_address),

        "payment_terms": (stmt.excluded.payment_terms),

        "due_date": (stmt.excluded.due_date),

        "customer_code": (stmt.excluded.customer_code),

        "dispatched_through": (stmt.excluded.dispatched_through),

        "ordered_by": (stmt.excluded.ordered_by),

        "packing_charges": (stmt.excluded.packing_charges),

        "freight_charges": (stmt.excluded.freight_charges),

        "tax_rate": (stmt.excluded.tax_rate),

        "buyer_gstin": (stmt.excluded.buyer_gstin),

        "destination": (stmt.excluded.destination),

        "terms_of_delivery": (stmt.excluded.terms_of_delivery),

        "tax_amount": (stmt.excluded.tax_amount),

        "grand_total": (stmt.excluded.grand_total),

        "state_name": (stmt.excluded.state_name),
    }

    stmt = stmt.on_conflict_do_update(index_elements=[StagingOrderHeader.tally_guid],set_=update_values,).returning(StagingOrderHeader.staging_id)

    staging_id = session.execute(stmt).scalar_one()

    # -----------------------------------------------------------------------
    # Replace child snapshot.
    # -----------------------------------------------------------------------

    session.execute(delete(StagingOrderItem).where(StagingOrderItem.staging_header_id == staging_id))

    items_written = 0

    for item in order.get("items", [],):

        session.add(
            StagingOrderItem(staging_header_id=staging_id, item_code=item.get("item_code"),

                additional_spec_text=item.get("additional_spec_text"),

                hsn_code=item.get("hsn_code"),

                quantity=item.get("quantity"),

                rate=item.get("rate"),

                discount_percentage=item.get("discount_percentage"),

                amount=item.get("amount"),

                due_date=item.get("due_date"),
            )
        )

        items_written += 1

    return {
        "status": "upserted",
        "staging_id": staging_id,
        "items_written": items_written,
    }


# ===========================================================================
# Item Master sync
# ===========================================================================


def sync_item_master(session, name_prefix: str = "TI",) -> dict:
    """
    Complete Item Master synchronization.

    Pipeline:

        Tally
            -> XML
            -> filtered XML
            -> normalized JSON
            -> ItemMaster upsert

    ClientCompany is not involved.
    """

    print("Fetching item master from Tally...")

    xml = fetch_item_master()

    print(f"item_master: fetched " f"{len(xml.encode('utf-8')):,} bytes")

    # -----------------------------------------------------------------------
    # Preserve filtered representation.
    # -----------------------------------------------------------------------

    filtered_xml = filter_item_master_xml(xml, name_prefix=name_prefix,)

    print(f"item_master: filtered to " f"{len(filtered_xml.encode('utf-8')):,} bytes")

    xml_path = save_raw_tally_xml(filtered_xml, dataset="item_master",)

    print(f"item_master: XML saved to {xml_path}")

    # -----------------------------------------------------------------------
    # Normalize.
    # -----------------------------------------------------------------------

    items = xml_to_item_master_json(filtered_xml)

    json_path = save_json(items, dataset="item_master", suffix="normalized",)

    print(f"item_master: normalized JSON saved to " f"{json_path}")

    # -----------------------------------------------------------------------
    # DB.
    # -----------------------------------------------------------------------

    db_result = upsert_item_master(session, items,)

    return {
        "received": db_result["received"],
        "upserted": db_result["upserted"],
        "skipped": db_result["skipped"],
        "xml_path": xml_path,
        "json_path": json_path,
    }


# ===========================================================================
# Voucher dataset sync
# ===========================================================================


def sync_voucher_dataset(session, dataset: str, voucher_type: str, from_date: str, to_date: str,) -> dict:
    """
    Complete voucher synchronization.

    Pipeline:

        Tally
          ↓
        XML
          ↓
        raw XML
          ↓
        normalized JSON
          ↓
        application staging mapping
          ↓
        cancellation handling
          ↓
        staging order upsert
          ↓
        staging items

    CLIENT DATA OWNERSHIP
    ---------------------

    ClientCompany is maintained exclusively by Sales.

    This function therefore NEVER:

        - creates clients;
        - updates clients;
        - extracts client contacts;
        - extracts client addresses for ClientCompany;
        - creates ClientCompany IDs;
        - modifies ClientCompany records;
        - deletes ClientCompany records.

    Tally customer information may still be stored as part of the
    StagingOrderHeader snapshot because it belongs to the ERP order.

    Example:

        customer_code
        billing_name
        billing_address
        buyer_gstin
        state_name

    These values do NOT overwrite Sales-maintained ClientCompany data.
    """

    print(f"{dataset}: fetching " f"{voucher_type} " f"{from_date} -> {to_date}")

    # -----------------------------------------------------------------------
    # FETCH
    # -----------------------------------------------------------------------

    xml = fetch_voucher_range(voucher_type=voucher_type, from_date=from_date, to_date=to_date,)

    print(f"{dataset}: fetched " f"{len(xml.encode('utf-8')):,} bytes")

    # -----------------------------------------------------------------------
    # RAW XML
    # -----------------------------------------------------------------------

    xml_path = save_raw_tally_xml(xml, dataset=dataset,)

    print(f"{dataset}: XML saved to {xml_path}")

    # -----------------------------------------------------------------------
    # NORMALIZE
    # -----------------------------------------------------------------------

    normalized = xml_to_staging_json(xml)

    normalized_path = save_json(normalized, dataset=dataset,suffix="normalized",)

    vouchers = normalized.get("tallymessage", [],)

    print(f"{dataset}: " f"{len(vouchers):,} vouchers normalized")

    # -----------------------------------------------------------------------
    # MAP
    # -----------------------------------------------------------------------

    staging = {"tallymessage": [voucher_to_staging_order(voucher) for voucher in vouchers]}

    staging_path = save_json(staging, dataset=dataset, suffix="staging",)

    # -----------------------------------------------------------------------
    # DATABASE
    # -----------------------------------------------------------------------

    received = len(staging["tallymessage"])

    upserted = 0
    cancelled = 0
    skipped = 0
    items_written = 0

    # -----------------------------------------------------------------------
    # Process vouchers.
    #
    # IMPORTANT:
    #
    # There is deliberately NO client/company handling here.
    #
    # Sales owns ClientCompany.
    # Tally owns the staging/order snapshot.
    # -----------------------------------------------------------------------

    for raw_voucher, order in zip(vouchers, staging["tallymessage"],):

        tally_guid = _clean_text(order.get("tally_guid"))

        # -------------------------------------------------------------------
        # CANCELLED / DELETED
        #
        # Only remove the Tally staging order.
        #
        # ClientCompany is untouched.
        # -------------------------------------------------------------------

        if _is_cancelled_voucher(raw_voucher):

            deleted = (_delete_staging_order_by_guid(session,tally_guid,))

            cancelled += 1

            print(f"{dataset}: cancelled voucher " f"{order.get('order_acceptance_id')!r} " f"| staging_deleted={deleted}")

            continue

        # -------------------------------------------------------------------
        # Normal order.
        # -------------------------------------------------------------------

        result = upsert_staging_order(session, order,)

        if result["status"] == "skipped":
            skipped += 1
            continue

        upserted += 1

        items_written += result["items_written"]

    return {
        "dataset": dataset,

        "received": received,

        "upserted": upserted,

        "cancelled": cancelled,

        "skipped": skipped,

        "items_written": items_written,

        "xml_path": xml_path,

        "normalized_path": normalized_path,

        "staging_path": staging_path,
    }
