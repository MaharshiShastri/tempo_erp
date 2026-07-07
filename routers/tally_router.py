from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from pydantic import BaseModel
from groq import Groq
import os
from typing import Optional
import requests
import logging
import xml.etree.ElementTree as ET
from security import verify_bearer_token
from services.ai_tally_translator import llm_normalize_tally
import json
from dependencies import check_department

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

def build_sales_order_list_xml(from_dt: str, to_dt: str):
    """Fetches a lightweight list of Sales Order GUIDs within the date range."""
    from_dt = from_dt.replace("-", "") 
    to_dt = to_dt.replace("-", "") 
    
    return f"""
    <ENVELOPE>
    <HEADER>
        <VERSION>1</VERSION>
        <TALLYREQUEST>Export</TALLYREQUEST>
        <TYPE>Collection</TYPE>
        <ID>TSPL ALL Sales Vouchers</ID>
    </HEADER>
    <BODY>
        <DESC>
            <STATICVARIABLES>
                <SVEXPORTFORMAT>XML</SVEXPORTFORMAT>
                <SVCURRENTCOMPANY>TEMPO INSTRUMENTS PRIVATE LIMITED</SVCURRENTCOMPANY>
            </STATICVARIABLES>
<TDL>
<TDLMESSAGE>
  <COLLECTION NAME="TSPL ALL Sales Vouchers" ISMODIFY="No" ISFIXED="No" ISINITIALIZE="No" ISOPTION="No" ISINTERNAL="No">
   <TYPE>Vouchers:VoucherType</TYPE>
   <CHILDOF>$$VchTypeSales</CHILDOF>
   <NATIVEMETHOD>Date, VoucherTypeName, VoucherNumber, Partyledgername</NATIVEMETHOD>
  </COLLECTION>
</TDLMESSAGE>
</TDL>
        </DESC>
    </BODY>
</ENVELOPE><ENVELOPE>
      <HEADER>
        <VERSION>1</VERSION>
        <TALLYREQUEST>Export</TALLYREQUEST>
        <TYPE>Collection</TYPE>
        <ID>SalesVoucherList</ID>
      </HEADER>
      <BODY>
        <DESC>
          <STATICVARIABLES>
            <SVFROMDATE>{from_dt}</SVFROMDATE>
            <SVTODATE>{to_dt}</SVTODATE>
          </STATICVARIABLES>
          <TDL>
            <TDLMESSAGE>
              <COLLECTION NAME="SalesVoucherList" ISINITIALIZE="Yes">
                <TYPE>Voucher</TYPE>
                <FETCH>GUID, VoucherNumber, Date</FETCH>
                <FILTERS>IsSalesVoucher</FILTERS>
              </COLLECTION>
              <SYSTEM TYPE="Formulae" NAME="IsSalesVoucher">
                $VoucherTypeName = "Sales"
              </SYSTEM>
            </TDLMESSAGE>
          </TDL>
        </DESC>
      </BODY>
    </ENVELOPE>
    """

def build_single_voucher_xml(guid: str):
    """Fetches the complete, exploded inventory and accounting details for a specific voucher."""
    return f"""
    <ENVELOPE>
      <HEADER>
        <VERSION>1</VERSION>
        <TALLYREQUEST>Export</TALLYREQUEST>
        <TYPE>Object</TYPE>
        <SUBTYPE>Voucher</SUBTYPE>
        <ID>{guid}</ID>
      </HEADER>
      <BODY>
        <DESC>
          <STATICVARIABLES>
            <EXPLODEFLAG>Yes</EXPLODEFLAG>
            <SVEXPORTFORMAT>$$SysName:XML</SVEXPORTFORMAT>
          </STATICVARIABLES>
        </DESC>
      </BODY>
    </ENVELOPE>
    """

class TallyQueryPayload(BaseModel):
    report_name: str = "Sales Order"  # e.g., Day Book, Trial Balance, Stock Summary
    from_date: Optional[str] = None  # Format YYYYMMDD or YYYY-MM-DD
    to_date: Optional[str] = None
    ledger_name: Optional[str] = None
    tally_url: str = "http://localhost:9000"


def build_dynamic_tally_xml(payload: TallyQueryPayload) -> str:
    # Clean dates: Tally expects strictly YYYYMMDD (e.g. "20260401")
    from_dt = payload.from_date.replace("-", "") if payload.from_date else ""
    to_dt = payload.to_date.replace("-", "") if payload.to_date else ""

    static_vars = []
    if from_dt:
        static_vars.append(f"<SVFROMDATE>{from_dt}</SVFROMDATE>")
    if to_dt:
        static_vars.append(f"<SVTODATE>{to_dt}</SVTODATE>")
    if payload.ledger_name:
        static_vars.append(f"<LEDGERNAME>{payload.ledger_name}</LEDGERNAME>")
    if payload.report_name == "Sales Order":
        return build_sales_order_list_xml(payload)
    
    # Explode flag ensures detailed rows are expanded in reports like Trial Balance
    static_vars.append("<EXPLODEFLAG>Yes</EXPLODEFLAG>")

    static_vars_xml = "\n".join(static_vars)

    return f"""<ENVELOPE>
      <HEADER>
        <TALLYREQUEST>Export Data</TALLYREQUEST>
      </HEADER>
      <BODY>
        <EXPORTDATA>
          <REQUESTDESC>
            <REPORTNAME>{payload.report_name}</REPORTNAME>
            <STATICVARIABLES>
              {static_vars_xml}
            </STATICVARIABLES>
          </REQUESTDESC>
        </EXPORTDATA>
      </BODY>
    </ENVELOPE>"""


