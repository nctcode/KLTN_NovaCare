# Hồ sơ sức khỏe mobile

Mobile dùng chung hợp đồng API với `nova-care-web/src/services/profile.service.ts`
và `interoperability.service.ts`.

## Các luồng đã nối API

- Danh sách, tìm theo họ tên/SĐT/CCCD, lọc bản thân/người thân.
- Tạo, sửa, xóa mềm, đặt hồ sơ khám chính; thông báo thành công chỉ sau khi API xác nhận.
- Biểu mẫu dùng chung ở màn Hồ sơ và luồng đặt khám. Hồ sơ mới trong đặt khám dùng ID do API trả về.
- Giới tính gửi `MALE/FEMALE/OTHER`; định danh gửi `identityNumber`, quan hệ gửi `relation`.
- Có ngày sinh, BHYT, địa chỉ, tiền sử, dị ứng và liên hệ khẩn cấp. Không tự điền ngày sinh giả; điện thoại không bắt buộc, tương ứng web.
- PUT gửi `null` cho trường tùy chọn bị xóa, tránh giữ lại dữ liệu cũ hoặc lưu CCCD rỗng trùng nhau.
- Tạo, tải lại, sao chép, thu hồi mã chia sẻ qua `/interoperability/portal/share-codes`.
  Mã, PIN và hạn sử dụng lấy từ máy chủ; lỗi mạng không sinh mã thay thế trên thiết bị.
- Chọn thời hạn, phạm vi dữ liệu, tên nơi nhận và PIN tùy chọn; hiển thị trạng thái hết hạn/thu hồi và số lượt truy cập.

## Phạm vi hợp đồng backend hiện tại

Mã chia sẻ thuộc tài khoản. Khi tra cứu bằng mã, backend chọn hồ sơ khám chính
(hồ sơ đầu tiên theo thứ tự `isDefault`), không gắn mã riêng với từng người thân.
Giao diện mobile mô tả rõ điều này. Phạm vi dữ liệu và tên nơi nhận được gửi như web;
việc kiểm soát truy cập do backend thực hiện.

Thay đổi này tập trung vào quản lý hồ sơ và mã chia sẻ. Quét QR CCCD/BHYT, màn bệnh án
liên thông chi tiết và nhật ký bác sĩ truy cập chưa được bổ sung trên mobile.

## Kiểm tra

Tại thư mục `mobile`:

```powershell
.\gradlew.bat :app:assembleDebug :app:testDebugUnitTest :app:connectedDebugAndroidTest --console=plain
```

`HealthProfileContractTest` kiểm tra JSON thật qua Retrofit với HTTP response giả lập,
bao gồm hồ sơ tạo từ web, tên trường, xóa giá trị tùy chọn, lỗi API, ID trả về và mã chia sẻ.
`HealthProfileFormTest` kiểm tra biểu mẫu bằng Compose trên emulator.

Đối soát thủ công với backend đang chạy:

1. Đăng nhập cùng tài khoản trên web và mobile; tạo hồ sơ ở web và tải lại màn Hồ sơ mobile.
2. Sửa dị ứng/tiền sử ở mobile, xóa một giá trị tùy chọn, kiểm tra lại trên web.
3. Đổi hồ sơ chính; thử xóa hồ sơ chính khi còn hồ sơ khác để kiểm tra thông báo chặn của API.
4. Tạo hồ sơ từ bước đặt khám và xác nhận ID được chọn trùng ID lưu trên backend.
5. Tạo mã trên web rồi mở Quản lý mã chia sẻ trên mobile; thu hồi và tải lại web.
6. Tạo mã trên mobile, kiểm tra mã/PIN/hạn sử dụng trên web; ngắt mạng và kiểm tra lỗi được hiển thị.
