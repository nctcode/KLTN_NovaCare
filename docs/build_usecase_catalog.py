from docx import Document
from docx.shared import Cm, Pt
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_CELL_VERTICAL_ALIGNMENT
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'Danh_Muc_Actor_Use_Case_NovaCare.docx'
d=Document(); s=d.sections[0]
s.page_width=Cm(21); s.page_height=Cm(29.7); s.top_margin=Cm(2); s.bottom_margin=Cm(2); s.left_margin=Cm(2.5); s.right_margin=Cm(2)

normal=d.styles['Normal']; normal.font.name='Times New Roman'; normal._element.rPr.rFonts.set(qn('w:eastAsia'),'Times New Roman'); normal.font.size=Pt(12)
normal.paragraph_format.space_after=Pt(4); normal.paragraph_format.line_spacing=1.2
for style,size,bold in [('Title',17,True),('Heading 1',14,True),('Heading 2',13,True)]:
 st=d.styles[style]; st.font.name='Times New Roman'; st._element.rPr.rFonts.set(qn('w:eastAsia'),'Times New Roman'); st.font.size=Pt(size); st.font.bold=bold
 st.paragraph_format.space_before=Pt(10); st.paragraph_format.space_after=Pt(5)

def shade(c, fill):
 tcPr=c._tc.get_or_add_tcPr(); x=OxmlElement('w:shd'); x.set(qn('w:fill'),fill); tcPr.append(x)
def widths(t, cm):
 t.autofit=False
 tPr=t._tbl.tblPr; layout=OxmlElement('w:tblLayout'); layout.set(qn('w:type'),'fixed'); tPr.append(layout)
 grid=t._tbl.tblGrid.gridCol_lst
 for i,w in enumerate(cm):
  grid[i].set(qn('w:w'),str(int(w/2.54*1440)))
  for row in t.rows: row.cells[i].width=Cm(w)
def table(headers,rows,ws):
 t=d.add_table(rows=1,cols=len(headers)); t.style='Table Grid'; t.alignment=WD_TABLE_ALIGNMENT.CENTER
 for i,h in enumerate(headers):
  c=t.rows[0].cells[i]; c.text=h; shade(c,'D9EAF7'); c.vertical_alignment=WD_CELL_VERTICAL_ALIGNMENT.CENTER
  for r in c.paragraphs[0].runs:r.bold=True
 trPr=t.rows[0]._tr.get_or_add_trPr(); rep=OxmlElement('w:tblHeader'); rep.set(qn('w:val'),'true'); trPr.append(rep)
 for row in rows:
  cells=t.add_row().cells
  for i,val in enumerate(row):
   cells[i].text=str(val); cells[i].vertical_alignment=WD_CELL_VERTICAL_ALIGNMENT.CENTER
   for p in cells[i].paragraphs:
    p.paragraph_format.space_after=Pt(0);p.paragraph_format.line_spacing=1.05
    for r in p.runs:r.font.name='Times New Roman';r.font.size=Pt(10.5)
 widths(t,ws); d.add_paragraph().paragraph_format.space_after=Pt(1)
 return t
def h(text,l=1): d.add_paragraph(text,style='Heading '+str(l))
def p(text,bold=False):
 x=d.add_paragraph(); r=x.add_run(text);r.bold=bold; return x

p1=d.add_paragraph();p1.alignment=WD_ALIGN_PARAGRAPH.CENTER;r=p1.add_run('DANH MỤC ACTOR VÀ USE CASE HỆ THỐNG NOVACARE');r.bold=True;r.font.name='Times New Roman';r.font.size=Pt(17)
p2=d.add_paragraph('Tài liệu hỗ trợ phân chia đặc tả Use Case và Sequence Diagram',style='Subtitle');p2.alignment=WD_ALIGN_PARAGRAPH.CENTER
p('Phạm vi: Danh mục được tổng hợp từ vai trò trong prisma/schema.prisma, các controller NestJS, route web và navigation Android. Các use case được đánh dấu “Ưu tiên” là nhóm nên đặc tả chi tiết và vẽ sequence trong báo cáo.')
h('1. DANH SÁCH ACTOR')
table(['Mã actor','Actor','Loại','Phạm vi trách nhiệm'],[
['ACT-01','Khách chưa đăng nhập','Con người','Tra cứu công khai và khởi tạo tài khoản'],
['ACT-02','Người bệnh (PATIENT)','Con người','Sử dụng dịch vụ khám, hồ sơ, sàng lọc và tư vấn'],
['ACT-03','Bác sĩ (DOCTOR)','Con người','Tham gia và xử lý tư vấn từ xa; nghiệp vụ lâm sàng được cấp quyền'],
['ACT-04','Quản trị viên cơ sở (HOSPITAL_ADMIN)','Con người','Vận hành dữ liệu, lịch hẹn và tích hợp trong phạm vi cơ sở'],
['ACT-05','Quản trị viên hệ thống (ADMIN)','Con người','Quản trị toàn hệ thống, dữ liệu danh mục và kiểm duyệt'],
['ACT-06','VNPay','Hệ thống ngoài','Thanh toán và phản hồi IPN'],
['ACT-07','LiveKit','Hệ thống ngoài','Phòng/tokens video tư vấn và webhook'],
['ACT-08','Dịch vụ AI','Hệ thống ngoài','Xử lý nội dung, ảnh, giọng nói và gợi ý chuyên khoa'],
['ACT-09','HIS đối tác/mô phỏng','Hệ thống ngoài','Handshake, đồng bộ danh mục và liên thông'],
['ACT-10','Firebase/Email/Queue','Hệ thống ngoài','Thông báo đẩy, email và xử lý nền'],
],[2,4,3,7])

