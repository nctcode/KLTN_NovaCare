'use client';

export default function TermsPage() {
  return (
    <div className="bg-[#F8F9FA] min-h-screen pb-16">
      {/* Banner */}
      <section className="bg-[#0c4b39] text-white py-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(102,255,51,0.05),transparent_50%)]"></div>
        <div className="container-custom relative z-10 text-center">
          <h1 className="text-3xl font-extrabold mb-2 tracking-tight">Điều Khoản Sử Dụng</h1>
          <p className="text-white/80 max-w-xl mx-auto text-xs md:text-sm">
            Cập nhật lần cuối: Ngày 19 tháng 07 năm 2026
          </p>
        </div>
      </section>

      <div className="container-custom mt-10 max-w-3xl">
        <div className="bg-white border border-gray-200/60 rounded-3xl p-6 md:p-10 shadow-sm space-y-6 text-gray-700 text-sm leading-relaxed">
          
          <p className="text-gray-500 italic">
            Chào mừng bạn đến với NovaCare. Trước khi sử dụng các dịch vụ đặt lịch khám bệnh trực tuyến trên nền tảng của chúng tôi, vui lòng đọc kỹ các Điều khoản sử dụng dưới đây. Việc bạn truy cập và sử dụng dịch vụ đồng nghĩa với việc bạn đồng ý tuân thủ các điều khoản này.
          </p>

          {/* Section 1 */}
          <div className="space-y-3">
            <h2 className="text-base md:text-lg font-bold text-secondary">1. Định nghĩa và dịch vụ</h2>
            <p>
              <strong>NovaCare</strong> là nền tảng công nghệ y tế hỗ trợ người dùng tìm kiếm thông tin bác sĩ, cơ sở y tế và đặt lịch khám bệnh trực tuyến. Chúng tôi không trực tiếp cung cấp các dịch vụ khám bệnh, chữa bệnh hay tư vấn y khoa chuyên sâu. Mọi hoạt động khám chữa bệnh được thực hiện bởi đội ngũ bác sĩ tại các cơ sở y tế đối tác được cấp phép.
            </p>
          </div>

          {/* Section 2 */}
          <div className="space-y-3">
            <h2 className="text-base md:text-lg font-bold text-secondary">2. Trách nhiệm của người sử dụng</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>Cung cấp thông tin cá nhân chính xác, trung thực bao gồm Họ tên, Số điện thoại, Ngày sinh và Email khi thực hiện đăng ký tài khoản và tạo hồ sơ đặt lịch khám bệnh.</li>
              <li>Tự bảo mật thông tin tài khoản đăng nhập của mình trên hệ thống.</li>
              <li>Đến cơ sở y tế đúng giờ hẹn khám đã đặt. Trong trường hợp không thể đến, người dùng có trách nhiệm thực hiện hủy hoặc thay đổi lịch hẹn trước ít nhất 2 giờ so với lịch khám thực tế.</li>
            </ul>
          </div>

          {/* Section 3 */}
          <div className="space-y-3">
            <h2 className="text-base md:text-lg font-bold text-secondary">3. Phí dịch vụ và thanh toán</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>Việc sử dụng nền tảng đặt lịch khám của NovaCare là hoàn toàn miễn phí đối với bệnh nhân.</li>
              <li>Chi phí khám bệnh được niêm yết trên hệ thống là chi phí do cơ sở y tế quy định. Người dùng có thể chọn thanh toán trước trực tuyến hoặc thanh toán tại quầy tiếp đón của bệnh viện khi đến khám.</li>
            </ul>
          </div>

          {/* Section 4 */}
          <div className="space-y-3">
            <h2 className="text-base md:text-lg font-bold text-secondary">4. Quy định hủy lịch và hoàn tiền</h2>
            <p>
              Nếu người dùng hủy lịch khám trước thời gian quy định tối thiểu (thường là 2-4 tiếng trước giờ khám), số tiền đã thanh toán trực tuyến trước đó sẽ được hoàn lại đầy đủ theo hình thức chuyển khoản ngân hàng hoặc ví điện tử. Trường hợp hủy muộn hoặc không đến khám đúng hẹn mà không thông báo trước, chính sách hoàn tiền sẽ do cơ sở y tế tiếp nhận trực tiếp quyết định.
            </p>
          </div>

          {/* Section 5 */}
          <div className="space-y-3">
            <h2 className="text-base md:text-lg font-bold text-secondary">5. Giới hạn trách nhiệm</h2>
            <p>
              NovaCare nỗ lực tối đa để đảm bảo tính chính xác của thông tin bác sĩ, lịch khám và chất lượng vận hành của hệ thống. Tuy nhiên, chúng tôi không chịu trách nhiệm đối với bất kỳ sai sót, hủy lịch đột xuất từ phía bác sĩ/cơ sở y tế do trường hợp khẩn cấp bất khả kháng, hoặc bất kỳ tranh chấp phát sinh nào liên quan đến quá trình chuyên môn khám chữa bệnh trực tiếp giữa bác sĩ và bệnh nhân.
            </p>
          </div>

          {/* Section 6 */}
          <div className="space-y-3">
            <h2 className="text-base md:text-lg font-bold text-secondary">6. Thay đổi điều khoản</h2>
            <p>
              NovaCare có quyền cập nhật, sửa đổi các điều khoản sử dụng này bất cứ lúc nào mà không cần thông báo trước. Các thay đổi sẽ có hiệu lực ngay khi được đăng tải trên trang web chính thức của chúng tôi.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
