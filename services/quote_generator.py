from database.repository import EDBR
from pathlib import Path
from docx import Document
from docx.document import Document as _Document
from docx.oxml import OxmlElement
from docx.table import Table
from docx.text.paragraph import Paragraph
from datetime import date
from copy import deepcopy
import re
from docx.oxml.ns import qn
from docx.enum.text import WD_COLOR_INDEX

BASE_DIR = Path(__file__).resolve().parent.parent

TEMPLATE_PATH = BASE_DIR / "services" / "template_document.docx"
PRICE_LIST_PATH = BASE_DIR / "services" / "Ex Works Price List 2026-27.docx"
OUTPUT_DIR = BASE_DIR / "generated_quotes"

def safe_filename(value: str) -> str:
    value = str(value or "").strip()

    value = re.sub(r'[<>:"/\\|?*]', '_', value)
    value = value.rstrip(" .")
    return value

def normalize_heading(text: str) -> str:
    text = text.upper().strip()
    text = re.sub(r"\s*[:\-]+\s*$", "", text)
    text = re.sub(r"\s*-\s*", "-", text)
    return " ".join(text.upper().split())

def add_highlighted_paragraph(target_doc, text):
    paragraph = target_doc.add_paragraph()

    run = paragraph.add_run(text)
    run.font.highlight_color = WD_COLOR_INDEX.YELLOW

    return paragraph

def iter_block_items(parent):
    if isinstance(parent, _Document):
        parent_elm = parent.element.body

    else:
        parent_elm = parent._tc

    for child in parent_elm.iterchildren():
        if child.tag.endswith("}p"):
            yield Paragraph(child, parent)

        elif child.tag.endswith("}tbl"):
            yield Table(child, parent)

