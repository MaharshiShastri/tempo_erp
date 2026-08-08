"""
inspect_item_master.py

Fetches Item Master data from Tally and saves the TI* items to JSON.

IMPORTANT:
- Does NOT write anything to PostgreSQL.
- Does NOT call EDBR.create_item().
- Does NOT modify ItemMaster.
- This is purely for inspecting the Tally Item Master structure.
"""

import json
from collections import Counter
from datetime import datetime

from services.tally_client import (
    fetch_item_master,
    xml_to_item_master_json,
    filter_item_master_rows,
    stock_item_to_master_dict,
)


OUTPUT_FILE = "tally_ti_item_master.json"


def main():
    print("Fetching Item Master from Tally...")

    raw_xml = fetch_item_master()

    raw_items = xml_to_item_master_json(raw_xml)

    print(f"Got {len(raw_items)} raw items from Tally.\n")

    if not raw_items:
        print(
            "Nothing returned -- check Tally connection / "
            "company name before debugging further."
        )
        return

    # ---------------------------------------------------------
    # Filter to TI products
    # ---------------------------------------------------------

    filtered_items = filter_item_master_rows(
        raw_items,
        name_prefix="TI",
    )

    print(
        f"After filtering to names starting with 'TI': "
        f"{len(filtered_items)} items.\n"
    )

    # ---------------------------------------------------------
    # Item group breakdown
    # ---------------------------------------------------------

    group_counts = Counter(
        item.get("parent", "")
        for item in filtered_items
    )

    print("=== item_group breakdown ===")

    for group, count in group_counts.most_common():
        print(f"{count:5d}  {group!r}")

    print()

    # ---------------------------------------------------------
    # Current application mapping
    # ---------------------------------------------------------

    mapped_items = [
        stock_item_to_master_dict(item)
        for item in filtered_items
    ]

    # ---------------------------------------------------------
    # De-duplicate only for the mapped representation.
    #
    # We are NOT deleting anything from the raw Tally data.
    # This is only to show what would happen if item_code were
    # used as the primary key.
    # ---------------------------------------------------------

    seen = {}
    duplicates = 0

    for item in mapped_items:
        code = item.get("item_code")

        if not code:
            continue

        if code in seen:
            duplicates += 1
            continue

        seen[code] = item

    deduped_items = list(seen.values())

    print(
        f"Mapped items: {len(mapped_items)}"
    )

    print(
        f"Unique mapped item_codes: {len(deduped_items)}"
    )

    print(
        f"Duplicate item_codes detected: {duplicates}\n"
    )

    # ---------------------------------------------------------
    # Length check
    # ---------------------------------------------------------

    too_long = [
        item
        for item in deduped_items
        if len(item.get("item_code", "")) > 100
    ]

    if too_long:
        print(
            f"WARNING: {len(too_long)} items have item_code "
            f"longer than 100 characters."
        )

        print(
            f"Example: {too_long[0]['item_code']!r} "
            f"({len(too_long[0]['item_code'])} chars)"
        )

        print()

    # ---------------------------------------------------------
    # Save everything to JSON
    # ---------------------------------------------------------

    output = {
        "metadata": {
            "fetched_at": datetime.now().isoformat(),
            "source": "Tally ItemMaster",
            "company_filter": "TI",
            "total_items_from_tally": len(raw_items),
            "filtered_items": len(filtered_items),
            "mapped_items": len(mapped_items),
            "unique_item_codes": len(deduped_items),
            "duplicate_item_codes": duplicates,
            "item_codes_over_100_chars": len(too_long),
        },

        "item_group_breakdown": dict(group_counts),

        # This is the important section.
        # This preserves the normalized Tally structure.
        "raw_ti_items": filtered_items,

        # This shows how our current application code maps
        # Tally -> ItemMaster.
        "mapped_items": mapped_items,

        # This is what would currently be safe to insert
        # if item_code is the PK, but DO NOT insert yet.
        "deduplicated_mapped_items": deduped_items,
    }

    with open(
        OUTPUT_FILE,
        "w",
        encoding="utf-8",
    ) as f:
        json.dump(
            output,
            f,
            indent=2,
            ensure_ascii=False,
            default=str,
        )

    print(f"Saved Tally Item Master inspection data to:")
    print(f"  {OUTPUT_FILE}")

    print("\n=== First raw Tally item ===")

    if filtered_items:
        print(
            json.dumps(
                filtered_items[0],
                indent=2,
                ensure_ascii=False,
                default=str,
            )
        )

    print("\n=== First mapped ItemMaster item ===")

    if mapped_items:
        print(
            json.dumps(
                mapped_items[0],
                indent=2,
                ensure_ascii=False,
                default=str,
            )
        )


if __name__ == "__main__":
    main()