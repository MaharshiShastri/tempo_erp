from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
import base64
from services.ai_vision_parser import extract_grn_from_image
from security import verify_bearer_token
from fastapi.responses import StreamingResponse
from openpyxl import Workbook
import io
from io import BytesIO
from database.repository import EDBR
from openpyxl.styles import (Font, PatternFill, Border, Side, Alignment)
import csv
from difflib import SequenceMatcher

router = APIRouter(prefix="/api/v1/wms", tags=["Warehouse & Inventory"])

@router.post("/grn/scan-bill")
async def scan_vendor_bill(file: UploadFile = File(...), user: dict = Depends(verify_bearer_token)):
    # Restrict to images for the vision model
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Please upload an image file (JPG/PNG) of the bill.")

    try:
        # Read file and convert to Base64
        file_bytes = await file.read()
        base64_encoded = base64.b64encode(file_bytes).decode('utf-8')
        
        # Pass to Groq Vision
        ai_extracted_data = extract_grn_from_image(base64_encoded)
        subtotal = 0

        for item in ai_extracted_data["items"]:
            qty = float(item.get("quantity", 0) or 0)
            rate = float(item.get("rate", 0) or 0)

            item["amount"] = round(qty * rate, 2)
            subtotal += item["amount"]

            cgst = round(subtotal * 0.09, 2)
            sgst = round(subtotal * 0.09, 2)

            ai_extracted_data["taxes"] = {
                "cgst": cgst,
                "sgst": sgst
            }
        ai_extracted_data["subtotal"] = round(subtotal, 2)
        ai_extracted_data["grand_total"] = round(subtotal + cgst + sgst, 2)

        return {
            "status": "success",
            "message": "Bill scanned successfully.",
            "data": ai_extracted_data
        }
    except Exception as e:
        print(str(e))
        raise HTTPException(status_code=500, detail=f"Failed to process scan: {str(e)}")

@router.post("/grn/save")
async def save_grn(payload: dict, user: dict = Depends(verify_bearer_token)):
    result = EDBR.create_grn(payload, user["email"])

    return {
        "success": True,
        **result
    }

@router.get("/grn/export/{grn_id}")
async def export_grn_excel(grn_id: int, user: dict = Depends(verify_bearer_token)):

    grn = EDBR.get_grn_by_id(grn_id)

    if not grn:
        raise HTTPException(status_code=404, detail="GRN not found")
    
    wb = Workbook()
    ws = wb.active
    ws.title = "GRN"

    # ================= BORDER STYLE =================
    thin_border = Border(
        left=Side(style="thin"),
        right=Side(style="thin"),
        top=Side(style="thin"),
        bottom=Side(style="thin")
    )

    center = Alignment(horizontal="center", vertical="center")
    left = Alignment(horizontal="left", vertical="center")

    # ================= HEADER =================

    ws.merge_cells("A1:C1")
    ws["A1"] = "Tempo Instruments Pvt. Ltd."
    ws["A1"].font = Font(size=16, bold=True)
    ws["A1"].alignment = center

    ws["E2"] = "Date:"
    ws["F2"] = grn.get("invoice_date", "")
    ws["E2"].alignment = center
    ws["F2"].alignment = center

    # ================= FIXED HEADER FIELDS =================

    # Vendor
    ws["A3"] = "Name of Party:"
    ws["B3"] = grn.get("vendor_name", "")

    # Goods Rec No
    ws["E1"] = "Goods Rec. No:"
    ws["F1"] = grn.get("grn_number", "")

    # Invoice No & Date
    ws["D4"] = "Cash Memo/Invoice No. & Date:"
    ws.merge_cells("E4:F4")
    ws["E4"] = grn.get("invoice_number", "")

    # Challan No & Date
    ws["D5"] = "Challan No. & Date:"
    ws.merge_cells("E5:F5")
    ws["E5"] = grn.get("challan_number", "")

    # ================= TABLE HEADER =================

    start_row = 7

    headers = [
        "Sr. No.",
        "Code No.",
        "Description of Goods",
        "Qty",
        "Rate Per",
        "Amount"
    ]

    for col, h in enumerate(headers, 1):
        cell = ws.cell(row=start_row, column=col)
        cell.value = h
        cell.font = Font(bold=True, color="FFFFFF")
        cell.fill = PatternFill("solid", fgColor="4472C4")
        cell.alignment = center
        cell.border = thin_border

    # ================= ITEMS =================

    row = start_row + 1
    subtotal = 0

    for idx, item in enumerate(grn["items"], start=1):

        qty = float(item.get("quantity", 0) or 0)
        rate = float(item.get("rate", 0) or 0)
        amount = qty * rate
        subtotal += amount

        vendor_desc = item.get("description", "")
        internal_spec = item.get("test_specification", "")

        # ---------------- MAIN ROW ----------------
        ws.cell(row=row, column=1).value = idx
        ws.cell(row=row, column=2).value = item.get("item_code", "")
        ws.cell(row=row, column=3).value = vendor_desc
        ws.cell(row=row, column=4).value = qty
        ws.cell(row=row, column=5).value = rate
        ws.cell(row=row, column=6).value = amount

        for col in range(1, 7):
            ws.cell(row=row, column=col).border = thin_border

        # ---------------- SUB ROW (DETAIL SPEC) ----------------
        if internal_spec:

            row += 1

            ws.merge_cells(start_row=row, start_column=3, end_row=row, end_column=6)

            cell = ws.cell(row=row, column=3)
            cell.value = f"Spec: {internal_spec}"

            cell.font = Font(size=9, italic=True, color="666666")
            cell.alignment = Alignment(wrap_text=True)

            for col in range(1, 7):
                ws.cell(row=row, column=col).border = thin_border

        row += 1

    # ================= TAXES =================

    cgst = round(subtotal * 0.09, 2)
    sgst = round(subtotal * 0.09, 2)
    grand_total = subtotal + cgst + sgst

    row += 2

    totals = [
        ("CGST 9%", cgst),
        ("SGST 9%", sgst),
        ("Grand Total", grand_total),
    ]

    for label, value in totals:
        ws.cell(row=row, column=5).value = label
        ws.cell(row=row, column=6).value = value

        ws.cell(row=row, column=5).font = Font(bold=True)
        ws.cell(row=row, column=6).font = Font(bold=True)

        ws.cell(row=row, column=5).border = thin_border
        ws.cell(row=row, column=6).border = thin_border

        row += 1

    # ================= FOOTER BLOCK (AS YOU REQUESTED) =================

    row += 2  # spacing after items + taxes

    # Delivery Taken By (merged 3 cols)
    ws.merge_cells(start_row=row, start_column=1, end_row=row+1, end_column=3)
    cell1 = ws.cell(row=row, column=1)
    cell1.value = "Delivery Taken By:"
    cell1.alignment = center
    cell1.border = thin_border

    # Store Keeper (merged 3 cols)
    ws.merge_cells(start_row=row, start_column=4, end_row=row+1, end_column=6)
    cell2 = ws.cell(row=row, column=4)
    cell2.value = "Store Keeper (Signature of Keeper)"
    cell2.alignment = center
    cell2.border = thin_border

    # apply borders to full merged area
    for r in range(row, row + 2):
        for c in range(1, 7):
            ws.cell(row=r, column=c).border = thin_border
    # ================= COLUMN WIDTHS =================

    ws.column_dimensions["A"].width = 10
    ws.column_dimensions["B"].width = 15
    ws.column_dimensions["C"].width = 45
    ws.column_dimensions["D"].width = 10
    ws.column_dimensions["E"].width = 15
    ws.column_dimensions["F"].width = 18

    ws.freeze_panes = "A8"

    # ================= EXPORT =================

    stream = BytesIO()
    wb.save(stream)
    stream.seek(0)

    return StreamingResponse(
        stream,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={
            "Content-Disposition": f"attachment; filename={grn['grn_number']}.xlsx"
        }
    )

