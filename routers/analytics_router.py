from fastapi import APIRouter, Depends, HTTPException
from database.repository import EDBR
from security import verify_bearer_token

router = APIRouter(prefix="/api/v1/analytics", tags=["Analytics & KPIs"])

@router.get("/sales", tags=["Admin Only"])
def get_sales_kpis(user: dict = Depends(verify_bearer_token)):
    # Simple RBAC enforcement at the route level
    if user.get("role") not in ["Admin", "Chief Full Stack Developer"]:
        raise HTTPException(status_code=403, detail="Unauthorized access to KPIs.")
    
    try:
        return EDBR.get_sales_kpis()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
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