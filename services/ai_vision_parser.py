import os
import json
from groq import Groq
from database.repository import EDBR

client = Groq(api_key=os.getenv("GROQ_API_KEY", ""))


# ==============================
# CORE: VISION EXTRACTION
# ==============================
def extract_grn_from_image(base64_image: str) -> dict:

    prompt = """
    You are a data-extraction AI for a precision manufacturing ERP.
    Read the provided vendor invoice and convert it into a STRICT JSON format for a Goods Receipt Note (GRN).

    CRITICAL EXTRACTION RULES:
    1. Vendors often print a master item (e.g., "MCB 6-32A") but handwrite specific internal item codes, quantities, and descriptions underneath it (e.g., "12 nos - 37-0326 MCB 10A").
    2. YOU MUST SPLIT these nested handwritten notes into INDIVIDUAL line items. Do not group them into one row.
    3. Calculate or extract the rate for each split item if it shares a master rate.
    4. If an item code is not explicitly written, leave "item_code" as an empty string "".
    5. No proses, no explaination, response is expected only for JSON output.
    IMPORTANT:
- Do NOT calculate line amounts.
- Do NOT calculate taxes.
- Do NOT derive totals.
- Only extract values that physically appear on the invoice.
- If a rate is uncertain, return 0.
- If tax values are not explicitly printed, return 0.
    EXPECTED JSON SCHEMA:
    {
    "vendor_name": "",
    "invoice_number": "",
    "invoice_date": "",
    "items": [
        {
            "item_code": "",
            "description": "",
            "quantity": 0,
            "rate": 0
        }
    ]
}
    """

    response = client.chat.completions.create(
        model="meta-llama/llama-4-scout-17b-16e-instruct",
        messages=[
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": prompt},
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:image/jpeg;base64,{base64_image}"
                        }
                    }
                ],
            }
        ],
        temperature=0.1,
        max_tokens=1024,
        response_format={"type": "json_object"}
    )

    raw = response.choices[0].message.content.strip()

    # clean possible markdown noise
    if raw.startswith("```"):
        raw = raw.strip("`")
        if raw.startswith("json"):
            raw = raw[4:].strip()

    return json.loads(raw)


# ==============================
# ERP ENRICHMENT LAYER
# ==============================
def enrich_items_from_master(items: list) -> list:

    enriched = []

    for item in items:

        item_code = (item.get("item_code") or "").strip()

        item["item_description"] = ""
        item["matched_from_master"] = False

        if not item_code:
            enriched.append(item)
            continue

        try:
            master = EDBR.get_test_item_by_code(item_code)

        except Exception:
            master = None

        if master:
            item["item_description"] = master.get("item_specification", "")
            item["matched_from_master"] = True

        enriched.append(item)

    return enriched


# ==============================
# MAIN ENTRY (USED BY ROUTE)
# ==============================
def process_grn_image(base64_image: str) -> dict:

    data = extract_grn_from_image(base64_image)

    items = data.get("items", [])

    data["items"] = enrich_items_from_master(items)

    return data