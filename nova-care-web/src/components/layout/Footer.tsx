import Link from 'next/link';
import { Phone, Mail, MapPin, Sparkles } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-[#142330] text-gray-300 relative overflow-hidden">
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
