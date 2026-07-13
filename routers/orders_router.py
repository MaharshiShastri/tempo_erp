from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from schemas.orders_schema import OrderHeaderCreate, StageUpdatePayload
from database.repository import EDBR
from security import verify_bearer_token
from .dependencies import check_department
import os
import json
import base64
from groq import Groq
import io
import PyPDF2

router = APIRouter(prefix="/api/v1/orders", tags=["Orders Operations Engine"])

@router.get("", dependencies=[Depends(check_department("Sales Representative"))])
def get_orders(user_profile: dict = Depends(verify_bearer_token)):
    return EDBR.get_all_orders()

@router.post("/create", dependencies=[Depends(check_department("Sales Representative"))])
def create_order(payload: OrderHeaderCreate, user_profile: dict = Depends(verify_bearer_token)):
    try:
        order_data = payload.model_dump()
        order_data['ordered_by'] = user_profile['email']

        return EDBR.create_order(order_data)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/pulse")
def get_production_pulse(user: dict = Depends(verify_bearer_token)):
    return EDBR.get_global_production_pulse()

@router.patch("/{order_id}/stage")
def update_stage(order_id: str, payload: StageUpdatePayload, user: dict = Depends(verify_bearer_token)):
    # Restrict stage updates to Factory/Superusers if desired
    if user["role"] not in ["Shop Floor Administrator", "Admin", "Chief Full Stack Developer"]:
        raise HTTPException(status_code=403, detail="Unauthorized to update production stages.")
    try:
        return EDBR.update_order_stage(order_id, payload.stage)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    
@router.get("/search/oa/{oa_id:path}", dependencies=[Depends(check_department("Sales Representative"))])
def search_order_by_po(oa_id: str, user_profile: dict = Depends(verify_bearer_token)):
    
    order = EDBR.get_staged_order_by_oa(oa_id)
    if not order:
        raise HTTPException(status_code=404, detail="Purchase Order not found in database.")
    return order
@router.get("/search/oa-autocomplete", dependencies=[Depends(check_department("Sales Representative"))])
def po_autocomplete(q: str, user_profile: dict = Depends(verify_bearer_token)):
    if not q or len(q) < 2:
        return []
    return EDBR.search_oa_autocomplete(q)

@router.post("/ocr", dependencies=[Depends(check_department("Sales Representative"))])
async def extract_order_from_document(file: UploadFile = File(...), user: dict = Depends(verify_bearer_token)):
    content = await file.read()
    
    prompt = """
    You are an ERP data extraction assistant. Analyze this Sales Order / Purchase Order.
    Extract the following details and return ONLY a valid JSON object matching this structure:
    {
      "purchase_order_number": "Extract Buyer's Ref/Order No or Voucher No",
      "purchase_order_date": "Extract Date in YYYY-MM-DD format",
      "billing_name": "Extract Buyer/Bill To Name",
      "billing_address": "Extract complete Buyer Address",
      "due_date": "Extract Due on date in YYYY-MM-DD format if available, else blank",
      "items": [
        {
          "item_code": "Determine a short code or use the first word of the description",
          "additional_spec_text": "Extract full item description",
          "hsn_code": "Extract HSN/SAC",
          "quantity": 1,
          "unit_measure": "Extract unit (e.g. NOS, PCS)",
          "rate": 1000.00 (Numeric rate only),
          "discount_percentage": 0.0
        }
      ]
    }
    """

    client = Groq(api_key=os.getenv("GROQ_API_KEY"))

    try:
        if file.filename.lower().endswith(".pdf"):
            # Extract text from PDF
            pdf_reader = PyPDF2.PdfReader(io.BytesIO(content))
            extracted_text = ""
            for page in pdf_reader.pages:
                extracted_text += page.extract_text() + "\n"
                
            messages = [{"role": "user", "content": f"{prompt}\n\nDocument Text:\n{extracted_text}"}]
        else:
            # Process as an Image using Vision
            encoded_image = base64.b64encode(content).decode('utf-8')
            messages = [
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt},
                        {"type": "image_url", "image_url": {"url": f"data:{file.content_type};base64,{encoded_image}"}}
                    ]
                }
            ]

        # Using the exact model you requested
        completion = client.chat.completions.create(
            model="meta-llama/llama-4-scout-17b-16e-instruct",
            messages=messages,
            response_format={"type": "json_object"},
            temperature=0.1
        )
        
        return json.loads(completion.choices[0].message.content)

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"OCR Extraction Failed: {str(e)}")