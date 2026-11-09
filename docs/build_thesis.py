from docx import Document
from docx.shared import Cm, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_BREAK
from docx.enum.section import WD_SECTION_START
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_CELL_VERTICAL_ALIGNMENT
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.enum.style import WD_STYLE_TYPE
from docx.enum.text import WD_LINE_SPACING
from PIL import Image, ImageDraw, ImageFont
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'Bao_Cao_Khoa_Luan_Tot_Nghiep.docx'
AS=ROOT/'docs'/'report_assets'; AS.mkdir(exist_ok=True)

def font(sz,bold=False):
    paths=[r'C:\Windows\Fonts\timesbd.ttf' if bold else r'C:\Windows\Fonts\times.ttf',r'C:\Windows\Fonts\arialbd.ttf' if bold else r'C:\Windows\Fonts\arial.ttf']
    for p in paths:
        if Path(p).exists(): return ImageFont.truetype(p,sz)
    return ImageFont.load_default()

def box_diagram(path, title, rows):
    im=Image.new('RGB',(1600,900),'white'); d=ImageDraw.Draw(im)
    d.text((800,45),title,font=font(42,True),fill='#12355b',anchor='ma')
    y=140
    for label,items,color in rows:
        h=max(100,45+40*len(items)); d.rounded_rectangle((100,y,1500,y+h),20,fill=color,outline='#24527a',width=3)
        d.text((140,y+22),label,font=font(28,True),fill='#102a43')
        d.multiline_text((430,y+22),'\n'.join(items),font=font(24),fill='#102a43',spacing=8)
        y+=h+30
    im.save(path)

box_diagram(AS/'architecture.png','KIẾN TRÚC TRIỂN KHAI NOVACARE',[
 ('Kênh sử dụng',['Web portal Next.js/React','Ứng dụng Android Kotlin/Jetpack Compose','Cổng HIS mô phỏng'], '#e8f1fb'),
 ('Tầng dịch vụ',['Nginx HTTPS','NestJS API REST, Socket.IO, Swagger','JWT/RBAC, Validation, Helmet, Throttler'], '#e7f7ef'),
 ('Nghiệp vụ & tích hợp',['Đặt lịch, lịch làm việc, thanh toán VNPay','Sàng lọc AI, hồ sơ sức khỏe, liên thông HIS','Telemedicine LiveKit, email/FCM, BullMQ'], '#fff4df'),
 ('Dữ liệu',['PostgreSQL qua Prisma','Redis/BullMQ','Đối tác HIS, LiveKit, OpenAI/nhà cung cấp AI'], '#f3e9fb'),
])
box_diagram(AS/'screening.png','LUỒNG SÀNG LỌC TIỀN KHÁM ĐA PHƯƠNG THỨC',[
 ('1. Thu thập',['Vùng cơ thể, mô tả, bộ câu hỏi','PPG camera, bản chép lời giọng nói, tối đa 3 ảnh có đồng ý'], '#e8f1fb'),
 ('2. Kiểm soát an toàn',['Chuẩn hóa đầu vào và trích đặc trưng','Red-flag: EMERGENCY/URGENT được trả về trước khi gọi AI'], '#fde8e7'),
 ('3. Suy luận',['Xếp hạng chuyên khoa theo quy tắc/pattern','RAG + LLM chỉ dùng khi có bằng chứng và được kiểm tra'], '#fff4df'),
 ('4. Kết quả',['Đặt chuyên khoa nếu cơ sở có cung cấp','Hoặc yêu cầu thêm thông tin/chọn cơ sở/liên hệ cơ sở'], '#e7f7ef'),
])

def set_cell_shading(cell, fill):
    tcPr=cell._tc.get_or_add_tcPr(); shd=OxmlElement('w:shd'); shd.set(qn('w:fill'),fill); tcPr.append(shd)
def set_repeat_table_header(row):
    trPr=row._tr.get_or_add_trPr(); x=OxmlElement('w:tblHeader'); x.set(qn('w:val'),'true'); trPr.append(x)
def set_keep(p):
    pPr=p._p.get_or_add_pPr(); x=OxmlElement('w:keepNext'); pPr.append(x)
def field(run, instr):
    b=OxmlElement('w:fldChar'); b.set(qn('w:fldCharType'),'begin'); run._r.append(b)
    i=OxmlElement('w:instrText'); i.set(qn('xml:space'),'preserve'); i.text=instr; run._r.append(i)
    s=OxmlElement('w:fldChar'); s.set(qn('w:fldCharType'),'separate'); run._r.append(s)
    e=OxmlElement('w:fldChar'); e.set(qn('w:fldCharType'),'end'); run._r.append(e)
def page_field(p, fmt='PAGE'):
    r=p.add_run(); field(r,fmt)
