from copy import deepcopy
from docx import Document
from docx.shared import Pt
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml.ns import qn

PATH = 'Đặc tả admin Bệnh viện.docx'
ACTOR = 'Quản trị viên cơ sở y tế'

def fmt(p, center=False, bold=False):
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER if center else WD_ALIGN_PARAGRAPH.LEFT
    p.paragraph_format.line_spacing = 1.15
    p.paragraph_format.space_after = Pt(0)
    for r in p.runs:
        r.font.name = 'Times New Roman'; r._element.rPr.rFonts.set(qn('w:eastAsia'), 'Times New Roman'); r.font.size = Pt(13); r.bold = bold

def put(cell, text, center=False, bold=False):
    cell.text = ''
    p = cell.paragraphs[0]
    r = p.add_run(text)
    fmt(p, center, bold)

def add_row_before(table, index):
    row = deepcopy(table.rows[index]._tr)
    table.rows[index]._tr.addprevious(row)
    return table.rows[index-1]

def pairs(title):
    n = title.lower()
    if title == 'Xem danh sách bác sĩ':
        return [('Mở chức năng Đội ngũ bác sĩ.', 'Tải danh sách bác sĩ thuộc cơ sở y tế hiện tại.'), ('Nhập từ khóa hoặc chọn điều kiện lọc nếu cần.', 'Lọc và hiển thị các bác sĩ phù hợp.'), ('Xem thông tin tóm tắt của bác sĩ trong danh sách.', 'Hiển thị trạng thái, chuyên khoa và thông tin liên quan.'), ('Chọn một bác sĩ nếu cần xem hồ sơ.', 'Mở chức năng xem chi tiết hồ sơ bác sĩ.')]
    if title == 'Xem chi tiết hồ sơ bác sĩ':
        return [('Mở danh sách đội ngũ bác sĩ.', 'Hiển thị danh sách bác sĩ thuộc cơ sở.'), ('Chọn một bác sĩ cần xem.', 'Tải hồ sơ bác sĩ tương ứng.'), ('Xem thông tin cá nhân, chuyên môn, chuyên khoa và trạng thái công tác.', 'Hiển thị đầy đủ dữ liệu hồ sơ trong cửa sổ chi tiết.'), ('Đóng cửa sổ chi tiết.', 'Quay lại danh sách đội ngũ bác sĩ.')]
    if title == 'Chỉnh sửa hồ sơ bác sĩ':
        return [('Mở hồ sơ bác sĩ cần chỉnh sửa.', 'Hiển thị biểu mẫu với dữ liệu hiện tại.'), ('Cập nhật các thông tin được phép chỉnh sửa.', 'Kiểm tra dữ liệu nhập và các trường bắt buộc.'), ('Xác nhận lưu hồ sơ.', 'Cập nhật hồ sơ bác sĩ trong cơ sở dữ liệu.'), ('Xem lại hồ sơ sau khi lưu.', 'Thông báo kết quả và hiển thị dữ liệu mới.')]
    if title == 'Thêm bác sĩ':
        return [('Mở biểu mẫu thêm bác sĩ.', 'Hiển thị các trường hồ sơ, chuyên môn và thông tin làm việc.'), ('Nhập thông tin bác sĩ và chọn chuyên khoa áp dụng.', 'Kiểm tra các trường bắt buộc và định dạng dữ liệu.'), ('Xác nhận tạo hồ sơ.', 'Tạo bác sĩ và gắn bác sĩ với cơ sở y tế hiện tại.'), ('Mở lại danh sách bác sĩ.', 'Thông báo thành công và hiển thị bác sĩ vừa tạo.')]
    if 'dịch vụ y tế' in n:
        if 'tra cứu' in n:
            return [('Mở danh mục Dịch vụ y tế.', 'Tải danh sách dịch vụ của cơ sở hiện tại.'), ('Nhập từ khóa hoặc chọn bộ lọc chuyên khoa, trạng thái.', 'Truy vấn và hiển thị các dịch vụ phù hợp.'), ('Xem tên, giá, thời lượng và trạng thái dịch vụ.', 'Hiển thị thông tin tóm tắt theo kết quả lọc.'), ('Xóa điều kiện lọc nếu cần.', 'Tải lại toàn bộ dịch vụ của cơ sở.')]
        if 'chi tiết' in n:
            return [('Mở danh sách dịch vụ y tế.', 'Hiển thị các dịch vụ thuộc cơ sở.'), ('Chọn một dịch vụ.', 'Tải thông tin chi tiết của dịch vụ.'), ('Xem chuyên khoa áp dụng, giá, thời lượng, mô tả và trạng thái.', 'Hiển thị dữ liệu dịch vụ trong cửa sổ chi tiết.'), ('Đóng phần chi tiết.', 'Quay lại danh sách dịch vụ.')]
        if 'thêm' in n:
            return [('Mở biểu mẫu thêm dịch vụ.', 'Hiển thị trường tên, chuyên khoa, giá, thời lượng, mô tả và trạng thái.'), ('Nhập thông tin dịch vụ và chọn chuyên khoa của bệnh viện.', 'Kiểm tra dữ liệu bắt buộc và giá trị hợp lệ.'), ('Xác nhận lưu dịch vụ.', 'Tạo dịch vụ gắn với cơ sở y tế hiện tại.'), ('Quay lại danh sách dịch vụ.', 'Thông báo thành công và hiển thị dịch vụ mới.')]
        return [('Chọn dịch vụ cần chỉnh sửa.', 'Hiển thị biểu mẫu với dữ liệu hiện tại.'), ('Cập nhật thông tin được phép thay đổi.', 'Kiểm tra dữ liệu trước khi lưu.'), ('Xác nhận cập nhật.', 'Lưu thay đổi cho dịch vụ của cơ sở.'), ('Xem lại danh sách dịch vụ.', 'Thông báo kết quả và hiển thị dữ liệu mới.')]
    if 'gói khám' in n:
        if 'tra cứu' in n:
            return [('Mở danh mục Gói khám sức khỏe.', 'Tải danh sách gói khám của cơ sở hiện tại.'), ('Nhập từ khóa hoặc chọn bộ lọc trạng thái, chuyên khoa.', 'Truy vấn và hiển thị các gói khám phù hợp.'), ('Xem tên gói, giá bán, thời lượng và trạng thái.', 'Hiển thị thông tin tóm tắt của từng gói.'), ('Xóa bộ lọc nếu cần.', 'Tải lại danh sách gói khám.')]
        if 'chi tiết' in n:
            return [('Mở danh sách gói khám.', 'Hiển thị các gói khám của cơ sở.'), ('Chọn một gói khám.', 'Tải thông tin chi tiết gói khám.'), ('Xem chuyên khoa, dịch vụ đi kèm, giá, thời gian, mô tả và trạng thái.', 'Hiển thị đầy đủ nội dung gói khám.'), ('Đóng phần chi tiết.', 'Quay lại danh sách gói khám.')]
        if 'thêm' in n:
            return [('Mở biểu mẫu thêm gói khám.', 'Hiển thị các trường thông tin gói và danh mục dịch vụ của bệnh viện.'), ('Nhập tên, chuyên khoa, giá, thời gian, mô tả và chọn dịch vụ đi kèm.', 'Kiểm tra dữ liệu bắt buộc và các dịch vụ đã chọn.'), ('Xác nhận lưu gói khám.', 'Tạo gói khám gắn với cơ sở y tế hiện tại.'), ('Mở danh sách gói khám.', 'Thông báo thành công và hiển thị gói vừa tạo.')]
        if 'chỉnh sửa' in n:
            return [('Chọn gói khám cần chỉnh sửa.', 'Hiển thị biểu mẫu với dữ liệu hiện tại.'), ('Cập nhật thông tin, chuyên khoa hoặc dịch vụ đi kèm.', 'Kiểm tra dữ liệu và quan hệ dịch vụ của gói.'), ('Xác nhận cập nhật.', 'Lưu thay đổi cho gói khám của cơ sở.'), ('Xem lại danh sách.', 'Thông báo kết quả và hiển thị dữ liệu mới.')]
        return [('Chọn gói khám cần thay đổi trạng thái.', 'Hiển thị trạng thái hiện tại.'), ('Chọn trạng thái hoạt động hoặc ngừng hoạt động.', 'Kiểm tra điều kiện cập nhật trạng thái.'), ('Xác nhận thay đổi.', 'Lưu trạng thái mới của gói khám.'), ('Xem lại danh sách.', 'Hiển thị trạng thái mới và khả năng đặt khám tương ứng.')]
    if 'chuyên khoa' in n:
        if 'danh sách' in n:
            return [('Mở danh sách chuyên khoa tiếp nhận.', 'Tải các chuyên khoa đang được cơ sở tiếp nhận.'), ('Nhập từ khóa hoặc chọn trạng thái nếu có.', 'Lọc và hiển thị chuyên khoa phù hợp.'), ('Xem tên, mô tả và trạng thái tiếp nhận.', 'Hiển thị thông tin theo dữ liệu của cơ sở.'), ('Chọn một chuyên khoa.', 'Mở phần chi tiết chuyên khoa.')]
        if 'chi tiết' in n:
            return [('Mở danh sách chuyên khoa tiếp nhận.', 'Hiển thị các chuyên khoa của cơ sở.'), ('Chọn một chuyên khoa.', 'Tải thông tin chi tiết chuyên khoa.'), ('Xem tên, mô tả và trạng thái tiếp nhận.', 'Hiển thị dữ liệu chuyên khoa.'), ('Đóng phần chi tiết.', 'Quay lại danh sách chuyên khoa.')]
        if 'tiếp nhận chuyên khoa' in n:
            return [('Mở chức năng tiếp nhận chuyên khoa.', 'Hiển thị danh mục chuyên khoa chuẩn có thể chọn.'), ('Chọn chuyên khoa muốn cơ sở tiếp nhận.', 'Kiểm tra chuyên khoa đã tồn tại trong danh mục của cơ sở.'), ('Xác nhận tiếp nhận.', 'Tạo liên kết chuyên khoa với cơ sở y tế.'), ('Mở danh sách tiếp nhận.', 'Thông báo thành công và hiển thị chuyên khoa mới.')]
        return [('Chọn chuyên khoa trong danh sách tiếp nhận.', 'Hiển thị trạng thái hiện tại.'), ('Chọn trạng thái tiếp nhận cần áp dụng.', 'Kiểm tra quyền và điều kiện cập nhật.'), ('Xác nhận thay đổi.', 'Lưu trạng thái tiếp nhận của chuyên khoa.'), ('Xem lại danh sách.', 'Hiển thị trạng thái mới.')]
    if 'lịch làm việc' in n:
        if 'tra cứu' in n:
            return [('Mở chức năng Lịch làm việc.', 'Tải lịch làm việc của bác sĩ thuộc cơ sở.'), ('Chọn bác sĩ, chuyên khoa, ngày hoặc chế độ lịch tuần.', 'Lọc và hiển thị các ca làm việc phù hợp.'), ('Xem ngày, khung giờ, trạng thái và thông tin ca.', 'Hiển thị lịch theo danh sách hoặc lịch tuần.'), ('Chọn một ca nếu cần xem hoặc chỉnh sửa.', 'Mở thao tác tương ứng với ca đã chọn.')]
        if 'thêm' in n:
            return [('Mở biểu mẫu thêm lịch làm việc.', 'Hiển thị các trường bác sĩ, ngày, khung giờ và thông tin ca.'), ('Chọn bác sĩ và nhập thời gian làm việc.', 'Kiểm tra dữ liệu và xung đột lịch.'), ('Xác nhận tạo lịch.', 'Lưu lịch làm việc cho bác sĩ thuộc cơ sở.'), ('Quay lại lịch làm việc.', 'Thông báo thành công và hiển thị ca mới.')]
        if 'chỉnh sửa' in n:
            return [('Chọn ca làm việc cần chỉnh sửa.', 'Hiển thị thông tin hiện tại của ca.'), ('Cập nhật ngày, khung giờ hoặc thông tin ca.', 'Kiểm tra trùng lịch và dữ liệu hợp lệ.'), ('Xác nhận lưu.', 'Cập nhật lịch làm việc trong cơ sở dữ liệu.'), ('Xem lại lịch.', 'Thông báo kết quả và hiển thị lịch mới.')]
        return [('Chọn ca làm việc cần xóa.', 'Hiển thị thông tin ca được chọn.'), ('Xác nhận xóa ca.', 'Kiểm tra ca chưa có ràng buộc đặt khám.'), ('Hoàn tất thao tác xóa.', 'Xóa ca và cập nhật lịch hiển thị.'), ('Xem lại lịch.', 'Thông báo kết quả xử lý.')]
    if 'lịch hẹn' in n:
        if 'tra cứu' in n:
            return [('Mở danh sách lịch hẹn bệnh nhân.', 'Tải lịch hẹn thuộc cơ sở hiện tại.'), ('Nhập từ khóa hoặc lọc theo ngày, bác sĩ, chuyên khoa và trạng thái.', 'Truy vấn và hiển thị lịch hẹn phù hợp.'), ('Xem thông tin tóm tắt lịch hẹn.', 'Hiển thị bệnh nhân, thời gian, dịch vụ và trạng thái.'), ('Chọn một lịch hẹn.', 'Mở chi tiết lịch hẹn.')]
        if 'chi tiết' in n:
            return [('Mở danh sách lịch hẹn.', 'Hiển thị các lịch hẹn thuộc cơ sở.'), ('Chọn một lịch hẹn.', 'Tải thông tin chi tiết lịch hẹn.'), ('Xem bệnh nhân, dịch vụ, bác sĩ, thời gian và trạng thái.', 'Hiển thị chi tiết lịch hẹn và dữ liệu liên quan.'), ('Đóng phần chi tiết.', 'Quay lại danh sách lịch hẹn.')]
        if 'cập nhật trạng thái' in n:
            return [('Mở chi tiết lịch hẹn cần xử lý.', 'Hiển thị trạng thái hiện tại và các trạng thái được phép chuyển.'), ('Chọn trạng thái nghiệp vụ phù hợp.', 'Kiểm tra điều kiện chuyển trạng thái.'), ('Xác nhận cập nhật.', 'Lưu trạng thái mới và ghi nhận lịch sử thay đổi.'), ('Tiếp tục xem lịch hẹn.', 'Hiển thị trạng thái mới trên chi tiết và danh sách.')]
        return [('Mở chi tiết lịch hẹn cần liên hệ.', 'Hiển thị thông tin bệnh nhân và lịch hẹn.'), ('Nhập kênh liên hệ, kết quả và ghi chú.', 'Kiểm tra dữ liệu bắt buộc.'), ('Xác nhận ghi nhận liên hệ.', 'Lưu bản ghi liên hệ gắn với lịch hẹn.'), ('Mở lịch sử liên hệ.', 'Hiển thị bản ghi vừa lưu.')]
    if title == 'Xem hồ sơ cơ sở y tế':
        return [('Mở chức năng Hồ sơ cơ sở y tế.', 'Tải hồ sơ của cơ sở đang đăng nhập.'), ('Xem thông tin cơ bản, liên hệ, địa chỉ và trạng thái.', 'Hiển thị dữ liệu hồ sơ hiện tại.'), ('Xem các số liệu tổng quan được cung cấp.', 'Tải và hiển thị số liệu liên quan đến cơ sở.'), ('Rời khỏi trang hồ sơ.', 'Giữ nguyên dữ liệu vì thao tác này chỉ xem.')]
    if title == 'Chỉnh sửa hồ sơ cơ sở y tế':
        return [('Mở hồ sơ cơ sở y tế và chuyển sang chế độ chỉnh sửa.', 'Hiển thị biểu mẫu với dữ liệu hiện tại.'), ('Cập nhật thông tin được phép thay đổi.', 'Kiểm tra dữ liệu và trường bắt buộc.'), ('Xác nhận lưu hồ sơ.', 'Cập nhật thông tin cơ sở y tế hiện tại.'), ('Xem lại hồ sơ.', 'Thông báo kết quả và hiển thị dữ liệu mới.')]
    if 'cấu hình và trạng thái' in n:
        return [('Mở trang tích hợp HIS.', 'Tải cấu hình và trạng thái tích hợp của cơ sở.'), ('Xem Endpoint, phương thức xác thực và trạng thái gần nhất.', 'Hiển thị cấu hình, thời gian kiểm tra và đồng bộ gần nhất.'), ('Xem trạng thái kết nối hiện tại.', 'Hiển thị đã kết nối, chưa cấu hình hoặc lỗi kết nối.'), ('Tiếp tục cấu hình hoặc kiểm tra khi cần.', 'Mở thao tác tương ứng trên cùng trang.')]
    if 'cấu hình cổng' in n:
        return [('Mở phần cấu hình cổng kết nối HIS.', 'Hiển thị biểu mẫu Endpoint và phương thức xác thực.'), ('Nhập Endpoint URL và thông tin xác thực theo cấu hình của bệnh viện.', 'Kiểm tra định dạng và dữ liệu bắt buộc.'), ('Xác nhận lưu cấu hình.', 'Lưu cấu hình cho cơ sở y tế hiện tại.'), ('Xem trạng thái tích hợp.', 'Thông báo lưu thành công và hiển thị cấu hình đã lưu.')]
    if 'kiểm tra kết nối' in n:
        return [('Mở thao tác kiểm tra kết nối HIS.', 'Hiển thị cấu hình sẽ được sử dụng để kiểm tra.'), ('Xác nhận thực hiện kiểm tra.', 'Gửi yêu cầu đến Endpoint HIS của cơ sở.'), ('Chờ phản hồi từ HIS.', 'Hiển thị mã phản hồi, thời gian và trạng thái kết nối.'), ('Xem thông tin lỗi nếu kiểm tra thất bại.', 'Lưu trạng thái kiểm tra gần nhất và nguyên nhân lỗi.')]
    if 'đồng bộ dữ liệu' in n:
        return [('Mở thao tác đồng bộ dữ liệu HIS.', 'Hiển thị cấu hình và kế hoạch dữ liệu sẽ đồng bộ.'), ('Xác nhận kế hoạch đồng bộ và dữ liệu cần xử lý.', 'Kiểm tra cấu hình, kết nối và quyền đồng bộ.'), ('Theo dõi tiến trình đồng bộ.', 'Đọc, chuẩn hóa, đối chiếu và ghi nhận dữ liệu từ HIS.'), ('Xem báo cáo sau khi hoàn tất.', 'Hiển thị số bản ghi tạo mới, cập nhật, giữ nguyên và lỗi.')]
    if 'kết quả đồng bộ' in n:
        return [('Mở phần kết quả đồng bộ.', 'Tải kết quả của lần đồng bộ gần nhất.'), ('Chọn lần đồng bộ cần xem nếu có nhiều lần.', 'Hiển thị thời gian và trạng thái lần đồng bộ.'), ('Xem số bản ghi tạo mới, cập nhật, giữ nguyên và lỗi.', 'Hiển thị báo cáo chi tiết tương ứng.'), ('Xem lỗi phát sinh nếu có.', 'Hiển thị nguyên nhân để quản trị viên xử lý.')]
    if 'nhật ký' in n:
        return [('Mở nhật ký tích hợp HIS.', 'Tải nhật ký của cơ sở y tế hiện tại.'), ('Chọn khoảng thời gian hoặc trạng thái cần tra cứu.', 'Lọc các lần kiểm tra kết nối và đồng bộ.'), ('Xem thời gian, thao tác, trạng thái và kết quả.', 'Hiển thị các bản ghi phù hợp.'), ('Mở chi tiết bản ghi nếu cần.', 'Hiển thị thông tin lỗi hoặc kết quả chi tiết.')]
    return [('Mở chức năng tương ứng.', 'Tải dữ liệu thuộc cơ sở y tế hiện tại.'), ('Nhập hoặc chọn thông tin cần xử lý.', 'Kiểm tra dữ liệu và quyền thao tác.'), ('Xác nhận thực hiện nghiệp vụ.', 'Lưu hoặc hiển thị kết quả xử lý.'), ('Xem lại kết quả.', 'Cập nhật giao diện và thông báo trạng thái.')]

