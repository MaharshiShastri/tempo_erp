from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import FileResponse
from security import verify_bearer_token
from .dependencies import check_department
from pathlib import Path
from database.repository import EDBR
from schemas.quotations_schema import QuoteGenerationRequest, QuotationUpdateRequest, QuotationStatusUpdateRequest
from services.quote_generator import generate_qoute_document
from services.quotation_analytics import generate_today_quotation_pdf
from services.billing_invoice_service import BillingInvoiceService
router = APIRouter(prefix="/api/v1/quotations", tags=["Quotations"])

def quotation_to_generation_request(quotation) -> QuoteGenerationRequest:
    return QuoteGenerationRequest(
        product_group=quotation.product_name,

        item_code=None,

        qoute_number=quotation.quote_number,

        client_company=quotation.client_company,
        client_address_line1=quotation.client_address_line1,
        client_city=quotation.client_city,
        client_postal_code=quotation.client_postal_code,

        client_email=quotation.client_email,
        buyer_name=quotation.buyer_name,
        buyer_phone_number=quotation.buyer_phone_number,

        date_input=quotation.enquiry_date,

        supply=quotation.supply,
        installation=quotation.installation,
        freight=quotation.freight,

        dealer=quotation.is_dealer,
        special_model=quotation.is_special_model,

        special_columns=[],
        special_rows=[],

        # Financial
        base_model_price=quotation.base_model_price,

        packing_mode=quotation.packing_mode,
        packing_amount=quotation.packing_amount,

        freight_mode=quotation.freight_mode,
        freight_amount=quotation.freight_amount,

        tax_rate=quotation.tax_rate,
    )

def delete_quotation_document(document_path):
    if not document_path:
        return

    path = Path(document_path)

    try:
        if path.exists() and path.is_file():
            path.unlink()

    except OSError as exc:
        raise RuntimeError(f"Unable to delete existing quotation document: {exc}")
    
@router.post("/quotation")
def generate_qoute(request: QuoteGenerationRequest, user: dict=Depends(verify_bearer_token)):
    
    if user.get("role") not in ["Sales Representative", "Admin", "Chief Full Stack Developer"]:
        raise HTTPException(status_code=403, detail="Only Sales Representatives can access this API.")

    try:
        print("The client email: ", request.client_email)
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

@router.get("/{qoute_number}/pdf", dependencies=[Depends(check_department("Sales Representative"))])
def get_booking_pdf(qoute_number: str, user_profile: dict=Depends(verify_bearer_token)):
    try:
        pdf_path = BillingInvoiceService.get_or_generate_quotation_order_pdf(qoute_number, document_title="Order Booking",)
        return FileResponse(path=pdf_path, media_type="application/pdf", filename=pdf_path.name)

    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate invoice: {str(e)}")

@router.get("")
def list_quotations(skip: int = 0, limit: int = 100, user: dict = Depends(verify_bearer_token),):
    
    try:
        quotations = EDBR.get_quotations(user=user, skip=skip, limit=limit,)

        return quotations

    except Exception as exc:
        print("Quotation list error:", str(exc))

        raise HTTPException(status_code=500, detail="Unable to fetch quotations.",)

@router.get("/{quotation_id}")
def get_quotation( quotation_id: int, user: dict = Depends(verify_bearer_token),):
    try:
        quotation = EDBR.get_quotation(quotation_id, user=user)

        if not quotation:
            raise HTTPException(status_code=404, detail="Quotation not found.",)

        return quotation

    except HTTPException:
        raise

    except Exception as exc:
        print("Quotation fetch error:", str(exc))

        raise HTTPException(status_code=500, detail="Unable to fetch quotation.",)


@router.put("/{quotation_id}")
def update_quotation(quotation_id: int, request: QuotationUpdateRequest, user: dict = Depends(verify_bearer_token),):
    
    quotation = EDBR.get_quotation(quotation_id, user=user)

    if not quotation:
        raise HTTPException(status_code=404, detail="Quotation not found.",)

    updates = request.model_dump(exclude_unset=True)

    old_document_path = quotation.document_path
    if not quotation.document_path:
        raise HTTPException(status_code=404, detail=f"Could not find the doucment {old_document_path}")
    try:
        quotation = EDBR.update_quotation(quotation_id, updates,)

        delete_quotation_document(old_document_path)

        generation_request = quotation_to_generation_request(quotation)
        output_path, sales_user = generate_qoute_document(generation_request, {"email": quotation.sales_user_email, "name": quotation.sales_user_name, "role": user.get("role"),})
        quotation = EDBR.update_quotation(quotation_id, {"document_path": str(output_path),},)

        return quotation

    except PermissionError as exc:
        raise HTTPException(status_code=403, detail=str(exc),)

    except ValueError as exc:
        raise HTTPException(status_code=403, detail = str(exc))
    
    except Exception as exc:
        print("Quotation update error:", str(exc))

        raise HTTPException(status_code=500, detail="Unable to update quotation.",)

@router.delete("/{quotation_id}")
def deactivate_quotation(quotation_id: int, user: dict = Depends(verify_bearer_token),):
    
    quotation = EDBR.deactivate_quotation(quotation_id, user=user)

    if not quotation:
        raise HTTPException(status_code=404, detail="Quotation not found.",)

    return {
        "success": True,
        "message": "Quotation deactivated successfully.",
        "quotation_id": quotation_id,
    }

@router.get("/{quotation_id}/download")
def download_quotation(quotation_id: int, user: dict = Depends(verify_bearer_token),):
    
    quotation = EDBR.get_quotation(quotation_id, user=user)

    if not quotation:
        raise HTTPException(status_code=404, detail="Quotation not found.",)

    document_path = quotation.document_path

    if not document_path:
        raise HTTPException(status_code=404, detail="Quotation document is not available.",)

    path = Path(document_path)

    if not path.exists() or not path.is_file():
        raise HTTPException(status_code=404, detail="Quotation document file not found.",)

    quote_number = quotation.quote_number or quotation.qoute_num or f"quotation_{quotation_id}"

    return FileResponse(
        path=path,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        filename=f"Tempo_Quote_{quote_number}.docx",
    )

@router.patch("/{quotation_id}/status")
def update_quotation_status(quotation_id: int, request: QuotationStatusUpdateRequest, user: dict = Depends(verify_bearer_token),):
    try:

        quotation = EDBR.update_quotation_status(
            quotation_id,
            request.status,
            converted_order_id=request.converted_order_id,
            snapshot=(request.snapshot.model_dump() if request.snapshot else None),
            user=user,
        )

        if not quotation:
            raise HTTPException(status_code=404, detail="Quotation not found.",)

        return quotation

    except ValueError as exc:

        raise HTTPException(status_code=400, detail=str(exc),)

    except HTTPException:
        raise

    except Exception as exc:

        print("Quotation status update error:", str(exc),)

        raise HTTPException(status_code=500, detail="Unable to update quotation status.",)
