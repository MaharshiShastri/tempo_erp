import os
import json
import requests
import redis
from database.repository import EDBR

# Initialize Redis
redis_cache = redis.Redis(host='localhost', port=6379, db=0, decode_responses=True)

SNOVIO_CLIENT_ID = os.getenv("SNOVIO_CLIENT_ID", "your_client_id")
SNOVIO_CLIENT_SECRET = os.getenv("SNOVIO_CLIENT_SECRET", "your_client_secret")

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

def process_target_domain(target_id: int, domain: str, gtm_source: str = "Snov.io", cost: float = 0.015):
    """Fetches high-value roles from Snov.io with Redis Caching"""
    cache_key = f"{gtm_source.lower()}_domain:{domain}"
    
    # 1. Check Redis Cache (Don't waste credits on duplicate lookups!)
    cached_data = redis_cache.get(cache_key)
    
    if cached_data:
        emails_data = json.loads(cached_data)
    else:
        # 2. Call Snov.io API Domain Search V2
        token = get_snovio_token()
        url = "https://api.snov.io/v2/domain-search"
        
        # We strictly target the exact roles you requested
        params = {
            "domain": domain,
            "type": "personal",
            "positions[]": ["Purchase", "Quality Analyst", "Quality Control", "Product Manager"],
            "limit": 10
        }
        
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.get(url, headers=headers, params=params)
        
        if response.status_code == 200:
            emails_data = response.json().get("emails", [])
            # 3. Cache the results for 30 days to save money
            redis_cache.setex(cache_key, 2592000, json.dumps(emails_data))
        else:
            emails_data = []

    # 4. Save to PostgreSQL Database
    emails_found_count = len(emails_data)
    with EDBR._get_connection() as conn:
        with conn.cursor() as cur:
            # Mark target completed, update cost and yield
            cur.execute("""
                UPDATE lead_targets 
                SET status = 'Completed', emails_found = %s, gtm_source = %s, cost_per_credit = %s
                WHERE id = %s
            """, (emails_found_count, gtm_source, cost, target_id))
            
            # Insert the actual contacts
            for emp in emails_data:
                full_name = f"{emp.get('firstName', '')} {emp.get('lastName', '')}".strip()
                designation = emp.get('position', 'Unknown')
                email = emp.get('email', '')
                
                # Flag priority based on keyword
                is_priority = any(keyword in designation.lower() for keyword in ["purchase", "quality", "product"])
                
                cur.execute("""
                    INSERT INTO lead_contacts (target_id, full_name, designation, email, is_priority)
                    VALUES (%s, %s, %s, %s, %s)
                """, (target_id, full_name, designation, email, is_priority))
            conn.commit()