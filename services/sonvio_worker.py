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
INDIA_SME_TITLE_FILTERS = [
    "Production Manager",
    "Manufacturing Manager",
    "Plant Manager",
    "Operations Manager",
    "R&D Manager",
    "Research and Development Manager",
    "Engineering Manager",
    "Purchase Manager",
    "Procurement Manager",
    "Sourcing Manager",
    "Quality Manager",
    "Quality Assurance Manager",
    "Quality Control Manager",
    "QA Manager",
    "QC Manager",
]

ROLE_KEYWORDS = (
    "production",
    "manufacturing",
    "plant",
    "operations",
    "r&d",
    "research and development",
    "engineering",
    "purchase",
    "purchasing",
    "procurement",
    "sourcing",
    "quality",
    "quality assurance",
    "quality control",
    "qa",
    "qc",
)

DECISION_MAKER_KEYWORDS = (
    "manager",
    "head",
    "director",
    "vp",
    "vice president",
    "chief",
)

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
            response = requests.request(method, url, **kwargs)

            logger.info(
                "Snov.io request: %s %s -> HTTP %s",
                method,
                url.split("?")[0],
                response.status_code,
            )

            return response

        except requests.exceptions.RequestException as exc:
            logger.warning(
                "[HTTP RETRY %s/3] %s | %s",
                attempt + 1,
                url.split("?")[0],
                exc,
            )

    logger.error("[HTTP FAILED] %s", url.split("?")[0])
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
        if res is None:
            time.sleep(3)
            continue
        try:
            data = res.json()
        except Exception as e:
            logger.warning(f"Invalid JSON: {e}")
            time.sleep(3)
            continue

        logger.info( "Poll %s: HTTP %s, status=%s", i + 1, res.status_code, data.get("status"),)

        if res.status_code == 200 and data.get("status") == "completed":
            logger.info("Snovio task completed")
            return data
        time.sleep(3)
    logger.warning("Snovio polling timeout")
    return None

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
def get_india_sme_decision_maker_score(prospect: dict) -> int:
    title = (prospect.get("job_title") or "").strip().lower()

    if not title:
        return 0

    role_match = any(keyword in title for keyword in ROLE_KEYWORDS)
    decision_maker_match = any(
        keyword in title
        for keyword in DECISION_MAKER_KEYWORDS
    )

    if not role_match:
        return 0

    score = 60

    if decision_maker_match:
        score += 30

    company = prospect.get("company") or {}
    company_size = company.get("size")

    if company_size in {"51-200", "201-500"}:
        score += 10

    return min(score, 100)


def start_india_sme_database_search(page: int = 1):
    token = get_snovio_token()

    if not token:
        raise RuntimeError("Unable to obtain a Snov.io access token.")

    payload = {
        # Included to follow Snov.io's documented Database Search example.
        "access_token": token,

        "page": page,

        "filters": {
            "prospect": {
                "job_titles": {
                    "include": INDIA_SME_TITLE_FILTERS,
                },
                "management_levels": {
                    "include": [
                        "manager_level",
                        "director_level",
                        "vp_level",
                        "c_level",
                    ],
                },
                "departments": {
                    "include": [
                        "operations",
                        "engineering",
                    ],
                },
            },
            "company": {
                "locations": {
                    "include": {
                        "locality": "India",
                        "location_type": "country",
                    },
                },
                "size": [
                    "11-50",
                    "51-200",
                    "201-500",
                ],
            },
        },
    }

    response = safe_request(
        "POST",
        "https://api.snov.io/v2/database-search/prospects/start",
        headers={
            "Authorization": f"Bearer {token}",
            "Accept": "application/json",
            "Content-Type": "application/json",
        },
        json=payload,
    )

    # Important: test explicitly for None.
    if response is None:
        raise RuntimeError(
            "Snov.io Database Search did not return an HTTP response."
        )

    if response.status_code not in (200, 202):
        logger.error(
            "Database Search rejected the request. HTTP %s: %s",
            response.status_code,
            response.text[:2000],
        )

        raise RuntimeError(
            f"Database Search failed with HTTP "
            f"{response.status_code}: {response.text[:500]}"
        )

    search_data = response.json()
    result_url = (search_data.get("links") or {}).get("result")

    if not result_url:
        raise RuntimeError(
            f"Database Search returned no result URL: {search_data}"
        )

    return poll_snovio_task(result_url)


