from pydantic import BaseModel, Field
from datetime import date

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
    special_itinerary: str | None = None