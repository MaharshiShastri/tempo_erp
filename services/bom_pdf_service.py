from io import BytesIO
from decimal import Decimal
from datetime import datetime

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import (SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, KeepTogether,)


def _money(value) -> str:
    try:
        return f"₹{float(value or 0):,.2f}"
    except (TypeError, ValueError):
        return "₹0.00"


def _number(value, decimals=4) -> str:
    try:
        return f"{float(value or 0):,.{decimals}f}"
    except (TypeError, ValueError):
        return "0"


def _format_datetime(value) -> str:
    if not value:
        return "-"

    if isinstance(value, datetime):
        return value.strftime("%d-%m-%Y %H:%M")

    try:
        parsed = datetime.fromisoformat(
            str(value).replace("Z", "")
        )
        return parsed.strftime("%d-%m-%Y %H:%M")
    except Exception:
        return str(value)


def generate_bom_pdf(bom: dict, cost_range: dict, generated_by: str,) -> BytesIO:

    buffer = BytesIO()

    document = SimpleDocTemplate(
        buffer,
        pagesize=landscape(A4),
        rightMargin=10 * mm,
        leftMargin=10 * mm,
        topMargin=10 * mm,
        bottomMargin=12 * mm,
        title="Tempo Internal ERP - BOM Planning",
        author=generated_by or "Tempo ERP",
    )

    styles = getSampleStyleSheet()

    title_style = ParagraphStyle(
        "BOMTitle",
        parent=styles["Title"],
        fontName="Helvetica-Bold",
        fontSize=18,
        leading=22,
        alignment=TA_CENTER,
        spaceAfter=4 * mm,
    )

    subtitle_style = ParagraphStyle(
        "BOMSubtitle",
        parent=styles["Normal"],
        fontSize=8,
        textColor=colors.grey,
        alignment=TA_CENTER,
        spaceAfter=5 * mm,
    )

    section_style = ParagraphStyle(
        "Section",
        parent=styles["Heading2"],
        fontName="Helvetica-Bold",
        fontSize=10,
        leading=12,
        spaceBefore=3 * mm,
        spaceAfter=2 * mm,
    )

    normal_style = ParagraphStyle(
        "NormalSmall",
        parent=styles["Normal"],
        fontSize=8,
        leading=10,
    )

    center_style = ParagraphStyle(
        "CenterSmall",
        parent=normal_style,
        alignment=TA_CENTER,
    )

    right_style = ParagraphStyle(
        "RightSmall",
        parent=normal_style,
        alignment=TA_RIGHT,
    )

    header_style = ParagraphStyle(
        "Header",
        parent=normal_style,
        fontName="Helvetica-Bold",
        fontSize=7.5,
        leading=9,
        alignment=TA_CENTER,
        textColor=colors.white,
    )

    cell_style = ParagraphStyle(
        "Cell",
        parent=normal_style,
        fontSize=7,
        leading=8.5,
    )

    story = []

    # =========================================================
    # TITLE
    # =========================================================

    story.append(Paragraph("Tempo Internal ERP - BOM Planning", title_style,))

    story.append(Paragraph("Bill of Materials / Manufacturing Material Planning Document", subtitle_style,))

    # =========================================================
    # BOM HEADER INFORMATION
    # =========================================================

    finished_item = bom.get("finished_item") or {}

    finished_code = (
        finished_item.get("item_code")
        or bom.get("item_code")
        or "-"
    )

    finished_name = (finished_item.get("item_name") or "-")

    minimum_cost = cost_range.get("minimum_material_cost", 0,)

    maximum_cost = cost_range.get("maximum_material_cost", 0,)

    info_data = [
        [
            Paragraph("<b>Finished Goods Item Code</b>", normal_style,),
            Paragraph(f"<b>{finished_code}</b><br/>{finished_name}", normal_style,),
            Paragraph("<b>Created At</b>", normal_style,),
            Paragraph(_format_datetime(bom.get("created_at")), normal_style,),
        ],
        [
            Paragraph("<b>Current Status</b>", normal_style,),
            Paragraph(str(bom.get("status") or "-"), normal_style,),
            Paragraph("<b>BOM Revision</b>", normal_style,),
            Paragraph(str(bom.get("revision_no") or "-"), normal_style,),
        ],
        [
            Paragraph("<b>BOM Name</b>", normal_style,),
            Paragraph(str(bom.get("bom_name") or "-"), normal_style,),
            Paragraph("<b>Output Quantity</b>", normal_style,),
            Paragraph(f"{_number(bom.get('output_quantity'))} " f"{bom.get('uom') or ''}", normal_style,),
        ],
    ]

    info_table = Table(
        info_data,
        colWidths=[42 * mm, 72 * mm, 32 * mm, 52 * mm,],
        repeatRows=0,
    )

    info_table.setStyle(
        TableStyle(
            [
                (
                    "GRID",
                    (0, 0),
                    (-1, -1),
                    0.5,
                    colors.grey,
                ),
                (
                    "BACKGROUND",
                    (0, 0),
                    (0, -1),
                    colors.HexColor("#eeeeee"),
                ),
                (
                    "BACKGROUND",
                    (2, 0),
                    (2, -1),
                    colors.HexColor("#eeeeee"),
                ),
                (
                    "VALIGN",
                    (0, 0),
                    (-1, -1),
                    "MIDDLE",
                ),
                (
                    "LEFTPADDING",
                    (0, 0),
                    (-1, -1),
                    5,
                ),
                (
                    "RIGHTPADDING",
                    (0, 0),
                    (-1, -1),
                    5,
                ),
                (
                    "TOPPADDING",
                    (0, 0),
                    (-1, -1),
                    5,
                ),
                (
                    "BOTTOMPADDING",
                    (0, 0),
                    (-1, -1),
                    5,
                ),
            ]
        )
    )

    story.append(info_table)
    story.append(Spacer(1, 4 * mm))

    # =========================================================
    # COST BOXES
    # =========================================================

    min_box = Table(
        [
            [
                Paragraph(
                    "APPROX. MINIMUM RAW MATERIAL COST",
                    header_style,
                )
            ],
            [
                Paragraph(
                    _money(minimum_cost),
                    ParagraphStyle(
                        "MinCost",
                        parent=styles["Normal"],
                        fontName="Helvetica-Bold",
                        fontSize=14,
                        alignment=TA_CENTER,
                    ),
                )
            ],
        ],
        colWidths=[85 * mm],
    )

    max_box = Table(
        [
            [
                Paragraph(
                    "APPROX. MAXIMUM RAW MATERIAL COST",
                    header_style,
                )
            ],
            [
                Paragraph(
                    _money(maximum_cost),
                    ParagraphStyle(
                        "MaxCost",
                        parent=styles["Normal"],
                        fontName="Helvetica-Bold",
                        fontSize=14,
                        alignment=TA_CENTER,
                    ),
                )
            ],
        ],
        colWidths=[85 * mm],
    )

    for box in (min_box, max_box):
        box.setStyle(
            TableStyle(
                [
                    (
                        "BOX",
                        (0, 0),
                        (-1, -1),
                        0.8,
                        colors.grey,
                    ),
                    (
                        "BACKGROUND",
                        (0, 0),
                        (-1, 0),
                        colors.HexColor("#404040"),
                    ),
                    (
                        "BACKGROUND",
                        (0, 1),
                        (-1, 1),
                        colors.HexColor("#f7f7f7"),
                    ),
                    (
                        "ALIGN",
                        (0, 0),
                        (-1, -1),
                        "CENTER",
                    ),
                    (
                        "VALIGN",
                        (0, 0),
                        (-1, -1),
                        "MIDDLE",
                    ),
                    (
                        "TOPPADDING",
                        (0, 0),
                        (-1, -1),
                        6,
                    ),
                    (
                        "BOTTOMPADDING",
                        (0, 0),
                        (-1, -1),
                        6,
                    ),
                ]
            )
        )

    cost_boxes = Table(
        [[min_box, max_box]],
        colWidths=[
            90 * mm,
            90 * mm,
        ],
        hAlign="CENTER",
    )

    story.append(cost_boxes)

    # =========================================================
    # RAW MATERIAL TABLE
    # =========================================================

    story.append(
        Paragraph(
            "Raw Material Requirements",
            section_style,
        )
    )

    cost_components = {
        str(item.get("item_code")): item
        for item in cost_range.get(
            "components",
            [],
        )
    }

    table_data = [
        [
            Paragraph("S.No.", header_style),
            Paragraph("Raw Material Code", header_style),
            Paragraph("Specification", header_style),
            Paragraph("Qty.", header_style),
            Paragraph("UOM", header_style),
            Paragraph("Scrap %", header_style),
            Paragraph("Effective Qty.", header_style),
            Paragraph("Min Rate", header_style),
            Paragraph("Max Rate", header_style),
            Paragraph("Min Cost", header_style),
            Paragraph("Max Cost", header_style),
            Paragraph("Notes", header_style),
        ]
    ]

    for index, component in enumerate(bom.get("components", []), start=1,):
        item_code = str(component.get("item_code") or "")

        calculated = cost_components.get(item_code, {},)

        specification = (component.get("item_specification") or "-")

        table_data.append(
            [
                Paragraph(str(index), center_style,),
                Paragraph(item_code, cell_style,),
                Paragraph(specification, cell_style,),
                Paragraph(_number(component.get("quantity")), right_style,),
                Paragraph(str(component.get("uom") or "" ), center_style,),
                Paragraph(f"{float(component.get('scrap_percent') or 0):.2f}%", right_style,),
                Paragraph(_number(calculated.get("effective_quantity", component.get("quantity"),)), right_style,),
                Paragraph(_money(calculated.get("minimum_rate", 0,)), right_style,),
                Paragraph(_money(calculated.get("maximum_rate", 0,)), right_style,),
                Paragraph(_money(calculated.get("minimum_cost", 0,)), right_style,),
                Paragraph(_money(calculated.get("maximum_cost", 0,)), right_style,),
                Paragraph(str(component.get("notes") or "" ), cell_style,),
            ]
        )

    raw_table = Table(
        table_data,
        colWidths=[10 * mm, 28 * mm, 58 * mm, 18 * mm, 14 * mm, 18 * mm, 23 * mm, 24 * mm, 24 * mm, 26 * mm, 26 * mm, 35 * mm,],
        repeatRows=1,
        repeatCols=0,
    )

    raw_table.setStyle(
        TableStyle(
            [
                (
                    "BACKGROUND",
                    (0, 0),
                    (-1, 0),
                    colors.HexColor("#333333"),
                ),
                (
                    "TEXTCOLOR",
                    (0, 0),
                    (-1, 0),
                    colors.white,
                ),
                (
                    "GRID",
                    (0, 0),
                    (-1, -1),
                    0.35,
                    colors.grey,
                ),
                (
                    "VALIGN",
                    (0, 0),
                    (-1, -1),
                    "MIDDLE",
                ),
                (
                    "ROWBACKGROUNDS",
                    (0, 1),
                    (-1, -1),
                    [
                        colors.white,
                        colors.HexColor("#f7f7f7"),
                    ],
                ),
                (
                    "LEFTPADDING",
                    (0, 0),
                    (-1, -1),
                    3,
                ),
                (
                    "RIGHTPADDING",
                    (0, 0),
                    (-1, -1),
                    3,
                ),
                (
                    "TOPPADDING",
                    (0, 0),
                    (-1, -1),
                    4,
                ),
                (
                    "BOTTOMPADDING",
                    (0, 0),
                    (-1, -1),
                    4,
                ),
            ]
        )
    )

    story.append(raw_table)

    # =========================================================
    # TOTAL
    # =========================================================

    story.append(Spacer(1, 3 * mm))

    total_table = Table(
        [
            [
                "",
                "",
                "",
                "",
                "",
                "",
                "",
                "",
                Paragraph(
                    "<b>Total Approx. Cost</b>",
                    right_style,
                ),
                Paragraph(
                    f"<b>{_money(minimum_cost)}</b>",
                    right_style,
                ),
                Paragraph(
                    f"<b>{_money(maximum_cost)}</b>",
                    right_style,
                ),
                "",
            ]
        ],
        colWidths=[
            10 * mm,
            28 * mm,
            58 * mm,
            18 * mm,
            14 * mm,
            18 * mm,
            23 * mm,
            24 * mm,
            24 * mm,
            26 * mm,
            26 * mm,
            35 * mm,
        ],
    )

    total_table.setStyle(
        TableStyle(
            [
                (
                    "GRID",
                    (8, 0),
                    (10, 0),
                    0.5,
                    colors.grey,
                ),
                (
                    "BACKGROUND",
                    (8, 0),
                    (10, 0),
                    colors.HexColor("#eeeeee"),
                ),
                (
                    "SPAN",
                    (8, 0),
                    (8, 0),
                ),
                (
                    "VALIGN",
                    (0, 0),
                    (-1, -1),
                    "MIDDLE",
                ),
                (
                    "TOPPADDING",
                    (0, 0),
                    (-1, -1),
                    5,
                ),
                (
                    "BOTTOMPADDING",
                    (0, 0),
                    (-1, -1),
                    5,
                ),
            ]
        )
    )

    story.append(total_table)

    # =========================================================
    # SIGNATURES
    # =========================================================

    story.append(Spacer(1, 10 * mm))

    generator_name = (
        generated_by
        or "________________________"
    )

    signature_table = Table(
        [
            [
                Paragraph(
                    "<b>Generated By</b>",
                    center_style,
                ),
                Paragraph(
                    "<b>Approved By</b>",
                    center_style,
                ),
            ],
            [
                Paragraph(
                    generator_name,
                    center_style,
                ),
                Paragraph(
                    "Name: ______________________________",
                    center_style,
                ),
            ],
            [
                Paragraph(
                    "<br/><br/>Signature: ________________________",
                    center_style,
                ),
                Paragraph(
                    "<br/>Sign: ________________________________",
                    center_style,
                ),
            ],
            [
                Paragraph(
                    f"Date: {datetime.now().strftime('%d-%m-%Y')}",
                    center_style,
                ),
                Paragraph(
                    "Date: ________________________________",
                    center_style,
                ),
            ],
        ],
        colWidths=[
            110 * mm,
            110 * mm,
        ],
    )

    signature_table.setStyle(
        TableStyle(
            [
                (
                    "BOX",
                    (0, 0),
                    (-1, -1),
                    0.5,
                    colors.grey,
                ),
                (
                    "INNERGRID",
                    (0, 0),
                    (-1, -1),
                    0.3,
                    colors.grey,
                ),
                (
                    "VALIGN",
                    (0, 0),
                    (-1, -1),
                    "MIDDLE",
                ),
                (
                    "TOPPADDING",
                    (0, 0),
                    (-1, -1),
                    5,
                ),
                (
                    "BOTTOMPADDING",
                    (0, 0),
                    (-1, -1),
                    5,
                ),
            ]
        )
    )

    story.append(signature_table)

    story.append(Spacer(1, 4 * mm))

    story.append(
        Paragraph(
            "<b>Approved By (Name, Sign & Date above please)</b>",
            ParagraphStyle(
                "ApprovalInstruction",
                parent=normal_style,
                alignment=TA_CENTER,
                fontSize=7,
                textColor=colors.grey,
            ),
        )
    )

    # =========================================================
    # BUILD
    # =========================================================

    document.build(story)

    buffer.seek(0)

    return buffer