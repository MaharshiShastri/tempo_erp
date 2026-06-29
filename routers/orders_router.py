from fastapi import APIRouter, Depends, HTTPException
from schemas.orders_schema import OrderHeaderCreate, StageUpdatePayload
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