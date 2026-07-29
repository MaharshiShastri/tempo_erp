from fastapi import APIRouter, Depends, HTTPException
from schemas.items_schema import ItemMasterCreate, ItemMasterUpdate, StockAdjustment
from database.repository import EDBR
from security import verify_bearer_token
from .dependencies import check_department

router = APIRouter(prefix="/api/v1/master/items", tags=["Item Master Subsystem"])

@router.get("")
def get_items(user_profile: dict=Depends(verify_bearer_token)):
    data = EDBR.get_all_items()
    return data

@router.post("/create")
def create_item(payload: ItemMasterCreate, user_profile: dict=Depends(verify_bearer_token)):
    print(payload.item_code)
    try:
        return EDBR.create_item(payload.model_dump())
    
    except Exception as e:
        print(type(e))
        print(e)
        raise HTTPException(status_code=400, detail=str(e))
    
@router.put("/{item_code}")
def update_item(item_code: str, payload: ItemMasterUpdate, user_profile=Depends(verify_bearer_token)):
    return EDBR.update_item(item_code, payload.dict(exclude_none=True))

@router.post("/adjust-stock", dependencies=[Depends(check_department("Shop Floor Administrator"))])
def adjust_stock(payload: StockAdjustment, user=Depends(verify_bearer_token)):
    
    return EDBR.adjust_item_stock(payload.item_code, payload.operation, payload.quantity_change, payload.remarks, user["email"])

@router.get("/stock-ledger", dependencies=[Depends(check_department("Shop Floor Administrator"))])
def get_stock_ledger(user=Depends(verify_bearer_token)):
    return EDBR.get_stock_ledger()

@router.delete("/{item_code}")
def delete_item(item_code: str,user_profile=Depends(verify_bearer_token)):
    return EDBR.disable_item(item_code)

@router.get("/{item_code}")
def list_items(item_code: str, user_profile: dict=Depends(verify_bearer_token)):
    return EDBR.get_item(item_code)
