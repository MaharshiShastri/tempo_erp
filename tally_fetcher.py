from services.tally_client import (
    fetch_item_master,
    fetch_voucher_range,

    save_raw_tally_xml,
    save_json,

    filter_item_master_xml,

    xml_to_staging_json,
    xml_to_staging_order_json,
    xml_to_item_master_json,
    stage_orders_to_db,
    voucher_to_staging_order
)
from database.repository import SessionLocal

FROM_DATE = "20260401"
TO_DATE = "20260808"


def fetch_and_save(
    dataset,
    fetcher,
    xml_filter=None,
):
    print()
    print("=" * 70)
    print(f"Fetching: {dataset}")
    print("=" * 70)

    # ---------------------------------------------------------
    # 1. FETCH XML
    # ---------------------------------------------------------

    xml = fetcher()

    print(
        f"Tally response: "
        f"{len(xml.encode('utf-8')):,} bytes"
    )

    # ---------------------------------------------------------
    # 2. OPTIONAL XML FILTER
    # ---------------------------------------------------------

    if xml_filter:

        xml = xml_filter(xml)

        print(
            f"After XML filter: "
            f"{len(xml.encode('utf-8')):,} bytes"
        )

    # ---------------------------------------------------------
    # 3. SAVE RAW XML
    # ---------------------------------------------------------

    xml_path = save_raw_tally_xml(
        xml,
        dataset=dataset,
    )

    print(
        f"Saved XML: {xml_path}"
    )

    print(
        f"Saved XML bytes: "
        f"{len(xml.encode('utf-8')):,}"
    )

    return xml

def process_item_master(
    xml: str,
):
    """
    Convert filtered Item Master XML into JSON.

    At this stage we preserve the normalized Tally
    representation. The application ItemMaster mapping
    will be defined separately before database upsert.
    """

    items = xml_to_item_master_json(
        xml
    )

    path = save_json(
        items,
        dataset="item_master",
        suffix="normalized",
    )

    print()
    print(
        f"Item master JSON saved: "
        f"{path}"
    )

    print(
        f"Items received: "
        f"{len(items):,}"
    )

    print()
    print("First 10 items:")

    for item in items[:10]:

        print(
            f"  {item.get('name')!r}"
            f" | group={item.get('parent')!r}"
            f" | unit={item.get('baseunits')!r}"
            f" | hsn={item.get('gsthsncode')!r}"
        )

    return items

def process_orders(
    xml: str,
    dataset: str,
    session,
):
    print()
    print("-" * 70)
    print(f"Converting {dataset} XML -> JSON")
    print("-" * 70)

    # ---------------------------------------------------------
    # Parse ONCE
    # ---------------------------------------------------------

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
        f"Normalized vouchers: "
        f"{len(vouchers):,}"
    )

    # ---------------------------------------------------------
    # Map normalized Tally → ERP staging
    # ---------------------------------------------------------

    staging = {
        "tallymessage": [
            voucher_to_staging_order(voucher)
            for voucher in vouchers
        ]
    }

    staging_path = save_json(
        staging,
        dataset=dataset,
        suffix="staging",
    )

    print(
        f"Staging vouchers: "
        f"{len(staging['tallymessage']):,}"
    )

    # ---------------------------------------------------------
    # DB
    # ---------------------------------------------------------

    result = stage_orders_to_db(
        staging,
        session,
    )

    print()
    print(
        f"Staging sync: "
        f"{result['processed']:,}"
    )

    print(
        f"Items written: "
        f"{result['items_written']:,}"
    )

    print(
        f"Skipped: "
        f"{result['skipped']:,}"
    )

    return {
        "normalized": normalized,
        "staging": staging,
        "normalized_path": normalized_path,
        "staging_path": staging_path,
        "db_result": result,
    }

def main():
    session = SessionLocal()

    try:

        # =====================================================
        # ITEM MASTER
        # =====================================================

        item_master_xml = fetch_and_save("item_master", fetcher=fetch_item_master, xml_filter=lambda xml: (filter_item_master_xml(xml,name_prefix="TI",)),)

        process_item_master(item_master_xml)

        # =====================================================
        # SALES ORDERS
        # =====================================================

        sales_orders_xml = fetch_and_save(
            "sales_orders",
            fetcher=lambda: fetch_voucher_range(
                "Sales Order",
                FROM_DATE,
                TO_DATE,
            ),
        )

        result = process_orders(
            sales_orders_xml,
            "sales_orders",
            session,
        )

        session.commit()

        # =====================================================
        # SALES
        # =====================================================

        sales_xml = fetch_and_save(
            "sales",
            fetcher=lambda: fetch_voucher_range(
                "Sales",
                FROM_DATE,
                TO_DATE,
            ),
        )

        result = process_orders(
            sales_xml,
            "sales",
            session,
        )

        session.commit()

        # =====================================================
        # PURCHASE ORDERS
        # =====================================================

        purchase_orders_xml = fetch_and_save(
            "purchase_orders",
            fetcher=lambda: fetch_voucher_range(
                "Purchase Order",
                FROM_DATE,
                TO_DATE,
            ),
        )

        result = process_orders(
            purchase_orders_xml,
            "purchase_orders",
            session,
        )

        session.commit()

        # =====================================================
        # PURCHASE
        # =====================================================

        purchase_xml = fetch_and_save(
            "purchase",
            fetcher=lambda: fetch_voucher_range(
                "Purchase",
                FROM_DATE,
                TO_DATE,
            ),
        )

        result = process_orders(
            purchase_xml,
            "purchase",
            session,
        )

        session.commit()

    except Exception:

        session.rollback()

        raise

    finally:

        session.close()
if __name__ == "__main__":
    main()
    