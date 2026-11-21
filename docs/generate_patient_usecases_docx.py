# -*- coding: utf-8 -*-
"""
Tự động tạo tài liệu Word: DAC_TA_USE_CASE_BENH_NHAN_MOBILE.docx
Đặc tả chi tiết 21 Use Case của Bệnh nhân trên ứng dụng di động NovaCare Mobile (Android Kotlin).
Tuân thủ cấu trúc bảng biểu và quy chuẩn văn bản học thuật của IUH.
"""

import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import parse_xml, OxmlElement
from docx.oxml.ns import nsdecls, qn

from data_patient_usecases import PATIENT_USE_CASES

def set_cell_shading(cell, color_hex):
    tcPr = cell._tc.get_or_add_tcPr()
    for existing in tcPr.xpath('./w:shd'):
        tcPr.remove(existing)
    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{color_hex}"/>')
    tcPr.append(shd)

def set_cell_margins(cell, top=120, bottom=120, left=160, right=160):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = parse_xml(
        f'<w:tcMar {nsdecls("w")}>'
        f'<w:top w:w="{top}" w:type="dxa"/>'
        f'<w:bottom w:w="{bottom}" w:type="dxa"/>'
        f'<w:left w:w="{left}" w:type="dxa"/>'
        f'<w:right w:w="{right}" w:type="dxa"/>'
        f'</w:tcMar>'
    )
    tcPr.append(tcMar)

def add_paragraph_to_cell(cell, text, bold_prefix="", font_size=11, bold=False, italic=False, align=WD_ALIGN_PARAGRAPH.LEFT):
    p = cell.paragraphs[0] if len(cell.paragraphs) > 0 and cell.paragraphs[0].text == "" else cell.add_paragraph()
    p.alignment = align
    p.paragraph_format.space_before = Pt(3)
    p.paragraph_format.space_after = Pt(3)
    p.paragraph_format.line_spacing = 1.15
    
    if bold_prefix:
        r_pre = p.add_run(bold_prefix)
        r_pre.font.name = 'Times New Roman'
        r_pre.font.size = Pt(font_size)
        r_pre.font.bold = True
        r_pre.font.color.rgb = RGBColor(0, 0, 0)
        
    r = p.add_run(text)
    r.font.name = 'Times New Roman'
    r.font.size = Pt(font_size)
    r.font.bold = bold
    r.font.italic = italic
    r.font.color.rgb = RGBColor(0, 0, 0)
    return p

