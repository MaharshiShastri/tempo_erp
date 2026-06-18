import os
import json
from groq import Groq

# Uses your existing Groq API Key
client = Groq(api_key=os.getenv("GROQ_API_KEY", ""))

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

    try:
        response = client.chat.completions.create(
            model="meta-llama/llama-4-scout-17b-16e-instruct", # Groq's high-speed vision model
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt},
                        {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{base64_image}"}}
                    ],
                }
            ],
            temperature=0.1,
            max_tokens=1024,
            response_format={"type": "json_object"}
        )

        raw_content = response.choices[0].message.content.strip()
        print(raw_content)
        # Clean up markdown formatting if the AI wraps it in ```json
        if raw_content.startswith("```"):
            raw_content = raw_content.strip("`")

            if raw_content.startswith("json"):
                raw_content = raw_content[4:]

            raw_content = raw_content.strip()
        return json.loads(raw_content)
    except Exception as e:
        raise ValueError(f"Vision API failure: {str(e)}")