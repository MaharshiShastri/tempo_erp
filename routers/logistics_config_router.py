from fastapi import APIRouter, Depends, HTTPException
from database.repository import EDBR
from security import verify_bearer_token

router = APIRouter(prefix="/api/v1/logistics/config", tags=["Logistics Config"])

@router.post("/{partner_id}/zones")
def save_zones(partner_id: int, payload: dict, user: dict = Depends(verify_bearer_token)):
    EDBR.create_zone_configuration(partner_id, payload['zones'])
    return {"status": "success"}

@router.post("/{partner_id}/rates")
def save_rates(partner_id: int, payload: dict, user: dict = Depends(verify_bearer_token)):
    EDBR.create_zone_rates(partner_id, payload['rates'])
    return {"status": "success"}

@router.post("/{partner_id}/fuel")
def save_fuel(partner_id: int, payload: dict, user: dict = Depends(verify_bearer_token)):
    EDBR.create_fuel_matrix_batch(partner_id, payload['fuel_matrix'])
    return {"status": "success"}

@router.post("/{partner_id}/oda")
def save_oda(partner_id: int, payload: dict, user: dict = Depends(verify_bearer_token)):
    EDBR.create_oda_matrix_batch(partner_id, payload['oda_matrix'])
    return {"status": "success"}

@router.patch("/partners/{partner_id}")
def patch_partner(partner_id: int, payload: dict, user=Depends(verify_bearer_token)):
    return EDBR.patch_full_partner_profile(partner_id, payload, user["email"])

@router.delete("/partners/{partner_id}")
def delete_partner(partner_id: int, user=Depends(verify_bearer_token)):
    return EDBR.delete_partner(partner_id, user["email"])