groups=[
('2. USE CASE CỦA KHÁCH CHƯA ĐĂNG NHẬP',[
('UC-G01','Xem danh sách cơ sở y tế','Tra cứu cơ sở công khai',''),('UC-G02','Xem chuyên khoa','Tra cứu danh mục chuyên khoa',''),('UC-G03','Xem danh sách/chi tiết bác sĩ','Tra cứu thông tin bác sĩ',''),('UC-G04','Tìm kiếm','Tìm cơ sở, bác sĩ hoặc chuyên khoa',''),('UC-G05','Gửi yêu cầu hợp tác','Gửi thông tin đối tác tiềm năng',''),('UC-G06','Đăng ký bằng OTP','Tạo tài khoản người dùng','Khuyến nghị'),('UC-G07','Đăng nhập','Xác thực và nhận token','Khuyến nghị'),('UC-G08','Quên/đặt lại mật khẩu','Khôi phục quyền truy cập','')]),
('3. USE CASE CỦA NGƯỜI BỆNH',[
('UC-P01','Quản lý tài khoản','Xem/cập nhật thông tin tài khoản',''),('UC-P02','Quản lý hồ sơ người đi khám','Tạo, sửa, xóa, đặt mặc định hồ sơ','Khuyến nghị'),('UC-P03','Tìm kiếm cơ sở, chuyên khoa, bác sĩ','Lọc và xem lựa chọn khám',''),('UC-P04','Xem chi tiết cơ sở','Xem dịch vụ, chuyên khoa, bác sĩ',''),('UC-P05','Xem suất khám','Tra cứu lịch trống theo bác sĩ/cơ sở',''),('UC-P06','Đặt lịch khám theo cơ sở','Chọn cơ sở, chuyên khoa/dịch vụ, bác sĩ, thời điểm, hồ sơ','Ưu tiên 1'),('UC-P07','Đặt lịch theo bác sĩ','Tạo lịch từ trang bác sĩ',''),('UC-P08','Xem lịch khám','Xem lịch sắp tới và lịch sử',''),('UC-P09','Xem chi tiết lịch khám','Theo dõi thông tin, trạng thái, hồ sơ liên quan',''),('UC-P10','Hủy lịch khám','Hủy lịch theo điều kiện nghiệp vụ','Khuyến nghị'),('UC-P11','Đổi lịch khám','Chọn suất thay thế và cập nhật lịch','Khuyến nghị'),('UC-P12','Thanh toán trực tuyến','Tạo giao dịch và nhận phản hồi thanh toán','Ưu tiên 2'),('UC-P13','Xem trạng thái thanh toán','Tra cứu PaymentTransaction',''),('UC-P14','Quản lý thông báo','Xem, đánh dấu đã đọc, xem số chưa đọc',''),('UC-P15','Thực hiện sàng lọc tiền khám','Nhập triệu chứng, vùng cơ thể, câu hỏi và dữ liệu hỗ trợ','Ưu tiên 3'),('UC-P16','Gửi ảnh sàng lọc','Gửi ảnh khi đã đồng ý xử lý AI',''),('UC-P17','Chuyển giọng nói thành văn bản','Gửi âm thanh để nhận bản chép lời xác nhận',''),('UC-P18','Xem kết quả định hướng','Xem mức nguy cơ, chuyên khoa, bằng chứng và hành động tiếp theo',''),('UC-P19','Đặt lịch từ kết quả sàng lọc','Chuyển gợi ý chuyên khoa vào luồng đặt lịch','Ưu tiên 4'),('UC-P20','Xem hồ sơ sức khỏe','Xem lượt khám, chẩn đoán, chỉ số, đơn thuốc khi được phép',''),('UC-P21','Chia sẻ hồ sơ sức khỏe','Tạo/cấp quyền đồng ý chia sẻ dữ liệu','Ưu tiên 5'),('UC-P22','Thu hồi quyền chia sẻ','Thu hồi consent đã cấp',''),('UC-P23','Tạo phiên tư vấn từ xa','Tạo phiên tư vấn từ lịch hẹn hợp lệ','Ưu tiên 6'),('UC-P24','Nhắn tin tư vấn','Gửi/nhận tin nhắn và trạng thái đã đọc',''),('UC-P25','Gửi tệp tư vấn','Gửi tệp đính kèm trong phiên',''),('UC-P26','Tham gia tư vấn video','Nhận token và tham gia phòng video','Ưu tiên 7'),('UC-P27','Đánh giá bác sĩ/cơ sở','Gửi đánh giá sau lịch khám',''),('UC-P28','Báo cáo đánh giá','Báo nội dung đánh giá không phù hợp','')]),
('4. USE CASE CỦA BÁC SĨ',[
('UC-D01','Xem hộp thư tư vấn','Xem danh sách phiên tư vấn được phân công',''),('UC-D02','Xem chi tiết phiên','Xem người bệnh, lịch hẹn và nội dung phiên',''),('UC-D03','Chấp nhận phiên tư vấn','Chuyển trạng thái sang ACCEPTED','Khuyến nghị'),('UC-D04','Bắt đầu phiên tư vấn','Chuyển trạng thái phiên sang ACTIVE','Khuyến nghị'),('UC-D05','Hoàn tất phiên tư vấn','Kết thúc phiên theo nghiệp vụ',''),('UC-D06','Hủy phiên tư vấn','Hủy phiên hợp lệ',''),('UC-D07','Nhắn tin/gửi tệp','Tương tác với người bệnh trong phiên',''),('UC-D08','Tham gia video','Nhận token LiveKit nếu đủ điều kiện',''),('UC-D09','Phản hồi đánh giá','Phản hồi review với vai trò được phép',''),('UC-D10','Quản lý lượt khám lâm sàng','Thêm chẩn đoán, chỉ số, đơn thuốc; hoàn tất/phát hành lượt khám','Khuyến nghị')]),
('5. USE CASE CỦA QUẢN TRỊ VIÊN CƠ SỞ Y TẾ',[
('UC-HA01','Xem dashboard cơ sở','Xem số liệu tổng quan phạm vi cơ sở',''),('UC-HA02','Cập nhật thông tin cơ sở','Cập nhật thông tin bệnh viện của mình',''),('UC-HA03','Quản lý bác sĩ thuộc cơ sở','Xem/cập nhật nơi làm việc, phí khám, trạng thái',''),('UC-HA04','Quản lý chuyên khoa/dịch vụ','Xem danh mục, cập nhật giá và trạng thái dịch vụ',''),('UC-HA05','Xem lịch làm việc','Xem lịch bác sĩ tại cơ sở',''),('UC-HA06','Quản lý lịch hẹn','Xem, lọc và cập nhật trạng thái lịch',''),('UC-HA07','Check-in người bệnh','Tiếp đón người bệnh đến khám','Ưu tiên 8'),('UC-HA08','Quản lý no-show','Kiểm tra điều kiện, đánh dấu/khôi phục no-show',''),('UC-HA09','Ghi nhận liên hệ','Lưu lịch sử gọi điện/SMS với người bệnh',''),('UC-HA10','Kiểm tra handshake HIS','Kiểm tra kết nối với endpoint HIS',''),('UC-HA11','Đồng bộ danh mục HIS','Đồng bộ khoa phòng/bác sĩ từ HIS','Ưu tiên 9'),('UC-HA12','Xem trạng thái tích hợp HIS','Theo dõi trạng thái liên thông','')]),
('6. USE CASE CỦA QUẢN TRỊ VIÊN HỆ THỐNG',[
('UC-A01','Xem dashboard hệ thống','Xem thống kê lịch hẹn, doanh thu, cơ sở, bác sĩ',''),('UC-A02','Quản lý người dùng','Xem danh sách, trạng thái và chi tiết người dùng',''),('UC-A03','Phân quyền người dùng','Cập nhật role và phạm vi cơ sở','Ưu tiên 10'),('UC-A04','Tạo quản trị viên cơ sở','Tạo tài khoản HOSPITAL_ADMIN',''),('UC-A05','Quản lý cơ sở y tế','Tạo, sửa, xóa, kích hoạt cơ sở',''),('UC-A06','Quản lý chuyên khoa','Tạo, sửa, xóa, bật/tắt chuyên khoa',''),('UC-A07','Quản lý bác sĩ','Tạo, sửa, xóa và cấp tài khoản bác sĩ',''),('UC-A08','Quản lý dịch vụ/gói khám','Quản lý danh mục cung cấp',''),('UC-A09','Quản lý lịch hẹn toàn hệ thống','Theo dõi và cập nhật lịch theo quyền',''),('UC-A10','Quản lý thanh toán','Xem giao dịch và hoàn tiền',''),('UC-A11','Xem audit log','Tra cứu hoạt động hệ thống',''),('UC-A12','Xử lý yêu cầu hợp tác','Xem, cập nhật trạng thái, phê duyệt yêu cầu',''),('UC-A13','Kiểm duyệt đánh giá','Duyệt/từ chối/ẩn review; xử lý báo cáo','Khuyến nghị'),('UC-A14','Theo dõi liên thông','Xem dashboard/gateway/audit liên thông','')]),
('7. USE CASE HỆ THỐNG TÍCH HỢP',[
('UC-E01','Tạo và nhận kết quả thanh toán','VNPay - tạo URL, IPN, kiểm tra chữ ký','Sequence'),('UC-E02','Cấp quyền vào video','LiveKit - kiểm tra điều kiện, tạo room/token','Sequence'),('UC-E03','Xử lý webhook video','LiveKit - xác minh webhook, audit event',''),('UC-E04','Phân tích sàng lọc AI','AI - trích xuất, ảnh, RAG/LLM, kiểm tra bằng chứng','Sequence'),('UC-E05','Gửi thông báo','FCM/Email/Queue - tác vụ nền liên quan lịch/thanh toán',''),('UC-E06','Handshake/đồng bộ HIS','HIS - kiểm tra endpoint, chuẩn hóa, lưu danh mục','Sequence')])]
for heading,rows in groups:
 h(heading)
 table(['Mã','Tên use case','Mục tiêu ngắn','Đề xuất'],rows,[2,4.1,8,2.4])

