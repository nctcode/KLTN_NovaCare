import docx
from docx.shared import Pt, Inches
from docx.enum.text import WD_ALIGN_PARAGRAPH

# Load document
doc_path = 'd:/HTTT18B/KLTN/NovaCare/docs/N16_KLTN_NovaCare_Final.docx'
doc = docx.Document(doc_path)

abbreviations = [
    ("ACID", "Các thuộc tính đảm bảo độ tin cậy giao dịch CSDL (Atomicity, Consistency, Isolation, Durability)"),
    ("AI", "Trí tuệ nhân tạo (Artificial Intelligence)"),
    ("API", "Giao diện lập trình ứng dụng (Application Programming Interface)"),
    ("ASR", "Nhận dạng giọng nói tự động (Automatic Speech Recognition)"),
    ("BHYT", "Bảo hiểm y tế"),
    ("BLE", "Bluetooth năng lượng thấp (Bluetooth Low Energy)"),
    ("BPM", "Nhịp tim trên phút (Beats Per Minute)"),
    ("BS", "Bác sĩ"),
    ("BV", "Bệnh viện"),
    ("CSDL", "Cơ sở dữ liệu"),
    ("EMR", "Hồ sơ bệnh án điện tử (Electronic Medical Record)"),
    ("ERD", "Sơ đồ quan hệ thực thể (Entity Relationship Diagram)"),
    ("FFT", "Biến đổi Fourier nhanh (Fast Fourier Transform)"),
    ("FHIR", "Chuẩn tương tác tài nguyên y tế nhanh (Fast Healthcare Interoperability Resources)"),
    ("GVHD", "Giảng viên hướng dẫn"),
    ("HIS", "Hệ thống thông tin bệnh viện (Hospital Information System)"),
    ("HL7", "Chuẩn truyền thông và trao đổi dữ liệu y tế (Health Level Seven)"),
    ("HRV", "Độ biến thiên nhịp tim (Heart Rate Variability)"),
    ("HTTP", "Giao thức truyền tải siêu văn bản (Hypertext Transfer Protocol)"),
    ("HTTPS", "Giao thức truyền tải siêu văn bản an toàn (Hypertext Transfer Protocol Secure)"),
    ("JSON", "Định dạng trao đổi dữ liệu JavaScript (JavaScript Object Notation)"),
    ("JWT", "Mã xác thực JSON (JSON Web Token)"),
    ("KLTN", "Khóa luận tốt nghiệp"),
    ("LED", "Đi-ốt phát quang (Light Emitting Diode)"),
    ("LLM", "Mô hình ngôn ngữ lớn (Large Language Model)"),
    ("ORM", "Ánh xạ đối tượng - quan hệ (Object-Relational Mapping)"),
    ("OTP", "Mật khẩu dùng một lần (One-Time Password)"),
    ("PACS", "Hệ thống lưu trữ và truyền tải hình ảnh y tế (Picture Archiving and Communication System)"),
    ("PDF", "Định dạng tài liệu di động (Portable Document Format)"),
    ("PPG", "Phương pháp đo quang thể tích (Photoplethysmography)"),
    ("QR", "Mã phản hồi nhanh (Quick Response Code)"),
    ("RAG", "Kỹ thuật sinh tăng cường truy hồi tri thức (Retrieval-Augmented Generation)"),
    ("RBAC", "Kiểm soát truy cập dựa trên vai trò (Role-Based Access Control)"),
    ("REST", "Kiểu kiến trúc truyền trạng thái đại diện (Representational State Transfer)"),
    ("SFU", "Đơn vị chuyển tiếp có chọn lọc trong WebRTC (Selective Forwarding Unit)"),
    ("SMS", "Dịch vụ tin nhắn ngắn (Short Message Service)"),
    ("SpO2", "Độ bão hòa oxy trong máu mao mạch ngoại vi"),
    ("SQL", "Ngôn ngữ truy vấn có cấu trúc (Structured Query Language)"),
    ("STT", "Số thứ tự"),
    ("SVTH", "Sinh viên thực hiện"),
    ("UI", "Giao diện người dùng (User Interface)"),
    ("UX", "Trải nghiệm người dùng (User Experience)"),
    ("WebRTC", "Giao tiếp thời gian thực trên nền web (Web Real-Time Communication)")
]

# Sort alphabetically by abbreviation
abbreviations = sorted(abbreviations, key=lambda x: x[0].upper())

t0 = doc.tables[0]

# Remove existing data rows (keep header row 0)
while len(t0.rows) > 1:
    tr = t0.rows[-1]._tr
    t0._tbl.remove(tr)

# Add new rows
for abbr, desc in abbreviations:
    row = t0.add_row()
    # Cell 0
    c0 = row.cells[0]
    c0.text = abbr
    p0 = c0.paragraphs[0]
    p0.alignment = WD_ALIGN_PARAGRAPH.LEFT
    for r in p0.runs:
        r.font.name = 'Times New Roman'
        r.font.size = Pt(11)
        r.bold = True
    
    # Cell 1
    c1 = row.cells[1]
    c1.text = desc
    p1 = c1.paragraphs[0]
    p1.alignment = WD_ALIGN_PARAGRAPH.LEFT
    for r in p1.runs:
        r.font.name = 'Times New Roman'
        r.font.size = Pt(11)
        r.bold = False

doc.save(doc_path)
print(f"Successfully updated Table 0 with {len(abbreviations)} abbreviations in {doc_path}")
