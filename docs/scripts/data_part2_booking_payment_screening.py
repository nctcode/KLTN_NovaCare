# -*- coding: utf-8 -*-

USECASES_PART2 = [
    # ── PHÂN HỆ 4: ĐẶT LỊCH KHÁM BỆNH & QUẢN LÝ LỊCH HẸN
    {
        "name": "UC-BOOK-01: Đặt lịch khám theo bác sĩ",
        "description": "Người bệnh thực hiện quy trình chọn bác sĩ, nơi làm việc, ngày khám, khung giờ khám mong muốn, chọn hồ sơ người đi khám và xác nhận khởi tạo lịch hẹn.",
        "primary_actor": "Bệnh nhân (Patient)",
        "secondary_actor": "Dịch vụ Email SMTP",
        "pre_condition": "Bác sĩ có suất khám (slot) khả dụng; người bệnh đã đăng nhập và có ít nhất một hồ sơ người đi khám.",
        "post_condition": "Bản ghi Appointment mới được tạo với trạng thái AWAITING_PAYMENT (nếu trả trước) hoặc CONFIRMED (nếu trả sau tại viện); suất khám chuyển sang trạng thái BOOKED/HELD; email xác nhận được gửi.",
        "main_flow": [
            ("1. Tại màn hình thông tin bác sĩ, người bệnh chọn nơi làm việc (bệnh viện/phòng khám), ngày khám và khung giờ khám còn trống (suất khám).", 
             "2. Hệ thống kiểm tra tính khả dụng của suất khám trong bảng AppointmentSlot (status == AVAILABLE)."),
            ("3. Chọn hồ sơ người đi khám từ danh sách hồ sơ cá nhân và nhập lý do khám bệnh hoặc triệu chứng sơ bộ.", 
             "4. Hiển thị màn hình xem lại phiếu thông tin đặt khám: Tên bác sĩ, chuyên khoa, cơ sở y tế, thời gian khám, thông tin bệnh nhân, giá dịch vụ và chính sách hủy lịch."),
            ("5. Nhấn nút \"Xác nhận đặt khám\".", 
             "6. Mở transaction CSDL: Kiểm tra lại tính cạnh tranh của suất khám (chống trùng lịch). Chuyển trạng thái Slot sang HELD/BOOKED. Tạo bản ghi Appointment với mã phiếu khám dạng APPT-XXXXXX, ghi log trạng thái ban đầu."),
            ("", 
             "7. Hệ thống tự động kích hoạt tiến trình gửi email xác nhận phiếu đặt khám đến hộp thư của bệnh nhân và chuyển hướng người bệnh sang bước thanh toán hoặc chi tiết phiếu khám.")
        ],
        "alt_flow": [
            ("3.1. Người bệnh chưa tạo bất kỳ hồ sơ người đi khám nào.", 
             "4.1. Hệ thống tự động mở hộp thoại yêu cầu tạo hồ sơ mới (chuyển sang luồng UC-PROF-01) trước khi tiếp tục đặt lịch."),
            ("5.1. Suất khám vừa bị một người bệnh khác đặt trước trong cùng tích tắc (concurrency conflict).", 
             "6.1. Hệ thống rollback transaction, trả về mã lỗi 409 Conflict kèm thông báo: \"Rất tiếc, khung giờ này vừa có người đặt trước. Vui lòng chọn một khung giờ khác\" và tải lại danh sách suất khám trống.")
        ]
    },
    {
        "name": "UC-BOOK-02: Đặt lịch khám theo cơ sở / Chuyên khoa",
        "description": "Người bệnh đặt lịch khám tại một cơ sở y tế cụ thể: chọn chuyên khoa khám -> chọn phòng khám/dịch vụ -> chọn suất khám -> chọn hồ sơ người đi khám và xác nhận phiếu khám.",
        "primary_actor": "Bệnh nhân (Patient)",
        "secondary_actor": "Không có",
        "pre_condition": "Cơ sở y tế có mở phòng khám dịch vụ và còn suất tiếp nhận người bệnh.",
        "post_condition": "Phiếu hẹn khám bệnh tại cơ sở được khởi tạo thành công.",
        "main_flow": [
            ("1. Chọn chức năng \"Đặt khám theo cơ sở\" và chọn bệnh viện/phòng khám mong muốn.", 
             "2. Gửi request lấy danh sách các chuyên khoa và phòng khám dịch vụ đang hoạt động tại cơ sở."),
            ("3. Chọn chuyên khoa (vd: Nội tổng quát, Nhi, Tai Mũi Họng) và chọn ngày khám.", 
             "4. Hệ thống truy vấn các phòng khám (ClinicRooms) và phiên khám dịch vụ còn chỗ trống."),
            ("5. Chọn khung giờ khám, chọn hồ sơ bệnh nhân và xác nhận thông tin phiếu khám.", 
             "6. Hệ thống tạo lịch hẹn gắn liền với cơ sở y tế và phòng khám dịch vụ chỉ định, phản hồi mã phiếu khám thành công.")
        ],
        "alt_flow": [
            ("3.1. Chuyên khoa được chọn tạm thời không có phòng khám nào hoạt động vào ngày đã chọn.", 
             "4.1. Hệ thống thông báo: \"Chuyên khoa này hiện không có lịch tiếp nhận vào ngày bạn chọn. Vui lòng chọn ngày khám khác\".")
        ]
    },
    {
        "name": "UC-BOOK-03: Đặt lịch khám từ gợi ý sàng lọc tiền khám AI",
        "description": "Tự động kế thừa kết luận chuyên khoa gợi ý và bản tóm tắt triệu chứng từ phiên sàng lọc AI để chuyển tiếp vào quy trình đặt lịch khám phù hợp.",
        "primary_actor": "Bệnh nhân (Patient)",
        "secondary_actor": "Dịch vụ AI (OpenAI API)",
        "pre_condition": "Người bệnh vừa hoàn thành phiên sàng lọc tiền khám AI và nhận được kết quả định hướng chuyên khoa.",
        "post_condition": "Lịch hẹn mới được tạo lập tự động liên kết với mã phiên sàng lọc (preExamSessionId) trong CSDL.",
        "main_flow": [
            ("1. Tại màn hình báo cáo kết quả sàng lọc AI, người bệnh nhấn nút \"Đặt lịch khám theo gợi ý này\".", 
             "2. Hệ thống đọc mã chuyên khoa (specialtyId) được gợi ý từ phiên sàng lọc và tự động lọc danh sách các bác sĩ và bệnh viện có thế mạnh về chuyên khoa này."),
            ("3. Chọn một bác sĩ hoặc bệnh viện trong danh sách đề xuất.", 
             "4. Chọn ngày và khung giờ khám mong muốn."),
            ("5. Nhấn \"Tiếp tục đặt lịch\".", 
             "6. Gửi request POST /api/v1/appointments/from-pre-exam. Hệ thống tự động điền lý do khám là phần trích yếu bệnh cảnh do AI tóm tắt, tạo lịch hẹn gắn khóa ngoại preExamSessionId và điều hướng sang bước xác nhận phiếu khám.")
        ],
        "alt_flow": [
            ("2.1. Không tìm thấy bác sĩ hoặc cơ sở nào thuộc chuyên khoa gợi ý còn lịch trống trong 7 ngày tới.", 
             "3.1. Hệ thống thông báo và hiển thị gợi ý danh mục các chuyên khoa gần tương đương hoặc cho phép người bệnh tìm kiếm theo địa bàn rộng hơn.")
        ]
    },
    {
        "name": "UC-BOOK-04: Xem danh sách lịch hẹn của tôi",
        "description": "Người bệnh tra cứu danh sách các lịch hẹn khám sắp tới (Upcoming) và lịch sử các ca khám đã hoàn thành hoặc đã hủy (History).",
        "primary_actor": "Bệnh nhân (Patient)",
        "secondary_actor": "Không có",
        "pre_condition": "Người bệnh đã đăng nhập vào hệ thống.",
        "post_condition": "Toàn bộ danh sách lịch hẹn được hiển thị phân loại theo trạng thái rõ ràng.",
        "main_flow": [
            ("1. Chọn mục \"Lịch khám\" trên thanh điều hướng chính.", 
             "2. Gửi đồng thời các request GET /api/v1/appointments/upcoming và GET /api/v1/appointments/history."),
            ("", 
             "3. Hệ thống truy vấn CSDL theo userId hiện tại, nạp kèm thông tin chi tiết của Doctor, Hospital, Specialty và PatientProfile liên quan."),
            ("4. Chuyển đổi qua lại giữa tab \"Sắp tới\" và \"Lịch sử\".", 
             "5. Hiển thị danh sách các thẻ phiếu khám với trạng thái trực quan: Chờ thanh toán (vàng), Đã xác nhận (xanh dương), Đã thanh toán (xanh lá), Hoàn tất (xám), Đã hủy (đỏ).")
        ],
        "alt_flow": [
            ("2.1. Người bệnh chưa từng đặt lịch khám nào.", 
             "3.1. Giao diện hiển thị trạng thái danh sách trống kèm nút bấm: \"Đặt lịch khám ngay\".")
        ]
    },
    {
        "name": "UC-BOOK-05: Xem chi tiết lịch hẹn & Dòng thời gian tiến trình (Timeline)",
        "description": "Xem chi tiết phiếu khám điện tử: mã phiếu khám, số thứ tự khám, phòng khám, hướng dẫn chuẩn bị trước khi khám và nhật ký dòng thời gian thay đổi trạng thái.",
        "primary_actor": "Bệnh nhân (Patient)",
        "secondary_actor": "Không có",
        "pre_condition": "Lịch hẹn tồn tại và thuộc quyền quản lý của tài khoản người bệnh.",
        "post_condition": "Thông tin phiếu khám và nhật ký sự kiện của ca khám được hiển thị.",
        "main_flow": [
            ("1. Bấm vào một phiếu khám cụ thể trong danh sách lịch hẹn.", 
             "2. Gửi request GET /api/v1/appointments/:id và GET /api/v1/appointments/:id/timeline."),
            ("", 
             "3. Hệ thống trả về chi tiết phiếu khám: thông tin người khám, bác sĩ phụ trách, phòng khám số, ngày giờ, số thứ tự tiếp đón, mã vạch/mã QR check-in và dòng thời gian các sự kiện (Tạo lịch -> Thanh toán -> Tiếp đón -> Đang khám -> Hoàn tất)."),
            ("4. Người bệnh xem thông tin chuẩn bị khám và các hành động khả dụng (Đổi lịch, Hủy lịch, Thanh toán, Đánh giá, Vào phòng tư vấn từ xa).", 
             "5. Hiển thị các nút chức năng tương ứng theo đúng trạng thái hiện tại của lịch hẹn.")
        ],
        "alt_flow": [
            ("1.1. Lịch hẹn không tồn tại hoặc đã bị xóa khỏi hệ thống.", 
             "2.1. Hệ thống trả về mã lỗi 404 Not Found kèm thông báo: \"Không tìm thấy phiếu khám yêu cầu\".")
        ]
    },
    {
        "name": "UC-BOOK-06: Hủy lịch hẹn khám",
        "description": "Người bệnh chủ động hủy bỏ lịch hẹn khám đã đặt khi có kế hoạch cá nhân thay đổi trước thời hạn quy định của bệnh viện.",
        "primary_actor": "Bệnh nhân (Patient)",
        "secondary_actor": "Không có",
        "pre_condition": "Lịch hẹn đang ở trạng thái PENDING, AWAITING_PAYMENT hoặc CONFIRMED; thời điểm hủy trước giờ khám tối thiểu theo chính sách viện (mặc định 24 giờ).",
        "post_condition": "Trạng thái lịch hẹn chuyển sang CANCELLED, suất khám được hoàn trả lại thành AVAILABLE, lịch sử timeline ghi nhận sự kiện hủy.",
        "main_flow": [
            ("1. Tại màn hình chi tiết lịch hẹn, người bệnh chọn chức năng \"Hủy lịch khám\".", 
             "2. Hiển thị hộp thoại xác nhận hủy lịch kèm danh sách lý do hủy (Thay đổi kế hoạch, Bệnh thuyên giảm, Đặt nhầm thông tin, Lý do khác)."),
            ("3. Chọn lý do hủy và nhấn nút \"Xác nhận hủy lịch\".", 
             "4. Gửi request PATCH /api/v1/appointments/:id/cancel kèm lý do hủy."),
            ("", 
             "5. Hệ thống kiểm tra điều kiện hủy: kiểm tra thời hạn hủy so với giờ khám thực tế. Mở transaction cập nhật trạng thái Appointment thành CANCELLED, chuyển AppointmentSlot trở lại trạng thái AVAILABLE và ghi log timeline."),
            ("", 
             "6. Phản hồi thông báo hủy lịch thành công. Nếu lịch đã thanh toán trực tuyến, hệ thống tự động gắn cờ yêu cầu hoàn tiền (Refund Pending) cho quản trị viên đối soát.")
        ],
        "alt_flow": [
            ("3.1. Thời điểm hủy vi phạm chính sách của bệnh viện (ví dụ: hủy trước giờ khám dưới 2 giờ).", 
             "4.1. Hệ thống từ chối hủy tự động và thông báo: \"Đã quá thời hạn hủy lịch trực tuyến theo quy định của cơ sở y tế. Vui lòng liên hệ trực tiếp hotline của bệnh viện để được hỗ trợ giải quyết\".")
        ]
    },
    {
        "name": "UC-BOOK-07: Đổi lịch khám (Reschedule)",
        "description": "Người bệnh thay đổi ngày khám hoặc khung giờ khám khác của cùng bác sĩ/phòng khám mà không cần hủy và tạo lại từ đầu.",
        "primary_actor": "Bệnh nhân (Patient)",
        "secondary_actor": "Không có",
        "pre_condition": "Lịch hẹn hợp lệ và còn trong thời hạn được phép đổi lịch; bác sĩ/cơ sở còn suất khám trống khác.",
        "post_condition": "Suất khám cũ được giải phóng về trạng thái AVAILABLE; suất khám mới được gán cho phiếu hẹn; cập nhật lại ngày giờ khám mới.",
        "main_flow": [
            ("1. Chọn chức năng \"Đổi lịch khám\" tại màn hình chi tiết phiếu hẹn.", 
             "2. Hiển thị giao diện chọn ngày khám và các khung giờ khả dụng mới của bác sĩ."),
            ("3. Chọn ngày khám mới và chọn một khung giờ khám còn trống.", 
             "4. Nhấn nút \"Xác nhận đổi lịch\". Gửi request PATCH /api/v1/appointments/:id/reschedule kèm newSlotId và newDate."),
            ("", 
             "5. Mở transaction: Giải phóng slot cũ về AVAILABLE, chuyển slot mới sang BOOKED, cập nhật appointmentDate và slotId trong bản ghi Appointment, ghi nhật ký timeline đổi lịch."),
            ("", 
             "6. Phản hồi thông báo đổi lịch thành công và hiển thị lại thông tin phiếu khám với ngày giờ mới.")
        ],
        "alt_flow": [
            ("3.1. Khung giờ mới vừa được chọn bị người khác giữ chỗ trong lúc thao tác.", 
             "4.1. Hệ thống báo lỗi xung đột suất khám và yêu cầu người bệnh chọn một khung giờ khác.")
        ]
    },
    {
        "name": "UC-BOOK-08: Tự động quét & Hủy lịch quá hạn thanh toán (Expire Pending Appointments)",
        "description": "Tiến trình nền (Cron Job / Worker) tự động rà soát định kỳ và chuyển trạng thái các lịch hẹn chưa thanh toán quá 15 phút sang EXPIRED để giải phóng suất khám.",
        "primary_actor": "Tác vụ nền hệ thống (BullMQ / Scheduler)",
        "secondary_actor": "Không có",
        "pre_condition": "Tác vụ nền chạy định kỳ mỗi 5 phút.",
        "post_condition": "Các lịch hẹn AWAITING_PAYMENT quá thời hạn giữ chỗ chuyển sang EXPIRED; các suất khám liên quan được nhả lại kho suất trống.",
        "main_flow": [
            ("1. Trình lập lịch Cron Job kích hoạt tác vụ định kỳ gọi nội bộ /api/v1/appointments/expire-pending.", 
             "2. Hệ thống quét cơ sở dữ liệu tìm các bản ghi Appointment thỏa mãn: status == 'AWAITING_PAYMENT' và thời điểm tạo createdAt nhỏ hơn thời điểm hiện tại trừ đi 15 phút."),
            ("", 
             "3. Với mỗi bản ghi tìm thấy: chuyển status thành EXPIRED, cập nhật AppointmentSlot tương ứng về AVAILABLE và ghi log sự kiện hết hạn vào bảng timeline."),
            ("", 
             "4. Xuất log tổng kết số lượng lịch hẹn đã giải phóng trong đợt quét.")
        ],
        "alt_flow": [
            ("2.1. Không có lịch hẹn nào bị quá hạn thanh toán trong đợt quét.", 
             "3.1. Tác vụ ghi nhận 0 bản ghi xử lý và kết thúc lượt quét bình thường.")
        ]
    },

    # ── PHÂN HỆ 5: THANH TOÁN TRỰC TUYẾN
    {
        "name": "UC-PAY-01: Tạo giao dịch thanh toán trực tuyến qua VNPay",
        "description": "Khởi tạo yêu cầu thanh toán tiền khám qua cổng trung gian thanh toán VNPay, sinh URL giao dịch bảo mật kèm chữ ký số HMAC-SHA512.",
        "primary_actor": "Bệnh nhân (Patient)",
        "secondary_actor": "Cổng thanh toán VNPay",
        "pre_condition": "Lịch hẹn đang ở trạng thái AWAITING_PAYMENT và chưa quá thời hạn 15 phút.",
        "post_condition": "Bản ghi PaymentTransaction được tạo ở trạng thái PENDING; Client nhận được paymentUrl hợp lệ để chuyển hướng sang VNPay.",
        "main_flow": [
            ("1. Tại phiếu khám chờ thanh toán, người bệnh nhấn nút \"Thanh toán ngay qua VNPay\".", 
             "2. Gửi request POST /api/v1/payments/create kèm appointmentId và mã ngân hàng (tùy chọn)."),
            ("", 
             "3. Hệ thống kiểm tra số tiền cần thanh toán từ lịch hẹn, khởi tạo bản ghi PaymentTransaction với mã tham chiếu duy nhất txnRef (ví dụ: VNP_1730000000)."),
            ("", 
             "4. Tạo chuỗi tham số thanh toán VNPay: vnp_Version, vnp_Command, vnp_TmnCode, vnp_Amount, vnp_CreateDate, vnp_CurrCode, vnp_IpAddr, vnp_OrderInfo, vnp_ReturnUrl, vnp_TxnRef."),
            ("", 
             "5. Sinh chữ ký số bảo mật vnp_SecureHash bằng thuật toán HMAC-SHA512 với khóa bí mật VNP_HASH_SECRET. Nối chữ ký vào URL và trả về paymentUrl cho Client."),
            ("6. Ứng dụng Client mở cổng VNPay (qua WebView hoặc trình duyệt ngoài).", 
             "7. Cổng VNPay hiển thị các phương thức thanh toán: Ứng dụng ngân hàng VNPAY-QR, Thẻ ATM nội địa, Thẻ quốc tế Visa/Mastercard.")
        ],
        "alt_flow": [
            ("1.1. Phiếu khám đã hết hạn thời gian thanh toán (quá 15 phút).", 
             "2.1. Hệ thống từ chối khởi tạo giao dịch, trả về lỗi 400 Bad Request kèm thông báo: \"Phiếu hẹn đã hết hạn thanh toán. Vui lòng thực hiện đặt lại lịch khám mới\".")
        ]
    },
    {
        "name": "UC-PAY-02: Xử lý phản hồi thanh toán (IPN Webhook)",
        "description": "Máy chủ VNPay tự động gọi ngầm đến webhook IPN của hệ thống để đồng bộ kết quả giao dịch thanh toán thực tế, đảm bảo an toàn toàn vẹn dữ liệu.",
        "primary_actor": "Cổng thanh toán VNPay (Hệ thống ngoài)",
        "secondary_actor": "Dịch vụ Email SMTP",
        "pre_condition": "Người bệnh đã hoàn tất thao tác xác thực thanh toán tại ngân hàng trên cổng VNPay.",
        "post_condition": "PaymentTransaction chuyển trạng thái PAID; Appointment chuyển sang CONFIRMED/PAID; email xác nhận thanh toán được gửi tự động.",
        "main_flow": [
            ("1. Máy chủ VNPay gửi yêu cầu HTTP (GET hoặc POST) đến endpoint /api/v1/payments/vnpay-ipn chứa các tham số giao dịch và chữ ký vnp_SecureHash.", 
             "2. Hệ thống NovaCare tách riêng chữ ký, sắp xếp các tham số theo thứ tự bảng chữ cái và tính toán lại mã hash HMAC-SHA512 bằng secret key nội bộ."),
            ("", 
             "3. Đối soát chữ ký: nếu chữ ký khớp, hệ thống tìm bản ghi PaymentTransaction theo mã vnp_TxnRef."),
            ("", 
             "4. Kiểm tra mã phản hồi vnp_ResponseCode: nếu bằng '00' (thành công), cập nhật PaymentTransaction sang PAID, cập nhật Appointment sang CONFIRMED/PAID và cập nhật AppointmentSlot sang BOOKED."),
            ("", 
             "5. Kích hoạt gửi email thông báo xác nhận thanh toán thành công kèm biên lai điện tử và phản hồi cho VNPay mã: { \"RspCode\": \"00\", \"Message\": \"Confirm Success\" }.")
        ],
        "alt_flow": [
            ("2.1. Chữ ký số nhận được không khớp với chữ ký hệ thống tự tính toán (dấu hiệu dữ liệu bị can thiệp).", 
             "3.1. Hệ thống từ chối xử lý và phản hồi ngay cho VNPay mã lỗi: { \"RspCode\": \"97\", \"Message\": \"Invalid Checksum\" }."),
            ("4.1. Mã phản hồi vnp_ResponseCode khác '00' (người bệnh hủy giao dịch hoặc số dư không đủ).", 
             "5.1. Hệ thống cập nhật PaymentTransaction sang FAILED, giữ nguyên lịch hẹn ở trạng thái chờ thanh toán nếu còn thời hạn và phản hồi { \"RspCode\": \"00\", \"Message\": \"Confirm Success\" }.")
        ]
    },
    {
        "name": "UC-PAY-03: Xem kết quả & Trạng thái thanh toán",
        "description": "Người bệnh được điều hướng trở lại ứng dụng sau khi thanh toán để xem kết quả biên lai giao dịch điện tử.",
        "primary_actor": "Bệnh nhân (Patient)",
        "secondary_actor": "Không có",
        "pre_condition": "Giao dịch thanh toán trên cổng VNPay đã kết thúc và trình duyệt chuyển hướng về trang Return URL.",
        "post_condition": "Thông tin trạng thái thanh toán được hiển thị minh bạch cho người bệnh.",
        "main_flow": [
            ("1. Cổng VNPay chuyển hướng người dùng về trang /thanh-toan/return kèm các query parameters kết quả.", 
             "2. Client đọc tham số và gửi request GET /api/v1/payments/status/:appointmentId để kiểm tra trạng thái chốt từ CSDL."),
            ("", 
             "3. Hệ thống trả về trạng thái giao dịch: Số tiền thanh toán, mã đơn hàng, mã giao dịch ngân hàng, ngân hàng thanh toán và thời gian giao dịch."),
            ("4. Người bệnh xem biên lai và nhấn nút \"Xem phiếu khám\".", 
             "5. Điều hướng người bệnh vào màn hình chi tiết phiếu khám đã được xác nhận.")
        ],
        "alt_flow": [
            ("2.1. Giao dịch thanh toán bị thất bại do người bệnh hủy bỏ.", 
             "3.1. Giao diện hiển thị biểu tượng thông báo thất bại, nêu rõ nguyên nhân và cung cấp nút \"Thanh toán lại\".")
        ]
    },
    {
        "name": "UC-PAY-04: Giả lập thanh toán môi trường thử nghiệm (Simulate Payment)",
        "description": "Chức năng cho phép nhà phát triển hoặc người kiểm thử giả lập thanh toán thành công tức thì trong môi trường Sandbox mà không cần tài khoản ngân hàng thật.",
        "primary_actor": "Bệnh nhân, Nhà phát triển (Developer)",
        "secondary_actor": "Không có",
        "pre_condition": "Hệ thống đang chạy ở môi trường development/staging, lịch hẹn đang ở trạng thái AWAITING_PAYMENT.",
        "post_condition": "Phiếu khám được cập nhật trạng thái PAID ngay lập tức phục vụ kiểm thử.",
        "main_flow": [
            ("1. Tại màn hình thanh toán thử nghiệm, người dùng nhấn nút \"[Demo] Giả lập thanh toán thành công\".", 
             "2. Gửi request POST /api/v1/payments/simulate-success kèm appointmentId."),
            ("", 
             "3. Hệ thống kiểm tra môi trường: nếu NODE_ENV !== 'production', kích hoạt cập nhật trực tiếp PaymentTransaction sang PAID và Appointment sang CONFIRMED."),
            ("", 
             "4. Trả về kết quả thành công và giao diện tự động chuyển trạng thái hoàn tất.")
        ],
        "alt_flow": [
            ("2.1. Chức năng bị gọi trên môi trường Production.", 
             "3.1. Hệ thống chặn đứng yêu cầu và trả về lỗi 403 Forbidden: \"Chức năng này bị vô hiệu hóa trên môi trường thực tế\".")
        ]
    },

    # ── PHÂN HỆ 6: SÀNG LỌC SỨC KHỎE TIỀN KHÁM BẰNG AI (AI PRE-EXAM V2)
    {
        "name": "UC-AI-01: Khởi tạo phiên sàng lọc tiền khám AI",
        "description": "Người bệnh bắt đầu một phiên khảo sát sức khỏe tiền khám ứng dụng AI v2, tải danh mục câu hỏi chuẩn và mô hình cơ thể tương tác.",
        "primary_actor": "Bệnh nhân (Patient)",
        "secondary_actor": "Không có",
        "pre_condition": "Người bệnh đã đăng nhập vào hệ thống.",
        "post_condition": "Bản ghi PreExamSession được khởi tạo với trạng thái IN_PROGRESS; Client nhận sessionId để theo dõi tiến trình.",
        "main_flow": [
            ("1. Chọn chức năng \"Sàng lọc tiền khám AI\" trên ứng dụng di động.", 
             "2. Gửi request POST /api/v1/pre-exam-v2/start lên server."),
            ("", 
             "3. Hệ thống tạo bản ghi PreExamSession mới trong CSDL, nạp danh mục các vùng cơ thể (Body Parts) và danh mục triệu chứng phổ biến từ file cấu hình y tế."),
            ("", 
             "4. Trả về thông tin sessionId và chuyển người bệnh sang Bước 1: Khai báo triệu chứng và vùng cơ thể.")
        ],
        "alt_flow": [
            ("1.1. Người bệnh đang có một phiên sàng lọc dở dang chưa hoàn tất.", 
             "2.1. Hệ thống hiển thị hộp thoại: \"Bạn đang có một phiên sàng lọc chưa hoàn thành. Bạn có muốn tiếp tục hay bắt đầu phiên mới?\" để người dùng lựa chọn.")
        ]
    },
    {
        "name": "UC-AI-02: Khai báo triệu chứng & Vị trí cơ thể",
        "description": "Người bệnh tương tác với sơ đồ cơ thể để chọn vị trí khó chịu, nhập mô tả triệu chứng khởi phát, thời gian kéo dài và mức độ đau nhức.",
        "primary_actor": "Bệnh nhân (Patient)",
        "secondary_actor": "Không có",
        "pre_condition": "Phiên sàng lọc đang ở trạng thái IN_PROGRESS.",
        "post_condition": "Dữ liệu triệu chứng khởi phát được ghi nhận vào bản ghi phiên sàng lọc trong CSDL.",
        "main_flow": [
            ("1. Chạm chọn vùng cơ thể bị đau hoặc khó chịu trên mô hình cơ thể 2D (ví dụ: Đầu, Ngực, Bụng, Khớp).", 
             "2. Giao diện hiển thị danh sách các triệu chứng gợi ý tương ứng với vùng cơ thể đã chọn."),
            ("3. Chọn các triệu chứng phù hợp, kéo thanh trượt mức độ đau (từ 1 đến 10) và chọn thời gian khởi phát (dưới 3 ngày, 1-2 tuần, trên 1 tháng).", 
             "4. Nhập thêm mô tả chi tiết bằng văn bản tự do nếu cần."),
            ("5. Nhấn nút \"Tiếp tục sang bước thu thập dữ liệu hỗ trợ\".", 
             "6. Gửi request POST /api/v1/pre-exam-v2/:id/symptoms; hệ thống lưu trữ thông tin triệu chứng và mở khóa Bước 2.")
        ],
        "alt_flow": [
            ("5.1. Người bệnh chưa chọn bất kỳ vùng cơ thể hoặc triệu chứng nào.", 
             "6.1. Hệ thống hiển thị cảnh báo: \"Vui lòng chọn ít nhất một vùng cơ thể hoặc mô tả triệu chứng bạn đang gặp phải\".")
        ]
    },
    {
        "name": "UC-AI-03: Tải ảnh tổn thương hỗ trợ sàng lọc AI",
        "description": "Người bệnh chụp hoặc tải lên hình ảnh vị trí tổn thương (nổi mề đay, mụn viêm, vết thương hở, mắt sưng) kèm cam kết đồng ý xử lý AI.",
        "primary_actor": "Bệnh nhân (Patient)",
        "secondary_actor": "Dịch vụ AI (OpenAI Vision)",
        "pre_condition": "Đang ở Bước 2 của phiên sàng lọc; người bệnh đánh dấu đồng ý điều khoản xử lý hình ảnh y tế.",
        "post_condition": "Tệp hình ảnh được tải lên an toàn, lưu vào thư mục máy chủ và gắn khóa ngoại mediaId vào phiên.",
        "main_flow": [
            ("1. Chọn chức năng \"Chụp ảnh tổn thương\" hoặc \"Chọn ảnh từ thư viện\".", 
             "2. Ứng dụng kích hoạt Camera hoặc trình chọn tệp của hệ điều hành."),
            ("3. Chụp ảnh rõ nét vị trí tổn thương và xác nhận tải lên.", 
             "4. Đánh dấu vào ô: \"Tôi đồng ý cho phép hệ thống phân tích hình ảnh này cho mục đích sàng lọc sơ bộ\"."),
            ("5. Nhấn nút \"Tải ảnh lên\".", 
             "6. Gửi request multipart/form-data đến /api/v1/pre-exam-v2/sessions/:id/media. Hệ thống kiểm tra định dạng ảnh (JPEG/PNG), kiểm tra kích thước (< 10MB), lưu tệp và trả về đường dẫn tệp kèm mã mediaId.")
        ],
        "alt_flow": [
            ("4.1. Người bệnh không đánh dấu đồng ý cam kết xử lý ảnh y tế.", 
             "5.1. Nút tải lên bị vô hiệu hóa và hiển thị nhắc nhở bắt buộc phải đồng ý điều khoản bảo mật dữ liệu sức khỏe."),
            ("5.1. Tệp tải lên vượt quá dung lượng 10MB hoặc không đúng định dạng hình ảnh.", 
             "6.1. Hệ thống từ chối tệp và thông báo: \"Dung lượng ảnh vượt quá giới hạn 10MB. Vui lòng chọn ảnh khác có dung lượng nhỏ hơn\".")
        ]
    },
    {
        "name": "UC-AI-04: Nhận diện giọng nói chuyển thành văn bản (Whisper STT)",
        "description": "Người bệnh ghi âm giọng nói mô tả triệu chứng bằng tiếng Việt; hệ thống gửi âm thanh đến Whisper API để chuyển đổi chính xác thành văn bản tự động điền vào ô mô tả.",
        "primary_actor": "Bệnh nhân (Patient)",
        "secondary_actor": "Dịch vụ AI (OpenAI Whisper API)",
        "pre_condition": "Thiết bị có microphone hoạt động và người bệnh đã cấp quyền ghi âm cho ứng dụng.",
        "post_condition": "Đoạn âm thanh được bóc tách chuẩn xác thành chuỗi văn bản tiếng Việt có dấu.",
        "main_flow": [
            ("1. Nhấn giữ hoặc bấm nút \"Ghi âm mô tả triệu chứng\".", 
             "2. Ứng dụng kích hoạt MediaRecorder, ghi lại luồng âm thanh định dạng M4A/AAC."),
            ("3. Người bệnh nói rõ ràng triệu chứng bệnh trạng và nhấn nút \"Dừng ghi âm\".", 
             "4. Gửi tệp âm thanh lên endpoint POST /api/v1/pre-exam-v2/transcribe."),
            ("", 
             "5. Server NovaCare chuyển tiếp tệp âm thanh đến OpenAI Whisper API với tham số ngôn ngữ language='vi'."),
            ("", 
             "6. Nhận chuỗi văn bản phiên âm trả về từ Whisper, hiển thị ngay lên ô nhập liệu mô tả triệu chứng để người bệnh kiểm tra lại.")
        ],
        "alt_flow": [
            ("1.1. Người bệnh từ chối cấp quyền truy cập Microphone trên thiết bị.", 
             "2.1. Ứng dụng hiển thị thông báo hướng dẫn người dùng vào Cài đặt máy để cấp quyền ghi âm trước khi sử dụng tính năng này."),
            ("3.1. Bản ghi âm quá ngắn (dưới 1 giây) hoặc không thu được âm thanh rõ ràng.", 
             "4.1. Hệ thống thông báo: \"Không nhận diện được giọng nói. Vui lòng ghi âm lại to và rõ ràng hơn\".")
        ]
    },
    {
        "name": "UC-AI-05: Đo nhịp tim qua camera điện thoại (PPG)",
        "description": "Người bệnh đặt ngón tay che kín camera sau và đèn flash để thuật toán Photoplethysmography (PPG) phân tích sự biến thiên hấp thụ ánh sáng của mao mạch, ước tính nhịp tim hỗ trợ tiền khám.",
        "primary_actor": "Bệnh nhân (Patient)",
        "secondary_actor": "Không có",
        "pre_condition": "Điện thoại có camera sau và đèn flash LED trợ sáng.",
        "post_condition": "Chỉ số nhịp tim ước tính (BPM) được ghi nhận vào dữ liệu sinh hiệu của phiên sàng lọc.",
        "main_flow": [
            ("1. Chọn chức năng \"Đo nhịp tim qua Camera (PPG)\".", 
             "2. Ứng dụng bật đèn flash và khởi động camera ở chế độ chụp khung hình liên tục."),
            ("3. Người bệnh đặt nhẹ ngón tay trỏ che kín ống kính camera và đèn flash.", 
             "4. Ứng dụng phân tích biến thiên cường độ kênh màu đỏ (Red Channel) của các khung hình video trong khoảng thời gian từ 15 đến 30 giây."),
            ("", 
             "5. Áp dụng bộ lọc tín hiệu thông dải (Bandpass Filter) và thuật toán đếm đỉnh xung (Peak Detection) để tính toán tần số nhịp tim trung bình."),
            ("6. Quá trình đo hoàn tất.", 
             "7. Hiển thị chỉ số nhịp tim (ví dụ: 78 BPM) kèm mức độ tin cậy và tự động gửi kết quả lên server cập nhật vào phiên sàng lọc.")
        ],
        "alt_flow": [
            ("3.1. Ngón tay đặt lệch hoặc lực ấn quá mạnh làm tắc dòng mao mạch (tín hiệu không ổn định).", 
             "4.1. Ứng dụng phát cảnh báo: \"Tín hiệu không ổn định. Vui lòng giữ ngón tay cố định, chạm nhẹ nhàng lên camera và thử lại\".")
        ]
    },
    {
        "name": "UC-AI-06: Trả lời câu hỏi phân nhánh chuyên sâu của AI",
        "description": "Dựa trên triệu chứng ban đầu, mô hình AI sinh các câu hỏi thích ứng (adaptive questions) để phân biệt các chẩn đoán; người bệnh trả lời để thu hẹp phạm vi bệnh.",
        "primary_actor": "Bệnh nhân (Patient)",
        "secondary_actor": "Dịch vụ AI (OpenAI LLM)",
        "pre_condition": "Đã hoàn thành bước khai báo triệu chứng ban đầu.",
        "post_condition": "Các câu trả lời phân nhánh được lưu trữ đầy đủ trong CSDL phiên sàng lọc.",
        "main_flow": [
            ("1. Màn hình hiển thị danh sách 2-4 câu hỏi phân nhánh được sinh tự động bởi AI (ví dụ: \"Cơn đau có lan ra sau lưng không?\", \"Có kèm sốt cao trên 38.5 độ không?\").", 
             "2. Hệ thống tải kèm các lựa chọn trả lời (Có / Không / Không rõ hoặc Trắc nghiệm mức độ)."),
            ("3. Người bệnh đọc kỹ từng câu hỏi và chọn câu trả lời tương ứng với tình trạng thực tế của mình.", 
             "4. Nhấn nút \"Gửi câu trả lời\". Gửi request POST /api/v1/pre-exam-v2/:id/answer."),
            ("", 
             "5. Hệ thống ghi nhận câu trả lời vào bảng CSDL và chuyển tiếp sang bước kết luận phân tích.")
        ],
        "alt_flow": [
            ("3.1. Người bệnh bỏ sót câu hỏi bắt buộc chưa trả lời.", 
             "4.1. Hệ thống đánh dấu câu hỏi chưa hoàn thành và nhắc nhở người bệnh chọn câu trả lời trước khi chuyển bước.")
        ]
    },
    {
        "name": "UC-AI-07: Nhận kết quả định hướng chuyên khoa & Cảnh báo cờ đỏ (Red Flags)",
        "description": "Tổng hợp toàn bộ dữ liệu sàng lọc: phân loại mức độ nguy cơ, kiểm tra các cờ đỏ cấp cứu y tế (Red Flags), khuyến nghị chuyên khoa phù hợp và đưa ra hướng dẫn xử trí tiếp theo.",
        "primary_actor": "Bệnh nhân (Patient)",
        "secondary_actor": "Dịch vụ AI (OpenAI LLM)",
        "pre_condition": "Đã hoàn tất trả lời toàn bộ câu hỏi sàng lọc.",
        "post_condition": "Báo cáo phân tích hiển thị đầy đủ; phiên sàng lọc chuyển sang trạng thái COMPLETED; cung cấp nút chuyển nhanh sang đặt lịch.",
        "main_flow": [
            ("1. Nhấn nút \"Xem kết quả phân tích\". Gửi request POST /api/v1/pre-exam-v2/:id/complete.", 
             "2. Hệ thống thực hiện chạy bộ quy tắc kiểm tra cờ đỏ khẩn cấp (Red Flags Engine) trước tiên: kiểm tra các dấu hiệu nguy hiểm tính mạng (đau thắt ngực lan cánh tay, khó thở dữ dội, mất ý thức)."),
            ("", 
             "3. Đồng thời gọi mô hình AI suy luận tổng hợp (RAG kết hợp Knowledge Base y tế) để phân loại mức độ nguy cơ (Thấp, Trung bình, Khẩn cấp) và gợi ý 1-2 chuyên khoa khám phù hợp nhất kèm căn cứ y khoa."),
            ("", 
             "4. Lưu kết luận vào bản ghi PreExamSession, cập nhật trạng thái COMPLETED và trả kết quả về cho Client."),
            ("5. Người bệnh xem báo cáo kết quả trên giao diện trực quan.", 
             "6. Hiển thị rõ ràng: Huy hiệu mức nguy cơ, danh sách cờ đỏ cảnh báo (nếu có), chuyên khoa đề xuất khám và cung cấp nút \"Đặt lịch khám chuyên khoa này ngay\".")
        ],
        "alt_flow": [
            ("2.1. Phát hiện triệu chứng cờ đỏ cấp cứu khẩn cấp (Emergency Red Flag).", 
             "3.1. Hệ thống lập tức hiển thị cảnh báo đỏ toàn màn hình kèm âm thanh cảnh báo: \"CẢNH BÁO NGUY HIỂM: Triệu chứng của bạn có thể là dấu hiệu cấp cứu y tế. Vui lòng gọi ngay 115 hoặc đến cơ sở cấp cứu gần nhất, không tự điều trị tại nhà!\".")
        ]
    }
]