def set_page_number(section, fmt='decimal', start=1):
    pg=section._sectPr.xpath('./w:pgNumType')
    el=pg[0] if pg else OxmlElement('w:pgNumType')
    el.set(qn('w:fmt'),fmt); el.set(qn('w:start'),str(start))
    if not pg: section._sectPr.append(el)

d=Document()
sec=d.sections[0]
def setup_section(s):
    s.page_width=Cm(21); s.page_height=Cm(29.7)
    s.top_margin=Cm(2); s.bottom_margin=Cm(2); s.left_margin=Cm(3); s.right_margin=Cm(2)
    s.header_distance=Cm(1.27); s.footer_distance=Cm(1.27); s.gutter=Cm(0)
setup_section(sec)

normal=d.styles['Normal']; normal.font.name='Times New Roman'; normal._element.rPr.rFonts.set(qn('w:eastAsia'),'Times New Roman'); normal.font.size=Pt(13)
normal.paragraph_format.alignment=WD_ALIGN_PARAGRAPH.JUSTIFY; normal.paragraph_format.line_spacing=1.5; normal.paragraph_format.space_before=Pt(3); normal.paragraph_format.space_after=Pt(0); normal.paragraph_format.first_line_indent=Cm(.76)
for name, size, bold, align, before in [('Title',20,True,WD_ALIGN_PARAGRAPH.CENTER,0),('Heading 1',13,True,WD_ALIGN_PARAGRAPH.CENTER,3),('Heading 2',13,True,WD_ALIGN_PARAGRAPH.JUSTIFY,2),('Heading 3',13,True,WD_ALIGN_PARAGRAPH.JUSTIFY,2)]:
    st=d.styles[name]; st.font.name='Times New Roman'; st._element.rPr.rFonts.set(qn('w:eastAsia'),'Times New Roman'); st.font.size=Pt(size); st.font.bold=bold
    st.paragraph_format.alignment=align; st.paragraph_format.space_before=Pt(before); st.paragraph_format.space_after=Pt(0); st.paragraph_format.line_spacing=1.5
for n in ['Heading 1','Heading 2','Heading 3']: d.styles[n].paragraph_format.keep_with_next=True

def add_p(text='',style=None,align=None,indent=True,italic=False,bold=False):
    p=d.add_paragraph(style=style)
    if text:
        r=p.add_run(text); r.bold=bold; r.italic=italic
    if align is not None:p.alignment=align
    if not indent:p.paragraph_format.first_line_indent=Cm(0)
    return p
def title(t):
    p=add_p(t,'Heading 1',WD_ALIGN_PARAGRAPH.CENTER,False); set_keep(p); return p
def h2(t): return add_p(t,'Heading 2',None,False)
def h3(t): return add_p(t,'Heading 3',None,False)
def bullet(t):
    p=add_p('• '+t,indent=False); p.paragraph_format.left_indent=Cm(.76); p.paragraph_format.first_line_indent=Cm(-.45); return p
def table(headers, rows, widths=None):
    tb=d.add_table(rows=1, cols=len(headers)); tb.alignment=WD_TABLE_ALIGNMENT.CENTER; tb.style='Table Grid'; tb.autofit=False
    for i,x in enumerate(headers):
        c=tb.rows[0].cells[i]; c.text=x; set_cell_shading(c,'D9EAF7'); c.vertical_alignment=WD_CELL_VERTICAL_ALIGNMENT.CENTER
        for r in c.paragraphs[0].runs:r.bold=True
        if widths: c.width=Cm(widths[i])
    set_repeat_table_header(tb.rows[0])
    for row in rows:
        cells=tb.add_row().cells
        for i,x in enumerate(row):
            cells[i].text=str(x); cells[i].vertical_alignment=WD_CELL_VERTICAL_ALIGNMENT.CENTER
            if widths: cells[i].width=Cm(widths[i])
            for p in cells[i].paragraphs:
                p.paragraph_format.first_line_indent=Cm(0); p.paragraph_format.line_spacing=1.2; p.paragraph_format.space_before=Pt(0)
                for r in p.runs:r.font.name='Times New Roman'; r.font.size=Pt(11)
    return tb
def caption(text, above=False):
    p=add_p(text,align=WD_ALIGN_PARAGRAPH.CENTER,indent=False,italic=True); p.paragraph_format.space_before=Pt(3 if above else 0); return p
def fig(path, cap, width=15):
    d.add_picture(str(path),width=Cm(width)); d.paragraphs[-1].alignment=WD_ALIGN_PARAGRAPH.CENTER; caption(cap)
