import docx
import chromadb
import uuid
import json
# from your_repository_file import YourRepositoryClass
# from your_llm_service import extract_product_schema

def process_catalog_docx(file_path: str, repo):
    """
    Reads a catalog.docx, groups text by product headers, 
    extracts structured data, and stores it in SQL and ChromaDB.
    """
    doc = docx.Document(file_path)
    products = []
    
    current_product_name = None
    current_product_details = []

    # 1. Parse DOCX: Group text by Headings
    for para in doc.paragraphs:
        # Assuming product names are formatted as Heading 1 or Heading 2 in the DOCX
        if para.style.name.startswith('Heading'):
            if current_product_name:
                products.append({
                    "raw_title": current_product_name,
                    "raw_text": "\n".join(current_product_details)
                })
            current_product_name = para.text.strip()
            current_product_details = []
        elif para.text.strip():
            current_product_details.append(para.text.strip())
            
    # Catch the last product
    if current_product_name:
        products.append({
            "raw_title": current_product_name,
            "raw_text": "\n".join(current_product_details)
        })

    # 2. Setup ChromaDB Client
    chroma_client = chromadb.Client() # or chromadb.HttpClient(host='...', port='...')
    collection = chroma_client.get_or_create_collection(name="product_catalogs")

    # 3. Process and Store Each Product
    for prod in products:
        # A. Use an LLM to extract your required SQL fields from the raw text
        # (You would pass prod['raw_title'] and prod['raw_text'] to an LLM here)
        extracted_data = mock_llm_extraction(prod['raw_title'], prod['raw_text'])
        
        # B. Save to SQL Database using your existing repository
        try:
            # Check if item exists to decide between create or update
            try:
                repo.get_item(extracted_data['item_code'])
                repo.update_item(extracted_data['item_code'], extracted_data)
                print(f"Updated SQL record for {extracted_data['item_code']}")
            except Exception: # Catching the "Item not found" exception from your code
                repo.create_item(extracted_data)
                print(f"Created SQL record for {extracted_data['item_code']}")
        except Exception as db_err:
            print(f"SQL Error for {extracted_data['item_code']}: {db_err}")
            continue # Skip vector ingestion if SQL fails

        # C. Save to ChromaDB for semantic search
        # We store the raw text as the document, and the SQL keys as metadata
        doc_id = str(uuid.uuid4())
        collection.add(
            documents=[prod['raw_text']],
            metadatas=[{
                "item_code": extracted_data['item_code'],
                "item_name": extracted_data['item_name'],
                "item_group": extracted_data['item_group'],
                "hsn_code": extracted_data['hsn_code']
            }],
            ids=[doc_id]
        )
        print(f"Added {extracted_data['item_code']} to ChromaDB")


def mock_llm_extraction(title: str, text: str) -> dict:
    """
    Mock function representing an LLM call. 
    In production, you prompt an LLM to return a JSON matching this exact dictionary.
    """
    return {
        "item_code": title.replace(" ", "_").upper()[:10],
        "item_name": title,
        "item_group": "Catalog Auto-Import",
        "rate": 0.0, # Require manual review or extract if present
        "unit_measure": "NOS",
        "additional_spec_text": text[:500], # Store the first 500 chars as SQL specs
        "hsn_code": "8471", # Example: You would extract this using the LLM
        "revision_no": "1.0"
    }