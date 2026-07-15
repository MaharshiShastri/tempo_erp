from fastapi import APIRouter, Depends, HTTPException
from database.repository import EDBR, SessionLocal
from security import verify_bearer_token
from schemas.analytics_schema import SetTargetPayload
from .dependencies import check_department
from database.models import User
from sqlalchemy import update

router = APIRouter(prefix="/api/v1/analytics", tags=["Analytics & KPIs"])

@router.get("/sales", tags=["Admin Only"])
def get_sales_kpis(user: dict = Depends(verify_bearer_token)):
    # Simple RBAC enforcement at the route level
    if user.get("role") not in ["Admin", "Chief Full Stack Developer", "Sales Representative"]:
        raise HTTPException(status_code=403, detail="Unauthorized access to KPIs.")
    
    try:
        return EDBR.get_sales_kpis()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
@router.get("/sales-target", tags=["Open"])
def return_sales_targets(user: dict=Depends(verify_bearer_token)):
    return EDBR.get_sales_target()

@router.get("/transport", tags=["Admin Only"])
def get_transport_kpis(user: dict = Depends(verify_bearer_token)):
    if user.get("role") not in ["Admin", "Chief Full Stack Developer"]:
        raise HTTPException(status_code=403, detail="Unauthorized access to KPIs.")
    try:
        return EDBR.get_transport_kpis()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
@router.get("/rnd", tags=["Admin Only"])
def get_rnd_kpis(user: dict = Depends(verify_bearer_token)):
    if user.get("role") not in ["Admin", "Chief Full Stack Developer"]:
        raise HTTPException(status_code=403, detail="Unauthorized access to KPIs.")
    try:
        return EDBR.get_rnd_kpis()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
@router.get("/gtm-roi", tags=["Admin Only"])
def get_gtm_roi(user: dict = Depends(verify_bearer_token)):
    return EDBR.get_gtm_analytics()

@router.get("/system-health", tags=["Admin Only"])
def get_system_health(user: dict = Depends(verify_bearer_token)):
    return EDBR.get_system_errors()

@router.get("/production", tags=["Admin Only"])
def get_production_kpis(user: dict = Depends(verify_bearer_token)):
    if user.get("role") not in ["Admin", "Chief Full Stack Developer"]:
        raise HTTPException(status_code=403, detail="Unauthorized access to KPIs.")
    try:
        return EDBR.get_production_analytics()
    except Exception as e:
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