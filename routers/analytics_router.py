from fastapi import APIRouter, Depends, HTTPException, Query
from database.repository import EDBR, SessionLocal
from security import verify_bearer_token
from schemas.analytics_schema import SetTargetPayload
from .dependencies import check_department
from database.models import User
from sqlalchemy import update
from datetime import date
from fastapi.responses import FileResponse
from services.production_excel import generate_production_excel

router = APIRouter(prefix="/api/v1/analytics", tags=["Analytics & KPIs"])

@router.get("/sales", tags=["Admin Only"])
def get_sales_kpis(from_date: date = Query(...), to_date: date = Query(...), user: dict = Depends(verify_bearer_token)):
    # Simple RBAC enforcement at the route level
    if user.get("role") not in ["Admin", "Chief Full Stack Developer", "Sales Representative"]:
        raise HTTPException(status_code=403, detail="Unauthorized access to KPIs.")
    
    try:
        return EDBR.get_sales_kpis(from_date, to_date)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
@router.get("/sales-target", tags=["Open"])
def return_sales_targets(from_date: date = Query(...), to_date: date = Query(...), user: dict=Depends(verify_bearer_token)):
    return EDBR.get_sales_target(from_date, to_date)

@router.get("/transport", tags=["Admin Only"])
def get_transport_kpis(from_date:date =  Query(...), to_date: date = Query(...), user: dict = Depends(verify_bearer_token)):
    if user.get("role") not in ["Admin", "Chief Full Stack Developer", "Dispatch Engineer"]:
        raise HTTPException(status_code=403, detail="Unauthorized access to KPIs.")
    try:
        return EDBR.get_transport_kpis(from_date, to_date)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
@router.get("/rnd", tags=["Admin Only"])
def get_rnd_kpis(from_date:date =  Query(...), to_date:date =  Query(...), user: dict = Depends(verify_bearer_token)):
    if user.get("role") not in ["Admin", "Chief Full Stack Developer"]:
        raise HTTPException(status_code=403, detail="Unauthorized access to KPIs.")
    try:
        return EDBR.get_rnd_kpis(from_date, to_date)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
@router.get("/gtm-roi", tags=["Admin Only"])
def get_gtm_roi(from_date: date = Query(...), to_date: date = Query(...), user: dict = Depends(verify_bearer_token)):
    return EDBR.get_gtm_analytics(from_date, to_date)

@router.get("/system-health", tags=["Admin Only"])
def get_system_health(from_date: date = Query(...), to_date: date = Query(...), user: dict = Depends(verify_bearer_token)):
    return EDBR.get_system_errors(from_date, to_date)

@router.get("/production", tags=["Admin Only"])
def get_production_kpis(from_date: date = Query(...), to_date: date = Query(...), user: dict = Depends(verify_bearer_token)):
    if user.get("role") not in ["Admin", "Chief Full Stack Developer", "Shop Floor Administrator"]:
        raise HTTPException(status_code=403, detail="Unauthorized access to KPIs.")
    try:
        return EDBR.get_production_analytics(from_date, to_date)
    except Exception as e:
        print(str(e), " error occured")
        raise HTTPException(status_code=500, detail=str(e))
    
@router.patch("/admin/users/{email}/target", dependencies=[Depends(check_department("Admin"))])
def update_user_target(email: str, payload: SetTargetPayload, user: dict = Depends(verify_bearer_token)):
    with SessionLocal() as session:
        user = session.get(User, email)

        if user:
            user.quarterly_order_value_target = payload.target
            session.commit()
        
        else:
            raise ValueError("User not found")

    return {"status": "success", "message": f"Quarterly target updated for {email}"}

@router.get("/qoutation/analytics/today")
def quotation_analytics_today(user: dict = Depends(verify_bearer_token)):
    if user.get("role") not in ["Admin", "Chief Full Stack Developer"]:
        raise HTTPException(status_code=403, detail="Not authorized.")

    return EDBR.get_today_quotation_analytics()

@router.get("/production/pending-orders/excel")
def download_pending_orders_excel(
    from_date: date = Query(...),
    to_date: date = Query(...),
    user: dict = Depends(verify_bearer_token),
):
    if user.get("role") not in [
        "Admin",
        "Chief Full Stack Developer",
        "Shop Floor Administrator",
    ]:
        raise HTTPException(
            status_code=403,
            detail="Unauthorized access to production reports.",
        )

    if from_date > to_date:
        raise HTTPException(
            status_code=400,
            detail="from_date cannot be later than to_date.",
        )

    try:
        analytics = EDBR.get_production_analytics(
            from_date,
            to_date,
        )
        output_path = generate_production_excel(
            analytics_data=analytics,
            from_date=from_date,
            to_date=to_date,
        )

        return FileResponse(
            path=output_path,
            media_type=(
                "application/vnd.openxmlformats-officedocument."
                "spreadsheetml.sheet"
            ),
            filename=output_path.name,
        )

    except Exception as exc:

        print(
            "Pending orders Excel export error:",
            str(exc),
        )

        raise HTTPException(
            status_code=500,
            detail="Unable to generate pending orders Excel report.",
        )