# Đặt khám theo phòng trên mobile

Luồng: cơ sở → SERVICE / AFTER_HOURS → chuyên khoa → dịch vụ → phòng → ngày → giờ → hồ sơ → xác nhận/thanh toán.

## Cấu hình dữ liệu thật

Các API dùng Bearer authentication hiện có. Hai API ghi chỉ dành cho ADMIN.

1. `POST /api/v1/clinic-rooms`
   Body: `{ "hospitalId": "UUID", "specialtyId": "UUID", "code": "mã phòng thực tế", "name": "tên phòng thực tế" }`.
2. `POST /api/v1/clinic-rooms/sessions`
   Body: `{ "roomId": "UUID", "medicalServiceId": "UUID", "slotId": "UUID", "mode": "SERVICE", "capacity": 3 }`.
   Dùng slot thực tế của nhân sự trực cùng cơ sở/chuyên khoa, chưa có lượt đặt. Thời lượng slot phải bằng thời lượng dịch vụ. Một slot chỉ gắn một phòng/dịch vụ. Không cho hai phiên trùng giờ trong cùng phòng. AFTER_HOURS chỉ nhận thứ Bảy/Chủ nhật theo Asia/Ho_Chi_Minh.
3. `GET /api/v1/clinic-rooms/catalog?hospitalId=UUID&mode=SERVICE` trả về các session với room, service (gồm specialty), slot (gồm workplace). Chỉ trả lịch tương lai, đang mở, còn chỗ.
4. `POST /api/v1/appointments` tái sử dụng hợp đồng hiện tại, bổ sung `clinicRoomId`, `serviceBookingMode` cùng `medicalServiceId` và `slotId`.

Giá lấy từ MedicalService. Với khám theo phòng, không cộng consultationFee của bác sĩ. Nhân sự trực vẫn được lưu qua slot để tái sử dụng tiếp nhận, thanh toán, hủy và bệnh án hiện có; người bệnh không phải chọn bác sĩ.

Không chạy seed hoặc dựng dữ liệu giả. Quản trị cần cấu hình phòng/lịch thật qua API trên. Chưa bổ sung màn hình quản trị phòng trên web. Khi cần giá ngoài giờ khác, cấu hình dịch vụ giá tương ứng và liên kết với session AFTER_HOURS.

Migration: `prisma/migrations/20261005180000_clinic_rooms/migration.sql`. Với DB có migration history chuẩn dùng quy trình migrate deploy của dự án. DB phát triển hiện tại chưa có baseline đầy đủ nên migration riêng này đã được thực thi bằng prisma db execute, không reset dữ liệu.

Kiểm thử thiết bị cần thực hiện sau khi cấu hình dữ liệu: đặt từng chế độ, đổi chuyên khoa/dịch vụ/phòng, hai người tranh chỗ cuối, thanh toán/hủy trả sức chứa, kiểm tra phòng và giá tại xác nhận.
