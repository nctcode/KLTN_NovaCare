import os
import sys
from pathlib import Path
from docx import Document
from docx.shared import Cm, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_CELL_VERTICAL_ALIGNMENT
from docx.oxml import OxmlElement
from docx.oxml.ns import qn

def create_element(name):
    return OxmlElement(name)

def set_cell_background(cell, fill_hex):
    tcPr = cell._tc.get_or_add_tcPr()
    shd = OxmlElement('w:shd')
    shd.set(qn('w:val'), 'clear')
    shd.set(qn('w:color'), 'auto')
    shd.set(qn('w:fill'), fill_hex)
    tcPr.append(shd)

def set_cell_margins(cell, top=100, bottom=100, left=150, right=150):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = OxmlElement('w:tcMar')
    for m, val in [('top', top), ('bottom', bottom), ('left', left), ('right', right)]:
        node = OxmlElement(f'w:{m}')
        node.set(qn('w:w'), str(val))
        node.set(qn('w:type'), 'dxa')
        tcMar.append(node)
    tcPr.append(tcMar)

def set_table_borders(table, color="D3D3D3", sz="4", val="single"):
    tblPr = table._tbl.tblPr
    tblBorders = OxmlElement('w:tblBorders')
    for border_name in ['top', 'left', 'bottom', 'right', 'insideH']:
        border = OxmlElement(f'w:{border_name}')
        border.set(qn('w:val'), val)
        border.set(qn('w:sz'), sz)
        border.set(qn('w:space'), '0')
        border.set(qn('w:color'), color)
        tblBorders.append(border)
    border = OxmlElement('w:insideV')
    border.set(qn('w:val'), 'none')
    tblBorders.append(border)
    tblPr.append(tblBorders)