def create_use_case_table(doc, uc_data, table_index):
    # Caption / Title before table
    p_cap = doc.add_paragraph()
    p_cap.paragraph_format.space_before = Pt(10)
    p_cap.paragraph_format.space_after = Pt(4)
    p_cap.paragraph_format.keep_with_next = True
    r_cap = p_cap.add_run(f"Bảng 3.{table_index}. Đặc tả use case {uc_data['name']}")
    r_cap.font.name = 'Times New Roman'
    r_cap.font.size = Pt(11)
    r_cap.font.bold = True
    r_cap.font.italic = True
    
    table = doc.add_table(rows=0, cols=2)
    table.style = 'Table Grid'
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    
    col_width_0 = Inches(2.7)
    col_width_1 = Inches(3.24)
    total_width = Inches(5.94)
    
    # Metadata rows (Merged across 2 cols)
    meta_rows = [
        ("Tên use case: ", uc_data['name'], True),
        ("Mô tả sơ lược: ", uc_data['description'], False),
        ("Actor chính: ", uc_data['primary_actor'], False),
        ("Actor phụ: ", uc_data['secondary_actor'], False),
        ("Tiền điều kiện (Pre-condition): ", uc_data['pre_condition'], False),
        ("Hậu điều kiện (Post-condition): ", uc_data['post_condition'], False),
    ]
    
    for prefix, val, is_title in meta_rows:
        row = table.add_row()
        c0, c1 = row.cells[0], row.cells[1]
        c0.merge(c1)
        c0.width = total_width
        set_cell_margins(c0)
        if is_title:
            add_paragraph_to_cell(c0, val, bold_prefix=prefix, font_size=11, bold=True)
            set_cell_shading(c0, "F2F2F2")
        else:
            add_paragraph_to_cell(c0, val, bold_prefix=prefix, font_size=11, bold=False)
            
    # Main Flow Header Row (Merged)
    mf_hdr_row = table.add_row()
    c0, c1 = mf_hdr_row.cells[0], mf_hdr_row.cells[1]
    c0.merge(c1)
    c0.width = total_width
    set_cell_margins(c0)
    set_cell_shading(c0, "D9D9D9")
    add_paragraph_to_cell(c0, "Luồng sự kiện chính (main flow):", font_size=11, bold=True)
    
    # Columns Header Row (Actor | System)
    col_hdr_row = table.add_row()
    c0, c1 = col_hdr_row.cells[0], col_hdr_row.cells[1]
    c0.width = col_width_0
    c1.width = col_width_1
    set_cell_margins(c0)
    set_cell_margins(c1)
    set_cell_shading(c0, "EAEAEA")
    set_cell_shading(c1, "EAEAEA")
    add_paragraph_to_cell(c0, "Actor", font_size=11, bold=True, align=WD_ALIGN_PARAGRAPH.CENTER)
    add_paragraph_to_cell(c1, "System", font_size=11, bold=True, align=WD_ALIGN_PARAGRAPH.CENTER)
    
    # Main Flow Steps
    for actor_step, system_step in uc_data['main_flow']:
        step_row = table.add_row()
        c0, c1 = step_row.cells[0], step_row.cells[1]
        c0.width = col_width_0
        c1.width = col_width_1
        set_cell_margins(c0)
        set_cell_margins(c1)
        add_paragraph_to_cell(c0, actor_step, font_size=10.5)
        add_paragraph_to_cell(c1, system_step, font_size=10.5)
        
    # Alternate Flow Header Row (Merged)
    af_hdr_row = table.add_row()
    c0, c1 = af_hdr_row.cells[0], af_hdr_row.cells[1]
    c0.merge(c1)
    c0.width = total_width
    set_cell_margins(c0)
    set_cell_shading(c0, "D9D9D9")
    add_paragraph_to_cell(c0, "Luồng sự kiện thay thế (alternate flow):", font_size=11, bold=True)
    
    # Alternate Flow Steps
    for cond_step, sys_step in uc_data['alternate_flow']:
        step_row = table.add_row()
        c0, c1 = step_row.cells[0], step_row.cells[1]
        c0.width = col_width_0
        c1.width = col_width_1
        set_cell_margins(c0)
        set_cell_margins(c1)
        add_paragraph_to_cell(c0, cond_step, font_size=10.5)
        add_paragraph_to_cell(c1, sys_step, font_size=10.5)
        
    p_space = doc.add_paragraph()
    p_space.paragraph_format.space_before = Pt(6)
    p_space.paragraph_format.space_after = Pt(6)

