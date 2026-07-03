import os
import json
import uuid
import docx
import chromadb
from groq import Groq
from docx.document import Document
from docx.oxml.table import CT_Tbl
from docx.oxml.text.paragraph import CT_P
from docx.table import Table
from docx.text.paragraph import Paragraph
from database.repository import EDBR

def iter_block_items(parent):
    """
    Iterates sequentially through the document, yielding Paragraphs and Tables 
    in the exact top-to-bottom order they appear in the Word file.
    """
    if isinstance(parent, Document):
        parent_elm = parent.element.body
    else:
        parent_elm = parent._element
    for child in parent_elm.iterchildren():
        if isinstance(child, CT_P):
            yield Paragraph(child, parent)
        elif isinstance(child, CT_Tbl):
            yield Table(child, parent)

def extract_metadata_via_groq(chunk_text: str):
    """Passes the raw page chunk to Groq to extract structured metadata."""
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        print("GROQ_API_KEY missing.")
        return []
        
    client = Groq(api_key=api_key)
    prompt = f"""
    Extract the product models/SKUs from this catalog section.
    Return a JSON object with a single key 'products', containing an array of objects.
    Each object must have:
    - "item_code": The model number (e.g., TI-710 WIC)
    - "item_name": The main product name (e.g., Walk-In Stability Chamber)
    - "item_group": The broad category
    - "hsn_code": The HSN Code if mentioned, else ""
    - "rate": Always 0.0
    - "unit_measure": "NOS"
    - "revision_no": "1.0"
    
    Catalog Section:
    {chunk_text}
    """
    try:
        completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"},
            temperature=0.2
        )
        return json.loads(completion.choices[0].message.content).get("products", [])
    except Exception as e:
        print(f"LLM Extraction failed: {e}")
        return []

def process_catalog_docx(file_path: str, repo):
    print(f"Reading {file_path}...")
    doc = docx.Document(file_path)
    
    product_chunks = []
    current_chunk = []
    
    # 1. Chunk strictly by Page Breaks
    for block in iter_block_items(doc):
        if isinstance(block, Paragraph):
            # Detect manual page breaks in the Word Document
            has_page_break = block.paragraph_format.page_break_before
            for run in block.runs:
                if '\f' in run.text or 'w:br w:type="page"' in run._element.xml:
                    has_page_break = True
                    break
            
            # If we hit a new page, save the old chunk and start fresh
            if has_page_break and current_chunk:
                product_chunks.append("\n".join(current_chunk))
                current_chunk = []
                
            text = block.text.replace('\f', '').strip()
            if text:
                current_chunk.append(text)
                
        elif isinstance(block, Table):
            # Flatten table data into a readable string format
            for row in block.rows:
                row_data = [cell.text.strip().replace('\n', ' ') for cell in row.cells]
                current_chunk.append(" | ".join(row_data))
                
    if current_chunk:
        product_chunks.append("\n".join(current_chunk))

    # 2. Setup Vector DB
    chroma_client = chromadb.PersistentClient(path="./chroma_db")
    collection = chroma_client.get_or_create_collection(name="product_catalogs")

    print(f"Found {len(product_chunks)} pages/chunks. Starting AI Extraction & DB Mapping...")

    # 3. Process Chunks
    for chunk in product_chunks:
        # Skip chunks that are too small to be a product page (e.g., blank pages)
        if len(chunk.strip()) < 50: 
            continue
            
        extracted_items = extract_metadata_via_groq(chunk)
        
        for item in extracted_items:
            item_code = item.get("item_code")
            if not item_code: continue
            
            # A. Prepare SQL Payload (Using the ENTIRE chunk as the spec text)
            sql_payload = {
                "item_code": item_code,
                "item_name": item.get("item_name", "Unknown"),
                "item_group": item.get("item_group", "General"),
                "rate": item.get("rate", 0.0),
                "unit_measure": item.get("unit_measure", "NOS"),
                "hsn_code": item.get("hsn_code", ""),
                "additional_spec_text": chunk, # Stores ALL info, dimensions, and specs
                "revision_no": item.get("revision_no", "1.0")
            }

            # B. Dual-Write to SQL
            try:
                try:
                    repo.get_item(item_code)
                    repo.update_item(item_code, sql_payload)
                    print(f"🔄 SQL Updated: {item_code}")
                except Exception:
                    repo.create_item(sql_payload)
                    print(f"✅ SQL Created: {item_code}")
            except Exception as db_err:
                print(f"❌ SQL Error for {item_code}: {db_err}")
                continue
            
            # C. Dual-Write to ChromaDB
            try:
                # We embed the complete chunk so RAG can read ALL specifications and dimensions
                collection.add(
                    documents=[chunk],
                    metadatas=[{
                        "item_code": item_code,
                        "item_name": sql_payload["item_name"],
                        "item_group": sql_payload["item_group"],
                        "hsn_code": sql_payload["hsn_code"]
                    }],
                    ids=[str(uuid.uuid4())]
                )
                print(f"🧠 Vector Embedded: {item_code}")
            except Exception as v_err:
                print(f"❌ Vector Error for {item_code}: {v_err}")

    print("Catalog Ingestion Complete.")

if __name__=="__main__":

    process_catalog_docx("Ex Works Price List 2026-27.docx", EDBR)