def replace_text_in_xml(element, replacements):
    """
    Replace placeholders anywhere inside an XML element,
    including Word textboxes/shapes.
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

    # -----------------------------------------
    # Normal document paragraphs
    # -----------------------------------------
    for paragraph in doc.paragraphs:
        replace_text_in_paragraph(
            paragraph,
            replacements
        )

    # -----------------------------------------
    # Normal document tables
    # -----------------------------------------
    for table in doc.tables:
        replace_text_in_table(
            table,
            replacements
        )

    # -----------------------------------------
    # Headers / Footers
    # -----------------------------------------
    for section in doc.sections:

        for paragraph in section.header.paragraphs:
            replace_text_in_paragraph(
                paragraph,
                replacements
            )

        for table in section.header.tables:
            replace_text_in_table(
                table,
                replacements
            )

        for paragraph in section.footer.paragraphs:
            replace_text_in_paragraph(
                paragraph,
                replacements
            )

        for table in section.footer.tables:
            replace_text_in_table(
                table,
                replacements
            )

    # -----------------------------------------
    # Textboxes / Shapes / Drawing XML
    # -----------------------------------------
    replace_text_in_xml(
        doc.element.body,
        replacements
    )

    # Headers and footers may also contain
    # textboxes/shapes
    for section in doc.sections:

        replace_text_in_xml(
            section.header._element,
            replacements
        )

        replace_text_in_xml(
            section.footer._element,
            replacements
        )

def replace_text_in_table(table, replacements):

    for row in table.rows:

        for cell in row.cells:

            for paragraph in cell.paragraphs:
                replace_text_in_paragraph(
                    paragraph,
                    replacements
                )

            for nested_table in cell.tables:
                replace_text_in_table(
                    nested_table,
                    replacements
                )
def extract_product_group(source_doc, product_name, available_products):
    target = normalize_heading(product_name)

    normalized_products = {normalize_heading(name) for name in available_products if name}
    blocks = list(iter_block_items(source_doc))

    start = None
    end = len(blocks)

    for i, block in enumerate(blocks):
        if not isinstance(block, Paragraph):
            continue

        text = normalize_heading(block.text)

        if text == target:
            start = i
            continue

        if start is not None and i > start:
            if text in normalized_products:
                end = i
                break

    if start is None:
        raise ValueError(f"Product group '{product_name}' not found.")

    return blocks[start+1: end]

def replace_text_in_paragraph(paragraph, replacements):

    for placeholder, replacement in replacements.items():

        replacement = str(replacement or "")

        full_text = paragraph.text

        if placeholder not in full_text:
            continue

        # Simple case: placeholder exists entirely in one run
        for run in paragraph.runs:
            if placeholder in run.text:
                run.text = run.text.replace(placeholder, replacement)
                break
        else:
            combined = "".join(run.text for run in paragraph.runs)

            if placeholder not in combined:
                continue

            new_text = combined.replace(placeholder, replacement)

            if paragraph.runs:
                paragraph.runs[0].text = new_text

                for run in paragraph.runs[1:]:
                    run.text = ""


def replace_product_group_placeholder(target_doc, source_blocks, products_name, special_model=False, special_itinerary=None, placeholder="{product_group}"):
    body = target_doc.element.body

    for child in list(body):
        if not child.tag.endswith("}p"):
            continue

        paragraph = Paragraph(child, target_doc)

        if placeholder not in paragraph.text:
            continue

        insert_index = list(body).index(child)

        body.remove(child)

        #Product name
        new_paragraph = OxmlElement("w:p")
        run_element = OxmlElement("w:r")
        text_element = OxmlElement("w:t")

        text_element.text = products_name
        run_element.append(text_element)
        new_paragraph.append(run_element)

        body.insert(insert_index, new_paragraph)
        insert_index += 1

        #Price list data
        for block in source_blocks:
            if isinstance(block, Paragraph):
                new_element = deepcopy(block._p)

            elif isinstance(block, Table):
                new_element = deepcopy(block._tbl)

            else:
                continue

            body.insert(insert_index, new_element)
            insert_index += 1

        if special_model and special_itinerary:
            special_paragraph = OxmlElement("w:p")
            run_element = OxmlElement("w:r")

            highlight = OxmlElement("w:highlight")
            highlight.set(qn("w:val"), "yellow")

            run_element.append(highlight)

            text_element = OxmlElement("w:t")

            text_element.text = f"Special Model/Additional Itinerary: {special_itinerary}" 

            run_element.append(text_element)
            special_paragraph.append(run_element)

            body.insert(insert_index, special_paragraph)

        return
    
    raise ValueError(f"Placeholder '{placeholder}' not found.")

def add_dealer_row(target_doc, dealer):
    if not dealer:
        return

    table = target_doc.tables[0]

    # Insert after header row
    source_row = table.rows[2]
    new_row = deepcopy(source_row._tr)
    table._tbl.insert(1, new_row)

    row = table.rows[1]
    row.cells[0].text = "DEALER"
    row.cells[1].text = "Dealer quotation applicable."
    for i in range(2, len(row.cells)):
        row.cells[i].text = ""

def generate_qoute_document(request, authenticated_user):
    if authenticated_user.get("role") not in ["Sales Representative", "Admin", "Chief Full Stack Developer"]:
        raise PermissionError("Only sales team can generate qoutations.")

    sales_user = EDBR.get_user_business_contact(email=authenticated_user["email"], role=authenticated_user["role"])
    
    source_doc = Document(PRICE_LIST_PATH)
    target_doc = Document(TEMPLATE_PATH)
    
    available_products = EDBR.get_item_names()

    product_blocks = extract_product_group(source_doc, request.product_name, available_products)

    replace_product_group_placeholder(target_doc, product_blocks, request.product_name, special_model=request.special_model, special_itinerary=request.special_itinerary,)


    add_dealer_row(target_doc, request.dealer) if request.dealer else None
    
    replacements = {
        "{client_company}": request.client_company,

        "{client_address_line_1}": request.client_address_line1,

        "{client_city-client_postal_code}": f"{request.client_city} - " f"{request.client_postal_code}",

        "{client_email}": request.client_email,

        "{buyer_name}": request.buyer_name,

        "{buyer_phone_number}": request.buyer_phone_number,

        "{date_input}": request.date_input.strftime("%d/%m/%Y"),

        "{current_date}": request.date_input,

        "{quote_num}": str(request.qoute_number),

        "{sales_user_name}": sales_user["name"],

        "{business_phone}": sales_user["business_phone"] or "",

        "{sales_user_email}": sales_user["email"],

        "{supply}": request.supply,

        "{installation}": request.installation,

        "{freight}": request.freight
    }

    replace_text_in_document(target_doc, replacements)

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    safe_qoute_number = safe_filename(request.qoute_number)
    safe_company = safe_filename(request.client_company)

    filename = f"Tempo_Qoute_{safe_qoute_number}_{safe_company}.docx"

    output_path = OUTPUT_DIR / filename

    target_doc.save(output_path)

    return output_path, sales_user