def header_footer(section, number=False):
    section.header.is_linked_to_previous=False
    section.footer.is_linked_to_previous=False
    hp=section.header.paragraphs[0]; hp.alignment=WD_ALIGN_PARAGRAPH.LEFT; hp.paragraph_format.line_spacing=1.5
    r=hp.add_run('TRƯỜNG ĐẠI HỌC CÔNG NGHIỆP THÀNH PHỐ HỒ CHÍ MINH');r.font.name='Times New Roman';r.font.size=Pt(12)
    fp=section.footer.paragraphs[0]; fp.alignment=WD_ALIGN_PARAGRAPH.LEFT; fp.paragraph_format.line_spacing=1.5
    r=fp.add_run('NỀN TẢNG Y TẾ SỐ NOVACARE');r.bold=True;r.font.name='Times New Roman';r.font.size=Pt(11)
    if number:
        fp.add_run('\t'); page_field(fp)
        tabs=fp.paragraph_format.tab_stops; tabs.add_tab_stop(Cm(16),2)

# Cover (no headers/footer)
for line, sz, bold in [('TRƯỜNG ĐẠI HỌC CÔNG NGHIỆP THÀNH PHỐ HỒ CHÍ MINH',14,False),('KHOA CÔNG NGHỆ THÔNG TIN',14,False),('',14,False),('BÁO CÁO KHÓA LUẬN TỐT NGHIỆP',16,True),('',14,False),('PHÂN TÍCH, THIẾT KẾ VÀ XÂY DỰNG NỀN TẢNG Y TẾ SỐ NOVACARE',20,True)]:
    p=add_p(line,align=WD_ALIGN_PARAGRAPH.CENTER,indent=False)
    if p.runs:
        p.runs[0].font.size=Pt(sz)
        p.runs[0].bold=bold
for _ in range(8):add_p('',indent=False)
for line in ['Sinh viên thực hiện: [BỔ SUNG HỌ VÀ TÊN]','Mã số sinh viên: [BỔ SUNG MSSV]','Giảng viên hướng dẫn: [BỔ SUNG HỌ VÀ TÊN]']:
    add_p(line,align=WD_ALIGN_PARAGRAPH.CENTER,indent=False)
for _ in range(4):add_p('',indent=False)
add_p('THÀNH PHỐ HỒ CHÍ MINH - 2026',align=WD_ALIGN_PARAGRAPH.CENTER,indent=False)

# unnumbered forms
for form in ['TRANG BÌA TRONG','PHIẾU GIAO ĐỀ TÀI KHÓA LUẬN TỐT NGHIỆP','PHIẾU NHẬN XÉT KHÓA LUẬN TỐT NGHIỆP (Dành cho giảng viên hướng dẫn)','PHIẾU NHẬN XÉT KHÓA LUẬN TỐT NGHIỆP (Dành cho giảng viên phản biện)','PHIẾU XÁC NHẬN CHỈNH SỬA KHÓA LUẬN TỐT NGHIỆP']:
    d.add_page_break(); title(form)
    if form=='TRANG BÌA TRONG':
        add_p('PHÂN TÍCH, THIẾT KẾ VÀ XÂY DỰNG NỀN TẢNG Y TẾ SỐ NOVACARE',align=WD_ALIGN_PARAGRAPH.CENTER,indent=False,bold=True)
        add_p('Sinh viên: [BỔ SUNG]     MSSV: [BỔ SUNG]\nGiảng viên hướng dẫn: [BỔ SUNG]',align=WD_ALIGN_PARAGRAPH.CENTER,indent=False)
    else:
        add_p('[GIỮ CHỖ BIỂU MẪU CHÍNH THỨC DO KHOA/TRƯỜNG CUNG CẤP. Không tạo chữ ký, con dấu hoặc nhận xét.]',align=WD_ALIGN_PARAGRAPH.CENTER,indent=False,italic=True)

