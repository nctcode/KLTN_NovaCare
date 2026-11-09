# -*- coding: utf-8 -*-

USECASES_PART4 = [
    # ── PHÂN HỆ 10: QUẢN TRỊ CƠ SỞ Y TẾ (HOSPITAL ADMIN)
    {
        "name": "UC-HOSP-01: Xem Dashboard vận hành cơ sở y tế",
        "description": "Quản trị viên viện theo dõi số liệu thống kê trong phạm vi cơ sở: số lượt khám hôm nay, doanh thu ước tính, tỷ lệ tiếp đón và biểu đồ trạng thái lịch khám.",
        "primary_actor": "Quản trị viên cơ sở y tế (Hospital Admin)",
        "secondary_actor": "Không có",
        "pre_condition": "Đã đăng nhập vai trò HOSPITAL_ADMIN và có gắn mã hospitalId hợp lệ.",
        "post_condition": "Các số liệu KPI vận hành của cơ sở y tế được tổng hợp và hiển thị trực quan.",
        "main_flow": [
            ("1. Đăng nhập cổng quản trị cơ sở y tế và mở trang Dashboard tổng quan.", 
             "2. Gửi request GET /api/v1/hospital-admin/dashboard lên server."),
            ("", 
             "3. Hệ thống truy vấn CSDL lọc theo hospitalId của tài khoản: tổng số lịch hẹn hôm nay, số ca đã check-in, số ca vắng mặt (no-show), doanh thu tiền khám trong ngày/tuần/tháng."),
            ("", 
             "4. Hiển thị các thẻ chỉ số KPI và biểu đồ phân bổ trạng thái lịch khám trực quan.")
        ],
        "alt_flow": [
            ("2.1. Tài khoản quản trị cơ sở chưa được gắn liên kết với bệnh viện nào.", 
             "3.1. Hệ thống báo lỗi 403 Forbidden: \"Tài khoản quản trị chưa được liên kết với cơ sở y tế cụ thể. Vui lòng liên hệ Super Admin\".")
        ]
    },
    {
        "name": "UC-HOSP-02: Xem & Cập nhật hồ sơ cơ sở y tế",
        "description": "Quản trị viên viện cập nhật thông tin giới thiệu bệnh viện, địa chỉ, số hotline, thời gian tiếp nhận người bệnh và hình ảnh đại diện.",
        "primary_actor": "Quản trị viên cơ sở y tế (Hospital Admin)",
        "secondary_actor": "Không có",
        "pre_condition": "Đã đăng nhập vai trò HOSPITAL_ADMIN.",
        "post_condition": "Bản ghi Hospital tương ứng được cập nhật mới trên cổng thông tin công khai.",
        "main_flow": [
            ("1. Mở mục \"Thông tin cơ sở y tế\" trên menu quản trị.", 
             "2. Gửi request GET /api/v1/hospital-admin/my-hospital. Hệ thống tải thông tin hiện tại lên biểu mẫu."),
            ("3. Thay đổi thông tin hotline, giờ làm việc, địa chỉ hoặc tải lên ảnh đại diện mới.", 
             "4. Nhấn nút \"Lưu thay đổi\". Gửi request PUT /api/v1/hospital-admin/my-hospital."),
            ("", 
             "5. Hệ thống kiểm tra dữ liệu đầu vào, cập nhật vào bảng Hospital và hiển thị thông báo thành công.")
        ],
        "alt_flow": [
            ("3.1. Để trống số điện thoại hotline hoặc địa chỉ bệnh viện.", 
             "4.1. Hệ thống cảnh báo các trường thông tin bắt buộc và yêu cầu người dùng điền đầy đủ trước khi lưu.")
        ]
    },
    {
        "name": "UC-HOSP-03: Quản lý danh sách bác sĩ tại cơ sở",
        "description": "Quản trị viên viện xem danh sách bác sĩ đang công tác tại viện, điều chỉnh mức giá khám riêng, kích hoạt hoặc tạm dừng tiếp nhận lịch khám.",
        "primary_actor": "Quản trị viên cơ sở y tế (Hospital Admin)",
        "secondary_actor": "Không có",
        "pre_condition": "Đã đăng nhập vai trò HOSPITAL_ADMIN.",
        "post_condition": "Bản ghi DoctorWorkplace được cập nhật trạng thái hoạt động và giá khám mới.",
        "main_flow": [
            ("1. Vào mục \"Quản lý Bác sĩ\" của cơ sở.", 
             "2. Gửi request GET /api/v1/hospital-admin/doctors. Hệ thống trả về danh sách bác sĩ có liên kết nơi làm việc tại bệnh viện hiện tại."),
            ("3. Chọn một bác sĩ cần điều chỉnh, bấm nút \"Chỉnh sửa\".", 
             "4. Thay đổi giá khám (consultationFee), phòng khám phụ trách hoặc chuyển đổi trạng thái hoạt động (isActive = true/false)."),
            ("5. Nhấn nút \"Lưu cập nhật\".", 
             "6. Gửi request PATCH /api/v1/hospital-admin/doctors/:workplaceId; hệ thống cập nhật CSDL và hiển thị thông báo thành công.")
        ],
        "alt_flow": [
            ("4.1. Nhập giá khám âm hoặc định dạng giá không hợp lệ.", 
             "5.1. Hệ thống báo lỗi kiểm tra dữ liệu và yêu cầu nhập số tiền lớn hơn hoặc bằng 0.")
        ]
    },
    {
        "name": "UC-HOSP-04: Quản lý dịch vụ & Chuyên khoa cơ sở",
        "description": "Quản trị viên viện bật/tắt các chuyên khoa tiếp nhận và cấu hình bảng giá các dịch vụ khám, xét nghiệm niêm yết tại viện.",
        "primary_actor": "Quản trị viên cơ sở y tế (Hospital Admin)",
        "secondary_actor": "Không có",
        "pre_condition": "Đã đăng nhập vai trò HOSPITAL_ADMIN.",
        "post_condition": "Trạng thái tiếp nhận chuyên khoa và giá dịch vụ của cơ sở được cập nhật đồng bộ.",
        "main_flow": [
            ("1. Mở danh mục \"Dịch vụ & Chuyên khoa\" của bệnh viện.", 
             "2. Gửi request GET /api/v1/hospital-admin/specialties và GET /api/v1/hospital-admin/services."),
            ("", 
             "3. Hệ thống hiển thị danh sách các chuyên khoa và dịch vụ y tế của viện."),
            ("4. Bật hoặc tắt trạng thái tiếp nhận bệnh nhân của chuyên khoa, chỉnh sửa mức giá dịch vụ.", 
             "5. Nhấn nút \"Lưu cấu hình\". Gửi request PATCH /api/v1/hospital-admin/services/:id; hệ thống cập nhật CSDL thành công.")
        ],
        "alt_flow": [
            ("4.1. Tắt một chuyên khoa đang có lịch hẹn khám sắp tới của người bệnh.", 
             "5.1. Hệ thống hiển thị cảnh báo: \"Chuyên khoa này đang có lịch hẹn chờ khám trong tuần tới. Việc tắt chuyên khoa sẽ không ảnh hưởng đến các lịch hẹn đã xác nhận\".")
        ]
    },
    {
        "name": "UC-HOSP-05: Tiếp đón & Check-in người bệnh",
        "description": "Nhân viên y tế quét mã phiếu khám hoặc tìm kiếm tên bệnh nhân để thực hiện Check-in tiếp đón khi bệnh nhân có mặt tại viện.",
        "primary_actor": "Quản trị viên cơ sở y tế (Hospital Admin)",
        "secondary_actor": "Không có",
        "pre_condition": "Phiếu khám ở trạng thái CONFIRMED hoặc PAID; đúng ngày hẹn khám; thuộc cơ sở hiện tại.",
        "post_condition": "Trạng thái Appointment chuyển sang CHECKED_IN; ghi nhận thời điểm tiếp đón thực tế; cập nhật màn hình chờ khám của phòng khám.",
        "main_flow": [
            ("1. Tiếp nhận người bệnh tại quầy đón tiếp.", 
             "2. Nhân viên quét mã QR trên phiếu khám điện tử hoặc nhập mã phiếu khám (APPT-XXXXXX)."),
            ("", 
             "3. Hệ thống truy vấn thông tin phiếu khám: tên bệnh nhân, phòng khám số, bác sĩ phụ trách, trạng thái thanh toán."),
            ("4. Nhân viên nhấn nút \"Tiếp đón (Check-in)\".", 
             "5. Gửi request PATCH /api/v1/hospital-admin/appointments/:id/check-in. Hệ thống cập nhật status thành CHECKED_IN, ghi thời gian checkinAt, ghi nhật ký timeline và cấp số thứ tự vào phòng khám.")
        ],
        "alt_flow": [
            ("2.1. Người bệnh đến sai ngày hẹn (sớm hơn hoặc muộn hơn ngày khám ghi trên phiếu).", 
             "3.1. Hệ thống hiển thị cảnh báo đỏ: \"Phiếu khám này có ngày hẹn là [Ngày hẹn]. Hôm nay không đúng ngày hẹn khám\".")
        ]
    },
    {
        "name": "UC-HOSP-06: Quản lý vắng mặt (No-Show)",
        "description": "Kiểm tra điều kiện và đánh dấu trạng thái vắng mặt đối với bệnh nhân không đến khám quá thời gian quy định.",
        "primary_actor": "Quản trị viên cơ sở y tế (Hospital Admin)",
        "secondary_actor": "Không có",
        "pre_condition": "Đã quá giờ hẹn khám theo chính sách của viện (mặc định quá 60 phút) và bệnh nhân chưa check-in.",
        "post_condition": "Trạng thái Appointment chuyển sang NO_SHOW; suất khám liên quan được giải phóng.",
        "main_flow": [
            ("1. Tại danh sách lịch hẹn trong ngày, hệ thống lọc các ca quá giờ hẹn chưa đến.", 
             "2. Nhân viên mở chi tiết phiếu khám, hệ thống kiểm tra điều kiện (GET /appointments/:id/no-show-eligibility)."),
            ("3. Nhân viên nhấn nút \"Đánh dấu vắng mặt (No-Show)\".", 
             "4. Gửi request PATCH /api/v1/hospital-admin/appointments/:id/status kèm status = 'NO_SHOW'."),
            ("", 
             "5. Hệ thống cập nhật trạng thái NO_SHOW, giải phóng suất khám và ghi nhật ký timeline.")
        ],
        "alt_flow": [
            ("2.1. Phiếu khám chưa quá thời hạn vắng mặt theo quy định.", 
             "3.1. Nút đánh dấu vắng mặt bị mờ (disabled) và hệ thống hiển thị thời gian còn lại trước khi được phép đánh dấu no-show.")
        ]
    },
    {
        "name": "UC-HOSP-07: Khôi phục lịch vắng mặt (Revert No-Show)",
        "description": "Hoàn tác trạng thái vắng mặt khi bệnh nhân đến muộn có lý do chính đáng và được bệnh viện chấp thuận tiếp tục khám.",
        "primary_actor": "Quản trị viên cơ sở y tế (Hospital Admin)",
        "secondary_actor": "Không có",
        "pre_condition": "Lịch hẹn đang ở trạng thái NO_SHOW trong ngày hiện tại.",
        "post_condition": "Trạng thái Appointment được khôi phục về CONFIRMED hoặc CHECKED_IN.",
        "main_flow": [
            ("1. Mở chi tiết phiếu khám đã bị đánh dấu NO_SHOW.", 
             "2. Nhấn nút \"Khôi phục tiếp đón (Revert No-Show)\". Hiển thị hộp thoại nhập lý do khôi phục."),
            ("3. Nhập lý do (ví dụ: Bệnh nhân kẹt xe đến muộn, phòng khám đồng ý tiếp nhận bổ sung).", 
             "4. Nhấn nút \"Xác nhận khôi phục\". Gửi request PATCH /api/v1/hospital-admin/appointments/:id/revert-no-show."),
            ("", 
             "5. Hệ thống hoàn tác trạng thái lịch hẹn, ghi nhận lý do vào nhật ký timeline và đưa bệnh nhân vào cuối hàng đợi phòng khám.")
        ],
        "alt_flow": [
            ("2.1. Ca khám thuộc về ngày trong quá khứ (không phải ngày hôm nay).", 
             "3.1. Hệ thống từ chối khôi phục và thông báo: \"Không thể khôi phục lịch vắng mặt của các ngày trước đó\".")
        ]
    },
    {
        "name": "UC-HOSP-08: Ghi nhận nhật ký liên lạc người bệnh (Contact Logs)",
        "description": "Nhân viên bệnh viện lưu lịch sử các cuộc gọi điện thoại nhắc lịch hoặc tin nhắn thông báo cho người bệnh vào hồ sơ lịch hẹn.",
        "primary_actor": "Quản trị viên cơ sở y tế (Hospital Admin)",
        "secondary_actor": "Không có",
        "pre_condition": "Lịch hẹn tồn tại trong hệ thống.",
        "post_condition": "Bản ghi ContactLog mới được lưu trữ gắn với appointmentId.",
        "main_flow": [
            ("1. Tại phiếu khám, nhân viên chọn chức năng \"Ghi nhật ký liên lạc\".", 
             "2. Hiển thị biểu mẫu ghi nhận: Phương thức liên lạc (Gọi điện thoại, Nhắn tin SMS, Email), Kết quả liên lạc (Bắt máy xác nhận, Không nhấc máy, Số máy bận, Hẹn gọi lại)."),
            ("3. Chọn kết quả liên lạc và nhập ghi chú chi tiết nội dung cuộc trao đổi.", 
             "4. Nhấn nút \"Lưu nhật ký liên lạc\". Gửi request POST /api/v1/hospital-admin/appointments/:id/contact-logs."),
            ("", 
             "5. Hệ thống lưu bản ghi ContactLog kèm thời điểm và nhân viên thực hiện, hiển thị trong tab lịch sử liên lạc của phiếu khám.")
        ],
        "alt_flow": [
            ("3.1. Để trống trường kết quả liên lạc bắt buộc.", 
             "4.1. Hệ thống báo lỗi và yêu cầu chọn kết quả trước khi lưu.")
        ]
    },
    {
        "name": "UC-HOSP-09: Kiểm tra kết nối bắt tay với HIS (Test Handshake)",
        "description": "Kiểm tra tình trạng thông mạng và tính hợp lệ của khóa bảo mật API kết nối với cổng HIS của bệnh viện đối tác.",
        "primary_actor": "Quản trị viên cơ sở y tế (Hospital Admin)",
        "secondary_actor": "Hệ thống HIS đối tác",
        "pre_condition": "Đã cấu hình HIS Endpoint URL và API Key trong hệ thống.",
        "post_condition": "Kết quả kiểm tra bắt tay (Handshake Success/Failed) và độ trễ phản hồi được hiển thị.",
        "main_flow": [
            ("1. Mở trang \"Cấu hình liên thông HIS\" trong cổng quản trị cơ sở.", 
             "2. Nhấn nút \"Kiểm tra kết nối (Test Handshake)\"."),
            ("3. Gửi request POST /api/v1/hospital-admin/integration/test-handshake lên server.", 
             "4. Server NovaCare gửi HTTP GET probe request kèm Header Authorization đến endpoint của máy chủ HIS đối tác."),
            ("", 
             "5. Nhận phản hồi từ HIS, đo lường thời gian trễ (latency ms) và kiểm tra mã phản hồi HTTP 200 OK."),
            ("", 
             "6. Hiển thị thông báo trạng thái: \"Kết nối thành công! Độ trễ: 45ms. Cổng HIS sẵn sàng trao đổi dữ liệu\".")
        ],
        "alt_flow": [
            ("4.1. Máy chủ HIS không phản hồi (Connection Timeout) hoặc trả về mã lỗi 401 Unauthorized do sai API Key.", 
             "5.1. Hệ thống hiển thị cảnh báo lỗi chi tiết kèm hướng dẫn kiểm tra lại địa chỉ IP, cổng mạng hoặc khóa API Key.")
        ]
    },
    {
        "name": "UC-HOSP-10: Đồng bộ danh mục khoa phòng & Bác sĩ từ HIS",
        "description": "Thực hiện đồng bộ dữ liệu khoa phòng, danh sách bác sĩ và ca trực từ phần mềm quản lý bệnh viện (HIS) nội bộ lên NovaCare.",
        "primary_actor": "Quản trị viên cơ sở y tế (Hospital Admin)",
        "secondary_actor": "Hệ thống HIS đối tác",
        "pre_condition": "Kết nối Handshake giữa NovaCare và HIS đang hoạt động bình thường.",
        "post_condition": "Danh mục chuyên khoa, bác sĩ và lịch trực trên NovaCare được cập nhật đồng nhất với dữ liệu HIS.",
        "main_flow": [
            ("1. Nhấn nút \"Đồng bộ danh mục ngay\" tại trang Tích hợp HIS.", 
             "2. Gửi request POST /api/v1/hospital-admin/integration/sync-catalog lên server."),
            ("", 
             "3. Hệ thống gọi API xuất danh mục của HIS đối tác, lấy dữ liệu danh sách khoa phòng và danh sách nhân viên y tế."),
            ("", 
             "4. Chuẩn hóa dữ liệu theo chuẩn danh mục NovaCare: đối chiếu mã khoa phòng, tạo mới hoặc cập nhật thông tin bác sĩ và ca trực tương ứng trong CSDL."),
            ("", 
             "5. Trả về báo cáo kết quả đồng bộ: số bản ghi thêm mới, số bản ghi cập nhật và số bản ghi bỏ qua.")
        ],
        "alt_flow": [
            ("3.1. Dữ liệu trả về từ HIS bị sai định dạng cấu trúc JSON/XML.", 
             "4.1. Hệ thống ghi log lỗi phân tích cú pháp, rollback transaction và thông báo nguyên nhân lỗi định dạng cho quản trị viên.")
        ]
    },

    # ── PHÂN HỆ 11: QUẢN TRỊ HỆ THỐNG TOÀN DIỆN (SUPER ADMIN)
    {
        "name": "UC-ADMN-01: Xem Dashboard phân tích toàn hệ thống",
        "description": "Super Admin theo dõi các chỉ số vĩ mô: tổng lượt khám toàn quốc, doanh thu theo tháng, biểu đồ xu hướng tăng trưởng và top cơ sở y tế hoạt động hiệu quả.",
        "primary_actor": "Quản trị viên hệ thống (Super Admin)",
        "secondary_actor": "Không có",
        "pre_condition": "Đã đăng nhập vai trò ADMIN.",
        "post_condition": "Các biểu đồ và chỉ số KPI toàn hệ thống được hiển thị trực quan.",
        "main_flow": [
            ("1. Đăng nhập cổng quản trị Super Admin (/admin).", 
             "2. Gửi các request GET /api/v1/admin/dashboard/overview, /appointments-by-day, /revenue-by-month."),
            ("", 
             "3. Hệ thống tổng hợp dữ liệu trên toàn bộ các bảng trong CSDL PostgreSQL."),
            ("", 
             "4. Hiển thị Dashboard quản trị cấp cao với các biểu đồ đường doanh thu, biểu đồ tròn phân bổ trạng thái và bảng xếp hạng bác sĩ/cơ sở uy tín.")
        ],
        "alt_flow": [
            ("1.1. Tài khoản đăng nhập không có quyền ADMIN.", 
             "2.1. Hệ thống chặn truy cập và chuyển hướng về trang lỗi 403 Forbidden.")
        ]
    },
    {
        "name": "UC-ADMN-02: Quản lý danh sách & Trạng thái người dùng",
        "description": "Xem toàn bộ tài khoản người dùng trong hệ thống, tìm kiếm theo tên/SĐT/email, thực hiện khóa (LOCK) hoặc mở khóa tài khoản vi phạm.",
        "primary_actor": "Quản trị viên hệ thống (Super Admin)",
        "secondary_actor": "Không có",
        "pre_condition": "Đã đăng nhập vai trò ADMIN.",
        "post_condition": "Trạng thái người dùng trong bảng User được cập nhật mới.",
        "main_flow": [
            ("1. Mở danh mục \"Quản lý người dùng\" trên thanh menu admin.", 
             "2. Gửi request GET /api/v1/admin/users. Hệ thống hiển thị danh sách người dùng phân trang."),
            ("3. Nhập từ khóa tìm kiếm người dùng và nhấn Lọc.", 
             "4. Chọn một tài khoản người dùng vi phạm quy chế."),
            ("5. Nhấn nút \"Khóa tài khoản\". Gửi request PATCH /api/v1/admin/users/:id/status kèm status = 'LOCKED'.", 
             "6. Hệ thống cập nhật CSDL, thu hồi toàn bộ Refresh Token của tài khoản đó và thông báo khóa tài khoản thành công.")
        ],
        "alt_flow": [
            ("5.1. Quản trị viên cố gắng khóa chính tài khoản Super Admin đang đăng nhập.", 
             "6.1. Hệ thống chặn thao tác và thông báo: \"Không thể tự khóa tài khoản quản trị đang hoạt động\".")
        ]
    },
    {
        "name": "UC-ADMN-03: Phân quyền vai trò người dùng (RBAC)",
        "description": "Thay đổi quyền hạn vai trò (PATIENT, DOCTOR, HOSPITAL_ADMIN, ADMIN) của một tài khoản trong hệ thống.",
        "primary_actor": "Quản trị viên hệ thống (Super Admin)",
        "secondary_actor": "Không có",
        "pre_condition": "Đã đăng nhập vai trò ADMIN.",
        "post_condition": "Quyền role trong bản ghi User được cập nhật; token phiên tiếp theo của user sẽ mang quyền mới.",
        "main_flow": [
            ("1. Tại chi tiết tài khoản người dùng, chọn chức năng \"Phân quyền vai trò\".", 
             "2. Hiển thị danh sách các vai trò: PATIENT, DOCTOR, HOSPITAL_ADMIN, ADMIN."),
            ("3. Chọn vai trò mới cần gán cho người dùng.", 
             "4. Nhấn nút \"Cập nhật quyền hạn\". Gửi request PATCH /api/v1/admin/users/:id/role."),
            ("", 
             "5. Hệ thống kiểm tra quyền hạn, cập nhật trường role trong bảng User, ghi log kiểm toán an ninh và phản hồi thành công.")
        ],
        "alt_flow": [
            ("3.1. Gán vai trò HOSPITAL_ADMIN nhưng không chỉ định cơ sở y tế trực thuộc.", 
             "4.1. Hệ thống yêu cầu bắt buộc phải liên kết tài khoản với một bệnh viện/phòng khám cụ thể trước khi lưu.")
        ]
    },
    {
        "name": "UC-ADMN-04: Khởi tạo tài khoản Quản trị cơ sở y tế",
        "description": "Super Admin tạo mới thủ công tài khoản HOSPITAL_ADMIN và gán quyền quản lý một bệnh viện cụ thể, kích hoạt gửi email thiết lập mật khẩu.",
        "primary_actor": "Quản trị viên hệ thống (Super Admin)",
        "secondary_actor": "Dịch vụ Email SMTP",
        "pre_condition": "Cơ sở y tế đã được tạo trong CSDL.",
        "post_condition": "Tài khoản HOSPITAL_ADMIN được tạo ở trạng thái PENDING_ACTIVATION; email kích hoạt được gửi tự động.",
        "main_flow": [
            ("1. Chọn chức năng \"Thêm Quản trị viên cơ sở\" tại trang Quản lý người dùng.", 
             "2. Điền email, họ tên, số điện thoại và chọn cơ sở y tế trực thuộc từ danh mục bệnh viện."),
            ("3. Nhấn nút \"Tạo tài khoản và Gửi thư kích hoạt\".", 
             "4. Gửi request POST /api/v1/admin/users/hospital-admin."),
            ("", 
             "5. Hệ thống sinh mã kích hoạt ngẫu nhiên có chữ ký số (thời hạn 24h), tạo bản ghi User với role HOSPITAL_ADMIN, lưu token vào CSDL."),
            ("", 
             "6. Kích hoạt dịch vụ Email gửi thư mời kèm liên kết kích hoạt đến địa chỉ email của đại diện cơ sở.")
        ],
        "alt_flow": [
            ("2.1. Email đăng ký đã tồn tại trong hệ thống.", 
             "3.1. Hệ thống trả về lỗi 409 Conflict: \"Địa chỉ email này đã được sử dụng cho một tài khoản khác\".")
        ]
    },
    {
        "name": "UC-ADMN-05: Quản lý danh mục Cơ sở y tế toàn quốc",
        "description": "Thêm mới, phê duyệt, chỉnh sửa thông tin hoặc xóa các cơ sở y tế (Bệnh viện công, Bệnh viện tư, Phòng khám) trên toàn quốc.",
        "primary_actor": "Quản trị viên hệ thống (Super Admin)",
        "secondary_actor": "Không có",
        "pre_condition": "Đã đăng nhập vai trò ADMIN.",
        "post_condition": "Thông tin cơ sở y tế được tạo mới, cập nhật hoặc xóa trong bảng Hospital.",
        "main_flow": [
            ("1. Mở danh mục \"Cơ sở y tế\" trên menu admin.", 
             "2. Chọn chức năng \"Thêm mới cơ sở y tế\" (hoặc bấm sửa tại cơ sở hiện có)."),
            ("3. Điền thông tin: Tên bệnh viện, loại hình (HOSPITAL/CLINIC), số giấy phép hoạt động, địa chỉ chi tiết, tỉnh/thành phố, quận/huyện, tọa độ GPS (lat/lng), hotline, tải lên logo và ảnh bìa.", 
             "4. Nhấn nút \"Lưu cơ sở y tế\". Gửi request POST hoặc PATCH đến /api/v1/admin/hospitals."),
            ("", 
             "5. Hệ thống kiểm tra dữ liệu, lưu vào bảng Hospital và hiển thị trên cổng thông tin công khai.")
        ],
        "alt_flow": [
            ("3.1. Thiếu thông tin bắt buộc hoặc trùng lặp số giấy phép hoạt động.", 
             "4.1. Hệ thống báo lỗi và yêu cầu kiểm tra lại tính duy nhất của giấy phép y tế.")
        ]
    },
    {
        "name": "UC-ADMN-06: Quản lý danh mục Bác sĩ toàn hệ thống",
        "description": "Thêm mới hồ sơ bác sĩ, phân công nơi làm việc tại các bệnh viện, thiết lập chuyên khoa công tác và cấp tài khoản đăng nhập.",
        "primary_actor": "Quản trị viên hệ thống (Super Admin)",
        "secondary_actor": "Không có",
        "pre_condition": "Đã đăng nhập vai trò ADMIN.",
        "post_condition": "Hồ sơ bác sĩ và tài khoản đăng nhập DOCTOR được khởi tạo và liên kết thành công.",
        "main_flow": [
            ("1. Mở mục \"Quản lý Bác sĩ\" trên cổng admin.", 
             "2. Bấm nút \"Thêm mới Bác sĩ\". Điền họ tên, học vị (BS, ThS, TS, PGS, GS), chuyên khoa chính, số năm kinh nghiệm và tiểu sử chuyên môn."),
            ("3. Thiết lập liên kết nơi làm việc: chọn bệnh viện công tác và mức giá khám tiêu chuẩn.", 
             "4. Nhấn nút \"Lưu hồ sơ Bác sĩ\". Gửi request POST /api/v1/admin/doctors."),
            ("", 
             "5. Hệ thống lưu bản ghi Doctor, tạo liên kết DoctorWorkplace và kích hoạt tài khoản đăng nhập vai trò DOCTOR cho bác sĩ.")
        ],
        "alt_flow": [
            ("2.1. Bác sĩ chưa được chỉ định chuyên khoa công tác.", 
             "3.1. Hệ thống yêu cầu bắt buộc phải chọn ít nhất một chuyên khoa cho bác sĩ.")
        ]
    },
    {
        "name": "UC-ADMN-07: Quản lý danh mục Chuyên khoa toàn quốc",
        "description": "Tạo mới, chỉnh sửa, tải lên biểu tượng và bật/tắt hiển thị danh mục các chuyên khoa y tế chuẩn mực trên toàn hệ thống.",
        "primary_actor": "Quản trị viên hệ thống (Super Admin)",
        "secondary_actor": "Không có",
        "pre_condition": "Đã đăng nhập vai trò ADMIN.",
        "post_condition": "Danh mục chuyên khoa chuẩn được cập nhật trong bảng Specialty.",
        "main_flow": [
            ("1. Mở mục \"Quản lý Chuyên khoa\" trên menu admin.", 
             "2. Bấm nút \"Thêm chuyên khoa mới\"."),
            ("3. Nhập tên chuyên khoa (tiếng Việt), mô tả bệnh học sơ bộ và tải lên biểu tượng SVG/PNG minh họa.", 
             "4. Nhấn nút \"Lưu chuyên khoa\". Gửi request POST /api/v1/admin/specialties."),
            ("", 
             "5. Hệ thống kiểm tra trùng lặp tên chuyên khoa, lưu vào bảng Specialty và cập nhật vào bộ lọc tìm kiếm toàn hệ thống.")
        ],
        "alt_flow": [
            ("3.1. Tên chuyên khoa nhập vào bị trùng lặp với chuyên khoa đã có trong CSDL.", 
             "4.1. Hệ thống trả về lỗi 409 Conflict: \"Tên chuyên khoa này đã tồn tại trong danh mục\".")
        ]
    },
    {
        "name": "UC-ADMN-08: Quản lý Gói khám & Dịch vụ y tế dùng chung",
        "description": "Tạo các gói khám sức khỏe tổng quát mẫu, danh mục các xét nghiệm và kỹ thuật cận lâm sàng chuẩn phục vụ toàn mạng lưới.",
        "primary_actor": "Quản trị viên hệ thống (Super Admin)",
        "secondary_actor": "Không có",
        "pre_condition": "Đã đăng nhập vai trò ADMIN.",
        "post_condition": "Gói khám và dịch vụ y tế mẫu được lưu vào bảng HealthPackage và MedicalService.",
        "main_flow": [
            ("1. Chọn mục \"Quản lý Gói khám & Dịch vụ\".", 
             "2. Bấm nút \"Tạo gói khám mới\"."),
            ("3. Nhập tên gói khám, đối tượng áp dụng, danh mục các hạng mục khám chi tiết, mức giá khuyến nghị và mô tả quyền lợi.", 
             "4. Nhấn nút \"Lưu và Phát hành\". Gửi request POST /api/v1/admin/health-packages."),
            ("", 
             "5. Hệ thống lưu bản ghi và hiển thị gói khám trên cổng thông tin công khai.")
        ],
        "alt_flow": [
            ("3.1. Để trống danh mục các hạng mục khám bên trong gói.", 
             "4.1. Hệ thống yêu cầu thêm ít nhất một dịch vụ chi tiết vào gói khám.")
        ]
    },
    {
        "name": "UC-ADMN-09: Quản lý lịch hẹn & Điều phối toàn hệ thống",
        "description": "Super Admin tra cứu danh sách toàn bộ các lịch hẹn trên toàn quốc, can thiệp xử lý các khiếu nại hoặc hủy/đổi lịch khẩn cấp.",
        "primary_actor": "Quản trị viên hệ thống (Super Admin)",
        "secondary_actor": "Không có",
        "pre_condition": "Đã đăng nhập vai trò ADMIN.",
        "post_condition": "Trạng thái lịch hẹn được điều chỉnh theo quyết định can thiệp của ban quản trị.",
        "main_flow": [
            ("1. Mở mục \"Quản lý lịch hẹn toàn hệ thống\".", 
             "2. Gửi request GET /api/v1/admin/appointments kèm các bộ lọc (ngày khám, bệnh viện, trạng thái)."),
            ("", 
             "3. Hệ thống trả về danh sách lịch hẹn toàn quốc kèm thông tin chi tiết."),
            ("4. Chọn một lịch hẹn cần can thiệp xử lý sự cố và cập nhật trạng thái.", 
             "5. Gửi request PATCH /api/v1/admin/appointments/:id/status kèm lý do can thiệp; hệ thống cập nhật CSDL và ghi log kiểm toán.")
        ],
        "alt_flow": [
            ("4.1. Can thiệp thay đổi trạng thái của ca khám đã hoàn thành từ lâu.", 
             "5.1. Hệ thống yêu cầu nhập lý do can thiệp đặc biệt để lưu vào hồ sơ kiểm toán an ninh.")
        ]
    },
    {
        "name": "UC-ADMN-10: Quản lý giao dịch thanh toán & Đối soát",
        "description": "Super Admin tra cứu toàn bộ lịch sử giao dịch thanh toán qua cổng VNPay, đối soát mã giao dịch ngân hàng và doanh thu thực tế.",
        "primary_actor": "Quản trị viên hệ thống (Super Admin)",
        "secondary_actor": "Cổng thanh toán VNPay",
        "pre_condition": "Đã đăng nhập vai trò ADMIN.",
        "post_condition": "Báo cáo dòng tiền và danh sách các giao dịch thanh toán được kết xuất minh bạch.",
        "main_flow": [
            ("1. Mở danh mục \"Quản lý giao dịch & Thanh toán\".", 
             "2. Gửi request GET /api/v1/admin/payments. Hệ thống tải danh sách các bản ghi PaymentTransaction."),
            ("3. Lọc theo mã giao dịch vnp_TxnRef, mã ngân hàng hoặc khoảng thời gian.", 
             "4. Xem chi tiết thông số giao dịch: số tiền, thời gian thanh toán, mã đối soát VNPay, trạng thái và phiếu khám liên kết.")
        ],
        "alt_flow": [
            ("3.1. Không tìm thấy mã giao dịch đối soát tương ứng.", 
             "4.1. Hệ thống thông báo không có bản ghi và gợi ý kiểm tra lại mã tham chiếu.")
        ]
    },
    {
        "name": "UC-ADMN-11: Xử lý lệnh hoàn tiền (Refund) cho người bệnh",
        "description": "Kích hoạt lệnh hoàn trả tiền khám trực tuyến cho người bệnh khi lịch hẹn bị hủy hợp lệ theo chính sách của bệnh viện.",
        "primary_actor": "Quản trị viên hệ thống (Super Admin)",
        "secondary_actor": "Cổng thanh toán VNPay",
        "pre_condition": "Giao dịch thanh toán ở trạng thái PAID; lịch hẹn liên quan đã bị hủy hợp lệ.",
        "post_condition": "Trạng thái PaymentTransaction chuyển sang REFUNDED; kích hoạt quy trình hoàn tiền về tài khoản người bệnh.",
        "main_flow": [
            ("1. Mở danh sách các yêu cầu hoàn tiền đang chờ xử lý.", 
             "2. Kiểm tra căn cứ hủy lịch và số tiền đã thanh toán."),
            ("3. Nhấn nút \"Chấp thuận hoàn tiền (Refund)\".", 
             "4. Gửi request PATCH /api/v1/admin/payments/:id/refund kèm ghi chú phê duyệt."),
            ("", 
             "5. Hệ thống cập nhật trạng thái giao dịch sang REFUNDED, ghi nhận số tiền hoàn và gửi thông báo hoàn tiền thành công đến người bệnh.")
        ],
        "alt_flow": [
            ("3.1. Giao dịch chưa được thanh toán thành công hoặc đã được hoàn tiền trước đó.", 
             "4.1. Hệ thống chặn thao tác và thông báo: \"Giao dịch này không đủ điều kiện để thực hiện hoàn tiền\".")
        ]
    },
    {
        "name": "UC-ADMN-12: Phê duyệt yêu cầu đăng ký hợp tác (Partner Requests)",
        "description": "Super Admin thẩm định đơn đăng ký tham gia mạng lưới của cơ sở y tế ngoài; khi duyệt đơn, hệ thống tự động khởi tạo cơ sở y tế và cấp tài khoản Quản trị viện.",
        "primary_actor": "Quản trị viên hệ thống (Super Admin)",
        "secondary_actor": "Dịch vụ Email SMTP",
        "pre_condition": "Có bản ghi PartnerRequest ở trạng thái PENDING.",
        "post_condition": "Bản ghi Hospital mới được tạo; tài khoản User vai trò HOSPITAL_ADMIN được khởi tạo; email kích hoạt được gửi tự động đến đối tác.",
        "main_flow": [
            ("1. Mở mục \"Yêu cầu hợp tác đối tác\" trên menu admin.", 
             "2. Gửi request GET /api/v1/admin/partner-requests. Hệ thống hiển thị danh sách các đơn đăng ký chờ duyệt."),
            ("3. Xem chi tiết đơn đăng ký: Tên đơn vị, người đại diện, số điện thoại, email, địa chỉ, ảnh chụp giấy phép hoạt động khám chữa bệnh.", 
             "4. Hệ thống hiển thị toàn bộ hồ sơ pháp lý và thông tin liên hệ của đơn vị đăng ký."),
            ("5. Nhấn nút \"Phê duyệt hợp tác (Approve)\". Gửi request POST /api/v1/admin/partner-requests/:id/approve.", 
             "6. Mở transaction: Cập nhật PartnerRequest thành APPROVED. Tự động tạo bản ghi Hospital mới từ thông tin đăng ký. Tự động tạo bản ghi User mới với role HOSPITAL_ADMIN liên kết với bệnh viện vừa tạo. Kích hoạt dịch vụ gửi email chúc mừng và gửi kèm liên kết kích hoạt tài khoản an toàn đến email đối tác.")
        ],
        "alt_flow": [
            ("4.1. Hồ sơ đối tác không hợp lệ hoặc thiếu giấy phép hoạt động hợp pháp.", 
             "5.1. Quản trị viên nhấn nút \"Từ chối yêu cầu (Reject)\", nhập lý do từ chối. Hệ thống chuyển trạng thái REJECTED và gửi email thông báo từ chối kèm lý do cho đối tác.")
        ]
    },

    # ── PHÂN HỆ 12: TÍCH HỢP & LIÊN THÔNG DỮ LIỆU Y TẾ
    {
        "name": "UC-INTEG-01: Định danh & Ghép nối người bệnh liên viện (Identity Matching)",
        "description": "Hệ thống đối soát thông tin CCCD, BHYT và số điện thoại để ghép nối hồ sơ bệnh nhân trên NovaCare với mã bệnh nhân nội bộ tại phần mềm HIS của bệnh viện đối tác.",
        "primary_actor": "Bác sĩ, Hệ thống HIS đối tác",
        "secondary_actor": "Không có",
        "pre_condition": "Hồ sơ bệnh nhân có đầy đủ số CCCD hoặc số thẻ BHYT hợp lệ.",
        "post_condition": "Bản ghi HospitalPatientLink được tạo lập, lưu trữ mã bệnh nhân ngoại bộ (externalPatientId) liên kết với PatientProfile.",
        "main_flow": [
            ("1. Bác sĩ hoặc nhân viên tiếp đón tra cứu thông tin người bệnh trên cổng liên thông.", 
             "2. Gửi request GET /api/v1/integration/patients/match kèm cccd, bhyt, fullName."),
            ("", 
             "3. Hệ thống NovaCare gửi truy vấn đối soát sang Master Patient Index (MPI) của máy chủ HIS đối tác."),
            ("", 
             "4. Nếu tìm thấy bản ghi trùng khớp trên HIS, hệ thống tự động tạo liên kết HospitalPatientLink lưu mã bệnh nhân nội viện của bệnh viện đó và phản hồi thành công.")
        ],
        "alt_flow": [
            ("3.1. Không tìm thấy thông tin bệnh nhân trên hệ thống HIS của bệnh viện.", 
             "4.1. Hệ thống thông báo người bệnh chưa từng khám tại cơ sở này và khởi tạo mã hồ sơ mới trên HIS.")
        ]
    },
    {
        "name": "UC-INTEG-02: Quản lý quyền đồng ý chia sẻ liên viện (Consent Management)",
        "description": "Người bệnh chủ động cấp quyền (GRANT) hoặc thu hồi (REVOKE) việc cho phép một cơ sở y tế cụ thể truy xuất dữ liệu bệnh án cá nhân của mình.",
        "primary_actor": "Bệnh nhân (Patient)",
        "secondary_actor": "Không có",
        "pre_condition": "Người bệnh đã đăng nhập vào hệ thống.",
        "post_condition": "Bản ghi PatientConsent được cập nhật trạng thái (ACTIVE hoặc REVOKED) trong CSDL.",
        "main_flow": [
            ("1. Mở mục \"Quyền riêng tư & Chia sẻ liên viện\" trong phần Cài đặt.", 
             "2. Gửi request GET /api/v1/integration/patients/:id/consents. Hệ thống hiển thị danh sách các bệnh viện đối tác đang được cấp phép."),
            ("3. Chọn một bệnh viện và gạt công tắc chuyển đổi cấp quyền.", 
             "4. Nhấn nút \"Xác nhận thay đổi\". Gửi request PATCH /api/v1/integration/consents/:id/grant (hoặc /revoke)."),
            ("", 
             "5. Hệ thống cập nhật bảng PatientConsent và ghi log kiểm toán; các cổng truy xuất liên viện từ bệnh viện bị thu hồi sẽ lập tức bị chặn đứng.")
        ],
        "alt_flow": [
            ("4.1. Kết nối mạng bị gián đoạn trong khi lưu thiết lập.", 
             "5.1. Hệ thống giữ nguyên trạng thái cũ và yêu cầu người dùng thử lại.")
        ]
    },
    {
        "name": "UC-INTEG-03: Tra cứu hồ sơ liên viện (Interoperability Portal)",
        "description": "Bác sĩ tại bệnh viện khám bệnh tra cứu tiền sử khám chữa bệnh của người bệnh tại các bệnh viện khác thông qua cổng liên thông có bảo vệ bằng mã PIN an toàn.",
        "primary_actor": "Bác sĩ (Doctor)",
        "secondary_actor": "Không có",
        "pre_condition": "Người bệnh đã cấp quyền Consent cho bệnh viện hiện tại; bác sĩ có tài khoản được cấp quyền tra cứu liên viện.",
        "post_condition": "Dữ liệu tóm tắt bệnh án từ các bệnh viện đối tác được kết xuất hiển thị an toàn.",
        "main_flow": [
            ("1. Bác sĩ mở cổng Tra cứu liên viện (Interoperability Portal).", 
             "2. Nhập số CCCD/BHYT của người bệnh và mã PIN bảo mật do người bệnh cung cấp trực tiếp."),
            ("3. Nhấn nút \"Tra cứu dữ liệu liên viện\".", 
             "4. Gửi request POST /api/v1/interoperability/portal/lookup kèm cccd và securityPin."),
            ("", 
             "5. Hệ thống kiểm tra mã PIN và trạng thái Consent: nếu hợp lệ, truy vấn dữ liệu khám liên thông từ các cơ sở đối tác và trả về dòng thời gian bệnh sử."),
            ("", 
             "6. Ghi nhận nhật ký truy cập vào bảng SharedAccessLog (Bác sĩ nào truy cập, bệnh nhân nào, vào thời điểm nào).")
        ],
        "alt_flow": [
            ("4.1. Bác sĩ nhập sai mã PIN bảo mật của người bệnh.", 
             "5.1. Hệ thống từ chối truy xuất và báo lỗi: \"Mã PIN bảo mật không chính xác. Vui lòng hỏi lại người bệnh\".")
        ]
    },
    {
        "name": "UC-INTEG-04: Trích xuất hồ sơ chuẩn Bộ Y tế Quyết định 4750 (XML/JSON)",
        "description": "Trích xuất dữ liệu tóm tắt quá trình khám chữa bệnh của một ca khám theo đúng cấu trúc chuẩn XML/JSON quy định tại Quyết định 4750/QĐ-BYT của Bộ Y tế.",
        "primary_actor": "Quản trị viên hệ thống, Hệ thống HIS đối tác",
        "secondary_actor": "Không có",
        "pre_condition": "Ca khám đã hoàn tất và có mã ca khám (encounterCode) hợp lệ.",
        "post_condition": "Tệp dữ liệu định dạng XML hoặc JSON chuẩn QĐ 4750 được sinh ra và trả về.",
        "main_flow": [
            ("1. Gửi request GET /api/v1/integration/byt-4750/extract/:encounterCode/xml lên server.", 
             "2. Hệ thống đọc dữ liệu ca khám từ bảng Encounter, Diagnosis, Observation, Prescription."),
            ("", 
             "3. Ánh xạ các trường dữ liệu vào lược đồ bảng XML chuẩn của Bộ Y tế (Bảng 1: Chỉ tiêu chung, Bảng 2: Thuốc, Bảng 3: Dịch vụ kỹ thuật)."),
            ("", 
             "4. Trả về nội dung XML với header Content-Type: application/xml phục vụ liên thông cổng giám định BHYT.")
        ],
        "alt_flow": [
            ("1.1. Mã ca khám không tồn tại trong hệ thống.", 
             "2.1. Hệ thống trả về lỗi 404 Not Found: \"Không tìm thấy hồ sơ ca khám tương ứng\".")
        ]
    },
    {
        "name": "UC-INTEG-05: Giám sát luồng liên thông dữ liệu y tế trực tiếp",
        "description": "Super Admin theo dõi ma trận kết nối giữa các bệnh viện, biểu đồ lưu lượng dữ liệu trao đổi thời gian thực và các cảnh báo nghẽn cổng kết nối.",
        "primary_actor": "Quản trị viên hệ thống (Super Admin)",
        "secondary_actor": "Không có",
        "pre_condition": "Đã đăng nhập vai trò ADMIN.",
        "post_condition": "Biểu đồ traffic liên viện và nhật ký sự kiện trực tiếp hiển thị thời gian thực.",
        "main_flow": [
            ("1. Mở trang \"Giám sát liên thông (Interoperability Monitor)\" trên cổng admin.", 
             "2. Gửi request GET /api/v1/admin/interoperability/overview và /traffic-chart."),
            ("", 
             "3. Hệ thống trả về ma trận kết nối Hospital Matrix và lưu lượng request trao đổi giữa các bệnh viện trong 24 giờ qua."),
            ("4. Mở tab \"Live Audit Stream\".", 
             "5. Kết nối Server-Sent Events (SSE) hoặc polling để hiển thị trực tiếp các yêu cầu tra cứu liên viện đang diễn ra trong hệ thống.")
        ],
        "alt_flow": [
            ("2.1. Một cổng kết nối HIS bị gián đoạn mạng.", 
             "3.1. Hệ thống hiển thị biểu tượng cảnh báo màu đỏ tại nút mạng của bệnh viện đó và kích hoạt ghi log sự cố.")
        ]
    },

    # ── PHÂN HỆ 13: THÔNG BÁO & XỬ LÝ NỀN
    {
        "name": "UC-NOTI-01: Đăng ký thiết bị nhận thông báo đẩy (FCM)",
        "description": "Ứng dụng di động đăng ký mã thiết bị (Firebase Cloud Messaging Token) lên máy chủ khi người dùng đăng nhập để sẵn sàng nhận push notification.",
        "primary_actor": "Bệnh nhân, Bác sĩ",
        "secondary_actor": "Dịch vụ Firebase Cloud Messaging",
        "pre_condition": "Người dùng đăng nhập thành công trên ứng dụng di động Android.",
        "post_condition": "FCM Device Token được lưu hoặc cập nhật vào bảng UserDevice trong CSDL.",
        "main_flow": [
            ("1. Sau khi đăng nhập, ứng dụng Mobile lấy FCM Registration Token từ Firebase SDK.", 
             "2. Gửi request POST /api/v1/notifications/register-device kèm token, deviceType = 'ANDROID'."),
            ("", 
             "3. Hệ thống kiểm tra: nếu token đã tồn tại thì cập nhật thời gian hoạt động; nếu chưa có thì tạo mới bản ghi UserDevice liên kết với userId hiện tại."),
            ("", 
             "4. Phản hồi đăng ký thiết bị thành công.")
        ],
        "alt_flow": [
            ("1.1. Thiết bị không có dịch vụ Google Play Services hoặc bị lỗi kết nối Firebase.", 
             "2.1. Ứng dụng ghi log cục bộ và bỏ qua bước đăng ký FCM mà không làm gián đoạn luồng sử dụng của người dùng.")
        ]
    },
    {
        "name": "UC-NOTI-02: Xem danh sách thông báo hệ thống",
        "description": "Người dùng xem danh sách các thông báo cá nhân: xác nhận lịch hẹn, nhắc giờ khám trước 24h, thanh toán thành công, tin nhắn tư vấn mới.",
        "primary_actor": "Bệnh nhân, Bác sĩ, Quản trị cơ sở, Quản trị hệ thống",
        "secondary_actor": "Không có",
        "pre_condition": "Người dùng đã đăng nhập vào hệ thống.",
        "post_condition": "Danh sách thông báo và số lượng thông báo chưa đọc được hiển thị đầy đủ.",
        "main_flow": [
            ("1. Nhấn vào biểu tượng Quả chuông trên thanh tiêu đề ứng dụng.", 
             "2. Gửi request GET /api/v1/notifications và GET /api/v1/notifications/unread-count."),
            ("", 
             "3. Hệ thống truy vấn bảng Notification lọc theo userId của người dùng, sắp xếp theo thời gian mới nhất lên đầu."),
            ("4. Hiển thị danh sách thông báo kèm phân loại biểu tượng (Lịch hẹn, Thanh toán, Hệ thống, Tư vấn).", 
             "5. Nhấn vào một thông báo cụ thể để điều hướng trực tiếp đến màn hình chi tiết liên quan.")
        ],
        "alt_flow": [
            ("2.1. Người dùng chưa có bất kỳ thông báo nào.", 
             "3.1. Giao diện hiển thị: \"Bạn chưa có thông báo mới nào\".")
        ]
    },
    {
        "name": "UC-NOTI-03: Đánh dấu thông báo đã đọc / Đọc tất cả",
        "description": "Người dùng đánh dấu một thông báo cụ thể hoặc toàn bộ thông báo là đã đọc để xóa huy hiệu số lượng chưa đọc.",
        "primary_actor": "Bệnh nhân, Bác sĩ, Quản trị cơ sở, Quản trị hệ thống",
        "secondary_actor": "Không có",
        "pre_condition": "Có thông báo ở trạng thái chưa đọc (isRead = false).",
        "post_condition": "Cờ isRead được cập nhật thành true; badge số lượng thông báo chưa đọc trên quả chuông giảm về 0.",
        "main_flow": [
            ("1. Tại màn hình thông báo, người dùng nhấn nút \"Đánh dấu tất cả đã đọc\".", 
             "2. Gửi request PATCH /api/v1/notifications/read-all lên server."),
            ("", 
             "3. Hệ thống cập nhật isRead = true cho toàn bộ thông báo của userId hiện tại trong CSDL."),
            ("", 
             "4. Trả về kết quả thành công và giao diện chuyển toàn bộ thẻ thông báo sang trạng thái đã đọc.")
        ],
        "alt_flow": [
            ("1.1. Người dùng bấm vào một thông báo đơn lẻ.", 
             "2.1. Hệ thống chỉ cập nhật PATCH /api/v1/notifications/:id/read cho duy nhất thông báo đó và giảm badge chưa đọc đi 1.")
        ]
    },
    {
        "name": "UC-NOTI-04: Gửi email thông báo tự động qua giao thức SMTP",
        "description": "Hệ thống tự động biên soạn và gửi các bức thư điện tử HTML chuyên nghiệp: vé khám điện tử, xác nhận thanh toán, mã OTP hoặc thông báo đổi lịch khám.",
        "primary_actor": "Dịch vụ Email SMTP (Hệ thống nội bộ)",
        "secondary_actor": "Không có",
        "pre_condition": "Phát sinh sự kiện kích hoạt (đặt lịch, thanh toán, đổi mật khẩu) và tài khoản có địa chỉ email hợp lệ.",
        "post_condition": "Email được truyền tải thành công qua máy chủ SMTP đến hộp thư của người nhận.",
        "main_flow": [
            ("1. Tiến trình nghiệp vụ (đặt lịch, thanh toán) kích hoạt sự kiện gửi email thông qua EmailService.", 
             "2. Hệ thống biên soạn nội dung email bằng mẫu HTML: gắn logo NovaCare, thông tin người bệnh, mã vé điện tử, mã QR tra cứu và hướng dẫn khám bệnh."),
            ("", 
             "3. Sử dụng thư viện Nodemailer gửi thư qua máy chủ SMTP (cổng 587 bảo mật TLS) đến địa chỉ email của người nhận."),
            ("", 
             "4. Ghi log kết quả gửi thư (thành công / thất bại) vào nhật ký hệ thống.")
        ],
        "alt_flow": [
            ("3.1. Địa chỉ email người nhận không tồn tại hoặc máy chủ SMTP gặp sự cố kết nối.", 
             "4.1. Hệ thống bắt lỗi ngoại lệ, ghi log lỗi gửi thư và đưa tác vụ vào hàng đợi thử lại (Retry Queue) để gửi lại sau mà không làm treo luồng chính của người dùng.")
        ]
    }
]
