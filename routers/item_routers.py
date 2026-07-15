from fastapi import APIRouter, Depends, HTTPException
from schemas.items_schema import ItemMasterCreate, ItemMasterUpdate
from database.repository import EDBR
from security import verify_bearer_token
from .dependencies import check_department

router = APIRouter(prefix="/api/v1/master/items", tags=["Item Master Subsystem"])

@router.get("/{item_code}")
def list_items(item_code: str, user_profile: dict=Depends(verify_bearer_token)):
    return EDBR.get_item(item_code)

@router.get("")
def get_items(user_profile: dict=Depends(verify_bearer_token)):
    print("/api/v1/master/items: ", user_profile)
    data = EDBR.get_all_items()
    return data

@router.post("/create")
def create_item(payload: ItemMasterCreate, user_profile: dict=Depends(verify_bearer_token)):
    try:
        return EDBR.create_item(payload)
    
    except Exception as e:
        raise HTTPException(status_code=400, detail="Item Code already exists or data is invalid.")
    
@router.put("/{item_code}")
def update_item(item_code: str, payload: ItemMasterUpdate, user_profile=Depends(verify_bearer_token)):
    return EDBR.update_item(item_code, payload.dict(exclude_none=True))

@router.delete("/{item_code}")
def delete_item(item_code: str,user_profile=Depends(verify_bearer_token)):
    return EDBR.disable_item(item_code)
    