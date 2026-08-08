"""
insert_item_master.py

Fetches Item Master from Tally and inserts into ItemMaster via your
existing EDBR.create_item() -- unchanged, exactly as it already exists in
repository.py. Standalone, independent of tally_router.py.

Since the table is currently empty, this is a straight insert loop with
per-row error handling (so one bad item doesn't abort the whole batch).
Re-running this after the table has data WILL fail on duplicate item_code
(create_item doesn't upsert) -- that's fine for a first populate run, but
if you re-run this later, tell me and I'll add a skip-existing check.

Run directly:
    python insert_item_master.py
"""

from services.tally_client import (
    fetch_item_master,
    xml_to_item_master_json,
    filter_item_master_rows,
    stock_item_to_master_dict,
)
from database.repository import EDBR


def main():
    print("Fetching Item Master from Tally...")
    raw_xml = fetch_item_master()
    raw_items = xml_to_item_master_json(raw_xml)
    print(f"Got {len(raw_items)} raw items from Tally.\n")

    if not raw_items:
        print("Nothing returned -- check Tally connection / company name before debugging further.")
        return

    filtered_items = filter_item_master_rows(raw_items, name_prefix="TI")
    print(f"After filtering to names starting with 'TI': {len(filtered_items)} items.\n")

    # Show the item_group breakdown of what's LEFT after name filtering,
    # so you can tell me if any of these groups are still junk to exclude
    # via allowed_groups, or if this list is already clean.
    from collections import Counter
    group_counts = Counter(item.get("parent", "") for item in filtered_items)
    print("=== item_group breakdown (post name-filter) ===")
    for group, count in group_counts.most_common(20):
        print(f"  {count:5d}  {group!r}")
    print()

    mapped_items = [stock_item_to_master_dict(i) for i in filtered_items]

    # De-duplicate by item_code: Tally genuinely has ~2,600+ stock item
    # records that share identical NAME text (multiple godown entries,
    # historical duplicates, etc.) -- since item_code == item_name here
    # (no PARTNO populated) and create_item() doesn't upsert, every repeat
    # after the first would hit a primary-key collision. Keep the first
    # occurrence of each item_code; report how many were dropped.
    seen = {}
    duplicates = 0
    for item in mapped_items:
        code = item["item_code"]
        if code in seen:
            duplicates += 1
            continue
        seen[code] = item
    deduped_items = list(seen.values())
    print(f"De-duplicated: {len(mapped_items)} -> {len(deduped_items)} unique item_code "
          f"({duplicates} duplicate names skipped)\n")

    # item_code is String(100) in the ItemMaster model -- some of these
    # long descriptive names may exceed that. Flag rather than silently
    # truncate (truncating could create NEW collisions between two
    # different long names that happen to share the first 100 chars).
    too_long = [item for item in deduped_items if len(item["item_code"]) > 100]
    if too_long:
        print(f"WARNING: {len(too_long)} items have item_code longer than 100 chars "
              f"(the column limit) -- these will fail on insert. Example:")
        print(f"  {too_long[0]['item_code']!r} ({len(too_long[0]['item_code'])} chars)")
        print()

    print("=== Sample mapped rows (first 3) ===")
    for item in deduped_items[:3]:
        print(item)
    print()

    confirm = input(f"About to insert {len(deduped_items)} items into ItemMaster. Proceed? [y/N] ")
    if confirm.strip().lower() != "y":
        print("Aborted -- nothing inserted.")
        return

    inserted = 0
    skipped = 0
    failed = []

    for item in deduped_items:
        if not item.get("item_code"):
            skipped += 1
            continue
        try:
            EDBR.create_item(item)
            inserted += 1
        except Exception as e:
            failed.append((item.get("item_code"), str(e)))

    print(f"\nInserted: {inserted}")
    print(f"Skipped (no item_code): {skipped}")
    print(f"Failed: {len(failed)}")

    if failed:
        print("\n=== First 10 failures ===")
        for item_code, error in failed[:10]:
            print(f"  {item_code}: {error}")


if __name__ == "__main__":
    main()