# roman intro section
d.add_section(WD_SECTION_START.NEW_PAGE); intro=d.sections[-1]; setup_section(intro); header_footer(intro,True); set_page_number(intro,'lowerRoman',1)
title('LỜI CẢM ƠN'); add_p('Tác giả xin trân trọng cảm ơn giảng viên hướng dẫn, Khoa Công nghệ Thông tin và các cá nhân đã hỗ trợ quá trình thực hiện đề tài. Nội dung này cần được sinh viên rà soát, cá nhân hóa trước khi nộp bản chính thức.')
title('LỜI CAM KẾT'); add_p('Tôi cam kết báo cáo được xây dựng trên quá trình khảo sát mã nguồn NovaCare trong thư mục dự án, các nội dung chưa có thông tin xác thực được đánh dấu [BỔ SUNG]. Tôi chịu trách nhiệm về tính trung thực của phần nội dung được hoàn thiện trước khi nộp.')
title('MỤC LỤC'); p=add_p('',indent=False); field(p.add_run(),'TOC \\o "1-3" \\h \\z \\u'); add_p('Mở tài liệu bằng Microsoft Word, chọn Update Field để cập nhật mục lục và số trang.',indent=False,italic=True)
title('DANH MỤC HÌNH'); add_p('Hình 3.1. Kiến trúc triển khai NovaCare\nHình 3.2. Luồng sàng lọc tiền khám đa phương thức\nHình 3.3. Sơ đồ dữ liệu thực thể chính\nHình 4.1. Giao diện luồng đặt lịch\nHình 4.2. Giao diện quản lý lịch khám',indent=False)
title('DANH MỤC BẢNG'); add_p('Bảng 2.1. Công nghệ chính\nBảng 3.1. Nhóm yêu cầu chức năng\nBảng 3.2. Các thực thể dữ liệu chính\nBảng 5.1. Bằng chứng kiểm thử trong mã nguồn',indent=False)
title('DANH MỤC CÁC TỪ VIẾT TẮT'); table(['Từ viết tắt','Diễn giải'],[['AI','Trí tuệ nhân tạo'],['API','Giao diện lập trình ứng dụng'],['HIS','Hệ thống thông tin bệnh viện'],['JWT','JSON Web Token'],['PPG','Đo quang thể tích'],['RAG','Sinh tăng cường truy hồi'],['RBAC','Kiểm soát truy cập theo vai trò'],['EMR','Hồ sơ bệnh án điện tử']],[4,12])
title('TÓM TẮT'); add_p('Đề tài khảo sát và xây dựng NovaCare, nền tảng y tế số đa kênh hỗ trợ tìm kiếm cơ sở y tế, đặt lịch, quản lý hồ sơ người đi khám, thanh toán, tư vấn từ xa, liên thông dữ liệu và sàng lọc tiền khám. Hệ thống gồm cổng web Next.js, ứng dụng Android Kotlin và dịch vụ NestJS kết nối PostgreSQL qua Prisma. Điểm nhấn là luồng sàng lọc đa phương thức có cơ chế ưu tiên quy tắc cảnh báo trước khi sử dụng mô hình ngôn ngữ và kiểm tra đầu ra dựa trên bằng chứng. Báo cáo phân tích mã nguồn, thiết kế kiến trúc, dữ liệu, API và các giới hạn triển khai.')
title('ABSTRACT'); add_p('This thesis analyzes NovaCare, a multi-channel digital healthcare platform for provider discovery, appointment booking, patient profiles, payment, remote consultation, interoperability and pre-examination screening. The implementation contains a Next.js web portal, a Kotlin Android application and NestJS services backed by PostgreSQL through Prisma. Its multimodal screening flow prioritizes deterministic red-flag rules and validates evidence-grounded AI output. This report documents the code-based architecture, data model, APIs, implementation and limitations.')

# main decimal
d.add_section(WD_SECTION_START.NEW_PAGE); main=d.sections[-1]; setup_section(main); header_footer(main,True); set_page_number(main,'decimal',1)
title('CHƯƠNG 1. TỔNG QUAN ĐỀ TÀI')
h2('1.1. Lý do chọn đề tài'); add_p('Việc tiếp cận cơ sở y tế thường đòi hỏi người bệnh tự tìm thông tin, chọn đúng chuyên khoa, theo dõi lịch hẹn và quản lý hồ sơ phân tán. NovaCare được triển khai nhằm tập trung các thao tác này trên web và thiết bị di động, đồng thời cung cấp cơ chế hỗ trợ định hướng trước khám. Phạm vi đề tài là phần mềm hỗ trợ quy trình số, không thay thế hoạt động chẩn đoán hoặc cấp cứu của nhân viên y tế.')
h2('1.2. Mục tiêu đề tài'); bullet('Cung cấp luồng tìm kiếm, chọn cơ sở/chuyên khoa/bác sĩ, chọn suất khám, hồ sơ người đi khám và thanh toán.'); bullet('Xây dựng cổng quản trị hệ thống và cổng quản trị cơ sở y tế.'); bullet('Tổ chức tư vấn từ xa, hồ sơ sức khỏe và cơ chế liên thông có sự đồng ý của bệnh nhân.'); bullet('Tích hợp sàng lọc đa phương thức với các rào chắn an toàn theo quy tắc.')
h2('1.3. Đối tượng và phạm vi nghiên cứu'); add_p('Đối tượng nghiên cứu là quy trình số hóa đặt lịch và hỗ trợ trước khám. Khảo sát mã nguồn cho thấy bốn nhóm tác nhân: người bệnh, bác sĩ, quản trị cơ sở y tế và quản trị hệ thống. Phạm vi hiện có các server mô phỏng HIS; do đó không khẳng định hệ thống đang kết nối HIS sản xuất của bệnh viện thực tế.')
h2('1.4. Phương pháp nghiên cứu'); add_p('Báo cáo sử dụng khảo sát tĩnh mã nguồn: đọc cấu hình, mô-đun NestJS, controller/service, mô hình Prisma, các route Next.js, mã Android, test và tài liệu triển khai. Các sơ đồ trong báo cáo được tổng hợp từ các thành phần này; không dùng số liệu hiệu năng hoặc kết quả lâm sàng chưa được cung cấp.')
h2('1.5. Bố cục báo cáo'); add_p('Báo cáo gồm sáu chương: tổng quan; cơ sở công nghệ; phân tích thiết kế; xây dựng triển khai; kiểm thử đánh giá; kết luận và hướng phát triển.')

