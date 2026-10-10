# NovaCare – Tư vấn video LiveKit

## Phạm vi triển khai

- Video 1–1 cho phiên tư vấn đã đặt lịch; dùng `ConsultationSession` hiện có,
  `channel=VIDEO`, `videoEnabled=true`. Không tạo bảng bệnh nhân, bác sĩ, lịch hoặc payment mới.
- Mobile chọn “Video và chat” tại bước thông tin trước tư vấn của lịch online đã xác nhận/thanh toán.
- Web `/tu-van` hiển thị phiên của người đăng nhập. Bác sĩ dùng đúng tài khoản được gán vào Doctor.userId để tiếp nhận/bắt đầu/kết thúc và gọi video.
- Chat tiếp tục dùng REST + Socket.IO namespace `/consultations`; LiveKit chỉ truyền audio/video.
- Chưa có cấu hình thì backend trả unavailable; client không tạo phiên hoặc giả lập cuộc gọi.
- Không ghi hình, không AI đóng vai bác sĩ; không tự tạo bệnh án/đơn thuốc từ cuộc gọi.

## 1. Tạo LiveKit Cloud

1. Truy cập https://cloud.livekit.io và tạo tài khoản/project cho NovaCare.
2. Lấy Project URL dạng `wss://…livekit.cloud` và tạo API Key/Secret trong phần quản lý project.
3. Điền vào `.env` **backend** theo `.env.livekit.example`, rồi đặt `LIVEKIT_ENABLED=true`.
4. Không gửi secret trong chat, không đưa vào source code, APK hoặc biến `NEXT_PUBLIC_*`.
5. Khởi động lại backend. Nếu dùng Docker, kiểm tra service nhận đủ các biến và recreate container theo cách deploy hiện có.

ConfigModule ưu tiên `.env.development` trước `.env` khi NODE_ENV=development.
Nếu đã có các biến LiveKit trong file ưu tiên này, phải cập nhật đúng file đó để tránh bị ghi đè.
Docker dev hiện bind-mount backend vào `/app`; cần cập nhật dependency trong môi trường container
khi cài SDK mới (ví dụ chạy `docker compose exec api npm ci` rồi restart API). Không xóa volume database.

Không cần thay BASE_URL mobile thành URL LiveKit. Mobile vẫn gọi API NovaCare để xin quyền vào phòng.

## 2. Cấu hình webhook bắt buộc

Trong project LiveKit Cloud, thêm webhook URL:

`https://<BACKEND-PUBLIC-HOST>/api/v1/consultation-video/webhook`

Chọn API key tương ứng với cấu hình backend để ký webhook. Dùng HTTPS public; LiveKit Cloud không truy cập được localhost của máy phát triển. Có thể dùng HTTPS tunnel cho backend dev.

Endpoint xác minh chữ ký bằng `WebhookReceiver`, dùng raw body `application/webhook+json`.
Webhook kiểm tra lại quyền khi participant tham gia; token cũ không cho tiếp tục phiên đã đóng.
Không chuyển phiên thành COMPLETED chỉ vì participant rời phòng hoặc mạng bị ngắt.

Tài liệu chính thức:
- https://docs.livekit.io/transport/sdk-platforms/android/
- https://docs.livekit.io/frontends/build/authentication/endpoint/
- https://docs.livekit.io/intro/basics/rooms-participants-tracks/webhooks-events/

## 3. API và quyền

| API | Chức năng |
| --- | --- |
| GET /api/v1/consultation-video/capabilities | Sau đăng nhập, kiểm tra cấu hình video đã bật |
| POST /api/v1/consultations | Tạo phiên hiện có với channel VIDEO, kiểm tra lịch online và consent |
| POST /api/v1/consultation-video/:id/join | Cấp token phòng riêng sau khi kiểm tra quyền/giờ/trạng thái |
| POST /api/v1/consultation-video/webhook | Webhook ký bởi LiveKit; không dùng access token NovaCare |
| PATCH /api/v1/consultations/:id/accept,start,complete,cancel | Các endpoint lifecycle hiện có |

Điều kiện vào video:
- Người tạo/chủ hồ sơ hoặc bác sĩ được phân công, thông qua xác thực NovaCare.
- Bác sĩ có tài khoản hoạt động; phiên cho phép video và ở ACCEPTED hoặc ACTIVE.
- Lịch ở CONFIRMED hoặc PAID theo enum hiện tại.
- Đã tới `scheduledStartAt`, chưa tới `scheduledEndAt` (giờ server).

