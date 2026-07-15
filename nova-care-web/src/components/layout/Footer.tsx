import Link from 'next/link';

export function Footer() {
  return (
    <footer className="bg-secondary text-gray-300">
      <div className="container-custom py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-secondary font-bold text-sm">N</span>
              </div>
              <span className="text-xl font-bold text-white">
                Nova<span className="text-primary-dark">Care</span>
              </span>
            </div>
            <p className="text-sm text-gray-400">
              Nền tảng đặt lịch khám trực tuyến hàng đầu Việt Nam.
              Kết nối bệnh nhân với các cơ sở y tế uy tín.
            </p>
          </div>
          {/* Quick links */}
          <div>
            <h4 className="text-white font-semibold mb-4">Liên kết nhanh</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/bac-si" className="hover:text-primary transition">Bác sĩ</Link></li>
              <li><Link href="/co-so-y-te" className="hover:text-primary transition">Cơ sở y tế</Link></li>
              <li><Link href="/chuyen-khoa" className="hover:text-primary transition">Chuyên khoa</Link></li>
            </ul>
          </div>
          {/* Support */}
          <div>
            <h4 className="text-white font-semibold mb-4">Hỗ trợ</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/ve-chung-toi" className="hover:text-primary transition">Về chúng tôi</Link></li>
              <li><Link href="/lien-he" className="hover:text-primary transition">Liên hệ</Link></li>
              <li><Link href="/cau-hoi-thuong-gap" className="hover:text-primary transition">Câu hỏi thường gặp</Link></li>
            </ul>
          </div>
          {/* Contact */}
          <div>
            <h4 className="text-white font-semibold mb-4">Liên hệ</h4>
            <ul className="space-y-2 text-sm">
              <li>📞 Hotline: 1900 1234</li>
              <li>✉️ Email: support@novacare.vn</li>
              <li>📍 Địa chỉ: TP. Hồ Chí Minh</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-800 mt-8 pt-8 text-sm text-gray-400 text-center">
          © {new Date().getFullYear()} NovaCare. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
