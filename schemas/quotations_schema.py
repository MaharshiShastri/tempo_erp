from pydantic import BaseModel, Field
from datetime import date

class SpecialModelRow(BaseModel):
    values: list[str] = Field(default_factory=list)


class QuoteGenerationRequest(BaseModel):
    product_name: str

    qoute_number: str

    client_company: str
    client_address_line1: str
    client_city: str
    client_postal_code: str

    client_email: str
    buyer_name: str
    buyer_phone_number: str

    date_input: date

    supply: str
    installation: str
    freight: str

    dealer: bool = False

    special_model: bool = False

    item_code: str | None = None

    special_columns: list[str] = Field(default_factory=list)
    special_rows: list[SpecialModelRow] = Field(default_factory=list)