def reveal_prospect_email(reveal_url: str) -> list[dict]:
    if not reveal_url:
        return []

    start_response = safe_request(
        "POST",
        reveal_url,
        headers=get_headers(),
        json={},
    )

    if start_response is None:
        return []

    if start_response.status_code not in (200, 202):
        logger.warning(
            "Email reveal failed: %s | %s",
            start_response.status_code,
            start_response.text,
        )
        return []

    start_data = start_response.json()
    result_url = (start_data.get("links") or {}).get("result")

    if not result_url:
        return []

    result_data = poll_snovio_task(result_url)

    if not result_data:
        return []

    return ((result_data.get("data") or {}).get("emails") or [])


def process_indian_sme_decision_makers(page: int = 1):
    search_result = start_india_sme_database_search(page)

    search_data = (search_result or {}).get("data") or {}
    prospects = search_data.get("prospects") or []

    shortlisted = []

    for prospect in prospects:
        score = get_india_sme_decision_maker_score(prospect)

        # Quality-first: skip weak or incorrectly titled profiles.
        if score < 70:
            continue

        shortlisted.append({
            "prospect": prospect,
            "lead_score": score,
        })

    mapped_contacts = []
    reveal_results = []

    for item in shortlisted:
        prospect = item["prospect"]
        reveal_url = prospect.get("email_and_hidden_info_reveal")

        emails = reveal_prospect_email(reveal_url)

        # Keep verified emails only. Unknown/unverifiable emails are skipped.
        valid_emails = [
            email_data["email"]
            for email_data in emails
            if email_data.get("email")
            and email_data.get("smtp_status") == "valid"
        ]

        reveal_results.append({
            "prospect": prospect,
            "emails": emails,
        })

        if not valid_emails:
            continue

        company = prospect.get("company") or {}

        for email in valid_emails:
            mapped_contacts.append({
                "full_name": " ".join(
                    filter(
                        None,
                        [
                            prospect.get("first_name"),
                            prospect.get("last_name"),
                        ],
                    )
                ).strip() or "Unknown Contact",

                "designation": prospect.get("job_title") or "Unknown Title",
                "email": email,

                "is_priority": item["lead_score"] >= 80,

                # Extra metadata is safe for the current frontend to ignore.
                "lead_score": item["lead_score"],
                "linkedin_url": prospect.get("linkedin_url"),
                "company_name": company.get("name"),
                "company_domain": company.get("domain"),
                "company_industry": company.get("industry"),
                "company_size": company.get("size"),
                "company_location": company.get("location"),
            })

    raw_file_path = save_raw_snovio(
        "india_sme_decision_makers",
        search_result,
        reveal_results,
    )

    return {
        "raw_emails": [
            contact["email"]
            for contact in mapped_contacts
        ],
        "mapped_contacts": mapped_contacts,
        "raw_file": raw_file_path,
        "search_page": page,
        "total_prospects_found": search_data.get("total", 0),
        "total_pages": search_data.get("total_pages", 0),
        "shortlisted_count": len(shortlisted),
    }

def run_automated_job():
    logger.info("===== START INDIA SME DECISION-MAKER JOB =====")

    with SessionLocal() as session:
        ranked = (
            select(
                LeadTarget.id,
                LeadTarget.requested_by,
                func.row_number()
                .over(
                    partition_by=LeadTarget.requested_by,
                    order_by=LeadTarget.created_at,
                )
                .label("rn"),
            )
            .where(LeadTarget.status == "Pending")
            .subquery()
        )

        pending_targets = session.execute(
            select(
                ranked.c.id,
                ranked.c.requested_by,
            ).where(ranked.c.rn <= 10)
        ).mappings().all()

    logger.info("Found %s pending lead-generation requests", len(pending_targets))

    for target in pending_targets:
        try:
            # Each request receives another results page,
            # avoiding the exact same first-page results repeatedly.
            search_page = redis_cache.incr(
                "snovio:india_sme_decision_makers:next_page"
            )

            logger.info(
                "Processing target %s using Database Search page %s",
                target["id"],
                search_page,
            )

            staging_data = process_indian_sme_decision_makers(
                page=search_page
            )

            with SessionLocal() as session:
                lead_target = session.get(
                    LeadTarget,
                    target["id"],
                )

                if not lead_target:
                    logger.warning(
                        "Target %s no longer exists",
                        target["id"],
                    )
                    continue

                lead_target.status = "Awaiting Review"
                lead_target.snovio_raw_data = staging_data

                session.commit()

            logger.info(
                "Target %s completed with %s verified decision-makers",
                target["id"],
                len(staging_data["mapped_contacts"]),
            )

        except Exception as exc:
            logger.exception(
                "Lead generation failed for target %s: %s",
                target["id"],
                exc,
            )

            with SessionLocal() as session:
                lead_target = session.get(
                    LeadTarget,
                    target["id"],
                )

                if lead_target:
                    lead_target.status = "Failed"
                    session.commit()

                        
def run_automated_job_entry():
    return run_automated_job()