def alternate(title):
    n = title.lower()
    if 'lịch làm việc' in n and ('thêm' in n or 'chỉnh sửa' in n):
        return ('2.1. Thời gian bị trùng với lịch khác hoặc dữ liệu không hợp lệ.', '3.1. Hệ thống thông báo lỗi và yêu cầu chọn thời gian khác.')
    if 'đồng bộ' in n or 'kiểm tra kết nối' in n:
        return ('2.1. Endpoint HIS không phản hồi, từ chối xác thực hoặc trả dữ liệu sai cấu trúc.', '3.1. Hệ thống dừng xử lý, hiển thị nguyên nhân và lưu trạng thái lỗi.')
    if 'thêm' in n or 'chỉnh sửa' in n or 'cập nhật' in n or 'tiếp nhận' in n:
        return ('2.1. Dữ liệu thiếu, không hợp lệ hoặc bản ghi không thuộc cơ sở hiện tại.', '3.1. Hệ thống không lưu thay đổi và hiển thị trường hoặc nguyên nhân cần xử lý.')
    return ('2.1. Không tìm thấy dữ liệu phù hợp hoặc dữ liệu không thuộc cơ sở y tế hiện tại.', '3.1. Hệ thống hiển thị thông báo và giữ nguyên màn hình hiện tại.')