@router.post("/grn/export-preview")
async def export_preview_excel(payload: dict, user: dict = Depends(verify_bearer_token)):

    grn = payload

    wb = Workbook()
    ws = wb.active
    ws.title = "GRN"

    # ================= BORDER STYLE =================
    thin_border = Border(
        left=Side(style="thin"),
        right=Side(style="thin"),
        top=Side(style="thin"),
        bottom=Side(style="thin")
    )

    center = Alignment(horizontal="center", vertical="center")
    left = Alignment(horizontal="left", vertical="center")

    # ================= HEADER =================

    ws.merge_cells("A1:C1")
    ws["A1"] = "Tempo Instruments Pvt. Ltd."
    ws["A1"].font = Font(size=16, bold=True)
    ws["A1"].alignment = center

    ws["E2"] = "Date:"
    ws["F2"] = grn.get("invoice_date", "")
    ws["E2"].alignment = center
    ws["F2"].alignment = center

    # ================= FIXED HEADER FIELDS =================

    # Vendor
    ws["A3"] = "Name of Party:"
    ws["B3"] = grn.get("vendor_name", "")

    # Goods Rec No
    ws["E1"] = "Goods Rec. No:"
    ws["F1"] = grn.get("grn_number", "")

    # Invoice No & Date
    ws["D4"] = "Cash Memo/Invoice No. & Date:"
    ws.merge_cells("E4:F4")
    ws["E4"] = grn.get("invoice_number", "")

    # Challan No & Date
    ws["D5"] = "Challan No. & Date:"
    ws.merge_cells("E5:F5")
    ws["E5"] = grn.get("challan_number", "")

    # ================= TABLE HEADER =================

    start_row = 7

    headers = [
        "Sr. No.",
        "Code No.",
        "Description of Goods",
        "Qty",
        "Rate Per",
        "Amount"
    ]

    for col, h in enumerate(headers, 1):
        cell = ws.cell(row=start_row, column=col)
        cell.value = h
        cell.font = Font(bold=True, color="FFFFFF")
        cell.fill = PatternFill("solid", fgColor="4472C4")
        cell.alignment = center
        cell.border = thin_border

    # ================= ITEMS =================

    row = start_row + 1
    subtotal = 0

    for idx, item in enumerate(grn["items"], start=1):

        qty = float(item.get("quantity", 0) or 0)
        rate = float(item.get("rate", 0) or 0)
        amount = qty * rate
        subtotal += amount

        vendor_desc = item.get("description", "")
        internal_spec = item.get("test_specification", "")

        # ---------------- MAIN ROW ----------------
        ws.cell(row=row, column=1).value = idx
        ws.cell(row=row, column=2).value = item.get("item_code", "")
        ws.cell(row=row, column=3).value = vendor_desc
        ws.cell(row=row, column=4).value = qty
        ws.cell(row=row, column=5).value = rate
        ws.cell(row=row, column=6).value = amount

        for col in range(1, 7):
            ws.cell(row=row, column=col).border = thin_border

        # ---------------- SUB ROW (DETAIL SPEC) ----------------
        if internal_spec:

            row += 1

            ws.merge_cells(start_row=row, start_column=3, end_row=row, end_column=6)

            cell = ws.cell(row=row, column=3)
            cell.value = f"Spec: {internal_spec}"

            cell.font = Font(size=9, italic=True, color="666666")
            cell.alignment = Alignment(wrap_text=True)

            for col in range(1, 7):
                ws.cell(row=row, column=col).border = thin_border

        row += 1

    # ================= TAXES =================

    cgst = round(subtotal * 0.09, 2)
    sgst = round(subtotal * 0.09, 2)
    grand_total = subtotal + cgst + sgst

    row += 2

    totals = [
        ("CGST 9%", cgst),
        ("SGST 9%", sgst),
        ("Grand Total", grand_total),
    ]

    for label, value in totals:
        ws.cell(row=row, column=5).value = label
        ws.cell(row=row, column=6).value = value

        ws.cell(row=row, column=5).font = Font(bold=True)
        ws.cell(row=row, column=6).font = Font(bold=True)

        ws.cell(row=row, column=5).border = thin_border
        ws.cell(row=row, column=6).border = thin_border

        row += 1

    # ================= FOOTER BLOCK (AS YOU REQUESTED) =================

    row += 2  # spacing after items + taxes

    # Delivery Taken By (merged 3 cols)
    ws.merge_cells(start_row=row, start_column=1, end_row=row+1, end_column=3)
    cell1 = ws.cell(row=row, column=1)
    cell1.value = "Delivery Taken By:"
    cell1.alignment = center
    cell1.border = thin_border

    # Store Keeper (merged 3 cols)
    ws.merge_cells(start_row=row, start_column=4, end_row=row+1, end_column=6)
    cell2 = ws.cell(row=row, column=4)
    cell2.value = "Store Keeper (Signature of Keeper)"
    cell2.alignment = center
    cell2.border = thin_border

    # apply borders to full merged area
    for r in range(row, row + 2):
        for c in range(1, 7):
            ws.cell(row=r, column=c).border = thin_border
    # ================= COLUMN WIDTHS =================

    ws.column_dimensions["A"].width = 10
    ws.column_dimensions["B"].width = 15
    ws.column_dimensions["C"].width = 45
    ws.column_dimensions["D"].width = 10
    ws.column_dimensions["E"].width = 15
    ws.column_dimensions["F"].width = 18

    ws.freeze_panes = "A8"

    # ================= EXPORT =================

    stream = BytesIO()
    wb.save(stream)
    stream.seek(0)

    return StreamingResponse(
        stream,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={
            "Content-Disposition": f"attachment; filename={grn['grn_number']}.xlsx"
        }
    )
