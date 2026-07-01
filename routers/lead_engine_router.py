from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from database.repository import EDBR
from security import verify_bearer_token
from .dependencies import check_department
from schemas.lead_generator_schema import TargetPayload, EmailGenPayload, MappedContact, ApproveStagingPayload
from fastapi import UploadFile, File
import pandas as pd
import io
from services.ai_generate_email import generate_mail

router = APIRouter(prefix="/api/v1/lead-engine", tags=["Lead Generation Engine"])

@router.post("/target", dependencies=[Depends(check_department("Sales Representative"))])
def submit_target(payload: TargetPayload, user: dict = Depends(verify_bearer_token)):
    try:
        return EDBR.request_lead_target(payload.company_name, payload.domain, user["email"])
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/targets", dependencies=[Depends(check_department("Sales Representative"))])
def get_targets(user: dict = Depends(verify_bearer_token)):
    return EDBR.get_lead_targets(user["email"], user["role"])

@router.get("/targets/{target_id}/contacts", dependencies=[Depends(check_department("Sales Representative"))])
def get_contacts(target_id: int, user: dict = Depends(verify_bearer_token)):
    return EDBR.get_lead_contacts(target_id)

@router.post("/targets/{target_id}/simulate-sync", dependencies=[Depends(check_department("Sales Representative"))])
def simulate_overnight_sync(target_id: int, user: dict = Depends(verify_bearer_token)):
    """A developer endpoint to simulate the overnight cron job."""
    success = EDBR.mock_overnight_sync(target_id)
    if not success:
        raise HTTPException(status_code=404, detail="Target company not found.")
    return {"status": "success", "message": "Mock data generated successfully."}

@router.post("/bulk-targets", dependencies=[Depends(check_department("Sales Representative"))])
async def bulk_upload_targets(file: UploadFile = File(...), user: dict = Depends(verify_bearer_token)):
    try:
        contents = await file.read()

        # Read Excel or CSV
        if file.filename.endswith(".csv"):
            df = pd.read_csv(io.BytesIO(contents))
        else:
            df = pd.read_excel(io.BytesIO(contents))

        required_cols = {"company_name", "domain"}
        if not required_cols.issubset(df.columns):
            raise HTTPException(status_code=400, detail="File must contain 'company_name' and 'domain' columns.")

        results = []

        for _, row in df.iterrows():
            try:
                res = EDBR.request_lead_target(row["company_name"], row["domain"], user["email"])
                results.append(res)
            except Exception as e:
                results.append({"company_name": row.get("company_name"), "error": str(e)})

        return {
            "status": "success",
            "inserted": len([r for r in results if "error" not in r]),
            "failed": len([r for r in results if "error" in r]),
            "results": results
        }

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    
@router.put("/targets/{target_id}", dependencies=[Depends(check_department("Sales Representative"))])
def update_target(target_id: int, payload: TargetPayload, user: dict = Depends(verify_bearer_token)):
    try:
        return EDBR.update_lead_target(target_id, payload.company_name, payload.domain, user["email"], user["role"])
    except ValueError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/targets/{target_id}", dependencies=[Depends(check_department("Admin"))])
def delete_target(target_id: int, user: dict = Depends(verify_bearer_token)):
    try:
        EDBR.delete_lead_target(target_id, user["email"], user["role"])
        return {"status": "success", "message": "Target deleted."}
    except ValueError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    
@router.delete("/target/{target_id}", dependencies=[Depends(check_department("Sales Representative"))])
def deactivate_target(target_id: int, user: dict = Depends(verify_bearer_token)):
    try:
        EDBR.deactivate_lead_target(target_id, user["email"], user["role"])
        return {"status": "success", "message": "Target marked as Inactive."}
    except ValueError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    
@router.post("/generate-email", dependencies=[Depends(check_department("Sales Representative"))])
def generate_cold_email(payload: EmailGenPayload, user: dict = Depends(verify_bearer_token)):
    email_data = generate_mail(payload)

    if email_data["error"]:
        raise HTTPException(status_code=500, detail=f"AI Generation Failed: {email_data["error"]}")
    
    else:
        return email_data
    
@router.post("/targets/{target_id}/approve-staging", dependencies=[Depends(check_department("Admin"))])
def approve_snovio_staging(target_id: int, payload: ApproveStagingPayload, user: dict = Depends(verify_bearer_token)):
    with EDBR._get_connection() as conn:
        with conn.cursor() as cur:
            # Insert approved contacts
            for c in payload.contacts:
                cur.execute("""
                    INSERT INTO lead_contacts (target_id, full_name, designation, email, is_priority)
                    VALUES (%s, %s, %s, %s, %s)
                """, (target_id, c.full_name, c.designation, c.email, c.is_priority))
            
            # Update target status to Completed
            cur.execute("UPDATE lead_targets SET status = 'Completed', emails_found = %s WHERE id = %s", (len(payload.contacts), target_id))
            conn.commit()
    return {"status": "success"}
