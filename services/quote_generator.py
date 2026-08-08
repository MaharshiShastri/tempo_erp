from database.repository import EDBR

from pathlib import Path
from copy import deepcopy
from datetime import date
import re

from docx import Document
from docx.document import Document as _Document
from docx.table import Table
from docx.text.paragraph import Paragraph
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.enum.text import WD_COLOR_INDEX
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_CELL_VERTICAL_ALIGNMENT


BASE_DIR = Path(__file__).resolve().parent.parent

TEMPLATE_PATH = BASE_DIR / "services" / "template_document.docx"
PRICE_LIST_PATH = BASE_DIR / "services" / "Ex Works Price List 2026-27.docx"
OUTPUT_DIR = BASE_DIR / "generated_quotes"


# ============================================================
# General helpers
# ============================================================

def safe_filename(value: str) -> str:
    value = str(value or "").strip()

    value = re.sub(r'[<>:"/\\|?*]', "_", value)
    value = value.rstrip(" .")

    return value


def normalize_heading(text: str) -> str:
    text = str(text or "").upper().strip()
    text = re.sub(r"\s*[:\-]+\s*$", "", text)
    text = re.sub(r"\s*-\s*", "-", text)

    return " ".join(text.split())


def normalize_text(value: str) -> str:
    return " ".join(str(value or "").strip().upper().split())


# ============================================================
# Document traversal
# ============================================================

def iter_block_items(parent):
    """
    Iterate through paragraphs and tables in document order.
    """

    if isinstance(parent, _Document):
        parent_elm = parent.element.body
    else:
        parent_elm = parent._tc

    for child in parent_elm.iterchildren():

        if child.tag.endswith("}p"):
            yield Paragraph(child, parent)

        elif child.tag.endswith("}tbl"):
            yield Table(child, parent)


# ============================================================
# Product group extraction
# ============================================================

def extract_product_group(source_doc, product_name, available_products, ):
    """
    Extract the blocks belonging to a product group from
    the price-list document.
    """

    target = normalize_heading(product_name)

    normalized_products = {normalize_heading(name) for name in available_products if name}

    blocks = list(iter_block_items(source_doc))

    start = None
    end = len(blocks)

    for index, block in enumerate(blocks):

        if not isinstance(block, Paragraph):
            continue

        text = normalize_heading(block.text)

        # Product heading found
        if text == target:
            start = index
            continue

        # Next product heading found
        if start is not None and index > start:

            if text in normalized_products:
                end = index
                break

    if start is None:
        raise ValueError(f"Product group '{product_name}' not found.")

    return blocks[start + 1:end]


# ============================================================
# Text replacement
# ============================================================

def replace_text_in_paragraph(paragraph, replacements):

    for placeholder, replacement in replacements.items():

        replacement = str(replacement or "")

        full_text = paragraph.text

        if placeholder not in full_text:
            continue

        # Placeholder completely inside one run
        for run in paragraph.runs:

            if placeholder in run.text:
                run.text = run.text.replace(placeholder, replacement)
                break

        else:
            # Placeholder is split across multiple runs
            combined = "".join(run.text for run in paragraph.runs)

            if placeholder not in combined:
                continue

            new_text = combined.replace(placeholder, replacement)

            if paragraph.runs:
                paragraph.runs[0].text = new_text

                for run in paragraph.runs[1:]:
                    run.text = ""


def replace_text_in_table(table, replacements):

    for row in table.rows:

        for cell in row.cells:

            for paragraph in cell.paragraphs:
                replace_text_in_paragraph(paragraph, replacements)

            for nested_table in cell.tables:
                replace_text_in_table(nested_table, replacements)


def replace_text_in_xml(element, replacements):
    """
    Replace placeholders in raw XML.

    This catches textboxes/shapes where python-docx's normal
    paragraph traversal does not reach.
    """

    for node in element.iter():

        if node.tag != qn("w:t"):
            continue

        if not node.text:
            continue

        for placeholder, replacement in replacements.items():

            if placeholder in node.text:
                node.text = node.text.replace(placeholder, str(replacement or ""))


def replace_text_in_document(doc, replacements):

    # Normal paragraphs
    for paragraph in doc.paragraphs:
        replace_text_in_paragraph(paragraph, replacements)

    # Normal tables
    for table in doc.tables:
        replace_text_in_table(table, replacements)

    # Headers / Footers
    for section in doc.sections:

        for paragraph in section.header.paragraphs:
            replace_text_in_paragraph(paragraph, replacements)

        for table in section.header.tables:
            replace_text_in_table(table, replacements)

        for paragraph in section.footer.paragraphs:
            replace_text_in_paragraph(paragraph, replacements)

        for table in section.footer.tables:
            replace_text_in_table(table, replacements)

    # Body XML
    replace_text_in_xml(doc.element.body, replacements)

    # Header/footer XML
    for section in doc.sections:

        replace_text_in_xml(section.header._element, replacements)

        replace_text_in_xml(section.footer._element, replacements)


