from pydantic import BaseModel
class AskPayload(BaseModel):
    question: str

class AnswerPayload(BaseModel):
    answer: str
