'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Building2,
  Users,
  ShieldCheck,
  CheckCircle2,
  PhoneCall,
  Mail,
  FileSpreadsheet,
  Award,
  Send,
  Building
} from 'lucide-react';
import { toast } from 'sonner';

export default function CorporateHealthPage() {
  const [formData, setFormData] = useState({
    companyName: '',
    contactName: '',
    phone: '',
    email: '',
    employeeCount: '',
    notes: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Gửi thông tin đăng ký thành công! Đội ngũ tư vấn doanh nghiệp của NovaCare sẽ liên hệ bạn trong vòng 30 phút.');
    setFormData({
      companyName: '',
      contactName: '',
      phone: '',
      email: '',
      employeeCount: '',
      notes: '',
    });
  };

  return (
    <div className="bg-[#F8F9FA] min-h-screen pb-20">
      {/* Hero Banner */}
      <section className="bg-[#0c4b39] text-white py-16 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(102,255,51,0.15),transparent_60%)]"></div>
        <div className="container-custom relative z-10 text-center">
          <span className="text-xs uppercase font-extrabold tracking-widest text-[#66FF33] bg-white/10 px-4 py-1.5 rounded-full border border-white/10 inline-block mb-3">
            Giải pháp sức khỏe toàn diện cho doanh nghiệp
          </span>
          <h1 className="text-3xl md:text-5xl font-black mb-4 tracking-tight leading-tight">
            Khám Sức Khỏe Doanh Nghiệp & Tổ Chức
          </h1>
          <p className="text-white/80 max-w-2xl mx-auto text-sm md:text-base leading-relaxed">
            Chương trình kiểm tra sức khỏe định kỳ cho cán bộ nhân viên theo đúng Thông tư 14/Bộ Y Tế. Thiết kế linh hoạt, tối ưu chi phí và không làm gián đoạn tiến độ làm việc của công ty.
          </p>
        </div>
      </section>

      <div className="container-custom mt-12 space-y-12">
        {/* Key Corporate Benefits */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-8 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col items-start space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[#0c4b39]/10 text-[#0c4b39] flex items-center justify-center">
              <Building2 className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Khám Tận Nơi Hoặc Tại Viện</h3>
            <p className="text-slate-600 text-xs leading-relaxed">
              Lựa chọn lấy mẫu và khám trực tiếp tại văn phòng doanh nghiệp hoặc khám tại hệ thống 100+ bệnh viện liên kết NovaCare.
            </p>
          </div>

          <div className="bg-white p-8 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col items-start space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[#0c4b39]/10 text-[#0c4b39] flex items-center justify-center">
              <FileSpreadsheet className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Báo Cáo Sức Khỏe Cho HR</h3>
            <p className="text-slate-600 text-xs leading-relaxed">
              Tự động tổng hợp và gửi báo cáo phân tích tình trạng sức khỏe tổng quan của nhân sự cho bộ phận HR & Ban giám đốc.
            </p>
          </div>

          <div className="bg-white p-8 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col items-start space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[#0c4b39]/10 text-[#0c4b39] flex items-center justify-center">
              <Award className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Chiết Khấu Ưu Đãi Lên Đến 35%</h3>
            <p className="text-slate-600 text-xs leading-relaxed">
              Mức giá ưu đãi bậc nhất cho hợp đồng từ 20 nhân sự trở lên. Đầy đủ hóa đơn tài chính VAT hợp lệ.
            </p>
          </div>
        </div>

        {/* Corporate Package Tiers */}
        <div className="space-y-6">
          <div className="text-center max-w-xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900">Gói Khám Doanh Nghiệp Phổ Biến</h2>
            <p className="text-slate-500 text-xs mt-1">Được may đo riêng theo quy mô và yêu cầu ngân sách từng tổ chức</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border border-slate-200 bg-white rounded-3xl p-7 flex flex-col justify-between hover:shadow-lg transition">
              <div>
                <span className="text-xs font-bold text-[#0c4b39] bg-[#0c4b39]/10 px-3 py-1 rounded-full border border-[#0c4b39]/15">
                  Gói Cơ Bản (TT14)
                </span>
                <h3 className="text-xl font-bold text-slate-900 mt-4 mb-2">Khám Định Kỳ Chuẩn</h3>
                <p className="text-xs text-slate-500 mb-6">Đáp ứng đầy đủ quy định pháp luật lao động hiện hành.</p>
                <div className="space-y-2 mb-6 border-t border-slate-100 pt-4">
                  <div className="flex items-center gap-2 text-xs text-slate-700">
                    <CheckCircle2 className="h-4 w-4 text-[#0c4b39]" /> Khám thể lực & mắt, tai mũi họng
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-700">
                    <CheckCircle2 className="h-4 w-4 text-[#0c4b39]" /> Xét nghiệm công thức máu & nước tiểu
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-700">
                    <CheckCircle2 className="h-4 w-4 text-[#0c4b39]" /> Chụp X-quang tim phổi thẳng
                  </div>
                </div>
              </div>
              <a href="#dang-ky" className="block w-full text-center py-3 bg-[#0c4b39] hover:bg-[#083327] text-white font-bold rounded-xl text-xs uppercase tracking-wider transition">
                Nhận báo giá
              </a>
            </Card>

            <Card className="border-2 border-[#0c4b39] bg-white rounded-3xl p-7 flex flex-col justify-between shadow-xl relative scale-102">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#0c4b39] text-[#66FF33] font-black text-[10px] px-3.5 py-1 rounded-full uppercase tracking-wider shadow-sm">
                Được lựa chọn nhiều nhất
              </div>
              <div>
                <span className="text-xs font-bold text-[#0c4b39] bg-[#0c4b39]/10 px-3 py-1 rounded-full border border-[#0c4b39]/15">
                  Gói Nâng Cao
                </span>
                <h3 className="text-xl font-bold text-slate-900 mt-4 mb-2">Khám Toàn Diện Nhân Viên</h3>
                <p className="text-xs text-slate-500 mb-6">Tầm soát sâu các bệnh lý văn phòng và cột sống.</p>
                <div className="space-y-2 mb-6 border-t border-slate-100 pt-4">
                  <div className="flex items-center gap-2 text-xs text-slate-700">
                    <CheckCircle2 className="h-4 w-4 text-[#0c4b39]" /> Bao gồm toàn bộ danh mục Gói Cơ Bản
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-700">
                    <CheckCircle2 className="h-4 w-4 text-[#0c4b39]" /> Siêu âm mỡ máu, chức năng gan thận
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-700">
                    <CheckCircle2 className="h-4 w-4 text-[#0c4b39]" /> Tầm soát vi khuẩn dạ dày HP
                  </div>
                </div>
              </div>
              <a href="#dang-ky" className="block w-full text-center py-3 bg-[#0c4b39] hover:bg-[#083327] text-white font-bold rounded-xl text-xs uppercase tracking-wider transition shadow-md">
                Nhận báo giá chi tiết
              </a>
            </Card>

            <Card className="border border-slate-200 bg-white rounded-3xl p-7 flex flex-col justify-between hover:shadow-lg transition">
              <div>
                <span className="text-xs font-bold text-[#0c4b39] bg-[#0c4b39]/10 px-3 py-1 rounded-full border border-[#0c4b39]/15">
                  Gói VIP Lãnh Đạo
                </span>
                <h3 className="text-xl font-bold text-slate-900 mt-4 mb-2">Executive Care</h3>
                <p className="text-xs text-slate-500 mb-6">Chương trình tầm soát ung thư & tim mạch cao cấp.</p>
                <div className="space-y-2 mb-6 border-t border-slate-100 pt-4">
                  <div className="flex items-center gap-2 text-xs text-slate-700">
                    <CheckCircle2 className="h-4 w-4 text-[#0c4b39]" /> Khám riêng tư tại phòng VIP
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-700">
                    <CheckCircle2 className="h-4 w-4 text-[#0c4b39]" /> Xét nghiệm bộ 6 chỉ số Marker Ung thư
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-700">
                    <CheckCircle2 className="h-4 w-4 text-[#0c4b39]" /> Chụp cộng hưởng từ MRI / CT Scan
                  </div>
                </div>
              </div>
              <a href="#dang-ky" className="block w-full text-center py-3 bg-[#0c4b39] hover:bg-[#083327] text-white font-bold rounded-xl text-xs uppercase tracking-wider transition">
                Nhận báo giá VIP
              </a>
            </Card>
          </div>
        </div>

        {/* SECTION: Affiliated Healthcare Facilities for Corporate Exams */}
        <section className="space-y-6">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-black uppercase tracking-widest text-[#0c4b39] bg-[#0c4b39]/10 px-3 py-1 rounded-full">
              Hệ thống bệnh viện liên kết
            </span>
            <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900">
              Cơ Sở Y Tế Tiếp Nhận Khám Doanh Nghiệp Tận Viện & Tận Nơi
            </h2>
            <p className="text-slate-500 text-xs">
              Doanh nghiệp có thể lựa chọn khám tại hệ thống Bệnh viện NovaCare hoặc yêu cầu xe lưu động khám tận nơi tại nhà máy / văn phòng.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-[#0c4b39]/10 text-[#0c4b39]">
                  <Building2 className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-900 text-sm">Bệnh viện Đa Khoa NovaCare Central</h4>
                  <p className="text-[11px] text-[#0c4b39] font-bold">Công suất: 1.000 lượt khám/ngày</p>
                </div>
              </div>
              <p className="text-xs text-slate-600">Địa chỉ: 215 Hồng Bàng, Phường 11, Quận 5, TP.HCM</p>
              <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 space-y-1">
                <p>• Có sảnh đón tiếp đoàn khám riêng tư không chờ đợi.</p>
                <p>• Đầy đủ CT 128 lát, MRI 3.0T, Nội soi NMI, X-quang DR.</p>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-[#0c4b39]/10 text-[#0c4b39]">
                  <Building2 className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-900 text-sm">Phòng Khám Đa Khoa Quốc Tế VIP</h4>
                  <p className="text-[11px] text-[#0c4b39] font-bold">Công suất: 500 lượt khám/ngày</p>
                </div>
              </div>
              <p className="text-xs text-slate-600">Địa chỉ: 45 Võ Thị Sáu, Quận 3, TP.HCM</p>
              <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 space-y-1">
                <p>• Phù hợp khám cấp Lãnh đạo & Nhân sự văn phòng VIP.</p>
                <p>• Trả kết quả file điện tử trong ngày.</p>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-[#0c4b39]/10 text-[#0c4b39]">
                  <Building2 className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-900 text-sm">Đoàn Khám Xe Lưu Động Tận Nơi</h4>
                  <p className="text-[11px] text-[#0c4b39] font-bold">Lấy mẫu tại văn phòng / nhà máy</p>
                </div>
              </div>
              <p className="text-xs text-slate-600">Phạm vi: TP.HCM, Bình Dương, Đồng Nai, Long An...</p>
              <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 space-y-1">
                <p>• Trang bị xe X-quang kỹ thuật số lưu động đạt chuẩn.</p>
                <p>• Lấy mẫu máu & Nước tiểu tận nơi không gián đoạn ca làm.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Corporate Inquiry Form Section */}
        <div id="dang-ky" className="bg-white rounded-3xl border border-slate-200 shadow-xl p-8 md:p-12 max-w-4xl mx-auto space-y-8">
          <div className="text-center space-y-2">
            <span className="text-xs font-black uppercase tracking-widest text-[#0c4b39] bg-[#0c4b39]/10 px-3 py-1 rounded-full">
              Tư vấn & Đăng ký tư vấn báo giá
            </span>
            <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900">
              Đăng Ký Tư Vấn Gói Khám Doanh Nghiệp
            </h2>
            <p className="text-slate-500 text-xs max-w-lg mx-auto">
              Điền thông tin bên dưới, chuyên viên tư vấn y tế doanh nghiệp NovaCare sẽ gửi bảng báo giá chi tiết trong vòng 30 phút.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Tên doanh nghiệp / Tổ chức *</label>
              <Input
                required
                placeholder="VD: Công ty Cổ phần Tập đoàn ABC"
                className="h-11 rounded-xl text-xs"
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Người đại diện liên hệ *</label>
              <Input
                required
                placeholder="VD: Nguyễn Văn A (Trưởng phòng HR)"
                className="h-11 rounded-xl text-xs"
                value={formData.contactName}
                onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Số điện thoại liên hệ *</label>
              <Input
                required
                type="tel"
                placeholder="0987 xxx xxx"
                className="h-11 rounded-xl text-xs"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Email nhận báo giá *</label>
              <Input
                required
                type="email"
                placeholder="hr@company.com"
                className="h-11 rounded-xl text-xs"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-bold text-slate-700">Số lượng nhân sự dự kiến khám</label>
              <Input
                placeholder="VD: 50 - 100 nhân viên"
                className="h-11 rounded-xl text-xs"
                value={formData.employeeCount}
                onChange={(e) => setFormData({ ...formData, employeeCount: e.target.value })}
              />
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-bold text-slate-700">Ghi chú & Yêu cầu riêng</label>
              <textarea
                rows={3}
                placeholder="Nhập các yêu cầu cụ thể về địa điểm khám, thời gian dự kiến..."
                className="w-full rounded-xl border border-slate-200 p-3 text-xs focus:ring-2 focus:ring-[#0c4b39] focus:outline-none"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>

            <div className="md:col-span-2 text-center pt-2">
              <Button type="submit" className="h-12 px-10 bg-[#0c4b39] hover:bg-[#083327] text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg cursor-pointer">
                <Send className="h-4 w-4 mr-2 text-[#66FF33]" />
                Gửi yêu cầu báo giá
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
