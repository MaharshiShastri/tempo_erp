from fastapi import APIRouter, Header, HTTPException, Depends, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from database.repository import EDBR
from services.ai_region_classifier import classify_city_zone
from security import SECRET_KEY, verify_bearer_token
import jwt
import json
import asyncio
from typing import Dict
import os

x_api_key = os.getenv("x_api_key", "")
router = APIRouter(prefix="/api/v1/crm", tags=["CRM & Leads"])

# --- SSE Connection Manager (Kept exactly as you had it) ---
class SSEManager:
    def __init__(self):
        self.clients: Dict[str, asyncio.Queue] = {}

    async def get_queue(self, email: str) -> asyncio.Queue:
        if email not in self.clients:
            self.clients[email] = asyncio.Queue()
        return self.clients[email]

    async def notify(self, email: str, data: dict):
        if email in self.clients:
            await self.clients[email].put(json.dumps(data))

    def remove_client(self, email: str):
        if email in self.clients:
            del self.clients[email]

sse_manager = SSEManager()

def verify_token_query(token: str):
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid session token")

# --- FRONTEND INTEGRATION ENDPOINTS ---

@router.get("/leads")
def get_active_leads(user: dict = Depends(verify_bearer_token)):
    try:
        return EDBR.get_crm_leads(user)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class StatusUpdatePayload(BaseModel):
    status: str

@router.patch("/leads/{lead_id}/status")
def update_lead_status(lead_id: int, payload: StatusUpdatePayload, user: dict = Depends(verify_bearer_token)):
    try:
        EDBR.update_crm_lead_status(lead_id, payload.status)
        return {"status": "success", "new_status": payload.status}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/stream")
async def crm_event_stream(request: Request, token: str):
    user = verify_token_query(token)
    email = user["email"]
    queue = await sse_manager.get_queue(email)

    async def event_generator():
        try:
            while True:
                if await request.is_disconnected():
                    break
                data = await queue.get()
                yield f"data: {data}\n\n"
        finally:
            sse_manager.remove_client(email)

    return StreamingResponse(event_generator(), media_type="text/event-stream")

# --- WPFORMS WEBHOOK INTEGRATION ---

@router.post("/website-webhook")
async def receive_website_inquiry(payload: dict, x_api_key: str = Header(...)):
    # Basic Security Check
    if x_api_key !=  "":
        raise HTTPException(status_code=403, detail="Unauthorized Webhook Access")
        
    try:
        # Extract fields matching your WPForms setup
        full_name = payload.get("Name", "Unknown Prospect")
        designation = payload.get("Designation", "")
        company_name = payload.get("Business/Organization", "")
        contact_email = payload.get("Contact Email", "")
        phone_number = payload.get("Phone Number", "")
        city_state = payload.get("City, State", "Unknown")
        product_query = payload.get("Product Query list", "")
        gdpr_consent = str(payload.get("GDPR Agreement", "")).lower() in ['true', 'yes', 'agreed', '1']
        
        # 1. AI Region Classification (Assumes you have a hardcoded list of available zones)
        available_zones = EDBR.get_sales_regions()

        if not available_zones:
            available_zones = [{"zone_code": "Unassigned", "zone_name": "General Inquiry"}]


        assigned_region = classify_city_zone(city_state, available_zones)
        
        # 2. Find which sales rep is assigned to this region
        sales_rep_email = EDBR.get_sales_rep_by_region(assigned_region)
        
        # 3. Save to CRM Database
        lead_id = EDBR.create_crm_lead({
            "full_name": full_name,
            "designation": designation,
            "company_name": company_name,
            "contact_email": contact_email,
            "phone_number": phone_number,
            "city_state": city_state,
            "product_query": product_query,
            "gdpr_consent": gdpr_consent,
            "assigned_region": assigned_region,
            "assigned_to": sales_rep_email
        })
        
        # 4. Push SSE alert directly to the specific sales rep
        await sse_manager.notify(sales_rep_email, {
            "type": "CRM_LEAD",
            "message": f"New Inquiry from {company_name} in ({city_state})."
        })
        
        return {"status": "Lead captured and assigned successfully"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))