# Triển khai sàng lọc chuyên khoa v3

Cập nhật sau kiểm tra: xem [bản sửa 3.1 và kết quả trước/sau](ai-screening-fixes-3.1.md). Kho RAG dùng để xác nhận định hướng cần bổ sung `routingCriteria` được duyệt cùng tài liệu.

Cập nhật mobile 01/10/2026: luồng sàng lọc đã được chuyển sang schema 3; xem [luồng mobile mới](mobile-ai-screening.md). Phần mô tả mobile chưa chuyển đổi bên dưới phản ánh trạng thái ngày 30/09/2026.

Ngày cập nhật: 30/09/2026. Phạm vi chính: hộp thoại AI trong đặt khám trên web và backend dùng chung. Đây là triển khai phần mềm để kiểm thử, chưa phải hệ thống đã được kiểm định lâm sàng.

## Những thay đổi đã có

- Web gửi vùng cơ thể nguyên bản, tuổi, toàn bộ câu trả lời theo ID và phiên bản bộ câu hỏi. Backend tự lấy nội dung và trọng số từ danh mục của server, không tin nhãn/điểm do client gửi.
- Giữ trái/phải và các vùng gối, cổ chân, bàn tay; không dùng tìm chuỗi để đoán vùng. Phân biệt câu phủ định, chưa rõ và thông tin thiếu. Không tự điền mức đau, chiều cao, cân nặng hoặc nhịp tim.
- Cảnh báo khẩn/sớm chạy trước truy vấn chuyên khoa, ảnh, LLM và RAG. Thiếu câu trả lời cảnh báo hoặc thiếu tuổi trả `ASK_MORE`; dưới 18 tuổi trả `REVIEW_REQUIRED`.
- Danh sách chuyên khoa lấy từ DB đang hoạt động. Xếp hạng dựa trên dữ kiện và vùng cơ thể; LLM chỉ chọn trong danh sách ứng viên và phải trỏ về dữ kiện cùng tài liệu đã truy xuất. Kết quả và phần giải thích dùng chung quyết định chuyên khoa. Không sinh mã ICD hoặc phần trăm độ chắc chắn.
- Kiểm tra `HospitalSpecialty` trước khi áp dụng. Cơ sở thiếu chuyên khoa trả `CHOOSE_FACILITY`, không đổi sang chuyên khoa đầu tiên của bệnh viện.
- Ảnh tối đa 3 file JPEG/PNG/WebP, 5 MB/file, có đồng ý gửi đến nhà cung cấp AI. Ảnh chỉ bổ sung quan sát bên ngoài; ảnh lỗi/không phù hợp có trạng thái riêng.
- Giọng nói được chuyển thành văn bản, người dùng sửa và xác nhận trước khi phân tích. Không lấy âm sắc làm chẩn đoán bệnh họng. Không gửi lại các câu đọc mẫu như triệu chứng.
- PPG dùng tín hiệu camera và thời gian thực, cần đủ thời lượng/chất lượng. Không giả lập 75 BPM, thêm dao động ngẫu nhiên hoặc biến phép đo thất bại thành thành công.
- Sửa thông tin hoặc đóng hộp thoại hủy yêu cầu và làm mất hiệu lực kết quả cũ. Camera/microphone được giải phóng khi đóng.

## API và đồng bộ bộ câu hỏi

`POST /api/v1/pre-exam-v2/analyze-smartphone` nhận multipart với:

| Trường | Nội dung |
| --- | --- |
| `schemaVersion` | Chuỗi `3` |
| `inputRevision` | Mã phiên bản dữ liệu ở client; response trả lại để chặn kết quả cũ |
| `bodyAreas` | JSON mảng ID vùng từ `bodyRegions.ts` |
| `questionnaire` | JSON `{version, answers:[{questionId,answer}], painLevel:null hoặc 0..10, duration:null hoặc chuỗi}` |
| `age`, `hospitalId`, `symptoms` | Tuổi người cần khám, cơ sở đã chọn, lời kể thực tế |
| `ppg` | Tùy chọn JSON `{bpm,source:'CAMERA_PPG',quality:'GOOD',durationMs}`; chỉ nhận số đo đạt điều kiện |
| `images`, `mediaConsent` | File ảnh và chuỗi `true` khi đã đồng ý |
| `voiceTranscript`, `voiceConfirmed` | Chỉ sử dụng transcript khi `voiceConfirmed='true'` |

`POST /api/v1/pre-exam-v2/transcribe`: multipart `file` tối đa 10 MB và `consent=true`; trả transcript với `NEEDS_CONFIRMATION`. Endpoint mới không lưu bản ghi vào hồ sơ. Việc lưu/xử lý ở nhà cung cấp phụ thuộc cấu hình và chính sách của nhà cung cấp đó.

Khi sửa bộ câu hỏi web, chạy từ `nova-care-backend`:

```powershell
node scripts/sync-screening-catalog.cjs
```

Script sinh snapshot backend và mã phiên bản web từ cùng nguồn. Commit cả hai file sinh ra. Client cũ gửi phiên bản thiếu/sai nhận HTTP 400, không được âm thầm chuyển sang quy tắc khác. Triển khai web/backend cùng đợt, người dùng cần tải lại trang.

Mobile hiện có bộ câu hỏi riêng và chưa chuyển sang schema v3. Thay đổi kèm theo chỉ chặn kết quả giả khi API lỗi và hiển thị lỗi; chưa đưa đầy đủ luồng RAG v3 lên mobile. Cần đồng bộ bộ câu hỏi, transcript xác nhận và điều kiện áp dụng trước khi dùng v3 trên mobile. Các API phiên sàng lọc cũ và màn hình đánh giá sức khỏe riêng không được chuyển toàn bộ sang pipeline này.

## Cấu hình LLM