def generate_patient_document(output_path="docs/DAC_TA_USE_CASE_BENH_NHAN_MOBILE.docx"):
    doc = docx.Document()
    
    # Page setup: A4, 1-inch margins
    for section in doc.sections:
        section.top_margin = Inches(1)
        section.bottom_margin = Inches(1)
        section.left_margin = Inches(1)
        section.right_margin = Inches(1)
        section.page_width = Inches(8.27)  # A4 width
        section.page_height = Inches(11.69) # A4 height

    # 1. Header Information
    p_header = doc.add_paragraph()
    p_header.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_header.paragraph_format.space_after = Pt(2)
    r1 = p_header.add_run("BỘ CÔNG THƯƠNG\n")
    r1.font.name = 'Times New Roman'
    r1.font.size = Pt(12)
    r1.font.bold = True
    
    r2 = p_header.add_run("TRƯỜNG ĐẠI HỌC CÔNG NGHIỆP TP. HỒ CHÍ MINH\n")
    r2.font.name = 'Times New Roman'
    r2.font.size = Pt(13)
    r2.font.bold = True
    
    r3 = p_header.add_run("KHOA CÔNG NGHỆ THÔNG TIN - BỘ MÔN HỆ THỐNG THÔNG TIN\n")
    r3.font.name = 'Times New Roman'
    r3.font.size = Pt(12)
    r3.font.bold = True
    
    p_div = doc.add_paragraph()
    p_div.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_div.paragraph_format.space_after = Pt(12)
    r_div = p_div.add_run("------------------------------------------------------------------------------------")
    r_div.font.name = 'Times New Roman'
    r_div.font.size = Pt(10)
    r_div.font.color.rgb = RGBColor(128, 128, 128)

    # 2. Document Title
    p_title = doc.add_paragraph()
    p_title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_title.paragraph_format.space_after = Pt(6)
    r_title = p_title.add_run("TÀI LIỆU ĐẶC TẢ CHI TIẾT CÁC CA SỬ DỤNG\nPHÂN HỆ NGƯỜI BỆNH (PATIENT - MOBILE APP)\n")
    r_title.font.name = 'Times New Roman'
    r_title.font.size = Pt(16)
    r_title.font.bold = True
    r_title.font.color.rgb = RGBColor(0, 51, 102)

    p_sub = doc.add_paragraph()
    p_sub.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_sub.paragraph_format.space_after = Pt(14)
    r_sub = p_sub.add_run("ĐỀ TÀI: NỀN TẢNG Y TẾ SỐ ĐA NỀN TẢNG NOVACARE\n(Khảo sát và đối chiếu toàn diện mã nguồn ứng dụng di động Android Kotlin - Jetpack Compose)")
    r_sub.font.name = 'Times New Roman'
    r_sub.font.size = Pt(12)
    r_sub.font.italic = True

    # 3. Introductory Note
    p_intro = doc.add_paragraph()
    p_intro.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    p_intro.paragraph_format.space_after = Pt(12)
    p_intro.paragraph_format.line_spacing = 1.2
    r_intro = p_intro.add_run(
        "Tài liệu này bao gồm bảng đặc tả chi tiết cho toàn bộ 21 Ca sử dụng (Use Case) độc lập của phân hệ Người bệnh (PATIENT) "
        "khi thao tác trên ứng dụng di động NovaCare Mobile (nền tảng Android phát triển bằng Kotlin và Jetpack Compose). "
        "Toàn bộ các bước trong Luồng sự kiện chính (Main Flow) và Luồng sự kiện thay thế (Alternate Flow) được đối soát chuẩn xác "
        "từng hàm, màn hình, điều kiện biên và luồng tương tác thực tế trong mã nguồn dự án. Mỗi Use Case được trình bày trong một bảng "
        "độc lập gồm 2 cột chuẩn hóa, phân định rành mạch giữa hành động của Người bệnh (Actor) và nghiệp vụ xử lý của Hệ thống (System)."
    )
    r_intro.font.name = 'Times New Roman'
    r_intro.font.size = Pt(11)

    # 4. Grouping Sections & Rendering Tables
    groups = [
        ("PHẦN 1: XÁC THỰC VÀ BẢO MẬT TÀI KHOẢN (AUTHENTICATION & ACCOUNT)", [0]),
        ("PHẦN 2: TRỢ LÝ Y TẾ AI VÀ ĐẶT LỊCH KHÁM BỆNH (AI TRIAGE & BOOKING JOURNEY)", [1, 2, 3, 4]),
        ("PHẦN 3: TƯ VẤN KHÁM BỆNH TỪ XA TELEMEDICINE (LIVEKIT WEBRTC VIDEO CONSULTATION)", [5]),
        ("PHẦN 4: QUẢN LÝ HỒ SƠ SỨC KHỎE VÀ HỘ CHIẾU Y TẾ (HEALTH PROFILES & MEDICAL PASSPORT)", [6, 7, 8, 9, 10, 11]),
        ("PHẦN 5: QUẢN LÝ LỊCH HẸN VÀ TIẾP ĐÓN TẠI VIỆN (APPOINTMENT & QR CHECK-IN)", [12, 13]),
        ("PHẦN 6: TRA CỨU ĐA TIÊU CHÍ VÀ THÔNG TIN Y TẾ (UNIVERSAL SEARCH & DIRECTORY)", [14, 15, 16]),
        ("PHẦN 7: TRUNG TÂM THÔNG BÁO VÀ THIẾT LẬP CÁ NHÂN (NOTIFICATION & SETTINGS)", [17, 18, 19, 20])
    ]

    table_counter = 1
    for group_title, uc_indices in groups:
        p_grp = doc.add_paragraph()
        p_grp.paragraph_format.space_before = Pt(14)
        p_grp.paragraph_format.space_after = Pt(6)
        p_grp.paragraph_format.keep_with_next = True
        r_grp = p_grp.add_run(group_title)
        r_grp.font.name = 'Times New Roman'
        r_grp.font.size = Pt(13)
        r_grp.font.bold = True
        r_grp.font.color.rgb = RGBColor(0, 51, 102)

        for idx in uc_indices:
            uc_data = PATIENT_USE_CASES[idx]
            create_use_case_table(doc, uc_data, table_counter)
            table_counter += 1

    doc.save(output_path)
    print(f"XUẤT TÀI LIỆU THÀNH CÔNG: {output_path}")

if __name__ == "__main__":
    generate_patient_document()
