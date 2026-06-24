from fastapi import APIRouter, Depends, HTTPException
from schemas.orders_schema import OrderHeaderCreate
from database.repository import EDBR
from security import verify_bearer_token
from .dependencies import check_department

router = APIRouter(prefix="/api/v1/orders", tags=["Orders Operations Engine"])

@router.get("", dependencies=[Depends(check_department("Sales Representative"))])
def get_orders(user_profile: dict = Depends(verify_bearer_token)):
    return EDBR.get_all_orders()

@router.post("/create", dependencies=[Depends(check_department("Sales Representative"))])
def create_order(payload: OrderHeaderCreate, user_profile: dict = Depends(verify_bearer_token)):
    try:
        return EDBR.create_order(payload.model_dump())
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/master/items", dependencies=[Depends(check_department("Sales Representative"))])
def list_items_master(user_profile: dict = Depends(verify_bearer_token)):
    return  EDBR.get_all_items()

