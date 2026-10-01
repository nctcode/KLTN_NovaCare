# Đặt khám và thanh toán mô phỏng trên mobile

## Luồng sử dụng

1. Chọn bác sĩ/nơi khám và ngày khám. Chọn một khung giờ còn trống do API trả về.
2. Chọn hồ sơ bản thân hoặc người thân. Có thể tạo hồ sơ ngay tại bước này.
3. Kiểm tra hồ sơ, cơ sở, bác sĩ, thời gian, phí dự kiến; bổ sung lý do và triệu chứng.
4. Chọn thanh toán tại cơ sở y tế hoặc MoMo/VNPay/VietQR/Thẻ mô phỏng.
5. Với thanh toán mô phỏng, lịch được tạo ở trạng thái chờ thanh toán. Nhấn xác nhận
   trong hộp thoại mô phỏng để gọi API thanh toán, sau đó nhận phiếu khám.

Chọn **Để sau** hoặc rời bước thanh toán vẫn giữ lịch đã tạo trên server.
Mở **Lịch hẹn → Chi tiết lịch hẹn → Tiếp tục thanh toán** để hoàn tất sau.
Lịch hết hạn không được thanh toán lại từ mobile.

## API dùng chung với web

| Thao tác | API |
| --- | --- |
| Lấy lịch trống | `GET /doctors/{id}/available-slots?workplaceId=...&date=...` |
| Lấy hồ sơ | `GET /patient-profiles` |
| Tạo lịch | `POST /appointments` |
| Xác nhận trả tiền tại viện | `PATCH /appointments/{id}/confirm` |
| Kiểm tra thanh toán | `GET /payments/status/{appointmentId}` |
| Thanh toán mô phỏng | `POST /payments/simulate-success` |

Payload tạo lịch gồm `patientProfileId`, `slotId`, `medicalServiceId` (nếu chọn),
`reason`, `symptoms`, `idempotencyKey`. Phương thức thanh toán được gửi riêng
ở bước thanh toán, theo hợp đồng backend hiện tại.

Không tạo ID bác sĩ/nơi khám/khung giờ giả. Khi đổi bác sĩ hoặc ngày,
khung giờ đã chọn bị xóa để tránh gửi lịch cũ. Bước chọn hồ sơ phải được xác nhận
trước khi đến bước kiểm tra thông tin.

Mỗi bản nháp giữ nguyên idempotency key khi thử lại. Sau khi đã tạo lịch,
thử thanh toán lại sử dụng cùng ID lịch. Nút thao tác bị khóa trong lúc gửi yêu cầu.
Mobile kiểm tra trạng thái thanh toán trước khi gửi lại yêu cầu mô phỏng để xử lý
trường hợp server đã thanh toán nhưng thiết bị mất phản hồi.

Thanh toán tại viện chỉ xác nhận lịch (`CONFIRMED`); thanh toán mô phỏng chỉ
hiển thị đã thanh toán khi API trả `PAID`. Các hình thức mô phỏng không mở cổng
thanh toán thật và không yêu cầu thông tin thẻ/ngân hàng.

## Kiểm thử

Trong thư mục `mobile`:

```powershell
.\gradlew.bat :app:assembleDebug :app:testDebugUnitTest :app:connectedDebugAndroidTest '-Pkotlin.compiler.execution.strategy=in-process' --console=plain
```

- `BookingFlowTest`: chuyển bước, chọn hồ sơ, xóa khung giờ cũ, hợp đồng API,
  xác nhận tại viện, thanh toán mô phỏng, chống gửi trùng, lỗi/thử lại và hết hạn.
- `BookingJourneyTest`: thao tác Compose từ chọn hồ sơ người thân đến phiếu khám,
  phân biệt xác nhận tại viện với thanh toán, giữ màn hình lỗi khi mô phỏng thất bại.
- Các bài kiểm thử API/UI sử dụng response giả lập, không tạo lịch hay thanh toán
  trên dữ liệu thật. Cần backend hoạt động và lịch bác sĩ còn trống để đối soát
  thực tế giữa mobile và web bằng cùng tài khoản.

APK: `mobile/app/build/outputs/apk/debug/app-debug.apk`.
