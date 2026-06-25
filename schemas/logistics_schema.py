from pydantic import BaseModel
from typing import Optional, List, Dict

class LogisticsPartnerCreate(BaseModel):
    name: str
    partner_link: Optional[str] = None
    destination_rate: float = 0.0
    fuel_charge_percentage: float = 0.0
    documentation_charge: float = 0.0
    delivery_destination_charge: float = 0.0
    freight_invoice_brokerage_percentage: float = 0.0

class ZoneDef(BaseModel):
    zone_code: str
    zone_name: str
    states: List[str]

class ZoneRate(BaseModel):
    destination_zone: str
    rate_per_kg: float

class FuelSlab(BaseModel):
    fuel_price_from: float
    fuel_price_to: float
    surcharge_percentage: float

class ODASlab(BaseModel):
    km_from: float
    km_to: float
    weight_from: float
    weight_to: float
    oda_charge: float

class FullPartnerProfile(BaseModel):
    name: str
    partner_link: Optional[str] = None
    cft_factor: float = 10.0
    minimum_weight: float = 0.0
    minimum_freight_value: float = 0.0
    documentation_charge: float = 0.0
    fov_percentage: float = 0.0
    gst_percentage: float = 18.0

    local_loading_cost: float = 0.0
    hub_loading_max_cost: float = 0.0
    
    # Nested data arrays
    zones: List[ZoneDef]
    rates: List[ZoneRate]
    fuel_matrix: List[FuelSlab]
    oda_matrix: List[ODASlab]

class RowUpdate(BaseModel):
    id: int
    changes: dict

class MatrixDiff(BaseModel):
    created: List[dict] = []
    updated: List[RowUpdate] = []
    deleted: List[int] = []

class PartnerPatch(BaseModel):
    partner: dict

    zones: Optional[MatrixDiff] = None
    rates: Optional[MatrixDiff] = None
    fuel_matrix: Optional[MatrixDiff] = None
    oda_matrix: Optional[MatrixDiff] = None

class DispatchCalcInput(BaseModel):
    destination_city: str
    destination_state: str
    weight_kg: float
    dimensions_l_in: float
    dimensions_w_in: float
    dimensions_h_in: float
    invoice_value: float
    hamali_charges: float = 0.0

    partner_distances: Dict[str, float] = {}
    pre_identified_zones: Dict[str, str] = {}