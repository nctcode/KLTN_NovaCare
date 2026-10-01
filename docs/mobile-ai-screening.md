# AI gợi ý chuyên khoa trên mobile

Cập nhật 01/10/2026. Mobile dùng schema 3 và quyết định sàng lọc backend 3.1, không còn dùng kết quả chấm điểm cục bộ của màn hình cũ.

## Luồng sử dụng

1. **Vùng đau:** nhập tuổi thực tế, chọn cơ sở tùy chọn, tìm/chọn vị trí bằng danh mục chính xác từ server, nhập lời kể. Có nút kiểm tra lời kể/cảnh báo ngay.
2. **Trắc nghiệm:** tải câu hỏi theo vùng và cùng phiên bản với web. Câu cảnh báo đứng trước. Có/Không/Không rõ được giữ riêng; mức đau và thời gian không tự điền. Đổi vùng xóa câu trả lời và dữ liệu bổ sung của vùng cũ.
3. **Ảnh:** chụp bằng ứng dụng camera hoặc chọn ảnh; tối đa 3 file JPEG/PNG/WebP, 5 MB/file. Hiển thị ảnh và cho xóa. Cần đồng ý gửi ảnh/bản ghi đến nhà cung cấp AI, hoặc bỏ qua.
4. **Nhịp tim:** xin quyền camera khi người dùng bắt đầu. Thu tín hiệu camera sau, kiểm tra thời gian liên tục ít nhất 20 giây, nhịp đỉnh và độ biến thiên. Thiếu chất lượng hoặc quá 60 giây trả thông báo thử lại/bỏ qua. Không nhập BPM giả hoặc mặc định 75. Dừng camera/flash khi rời bước hoặc ứng dụng vào nền.
5. **Giọng nói:** xin quyền microphone, ghi 3–30 giây, người dùng chọn gửi để chuyển thành văn bản. Có thể sửa hoặc nhập lời kể trực tiếp, cần xác nhận trước khi phân tích. Không phân tích bệnh từ âm sắc. Dừng và giải phóng microphone khi rời màn hình hoặc vào nền.
6. **Kết quả:** hiển thị hướng dẫn khẩn, chuyên khoa, lý do, trạng thái AI, chất lượng dữ liệu và tài liệu nếu có. Đây là màn hình kết quả sau năm bước đầu vào.

Ba bước ảnh, nhịp tim, giọng nói có nút bỏ qua. Kết quả cũ mất hiệu lực khi sửa thông tin. Lỗi mạng hoặc AI không tạo kết quả giả. Cảnh báo khẩn có nút mở trình quay số 115, không tự thực hiện cuộc gọi.

## Kết nối đặt khám

Chỉ bật nút áp dụng khi backend cho `BOOK_SPECIALTY`, `canApply=true`, revision còn đúng và cơ sở trong response trùng cơ sở đã chọn. Trường hợp khẩn/sớm không áp dụng lịch khám thường.

Chuyển ID cơ sở, ID chuyên khoa và lý do khám sang luồng đặt khám. Danh mục chuyên khoa được kiểm tra lại, bác sĩ và nơi khám được lọc theo cùng cơ sở/chuyên khoa. Nếu danh mục tải lỗi hoặc không còn chuyên khoa, phải thử lại hoặc chủ động chọn thông tin khám thủ công; không âm thầm chọn khoa đầu tiên.

Không chọn cơ sở hoặc cơ sở không có chuyên khoa: quay lại chọn cơ sở và phân tích lại để kiểm tra điều kiện áp dụng. Các bước hồ sơ, chọn giờ và thanh toán tiếp tục dùng luồng đặt khám hiện có.

## API và triển khai

- `GET /api/v1/pre-exam-v2/screening-catalog`: mới, trả phiên bản, vùng và câu hỏi chuẩn. Cần triển khai/restart backend có endpoint này trước khi chạy APK mới.
- `POST /api/v1/pre-exam-v2/analyze-smartphone`: multipart schema 3, gửi ID vùng/câu hỏi, phiên bản, tuổi, revision và dữ liệu đã xác nhận.
- `POST /api/v1/pre-exam-v2/transcribe`: audio MP4/AAC, consent, nhận transcript để xác nhận.
- API trên emulator vẫn dùng `http://10.0.2.2:3000/api/v1/`; thiết bị vật lý cần cấu hình host phù hợp ở `ApiClient.kt`.

File phương tiện được giữ trong cache của ứng dụng, không đưa vào hồ sơ: ảnh phiên bị xóa khi bỏ/rời phiên; bản ghi bị xóa sau chuyển văn bản hoặc bỏ ghi. Không ghi body HTTP hoặc token vào log. Mất tiến trình có thể làm mất bản nháp; không tuyên bố lưu hồ sơ hay đồng bộ lịch sử phiên này.

Ứng dụng dùng [Camera2/TextureView](https://developer.android.com/media/camera/camera2/camera-preview) và [MediaRecorder](https://developer.android.com/media/platform/mediarecorder). Camera/microphone là tính năng tùy chọn; từ chối quyền vẫn có thể tiếp tục sàng lọc bằng văn bản.

## Kiểm tra

```powershell
# Thư mục mobile
.\gradlew.bat :app:assembleDebug :app:testDebugUnitTest :app:connectedDebugAndroidTest '-Pandroid.testInstrumentationRunnerArguments.class=com.example.kltn_novacare.MobileScreeningJourneyTest' '-Pkotlin.compiler.execution.strategy=in-process' --console=plain
```

- `MobileScreeningContractTest`: payload schema 3, ID/phiên bản câu hỏi, dữ liệu thiếu, xác nhận transcript, revision/cơ sở và điều kiện áp dụng, chất lượng thuật toán PPG.
- `MobileScreeningJourneyTest`: thao tác Compose và Retrofit multipart, áp dụng ID server, vô hiệu hóa kết quả cũ, không cho áp dụng khi backend từ chối, không tạo kết quả khi API lỗi. API trong kiểm thử được giả lập; không dùng tiền API, không tạo lịch khám thật.
- Backend có kiểm thử HTTP endpoint catalog mới cùng bộ kiểm thử sàng lọc hiện có.

APK: `mobile/app/build/outputs/apk/debug/app-debug.apk`.

Giới hạn: chưa kiểm định PPG/ảnh/giọng nói trên thiết bị vật lý hoặc về mặt lâm sàng. Kết quả đo camera chỉ là ước lượng, không thay thế thiết bị y tế. Tài khoản AI và kho RAG được duyệt vẫn là điều kiện để thử phân tích AI/RAG thật; bản sửa mobile không thay đổi số dư hoặc tự duyệt tài liệu.
