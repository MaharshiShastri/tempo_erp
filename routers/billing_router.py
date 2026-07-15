from fastapi import APIRouter, Depends, HTTPException
from schemas.billing_schema import BillHeaderCreate
from database.repository import EDBR, SessionLocal
from security import verify_bearer_token
from .dependencies import check_department
from database.models import User
from sqlalchemy import select

router = APIRouter(prefix="/api/v1/bills", tags=["Billing Execution Engine"])

@router.get("", dependencies=[Depends(check_department("Sales Representative"))])
def get_bills(user_profile: dict = Depends(verify_bearer_token)):
    return EDBR.get_all_bills()

@router.post("/create", dependencies=[Depends(check_department("Sales Representative"))])
def create_bill(payload: BillHeaderCreate, user_profile: dict = Depends(verify_bearer_token)):
    try:
        return EDBR.create_bill(payload.model_dump())
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    
@router.get("/target", dependencies=[Depends(check_department("Sales Representative"))])
def get_target(user_profile: dict = Depends(verify_bearer_token)):
    with SessionLocal() as session:
        stmt = select(User.quarterly_order_value_target).where(User.email==user_profile.get("email"))
        target = session.scalar(stmt)
        return {"target": target or 0}
