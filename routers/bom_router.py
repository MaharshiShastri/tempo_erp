from fastapi import APIRouter, Depends, HTTPException
from security import verify_bearer_token
from database.repository import EDBR
from fastapi.responses import StreamingResponse
from services.bom_pdf_service import generate_bom_pdf

router = APIRouter(prefix="/api/v1/bom", tags=["Bill of Materials"])
@router.post("")
def create_bom(payload: dict, user: dict=Depends(verify_bearer_token)):
    try:
        return {
            "success": True,
            **EDBR.create_bom(payload),
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create BOM due to: {str(e)}")


@router.get("/raw-material")
def get_raw_materials(user: dict=Depends(verify_bearer_token)):
    data = EDBR.get_all_raw_materials()
    print("Truncated raw material list is:", data[:10])
    return data


@router.post("/cost-range")
def calculate_bom_cost_range(payload: dict, user: dict = Depends(verify_bearer_token)):
    components = payload.get("components", [])

    if not components:
        raise HTTPException(status_code=400, detail="BOM must contain atleast one component")

    return EDBR.get_bom_cost_range(components)

@router.get("/list")
def get_bom_list(user: dict= Depends(verify_bearer_token)):
    return EDBR.get_bom()

@router.get("/{bom_id}/pdf")
def get_bom_pdf(bom_id: int, user: dict = Depends(verify_bearer_token),):
    bom = EDBR.get_bom_id(bom_id)

    if not bom:
        raise HTTPException(status_code=404, detail=f"BOM {bom_id} not found",)

    cost_range = EDBR.get_bom_cost_range(bom.get("components", []))

    generated_by = EDBR.get_user_business_contact(user.get("email"), user.get("role")).get("name")

    pdf_buffer = generate_bom_pdf(bom=bom, cost_range=cost_range, generated_by=generated_by,)

    filename = (f"BOM_{bom.get('item_code', bom_id)}" f"_REV_{bom.get('revision_no', 1)}.pdf")

    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={
            "Content-Disposition": (
                f'inline; filename="{filename}"'
            )
        },
    )

@router.get("/{bom_id}")
def get_bom(bom_id: int, user: dict=Depends(verify_bearer_token)):
    bom = EDBR.get_bom_id(bom_id)
    if not bom:
        raise HTTPException(status_code=500, detail=f"Failed to find {bom_id}")

    return bom