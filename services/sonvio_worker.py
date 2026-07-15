import os
import json
import time
import requests
import redis
from database.repository import EDBR, SessionLocal
from groq import Groq
import logging
from datetime import datetime
import tldextract
from urllib.parse import urlparse
import re
import pprint
from sqlalchemy import select, func
from database.models import LeadTarget

logging.basicConfig(level=logging.INFO, format="%(asctime)s | %(levelname)s | %(message)s")
logger = logging.getLogger("leadgen")
RAW_DIR = "/app/data/snovio_raw"
os.makedirs(RAW_DIR, exist_ok=True)

redis_cache = redis.Redis(host="redis", port=6379, decode_responses=True)

SNOVIO_CLIENT_ID = os.getenv("SNOVIO_CLIENT", "")
SNOVIO_CLIENT_SECRET = os.getenv("SNOVIO_SECRET", "")
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")

def save_raw_snovio(domain, prospects_raw, emails_raw):
    try:
        timestamp = datetime.now().strftime("%Y-%m-%d_%H%M%S")
        filename = f"{domain}_{timestamp}.json".replace("/", "_")
        path = os.path.join(RAW_DIR, filename)
        payload = {
            "domain": domain,
            "timestamp": timestamp,
            "prospects_raw": prospects_raw,
            "emails_raw": emails_raw
        }
        with open(path, "w") as f:
            json.dump(payload, f, indent=2)
        logger.info(f"Raw saved: {path}")
        return path
    except Exception as e:
        logger.error(f"FAILED to save raw file: {e}")
        return None

def safe_request(method, url, **kwargs):
    kwargs.setdefault("timeout", 20)
    for attempt in range(3):
        try:
            res = requests.request(method, url, **kwargs)
            return res
        except requests.exceptions.RequestException as e:
            logger.warning(f"[HTTP RETRY {attempt+1}] {url} | {e}")
    logger.error(f"[HTTP FAILED] {url}")
    return None

def get_snovio_token():
    token = redis_cache.get("snovio_access_token")
    if token:
        logger.info("Snovio token loaded from cache")
        return token

    logger.info("Requesting NEW Snovio token")
    res = safe_request(
        "POST",
        "https://api.snov.io/v1/oauth/access_token",
        data={
            "grant_type": "client_credentials",
            "client_id": SNOVIO_CLIENT_ID,
            "client_secret": SNOVIO_CLIENT_SECRET
        }
    )
    if not res:
        return None

    if res.status_code == 200:
        token = res.json().get("access_token")
        redis_cache.setex("snovio_access_token", 3500, token)
        logger.info("Snovio token cached")
        return token

    logger.error(f"Token error: {res.text}")
    return None

def get_headers():
    return {"Authorization": f"Bearer {get_snovio_token()}"}

def poll_snovio_task(result_url, max_retries=15):
    logger.info(f"Polling Snovio task: {result_url}")
    for i in range(max_retries):
        res = safe_request("GET", result_url, headers=get_headers())
        if not res:
            time.sleep(3)
            continue
        try:
            data = res.json()
        except Exception as e:
            logger.warning(f"Invalid JSON: {e}")
            time.sleep(3)
            continue

        logger.info(f"Poll {i+1}: {data}")
        if res.status_code == 200 and data.get("status") == "completed":
            logger.info("Snovio task completed")
            return data
        time.sleep(3)
    logger.warning("Snovio polling timeout")
    return None

