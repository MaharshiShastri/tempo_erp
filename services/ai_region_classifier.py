import os
from groq import Groq

API_KEY = os.getenv("GROQ_API_KEY", "")

print(API_KEY)

client = Groq(api_key=API_KEY)

def classify_city_zone(city: str, zones: list):
    
    if API_KEY:
        print("API KEY found")
    else:
        print("NO API KEY")
    
    zone_text = "\n".join([
        f"{z['zone_code']} = {z['zone_name']}"
        for z in zones
    ])

    prompt = f"""
You are a logistics routing classifier.

Return ONLY the zone_code.

No explanation.
No markdown.
No JSON.

City:
{city}

Available Zones:

{zone_text if zone_text else zones}
"""

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        temperature=0,
        messages=[
            {
                "role": "user",
                "content": prompt
            }
        ]
    )

    return (response.choices[0].message.content.strip())

def get_zone_for_city(city: str, state: str, zones: list):
    zone_text = "\n".join(
        [f"{z.get('zone_code')} = {z.get('zone_name')}" for z in zones]
    )

    prompt = f"""
You are a logistics routing classifier.

Return ONLY the zone_code.
No explanation.
No markdown.
No JSON.

City: {city}
State: {state}

Available Zones:
{zone_text if zone_text else str(zones)}
"""

    response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            temperature=0,
            messages=[
                {"role": "user", "content": prompt}
            ]
        )
    print(response)
    return response.choices[0].message.content.strip()