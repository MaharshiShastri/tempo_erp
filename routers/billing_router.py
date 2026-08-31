from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import FileResponse
from schemas.billing_schema import BillHeaderCreate
from database.repository import EDBR, SessionLocal
from security import verify_bearer_token
from .dependencies import check_department
from database.models import User
from sqlalchemy import select
from services.billing_invoice_service import BillingInvoiceService

router = APIRouter(prefix="/api/v1/bills", tags=["Billing Execution Engine"])

@router.get("", dependencies=[Depends(check_department("Sales Representative"))])
def get_bills(user_profile: dict = Depends(verify_bearer_token)):
    return EDBR.get_all_bills()

@router.post("/create", dependencies=[Depends(check_department("Sales Representative"))])
def create_bill(payload: BillHeaderCreate, user_profile: dict = Depends(verify_bearer_token)):
    try:
        bill_details = EDBR.create_bill(payload.model_dump())
        return bill_details
    
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    
@router.get("/target", dependencies=[Depends(check_department("Sales Representative"))])
def get_target(user_profile: dict = Depends(verify_bearer_token)):
    with SessionLocal() as session:
        stmt = select(User.quarterly_order_value_target).where(User.email==user_profile.get("email"))
        target = session.scalar(stmt)
        return {"target": target or 0}

@router.get("/pdf", dependencies=[Depends(check_department("Sales Representative"))])
def get_bill_pdf(bill_num: str = Query(...), user_profile: dict=Depends(verify_bearer_token)):
    try:
        pdf_path = BillingInvoiceService.get_or_generate_invoice_pdf(bill_num, document_title="Tax Invoice",)
        return FileResponse(path=pdf_path, media_type="application/pdf", filename=pdf_path.name)

    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate invoice: {str(e)}")