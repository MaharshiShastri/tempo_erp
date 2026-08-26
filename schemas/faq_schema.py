from pydantic import BaseModel
class AskPayload(BaseModel):
    question: str
    item_code: str | None = None
    item_group: str | None = None
    
class AnswerPayload(BaseModel):
    answer: str
