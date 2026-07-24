'use client';

import { use } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import {
  ArrowLeft,
  CheckCircle2,
  PhoneCall,
  ShieldCheck,
  FileText,
  Calendar,
  CreditCard,
  Search,
  QrCode,
  UserCheck,
  Stethoscope,
  Pill,
  Clock,
  Building2,
  AlertCircle,
  HelpCircle,
  Sparkles,
  ChevronRight,
  Download,
  Share2
} from 'lucide-react';

export default function GuideDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = use(params);
  const { slug } = resolvedParams;

  const isPayment = slug === 'thanh-toan';
  const isHospital = slug === 'quy-trinh-kham';
  const isBooking = slug === 'dat-lich' || (!isPayment && !isHospital);

  return (
    <div className="bg-[#F8F9FA] min-h-screen pb-24">
      {/* Banner */}
      <section className="bg-[#0c4b39] text-white py-14 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(102,255,51,0.15),transparent_60%)] pointer-events-none" />
        <div className="w-full max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-3">
          <Link
            href="/huong-dan"
            className="inline-flex items-center gap-1.5 text-xs text-[#66FF33] font-bold bg-white/10 px-3.5 py-1.5 rounded-full hover:bg-white/20 transition mb-2"
          >
            <ArrowLeft className="h-4 w-4" /> Quay lại Trung tâm hướng dẫn
          </Link>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-extrabold uppercase tracking-widest px-3 py-1 bg-[#66FF33] text-[#0c4b39] rounded-md shadow-xs">
              {isBooking ? '📱 Đặt Khám Online' : isHospital ? '🏥 Khám Tại Bệnh Viện' : '💳 Thanh Toán & Hoàn Phí'}
            </span>
          </div>

          <h1 className="text-2xl md:text-4xl font-black leading-tight tracking-tight text-white">
            {isPayment
              ? 'Hướng Dẫn Thanh Toán & Chính Sách Hoàn Phí Dịch Vụ'
              : isHospital
              ? 'Quy Trình 4 Bước Đón Tiếp & Khám Bệnh Trực Tiếp Tại Viện'
              : 'Hướng Dẫn 4 Bước Đặt Lịch Khám Bệnh Trực Tuyến NovaCare'}
          </h1>
          <p className="text-white/80 text-xs md:text-sm max-w-2xl leading-relaxed">
            {isPayment
              ? 'Chi tiết các hình thức thanh toán ví điện tử, chuyển khoản QR và điều khoản hoàn phí minh bạch 100%.'
              : isHospital
              ? 'Hướng dẫn người bệnh khi đến viện: Quét mã QR tại Quầy Đón Tiếp Ưu Tiên, nhận số phòng và nhận kết quả.'
              : 'Thao tác chủ động chọn Bác sĩ, Ngày khám và nhận Phiếu khám điện tử ngay tại nhà chỉ trong 1 phút.'}
          </p>
        </div>
      </section>

      {/* Main Content */}
      <div className="w-full max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 mt-10">

        {/* 1. GUIDANCE FOR ONLINE BOOKING */}
        {isBooking && (
          <div className="space-y-10">
            {/* Overview Visual Timeline Header */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-xs">
              <h2 className="text-lg font-extrabold text-slate-900 mb-6 text-center">
                Sơ Đồ Tóm Tắt 4 Bước Đặt Khám Trực Tuyến
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative">
                <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-100 space-y-2 text-center">
                  <div className="w-8 h-8 rounded-full bg-[#0c4b39] text-[#66FF33] font-bold text-xs flex items-center justify-center mx-auto">
                    1
                  </div>
                  <h4 className="font-extrabold text-slate-900 text-xs">Tìm Bác Sĩ / Khoa</h4>
                  <p className="text-[11px] text-slate-500">Tra cứu nhanh trên thanh tìm kiếm</p>
                </div>
                <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-100 space-y-2 text-center">
                  <div className="w-8 h-8 rounded-full bg-[#0c4b39] text-[#66FF33] font-bold text-xs flex items-center justify-center mx-auto">
                    2
                  </div>
                  <h4 className="font-extrabold text-slate-900 text-xs">Chọn Ngày & Giờ</h4>
                  <p className="text-[11px] text-slate-500">Chọn khung giờ còn trống</p>
                </div>
                <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-100 space-y-2 text-center">
                  <div className="w-8 h-8 rounded-full bg-[#0c4b39] text-[#66FF33] font-bold text-xs flex items-center justify-center mx-auto">
                    3
                  </div>
                  <h4 className="font-extrabold text-slate-900 text-xs">Điền Hồ Sơ Bệnh Nhân</h4>
                  <p className="text-[11px] text-slate-500">Nhập Họ tên, BHYT & SĐT</p>
                </div>
                <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-100 space-y-2 text-center">
                  <div className="w-8 h-8 rounded-full bg-[#0c4b39] text-[#66FF33] font-bold text-xs flex items-center justify-center mx-auto">
                    4
                  </div>
                  <h4 className="font-extrabold text-slate-900 text-xs">Nhận QR Code Khám</h4>
                  <p className="text-[11px] text-slate-500">Nhận phiếu khám điện tử</p>
                </div>
              </div>
            </div>

            {/* Detailed Step Cards with Mockup Diagrams */}
            <div className="space-y-8">
              {/* STEP 1 */}
              <Card className="bg-white rounded-3xl border border-slate-200 p-8 shadow-xs">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                  <div className="lg:col-span-7 space-y-4">
                    <span className="text-xs font-black text-[#0c4b39] bg-[#0c4b39]/10 px-3 py-1 rounded-full uppercase tracking-wider">
                      Bước 01 / 04
                    </span>
                    <h3 className="text-xl font-extrabold text-slate-900">
                      Tìm kiếm Bác sĩ, Chuyên khoa hoặc Cơ sở y tế
                    </h3>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Tại trang chủ NovaCare, bạn gõ tên Bác sĩ, chuyên khoa (Tim mạch, Nhi khoa, Tai Mũi Họng...) hoặc Bệnh viện bạn muốn khám. Hệ thống sẽ gợi ý danh sách bác sĩ chuyên môn kèm giá khám minh bạch.
                    </p>
                    <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 flex items-center gap-2 text-xs text-slate-700 font-medium">
                      <Sparkles className="h-4 w-4 text-[#0c4b39] shrink-0" />
                      <span><strong>Mẹo nhỏ:</strong> Bạn có thể dùng bộ lọc theo Tỉnh/Thành phố hoặc lọc Bác sĩ có dịch vụ Đặt khám ngoài giờ.</span>
                    </div>
                  </div>

                  {/* Graphic Illustration Mockup */}
                  <div className="lg:col-span-5 bg-gradient-to-br from-emerald-900 to-[#0c4b39] rounded-2xl p-6 text-white space-y-4 shadow-lg">
                    <div className="text-xs font-bold text-[#66FF33] flex items-center gap-2">
                      <Search className="h-4 w-4" /> Thanh Tìm Kiếm NovaCare
                    </div>
                    <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 text-xs border border-white/15">
                      🔍 Nhập "PGS.TS Nguyễn Văn A" hoặc "Nhi khoa"...
                    </div>
                    <div className="bg-white text-slate-900 rounded-xl p-3 text-xs space-y-1 shadow-sm">
                      <p className="font-bold text-[#0c4b39]">PGS.TS.BS Nguyễn Văn A</p>
                      <p className="text-[11px] text-slate-500">Chuyên khoa Tim Mạch • Bệnh viện Đại Học Y Dược</p>
                      <span className="inline-block text-[10px] bg-emerald-100 text-[#0c4b39] font-bold px-2 py-0.5 rounded">Giá khám: 300.000đ</span>
                    </div>
                  </div>
                </div>
              </Card>

              {/* STEP 2 */}
              <Card className="bg-white rounded-3xl border border-slate-200 p-8 shadow-xs">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                  <div className="lg:col-span-7 space-y-4">
                    <span className="text-xs font-black text-[#0c4b39] bg-[#0c4b39]/10 px-3 py-1 rounded-full uppercase tracking-wider">
                      Bước 02 / 04
                    </span>
                    <h3 className="text-xl font-extrabold text-slate-900">
                      Chọn Ngày khám và Khung giờ trống
                    </h3>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Mỗi bác sĩ có lịch làm việc được cập nhật trực tuyến theo thời gian thực. Bạn xem qua các ca khám Buổi sáng (07:30 - 11:30) hoặc Buổi chiều (13:30 - 16:30) và chọn ca chưa có người đặt.
                    </p>
                    <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 flex items-center gap-2 text-xs text-slate-700 font-medium">
                      <Clock className="h-4 w-4 text-[#0c4b39] shrink-0" />
                      <span><strong>Tiết kiệm thời gian:</strong> Khung giờ được chia nhỏ thành từng slot 15-30 phút giúp bạn không phải chờ đợi.</span>
                    </div>
                  </div>

                  {/* Graphic Illustration Mockup */}
                  <div className="lg:col-span-5 bg-slate-900 rounded-2xl p-6 text-white space-y-3 shadow-lg">
                    <div className="text-xs font-bold text-[#66FF33] flex items-center gap-2">
                      <Calendar className="h-4 w-4" /> Lịch khám khả dụng
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                      <div className="bg-[#66FF33] text-[#0c4b39] font-extrabold p-2 rounded-xl border border-[#66FF33]">08:00 - 08:30</div>
                      <div className="bg-white/10 p-2 rounded-xl border border-white/10 opacity-50">08:30 (Đã kín)</div>
                      <div className="bg-white/10 p-2 rounded-xl border border-white/10">09:00 - 09:30</div>
                      <div className="bg-white/10 p-2 rounded-xl border border-white/10">09:30 - 10:00</div>
                      <div className="bg-white/10 p-2 rounded-xl border border-white/10">14:00 - 14:30</div>
                      <div className="bg-white/10 p-2 rounded-xl border border-white/10">15:00 - 15:30</div>
                    </div>
                  </div>
                </div>
              </Card>

              {/* STEP 3 */}
              <Card className="bg-white rounded-3xl border border-slate-200 p-8 shadow-xs">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                  <div className="lg:col-span-7 space-y-4">
                    <span className="text-xs font-black text-[#0c4b39] bg-[#0c4b39]/10 px-3 py-1 rounded-full uppercase tracking-wider">
                      Bước 03 / 04
                    </span>
                    <h3 className="text-xl font-extrabold text-slate-900">
                      Cung cấp Thông tin bệnh nhân & Thẻ BHYT
                    </h3>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Bạn có thể chọn đặt cho chính mình hoặc tạo hồ sơ đặt giúp cho Người thân (Bố mẹ, con cái). Nhập chính xác Họ tên, Ngày sinh, Số CCCD và Mã số BHYT (nếu có) để bệnh viện tra cứu tiền sử khám.
                    </p>
                  </div>

                  {/* Graphic Illustration Mockup */}
                  <div className="lg:col-span-5 bg-emerald-50 rounded-2xl p-6 border border-emerald-100 text-slate-900 space-y-3 shadow-sm">
                    <div className="text-xs font-extrabold text-[#0c4b39] flex items-center gap-2">
                      <UserCheck className="h-4 w-4" /> Hồ Sơ Bệnh Nhân NovaCare
                    </div>
                    <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1 text-xs">
                      <p className="font-bold">Họ và tên: Trịnh Văn Vũ</p>
                      <p className="text-[11px] text-slate-500">Ngày sinh: 15/08/1995 • Nam</p>
                      <p className="text-[11px] text-[#0c4b39] font-bold">Mã BHYT: DN4010120199*** (Đúng tuyến)</p>
                    </div>
                  </div>
                </div>
              </Card>

              {/* STEP 4 */}
              <Card className="bg-white rounded-3xl border border-slate-200 p-8 shadow-xs">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                  <div className="lg:col-span-7 space-y-4">
                    <span className="text-xs font-black text-[#0c4b39] bg-[#0c4b39]/10 px-3 py-1 rounded-full uppercase tracking-wider">
                      Bước 04 / 04
                    </span>
                    <h3 className="text-xl font-extrabold text-slate-900">
                      Xác nhận & Nhận Phiếu Khám Điện Tử QR Code
                    </h3>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Sau khi hoàn tất thanh toán, hệ thống sẽ cấp ngay Phiếu Khám Điện Tử chứa **Mã QR Code độc bản**. Phiếu này được lưu tự động trong trang cá nhân và gửi qua SMS/Zalo của người bệnh.
                    </p>
                  </div>

                  {/* Graphic Illustration Mockup */}
                  <div className="lg:col-span-5 bg-[#0c4b39] text-white rounded-2xl p-6 space-y-3 shadow-xl text-center">
                    <span className="text-[10px] uppercase font-extrabold bg-[#66FF33] text-[#0c4b39] px-3 py-1 rounded-full">
                      PHIẾU KHÁM ĐIỆN TỬ
                    </span>
                    <div className="bg-white p-4 rounded-xl text-slate-900 space-y-2 inline-block shadow-md">
                      <QrCode className="h-24 w-24 text-[#0c4b39] mx-auto" />
                      <p className="text-[11px] font-mono font-bold text-slate-700">Mã phiếu: NC-982410</p>
                    </div>
                    <p className="text-[11px] text-white/80">Quẹt mã này tại Quầy tiếp đón bệnh viện để lấy số thứ tự.</p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* 2. GUIDANCE FOR IN-HOSPITAL PATIENT JOURNEY */}
        {isHospital && (
          <div className="space-y-10">
            {/* Overview Hospital Flowchart */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-xs">
              <h2 className="text-lg font-extrabold text-slate-900 mb-6 text-center">
                Quy Trình 4 Bước Tiếp Đón & Khám Trực Tiếp Tại Viện
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-teal-50 rounded-2xl p-4 border border-teal-100 space-y-2 text-center">
                  <div className="w-8 h-8 rounded-full bg-teal-700 text-white font-bold text-xs flex items-center justify-center mx-auto">
                    1
                  </div>
                  <h4 className="font-extrabold text-slate-900 text-xs">Quẹt Mã QR Ưu Tiên</h4>
                  <p className="text-[11px] text-slate-500">Tại Quầy Đón Tiếp NovaCare</p>
                </div>
                <div className="bg-teal-50 rounded-2xl p-4 border border-teal-100 space-y-2 text-center">
                  <div className="w-8 h-8 rounded-full bg-teal-700 text-white font-bold text-xs flex items-center justify-center mx-auto">
                    2
                  </div>
                  <h4 className="font-extrabold text-slate-900 text-xs">Khám Với Bác Sĩ</h4>
                  <p className="text-[11px] text-slate-500">Vào phòng khám chuyên khoa</p>
                </div>
                <div className="bg-teal-50 rounded-2xl p-4 border border-teal-100 space-y-2 text-center">
                  <div className="w-8 h-8 rounded-full bg-teal-700 text-white font-bold text-xs flex items-center justify-center mx-auto">
                    3
                  </div>
                  <h4 className="font-extrabold text-slate-900 text-xs">Xét Nghiệm / Chụp Phim</h4>
                  <p className="text-[11px] text-slate-500">Thực hiện cận lâm sàng (nếu có)</p>
                </div>
                <div className="bg-teal-50 rounded-2xl p-4 border border-teal-100 space-y-2 text-center">
                  <div className="w-8 h-8 rounded-full bg-teal-700 text-white font-bold text-xs flex items-center justify-center mx-auto">
                    4
                  </div>
                  <h4 className="font-extrabold text-slate-900 text-xs">Đọc Kết Quả & Nhận Thuốc</h4>
                  <p className="text-[11px] text-slate-500">Nhận đơn thuốc điện tử</p>
                </div>
              </div>
            </div>

            <div className="space-y-8">
              {/* STEP 1 */}
              <Card className="bg-white rounded-3xl border border-slate-200 p-8 shadow-xs">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                  <div className="lg:col-span-7 space-y-4">
                    <span className="text-xs font-black text-teal-800 bg-teal-100 px-3 py-1 rounded-full uppercase tracking-wider">
                      Bước 01 / 04 - Tại viện
                    </span>
                    <h3 className="text-xl font-extrabold text-slate-900">
                      Đến Quầy Đón Tiếp Ưu Tiên NovaCare & Quẹt Mã QR
                    </h3>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Bệnh nhân có mặt tại viện trước giờ hẹn khoảng **15 phút**. Không cần vào hàng xếp hàng lấy số thường, bạn tiến thẳng tới **"Quầy Tiếp Đón Ưu Tiên Dành Cho Bệnh Nhân NovaCare"**, mở điện thoại xuất trình mã QR Code để nhân viên quét xác nhận trong 10 giây.
                    </p>
                  </div>
                  <div className="lg:col-span-5 bg-teal-900 text-white rounded-2xl p-6 space-y-3 shadow-lg">
                    <div className="text-xs font-bold text-teal-300 flex items-center gap-2">
                      <Building2 className="h-4 w-4" /> Quầy Tiếp Đón Ưu Tiên NovaCare
                    </div>
                    <div className="bg-white/10 p-3 rounded-xl border border-white/10 text-xs">
                      ✅ Xác nhận thông tin tự động qua Máy Quét QR.
                    </div>
                    <div className="bg-white/10 p-3 rounded-xl border border-white/10 text-xs">
                      🎫 In phiếu STT phòng khám chuyên khoa tức thì.
                    </div>
                  </div>
                </div>
              </Card>

              {/* STEP 2 */}
              <Card className="bg-white rounded-3xl border border-slate-200 p-8 shadow-xs">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                  <div className="lg:col-span-7 space-y-4">
                    <span className="text-xs font-black text-teal-800 bg-teal-100 px-3 py-1 rounded-full uppercase tracking-wider">
                      Bước 02 / 04 - Tại viện
                    </span>
                    <h3 className="text-xl font-extrabold text-slate-900">
                      Vào Phòng Khám Chuyên Khoa Gặp Bác Sĩ
                    </h3>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Di chuyển tới khu vực phòng khám ghi trên phiếu STT (Ví dụ: Phòng 204 - Tầng 2). Quan sát màn hình LCD hiển thị số thứ tự ngoài cửa phòng. Khi đến lượt, vào gặp Bác sĩ để khai báo triệu chứng và thăm khám lâm sàng.
                    </p>
                  </div>
                  <div className="lg:col-span-5 bg-slate-900 text-white rounded-2xl p-6 space-y-3 shadow-lg">
                    <div className="text-xs font-bold text-teal-300 flex items-center gap-2">
                      <Stethoscope className="h-4 w-4" /> Màn hình gọi số điện tử
                    </div>
                    <div className="bg-teal-600 p-3 rounded-xl text-center space-y-1">
                      <p className="text-[10px] uppercase font-bold tracking-wider">Đang khám</p>
                      <p className="text-2xl font-black">Số 015 - Trịnh Văn Vũ</p>
                      <p className="text-xs">Phòng 204 • Chuyên khoa Tim mạch</p>
                    </div>
                  </div>
                </div>
              </Card>

              {/* STEP 3 */}
              <Card className="bg-white rounded-3xl border border-slate-200 p-8 shadow-xs">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                  <div className="lg:col-span-7 space-y-4">
                    <span className="text-xs font-black text-teal-800 bg-teal-100 px-3 py-1 rounded-full uppercase tracking-wider">
                      Bước 03 / 04 - Tại viện
                    </span>
                    <h3 className="text-xl font-extrabold text-slate-900">
                      Thực hiện Xét nghiệm / Chẩn đoán hình ảnh (Nếu có chỉ định)
                    </h3>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Nếu Bác sĩ chỉ định làm Xét nghiệm máu, Siêu âm, Chụp X-Quang hay CT/MRI, bệnh nhân di chuyển đến khu vực cận lâm sàng. Mã phiếu chỉ định đã được đồng bộ điện tử nên bạn được ưu tiên gọi tên làm xét nghiệm nhanh chóng.
                    </p>
                  </div>
                  <div className="lg:col-span-5 bg-teal-50 border border-teal-100 rounded-2xl p-6 text-slate-900 space-y-3 shadow-sm">
                    <div className="text-xs font-bold text-teal-800 flex items-center gap-2">
                      <FileText className="h-4 w-4" /> Đồng bộ kết quả Xét nghiệm Online
                    </div>
                    <p className="text-xs text-slate-600">Kết quả Xét nghiệm & Hình ảnh X-Quang được tự động trả trực tiếp về hồ sơ Bác sĩ và ứng dụng NovaCare của bạn.</p>
                  </div>
                </div>
              </Card>

              {/* STEP 4 */}
              <Card className="bg-white rounded-3xl border border-slate-200 p-8 shadow-xs">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                  <div className="lg:col-span-7 space-y-4">
                    <span className="text-xs font-black text-teal-800 bg-teal-100 px-3 py-1 rounded-full uppercase tracking-wider">
                      Bước 04 / 04 - Tại viện
                    </span>
                    <h3 className="text-xl font-extrabold text-slate-900">
                      Bác sĩ Kết luận, Nhận Đơn Thuốc & Lấy Thuốc
                    </h3>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Quay lại phòng khám ban đầu nghe Bác sĩ đọc kết quả và tư vấn phác đồ điều trị. Bác sĩ kê Đơn thuốc điện tử. Bệnh nhân nhận thuốc tại Nhà thuốc Bệnh viện hoặc đăng ký giao thuốc tận nhà qua NovaCare.
                    </p>
                  </div>
                  <div className="lg:col-span-5 bg-emerald-900 text-white rounded-2xl p-6 space-y-3 shadow-lg">
                    <div className="text-xs font-bold text-[#66FF33] flex items-center gap-2">
                      <Pill className="h-4 w-4" /> Đơn Thuốc Điện Tử Đã Hoàn Tất
                    </div>
                    <div className="bg-white/10 p-3 rounded-xl border border-white/10 text-xs">
                      💊 Đơn thuốc lưu trữ vĩnh viễn trên App, tích hợp nhắc giờ uống thuốc tự động.
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* 3. GUIDANCE FOR PAYMENT & REFUNDS */}
        {isPayment && (
          <div className="space-y-8">
            <Card className="bg-white rounded-3xl border border-slate-200 p-8 shadow-xs space-y-6">
              <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                <CreditCard className="h-6 w-6 text-[#0c4b39]" /> 1. Các Hình Thức Thanh Toán Được Hỗ Trợ
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-2">
                  <h4 className="font-bold text-slate-900 text-sm">Ví Điện Tử</h4>
                  <p className="text-xs text-slate-500">Thanh toán tức thì qua Ví MoMo, ZaloPay, ShopeePay.</p>
                </div>
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-2">
                  <h4 className="font-bold text-slate-900 text-sm">Mã QR Ngân Hàng</h4>
                  <p className="text-xs text-slate-500">Quét mã VNPAY-QR hoặc VietQR từ bất kỳ App ngân hàng nào.</p>
                </div>
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-2">
                  <h4 className="font-bold text-slate-900 text-sm">Thẻ Thẻ ATM / Visa / Mastercard</h4>
                  <p className="text-xs text-slate-500">Thẻ nội địa Napas và Thẻ thanh toán quốc tế bảo mật 3D Secure.</p>
                </div>
              </div>
            </Card>

            <Card className="bg-white rounded-3xl border border-slate-200 p-8 shadow-xs space-y-6">
              <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="h-6 w-6 text-[#0c4b39]" /> 2. Quy Định Hủy Lịch & Hoàn Phí Minh Bạch
              </h2>
              <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-100 space-y-4">
                <div className="flex items-center gap-3 text-slate-900 font-bold text-sm">
                  <CheckCircle2 className="h-5 w-5 text-[#0c4b39]" /> Hủy trước 24 giờ so với giờ hẹn: Hoàn tiền 100% về tài khoản.
                </div>
                <div className="flex items-center gap-3 text-slate-900 font-bold text-sm">
                  <CheckCircle2 className="h-5 w-5 text-[#0c4b39]" /> Hủy từ 12 giờ đến 24 giờ: Hoàn 80% giá trị phiếu khám.
                </div>
                <div className="flex items-center gap-3 text-slate-900 font-bold text-sm">
                  <AlertCircle className="h-5 w-5 text-amber-600" /> Hủy trong vòng 12 giờ: Không áp dụng hoàn tiền theo quy định viện.
                </div>
              </div>
              <p className="text-xs text-slate-500">Thời gian tiền hoàn về tài khoản của bạn: từ **1 đến 3 ngày làm việc** tùy theo ngân hàng phát hành thẻ.</p>
            </Card>
          </div>
        )}

        {/* Bottom Support Banner */}
        <div className="mt-12 bg-[#0c4b39] rounded-3xl p-8 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
          <div className="space-y-1 text-center md:text-left">
            <h3 className="text-xl font-bold">Cần giải đáp trực tiếp từ Tổng Đài Viên?</h3>
            <p className="text-white/70 text-xs">Tổng đài hỗ trợ y tế NovaCare 24/7 luôn sẵn sàng lắng nghe bạn.</p>
          </div>
          <a
            href="tel:19001234"
            className="px-6 py-3.5 bg-[#66FF33] hover:bg-[#5ae62e] text-[#0c4b39] font-black text-xs uppercase tracking-wider rounded-2xl shadow-md transition flex items-center gap-2 shrink-0"
          >
            <PhoneCall className="h-4 w-4" /> Hotline 1900 1234
          </a>
        </div>

      </div>
    </div>
  );
}

