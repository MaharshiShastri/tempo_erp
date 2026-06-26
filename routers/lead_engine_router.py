from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from database.repository import EDBR
from security import verify_bearer_token
from .dependencies import check_department
from schemas.lead_generator_schema import TargetPayload
from fastapi import UploadFile, File
import pandas as pd
import io

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
    