title('CHƯƠNG 2. CƠ SỞ LÝ THUYẾT VÀ CÔNG NGHỆ')
h2('2.1. Kiến trúc và công nghệ sử dụng'); table(['Thành phần','Công nghệ ghi nhận từ mã nguồn','Vai trò'],[['Web','Next.js 16, React 19, TypeScript, TailwindCSS, Zustand','Cổng công khai, người dùng, quản trị'],['Mobile','Kotlin, Jetpack Compose, Retrofit, Coroutines','Ứng dụng Android, camera/PPG, giọng nói'],['Backend','NestJS 11, TypeScript, Swagger','REST API, phân quyền, nghiệp vụ'],['Dữ liệu','PostgreSQL 16, Prisma 6','Lưu trữ dữ liệu quan hệ và migration'],['Nền','Redis, BullMQ, Nginx, Docker','Hàng đợi, reverse proxy, đóng gói'],['Tích hợp','VNPay, LiveKit, Firebase, OpenAI/nhà cung cấp AI','Thanh toán, video, thông báo, AI']],[3,7,6])
h2('2.2. Kiến trúc mô-đun'); add_p('Backend là modular monolith: AppModule đăng ký các mô-đun nghiệp vụ như auth, appointments, schedules, pre-exam-v2, integration, consultations, payments và admin. Mỗi mô-đun phân tách controller nhận HTTP, DTO kiểm tra đầu vào, service xử lý nghiệp vụ và PrismaService truy cập dữ liệu. Main bootstrap bật Helmet, CORS, ValidationPipe whitelist/forbidNonWhitelisted, filter ngoại lệ, interceptor ghi log, guard JWT toàn cục và Swagger.')
h2('2.3. Sàng lọc AI có rào chắn'); add_p('AiScreeningOrchestratorService chuẩn hóa dữ liệu, trích đặc trưng và đánh giá red flag trước. Khi mức EMERGENCY hoặc URGENT xuất hiện, hệ thống trả hướng dẫn ngay, không chờ lời gọi AI tốn thời gian. Với trường hợp đủ điều kiện, ảnh chỉ nhận JPEG/PNG/WebP tối đa 5 MB, tối đa ba ảnh và bắt buộc mediaConsent. Đầu ra RAG/LLM chỉ được chấp nhận khi chuyên khoa, fact và citation đều qua kiểm tra; nếu không đủ bằng chứng hệ thống yêu cầu bổ sung thông tin. Đây là cơ chế định hướng, không tạo kết luận chẩn đoán.')
h2('2.4. Bảo mật và vận hành'); add_p('Xác thực dùng JWT và guard toàn cục; RBAC được thể hiện bởi Role/roles guard. Mật khẩu dùng Argon2 theo dependency. Nền tảng có throttler 100 yêu cầu/60 giây, Helmet, validation DTO, audit log và các hàng đợi email/thông báo. Tư vấn video chỉ phát hành token LiveKit sau khi kiểm tra quyền, trạng thái phiên, khung thời gian, trạng thái lịch thanh toán và tài khoản bác sĩ hoạt động.')

