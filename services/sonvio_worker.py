import os
import json
import requests
import redis
from database.repository import EDBR
import time

# Initialize Redis
redis_cache = redis.Redis(host="redis", port=6379, decode_responses=True)

SNOVIO_CLIENT_ID = os.getenv("SNOVIO_CLIENT_ID", "")
SNOVIO_CLIENT_SECRET = os.getenv("SNOVIO_CLIENT_SECRET", "")

def get_snovio_token():
    """Generates a temporary OAuth token for Snov.io"""
    token = redis_cache.get("snovio_access_token")
    if token:
        return token
        
    res = requests.post("https://api.snov.io/v1/oauth/access_token", data={
        "grant_type": "client_credentials",
        "client_id": SNOVIO_CLIENT_ID,
        "client_secret": SNOVIO_CLIENT_SECRET
    })
    
    if res.status_code == 200:
        data = res.json()
        token = data["access_token"]
        # Cache token just short of its 1-hour expiration
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

def process_target_domain(domain: str):
    """Fetches both Prospects and raw Domain Emails."""
    data_payload = {"prospects": [], "emails": []}
    
    # 1. Fetch Prospects (Names + Titles)
    prospect_params = {"domain": domain, "type": "personal", "limit": 10}
    p_res = requests.post("https://api.snov.io/v2/domain-search/prospects/start", headers=headers, params=prospect_params)
    if p_res.status_code == 202:
        p_data = poll_snovio_task(p_res.json()["links"]["result"])
        if p_data: data_payload["prospects"] = p_data.get("data", [])

    # 2. Fetch Raw Domain Emails
    e_res = requests.post("https://api.snov.io/v2/domain-search/domain-emails/start", headers=headers, params={"domain": domain})
    if e_res.status_code == 202:
        e_data = poll_snovio_task(e_res.json()["links"]["result"])
        if e_data: data_payload["emails"] = [e["email"] for e in e_data.get("data", [])]

    return data_payload

def run_automated_job():
    """Main loop: Only fetches Pending targets."""
    with EDBR._get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT id, domain FROM lead_targets WHERE status = 'Pending'")
            pending_targets = cur.fetchall()

    for target in pending_targets:
        raw_snovio_json = process_target_domain(target["domain"])
        
        with EDBR._get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    UPDATE lead_targets 
                    SET status = 'Awaiting Review', snovio_raw_data = %s
                    WHERE id = %s
                """, (json.dumps(raw_snovio_json), target["id"]))
                conn.commit()