def ai_map_emails_to_prospects(prospects, emails):
    if not prospects or not emails or not GROQ_API_KEY:
        # Fallback mapping
        return [
            {
                "full_name": f"{p.get('first_name','')} {p.get('last_name','')}".strip() or "Unknown Executive",
                "designation": p.get("position", "Unknown Designation"),
                "email": "",
                "is_priority": True
            }
            for p in prospects
        ]

    try:
        logger.info("Starting Groq mapping")
        client = Groq(api_key=GROQ_API_KEY)
        prompt = f"""
        You are a data mapping assistant. I have a list of employees: {json.dumps(prospects)}. 
        I also have a list of company emails: {json.dumps(emails)}.
        Map the emails to the correct employees based on name patterns (e.g. john.doe@... matches John Doe).
        Return ONLY a JSON array of objects. Each object must have:
        'full_name' (string), 'designation' (string), 'email' (string, the matched email or empty if unknown), 'is_priority' (boolean, true if title contains purchase, quality, product, or r&d).
        
        Output a valid JSON array of objects under a key named 'mappings' like so:
        {{
            "mappings": [
                {{
                    "full_name": "Full Name",
                    "designation": "Position",
                    "email": "matched_email_or_empty_string",
                    "is_priority": true_or_false
                }}
            ]
        }}
        """
        completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"}
        )
        logger.info("=" * 80)
        logger.info("[STEP 3] SENDING TO GROQ")
        logger.info(prompt)
        logger.info("=" * 80)
        time.sleep(3)

        result = json.loads(completion.choices[0].message.content)
        logger.info("=" * 80)
        logger.info("[STEP 5] PARSED GROQ JSON")

        pprint.pprint(result)

        logger.info("=" * 80)
        time.sleep(3)

        logger.info("Groq mapping successful")
        return result.get("mappings", result.get("data", []))
    except Exception as e:
        logger.error(f"Groq mapping error: {e}")
        return []

def clean_domain(domain: str) -> str:
    if not domain:
        return ""

    domain = domain.strip().lower()

    if "@" in domain:
        domain = domain.split("@")[-1]

    if not re.match(r"^https?://", domain):
        domain = "https://" + domain

    host = urlparse(domain).netloc or urlparse(domain).path
    host = host.split("@")[-1].split(":")[0]

    extracted = tldextract.extract(host)

    if extracted.domain and extracted.suffix:
        return f"{extracted.domain}.{extracted.suffix}"

    return host.replace("www.", "")


def process_target_domain(domain: str):
    try:
        domain = clean_domain(domain)
        logger.info(f"Processing domain: {domain}")
        prospects_raw_response = None
        emails_raw_response = None
        prospects = []
        emails = []

        # ---- PROSPECTS ----
        p_res = safe_request(
            "POST",
            "https://api.snov.io/v2/domain-search/prospects/start",
            headers=get_headers(),
            params={"domain": domain, "type": "personal", "limit": 10}
        )
        if p_res and p_res.status_code == 202:
            p_data = poll_snovio_task(p_res.json()["links"]["result"])
            logger.info("=" * 80)
            logger.info("[DEBUG] RAW PROSPECT RESPONSE FROM SNOV.IO")
            pprint.pprint(p_data)
            logger.info("=" * 80)
            time.sleep(3)

            if p_data:
                prospects_raw_response = p_data
                prospects = p_data.get("data", [])
                logger.info("=" * 80)
                logger.info(f"[STEP 1] PROSPECTS FOUND: {len(prospects)}")

                if prospects:
                    pprint.pprint(prospects)
                else:
                    logger.warning("No prospects returned from Snov.io.")

                logger.info("=" * 80)
                time.sleep(3)

        # ---- EMAILS ----
        e_res = safe_request(
            "POST",
            "https://api.snov.io/v2/domain-search/domain-emails/start",
            headers=get_headers(),
            params={"domain": domain}
        )
        
        if e_res and e_res.status_code == 202:
            e_data = poll_snovio_task(e_res.json()["links"]["result"])
            if e_data:
                emails_raw_response = e_data
                emails = [e["email"] for e in e_data.get("data", [])]
                logger.info("=" * 80)
                logger.info("[DEBUG] RAW EMAIL RESPONSE FROM SNOV.IO")
                pprint.pprint(e_data)
                logger.info("=" * 80)
                time.sleep(3)
                
                logger.info("=" * 80)
                logger.info(f"[STEP 2] DOMAIN EMAILS FOUND: {len(emails)}")

                if emails:
                    pprint.pprint(emails)
                else:
                    logger.warning("No domain emails returned from Snov.io.")

                logger.info("=" * 80)
                time.sleep(3)

        raw_file_path = save_raw_snovio(domain, prospects_raw_response, emails_raw_response)

        # ---- DATA ENRICHMENT CONSOLIDATION ----
        mapped_data = ai_map_emails_to_prospects(prospects, emails)

        logger.info("=" * 80)
        logger.info(f"[STEP 6] FINAL MAPPED CONTACTS ({len(mapped_data)})")

        pprint.pprint(mapped_data)

        logger.info("=" * 80)
        time.sleep(3)

        # Self-healing logic: If mapping output is completely empty but we have raw emails, create placeholders
        if not mapped_data and emails:
            mapped_data = [
                {
                    "full_name": "Review Pending",
                    "designation": "Awaiting Designation",
                    "email": email,
                    "is_priority": False
                }
                for email in emails
            ]
            
        # Ensure that if mapping is present, we still include prospects that have no email mapped
        # so they can be matched via dropdown on the frontend
        if mapped_data and prospects and len(mapped_data) < len(prospects):
            existing_names = {m.get("full_name", "").lower() for m in mapped_data}
            for p in prospects:
                fullname = f"{p.get('first_name','')} {p.get('last_name','')}".strip()
                if fullname.lower() not in existing_names:
                    mapped_data.append({
                        "full_name": fullname,
                        "designation": p.get("position", "Unknown Position"),
                        "email": "",
                        "is_priority": False
                    })

        return {
            "raw_emails": emails,
            "mapped_contacts": mapped_data,
            "raw_file": raw_file_path
        }
    except Exception as e:
        logger.error(f"Domain failed: {domain} | {e}")
        return {
            "raw_emails": [],
            "mapped_contacts": [],
            "error": str(e)
        }

