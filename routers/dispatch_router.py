from fastapi import APIRouter, Depends, HTTPException
from database.repository import EDBR
from security import verify_bearer_token
from services.dispatch_calculator import execute_dispatch_algorithm
from .dependencies import check_department
import logging
from schemas.logistics_schema import FullPartnerProfile, LogisticsPartnerCreate
import traceback

router = APIRouter(prefix="/api/v1/dispatch", tags=["Dispatch Logistics Engine"])

@router.get("/partners", dependencies=[Depends(check_department("Transport"))])
def get_partners(user: dict = Depends(verify_bearer_token)):
    return EDBR.get_logistics_partners()

@router.post("/evaluate", dependencies=[Depends(check_department("Sales"))])
def evaluate_costs(payload: dict, user: dict = Depends(verify_bearer_token)):
    evaluation_session = { "started": True, "options": [], "failed_providers": 0 }
    
    try:
        partners = EDBR.get_logistics_partners()
        if not partners:
            raise ValueError("No active logistics partners found in the system.")

        for partner in partners:
            result = execute_dispatch_algorithm(payload, partner)
            
            # Use the new status object returned from the finally block
            if result["status"] == "success":
                evaluation_session["options"].append(result["data"])
            else:
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
        raise HTTPException(status_code=500, detail=f"Internal Dispatch Engine Error: {str(e)}")
        
    finally:
        # Cleanup or Telemetry logging. 
        # For an ERP, you could inject an audit log to track how often routes fail.
        if evaluation_session.get("failed_providers", 0) > 0:
            logging.info(f"Dispatch evaluated with {evaluation_session['failed_providers']} dropped partners.")

@router.post("/partners/save", dependencies=[Depends(check_department("Transport"))])
def save_full_partner(payload: FullPartnerProfile, user: dict = Depends(verify_bearer_token)):
    try:
        # Use the compound profile method instead of the flat one
        return EDBR.create_full_partner_profile(payload)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to configure partner: {str(e)}")
    
@router.put("/partners/{partner_id}",
    dependencies=[Depends(check_department("Transport"))]
)
def patch_partner(partner_id: int, payload: dict, user: dict = Depends(verify_bearer_token)):
    try:
        return EDBR.update_full_partner_profile(partner_id, payload)
    except Exception as e:
        logging.error(traceback.format_exc())
        raise HTTPException(status_code=400, detail=f"Failed to patch partner: {str(e)}")

@router.get("/partners/{partner_id}/profile", dependencies=[Depends(check_department("Transport"))])
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
    
@router.post("/records/save", dependencies=[Depends(check_department("Sales"))])
def save_dispatch_record(payload: dict, user: dict = Depends(verify_bearer_token)):
    try:
        # Save the finalized record
        result = EDBR.create_dispatch_record(payload, user["email"])
        return {"status": "success", "record_id": result["id"]}
    except Exception as e:
        logging.error(f"Failed to save dispatch record: {str(e)}")
        raise HTTPException(status_code=500, detail="Could not save dispatch record to history.")