doc = Document(PATH)
for table in doc.tables:
    title = table.cell(0,0).text.replace('Tên use case:', '').strip()
    flow_rows = list(table.rows[8:])
    alt_index = next((i for i,r in enumerate(table.rows) if 'Luồng sự kiện thay thế' in r.cells[0].text), None)
    if alt_index is not None:
        flow_rows = list(table.rows[8:alt_index])
        while len(flow_rows) < 4:
            flow_rows.append(add_row_before(table, alt_index))
            alt_index += 1
    else:
        while len(flow_rows) < 4:
            flow_rows.append(table.add_row())
    ps = pairs(title)
    for i, row in enumerate(flow_rows[:4]):
        put(row.cells[0], f'{i*2+1}. {ps[i][0]}')
        put(row.cells[1], f'{i*2+2}. {ps[i][1]}')
    if alt_index is not None:
        af = alternate(title)
        put(table.rows[alt_index+1].cells[0], af[0])
        put(table.rows[alt_index+1].cells[1], af[1])
    for row in table.rows:
        for cell in row.cells:
            for p in cell.paragraphs:
                fmt(p)
                for r in p.runs:
                    r.font.size = Pt(13)
    put(table.rows[7].cells[0], ACTOR, center=True, bold=True)
    put(table.rows[7].cells[1], 'System', center=True, bold=True)

doc.save(PATH)
print('rewritten', len(doc.tables), 'use cases')
