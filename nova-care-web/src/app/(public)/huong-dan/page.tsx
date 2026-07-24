'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import {
  Compass,
  FileText,
  CreditCard,
  HelpCircle,
  CheckCircle2,
  ChevronRight,
  Search,
  Calendar,
  Building2,
  PhoneCall,
  QrCode,
  UserCheck,
  Stethoscope,
  Pill,
  Clock,
  Zap,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';

export default function GuideCenterPage() {
  const [activeTab, setActiveTab] = useState<'all' | 'online' | 'hospital' | 'payment'>('all');

  return (
    <div className="bg-[#F8F9FA] min-h-screen pb-24">
      {/* Hero Header */}
      <section className="bg-[#0c4b39] text-white py-16 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(102,255,51,0.15),transparent_60%)] pointer-events-none" />
        <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center space-y-4">
          <span className="text-xs uppercase font-extrabold tracking-widest text-[#66FF33] bg-white/10 px-4 py-1.5 rounded-full border border-white/15 inline-flex items-center gap-1.5">
            <Zap className="h-3.5 w-3.5 text-[#66FF33]" /> Cẩm Nang & Hướng Dẫn NovaCare
          </span>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white">
            Trung Tâm Hướng Dẫn Đặt Khám & Quy Trình Y Tế
          </h1>
          <p className="text-white/80 max-w-2xl mx-auto text-sm md:text-base leading-relaxed">
            Phân biệt chi tiết giữa <strong className="text-[#66FF33]">Quy trình Đặt lịch Online</strong> tiện lợi tại nhà và <strong className="text-[#66FF33]">Quy trình Đón tiếp Khám tại viện</strong> chuẩn ưu tiên.
          </p>

          {/* Quick Filter Tabs */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-4">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-5 py-2.5 rounded-full text-xs font-extrabold transition-all ${
                activeTab === 'all'
                  ? 'bg-[#66FF33] text-[#0c4b39] shadow-lg scale-105'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              Tất cả hướng dẫn
            </button>
            <button
              onClick={() => setActiveTab('online')}
              className={`px-5 py-2.5 rounded-full text-xs font-extrabold transition-all ${
                activeTab === 'online'
                  ? 'bg-[#66FF33] text-[#0c4b39] shadow-lg scale-105'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              📱 4 Bước Đặt Khám Online
            </button>
            <button
              onClick={() => setActiveTab('hospital')}
              className={`px-5 py-2.5 rounded-full text-xs font-extrabold transition-all ${
                activeTab === 'hospital'
                  ? 'bg-[#66FF33] text-[#0c4b39] shadow-lg scale-105'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              🏥 4 Bước Quy Trình Tại Bệnh Viện
            </button>
            <button
              onClick={() => setActiveTab('payment')}
              className={`px-5 py-2.5 rounded-full text-xs font-extrabold transition-all ${
                activeTab === 'payment'
                  ? 'bg-[#66FF33] text-[#0c4b39] shadow-lg scale-105'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              💳 Thanh Toán & Hoàn Phí
            </button>
          </div>
        </div>
      </section>

      <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 mt-12 space-y-16">

        {/* SECTION 1: COMPARISON INFOGRAPHIC - Khám Truyền Thống vs Đặt Khám Qua NovaCare */}
        <section className="bg-white rounded-3xl border border-slate-200 p-6 md:p-10 shadow-sm">
          <div className="text-center max-w-2xl mx-auto mb-8 space-y-2">
            <span className="text-[11px] uppercase font-bold tracking-wider text-[#0c4b39] bg-[#0c4b39]/10 px-3 py-1 rounded-full">
              So sánh trực quan
            </span>
            <h2 className="text-2xl md:text-3xl font-black text-slate-900">
              Tại sao nên sử dụng NovaCare thay vì Khám truyền thống?
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Traditional Method */}
            <div className="bg-rose-50/60 rounded-2xl p-6 border border-rose-100 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-500 text-white font-black flex items-center justify-center text-sm shadow-xs">
                  ❌
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">Khám Bệnh Truyền Thống</h3>
                  <p className="text-xs text-slate-500">Quy trình tự túc, xếp hàng trực tiếp</p>
                </div>
              </div>
              <ul className="space-y-3 text-xs text-slate-700">
                <li className="flex items-start gap-2.5">
                  <Clock className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
                  <span>Phải dậy từ 4h - 5h sáng xếp hàng lấy số thứ tự tại viện.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Clock className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
                  <span>Chờ đợi mệt mỏi từ 2 - 4 tiếng tại phòng chờ đông đúc.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Clock className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
                  <span>Không thể lựa chọn trước Bác sĩ khám hay Giờ khám mong muốn.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Clock className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
                  <span>Dễ thất lạc sổ khám bệnh giấy và phiếu kết quả xét nghiệm.</span>
                </li>
              </ul>
            </div>

            {/* NovaCare Method */}
            <div className="bg-[#0c4b39]/5 rounded-2xl p-6 border border-[#0c4b39]/20 space-y-4 relative overflow-hidden">
              <div className="absolute -top-3 -right-3 bg-[#66FF33] text-[#0c4b39] text-[10px] font-extrabold px-4 py-1 rounded-bl-xl shadow-xs uppercase tracking-wider">
                Ưu tiên 100%
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#0c4b39] text-[#66FF33] font-black flex items-center justify-center text-sm shadow-xs">
                  ⚡
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">Đặt Khám Qua NovaCare</h3>
                  <p className="text-xs text-slate-500">Quy trình thông minh & Tiết kiệm thời gian</p>
                </div>
              </div>
              <ul className="space-y-3 text-xs text-slate-700">
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-[#0c4b39] shrink-0 mt-0.5" />
                  <span className="font-semibold text-slate-900">Chủ động đặt lịch trước 30 ngày ngay tại nhà chỉ trong 1 phút.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-[#0c4b39] shrink-0 mt-0.5" />
                  <span className="font-semibold text-slate-900">Đến viện đúng giờ hẹn, Quét mã QR vào thẳng Quầy Đón Tiếp Ưu Tiên.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-[#0c4b39] shrink-0 mt-0.5" />
                  <span className="font-semibold text-slate-900">Tự do chọn Bác sĩ Chuyên khoa giỏi, GS/TS và khung giờ phù hợp.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-[#0c4b39] shrink-0 mt-0.5" />
                  <span className="font-semibold text-slate-900">Lưu trữ Hồ sơ sức khỏe, Mã QR và Đơn thuốc điện tử vĩnh viễn trên App.</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* SECTION 2: DETAILED VISUAL WORKFLOW 1 - HUONG DAN DAT LICH KHAM ONLINE */}
        {(activeTab === 'all' || activeTab === 'online') && (
          <section className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
              <div>
                <span className="text-xs uppercase font-extrabold tracking-wider text-[#0c4b39] bg-[#0c4b39]/10 px-3 py-1 rounded-full">
                  Cẩm nang 1
                </span>
                <h2 className="text-2xl font-black text-slate-900 mt-2 flex items-center gap-2">
                  <Compass className="h-6 w-6 text-[#0c4b39]" /> Hướng Dẫn 4 Bước Đặt Lịch Khám Online
                </h2>
              </div>
              <Link
                href="/huong-dan/dat-lich"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0c4b39] hover:underline"
              >
                Xem trang chi tiết <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Step 1 */}
              <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 hover:shadow-lg transition group relative">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#0c4b39] font-black text-xl flex items-center justify-center group-hover:bg-[#0c4b39] group-hover:text-[#66FF33] transition duration-300 shadow-xs">
                  01
                </div>
                <div className="h-28 bg-emerald-50/50 rounded-2xl border border-emerald-100 flex items-center justify-center p-4">
                  <Search className="h-10 w-10 text-[#0c4b39] group-hover:scale-110 transition duration-300" />
                </div>
                <h3 className="font-extrabold text-slate-900 text-sm">1. Tìm Bác sĩ / Cơ sở y tế</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Nhập tên Bác sĩ, chọn Chuyên khoa hoặc Bệnh viện phù hợp trên thanh tìm kiếm thông minh.
                </p>
              </div>

              {/* Step 2 */}
              <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 hover:shadow-lg transition group relative">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#0c4b39] font-black text-xl flex items-center justify-center group-hover:bg-[#0c4b39] group-hover:text-[#66FF33] transition duration-300 shadow-xs">
                  02
                </div>
                <div className="h-28 bg-emerald-50/50 rounded-2xl border border-emerald-100 flex items-center justify-center p-4">
                  <Calendar className="h-10 w-10 text-[#0c4b39] group-hover:scale-110 transition duration-300" />
                </div>
                <h3 className="font-extrabold text-slate-900 text-sm">2. Chọn Ngày & Khung giờ</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Xem lịch làm việc khả dụng của bác sĩ và chọn khung giờ khám thuận tiện nhất (Sáng/Chiều).
                </p>
              </div>

              {/* Step 3 */}
              <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 hover:shadow-lg transition group relative">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#0c4b39] font-black text-xl flex items-center justify-center group-hover:bg-[#0c4b39] group-hover:text-[#66FF33] transition duration-300 shadow-xs">
                  03
                </div>
                <div className="h-28 bg-emerald-50/50 rounded-2xl border border-emerald-100 flex items-center justify-center p-4">
                  <UserCheck className="h-10 w-10 text-[#0c4b39] group-hover:scale-110 transition duration-300" />
                </div>
                <h3 className="font-extrabold text-slate-900 text-sm">3. Điền hồ sơ bệnh nhân</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Nhập Họ tên, Ngày sinh, CCCD và Mã số Bảo hiểm y tế (BHYT) để hưởng quyền lợi đúng tuyến.
                </p>
              </div>

              {/* Step 4 */}
              <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 hover:shadow-lg transition group relative">
                <div className="w-12 h-12 rounded-2xl bg-[#0c4b39] text-[#66FF33] font-black text-xl flex items-center justify-center shadow-xs">
                  04
                </div>
                <div className="h-28 bg-emerald-50/50 rounded-2xl border border-emerald-100 flex items-center justify-center p-4">
                  <QrCode className="h-10 w-10 text-[#0c4b39] group-hover:scale-110 transition duration-300" />
                </div>
                <h3 className="font-extrabold text-slate-900 text-sm">4. Nhận Phiếu khám QR Code</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Xác nhận đặt lịch và nhận Phiếu khám điện tử kèm mã QR lưu trong tài khoản & gửi qua tin nhắn.
                </p>
              </div>
            </div>
          </section>
        )}

        {/* SECTION 3: DETAILED VISUAL WORKFLOW 2 - QUY TRINH KHAM TAI BENH VIEN */}
        {(activeTab === 'all' || activeTab === 'hospital') && (
          <section className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
              <div>
                <span className="text-xs uppercase font-extrabold tracking-wider text-teal-700 bg-teal-100 px-3 py-1 rounded-full">
                  Cẩm nang 2
                </span>
                <h2 className="text-2xl font-black text-slate-900 mt-2 flex items-center gap-2">
                  <Building2 className="h-6 w-6 text-teal-700" /> Quy Trình 4 Bước Đón Tiếp & Khám Tại Bệnh Viện
                </h2>
              </div>
              <Link
                href="/huong-dan/quy-trinh-kham"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-700 hover:underline"
              >
                Xem trang chi tiết <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Step 1 */}
              <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 hover:shadow-lg transition group relative">
                <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-800 font-black text-xl flex items-center justify-center group-hover:bg-teal-700 group-hover:text-white transition duration-300 shadow-xs">
                  01
                </div>
                <div className="h-28 bg-teal-50/50 rounded-2xl border border-teal-100 flex items-center justify-center p-4">
                  <QrCode className="h-10 w-10 text-teal-700 group-hover:scale-110 transition duration-300" />
                </div>
                <h3 className="font-extrabold text-slate-900 text-sm">1. Quét QR tại Quầy Đón Tiếp</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Đến viện trước 15 phút, xuất trình Mã QR Code tại <strong>Quầy Đón Tiếp Ưu Tiên NovaCare</strong> để lấy số thứ tự.
                </p>
              </div>

              {/* Step 2 */}
              <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 hover:shadow-lg transition group relative">
                <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-800 font-black text-xl flex items-center justify-center group-hover:bg-teal-700 group-hover:text-white transition duration-300 shadow-xs">
                  02
                </div>
                <div className="h-28 bg-teal-50/50 rounded-2xl border border-teal-100 flex items-center justify-center p-4">
                  <Stethoscope className="h-10 w-10 text-teal-700 group-hover:scale-110 transition duration-300" />
                </div>
                <h3 className="font-extrabold text-slate-900 text-sm">2. Khám Lâm Sàng Với Bác Sĩ</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Đến phòng khám chuyên khoa theo số điện tử hiển thị ngoài cửa phòng. Bác sĩ thăm khám & chẩn đoán ban đầu.
                </p>
              </div>

              {/* Step 3 */}
              <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 hover:shadow-lg transition group relative">
                <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-800 font-black text-xl flex items-center justify-center group-hover:bg-teal-700 group-hover:text-white transition duration-300 shadow-xs">
                  03
                </div>
                <div className="h-28 bg-teal-50/50 rounded-2xl border border-teal-100 flex items-center justify-center p-4">
                  <FileText className="h-10 w-10 text-teal-700 group-hover:scale-110 transition duration-300" />
                </div>
                <h3 className="font-extrabold text-slate-900 text-sm">3. Thực hiện Cận lâm sàng</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Di chuyển làm Xét nghiệm máu, Siêu âm hoặc Chụp X-Quang/MRI nếu bác sĩ có chỉ định thêm.
                </p>
              </div>

              {/* Step 4 */}
              <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 hover:shadow-lg transition group relative">
                <div className="w-12 h-12 rounded-2xl bg-teal-700 text-white font-black text-xl flex items-center justify-center shadow-xs">
                  04
                </div>
                <div className="h-28 bg-teal-50/50 rounded-2xl border border-teal-100 flex items-center justify-center p-4">
                  <Pill className="h-10 w-10 text-teal-700 group-hover:scale-110 transition duration-300" />
                </div>
                <h3 className="font-extrabold text-slate-900 text-sm">4. Đọc Kết Quả & Nhận Thuốc</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Quay lại nghe bác sĩ tư vấn kết quả, nhận Đơn thuốc điện tử và lấy thuốc tại Nhà thuốc viện hoặc nhận tại nhà.
                </p>
              </div>
            </div>
          </section>
        )}

        {/* SECTION 4: PAYMENT & REFUND GUIDE */}
        {(activeTab === 'all' || activeTab === 'payment') && (
          <section className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-amber-50 text-amber-700">
                  <CreditCard className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900">Hướng Dẫn Thanh Toán & Chính Sách Hoàn Phí</h2>
                  <p className="text-xs text-slate-500">Đa dạng cổng thanh toán an toàn & cam kết minh bạch</p>
                </div>
              </div>
              <Link href="/huong-dan/thanh-toan" className="text-xs font-bold text-[#0c4b39] hover:underline flex items-center gap-1">
                Xem chi tiết <ChevronRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#0c4b39] bg-[#0c4b39]/10 px-2.5 py-0.5 rounded-md">
                  Phương thức
                </span>
                <h4 className="font-bold text-slate-900 text-sm">Ví Điện Tử & QR Ngân Hàng</h4>
                <p className="text-xs text-slate-500">Hỗ trợ quét mã VNPAY-QR, VietQR, Ví MoMo, ZaloPay, ShopeePay tức thì.</p>
              </div>

              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#0c4b39] bg-[#0c4b39]/10 px-2.5 py-0.5 rounded-md">
                  Chính sách
                </span>
                <h4 className="font-bold text-slate-900 text-sm">Hoàn Phí 100% Khi Hủy Lịch</h4>
                <p className="text-xs text-slate-500">Bệnh nhân hủy lịch trước 24h được tự động hoàn tiền 100% về tài khoản ban đầu.</p>
              </div>

              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#0c4b39] bg-[#0c4b39]/10 px-2.5 py-0.5 rounded-md">
                  Bảo mật
                </span>
                <h4 className="font-bold text-slate-[#0c4b39] text-sm flex items-center gap-1">
                  <ShieldCheck className="h-4 w-4" /> Chuẩn Tiêu Chuẩn Y Tế ISO
                </h4>
                <p className="text-xs text-slate-500">Thông tin giao dịch mã hóa SSL 256-bit đảm bảo an toàn thông tin cá nhân.</p>
              </div>
            </div>
          </section>
        )}

        {/* Support Hotline Footer Banner */}
        <div className="bg-gradient-to-r from-[#0c4b39] to-[#083327] rounded-3xl p-8 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
          <div className="space-y-2 text-center md:text-left">
            <h3 className="text-xl font-bold">Bạn vẫn cần tư vấn thêm về Quy trình khám?</h3>
            <p className="text-white/70 text-xs">Đội ngũ tổng đài viên y tế NovaCare hỗ trợ 24/7 giải đáp mọi thắc mắc của bệnh nhân.</p>
          </div>
          <a
            href="tel:19001234"
            className="px-6 py-3.5 bg-[#66FF33] hover:bg-[#5ae62e] text-[#0c4b39] font-black text-xs uppercase tracking-wider rounded-2xl shadow-md transition flex items-center gap-2 shrink-0"
          >
            <PhoneCall className="h-4 w-4" /> Tổng đài 1900 1234
          </a>
        </div>
      </div>
    </div>
  );
}

