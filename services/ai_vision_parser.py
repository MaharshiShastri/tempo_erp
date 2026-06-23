import os
import json
from groq import Groq
from database.repository import EDBR

client = Groq(api_key=os.getenv("GROQ_API_KEY", ""))


def calculate_grn_totals(items: list, shipping: float = 0):
    subtotal = sum(i["net_amount"] for i in items)
    discount_total = sum(i["discount_amount"] for i in items)
    taxable_subtotal = subtotal + shipping
    cgst = round(taxable_subtotal * 0.09, 2)
    sgst = round(taxable_subtotal * 0.09, 2)

    return {
        "subtotal": round(subtotal, 2),
        "discount_total": round(discount_total, 2),
        "taxes": {"cgst": cgst, "sgst": sgst},
        "grand_total": round(taxable_subtotal + cgst + sgst, 2)
    }


# ==============================
# AI EXTRACTION (RAW ONLY)
# ==============================
def extract_grn_from_image(base64_image: str) -> dict:

    prompt = """
You are a strict ERP data extraction engine.

Return ONLY valid JSON. No explanation.

RULES:
- Extract only visible values
- Do NOT compute any totals
- Extract the 'Original Unit Rate' (before discount).
- Extract the 'Discount Percentage' exactly as shown on the bill, if none then return 0.
- NEVER perform calculations. NEVER return net prices.
- If a value is missing, return 0.
- Item codes are always written after item descriptions.
- The item code always follows XX-XXXXX format.
- Range of item code is 02-0010 to 70-0045 inclusive.
- Ignore HSN/SAC Columns, codes are human-written only.
OUTPUT:

{
  "name": "string",
  "invoice_number": "string",
  "date": "string",
  "items": [
    {
      "item_code": "string",
      "item_name": "string",
      "quantity": number,
      "rate": number,
      "discount": number
    }
  ],
  "subtotal": number,
  "tax": {
    "cgst": number,
    "sgst": number
  },
  "discount": number,
  "shipping_charges": number,
  "total": number
}"""

    response = client.chat.completions.create(
        model="meta-llama/llama-4-scout-17b-16e-instruct",
        messages=[
            {
                "role": "system",
                "content": prompt,
            },
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": ""},
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:image/jpeg;base64,{base64_image}"
                        }
                    }
                ]
            }
        ],
        temperature=0.3,
        max_completion_tokens=2048,
        top_p=0.95,
        response_format={"type": "json_object"},
    )

    raw = response.choices[0].message.content.strip()

    # Cleanup if model ignores JSON mode
    if raw.startswith("```"):
        raw = raw.strip("`")
        if raw.startswith("json"):
            raw = raw[4:].strip()

    try:
        return json.loads(raw)

    except json.JSONDecodeError:
        import re

        match = re.search(r"\{.*\}", raw, re.DOTALL)
        if match:
            return json.loads(match.group(0))

        raise ValueError(f"Invalid JSON returned by model:\n{raw}")

# ==============================
# ITEM NORMALIZATION (SOURCE OF TRUTH)
# ==============================
def normalize_item(item: dict) -> dict:
    qty = float(item.get("quantity") or 0)
    rate = float(item.get("rate") or 0)
    disc_pct = float(item.get("discount_percent") or item.get("discount") or 0)

    gross = qty * rate
    discount_amount = gross * disc_pct / 100
    net = gross - discount_amount

    return {
        "item_code": (item.get("item_code") or "").strip(),
        "item_name": item.get("item_name", ""),
        "description": item.get("description", ""),

        "quantity": qty,
        "rate": rate,

        "discount_percent": disc_pct,
        "discount_amount": round(discount_amount, 2),

        "gross_amount": round(gross, 2),
        "net_amount": round(net, 2),
        "taxable_amount": round(net, 2),
    }


# ==============================
# MASTER ENRICHMENT
# ==============================
def enrich_items_from_master(items: list) -> list:
    enriched = []

    for item in items:
        code = (item.get("item_code") or "").strip()

        enriched_item = {
            **item,
            "item_description": None,
            "matched_from_master": False,
            "master_item_id": None,
            "master_version": None,
        }

        if not code:
            enriched.append(enriched_item)
            continue

        try:
            master = EDBR.get_test_item_by_code(code)
        except Exception:
            master = None

        if master:
            enriched_item.update({
                "item_description": master.get("item_specification", ""),
                "matched_from_master": True,
                "master_item_id": master.get("id"),
                "master_version": master.get("revision_no", 0),
            })
        else:
            enriched_item["item_description"] = "UNRESOLVED ITEM CODE"

        enriched.append(enriched_item)

    return enriched


# ==============================
# MAIN PIPELINE
# ==============================
def process_grn_image(base64_image: str) -> dict:
    data = extract_grn_from_image(base64_image)

    raw_items = data.get("items", [])

    items = [normalize_item(i) for i in raw_items]
    items = enrich_items_from_master(items)

    shipping = float(data.get("shipping_charges") or 0)

    totals = calculate_grn_totals(items, shipping)

    return {
        **data,
        "items": items,
        "shipping": shipping,
        **totals
    }