h('8. DANH SÁCH ƯU TIÊN VIẾT ĐẶC TẢ VÀ VẼ SEQUENCE')
table(['STT','Use case','Actor chính','Thành phần chính trong sequence','Mức'],[
['1','UC-P06 - Đặt lịch khám theo cơ sở','Người bệnh','Client → Appointment API → kiểm tra slot/hồ sơ → Database → thông báo','Cốt lõi'],
['2','UC-P12 - Thanh toán trực tuyến','Người bệnh, VNPay','Client → Payment API → VNPay → IPN → PaymentTransaction/Appointment → Queue','Cốt lõi'],
['3','UC-P15 - Sàng lọc tiền khám','Người bệnh, AI','Client → PreExam API → rule/red flag → AI/RAG → kết quả','Cốt lõi'],
['4','UC-P19 - Đặt lịch từ kết quả sàng lọc','Người bệnh','Kết quả sàng lọc → chọn cơ sở → kiểm tra chuyên khoa/slot → tạo lịch','Cốt lõi'],
['5','UC-P21 - Chia sẻ hồ sơ sức khỏe','Người bệnh','Client → Consent API → PatientConsent → AuditLog','Cốt lõi'],
['6','UC-P23 - Tạo phiên tư vấn','Người bệnh','Client → Consultation API → kiểm tra lịch → ConsultationSession','Cốt lõi'],
['7','UC-P26 - Tham gia video','Người bệnh/Bác sĩ, LiveKit','Client → Video API → xác thực điều kiện → token LiveKit','Cốt lõi'],
['8','UC-HA07 - Check-in người bệnh','Quản trị cơ sở','Portal → HospitalAdmin API → Appointment/History','Nghiệp vụ'],
['9','UC-HA11 - Đồng bộ HIS','Quản trị cơ sở, HIS','Portal → Integration API → HIS → chuẩn hóa → Database','Tích hợp'],
['10','UC-A03 - Phân quyền người dùng','Quản trị hệ thống','Portal → Admin API → User/Role → AuditLog','Quản trị'],
],[1,4.5,3,6,1.5])
h('9. GỢI Ý CẤU TRÚC ĐẶC TẢ USE CASE')
p('Mỗi use case ưu tiên nên viết theo mẫu: Mã use case; tên; mục tiêu; actor chính và actor phụ; tiền điều kiện; hậu điều kiện; luồng chính; luồng thay thế/ngoại lệ; dữ liệu vào/ra; quy tắc nghiệp vụ; API, bảng dữ liệu và source code liên quan.')
p('Lưu ý: Không mô tả AI là tác nhân ra quyết định chẩn đoán. Trong NovaCare, AI và các luật chỉ hỗ trợ định hướng; trường hợp red flag được ưu tiên xử lý theo quy tắc an toàn.')
d.core_properties.title='Danh mục Actor và Use Case NovaCare'
d.save(OUT); print(OUT)
