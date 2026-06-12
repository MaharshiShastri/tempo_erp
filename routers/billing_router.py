from fastapi import APIRouter, Depends, HTTPException
from schemas.billing_schema import BillHeaderCreate
from database.repository import EDBR
from security import verify_bearer_token
from .dependencies import check_department

router = APIRouter(prefix="/api/v1/bills", tags=["Billing Execution Engine"])

@router.get("", dependencies=[Depends(check_department("Sales"))])
def get_bills(user_profile: dict = Depends(verify_bearer_token)):
    return EDBR.get_all_bills()

@router.post("/create", dependencies=[Depends(check_department("Sales"))])
def create_bill(payload: BillHeaderCreate, user_profile: dict = Depends(verify_bearer_token)):
    try:
        return EDBR.create_bill(payload.model_dump())
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))