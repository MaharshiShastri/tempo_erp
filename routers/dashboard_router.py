from fastapi import APIRouter, Depends
from database.repository import EDBR
from security import verify_bearer_token
from .dependencies import check_department
router = APIRouter(prefix="/api/v1/dashboard", tags=["DashBoard aggregator"])

@router.get("/activity-tree", dependencies=[Depends(check_department("Shop Floor Administrator"))])
def get_activity_tree(user_profile: dict = Depends(verify_bearer_token)):
    return EDBR.get_dashboard_activity_tree()