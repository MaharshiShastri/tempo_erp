from pydantic import BaseModel, Field
from typing import List
from datetime import date

class BillItemCreate(BaseModel):
    order_item_id: int
    quantity_shipped: int = Field(..., gt=0)

class BillHeaderCreate(BaseModel):
    bill_num: str = Field(..., min_length=1)
    bill_date: date
    order_acceptance_id: str = Field(..., min_length=1)
    items: List[BillItemCreate]