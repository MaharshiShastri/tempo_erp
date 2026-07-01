from fastapi import APIRouter, Depends, HTTPException
from database.repository import EDBR
from security import verify_bearer_token
from .dependencies import check_department
from schemas.dashboard_schema import ManualLogPayload

router = APIRouter(prefix="/api/v1/dashboard", tags=["DashBoard aggregator"])

@router.get("/activity-tree", dependencies=[Depends(check_department("Shop Floor Administrator"))])
def get_activity_tree(user_profile: dict = Depends(verify_bearer_token)):
    return EDBR.get_dashboard_activity_tree()

@router.post("/logs", dependencies=[Depends(check_department("Shop Floor Administrator"))])
def add_custom_log(order_id: str, payload: ManualLogPayload, user: dict = Depends(verify_bearer_token)):
    try:
        return EDBR.add_manual_activity_log(order_id, payload.message, user["email"], user["name"])
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/logs/{log_id}", dependencies=[Depends(check_department("Admin"))])
def delete_log(log_id: int, user: dict = Depends(verify_bearer_token)):
    try:
        EDBR.delete_activity_log(log_id, user["role"])
        return {"status": "success"}
    except ValueError as e:
        raise HTTPException(status_code=403, detail=str(e))