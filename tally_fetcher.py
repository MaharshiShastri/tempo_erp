# workers/tally_fetcher.py

"""
Tally synchronization worker.

Responsibilities
----------------
The worker is intentionally thin.

It:
    1. starts the Tally synchronization job;
    2. opens one database session;
    3. calls tally_service;
    4. commits/rolls back the transaction;
    5. reports the result.

It does NOT:
    - parse XML;
    - map Tally fields;
    - save JSON;
    - perform database upserts;
    - understand staging tables.
"""

from database.repository import SessionLocal
from services.tally_service import (
    sync_item_master,
    sync_voucher_dataset,
)


# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

FROM_DATE = "20260401"
TO_DATE = "20260819"

ITEM_NAME_PREFIX = "TI"

DATASETS = (
    ("sales_orders", "Sales Order"),
    ("sales", ("Sales", "Sales Amazon",),),
    ("purchase_orders", "Purchase Order"),
    ("purchase", "Purchase"),
)

# ---------------------------------------------------------------------------
# Worker
# ---------------------------------------------------------------------------

def run() -> None:
    session = SessionLocal()

    try:
        print("=" * 70)
        print("TALLY SYNC START")
        print("=" * 70)

        # ---------------------------------------------------------------
        # ITEM MASTER
        # ---------------------------------------------------------------

        print()
        print("=" * 70)
        print("SYNC: item_master")
        print("=" * 70)

        item_result = sync_item_master(
            session=session,
            name_prefix=ITEM_NAME_PREFIX,
        )
        session.commit()
        session.expire_all()
        print(
            "item_master: "
            f"{item_result['received']:,} received | "
            f"{item_result['inserted']:,} new products inserted | "
            f"{item_result['stock_updated']:,} existing stock values updated | "
            f"{item_result['skipped']:,} skipped"
        )

        # ---------------------------------------------------------------
        # VOUCHERS
        # ---------------------------------------------------------------

        for dataset, voucher_type in DATASETS:

            print()
            print("=" * 70)
            print(f"SYNC: {dataset}")
            print("=" * 70)

            try:

                result = sync_voucher_dataset(
                    session=session,
                    dataset=dataset,
                    voucher_type=voucher_type,
                    from_date=FROM_DATE,
                    to_date=TO_DATE,
                )

                session.commit()

                # Clear SQLAlchemy identity map so the next dataset
                # reloads current database state.
                session.expire_all()

                print(
                    f"{dataset}: "
                    f"{result['received']:,} received | "
                    f"{result['upserted']:,} upserted | "
                    f"{result['cancelled']:,} cancelled | "
                    f"{result['skipped']:,} skipped | "
                    f"{result['items_written']:,} items | "
                    f"{result.get('items_skipped', 0):,} "
                    f"unknown items skipped"
                )

            except Exception:

                session.rollback()

                print(
                    f"{dataset}: FAILED — "
                    f"dataset transaction rolled back"
                )

                raise
    except Exception as e:
        session.rollback()
        print("Error : ", str(e))
        raise
    
    finally:
        session.close()

if __name__ == "__main__":
    run()