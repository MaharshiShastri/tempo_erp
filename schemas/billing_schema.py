from pydantic import BaseModel
from typing import Optional, List
from datetime import date

class BillItemCreate(BaseModel):
    order_item_id: Optional[int] = None
    item_code: Optional[str] = None
    product_name: Optional[str] = None
    item_code: str | None = None
    quantity_shipped: int
    rate: float | None = None
    amount: float | None = None


class BillHeaderCreate(BaseModel):
    bill_num: str
    bill_date: date

    order_acceptance_id: Optional[str] = None

    items: List[BillItemCreate]