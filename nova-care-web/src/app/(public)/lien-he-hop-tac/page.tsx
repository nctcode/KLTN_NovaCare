'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Building2,
  UserPlus,
  Users,
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
  PhoneCall,
  Mail,
  Send,
  Loader2,
  Sparkles,
  Award
} from 'lucide-react';
import { toast } from 'sonner';

function PartnerPageContent() {
  const searchParams = useSearchParams();
  const initialType = searchParams.get('type') || 'co-so-y-te';

  const [partnerType, setPartnerType] = useState<'co-so-y-te' | 'bac-si'>(
    initialType === 'bac-si' ? 'bac-si' : 'co-so-y-te'
  );

  const [formData, setFormData] = useState({
    name: '',
    titleOrRole: '',
    phone: '',
    email: '',
    hospitalOrClinic: '',
    specialty: '',
    notes: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success(
      partnerType === 'co-so-y-te'
        ? 'Đăng ký hợp tác cơ sở y tế thành công! Bộ phận phát triển đối tác NovaCare sẽ liên hệ trong 24h.'
        : 'Đăng ký tham gia mạng lưới Bác sĩ thành công! Chúng tôi sẽ xác minh hồ sơ và liên hệ với bạn.'
    );
    setFormData({
      name: '',
      titleOrRole: '',
      phone: '',
      email: '',
      hospitalOrClinic: '',
      specialty: '',
      notes: '',
    });
  };

  return (
    <div className="bg-[#F8F9FA] min-h-screen pb-20">
      {/* Banner */}
      <section className="bg-[#0c4b39] text-white py-16 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(102,255,51,0.12),transparent_60%)]"></div>
        <div className="container-custom relative z-10 text-center">
          <span className="text-xs uppercase font-extrabold tracking-widest text-[#66FF33] bg-white/10 px-4 py-1.5 rounded-full border border-white/10 inline-block mb-3">
            Mạng lưới đối tác y tế NovaCare
          </span>
          <h1 className="text-3xl md:text-5xl font-black mb-4 tracking-tight">
            Hợp Tác & Phát Triển Cùng NovaCare
          </h1>
          <p className="text-white/80 max-w-2xl mx-auto text-sm md:text-base leading-relaxed">
            Kết nối Bệnh viện, Phòng khám và Bác sĩ chuyên khoa với hàng triệu người bệnh trên toàn quốc. Tiên phong chuyển đổi số y tế thông minh.
          </p>

          {/* Toggle Partner Type */}
          <div className="flex justify-center gap-3 mt-8">
            <button
              onClick={() => setPartnerType('co-so-y-te')}
              className={`flex items-center gap-2 px-6 py-3 rounded-full text-xs font-extrabold uppercase tracking-wider transition-all cursor-pointer shadow-md ${
                partnerType === 'co-so-y-te'
                  ? 'bg-[#66FF33] text-[#0c4b39] scale-105'
                  : 'bg-white/10 text-white hover:bg-white/20 border border-white/15'
              }`}
            >
              <Building2 className="h-4 w-4" />
              <span>Dành cho Cơ sở y tế</span>
            </button>
            <button
              onClick={() => setPartnerType('bac-si')}
              className={`flex items-center gap-2 px-6 py-3 rounded-full text-xs font-extrabold uppercase tracking-wider transition-all cursor-pointer shadow-md ${
                partnerType === 'bac-si'
                  ? 'bg-[#66FF33] text-[#0c4b39] scale-105'
                  : 'bg-white/10 text-white hover:bg-white/20 border border-white/15'
              }`}
            >
              <UserPlus className="h-4 w-4" />
              <span>Dành cho Bác sĩ</span>
            </button>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="container-custom mt-12 space-y-12">
        {/* Benefits Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[#0c4b39]/10 text-[#0c4b39] flex items-center justify-center">
              <Users className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">
              {partnerType === 'co-so-y-te' ? 'Tiếp Cận 500.000+ Bệnh Nhân' : 'Tăng Số Lượng Bệnh Nhân Đặt Lịch'}
            </h3>
            <p className="text-slate-600 text-xs leading-relaxed">
              Mở rộng tệp bệnh nhân nhanh chóng thông qua kênh tiếp thị kỹ thuật số và nền tảng ứng dụng y tế NovaCare.
            </p>
          </div>

          <div className="bg-white p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[#0c4b39]/10 text-[#0c4b39] flex items-center justify-center">
              <TrendingUp className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Tối Ưu Lịch Đón Tiếp & Giảm Tải</h3>
            <p className="text-slate-600 text-xs leading-relaxed">
              Hệ thống xếp hàng và phân bổ mốc giờ khám thông minh giúp giảm bớt ùn tắc tại sảnh đón tiếp.
            </p>
          </div>

          <div className="bg-white p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[#0c4b39]/10 text-[#0c4b39] flex items-center justify-center">
              <Sparkles className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Xây Dựng Thương Hiệu Uy Tín</h3>
            <p className="text-slate-600 text-xs leading-relaxed">
              Quảng bá thương hiệu bệnh viện và hồ sơ chuyên môn của bác sĩ trên nền tảng y tế số hàng đầu.
            </p>
          </div>
        </div>

        {/* Registration Form */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-8 md:p-12 max-w-3xl mx-auto space-y-8">
          <div className="text-center space-y-2">
            <span className="text-xs font-black uppercase tracking-widest text-[#0c4b39] bg-[#0c4b39]/10 px-3.5 py-1 rounded-full">
              Form đăng ký trực tuyến
            </span>
            <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900">
              {partnerType === 'co-so-y-te'
                ? 'Đăng Ký Hợp Tác Cơ Sở Y Tế'
                : 'Đăng Ký Tham Gia Mạng Lưới Bác Sĩ'}
            </h2>
            <p className="text-slate-500 text-xs max-w-md mx-auto">
              Vui lòng điền thông tin chính xác. Bộ phận phát triển đối tác của NovaCare sẽ thẩm định và liên hệ trực tiếp.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-bold text-slate-700">
                {partnerType === 'co-so-y-te' ? 'Tên Bệnh viện / Phòng khám *' : 'Họ và tên Bác sĩ *'}
              </label>
              <Input
                required
                placeholder={partnerType === 'co-so-y-te' ? 'VD: Bệnh viện Đa khoa Quốc tế ABC' : 'VD: BS.CKII Nguyễn Văn A'}
                className="h-11 rounded-xl text-xs"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Số điện thoại liên hệ *</label>
              <Input
                required
                type="tel"
                placeholder="0912 xxx xxx"
                className="h-11 rounded-xl text-xs"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Email liên hệ *</label>
              <Input
                required
                type="email"
                placeholder="contact@hospital.com"
                className="h-11 rounded-xl text-xs"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            {partnerType === 'bac-si' ? (
              <>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Chuyên khoa *</label>
                  <Input
                    required
                    placeholder="VD: Tim mạch, Thần kinh, Nhi khoa..."
                    className="h-11 rounded-xl text-xs"
                    value={formData.specialty}
                    onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Nơi công tác hiện tại</label>
                  <Input
                    placeholder="VD: Bệnh viện Chợ Rẫy, Bệnh viện Bạch Mai..."
                    className="h-11 rounded-xl text-xs"
                    value={formData.hospitalOrClinic}
                    onChange={(e) => setFormData({ ...formData, hospitalOrClinic: e.target.value })}
                  />
                </div>
              </>
            ) : (
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-bold text-slate-700">Chức vụ người liên hệ *</label>
                <Input
                  required
                  placeholder="VD: Giám đốc chuyên môn, Trưởng phòng Kinh doanh..."
                  className="h-11 rounded-xl text-xs"
                  value={formData.titleOrRole}
                  onChange={(e) => setFormData({ ...formData, titleOrRole: e.target.value })}
                />
              </div>
            )}

            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-bold text-slate-700">Nội dung trao đổi thêm</label>
              <textarea
                rows={3}
                placeholder="Ghi chú thêm thông tin hoặc các câu hỏi cần trao đổi..."
                className="w-full rounded-xl border border-slate-200 p-3 text-xs focus:ring-2 focus:ring-[#0c4b39] focus:outline-none"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>

            <div className="md:col-span-2 text-center pt-2">
              <Button type="submit" className="h-12 px-10 bg-[#0c4b39] hover:bg-[#083327] text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg cursor-pointer">
                <Send className="h-4 w-4 mr-2 text-[#66FF33]" />
                Gửi đăng ký hợp tác
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function PartnerPage() {
  return (
    <Suspense fallback={
      <div className="flex justify-center py-20 min-h-screen bg-[#F8F9FA]">
        <Loader2 className="animate-spin h-10 w-10 text-[#0c4b39]" />
      </div>
    }>
      <PartnerPageContent />
    </Suspense>
  );
}
