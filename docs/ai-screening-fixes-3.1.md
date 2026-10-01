# Sàng lọc 3.1 — sửa lỗi sau kiểm tra

## Thay đổi

- Vùng bụng không tự tạo bằng chứng tiêu hóa. Ứng viên chuyên khoa bắt buộc có dữ kiện dương tính hỗ trợ; không gán lời kể bất kỳ làm bằng chứng cho một mẫu bệnh.
- Trích xuất các cụm triệu chứng rõ ràng bằng quy tắc để có thể hỗ trợ định hướng khi LLM không hoạt động. Đây vẫn là heuristic, không phải chẩn đoán hoặc mô hình đã kiểm định. LLM trích lại cùng nguồn lời kể không được tính như nguồn bằng chứng độc lập.
- Đau đầu đột ngột dữ dội được kiểm tra từ lời kể và transcript đã xác nhận, trước yêu cầu hoàn thành trắc nghiệm và trước gọi AI. Loại trừ một số mẫu phủ định, tiền sử, người khác, giả định và câu hỏi.
- Thiếu chuyên khoa trong danh mục trả `CONTACT_FACILITY` / `SPECIALTY_NOT_IN_CATALOG`, không thay bằng khoa khác. Thiếu tại bệnh viện vẫn trả `CHOOSE_FACILITY` và không cho áp dụng.
- Vị trí trong lời kể không khớp sơ đồ trả `REGION_CONFLICT`, kèm nút quay về kiểm tra vùng. Nhiều vùng có ứng viên khác nhau không tự ép chọn một khoa chỉ bằng điểm quy tắc.
- Phân loại lỗi HTTP 200 chứa thông báo hết số dư, lỗi xác thực, giới hạn, timeout và phản hồi sai. Response chỉ mang mã lỗi và giai đoạn, không trả nội dung lỗi nhà cung cấp hoặc khóa API. Web hiển thị rõ khi phân tích AI chưa hoàn tất.
- Truy xuất RAG chỉ dùng dữ kiện dương tính. Trích dẫn phải có tiêu chí định hướng phù hợp với dữ kiện được viện dẫn, ngoài kiểm tra ID và chuyên khoa.

## Bổ sung hợp đồng kho RAG

Mỗi đoạn được dùng làm bằng chứng định hướng cần `routingCriteria`:

```json
{
  "routingCriteria": [{
    "specialtyCode": "neurology",
    "anySymptoms": ["<cụm triệu chứng có trong nguồn và phù hợp định hướng>"],
    "evidenceQuote": "<đoạn trích nguyên văn nằm trong text, đã được người duyệt kiểm tra>"
  }]
}
```

Người có chuyên môn phải duyệt cả tiêu chí, đoạn trích và ánh xạ khoa. Import kiểm tra cấu trúc, mã thuộc danh sách chuyên khoa của đoạn và cụm triệu chứng có trong đoạn trích. Khi quyết định, server kiểm tra tiêu chí khớp dữ kiện dương tính đang dùng. Đoạn cũ chưa có tiêu chí vẫn có thể được truy xuất nhưng không đủ điều kiện xác nhận một gợi ý RAG.

Điều kiện này giảm việc viện dẫn tài liệu không liên quan; không tự chứng minh sự đúng đắn y khoa hay ngữ nghĩa của tiêu chí. Không tự đổi tài liệu DRAFT thành APPROVED. Kho hướng dẫn đầy đủ và bộ ca do bác sĩ duyệt vẫn là điều kiện bên ngoài chưa có.

## Kết quả trước/sau

Giữ nguyên báo cáo trước sửa trong `ai-screening-rules-results.json`. Kết quả sau sửa trong `ai-screening-after-results.json`, chạy với danh mục DB thật và không gọi nhà cung cấp AI.

| Ca | Trước sửa | Sau sửa |
| --- | --- | --- |
| Đau đầu tái diễn | Hỏi thêm | Thần kinh |
| Đau họng, khàn tiếng | Hỏi thêm | Tai Mũi Họng |
| Đau gối | Hỏi thêm | Cơ xương khớp |
| Phát ban cẳng tay | Hỏi thêm | Da liễu |
| Trào ngược | Tiêu hóa | Tiêu hóa |
| Đỏ mắt nhẹ | Hỏi thêm | Mắt |
| Tiểu buốt, tiểu khó | Tiêu hóa | Liên hệ cơ sở; danh mục hiện thiếu Tiết niệu |
| Phủ định triệu chứng ngực | Hỏi thêm | Hỏi thêm |
| Câu trả lời cảnh báo đau đầu | Hướng dẫn khẩn | Hướng dẫn khẩn |
| Lời kể đau đầu đột ngột dữ dội | Hỏi thêm | Hướng dẫn khẩn |

Cả 10 ca sau sửa đạt tiêu chí kỹ thuật của bộ kiểm thử. Tiêu chí ca tiết niệu cho phép từ chối định hướng khi DB thiếu Tiết niệu; không phải bắt buộc trả một ID không tồn tại. Không diễn giải thành độ chính xác LLM 100%: đây là các ca tổng hợp đã dùng để tái hiện lỗi, chưa có nhãn độc lập do bác sĩ duyệt.

Xác minh bản sửa: 7 bộ kiểm thử / 106 ca đạt; build backend Nest và web Next.js thành công. Kiểm thử bao gồm lỗi nhà cung cấp giả lập, trường hợp không đủ bằng chứng RAG, nhiều vùng triệu chứng và vùng không khớp lời kể.

Tái hiện từ `nova-care-backend`:

```powershell
.\node_modules\.bin\jest.cmd --runInBand --silent src/modules/pre-exam-v2
.\node_modules\.bin\ts-node.cmd -r tsconfig-paths/register scripts/check-screening-live.ts --rules-only --report-after
npm.cmd run build
```

Chưa gọi lại AI tính phí vì lần kiểm tra trước gateway báo hết số dư. Không thay đổi tài khoản hoặc nạp tiền. Chưa kiểm chứng ảnh/camera/ghi âm trên thiết bị thật. Mobile chưa chuyển toàn bộ sang schema v3; đợt này tập trung backend và web theo kế hoạch.
