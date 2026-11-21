# -*- coding: utf-8 -*-
"""
Dữ liệu chi tiết 21 Use Case của phân hệ Bệnh nhân trên Mobile App NovaCare.
Đối chiếu trực tiếp mã nguồn Kotlin (Jetpack Compose) tại thư mục:
mobile/app/src/main/java/com/example/kltn_novacare/
"""

PATIENT_USE_CASES = [
    # -------------------------------------------------------------
    # UC 1: Đăng ký
    # -------------------------------------------------------------
    {
        "id": "UC-PAT-01",
        "name": "UC-PAT-01: Đăng ký tài khoản người bệnh qua mã xác thực OTP",
        "description": "Người dùng đăng ký tài khoản mới trên ứng dụng NovaCare Mobile bằng số điện thoại hoặc email. Quá trình đăng ký yêu cầu xác thực hai bước thông qua mã OTP ngẫu nhiên gửi đến thiết bị di động, thiết lập mật khẩu bảo mật và tự động khởi tạo hồ sơ người bệnh mặc định.",
        "primary_actor": "Người bệnh (Khách vãng lai / Guest)",
        "secondary_actor": "Dịch vụ SMS Gateway / Email SMTP (Twilio/SendGrid), Bộ nhớ đệm Redis",
        "pre_condition": "Ứng dụng NovaCare đã được cài đặt trên thiết bị Android, có kết nối Internet (Wi-Fi/4G/5G). Số điện thoại hoặc email chưa từng đăng ký tài khoản trên hệ thống.",
        "post_condition": "Tài khoản mới được tạo lập trong hệ thống với vai trò PATIENT. Mật khẩu được mã hóa an toàn bằng Argon2id. Hồ sơ người đi khám mặc định (PatientProfile) được liên kết tự động với tài khoản.",
        "main_flow": [
            (
                "1. Người dùng mở ứng dụng NovaCare, tại màn hình Đăng nhập (LoginScreen) nhấn chọn liên kết \"Chưa có tài khoản? Đăng ký ngay\".",
                "2. Hệ thống chuyển hướng đến màn hình Đăng ký (RegisterScreen), hiển thị biểu mẫu bao gồm các trường: Số điện thoại/Email, Họ và tên, Giới tính, Mật khẩu, Xác nhận mật khẩu và nút \"Gửi mã xác thực OTP\"."
            ),
            (
                "3. Người dùng nhập số điện thoại hoặc email hợp lệ và nhấn nút \"Gửi OTP\".",
                "4. Hệ thống kiểm tra định dạng và gọi API đối soát trong CSDL: nếu chưa tồn tại, hệ thống tạo mã OTP ngẫu nhiên gồm 6 chữ số, lưu trữ vào Redis với thời hạn hết hạn 5 phút (TTL = 300s), gửi mã qua SMS/Email và kích hoạt đồng hồ đếm ngược 60 giây trên giao diện."
            ),
            (
                "5. Người dùng nhận được mã OTP trên điện thoại, nhập vào trường xác thực 6 số trên màn hình và nhấn \"Xác minh OTP\".",
                "6. Hệ thống gửi mã OTP lên máy chủ để đối chiếu với Redis. Sau khi xác minh thành công, hệ thống cấp một mã tạm verificationToken và mở khóa các trường thông tin cá nhân còn lại."
            ),
            (
                "7. Người dùng nhập Họ và tên đầy đủ, chọn Giới tính, nhập Mật khẩu (tối thiểu 6 ký tự gồm chữ và số), nhập Xác nhận mật khẩu, tích chọn \"Tôi đồng ý với Điều khoản và Chính sách bảo mật\", sau đó nhấn nút \"Hoàn tất đăng ký\".",
                "8. Hệ thống mã hóa mật khẩu bằng thuật toán Argon2id, lưu thông tin người dùng mới vào bảng Users với vai trò PATIENT, tự động tạo hồ sơ khám bệnh mặc định (PatientProfile gắn cờ isDefault = true), gửi thông báo chào mừng và chuyển hướng người dùng về màn hình Đăng nhập."
            )
        ],
        "alternate_flow": [
            (
                "3.1. Số điện thoại hoặc email đã tồn tại trên hệ thống NovaCare.",
                "4.1. Hệ thống trả về mã lỗi 409 Conflict, hiển thị thông báo lỗi màu đỏ: \"Số điện thoại/email này đã được sử dụng. Vui lòng đăng nhập hoặc sử dụng chức năng Quên mật khẩu\"."
            ),
            (
                "5.1. Người dùng nhập sai mã OTP hoặc nhập sau khi mã đã hết hạn 5 phút.",
                "6.1. Hệ thống báo lỗi: \"Mã OTP không chính xác hoặc đã hết hạn (TTL = 300s). Vui lòng thử lại hoặc yêu cầu gửi lại mã mới\"."
            ),
            (
                "7.1. Mật khẩu không đạt độ dài tối thiểu (< 6 ký tự) hoặc Mật khẩu xác nhận không trùng khớp.",
                "8.1. Hệ thống hiển thị cảnh báo ngay dưới trường nhập liệu: \"Mật khẩu xác nhận không khớp\" và vô hiệu hóa nút đăng ký cho đến khi người dùng sửa đúng."
            )
        ]
    },

    # -------------------------------------------------------------
    # UC 2: Sàng lọc triệu chứng AI
    # -------------------------------------------------------------
    {
        "id": "UC-PAT-02",
        "name": "UC-PAT-02: Sàng lọc triệu chứng lâm sàng bằng Trí tuệ nhân tạo (AI Multimodal Triage)",
        "description": "Người bệnh sử dụng công cụ AI trên ứng dụng di động để sàng lọc tình trạng sức khỏe qua quy trình 5 bước: chọn vùng cơ thể và mô tả triệu chứng, trả lời bộ câu hỏi thích ứng chuyên sâu (Adaptive QA), chụp ảnh tổn thương hoặc đo nhịp tim/SpO2 bằng camera PPG (Photoplethysmography), ghi âm giọng nói mô tả (Whisper STT), và nhận kết quả phân tầng nguy cơ (Triage) kèm khuyến nghị chuyên khoa, bác sĩ, cơ sở y tế phù hợp hoặc cảnh báo cấp cứu 115.",
        "primary_actor": "Người bệnh (PATIENT)",
        "secondary_actor": "Động cơ AI Triage (Google Gemini Pro / MedLM), Mô hình nhận diện hình ảnh y tế (YOLO/Vision AI), Mô hình phiên âm giọng nói (Whisper AI), Hệ thống Cấp cứu 115",
        "pre_condition": "Người bệnh đã đăng nhập vào ứng dụng di động NovaCare, thiết bị có kết nối mạng ổn định, đã cấp quyền truy cập Camera, Microphone (cho tính năng chụp ảnh, PPG và ghi âm).",
        "post_condition": "Dữ liệu buổi sàng lọc (ScreeningSession) được lưu lại trên máy chủ và bộ nhớ đệm cục bộ của ứng dụng. Hệ thống trả về kết quả phân tầng nguy cơ (Khẩn cấp, Cần khám sớm, Theo dõi tại nhà) cùng danh sách chuyên khoa, bác sĩ, cơ sở y tế phù hợp để người bệnh đặt khám ngay.",
        "main_flow": [
            (
                "1. Người bệnh nhấn chọn nút \"Sàng lọc AI\" hoặc banner \"Trợ lý AI sàng lọc triệu chứng\" trên màn hình Trang chủ (HomeScreen).",
                "2. Hệ thống hiển thị màn hình Sàng lọc triệu chứng (PreExamScreeningScreen) tại Bước 1: Khai báo triệu chứng ban đầu: hiển thị thẻ thông tin cá nhân (PatientInfoCard: tuổi, giới tính, cơ sở y tế mong muốn tùy chọn); thanh tìm kiếm triệu chứng nhanh và bộ lọc các nhóm vùng cơ thể (BodyRegionSelectorCard gồm 10 nhóm vùng: Đầu mặt cổ, Ngực, Bụng, Lưng - Cột sống, Tay, Chân, Da liễu, Toàn thân, Tiêu hóa, Thần kinh; cho phép chọn tối đa 10 nhóm); thẻ mô tả triệu chứng (SymptomDescriptionCard: ô nhập mô tả chi tiết, bộ chọn thời gian khởi phát và mức độ đau/khó chịu: Nhẹ, Vừa, Nặng)."
            ),
            (
                "3. Người bệnh chọn 1 hoặc nhiều nhóm triệu chứng/vùng cơ thể liên quan, nhập mô tả triệu chứng chi tiết và nhấn nút \"Tiếp tục\".",
                "4. Hệ thống chuyển sang Bước 2: Bộ câu hỏi thích ứng chuyên sâu (Adaptive Questions). Dựa trên các triệu chứng đã chọn ở Bước 1, AI động sinh ra danh sách câu hỏi sàng lọc phân nhánh (tiền sử bệnh lý, dấu hiệu đi kèm, yếu tố tăng giảm triệu chứng)."
            ),
            (
                "5. Người bệnh lần lượt trả lời các câu hỏi trắc nghiệm / có-không và nhấn \"Tiếp tục\".",
                "6. Hệ thống chuyển sang Bước 3: Thu thập dữ liệu hình ảnh & Dấu hiệu sinh tồn PPG: cho phép chụp hoặc tải lên tối đa 3 ảnh y tế (tổn thương da, họng, mắt...); cung cấp tùy chọn đo nhịp tim và ước tính SpO2 bằng camera điện thoại thông qua thuật toán quang thể tích (PPG Capture - đặt đầu ngón tay lên ống kính camera kèm đèn flash trong 15-30 giây)."
            ),
            (
                "7. Người bệnh thực hiện chụp ảnh tổn thương (nếu có) hoặc thực hiện đo PPG bằng camera, sau đó nhấn \"Tiếp tục\" (hoặc chọn \"Bỏ qua bước này\").",
                "8. Hệ thống chuyển sang Bước 4: Thu thập giọng nói mô tả (Voice Input). Hiển thị nút ghi âm tích hợp mô hình AI Whisper để người bệnh nói tự nhiên về cảm giác khó chịu và bệnh sử của mình."
            ),
            (
                "9. Người bệnh nhấn giữ/bật nút ghi âm, phát biểu mô tả bệnh tình và nhấn \"Hoàn thành sàng lọc\".",
                "10. Hệ thống tổng hợp toàn bộ dữ liệu đa phương thức (văn bản, câu trả lời, hình ảnh tổn thương, dữ liệu PPG, bản phiên âm giọng nói), gửi đến động cơ suy luận AI đa phương thức để phân tích."
            ),
            (
                "11. Người bệnh chờ hệ thống hiển thị kết quả phân tích.",
                "12. Hệ thống chuyển sang Bước 5: Báo cáo kết quả phân tầng nguy cơ (Triage Result): hiển thị mức độ ưu tiên (Khẩn cấp - Đỏ, Cần khám sớm - Vàng, Theo dõi tại nhà - Xanh); tóm tắt đánh giá lâm sàng sơ bộ; gợi ý chuyên khoa khám bệnh tối ưu nhất; đề xuất danh sách bác sĩ chuyên khoa giỏi và các bệnh viện/phòng khám uy tín gần nhất; cung cấp nút \"Đặt lịch khám ngay\" (tự động chuyển tiếp toàn bộ dữ liệu sàng lọc vào hồ sơ đặt khám)."
            )
        ],
        "alternate_flow": [
            (
                "3.1. Người bệnh khai báo các dấu hiệu cờ đỏ nguy hiểm (Red Flags) như đau thắt ngực dữ dội, khó thở cấp tính, méo miệng/liệt nửa người.",
                "4.1. Hệ thống lập tức kích hoạt Cảnh báo khẩn cấp màu đỏ nổi bật trên màn hình kèm nút gọi nhanh cấp cứu \"Gọi 115 ngay lập tức\" và hiển thị địa chỉ các khoa cấp cứu gần nhất kèm chỉ dẫn đường đi."
            ),
            (
                "7.1. Người bệnh không cấp quyền Camera/Microphone hoặc thiết bị không hỗ trợ đèn flash để đo PPG.",
                "7.2. Hệ thống hiển thị thông báo hướng dẫn cấp quyền trong Cài đặt Android, hoặc cho phép người bệnh chọn \"Bỏ qua đo sinh tồn / chụp ảnh\" để tiếp tục quy trình mà không làm gián đoạn buổi sàng lọc."
            ),
            (
                "10.1. Mất kết nối Internet hoặc dịch vụ máy chủ AI phản hồi quá thời gian chờ (Timeout).",
                "10.2. Hệ thống hiển thị thông báo: \"Không thể kết nối đến máy chủ AI. Dữ liệu sàng lọc của bạn đã được lưu tạm trên máy, vui lòng nhấn 'Thử lại' hoặc chuyển sang đặt khám trực tiếp theo chuyên khoa\"."
            )
        ]
    },

    # -------------------------------------------------------------
    # UC 3: Đặt khám bác sĩ
    # -------------------------------------------------------------
    {
        "id": "UC-PAT-03",
        "name": "UC-PAT-03: Đặt lịch khám bệnh theo bác sĩ chuyên khoa",
        "description": "Người bệnh tìm kiếm, lựa chọn bác sĩ theo mong muốn, xem lịch làm việc trực tuyến, chọn ngày khám và khung giờ còn trống, chỉ định hồ sơ người đi khám, đồng ý ủy quyền chia sẻ bệnh án cũ (nếu có), thực hiện thanh toán trực tuyến qua VNPay hoặc chọn thanh toán tại cơ sở, và nhận mã đặt khám xác nhận kèm mã QR check-in.",
        "primary_actor": "Người bệnh (PATIENT)",
        "secondary_actor": "Cổng thanh toán VNPay, Cơ sở y tế / Bác sĩ tiếp nhận",
        "pre_condition": "Người bệnh đã đăng nhập vào ứng dụng di động NovaCare, đã có ít nhất một hồ sơ người đi khám (PatientProfile) trong tài khoản.",
        "post_condition": "Lịch hẹn khám bệnh mới được tạo thành công với trạng thái CONFIRMED (nếu thanh toán thành công hoặc chọn trả sau). Hệ thống sinh mã đặt khám duy nhất (VD: NC-BK-1024), mã QR check-in tiếp đón tại viện và gửi thông báo nhắc nhở đến thiết bị người bệnh.",
        "main_flow": [
            (
                "1. Người bệnh truy cập màn hình Danh sách bác sĩ (DoctorListScreen) hoặc từ màn hình Chi tiết bác sĩ (DoctorDetailScreen), nhấn nút \"Đặt khám\".",
                "2. Hệ thống hiển thị giao diện Đặt khám theo bác sĩ (DoctorBookingScreen), tự động tải thông tin cơ sở làm việc, chuyên khoa và giá dịch vụ khám bệnh của bác sĩ."
            ),
            (
                "3. Người bệnh chọn ngày khám trong lịch tuần/tháng (chỉ những ngày bác sĩ có ca trực mới sáng đèn cho phép chọn).",
                "4. Hệ thống tải và hiển thị danh sách các khung giờ khám còn trống (Ca sáng: 08:00 - 11:30, Ca chiều: 13:30 - 17:00). Các khung giờ đã có người đặt trước sẽ bị làm mờ (disabled)."
            ),
            (
                "5. Người bệnh chọn một khung giờ khám còn trống phù hợp và nhấn \"Tiếp tục\".",
                "6. Hệ thống hiển thị màn hình Nhập thông tin đặt khám (BookingInfoContent): danh sách chọn hồ sơ người đi khám (Chính tôi, Người thân: Bố, Mẹ, Con...); trường nhập lý do khám bệnh và triệu chứng sơ bộ; bảng tùy chọn đồng ý chia sẻ hồ sơ bệnh án cũ (RecordConsentPanel: cho phép chọn thời hạn chia sẻ 30 phút, 2 giờ, 24 giờ hoặc không chia sẻ)."
            ),
            (
                "7. Người bệnh chọn hồ sơ khám, nhập lý do đi khám, thiết lập quyền chia sẻ bệnh án và nhấn \"Tiếp tục đến thanh toán\".",
                "8. Hệ thống tính toán tổng chi phí (tiền khám, phí tiện ích hệ thống, bảo hiểm y tế khấu trừ nếu áp dụng) và hiển thị các phương thức thanh toán: Thanh toán qua Cổng VNPAY (Ví điện tử / Thẻ ATM nội địa / Thẻ quốc tế / QR Pay) hoặc Thanh toán trực tiếp tại quầy tiếp đón của bệnh viện/phòng khám."
            ),
            (
                "9. Người bệnh chọn \"Cổng thanh toán VNPay\" và nhấn \"Xác nhận & Thanh toán\".",
                "10. Hệ thống tạo phiên giao dịch thanh toán, mở màn hình WebView VNPay (PaymentScreen). Người bệnh thực hiện xác thực giao dịch trên cổng thanh toán của ngân hàng."
            ),
            (
                "11. Người bệnh hoàn tất xác thực thanh toán thành công.",
                "12. Cổng thanh toán phản hồi giao dịch thành công (mã vnp_ResponseCode = 00). Hệ thống cập nhật trạng thái lịch hẹn thành CONFIRMED, tạo bản ghi hóa đơn và điều hướng sang màn hình Xác nhận đặt khám thành công: hiển thị mã lịch hẹn (NC-BK-XXXX), mã QR Check-in dùng để quét tại Kiosk tiếp đón tự động của bệnh viện, thông tin thời gian, phòng khám và hướng dẫn di chuyển."
            )
        ],
        "alternate_flow": [
            (
                "4.1. Trong lúc người bệnh đang thao tác, khung giờ đã chọn vừa bị một bệnh nhân khác đặt thành công trước đó (xung đột dữ liệu lịch hẹn - Conflict 409).",
                "5.1. Hệ thống hiển thị thông báo: \"Khung giờ này vừa có người đặt. Vui lòng chọn một khung giờ khám khác\" và tự động làm mới danh sách ca khám."
            ),
            (
                "10.1. Người bệnh hủy giao dịch thanh toán VNPay hoặc tài khoản ngân hàng không đủ số dư / giao dịch quá thời hạn 15 phút.",
                "11.1. Cổng VNPay trả về mã lỗi không thành công. Hệ thống cập nhật lịch hẹn về trạng thái PENDING_PAYMENT (Chờ thanh toán trong vòng 15 phút) và hiển thị thông báo: \"Giao dịch thanh toán chưa hoàn tất. Bạn có thể thanh toán lại trong vòng 15 phút tại mục Chi tiết lịch hẹn hoặc hủy lịch\"."
            ),
            (
                "8.1. Người bệnh chọn phương thức \"Thanh toán trực tiếp tại cơ sở y tế\".",
                "9.1. Hệ thống bỏ qua bước chuyển hướng VNPay, tạo ngay lịch hẹn với trạng thái CONFIRMED kèm ghi chú \"Thanh toán tại quầy\", nhắc nhở bệnh nhân đến trước giờ hẹn 15-30 phút để hoàn tất thủ tục viện phí."
            )
        ]
    },

    # -------------------------------------------------------------
    # UC 4: Đặt khám cơ sở
    # -------------------------------------------------------------
    {
        "id": "UC-PAT-04",
        "name": "UC-PAT-04: Đặt lịch khám bệnh theo cơ sở y tế / Bệnh viện",
        "description": "Người bệnh chọn bệnh viện hoặc phòng khám mong muốn, chọn hình thức đặt khám (theo chuyên khoa hoặc theo bác sĩ trực thuộc cơ sở), chọn dịch vụ khám (khám thường, khám VIP, gói dịch vụ), lựa chọn ngày giờ, hồ sơ khám bệnh, tiến hành thanh toán và nhận phiếu đặt khám.",
        "primary_actor": "Người bệnh (PATIENT)",
        "secondary_actor": "Cơ sở y tế tiếp nhận, Cổng thanh toán VNPay",
        "pre_condition": "Người bệnh đã đăng nhập ứng dụng NovaCare, đã có hồ sơ người khám trong hệ thống.",
        "post_condition": "Phiếu đăng ký khám tại bệnh viện được khởi tạo thành công, mã tiếp đón điện tử được đồng bộ với hệ thống HIS (Hospital Information System) của cơ sở y tế.",
        "main_flow": [
            (
                "1. Người bệnh chọn mục \"Đặt khám cơ sở\" từ màn hình chính hoặc chọn một bệnh viện từ danh sách tìm kiếm.",
                "2. Hệ thống mở màn hình Đặt khám cơ sở (HospitalFacilityBookingScreen), hiển thị thông tin tổng quan của cơ sở y tế (địa chỉ, hình ảnh, thời gian hoạt động) và 2 phương thức lựa chọn khám tại cơ sở: Đặt khám theo Chuyên khoa hoặc Đặt khám theo Bác sĩ đang công tác tại viện."
            ),
            (
                "3. Người bệnh chọn phương thức \"Đặt khám theo Chuyên khoa\", sau đó chọn Chuyên khoa cần khám (VD: Khoa Tai Mũi Họng).",
                "4. Hệ thống tải danh mục phòng khám, gói dịch vụ khám (Khám tiêu chuẩn, Khám dịch vụ, Khám chuyên gia) và lịch làm việc của khoa tại cơ sở."
            ),
            (
                "5. Người bệnh chọn gói dịch vụ/phòng khám, chọn ngày khám và khung giờ mong muốn trong danh sách ca khám khả dụng.",
                "6. Hệ thống hiển thị biểu mẫu xác nhận thông tin: người bệnh chọn hồ sơ người đi khám, điền lý do và triệu chứng ban đầu, chọn chính sách ủy quyền hồ sơ bệnh án cũ."
            ),
            (
                "7. Người bệnh hoàn tất thông tin và nhấn \"Tiếp tục đến thanh toán\".",
                "8. Hệ thống hiển thị bảng kê viện phí dự kiến và chuyển sang bước chọn phương thức thanh toán (VNPay hoặc tại quầy)."
            ),
            (
                "9. Người bệnh xác nhận thông tin đặt khám và hoàn tất thanh toán.",
                "10. Hệ thống lưu lịch hẹn, cấp mã phiếu khám và hiển thị sơ đồ đường đi, số phòng khám tiếp đón tại cơ sở y tế."
            )
        ],
        "alternate_flow": [
            (
                "4.1. Chuyên khoa đã chọn tạm ngưng nhận bệnh nhân trong ngày được yêu cầu do vượt quá công suất tiếp nhận (hết số).",
                "5.1. Hệ thống hiển thị cảnh báo: \"Khoa đã kín lịch khám trong ngày được chọn. Vui lòng chọn ngày khám khác hoặc đăng ký khám chuyên gia\"."
            ),
            (
                "6.1. Người bệnh chưa tạo bất kỳ hồ sơ khám bệnh nào trong tài khoản.",
                "7.1. Hệ thống tự động kích hoạt hộp thoại FullProfileFormDialog để người dùng tạo nhanh hồ sơ trước khi tiếp tục đặt khám."
            )
        ]
    },

    # -------------------------------------------------------------
    # UC 5: Đặt khám chuyên khoa
    # -------------------------------------------------------------
    {
        "id": "UC-PAT-05",
        "name": "UC-PAT-05: Đặt lịch khám bệnh theo chuyên khoa y tế",
        "description": "Người bệnh duyệt danh mục các chuyên khoa y tế (Nội khoa, Nhi khoa, Da liễu, Tim mạch...), chọn một chuyên khoa phù hợp với nhu cầu, hệ thống hiển thị danh sách các bác sĩ và bệnh viện có chuyên khoa tương ứng, cho phép lọc kết quả theo tiêu chí và tiến hành đặt lịch khám liền mạch.",
        "primary_actor": "Người bệnh (PATIENT)",
        "secondary_actor": "Cơ sở y tế, Cổng thanh toán VNPay",
        "pre_condition": "Người bệnh đã cài đặt và đăng nhập ứng dụng NovaCare.",
        "post_condition": "Người bệnh hoàn tất quy trình đặt khám với chuyên khoa đã định hướng, nhận mã xác nhận lịch khám thành công.",
        "main_flow": [
            (
                "1. Người bệnh chọn mục \"Chuyên khoa\" trên trang chủ hoặc thanh điều hướng.",
                "2. Hệ thống mở màn hình Danh mục chuyên khoa (SpecialtyCatalogScreen), hiển thị lưới các chuyên khoa y tế kèm biểu tượng đại diện và số lượng bác sĩ/cơ sở trực thuộc."
            ),
            (
                "3. Người bệnh nhấn chọn một chuyên khoa (VD: \"Tim mạch\").",
                "4. Hệ thống chuyển sang màn hình Kết quả chuyên khoa (SpecialtyResultsScreen), hiển thị 2 tab nội dung: Tab \"Bác sĩ\" (Danh sách các bác sĩ chuyên khoa Tim mạch được đánh giá cao) và Tab \"Cơ sở y tế\" (Danh sách các bệnh viện và phòng khám có chuyên khoa Tim mạch)."
            ),
            (
                "5. Người bệnh có thể nhấn mở bộ lọc nâng cao (FilterSheet) để lọc theo: Đánh giá (từ 4.5 sao trở lên), Tỉnh/Thành phố, Mức phí khám và nhấn \"Áp dụng\".",
                "6. Hệ thống cập nhật danh sách hiển thị theo đúng tiêu chí lọc."
            ),
            (
                "7. Người bệnh chọn một bác sĩ hoặc một cơ sở y tế trong danh sách.",
                "8. Hệ thống điều hướng liền mạch vào hành trình đặt lịch khám (BookingJourney), tự động điền sẵn chuyên khoa đã chọn, yêu cầu người bệnh chọn ngày giờ, hồ sơ khám và thanh toán."
            ),
            (
                "9. Người bệnh hoàn tất thanh toán và xác nhận lịch hẹn.",
                "10. Hệ thống lưu trữ lịch hẹn thành công và xuất trình mã đặt khám cùng hướng dẫn tới khám."
            )
        ],
        "alternate_flow": [
            (
                "4.1. Không có bác sĩ hoặc cơ sở nào đáp ứng đủ tiêu chuẩn bộ lọc đã chọn trong khu vực lân cận.",
                "5.1. Hệ thống hiển thị giao diện thông báo rỗng kèm nút \"Đặt lại bộ lọc\" để người bệnh mở rộng phạm vi tìm kiếm."
            )
        ]
    },

    # -------------------------------------------------------------
    # UC 6: Gọi video với bác sĩ
    # -------------------------------------------------------------
    {
        "id": "UC-PAT-06",
        "name": "UC-PAT-06: Khám bệnh và tư vấn từ xa qua cuộc gọi Video (Telemedicine Call)",
        "description": "Người bệnh tham gia phòng khám trực tuyến với bác sĩ chuyên khoa thông qua cuộc gọi truyền hình độ trễ thấp dựa trên giao thức WebRTC (LiveKit). Tính năng cho phép giao tiếp âm thanh, hình ảnh hai chiều, chia sẻ camera kiểm tra tổn thương lâm sàng, trò chuyện văn bản trong cuộc gọi, và nhận kết luận tư vấn, đơn thuốc điện tử ngay sau cuộc gọi.",
        "primary_actor": "Người bệnh (PATIENT)",
        "secondary_actor": "Bác sĩ khám từ xa, Máy chủ WebRTC LiveKit Media Server",
        "pre_condition": "Người bệnh có lịch hẹn tư vấn video hợp lệ ở trạng thái CONFIRMED, đang trong khung thời gian cho phép vào phòng khám (trước giờ hẹn 10 phút đến hết ca khám), thiết bị đã cấp quyền Camera và Microphone.",
        "post_condition": "Cuộc gọi kết thúc thành công, thời lượng cuộc gọi và bản ghi trạng thái hoàn thành được lưu vào lịch sử khám. Người bệnh nhận tóm tắt tư vấn và có thể đánh giá chất lượng buổi khám.",
        "main_flow": [
            (
                "1. Đến giờ hẹn, người bệnh mở ứng dụng NovaCare, nhấn vào thông báo nhắc lịch khám hoặc tại màn hình Chi tiết lịch hẹn nhấn nút \"Vào phòng khám video\".",
                "2. Hệ thống kiểm tra quyền phần cứng thiết bị (Manifest.permission.CAMERA và RECORD_AUDIO). Nếu đã có quyền, hệ thống gửi yêu cầu lên máy chủ để xin cấp mã chứng thực phòng khám LiveKit (roomToken)."
            ),
            (
                "3. Người bệnh xác nhận gia nhập phòng khám.",
                "4. Hệ thống mở màn hình Cuộc gọi video (ConsultationVideoScreen), kết nối WebRTC với máy chủ LiveKit và hiển thị giao diện phòng khám video: khung chính hiển thị video trực tiếp của Bác sĩ; khung phụ (PiP) hiển thị video camera của người bệnh; thanh điều khiển gồm nút Bật/Tắt Micro, Bật/Tắt Camera, Đổi camera trước/sau, Chọn thiết bị âm thanh và Mở khung chat tin nhắn nhanh trong phòng khám."
            ),
            (
                "5. Bác sĩ và người bệnh trao đổi trực tiếp về bệnh sử, triệu chứng lâm sàng. Người bệnh có thể chuyển sang camera sau để soi rõ vùng da tổn thương hoặc gửi thêm ảnh chụp kết quả xét nghiệm qua khay tin nhắn đính kèm trong cuộc gọi.",
                "6. Hệ thống duy trì đường truyền video/âm thanh ổn định, mã hóa đầu cuối và hiển thị đồng hồ đếm thời lượng cuộc gọi thực tế."
            ),
            (
                "7. Sau khi kết thúc nội dung tư vấn, người bệnh (hoặc bác sĩ) nhấn nút \"Kết thúc cuộc gọi\" (màu đỏ).",
                "8. Hệ thống hiển thị hộp thoại xác nhận kết thúc: \"Bạn có chắc chắn muốn rời phòng khám?\". Người bệnh nhấn \"Xác nhận kết thúc\"."
            ),
            (
                "9. Người bệnh xác nhận rời phòng.",
                "10. Hệ thống ngắt luồng kết nối WebRTC, giải phóng tài nguyên camera và micro, cập nhật trạng thái lịch hẹn thành COMPLETED, hiển thị hộp thoại Đánh giá buổi khám (chọn 1-5 sao, viết nhận xét góp ý) và nút xem Tóm tắt kết quả tư vấn / Đơn thuốc điện tử vừa được bác sĩ kê."
            )
        ],
        "alternate_flow": [
            (
                "2.1. Người bệnh từ chối cấp quyền truy cập Camera hoặc Microphone.",
                "3.1. Hệ thống hiển thị hộp thoại giải thích: \"Quyền Camera và Micro là bắt buộc để bác sĩ có thể nhìn thấy và trao đổi với bạn. Vui lòng cấp quyền trong Cài đặt ứng dụng\"."
            ),
            (
                "3.2. Bác sĩ chưa kịp vào phòng khám đúng giờ hẹn.",
                "4.1. Hệ thống hiển thị màn hình chờ với hiệu ứng sóng âm: \"Bác sĩ đang chuẩn bị vào phòng khám. Bạn vui lòng giữ kết nối trong ít phút...\", đồng thời gửi thông báo đẩy khẩn đến ứng dụng của bác sĩ."
            ),
            (
                "5.1. Kết nối mạng của người bệnh bị chập chờn hoặc mất kết nối đột ngột giữa chừng.",
                "5.2. Hệ thống hiển thị thanh thông báo màu vàng: \"Đang nỗ lực kết nối lại phòng khám...\", tự động tái thiết lập phiên WebRTC trong 30 giây. Nếu không thể khôi phục, hệ thống lưu thời lượng đã gọi và cung cấp nút \"Kết nối lại\"."
            )
        ]
    },

    # -------------------------------------------------------------
    # UC 7: Xem hồ sơ sức khỏe
    # -------------------------------------------------------------
    {
        "id": "UC-PAT-07",
        "name": "UC-PAT-07: Xem sổ theo dõi sức khỏe và bệnh án điện tử (EMR)",
        "description": "Người bệnh xem toàn diện hồ sơ sức khỏe cá nhân và các thành viên trong gia đình dưới dạng Sổ sức khỏe điện tử (PatientRecordBook), bao gồm: thông tin hành chính, chỉ số sinh tồn, nhóm máu, tiền sử dị ứng, bệnh mạn tính, lịch sử tiêm chủng và dòng thời gian các lần khám bệnh cũ kèm chẩn đoán, đơn thuốc và kết quả cận lâm sàng.",
        "primary_actor": "Người bệnh (PATIENT)",
        "secondary_actor": "Hệ thống cơ sở dữ liệu bệnh án điện tử NovaCare",
        "pre_condition": "Người bệnh đã đăng nhập vào ứng dụng di động, đã chọn một hồ sơ cần xem.",
        "post_condition": "Dữ liệu hồ sơ bệnh án được hiển thị trực quan, bảo mật và hỗ trợ xuất file tóm tắt hoặc chia sẻ nhanh.",
        "main_flow": [
            (
                "1. Người bệnh chọn mục \"Hồ sơ sức khỏe\" từ thanh điều hướng dưới hoặc từ màn hình Cá nhân.",
                "2. Hệ thống hiển thị màn hình Danh sách hồ sơ (ProfileListScreen) liệt kê các hồ sơ thuộc quyền quản lý (Chính tôi, Người thân: Bố, Mẹ, Con...)."
            ),
            (
                "3. Người bệnh chạm vào một thẻ hồ sơ cụ thể (VD: \"Nguyễn Văn A - Chính tôi\").",
                "4. Hệ thống tải dữ liệu chi tiết và mở màn hình Sổ sức khỏe người bệnh (PatientRecordBook), hiển thị các thẻ thông tin chuyên sâu: Thẻ Hành chính (họ tên, ngày sinh, CCCD, BHYT, địa chỉ); Thẻ Chỉ số lâm sàng nền tảng (nhóm máu ABO/Rh, chiều cao, cân nặng, BMI); Thẻ Cảnh báo y tế (tiền sử dị ứng thuốc/thức ăn, các bệnh mạn tính đang điều trị); Thẻ Lịch sử khám bệnh & Bệnh án điện tử (EMR History xếp theo dòng thời gian)."
            ),
            (
                "5. Người bệnh nhấn vào một lần khám cũ trong danh sách lịch sử bệnh án.",
                "6. Hệ thống mở rộng hiển thị chi tiết chẩn đoán ICD-10 của bác sĩ, kết quả cận lâm sàng (ảnh chụp X-quang, chỉ số xét nghiệm máu) và đơn thuốc điện tử (tên thuốc, hàm lượng, liều dùng, hướng dẫn uống)."
            )
        ],
        "alternate_flow": [
            (
                "4.1. Hồ sơ mới được tạo và chưa có bất kỳ lịch sử khám bệnh nào trước đây trên hệ thống.",
                "5.1. Tại mục Lịch sử khám bệnh, hệ thống hiển thị trạng thái rỗng thân thiện: \"Chưa có dữ liệu khám bệnh. Khi bạn hoàn tất các lần khám trên NovaCare, bệnh án điện tử sẽ tự động lưu trữ tại đây\"."
            ),
            (
                "4.2. Mất kết nối mạng khi tải dữ liệu chi tiết hồ sơ.",
                "4.3. Hệ thống nạp dữ liệu đã lưu trong bộ nhớ đệm ngoại tuyến (Offline Cache) trên điện thoại và hiển thị nhãn \"Dữ liệu ngoại tuyến - Cập nhật lúc...\"."
            )
        ]
    },

    # -------------------------------------------------------------
    # UC 8: Thêm hồ sơ sức khỏe
    # -------------------------------------------------------------
    {
        "id": "UC-PAT-08",
        "name": "UC-PAT-08: Thêm mới hồ sơ người đi khám (Gia đình / Người thân)",
        "description": "Người bệnh tạo thêm một hồ sơ người đi khám mới trực thuộc tài khoản của mình (dành cho con cái, cha mẹ, vợ/chồng hoặc người thân khác) để dễ dàng quản lý sức khỏe và đặt lịch khám hộ trên ứng dụng NovaCare.",
        "primary_actor": "Người bệnh (PATIENT)",
        "secondary_actor": "Không có",
        "pre_condition": "Người bệnh đã đăng nhập vào ứng dụng NovaCare.",
        "post_condition": "Bản ghi hồ sơ mới (PatientProfile) được tạo trong CSDL, liên kết với khóa ngoại userId của chủ tài khoản, hiển thị ngay lập tức trên danh sách hồ sơ gia đình.",
        "main_flow": [
            (
                "1. Tại màn hình Danh sách hồ sơ (ProfileListScreen), người bệnh nhấn nút \"Thêm hồ sơ mới\" (nút dấu cộng hoặc nút nổi góc phải).",
                "2. Hệ thống hiển thị hộp thoại biểu mẫu toàn diện (FullProfileFormDialog) gồm các trường thông tin hành chính và tiền sử y tế."
            ),
            (
                "3. Người bệnh nhập các thông tin hành chính bắt buộc: Mối quan hệ với chủ tài khoản (Cha, Mẹ, Vợ, Chồng, Con, Khác), Họ và tên đầy đủ, Ngày tháng năm sinh (chọn từ DatePicker), Giới tính, Số CMND/CCCD (12 chữ số), Mã thẻ BHYT (tùy chọn), Số điện thoại và Địa chỉ cư trú; cùng các thông tin tiền sử y tế ban đầu (Nhóm máu, Tiền sử dị ứng, Bệnh mạn tính).",
                "4. Hệ thống kiểm tra tính hợp lệ dữ liệu ngay khi người dùng nhập liệu (Client-side validation)."
            ),
            (
                "5. Người bệnh kiểm tra lại thông tin và nhấn nút \"Lưu hồ sơ\".",
                "6. Hệ thống gửi yêu cầu HTTP POST đến API /api/v1/patient-profiles. Máy chủ lưu trữ bản ghi vào bảng PatientProfile, đóng hộp thoại biểu mẫu, làm mới danh sách hồ sơ và hiển thị thông báo SnackBar: \"Thêm hồ sơ người đi khám thành công!\"."
            )
        ],
        "alternate_flow": [
            (
                "4.1. Người bệnh bỏ trống các trường bắt buộc (Họ tên, Mối quan hệ, Ngày sinh) hoặc nhập số CCCD sai định dạng (< 12 số).",
                "5.1. Hệ thống hiển thị thông báo lỗi màu đỏ trực quan dưới từng trường nhập liệu không hợp lệ và giữ nguyên dữ liệu đã nhập, không gửi yêu cầu lên máy chủ."
            ),
            (
                "6.1. Mã thẻ BHYT hoặc số CCCD nhập vào bị trùng lặp với một hồ sơ đã tồn tại trên hệ thống.",
                "6.2. Máy chủ phản hồi mã lỗi 409 Conflict, hệ thống hiển thị thông báo: \"Số CCCD hoặc BHYT này đã được đăng ký cho một hồ sơ khác trên hệ thống\"."
            )
        ]
    },

    # -------------------------------------------------------------
    # UC 9: Sửa hồ sơ sức khỏe
    # -------------------------------------------------------------
    {
        "id": "UC-PAT-09",
        "name": "UC-PAT-09: Chỉnh sửa thông tin hồ sơ người đi khám",
        "description": "Người bệnh cập nhật, điều chỉnh các thông tin hành chính (địa chỉ, số điện thoại, BHYT) hoặc bổ sung tiền sử bệnh nền, thông tin dị ứng mới của hồ sơ cá nhân hoặc người thân.",
        "primary_actor": "Người bệnh (PATIENT)",
        "secondary_actor": "Không có",
        "pre_condition": "Người bệnh đã đăng nhập, hồ sơ người đi khám cần sửa đang tồn tại trên tài khoản.",
        "post_condition": "Dữ liệu hồ sơ người đi khám được cập nhật đồng bộ trên hệ thống máy chủ và hiển thị chính xác ở các lần đặt khám tiếp theo.",
        "main_flow": [
            (
                "1. Tại màn hình Danh sách hồ sơ hoặc Sổ sức khỏe, người bệnh nhấn vào biểu tượng Chỉnh sửa (hình cây bút) trên thẻ hồ sơ cần sửa.",
                "2. Hệ thống mở hộp thoại FullProfileFormDialog, tự động điền sẵn toàn bộ dữ liệu hiện tại của hồ sơ vào các trường nhập liệu tương ứng."
            ),
            (
                "3. Người bệnh tiến hành thay đổi các trường thông tin cần điều chỉnh (đổi địa chỉ nơi ở mới, cập nhật mã thẻ BHYT mới gia hạn, bổ sung thuốc bị dị ứng mới phát hiện) và nhấn nút \"Cập nhật\".",
                "4. Hệ thống kiểm tra hợp lệ dữ liệu và gửi yêu cầu HTTP PUT đến /api/v1/patient-profiles/{profileId}."
            ),
            (
                "5. Người bệnh chờ phản hồi cập nhật từ máy chủ.",
                "6. Máy chủ xác thực quyền sở hữu hồ sơ của người dùng, tiến hành lưu trữ các thay đổi vào CSDL và phản hồi thành công. Hệ thống đóng hộp thoại, cập nhật giao diện hiển thị ngay lập tức và hiển thị thông báo: \"Đã cập nhật thông tin hồ sơ thành công\"."
            )
        ],
        "alternate_flow": [
            (
                "3.1. Người bệnh xóa trắng một trường thông tin bắt buộc (như Họ tên hoặc Ngày sinh).",
                "4.1. Hệ thống báo lỗi dữ liệu không hợp lệ và ngăn chặn hành động cập nhật."
            ),
            (
                "4.1. Mất kết nối mạng trong quá trình gửi yêu cầu cập nhật.",
                "5.1. Hệ thống báo lỗi: \"Không thể lưu thay đổi do lỗi đường truyền mạng. Vui lòng thử lại sau\"."
            )
        ]
    },

    # -------------------------------------------------------------
    # UC 10: Xóa hồ sơ sức khỏe
    # -------------------------------------------------------------
    {
        "id": "UC-PAT-10",
        "name": "UC-PAT-10: Xóa hồ sơ người đi khám trong gia đình",
        "description": "Người bệnh thực hiện xóa một hồ sơ thành viên người thân không còn nhu cầu quản lý khỏi tài khoản ứng dụng. Quy trình đảm bảo quy tắc nghiệp vụ: không cho phép xóa hồ sơ mặc định của chủ tài khoản và không cho phép xóa hồ sơ đang có lịch hẹn khám chưa hoàn tất.",
        "primary_actor": "Người bệnh (PATIENT)",
        "secondary_actor": "Không có",
        "pre_condition": "Người bệnh đã đăng nhập vào ứng dụng, tài khoản có ít nhất 2 hồ sơ (bao gồm hồ sơ chính và hồ sơ phụ muốn xóa).",
        "post_condition": "Bản ghi hồ sơ phụ bị đánh dấu xóa mềm (deletedAt được cập nhật) hoặc xóa hoàn toàn khỏi tài khoản, không còn xuất hiện trong danh sách chọn khi đặt khám.",
        "main_flow": [
            (
                "1. Người bệnh truy cập màn hình Danh sách hồ sơ (ProfileListScreen).",
                "2. Người bệnh tìm thẻ hồ sơ người thân cần xóa và nhấn vào biểu tượng Thùng rác (Xóa)."
            ),
            (
                "3. Hệ thống kiểm tra các ràng buộc nghiệp vụ: kiểm tra hồ sơ có phải mặc định (isDefault == true) hay không; kiểm tra hồ sơ có đang gắn với bất kỳ lịch hẹn khám nào ở trạng thái chờ khám (UPCOMING hoặc CONFIRMED) hay không.",
                "4. Khi đáp ứng đủ điều kiện, hệ thống hiển thị hộp thoại cảnh báo xác nhận xóa (AlertDialog): \"Bạn có chắc chắn muốn xóa hồ sơ của [Tên người thân]? Thao tác này không thể hoàn tác và các dữ liệu liên quan sẽ bị gỡ bỏ\"."
            ),
            (
                "5. Người bệnh nhấn nút \"Xác nhận xóa\" (nút màu đỏ).",
                "6. Hệ thống gửi yêu cầu HTTP DELETE đến /api/v1/patient-profiles/{profileId}. Máy chủ thực hiện xóa mềm bản ghi, ngắt liên kết và phản hồi mã 200 OK. Hệ thống loại bỏ thẻ hồ sơ khỏi danh sách hiển thị trên giao diện và hiển thị thông báo Toast: \"Đã xóa hồ sơ thành công\"."
            )
        ],
        "alternate_flow": [
            (
                "3.1. Người bệnh nhấn xóa hồ sơ mặc định của chính mình (isDefault == true).",
                "3.2. Hệ thống từ chối hành động và hiển thị cảnh báo: \"Không thể xóa hồ sơ mặc định của chủ tài khoản. Bạn chỉ có thể chỉnh sửa thông tin hồ sơ này\"."
            ),
            (
                "3.3. Hồ sơ đang có lịch khám bệnh sắp diễn ra trong tương lai.",
                "3.4. Hệ thống chặn thao tác xóa và hiển thị thông báo: \"Hồ sơ này hiện đang có lịch hẹn khám sắp tới. Vui lòng hoàn thành hoặc hủy lịch hẹn trước khi xóa hồ sơ\"."
            )
        ]
    },

    # -------------------------------------------------------------
    # UC 11: Chia sẻ hồ sơ bệnh án cũ
    # -------------------------------------------------------------
    {
        "id": "UC-PAT-11",
        "name": "UC-PAT-11: Chia sẻ hồ sơ bệnh án bằng Hộ chiếu y tế số (Medical Passport Share)",
        "description": "Người bệnh chủ động cấp quyền truy cập tạm thời vào hồ sơ sức khỏe và bệnh án cũ của mình cho bác sĩ hoặc bệnh viện tiếp nhận thông qua mã QR động và mã bảo mật PIN 4 số, với thời hạn hiệu lực kiểm soát chặt chẽ (30 phút, 2 giờ hoặc 24 giờ) theo chuẩn an toàn dữ liệu y tế.",
        "primary_actor": "Người bệnh (PATIENT)",
        "secondary_actor": "Bác sĩ / Bệnh viện tiếp nhận quét mã, Hệ thống mã hóa bảo mật NovaCare",
        "pre_condition": "Người bệnh đã đăng nhập vào ứng dụng, hồ sơ y tế có dữ liệu lịch sử khám bệnh.",
        "post_condition": "Một mã thông báo ủy quyền (ShareToken) kèm chữ ký số và mã PIN 4 số được sinh ra, liên kết với hồ sơ người bệnh và có hiệu lực theo thời gian đã chọn. Mã QR động được hiển thị sẵn sàng cho bác sĩ quét.",
        "main_flow": [
            (
                "1. Tại màn hình Chi tiết lịch hẹn hoặc Sổ sức khỏe, người bệnh nhấn nút \"Chia sẻ hồ sơ bệnh án\" hoặc \"Hộ chiếu y tế số\".",
                "2. Hệ thống mở hộp thoại Chia sẻ Hộ chiếu y tế (MedicalPassportShareDialog), hiển thị các tùy chọn thời hạn chia sẻ an toàn: 30 phút (trực tiếp tại phòng khám), 2 giờ (khám tổng quát/xét nghiệm) hoặc 24 giờ (nội trú/theo dõi)."
            ),
            (
                "3. Người bệnh chọn mốc thời gian mong muốn (VD: \"30 phút\") và nhấn nút \"Tạo mã chia sẻ an toàn\".",
                "4. Hệ thống gọi API POST /api/v1/patient/shares/generate: tạo mã thông báo ủy quyền duy nhất (SHR-XXXXXX), tạo mã PIN ngẫu nhiên 4 chữ số, thiết lập thời điểm hết hạn và sinh mã QR động có mã hóa."
            ),
            (
                "5. Người bệnh đưa mã cho bác sĩ tiếp nhận quét.",
                "6. Hệ thống hiển thị trên màn hình: mã QR động to rõ ở trung tâm kèm viền bảo mật; mã xác thực PIN 4 số in đậm nổi bật ngay bên dưới mã QR; mã chuỗi ủy quyền (SHR-XXXXXX) kèm nút sao chép; đồng hồ đếm ngược thời gian còn hiệu lực và hướng dẫn thao tác."
            ),
            (
                "7. Bác sĩ quét mã QR và nhập đúng mã PIN 4 số trên ứng dụng NovaCare Doctor để mở quyền xem bệnh án cũ.",
                "8. Hệ thống xác thực mã PIN và cấp quyền xem hồ sơ bệnh án trong đúng phạm vi thời hạn đã cấp."
            )
        ],
        "alternate_flow": [
            (
                "4.1. Lỗi kết nối mạng khi tạo mã chia sẻ.",
                "4.2. Hệ thống hiển thị thông báo lỗi và cho phép người bệnh nhấn \"Thử lại\"."
            ),
            (
                "6.1. Thời gian hiệu lực đếm ngược về 0 (hết hạn).",
                "6.2. Mã QR tự động bị làm mờ, xuất hiện nhãn \"Mã chia sẻ đã hết hạn\" kèm nút \"Tạo mã mới\" để bảo vệ an toàn thông tin bệnh nhân."
            )
        ]
    },

    # -------------------------------------------------------------
    # UC 12: Xem quyền đã cấp và nhật ký bệnh viện truy cập
    # -------------------------------------------------------------
    {
        "id": "UC-PAT-12",
        "name": "UC-PAT-12: Quản lý quyền chia sẻ và nhật ký bệnh viện truy cập hồ sơ",
        "description": "Người bệnh kiểm tra danh sách các quyền chia sẻ hồ sơ bệnh án đang còn hiệu lực, thực hiện thu hồi quyền tức thì bất kỳ lúc nào nếu muốn ngắt kết nối, và xem nhật ký kiểm toán (Audit Log) ghi nhận chi tiết thời gian, danh tính bác sĩ và bệnh viện đã truy cập vào dữ liệu y tế của mình.",
        "primary_actor": "Người bệnh (PATIENT)",
        "secondary_actor": "Không có",
        "pre_condition": "Người bệnh đã đăng nhập vào ứng dụng di động NovaCare.",
        "post_condition": "Quyền truy cập được thu hồi ngay lập tức nếu người dùng thao tác hủy. Nhật ký truy cập được hiển thị minh bạch tuân thủ Nghị định 13/2023/NĐ-CP.",
        "main_flow": [
            (
                "1. Người bệnh mở màn hình Hộ chiếu y tế và chuyển sang tab \"Quyền đang cấp & Nhật ký truy cập\".",
                "2. Hệ thống gọi API GET /api/v1/patient/shares/active và GET /api/v1/patient/shares/logs, sau đó hiển thị giao diện gồm 2 phần: Phần 1 - Quyền chia sẻ đang hoạt động (danh sách mã chia sẻ chưa hết hạn, tên cơ sở tiếp nhận, đồng hồ đếm ngược thời gian còn lại, nút đỏ \"Thu hồi quyền ngay\"); Phần 2 - Nhật ký truy cập y tế (Audit Trail liệt kê dòng thời gian, tên bác sĩ, tên bệnh viện, hành động truy xuất và trạng thái)."
            ),
            (
                "3. Người bệnh xem chi tiết nhật ký để biết rõ ai đã truy xuất bệnh án của mình vào thời điểm nào.",
                "4. Hệ thống hiển thị đầy đủ chi tiết từng lượt truy cập với mốc thời gian chính xác."
            ),
            (
                "5. Người bệnh nhấn nút \"Thu hồi quyền ngay\" trên một thẻ chia sẻ đang hoạt động.",
                "6. Hệ thống hiển thị hộp thoại xác nhận thu hồi: \"Bạn có chắc chắn muốn ngắt quyền truy cập bệnh án của cơ sở này ngay lập tức?\". Người bệnh chọn \"Xác nhận thu hồi\"."
            ),
            (
                "7. Người bệnh xác nhận thu hồi quyền.",
                "8. Hệ thống gọi API DELETE /api/v1/patient/shares/{shareId}/revoke. Máy chủ đánh dấu vô hiệu hóa ShareToken ngay tức khắc trong Redis và CSDL. Hệ thống cập nhật giao diện, chuyển trạng thái thẻ thành \"Đã thu hồi\" và ngắt quyền truy cập phía bác sĩ."
            )
        ],
        "alternate_flow": [
            (
                "2.1. Người bệnh kiểm tra khi không có quyền chia sẻ nào đang hoạt động.",
                "2.2. Hệ thống hiển thị thông báo trạng thái an toàn: \"Hiện tại không có cơ sở y tế nào được cấp quyền truy cập dữ liệu của bạn\"."
            )
        ]
    },

    # -------------------------------------------------------------
    # UC 13: Xem danh sách lịch khám
    # -------------------------------------------------------------
    {
        "id": "UC-PAT-13",
        "name": "UC-PAT-13: Xem danh sách lịch hẹn khám bệnh",
        "description": "Người bệnh theo dõi toàn bộ các lịch hẹn khám bệnh trực tiếp và khám video từ xa đã đăng ký trên hệ thống, phân loại theo 3 tab trạng thái rõ ràng (Sắp tới, Đã khám, Đã hủy) kèm tính năng kéo để làm mới danh sách.",
        "primary_actor": "Người bệnh (PATIENT)",
        "secondary_actor": "Không có",
        "pre_condition": "Người bệnh đã đăng nhập vào ứng dụng NovaCare.",
        "post_condition": "Danh sách lịch hẹn được hiển thị đầy đủ, cập nhật trạng thái mới nhất từ máy chủ.",
        "main_flow": [
            (
                "1. Người bệnh chạm vào biểu tượng \"Lịch khám\" trên thanh điều hướng chính ở đáy màn hình (BottomNavigationBar).",
                "2. Hệ thống mở màn hình Danh sách lịch khám (AppointmentListScreen), kích hoạt appointmentViewModel.loadAppointments() và hiển thị thanh phân loại gồm 3 Tab: Tab 1: \"Sắp tới\" (CONFIRMED, WAITING_CHECKIN, IN_PROGRESS); Tab 2: \"Đã khám\" (COMPLETED); Tab 3: \"Đã hủy\" (CANCELLED)."
            ),
            (
                "3. Người bệnh xem danh sách các thẻ lịch hẹn trên Tab đang chọn.",
                "4. Mỗi thẻ hiển thị đầy đủ: Mã đặt khám (NC-BK-XXXX), Hình thức khám (Khám tại viện / Khám Video Telemedicine), Tên Bác sĩ/Bệnh viện, Ngày giờ khám, Tên hồ sơ người đi khám và Huy hiệu trạng thái nổi bật."
            ),
            (
                "5. Người bệnh thực hiện thao tác vuốt từ trên xuống (Pull-to-Refresh) để cập nhật dữ liệu mới nhất.",
                "6. Hệ thống gửi yêu cầu làm mới dữ liệu lên máy chủ và cập nhật lại danh sách hiển thị."
            ),
            (
                "7. Người bệnh chạm vào một thẻ lịch hẹn bất kỳ.",
                "8. Hệ thống điều hướng sang màn hình Chi tiết lịch hẹn tương ứng."
            )
        ],
        "alternate_flow": [
            (
                "2.1. Tab đang xem không có bất kỳ lịch hẹn nào (danh sách rỗng).",
                "2.2. Hệ thống hiển thị hình minh họa trống kèm thông báo phù hợp (\"Bạn chưa có lịch khám nào sắp tới\") và nút kêu gọi hành động \"Đặt lịch khám ngay\"."
            ),
            (
                "2.3. Lỗi kết nối mạng khi tải danh sách lịch khám.",
                "2.4. Hệ thống hiển thị giao diện báo lỗi kèm nút \"Thử lại\"."
            )
        ]
    },

    # -------------------------------------------------------------
    # UC 14: Xem chi tiết lịch hẹn
    # -------------------------------------------------------------
    {
        "id": "UC-PAT-14",
        "name": "UC-PAT-14: Xem chi tiết lịch hẹn, quét mã Check-in và quản lý lịch khám",
        "description": "Người bệnh xem thông tin toàn diện về một cuộc hẹn khám (mã đặt chỗ, mã QR check-in, số thứ tự khám, dòng thời gian tiến trình khám, phòng khám, thông tin bác sĩ, hướng dẫn chuẩn bị trước khi khám), đồng thời có thể thực hiện đổi giờ khám, hủy lịch hẹn với lý do cụ thể hoặc xem bệnh án/đơn thuốc điện tử sau khi đã khám xong.",
        "primary_actor": "Người bệnh (PATIENT)",
        "secondary_actor": "Kiosk / Nhân viên tiếp đón bệnh viện, Hệ thống thông báo đẩy",
        "pre_condition": "Người bệnh đã đăng nhập và chọn một lịch hẹn cụ thể từ danh sách.",
        "post_condition": "Người bệnh nắm rõ thông tin tiếp đón, mã check-in được quét xác nhận tại quầy hoặc trạng thái lịch hẹn chuyển sang CANCELLED nếu người dùng thực hiện hủy.",
        "main_flow": [
            (
                "1. Tại màn hình Danh sách lịch khám, người bệnh nhấn vào một thẻ lịch hẹn cụ thể.",
                "2. Hệ thống mở màn hình Chi tiết lịch hẹn (AppointmentDetailScreen), hiển thị: Thẻ đầu trang (Mã NC-BK-XXXX, trạng thái, hình thức); Phân vùng Check-in tiếp đón (Mã QR Check-in điện tử động và Số thứ tự tiếp đón STT); Dòng thời gian tiến trình khám (5 mốc: Đặt lịch -> Xác nhận -> Đã Check-in -> Đang khám -> Hoàn tất); Thông tin Bác sĩ & Địa điểm (tên bác sĩ, viện, địa chỉ, số phòng khám, nút xem bản đồ); Thông tin người đi khám & Thanh toán (tên bệnh nhân, BHYT, tổng viện phí, trạng thái thanh toán)."
            ),
            (
                "3. Người bệnh có thể thực hiện các thao tác quản lý theo trạng thái của lịch hẹn: Đổi giờ khám (chọn lại ngày/giờ khác còn trống); Vào phòng khám video (nếu là hình thức Telemedicine); Xem bệnh án & Đơn thuốc (MedicalRecordDetailSheet nếu đã hoàn thành); hoặc Hủy lịch khám.",
                "4. Hệ thống xử lý yêu cầu tương ứng của người bệnh."
            ),
            (
                "5. Người bệnh nhấn nút \"Hủy lịch khám\", chọn lý do hủy (Bận việc đột xuất, Đã khỏi bệnh, Đổi cơ sở...) và nhấn \"Xác nhận hủy\".",
                "6. Hệ thống gọi API hủy lịch, cập nhật trạng thái thành CANCELLED, hoàn trả suất khám vào danh sách trống của bác sĩ và gửi thông báo xác nhận hủy."
            )
        ],
        "alternate_flow": [
            (
                "5.1. Người bệnh thực hiện hủy lịch sát giờ hẹn (dưới 2 tiếng trước giờ khám).",
                "5.2. Hệ thống hiển thị hộp thoại cảnh báo về điều khoản hủy muộn và chính sách hoàn phí trước khi cho phép xác nhận hủy."
            ),
            (
                "3.1. Người bệnh nhấn \"Đổi giờ khám\".",
                "3.2. Hệ thống hiển thị bộ chọn ngày giờ mới của bác sĩ/cơ sở. Sau khi người bệnh chọn suất mới, hệ thống cập nhật lịch hẹn mà không cần thanh toán lại viện phí."
            )
        ]
    },

    # -------------------------------------------------------------
    # UC 15: Tìm kiếm đa tiêu chí
    # -------------------------------------------------------------
    {
        "id": "UC-PAT-15",
        "name": "UC-PAT-15: Tìm kiếm đa tiêu chí bác sĩ, cơ sở y tế và chuyên khoa (Universal Search)",
        "description": "Người bệnh tìm kiếm linh hoạt trên thanh tìm kiếm thông minh thông qua từ khóa tự do hoặc giọng nói, kết hợp bộ lọc đa tiêu chí (địa điểm, chuyên khoa, mức giá khám, đánh giá xếp hạng, loại hình bệnh viện) để tra cứu chính xác bác sĩ và cơ sở y tế theo nhu cầu.",
        "primary_actor": "Người bệnh (PATIENT)",
        "secondary_actor": "Không có",
        "pre_condition": "Ứng dụng đã khởi chạy và kết nối Internet.",
        "post_condition": "Danh sách kết quả phù hợp nhất được hiển thị phân loại rõ ràng, cho phép điều hướng trực tiếp vào màn hình chi tiết hoặc quy trình đặt khám.",
        "main_flow": [
            (
                "1. Tại Trang chủ, người bệnh chạm vào Thanh tìm kiếm (\"Tìm bác sĩ, bệnh viện, chuyên khoa...\").",
                "2. Hệ thống chuyển hướng sang màn hình Tìm kiếm tổng hợp (SearchScreen), hiển thị thanh tìm kiếm với nút Giọng nói (Micro) và nút xóa nhanh; khu vực Lịch sử tìm kiếm gần đây (RecentSearchesSection); danh sách gợi ý tìm kiếm phổ biến."
            ),
            (
                "3. Người bệnh nhập từ khóa tìm kiếm (VD: \"Tim mạch\" hoặc \"Nguyễn Văn B\") hoặc nhấn nút Micro để nói từ khóa.",
                "4. Hệ thống kích hoạt cơ chế Debounce (300ms sau khi ngừng gõ), tự động gửi truy vấn lên API /api/v1/search/universal?q=... và hiển thị kết quả theo các nhóm: Nhóm Bác sĩ (DoctorSearchItem: ảnh, học vị, họ tên, chuyên khoa, viện, sao, giá); Nhóm Cơ sở y tế (tên viện, địa chỉ, khoảng cách, đánh giá); Nhóm Chuyên khoa."
            ),
            (
                "5. Người bệnh có thể chạm vào biểu tượng Phễu lọc để mở khay bộ lọc chuyên sâu (SearchFilterSheet), tùy chỉnh: Khu vực/Tỉnh thành, Bán kính khoảng cách, Đánh giá (>= 4 sao), Mức giá khám, Loại hình cơ sở và nhấn \"Áp dụng bộ lọc\".",
                "6. Hệ thống lập tức đối soát dữ liệu và cập nhật danh sách kết quả phù hợp tiêu chí."
            ),
            (
                "7. Người bệnh chạm vào một kết quả tìm kiếm.",
                "8. Hệ thống điều hướng đến màn hình Chi tiết bác sĩ hoặc Chi tiết cơ sở y tế tương ứng."
            )
        ],
        "alternate_flow": [
            (
                "3.1. Người bệnh sử dụng tìm kiếm bằng giọng nói nhưng chưa cấp quyền ghi âm.",
                "3.2. Hệ thống hiển thị hộp thoại yêu cầu cấp quyền RECORD_AUDIO. Nếu bị từ chối, hệ thống hướng dẫn người dùng nhập liệu bằng bàn phím."
            ),
            (
                "4.1. Từ khóa tìm kiếm hoặc bộ lọc không khớp với bất kỳ dữ liệu nào trong hệ thống.",
                "4.2. Hệ thống hiển thị giao diện trạng thái rỗng: \"Không tìm thấy kết quả phù hợp cho '[Từ khóa]'\", gợi ý người dùng thử lại bằng từ khóa ngắn gọn hơn hoặc nhấn \"Đặt lại bộ lọc\"."
            )
        ]
    },

    # -------------------------------------------------------------
    # UC 16: Xem thông tin cơ sở
    # -------------------------------------------------------------
    {
        "id": "UC-PAT-16",
        "name": "UC-PAT-16: Xem thông tin chi tiết cơ sở y tế và bệnh viện",
        "description": "Người bệnh tra cứu toàn bộ thông tin giới thiệu, cơ sở vật chất, trang thiết bị y tế hiện đại, danh sách các chuyên khoa, đội ngũ bác sĩ công tác, thời gian làm việc và bản đồ đường đi của một bệnh viện hoặc phòng khám.",
        "primary_actor": "Người bệnh (PATIENT)",
        "secondary_actor": "Bản đồ Google Maps / MapBox",
        "pre_condition": "Người bệnh chọn một cơ sở y tế từ danh sách tìm kiếm, trang chủ hoặc chuyên khoa.",
        "post_condition": "Người bệnh nắm rõ năng lực y tế của bệnh viện và có thể bắt đầu quy trình đặt khám tại cơ sở này.",
        "main_flow": [
            (
                "1. Người bệnh chạm vào thẻ của một Bệnh viện / Phòng khám bất kỳ trên ứng dụng.",
                "2. Hệ thống mở giao diện Chi tiết cơ sở y tế (HospitalFacilityBookingScreen), hiển thị: Album ảnh trực quan của bệnh viện; Tên chính thức và biểu tượng xếp hạng/chứng chỉ; Địa chỉ chính xác kèm nút \"Chỉ đường trên Bản đồ\"; Hotline hỗ trợ, Giờ làm việc tiếp nhận bệnh nhân và số điện thoại cấp cứu 24/7; Giới thiệu tổng quan về quy mô và thế mạnh chuyên môn; Danh mục các Chuyên khoa mũi nhọn; Danh sách Bác sĩ tiêu biểu; Các phản hồi, đánh giá nhận xét thực tế từ người bệnh."
            ),
            (
                "3. Người bệnh duyệt xem thông tin chi tiết các chuyên khoa và bác sĩ của viện.",
                "4. Hệ thống hiển thị đầy đủ thông tin chi tiết theo từng danh mục."
            ),
            (
                "5. Người bệnh nhấn nút \"Đặt lịch khám tại cơ sở này\" ở chân màn hình.",
                "6. Hệ thống chuyển tiếp sang luồng Đặt khám cơ sở (UC-PAT-04) với mã bệnh viện được điền sẵn."
            )
        ],
        "alternate_flow": [
            (
                "2.1. Cơ sở y tế tạm thời ngừng tiếp nhận đặt lịch trực tuyến do đang trong thời gian bảo trì hệ thống tiếp đón.",
                "2.2. Hệ thống hiển thị dải thông báo màu cam ở đầu màn hình: \"Cơ sở y tế này hiện đang tạm ngưng nhận đặt khám trực tuyến. Vui lòng liên hệ số hotline bệnh viện để được hướng dẫn\"."
            )
        ]
    },

    # -------------------------------------------------------------
    # UC 17: Xem thông tin bác sĩ
    # -------------------------------------------------------------
    {
        "id": "UC-PAT-17",
        "name": "UC-PAT-17: Xem thông tin chi tiết và hồ sơ năng lực bác sĩ",
        "description": "Người bệnh tìm hiểu chi tiết về trình độ chuyên môn, quá trình đào tạo, học hàm học vị, số năm kinh nghiệm, các giải thưởng y khoa, biểu giá khám và đánh giá thực tế của cộng đồng bệnh nhân đối với một bác sĩ cụ thể trước khi quyết định đặt khám.",
        "primary_actor": "Người bệnh (PATIENT)",
        "secondary_actor": "Không có",
        "pre_condition": "Người bệnh chọn một bác sĩ từ màn hình tìm kiếm, danh mục chuyên khoa hoặc từ gợi ý sau khi sàng lọc AI.",
        "post_condition": "Người bệnh nắm đầy đủ hồ sơ năng lực của bác sĩ và có thể lựa chọn Đặt khám trực tiếp hoặc Gọi video khám từ xa với bác sĩ đó.",
        "main_flow": [
            (
                "1. Người bệnh chạm vào thẻ của một Bác sĩ từ danh sách bất kỳ.",
                "2. Hệ thống chuyển hướng sang màn hình Chi tiết bác sĩ (DoctorDetailScreen), gọi API GET /api/v1/doctors/{doctorId} và hiển thị: Ảnh chân dung kèm tích xanh xác minh danh tính; Học hàm học vị đầy đủ (PGS.TS.BS, BSCKII); Chuyên khoa chính và Bệnh viện/Phòng khám công tác; Chỉ số năng lực (Số năm kinh nghiệm, Đánh giá sao, Số lượt khám thành công); Tiểu sử chuyên môn, quá trình công tác, đào tạo; Mức phí khám niêm yết (Khám trực tiếp và Tư vấn video); Danh sách nhận xét từ bệnh nhân."
            ),
            (
                "3. Người bệnh xem xét biểu phí và nhận xét đánh giá của bác sĩ.",
                "4. Hệ thống hiển thị thanh tác vụ kép: Nút \"Gọi video\" (khám từ xa Telemedicine) và Nút \"Đặt khám\" (khám trực tiếp tại viện)."
            ),
            (
                "5. Người bệnh nhấn chọn nút \"Đặt khám\" (hoặc \"Gọi video\").",
                "6. Hệ thống chuyển tiếp liền mạch sang luồng đặt lịch khám tương ứng với thông tin bác sĩ đã được chọn sẵn."
            )
        ],
        "alternate_flow": [
            (
                "2.1. Bác sĩ tạm thời tắt chế độ nhận bệnh nhân mới trực tuyến do kín lịch hoặc đi công tác.",
                "2.2. Hệ thống hiển thị thông báo: \"Bác sĩ hiện không mở lịch khám trực tuyến trong tuần này\" và vô hiệu hóa nút đặt khám, đồng thời gợi ý danh sách các bác sĩ cùng chuyên khoa tương đương."
            )
        ]
    },

    # -------------------------------------------------------------
    # UC 18: Cập nhật ảnh đại diện
    # -------------------------------------------------------------
    {
        "id": "UC-PAT-18",
        "name": "UC-PAT-18: Cập nhật ảnh đại diện người dùng (User Avatar)",
        "description": "Người bệnh thay đổi ảnh đại diện tài khoản cá nhân trên ứng dụng NovaCare thông qua 3 cách thức linh hoạt: chọn ảnh có sẵn từ thư viện thiết bị di động, chọn ảnh đại diện mẫu từ bộ sưu tập chuẩn y tế của NovaCare, hoặc xóa ảnh đại diện để quay về ký tự viết tắt mặc định.",
        "primary_actor": "Người bệnh (PATIENT)",
        "secondary_actor": "Trình chọn tệp hệ điều hành Android (Android Photo Picker / Gallery Launcher), Dịch vụ lưu trữ máy chủ NovaCare",
        "pre_condition": "Người bệnh đã đăng nhập vào tài khoản trên ứng dụng.",
        "post_condition": "Ảnh đại diện mới được cập nhật trên giao diện ứng dụng, đồng bộ lên CSDL máy chủ và hiển thị trên toàn bộ các màn hình (Trang chủ, Cài đặt, Lịch khám).",
        "main_flow": [
            (
                "1. Người bệnh chuyển sang tab \"Cài đặt\" (SettingsScreen) từ thanh điều hướng dưới.",
                "2. Tại khu vực đầu trang hiển thị thông tin tài khoản, người bệnh chạm vào Ảnh đại diện hiện tại hoặc biểu tượng Camera nhỏ cạnh ảnh."
            ),
            (
                "3. Hệ thống mở bảng trượt từ dưới lên (ModalBottomSheet: \"Đổi ảnh đại diện\"), hiển thị khung xem trước ảnh hiện tại và 3 tùy chọn: Lựa chọn 1: Nút \"Chọn ảnh từ thư viện thiết bị\"; Lựa chọn 2: Danh mục \"Hoặc chọn từ bộ sưu tập avatar NovaCare\" (6 ảnh mẫu y tế); Lựa chọn 3: Nút \"Xóa ảnh đại diện\" (nếu đang có ảnh tùy chỉnh).",
                "4. Hệ thống chờ thao tác lựa chọn của người bệnh."
            ),
            (
                "5. Người bệnh thực hiện chọn ảnh (chọn ảnh từ Thư viện qua galleryLauncher, hoặc chạm chọn 1 avatar mẫu, hoặc nhấn Xóa ảnh đại diện).",
                "6. Hệ thống gửi ảnh hoặc đường dẫn URL cập nhật lên máy chủ thông qua authViewModel.updateAvatar(). Máy chủ cập nhật trường avatarUrl và phản hồi thành công. Hệ thống tự động đóng bảng trượt BottomSheet, hiển thị thông báo SnackBar: \"Cập nhật ảnh đại diện thành công\" và làm mới giao diện hiển thị ảnh tức thì."
            )
        ],
        "alternate_flow": [
            (
                "5.1. Người bệnh mở thư viện ảnh nhưng nhấn nút \"Quay lại\" mà không chọn tấm ảnh nào.",
                "5.2. Hệ thống giữ nguyên ảnh đại diện hiện tại và giữ mở BottomSheet để người dùng tiếp tục thao tác nếu muốn."
            ),
            (
                "5.3. Tệp ảnh người dùng chọn bị lỗi hoặc dung lượng vượt quá giới hạn tối đa cho phép (5MB).",
                "5.4. Hệ thống hiển thị thông báo lỗi: \"Tệp ảnh không hợp lệ hoặc dung lượng vượt quá 5MB. Vui lòng chọn ảnh khác\"."
            )
        ]
    },

    # -------------------------------------------------------------
    # UC 19: Xem thông báo
    # -------------------------------------------------------------
    {
        "id": "UC-PAT-19",
        "name": "UC-PAT-19: Xem và quản lý thông báo hệ thống (Notification Center)",
        "description": "Người bệnh xem danh sách các thông báo đẩy tự động từ hệ thống (xác nhận lịch khám, nhắc nhở trước giờ hẹn, tin nhắn từ bác sĩ, thông báo đơn thuốc và bệnh án điện tử sẵn sàng), đánh dấu đã đọc từng thông báo hoặc đọc tất cả, và chạm vào thông báo để điều hướng trực tiếp đến màn hình chi tiết liên quan.",
        "primary_actor": "Người bệnh (PATIENT)",
        "secondary_actor": "Dịch vụ thông báo đẩy Firebase Cloud Messaging (FCM)",
        "pre_condition": "Người bệnh đã đăng nhập vào ứng dụng di động NovaCare.",
        "post_condition": "Trạng thái đã đọc (isRead = true) của các thông báo được đồng bộ về máy chủ, số lượng thông báo chưa đọc (Badge count) trên icon chuông được xóa về 0.",
        "main_flow": [
            (
                "1. Người bệnh chạm vào biểu tượng Chiếc chuông (Thông báo) ở góc trên thanh công cụ của Trang chủ hoặc màn hình Cài đặt.",
                "2. Hệ thống mở màn hình Trung tâm thông báo (NotificationScreen), tải danh sách thông báo qua API GET /api/v1/notifications và hiển thị danh sách thông báo theo thứ tự mới nhất (Lịch hẹn: BOOKING_CONFIRMED, REMINDER, CANCELLED; Khám từ xa: CONSULTATION_MESSAGE, CONSULTATION_STATUS; Y tế: EMR_READY; mỗi mục có icon riêng và chấm tròn xanh thể hiện chưa đọc)."
            ),
            (
                "3. Người bệnh có thể nhấn nút \"Đọc tất cả\" ở góc phải thanh tiêu đề.",
                "4. Hệ thống gọi API markAllAsRead(), chuyển toàn bộ thông báo về trạng thái đã đọc và xóa các chấm tròn xanh."
            ),
            (
                "5. Người bệnh chạm vào một mục thông báo cụ thể.",
                "6. Hệ thống đánh dấu thông báo này là đã đọc, giải mã tham số kèm theo (consultationId hoặc appointmentId) và điều hướng trực tiếp đến màn hình tương ứng (ConsultationChatScreen hoặc AppointmentDetailScreen)."
            )
        ],
        "alternate_flow": [
            (
                "2.1. Hộp thư thông báo của người bệnh đang trống (chưa có thông báo nào).",
                "2.2. Hệ thống hiển thị hình ảnh biểu tượng thông báo rỗng kèm dòng chữ: \"Không có thông báo nào. Các cập nhật về lịch hẹn và kết quả khám bệnh sẽ xuất hiện tại đây\"."
            ),
            (
                "2.3. Lỗi kết nối mạng khi tải danh sách thông báo.",
                "2.4. Hệ thống hiển thị thông báo lỗi màu đỏ kèm nút \"Thử lại\"."
            )
        ]
    },

    # -------------------------------------------------------------
    # UC 20: Xem điều khoản và chính sách bảo mật
    # -------------------------------------------------------------
    {
        "id": "UC-PAT-20",
        "name": "UC-PAT-20: Xem điều khoản sử dụng và chính sách bảo mật dữ liệu y tế",
        "description": "Người bệnh tra cứu chi tiết bản Điều khoản sử dụng và Chính sách bảo mật dữ liệu y tế của nền tảng NovaCare, được xây dựng tuân thủ nghiêm ngặt theo Nghị định số 13/2023/NĐ-CP của Chính phủ về Bảo vệ dữ liệu cá nhân, để hiểu rõ quyền hạn và cách thức dữ liệu sức khỏe của mình được mã hóa và bảo vệ.",
        "primary_actor": "Người bệnh (PATIENT)",
        "secondary_actor": "Không có",
        "pre_condition": "Người bệnh đang sử dụng ứng dụng di động NovaCare.",
        "post_condition": "Người bệnh hiểu rõ quyền của chủ thể dữ liệu y tế, chính sách mã hóa bảo vệ và trách nhiệm bảo mật thông tin tài khoản.",
        "main_flow": [
            (
                "1. Người bệnh mở màn hình Cài đặt (SettingsScreen), tìm nhóm danh mục \"Về NovaCare & Pháp lý\" và chạm vào mục \"Điều khoản & Chính sách bảo mật\".",
                "2. Hệ thống mở bảng thông tin trượt từ đáy màn hình (ModalBottomSheet: \"Chính Sách Bảo Mật • Hệ thống Y tế Số NovaCare • Nghị định 13\")."
            ),
            (
                "3. Người bệnh cuộn xem các điều khoản pháp lý.",
                "4. Hệ thống hiển thị văn bản pháp lý có cấu trúc rõ ràng: Điều 1 - Mục đích thu thập dữ liệu y tế cá nhân; Điều 2 - Tiêu chuẩn mã hóa và lưu trữ an toàn (SSL/TLS 1.3, AES-256 tĩnh, Argon2id mật khẩu); Điều 3 - Quyền của chủ thể dữ liệu (quyền truy cập, chia sẻ Hộ chiếu y tế, thu hồi quyền, yêu cầu xóa dữ liệu); Điều 4 - Cam kết tuyệt đối không bán hoặc chia sẻ dữ liệu y tế cho bên thứ ba vì mục đích thương mại."
            ),
            (
                "5. Người bệnh đọc nội dung và nhấn nút \"Đã hiểu & Đồng ý\" (hoặc nút X để đóng).",
                "6. Hệ thống đóng bảng trượt BottomSheet và đưa người dùng trở lại màn hình Cài đặt an toàn."
            )
        ],
        "alternate_flow": [
            (
                "5.1. Người bệnh chạm vào vùng không gian bên ngoài bảng trượt hoặc nhấn phím Back vật lý trên điện thoại.",
                "5.2. Hệ thống đóng bảng trượt một cách an toàn mà không làm mất trạng thái của màn hình Cài đặt."
            )
        ]
    },

    # -------------------------------------------------------------
    # UC 21: Xem tiêu chuẩn an toàn y tế
    # -------------------------------------------------------------
    {
        "id": "UC-PAT-21",
        "name": "UC-PAT-21: Xem tiêu chuẩn an toàn y tế và cam kết chất lượng dịch vụ",
        "description": "Người bệnh xem thông báo tiêu chuẩn an toàn y tế và các cam kết cốt lõi của NovaCare về tuân thủ quy định Bộ Y tế trong hoạt động khám bệnh từ xa (Telemedicine), liên thông bệnh án điện tử (EMR) và chính sách tuyệt đối không lưu trữ dữ liệu thanh toán nhạy cảm của bệnh nhân.",
        "primary_actor": "Người bệnh (PATIENT)",
        "secondary_actor": "Không có",
        "pre_condition": "Người bệnh đang sử dụng ứng dụng di động NovaCare.",
        "post_condition": "Người bệnh an tâm về tính pháp lý và độ an toàn kỹ thuật y tế của hệ thống.",
        "main_flow": [
            (
                "1. Người bệnh mở màn hình Cài đặt (SettingsScreen), trong nhóm thông tin nhấn vào mục \"Tiêu chuẩn an toàn y tế\" (kèm icon Khiên bảo vệ Shield).",
                "2. Hệ thống hiển thị hộp thoại cảnh báo tiêu chuẩn an toàn (AlertDialog: \"Tiêu Chuẩn An Toàn Y Tế NovaCare\")."
            ),
            (
                "3. Người bệnh đọc 4 cam kết chất lượng y tế cốt lõi.",
                "4. Hệ thống hiển thị: Cam kết 1 - Tuân thủ nghiêm ngặt Nghị định số 13/2023/NĐ-CP về Bảo vệ dữ liệu cá nhân y tế; Cam kết 2 - Mã hóa đường truyền SSL/TLS 1.3 và mã hóa dữ liệu tĩnh AES-256; Cam kết 3 - Đáp ứng toàn diện tiêu chuẩn liên thông Bệnh án điện tử (EMR) và khám từ xa (Telemedicine) của Bộ Y tế; Cam kết 4 - Tuyệt đối không lưu trữ thông tin số thẻ ngân hàng hay mã CVV của bệnh nhân."
            ),
            (
                "5. Người bệnh nhấn nút \"Đã hiểu\" (nút màu xanh).",
                "6. Hệ thống đóng hộp thoại và hoàn tất thao tác tra cứu."
            )
        ],
        "alternate_flow": [
            (
                "5.1. Người bệnh chạm vào khoảng không gian bên ngoài hộp thoại hoặc nhấn phím Back.",
                "5.2. Hệ thống tự động đóng hộp thoại an toàn."
            )
        ]
    }
]