Tham khảo `nova-care-backend/knowledge/screening.env.example`. Đặt giá trị trong môi trường triển khai hoặc `.env` riêng, không đưa khóa vào Git:

- `OPENAI_API_KEY`, `OPENAI_BASE_URL`: khóa và endpoint tương thích SDK. Nếu bỏ base URL, adapter mới dùng endpoint mặc định của OpenAI; phải cấu hình rõ nếu dùng gateway khác.
- `OPENAI_MODEL_CHAT`, `OPENAI_MODEL_VISION`: ID model thực sự được nhà cung cấp hỗ trợ. Không tự chọn model dựa trên tên thương mại.
- `OPENAI_MODEL_WHISPER`, `OPENAI_MODEL_EMBEDDING`: model chuyển giọng nói và embedding.
- `SCREENING_STRICT_OUTPUTS=true` chỉ sau khi kiểm tra gateway hỗ trợ JSON Schema. Với `false`, dùng JSON object nhưng vẫn kiểm tra dữ liệu đầu ra tại server.

Timeout mỗi yêu cầu AI là 20 giây, không tự thử lại. Lỗi AI không sinh ảnh, transcript hoặc trích dẫn giả. Khi đủ thông tin theo quy tắc, có thể trả gợi ý `QUESTIONNAIRE_RULES`, được ghi rõ trên giao diện. Khi không đủ bằng chứng, trả `ASK_MORE`.

Khóa từng nhúng trực tiếp trong hai service AI đã được loại khỏi mã hiện tại. Chủ sở hữu khóa cần thu hồi/thay khóa cũ nếu khóa đó đã được chia sẻ; sửa file không xóa khóa khỏi lịch sử Git.

## Kho tri thức RAG

Triển khai hiện tại là chỉ mục JSON có phiên bản, lexical retrieval kết hợp cosine embedding qua reciprocal rank fusion. Lọc theo tuổi, vùng cơ thể, chuyên khoa, trạng thái duyệt và hạn hiệu lực trước truy xuất. Chỉ so vector cùng model và số chiều; embedding lỗi chuyển sang `LEXICAL` có ghi trạng thái. Không dùng vector hash thay embedding thật.

File mẫu `knowledge/screening-source.example.json` là **DRAFT**, không được dùng như dữ liệu đã duyệt. Cần người có chuyên môn kiểm tra nội dung, phạm vi áp dụng, ánh xạ chuyên khoa và nguồn, rồi mới điền `APPROVED`, `reviewedBy`, `reviewedAt`, `expiresAt`. Đây là metadata phục vụ kiểm soát xuất bản; script không xác minh danh tính hay năng lực người duyệt.

Từ `nova-care-backend`, sau khi có `knowledge/reviewed-source.json` thực sự được duyệt:

```powershell
# Chỉ mục lexical: không cần gọi embedding API
.\node_modules\.bin\ts-node.cmd scripts/import-screening-knowledge.ts knowledge/reviewed-source.json knowledge/screening-index.json

# Hoặc tạo embedding thực để dùng hybrid retrieval
.\node_modules\.bin\ts-node.cmd scripts/import-screening-knowledge.ts knowledge/reviewed-source.json knowledge/screening-index.json --embed
```

Đặt `SCREENING_KNOWLEDGE_PATH` thành đường dẫn tuyệt đối tới `screening-index.json`. Không trỏ vào file mẫu DRAFT. Script kiểm tra dữ liệu, checksum, ID trùng, hạn hiệu lực và từ chối ghi đè chính file nguồn. Nó không tải tài liệu tự động hay đưa hồ sơ bệnh nhân vào chỉ mục.

Nếu chưa có kho hợp lệ, response trả `retrieval.status=EMPTY` hoặc `UNAVAILABLE`, không ghi nhận là RAG thành công. Chỉ khi LLM chọn đúng ID chuyên khoa, dữ kiện và trích dẫn trong tập truy xuất thì `recommendationSource=RAG_LLM`.

## Kiểm tra và phạm vi còn lại

```powershell
# Backend
.\node_modules\.bin\jest.cmd --runInBand --silent src/modules/pre-exam-v2
npm.cmd run build

# Web
npm.cmd run build
```

Kiểm thử có: phủ định, ánh xạ vùng, số đo thiếu, câu hỏi cảnh báo, payload FormData thật từ helper web qua HTTP Nest, cơ sở thiếu chuyên khoa, ID/trích dẫn do LLM bịa, lỗi ảnh, nguồn hết hạn/chưa duyệt, vector khác model, PPG thiếu/nhiễu. DB và nhà cung cấp AI được giả lập có kiểm soát trong kiểm thử; chưa chứng minh chất lượng lâm sàng hoặc hành vi camera trên thiết bị thật.

Kết quả xác minh ngày 30/09/2026: 6 bộ kiểm thử, 84 ca đạt; build Nest và Next.js đạt; `:app:compileDebugKotlin` đạt cho thay đổi xử lý lỗi mobile. Lệnh nhập file DRAFT bị từ chối và không tạo chỉ mục. Chưa thực hiện gọi AI thật hoặc kiểm thử giao diện/camera/microphone trên trình duyệt và thiết bị thật.

Chưa có trong đợt này: kho hướng dẫn lâm sàng đầy đủ đã duyệt, bộ ca đánh giá độc lập do bác sĩ gán nhãn, pgvector/di trú chỉ mục quy mô lớn, lưu lịch sử quyết định vào DB và dashboard đánh giá. Response hiện trả phiên bản bộ câu hỏi/quy tắc/kho, nhưng `sessionId` chỉ là mã lần phân tích, không đại diện cho phiên đã lưu DB. Quy tắc và từ điển triệu chứng vẫn là heuristic cần đánh giá thêm trước sử dụng thực tế.