title('CHƯƠNG 3. PHÂN TÍCH VÀ THIẾT KẾ HỆ THỐNG')
h2('3.1. Tác nhân và yêu cầu chức năng'); table(['Nhóm','Chức năng chính'],[['Người bệnh','Đăng ký/đăng nhập, quản lý hồ sơ, tìm kiếm, đặt/đổi/hủy lịch, thanh toán, sàng lọc, tư vấn, xem hồ sơ và đánh giá'],['Bác sĩ','Xem lịch, tiếp nhận tư vấn, nhắn tin, tham gia video; dữ liệu khám được quản lý qua nghiệp vụ lâm sàng'],['Quản trị cơ sở','Quản lý cơ sở, bác sĩ, dịch vụ, lịch, lịch hẹn và trạng thái đồng bộ'],['Quản trị hệ thống','Quản lý người dùng, bệnh viện, chuyên khoa, gói khám, thanh toán, audit và liên thông']],[4,12])
h2('3.2. Yêu cầu phi chức năng'); add_p('Hệ thống yêu cầu xác thực, phân quyền, kiểm tra đầu vào, khả năng truy vết thay đổi trạng thái, hạn chế tốc độ cơ bản và tính nhất quán cho thao tác thanh toán/đặt lịch. Các thành phần video, AI và HIS phụ thuộc cấu hình/dịch vụ bên ngoài; mã nguồn có xử lý ServiceUnavailable hoặc trạng thái lỗi một phần thay vì mặc định coi kết quả là hợp lệ.')
h2('3.3. Thiết kế kiến trúc'); fig(AS/'architecture.png','Hình 3.1. Kiến trúc triển khai NovaCare',15)
h2('3.4. Thiết kế luồng sàng lọc'); fig(AS/'screening.png','Hình 3.2. Luồng sàng lọc tiền khám đa phương thức',15)
h2('3.5. Thiết kế cơ sở dữ liệu'); add_p('Schema Prisma có các nhóm thực thể: định danh/quyền (User, RefreshToken, OTP); hồ sơ và đặt lịch (PatientProfile, Appointment, AppointmentSlot, AppointmentStatusHistory, PaymentTransaction); danh mục (Hospital, Specialty, Doctor, DoctorWorkplace, MedicalService, DoctorSchedule); lâm sàng (MedicalEncounter, Diagnosis, Observation, Prescription); sàng lọc (PreExamSession, PreExamQuestion, ScreeningMedia); liên thông/đồng ý (PatientHospitalLink, PatientConsent); tư vấn (ConsultationSession, Message, Attachment); và đánh giá (Review cùng các bảng phụ trợ). Khóa UUID là khóa chính trong schema; các quan hệ Prisma và unique/index thể hiện ràng buộc miền dữ liệu.')
fig(ROOT/'img'/'ERD.png','Hình 3.3. Sơ đồ ERD được cung cấp cùng dự án',15)
caption('Bảng 3.1. Các thực thể dữ liệu trọng tâm',True); table(['Nhóm','Bảng/thực thể','Liên hệ nghiệp vụ'],[['Đặt lịch','Appointment, AppointmentSlot, AppointmentSlotBooking','Lịch gắn hồ sơ người khám và suất khám; lưu lịch sử trạng thái'],['Cơ sở','Hospital, Specialty, HospitalSpecialty, Doctor, DoctorWorkplace','Xác định cơ sở, chuyên khoa và nơi làm việc của bác sĩ'],['Khám','MedicalEncounter, Diagnosis, Observation, Prescription','Một lượt khám có chẩn đoán, chỉ số và đơn thuốc'],['Liên thông','PatientHospitalLink, PatientConsent, AuditLog','Liên kết định danh, cấp/thu hồi đồng ý và truy vết'],['Tư vấn','ConsultationSession, ConsultationMessage, ConsultationAttachment','Phiên, tin nhắn và tệp đính kèm']],[3,7,6])
h2('3.6. Đặc tả luồng đặt lịch'); add_p('Mục đích là tạo lịch khám theo cơ sở. Người dùng chọn cơ sở, chuyên khoa/dịch vụ/bác sĩ, thời điểm và hồ sơ người đi khám. Web route dat-kham-co-so và các màn BookingScreen/HospitalFacilityBookingScreen gọi API lịch/suất khám và appointments. Backend kiểm tra quyền, tính khả dụng và duy trì AppointmentStatusHistory. Khi xung đột, AppointmentsService tìm suất thay thế theo ba ưu tiên: cùng bác sĩ gần thời gian yêu cầu; cùng chuyên khoa/cơ sở với bác sĩ khác; rồi cùng chuyên khoa tại cơ sở khác. Đầu ra là mã lịch và trạng thái, sau đó có thể chuyển sang thanh toán.')
h2('3.7. Đặc tả thanh toán và tư vấn'); add_p('PaymentsService tạo URL VNPay từ dữ liệu lịch, lưu/upsert PaymentTransaction và ký HMAC-SHA512. IPN kiểm tra chữ ký, cập nhật giao dịch/lịch trong transaction và đưa thông báo vào hàng đợi khi thành công. ConsultationVideoService chỉ cấp token LiveKit cho thành viên phiên hợp lệ, phiên ACCEPTED/ACTIVE, nằm trong lịch hẹn và lịch đã CONFIRMED/PAID; webhook được xác thực trước khi ghi audit log.')

