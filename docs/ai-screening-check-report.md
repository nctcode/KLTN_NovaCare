# Kết quả kiểm tra sàng lọc ngày 30/09/2026

## Kết luận

Chưa thể xác nhận AI gợi ý đúng chuyên khoa. Gateway đang báo không đủ số dư. Kiểm tra riêng quy tắc phát hiện một trường hợp định hướng sai và một trường hợp chưa kích hoạt cảnh báo khẩn từ lời kể.

## Lần gọi nhà cung cấp thật

- Dùng khóa và model `gpt-5.4` trong môi trường hiện có; không ghi khóa vào báo cáo.
- Truy vấn đọc danh mục chuyên khoa thật thành công khi chạy ngoài sandbox. Không đọc hồ sơ bệnh nhân, không ghi vào DB.
- Gửi ca đau đầu giả lập qua adapter thật: thất bại ở bước đọc JSON; trạng thái pipeline `EXTRACTION_UNAVAILABLE`, kết quả `ASK_MORE`.
- Gửi một yêu cầu JSON tối thiểu để xác định lỗi: HTTP 200, envelope JSON hợp lệ, nhưng `choices[0].message.content` là thông báo “Số dư tài khoản API không đủ”. Đây không phải kết quả phân tích triệu chứng.
- Dừng gọi nhà cung cấp sau khi xác định lỗi. Không nạp tiền hoặc thay đổi cấu hình tài khoản.
- `SCREENING_KNOWLEDGE_PATH` chưa cấu hình, nên chưa kiểm tra được RAG với kho tài liệu thật.

## Kiểm tra riêng quy tắc

Chạy 10 ca tổng hợp, tuổi 30, dùng danh mục chuyên khoa thật; vô hiệu hóa gọi LLM để không phát sinh thêm yêu cầu. Các câu hỏi cảnh báo theo vùng được trả lời “không”, ngoại trừ hai ca cảnh báo có cấu hình riêng. Không dùng ảnh, PPG hoặc ghi âm. Không chọn bệnh viện, nên gợi ý có chuyên khoa trả `CHOOSE_FACILITY`.

Các chuyên khoa kỳ vọng dưới đây là tiêu chí kiểm thử kỹ thuật do người triển khai đặt ra, chưa phải nhãn được bác sĩ duyệt. Đây không phải nghiên cứu độ chính xác lâm sàng.

| Ca giả lập | Kỳ vọng kiểm thử | Kết quả thực tế | Nhận xét |
| --- | --- | --- | --- |
| Đau đầu một bên tái diễn, khó chịu ánh sáng | Thần kinh | ASK_MORE | Không đủ kết quả khi tắt LLM |
| Đau họng, khàn tiếng, nuốt đau nhẹ | Tai Mũi Họng | ASK_MORE | Không đủ kết quả khi tắt LLM |
| Đau gối phải khi đi cầu thang | Cơ xương khớp | ASK_MORE | Không đủ kết quả khi tắt LLM |
| Mẩn ngứa ngoài da cẳng tay | Da liễu | ASK_MORE | Không đủ kết quả khi tắt LLM |
| Ợ chua, trào ngược sau ăn | Tiêu hóa | Tiêu hóa | Khớp tiêu chí |
| Ngứa, đỏ mắt nhẹ | Mắt | ASK_MORE | Không đủ kết quả khi tắt LLM |
| Tiểu buốt, tiểu khó, chọn bụng dưới | Tiết niệu hoặc chưa đủ cơ sở định hướng | Tiêu hóa | Định hướng không có căn cứ từ triệu chứng |
| Phủ định đau ngực, khó thở, ho, hồi hộp | Hỏi thêm | ASK_MORE | Không biến phủ định thành triệu chứng dương tính |
| Trả lời “có” câu đau đầu đột ngột dữ dội | Hướng dẫn khẩn | EMERGENCY_GUIDANCE | Khớp tiêu chí |
| Chỉ viết đau đầu đột ngột dữ dội như búa bổ, chưa trả lời câu hỏi cảnh báo | Hướng dẫn khẩn | ASK_MORE | Chưa nhận diện cảnh báo từ lời kể |

Tổng: 3 ca khớp tiêu chí, 5 ca chưa đưa ra gợi ý, 2 ca cần sửa. Không diễn giải thành “AI chính xác 30%”: LLM không hoạt động trong lượt này, mẫu nhỏ và không có nhãn lâm sàng độc lập.

## Nguyên nhân kiểm tra trong mã

1. `clinical-pattern-engine.service.ts` cộng 40 điểm cho mẫu tiêu hóa chỉ vì vùng là `ABDOMEN`. `screening-routing.ts` tiếp tục dùng điểm này và gán `text:complaint` làm căn cứ khi có bất kỳ lời kể nào. Vì vậy lời kể tiểu buốt cũng có thể được dùng để đề xuất Tiêu hóa. Danh mục DB hiện chưa có Tiết niệu; thiếu chuyên khoa không phải căn cứ để chuyển sang Tiêu hóa.
2. Cảnh báo đau đầu đột ngột được nhận qua câu hỏi `head_q1`, nhưng bộ trích xuất/quy tắc lời kể chưa có dấu hiệu tương ứng. Pipeline trả `ASK_MORE` do thiếu câu trả lời cảnh báo trước khi nhận diện được tình huống này. Tiêu chí cảnh báo được đối chiếu với [NHS: Headaches](https://www.nhs.uk/symptoms/headaches/), mục đau đầu khởi phát đột ngột và cực kỳ đau.
3. Gateway dùng HTTP 200 cho lỗi số dư nằm trong nội dung assistant. Adapter hiện ghi nhận như lỗi JSON, chưa phân loại riêng lỗi tài khoản.

Các lỗi trên được ghi nhận trong lượt kiểm tra này, chưa sửa mã nghiệp vụ. Cần bổ sung hồi quy cho hai ca trước khi kiểm tra lại với API hoạt động.

## Tái hiện

Từ thư mục `nova-care-backend`:

```powershell
# Gọi nhà cung cấp thật, chỉ nên chạy sau khi tài khoản API hoạt động
.\node_modules\.bin\ts-node.cmd -r tsconfig-paths/register scripts/check-screening-live.ts

# Kiểm tra quy tắc, không gọi LLM để trích xuất lời kể
.\node_modules\.bin\ts-node.cmd -r tsconfig-paths/register scripts/check-screening-live.ts --rules-only
```

Kết quả lưu trong `docs/ai-screening-live-results.json` và `docs/ai-screening-rules-results.json`. Nếu DB không truy cập được, script dùng danh mục kiểm thử và đánh dấu `TEST_FIXTURE_DATABASE_UNAVAILABLE`; kết quả cuối trong báo cáo này dùng `DATABASE`.

Chưa kiểm tra: ảnh thật, microphone/camera, mô hình đo PPG trên thiết bị, chuyên khoa tại từng bệnh viện, RAG có nguồn đã duyệt, hoặc độ ổn định giữa nhiều lượt LLM.