@router.post("/sync")
def proxy_tally_request(payload: TallyQueryPayload, user: dict = Depends(verify_bearer_token)):
    try:
        # 1. Fetch the List of Sales Orders
        from_dt = payload.from_date.replace("-", "") if payload.from_date else ""
        to_dt = payload.to_date.replace("-", "") if payload.to_date else ""

        # 1. Fetch the List of Sales Vouchers
        list_xml = build_sales_order_list_xml(from_dt, to_dt)
        list_response = requests.post(
            payload.tally_url, 
            data=list_xml, 
            headers={"Content-Type": "text/xml"}, 
            timeout=30
        )
        
        # 2. Extract GUIDs from the raw XML response
        root = ET.fromstring(list_response.text)
        guids = [elem.text for elem in root.findall(".//GUID")]
        
        if not guids:
            return {
                "status": "success", 
                "message": "No Sales Vouchers found in this date range.", 
                "data": []
            }
            
        logging.info(f"Found {len(guids)} Sales Vouchers. Beginning extraction loop...")
        
        processed_vouchers = []
        
        # 3. Loop through each GUID one at a time
        for idx, guid in enumerate(guids):
            logging.info(f"Processing Sales Voucher {idx + 1}/{len(guids)}: {guid}")
            
            # Fetch detailed XML for this specific voucher
            voucher_xml = build_single_voucher_xml(guid)
            voucher_res = requests.post(
                payload.tally_url, 
                data=voucher_xml, 
                headers={"Content-Type": "text/xml"}, 
                timeout=20
            )
            
            # Convert single voucher XML to Dict/JSON
            raw_voucher_json = tally_xml_to_json(voucher_res.text)
            
            # Pass ONLY this single voucher to the LLM
            try:
                llm_json_str = llm_normalize_tally(raw_voucher_json)
                normalized_voucher = json.loads(llm_json_str)
            except Exception as llm_err:
                logging.error(f"LLM failed on {guid}: {llm_err}")
                # Fallback to the raw parsed JSON if the LLM chokes
                normalized_voucher = {"error": "LLM Parsing Failed", "raw": raw_voucher_json}
                
            processed_vouchers.append(normalized_voucher)
            
            # Note: For production with thousands of bills, insert into the DB right here
            # rather than keeping the entire array in memory.

        return {
            "status": "success",
            "total_processed": len(processed_vouchers),
            "data": processed_vouchers
        }

    except Exception as e:
        logging.error(f"Sales Voucher Sync Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
    
@router.post("/upload-xml", dependencies=[Depends(check_department("Admin"))])
async def upload_tally_xml(file: UploadFile = File(...), user: dict = Depends(verify_bearer_token)):
    if not file.filename.lower().endswith(".xml"):
        raise HTTPException(status_code=400, detail="Only Tally XML files are supported.")
        
    content = await file.read()
    
    try:
        root = ET.fromstring(content)
        sales_orders_raw = []
        
        # 1. EXTRACT: Find only Sales Order Vouchers to save LLM tokens
        for voucher in root.findall(".//VOUCHER"):
            vch_type = voucher.attrib.get("VCHTYPE", "")
            vch_type_name = voucher.findtext("VOUCHERTYPENAME", "")
            
            if "Sales Order" in vch_type or "Sales Order" in vch_type_name:
                # Convert just this specific voucher XML to a Python dictionary
                voucher_xml_str = ET.tostring(voucher, encoding='unicode')
                sales_orders_raw.append(tally_xml_to_json(voucher_xml_str))
                
        if not sales_orders_raw:
            return {"status": "success", "extracted_orders": []}

        # 2. TRANSFORM: Pass the condensed array to Groq for strict schema mapping
        client = Groq(api_key=os.getenv("GROQ_API_KEY"))
        prompt = f"""
        You are a Tally ERP to Modern ERP data translator.
        Translate the following array of Tally Sales Orders into our strictly typed JSON schema.
        
        REQUIREMENTS:
        - order_acceptance_id: Generate a random UUID string for each order.
        - order_acceptance_date: Convert Tally date (YYYYMMDD) to YYYY-MM-DD.
        - purchase_order_number: Extract from <VOUCHERNUMBER>.
        - purchase_order_date: Same as order_acceptance_date.
        - customer_code: Extract from <PARTYLEDGERNAME>.
        - billing_name: Extract from <BASICBUYERNAME> or <PARTYLEDGERNAME>.
        - billing_address: Combine <BASICBUYERADDRESS.LIST> into a single string.
        - due_date: Add 30 days to the order_acceptance_date (YYYY-MM-DD format).
        - items: Map from <ALLINVENTORYENTRIES.LIST>. 
            - item_code: <STOCKITEMNAME>
            - additional_spec_text: "Imported from Tally XML"
            - hsn_code: ""
            - quantity: Extract numeric value from <BILLEDQTY> (e.g., "5.000 NOS" -> 5)
            - unit_measure: Extract unit from <BILLEDQTY> (e.g., "5.000 NOS" -> "NOS")
            - rate: Extract from <RATE>
            - discount_percentage: 0.0

        Return ONLY a JSON object with a single key 'orders' containing the array of mapped objects.
        
        Tally Raw Data:
        {json.dumps(sales_orders_raw)}
        """

        completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"},
            temperature=0.1
        )
        
        ai_mapped_json = json.loads(completion.choices[0].message.content)
        
        return {
            "status": "success", 
            "extracted_orders": ai_mapped_json.get("orders", [])
        }

    except Exception as e:
        logging.error(f"Tally XML Upload Error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to parse Tally XML: {str(e)}")