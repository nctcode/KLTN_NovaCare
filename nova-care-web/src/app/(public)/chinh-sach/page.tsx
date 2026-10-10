'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  ShieldCheck, 
  FileText, 
  Lock, 
  Eye, 
  UserCheck, 
  Clock, 
  Phone, 
  Mail, 
  CheckCircle2, 
  ChevronRight,
  Database,
  Share2,
  Video
} from 'lucide-react';

export default function PolicyPage() {
  const [activeSection, setActiveSection] = useState('intro');

  const sections = [
    { id: 'intro', title: '1. Giới thiệu & Căn cứ pháp lý' },
    { id: 'definitions', title: '2. Định nghĩa dữ liệu cá nhân & dữ liệu y tế' },
    { id: 'collection-timing', title: '3. Khi nào NovaCare thu thập dữ liệu?' },
    { id: 'data-types', title: '4. Các loại dữ liệu chúng tôi thu thập' },
    { id: 'purposes', title: '5. Mục đích sử dụng dữ liệu' },
    { id: 'telemedicine', title: '6. Bảo mật tư vấn từ xa (Telemedicine)' },
    { id: 'security', title: '7. Biện pháp kỹ thuật & an toàn dữ liệu' },
    { id: 'sharing', title: '8. Nguyên tắc chia sẻ cho bên thứ ba' },
    { id: 'user-rights', title: '9. Quyền & nghĩa vụ của người dùng' },
    { id: 'contact', title: '10. Đầu mối liên hệ & khiếu nại' },
  ];

  const scrollTo = (id: string) => {
    setActiveSection(id);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="bg-[#F8FAFC] min-h-screen pb-20">
      {/* Hero Banner */}
      <section className="bg-gradient-to-br from-[#064E3B] via-[#047857] to-[#00A86B] text-white py-14 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(255,255,255,0.08),transparent_60%)]"></div>
        <div className="max-w-5xl mx-auto relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-xs font-semibold uppercase tracking-wider mb-3">
            <ShieldCheck className="w-4 h-4 text-[#A7F3D0]" />
            Tiêu chuẩn an toàn dữ liệu y tế quốc gia
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-3">
            Chính Sách Bảo Mật & Quyền Riêng Tư
          </h1>
          <p className="text-white/80 max-w-2xl mx-auto text-sm md:text-base leading-relaxed">
            Hệ thống Y tế Số NovaCare cam kết bảo vệ tuyệt đối dữ liệu cá nhân và thông tin hồ sơ sức khỏe của bạn theo quy định pháp luật Việt Nam.
          </p>
          <div className="mt-4 text-xs text-white/70">
            Áp dụng từ: Tháng 10/2026 • Tuân thủ Nghị định 13/2023/NĐ-CP & Luật Khám bệnh, chữa bệnh 2023
          </div>
        </div>
      </section>

      {/* Main Container */}
      <div className="max-w-6xl mx-auto px-4 mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Sidebar Navigation */}
          <aside className="lg:col-span-4 hidden lg:block">
            <div className="sticky top-24 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-2">
              <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider mb-3 px-2">
                Mục lục chính sách
              </h3>
              <nav className="space-y-1">
                {sections.map((sec) => (
                  <button
                    key={sec.id}
                    onClick={() => scrollTo(sec.id)}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs md:text-sm font-medium transition flex items-center justify-between ${
                      activeSection === sec.id
                        ? 'bg-[#ECFDF5] text-[#008755] font-semibold border border-[#A7F3D0]'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <span className="truncate">{sec.title}</span>
                    <ChevronRight className={`w-3.5 h-3.5 transition ${activeSection === sec.id ? 'opacity-100 text-[#008755]' : 'opacity-0'}`} />
                  </button>
                ))}
              </nav>

              <div className="mt-6 pt-5 border-t border-slate-100 text-xs text-slate-500 space-y-2">
                <div className="font-semibold text-slate-700">Tổng đài hỗ trợ pháp lý y tế:</div>
                <div className="flex items-center gap-2 text-[#008755] font-bold text-sm">
                  <Phone className="w-4 h-4" /> 1900 6060 (8:00 - 20:00)
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                  <Mail className="w-4 h-4" /> privacy@novacare.vn
                </div>
              </div>
            </div>
          </aside>

          {/* Policy Document Content */}
          <main className="lg:col-span-8 space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-10 shadow-sm space-y-10 text-slate-700 text-sm leading-relaxed">
              
              {/* Section 1 */}
              <section id="intro" className="space-y-3 scroll-mt-28">
                <div className="flex items-center gap-2.5 text-[#008755]">
                  <FileText className="w-5 h-5" />
                  <h2 className="text-lg md:text-xl font-bold text-slate-900">1. Giới thiệu & Căn cứ pháp lý</h2>
                </div>
                <p>
                  Chào mừng bạn đến với <strong>Nền tảng Y tế Số NovaCare</strong> (gọi chung là “Phần mềm”, “Nền tảng”, “chúng tôi” hoặc “NovaCare”). Chúng tôi nhận thức sâu sắc tầm quan trọng của dữ liệu cá nhân và thông tin sức khỏe mà bạn đã tin tưởng giao cho chúng tôi.
                </p>
                <p>
                  Chính sách Bảo Mật và Quyền Riêng Tư này (“Chính Sách”) được xây dựng nhằm công khai, minh bạch cách thức NovaCare thu thập, sử dụng, lưu trữ, xử lý và bảo vệ dữ liệu cá nhân theo đúng:
                </p>
                <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
                  <li><strong>Nghị định số 13/2023/NĐ-CP</strong> của Chính phủ về Bảo vệ dữ liệu cá nhân.</li>
                  <li><strong>Luật Khám bệnh, chữa bệnh số 15/2023/QH15</strong> về hồ sơ bệnh án và giữ bí mật thông tin người bệnh.</li>
                  <li><strong>Luật An toàn thông tin mạng 2015</strong> và <strong>Luật Giao dịch điện tử 2023</strong>.</li>
                </ul>
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 text-xs text-emerald-800">
                  <strong>Cam kết cốt lõi:</strong> NovaCare tuyệt đối không bán, không cho thuê, không thương mại hóa dữ liệu cá nhân hoặc hồ sơ sức khỏe của bạn cho bất kỳ bên thứ ba nào.
                </div>
              </section>

              {/* Section 2 */}
              <section id="definitions" className="space-y-3 scroll-mt-28 border-t border-slate-100 pt-8">
                <div className="flex items-center gap-2.5 text-[#008755]">
                  <Database className="w-5 h-5" />
                  <h2 className="text-lg md:text-xl font-bold text-slate-900">2. Định nghĩa dữ liệu cá nhân & dữ liệu y tế</h2>
                </div>
                <p>
                  Theo quy định pháp luật Việt Nam, dữ liệu được phân chia cụ thể trên nền tảng NovaCare bao gồm:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                    <span className="font-bold text-slate-900 text-xs uppercase tracking-wide text-[#008755]">a. Dữ liệu cá nhân cơ bản</span>
                    <p className="text-xs text-slate-600">
                      Họ tên, ngày tháng năm sinh, giới tính, nơi cư trú, số điện thoại, địa chỉ email, số căn cước công dân (CCCD/định danh), hình ảnh chân dung và thông tin thiết bị truy cập.
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                    <span className="font-bold text-slate-900 text-xs uppercase tracking-wide text-rose-600">b. Dữ liệu cá nhân nhạy cảm (Dữ liệu y tế)</span>
                    <p className="text-xs text-slate-600">
                      Tình trạng sức khỏe cá nhân, tiền sử bệnh án, kết quả cận lâm sàng (xét nghiệm, X-quang, CT, MRI, siêu âm), toa thuốc, thông tin BHYT, nội dung tư vấn khám từ xa và kết quả sàng lọc triệu chứng.
                    </p>
                  </div>
                </div>
              </section>

              {/* Section 3 */}
              <section id="collection-timing" className="space-y-3 scroll-mt-28 border-t border-slate-100 pt-8">
                <div className="flex items-center gap-2.5 text-[#008755]">
                  <Clock className="w-5 h-5" />
                  <h2 className="text-lg md:text-xl font-bold text-slate-900">3. Khi nào NovaCare thu thập dữ liệu?</h2>
                </div>
                <p>NovaCare sẽ thu thập dữ liệu cá nhân của bạn trong các trường hợp sau:</p>
                <ul className="list-disc pl-5 space-y-2 text-slate-600">
                  <li>Khi bạn đăng ký tài khoản mới, xác minh mã OTP hoặc đăng nhập vào hệ thống.</li>
                  <li>Khi bạn khởi tạo hoặc cập nhật hồ sơ bệnh nhân cho bản thân hoặc người thân trong gia đình.</li>
                  <li>Khi bạn đặt lịch khám bệnh trực tiếp tại bệnh viện, phòng khám, hoặc chọn bác sĩ chuyên khoa.</li>
                  <li>Khi bạn tham gia phòng khám trực tuyến Telemedicine (trao đổi tin nhắn hoặc gọi video với bác sĩ).</li>
                  <li>Khi bạn thực hiện tính năng Sàng lọc trước khám (Pre-exam screening) trên sơ đồ triệu chứng 2D/3D.</li>
                  <li>Khi bạn quét mã QR thẻ BHYT, CCCD hoặc chia sẻ Hộ chiếu y tế (Medical Passport).</li>
                  <li>Khi bạn thực hiện giao dịch thanh toán viện phí hoặc dịch vụ khám bệnh.</li>
                  <li>Khi bạn tương tác với tổng đài chăm sóc khách hàng 1900 6060 hoặc gửi phản hồi khiếu nại.</li>
                </ul>
              </section>

              {/* Section 4 */}
              <section id="data-types" className="space-y-4 scroll-mt-28 border-t border-slate-100 pt-8">
                <div className="flex items-center gap-2.5 text-[#008755]">
                  <FileText className="w-5 h-5" />
                  <h2 className="text-lg md:text-xl font-bold text-slate-900">4. Các loại dữ liệu chúng tôi thu thập</h2>
                </div>
                <div className="space-y-3">
                  <div className="p-3.5 rounded-xl border border-slate-200">
                    <strong className="text-slate-900">a. Dữ liệu tài khoản:</strong> Họ tên, số điện thoại, email (tùy chọn), mật khẩu đã được mã hóa 1 chiều (băm mật mã học an toàn).
                  </div>
                  <div className="p-3.5 rounded-xl border border-slate-200">
                    <strong className="text-slate-900">b. Dữ liệu hồ sơ y bạ:</strong> Họ tên người khám, ngày sinh, giới tính, quan hệ nhân thân, số định danh cá nhân/CCCD, mã số thẻ BHYT, ảnh chụp giấy tờ tùy thân khi quét mã.
                  </div>
                  <div className="p-3.5 rounded-xl border border-slate-200">
                    <strong className="text-slate-900">c. Dữ liệu phiếu đặt khám:</strong> Cơ sở y tế tiếp nhận, chuyên khoa, bác sĩ phụ trách, ngày giờ hẹn khám, lý do khám sơ bộ.
                  </div>
                  <div className="p-3.5 rounded-xl border border-slate-200">
                    <strong className="text-slate-900">d. Dữ liệu thanh toán:</strong> Mã giao dịch tham chiếu, số tiền thanh toán, thời gian giao dịch. <em>(Lưu ý: NovaCare không lưu giữ số thẻ tín dụng hoặc mật khẩu tài khoản ngân hàng của bạn)</em>.
                  </div>
                  <div className="p-3.5 rounded-xl border border-slate-200">
                    <strong className="text-slate-900">e. Dữ liệu khám bệnh & cận lâm sàng:</strong> Kết quả xét nghiệm, phiếu chỉ định, toa thuốc điều trị, chẩn đoán của bác sĩ, tiền sử bệnh án.
                  </div>
                  <div className="p-3.5 rounded-xl border border-slate-200">
                    <strong className="text-slate-900">f. Dữ liệu kỹ thuật & định vị:</strong> Địa chỉ IP, loại thiết bị, hệ điều hành di động, vị trí địa lý (GPS - chỉ thu thập khi bạn chủ động cho phép để tìm cơ sở y tế gần nhất).
                  </div>
                </div>
              </section>

              {/* Section 5 */}
              <section id="purposes" className="space-y-3 scroll-mt-28 border-t border-slate-100 pt-8">
                <div className="flex items-center gap-2.5 text-[#008755]">
                  <Eye className="w-5 h-5" />
                  <h2 className="text-lg md:text-xl font-bold text-slate-900">5. Mục đích sử dụng dữ liệu</h2>
                </div>
                <p>NovaCare xử lý dữ liệu của bạn vì các mục đích thiết yếu sau:</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs md:text-sm">
                  <div className="flex items-start gap-2 p-3 bg-slate-50 rounded-xl">
                    <CheckCircle2 className="w-4 h-4 text-[#008755] shrink-0 mt-0.5" />
                    <span>Xác nhận lịch khám và gửi phiếu tiếp nhận đến Bệnh viện đối tác.</span>
                  </div>
                  <div className="flex items-start gap-2 p-3 bg-slate-50 rounded-xl">
                    <CheckCircle2 className="w-4 h-4 text-[#008755] shrink-0 mt-0.5" />
                    <span>Lưu trữ hồ sơ y bạ số, phục vụ theo dõi sức khỏe liên tục suốt đời.</span>
                  </div>
                  <div className="flex items-start gap-2 p-3 bg-slate-50 rounded-xl">
                    <CheckCircle2 className="w-4 h-4 text-[#008755] shrink-0 mt-0.5" />
                    <span>Gửi thông báo nhắc lịch, cập nhật kết quả cận lâm sàng qua Push Notification/SMS/Email.</span>
                  </div>
                  <div className="flex items-start gap-2 p-3 bg-slate-50 rounded-xl">
                    <CheckCircle2 className="w-4 h-4 text-[#008755] shrink-0 mt-0.5" />
                    <span>Hỗ trợ giải đáp thắc mắc, xử lý khiếu nại qua tổng đài 1900 6060.</span>
                  </div>
                  <div className="flex items-start gap-2 p-3 bg-slate-50 rounded-xl">
                    <CheckCircle2 className="w-4 h-4 text-[#008755] shrink-0 mt-0.5" />
                    <span>Thực hiện đối soát giao dịch thanh toán viện phí minh bạch.</span>
                  </div>
                  <div className="flex items-start gap-2 p-3 bg-slate-50 rounded-xl">
                    <CheckCircle2 className="w-4 h-4 text-[#008755] shrink-0 mt-0.5" />
                    <span>Tuân thủ nghĩa vụ lưu trữ hồ sơ bệnh án theo Luật Khám bệnh, chữa bệnh.</span>
                  </div>
                </div>
              </section>

              {/* Section 6 */}
              <section id="telemedicine" className="space-y-3 scroll-mt-28 border-t border-slate-100 pt-8">
                <div className="flex items-center gap-2.5 text-[#008755]">
                  <Video className="w-5 h-5" />
                  <h2 className="text-lg md:text-xl font-bold text-slate-900">6. Bảo mật tư vấn từ xa (Telemedicine)</h2>
                </div>
                <p>
                  Khi người dùng sử dụng tiện ích Khám bệnh từ xa thông qua ứng dụng NovaCare và bác sĩ phụ trách:
                </p>
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs md:text-sm text-amber-900 space-y-2">
                  <p>
                    <strong>Thời hạn lưu trữ cuộc gọi video:</strong> Nhằm phục vụ việc xử lý sự cố kỹ thuật hoặc tranh chấp chuyên môn y khoa (nếu có yêu cầu từ người bệnh hoặc bác sĩ), dữ liệu cuộc gọi video được lưu trữ <strong>tối đa 30 ngày</strong>. Sau thời hạn 30 ngày này, nội dung video sẽ được <strong>xóa hoàn toàn và vĩnh viễn khỏi hệ thống</strong>.
                  </p>
                  <p>
                    <strong>Nội dung trao đổi tin nhắn (chat):</strong> Được mã hóa và lưu trữ an toàn để người bệnh có thể dễ dàng xem lại dặn dò, đơn thuốc và hướng dẫn điều trị của bác sĩ bất kỳ lúc nào.
                  </p>
                </div>
              </section>

              {/* Section 7 */}
              <section id="security" className="space-y-3 scroll-mt-28 border-t border-slate-100 pt-8">
                <div className="flex items-center gap-2.5 text-[#008755]">
                  <Lock className="w-5 h-5" />
                  <h2 className="text-lg md:text-xl font-bold text-slate-900">7. Biện pháp kỹ thuật & an toàn dữ liệu</h2>
                </div>
                <p>NovaCare áp dụng tiêu chuẩn bảo mật y tế nhiều lớp:</p>
                <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
                  <li><strong>Mã hóa đường truyền (In-Transit):</strong> Sử dụng giao thức bảo mật SSL/TLS 1.3 đối với mọi tương tác giữa ứng dụng và máy chủ.</li>
                  <li><strong>Mã hóa dữ liệu lưu trữ (At-Rest):</strong> Dữ liệu y tế và bệnh án được mã hóa cơ sở dữ liệu tiêu chuẩn công nghiệp (AES-256).</li>
                  <li><strong>Mật khẩu người dùng:</strong> Băm 1 chiều không thể khôi phục ngược (One-way cryptographic hash).</li>
                  <li><strong>Kiểm soát phân quyền nghiêm ngặt (RBAC):</strong> Chỉ bác sĩ được chỉ định tiếp nhận hồ sơ mới có thẩm quyền tra cứu dữ liệu y tế của ca khám đó.</li>
                </ul>
              </section>

              {/* Section 8 */}
              <section id="sharing" className="space-y-3 scroll-mt-28 border-t border-slate-100 pt-8">
                <div className="flex items-center gap-2.5 text-[#008755]">
                  <Share2 className="w-5 h-5" />
                  <h2 className="text-lg md:text-xl font-bold text-slate-900">8. Nguyên tắc chia sẻ cho bên thứ ba</h2>
                </div>
                <p>
                  NovaCare <strong>chỉ chia sẻ dữ liệu ở mức tối thiểu cần thiết</strong> cho các bên sau:
                </p>
                <ol className="list-decimal pl-5 space-y-2 text-slate-600">
                  <li><strong>Cơ sở y tế & Bác sĩ tiếp nhận:</strong> Nhằm phục vụ công tác khám bệnh, kê đơn và lưu trữ bệnh án theo quy định ngành y tế.</li>
                  <li><strong>Cổng thanh toán trung gian:</strong> Chuyển tiếp mã hóa thông tin giao dịch để thanh toán viện phí thành công.</li>
                  <li><strong>Đơn vị viễn thông (SMS OTP / Zalo ZNS):</strong> Để chuyển tải mã OTP xác thực và tin nhắn nhắc lịch khám.</li>
                  <li><strong>Cơ quan pháp luật nhà nước:</strong> Chỉ cung cấp khi có yêu cầu bằng văn bản chính thức theo quy định pháp luật tố tụng Việt Nam.</li>
                </ol>
              </section>

              {/* Section 9 */}
              <section id="user-rights" className="space-y-3 scroll-mt-28 border-t border-slate-100 pt-8">
                <div className="flex items-center gap-2.5 text-[#008755]">
                  <UserCheck className="w-5 h-5" />
                  <h2 className="text-lg md:text-xl font-bold text-slate-900">9. Quyền & nghĩa vụ của người dùng</h2>
                </div>
                <p>Theo Nghị định 13/2023/NĐ-CP, bạn có các quyền hợp pháp sau:</p>
                <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
                  <li><strong>Quyền được biết & đồng ý:</strong> Được thông báo rõ ràng về mọi hoạt động xử lý dữ liệu.</li>
                  <li><strong>Quyền truy cập & chỉnh sửa:</strong> Bạn có quyền tự do tra cứu, cập nhật thông tin hồ sơ sức khỏe trong mục “Hồ sơ & Y bạ”.</li>
                  <li><strong>Quyền xóa dữ liệu / hủy tài khoản:</strong> Bạn có thể yêu cầu xóa tài khoản (ngoại trừ các chứng từ tài chính hoặc bệnh án bắt buộc phải lưu trữ theo quy chế chuyên môn của Bộ Y tế).</li>
                  <li><strong>Quyền rút lại sự đồng ý:</strong> Bằng cách gửi văn bản hoặc thông báo đến bộ phận Chăm sóc khách hàng của NovaCare.</li>
                </ul>
              </section>

              {/* Section 10 */}
              <section id="contact" className="space-y-3 scroll-mt-28 border-t border-slate-100 pt-8">
                <div className="flex items-center gap-2.5 text-[#008755]">
                  <Phone className="w-5 h-5" />
                  <h2 className="text-lg md:text-xl font-bold text-slate-900">10. Đầu mối liên hệ & khiếu nại</h2>
                </div>
                <p>
                  Mọi thắc mắc, yêu cầu thực hiện quyền chủ thể dữ liệu hoặc khiếu nại liên quan đến an toàn dữ liệu cá nhân, vui lòng liên hệ:
                </p>
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-2.5 text-xs md:text-sm">
                  <div className="font-bold text-slate-900">BAN QUẢN TRỊ NỀN TẢNG Y TẾ SỐ NOVACARE</div>
                  <div>• <strong>Tổng đài hỗ trợ y tế:</strong> <span className="text-[#008755] font-bold">1900 6060</span> (8:00 - 20:00 các ngày trong tuần)</div>
                  <div>• <strong>Email Bảo vệ Dữ liệu (DPO):</strong> <span className="text-[#008755] font-semibold">privacy@novacare.vn</span></div>
                  <div>• <strong>Email Hỗ trợ chung:</strong> <span className="text-slate-800">support@novacare.vn</span></div>
                  <div>• <strong>Website chính thức:</strong> <Link href="/" className="text-[#008755] underline">https://novacare.vn</Link></div>
                </div>
              </section>

            </div>
          </main>

        </div>
      </div>
    </div>
  );
}