@router.post("/items/seed-test-csv")
async def seed_test_items_from_csv(file: UploadFile = File(...), user: dict = Depends(verify_bearer_token)):
    # 1. Validate file type
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Only CSV files are supported for this operation.")

    try:
        # 2. Read and decode the CSV file in memory
        contents = await file.read()
        
        try:
            decoded = contents.decode('utf-8-sig')
        except UnicodeDecodeError:
            decoded = contents.decode('cp1252')

        reader = csv.DictReader(io.StringIO(decoded))
        print("Headers:", reader.fieldnames)
        items_to_insert = []
        
        # 3. Map the CSV rows to our database schema
        for row in reader:
            # We use .get() to safely pull the headers you mentioned
            item_code = row.get('Item code', '').strip()
            item_spec = row.get('Item Specifications', '').strip()

            if item_code:
                items_to_insert.append({
                    "item_code": item_code,
                    "item_specification": item_spec
                })

        if not items_to_insert:
             raise ValueError("No valid items found. Please ensure headers are exactly 'Item code' and 'Item Specifications'.")

        # 4. Trigger the bulk database insert
        EDBR.seed_test_items(items_to_insert)

        return {
            "status": "success", 
            "message": f"Successfully processed the CSV. Sent {len(items_to_insert)} items to the testing database."
        }

    except Exception as e:
        print(str(e))
        raise HTTPException(status_code=500, detail=f"Failed to process CSV upload: {str(e)}")
    
@router.get("/test-item/{item_code}")
def get_test_item(item_code: str):
    item = EDBR.get_test_item_by_code(item_code)

    if not item:
        return None

    return item