# Khôi phục mật khẩu bằng OTP

## Cấu hình thử nghiệm eSMS (08/10/2026)

Backend cục bộ đã cấu hình Brandname `Baotrixemay`, SmsType `2`, IsUnicode `0` và mẫu `{OTP} la ma xac minh dang ky Baotrixemay cua ban` theo tài liệu https://developers.esms.vn/esms-api/ham-gui-tin/tin-nhan-sms-otp-cskh . Chỉ thay phần `{OTP}`; không thêm NovaCare hoặc đổi nội dung khi dùng mẫu này. Khóa nằm trong `.env` được Git ignore.

Đây là Brandname thử nghiệm của nhà cung cấp, không phải Brandname NovaCare đã được duyệt. Người kiểm thử sẽ nhận nội dung nhắc đến Baotrixemay. Không dùng mẫu này làm nội dung chính thức khi đưa NovaCare vào sử dụng.

Không bật Sandbox trong luồng khôi phục mật khẩu: Sandbox=1 không gửi SMS về điện thoại. Khi người dùng yêu cầu OTP bằng số điện thoại đã đăng ký, backend gửi yêu cầu thật và có thể phát sinh phí. Chưa kiểm chứng phát SMS đến thiết bị. Số điện thoại trong curl của tài liệu không phải số nhận mặc định của ứng dụng.

## Đăng ký eSMS (bản nháp, chưa được duyệt)

- Brandname đề xuất: **NovaCare**.
- Mục đích: OTP khôi phục mật khẩu cho tài khoản NovaCare đã đăng ký số điện thoại.
- Mẫu đề xuất: `{OTP} la ma xac thuc dat lai mat khau NovaCare cua ban. Ma co hieu luc 5 phut. Khong chia se ma nay.`
- Gửi tên/mẫu trên cho eSMS và cung cấp giấy tờ chủ thể theo yêu cầu của nhà cung cấp. Không coi bản nháp là Brandname đang hoạt động.
- Sau khi được duyệt, điền API Key/Secret Key mới, Brandname và mẫu chính xác vào `.env` theo `.env.sms.example`. Không dùng lại khóa đã xuất hiện trong ảnh chia sẻ.
- Khởi động lại backend để nhận cấu hình. Không đưa khóa vào Git, frontend hoặc mobile.

Tài liệu eSMS: https://developers.esms.vn/en/esms-api/send-sms-api/send-otp-customer-care-message

HTTP 100/CodeResult 100 của eSMS xác nhận tiếp nhận yêu cầu, không đảm bảo điện thoại đã nhận SMS. Kiểm tra lịch sử gửi ở eSMS khi kiểm thử thực tế. Không bật sandbox rồi coi là gửi thật.

## Luồng và giới hạn

Đăng ký mới gồm ba bước: `POST /auth/register/request-otp` → `POST /auth/register/verify-otp` → `POST /auth/register`. Bước xác minh trả `verificationToken` có hiệu lực 10 phút, bị ràng buộc với số điện thoại và bị tiêu thụ khi tạo tài khoản.

Quên mật khẩu gồm: `POST /auth/forgot-password` → `POST /auth/forgot-password/verify-otp` → `POST /auth/reset-password`. Form mật khẩu chỉ hiển thị sau khi OTP đúng. `resetToken` có hiệu lực 10 phút và chỉ dùng một lần.

`POST /api/v1/auth/forgot-password`: body chỉ một trong `phone`, `email`.
`POST /api/v1/auth/reset-password`: cùng định danh, `otpCode` 6 chữ số, `newPassword` 6–128 ký tự (giữ chính sách mật khẩu hiện tại).

OTP ngẫu nhiên mật mã, Argon2 hash trong bảng riêng, hạn 5 phút, tối đa 5 lần thử; mã mới vô hiệu mã cũ. Mỗi tài khoản cách nhau ít nhất 60 giây, tối đa 5 lần gửi/giờ; giới hạn tài khoản lưu DB dùng chung các instance. IP throttle hiện dùng Nest in-memory, cần shared storage ở deployment nhiều replica. Tài khoản không tồn tại nhận cùng thông báo chung; lỗi nhà cung cấp trả 503 và vô hiệu mã vừa tạo.

Đổi mật khẩu và tiêu thụ OTP trong cùng transaction, khóa hàng user. Thu hồi refresh token và tăng authVersion để từ chối access token HTTP cũ. Email OTP không còn báo thành công khi SMTP chỉ mô phỏng.

Web bỏ hiển thị/tự điền OTP thử nghiệm. Mobile có đường dẫn Quên mật khẩu tại màn hình đăng nhập.

## Triển khai và kiểm thử thực tế

Áp dụng migration `20261006090000_password_reset`, generate Prisma Client và restart API. Không reset/seed DB. Migration vô hiệu OTP cũ dạng plaintext.

Sau khi eSMS duyệt: yêu cầu OTP cho số điện thoại tài khoản kiểm thử có quyền sử dụng; kiểm tra SMS nhận đúng mẫu, đổi mật khẩu, đăng nhập mật khẩu mới, thử lại OTP cũ, thử refresh token cũ, thử gửi lại và mã sai. SMS có thể tính phí. Bộ unit test mock eSMS không gửi tin thật.
