from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
import base64
from services.ai_vision_parser import extract_grn_from_image
from security import verify_bearer_token
from fastapi.responses import StreamingResponse
from openpyxl import Workbook
from io import BytesIO
from database.repository import EDBR
from openpyxl.styles import (Font, PatternFill, Border, Side, Alignment)
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

    # =====================================================
    # STYLES
    # =====================================================

    title_font = Font(size=16, bold=True, color="FFFFFF")

    header_font = Font(bold=True, color="FFFFFF")

    bold_font = Font(bold=True)

    title_fill = PatternFill("solid", fgColor="1F4E78")

    header_fill = PatternFill("solid", fgColor="4472C4")

    total_fill = PatternFill("solid", fgColor="D9EAD3")

    alternate_fill = PatternFill("solid", fgColor="F7F7F7")

    thin_border = Border(left=Side(style="thin"), right=Side(style="thin"), top=Side(style="thin"), bottom=Side(style="thin"))

    center = Alignment(horizontal="center", vertical="center")

    # =====================================================
    # TITLE
    # =====================================================

    ws.merge_cells("A1:E1")

    title_cell = ws["A1"]
    title_cell.value = "GOODS RECEIPT NOTE (GRN)"
    title_cell.font = title_font
    title_cell.fill = title_fill
    title_cell.alignment = center

    # =====================================================
    # HEADER DETAILS
    # =====================================================

    ws["A3"] = "GRN Number"
    ws["B3"] = grn["grn_number"]

    ws["A4"] = "Vendor"
    ws["B4"] = grn["vendor_name"]

    ws["A5"] = "invoice Date"
    ws["B5"] = str(grn.get("invoice_date"))

    for row in [3, 4, 5]:
        ws[f"A{row}"].font = bold_font

    # =====================================================
    # ITEMS HEADER
    # =====================================================

    start_row = 8

    headers = ["Item Code", "Quantity", "Rate", "Amount"]

    for col_num, header in enumerate(headers, start=1):
        cell = ws.cell(row=start_row, column=col_num)

        cell.value = header
        cell.font = header_font
        cell.fill = header_fill
        cell.border = thin_border
        cell.alignment = center

    # =====================================================
    # ITEMS
    # =====================================================

    current_row = start_row + 1

    subtotal = 0

    for idx, item in enumerate(grn["items"]):

        amount = item["quantity"] * item["rate"]
        subtotal += amount

        values = [item["item_code"], float(item["quantity"]), float(item["rate"]), amount]

        for col_num, value in enumerate(values, start=1):

            cell = ws.cell(row=current_row, column=col_num)

            cell.value = value
            cell.border = thin_border

            if idx % 2 == 0:
                cell.fill = alternate_fill

            if col_num in [2, 3, 4]:
                cell.number_format = '#,##0.00'

        current_row += 1

    # =====================================================
    # TOTALS
    # =====================================================

    totals_row = current_row + 2

    totals = [("Subtotal", subtotal), ("CGST", 0), ("SGST", 0), ("Grand Total", subtotal)]

    for label, value in totals:

        ws.cell(row=totals_row, column=3).value = label

        value_cell = ws.cell(row=totals_row, column=4)

        value_cell.value = value

        ws.cell(row=totals_row, column=3).font = bold_font

        value_cell.font = bold_font

        ws.cell(row=totals_row, column=3).fill = total_fill

        value_cell.fill = total_fill

        ws.cell(row=totals_row, column=3).border = thin_border

        value_cell.border = thin_border

        value_cell.number_format = '#,##0.00'

        totals_row += 1

    # =====================================================
    # COLUMN WIDTHS
    # =====================================================

    widths = {"A": 25, "B": 15, "C": 15, "D": 18, "E": 18 }

    for col, width in widths.items():
        ws.column_dimensions[col].width = width

    # =====================================================
    # FREEZE HEADER
    # =====================================================

    ws.freeze_panes = "A9"

    # =====================================================
    # EXPORT
    # =====================================================

    stream = BytesIO()
    wb.save(stream)
    stream.seek(0)

    return StreamingResponse(stream, media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", headers={
            "Content-Disposition":
            f"attachment; filename={grn['grn_number']}.xlsx"
        }
    )

@router.post("/grn/export-preview")
async def export_preview_excel(payload: dict, user: dict = Depends(verify_bearer_token)):

    grn = payload

    wb = Workbook()
    ws = wb.active
    ws.title = "GRN"

    # ================= HEADER =================
    ws.merge_cells("A1:E1")
    ws["A1"] = "GOODS RECEIPT NOTE (GRN)"
    ws["A1"].font = Font(size=16, bold=True)
    ws["A1"].alignment = Alignment(horizontal="center")

    ws["A3"] = "Vendor Name"
    ws["B3"] = grn.get("vendor_name", "")

    ws["A4"] = "Invoice No"
    ws["B4"] = grn.get("invoice_number", "")

    ws["A5"] = "GRN No"
    ws["B5"] = grn.get("grn_number", "")

    # ================= TABLE HEADER =================
    start_row = 7

    headers = [
        "Internal Item Code",
        "Vendor Description",
        "Qty",
        "Rate",
        "Amount"
    ]

    for col, h in enumerate(headers, 1):
        cell = ws.cell(row=start_row, column=col)
        cell.value = h
        cell.font = Font(bold=True)
        cell.fill = PatternFill("solid", fgColor="4472C4")
        cell.font = Font(bold=True, color="FFFFFF")
        cell.alignment = Alignment(horizontal="center")

    # ================= ITEMS =================
    row = start_row + 1
    subtotal = 0

    for item in grn["items"]:
        qty = float(item.get("quantity", 0))
        rate = float(item.get("rate", 0))
        amount = qty * rate
        subtotal += amount

        ws.cell(row=row, column=1).value = item.get("item_code", "")
        ws.cell(row=row, column=2).value = item.get("description", "")
        ws.cell(row=row, column=3).value = qty
        ws.cell(row=row, column=4).value = rate
        ws.cell(row=row, column=5).value = amount

        row += 1

    # ================= TAXES =================
    cgst = round(subtotal * 0.09, 2)
    sgst = round(subtotal * 0.09, 2)
    grand_total = subtotal + cgst + sgst

    # ================= FOOTER (MATCH FRONTEND STYLE) =================
    row += 2

    footer = [
        ("Subtotal", subtotal),
        ("SGST (9%)", sgst),
        ("CGST (9%)", cgst),
        ("Grand Total", grand_total),
    ]

    for label, value in footer:
        ws.cell(row=row, column=4).value = label
        ws.cell(row=row, column=5).value = value

        ws.cell(row=row, column=4).font = Font(bold=True)
        ws.cell(row=row, column=5).font = Font(bold=True)

        row += 1

    # ================= COLUMN WIDTHS =================
    ws.column_dimensions["A"].width = 25
    ws.column_dimensions["B"].width = 45
    ws.column_dimensions["C"].width = 10
    ws.column_dimensions["D"].width = 15
    ws.column_dimensions["E"].width = 18

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