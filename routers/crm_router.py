from fastapi import APIRouter, Header, HTTPException, Depends, Request
from fastapi.responses import StreamingResponse
from database.repository import EDBR
from services.ai_region_classifier import classify_city_zone
from security import SECRET_KEY
import jwt
import json
import asyncio
from typing import Dict

router = APIRouter(prefix="/api/v1/crm", tags=["CRM & Leads"])

# --- SSE Connection Manager ---
class SSEManager:
    def __init__(self):
        # Maps user emails to an async queue of messages
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

# --- Custom Auth for SSE (Reads from URL instead of Header) ---
def verify_token_query(token: str):
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid session token")

# --- 1. The SSE Streaming Endpoint ---
@router.get("/stream")
async def crm_event_stream(request: Request, token: str):
    user = verify_token_query(token)
    email = user["email"]
    queue = await sse_manager.get_queue(email)

    async def event_generator():
        try:
            while True:
                # If client closes the browser, break the loop
                if await request.is_disconnected():
                    break
                    
                # Wait here until a new lead is placed in the queue
                data = await queue.get()
                
                # SSE format requires "data: {payload}\n\n"
                yield f"data: {data}\n\n"
        finally:
            sse_manager.remove_client(email)

    return StreamingResponse(event_generator(), media_type="text/event-stream")

# --- 2. The GoDaddy Webhook ---
@router.post("/website-webhook")
async def receive_website_inquiry(payload: dict, x_api_key: str = Header(...)):
    if x_api_key != "YOUR_SECRET_WEBSITE_TOKEN":
        raise HTTPException(status_code=403, detail="Unauthorized")
        
    try:
        customer_name = payload.get("name")
        city = payload.get("city")
        
        assigned_region = classify_city_zone(city, EDBR.get_sales_regions())
        sales_rep = EDBR.get_sales_rep_by_region(assigned_region)
        
        # 1. Save to database (Assuming EDBR.create_crm_lead is implemented)
        # EDBR.create_crm_lead(...)
        
        # 2. Push alert directly to the specific sales rep's open SSE stream
        await sse_manager.notify(sales_rep['email'], {
            "type": "CRM_LEAD",
            "message": f"New Inquiry from {customer_name} ({city})."
        })
        
        return {"status": "Lead captured successfully"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))