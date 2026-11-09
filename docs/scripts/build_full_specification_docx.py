# -*- coding: utf-8 -*-
import os
import sys
from pathlib import Path
from docx import Document
from docx.shared import Cm, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_CELL_VERTICAL_ALIGNMENT
from docx.oxml import OxmlElement
from docx.oxml.ns import qn

# Import table builder and data
from table_builder import add_usecase_table
from data_part1_auth_profile_search import USECASES_PART1
from data_part2_booking_payment_screening import USECASES_PART2
from data_part3_tele_review_clinical import USECASES_PART3
from data_part4_hospital_admin_interop_noti import USECASES_PART4

def generate_full_word_document():
    doc = Document()

    # ── Page Setup (A4, Margins: Top 2.0cm, Bottom 2.0cm, Left 2.5cm, Right 2.0cm)
    sec = doc.sections[0]
    sec.page_width = Cm(21.0)
    sec.page_height = Cm(29.7)
    sec.top_margin = Cm(2.0)
    sec.bottom_margin = Cm(2.0)
    sec.left_margin = Cm(2.5)
    sec.right_margin = Cm(2.0)

    # ── Set Normal Style to Times New Roman, Size 13pt
    normal_style = doc.styles['Normal']
    normal_style.font.name = 'Times New Roman'
    normal_style._element.rPr.rFonts.set(qn('w:eastAsia'), 'Times New Roman')
    normal_style.font.size = Pt(13)
    normal_style.font.color.rgb = RGBColor(0x00, 0x00, 0x00)
    normal_style.paragraph_format.line_spacing = 1.15
    normal_style.paragraph_format.space_after = Pt(2)

    # Header in Section
    header = sec.header
    p_hdr = header.paragraphs[0]
    p_hdr.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    r_hdr = p_hdr.add_run("Báo cáo Khóa luận tốt nghiệp - Đặc tả chi tiết Ca sử dụng (Use Case) Hệ thống NovaCare")
    r_hdr.font.name = 'Times New Roman'
    r_hdr.font.size = Pt(9.5)
    r_hdr.font.color.rgb = RGBColor(0x88, 0x88, 0x88)

    # Title Page / Title Banner
    p_inst = doc.add_paragraph()
    p_inst.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_inst = p_inst.add_run("BỘ CÔNG THƯƠNG\nTRƯỜNG ĐẠI HỌC CÔNG NGHIỆP TP. HỒ CHÍ MINH\nKHOA CÔNG NGHỆ THÔNG TIN - BỘ MÔN HỆ THỐNG THÔNG TIN\n")
    r_inst.bold = True
    r_inst.font.name = 'Times New Roman'
    r_inst.font.size = Pt(12)

    p_div = doc.add_paragraph()
    p_div.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_div = p_div.add_run("------------------------------------------------------------------------------------\n")
    r_div.font.size = Pt(10)

    p_title = doc.add_paragraph()
    p_title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_title.paragraph_format.space_before = Pt(12)
    p_title.paragraph_format.space_after = Pt(6)
    r_title = p_title.add_run("TÀI LIỆU ĐẶC TẢ CHI TIẾT CÁC CA SỬ DỤNG\n(USE CASE SPECIFICATION)\n")
    r_title.bold = True
    r_title.font.name = 'Times New Roman'
    r_title.font.size = Pt(18)
    r_title.font.color.rgb = RGBColor(0x00, 0x4D, 0x40)

    p_sub = doc.add_paragraph()
    p_sub.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_sub.paragraph_format.space_after = Pt(18)
    r_sub = p_sub.add_run("ĐỀ TÀI: NỀN TẢNG Y TẾ SỐ ĐA NỀN TẢNG NOVACARE\n(Khảo sát và đối chiếu toàn diện mã nguồn hệ thống)")
    r_sub.bold = True
    r_sub.font.name = 'Times New Roman'
    r_sub.font.size = Pt(13)
    r_sub.font.color.rgb = RGBColor(0x22, 0x22, 0x22)

    p_desc = doc.add_paragraph()
    p_desc.paragraph_format.space_after = Pt(14)
    r_desc = p_desc.add_run(
        "Tài liệu này bao gồm bảng đặc tả chi tiết cho toàn bộ các Ca sử dụng (Use Case) của hệ thống NovaCare, "
        "được xây dựng chuẩn xác theo cấu trúc và cách trình bày mẫu yêu cầu. Mỗi Use Case được đặc tả trong một bảng độc lập gồm: "
        "Tên use case, Mô tả sơ lược, Actor chính, Actor phụ, Tiền điều kiện, Hậu điều kiện, Luồng sự kiện chính (Main Flow) "
        "và Luồng sự kiện thay thế (Alternate Flow) phân định rõ ràng giữa hành động của Actor và phản hồi xử lý của System."
    )
    r_desc.font.name = 'Times New Roman'
    r_desc.font.size = Pt(13)

    # ── MAPPING THE 13 SUBSYSTEMS
    subsystems = [
        ("PHÂN HỆ 1: XÁC THỰC VÀ QUẢN LÝ TÀI KHOẢN (AUTHENTICATION & ACCOUNT)", USECASES_PART1[0:7]),
        ("PHÂN HỆ 2: QUẢN LÝ HỒ SƠ NGƯỜI ĐI KHÁM & HỘ CHIẾU SỨC KHỎE (PROFILES & PASSPORT)", USECASES_PART1[7:15]),
        ("PHÂN HỆ 3: TRA CỨU & TÌM KIẾM DỊCH VỤ Y TẾ (UNIVERSAL SEARCH & CATALOG)", USECASES_PART1[15:21]),
        ("PHÂN HỆ 4: ĐẶT LỊCH KHÁM BỆNH & QUẢN LÝ LỊCH HẸN (BOOKING & APPOINTMENTS)", USECASES_PART2[0:8]),
        ("PHÂN HỆ 5: THANH TOÁN TRỰC TUYẾN (ONLINE PAYMENT MANAGEMENT)", USECASES_PART2[8:12]),
        ("PHÂN HỆ 6: SÀNG LỌC SỨC KHỎE TIỀN KHÁM BẰNG AI (AI PRE-EXAM SCREENING V2)", USECASES_PART2[12:19]),
        ("PHÂN HỆ 7: TƯ VẤN Y TẾ TỪ XA (TELECONSULTATION - CHAT & VIDEO WEBRTC)", USECASES_PART3[0:8]),
        ("PHÂN HỆ 8: ĐÁNH GIÁ & PHẢN HỒI CHẤT LƯỢNG (REVIEWS & RATINGS)", USECASES_PART3[8:14]),
        ("PHÂN HỆ 9: QUẢN LÝ KHÁM CHỮA BỆNH LÂM SÀNG & EMR (CLINICAL ENCOUNTERS)", USECASES_PART3[14:20]),
        ("PHÂN HỆ 10: QUẢN TRỊ CƠ SỞ Y TẾ (HOSPITAL ADMINISTRATION PORTAL)", USECASES_PART4[0:10]),
        ("PHÂN HỆ 11: QUẢN TRỊ HỆ THỐNG TOÀN DIỆN (SUPER ADMIN PORTAL)", USECASES_PART4[10:22]),
        ("PHÂN HỆ 12: TÍCH HỢP & LIÊN THÔNG DỮ LIỆU Y TẾ (INTEROPERABILITY & HIS)", USECASES_PART4[22:27]),
        ("PHÂN HỆ 13: THÔNG BÁO & XỬ LÝ NỀN (NOTIFICATIONS & BACKGROUND WORKERS)", USECASES_PART4[27:31]),
    ]

    total_count = 0

    for section_title, uc_list in subsystems:
        # Heading for Subsystem
        p_sec = doc.add_paragraph()
        p_sec.paragraph_format.space_before = Pt(18)
        p_sec.paragraph_format.space_after = Pt(8)
        p_sec.paragraph_format.keep_with_next = True
        r_sec = p_sec.add_run(section_title)
        r_sec.bold = True
        r_sec.font.name = 'Times New Roman'
        r_sec.font.size = Pt(14)
        r_sec.font.color.rgb = RGBColor(0x00, 0x4D, 0x40)

        for uc_data in uc_list:
            total_count += 1
            add_usecase_table(doc, uc_data)

    print(f"Total Use Cases generated: {total_count}")

    # Output file paths
    root_out = Path("DAC_TA_CHI_TIET_USE_CASE_NOVACARE.docx")
    docs_out = Path("docs") / "DAC_TA_CHI_TIET_USE_CASE_NOVACARE.docx"

    doc.save(root_out)
    doc.save(docs_out)
    print(f"SUCCESS: Saved to {root_out.resolve()}")
    print(f"SUCCESS: Saved to {docs_out.resolve()}")

if __name__ == "__main__":
    generate_full_word_document()

