from pathlib import Path
from datetime import date

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, KeepTogether
from database.repository import EDBR

BASE_DIR = Path(__file__).resolve().parent.parent

ANALYTICS_OUTPUT_DIR = BASE_DIR / "generated_analytics"

def generate_today_quotation_pdf(data):

    ANALYTICS_OUTPUT_DIR.mkdir(parents=True, exist_ok=True,)

    report_date = data["date"]
    quotations = data["quotations"]
    summary = data["summary"]

    filename = f"Quotation_Analytics_{report_date.strftime('%Y-%m-%d')}.pdf"

    output_path = ANALYTICS_OUTPUT_DIR / filename

    document = SimpleDocTemplate(
        str(output_path),
        pagesize=A4,
        rightMargin=15 * mm,
        leftMargin=15 * mm,
        topMargin=15 * mm,
        bottomMargin=15 * mm,
    )

    styles = getSampleStyleSheet()

    title_style = ParagraphStyle(
        "ReportTitle",
        parent=styles["Title"],
        fontSize=20,
        leading=24,
        alignment=TA_CENTER,
        spaceAfter=5 * mm,
    )

    subtitle_style = ParagraphStyle(
        "ReportSubtitle",
        parent=styles["Normal"],
        fontSize=10,
        alignment=TA_CENTER,
        textColor=colors.grey,
        spaceAfter=8 * mm,
    )

    heading_style = ParagraphStyle(
        "Heading",
        parent=styles["Heading2"],
        fontSize=13,
        leading=16,
        spaceBefore=5 * mm,
        spaceAfter=3 * mm,
    )

    normal_style = ParagraphStyle(
        "NormalReport",
        parent=styles["Normal"],
        fontSize=9,
        leading=12,
    )

    small_style = ParagraphStyle(
        "SmallReport",
        parent=styles["Normal"],
        fontSize=8,
        leading=10,
    )

    table_header_style = ParagraphStyle(
        "TableHeader",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=8,
        leading=9,
        textColor=colors.white,
        alignment=TA_CENTER,
    )

    story = []

    # --------------------------------------------------
    # HEADER
    # --------------------------------------------------

    story.append(Paragraph("TEMPO INSTRUMENTS", title_style,))

    story.append(Paragraph("Daily Quotation Activity Report",subtitle_style,))

    story.append(Paragraph(f"<b>Report Date:</b> {report_date.strftime('%d %B %Y')}",normal_style,))

    story.append(Spacer(1, 5 * mm))

    # --------------------------------------------------
    # EXECUTIVE SUMMARY
    # --------------------------------------------------

    story.append(Paragraph(
            "Daily Summary",
            heading_style,
        )
    )

    summary_data = [
        ["Metric", "Today"],
        [
            "Total Quotations Generated",
            str(summary["total"]),
        ],
        [
            "Standard Model Quotations",
            str(summary["standard_model_quotes"]),
        ],
        [
            "Special Model Quotations",
            str(summary["special_model_quotes"]),
        ],
        [
            "Dealer Quotations",
            str(summary["dealer_quotes"]),
        ],
    ]

    summary_table = Table(
        summary_data,
        colWidths=[120 * mm, 45 * mm],
    )

    summary_table.setStyle(
        TableStyle([
            (
                "BACKGROUND",
                (0, 0),
                (-1, 0),
                colors.HexColor("#1f2937"),
            ),
            (
                "TEXTCOLOR",
                (0, 0),
                (-1, 0),
                colors.white,
            ),
            (
                "FONTNAME",
                (0, 0),
                (-1, 0),
                "Helvetica-Bold",
            ),
            (
                "FONTNAME",
                (0, 1),
                (0, -1),
                "Helvetica-Bold",
            ),
            (
                "GRID",
                (0, 0),
                (-1, -1),
                0.5,
                colors.grey,
            ),
            (
                "VALIGN",
                (0, 0),
                (-1, -1),
                "MIDDLE",
            ),
            (
                "ALIGN",
                (1, 1),
                (1, -1),
                "CENTER",
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
        ])
    )

    story.append(summary_table)

    # --------------------------------------------------
    # SALES USER PERFORMANCE
    # --------------------------------------------------

    story.append(
        Paragraph(
            "Quotation Activity by Sales Team Member",
            heading_style,
        )
    )

    user_data = [
        [
            Paragraph("Sales Representative", table_header_style),
            Paragraph("Email", table_header_style),
            Paragraph("Quotations", table_header_style),
        ]
    ]

    for name, user_info in summary["by_sales_user"].items():

        user_data.append([
            name,
            user_info["email"],
            str(user_info["count"]),
        ])

    if len(user_data) == 1:
        user_data.append([
            "No quotations generated today",
            "",
            "0",
        ])

    user_table = Table(
        user_data,
        colWidths=[65 * mm, 75 * mm, 25 * mm],
        repeatRows=1,
    )

    user_table.setStyle(
        TableStyle([
            (
                "BACKGROUND",
                (0, 0),
                (-1, 0),
                colors.HexColor("#1f2937"),
            ),
            (
                "TEXTCOLOR",
                (0, 0),
                (-1, 0),
                colors.white,
            ),
            (
                "FONTNAME",
                (0, 0),
                (-1, 0),
                "Helvetica-Bold",
            ),
            (
                "GRID",
                (0, 0),
                (-1, -1),
                0.5,
                colors.grey,
            ),
            (
                "ALIGN",
                (-1, 1),
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
                5,
            ),
            (
                "BOTTOMPADDING",
                (0, 0),
                (-1, -1),
                5,
            ),
        ])
    )

    story.append(user_table)

    # --------------------------------------------------
    # PRODUCT ACTIVITY
    # --------------------------------------------------

    story.append(
        Paragraph(
            "Products Quoted Today",
            heading_style,
        )
    )

    product_data = [
        [
            Paragraph("Product", table_header_style),
            Paragraph("Quotation Count", table_header_style),
        ]
    ]

    for product, count in sorted(
        summary["by_product"].items(),
        key=lambda x: x[1],
        reverse=True,
    ):
        product_data.append([
            product,
            str(count),
        ])

    if len(product_data) == 1:
        product_data.append([
            "No products quoted today",
            "0",
        ])

    product_table = Table(
        product_data,
        colWidths=[130 * mm, 35 * mm],
        repeatRows=1,
    )

    product_table.setStyle(
        TableStyle([
            (
                "BACKGROUND",
                (0, 0),
                (-1, 0),
                colors.HexColor("#1f2937"),
            ),
            (
                "TEXTCOLOR",
                (0, 0),
                (-1, 0),
                colors.white,
            ),
            (
                "FONTNAME",
                (0, 0),
                (-1, 0),
                "Helvetica-Bold",
            ),
            (
                "GRID",
                (0, 0),
                (-1, -1),
                0.5,
                colors.grey,
            ),
            (
                "ALIGN",
                (1, 1),
                (1, -1),
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
                5,
            ),
            (
                "BOTTOMPADDING",
                (0, 0),
                (-1, -1),
                5,
            ),
        ])
    )

    story.append(product_table)

    # --------------------------------------------------
    # DETAILED QUOTATIONS
    # --------------------------------------------------

    story.append(
        Paragraph(
            "Quotation Details",
            heading_style,
        )
    )

    quotation_data = [
        [
            "Quote No.",
            "Company",
            "Product",
            "Salesperson",
            "Type",
        ]
    ]

    for quotation in quotations:

        quote_type = []

        if quotation.is_dealer:
            quote_type.append("Dealer")

        if quotation.is_special_model:
            quote_type.append("Special")

        if not quote_type:
            quote_type.append("Standard")

        quotation_data.append([
            quotation.quote_number,
            quotation.client_company,
            quotation.product_name,
            quotation.sales_user_name,
            ", ".join(quote_type),
        ])

    if len(quotation_data) == 1:
        quotation_data.append([
            "-",
            "No quotations generated today",
            "-",
            "-",
            "-",
        ])

    quotation_table = Table(
        quotation_data,
        colWidths=[
            25 * mm,
            42 * mm,
            48 * mm,
            35 * mm,
            25 * mm,
        ],
        repeatRows=1,
    )

    quotation_table.setStyle(
        TableStyle([
            (
                "BACKGROUND",
                (0, 0),
                (-1, 0),
                colors.HexColor("#1f2937"),
            ),
            (
                "TEXTCOLOR",
                (0, 0),
                (-1, 0),
                colors.white,
            ),
            (
                "FONTNAME",
                (0, 0),
                (-1, 0),
                "Helvetica-Bold",
            ),
            (
                "FONTSIZE",
                (0, 0),
                (-1, -1),
                7,
            ),
            (
                "GRID",
                (0, 0),
                (-1, -1),
                0.4,
                colors.grey,
            ),
            (
                "VALIGN",
                (0, 0),
                (-1, -1),
                "TOP",
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
        ])
    )

    story.append(quotation_table)

    story.append(Spacer(1, 8 * mm))

    story.append(
        Paragraph(
            "This report is automatically generated from the "
            "quotation records created in the Tempo Instruments "
            "quotation system.",
            small_style,
        )
    )

    document.build(story)

    return output_path


def generate_today_quotation_analytics_pdf() -> Path:
    analytics = EDBR.get_today_quotation_summary()

    generate_today_quotation_pdf(analytics)
    ANALYTICS_OUTPUT_DIR.mkdir(parents=True, exist_ok=True,)

    today = date.today()
    
    output_path = ANALYTICS_OUTPUT_DIR / f"Quotation_Analytics_{today.isoformat()}.pdf"

    return output_path