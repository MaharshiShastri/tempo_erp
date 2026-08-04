from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from security import verify_bearer_token
from .dependencies import check_department

from database.repository import EDBR
from schemas.quotations_schema import QuoteGenerationRequest
from services.quote_generator import generate_qoute_document
from services.quotation_analytics import generate_today_quotation_pdf

router = APIRouter(prefix="/api/v1/quotations", tags=["Quotations"])

@router.post("/quotation")
def generate_qoute(request: QuoteGenerationRequest, user: dict=Depends(verify_bearer_token)):
    
    if user.get("role") not in ["Sales Representative", "Admin", "Chief Full Stack Developer"]:
        raise HTTPException(status_code=403, detail="Only Sales Representatives can access this API.")

    try:
        output_path, sales_user = generate_qoute_document(request, user)

        EDBR.create_quotation(request=request, sales_user=sales_user, document_path=output_path)

        return FileResponse(path=output_path, media_type=("application/vnd.openxmlformats-officedocument.wordprocessing.document"),filename=output_path.name)

    except PermissionError as exc:
        raise HTTPException(status_code=403, detail=str(exc))

    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    except Exception as exc:
        print("Exception occured: ", str(exc))
        raise HTTPException(status_code=500, detail="Unable to generate quote")

@router.get("/qoutation/analytics/today")
def quotation_analytics_today(user: dict = Depends(verify_bearer_token),):

    if user.get("role") not in ["Sales Representative", "Admin", "Chief Full Stack Developer",]:
        raise HTTPException(status_code=403, detail="You are not authorized to access quotation analytics.",)

    try:

        analytics_data = EDBR.get_today_quotation_summary()

        output_path = generate_today_quotation_pdf(analytics_data)

        return FileResponse(path=output_path, media_type="application/pdf", filename=output_path.name,)

    except Exception as exc:

        print("Quotation analytics error:", str(exc),)

        raise HTTPException(status_code=500, detail="Unable to generate quotation analytics report.",)