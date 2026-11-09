# -*- coding: utf-8 -*-

USECASES_PART1 = [
    # ── PHÂN HỆ 1: XÁC THỰC & QUẢN LÝ TÀI KHOẢN
    {
        "name": "UC-AUTH-01: Đăng ký tài khoản qua OTP",
        "description": "Người dùng đăng ký tài khoản mới trên hệ thống NovaCare bằng số điện thoại hoặc email thông qua quy trình xác thực mã OTP ngẫu nhiên gửi qua SMS/Email.",
        "primary_actor": "Khách vãng lai (Guest)",
        "secondary_actor": "Dịch vụ gửi thông báo SMTP / SMS",
        "pre_condition": "Người dùng chưa đăng nhập, thiết bị có kết nối mạng Internet, số điện thoại hoặc email chưa từng đăng ký tài khoản trên hệ thống.",
        "post_condition": "Tài khoản người dùng mới được khởi tạo với vai trò PATIENT, mật khẩu được mã hóa an toàn bằng Argon2, hồ sơ người đi khám mặc định được tạo lập.",
        "main_flow": [
            ("1. Chọn chức năng \"Đăng ký\" trên màn hình chính của ứng dụng di động hoặc cổng thông tin Web.", 
             "2. Hiển thị màn hình biểu mẫu đăng ký tài khoản (họ tên, số điện thoại/email, mật khẩu, xác nhận mật khẩu)."),
            ("3. Nhập số điện thoại/email và nhấn nút \"Gửi mã xác thực (OTP)\".", 
             "4. Kiểm tra định dạng và đối soát trong cơ sở dữ liệu: nếu chưa tồn tại, hệ thống tạo mã OTP ngẫu nhiên gồm 6 chữ số, lưu trữ vào bộ nhớ đệm Redis với thời hạn hết hạn 5 phút (TTL = 300s) và gửi mã qua dịch vụ SMS/SMTP."),
            ("5. Nhận mã OTP và nhập vào ô xác thực trên giao diện, nhấn \"Xác minh OTP\".", 
             "6. Kiểm tra mã OTP đối chiếu với Redis. Nếu khớp, hệ thống sinh mã verificationToken có chữ ký số bảo mật và kích hoạt trạng thái cho phép hoàn tất đăng ký."),
            ("7. Nhập họ và tên, giới tính, mật khẩu bảo mật và nhấn nút \"Đăng ký tài khoản\".", 
             "8. Mã hóa mật khẩu bằng thuật toán Argon2id, lưu bản ghi mới vào bảng User với vai trò PATIENT, tự động khởi tạo bản ghi PatientProfile mặc định và phản hồi thông báo đăng ký thành công.")
        ],
        "alt_flow": [
            ("3.1. Số điện thoại hoặc email đã được đăng ký trước đó trên hệ thống.", 
             "4.1. Hệ thống trả về mã lỗi 409 Conflict và hiển thị thông báo: \"Số điện thoại hoặc email này đã tồn tại trên hệ thống. Vui lòng đăng nhập hoặc sử dụng chức năng quên mật khẩu\"."),
            ("5.1. Người dùng nhập sai mã OTP hoặc mã OTP đã quá hạn 5 phút.", 
             "6.1. Hệ thống trả về mã lỗi 400 Bad Request: \"Mã OTP không chính xác hoặc đã hết hạn. Vui lòng kiểm tra lại hoặc yêu cầu gửi lại mã\"."),
            ("7.1. Mật khẩu nhập vào không đạt tiêu chuẩn (dưới 6 ký tự hoặc không khớp với ô xác nhận mật khẩu).", 
             "8.1. Hệ thống hiển thị thông báo lỗi xác thực dữ liệu đầu vào và yêu cầu người dùng chỉnh sửa mật khẩu trước khi tiếp tục.")
        ]
    },
    {
        "name": "UC-AUTH-02: Đăng nhập hệ thống",
        "description": "Người dùng xác thực danh tính bằng tài khoản đã đăng ký (số điện thoại hoặc email) và mật khẩu để được cấp quyền truy cập hệ thống theo đúng vai trò.",
        "primary_actor": "Khách vãng lai, Bệnh nhân, Bác sĩ, Quản trị cơ sở, Quản trị hệ thống",
        "secondary_actor": "Không có",
        "pre_condition": "Người dùng đã có tài khoản trên hệ thống và tài khoản đang ở trạng thái hoạt động (ACTIVE).",
        "post_condition": "Hệ thống xác thực thành công, cấp cặp khóa JWT (Access Token thời hạn ngắn và Refresh Token thời hạn 7 ngày); điều hướng người dùng tới giao diện làm việc tương ứng với vai trò.",
        "main_flow": [
            ("1. Chọn chức năng \"Đăng nhập\" tại giao diện ứng dụng di động hoặc cổng Web.", 
             "2. Hiển thị biểu mẫu đăng nhập yêu cầu nhập số điện thoại hoặc email và mật khẩu truy cập."),
            ("3. Nhập đầy đủ thông tin tài khoản và mật khẩu, chọn nút \"Đăng nhập\".", 
             "4. Tiếp nhận dữ liệu, kiểm tra tài khoản trong bảng User, đối soát mật khẩu nhập vào với mã hash Argon2 đã lưu."),
            ("", 
             "5. Kiểm tra trạng thái tài khoản: nếu trạng thái là ACTIVE, hệ thống sinh Access Token và Refresh Token có chứa thông tin định danh userId, email, role và phạm vi cơ sở y tế (nếu là HOSPITAL_ADMIN)."),
            ("", 
             "6. Lưu Refresh Token vào cơ sở dữ liệu/Redis, trả về thông tin người dùng và token cho Client. Client lưu token vào bộ nhớ an toàn (EncryptedSharedPreferences trên Mobile hoặc HttpOnly Cookie trên Web) và điều hướng vào màn hình chính.")
        ],
        "alt_flow": [
            ("3.1. Người dùng để trống trường thông tin đăng nhập hoặc nhập định dạng email/SĐT không hợp lệ.", 
             "4.1. Hệ thống báo lỗi kiểm tra dữ liệu và yêu cầu người dùng điền đầy đủ thông tin hợp lệ."),
            ("3.2. Người dùng nhập sai tài khoản hoặc mật khẩu không khớp với cơ sở dữ liệu.", 
             "4.2. Hệ thống ghi nhận số lần thất bại, trả về lỗi 401 Unauthorized kèm thông báo: \"Số điện thoại, email hoặc mật khẩu không chính xác\"."),
            ("3.3. Tài khoản của người dùng đã bị quản trị viên khóa (trạng thái LOCKED).", 
             "5.1. Hệ thống từ chối xác thực và hiển thị thông báo lỗi: \"Tài khoản của bạn đã bị tạm khóa. Vui lòng liên hệ ban quản trị để được hỗ trợ giải quyết\".")
        ]
    },
    {
        "name": "UC-AUTH-03: Làm mới phiên đăng nhập (Refresh Token)",
        "description": "Cơ chế tự động cấp phát Access Token mới khi Access Token hiện tại hết hiệu lực mà không làm gián đoạn trải nghiệm của người dùng.",
        "primary_actor": "Bệnh nhân, Bác sĩ, Quản trị cơ sở, Quản trị hệ thống",
        "secondary_actor": "Không có",
        "pre_condition": "Access Token hiện tại đã hết hạn (401 Unauthorized), Refresh Token còn thời hạn hiệu lực và hợp lệ trong cơ sở dữ liệu.",
        "post_condition": "Access Token mới được cấp phát, phiên làm việc được kéo dài liên tục.",
        "main_flow": [
            ("1. Ứng dụng client gửi yêu cầu API nhưng nhận phản hồi lỗi 401 Token Expired từ server.", 
             "2. Bộ chặn mạng (Interceptor/Authenticator) tự động giữ yêu cầu lại và lấy Refresh Token đã lưu trữ gửi đến endpoint /api/v1/auth/refresh."),
            ("", 
             "3. Kiểm tra tính toàn vẹn và thời hạn của Refresh Token bằng khóa bí mật JWT_REFRESH_SECRET, kiểm tra trong cơ sở dữ liệu xem token có bị đưa vào danh sách thu hồi (blacklist) hay không."),
            ("", 
             "4. Sinh Access Token mới và cập nhật Refresh Token tương ứng, trả về cho Client. Client lưu token mới và tự động thực hiện lại yêu cầu API ban đầu.")
        ],
        "alt_flow": [
            ("2.1. Refresh Token đã hết hạn (quá 7 ngày) hoặc đã bị thu hồi do đăng xuất.", 
             "3.1. Hệ thống trả về lỗi 401 Unauthorized: \"Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại\". Client lập tức xóa toàn bộ token lưu trữ và điều hướng người dùng về màn hình Đăng nhập.")
        ]
    },
    {
        "name": "UC-AUTH-04: Quên / Đặt lại mật khẩu",
        "description": "Người dùng thiết lập lại mật khẩu tài khoản mới khi không nhớ mật khẩu cũ thông qua xác thực mã bảo mật OTP.",
        "primary_actor": "Khách vãng lai, Bệnh nhân, Bác sĩ",
        "secondary_actor": "Dịch vụ gửi thông báo SMTP / SMS",
        "pre_condition": "Tài khoản cần khôi phục đã tồn tại trong hệ thống.",
        "post_condition": "Mật khẩu tài khoản được cập nhật mới, các phiên đăng nhập cũ trên mọi thiết bị bị vô hiệu hóa.",
        "main_flow": [
            ("1. Chọn chức năng \"Quên mật khẩu?\" trên màn hình đăng nhập.", 
             "2. Hiển thị màn hình nhập thông tin định danh tài khoản (Số điện thoại hoặc Email)."),
            ("3. Nhập số điện thoại/email đã đăng ký và nhấn \"Nhận mã xác thực\".", 
             "4. Kiểm tra tài khoản tồn tại trong bảng User. Sinh mã OTP 6 số lưu vào Redis với thời hạn 5 phút và gửi qua SMS hoặc Email."),
            ("5. Nhận mã OTP, nhập vào giao diện và nhấn nút \"Xác thực OTP\".", 
             "6. Kiểm tra mã OTP khớp với Redis, sinh mã token xác minh đặt lại mật khẩu (resetToken)."),
            ("7. Nhập mật khẩu mới, xác nhận mật khẩu và nhấn \"Đổi mật khẩu\".", 
             "8. Mã hóa mật khẩu mới bằng Argon2, cập nhật vào bản ghi User, xóa bỏ token và hiển thị thông báo đổi mật khẩu thành công, điều hướng về màn hình đăng nhập.")
        ],
        "alt_flow": [
            ("3.1. Số điện thoại hoặc email nhập vào không tồn tại trong hệ thống.", 
             "4.1. Hệ thống trả về lỗi 404 Not Found: \"Không tìm thấy tài khoản tương ứng với thông tin đã nhập\"."),
            ("5.1. Nhập sai mã OTP hoặc mã xác thực đã quá thời hạn hiệu lực.", 
             "6.1. Hệ thống thông báo lỗi: \"Mã OTP không hợp lệ hoặc đã hết hạn. Vui lòng kiểm tra lại\".")
        ]
    },
    {
        "name": "UC-AUTH-05: Kích hoạt tài khoản quản trị cơ sở y tế",
        "description": "Quản trị viên cơ sở y tế kích hoạt tài khoản được Super Admin khởi tạo thông qua liên kết bảo mật gửi qua Email.",
        "primary_actor": "Quản trị viên cơ sở y tế (Hospital Admin)",
        "secondary_actor": "Dịch vụ Email SMTP",
        "pre_condition": "Tài khoản HOSPITAL_ADMIN đã được Super Admin tạo ở trạng thái PENDING_ACTIVATION, email chứa mã kích hoạt đã được gửi.",
        "post_condition": "Tài khoản chuyển sang trạng thái ACTIVE, mật khẩu đăng nhập ban đầu được thiết lập an toàn.",
        "main_flow": [
            ("1. Mở thư kích hoạt trong hộp thư điện tử cá nhân và bấm vào liên kết kích hoạt tài khoản.", 
             "2. Điều hướng đến trang kích hoạt tài khoản trên cổng thông tin Web, gọi API /verify-activation-token để kiểm tra tính hợp lệ của token kích hoạt."),
            ("", 
             "3. Kiểm tra token chưa hết hạn và tài khoản đúng trạng thái chờ kích hoạt; hiển thị biểu mẫu thiết lập mật khẩu ban đầu."),
            ("4. Nhập mật khẩu quản trị mới, xác nhận mật khẩu và nhấn \"Kích hoạt tài khoản\".", 
             "5. Mã hóa mật khẩu bằng Argon2, chuyển trạng thái tài khoản thành ACTIVE, vô hiệu hóa token kích hoạt và hiển thị thông báo sẵn sàng đăng nhập.")
        ],
        "alt_flow": [
            ("1.1. Liên kết kích hoạt đã hết hạn (quá 24 giờ kể từ thời điểm gửi) hoặc token không hợp lệ.", 
             "2.1. Hệ thống thông báo: \"Đường dẫn kích hoạt tài khoản không hợp lệ hoặc đã hết hạn. Vui lòng liên hệ ban quản trị để được cấp lại\".")
        ]
    },
    {
        "name": "UC-AUTH-06: Đăng xuất",
        "description": "Người dùng chủ động kết thúc phiên làm việc hiện tại trên thiết bị hoặc hủy toàn bộ phiên trên tất cả các thiết bị khác.",
        "primary_actor": "Bệnh nhân, Bác sĩ, Quản trị cơ sở, Quản trị hệ thống",
        "secondary_actor": "Không có",
        "pre_condition": "Người dùng đang đăng nhập trong hệ thống.",
        "post_condition": "Refresh Token bị vô hiệu hóa, thông tin xác thực trên bộ nhớ cục bộ bị xóa sạch.",
        "main_flow": [
            ("1. Chọn chức năng \"Đăng xuất\" (hoặc \"Đăng xuất khỏi tất cả thiết bị\") trong phần Cài đặt tài khoản.", 
             "2. Hiển thị hộp thoại xác nhận yêu cầu đăng xuất."),
            ("3. Xác nhận đồng ý đăng xuất.", 
             "4. Gửi yêu cầu lên endpoint /api/v1/auth/logout kèm Refresh Token. Hệ thống xóa Refresh Token khỏi CSDL/Redis, xóa thiết bị FCM Token liên kết."),
            ("", 
             "5. Xóa toàn bộ Token và thông tin lưu trữ tại Client; điều hướng người dùng về màn hình Đăng nhập.")
        ],
        "alt_flow": [
            ("3.1. Kết nối mạng bị gián đoạn trong khi gửi yêu cầu đăng xuất.", 
             "4.1. Ứng dụng Client vẫn chủ động xóa toàn bộ Token được lưu trữ trên máy máy để đảm bảo an toàn cục bộ, thông báo người dùng đã đăng xuất.")
        ]
    },
    {
        "name": "UC-AUTH-07: Xem và cập nhật hồ sơ cá nhân",
        "description": "Người dùng xem thông tin tài khoản hiện tại, cập nhật ảnh đại diện, họ tên, số điện thoại hoặc đổi mật khẩu.",
        "primary_actor": "Bệnh nhân, Bác sĩ, Quản trị cơ sở, Quản trị hệ thống",
        "secondary_actor": "Không có",
        "pre_condition": "Người dùng đã đăng nhập vào hệ thống.",
        "post_condition": "Thông tin hồ sơ tài khoản trong bảng User được cập nhật chính xác.",
        "main_flow": [
            ("1. Mở trang \"Thông tin tài khoản\" hoặc \"Hồ sơ cá nhân\".", 
             "2. Gửi request GET /api/v1/users/me; hệ thống truy vấn CSDL và hiển thị thông tin: Họ tên, email, số điện thoại, giới tính, ảnh đại diện, vai trò."),
            ("3. Thay đổi thông tin cá nhân (họ tên, ngày sinh, giới tính, tải lên ảnh đại diện mới) và nhấn \"Lưu thay đổi\".", 
             "4. Kiểm tra hợp lệ dữ liệu đầu vào, cập nhật bản ghi trong bảng User và phản hồi thông tin mới đã cập nhật.")
        ],
        "alt_flow": [
            ("3.1. Người dùng chọn đổi mật khẩu nhưng nhập mật khẩu hiện tại không chính xác.", 
             "4.1. Hệ thống kiểm tra đối soát thất bại và trả về thông báo lỗi: \"Mật khẩu hiện tại không đúng. Vui lòng kiểm tra lại\".")
        ]
    },

    # ── PHÂN HỆ 2: HỒ SƠ NGƯỜI ĐI KHÁM & HỘ CHIẾU SỨC KHỎE
    {
        "name": "UC-PROF-01: Tạo hồ sơ người đi khám",
        "description": "Người dùng tạo mới hồ sơ bệnh nhân cho chính mình hoặc cho người thân trong gia đình (cha mẹ, con cái, vợ/chồng) để phục vụ đặt lịch khám.",
        "primary_actor": "Bệnh nhân (Patient)",
        "secondary_actor": "Không có",
        "pre_condition": "Bệnh nhân đã đăng nhập vào hệ thống.",
        "post_condition": "Bản ghi PatientProfile mới được khởi tạo và liên kết với tài khoản người dùng hiện tại.",
        "main_flow": [
            ("1. Chọn chức năng \"Thêm hồ sơ người đi khám\" tại mục Quản lý hồ sơ.", 
             "2. Hiển thị biểu mẫu thông tin người đi khám (Họ tên, quan hệ nhân thân, ngày sinh, giới tính, CCCD/Định danh, số thẻ BHYT, địa chỉ, tiền sử bệnh lý, dị ứng)."),
            ("3. Điền đầy đủ các thông tin bắt buộc và nhấn nút \"Lưu hồ sơ\".", 
             "4. Kiểm tra tính hợp lệ của dữ liệu (định dạng ngày sinh, độ dài CCCD 12 số, định dạng mã BHYT 15 ký tự)."),
            ("", 
             "5. Lưu bản ghi vào bảng PatientProfile với userId của tài khoản hiện tại, thiết lập trạng thái mặc định nếu là hồ sơ đầu tiên và thông báo thêm hồ sơ thành công.")
        ],
        "alt_flow": [
            ("3.1. Để trống các trường bắt buộc (họ tên, ngày sinh, giới tính) hoặc nhập sai định dạng CCCD/BHYT.", 
             "4.1. Hệ thống đánh dấu viền đỏ các trường nhập sai và hiển thị thông báo lỗi chi tiết, không cho phép gửi dữ liệu.")
        ]
    },
    {
        "name": "UC-PROF-02: Xem danh sách và chi tiết hồ sơ người đi khám",
        "description": "Xem danh sách các hồ sơ thành viên gia đình đã tạo và xem chi tiết thông tin nhân thân, tiền sử y tế của từng hồ sơ.",
        "primary_actor": "Bệnh nhân (Patient)",
        "secondary_actor": "Không có",
        "pre_condition": "Bệnh nhân đã đăng nhập vào hệ thống.",
        "post_condition": "Thông tin danh sách và chi tiết hồ sơ được hiển thị trực quan.",
        "main_flow": [
            ("1. Chọn mục \"Hồ sơ người đi khám\" trên thanh điều hướng.", 
             "2. Gửi request GET /api/v1/patient-profiles. Hệ thống truy vấn toàn bộ hồ sơ thuộc về userId hiện tại và hiển thị dưới dạng thẻ danh sách."),
            ("3. Nhấn vào một hồ sơ bệnh nhân cụ thể trong danh sách.", 
             "4. Gửi request GET /api/v1/patient-profiles/:id. Hệ thống trả về đầy đủ chi tiết: thông tin hành chính, thẻ BHYT, người liên hệ khẩn cấp, ghi chú bệnh nền.")
        ],
        "alt_flow": [
            ("1.1. Tài khoản chưa tạo bất kỳ hồ sơ người đi khám nào.", 
             "2.1. Hệ thống hiển thị trạng thái danh sách trống kèm hình ảnh minh họa và nút gợi ý: \"Bạn chưa có hồ sơ nào. Tạo hồ sơ ngay\".")
        ]
    },
    {
        "name": "UC-PROF-03: Cập nhật thông tin hồ sơ người đi khám",
        "description": "Chỉnh sửa thông tin cá nhân, địa chỉ cư trú, số thẻ BHYT hoặc thông tin tiền sử bệnh lý của một hồ sơ đã có.",
        "primary_actor": "Bệnh nhân (Patient)",
        "secondary_actor": "Không có",
        "pre_condition": "Hồ sơ người đi khám tồn tại và thuộc quyền sở hữu của người dùng.",
        "post_condition": "Thông tin trong bản ghi PatientProfile được cập nhật mới trong CSDL.",
        "main_flow": [
            ("1. Tại màn hình chi tiết hồ sơ, chọn chức năng \"Chỉnh sửa hồ sơ\".", 
             "2. Hiển thị biểu mẫu chỉnh sửa với các thông tin hiện tại được điền sẵn."),
            ("3. Thay đổi các trường thông tin cần cập nhật và nhấn \"Lưu thay đổi\".", 
             "4. Kiểm tra tính hợp lệ của dữ liệu, gửi request PUT /api/v1/patient-profiles/:id; hệ thống cập nhật vào CSDL và phản hồi cập nhật thành công.")
        ],
        "alt_flow": [
            ("3.1. Dữ liệu nhập vào vi phạm quy tắc validation (định dạng số điện thoại, ngày sinh không hợp lý).", 
             "4.1. Hệ thống hiển thị cảnh báo lỗi và giữ nguyên trạng thái biểu mẫu để người dùng sửa lại.")
        ]
    },
    {
        "name": "UC-PROF-04: Xóa hồ sơ người đi khám",
        "description": "Người dùng xóa bỏ hồ sơ thành viên không còn nhu cầu sử dụng ra khỏi danh sách quản lý.",
        "primary_actor": "Bệnh nhân (Patient)",
        "secondary_actor": "Không có",
        "pre_condition": "Hồ sơ tồn tại và không có lịch hẹn khám nào đang ở trạng thái chờ khám hoặc chờ thanh toán.",
        "post_condition": "Hồ sơ được thực hiện xóa mềm (soft delete) trong CSDL, không còn xuất hiện trong danh sách lựa chọn.",
        "main_flow": [
            ("1. Chọn chức năng \"Xóa hồ sơ\" tại hồ sơ người đi khám cần xóa.", 
             "2. Hiển thị hộp thoại cảnh báo: \"Bạn có chắc chắn muốn xóa hồ sơ này? Toàn bộ lịch sử liên quan sẽ không hiển thị trong danh sách lựa chọn\"."),
            ("3. Xác nhận đồng ý xóa.", 
             "4. Kiểm tra ràng buộc dữ liệu: kiểm tra trong bảng Appointment xem hồ sơ có lịch hẹn ở trạng thái PENDING, AWAITING_PAYMENT, CONFIRMED hay không. Nếu không, thực hiện xóa hồ sơ và thông báo thành công.")
        ],
        "alt_flow": [
            ("3.1. Hồ sơ đang có lịch hẹn khám sắp tới chưa hoàn thành.", 
             "4.1. Hệ thống từ chối xóa và hiển thị thông báo lỗi: \"Không thể xóa hồ sơ này do đang có lịch khám chưa hoàn tất. Vui lòng hủy lịch khám trước khi xóa hồ sơ\".")
        ]
    },
    {
        "name": "UC-PROF-05: Đặt hồ sơ mặc định",
        "description": "Người dùng chỉ định một hồ sơ cụ thể làm hồ sơ chính để hệ thống tự động điền sẵn khi đặt lịch khám nhanh.",
        "primary_actor": "Bệnh nhân (Patient)",
        "secondary_actor": "Không có",
        "pre_condition": "Người dùng có ít nhất một hồ sơ người đi khám.",
        "post_condition": "Hồ sơ được chọn có cờ isDefault = true, tất cả các hồ sơ còn lại của người dùng chuyển về isDefault = false.",
        "main_flow": [
            ("1. Nhấn nút \"Đặt làm mặc định\" tại thẻ hồ sơ mong muốn.", 
             "2. Gửi request PATCH /api/v1/patient-profiles/:id/default lên server."),
            ("", 
             "3. Hệ thống mở transaction trong cơ sở dữ liệu: cập nhật tất cả hồ sơ của user về isDefault = false, sau đó đặt hồ sơ chỉ định isDefault = true và trả về kết quả thành công."),
            ("", 
             "4. Giao diện cập nhật lại huy hiệu \"Mặc định\" màu xanh tại thẻ hồ sơ vừa chọn.")
        ],
        "alt_flow": [
            ("2.1. Hồ sơ chỉ định không tồn tại hoặc không thuộc quyền sở hữu của tài khoản hiện tại.", 
             "3.1. Hệ thống trả về mã lỗi 403 Forbidden hoặc 404 Not Found kèm thông báo không tìm thấy hồ sơ hợp lệ.")
        ]
    },
    {
        "name": "UC-PROF-06: Xem Hộ chiếu sức khỏe điện tử (Medical Passport)",
        "description": "Người bệnh xem dòng thời gian lịch sử khám bệnh hợp nhất từ các bệnh viện/phòng khám (chẩn đoán ICD-10, kết quả xét nghiệm, chỉ số sinh hiệu và đơn thuốc).",
        "primary_actor": "Bệnh nhân (Patient)",
        "secondary_actor": "Không có",
        "pre_condition": "Người bệnh đã đăng nhập và đã có các lượt khám hoàn tất đã được cơ sở y tế phát hành (publish).",
        "post_condition": "Thông tin bệnh sử liên cơ sở y tế được tổng hợp và hiển thị trực quan theo thứ tự thời gian.",
        "main_flow": [
            ("1. Chọn mục \"Hộ chiếu sức khỏe\" (Medical Passport) trên menu ứng dụng.", 
             "2. Gửi request GET /api/v1/passport. Hệ thống truy vấn bảng Encounter kết hợp với bảng Diagnosis, Observation, Prescription của các hồ sơ bệnh nhân đã được bác sĩ phát hành."),
            ("", 
             "3. Tổng hợp dữ liệu thành dòng thời gian y tế: phân nhóm theo từng ngày khám, cơ sở khám bệnh, bác sĩ chủ trì, chẩn đoán bệnh chính và danh mục thuốc kê đơn."),
            ("4. Bấm vào một lượt khám cụ thể trong dòng thời gian.", 
             "5. Hiển thị chi tiết toàn diện của lượt khám: chỉ số huyết áp, nhịp tim, đường huyết, hình ảnh cận lâm sàng và hướng dẫn điều trị của bác sĩ.")
        ],
        "alt_flow": [
            ("2.1. Người bệnh chưa từng đi khám hoặc dữ liệu khám chưa được bác sĩ phát hành công khai.", 
             "3.1. Hệ thống hiển thị thông báo: \"Chưa có lịch sử khám bệnh nào được ghi nhận. Dữ liệu sẽ tự động xuất hiện sau khi bạn hoàn tất ca khám tại các cơ sở liên kết\".")
        ]
    },
    {
        "name": "UC-PROF-07: Chia sẻ hồ sơ sức khỏe điện tử qua mã Token",
        "description": "Người bệnh tạo mã chia sẻ tạm thời (Share Token kèm mã QR) có giới hạn thời gian (mặc định 24 giờ) để bác sĩ tại cơ sở y tế khác tra cứu bệnh sử.",
        "primary_actor": "Bệnh nhân (Patient)",
        "secondary_actor": "Không có",
        "pre_condition": "Người bệnh đã đăng nhập và chọn một hồ sơ người đi khám cụ thể.",
        "post_condition": "Bản ghi PassportShare được khởi tạo với mã token ngẫu nhiên bảo mật, trạng thái ACTIVE và thời gian hết hạn expiresAt.",
        "main_flow": [
            ("1. Tại màn hình Hộ chiếu sức khỏe, chọn chức năng \"Chia sẻ hồ sơ cho Bác sĩ\".", 
             "2. Hiển thị hộp thoại cấu hình chia sẻ: chọn thời hạn hiệu lực (2 giờ, 12 giờ, 24 giờ) và phạm vi dữ liệu chia sẻ (toàn bộ hoặc chỉ xem đơn thuốc gần nhất)."),
            ("3. Chọn thời hạn 24 giờ và nhấn nút \"Tạo mã chia sẻ\".", 
             "4. Gửi request POST /api/v1/passport/share. Hệ thống sinh mã UUID bí mật, lưu vào bảng PassportShare kèm thời điểm hết hạn và ghi log kiểm toán an toàn."),
            ("", 
             "5. Hiển thị mã số chia sẻ gồm 8 ký tự và mã phản hồi nhanh QR Code trên màn hình để người bệnh đưa cho bác sĩ quét.")
        ],
        "alt_flow": [
            ("3.1. Phiên làm việc của người dùng bị gián đoạn hoặc hồ sơ không hợp lệ.", 
             "4.1. Hệ thống hiển thị thông báo lỗi và yêu cầu xác thực lại tài khoản trước khi cấp mã chia sẻ.")
        ]
    },
    {
        "name": "UC-PROF-08: Thu hồi quyền chia sẻ hồ sơ sức khỏe",
        "description": "Người bệnh chủ động hủy bỏ hiệu lực của mã chia sẻ trước thời hạn quy định để ngăn chặn việc tiếp tục truy cập hồ sơ y tế.",
        "primary_actor": "Bệnh nhân (Patient)",
        "secondary_actor": "Không có",
        "pre_condition": "Người bệnh đang có mã chia sẻ hồ sơ ở trạng thái ACTIVE.",
        "post_condition": "Bản ghi PassportShare chuyển trạng thái thành REVOKED; các yêu cầu tra cứu bằng token này sẽ bị từ chối.",
        "main_flow": [
            ("1. Vào mục \"Quản lý các lượt chia sẻ hồ sơ\".", 
             "2. Gửi request GET /api/v1/passport/shares; hệ thống hiển thị danh sách các mã chia sẻ đang hoạt động kèm thời gian còn lại."),
            ("3. Chọn mã chia sẻ cần vô hiệu hóa và bấm nút \"Thu hồi quyền truy cập\".", 
             "4. Hiển thị hộp thoại xác nhận thu hồi."),
            ("5. Xác nhận đồng ý thu hồi.", 
             "6. Gửi request PATCH /api/v1/passport/share/:id/revoke. Hệ thống cập nhật trạng thái REVOKED trong CSDL và phản hồi thu hồi thành công.")
        ],
        "alt_flow": [
            ("3.1. Mã chia sẻ đã tự động hết hạn từ trước.", 
             "4.1. Hệ thống cập nhật giao diện hiển thị trạng thái \"Đã hết hạn\", thông báo không cần thao tác thu hồi.")
        ]
    },

    # ── PHÂN HỆ 3: TRA CỨU & TÌM KIẾM DỊCH VỤ Y TẾ
    {
        "name": "UC-SRCH-01: Tìm kiếm đa tiêu chí (Universal Search)",
        "description": "Người dùng tra cứu nhanh chóng các cơ sở y tế, bác sĩ chuyên khoa, danh mục chuyên khoa và gói khám bệnh theo từ khóa tìm kiếm tổng hợp.",
        "primary_actor": "Khách vãng lai, Bệnh nhân",
        "secondary_actor": "Không có",
        "pre_condition": "Thiết bị có kết nối Internet.",
        "post_condition": "Danh sách kết quả tìm kiếm được trả về phân nhóm theo Bác sĩ, Cơ sở y tế, Chuyên khoa và Dịch vụ.",
        "main_flow": [
            ("1. Nhập từ khóa tìm kiếm (tên bác sĩ, tên bệnh viện, triệu chứng hoặc chuyên khoa) vào thanh tìm kiếm Universal Search.", 
             "2. Gửi request GET /api/v1/search?q=... lên server."),
            ("", 
             "3. Hệ thống thực hiện tìm kiếm toàn văn (full-text search) đồng thời trên bảng Doctor, Hospital, Specialty và MedicalService."),
            ("", 
             "4. Trả về kết quả phân loại thành các nhóm: Top bác sĩ phù hợp, Bệnh viện/Phòng khám liên quan và Chuyên khoa tương ứng kèm hình ảnh và thông tin vắn tắt.")
        ],
        "alt_flow": [
            ("1.1. Từ khóa tìm kiếm không khớp với bất kỳ bản ghi nào trong hệ thống.", 
             "2.1. Hệ thống hiển thị thông báo: \"Không tìm thấy kết quả phù hợp với từ khóa của bạn\" kèm danh sách các gợi ý tìm kiếm phổ biến.")
        ]
    },
    {
        "name": "UC-SRCH-02: Lọc tìm kiếm nâng cao",
        "description": "Thu hẹp danh sách kết quả tìm kiếm theo khu vực địa lý (Tỉnh/Thành phố, Quận/Huyện), loại hình cơ sở y tế và mức giá dịch vụ.",
        "primary_actor": "Khách vãng lai, Bệnh nhân",
        "secondary_actor": "Không có",
        "pre_condition": "Đang ở màn hình danh sách kết quả tìm kiếm.",
        "post_condition": "Danh sách kết quả được lọc chính xác và sắp xếp theo tiêu chí người dùng đã chọn.",
        "main_flow": [
            ("1. Nhấn nút \"Bộ lọc nâng cao\" trên màn hình tìm kiếm.", 
             "2. Hiển thị bảng điều khiển bộ lọc: chọn Tỉnh/Thành phố, Quận/Huyện, Loại cơ sở (Bệnh viện công, Bệnh viện tư, Phòng khám), Chuyên khoa, Khoảng giá khám."),
            ("3. Chọn các tiêu chí lọc mong muốn và nhấn \"Áp dụng bộ lọc\".", 
             "4. Gửi request kèm các query params (province, district, facilityType, specialtyIds, sort). Hệ thống truy vấn CSDL theo điều kiện kết hợp và hiển thị danh sách đã lọc.")
        ],
        "alt_flow": [
            ("3.1. Người dùng chọn chức năng \"Sử dụng vị trí hiện tại (GPS)\".", 
             "4.1. Ứng dụng lấy tọa độ vĩ độ/kinh độ từ thiết bị, gửi params lat, lng lên server. Hệ thống sử dụng công thức tính khoảng cách địa lý (Haversine) để sắp xếp kết quả từ gần đến xa nhất.")
        ]
    },
    {
        "name": "UC-SRCH-03: Xem từ khóa tìm kiếm phổ biến & Lịch sử tìm kiếm",
        "description": "Hiển thị danh sách các từ khóa xu hướng được nhiều người tìm kiếm nhất và lịch sử các từ khóa cá nhân đã tìm kiếm gần đây.",
        "primary_actor": "Khách vãng lai, Bệnh nhân",
        "secondary_actor": "Không có",
        "pre_condition": "Thiết bị có kết nối Internet.",
        "post_condition": "Các gợi ý từ khóa tìm kiếm xuất hiện trực quan ngay khi nhấp vào ô tìm kiếm.",
        "main_flow": [
            ("1. Chạm vào ô nhập liệu tìm kiếm trên giao diện.", 
             "2. Ứng dụng đọc danh sách lịch sử tìm kiếm gần đây từ bộ nhớ thiết bị."),
            ("", 
             "3. Đồng thời gửi request GET /api/v1/search/popular để lấy danh sách top các từ khóa, chuyên khoa có tần suất tìm kiếm cao nhất."),
            ("4. Chọn một từ khóa gợi ý bất kỳ.", 
             "5. Hệ thống tự động điền từ khóa vào ô tìm kiếm và kích hoạt luồng tra cứu kết quả ngay lập tức.")
        ],
        "alt_flow": [
            ("4.1. Người dùng bấm nút \"Xóa lịch sử tìm kiếm\".", 
             "5.1. Ứng dụng xóa sạch các từ khóa đã lưu trong bộ nhớ máy và chỉ hiển thị danh mục từ khóa phổ biến của hệ thống.")
        ]
    },
    {
        "name": "UC-SRCH-04: Xem thông tin chi tiết cơ sở y tế",
        "description": "Xem đầy đủ hồ sơ giới thiệu của một bệnh viện hoặc phòng khám: địa chỉ bản đồ, số hotline, thời gian tiếp nhận, danh sách chuyên khoa, đội ngũ bác sĩ và bảng giá dịch vụ.",
        "primary_actor": "Khách vãng lai, Bệnh nhân",
        "secondary_actor": "Không có",
        "pre_condition": "Cơ sở y tế đang ở trạng thái hoạt động trên hệ thống.",
        "post_condition": "Toàn bộ thông tin chi tiết của cơ sở y tế được kết xuất hiển thị.",
        "main_flow": [
            ("1. Chọn một cơ sở y tế từ danh sách tìm kiếm hoặc từ trang chủ.", 
             "2. Gửi request GET /api/v1/hospitals/:id lên server."),
            ("", 
             "3. Hệ thống truy vấn thông tin cơ sở: tên, địa chỉ, số điện thoại, ảnh đại diện, danh sách các chuyên khoa đang tiếp nhận, bảng giá dịch vụ và các đánh giá xếp hạng."),
            ("4. Chuyển qua các tab chuyên mục (Giới thiệu, Chuyên khoa, Bác sĩ, Bảng giá, Đánh giá).", 
             "5. Hiển thị nội dung chi tiết của từng chuyên mục để người dùng tham khảo trước khi đặt lịch.")
        ],
        "alt_flow": [
            ("1.1. Cơ sở y tế đang tạm ngừng hoạt động hoặc đã bị quản trị viên khóa.", 
             "2.1. Hệ thống hiển thị cảnh báo: \"Cơ sở y tế này hiện đang tạm ngừng tiếp nhận đặt lịch trực tuyến. Vui lòng chọn cơ sở y tế khác\".")
        ]
    },
    {
        "name": "UC-SRCH-05: Xem hồ sơ & Lịch khám của bác sĩ",
        "description": "Xem thông tin học hàm, học vị, quá trình đào tạo, chuyên khoa chuyên sâu, nơi làm việc và tra cứu các ngày/suất khám còn trống của bác sĩ.",
        "primary_actor": "Khách vãng lai, Bệnh nhân",
        "secondary_actor": "Không có",
        "pre_condition": "Hồ sơ bác sĩ công khai trên hệ sinh thái NovaCare.",
        "post_condition": "Thông tin chuyên môn và lịch khám biểu theo ngày của bác sĩ được hiển thị.",
        "main_flow": [
            ("1. Chọn một bác sĩ từ danh sách kết quả tìm kiếm.", 
             "2. Gửi request GET /api/v1/doctors/:id và GET /api/v1/doctors/:id/available-dates."),
            ("", 
             "3. Hệ thống trả về thông tin chi tiết: học vị (BS.CKI, ThS, PGS...), số năm kinh nghiệm, các bệnh viện công tác, mức giá khám và danh sách các ngày còn suất khám trong tháng."),
            ("4. Chọn một ngày khám cụ thể trên lịch biểu.", 
             "5. Gửi request GET /api/v1/doctors/:id/available-slots?date=... Hệ thống truy vấn bảng AppointmentSlot và trả về danh sách các khung giờ (ví dụ: 08:00 - 08:30, 08:30 - 09:00) còn trống.")
        ],
        "alt_flow": [
            ("4.1. Ngày khám được chọn đã kín toàn bộ các suất khám (hết chỗ).", 
             "5.1. Hệ thống hiển thị thông báo: \"Bác sĩ đã kín lịch vào ngày này. Vui lòng chọn ngày khám khác hoặc đăng ký nhận thông báo khi có suất trống\".")
        ]
    },
    {
        "name": "UC-SRCH-06: Xem danh mục gói khám & Dịch vụ y tế",
        "description": "Tra cứu thông tin chi tiết các gói khám sức khỏe tổng quát, dịch vụ xét nghiệm, chụp chiếu chẩn đoán hình ảnh kèm bảng giá niêm yết và quyền lợi chi tiết.",
        "primary_actor": "Khách vãng lai, Bệnh nhân",
        "secondary_actor": "Không có",
        "pre_condition": "Thiết bị có kết nối Internet.",
        "post_condition": "Nội dung chi tiết của gói khám/dịch vụ y tế được hiển thị đầy đủ.",
        "main_flow": [
            ("1. Chọn danh mục \"Gói khám sức khỏe\" hoặc \"Dịch vụ y tế\" trên menu.", 
             "2. Gửi request GET /api/v1/health-packages hoặc GET /api/v1/medical-services. Hệ thống trả về danh mục các gói khám phân loại theo độ tuổi, giới tính và nhu cầu."),
            ("3. Nhấn vào một gói khám cụ thể để xem chi tiết.", 
             "4. Hiển thị danh sách các danh mục khám chi tiết bên trong gói (xét nghiệm máu, chụp X-quang, siêu âm tổng quát, tư vấn kết quả), mức giá trọn gói và cơ sở cung cấp gói khám.")
        ],
        "alt_flow": [
            ("3.1. Dịch vụ y tế tạm thời ngừng cung cấp tại cơ sở.", 
             "4.1. Hệ thống hiển thị nhãn \"Tạm ngừng tiếp nhận\" và ẩn nút đặt lịch dịch vụ này.")
        ]
    }
]

