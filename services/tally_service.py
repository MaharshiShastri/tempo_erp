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
        -> OrderHeader upsert
        -> OrderItem replacement
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
from collections.abc import Sequence
from datetime import datetime
from decimal import Decimal

from sqlalchemy import delete, select
from sqlalchemy.dialects.postgresql import insert as pg_insert

from database.models import (
    ItemMaster,
    BillHeader,
    BillItem,
    OrderHeader,
    OrderItem,
)

from services.tally_client import (
    fetch_item_master,
    fetch_voucher_range,
    filter_item_master_xml,
    save_raw_tally_xml,
    save_json,
    xml_to_item_master_json,
    xml_to_staging_json,
    _join_text_list,
    _parse_date,
    _as_list,

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

    skipped = 0
    inserted = 0
    stock_updated = 0

    for tally_item in items:

        mapped = _map_tally_item_to_application(
            tally_item
        )

        if not mapped:
            skipped += 1
            continue

        item_code = mapped["item_code"]

        if not item_code:
            skipped += 1
            continue

        # ---------------------------------------------------------------
        # First determine whether this is a genuinely new product.
        #
        # This is intentionally done before the upsert so we can maintain
        # accurate counters.
        # ---------------------------------------------------------------

        existing_item = session.get(
            ItemMaster,
            item_code,
        )

        if existing_item is None:

            # -----------------------------------------------------------
            # NEW PRODUCT
            #
            # Only here do we populate the complete master row.
            # -----------------------------------------------------------

            session.add(
                ItemMaster(
                    item_code=item_code,

                    item_name=mapped["item_name"],

                    item_group=mapped["item_group"],

                    unit_measure=(
                        mapped["unit_measure"]
                        or "NOS"
                    ),

                    additional_spec_text=(
                        mapped["additional_spec_text"]
                    ),

                    hsn_code=mapped["hsn_code"],

                    available_stock=(
                        mapped["available_stock"]
                    ),
                )
            )

            inserted += 1

        else:
            existing_item.available_stock = (
                mapped["available_stock"]
            )

            stock_updated += 1

    session.flush()

    return {
        "received": len(items),
        "upserted": inserted + stock_updated,
        "inserted": inserted,
        "stock_updated": stock_updated,
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


def _delete_order_by_guid(session, tally_guid: str,) -> bool:
    if not tally_guid:
        return False

    result = session.execute(
        delete(OrderHeader).where(OrderHeader.tally_guid == tally_guid)
    )

    return result.rowcount > 0

def _delete_bill(session, bill_num: str,) -> bool:

    if not bill_num:
        return False

    result = session.execute(
        delete(BillHeader).where(
            BillHeader.bill_num == bill_num
        )
    )

    return result.rowcount > 0
# ===========================================================================
# Voucher staging persistence
# ===========================================================================

def voucher_to_order(voucher: dict) -> dict:
    voucher_type = (
        voucher.get("vouchertypename")
        or voucher.get("vchtype")
        or ""
    )

    tally_guid = _clean_text(voucher.get("guid"))

    order_acceptance_id = _clean_text(
        voucher.get("vouchernumber")
    )

    order_acceptance_date = _parse_date(
        voucher.get("date")
    )

    purchase_order_date = _parse_date(
        voucher.get("referencedate")
    )
    
    purchase_order_number = _clean_text(
        voucher.get("reference")
    )

    billing_name = _clean_text(
        voucher.get("partyledgername")
    )

    tally_customer_code = _clean_text(
        voucher.get("partyname")
    )

    billing_address = _join_text_list(
        voucher.get("basicbuyeraddress")
    )

    delivery_terms = _join_text_list(
        voucher.get("basicorderterms")
    )

    payment_terms = _clean_text(
        voucher.get("basicduedateofpymt")
    )

    dispatched_through = _clean_text(
        voucher.get("basicshippedby")
    )

    state_name = _clean_text(
        voucher.get("statename")
    )

    buyer_gstin = _clean_text(
        voucher.get("partygstin")
    )

    destination = _clean_text(
        voucher.get("placeofsupply")
    )

    items = []

    for inventory in _as_list(
        voucher.get("allinventoryentries")
    ):
        if not isinstance(inventory, dict):
            continue

        item_code = _clean_text(
            inventory.get("stockitemname")
        )

        if not item_code:
            continue

        items.append(
            {
                "item_code": item_code,
                "additional_spec_text": _join_text_list(
                    inventory.get("basicuserdescription")
                    or inventory.get("description")
                ),
                "hsn_code": (
                    _clean_text(
                        inventory.get("gsthsncode")
                        or inventory.get("gsthsnname")
                    )
                ),
                "quantity": _parse_decimal(
                    inventory.get("actualqty")
                ),
                "rate": _parse_decimal(
                    inventory.get("rate")
                ),
                "discount_percentage": _parse_decimal(
                    inventory.get("discount")
                ),
            }
        )

    freight_charges = Decimal("0")
    tax_amount = Decimal("0")
    grand_total = Decimal("0")

    for ledger in _as_list(
        voucher.get("ledgerentries")
    ):
        if not isinstance(ledger, dict):
            continue

        ledger_name = _clean_text(
            ledger.get("ledgername")
        )

        amount = abs(
            _parse_decimal(
                ledger.get("amount")
            )
        )

        if ledger_name.casefold() == "freight charges":
            freight_charges += amount

        if any(
            tax_name in ledger_name.upper()
            for tax_name in ("CGST", "SGST", "IGST")
        ):
            tax_amount += amount

        grand_total += amount

    return {
        "voucher_type": voucher_type,
        "tally_guid": tally_guid,
        "order_acceptance_id": order_acceptance_id,
        "order_acceptance_date": order_acceptance_date,
        "purchase_order_number": purchase_order_number,
        "purchase_order_date": None,

        "tally_customer_code": tally_customer_code,

        "billing_name": billing_name,
        "billing_address": billing_address,
        "payment_terms": payment_terms,
        "dispatched_through": dispatched_through,
        "delivery_terms": delivery_terms,
        "due_date": None,
        "ordered_by": None,

        "packing_charges": Decimal("0"),
        "freight_charges": freight_charges,
        "tax_rate": Decimal("18"),

        "buyer_gstin": buyer_gstin,
        "destination": destination,
        "state_name": state_name,

        "tax_amount": tax_amount,
        "grand_total": grand_total,

        "items": items,
    }

def upsert_order(
    session,
    order: dict,
) -> dict:
    """
    Upsert one Tally Sales Order.

    Tally owns:
        - order snapshot
        - order items
        - commercial/order information

    ERP owns:
        - customer_id
        - workflow/current_stage_code
        - production state

    Unknown Tally item codes are skipped from OrderItem because
    OrderItem.item_code has an FK to items_master.item_code.
    """

    tally_guid = _clean_text(order.get("tally_guid"))

    if not tally_guid:
        return {
            "status": "skipped",
            "reason": "missing_tally_guid",
            "order_id": None,
            "items_written": 0,
            "items_skipped": 0,
        }

    # ---------------------------------------------------------------
    # Required defaults for OrderHeader
    # ---------------------------------------------------------------

    order_acceptance_id = _clean_text(
        order.get("order_acceptance_id")
    )

    if not order_acceptance_id:
        return {
            "status": "skipped",
            "reason": "missing_order_acceptance_id",
            "order_id": None,
            "items_written": 0,
            "items_skipped": 0,
        }

    order_acceptance_date = (
        order.get("order_acceptance_date")
        or datetime.now().date()
    )

    purchase_order_number = _clean_text(
        order.get("purchase_order_number")
    ) or order_acceptance_id

    purchase_order_date = (
        order.get("purchase_order_date")
        or order_acceptance_date
    )

    billing_name = _clean_text(
        order.get("billing_name")
    ) or _clean_text(
        order.get("tally_customer_code")
    ) or "UNKNOWN CUSTOMER"

    billing_address = _clean_text(
        order.get("billing_address")
    ) or "ADDRESS NOT AVAILABLE"

    # ---------------------------------------------------------------
    # Preserve ERP-owned workflow state.
    #
    # INSERT -> database default PO_SUBMITTED
    # UPDATE -> existing stage remains untouched.
    # ---------------------------------------------------------------

    stmt = pg_insert(OrderHeader).values(
        tally_guid=tally_guid,

        order_acceptance_id=order_acceptance_id,

        order_acceptance_date=order_acceptance_date,

        purchase_order_number=purchase_order_number,

        purchase_order_date=purchase_order_date,

        tally_customer_code=(
            order.get("tally_customer_code")
        ),

        billing_name=billing_name,

        billing_address=billing_address,

        payment_terms=(
            order.get("payment_terms")
        ),

        dispatched_through=(
            order.get("dispatched_through")
        ),

        delivery_terms=(
            order.get("delivery_terms")
        ),

        due_date=(
            order.get("due_date")
        ),

        ordered_by=(
            order.get("ordered_by")
        ),

        packing_charges=(
            order.get("packing_charges")
            or Decimal("0")
        ),

        freight_charges=(
            order.get("freight_charges")
            or Decimal("0")
        ),

        tax_rate=(
            order.get("tax_rate")
            or Decimal("18")
        ),

        buyer_gstin=(
            order.get("buyer_gstin")
        ),

        destination=(
            order.get("destination")
        ),

        state_name=(
            order.get("state_name")
        ),

        tax_amount=(
            order.get("tax_amount")
            or Decimal("0")
        ),

        grand_total=(
            order.get("grand_total")
            or Decimal("0")
        ),

        # DO NOT provide customer_id.
        # Sales owns ClientCompany relationship.

        # DO NOT provide current_stage_code.
        # Let database server_default handle new orders.
    )

    update_values = {
        "order_acceptance_id":
            stmt.excluded.order_acceptance_id,

        "order_acceptance_date":
            stmt.excluded.order_acceptance_date,

        "purchase_order_number":
            stmt.excluded.purchase_order_number,

        "purchase_order_date":
            stmt.excluded.purchase_order_date,

        "tally_customer_code":
            stmt.excluded.tally_customer_code,

        "billing_name":
            stmt.excluded.billing_name,

        "billing_address":
            stmt.excluded.billing_address,

        "payment_terms":
            stmt.excluded.payment_terms,

        "dispatched_through":
            stmt.excluded.dispatched_through,

        "delivery_terms":
            stmt.excluded.delivery_terms,

        "due_date":
            stmt.excluded.due_date,

        "ordered_by":
            stmt.excluded.ordered_by,

        "packing_charges":
            stmt.excluded.packing_charges,

        "freight_charges":
            stmt.excluded.freight_charges,

        "tax_rate":
            stmt.excluded.tax_rate,

        "buyer_gstin":
            stmt.excluded.buyer_gstin,

        "destination":
            stmt.excluded.destination,

        "state_name":
            stmt.excluded.state_name,

        "tax_amount":
            stmt.excluded.tax_amount,

        "grand_total":
            stmt.excluded.grand_total,
    }

    stmt = stmt.on_conflict_do_update(
        index_elements=[
            OrderHeader.tally_guid
        ],
        set_=update_values,
    ).returning(
        OrderHeader.order_id
    )

    order_id = session.execute(
        stmt
    ).scalar_one()

    # ---------------------------------------------------------------
    # Replace Tally-owned item snapshot
    # ---------------------------------------------------------------

    existing_items = session.scalars(
    select(OrderItem)
    .where(
        OrderItem.order_id == order_id
    )
    .order_by(
        OrderItem.order_item_id
    )
).all()

    existing_by_code = {}

    for existing_item in existing_items:

        existing_by_code.setdefault(
            existing_item.item_code,
            [],
        ).append(
            existing_item
        )


    used_order_items = set()

    items_written = 0
    items_skipped = 0


    for item_data in order.get(
        "items",
        [],
    ):

        item_code = _clean_text(
            item_data.get("item_code")
        )

        if not item_code:
            items_skipped += 1
            continue

        # -----------------------------------------------------------
        # FK safety
        # -----------------------------------------------------------

        item_master = session.get(
            ItemMaster,
            item_code,
        )

        if item_master is None:

            items_skipped += 1

            print(
                f"ORDER {order_acceptance_id}: "
                f"skipping unknown ItemMaster item "
                f"{item_code!r}"
            )

            continue


        quantity = _parse_integer(
            item_data.get("quantity"),
            default=0,
        )

        if quantity <= 0:
            items_skipped += 1
            continue


        rate = (
            _parse_decimal(
                item_data.get("rate")
            )
            or Decimal("0")
        )


        discount = (
            _parse_decimal(
                item_data.get(
                    "discount_percentage"
                )
            )
            or Decimal("0")
        )


        hsn_code = (
            _clean_text(
                item_data.get("hsn_code")
            )
            or (
                item_master.hsn_code
                or "00000000"
            )
        )[:8]


        # -----------------------------------------------------------
        # Reuse an existing OrderItem when possible
        # -----------------------------------------------------------

        reusable_item = None

        candidates = existing_by_code.get(
            item_code,
            [],
        )

        for candidate in candidates:

            if candidate.order_item_id not in used_order_items:

                reusable_item = candidate
                break


        if reusable_item is not None:

            # -------------------------------------------------------
            # Existing OrderItem
            #
            # Preserve order_item_id so existing BillItems remain
            # correctly linked.
            # -------------------------------------------------------

            reusable_item.item_code = item_code

            reusable_item.um = (
                item_master.unit_measure
                or None
            )

            reusable_item.additional_spec_text = (
                item_data.get(
                    "additional_spec_text"
                )
            )

            reusable_item.hsn_code = hsn_code

            reusable_item.quantity = quantity

            reusable_item.rate = rate

            reusable_item.discount_percentage = discount

            used_order_items.add(
                reusable_item.order_item_id
            )

        else:

            # -------------------------------------------------------
            # New OrderItem
            # -------------------------------------------------------

            new_item = OrderItem(
                order_id=order_id,

                item_code=item_code,

                um=(
                    item_master.unit_measure
                    or None
                ),

                additional_spec_text=(
                    item_data.get(
                        "additional_spec_text"
                    )
                ),

                hsn_code=hsn_code,

                quantity=quantity,

                rate=rate,

                discount_percentage=discount,
            )

            session.add(new_item)

        items_written += 1


    # Flush first so new rows get identities and all FK state is
    # current before stale-row reconciliation.

    session.flush()


    # ---------------------------------------------------------------
    # Remove stale OrderItems
    #
    # Only delete rows that:
    #
    #   1. belonged to this order,
    #   2. were not reused,
    #   3. have no BillItem references.
    #
    # A stale OrderItem that has billing history is deliberately
    # preserved because deleting it would destroy the bill linkage.
    # ---------------------------------------------------------------

    for existing_item in existing_items:

        if existing_item.order_item_id in used_order_items:
            continue


        has_bill_reference = session.scalar(
            select(BillItem.bill_item_id)
            .where(
                BillItem.order_item_id
                == existing_item.order_item_id
            )
            .limit(1)
        )


        if has_bill_reference:

            print(
                f"ORDER {order_acceptance_id}: "
                f"preserving historical OrderItem "
                f"{existing_item.order_item_id} "
                f"because it is referenced by BillItem."
            )

            continue


        session.delete(
            existing_item
        )


    session.flush()

    return {
        "status": "upserted",
        "order_id": order_id,
        "items_written": items_written,
        "items_skipped": items_skipped,
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
    "inserted": db_result["inserted"],
    "stock_updated": db_result["stock_updated"],
    "skipped": db_result["skipped"],
    "xml_path": xml_path,
    "json_path": json_path,
    }


# ===========================================================================
# Voucher dataset sync
# ===========================================================================


def sync_voucher_dataset(
    session,
    dataset: str,
    voucher_type: str | Sequence[str] | None,
    from_date: str,
    to_date: str,
) -> dict:

    print(
        f"{dataset}: fetching "
        f"{voucher_type} "
        f"{from_date} -> {to_date}"
    )

    xml = fetch_voucher_range(
        voucher_type=voucher_type,
        from_date=from_date,
        to_date=to_date,
    )

    print(
        f"{dataset}: fetched "
        f"{len(xml.encode('utf-8')):,} bytes"
    )

    xml_path = save_raw_tally_xml(
        xml,
        dataset=dataset,
    )

    print(
        f"{dataset}: XML saved to {xml_path}"
    )

    normalized = xml_to_staging_json(xml)

    normalized_path = save_json(
        normalized,
        dataset=dataset,
        suffix="normalized",
    )

    vouchers = normalized.get(
        "tallymessage",
        [],
    )

    print(
        f"{dataset}: "
        f"{len(vouchers):,} vouchers normalized"
    )

    received = len(vouchers)

    upserted = 0
    cancelled = 0
    skipped = 0
    items_written = 0
    items_skipped = 0

    # ---------------------------------------------------------------
    # SALES ORDER
    # ---------------------------------------------------------------

    if voucher_type == "sales_orders":

        mapped_orders = [
            voucher_to_order(voucher)
            for voucher in vouchers
        ]

        mapped_path = save_json(
            {
                "tallymessage": mapped_orders
            },
            dataset=dataset,
            suffix="orders",
        )

        for raw_voucher, order in zip(
            vouchers,
            mapped_orders,
        ):

            tally_guid = _clean_text(
                order.get("tally_guid")
            )

            if _is_cancelled_voucher(
                raw_voucher
            ):

                deleted = _delete_order_by_guid(
                    session,
                    tally_guid,
                )

                cancelled += 1

                print(
                    f"{dataset}: cancelled "
                    f"{order.get('order_acceptance_id')!r} "
                    f"| order_deleted={deleted}"
                )

                continue

            result = upsert_order(
                session,
                order,
            )

            if result["status"] == "skipped":
                skipped += 1
                continue

            upserted += 1
            items_written += result[
                "items_written"
            ]
            items_skipped += result[
                "items_skipped"
            ]

        session.flush()

        return {
            "dataset": dataset,
            "received": received,
            "upserted": upserted,
            "cancelled": cancelled,
            "skipped": skipped,
            "items_written": items_written,
            "items_skipped": items_skipped,
            "xml_path": xml_path,
            "normalized_path": normalized_path,
            "mapped_path": mapped_path,
        }

    # ---------------------------------------------------------------
    # SALES / BILL
    # ---------------------------------------------------------------

    if dataset == "sales":

        mapped_path = save_json(
            {
                "tallymessage": vouchers
            },
            dataset=dataset,
            suffix="bills",
        )


        for raw_voucher in vouchers:

            bill_num = _clean_text(
                raw_voucher.get(
                    "vouchernumber"
                )
            )


            if _is_cancelled_voucher(
                raw_voucher
            ):

                deleted = _delete_bill(
                    session,
                    bill_num,
                )

                cancelled += 1

                print(
                    f"{dataset}: cancelled "
                    f"bill {bill_num!r} "
                    f"| bill_deleted={deleted}"
                )

                continue


            result = voucher_to_bill(
                session,
                raw_voucher,
            )


            if result["status"] == "skipped":

                skipped += 1
                continue


            upserted += 1

            items_written += (
                result["items_written"]
            )

            items_skipped += (
                result["items_skipped"]
            )


        session.flush()


        return {
            "dataset": dataset,
            "received": received,
            "upserted": upserted,
            "cancelled": cancelled,
            "skipped": skipped,
            "items_written": items_written,
            "items_skipped": items_skipped,
            "xml_path": xml_path,
            "normalized_path": normalized_path,
            "mapped_path": mapped_path,
        }
    # ---------------------------------------------------------------
    # PURCHASE ORDER / PURCHASE
    #
    # Do not silently put these into Sales Order tables.
    # ---------------------------------------------------------------

    print(
        f"{dataset}: no application persistence "
        f"implemented for {voucher_type}; "
        f"data retained only as normalized XML/JSON."
    )

    session.flush()

    return {
        "dataset": dataset,
        "received": received,
        "upserted": 0,
        "cancelled": 0,
        "skipped": received,
        "items_written": 0,
        "items_skipped": 0,
        "xml_path": xml_path,
        "normalized_path": normalized_path,
    }

def voucher_to_bill(
    session,
    voucher: dict,
) -> dict:
    """
    Upsert one Tally Sales voucher into:

        BillHeader
        BillItem

    Tally Sales semantics:

        VOUCHERNUMBER -> bill_num
        DATE          -> bill_date
        REFERENCE     -> Sales Order OA ID

    Unknown ItemMaster items are skipped rather than violating
    the BillItem -> ItemMaster FK.
    """

    bill_num = _clean_text(
        voucher.get("vouchernumber")
    )

    if not bill_num:
        return {
            "status": "skipped",
            "reason": "missing_bill_number",
            "bill_num": None,
            "order_id": None,
            "items_written": 0,
            "items_skipped": 0,
        }

    bill_date = _parse_date(
        voucher.get("date")
    )

    if not bill_date:
        return {
            "status": "skipped",
            "reason": "missing_bill_date",
            "bill_num": bill_num,
            "order_id": None,
            "items_written": 0,
            "items_skipped": 0,
        }

    # ---------------------------------------------------------------
    # Sales voucher:
    #
    # VOUCHERNUMBER = Bill number
    # REFERENCE     = Sales Order OA ID
    # ---------------------------------------------------------------

    order_acceptance_id = _clean_text(
        voucher.get("reference")
    )

    order = None

    if order_acceptance_id:
        order = session.scalar(
            select(OrderHeader).where(
                OrderHeader.order_acceptance_id
                == order_acceptance_id
            )
        )

    # ---------------------------------------------------------------
    # BILL HEADER
    # ---------------------------------------------------------------

    bill = session.get(
        BillHeader,
        bill_num,
    )

    if bill is None:
        bill = BillHeader(
            bill_num=bill_num,
            bill_date=bill_date,
            order_id=(
                order.order_id
                if order
                else None
            ),
            indian_state=(
                _clean_text(
                    voucher.get("statename")
                )
                or None
            ),
        )

        session.add(bill)

    else:
        bill.bill_date = bill_date

        bill.order_id = (
            order.order_id
            if order
            else None
        )

        bill.indian_state = (
            _clean_text(
                voucher.get("statename")
            )
            or None
        )

    session.flush()

    # ---------------------------------------------------------------
    # Replace existing BillItem snapshot
    # ---------------------------------------------------------------

    session.execute(
        delete(BillItem).where(
            BillItem.bill_num == bill_num
        )
    )

    items_written = 0
    items_skipped = 0

    for inventory in _as_list(
        voucher.get("allinventoryentries")
    ):

        if not isinstance(
            inventory,
            dict,
        ):
            continue

        item_code = _clean_text(
            inventory.get("stockitemname")
        )

        if not item_code:
            items_skipped += 1
            continue

        # -----------------------------------------------------------
        # ItemMaster FK protection
        # -----------------------------------------------------------

        item_master = session.get(
            ItemMaster,
            item_code,
        )

        if item_master is None:
            items_skipped += 1

            print(
                f"BILL {bill_num}: "
                f"skipping unknown ItemMaster item "
                f"{item_code!r}"
            )

            continue

        quantity = _parse_integer(
            inventory.get("actualqty"),
            default=0,
        )

        if quantity <= 0:
            items_skipped += 1
            continue

        rate = _parse_decimal(
            inventory.get("rate")
        )

        amount = abs(
            _parse_decimal(
                inventory.get("amount")
            )
            or Decimal("0")
        )

        # -----------------------------------------------------------
        # Try to link the bill line to the corresponding OrderItem.
        # This is optional.
        # -----------------------------------------------------------

        order_item = None

        if order:
            order_item = session.scalar(
                select(OrderItem)
                .where(
                    OrderItem.order_id
                    == order.order_id,

                    OrderItem.item_code
                    == item_code,
                )
                .order_by(
                    OrderItem.order_item_id
                )
            )

        session.add(
            BillItem(
                bill_num=bill_num,

                order_item_id=(
                    order_item.order_item_id
                    if order_item
                    else None
                ),

                item_code=item_code,

                quantity_shipped=quantity,

                rate=rate,

                amount=amount,
            )
        )

        items_written += 1

    session.flush()

    return {
        "status": "upserted",
        "bill_num": bill_num,
        "order_id": (
            order.order_id
            if order
            else None
        ),
        "order_match": bool(order),
        "items_written": items_written,
        "items_skipped": items_skipped,
    }