title('CHƯƠNG 4. XÂY DỰNG VÀ TRIỂN KHAI HỆ THỐNG')
h2('4.1. Cấu trúc mã nguồn'); add_p('Thư mục nova-care-web chứa App Router với nhóm route public, auth, dashboard, hospital-admin và admin. nova-care-backend chứa src/modules, common, config, queue, database cùng prisma/schema.prisma và migration. mobile chứa mô hình data/remote/repository, viewmodel, UI Compose và domain engine/service. mock-his, partner-his-server và standalone-his-server phục vụ mô phỏng/kiểm tra liên thông.')
h2('4.2. Xây dựng Frontend và Mobile'); add_p('Web tổ chức route theo nhóm quyền; các service TypeScript làm lớp gọi API. Mobile dùng ViewModel và Repository, Retrofit/OkHttp cho mạng, Compose cho hiển thị. Các lớp PPGService, CameraPpgSignal, ScreeningEngine, RedFlagEngine và QuestionEngine phản ánh luồng sàng lọc ở thiết bị; kết quả vẫn được backend kiểm soát ở API pre-exam-v2.')
fig(ROOT/'img'/'dat_lich.png','Hình 4.1. Ảnh giao diện luồng đặt lịch từ dự án',13)
fig(ROOT/'img'/'huy_lich.png','Hình 4.2. Ảnh giao diện quản lý/hủy lịch từ dự án',13)
h2('4.3. Xây dựng API'); add_p('Các controller dùng tiền tố /api/v1. Nhóm tiêu biểu gồm auth (đăng ký OTP, đăng nhập, refresh, đặt lại mật khẩu), appointments (tạo, xem, hủy, đổi, xác nhận, hoàn tất), payments (create, IPN, status), pre-exam-v2 (catalog, start, media, symptoms, answer, complete, transcribe, analyze-smartphone), consultations (phiên, message, attachment) và integration (consent, matching, catalog sync, portal). Swagger được sinh tại /api-docs theo cấu hình main.ts.')
h2('4.4. Liên thông dữ liệu và quyền đồng ý'); add_p('ConsentService kiểm tra chủ sở hữu PatientProfile trước khi cấp hoặc thu hồi đồng ý, từ chối quyền đã hết hạn và lưu trạng thái GRANTED/REVOKED. Các API identity matching, hospital links, shareable records, access logs và portal lookup cho thấy liên thông được đặt sau ràng buộc nhận diện và đồng ý của người bệnh. Đây là điểm phân tách quan trọng giữa truy cập dữ liệu và chia sẻ dữ liệu.')
h2('4.5. Triển khai'); add_p('Dự án có docker-compose.prod.yml, Dockerfile backend, cấu hình Nginx và DEPLOYMENT_GUIDE.md. Các tệp này cho thấy phương án triển khai đóng gói web/API/cơ sở dữ liệu/Redis phía sau reverse proxy. Thông số tên miền, khóa API, cấu hình thực tế và bằng chứng môi trường production cần được chủ đề tài bổ sung/xác minh trước khi đưa vào bản nộp.')

title('CHƯƠNG 5. KIỂM THỬ VÀ ĐÁNH GIÁ')
h2('5.1. Phạm vi bằng chứng kiểm thử'); add_p('Không có kết quả chạy kiểm thử hay số đo hiệu năng được cung cấp trong yêu cầu, nên báo cáo không tạo số liệu pass rate, độ chính xác hay tải hệ thống. Mã nguồn có các bộ test sau; chúng là bằng chứng thiết kế kiểm thử, không phải kết quả thực thi của báo cáo này.')
caption('Bảng 5.1. Bằng chứng kiểm thử trong mã nguồn',True); table(['Nhóm','Tệp tiêu biểu','Mục đích nhận diện'],[['Backend unit','test/unit/appointments.service.spec.ts; payments.service.spec.ts; ai.service.spec.ts','Nghiệp vụ lịch, thanh toán, AI'],['Backend integration/E2E','test/integration/appointments.controller.spec.ts; test/app.e2e-spec.ts','Luồng controller và ứng dụng'],['Sàng lọc v3','pre-exam-v2/test/screening-v3.spec.ts; red-flag/triage spec','Luật sàng lọc, provider error, bằng chứng'],['Mobile','BookingFlowTest.kt; AppointmentQrTest.kt; MobileScreeningContractTest.kt','Hợp đồng luồng Android']],[3.5,8,4.5])
h2('5.2. Các trường hợp kiểm thử đề xuất'); table(['Mã','Kịch bản','Kết quả mong đợi'],[['TC-01','Đặt hai yêu cầu lên suất đã đủ','Từ chối/xử lý theo khả dụng, không tăng vượt capacity'],['TC-02','IPN VNPay có chữ ký sai','Trả mã kiểm tra lỗi, không cập nhật PAID'],['TC-03','Sàng lọc có red flag khẩn','Trả EMERGENCY_GUIDANCE trước AI'],['TC-04','Tải ảnh không đồng ý xử lý AI','Từ chối yêu cầu'],['TC-05','Tham gia video ngoài khung lịch','Không cấp token LiveKit'],['TC-06','Thu hồi đồng ý chia sẻ hồ sơ','Consent chuyển REVOKED, truy cập sau đó phải bị kiểm soát']],[2,8,6])
h2('5.3. Đánh giá'); add_p('Ưu điểm kỹ thuật là kiến trúc mô-đun rõ, dữ liệu quan hệ phong phú, có audit/consent, định tuyến an toàn cho sàng lọc và mã nguồn kiểm thử cho nhiều lớp. Hạn chế là một phần tích hợp HIS được mô phỏng; chất lượng/hiệu quả lâm sàng của AI, tải đồng thời, bảo mật vận hành, khả năng tương thích HIS thật và tiêu chí chấp nhận của bệnh viện chưa có bằng chứng thực nghiệm trong thư mục khảo sát.')

