import os
import json
from groq import Groq

# Ensure you have GROQ_API_KEY set in your environment
client = Groq(api_key=os.getenv("GROQ_API_KEY", ""))

def extract_logistics_profile_from_text(contract_text: str) -> dict:
    prompt = """
    You are an expert logistics data extraction AI. 
    Analyze the provided transport contract text and extract the commercial parameters into a STRICT JSON structure.
    If a specific value is missing, use sensible defaults (0 for numbers, empty strings for text).
    If zones are explicity not defined, then group states/regions by common rates. For example Maharashtra, Gujarat have 10 rupees and Telagana and Andhra Pradesh have 15 rupees but no zone code defined, then simply state them as WEST-1 and SOUTH-1.
    REQUIRED JSON SCHEMA:
    {
        "name": "Transporter Name",
        "cft_factor": 10.0,
        "minimum_weight": 0.0,
        "minimum_freight_value": 0.0,
        "documentation_charge": 0.0,
        "fov_percentage": 0.0,
        "gst_percentage": 18.0,
        "zones": [{"zone_code": "Z1", "zone_name": "Zone Name", "states_raw": "State1, State2"}],
        "rates": [{"destination_zone": "Z1", "rate_per_kg": 15.5}],
        "fuel_matrix": [{"fuel_price_from": 90.0, "fuel_price_to": 100.0, "surcharge_percentage": 5.0}],
        "oda_matrix": [{"km_from": 0.0, "km_to": 50.0, "weight_from": 0.0, "weight_to": 100.0, "oda_charge": 500.0}]
    }

    CONTRACT TEXT:
    """ + contract_text

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}],
        response_format={"type": "json_object"},
        temperature=0.1 # Low temperature for strict factual extraction
    )

    raw_content = response.choices[0].message.content.strip()
    return json.loads(raw_content)