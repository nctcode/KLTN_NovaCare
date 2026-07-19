'use client';

export default function PolicyPage() {
  return (
    <div className="bg-[#F8F9FA] min-h-screen pb-16">
      {/* Banner */}
      <section className="bg-[#0c4b39] text-white py-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(102,255,51,0.05),transparent_50%)]"></div>
        <div className="container-custom relative z-10 text-center">
          <h1 className="text-3xl font-extrabold mb-2 tracking-tight">Chính Sách Bảo Mật</h1>
          <p className="text-white/80 max-w-xl mx-auto text-xs md:text-sm">
            Cập nhật lần cuối: Ngày 19 tháng 07 năm 2026
          </p>
        </div>
      </section>

      <div className="container-custom mt-10 max-w-3xl">
        <div className="bg-white border border-gray-200/60 rounded-3xl p-6 md:p-10 shadow-sm space-y-6 text-gray-700 text-sm leading-relaxed">
          
          <p className="text-gray-500 italic">
            Chính sách bảo mật này mô tả cách thức NovaCare thu thập, sử dụng, lưu trữ và bảo vệ thông tin cá nhân cũng như dữ liệu sức khỏe của người sử dụng nền tảng. Chúng tôi tôn trọng quyền riêng tư của bạn và cam kết bảo vệ dữ liệu đó một cách an toàn nhất theo các chuẩn mực đạo đức y tế và quy định pháp luật Việt Nam.
          </p>

          {/* Section 1 */}
          <div className="space-y-3">
            <h2 className="text-base md:text-lg font-bold text-secondary">1. Thông tin thu thập</h2>
            <p>Để cung cấp dịch vụ đặt lịch hẹn khám hiệu quả, chúng tôi thu thập các loại thông tin sau:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>Thông tin tài khoản:</strong> Họ và tên, số điện thoại, địa chỉ email, giới tính, ngày sinh.</li>
              <li><strong>Hồ sơ bệnh nhân:</strong> Các thông tin chi tiết phục vụ đăng ký khám (Số định danh cá nhân/CCCD, địa chỉ thường trú, mối quan hệ thân nhân).</li>
              <li><strong>Thông tin lịch đặt:</strong> Ngày giờ hẹn khám, chuyên khoa y tế lựa chọn, bác sĩ yêu cầu và triệu chứng cơ bản (nếu người dùng tự nguyện cung cấp).</li>
            </ul>
          </div>

          {/* Section 2 */}
          <div className="space-y-3">
            <h2 className="text-base md:text-lg font-bold text-secondary">2. Mục đích sử dụng thông tin</h2>
            <p>Chúng tôi chỉ sử dụng thông tin của bạn cho các mục đích hợp pháp sau:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Đăng ký và xác nhận lịch hẹn khám thành công tại các cơ sở y tế đối tác.</li>
              <li>Gửi các thông báo xác nhận lịch hẹn, nhắc hẹn tự động hoặc thông báo thay đổi đột xuất liên quan đến lịch khám.</li>
              <li>Cải thiện chất lượng vận hành ứng dụng và cá nhân hóa trải nghiệm người dùng trên hệ thống.</li>
              <li>Hỗ trợ khách hàng giải quyết các khiếu nại, thắc mắc về kỹ thuật hoặc giao dịch thanh toán.</li>
            </ul>
          </div>

          {/* Section 3 */}
          <div className="space-y-3">
            <h2 className="text-base md:text-lg font-bold text-secondary">3. Chia sẻ thông tin</h2>
            <p>
              NovaCare cam kết không bán, trao đổi hoặc chia sẻ thông tin cá nhân của bạn cho bên thứ ba vì mục đích thương mại. Thông tin hồ sơ bệnh nhân chỉ được chia sẻ duy nhất cho <strong>Cơ sở y tế / Bác sĩ tiếp nhận</strong> nơi bạn đăng ký lịch khám, nhằm mục đích phục vụ chuyên môn khám chữa bệnh và quản lý thủ tục hành chính tại cơ sở đó.
            </p>
          </div>

          {/* Section 4 */}
          <div className="space-y-3">
            <h2 className="text-base md:text-lg font-bold text-secondary">4. Bảo mật dữ liệu</h2>
            <p>
              Chúng tôi áp dụng các giải pháp bảo mật kỹ thuật hiện đại như mã hóa dữ liệu truyền tải (SSL/TLS), kiểm soát quyền truy cập nghiêm ngặt và lưu trữ trên các máy chủ đám mây an toàn. Mọi dữ liệu về tình trạng sức khỏe cá nhân của người bệnh được coi là tài liệu nhạy cảm cao và được bảo vệ theo chế độ bảo mật nghiêm ngặt nhất.
            </p>
          </div>

          {/* Section 5 */}
          <div className="space-y-3">
            <h2 className="text-base md:text-lg font-bold text-secondary">5. Quyền của người dùng</h2>
            <p>Bạn có toàn quyền kiểm soát dữ liệu cá nhân của mình, bao gồm:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Truy cập, cập nhật hoặc điều chỉnh thông tin tài khoản và hồ sơ bệnh nhân bất kỳ lúc nào thông qua phần "Tài khoản".</li>
              <li>Yêu cầu xóa vĩnh viễn tài khoản và các dữ liệu liên quan khỏi hệ thống lưu trữ của NovaCare (ngoại trừ các dữ liệu giao dịch tài chính hoặc lịch sử khám bệnh bắt buộc lưu giữ theo quy định pháp luật y tế).</li>
            </ul>
          </div>

          {/* Section 6 */}
          <div className="space-y-3">
            <h2 className="text-base md:text-lg font-bold text-secondary">6. Liên hệ hỗ trợ</h2>
            <p>
              Nếu bạn có bất kỳ câu hỏi hoặc quan ngại nào liên quan đến Chính sách bảo mật thông tin này, vui lòng gửi email về địa chỉ: <strong>privacy@novacare.vn</strong> hoặc gọi hotline hỗ trợ: <strong>1900 1234</strong>.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