title('CHƯƠNG 6. KẾT LUẬN VÀ HƯỚNG PHÁT TRIỂN')
h2('6.1. Kết quả đạt được'); add_p('NovaCare hiện thực hóa nền tảng đa kênh với các mô-đun xác thực, danh mục cơ sở, lịch hẹn, thanh toán, quản trị, hồ sơ sức khỏe, liên thông có đồng ý, tư vấn trực tuyến và sàng lọc tiền khám. Báo cáo đã đối chiếu các kết luận với cấu trúc thực tế của mã nguồn, Prisma schema, các controller/service, web route, mobile package, tệp triển khai và test.')
h2('6.2. Hạn chế'); add_p('Báo cáo không chứng minh hiệu quả chẩn đoán vì hệ thống không được mô tả là công cụ chẩn đoán. Luồng HIS có thành phần mock; số liệu kiểm thử thực thi, tải và người dùng thực chưa được cung cấp. Thông tin hành chính của khóa luận cũng đang để placeholder theo yêu cầu.')
h2('6.3. Hướng phát triển'); bullet('Thực hiện kiểm thử tích hợp với HIS thật theo hợp đồng liên thông và đánh giá bảo mật độc lập.'); bullet('Thiết lập bộ dữ liệu/đề cương đánh giá lâm sàng có hội đồng chuyên môn cho phần AI.'); bullet('Bổ sung quan sát vận hành, kiểm thử tải, sao lưu/khôi phục và quản lý bí mật tập trung.'); bullet('Mở rộng khả năng tiếp cận và kiểm thử trải nghiệm người dùng với người bệnh/cơ sở y tế.')

title('TÀI LIỆU THAM KHẢO')
for x in ['[1] NovaCare Team. README.md. Tài liệu dự án NovaCare. (2026).','[2] NovaCare Team. prisma/schema.prisma. Mô hình dữ liệu dự án NovaCare. (2026).','[3] NestJS. Documentation. https://docs.nestjs.com/.','[4] Prisma. Documentation. https://www.prisma.io/docs/.','[5] Next.js. Documentation. https://nextjs.org/docs.','[6] Android Developers. Jetpack Compose documentation. https://developer.android.com/develop/ui/compose.','[7] LiveKit. Server SDK documentation. https://docs.livekit.io/.','[8] VNPay. Tài liệu cổng thanh toán VNPay. https://sandbox.vnpayment.vn/apis/.']:
    add_p(x,indent=False)
title('PHỤ LỤC')
h2('A. Danh sách thông tin cần bổ sung trước khi nộp');
for x in ['Họ tên sinh viên, MSSV, lớp và khóa học.','Tên đề tài chính thức đã được phê duyệt.','Giảng viên hướng dẫn; các biểu mẫu và chữ ký xác nhận do khoa cung cấp.','Kết quả chạy test, môi trường triển khai, số liệu thực nghiệm (nếu có).','Bản PDF Turnitin theo quy định IUH.','Ảnh giao diện độ phân giải cao và ảnh chụp bản phát hành chính thức (nếu yêu cầu).']:
 bullet(x)
h2('B. Báo cáo kiểm tra định dạng'); add_p('Tài liệu được cấu hình A4, lề trong 3 cm/ngoài 2 cm, trên/dưới 2 cm, header/footer 1,27 cm; Times New Roman 13, giãn dòng 1,5; section không đánh số cho bìa/biểu mẫu, La Mã thường cho phần đầu và Ả Rập cho nội dung. Mục lục được đặt dưới dạng field Word để cập nhật khi mở bằng Microsoft Word. Cần kiểm tra lại số trang sau khi thay thế placeholder và cập nhật field.')

# preserve headings and apply default header settings
for s in d.sections:
    s.different_first_page_header_footer=False

d.core_properties.title='Báo cáo Khóa luận Tốt nghiệp - NovaCare'
d.core_properties.author='[BỔ SUNG HỌ VÀ TÊN SINH VIÊN]'
d.save(OUT)
print(OUT)
