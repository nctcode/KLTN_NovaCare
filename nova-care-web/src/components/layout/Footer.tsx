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
          {/* EKG wave running horizontally at the bottom half */}
          <path
            d="M -100 180 L 150 180 L 160 170 L 170 180 L 180 230 L 190 100 L 200 200 L 210 180 L 225 170 L 240 180 L 500 180 L 510 170 L 520 180 L 530 230 L 540 100 L 550 200 L 560 180 L 1500 180"
            fill="none"
            stroke="url(#footer-ekg-gradient)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="opacity-70 animate-pulse"
          />
          {/* Scattered plus/crosses */}
          <g fill="none" stroke="#66FF33" strokeWidth="2" strokeLinecap="round" className="opacity-40">
            <path d="M 80 50 L 80 62 M 74 56 L 86 56" />
            <path d="M 450 100 L 450 112 M 444 106 L 456 106" />
            <path d="M 900 60 L 900 72 M 894 66 L 906 66" />
          </g>
        </svg>
      </div>

      {/* Radial soft glow for Footer */}
      <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-[#4CAF50]/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -top-20 -right-20 w-80 h-80 bg-[#66FF33]/5 rounded-full blur-3xl pointer-events-none" />
      <div className="container-custom py-12 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-[#4CAF50] rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">N</span>
              </div>
              <span className="text-xl font-bold text-white tracking-wide">
                NovaCare
              </span>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed">
              Nền tảng đặt lịch khám trực tuyến hàng đầu Việt Nam.
              Kết nối bệnh nhân với các cơ sở y tế uy tín.
            </p>
          </div>
          {/* Quick links */}
          <div>
            <h4 className="text-white font-semibold mb-4">Liên kết nhanh</h4>
            <ul className="space-y-3 text-sm">
              <li><Link href="/bac-si" className="hover:text-[#66FF33] transition">Bác sĩ</Link></li>
              <li><Link href="/co-so-y-te" className="hover:text-[#66FF33] transition">Cơ sở y tế</Link></li>
              <li><Link href="/chuyen-khoa" className="hover:text-[#66FF33] transition">Chuyên khoa</Link></li>
            </ul>
          </div>
          {/* Support */}
          <div>
            <h4 className="text-white font-semibold mb-4">Hỗ trợ</h4>
            <ul className="space-y-3 text-sm">
              <li><Link href="/ve-chung-toi" className="hover:text-[#66FF33] transition">Về chúng tôi</Link></li>
              <li><Link href="/lien-he" className="hover:text-[#66FF33] transition">Liên hệ</Link></li>
              <li><Link href="/cau-hoi-thuong-gap" className="hover:text-[#66FF33] transition">Câu hỏi thường gặp</Link></li>
            </ul>
          </div>
          {/* Contact */}
          <div>
            <h4 className="text-white font-semibold mb-4">Liên hệ</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2">
                <span className="inline-flex p-1.5 rounded bg-pink-500/10 text-pink-400">
                  <Phone className="h-4 w-4" />
                </span>
                <span>Hotline: 1900 1234</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="inline-flex p-1.5 rounded bg-blue-500/10 text-blue-400">
                  <Mail className="h-4 w-4" />
                </span>
                <span>Email: support@novacare.vn</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="inline-flex p-1.5 rounded bg-rose-500/10 text-rose-400">
                  <MapPin className="h-4 w-4" />
                </span>
                <span>Địa chỉ: TP. Hồ Chí Minh</span>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-800 mt-8 pt-8 text-sm text-gray-400 text-center flex flex-col sm:flex-row justify-between items-center gap-4">
          <p>© {new Date().getFullYear()} NovaCare. All rights reserved.</p>
          <div className="flex items-center gap-4 text-xs">
            <Link href="/dieu-khoan" className="hover:text-white">Điều khoản sử dụng</Link>
            <span className="text-gray-600">|</span>
            <Link href="/chinh-sach" className="hover:text-white">Chính sách bảo mật</Link>
          </div>
        </div>
      </div>
      {/* Decorative sparkle icon on the right */}
      <div className="absolute right-8 bottom-12 text-gray-700/30 pointer-events-none animate-pulse">
        <Sparkles className="h-16 w-16" />
      </div>
    </footer>
  );
}