def run_automated_job():
    logger.info("===== START AUTOMATED JOB =====")
    with SessionLocal() as session:
        ranked = (select(LeadTarget.id, LeadTarget.domain, LeadTarget.requested_by, func.row_number().over(partition_by=LeadTarget.requested_by, order_by=LeadTarget.created_at).label("rn")).where(LeadTarget.status == "Pending").subquery())

        stmt = (select(ranked.c.id, ranked.c.domain, ranked.c.requested_by).where(ranked.c.rn <= 10))

        pending_targets = session.execute(stmt).mappings().all()
    
    logger.info(f"Found {len(pending_targets)} targets")

    with SessionLocal() as session:
        for target in pending_targets:
            try:
                logger.info(f"Processing target {target['id']} | {target['domain']}")
                staging_data = process_target_domain(target["domain"])

                lead_target = session.get(LeadTarget, target['id'])
                if not lead_target:
                    logger.warning(f"Target {target.id} disappeared")
                    continue
                        
                logger.info("=" * 80)
                logger.info(f"[STEP 8] DATABASE UPDATE SUCCESSFUL")
                logger.info(f"Target ID {target['id']} committed successfully.")
                logger.info("=" * 80)
                time.sleep(3)

                lead_target.status = "Awaiting Review"
                lead_target.snovio_raw_data = staging_data

                session.commit()
                    
                logger.info("=" * 80)
                logger.info(f"[STEP 8] DATABASE UPDATE SUCCESSFUL")
                logger.info(f"Target ID {target['id']} committed successfully.")
                logger.info("=" * 80)
                time.sleep(3)

                logger.info(f"SUCCESS target {target['id']}")
            except Exception as e:
                logger.error(f"FAILED target {target['id']} | {e}")
                with SessionLocal() as session:
                    lead_target = session.get(LeadTarget, target.id)

                    if lead_target:
                        lead_target.status = "Failed"
                        session.commit()
                        
def run_automated_job_entry():
    return run_automated_job()