# ============================================================
# Product group insertion
# ============================================================

def replace_product_group_placeholder(target_doc, source_blocks, product_name, placeholder="{product_group}",):
    """
    Replace {product_group} with the selected product group's
    price-list blocks.

    Special-model rendering is deliberately NOT handled here.
    """

    body = target_doc.element.body

    for child in list(body):

        if not child.tag.endswith("}p"):
            continue

        paragraph = Paragraph(child, target_doc)

        if placeholder not in paragraph.text:
            continue

        insert_index = list(body).index(child)

        body.remove(child)

        # Product name
        new_paragraph = OxmlElement("w:p")

        run_element = OxmlElement("w:r")
        text_element = OxmlElement("w:t")

        text_element.text = product_name

        run_element.append(text_element)
        new_paragraph.append(run_element)

        body.insert(
            insert_index,
            new_paragraph
        )

        insert_index += 1

        # Product price-list blocks
        for block in source_blocks:

            if isinstance(block, Paragraph):
                new_element = deepcopy(block._p)

            elif isinstance(block, Table):
                new_element = deepcopy(block._tbl)

            else:
                continue

            body.insert(
                insert_index,
                new_element
            )

            insert_index += 1

        return

    raise ValueError(
        f"Placeholder '{placeholder}' not found."
    )


# ============================================================
# Special-model table
# ============================================================
def get_special_row_values(row_data):
    if isinstance(row_data, dict):
        return row_data.get("values", [])

    values = getattr(row_data, "values", None)

    if values is not None:
        return values

    return []

def create_special_model_table(target_doc, columns, rows,):
    """
    Create a special-model configuration table dynamically.

    Example:

        columns = [
            "Parameter",
            "Value",
            "Remarks"
        ]

        rows = [
            {
                "values": [
                    "Temperature",
                    "250°C",
                    "Long term"
                ]
            },
            {
                "values": [
                    "Humidity",
                    "60% RH",
                    "Long term"
                ]
            }
        ]

    Returns the generated table or None if no data exists.
    """

    columns = [str(column or "").strip() for column in (columns or [])]

    rows = rows or []

    # Remove completely empty column names
    columns = [column if column else f"Column {index + 1}" for index, column in enumerate(columns)]

    # No configuration = nothing to render
    if not columns or not rows:
        return None

    # -----------------------------------------
    # Find placeholder
    # -----------------------------------------

    placeholder_paragraph = None

    for paragraph in target_doc.paragraphs:

        if "{special_model_table}" in paragraph.text:
            placeholder_paragraph = paragraph
            break

    if placeholder_paragraph is None:

        # Also search tables in case the placeholder
        # was placed inside a table cell.
        for table in target_doc.tables:

            for row in table.rows:

                for cell in row.cells:

                    for paragraph in cell.paragraphs:

                        if "{special_model_table}" in paragraph.text:
                            placeholder_paragraph = paragraph
                            break

                    if placeholder_paragraph:
                        break

                if placeholder_paragraph:
                    break

            if placeholder_paragraph:
                break

    if placeholder_paragraph is None:
        raise ValueError("Placeholder '{special_model_table}' not found.")

    # -----------------------------------------
    # Create table
    # -----------------------------------------

    table = target_doc.add_table(rows=1, cols=len(columns),)

    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.style = "Table Grid"

    # -----------------------------------------
    # Header
    # -----------------------------------------

    header_cells = table.rows[0].cells

    for index, column in enumerate(columns):

        cell = header_cells[index]

        cell.text = column
        cell.vertical_alignment = (WD_CELL_VERTICAL_ALIGNMENT.CENTER)

        for paragraph in cell.paragraphs:

            for run in paragraph.runs:
                run.bold = True

    # -----------------------------------------
    # Rows
    # -----------------------------------------

    for row_data in rows:

        values = get_special_row_values(row_data)
        # Always make row length match column length
        values = [str(value or "") for value in values]

        if len(values) < len(columns):
            values.extend([""] * (len(columns) - len(values)))

        elif len(values) > len(columns):
            values = values[:len(columns)]

        cells = table.add_row().cells

        for index, value in enumerate(values):

            cells[index].text = value

            cells[index].vertical_alignment = (
                WD_CELL_VERTICAL_ALIGNMENT.CENTER
            )

    # -----------------------------------------
    # Move table into placeholder position
    # -----------------------------------------

    placeholder_p = placeholder_paragraph._p
    table_element = table._tbl

    placeholder_p.addnext(table_element)

    # Remove placeholder paragraph
    parent = placeholder_p.getparent()

    if parent is not None:
        parent.remove(placeholder_p)

    return table


