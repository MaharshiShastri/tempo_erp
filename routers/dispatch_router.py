from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from database.repository import EDBR
from security import verify_bearer_token
from services.dispatch_calculator import execute_dispatch_algorithm
from .dependencies import check_department
import logging
from schemas.logistics_schema import FullPartnerProfile, LogisticsPartnerCreate
import traceback
import shutil
import PyPDF2
from pathlib import Path
from services.ai_contract_parser import extract_logistics_profile_from_text
from services.ai_region_classifier import classify_city_zone

router = APIRouter(prefix="/api/v1/dispatch", tags=["Dispatch Logistics Engine"])

@router.get("/partners")
def get_partners(user: dict = Depends(verify_bearer_token)):
    print("User ", user['email'], "tried accessing the .")
    return EDBR.get_logistics_partners()

@router.get("/partners/active", dependencies=[Depends(check_department("Sales Representative"))])
def get_partners(user: dict = Depends(verify_bearer_token)):
    return EDBR.get_logistics_partners()

"""@router.post("/pre-identify-zones")
def pre_identify_zones(payload: dict, user: dict = Depends(verify_bearer_token)):
    city = payload.get("city")
    state = payload.get("state")
    partners =  EDBR.get_logistics_partners()

    identified_zones = {}
    for p in partners:
        zone_data = EDBR.get_partner_zones(p["id"])

        zone = classify_city_zone(city, zone_data["zones"])
        if isinstance(zone, list) and len(zone) > 0:
            identified_zones[str(p['id'])] = zone[0]
        elif isinstance(zone, str):
            identified_zones[str(p['id'])] = zone
        
    print(identified_zones)
    return identified_zones
"""
@router.post("/evaluate")
def evaluate_costs(payload: dict, user: dict = Depends(verify_bearer_token)):
    evaluation_session = { "started": True, "options": [], "failed_providers": 0 }
    print("User ", user['email'], "tried accessing the /evaluate.")
    try:
        partners = EDBR.get_logistics_partners()
        if not partners:
            raise ValueError("No active logistics partners found in the system.")

        for partner in partners:
            result = execute_dispatch_algorithm(payload, partner)
            
            # Use the new status object returned from the finally block
            if result["status"] == "success":
                print("User ",user['email'], " with partner ", result['partner_name'], " was successfully evaluated")
                evaluation_session["options"].append(result["data"])
            else:
                print("User ", user['email'], " failed evaluation due to: ", result['error'])
                evaluation_session["failed_providers"] += 1

        # Sort the valid options by final cost
        evaluation_session["options"].sort(key=lambda x: x["dispatch_cost_gst"])

        if not evaluation_session["options"]:
            raise HTTPException(status_code=422, detail="No partners could calculate a valid route for these specifications.")

        return {
            "options": evaluation_session["options"],
            "metadata": {
                "failed_calculations": evaluation_session["failed_providers"],
                "total_evaluated": len(partners)
            }
        }

    except HTTPException:
        raise  # Re-raise FastApi exceptions so they return standard HTTP status codes
        
    except Exception as e:
        # Catch unexpected fatal errors (like DB down)
        logging.error(f"Fatal Dispatch Error: {str(e)}")
        print("User ", user['email'], " failed dispatch due to: ", str(e))
        raise HTTPException(status_code=500, detail=f"Internal Dispatch Engine Error: {str(e)}")
        
    finally:
        # Cleanup or Telemetry logging. 
        # For an ERP, you could inject an audit log to track how often routes fail.
        if evaluation_session.get("failed_providers", 0) > 0:
            logging.info(f"Dispatch evaluated with {evaluation_session['failed_providers']} dropped partners.")

@router.post("/partners/save", dependencies=[Depends(check_department("Dispatch Engineer"))])
def save_full_partner(payload: FullPartnerProfile, user: dict = Depends(verify_bearer_token)):
    try:
        # Use the compound profile method instead of the flat one
        return EDBR.create_full_partner_profile(payload)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to configure partner: {str(e)}")
    
@router.put("/partners/{partner_id}", dependencies=[Depends(check_department("Dispatch Engineer"))])
def patch_partner(partner_id: int, payload: FullPartnerProfile, user: dict = Depends(verify_bearer_token)):
    try:
        return EDBR.update_full_partner_profile(partner_id, payload)
    except Exception as e:
        logging.error(traceback.format_exc())
        raise HTTPException(status_code=400, detail=f"Failed to patch partner: {str(e)}")

@router.get("/partners/{partner_id}/profile", dependencies=[Depends(check_department("Dispatch Engineer"))])
def get_partner_profile(partner_id: int, user: dict = Depends(verify_bearer_token)):
    try:
        profile = EDBR.get_full_partner_profile(partner_id)

        if not profile:
            raise HTTPException(status_code=404, detail="Partner not found")

        return profile

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch partner profile: {str(e)}")
    
@router.post("/records/save", dependencies=[Depends(check_department("Sales Representative"))])
def save_dispatch_record(payload: dict, user: dict = Depends(verify_bearer_token)):
    try:
        # Save the finalized record
        result = EDBR.create_dispatch_record(payload, user["email"])
        
        # Return a user-friendly message directly from the backend
        return {
            "status": "success", 
            "message": f"Dispatch evaluated and record #{result['id']} securely logged to history.", 
            "record_id": result["id"]
        }
    except Exception as e:
        logging.error(f"Failed to save dispatch record: {str(e)}")
        # Pass the exact repository error to the frontend
        raise HTTPException(status_code=500, detail=f"Database Engine Error: {str(e)}")
    
UPLOAD_DIR = Path("local_contract_uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

@router.post("/partners/extract-from-file", dependencies=[Depends(check_department("Dispatch Engineer"))])
async def extract_partner_from_file(file: UploadFile = File(...), user: dict = Depends(verify_bearer_token)):
    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are currently supported for auto-extraction.")

    # 1. Store the file locally
    file_location = UPLOAD_DIR / file.filename
    with open(file_location, "wb+") as file_object:
        shutil.copyfileobj(file.file, file_object)

    try:
        # 2. Extract text from PDF
        extracted_text = ""
        with open(file_location, "rb") as pdf_file:
            reader = PyPDF2.PdfReader(pdf_file)
            for page in reader.pages:
                text = page.extract_text()
                if text:
                    extracted_text += text + "\n"
        
        if len(extracted_text.strip()) < 50:
             raise ValueError("Could not read text from PDF. Ensure it is a text-based PDF, not a scanned image.")

        # 3. Process via Groq AI
        ai_parsed_json = extract_logistics_profile_from_text(extracted_text)
        
        return {
            "status": "success",
            "message": "Contract parsed successfully.",
            "data": ai_parsed_json
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI Parsing Failed: {str(e)}")
    
"""@router.post("/calculate", dependencies=[Depends(check_department("Sales Representative"))])
def calculate_dispatch(payload: dict, user: dict = Depends(verify_bearer_token)):
    try:
        return process_dispatch_calculation(payload)
    except Exception as e:
        logging.error(traceback.format_exc())
        raise HTTPException( status_code=500, detail=f"Dispatch calculation failed: {str(e)}")"""