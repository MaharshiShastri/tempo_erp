import os
import json
import time
import requests
import redis
from database.repository import EDBR
from groq import Groq

# Initialize Redis
redis_cache = redis.Redis(host="redis", port=6379, decode_responses=True)

SNOVIO_CLIENT_ID = os.getenv("SNOVIO_CLIENT_ID", "")
SNOVIO_CLIENT_SECRET = os.getenv("SNOVIO_CLIENT_SECRET", "")
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")

def get_snovio_token():
    token = redis_cache.get("snovio_access_token")
    if token: return token
        
    res = requests.post("https://api.snov.io/v1/oauth/access_token", data={
        "grant_type": "client_credentials",
        "client_id": SNOVIO_CLIENT_ID,
        "client_secret": SNOVIO_CLIENT_SECRET
    })
    
    if res.status_code == 200:
        token = res.json()["access_token"]
        redis_cache.setex("snovio_access_token", 3500, token)
        return token
    return None

headers = {"Authorization": f"Bearer {get_snovio_token()}"}

def poll_snovio_task(result_url, max_retries=15):
    for _ in range(max_retries):
        res = requests.get(result_url, headers=headers)
        if res.status_code == 200 and res.json().get("status") == "completed":
            return res.json()
        time.sleep(3)
    return None

def ai_map_emails_to_prospects(prospects, emails):
    """Uses Groq to intelligently guess which email belongs to which prospect based on name patterns."""
    if not prospects or not emails or not GROQ_API_KEY:
        # Fallback if no API key or missing data
        return [{"full_name": f"{p.get('first_name','')} {p.get('last_name','')}", "designation": p.get('position',''), "email": "", "is_priority": True} for p in prospects]
    
    try:
        client = Groq(api_key=GROQ_API_KEY)
        prompt = f"""
        You are a data mapping assistant. I have a list of employees: {json.dumps(prospects)}. 
        I also have a list of company emails: {json.dumps(emails)}.
        Map the emails to the correct employees based on name patterns (e.g. john.doe@... matches John Doe).
        Return ONLY a JSON array of objects. Each object must have:
        'full_name' (string), 'designation' (string), 'email' (string, the matched email or empty if unknown), 'is_priority' (boolean, true if title contains purchase, quality, product, or r&d).
        """
        
        completion = client.chat.completions.create(
            model="llama3-8b-8192",
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"}
        )
        # Assuming the LLM returns {"mappings": [...] }
        result = json.loads(completion.choices[0].message.content)
        return result.get("mappings", result.get("data", []))
    except Exception as e:
        print(f"Groq Mapping Error: {e}")
        return []

def process_target_domain(domain: str):
    """Fetches Prospects and Emails, then maps them."""
    prospects = []
    emails = []
    
    # 1. Fetch Prospects
    p_res = requests.post("https://api.snov.io/v2/domain-search/prospects/start", headers=headers, params={"domain": domain, "type": "personal", "limit": 10})
    if p_res.status_code == 202:
        p_data = poll_snovio_task(p_res.json()["links"]["result"])
        if p_data: prospects = p_data.get("data", [])

    # 2. Fetch Raw Domain Emails
    e_res = requests.post("https://api.snov.io/v2/domain-search/domain-emails/start", headers=headers, params={"domain": domain})
    if e_res.status_code == 202:
        e_data = poll_snovio_task(e_res.json()["links"]["result"])
        if e_data: emails = [e["email"] for e in e_data.get("data", [])]

    # 3. AI Mapping
    mapped_data = ai_map_emails_to_prospects(prospects, emails)
    
    return {
        "raw_emails": emails, # Kept for the frontend dropdown list
        "mapped_contacts": mapped_data
    }

def run_automated_job():
    """Main loop: ONLY fetches Pending targets."""
    with EDBR._get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT id, domain FROM lead_targets WHERE status = 'Pending'")
            pending_targets = cur.fetchall()

    for target in pending_targets:
        staging_data = process_target_domain(target["domain"])
        
        with EDBR._get_connection() as conn:
            with conn.cursor() as cur:
                # Store in staging column and set to Awaiting Review
                cur.execute("""
                    UPDATE lead_targets 
                    SET status = 'Awaiting Review', snovio_raw_data = %s
                    WHERE id = %s
                """, (json.dumps(staging_data), target["id"]))
                conn.commit()