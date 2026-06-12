from fastapi import APIRouter, Depends, HTTPException
from typing import List
from schemas.orders_schema import OrderHeaderCreate, CompanyCreateInput
from database.repository import EDBR, MOCK_COMPANIES
from security import verify_bearer_token
from .dependencies import check_department

router = APIRouter(prefix="/api/v1/orders", tags=["Orders Operations Engine"])

@router.get("", dependencies=[Depends(check_department("Sales"))])
def get_orders(user_profile: dict = Depends(verify_bearer_token)):
    return EDBR.get_all_orders()

@router.post("/create", dependencies=[Depends(check_department("Sales"))])
def create_order(payload: OrderHeaderCreate, user_profile: dict = Depends(verify_bearer_token)):
    try:
        return EDBR.create_order(payload.model_dump())
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/master/companies", dependencies=[Depends(check_department("Sales"))])
def list_companies_master(user_profile: dict = Depends(verify_bearer_token)):
    return MOCK_COMPANIES

@router.post("/master/companies/create", dependencies=[Depends(check_department("Sales"))])
def create_company_master(payload: CompanyCreateInput, user_profile: dict = Depends(verify_bearer_token)):
    if any(c["name"].lower() == payload.name.lower() for c in MOCK_COMPANIES):
        raise HTTPException(status_code=400, detail="A corporate account profile with this designation already exists.")
    
    new_id = f"C{str(len(MOCK_COMPANIES) + 1).zfill(3)}"
    full_resolved_address = f"{payload.address_line_1}, {payload.city}, {payload.state} - {payload.pincode}"
    
    new_company = {
        "id": new_id,
        "name": payload.name.strip(),
        "address": full_resolved_address,
        "address_line_1": payload.address_line_1.strip(),
        "city": payload.city,
        "state": payload.state,
        "pincode": payload.pincode.strip(),
        "contact_name": payload.contact_name.strip(),
        "contact_role": payload.contact_role,
        "contact_phone": payload.contact_phone.strip()
    } 
    MOCK_COMPANIES.append(new_company)
    return new_company

@router.get("/master/items", dependencies=[Depends(check_department("Sales"))])
def list_items_master(user_profile: dict = Depends(verify_bearer_token)):
    return  EDBR.get_all_items()

"""@router.get("/search/companies")
def search_companies(q: str):
    with EDBR._get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                #SELECT id, name, address
                #FROM unnest(%s::text[], %s::text[], %s::text[]) -- ignore (remove mock later)
""", ())   placeholder if still mock-based"""

@router.get("/search/companies", dependencies=[Depends(check_department("Sales"))])
def search_companies(q: str):
    q = q.lower()
    results = [
        c for c in MOCK_COMPANIES
        if q in c["name"].lower() or q in c["id"].lower()
    ]
    return results[:10]