def build_word_document():
    doc = Document()
    
    # ── Page Setup (A4, Margins: Top 2cm, Bottom 2cm, Left 2.5cm, Right 2cm)
    sec = doc.sections[0]
    sec.page_width = Cm(21.0)
    sec.page_height = Cm(29.7)
    sec.top_margin = Cm(2.0)
    sec.bottom_margin = Cm(2.0)
    sec.left_margin = Cm(2.5)
    sec.right_margin = Cm(2.0)

    # ── Styles
    normal_style = doc.styles['Normal']
    normal_style.font.name = 'Times New Roman'
    normal_style._element.rPr.rFonts.set(qn('w:eastAsia'), 'Times New Roman')
    normal_style.font.size = Pt(11)
    normal_style.font.color.rgb = RGBColor(0x22, 0x22, 0x22)
    normal_style.paragraph_format.line_spacing = 1.15
    normal_style.paragraph_format.space_after = Pt(3)

    # Helper functions for text
    def add_title(text):
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.paragraph_format.space_before = Pt(12)
        p.paragraph_format.space_after = Pt(4)
        run = p.add_run(text)
        run.bold = True
        run.font.size = Pt(18)
        run.font.color.rgb = RGBColor(0x00, 0x4D, 0x40) # Deep Teal / Medical
        return p

    def add_subtitle(text):
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.paragraph_format.space_after = Pt(18)
        run = p.add_run(text)
        run.italic = True
        run.font.size = Pt(12)
        run.font.color.rgb = RGBColor(0x55, 0x55, 0x55)
        return p

    def add_h1(text):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(14)
        p.paragraph_format.space_after = Pt(6)
        p.paragraph_format.keep_with_next = True
        run = p.add_run(text)
        run.bold = True
        run.font.size = Pt(14)
        run.font.color.rgb = RGBColor(0x00, 0x4D, 0x40)
        return p

    def add_h2(text):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(10)
        p.paragraph_format.space_after = Pt(4)
        p.paragraph_format.keep_with_next = True
        run = p.add_run(text)
        run.bold = True
        run.font.size = Pt(12.5)
        run.font.color.rgb = RGBColor(0x00, 0x69, 0x5C)
        return p

    def add_p(text, bold_prefix="", italic=False):
        p = doc.add_paragraph()
        p.paragraph_format.space_after = Pt(3)
        if bold_prefix:
            r_pre = p.add_run(bold_prefix)
            r_pre.bold = True
            r_pre.font.size = Pt(11)
        r_text = p.add_run(text)
        r_text.italic = italic
        r_text.font.size = Pt(11)
        return p

    def add_callout(text, bold_title=""):
        tbl = doc.add_table(rows=1, cols=1)
        tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
        tbl.autofit = False
        tbl.rows[0].cells[0].width = Cm(16.5)
        cell = tbl.rows[0].cells[0]
        set_cell_background(cell, "E0F2F1") # Light Teal background
        set_cell_margins(cell, top=140, bottom=140, left=180, right=180)
        p = cell.paragraphs[0]
        p.paragraph_format.space_after = Pt(0)
        p.paragraph_format.line_spacing = 1.15
        if bold_title:
            r1 = p.add_run(bold_title + " ")
            r1.bold = True
            r1.font.color.rgb = RGBColor(0x00, 0x4D, 0x40)
            r1.font.size = Pt(10.5)
        r2 = p.add_run(text)
        r2.font.size = Pt(10.5)
        doc.add_paragraph().paragraph_format.space_after = Pt(4)

    def format_table(tbl, col_widths, headers, data, header_bg="004D40", alt_bg="F9FBFB"):
        tbl.style = 'Table Grid'
        tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
        tbl.autofit = False

        # Set widths
        tblPr = tbl._tbl.tblPr
        tblLayout = OxmlElement('w:tblLayout')
        tblLayout.set(qn('w:type'), 'fixed')
        tblPr.append(tblLayout)

        # Header Row
        hdr_cells = tbl.rows[0].cells
        trPr = tbl.rows[0]._tr.get_or_add_trPr()
        trPr.append(OxmlElement('w:tblHeader'))

        for i, h in enumerate(headers):
            hdr_cells[i].text = h
            set_cell_background(hdr_cells[i], header_bg)
            set_cell_margins(hdr_cells[i], top=120, bottom=120, left=120, right=120)
            hdr_cells[i].vertical_alignment = WD_CELL_VERTICAL_ALIGNMENT.CENTER
            p = hdr_cells[i].paragraphs[0]
            p.paragraph_format.space_after = Pt(0)
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            for run in p.runs:
                run.bold = True
                run.font.name = 'Times New Roman'
                run.font.size = Pt(10)
                run.font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)

        # Data Rows
        for r_idx, row_data in enumerate(data):
            row = tbl.add_row()
            cells = row.cells
            bg = alt_bg if r_idx % 2 == 1 else "FFFFFF"
            for c_idx, val in enumerate(row_data):
                cells[c_idx].text = str(val)
                set_cell_background(cells[c_idx], bg)
                set_cell_margins(cells[c_idx], top=80, bottom=80, left=100, right=100)
                cells[c_idx].vertical_alignment = WD_CELL_VERTICAL_ALIGNMENT.CENTER
                p = cells[c_idx].paragraphs[0]
                p.paragraph_format.space_after = Pt(0)
                p.paragraph_format.line_spacing = 1.1
                # Center align code/number columns
                if c_idx in [0, 1] or len(str(val)) < 15:
                    if c_idx in [0, 1]:
                        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
                for run in p.runs:
                    run.font.name = 'Times New Roman'
                    run.font.size = Pt(9.5)

        # Apply column widths
        for row in tbl.rows:
            for i, w in enumerate(col_widths):
                row.cells[i].width = Cm(w)

        set_table_borders(tbl)
        doc.add_paragraph().paragraph_format.space_after = Pt(3)

    # ──────────────────────────────────────────────────────────────────────────
    # BẮT ĐẦU NỘI DUNG TÀI LIỆU
    # ──────────────────────────────────────────────────────────────────────────

    add_title("DANH MỤC TÁC NHÂN (ACTOR) VÀ CA SỬ DỤNG (USE CASE)\nCHI TIẾT HỆ THỐNG Y TẾ SỐ NOVACARE")
    add_subtitle("Tài liệu kỹ thuật đặc tả phục vụ Khóa luận tốt nghiệp ngành Hệ thống Thông tin\nĐại học Công nghiệp Thành phố Hồ Chí Minh (IUH)")

    add_callout(
        "Tài liệu này được tổng hợp và đối chiếu thực tế từ toàn bộ source code hệ thống NovaCare (NestJS API Backend, "
        "PostgreSQL Prisma Database, Next.js Web Frontend, Android Kotlin Mobile App và Mock HIS Servers). "
        "Mỗi Use Case đều cung cấp đầy đủ: Mã số, Tên, Mô tả, Tiền/Hậu điều kiện, Luồng xử lý, Căn cứ mã nguồn, "
        "mối quan hệ <<include>> / <<extend>> và Hiện trạng triển khai thực tế.",
        "MỤC ĐÍCH & PHẠM VI:"
    )

    # ── PHẦN 1: TỔNG QUAN VÀ DANH MỤC ACTOR
    add_h1("1. DANH SÁCH CÁC TÁC NHÂN (ACTOR) THỰC TẾ TRONG HỆ THỐNG")
    add_p("Hệ thống NovaCare xác định chính xác 10 Tác nhân (Actor) tham gia vào các quy trình nghiệp vụ, "
          "bao gồm 5 Tác nhân con người (được phân quyền qua JWT & Roles Guard) và 5 Tác nhân hệ thống ngoài:")

    actor_headers = ["Mã Actor", "Tên Tác nhân", "Phân loại", "Quyền / Phạm vi tương tác", "Kênh tương tác"]
    actor_data = [
        ["ACT-01", "Khách vãng lai (Guest)", "Con người", "Truy cập công khai, tra cứu thông tin cơ sở/bác sĩ, đăng ký tài khoản, gửi đơn hợp tác", "Web Portal, Mobile App"],
        ["ACT-02", "Người bệnh (Patient)", "Con người", "Role PATIENT: Quản lý hồ sơ cá nhân, đặt lịch, thanh toán, sàng lọc AI, tư vấn từ xa, chia sẻ hồ sơ", "Mobile App, Web Portal"],
        ["ACT-03", "Bác sĩ (Doctor)", "Con người", "Role DOCTOR: Tư vấn từ xa (chat, video), khám bệnh lâm sàng EMR, chẩn đoán ICD-10, kê đơn thuốc", "Web Portal, Mobile App"],
        ["ACT-04", "Quản trị cơ sở y tế (Hospital Admin)", "Con người", "Role HOSPITAL_ADMIN: Quản lý bác sĩ, lịch trực, suất khám, tiếp đón check-in, no-show, kết nối HIS", "Web Hospital Admin Portal"],
        ["ACT-05", "Quản trị viên hệ thống (Super Admin)", "Con người", "Role ADMIN: Quản trị tài khoản, phân quyền, quản lý danh mục toàn quốc, duyệt đối tác, kiểm duyệt đánh giá, giám sát liên thông", "Web Super Admin Portal"],
        ["ACT-06", "Cổng thanh toán VNPay", "Hệ thống ngoài", "Tạo giao dịch thanh toán trực tuyến, đối soát bảo mật và gửi phản hồi trạng thái ngầm qua IPN Webhook", "HTTPS REST API / IPN"],
        ["ACT-07", "Máy chủ Video LiveKit", "Hệ thống ngoài", "Điều phối phòng gọi video WebRTC thời gian thực, cấp access token và bắn webhook trạng thái phòng", "WebRTC / WebSocket / Webhook"],
        ["ACT-08", "Dịch vụ Trí tuệ nhân tạo (AI Engine)", "Hệ thống ngoài", "Bóc tách triệu chứng, sinh câu hỏi phân nhánh thích ứng, chuyển đổi giọng nói (Whisper STT), gợi ý chuyên khoa", "OpenAI / Beeknoee API"],
        ["ACT-09", "Hệ thống HIS đối tác", "Hệ thống ngoài", "Cung cấp API đồng bộ danh mục, đối soát định danh bệnh nhân (MPI) và trích xuất dữ liệu bệnh án chuẩn QĐ 4750/BYT", "REST API / HL7 FHIR / XML"],
        ["ACT-10", "Dịch vụ Thông báo & Tác vụ nền", "Hệ thống nội bộ", "Gửi Email tự động qua SMTP (Nodemailer), thông báo đẩy Firebase (FCM) và các Cron Job quét lịch hết hạn", "BullMQ Worker / Redis / SMTP"]
    ]
    format_table(doc.add_table(rows=1, cols=5), [2.0, 4.0, 2.5, 5.5, 2.5], actor_headers, actor_data)

    # ── PHẦN 2: BẢNG TỔNG HỢP SỐ LƯỢNG USE CASE
    add_h1("2. TỔNG HỢP SỐ LƯỢNG USE CASE THEO TỪNG TÁC NHÂN VÀ PHÂN HỆ")
    
    stat_headers = ["STT", "Tác nhân (Actor)", "Số lượng UC", "Các phân hệ nghiệp vụ chính phụ trách", "Tỷ lệ hoàn thiện"]
    stat_data = [
        ["1", "Khách vãng lai (Guest)", "11 Use Cases", "Xác thực, Tra cứu danh mục công khai, Đăng ký đối tác", "100% (11/11) 🟢"],
        ["2", "Người bệnh (Patient)", "39 Use Cases", "Hồ sơ sức khỏe, Đặt lịch, Thanh toán, Sàng lọc AI, Tư vấn từ xa, Đánh giá", "100% (39/39) 🟢"],
        ["3", "Bác sĩ (Doctor)", "17 Use Cases", "Tư vấn trực tuyến, Bệnh án lâm sàng EMR, Kê đơn điện tử, Tra cứu liên viện", "100% (17/17) 🟢"],
        ["4", "Quản trị cơ sở y tế (Hospital Admin)", "15 Use Cases", "Vận hành cơ sở, Tiếp đón check-in, Xử lý no-show, Quản lý lịch bác sĩ, Đồng bộ HIS", "100% (15/15) 🟢"],
        ["5", "Quản trị viên hệ thống (Super Admin)", "16 Use Cases", "Quản trị hệ thống, Phân quyền RBAC, Duyệt đối tác, Kiểm duyệt đánh giá, Giám sát liên thông", "100% (16/16) 🟢"],
        ["6", "Các hệ thống tích hợp ngoài & Tác vụ nền", "10 Use Cases", "Thanh toán VNPay, Phòng LiveKit, Sàng lọc AI, Liên thông HIS, Quét lịch tự động", "90% (9/10) 🟢 (1 🟡)"],
        ["", "TỔNG CỘNG TOÀN HỆ THỐNG", "68 Use Cases duy nhất", "13 Phân hệ nghiệp vụ đồng bộ đa nền tảng (Web + Mobile)", "98.5% Hoàn thiện"]
    ]
    format_table(doc.add_table(rows=1, cols=5), [1.2, 4.5, 2.5, 6.0, 2.3], stat_headers, stat_data)

    # ── PHẦN 3: ĐẶC TẢ CHI TIẾT USE CASE CỦA TỪNG ACTOR
    add_h1("3. ĐẶC TẢ CHI TIẾT CA SỬ DỤNG (USE CASE) THEO TỪNG ACTOR")

    # Helper function for rendering detail table for an Actor's Use Cases
    def render_actor_usecases(actor_code, actor_name, uc_list):
        add_h2(f"{actor_code} - CÁC CA SỬ DỤNG CỦA {actor_name.upper()}")
        
        headers = ["Mã UC", "Tên Ca sử dụng", "Mô tả tóm tắt", "Tiền điều kiện / Hậu điều kiện", "Luồng xử lý chính (Basic Flow)", "Quan hệ & Căn cứ mã nguồn", "Trạng thái"]
        table_rows = []
        for uc in uc_list:
            cond = f"• Tiền: {uc['pre']}\n• Hậu: {uc['post']}"
            rel_code = f"• Quan hệ: {uc['rel']}\n• Mã nguồn:\n- API: {uc['api']}\n- UI: {uc['ui']}"
            table_rows.append([
                uc['code'],
                uc['name'],
                uc['desc'],
                cond,
                uc['flow'],
                rel_code,
                uc['status']
            ])
        format_table(doc.add_table(rows=1, cols=7), [1.8, 2.8, 3.2, 2.8, 3.5, 3.2, 1.2], headers, table_rows)

    # ── 3.1. KHÁCH VÃNG LAI (GUEST)
    guest_ucs = [
        {
            "code": "UC-G01", "name": "Đăng ký tài khoản qua OTP",
            "desc": "Người dùng đăng ký tài khoản mới bằng số điện thoại hoặc email thông qua xác thực mã OTP ngẫu nhiên.",
            "pre": "Chưa đăng nhập, có số điện thoại/email chưa tồn tại trên hệ thống.",
            "post": "Tài khoản người dùng mới được tạo với role PATIENT, mật khẩu mã hóa Argon2.",
            "flow": "1. Khách nhập SĐT/Email, mật khẩu, họ tên.\n2. Hệ thống gửi OTP qua SMS/Email.\n3. Khách nhập OTP xác thực.\n4. Hệ thống lưu tài khoản và thông báo thành công.",
            "rel": "Không", "api": "auth.controller.ts (/register, /request-otp)", "ui": "Mobile: RegisterScreen.kt | Web: /dang-ky", "status": "🟢"
        },
        {
            "code": "UC-G02", "name": "Đăng nhập hệ thống",
            "desc": "Xác thực định danh người dùng bằng số điện thoại/email và mật khẩu để cấp quyền truy cập.",
            "pre": "Tài khoản đã tồn tại và đang ở trạng thái ACTIVE.",
            "post": "Hệ thống cấp cặp Access Token và Refresh Token; điều hướng theo vai trò.",
            "flow": "1. Khách nhập SĐT/Email và mật khẩu.\n2. Hệ thống đối soát mật khẩu hash.\n3. Tạo JWT Token với vai trò tương ứng.\n4. Lưu token vào thiết bị và điều hướng.",
            "rel": "Không", "api": "auth.controller.ts (/login)", "ui": "Mobile: LoginScreen.kt | Web: /dang-nhap", "status": "🟢"
        },
        {
            "code": "UC-G03", "name": "Quên / Đặt lại mật khẩu",
            "desc": "Khôi phục quyền truy cập tài khoản khi người dùng quên mật khẩu đăng nhập.",
            "pre": "Tài khoản đã đăng ký trên hệ thống.",
            "post": "Mật khẩu tài khoản được cập nhật mới, vô hiệu hóa các phiên cũ.",
            "flow": "1. Khách nhập Email/SĐT yêu cầu.\n2. Hệ thống gửi mã OTP khôi phục.\n3. Khách xác minh OTP và nhập mật khẩu mới.\n4. Hệ thống cập nhật mật khẩu.",
            "rel": "Không", "api": "auth.controller.ts (/forgot-password, /reset-password)", "ui": "Mobile: ForgotPasswordScreen.kt | Web: /quen-mat-khau", "status": "🟢"
        },
        {
            "code": "UC-G04", "name": "Tìm kiếm đa tiêu chí (Universal Search)",
            "desc": "Tra cứu nhanh chóng cơ sở y tế, bác sĩ, chuyên khoa hoặc dịch vụ y tế theo từ khóa.",
            "pre": "Không yêu cầu.",
            "post": "Danh sách kết quả tìm kiếm được phân loại hiển thị theo mức độ liên quan.",
            "flow": "1. Khách nhập từ khóa tìm kiếm.\n2. Hệ thống tìm kiếm full-text trên danh mục.\n3. Trả về kết quả phân nhóm: Bác sĩ, Cơ sở, Chuyên khoa.",
            "rel": "Không", "api": "search.controller.ts (GET /api/v1/search)", "ui": "Mobile: SearchScreen.kt | Web: Header Search", "status": "🟢"
        },
        {
            "code": "UC-G05", "name": "Lọc tìm kiếm nâng cao",
            "desc": "Thu hẹp danh sách kết quả theo vị trí địa lý (GPS/Tỉnh/Huyện), loại cơ sở, mức giá khám.",
            "pre": "Đang ở màn hình tìm kiếm kết quả.",
            "post": "Danh sách kết quả được lọc và sắp xếp chính xác.",
            "flow": "1. Khách chọn bộ lọc (tỉnh thành, cự ly GPS, giá).\n2. Gửi request kèm query param.\n3. Nhận danh sách kết quả đã lọc.",
            "rel": "<<extend>> UC-G04", "api": "search.controller.ts", "ui": "Mobile: SearchFilterSheet.kt | Web: Search Filters", "status": "🟢"
        },
        {
            "code": "UC-G06", "name": "Xem chi tiết cơ sở y tế",
            "desc": "Xem hình ảnh, địa chỉ, giờ hoạt động, danh sách chuyên khoa, bác sĩ và dịch vụ của cơ sở.",
            "pre": "Cơ sở y tế đang ở trạng thái ACTIVE.",
            "post": "Thông tin toàn diện của cơ sở được hiển thị.",
            "flow": "1. Khách bấm vào một cơ sở y tế.\n2. Hệ thống truy vấn thông tin chi tiết và danh mục dịch vụ.\n3. Hiển thị chi tiết trên giao diện.",
            "rel": "Không", "api": "hospitals.controller.ts (GET /:id)", "ui": "Mobile: HospitalFacilityBookingScreen.kt | Web: /co-so-y-te/[id]", "status": "🟢"
        },
        {
            "code": "UC-G07", "name": "Xem hồ sơ & Lịch khám bác sĩ",
            "desc": "Xem bằng cấp, học vị, chuyên khoa, kinh nghiệm, nơi làm việc và các suất khám còn trống của bác sĩ.",
            "pre": "Bác sĩ có hồ sơ công khai trên hệ thống.",
            "post": "Lịch làm việc và các khung giờ còn trống được hiển thị.",
            "flow": "1. Khách chọn xem một bác sĩ.\n2. Hệ thống tải thông tin cá nhân và suất khám trống.\n3. Hiển thị lịch khám theo từng ngày.",
            "rel": "Không", "api": "doctors.controller.ts (GET /:id, /available-slots)", "ui": "Mobile: DoctorDetailScreen.kt | Web: /bac-si/[id]", "status": "🟢"
        },
        {
            "code": "UC-G08", "name": "Xem danh mục chuyên khoa & Dịch vụ",
            "desc": "Tra cứu các chuyên khoa (Nhi, Sản, Tim mạch...) và các gói khám sức khỏe tổng quát, cận lâm sàng.",
            "pre": "Không yêu cầu.",
            "post": "Danh mục chuyên khoa, mô tả và bảng giá công khai được hiển thị.",
            "flow": "1. Khách chọn menu Chuyên khoa hoặc Gói khám.\n2. Hệ thống tải danh mục từ CSDL.\n3. Hiển thị danh sách kèm mức giá niêm yết.",
            "rel": "Không", "api": "specialties.controller.ts, health-packages.controller.ts", "ui": "Web: /chuyen-khoa, /dich-vu/*", "status": "🟢"
        },
        {
            "code": "UC-G09", "name": "Xem từ khóa tìm kiếm phổ biến",
            "desc": "Gợi ý các danh mục, bệnh lý hoặc chuyên khoa được nhiều người quan tâm nhất.",
            "pre": "Không yêu cầu.",
            "post": "Danh sách các tag tìm kiếm xu hướng xuất hiện.",
            "flow": "1. Khách bấm vào thanh tìm kiếm.\n2. Hệ thống trả về top 10 từ khóa phổ biến.\n3. Khách có thể chọn nhanh từ khóa để tra cứu.",
            "rel": "Không", "api": "search.controller.ts (GET /search/popular)", "ui": "Mobile: PopularSearchSection.kt", "status": "🟢"
        },
        {
            "code": "UC-G10", "name": "Xem đánh giá & Thống kê chất lượng",
            "desc": "Xem các phản hồi, chấm điểm số sao và bình luận của người bệnh đối với bác sĩ/bệnh viện.",
            "pre": "Đã có các đánh giá được duyệt (APPROVED).",
            "post": "Điểm sao trung bình và danh sách nhận xét công khai được hiển thị.",
            "flow": "1. Khách xem trang bác sĩ hoặc cơ sở.\n2. Hệ thống truy vấn các review đã kiểm duyệt.\n3. Hiển thị số sao trung bình và các nhận xét.",
            "rel": "Không", "api": "reviews.controller.ts (GET /public/doctor/:id)", "ui": "Web & Mobile: Review list component", "status": "🟢"
        },
        {
            "code": "UC-G11", "name": "Gửi yêu cầu đăng ký đối tác (Partner Request)",
            "desc": "Đại diện bệnh viện, phòng khám điền đơn đăng ký tham gia mạng lưới cơ sở y tế NovaCare.",
            "pre": "Không yêu cầu.",
            "post": "Bản ghi PartnerRequest được lưu với trạng thái PENDING; gửi mail xác nhận tiếp nhận.",
            "flow": "1. Khách điền tên đơn vị, người liên hệ, SĐT, giấy phép.\n2. Bấm Gửi yêu cầu.\n3. Hệ thống lưu yêu cầu vào CSDL và gửi mail thông báo.",
            "rel": "Không", "api": "partner-requests.controller.ts (POST /partner-requests)", "ui": "Web: /lien-he-hop-tac, /doanh-nghiep", "status": "🟢"
        }
    ]
    render_actor_usecases("ACT-01", "Khách vãng lai (Guest)", guest_ucs)

    # ── 3.2. NGƯỜI BỆNH / BỆNH NHÂN (PATIENT)
    patient_ucs = [
        {
            "code": "UC-P01", "name": "Đăng xuất tài khoản",
            "desc": "Thoát phiên đăng nhập trên thiết bị hiện tại hoặc hủy toàn bộ phiên làm việc trên mọi thiết bị.",
            "pre": "Đã đăng nhập hệ thống.",
            "post": "Token bị thu hồi, xóa token lưu cục bộ và quay về màn hình đăng nhập.",
            "flow": "1. Người bệnh bấm Đăng xuất.\n2. Gọi API logout để hủy refresh token.\n3. Xóa token cục bộ và chuyển hướng.",
            "rel": "Không", "api": "auth.controller.ts (/logout, /logout-all)", "ui": "Mobile: SettingsScreen.kt | Web: Header Menu", "status": "🟢"
        },
        {
            "code": "UC-P02", "name": "Quản lý thông tin tài khoản cá nhân",
            "desc": "Xem và cập nhật họ tên, số điện thoại, ảnh đại diện và thực hiện đổi mật khẩu đăng nhập.",
            "pre": "Đã đăng nhập.",
            "post": "Thông tin tài khoản được cập nhật vào bảng User trong CSDL.",
            "flow": "1. Mở trang Cài đặt tài khoản.\n2. Chỉnh sửa thông tin hoặc nhập mật khẩu cũ/mới.\n3. Bấm Lưu cập nhật.",
            "rel": "Không", "api": "users.controller.ts (GET/PUT /api/v1/users/me)", "ui": "Mobile: SettingsScreen.kt | Web: /tai-khoan", "status": "🟢"
        },
        {
            "code": "UC-P03", "name": "Tạo hồ sơ người đi khám",
            "desc": "Tạo mới hồ sơ y tế cho bản thân hoặc các thành viên gia đình (con cái, cha mẹ, vợ chồng).",
            "pre": "Đã đăng nhập.",
            "post": "Bản ghi PatientProfile mới được tạo liên kết với tài khoản người dùng.",
            "flow": "1. Bấm Thêm hồ sơ người đi khám.\n2. Điền họ tên, ngày sinh, giới tính, CCCD, BHYT, tiền sử bệnh.\n3. Xác nhận tạo hồ sơ.",
            "rel": "Không", "api": "patient-profiles.controller.ts (POST /api/v1/patient-profiles)", "ui": "Mobile: FullProfileFormDialog.kt | Web: /ho-so", "status": "🟢"
        },
        {
            "code": "UC-P04", "name": "Xem danh sách & Chi tiết hồ sơ",
            "desc": "Xem tất cả các hồ sơ thành viên đã tạo và thông tin y tế chi tiết của từng người.",
            "pre": "Đã đăng nhập.",
            "post": "Danh sách các hồ sơ kèm thẻ đại diện được hiển thị đầy đủ.",
            "flow": "1. Mở mục Quản lý hồ sơ.\n2. Hệ thống tải danh sách hồ sơ của user.\n3. Bấm vào một hồ sơ để xem chi tiết.",
            "rel": "Không", "api": "patient-profiles.controller.ts (GET /api/v1/patient-profiles)", "ui": "Mobile: ProfileListScreen.kt | Web: /ho-so", "status": "🟢"
        },
        {
            "code": "UC-P05", "name": "Cập nhật hồ sơ người đi khám",
            "desc": "Chỉnh sửa thông tin cá nhân, địa chỉ, số thẻ BHYT hoặc thông tin liên hệ khẩn cấp trong hồ sơ.",
            "pre": "Hồ sơ thuộc quyền sở hữu của người dùng.",
            "post": "Thông tin trong PatientProfile được cập nhật mới.",
            "flow": "1. Chọn hồ sơ cần sửa.\n2. Thay đổi thông tin trên biểu mẫu.\n3. Bấm Lưu thay đổi.",
            "rel": "Không", "api": "patient-profiles.controller.ts (PUT /:id)", "ui": "Mobile & Web Profile Form", "status": "🟢"
        },
        {
            "code": "UC-P06", "name": "Xóa hồ sơ người đi khám",
            "desc": "Xóa hồ sơ thành viên không còn nhu cầu sử dụng (chỉ xóa được nếu chưa gắn với lịch khám đang chờ).",
            "pre": "Hồ sơ không có lịch hẹn đang ở trạng thái chờ khám/chờ thanh toán.",
            "post": "Hồ sơ được xóa mềm (soft delete) khỏi danh sách hiển thị.",
            "flow": "1. Chọn Xóa hồ sơ.\n2. Xác nhận cảnh báo xóa.\n3. Hệ thống kiểm tra ràng buộc và thực hiện xóa.",
            "rel": "Không", "api": "patient-profiles.controller.ts (DELETE /:id)", "ui": "Mobile & Web Profile Actions", "status": "🟢"
        },
        {
            "code": "UC-P07", "name": "Đặt hồ sơ mặc định",
            "desc": "Chỉ định một hồ sơ làm hồ sơ chính để tự động điền sẵn khi đặt lịch khám nhanh.",
            "pre": "Có ít nhất 1 hồ sơ.",
            "post": "Cờ isDefault của hồ sơ được chuyển thành true, các hồ sơ khác chuyển thành false.",
            "flow": "1. Bấm Đặt làm mặc định tại hồ sơ mong muốn.\n2. Hệ thống cập nhật CSDL và hiển thị biểu tượng mặc định.",
            "rel": "Không", "api": "patient-profiles.controller.ts (PATCH /:id/default)", "ui": "Mobile & Web Profile Actions", "status": "🟢"
        },
        {
            "code": "UC-P08", "name": "Đặt lịch khám theo bác sĩ",
            "desc": "Tạo lịch hẹn khám bệnh trực tiếp với một bác sĩ cụ thể theo ngày và khung giờ khám mong muốn.",
            "pre": "Bác sĩ có suất khám (slot) còn trống; đã có ít nhất 1 hồ sơ người khám.",
            "post": "Bản ghi Appointment được tạo với trạng thái AWAITING_PAYMENT hoặc CONFIRMED.",
            "flow": "1. Chọn bác sĩ và nơi làm việc.\n2. Chọn ngày khám và khung giờ trống.\n3. Chọn hồ sơ người đi khám và nhập lý do khám.\n4. Xác nhận tạo lịch hẹn.",
            "rel": "<<include>> UC-P04", "api": "appointments.controller.ts (POST /api/v1/appointments)", "ui": "Mobile: BookingScreen.kt | Web: /dat-lich", "status": "🟢"
        },
        {
            "code": "UC-P09", "name": "Đặt lịch khám theo cơ sở / Chuyên khoa",
            "desc": "Đặt lịch khám tại một bệnh viện: chọn chuyên khoa -> phòng khám dịch vụ -> suất khám -> người khám.",
            "pre": "Cơ sở y tế có mở phòng khám và còn suất khám khả dụng.",
            "post": "Phiếu hẹn khám dịch vụ được khởi tạo thành công.",
            "flow": "1. Chọn cơ sở y tế và chuyên khoa.\n2. Chọn phòng khám/dịch vụ và khung giờ.\n3. Gắn hồ sơ bệnh nhân và xác nhận đặt lịch.",
            "rel": "<<include>> UC-P04", "api": "clinic-rooms.module.ts, booking.controller.ts", "ui": "Mobile: HospitalFacilityBookingScreen.kt | Web: /dat-kham-co-so", "status": "🟢"
        },
        {
            "code": "UC-P10", "name": "Đặt lịch từ kết quả sàng lọc AI",
            "desc": "Tự động kế thừa chuyên khoa gợi ý và tóm tắt bệnh sử từ phiên sàng lọc AI để đặt lịch nhanh.",
            "pre": "Đã hoàn tất phiên sàng lọc tiền khám AI có kết quả khuyến nghị chuyên khoa.",
            "post": "Lịch hẹn được tạo tự động gắn liền mã phiên sàng lọc (preExamSessionId).",
            "flow": "1. Tại màn hình kết quả AI, bấm 'Đặt khám chuyên khoa này'.\n2. Chọn cơ sở y tế hoặc bác sĩ phù hợp.\n3. Hệ thống điền sẵn lý do khám từ AI và tạo lịch.",
            "rel": "<<extend>> UC-P09", "api": "appointments-from-pre-exam.controller.ts (POST /from-pre-exam)", "ui": "Mobile: ScreeningResultComponents.kt", "status": "🟢"
        },
        {
            "code": "UC-P11", "name": "Xem danh sách lịch hẹn của tôi",
            "desc": "Xem danh sách các lịch khám sắp tới (Upcoming) và lịch sử các ca khám đã hoàn tất/hủy (History).",
            "pre": "Đã đăng nhập.",
            "post": "Danh sách các phiếu khám kèm trạng thái (CONFIRMED, PAID, COMPLETED...) hiển thị đầy đủ.",
            "flow": "1. Mở tab Lịch khám.\n2. Hệ thống tải danh sách lịch theo trạng thái.\n3. Người dùng chuyển đổi qua lại giữa tab Sắp tới và Lịch sử.",
            "rel": "Không", "api": "appointments.controller.ts (/upcoming, /history)", "ui": "Mobile: AppointmentListScreen.kt | Web: /lich-kham", "status": "🟢"
        },
        {
            "code": "UC-P12", "name": "Xem chi tiết lịch hẹn & Dòng thời gian",
            "desc": "Xem mã phiếu khám, số thứ tự, phòng khám, hướng dẫn chuẩn bị và timeline lịch sử trạng thái.",
            "pre": "Lịch hẹn thuộc tài khoản người dùng.",
            "post": "Toàn bộ thông tin phiếu khám điện tử và timeline thay đổi trạng thái được hiển thị.",
            "flow": "1. Bấm vào một lịch hẹn cụ thể.\n2. Hệ thống truy vấn chi tiết lịch hẹn và timeline log.\n3. Hiển thị thông tin phiếu khám và QR code (nếu có).",
            "rel": "Không", "api": "appointments.controller.ts (GET /:id, /:id/timeline)", "ui": "Mobile: AppointmentDetailScreen.kt | Web: /lich-kham/[id]", "status": "🟢"
        },
        {
            "code": "UC-P13", "name": "Hủy lịch hẹn khám",
            "desc": "Chủ động hủy phiếu khám trước giờ hẹn khám theo quy định của bệnh viện.",
            "pre": "Lịch hẹn ở trạng thái PENDING, AWAITING_PAYMENT hoặc CONFIRMED; còn trong hạn hủy.",
            "post": "Trạng thái lịch chuyển sang CANCELLED, suất khám được hoàn trả lại cho hệ thống.",
            "flow": "1. Mở chi tiết lịch hẹn, chọn Hủy lịch.\n2. Chọn/nhập lý do hủy.\n3. Xác nhận hủy lịch khám.",
            "rel": "<<extend>> UC-P12", "api": "appointments.controller.ts (PATCH /:id/cancel)", "ui": "Mobile & Web Appointment Actions", "status": "🟢"
        },
        {
            "code": "UC-P14", "name": "Đổi lịch khám (Reschedule)",
            "desc": "Thay đổi ngày khám hoặc khung giờ khám khác của bác sĩ/phòng khám mà không cần tạo lịch mới.",
            "pre": "Lịch hẹn hợp lệ và còn trong thời hạn được phép đổi lịch.",
            "post": "Suất khám cũ được giải phóng, suất khám mới được gán cho phiếu hẹn.",
            "flow": "1. Chọn Đổi lịch khám.\n2. Chọn ngày khám và khung giờ trống mới.\n3. Xác nhận cập nhật lịch hẹn.",
            "rel": "<<extend>> UC-P12", "api": "appointments.controller.ts (PATCH /:id/reschedule)", "ui": "Mobile & Web Reschedule Dialog", "status": "🟢"
        },
        {
            "code": "UC-P15", "name": "Thanh toán trực tuyến qua VNPay",
            "desc": "Khởi tạo đơn thanh toán trực tuyến tiền khám qua cổng VNPay (hỗ trợ ATM, Thẻ quốc tế, VNPay QR).",
            "pre": "Lịch hẹn đang ở trạng thái AWAITING_PAYMENT.",
            "post": "Hệ thống sinh URL thanh toán VNPay và chuyển hướng người bệnh thực hiện thanh toán.",
            "flow": "1. Bấm Thanh toán ngay tại phiếu khám.\n2. Hệ thống tạo giao dịch PaymentTransaction và sinh URL VNPay.\n3. Mở cổng VNPay (qua WebView/trình duyệt).\n4. Người bệnh nhập thông tin thẻ và xác thực OTP ngân hàng.",
            "rel": "<<include>> UC-P08", "api": "payments.controller.ts (POST /create)", "ui": "Mobile: PaymentScreen.kt | Web: /thanh-toan", "status": "🟢"
        },
        {
            "code": "UC-P16", "name": "Xem kết quả thanh toán",
            "desc": "Nhận kết quả giao dịch sau khi hoàn tất trên cổng thanh toán (thành công hoặc thất bại).",
            "pre": "Đã thực hiện thanh toán tại VNPay.",
            "post": "Trạng thái giao dịch được hiển thị rõ ràng, cập nhật phiếu khám thành CONFIRMED/PAID.",
            "flow": "1. Cổng thanh toán chuyển hướng về return URL.\n2. Hệ thống kiểm tra mã phản hồi vnp_ResponseCode.\n3. Hiển thị thông báo kết quả và biên lai điện tử.",
            "rel": "Không", "api": "payments.controller.ts (GET /status/:appointmentId)", "ui": "Web: /thanh-toan/return | Mobile: PaymentResult", "status": "🟢"
        },
        {
            "code": "UC-P17", "name": "Khởi tạo phiên sàng lọc tiền khám AI",
            "desc": "Bắt đầu một phiên khảo sát triệu chứng sức khỏe trước khi đi khám ứng dụng AI v2.",
            "pre": "Đã đăng nhập.",
            "post": "Bản ghi PreExamSession mới được tạo ở trạng thái IN_PROGRESS.",
            "flow": "1. Mở tính năng Sàng lọc tiền khám AI.\n2. Hệ thống khởi tạo phiên mới và tải danh mục câu hỏi/vùng cơ thể.\n3. Chuyển sang Bước 1: Khai báo triệu chứng.",
            "rel": "Không", "api": "pre-exam-v2.controller.ts (POST /start)", "ui": "Mobile: PreExamScreeningScreen.kt", "status": "🟢"
        },
        {
            "code": "UC-P18", "name": "Khai báo triệu chứng & Vị trí cơ thể",
            "desc": "Chọn vị trí khó chịu trên sơ đồ cơ thể (đầu, ngực, bụng...) và nhập mô tả triệu chứng chi tiết.",
            "pre": "Phiên sàng lọc đang hoạt động.",
            "post": "Triệu chứng khởi phát được ghi nhận vào phiên sàng lọc.",
            "flow": "1. Chọn vùng cơ thể trên hình ảnh trực quan.\n2. Chọn triệu chứng gợi ý hoặc gõ văn bản tự do.\n3. Bấm Tiếp tục sang bước thu thập dữ liệu bổ sung.",
            "rel": "<<include>> UC-P17", "api": "pre-exam-v2.controller.ts (POST /:id/symptoms)", "ui": "Mobile: ScreeningStep1Components.kt", "status": "🟢"
        },
        {
            "code": "UC-P19", "name": "Tải ảnh tổn thương hỗ trợ AI",
            "desc": "Chụp ảnh vị trí tổn thương (nổi mẩn da, vết thương, sưng tấy) gửi lên hệ thống phân tích hình ảnh.",
            "pre": "Người bệnh đồng ý điều khoản xử lý hình ảnh y tế.",
            "post": "Tệp hình ảnh được tải lên an toàn và gắn vào phiên sàng lọc.",
            "flow": "1. Chọn Chụp ảnh hoặc Tải ảnh từ thư viện.\n2. Xác nhận điều khoản riêng tư.\n3. Hệ thống lưu ảnh và phân tích đặc trưng hình ảnh.",
            "rel": "<<extend>> UC-P18", "api": "pre-exam-v2.controller.ts (POST /sessions/:id/media)", "ui": "Mobile: ScreeningImageComponents.kt", "status": "🟢"
        },
        {
            "code": "UC-P20", "name": "Nhận diện giọng nói chuyển thành văn bản",
            "desc": "Ghi âm giọng nói mô tả triệu chứng, hệ thống gọi Whisper API để bóc tách thành văn bản tiếng Việt.",
            "pre": "Cho phép quyền truy cập Micro trên điện thoại.",
            "post": "Bản ghi âm được chuyển đổi chính xác thành văn bản điền vào ô triệu chứng.",
            "flow": "1. Nhấn nút Ghi âm và nói triệu chứng.\n2. Nhấn Dừng ghi âm.\n3. Hệ thống gửi audio lên Whisper API và điền kết quả văn bản trả về.",
            "rel": "<<extend>> UC-P18", "api": "pre-exam-v2.controller.ts (POST /transcribe)", "ui": "Mobile: ScreeningVoiceComponents.kt", "status": "🟢"
        },
        {
            "code": "UC-P21", "name": "Đo nhịp tim qua camera (PPG)",
            "desc": "Đặt ngón tay lên camera và đèn flash để đo biến thiên xung mạch (Photoplethysmography).",
            "pre": "Camera thiết bị hỗ trợ đèn flash.",
            "post": "Ước tính nhịp tim trung bình được tính toán và bổ sung vào chỉ số sinh hiệu tiền khám.",
            "flow": "1. Đặt ngón tay che kín camera.\n2. Hệ thống thu nhận khung hình biến thiên sắc tố mao mạch trong 15-30 giây.\n3. Tính toán nhịp tim (BPM) và lưu vào phiên.",
            "rel": "<<extend>> UC-P18", "api": "pre-exam-v2.controller.ts (POST /analyze-smartphone)", "ui": "Mobile: ScreeningPpgCapture.kt", "status": "🟢"
        },
        {
            "code": "UC-P22", "name": "Trả lời câu hỏi phân nhánh chuyên sâu",
            "desc": "Hệ thống AI tự động sinh câu hỏi thích ứng (adaptive questions) dựa trên triệu chứng; người bệnh trả lời.",
            "pre": "Đã hoàn thành bước khai báo triệu chứng ban đầu.",
            "post": "Các câu trả lời được ghi nhận để thu hẹp chẩn đoán phân biệt.",
            "flow": "1. Hệ thống AI sinh 2-3 câu hỏi làm rõ (thời gian, tính chất đau, yếu tố tăng/giảm).\n2. Người bệnh chọn câu trả lời Có/Không hoặc Trắc nghiệm.\n3. Gửi câu trả lời về server.",
            "rel": "<<include>> UC-P17", "api": "pre-exam-v2.controller.ts (POST /:id/answer)", "ui": "Mobile: ScreeningStep2Components.kt", "status": "🟢"
        },
        {
            "code": "UC-P23", "name": "Nhận kết quả định hướng chuyên khoa & Cờ đỏ",
            "desc": "Xem báo cáo tổng hợp: mức độ nguy cơ, cảnh báo cờ đỏ (Red Flags cấp cứu), gợi ý chuyên khoa phù hợp.",
            "pre": "Đã hoàn tất trả lời câu hỏi sàng lọc.",
            "post": "Báo cáo phân tích hiển thị đầy đủ; phiên chuyển sang trạng thái COMPLETED.",
            "flow": "1. Hệ thống tổng hợp dữ liệu, chạy bộ quy tắc Red Flags và gọi mô hình AI suy luận.\n2. Hiển thị mức nguy cơ và chuyên khoa gợi ý.\n3. Cung cấp nút chuyển tiếp sang đặt lịch khám.",
            "rel": "<<include>> UC-P17", "api": "pre-exam-v2.controller.ts (POST /:id/complete)", "ui": "Mobile: ScreeningResultComponents.kt", "status": "🟢"
        },
        {
            "code": "UC-P24", "name": "Khởi tạo phiên tư vấn từ xa",
            "desc": "Mở phiên tư vấn trực tuyến (Teleconsultation) tương ứng với lịch hẹn khám từ xa đã xác nhận.",
            "pre": "Lịch hẹn khám trực tuyến ở trạng thái CONFIRMED hoặc PAID.",
            "post": "Bản ghi ConsultationSession được tạo hoặc mở lại phiên hiện hữu.",
            "flow": "1. Vào chi tiết lịch hẹn khám từ xa.\n2. Bấm 'Vào phòng tư vấn'.\n3. Hệ thống tạo/mở phiên tư vấn và điều hướng vào giao diện chat/video.",
            "rel": "<<include>> UC-P12", "api": "consultations.controller.ts (POST /api/v1/consultations)", "ui": "Mobile: ConsultationHomeScreen.kt | Web: /tu-van", "status": "🟢"
        },
        {
            "code": "UC-P25", "name": "Xem danh sách phiên tư vấn",
            "desc": "Xem toàn bộ các cuộc tư vấn từ xa của bản thân (chờ bác sĩ tiếp nhận, đang hoạt động, hoàn tất).",
            "pre": "Đã đăng nhập.",
            "post": "Danh sách các cuộc tư vấn hiển thị kèm tên bác sĩ, chuyên khoa, thời gian.",
            "flow": "1. Chọn mục Tư vấn trực tuyến.\n2. Hệ thống tải danh sách phiên tư vấn.\n3. Bấm vào một phiên để tiếp tục trao đổi.",
            "rel": "Không", "api": "consultations.controller.ts (GET /api/v1/consultations)", "ui": "Mobile: ConsultationHomeScreen.kt | Web: /tu-van", "status": "🟢"
        },
        {
            "code": "UC-P26", "name": "Nhắn tin tư vấn thời gian thực",
            "desc": "Trao đổi tin nhắn tức thời với bác sĩ qua kênh WebSocket và lưu trữ lịch sử tin nhắn.",
            "pre": "Phiên tư vấn đang ở trạng thái ACCEPTED hoặc ACTIVE.",
            "post": "Tin nhắn được gửi đến bác sĩ ngay lập tức và lưu vào bảng ConsultationMessage.",
            "flow": "1. Nhập nội dung tin nhắn.\n2. Bấm Gửi (phát event qua WebSocket Gateway).\n3. Cập nhật tin nhắn lên khung chat của cả hai bên.",
            "rel": "<<include>> UC-P24", "api": "consultations.gateway.ts, consultations.controller.ts", "ui": "Mobile: ConsultationChatScreen.kt | Web: /tu-van/[id]", "status": "🟢"
        },
        {
            "code": "UC-P27", "name": "Gửi tệp đính kèm trong tư vấn",
            "desc": "Gửi hình ảnh kết quả xét nghiệm, đơn thuốc cũ hoặc tài liệu y tế trong phòng chat tư vấn.",
            "pre": "Phiên tư vấn đang mở.",
            "post": "Tệp được upload lên server và gửi link tải an toàn vào cuộc hội thoại.",
            "flow": "1. Bấm nút đính kèm tệp.\n2. Chọn ảnh/tệp từ máy tính hoặc điện thoại.\n3. Tải lên server và hiển thị tin nhắn tệp đính kèm.",
            "rel": "<<extend>> UC-P26", "api": "consultations.controller.ts (POST /:id/attachments)", "ui": "Mobile & Web Chat Attachment Dialog", "status": "🟢"
        },
        {
            "code": "UC-P28", "name": "Tham gia phòng gọi video trực tuyến",
            "desc": "Kết nối âm thanh và hình ảnh trực tiếp với bác sĩ thông qua phòng video WebRTC mã hóa của LiveKit.",
            "pre": "Phiên tư vấn đang hoạt động; thiết bị có quyền Camera & Microphone.",
            "post": "Kết nối thành công vào phòng gọi video thời gian thực.",
            "flow": "1. Bấm 'Gọi video' trong phiên tư vấn.\n2. Hệ thống cấp LiveKit Token an toàn.\n3. Kết nối vào LiveKit Room, hiển thị khung hình camera của bác sĩ và bệnh nhân.",
            "rel": "<<include>> UC-P24", "api": "consultation-video.controller.ts (POST /:id/join)", "ui": "Mobile: ConsultationVideoScreen.kt | Web: Video Room", "status": "🟢"
        },
        {
            "code": "UC-P29", "name": "Kết thúc / Hủy phiên tư vấn",
            "desc": "Xác nhận kết thúc buổi tư vấn hoặc hủy ca tư vấn khi có sự cố bất khả kháng.",
            "pre": "Phiên tư vấn đang mở.",
            "post": "Trạng thái phiên tư vấn chuyển thành COMPLETED hoặc CANCELLED.",
            "flow": "1. Bấm Kết thúc tư vấn.\n2. Xác nhận hoàn thành buổi làm việc.\n3. Hệ thống đóng phòng chat/video và cập nhật trạng thái.",
            "rel": "Không", "api": "consultations.controller.ts (PATCH /:id/complete, /cancel)", "ui": "Mobile & Web Consultation Actions", "status": "🟢"
        },
        {
            "code": "UC-P30", "name": "Xem Hộ chiếu sức khỏe điện tử (Medical Passport)",
            "desc": "Xem dòng thời gian lịch sử khám bệnh hợp nhất từ các cơ sở y tế (chẩn đoán, chỉ số sinh hiệu, đơn thuốc).",
            "pre": "Đã có dữ liệu khám bệnh đã phát hành.",
            "post": "Sổ sức khỏe điện tử hiển thị trực quan theo thứ tự thời gian.",
            "flow": "1. Mở Hộ chiếu sức khỏe.\n2. Hệ thống truy vấn toàn bộ lượt khám EMR đã liên kết.\n3. Hiển thị dòng thời gian các lần khám và kết quả.",
            "rel": "Không", "api": "medical-passport.controller.ts (GET /api/v1/passport)", "ui": "Mobile: PatientRecordBook.kt | Web: /lich-su-kham", "status": "🟢"
        },
        {
            "code": "UC-P31", "name": "Chia sẻ hồ sơ sức khỏe điện tử",
            "desc": "Tạo mã chia sẻ (Share Token / QR Code) có giới hạn thời gian (vd: 24h) để bác sĩ cơ sở khác truy cập.",
            "pre": "Đã chọn hồ sơ cần chia sẻ.",
            "post": "Hệ thống sinh mã token chia sẻ an toàn và ghi log kiểm toán.",
            "flow": "1. Chọn 'Chia sẻ hồ sơ'.\n2. Chọn phạm vi dữ liệu và thời hạn hiệu lực.\n3. Hệ thống sinh mã chia sẻ và mã QR để cung cấp cho bác sĩ.",
            "rel": "<<extend>> UC-P30", "api": "medical-passport.controller.ts (POST /share)", "ui": "Mobile: MedicalPassportShareDialog.kt", "status": "🟢"
        },
        {
            "code": "UC-P32", "name": "Thu hồi quyền chia sẻ hồ sơ sức khỏe",
            "desc": "Chủ động vô hiệu hóa mã chia sẻ hồ sơ trước khi hết hạn nhằm bảo vệ quyền riêng tư dữ liệu.",
            "pre": "Có mã chia sẻ đang ở trạng thái ACTIVE.",
            "post": "Mã chia sẻ bị thu hồi (REVOKED), người ngoài không thể truy cập được nữa.",
            "flow": "1. Vào danh sách các lượt chia sẻ.\n2. Chọn mã chia sẻ cần thu hồi.\n3. Bấm Thu hồi quyền truy cập.",
            "rel": "<<extend>> UC-P31", "api": "medical-passport.controller.ts (PATCH /share/:id/revoke)", "ui": "Mobile & Web Share Management", "status": "🟢"
        },
        {
            "code": "UC-P33", "name": "Quản lý quyền đồng ý chia sẻ liên viện (Consent)",
            "desc": "Cấp quyền (GRANT) hoặc thu hồi (REVOKE) việc liên thông dữ liệu y tế giữa các cơ sở đối tác.",
            "pre": "Đã đăng nhập.",
            "post": "Bản ghi PatientConsent được cập nhật trạng thái tương ứng.",
            "flow": "1. Mở Cài đặt quyền riêng tư dữ liệu.\n2. Xem danh sách bệnh viện được cấp quyền liên thông.\n3. Bật/tắt cấp quyền cho từng bệnh viện.",
            "rel": "Không", "api": "consent.controller.ts (/consents, /consents/:id/grant, /revoke)", "ui": "Mobile: RecordConsentPanel.kt | Web: Privacy Settings", "status": "🟢"
        },
        {
            "code": "UC-P34", "name": "Gửi đánh giá bác sĩ / Cơ sở y tế",
            "desc": "Chấm điểm số sao (1-5★), nhận xét chi tiết và đánh giá tiêu chí (thời gian chờ, tiếp đón, thái độ).",
            "pre": "Đã hoàn thành lượt khám (COMPLETED) và chưa đánh giá lượt khám này.",
            "post": "Bản ghi Review mới được tạo ở trạng thái PENDING/APPROVED; cập nhật điểm trung bình.",
            "flow": "1. Mở lịch khám đã hoàn thành.\n2. Bấm 'Đánh giá dịch vụ'.\n3. Chọn số sao, chấm điểm tiêu chí và nhập nhận xét.\n4. Bấm Gửi đánh giá.",
            "rel": "<<include>> UC-P12", "api": "reviews.controller.ts (POST /api/v1/reviews)", "ui": "Web: /danh-gia | Mobile: ReviewDialog", "status": "🟢"
        },
        {
            "code": "UC-P35", "name": "Chỉnh sửa đánh giá cá nhân",
            "desc": "Cập nhật lại nhận xét hoặc điểm số sao của bài đánh giá đã gửi trong thời gian quy định.",
            "pre": "Bài đánh giá thuộc về người dùng và chưa bị khóa chỉnh sửa.",
            "post": "Nội dung bài đánh giá được cập nhật mới.",
            "flow": "1. Vào mục Đánh giá của tôi.\n2. Chọn bài đánh giá cần sửa.\n3. Cập nhật nội dung và bấm Lưu.",
            "rel": "<<extend>> UC-P34", "api": "reviews.controller.ts (PUT /api/v1/reviews/:id)", "ui": "Web: /danh-gia", "status": "🟢"
        },
        {
            "code": "UC-P36", "name": "Báo cáo đánh giá vi phạm",
            "desc": "Gửi báo cáo lên ban quản trị nếu phát hiện bài đánh giá chứa từ ngữ xúc phạm hoặc sai sự thật.",
            "pre": "Bài đánh giá đang hiển thị công khai.",
            "post": "Bản ghi ReviewReport được tạo gửi đến hàng đợi kiểm duyệt của Super Admin.",
            "flow": "1. Bấm Báo cáo vi phạm tại bài đánh giá.\n2. Chọn lý do báo cáo (Spam, Xúc phạm, Sai sự thật).\n3. Bấm Gửi báo cáo.",
            "rel": "Không", "api": "reviews.controller.ts (POST /:id/report)", "ui": "Web & Mobile Report Dialog", "status": "🟢"
        },
        {
            "code": "UC-P37", "name": "Xem danh sách thông báo hệ thống",
            "desc": "Xem toàn bộ các thông báo: xác nhận lịch hẹn, nhắc giờ khám, thanh toán thành công, tin nhắn tư vấn mới.",
            "pre": "Đã đăng nhập.",
            "post": "Danh sách thông báo hiển thị theo thời gian từ mới đến cũ.",
            "flow": "1. Bấm vào biểu tượng Quả chuông thông báo.\n2. Hệ thống tải danh sách thông báo cá nhân.\n3. Bấm vào một thông báo để điều hướng đến chi tiết liên quan.",
            "rel": "Không", "api": "notifications.controller.ts (GET /api/v1/notifications)", "ui": "Mobile: NotificationScreen.kt | Web: /thong-bao", "status": "🟢"
        },
        {
            "code": "UC-P38", "name": "Đánh dấu thông báo đã đọc",
            "desc": "Đánh dấu một thông báo cụ thể hoặc toàn bộ thông báo là đã đọc để xóa biểu tượng số lượng chưa đọc.",
            "pre": "Có thông báo chưa đọc.",
            "post": "Cờ isRead được cập nhật thành true; badge số lượng chưa đọc giảm về 0.",
            "flow": "1. Mở danh sách thông báo.\n2. Bấm 'Đánh dấu tất cả đã đọc' hoặc bấm vào từng thông báo.\n3. Cập nhật trạng thái trên giao diện.",
            "rel": "Không", "api": "notifications.controller.ts (PATCH /:id/read, /read-all)", "ui": "Mobile: NotificationScreen.kt | Web: /thong-bao", "status": "🟢"
        },
        {
            "code": "UC-P39", "name": "Đăng ký thiết bị nhận thông báo đẩy (FCM)",
            "desc": "Lưu Device Registration Token của Firebase Cloud Messaging lên server để nhận push notification.",
            "pre": "Đăng nhập app trên điện thoại Android.",
            "post": "Token thiết bị được lưu hoặc cập nhật vào bảng UserDevice.",
            "flow": "1. Ứng dụng khởi động và lấy FCM Token từ Firebase SDK.\n2. Gửi token kèm loại thiết bị lên API server.\n3. Server lưu token phục vụ gửi thông báo ngầm.",
            "rel": "Không", "api": "notifications.controller.ts (POST /register-device)", "ui": "Mobile: App Startup background process", "status": "🟢"
        }
    ]
    render_actor_usecases("ACT-02", "Người bệnh / Bệnh nhân (Patient)", patient_ucs)

    # ── 3.3. BÁC SĨ (DOCTOR)
    doctor_ucs = [
        {
            "code": "UC-D01", "name": "Đăng nhập & Xác thực bác sĩ",
            "desc": "Bác sĩ sử dụng tài khoản được cấp quyền vai trò DOCTOR để đăng nhập vào cổng làm việc.",
            "pre": "Tài khoản bác sĩ đã được kích hoạt trên hệ thống.",
            "post": "Hệ thống cấp token có claim role DOCTOR và điều hướng vào không gian làm việc bác sĩ.",
            "flow": "1. Bác sĩ nhập tài khoản và mật khẩu.\n2. Hệ thống kiểm tra vai trò DOCTOR.\n3. Cấp JWT Token và điều hướng.",
            "rel": "Không", "api": "auth.controller.ts (/login)", "ui": "Web: /dang-nhap | Mobile: LoginScreen.kt", "status": "🟢"
        },
        {
            "code": "UC-D02", "name": "Quản lý thông tin & Lịch biểu công tác",
            "desc": "Xem hồ sơ chuyên môn, cập nhật số điện thoại liên hệ và xem phân công ca trực tại các bệnh viện.",
            "pre": "Đã đăng nhập vai trò DOCTOR.",
            "post": "Lịch công tác theo tuần/tháng được hiển thị rõ ràng.",
            "flow": "1. Vào trang Quản lý cá nhân.\n2. Xem các cơ sở đang công tác và lịch trực.\n3. Cập nhật thông tin khi cần.",
            "rel": "Không", "api": "doctors.controller.ts, doctor-schedules.controller.ts", "ui": "Web Portal Bác sĩ", "status": "🟢"
        },
        {
            "code": "UC-D03", "name": "Xem danh sách phiên tư vấn được phân công",
            "desc": "Xem danh sách các ca tư vấn từ xa mà bệnh nhân đã đặt hẹn với bác sĩ theo từng trạng thái.",
            "pre": "Đã đăng nhập vai trò DOCTOR.",
            "post": "Danh sách các phiên tư vấn hiển thị kèm thông tin người bệnh và thời gian hẹn.",
            "flow": "1. Mở mục Hộp thư tư vấn từ xa.\n2. Hệ thống lọc các phiên thuộc về doctorId hiện tại.\n3. Chọn một phiên để xem chi tiết.",
            "rel": "Không", "api": "consultations.controller.ts (GET /api/v1/consultations)", "ui": "Web: /tu-van | Mobile: ConsultationHomeScreen.kt", "status": "🟢"
        },
        {
            "code": "UC-D04", "name": "Xem chi tiết phiên tư vấn & Hồ sơ bệnh nhân",
            "desc": "Xem triệu chứng sơ bộ, kết quả sàng lọc AI (nếu có) và tiền sử bệnh án trước khi tư vấn.",
            "pre": "Phiên tư vấn thuộc quyền phụ trách của bác sĩ.",
            "post": "Toàn bộ thông tin bệnh sử và lý do tư vấn được hiển thị.",
            "flow": "1. Mở chi tiết phiên tư vấn.\n2. Hệ thống tải thông tin bệnh nhân, lịch hẹn và phiên sàng lọc AI liên quan.\n3. Bác sĩ nắm bắt bệnh sử.",
            "rel": "Không", "api": "consultations.controller.ts (GET /:id)", "ui": "Web & Mobile Consultation Detail", "status": "🟢"
        },
        {
            "code": "UC-D05", "name": "Tiếp nhận phiên tư vấn (Accept)",
            "desc": "Bác sĩ xác nhận đồng ý tiếp nhận ca tư vấn từ xa của người bệnh.",
            "pre": "Phiên tư vấn đang ở trạng thái PENDING.",
            "post": "Trạng thái phiên chuyển sang ACCEPTED; thông báo gửi đến người bệnh.",
            "flow": "1. Bác sĩ bấm 'Tiếp nhận ca tư vấn'.\n2. Hệ thống cập nhật trạng thái CSDL.\n3. Gửi thông báo đến người bệnh.",
            "rel": "Không", "api": "consultations.controller.ts (PATCH /:id/accept)", "ui": "Web & Mobile Consultation Actions", "status": "🟢"
        },
        {
            "code": "UC-D06", "name": "Bắt đầu phiên tư vấn (Start Active)",
            "desc": "Kích hoạt phiên tư vấn sang trạng thái ACTIVE để mở phòng trao đổi thời gian thực.",
            "pre": "Phiên tư vấn ở trạng thái ACCEPTED.",
            "post": "Phiên chuyển sang ACTIVE, mở kết nối phòng chat và gọi video.",
            "flow": "1. Đến giờ hẹn, bác sĩ bấm 'Bắt đầu tư vấn'.\n2. Hệ thống chuyển trạng thái sang ACTIVE.",
            "rel": "Không", "api": "consultations.controller.ts (PATCH /:id/start)", "ui": "Web & Mobile Consultation Actions", "status": "🟢"
        },
        {
            "code": "UC-D07", "name": "Nhắn tin & Nhận tệp trong phiên tư vấn",
            "desc": "Trao đổi hướng dẫn chăm sóc, dặn dò đơn thuốc và xem ảnh xét nghiệm do người bệnh gửi.",
            "pre": "Phiên tư vấn đang ở trạng thái ACTIVE.",
            "post": "Tin nhắn và lời dặn của bác sĩ được gửi tức thời đến người bệnh.",
            "flow": "1. Nhập tin nhắn hướng dẫn chuyên môn.\n2. Bấm Gửi qua WebSocket.\n3. Xem các tệp hình ảnh người bệnh đính kèm.",
            "rel": "Không", "api": "consultations.gateway.ts, consultations.controller.ts", "ui": "Mobile: ConsultationChatScreen.kt | Web: /tu-van/[id]", "status": "🟢"
        },
        {
            "code": "UC-D08", "name": "Tham gia phòng gọi video tư vấn từ xa",
            "desc": "Bác sĩ nhận token LiveKit và tham gia phòng gọi video WebRTC trực tuyến với người bệnh.",
            "pre": "Phiên tư vấn ở trạng thái ACTIVE; camera/mic hoạt động bình thường.",
            "post": "Kết nối thành công vào phòng gọi video mã hóa.",
            "flow": "1. Bác sĩ bấm 'Mở phòng video'.\n2. Hệ thống cấp JWT token LiveKit vai trò Bác sĩ.\n3. Bắt đầu phiên gọi khám từ xa.",
            "rel": "Không", "api": "consultation-video.controller.ts (POST /:id/join)", "ui": "Web & Mobile Video Screen", "status": "🟢"
        },
        {
            "code": "UC-D09", "name": "Hoàn tất ca tư vấn từ xa",
            "desc": "Kết thúc buổi tư vấn, lưu biên bản tóm tắt dặn dò điều trị và đóng phòng giao tiếp.",
            "pre": "Phiên tư vấn đang hoạt động.",
            "post": "Phiên chuyển trạng thái COMPLETED; lịch hẹn liên quan hoàn thành.",
            "flow": "1. Bác sĩ bấm Hoàn tất tư vấn.\n2. Nhập ghi chú kết luận hoặc lời dặn.\n3. Xác nhận đóng phiên.",
            "rel": "Không", "api": "consultations.controller.ts (PATCH /:id/complete)", "ui": "Web & Mobile Consultation Actions", "status": "🟢"
        },
        {
            "code": "UC-D10", "name": "Xem chi tiết ca khám lâm sàng (EMR Encounter)",
            "desc": "Mở hồ sơ bệnh án điện tử của người bệnh tương ứng với lịch khám tại bệnh viện.",
            "pre": "Bác sĩ được phân công khám ca này.",
            "post": "Thông tin hành chính và tiền sử bệnh của người khám được hiển thị.",
            "flow": "1. Mở danh sách bệnh nhân chờ khám.\n2. Bấm vào một ca khám cụ thể.\n3. Hệ thống tải dữ liệu lượt khám lâm sàng (Encounter).",
            "rel": "Không", "api": "clinical.controller.ts (GET /encounters/:id)", "ui": "Web Portal Khám bệnh", "status": "🟢"
        },
        {
            "code": "UC-D11", "name": "Nhập chẩn đoán bệnh theo chuẩn ICD-10",
            "desc": "Ghi nhận mã chẩn đoán chính và các chẩn đoán phụ theo bảng mã phân loại bệnh tật quốc tế ICD-10.",
            "pre": "Lượt khám lâm sàng đang ở trạng thái IN_PROGRESS.",
            "post": "Bản ghi Diagnosis mới được tạo liên kết với Encounter.",
            "flow": "1. Bác sĩ tìm kiếm tên bệnh hoặc mã ICD-10.\n2. Chọn mã chẩn đoán và phân loại (Chính / Phụ).\n3. Bấm Lưu chẩn đoán.",
            "rel": "<<include>> UC-D10", "api": "clinical.controller.ts (POST /encounters/:id/diagnoses)", "ui": "Web Portal Khám bệnh EMR", "status": "🟢"
        },
        {
            "code": "UC-D12", "name": "Ghi nhận chỉ số sinh hiệu & Quan sát",
            "desc": "Nhập các chỉ số huyết áp, mạch, nhiệt độ, nhịp thở, SpO2, chiều cao, cân nặng và nhận xét khám lâm sàng.",
            "pre": "Lượt khám đang mở.",
            "post": "Các bản ghi ObservationCategory (VITAL_SIGNS, CLINICAL) được lưu vào CSDL.",
            "flow": "1. Nhập các chỉ số sinh hiệu thu được.\n2. Nhập nhận xét khám thực thể các cơ quan.\n3. Bấm Lưu quan sát lâm sàng.",
            "rel": "<<include>> UC-D10", "api": "clinical.controller.ts (POST /encounters/:id/observations)", "ui": "Web Portal Khám bệnh EMR", "status": "🟢"
        },
        {
            "code": "UC-D13", "name": "Kê đơn thuốc điện tử",
            "desc": "Tạo đơn thuốc điện tử: chọn tên thuốc, hàm lượng, số lượng, đường dùng, liều dùng và lời dặn.",
            "pre": "Đã có chẩn đoán bệnh.",
            "post": "Bản ghi Prescription và PrescriptionItem được lưu vào CSDL.",
            "flow": "1. Bấm Kê đơn thuốc.\n2. Thêm từng loại thuốc, số lượng và liều dùng.\n3. Nhập lời dặn tái khám và bấm Hoàn tất đơn thuốc.",
            "rel": "<<include>> UC-D10", "api": "clinical.controller.ts (POST /encounters/:id/prescriptions, /items)", "ui": "Web Portal Khám bệnh EMR", "status": "🟢"
        },
        {
            "code": "UC-D14", "name": "Hoàn tất ca khám lâm sàng",
            "desc": "Khóa hồ sơ bệnh án điện tử của ca khám, đánh dấu hoàn thành lượt khám bệnh.",
            "pre": "Đã có chẩn đoán và hướng xử lý/kê đơn.",
            "post": "Trạng thái Encounter chuyển sang COMPLETED; lịch hẹn hoàn tất.",
            "flow": "1. Bác sĩ rà soát toàn bộ bệnh án.\n2. Bấm 'Hoàn tất ca khám'.\n3. Hệ thống khóa chỉnh sửa và cập nhật trạng thái.",
            "rel": "Không", "api": "clinical.controller.ts (PATCH /encounters/:id/complete)", "ui": "Web Portal Khám bệnh EMR", "status": "🟢"
        },
        {
            "code": "UC-D15", "name": "Phát hành bệnh án vào Hộ chiếu sức khỏe",
            "desc": "Đẩy kết quả lượt khám đã hoàn tất vào Medical Passport của bệnh nhân để hỗ trợ liên viện.",
            "pre": "Lượt khám đã hoàn tất (COMPLETED).",
            "post": "Dữ liệu được phát hành công khai vào sổ sức khỏe cá nhân của người bệnh.",
            "flow": "1. Bác sĩ bấm 'Phát hành vào Sổ sức khỏe'.\n2. Hệ thống chuyển cờ published = true.\n3. Bệnh nhân có thể thấy lượt khám trong Hộ chiếu sức khỏe.",
            "rel": "<<extend>> UC-D14", "api": "clinical.controller.ts (PATCH /encounters/:id/publish)", "ui": "Web Portal Khám bệnh EMR", "status": "🟢"
        },
        {
            "code": "UC-D16", "name": "Tra cứu hồ sơ liên viện qua mã chia sẻ",
            "desc": "Bác sĩ nhập mã token chia sẻ do bệnh nhân cung cấp để xem tiền sử khám tại các bệnh viện khác.",
            "pre": "Có mã token chia sẻ còn hạn hiệu lực.",
            "post": "Dữ liệu tóm tắt bệnh án từ các bệnh viện liên thông được hiển thị an toàn.",
            "flow": "1. Bác sĩ nhập Share Token của người bệnh.\n2. Hệ thống xác thực tính hợp lệ và thời hạn token.\n3. Hiển thị lịch sử khám liên viện.",
            "rel": "Không", "api": "medical-passport.controller.ts (GET /share/:token)", "ui": "Web: Tra cứu bệnh án", "status": "🟢"
        },
        {
            "code": "UC-D17", "name": "Phản hồi đánh giá của người bệnh",
            "desc": "Bác sĩ gửi phản hồi hoặc lời cảm ơn chính thức đối với các bình luận đánh giá của bệnh nhân.",
            "pre": "Bài đánh giá công khai thuộc về chính bác sĩ.",
            "post": "Bản ghi ReviewResponse được lưu và hiển thị công khai bên dưới đánh giá.",
            "flow": "1. Bác sĩ xem đánh giá gửi cho mình.\n2. Nhập nội dung phản hồi.\n3. Bấm Đăng phản hồi.",
            "rel": "Không", "api": "reviews.controller.ts (POST /:id/responses)", "ui": "Web Portal Bác sĩ", "status": "🟢"
        }
    ]
    render_actor_usecases("ACT-03", "Bác sĩ (Doctor)", doctor_ucs)

    # ── 3.4. QUẢN TRỊ CƠ SỞ Y TẾ (HOSPITAL ADMIN)
    hospital_admin_ucs = [
        {
            "code": "UC-HA01", "name": "Kích hoạt tài khoản quản trị cơ sở",
            "desc": "Quản trị viên viện mở link kích hoạt gửi qua Email, xác thực token bảo mật và đặt mật khẩu lần đầu.",
            "pre": "Được Super Admin tạo tài khoản và gửi email kích hoạt.",
            "post": "Tài khoản chuyển sang trạng thái ACTIVE, mật khẩu mới được lưu an toàn.",
            "flow": "1. Mở email, bấm link kích hoạt.\n2. Hệ thống kiểm tra activation token.\n3. Nhập mật khẩu mới và xác nhận kích hoạt.",
            "rel": "Không", "api": "auth.controller.ts (/verify-activation-token, /activate-hospital-account)", "ui": "Web Activation Page", "status": "🟢"
        },
        {
            "code": "UC-HA02", "name": "Đăng nhập cổng Quản trị cơ sở y tế",
            "desc": "Đăng nhập hệ thống bằng tài khoản vai trò HOSPITAL_ADMIN để truy cập portal quản lý bệnh viện.",
            "pre": "Tài khoản đã kích hoạt và đang ACTIVE.",
            "post": "Hệ thống cấp JWT Token phạm vi quản lý hospitalId tương ứng.",
            "flow": "1. Nhập email/SĐT và mật khẩu.\n2. Hệ thống xác thực vai trò HOSPITAL_ADMIN.\n3. Điều hướng vào /hospital-admin.",
            "rel": "Không", "api": "auth.controller.ts (/login)", "ui": "Web: /dang-nhap", "status": "🟢"
        },
        {
            "code": "UC-HA03", "name": "Xem Dashboard vận hành cơ sở",
            "desc": "Thống kê số lượng lịch khám hôm nay, doanh thu ước tính, tỷ lệ tiếp đón và biểu đồ trạng thái lịch khám.",
            "pre": "Đã đăng nhập vai trò HOSPITAL_ADMIN.",
            "post": "Các số liệu thống kê trong phạm vi cơ sở được tổng hợp và hiển thị trực quan.",
            "flow": "1. Vào Dashboard cơ sở y tế.\n2. Hệ thống truy vấn số liệu lịch hẹn, bệnh nhân theo cơ sở.\n3. Hiển thị các widget KPI và biểu đồ.",
            "rel": "Không", "api": "hospital-admin.controller.ts (GET /dashboard)", "ui": "Web: /hospital-admin", "status": "🟢"
        },
        {
            "code": "UC-HA04", "name": "Xem & Cập nhật hồ sơ cơ sở y tế",
            "desc": "Cập nhật thông tin giới thiệu bệnh viện, địa chỉ, số điện thoại hotline, giờ tiếp nhận và ảnh bìa.",
            "pre": "Đã đăng nhập vai trò HOSPITAL_ADMIN.",
            "post": "Thông tin cơ sở trong bảng Hospital được cập nhật mới trên cổng công khai.",
            "flow": "1. Mở trang Thông tin cơ sở.\n2. Thay đổi thông tin hotline, giờ làm việc, địa chỉ.\n3. Bấm Lưu cập nhật.",
            "rel": "Không", "api": "hospital-admin.controller.ts (GET/PUT /my-hospital)", "ui": "Web: /hospital-admin/hospital-info", "status": "🟢"
        },
        {
            "code": "UC-HA05", "name": "Quản lý bác sĩ tại cơ sở",
            "desc": "Xem danh sách bác sĩ công tác tại viện, điều chỉnh giá khám riêng, kích hoạt hoặc tạm dừng công tác.",
            "pre": "Đã đăng nhập vai trò HOSPITAL_ADMIN.",
            "post": "Bản ghi DoctorWorkplace được cập nhật trạng thái và mức giá khám.",
            "flow": "1. Mở danh mục Bác sĩ cơ sở.\n2. Chọn bác sĩ cần điều chỉnh.\n3. Thay đổi giá khám hoặc trạng thái hoạt động.\n4. Bấm Lưu.",
            "rel": "Không", "api": "hospital-admin.controller.ts (GET /doctors, PATCH /doctors/:workplaceId)", "ui": "Web: /hospital-admin/doctors", "status": "🟢"
        },
        {
            "code": "UC-HA06", "name": "Quản lý ca trực & Suất khám của bác sĩ",
            "desc": "Theo dõi lịch làm việc, ca khám định kỳ và phân bổ số lượng bệnh nhân tối đa trên mỗi khung giờ.",
            "pre": "Đã đăng nhập vai trò HOSPITAL_ADMIN.",
            "post": "Lịch trực và danh sách suất khám (slots) được hiển thị và điều chỉnh.",
            "flow": "1. Mở mục Lịch làm việc.\n2. Chọn bác sĩ và tuần làm việc.\n3. Xem và điều chỉnh các khung giờ tiếp nhận bệnh nhân.",
            "rel": "Không", "api": "hospital-admin.controller.ts (GET /schedules)", "ui": "Web: /hospital-admin/schedules", "status": "🟢"
        },
        {
            "code": "UC-HA07", "name": "Quản lý chuyên khoa & Dịch vụ cơ sở",
            "desc": "Bật/tắt các chuyên khoa tiếp nhận và cấu hình giá các dịch vụ khám, xét nghiệm niêm yết tại viện.",
            "pre": "Đã đăng nhập vai trò HOSPITAL_ADMIN.",
            "post": "Trạng thái và bảng giá dịch vụ của cơ sở được cập nhật.",
            "flow": "1. Mở danh mục Dịch vụ & Chuyên khoa.\n2. Bật/tắt dịch vụ hoặc điều chỉnh mức giá niêm yết.\n3. Xác nhận lưu thay đổi.",
            "rel": "Không", "api": "hospital-admin.controller.ts (GET /specialties, GET/PATCH /services/:id)", "ui": "Web: /hospital-admin/services", "status": "🟢"
        },
        {
            "code": "UC-HA08", "name": "Quản lý danh sách lịch hẹn tại cơ sở",
            "desc": "Xem toàn bộ lịch hẹn khám bệnh tại bệnh viện, lọc theo ngày khám, chuyên khoa, bác sĩ và trạng thái.",
            "pre": "Đã đăng nhập vai trò HOSPITAL_ADMIN.",
            "post": "Danh sách lịch hẹn được lọc chính xác theo các tiêu chí.",
            "flow": "1. Vào mục Quản lý lịch hẹn.\n2. Chọn ngày khám hoặc bác sĩ phụ trách.\n3. Xem danh sách bệnh nhân và trạng thái phiếu khám.",
            "rel": "Không", "api": "hospital-admin.controller.ts (GET /appointments)", "ui": "Web: /hospital-admin/appointments", "status": "🟢"
        },
        {
            "code": "UC-HA09", "name": "Tiếp đón & Check-in người bệnh",
            "desc": "Quét mã phiếu khám hoặc tìm kiếm tên bệnh nhân để thực hiện Check-in khi bệnh nhân có mặt tại viện.",
            "pre": "Phiếu khám ở trạng thái CONFIRMED hoặc PAID; đúng ngày hẹn khám.",
            "post": "Trạng thái lịch chuyển sang CHECKED_IN; ghi nhận thời điểm tiếp đón thực tế.",
            "flow": "1. Tiếp nhận người bệnh tại quầy tiếp đón.\n2. Nhập mã đặt lịch hoặc quét mã QR trên phiếu khám.\n3. Bấm 'Xác nhận tiếp đón (Check-in)'.",
            "rel": "Không", "api": "hospital-admin.controller.ts (PATCH /appointments/:id/check-in)", "ui": "Web: /hospital-admin/appointments", "status": "🟢"
        },
        {
            "code": "UC-HA10", "name": "Quản lý vắng mặt (No-Show)",
            "desc": "Kiểm tra điều kiện và đánh dấu trạng thái vắng mặt đối với bệnh nhân không đến khám quá giờ quy định.",
            "pre": "Quá giờ hẹn khám theo chính sách bệnh viện và bệnh nhân chưa check-in.",
            "post": "Trạng thái lịch chuyển sang NO_SHOW; suất khám được giải phóng.",
            "flow": "1. Hệ thống lọc danh sách ca quá giờ chưa đến.\n2. Quản trị viên kiểm tra điều kiện no-show eligibility.\n3. Bấm đánh dấu Vắng mặt (No-Show).",
            "rel": "Không", "api": "hospital-admin.controller.ts (GET /no-show-eligibility, PATCH /status)", "ui": "Web: /hospital-admin/appointments", "status": "🟢"
        },
        {
            "code": "UC-HA11", "name": "Khôi phục lịch vắng mặt (Revert No-Show)",
            "desc": "Hoàn tác trạng thái vắng mặt khi bệnh nhân đến muộn có lý do chính đáng và được chấp thuận tiếp đón.",
            "pre": "Lịch hẹn đang ở trạng thái NO_SHOW.",
            "post": "Trạng thái lịch được khôi phục về CONFIRMED hoặc CHECKED_IN.",
            "flow": "1. Mở chi tiết ca bị đánh dấu vắng mặt.\n2. Chọn Khôi phục tiếp đón.\n3. Nhập lý do khôi phục và xác nhận.",
            "rel": "<<extend>> UC-HA10", "api": "hospital-admin.controller.ts (PATCH /appointments/:id/revert-no-show)", "ui": "Web: /hospital-admin/appointments", "status": "🟢"
        },
        {
            "code": "UC-HA12", "name": "Ghi nhận nhật ký liên lạc người bệnh",
            "desc": "Lưu lịch sử nhân viên bệnh viện gọi điện thoại nhắc lịch hoặc thông báo sự cố đổi phòng khám.",
            "pre": "Lịch hẹn tồn tại trong hệ thống.",
            "post": "Bản ghi ContactLog được lưu kèm nội dung trao đổi, thời gian và người thực hiện.",
            "flow": "1. Chọn Ghi nhận liên hệ tại lịch hẹn.\n2. Nhập phương thức (Gọi điện / SMS) và kết quả liên lạc.\n3. Bấm Lưu nhật ký liên lạc.",
            "rel": "Không", "api": "hospital-admin.controller.ts (POST /appointments/:id/contact-logs)", "ui": "Web: Contact Log Dialog", "status": "🟢"
        },
        {
            "code": "UC-HA13", "name": "Kiểm tra kết nối bắt tay với HIS (Test Handshake)",
            "desc": "Kiểm tra tình trạng thông mạng và tính hợp lệ của khóa bảo mật API kết nối với cổng HIS bệnh viện.",
            "pre": "Đã cấu hình HIS Endpoint và API Key trong cơ sở dữ liệu.",
            "post": "Kết quả kiểm tra (SUCCESS / FAILED) kèm thời gian trễ phản hồi được hiển thị.",
            "flow": "1. Mở trang Cấu hình liên thông HIS.\n2. Bấm 'Kiểm tra kết nối (Handshake)'.\n3. Hệ thống gửi request probe đến HIS server và trả về kết quả.",
            "rel": "Không", "api": "hospital-admin.controller.ts (POST /integration/test-handshake)", "ui": "Web: /hospital-admin/integration", "status": "🟢"
        },
        {
            "code": "UC-HA14", "name": "Đồng bộ danh mục khoa phòng & Bác sĩ từ HIS",
            "desc": "Thực hiện đồng bộ dữ liệu khoa phòng, bác sĩ và lịch trực từ phần mềm HIS nội bộ lên NovaCare.",
            "pre": "Kết nối Handshake thành công.",
            "post": "Dữ liệu danh mục trên NovaCare được cập nhật đồng nhất với CSDL HIS.",
            "flow": "1. Bấm 'Đồng bộ danh mục ngay'.\n2. Hệ thống gọi API HIS lấy danh sách khoa/bác sĩ.\n3. Chuẩn hóa dữ liệu và cập nhật vào bảng CSDL NovaCare.",
            "rel": "<<include>> UC-HA13", "api": "hospital-admin.controller.ts (POST /integration/sync-catalog)", "ui": "Web: /hospital-admin/integration", "status": "🟢"
        },
        {
            "code": "UC-HA15", "name": "Phản hồi đánh giá cơ sở y tế",
            "desc": "Đại diện cơ sở y tế gửi thông điệp tiếp thu phản hồi hoặc giải trình cho các ý kiến đóng góp của người bệnh.",
            "pre": "Bài đánh giá công khai thuộc về cơ sở y tế hiện tại.",
            "post": "Bản ghi phản hồi được đăng tải công khai bên dưới nhận xét của người bệnh.",
            "flow": "1. Vào mục Quản lý đánh giá cơ sở.\n2. Chọn nhận xét cần trả lời.\n3. Nhập nội dung phản hồi đại diện cơ sở và gửi.",
            "rel": "Không", "api": "reviews.controller.ts (POST /:id/responses)", "ui": "Web: Quản lý đánh giá", "status": "🟢"
        }
    ]
    render_actor_usecases("ACT-04", "Quản trị viên cơ sở y tế (Hospital Admin)", hospital_admin_ucs)

    # ── 3.5. QUẢN TRỊ VIÊN HỆ THỐNG (SUPER ADMIN)
    super_admin_ucs = [
        {
            "code": "UC-A01", "name": "Xem Dashboard phân tích toàn hệ thống",
            "desc": "Thống kê tổng thể: tổng lượt khám, doanh thu theo tháng, biểu đồ trạng thái, top bác sĩ/cơ sở uy tín.",
            "pre": "Đã đăng nhập vai trò ADMIN.",
            "post": "Toàn bộ chỉ số KPI vĩ mô của hệ thống được hiển thị trực quan.",
            "flow": "1. Đăng nhập cổng quản trị Super Admin.\n2. Hệ thống truy vấn dữ liệu từ PostgreSQL.\n3. Hiển thị Dashboard phân tích đa chiều.",
            "rel": "Không", "api": "admin-dashboard.controller.ts (/overview, /appointments-by-day...)", "ui": "Web: /admin", "status": "🟢"
        },
        {
            "code": "UC-A02", "name": "Quản lý danh sách & Trạng thái người dùng",
            "desc": "Xem toàn bộ người dùng, tìm kiếm theo email/SĐT, thực hiện khóa (LOCK) hoặc mở khóa tài khoản.",
            "pre": "Đã đăng nhập vai trò ADMIN.",
            "post": "Trạng thái tài khoản (ACTIVE, LOCKED) được cập nhật ngay lập tức.",
            "flow": "1. Vào mục Quản lý người dùng.\n2. Tìm kiếm người dùng theo tiêu chí.\n3. Bấm Khóa hoặc Mở khóa tài khoản.",
            "rel": "Không", "api": "admin-users.controller.ts (GET, PATCH /:id/status)", "ui": "Web: /admin/users", "status": "🟢"
        },
        {
            "code": "UC-A03", "name": "Phân quyền vai trò người dùng (RBAC)",
            "desc": "Thay đổi quyền hạn vai trò (PATIENT, DOCTOR, HOSPITAL_ADMIN, ADMIN) của một tài khoản.",
            "pre": "Đã đăng nhập vai trò ADMIN.",
            "post": "Role trong bảng User được cập nhật, token tiếp theo sẽ mang quyền mới.",
            "flow": "1. Chọn người dùng cần phân quyền.\n2. Chọn vai trò mới từ danh sách Role.\n3. Xác nhận cập nhật quyền hạn.",
            "rel": "Không", "api": "admin-users.controller.ts (PATCH /:id/role)", "ui": "Web: /admin/users/roles", "status": "🟢"
        },
        {
            "code": "UC-A04", "name": "Khởi tạo tài khoản Quản trị cơ sở y tế",
            "desc": "Tạo thủ công tài khoản HOSPITAL_ADMIN và gán quyền quản lý một bệnh viện cụ thể.",
            "pre": "Bệnh viện đã tồn tại trong CSDL.",
            "post": "Tài khoản quản trị viện được tạo và gửi email kích hoạt.",
            "flow": "1. Bấm Thêm Quản trị viên cơ sở.\n2. Nhập email, họ tên, chọn bệnh viện trực thuộc.\n3. Hệ thống tạo tài khoản và tự động gửi email kích hoạt.",
            "rel": "<<extend>> UC-A02", "api": "admin-users.controller.ts (POST /hospital-admin)", "ui": "Web: /admin/users", "status": "🟢"
        },
        {
            "code": "UC-A05", "name": "Quản lý danh mục Cơ sở y tế toàn quốc",
            "desc": "Thêm mới, chỉnh sửa thông tin, phê duyệt hoặc xóa cơ sở y tế (Bệnh viện, Phòng khám) trên hệ thống.",
            "pre": "Đã đăng nhập vai trò ADMIN.",
            "post": "Bản ghi Hospital được tạo mới, cập nhật hoặc xóa trong CSDL.",
            "flow": "1. Vào mục Quản lý Cơ sở y tế.\n2. Nhập thông tin bệnh viện, địa chỉ, giấy phép, tọa độ GPS.\n3. Bấm Lưu cơ sở y tế.",
            "rel": "Không", "api": "admin-hospitals.controller.ts (GET, POST, PATCH, DELETE)", "ui": "Web: /admin/hospitals", "status": "🟢"
        },
        {
            "code": "UC-A06", "name": "Quản lý danh mục Bác sĩ toàn hệ thống",
            "desc": "Thêm mới hồ sơ bác sĩ, phân công nơi làm việc, thiết lập ca trực và cấp tài khoản đăng nhập.",
            "pre": "Đã đăng nhập vai trò ADMIN.",
            "post": "Bản ghi Doctor và tài khoản tương ứng được tạo lập và liên kết.",
            "flow": "1. Vào mục Quản lý Bác sĩ.\n2. Điền thông tin học vị, chuyên khoa, giới thiệu.\n3. Phân công nơi làm việc và cấp tài khoản.",
            "rel": "Không", "api": "admin-doctors.controller.ts (GET, POST, PATCH, DELETE)", "ui": "Web: /admin/doctors", "status": "🟢"
        },
        {
            "code": "UC-A07", "name": "Quản lý danh mục Chuyên khoa toàn quốc",
            "desc": "Tạo mới, chỉnh sửa, tải ảnh đại diện và bật/tắt hiển thị danh mục chuyên khoa chuẩn hóa.",
            "pre": "Đã đăng nhập vai trò ADMIN.",
            "post": "Danh mục chuyên khoa chuẩn được cập nhật trong CSDL.",
            "flow": "1. Mở danh mục Chuyên khoa.\n2. Thêm chuyên khoa mới (tên, mô tả, icon).\n3. Bấm Lưu chuyên khoa.",
            "rel": "Không", "api": "admin-specialties.controller.ts", "ui": "Web: /admin/specialties", "status": "🟢"
        },
        {
            "code": "UC-A08", "name": "Quản lý Gói khám & Dịch vụ y tế dùng chung",
            "desc": "Tạo các gói khám sức khỏe tổng quát mẫu, danh mục dịch vụ cận lâm sàng chuẩn cho toàn hệ thống.",
            "pre": "Đã đăng nhập vai trò ADMIN.",
            "post": "Gói khám và dịch vụ y tế mẫu được lưu và có thể áp dụng cho các viện.",
            "flow": "1. Mở mục Quản lý Gói khám / Dịch vụ.\n2. Thiết lập cấu hình gói khám, chi tiết hạng mục khám.\n3. Bấm Lưu và phát hành.",
            "rel": "Không", "api": "admin-health-packages.controller.ts, admin-medical-services.controller.ts", "ui": "Web: /admin/health-packages", "status": "🟢"
        },
        {
            "code": "UC-A09", "name": "Quản lý lịch hẹn & Điều phối toàn hệ thống",
            "desc": "Tra cứu toàn bộ lịch hẹn trên toàn quốc, can thiệp xử lý các ca khiếu nại, hủy lịch khẩn cấp.",
            "pre": "Đã đăng nhập vai trò ADMIN.",
            "post": "Trạng thái lịch hẹn được điều chỉnh theo quyết định của ban quản trị.",
            "flow": "1. Mở danh sách Lịch hẹn toàn hệ thống.\n2. Lọc theo mã lịch hoặc trạng thái.\n3. Can thiệp cập nhật trạng thái khi có sự cố.",
            "rel": "Không", "api": "admin-appointments.controller.ts (GET, PATCH /status)", "ui": "Web: /admin/appointments", "status": "🟢"
        },
        {
            "code": "UC-A10", "name": "Quản lý giao dịch thanh toán & Đối soát",
            "desc": "Tra cứu toàn bộ lịch sử thanh toán qua VNPay, đối soát mã giao dịch ngân hàng và trạng thái đơn hàng.",
            "pre": "Đã đăng nhập vai trò ADMIN.",
            "post": "Báo cáo dòng tiền và danh sách giao dịch hiển thị minh bạch.",
            "flow": "1. Mở mục Quản lý thanh toán.\n2. Tra cứu theo mã giao dịch vnp_TransactionNo hoặc mã lịch.\n3. Kiểm tra thông tin thanh toán chi tiết.",
            "rel": "Không", "api": "admin-payments.controller.ts (GET /api/v1/admin/payments)", "ui": "Web: /admin/payments", "status": "🟢"
        },
        {
            "code": "UC-A11", "name": "Xử lý lệnh hoàn tiền (Refund) cho người bệnh",
            "desc": "Kích hoạt lệnh hoàn tiền trực tuyến qua cổng thanh toán khi lịch khám bị hủy hợp lệ theo chính sách.",
            "pre": "Giao dịch đã thanh toán thành công (PAID) và lịch hẹn đã bị hủy hợp lệ.",
            "post": "Trạng thái giao dịch chuyển thành REFUNDED; kích hoạt tiến trình hoàn tiền.",
            "flow": "1. Mở giao dịch cần hoàn tiền.\n2. Kiểm tra lý do và điều kiện hoàn tiền.\n3. Bấm Xác nhận hoàn tiền (Refund).",
            "rel": "<<extend>> UC-A10", "api": "admin-payments.controller.ts (PATCH /:id/refund)", "ui": "Web: /admin/payments", "status": "🟢"
        },
        {
            "code": "UC-A12", "name": "Phê duyệt yêu cầu đăng ký hợp tác (Partner Requests)",
            "desc": "Thẩm định hồ sơ đăng ký của cơ sở y tế ngoài; duyệt đơn -> hệ thống tự tạo cơ sở và cấp tài khoản.",
            "pre": "Có yêu cầu hợp tác ở trạng thái PENDING.",
            "post": "Cơ sở y tế mới được khởi tạo; gửi email kích hoạt tài khoản Quản trị viện.",
            "flow": "1. Mở danh sách Yêu cầu hợp tác.\n2. Xem chi tiết thông tin đơn vị và giấy phép.\n3. Bấm 'Phê duyệt hợp tác' (Approve).\n4. Hệ thống tự động tạo bản ghi Hospital, User và gửi mail kích hoạt.",
            "rel": "Không", "api": "partner-requests.controller.ts (GET, POST /:id/approve)", "ui": "Web: /admin/partner-requests", "status": "🟢"
        },
        {
            "code": "UC-A13", "name": "Kiểm duyệt đánh giá công khai",
            "desc": "Phê duyệt các bài đánh giá mới (chuyển sang APPROVED) hoặc ẩn các bài đánh giá vi phạm (REJECTED/HIDDEN).",
            "pre": "Đã đăng nhập vai trò ADMIN.",
            "post": "Trạng thái kiểm duyệt của bài đánh giá được cập nhật vào CSDL.",
            "flow": "1. Mở mục Kiểm duyệt đánh giá.\n2. Đọc nội dung nhận xét của người bệnh.\n3. Bấm Phê duyệt hoặc Ẩn bài viết.",
            "rel": "Không", "api": "reviews.controller.ts (GET /admin, PATCH /admin/:id/moderate)", "ui": "Web: /admin/reviews", "status": "🟢"
        },
        {
            "code": "UC-A14", "name": "Xử lý báo cáo vi phạm đánh giá",
            "desc": "Xem xét các khiếu nại từ bác sĩ hoặc người dùng về một bài đánh giá vi phạm tiêu chuẩn cộng đồng.",
            "pre": "Có bản ghi ReviewReport đang chờ xử lý.",
            "post": "Báo cáo chuyển sang RESOLVED; bài đánh giá vi phạm bị xử lý gỡ bỏ nếu có vi phạm.",
            "flow": "1. Mở danh sách Báo cáo vi phạm.\n2. Xem lý do khiếu nại và bài viết liên quan.\n3. Ra quyết định giải quyết (Giữ nguyên hoặc Gỡ bỏ đánh giá).",
            "rel": "Không", "api": "reviews.controller.ts (GET /admin/reports, PATCH /reports/:id/resolve)", "ui": "Web: /admin/reviews", "status": "🟢"
        },
        {
            "code": "UC-A15", "name": "Giám sát luồng liên thông dữ liệu y tế",
            "desc": "Theo dõi ma trận kết nối liên viện, biểu đồ lưu lượng truyền nhận và luồng audit log trực tiếp.",
            "pre": "Đã đăng nhập vai trò ADMIN.",
            "post": "Biểu đồ traffic liên thông và trạng thái các Gateway hiển thị thời gian thực.",
            "flow": "1. Mở mục Giám sát liên thông (Interoperability).\n2. Xem biểu đồ lưu lượng dữ liệu trao đổi giữa các bệnh viện.\n3. Kiểm tra các cảnh báo nghẽn mạng hoặc lỗi kết nối cổng HIS.",
            "rel": "Không", "api": "admin-interoperability.controller.ts (/overview, /traffic-chart...)", "ui": "Web: /admin/interoperability", "status": "🟢"
        },
        {
            "code": "UC-A16", "name": "Xem nhật ký kiểm toán hệ thống (Audit Logs)",
            "desc": "Tra cứu toàn bộ lịch sử can thiệp dữ liệu: tác nhân, hành động (POST/PUT/DELETE), IP, thời gian và dữ liệu cũ/mới.",
            "pre": "Đã đăng nhập vai trò ADMIN.",
            "post": "Bảng ghi vết an ninh (Audit Trail) được kết xuất chi tiết.",
            "flow": "1. Vào mục Nhật ký kiểm toán.\n2. Lọc theo người dùng, hành động hoặc khoảng thời gian.\n3. Xem chi tiết payload thay đổi để phục vụ hậu kiểm an ninh.",
            "rel": "Không", "api": "admin-dashboard.controller.ts (GET /audit-logs)", "ui": "Web: /admin/audit-logs", "status": "🟢"
        }
    ]
    render_actor_usecases("ACT-05", "Quản trị viên hệ thống (Super Admin)", super_admin_ucs)

    # ── 3.6. CÁC HỆ THỐNG NGOÀI & TÁC VỤ NỀN (EXTERNAL & WORKERS)
    external_ucs = [
        {
            "code": "UC-EXT01", "name": "Khởi tạo thanh toán & Kiểm tra chữ ký",
            "desc": "Cổng VNPay tiếp nhận thông số thanh toán, kiểm tra chữ ký điện tử HMAC-SHA512 và hiển thị cổng thanh toán.",
            "pre": "Request từ NovaCare hợp lệ.",
            "post": "Màn hình thanh toán ngân hàng sẵn sàng cho người dùng.",
            "flow": "1. VNPay nhận redirect request.\n2. Đối soát checksum chữ ký bảo mật.\n3. Hiển thị các phương thức thanh toán.",
            "rel": "Phục vụ UC-P15", "api": "VNPay Sandbox Gateway API", "ui": "Cổng VNPay", "status": "🟢"
        },
        {
            "code": "UC-EXT02", "name": "Bắn phản hồi trạng thái ngầm (IPN Webhook)",
            "desc": "VNPay tự động gọi ngầm đến webhook của NovaCare để thông báo kết quả thanh toán thực tế của đơn hàng.",
            "pre": "Giao dịch thanh toán tại ngân hàng hoàn tất.",
            "post": "NovaCare cập nhật CSDL ngay cả khi người dùng đóng trình duyệt.",
            "flow": "1. VNPay gửi HTTP POST đến /api/v1/payments/vnpay-ipn.\n2. Server NovaCare xác thực chữ ký và cập nhật trạng thái PAID.\n3. Phản hồi RspCode = '00' xác nhận với VNPay.",
            "rel": "Phục vụ UC-P15", "api": "payments.controller.ts (GET/POST /vnpay-ipn)", "ui": "Backend Service", "status": "🟢"
        },
        {
            "code": "UC-EXT03", "name": "Điều phối phòng gọi WebRTC (LiveKit Server)",
            "desc": "Máy chủ LiveKit khởi tạo phòng gọi mã hóa, quản lý luồng âm thanh/video và điều phối băng thông thích ứng.",
            "pre": "Nhận yêu cầu tạo phòng từ NovaCare API.",
            "post": "Phòng gọi video hoạt động với độ trễ thấp (<200ms).",
            "flow": "1. Nhận thông số roomName và participant token.\n2. Thiết lập kênh truyền WebRTC giữa bác sĩ và bệnh nhân.\n3. Điều phối luồng SFU (Selective Forwarding Unit).",
            "rel": "Phục vụ UC-P28, UC-D08", "api": "LiveKit Cloud / Local LiveKit Instance", "ui": "LiveKit SFU Engine", "status": "🟢"
        },
        {
            "code": "UC-EXT04", "name": "Bắn Webhook trạng thái cuộc gọi video",
            "desc": "LiveKit bắn webhook thông báo khi có người vào phòng, rời phòng hoặc phòng gọi đóng hoàn toàn.",
            "pre": "Có sự kiện người tham gia trong phòng video.",
            "post": "NovaCare ghi nhận nhật ký cuộc gọi phục vụ kiểm toán thời lượng tư vấn.",
            "flow": "1. Sự kiện participant_joined / room_finished phát sinh.\n2. LiveKit gửi webhook kèm chữ ký Authorization.\n3. Server NovaCare xác thực và lưu audit log cuộc gọi.",
            "rel": "Không", "api": "consultation-video.controller.ts (POST /webhook)", "ui": "Backend Service", "status": "🟢"
        },
        {
            "code": "UC-EXT05", "name": "Phân tích triệu chứng & Sinh câu hỏi thích ứng (AI Engine)",
            "desc": "OpenAI / Beeknoee LLM phân tích ngữ nghĩa triệu chứng, sinh câu hỏi phân nhánh và đưa ra kết luận chuyên khoa.",
            "pre": "Nhận prompt và dữ liệu triệu chứng từ phiên sàng lọc.",
            "post": "Trả về cấu trúc JSON chứa mức nguy cơ, cờ đỏ và chuyên khoa gợi ý.",
            "flow": "1. Server gửi triệu chứng và tiền sử vào mô hình AI.\n2. Mô hình bóc tách thực thể y tế và suy luận nguy cơ.\n3. Trả về kết quả phân tích có cấu trúc chuẩn.",
            "rel": "Phục vụ UC-P22, UC-P23", "api": "OpenAI / Beeknoee API (gpt-5.4 / gpt-4o)", "ui": "AI Microservice", "status": "🟢"
        },
        {
            "code": "UC-EXT06", "name": "Chuyển đổi âm thanh thành văn bản (Whisper STT)",
            "desc": "Mô hình Whisper nhận tệp âm thanh giọng nói tiếng Việt và chuyển đổi thành văn bản với độ chính xác cao.",
            "pre": "Nhận tệp ghi âm audio/m4a hợp lệ.",
            "post": "Đoạn văn bản bóc tách được trả về cho ứng dụng.",
            "flow": "1. Server gửi tệp âm thanh lên Whisper API.\n2. Mô hình nhận diện giọng nói tiếng Việt.\n3. Trả về chuỗi văn bản đã chuẩn hóa dấu câu.",
            "rel": "Phục vụ UC-P20", "api": "OpenAI Whisper API (/audio/transcriptions)", "ui": "AI Speech Service", "status": "🟢"
        },
        {
            "code": "UC-EXT07", "name": "Tiếp nhận Handshake & Cung cấp API danh mục (HIS đối tác)",
            "desc": "Hệ thống HIS bên ngoài phản hồi kiểm tra kết nối và cung cấp endpoint xuất danh mục bác sĩ, khoa phòng.",
            "pre": "Hệ thống HIS đang hoạt động và mở cổng tích hợp.",
            "post": "Dữ liệu danh mục được truyền về cho NovaCare.",
            "flow": "1. Nhận HTTP request từ NovaCare kèm API Key.\n2. Xác thực khóa bảo mật.\n3. Xuất danh mục khoa phòng/bác sĩ dưới dạng JSON.",
            "rel": "Phục vụ UC-HA13, UC-HA14", "api": "partner-his-server, standalone-his-server", "ui": "External Server", "status": "🟢"
        },
        {
            "code": "UC-EXT08", "name": "Trích xuất hồ sơ bệnh án chuẩn Bộ Y tế QĐ 4750",
            "desc": "Hệ thống trích xuất gói dữ liệu tóm tắt quá trình khám chữa bệnh dưới dạng XML/JSON theo quy định 4750/QĐ-BYT.",
            "pre": "Có mã lượt khám (encounterCode) hợp lệ.",
            "post": "Dữ liệu XML chuẩn hóa Bộ Y tế được sinh tự động.",
            "flow": "1. Gọi endpoint trích xuất kèm mã ca khám.\n2. Hệ thống bốc tách chẩn đoán, thuốc, xét nghiệm.\n3. Đóng gói thành cấu trúc XML chuẩn QĐ 4750.",
            "rel": "Không", "api": "qd4750.controller.ts (/extract/:encounterCode/xml)", "ui": "Backend Service", "status": "🟡"
        },
        {
            "code": "UC-EXT09", "name": "Gửi Email tự động qua giao thức SMTP",
            "desc": "Dịch vụ Nodemailer gửi email mã OTP, email kích hoạt tài khoản và email xác nhận phiếu đặt khám kèm vé điện tử.",
            "pre": "Cấu hình SMTP Server hợp lệ.",
            "post": "Email được gửi đến hộp thư người nhận thành công.",
            "flow": "1. Có sự kiện đặt lịch / tạo tài khoản.\n2. Server chuẩn bị template HTML email.\n3. Gửi mail qua máy chủ SMTP.",
            "rel": "Phục vụ UC-G01, UC-P08, UC-A04", "api": "email.service.ts", "ui": "Backend Worker", "status": "🟢"
        },
        {
            "code": "UC-EXT10", "name": "Tự động quét & Hủy lịch quá hạn thanh toán",
            "desc": "Cron Job chạy định kỳ mỗi 5-10 phút để quét và hủy các phiếu khám AWAITING_PAYMENT quá thời hạn giữ chỗ 15 phút.",
            "pre": "Hệ thống vận hành liên tục.",
            "post": "Lịch hẹn hết hạn chuyển sang EXPIRED; nhả lại suất khám trống cho người khác.",
            "flow": "1. Cron Job kích hoạt theo lịch.\n2. Quét các Appointment có status = AWAITING_PAYMENT và quá hạn 15 phút.\n3. Cập nhật status = EXPIRED và giải phóng Slot.",
            "rel": "Không", "api": "appointments.controller.ts (POST /expire-pending), BullMQ", "ui": "Backend Background Task", "status": "🟢"
        }
    ]
    render_actor_usecases("ACT-06 -> 10", "Các hệ thống ngoài & Tác vụ nền (External & Workers)", external_ucs)

    # ── PHẦN 4: HƯỚNG DẪN ỨNG DỤNG CHO BÁO CÁO KLTN
    add_h1("4. HƯỚNG DẪN XÂY DỰNG SƠ ĐỒ VÀ ĐẶC TẢ TRONG KHÓA LUẬN TỐT NGHIỆP")
    
    add_h2("4.1. Hướng dẫn xây dựng Sơ đồ Use Case tổng thể (Use Case Diagram)")
    add_p("Trong báo cáo khóa luận (Chương 3), sơ đồ Use Case tổng thể nên được vẽ bao gồm 5 Actor chính "
          "(Khách, Bệnh nhân, Bác sĩ, Quản trị cơ sở, Quản trị hệ thống) tương tác với 13 Package nghiệp vụ. "
          "Sau đó, vẽ tách thành 5 sơ đồ Use Case phân rã tương ứng cho từng Actor dựa trên danh mục mục 3 của tài liệu này.")

    add_h2("4.2. Danh sách 10 Use Case trọng tâm khuyến nghị chọn viết Đặc tả & Vẽ Sequence Diagram")
    add_p("Theo quy chuẩn báo cáo KLTN tại các trường đại học (như IUH), sinh viên nên chọn lọc từ 8 đến 10 Use Case cốt lõi "
          "đại diện cho độ phức tạp kỹ thuật của đề tài để viết đặc tả chi tiết (Pre/Post condition, Alternate Flow, Exception) "
          "và vẽ Sơ đồ tuần tự (Sequence Diagram):")

    seq_headers = ["STT", "Mã Use Case", "Tên Use Case", "Actor chính", "Thành phần tham gia trong Sequence", "Độ phức tạp kỹ thuật"]
    seq_data = [
        ["1", "UC-BOOK-01", "Đặt lịch khám theo bác sĩ", "Bệnh nhân", "Client -> Appointment API -> Slot Guard -> PostgreSQL -> Notification", "Cao (Khóa suất khám, chống trùng lịch)"],
        ["2", "UC-PAY-01 & 02", "Thanh toán trực tuyến & Xử lý IPN", "Bệnh nhân, VNPay", "Client -> Payment API -> VNPay -> IPN Webhook -> Appointment -> Queue", "Rất cao (Bảo mật chữ ký số, giao dịch phân tán)"],
        ["3", "UC-AI-01 -> 07", "Quy trình sàng lọc tiền khám AI v2", "Bệnh nhân, AI", "Mobile App -> PreExam API -> Rules Engine -> OpenAI LLM -> Result", "Rất cao (Multi-modal: Ảnh, Giọng nói, PPG, Adaptive Qs)"],
        ["4", "UC-BOOK-03", "Đặt lịch từ kết quả sàng lọc AI", "Bệnh nhân", "Client -> PreExam API -> Recommendation -> Appointment Controller", "Trung bình (Kế thừa dữ liệu bối cảnh AI)"],
        ["5", "UC-PROF-07", "Chia sẻ Hộ chiếu sức khỏe điện tử", "Bệnh nhân", "Client -> Medical Passport API -> Share Token -> Audit Log", "Cao (Bảo mật y tế, chia sẻ có thời hạn)"],
        ["6", "UC-TELE-06", "Tham gia phòng video tư vấn từ xa", "Bác sĩ, Bệnh nhân, LiveKit", "Client -> Consultation Video API -> LiveKit Server -> WebRTC Room", "Rất cao (Cấp phát JWT, điều phối Media WebRTC)"],
        ["7", "UC-HOSP-09", "Tiếp đón & Check-in người bệnh", "Quản trị cơ sở", "Web Hospital Admin -> Appointment API -> Timeline Log -> CSDL", "Trung bình (Nghiệp vụ vận hành bệnh viện)"],
        ["8", "UC-HA13 & 14", "Bắt tay & Đồng bộ danh mục từ HIS", "Quản trị cơ sở, HIS", "Hospital Admin -> Integration API -> External HIS -> CSDL NovaCare", "Cao (Tích hợp hệ thống phân tán bên thứ ba)"],
        ["9", "UC-ADMN-12", "Phê duyệt yêu cầu đối tác y tế", "Super Admin, SMTP", "Web Super Admin -> Partner API -> Hospital & User DB -> Mail Worker", "Cao (Tự động hóa luồng onboarding đối tác)"],
        ["10", "UC-A03", "Phân quyền vai trò người dùng (RBAC)", "Super Admin", "Web Super Admin -> User API -> Roles Guard -> Audit Log", "Trung bình (Kiểm soát an ninh truy cập)"]
    ]
    format_table(doc.add_table(rows=1, cols=6), [1.0, 2.5, 4.0, 3.0, 4.5, 3.5], seq_headers, seq_data)

    # Output file
    out_dir = Path("docs")
    out_dir.mkdir(exist_ok=True)
    out_path = out_dir / "Danh_Muc_Chi_Tiet_Actor_Va_Use_Case_NovaCare.docx"
    doc.save(out_path)
    print(f"SUCCESS: Document generated successfully at {out_path.resolve()}")
    return out_path

if __name__ == "__main__":
    build_word_document()

