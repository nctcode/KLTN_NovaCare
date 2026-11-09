# -*- coding: utf-8 -*-

USECASES_PART3 = [
    # ── PHÂN HỆ 7: TƯ VẤN Y TẾ TỪ XA (TELECONSULTATION)
    {
        "name": "UC-TELE-01: Khởi tạo phiên tư vấn từ xa",
        "description": "Khởi tạo một phiên tư vấn trực tuyến (Teleconsultation Session) liên kết với lịch hẹn khám từ xa đã được thanh toán hoặc xác nhận.",
        "primary_actor": "Bệnh nhân (Patient)",
        "secondary_actor": "Không có",
        "pre_condition": "Lịch hẹn khám trực tuyến đang ở trạng thái CONFIRMED hoặc PAID.",
        "post_condition": "Bản ghi ConsultationSession được tạo mới ở trạng thái PENDING hoặc mở lại phiên hiện hữu; phòng giao tiếp được kích hoạt.",
        "main_flow": [
            ("1. Tại màn hình chi tiết lịch khám từ xa, người bệnh nhấn nút \"Vào phòng tư vấn\".", 
             "2. Gửi request POST /api/v1/consultations kèm appointmentId lên server."),
            ("", 
             "3. Hệ thống kiểm tra tính hợp lệ của lịch hẹn: đúng trạng thái, đúng thời điểm và thuộc về người dùng hiện tại."),
            ("", 
             "4. Tạo bản ghi ConsultationSession trong CSDL (hoặc trả về phiên đã tồn tại), thiết lập trạng thái ban đầu PENDING và liên kết bác sĩ phụ trách."),
            ("", 
             "5. Điều hướng người bệnh vào màn hình giao diện phòng tư vấn trực tuyến.")
        ],
        "alt_flow": [
            ("1.1. Lịch hẹn chưa được thanh toán hoặc chưa đến giờ hẹn theo quy định.", 
             "2.1. Hệ thống hiển thị cảnh báo: \"Ca tư vấn chỉ có thể mở trước giờ hẹn 10 phút và sau khi đã hoàn tất thanh toán. Vui lòng quay lại sau\".")
        ]
    },
    {
        "name": "UC-TELE-02: Xem danh sách phiên tư vấn",
        "description": "Người bệnh hoặc bác sĩ xem toàn bộ các cuộc tư vấn từ xa được phân công theo các trạng thái: Chờ tiếp nhận, Đang diễn ra, Đã hoàn tất.",
        "primary_actor": "Bác sĩ, Bệnh nhân",
        "secondary_actor": "Không có",
        "pre_condition": "Người dùng đã đăng nhập vào hệ thống.",
        "post_condition": "Danh sách các cuộc tư vấn hiển thị kèm thời gian hẹn và thông tin tóm tắt.",
        "main_flow": [
            ("1. Chọn mục \"Tư vấn từ xa\" trên thanh điều hướng ứng dụng.", 
             "2. Gửi request GET /api/v1/consultations lên server."),
            ("", 
             "3. Hệ thống lọc các phiên tư vấn theo userId/doctorId của tài khoản đang đăng nhập, nạp kèm thông tin người bệnh, bác sĩ và lịch hẹn."),
            ("4. Chuyển đổi qua lại giữa các tab (Chờ xử lý, Đang diễn ra, Lịch sử).", 
             "5. Hiển thị danh sách các thẻ phiên tư vấn kèm huy hiệu trạng thái.")
        ],
        "alt_flow": [
            ("2.1. Tài khoản chưa có bất kỳ cuộc tư vấn nào.", 
             "3.1. Giao diện hiển thị trạng thái trống và gợi ý người dùng đặt lịch tư vấn trực tuyến.")
        ]
    },
    {
        "name": "UC-TELE-03: Tiếp nhận & Bắt đầu phiên tư vấn",
        "description": "Bác sĩ xác nhận tiếp nhận ca tư vấn từ xa của người bệnh và kích hoạt phiên làm việc sang trạng thái hoạt động (ACTIVE).",
        "primary_actor": "Bác sĩ (Doctor)",
        "secondary_actor": "Không có",
        "pre_condition": "Phiên tư vấn đang ở trạng thái PENDING hoặc ACCEPTED; bác sĩ được phân công phụ trách ca này.",
        "post_condition": "Trạng thái phiên tư vấn chuyển sang ACCEPTED rồi ACTIVE; mở quyền truy cập nhắn tin và gọi video cho cả hai bên.",
        "main_flow": [
            ("1. Bác sĩ mở chi tiết phiên tư vấn ở trạng thái chờ và bấm nút \"Tiếp nhận ca tư vấn\".", 
             "2. Gửi request PATCH /api/v1/consultations/:id/accept. Hệ thống chuyển status sang ACCEPTED và gửi thông báo cho bệnh nhân."),
            ("3. Đến thời điểm hẹn khám, bác sĩ bấm nút \"Bắt đầu tư vấn\".", 
             "4. Gửi request PATCH /api/v1/consultations/:id/start. Hệ thống chuyển status sang ACTIVE, ghi nhận thời gian bắt đầu thực tế và kích hoạt phòng làm việc trực tuyến.")
        ],
        "alt_flow": [
            ("1.1. Bác sĩ bận đột xuất và không thể tiếp nhận ca tư vấn.", 
             "2.1. Bác sĩ bấm nút \"Từ chối / Hủy phiên\", nhập lý do bận ca cấp cứu. Hệ thống chuyển trạng thái CANCELLED và gửi thông báo hoàn tiền/đổi lịch cho bệnh nhân.")
        ]
    },
    {
        "name": "UC-TELE-04: Nhắn tin tư vấn thời gian thực",
        "description": "Bác sĩ và người bệnh trao đổi tin nhắn văn bản tức thời qua giao thức WebSocket và REST API, hỗ trợ hiển thị trạng thái đã xem (seen/read).",
        "primary_actor": "Bác sĩ, Bệnh nhân",
        "secondary_actor": "Không có",
        "pre_condition": "Phiên tư vấn đang ở trạng thái ACTIVE.",
        "post_condition": "Tin nhắn được truyền tải ngay lập tức đến người nhận và lưu trữ vào bảng ConsultationMessage.",
        "main_flow": [
            ("1. Người dùng kết nối vào phòng chat (Client gửi event 'join_room' qua WebSocket Gateway consultations.gateway.ts).", 
             "2. Hệ thống xác thực token và kết nạp client vào room socket tương ứng với consultationId."),
            ("3. Nhập nội dung tin nhắn và bấm nút \"Gửi\".", 
             "4. Client phát sự kiện 'send_message' lên gateway hoặc gọi POST /api/v1/consultations/:id/messages. Server lưu tin nhắn vào CSDL và broadcast đến người kia trong room."),
            ("", 
             "5. Giao diện người nhận hiển thị tin nhắn mới ngay lập tức; khi người nhận mở xem, client gửi event 'message_read' để cập nhật trạng thái đã xem.")
        ],
        "alt_flow": [
            ("3.1. Kết nối mạng WebSocket bị mất tín hiệu đột ngột.", 
             "4.1. Ứng dụng tự động chuyển sang cơ chế dự phòng HTTP REST polling để gửi/nhận tin nhắn và tự động kết nối lại socket khi có mạng.")
        ]
    },
    {
        "name": "UC-TELE-05: Gửi tệp đính kèm trong tư vấn",
        "description": "Bác sĩ hoặc người bệnh tải lên hình ảnh kết quả xét nghiệm, đơn thuốc cũ hoặc tài liệu y tế định dạng PDF/ảnh trong cửa sổ chat.",
        "primary_actor": "Bác sĩ, Bệnh nhân",
        "secondary_actor": "Không có",
        "pre_condition": "Phiên tư vấn đang mở.",
        "post_condition": "Tệp được tải lên thư mục lưu trữ an toàn, bản ghi ConsultationAttachment được tạo và gửi liên kết xem vào cuộc hội thoại.",
        "main_flow": [
            ("1. Nhấn vào biểu tượng kẹp tệp đính kèm trên thanh công cụ chat.", 
             "2. Chọn hình ảnh hoặc tài liệu y tế từ thiết bị."),
            ("3. Xác nhận gửi tệp.", 
             "4. Gửi request multipart/form-data đến POST /api/v1/consultations/:id/attachments. Hệ thống kiểm tra mã độc, kích thước tệp (< 20MB), lưu tệp vào thư mục uploads."),
            ("", 
             "5. Sinh đường dẫn tải an toàn, tạo tin nhắn dạng tệp đính kèm và hiển thị hình ảnh thu nhỏ trực tiếp trên khung chat.")
        ],
        "alt_flow": [
            ("2.1. Tệp đính kèm có đuôi mở rộng không an toàn (.exe, .bat, .sh) hoặc vượt quá 20MB.", 
             "3.1. Hệ thống từ chối tải lên và hiển thị cảnh báo: \"Chỉ cho phép tải lên tệp hình ảnh (JPG, PNG) hoặc tài liệu y tế (PDF) dung lượng dưới 20MB\".")
        ]
    },
    {
        "name": "UC-TELE-06: Tham gia phòng gọi video trực tuyến (LiveKit WebRTC)",
        "description": "Bác sĩ và người bệnh kết nối âm thanh và hình ảnh trực tiếp thông qua phòng gọi video WebRTC độ trễ thấp được bảo mật bởi LiveKit Media Server.",
        "primary_actor": "Bác sĩ, Bệnh nhân",
        "secondary_actor": "Máy chủ Video LiveKit",
        "pre_condition": "Phiên tư vấn đang ở trạng thái ACTIVE; thiết bị có Camera, Microphone hoạt động và đã được cấp quyền.",
        "post_condition": "Cả hai bên tham gia cùng một phòng gọi video WebRTC mã hóa thời gian thực.",
        "main_flow": [
            ("1. Bấm nút \"Gọi video\" trên thanh công cụ của phiên tư vấn.", 
             "2. Gửi request POST /api/v1/consultation-video/:id/join lên server."),
            ("", 
             "3. Hệ thống kiểm tra quyền của người gọi (phải là bác sĩ hoặc bệnh nhân của ca khám). Sử dụng LiveKit SDK sinh mã JWT Access Token chứa quyền canPublish=true, canSubscribe=true và tên phòng roomName = 'consultation_{id}'."),
            ("", 
             "4. Trả về token và địa chỉ máy chủ LiveKit Server URL cho Client."),
            ("5. Ứng dụng Client sử dụng LiveKit Client SDK kết nối vào phòng video.", 
             "6. LiveKit Server thiết lập kênh truyền WebRTC SFU, truyền luồng camera và micro của hai bên; hiển thị giao diện gọi video với khung hình của bác sĩ và bệnh nhân.")
        ],
        "alt_flow": [
            ("5.1. Thiết bị không có quyền truy cập Camera hoặc Microphone.", 
             "6.1. Ứng dụng hiển thị thông báo yêu cầu người dùng cấp quyền trong Cài đặt trước khi có thể truyền tải hình ảnh/âm thanh."),
            ("5.2. Đường truyền mạng yếu khiến chất lượng hình ảnh giảm.", 
             "6.2. Thuật toán Simulcast của LiveKit tự động hạ độ phân giải video xuống mức phù hợp để ưu tiên đảm bảo âm thanh đàm thoại không bị ngắt quãng.")
        ]
    },
    {
        "name": "UC-TELE-07: Xử lý sự kiện phòng gọi video (LiveKit Webhook)",
        "description": "Máy chủ LiveKit gửi tín hiệu webhook ngầm về hệ thống NovaCare để ghi nhận thời điểm người dùng vào/ra phòng và thời lượng thực tế của cuộc gọi.",
        "primary_actor": "Máy chủ Video LiveKit (Hệ thống ngoài)",
        "secondary_actor": "Không có",
        "pre_condition": "Có sự kiện phát sinh trong phòng gọi video trên máy chủ LiveKit.",
        "post_condition": "Nhật ký cuộc gọi video được lưu lại phục vụ kiểm toán chất lượng dịch vụ.",
        "main_flow": [
            ("1. Máy chủ LiveKit phát sinh các sự kiện: 'participant_joined', 'participant_left', 'room_finished'.", 
             "2. Gửi request HTTP POST đến /api/v1/consultation-video/webhook kèm chữ ký Authorization."),
            ("", 
             "3. Hệ thống NovaCare sử dụng WebhookReceiver của LiveKit SDK để giải mã và xác thực chữ ký số bằng API Key và Secret Key."),
            ("", 
             "4. Ghi nhận thời điểm tham gia, thời điểm rời phòng và tổng thời lượng gọi của ca tư vấn vào bảng kiểm toán hệ thống.")
        ],
        "alt_flow": [
            ("2.1. Chữ ký webhook không hợp lệ (không đúng Secret Key).", 
             "3.1. Hệ thống từ chối yêu cầu và trả về lỗi 401 Unauthorized.")
        ]
    },
    {
        "name": "UC-TELE-08: Kết thúc / Hủy phiên tư vấn",
        "description": "Bác sĩ hoặc người bệnh hoàn tất buổi làm việc trực tuyến, lưu ghi chú tóm tắt và chính thức đóng phiên tư vấn.",
        "primary_actor": "Bác sĩ, Bệnh nhân",
        "secondary_actor": "Không có",
        "pre_condition": "Phiên tư vấn đang mở.",
        "post_condition": "Trạng thái phiên tư vấn chuyển sang COMPLETED; phòng video tự động giải phóng; lịch hẹn liên quan chuyển sang COMPLETED.",
        "main_flow": [
            ("1. Bác sĩ (hoặc người bệnh) bấm nút \"Kết thúc tư vấn\".", 
             "2. Hiển thị hộp thoại xác nhận kết thúc ca tư vấn kèm ô nhập ghi chú tóm tắt dặn dò của bác sĩ."),
            ("3. Nhập ghi chú kết luận và nhấn \"Xác nhận hoàn thành\".", 
             "4. Gửi request PATCH /api/v1/consultations/:id/complete. Hệ thống chuyển status sang COMPLETED, cập nhật lịch hẹn tương ứng thành COMPLETED."),
            ("", 
             "5. Đóng phòng video LiveKit và phòng chat; hiển thị màn hình thông báo hoàn tất ca tư vấn và gợi ý người bệnh đánh giá dịch vụ.")
        ],
        "alt_flow": [
            ("3.1. Có sự cố kỹ thuật bất khả kháng không thể tiếp tục phiên.", 
             "4.1. Bác sĩ chọn chức năng \"Hủy phiên do sự cố\", hệ thống chuyển trạng thái sang CANCELLED và ghi nhận lý do.")
        ]
    },

    # ── PHÂN HỆ 8: ĐÁNH GIÁ & PHẢN HỒI CHẤT LƯỢNG
    {
        "name": "UC-REV-01: Kiểm tra điều kiện đánh giá",
        "description": "Hệ thống xác minh xem lịch hẹn đã hoàn thành và người bệnh đã từng gửi đánh giá cho ca khám này hay chưa trước khi mở biểu mẫu.",
        "primary_actor": "Bệnh nhân (Patient)",
        "secondary_actor": "Không có",
        "pre_condition": "Người bệnh đã đăng nhập và đang xem chi tiết một lịch hẹn khám.",
        "post_condition": "Hệ thống trả về trạng thái hợp lệ và cho phép hiển thị form đánh giá.",
        "main_flow": [
            ("1. Người bệnh mở chi tiết phiếu khám đã hoàn tất và bấm \"Đánh giá dịch vụ\".", 
             "2. Gửi request GET /api/v1/reviews/eligibility/:appointmentId lên server."),
            ("", 
             "3. Hệ thống kiểm tra: Lịch hẹn có trạng thái là COMPLETED và chưa tồn tại bản ghi Review nào tương ứng với appointmentId này."),
            ("", 
             "4. Trả về kết quả eligible = true; mở biểu mẫu đánh giá sao và tiêu chí.")
        ],
        "alt_flow": [
            ("2.1. Lịch hẹn chưa hoàn thành hoặc người bệnh đã từng gửi đánh giá trước đó.", 
             "3.1. Hệ thống trả về eligible = false kèm thông báo: \"Phiếu khám này đã được đánh giá hoặc chưa hoàn tất khám. Bạn không thể gửi thêm đánh giá mới\".")
        ]
    },
    {
        "name": "UC-REV-02: Gửi đánh giá bác sĩ / Cơ sở y tế",
        "description": "Người bệnh chấm điểm số sao tổng thể (1-5★), viết nhận xét chi tiết và chấm điểm từng tiêu chí dịch vụ (thái độ, chất lượng, thời gian chờ, tiếp đón).",
        "primary_actor": "Bệnh nhân (Patient)",
        "secondary_actor": "Không có",
        "pre_condition": "Phiếu khám thỏa mãn điều kiện đánh giá hợp lệ.",
        "post_condition": "Bản ghi Review mới được khởi tạo ở trạng thái PENDING hoặc APPROVED; điểm trung bình của bác sĩ/cơ sở được cập nhật lại.",
        "main_flow": [
            ("1. Chọn số sao tổng quan (từ 1 đến 5 sao).", 
             "2. Chấm điểm các tiêu chí chi tiết: Thái độ phục vụ của bác sĩ, Chất lượng khám chữa bệnh, Thời gian chờ đợi, Thái độ nhân viên tiếp đón, Cơ sở vật chất sạch sẽ."),
            ("3. Nhập nội dung nhận xét chi tiết và chia sẻ trải nghiệm.", 
             "4. Nhấn nút \"Gửi đánh giá\". Gửi request POST /api/v1/reviews kèm appointmentId, targetType, rating, comment và criteriaScores."),
            ("", 
             "5. Hệ thống kiểm duyệt tự động từ ngữ thô tục cơ bản. Lưu bản ghi vào bảng Review và ReviewCriteriaScore, cập nhật lại điểm đánh giá trung bình và phản hồi thành công.")
        ],
        "alt_flow": [
            ("4.1. Người bệnh chưa chọn số sao tổng quan hoặc để trống nội dung bắt buộc.", 
             "5.1. Hệ thống báo lỗi và yêu cầu chọn ít nhất số sao tổng quan trước khi gửi.")
        ]
    },
    {
        "name": "UC-REV-03: Chỉnh sửa đánh giá cá nhân",
        "description": "Người bệnh cập nhật lại nhận xét hoặc điểm số sao của bài đánh giá đã gửi trong khoảng thời gian quy định.",
        "primary_actor": "Bệnh nhân (Patient)",
        "secondary_actor": "Không có",
        "pre_condition": "Bài đánh giá thuộc về tài khoản người bệnh và chưa bị khóa vĩnh viễn.",
        "post_condition": "Nội dung bài đánh giá và điểm tiêu chí được cập nhật mới trong CSDL.",
        "main_flow": [
            ("1. Vào mục \"Đánh giá của tôi\", chọn bài đánh giá cần chỉnh sửa.", 
             "2. Hiển thị biểu mẫu chỉnh sửa với các thông tin đã đánh giá trước đó."),
            ("3. Thay đổi số sao hoặc chỉnh sửa lại câu từ nhận xét.", 
             "4. Nhấn nút \"Lưu thay đổi\". Gửi request PUT /api/v1/reviews/:id; hệ thống cập nhật CSDL và hiển thị thông báo thành công.")
        ],
        "alt_flow": [
            ("3.1. Bài đánh giá đã bị ban quản trị khóa hoặc ẩn do vi phạm tiêu chuẩn cộng đồng.", 
             "4.1. Hệ thống từ chối cập nhật và hiển thị thông báo bài viết không thể chỉnh sửa.")
        ]
    },
    {
        "name": "UC-REV-04: Xem đánh giá công khai & Thống kê chất lượng",
        "description": "Người dùng xem danh sách các bài đánh giá đã được phê duyệt của từng bác sĩ/cơ sở y tế và xem biểu đồ phân bổ số sao đánh giá.",
        "primary_actor": "Khách vãng lai, Bệnh nhân",
        "secondary_actor": "Không có",
        "pre_condition": "Bác sĩ hoặc cơ sở y tế đã có các lượt đánh giá công khai.",
        "post_condition": "Điểm sao trung bình, tổng số lượt đánh giá và danh sách bình luận được hiển thị minh bạch.",
        "main_flow": [
            ("1. Mở trang chi tiết Bác sĩ hoặc Cơ sở y tế, cuộn đến mục Đánh giá.", 
             "2. Gửi request GET /api/v1/reviews/public/doctor/:id hoặc GET /api/v1/reviews/public/hospital/:id."),
            ("", 
             "3. Hệ thống truy vấn các bản ghi Review có status == 'APPROVED', tính toán điểm sao trung bình và tỷ lệ phân bổ các mức 1★ đến 5★."),
            ("4. Lọc đánh giá theo số sao hoặc tiêu chí cụ thể.", 
             "5. Hiển thị danh sách nhận xét kèm câu trả lời phản hồi chính thức của bác sĩ/bệnh viện (nếu có).")
        ],
        "alt_flow": [
            ("2.1. Đơn vị chưa có bất kỳ bài đánh giá nào.", 
             "3.1. Giao diện hiển thị: \"Chưa có đánh giá nào. Hãy là người đầu tiên trải nghiệm và chia sẻ nhận xét\".")
        ]
    },
    {
        "name": "UC-REV-05: Phản hồi đánh giá của người bệnh",
        "description": "Bác sĩ hoặc đại diện cơ sở y tế gửi lời cảm ơn hoặc thông điệp giải trình chính thức cho một bình luận đánh giá của bệnh nhân.",
        "primary_actor": "Bác sĩ, Quản trị cơ sở y tế",
        "secondary_actor": "Không có",
        "pre_condition": "Đã đăng nhập vai trò DOCTOR hoặc HOSPITAL_ADMIN; bài đánh giá thuộc về bác sĩ hoặc cơ sở y tế của mình.",
        "post_condition": "Bản ghi ReviewResponse được lưu và hiển thị công khai ngay bên dưới bài đánh giá.",
        "main_flow": [
            ("1. Tại giao diện quản lý đánh giá, chọn một bài nhận xét của người bệnh.", 
             "2. Nhấn nút \"Phản hồi đánh giá\". Hiển thị ô nhập văn bản phản hồi."),
            ("3. Nhập nội dung cảm ơn hoặc giải trình chuyên môn của cơ sở.", 
             "4. Nhấn nút \"Đăng phản hồi\". Gửi request POST /api/v1/reviews/:id/responses."),
            ("", 
             "5. Hệ thống lưu phản hồi vào bảng ReviewResponse, gắn responderId và responderRole, cập nhật hiển thị ngay lập tức.")
        ],
        "alt_flow": [
            ("3.1. Người dùng không có quyền quản lý đối tượng được đánh giá (sai doctorId/hospitalId).", 
             "4.1. Hệ thống chặn thao tác và trả về lỗi 403 Forbidden.")
        ]
    },
    {
        "name": "UC-REV-06: Báo cáo đánh giá vi phạm",
        "description": "Người dùng hoặc bác sĩ gửi báo cáo vi phạm lên ban quản trị nếu bài đánh giá chứa từ ngữ thô tục, xúc phạm hoặc sai sự thật.",
        "primary_actor": "Bệnh nhân, Bác sĩ",
        "secondary_actor": "Không có",
        "pre_condition": "Đã đăng nhập vào hệ thống; bài đánh giá đang hiển thị công khai.",
        "post_condition": "Bản ghi ReviewReport được khởi tạo ở trạng thái PENDING gửi đến hàng đợi kiểm duyệt của Super Admin.",
        "main_flow": [
            ("1. Bấm vào biểu tượng lá cờ \"Báo cáo vi phạm\" tại bài đánh giá.", 
             "2. Hiển thị hộp thoại chọn lý do báo cáo: Ngôn từ kích động/xúc phạm, Thông tin sai lệch, Quảng cáo/Spam, Khác."),
            ("3. Chọn lý do và nhập mô tả chi tiết bằng chứng vi phạm.", 
             "4. Nhấn nút \"Gửi báo cáo vi phạm\". Gửi request POST /api/v1/reviews/:id/report."),
            ("", 
             "5. Hệ thống tạo bản ghi trong bảng ReviewReport, ghi nhận người báo cáo và gửi thông báo tiếp nhận thành công.")
        ],
        "alt_flow": [
            ("3.1. Người dùng gửi báo cáo trùng lặp nhiều lần cho cùng một bài đánh giá.", 
             "4.1. Hệ thống thông báo: \"Bạn đã gửi báo cáo cho bài đánh giá này trước đó. Ban quản trị đang xử lý yêu cầu của bạn\".")
        ]
    },

    # ── PHÂN HỆ 9: QUẢN LÝ KHÁM CHỮA BỆNH LÂM SÀNG & EMR
    {
        "name": "UC-CLIN-01: Xem chi tiết lượt khám lâm sàng (EMR Encounter)",
        "description": "Bác sĩ mở hồ sơ bệnh án điện tử của ca khám, xem thông tin hành chính, lý do khám và kết quả tiền khám trước khi thực hiện khám bệnh.",
        "primary_actor": "Bác sĩ (Doctor)",
        "secondary_actor": "Không có",
        "pre_condition": "Bác sĩ được phân công phụ trách ca khám này; lịch hẹn đã được tiếp đón Check-in.",
        "post_condition": "Thông tin bệnh án điện tử của lượt khám được hiển thị đầy đủ.",
        "main_flow": [
            ("1. Bác sĩ mở danh sách bệnh nhân chờ khám tại phòng khám.", 
             "2. Chọn một bệnh nhân cụ thể. Gửi request GET /api/v1/clinical/encounters/:id."),
            ("3. Bác sĩ xem xét toàn diện thông tin trước khi bắt đầu thăm khám trực tiếp.", 
             "4. Hệ thống nạp dữ liệu Encounter: thông tin bệnh nhân, số thứ tự, tiền sử bệnh nền, lý do đến khám và kết quả sàng lọc tiền khám AI (nếu có).")
        ],
        "alt_flow": [
            ("2.1. Ca khám không thuộc thẩm quyền phân công của bác sĩ hiện tại.", 
             "3.1. Hệ thống từ chối truy cập và báo lỗi 403 Forbidden.")
        ]
    },
    {
        "name": "UC-CLIN-02: Nhập chẩn đoán bệnh theo chuẩn ICD-10",
        "description": "Bác sĩ ghi nhận mã chẩn đoán chính và các chẩn đoán phụ theo bảng danh mục mã hóa bệnh tật quốc tế ICD-10 của Bộ Y tế.",
        "primary_actor": "Bác sĩ (Doctor)",
        "secondary_actor": "Không có",
        "pre_condition": "Lượt khám lâm sàng đang ở trạng thái IN_PROGRESS.",
        "post_condition": "Bản ghi Diagnosis mới được lưu trong CSDL gắn liền với lượt khám Encounter.",
        "main_flow": [
            ("1. Tại phân hệ chẩn đoán bệnh án, bác sĩ nhập mã hoặc tên bệnh (ví dụ: \"J00 - Viêm mũi họng cấp\", \"I10 - Tăng huyết áp vô căn\").", 
             "2. Hệ thống tìm kiếm và hiển thị danh mục gợi ý mã ICD-10 chuẩn hóa."),
            ("3. Chọn mã bệnh tương ứng, đánh dấu phân loại (Chẩn đoán chính hoặc Chẩn đoán phụ/kèm theo).", 
             "4. Nhấn nút \"Thêm chẩn đoán\". Gửi request POST /api/v1/clinical/encounters/:id/diagnoses."),
            ("", 
             "5. Hệ thống lưu bản ghi vào bảng Diagnosis và cập nhật danh sách chẩn đoán trên bệnh án.")
        ],
        "alt_flow": [
            ("3.1. Bác sĩ chưa chọn chẩn đoán chính mà chỉ thêm chẩn đoán phụ.", 
             "4.1. Hệ thống nhắc nhở bắt buộc phải có ít nhất một mã chẩn đoán được chỉ định là chẩn đoán chính.")
        ]
    },
    {
        "name": "UC-CLIN-03: Ghi nhận chỉ số sinh hiệu & Quan sát lâm sàng",
        "description": "Bác sĩ hoặc điều dưỡng nhập các chỉ số đo sinh hiệu (huyết áp, nhịp tim, nhiệt độ, nhịp thở, SpO2, chiều cao, cân nặng, BMI) và ghi chú khám thực thể.",
        "primary_actor": "Bác sĩ (Doctor)",
        "secondary_actor": "Không có",
        "pre_condition": "Lượt khám lâm sàng đang mở.",
        "post_condition": "Các chỉ số sinh hiệu và quan sát thực thể được lưu vào bảng Observation.",
        "main_flow": [
            ("1. Chọn mục \"Chỉ số sinh hiệu & Quan sát thực thể\".", 
             "2. Nhập các giá trị đo đạc: Huyết áp tâm thu/tâm trương (mmHg), Mạch (bpm), Nhiệt độ (°C), SpO2 (%), Chiều cao (cm), Cân nặng (kg)."),
            ("", 
             "3. Hệ thống tự động tính toán chỉ số khối cơ thể BMI và phân loại thể trạng."),
            ("4. Nhập nhận xét khám lâm sàng các cơ quan (Tim mạch, Hô hấp, Tiêu hóa, Thần kinh).", 
             "5. Nhấn nút \"Lưu chỉ số sinh hiệu\". Gửi request POST /api/v1/clinical/encounters/:id/observations; hệ thống lưu vào CSDL và phản hồi thành công.")
        ],
        "alt_flow": [
            ("2.1. Giá trị sinh hiệu nhập vào ngoài phạm vi sinh lý bình thường (ví dụ: nhiệt độ > 45°C, nhịp tim > 300).", 
             "3.1. Hệ thống hiển thị cảnh báo chỉ số bất thường để bác sĩ xác nhận lại tránh nhập nhầm dữ liệu.")
        ]
    },
    {
        "name": "UC-CLIN-04: Kê đơn thuốc điện tử",
        "description": "Bác sĩ khởi tạo đơn thuốc điện tử: tra cứu thuốc trong danh mục dược phẩm, chọn hàm lượng, số lượng, đường dùng, liều dùng và ghi lời dặn điều trị.",
        "primary_actor": "Bác sĩ (Doctor)",
        "secondary_actor": "Không có",
        "pre_condition": "Ca khám đã có chẩn đoán bệnh xác định.",
        "post_condition": "Bản ghi Prescription và danh sách PrescriptionItem được lưu trữ an toàn trong CSDL.",
        "main_flow": [
            ("1. Chọn chức năng \"Kê đơn thuốc điện tử\". Bấm nút \"Thêm thuốc\".", 
             "2. Tìm kiếm tên thuốc hoặc hoạt chất trong danh mục dược phẩm."),
            ("3. Chọn loại thuốc, nhập số lượng, đơn vị tính (viên, gói, chai), đường dùng (uống, tiêm, bôi ngoài da) và liều dùng (ví dụ: Sáng 1v, Chiều 1v sau ăn).", 
             "4. Lặp lại bước 2-3 cho các loại thuốc khác trong đơn."),
            ("5. Nhập lời dặn dò của bác sĩ và hẹn ngày tái khám.", 
             "6. Nhấn nút \"Hoàn tất đơn thuốc\". Gửi request POST /api/v1/clinical/encounters/:id/prescriptions; hệ thống lưu đơn thuốc và tạo mã đơn thuốc điện tử.")
        ],
        "alt_flow": [
            ("3.1. Bác sĩ kê trùng lặp hoạt chất hoặc có cảnh báo tương tác thuốc cơ bản.", 
             "4.1. Hệ thống hiển thị hộp thoại cảnh báo tương tác thuốc để bác sĩ cân nhắc trước khi ký đơn.")
        ]
    },
    {
        "name": "UC-CLIN-05: Hoàn tất ca khám lâm sàng",
        "description": "Bác sĩ rà soát toàn bộ kết quả chẩn đoán, sinh hiệu và đơn thuốc, xác nhận kết thúc ca khám và khóa chỉnh sửa bệnh án.",
        "primary_actor": "Bác sĩ (Doctor)",
        "secondary_actor": "Không có",
        "pre_condition": "Ca khám đã có chẩn đoán và hướng xử trí/kê đơn.",
        "post_condition": "Trạng thái Encounter chuyển sang COMPLETED; lịch hẹn tương ứng hoàn tất.",
        "main_flow": [
            ("1. Bác sĩ kiểm tra lại toàn bộ bệnh án trên màn hình tổng kết.", 
             "2. Nhấn nút \"Hoàn tất ca khám\". Hiển thị hộp thoại xác nhận khóa hồ sơ bệnh án."),
            ("3. Xác nhận hoàn tất.", 
             "4. Gửi request PATCH /api/v1/clinical/encounters/:id/complete. Hệ thống khóa các trường chỉnh sửa, cập nhật trạng thái Encounter thành COMPLETED, cập nhật Appointment thành COMPLETED."),
            ("", 
             "5. Phản hồi thông báo hoàn tất ca khám và cho phép in phiếu kết quả khám bệnh/đơn thuốc.")
        ],
        "alt_flow": [
            ("2.1. Ca khám chưa có mã chẩn đoán chính nào được lưu.", 
             "3.1. Hệ thống từ chối hoàn tất và yêu cầu: \"Ca khám phải có ít nhất một chẩn đoán bệnh trước khi hoàn tất\".")
        ]
    },
    {
        "name": "UC-CLIN-06: Phát hành bệnh án vào Hộ chiếu sức khỏe",
        "description": "Bác sĩ kích hoạt quyền xuất bản kết quả lượt khám vào sổ sức khỏe cá nhân (Medical Passport) của người bệnh để phục vụ liên thông tra cứu.",
        "primary_actor": "Bác sĩ (Doctor)",
        "secondary_actor": "Không có",
        "pre_condition": "Lượt khám lâm sàng đã hoàn tất (COMPLETED).",
        "post_condition": "Cờ published chuyển sang true; bệnh nhân có thể xem chi tiết lượt khám này trong Hộ chiếu sức khỏe của mình.",
        "main_flow": [
            ("1. Tại ca khám đã hoàn thành, bác sĩ nhấn nút \"Phát hành vào Sổ sức khỏe\".", 
             "2. Gửi request PATCH /api/v1/clinical/encounters/:id/publish lên server."),
            ("", 
             "3. Hệ thống kiểm tra quyền bác sĩ và trạng thái ca khám. Cập nhật cờ isPublished = true và publishedAt = thời điểm hiện tại."),
            ("", 
             "4. Gửi thông báo đến tài khoản người bệnh: \"Kết quả khám bệnh của bạn tại [Tên bệnh viện] đã sẵn sàng trong Hộ chiếu sức khỏe\".")
        ],
        "alt_flow": [
            ("2.1. Ca khám chưa hoàn tất hoặc đang bị khiếu nại chuyên môn.", 
             "3.1. Hệ thống từ chối phát hành và thông báo ca khám cần được hoàn tất đầy đủ thủ tục trước khi công bố.")
        ]
    }
]
