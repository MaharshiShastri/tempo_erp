from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
import requests
import logging
import xml.etree.ElementTree as ET
from security import verify_bearer_token
from services.ai_tally_translator import llm_normalize_tally
import json

router = APIRouter(prefix="/api/v1/tally", tags=["Tally Integration"])

def tally_xml_to_json(xml_string: str):
    try:
        root = ET.fromstring(xml_string)

        def parse(node):
            children = list(node)

            if not children:
                return node.text.strip() if node.text else ""

            result = {}
            for child in children:
                if child.tag not in result:
                    result[child.tag] = parse(child)
                else:
                    if not isinstance(result[child.tag], list):
                        result[child.tag] = [result[child.tag]]
                    result[child.tag].append(parse(child))
            return result

        return {root.tag: parse(root)}

    except Exception as e:
        return {"error": str(e), "raw": xml_string}
    

def build_tally_xml(action: str):

    if action == "company_list":
        return """
        <ENVELOPE>
  <HEADER>
    <TALLYREQUEST>Export Data</TALLYREQUEST>
  </HEADER>

  <BODY>
    <EXPORTDATA>
      <REQUESTDESC>
        <REPORTNAME>Balance Sheet</REPORTNAME>
      </REQUESTDESC>
    </EXPORTDATA>
  </BODY>
</ENVELOPE>
        """

    if action == "company_info":
        return """
        <ENVELOPE>
          <HEADER>
            <TALLYREQUEST>Export Data</TALLYREQUEST>
          </HEADER>
          <BODY>
            <EXPORTDATA>
              <REQUESTDESC>
                <REPORTNAME>Company Info</REPORTNAME>
              </REQUESTDESC>
            </EXPORTDATA>
          </BODY>
        </ENVELOPE>
        """
        
class TallyPayload(BaseModel):
    action: str
    tally_url: str = "http://localhost:9000"

@router.post("/sync")
def proxy_tally_request(payload: TallyPayload, user: dict = Depends(verify_bearer_token)):
    try:
        # 1. Build XML query
        xml = build_tally_xml(payload.action)

        # 2. Fetch from Tally
        response = requests.post("http://localhost:9000", data=xml, headers={"Content-Type": "text/xml"}, timeout=30)

        logging.info(response.text)

        # 3. XML → dict (deterministic)
        raw_json = tally_xml_to_json(response.text)

        # 4. LLM normalization
        llm_json = llm_normalize_tally(raw_json)

        # 5. Return BOTH (important for debugging)
        return {
            "status": "success",
            "raw": raw_json,
            "normalized": json.loads(llm_json)
        }

    except Exception as e:
        logging.error(f"Tally Proxy Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))