Token chỉ cho room tương ứng và danh tính xác định từ backend, tối đa 120 giây để gia nhập.
Token hết hạn không tự ngắt cuộc gọi đang chạy. Vì vậy backend đóng phòng khi kết thúc/hủy
và đối soát phòng đang chạy mỗi 30 giây, cả sau restart. Khi provider lỗi, vòng tiếp theo thử lại.
Tác vụ này chưa dùng BullMQ vì QueueService hiện tại chỉ có queue email/push/expire, chưa có video worker.

Không đưa triệu chứng/tên bệnh nhân vào room name hoặc token metadata. Không log token/body webhook.
Webhook participant_joined được ghi audit với event ID; kiểm tra trùng là best-effort, chưa có unique constraint cho event ID khi chạy nhiều replica.

## 4. Kiểm tra cuộc gọi thật

1. Chuẩn bị bác sĩ có tài khoản hoạt động và lịch ONLINE/ALL hợp lệ, slot thực sự còn chỗ.
2. Bệnh nhân đặt lịch bằng luồng hiện có, hoàn thành xác nhận/thanh toán nếu cần.
3. Mở lịch khám trên mobile → tạo phiên tư vấn → chọn “Video và chat”, nhập vấn đề và đồng ý chia sẻ.
4. Bác sĩ đăng nhập web, mở `/tu-van`, chọn phiên, “Tiếp nhận phiên”.
5. Đúng giờ hẹn, bệnh nhân nhấn biểu tượng camera trong chat. Bác sĩ nhấn “Tham gia video”.
6. Cấp camera/micro, kiểm tra âm thanh hai chiều, camera, đổi camera, loa, gửi chat cùng phiên.
7. Kiểm tra tắt mạng rồi bật lại, từ chối quyền, hết giờ và bác sĩ “Hoàn thành tư vấn”.
8. Kiểm tra người ngoài phiên bị từ chối và webhook hoạt động trên LiveKit Cloud.

Web camera/micro cần HTTPS hoặc localhost. Hai thiết bị khác nhau giúp tránh tiếng vọng.
Không mở hai tab/thiết bị đồng thời bằng cùng tài khoản trong một phòng: LiveKit dùng một identity cho mỗi người.

## 5. Giới hạn cần biết

- Chưa kiểm chứng audio/video thực tế khi chưa có project/credentials LiveKit Cloud.
- Android hiện ngắt khi xuống nền; không có foreground call service, PiP hay gọi đến dạng chuông hệ thống.
- Quay về chat trên Android sẽ rời video; lịch sử vẫn thuộc cùng consultationId. Web hỗ trợ chat cạnh video.
- Phiên CHAT cũ không tự đổi thành VIDEO; không tự nâng cấp dịch vụ hay thu thêm tiền. Mức phí vẫn theo lịch đã đặt, chưa có bảng giá video riêng.
- Trạng thái video unavailable ở UI là cấu hình, không phải kết quả đo sức khỏe dịch vụ LiveKit.
- Chưa bổ sung lịch video riêng hoặc tư vấn ngay. Luồng chọn bác sĩ/slot/thu phí tái sử dụng booking hiện có.
- Chưa tích hợp ghi hình, E2EE cấp ứng dụng, phụ đề, đơn thuốc hoặc kết quả khám tự động.
- Cần test thật thiết bị 360/390/412dp, rotation/process recreation, tai nghe và mạng di động trước phát hành.
- Web dependency `machina@7` yêu cầu Node >=22.22; máy hiện chạy 22.16. Build đã chạy được nhưng nên nâng runtime phù hợp trước deploy.

## Kiểm tra kỹ thuật

```powershell
# backend
npm run build
npx jest --runInBand src/modules/consultations/consultation-video.service.spec.ts src/modules/consultations/consultations.service.spec.ts

# web
npx tsc --noEmit
npm run build

# mobile
.\gradlew.bat :app:assembleDebug
```

Không cần migration cho video: enum VIDEO, videoEnabled và các mốc thời gian đã tồn tại.
Các migration NO_SHOW đang có trong workspace là công việc khác, không do tích hợp này tạo ra.
