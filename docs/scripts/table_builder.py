import os
import sys
from pathlib import Path
from docx import Document
from docx.shared import Cm, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_CELL_VERTICAL_ALIGNMENT
from docx.oxml import OxmlElement
from docx.oxml.ns import qn

def set_cell_background(cell, fill_hex):
    tcPr = cell._tc.get_or_add_tcPr()
    shd = OxmlElement('w:shd')
    shd.set(qn('w:val'), 'clear')
    shd.set(qn('w:color'), 'auto')
    shd.set(qn('w:fill'), fill_hex)
    tcPr.append(shd)

def set_cell_margins(cell, top=100, bottom=100, left=140, right=140):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = OxmlElement('w:tcMar')
    for m, val in [('top', top), ('bottom', bottom), ('left', left), ('right', right)]:
        node = OxmlElement(f'w:{m}')
        node.set(qn('w:w'), str(val))
        node.set(qn('w:type'), 'dxa')
        tcMar.append(node)
    tcPr.append(tcMar)

def set_table_full_borders(table, color="000000", sz="4"):
    tblPr = table._tbl.tblPr
    tblBorders = OxmlElement('w:tblBorders')
    for border_name in ['top', 'left', 'bottom', 'right', 'insideH', 'insideV']:
        border = OxmlElement(f'w:{border_name}')
        border.set(qn('w:val'), 'single')
        border.set(qn('w:sz'), sz)
        border.set(qn('w:space'), '0')
        border.set(qn('w:color'), color)
        tblBorders.append(border)
    tblPr.append(tblBorders)

def add_cant_split(row):
    trPr = row._tr.get_or_add_trPr()
    trPr.append(OxmlElement('w:cantSplit'))

def set_row_height(row, height_twips):
    trPr = row._tr.get_or_add_trPr()
    trHeight = OxmlElement('w:trHeight')
    trHeight.set(qn('w:val'), str(height_twips))
    trHeight.set(qn('w:hRule'), 'atLeast')
    trPr.append(trHeight)