def replace_special_model_placeholder(
    target_doc,
    special_model,
    special_columns=None,
    special_rows=None,
):
    """
    If special_model=True, replace {special_model_table}
    with a dynamically generated table.

    Otherwise simply remove the placeholder.
    """

    if special_model:

        create_special_model_table(
            target_doc=target_doc,
            columns=special_columns or [],
            rows=special_rows or [],
        )

    else:

        # Normal quotation:
        # just remove the placeholder.
        replace_text_in_document(
            target_doc,
            {
                "{special_model_table}": ""
            }
        )


# ============================================================
# Dealer row
# ============================================================

def add_dealer_row(target_doc, dealer):

    if not dealer:
        return

    table = target_doc.tables[0]

    source_row = table.rows[2]

    new_row = deepcopy(source_row._tr)

    table._tbl.insert(
        1,
        new_row
    )

    row = table.rows[1]

    row.cells[0].text = "DEALER"
    row.cells[1].text = "Dealer quotation applicable."

    for index in range(2, len(row.cells)):
        row.cells[index].text = ""


# ============================================================
# Main generator
# ============================================================

def generate_qoute_document(
    request,
    authenticated_user,
):
    """
    Generate quotation Word document.

    Special-model logic:
        frontend -> special_columns
        frontend -> special_rows
        backend -> Word table

    No Groq/API call is involved.
    """

    # -----------------------------------------
    # Authorization
    # -----------------------------------------

    if authenticated_user.get("role") not in [
        "Sales Representative",
        "Admin",
        "Chief Full Stack Developer",
    ]:
        raise PermissionError(
            "Only sales team can generate qoutations."
        )

    # -----------------------------------------
    # Sales user
    # -----------------------------------------

    sales_user = EDBR.get_user_business_contact(
        email=authenticated_user["email"],
        role=authenticated_user["role"],
    )

    # -----------------------------------------
    # Documents
    # -----------------------------------------

    source_doc = Document(
        PRICE_LIST_PATH
    )

    target_doc = Document(
        TEMPLATE_PATH
    )

    # -----------------------------------------
    # Product group
    # -----------------------------------------

    available_products = EDBR.get_item_names()

    product_blocks = extract_product_group(
        source_doc=source_doc,
        product_name=request.product_name,
        available_products=available_products,
    )

    replace_product_group_placeholder(
        target_doc=target_doc,
        source_blocks=product_blocks,
        product_name=request.product_name,
    )

    # -----------------------------------------
    # Dealer
    # -----------------------------------------

    if request.dealer:
        add_dealer_row(
            target_doc,
            request.dealer
        )

    # -----------------------------------------
    # Special model table
    # -----------------------------------------

    replace_special_model_placeholder(
        target_doc=target_doc,
        special_model=request.special_model,
        special_columns=request.special_columns,
        special_rows=request.special_rows,
    )

    # -----------------------------------------
    # Normal placeholders
    # -----------------------------------------

    replacements = {

        "{client_company}":
            request.client_company,

        "{client_address_line_1}":
            request.client_address_line1,

        "{client_city-client_postal_code}":
            f"{request.client_city} - "
            f"{request.client_postal_code}",

        "{client_email}":
            request.client_email,

        "{buyer_name}":
            request.buyer_name,

        "{buyer_phone_number}":
            request.buyer_phone_number,

        "{date_input}":
            request.date_input.strftime("%d/%m/%Y"),

        "{current_date}":
            request.date_input.strftime("%d/%m/%Y"),

        "{quote_num}":
            str(request.qoute_number),

        "{sales_user_name}":
            sales_user["name"],

        "{business_phone}":
            sales_user["business_phone"] or "",

        "{sales_user_email}":
            sales_user["email"],

        "{supply}":
            request.supply,

        "{installation}":
            request.installation,

        "{freight}":
            request.freight,
    }

    replace_text_in_document(
        target_doc,
        replacements,
    )

    # -----------------------------------------
    # Output
    # -----------------------------------------

    OUTPUT_DIR.mkdir(
        parents=True,
        exist_ok=True,
    )

    safe_qoute_number = safe_filename(
        request.qoute_number
    )

    safe_company = safe_filename(
        request.client_company
    )

    filename = (
        f"Tempo_Qoute_"
        f"{safe_qoute_number}_"
        f"{safe_company}.docx"
    )

    output_path = OUTPUT_DIR / filename

    target_doc.save(
        output_path
    )

    return output_path, sales_user