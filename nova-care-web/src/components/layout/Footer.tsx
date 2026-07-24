import Link from 'next/link';
import { Phone, Mail, MapPin, Sparkles } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-[#142330] text-gray-300 relative overflow-hidden">
      {/* Subtle medical background pattern for Footer */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.08] select-none">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="footer-ekg-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#4CAF50" stopOpacity="0.1" />
              <stop offset="50%" stopColor="#66FF33" stopOpacity="1" />
              <stop offset="100%" stopColor="#4CAF50" stopOpacity="0.1" />
            </linearGradient>
            <pattern id="footer-grid" width="60" height="60" patternUnits="userSpaceOnUse">
              <path d="M 60 0 L 0 0 0 60" fill="none" stroke="rgba(102, 255, 51, 0.04)" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#footer-grid)" />
          {/* EKG wave running horizontally */}
          <path
            d="M -100 180 L 150 180 L 160 170 L 170 180 L 180 230 L 190 100 L 200 200 L 210 180 L 225 170 L 240 180 L 500 180 L 510 170 L 520 180 L 530 230 L 540 100 L 550 200 L 560 180 L 1500 180"
            fill="none"
            stroke="url(#footer-ekg-gradient)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="opacity-70 animate-pulse"
          />
        </svg>
      </div>

      {/* Radial soft glow for Footer */}
      <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-[#4CAF50]/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -top-20 -right-20 w-80 h-80 bg-[#66FF33]/5 rounded-full blur-3xl pointer-events-none" />

      <div className="container-custom py-12 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
          {/* Company Intro */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2.5 mb-2">
              <div className="w-8 h-8 bg-[#66FF33] rounded-lg flex items-center justify-center shadow-sm">
                <span className="text-[#0c4b39] font-black text-base">N</span>
              </div>
              <span className="text-xl font-black text-white tracking-wide">
                NovaCare
              </span>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed max-w-sm">
              Nền tảng công nghệ y tế và đặt lịch khám trực tuyến hàng đầu Việt Nam.
              Kết nối người bệnh với 500+ bác sĩ chuyên khoa và 100+ bệnh viện, phòng khám uy tín trên toàn quốc.
            </p>
            <div className="pt-2 text-xs text-[#66FF33] font-bold">
              Hotline hỗ trợ 24/7: 1900 1234
            </div>
          </div>

          {/* Dịch vụ & Cơ sở */}
          <div>
            <h4 className="text-white font-bold text-sm mb-4">Danh mục chính</h4>
            <ul className="space-y-2.5 text-xs">
              <li><Link href="/co-so-y-te" className="hover:text-[#66FF33] transition">Cơ sở y tế liên kết</Link></li>
              <li><Link href="/dich-vu" className="hover:text-[#66FF33] transition">Dịch vụ y tế toàn diện</Link></li>
              <li><Link href="/bac-si" className="hover:text-[#66FF33] transition">Đặt khám theo Bác sĩ</Link></li>
              <li><Link href="/chuyen-khoa" className="hover:text-[#66FF33] transition">Đặt khám theo Chuyên khoa</Link></li>
              <li><Link href="/doanh-nghiep" className="hover:text-[#66FF33] transition font-bold text-[#66FF33]">Khám sức khỏe Doanh nghiệp</Link></li>
            </ul>
          </div>

          {/* Tin tức & Hướng dẫn */}
          <div>
            <h4 className="text-white font-bold text-sm mb-4">Thông tin & Hướng dẫn</h4>
            <ul className="space-y-2.5 text-xs">
              <li><Link href="/tin-tuc" className="hover:text-[#66FF33] transition">Tin tức & Sức khỏe</Link></li>
              <li><Link href="/huong-dan" className="hover:text-[#66FF33] transition">Hướng dẫn đặt lịch khám</Link></li>
              <li><Link href="/cau-hoi-thuong-gap" className="hover:text-[#66FF33] transition">Câu hỏi thường gặp (FAQ)</Link></li>
              <li><Link href="/lien-he-hop-tac" className="hover:text-[#66FF33] transition">Liên hệ hợp tác Bệnh viện / Bác sĩ</Link></li>
              <li><Link href="/ve-chung-toi" className="hover:text-[#66FF33] transition">Về chúng tôi (NovaCare)</Link></li>
            </ul>
          </div>

          {/* Contact & Social */}
          <div>
            <h4 className="text-white font-bold text-sm mb-4">Liên hệ hỗ trợ</h4>
            <ul className="space-y-3 text-xs">
              <li className="flex items-center gap-2">
                <span className="inline-flex p-1.5 rounded bg-emerald-500/10 text-[#66FF33]">
                  <Phone className="h-3.5 w-3.5" />
                </span>
                <span>Hotline: 1900 1234</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="inline-flex p-1.5 rounded bg-blue-500/10 text-blue-400">
                  <Mail className="h-3.5 w-3.5" />
                </span>
                <span>support@novacare.vn</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="inline-flex p-1.5 rounded bg-rose-500/10 text-rose-400">
                  <MapPin className="h-3.5 w-3.5" />
                </span>
                <span>TP. Hồ Chí Minh</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-10 pt-6 text-xs text-gray-400 text-center flex flex-col sm:flex-row justify-between items-center gap-4">
          <p>© {new Date().getFullYear()} NovaCare. Hệ thống Đặt lịch & Chăm sóc Y tế.</p>
          <div className="flex items-center gap-4 text-xs">
            <Link href="/dieu-khoan" className="hover:text-white transition">Điều khoản sử dụng</Link>
            <span className="text-gray-700">|</span>
            <Link href="/chinh-sach" className="hover:text-white transition">Chính sách bảo mật</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