def add_usecase_table(doc, uc_data):
    # Create table with 2 columns
    tbl = doc.add_table(rows=0, cols=2)
    tbl.style = 'Table Grid'
    tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    tbl.autofit = False

    tblPr = tbl._tbl.tblPr
    tblLayout = OxmlElement('w:tblLayout')
    tblLayout.set(qn('w:type'), 'fixed')
    tblPr.append(tblLayout)

    col_widths = [Cm(7.5), Cm(9.0)] # Total 16.5 cm (Fits A4 printable area)

    def add_meta_row(label, content):
        row = tbl.add_row()
        add_cant_split(row)
        cell = row.cells[0].merge(row.cells[1])
        cell.width = Cm(16.5)
        set_cell_margins(cell, top=80, bottom=80, left=120, right=120)
        p = cell.paragraphs[0]
        p.paragraph_format.space_after = Pt(2)
        p.paragraph_format.line_spacing = 1.15
        
        r_lbl = p.add_run(label + " ")
        r_lbl.bold = True
        r_lbl.font.name = 'Times New Roman'
        r_lbl.font.size = Pt(13)
        r_lbl.font.color.rgb = RGBColor(0x00, 0x00, 0x00)

        r_cnt = p.add_run(content)
        r_cnt.font.name = 'Times New Roman'
        r_cnt.font.size = Pt(13)
        r_cnt.font.color.rgb = RGBColor(0x11, 0x11, 0x11)
        return cell

    # Row 1: Tên use case
    add_meta_row("Tên use case:", uc_data["name"])

    # Row 2: Mô tả sơ lược
    add_meta_row("Mô tả sơ lược:", uc_data["description"])

    # Row 3: Actor chính
    add_meta_row("Actor chính:", uc_data["primary_actor"])

    # Row 4: Actor phụ
    add_meta_row("Actor phụ:", uc_data.get("secondary_actor", "Không có"))

    # Row 5: Tiền điều kiện (Pre-condition)
    add_meta_row("Tiền điều kiện (Pre-condition):", uc_data["pre_condition"])

    # Row 6: Hậu điều kiện (Post-condition)
    add_meta_row("Hậu điều kiện (Post-condition):", uc_data["post_condition"])

    # Row 7: Header Luồng sự kiện chính (main flow) - Shaded grey
    row_mf_hdr = tbl.add_row()
    add_cant_split(row_mf_hdr)
    c_mf = row_mf_hdr.cells[0].merge(row_mf_hdr.cells[1])
    c_mf.width = Cm(16.5)
    set_cell_background(c_mf, "D9D9D9")
    set_cell_margins(c_mf, top=90, bottom=90, left=120, right=120)
    p_mf = c_mf.paragraphs[0]
    p_mf.paragraph_format.space_after = Pt(0)
    r_mf = p_mf.add_run("Luồng sự kiện chính (main flow):")
    r_mf.bold = True
    r_mf.font.name = 'Times New Roman'
    r_mf.font.size = Pt(13)

    # Row 8: Actor | System subheaders
    row_sub = tbl.add_row()
    add_cant_split(row_sub)
    for idx, (cell, title, w) in enumerate(zip(row_sub.cells, ["Actor", "System"], col_widths)):
        cell.width = w
        set_cell_margins(cell, top=70, bottom=70, left=100, right=100)
        p = cell.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.paragraph_format.space_after = Pt(0)
        r = p.add_run(title)
        r.bold = True
        r.font.name = 'Times New Roman'
        r.font.size = Pt(13)

    # Main flow steps
    for actor_step, sys_step in uc_data["main_flow"]:
        r_step = tbl.add_row()
        add_cant_split(r_step)
        for cell, text, w in zip(r_step.cells, [actor_step, sys_step], col_widths):
            cell.width = w
            set_cell_margins(cell, top=70, bottom=70, left=100, right=100)
            cell.vertical_alignment = WD_CELL_VERTICAL_ALIGNMENT.TOP
            p = cell.paragraphs[0]
            p.paragraph_format.space_after = Pt(2)
            p.paragraph_format.line_spacing = 1.15
            r = p.add_run(text if text else "")
            r.font.name = 'Times New Roman'
            r.font.size = Pt(13)

    # Row: Header Luồng sự kiện thay thế (alternate flow) - Shaded grey
    row_af_hdr = tbl.add_row()
    add_cant_split(row_af_hdr)
    c_af = row_af_hdr.cells[0].merge(row_af_hdr.cells[1])
    c_af.width = Cm(16.5)
    set_cell_background(c_af, "D9D9D9")
    set_cell_margins(c_af, top=90, bottom=90, left=120, right=120)
    p_af = c_af.paragraphs[0]
    p_af.paragraph_format.space_after = Pt(0)
    r_af = p_af.add_run("Luồng sự kiện thay thế (alternate flow):")
    r_af.bold = True
    r_af.font.name = 'Times New Roman'
    r_af.font.size = Pt(13)

    # Alternate flow steps
    alt_flows = uc_data.get("alt_flow", [])
    if not alt_flows:
        r_empty = tbl.add_row()
        add_cant_split(r_empty)
        c_e = r_empty.cells[0].merge(r_empty.cells[1])
        c_e.width = Cm(16.5)
        set_cell_margins(c_e, top=70, bottom=70, left=100, right=100)
        p_e = c_e.paragraphs[0]
        p_e.paragraph_format.space_after = Pt(2)
        r_e = p_e.add_run("Không có")
        r_e.italic = True
        r_e.font.name = 'Times New Roman'
        r_e.font.size = Pt(13)
    else:
        for actor_alt, sys_alt in alt_flows:
            r_alt = tbl.add_row()
            add_cant_split(r_alt)
            for cell, text, w in zip(r_alt.cells, [actor_alt, sys_alt], col_widths):
                cell.width = w
                set_cell_margins(cell, top=70, bottom=70, left=100, right=100)
                cell.vertical_alignment = WD_CELL_VERTICAL_ALIGNMENT.TOP
                p = cell.paragraphs[0]
                p.paragraph_format.space_after = Pt(2)
                p.paragraph_format.line_spacing = 1.15
                r = p.add_run(text if text else "")
                r.font.name = 'Times New Roman'
                r.font.size = Pt(13)

    # Apply full borders like in sample
    set_table_full_borders(tbl, color="000000", sz="4")

    # Add space between use case tables
    p_space = doc.add_paragraph()
    p_space.paragraph_format.space_before = Pt(6)
    p_space.paragraph_format.space_after = Pt(14)

