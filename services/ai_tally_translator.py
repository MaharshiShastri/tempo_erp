from groq import Groq
import json
import os

GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
client = Groq(api_key=GROQ_API_KEY)


def llm_normalize_tally(data: dict):
    """
    Converts raw parsed Tally dict → ERP structured JSON
    """

    prompt = f"""
You are an ERP financial data normalizer.

Convert this Tally data into clean structured JSON.

RULES:
- Do NOT change numeric values
- Do NOT invent fields
- Keep structure simple
- Output ONLY valid JSON
- Group financial items logically (Assets, Liabilities, Income, Expenses)

INPUT:
{json.dumps(data, indent=2)}
"""

    response = client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=[
            {"role": "system", "content": "Return only valid JSON."},
            {"role": "user", "content": prompt}
        ],
        temperature=0.3,
        response_format={"type": "json_object"},
    )

    return response.choices[0].message.content