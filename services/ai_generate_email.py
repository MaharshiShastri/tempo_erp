from groq import Groq
import chromadb
import os
import json

chroma_client = chromadb.PersistentClient(path="./chroma_db")
faq_collection = chroma_client.get_or_create_collection(name="erp_knowledge_base")

groq_api_key = os.getenv("GROQ_API_KEY", "")
if not groq_api_key:
        raise ValueError(status_code=500, detail="Groq API Key not configured on the server environment variables.")

def generate_mail(payload: dict):
    rag_context = ""
    try:
        # Search the knowledge base for FAQs related to this specific product
        results = faq_collection.query(query_texts=[payload.item_name], n_results=2)
        if results and results.get('documents') and results['documents'][0]:
            rag_context = "\n".join(results['documents'][0])
            client = Groq(api_key=groq_api_key)
        system_prompt = """
    Context: You are an elite B2B technical sales reply copywriter for tempo instruments who build temperature precision products. Your goal is to write a highly converting, non-spammy warm email. The email should sound like we are selling our quotation & product to the competitor(as first person itself) in past tense.
    Audience: Your audience is Product, Purchase & QA/QC manager of our new client companies. 
    Goal: Provide product awareness to our client companies, without explicitly asking them to buy. 
    Tone: Avoid buzz, quick-to-act, flashy words, that may hype the reader. Make it highly personalized to the recipient's role & company. Don't include words like "free", "offer", or anything that makes the reader quick to act or force systems to push it into spam. It should be easy-going & create a illusion of problems for which are faced normally, & Tempo Instruments have solutions to it. The entire body of the email should read like a reply to the client company(first person), but replace client's name to competitors' name, so the reader gets afraid to losing the edge from competitors. If you do not know the competitor name, simply return {enter client's competitor name here}. Let the reader feel like we are sending the email to the competitor company, without knowing that it was meant for them to read; let them see, get confused for being addressed & then get the FOMO that their competitors are using such products.
    Length: Keep it strictly under 150 + technical specification words.
    CTA: None, just ensure that they feel the FOMO according to their post & make them try to revert back on the same mail. 
    Output: Output the response strictly in JSON format with exactly two keys: 'subject' and 'body'. Body MUST always start with "Following are the discussed specifications that you asked for the {product name}:{entire product speficiations},{problem it solved}, {thank you for reaching out to us, mention clients' competitor name}".
    For ex. 
    input: Write the email to {name}, who is the {job title} at {client name}. Share the details of our scientific product Curing tank. Product Specifications as you requested: Standard Model Inside S.S. 304 mirror finish argon welded one piece pot. Outer Mild steel (CRCA) sheet with powder coated. Temperature Range 250 C to 300 C Temperature Set Point 270 C Temperature Accuracy ± 0.50C Control System Imported Microprocessor based auto tuned PID controller with CE mark & dual display of set value & process value for each tank.Database for you to weave in smoothly: Models Internal Tank size L x W x H in cm Outer Tank Size (Approx) L x W x H in cm Cap. Litres Standard Model TI-651 105 x 50 x 40 215 x 68 x 78 210 TI-652 105 x 75 x 40 215 x 93 x 78 315  TI-653 140 x 75 x 40 255 x 93 x 78 420 TI-654 170 x 75 x 40 285 x 93 x 78 510 TI-655 170 x 100 x 40 285 x 118 x 78 680
    output: Following are the discussed specifications that you asked for the Curing tank:Cap. Litres TI-651 105 x 50 x 40 215 x 68 x 78 210 TI-652 105 x 75 x 40 215 x 93 x 78 315 TI-653 140 x 75 x 40 255 x 93 x 78 420  TI-654 170 x 75 x 40 285 x 93 x 78 510 TI-655 170 x 100 x 40 285 x 118 x 78 680, it will solve the issue of having better precision, thank you for reaching out to us {clients' competitor name}, we look forward to the agreement.
    """
            
        if payload.feedback and payload.previous_draft:
            user_prompt = (
                f"Rewrite this email draft:\n\n{payload.previous_draft}\n\n"
                f"Apply this critical feedback from the human sales rep: {payload.feedback}"
            )
        else:
            user_prompt = (
                f"Write a cold email to {payload.contact_name}, who is the {payload.designation} at {payload.company_name}.\n"
                f"Introduce our scientific product: '{payload.item_name}'.\n"
                f"Product Specs: {payload.item_specs}\n"
                f"Additional Technical Context from our R&D Database to weave in smoothly:\n{rag_context}\n"
            )

            # 3. Call Groq
            chat_completion = client.chat.completions.create(
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                model="llama3-70b", # Extremely fast, great for JSON outputs
                response_format={"type": "json_object"},
                temperature=0.7
            )
            
        response_text = chat_completion.choices[0].message.content
        email_data = json.loads(response_text)
            
        return email_data
    except Exception as e:
        email_data = {"error:", f"ChromaDB retrieval skipped/failed: {e}"}
        return email_data