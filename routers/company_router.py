from fastapi import APIRouter, Depends, HTTPException
from security import verify_bearer_token
from .dependencies import check_department

from database.repository import EDBR
from schemas.company_schema import CompanyCreateInput, CompanyUpdateInput

router = APIRouter(prefix="/api/v1/companies", tags=["Client Companies"])

@router.get("/get", dependencies=[Depends(check_department("Sales Representative"))])
def get_companies(user_profile: dict = Depends(verify_bearer_token)):
    return EDBR.get_all_companies()

@router.get("/get/{company_id}", dependencies=[Depends(check_department("Sales Representative"))])
def get_company(company_id: str, user_profile: dict = Depends(verify_bearer_token)):
    company = EDBR.get_company(company_id)

    if not company:
        raise HTTPException(status_code=404, detail="Company not found")

    return company

@router.post("/create",dependencies=[Depends(check_department("Sales Representative"))])
def create_company(payload: CompanyCreateInput,user_profile: dict = Depends(verify_bearer_token)):
    try:
        return EDBR.create_company(payload.model_dump())

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    
@router.put("/update/{company_id}", dependencies=[Depends(check_department("Sales Representative"))])
def update_company(company_id: str, payload: CompanyUpdateInput, user_profile: dict = Depends(verify_bearer_token)):
    company = EDBR.update_company(company_id, payload.model_dump())

    if not company:
        raise HTTPException(status_code=404,detail="Company not found")

    return company

@router.delete("/delete/{company_id}", dependencies=[Depends(check_department("Sales Representative"))])
def delete_company(company_id: str, user_profile: dict = Depends(verify_bearer_token)):
    company = EDBR.delete_company(company_id)

    if not company:
        raise HTTPException(status_code=404, detail="Company not found")

    return {
        "message": "Company deleted successfully",
        "company_id": company_id
    }

@router.get("/search/", dependencies=[Depends(check_department("Sales Representative"))])
def search_companies(q: str, user_profile: dict = Depends(verify_bearer_token)):
    return EDBR.search_companies(q)

