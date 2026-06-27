from fastapi import APIRouter, Depends, HTTPException
from database.repository import EDBR
from security import verify_bearer_token
from .dependencies import check_department
import chromadb
from schemas.faq_schema import AnswerPayload, AskPayload

# Initialize local Vector Database for future RAG / LLM Integration
chroma_client = chromadb.PersistentClient(path="./chroma_db")
faq_collection = chroma_client.get_or_create_collection(name="erp_knowledge_base")

router = APIRouter(prefix="/api/v1/faq", tags=["FAQ & Knowledge Base"])

@router.post("/ask", dependencies=[Depends(check_department("Sales Representative"))])
def ask_question(payload: AskPayload, user: dict = Depends(verify_bearer_token)):
    try:
        return EDBR.create_faq_query(payload.question, user["email"])
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/list")
def get_all_faqs(user: dict = Depends(verify_bearer_token)):
    faqs = EDBR.get_faq_queries()
    
    user_role = user.get("role")
    user_email = user.get("email")
    
    if user_role == "Sales Representative":
        for faq in faqs:
            if faq["asked_by"] != user_email:
                faq["asked_by"] = "Anonymous Colleague"
                
    return faqs

@router.put("/{faq_id}/answer")
def answer_question(faq_id: int, payload: AnswerPayload, user: dict = Depends(verify_bearer_token)):
    # Restrict answering to R&D, Admins, or Chief Devs
    if user.get("role") not in ["R&D Engineer", "Admin", "Chief Full Stack Developer"]:
        raise HTTPException(status_code=403, detail="Only R&D and Admins can answer technical queries.")

    try:
        updated_faq = EDBR.answer_faq_query(faq_id, payload.answer, user["email"])
        
        # --- VECTOR DB INGESTION (RAG FOUNDATION) ---
        # We embed the combination of Q&A so future LLMs can retrieve this exact context
        document_text = f"Question: {updated_faq['question']}\nAnswer: {updated_faq['answer']}"
        metadata = {
            "asked_by": updated_faq["asked_by"],
            "answered_by": updated_faq["answered_by"],
            "date_answered": updated_faq["updated_at"]
        }
        
        faq_collection.add(
            documents=[document_text],
            metadatas=[metadata],
            ids=[f"faq_id_{faq_id}"]
        )
        
        return updated_faq
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))