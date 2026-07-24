'use client';

import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  UserCheck,
  Sparkles,
  ShieldCheck,
  Home as HomeIcon,
  Video,
  Microscope,
  ArrowRight,
  CheckCircle2,
  PhoneCall,
  Clock,
  Award
} from 'lucide-react';

const MEDICAL_SERVICES = [
  {
    id: 'bac-si',
    title: 'Đặt khám theo Bác sĩ',
    description: 'Lựa chọn bác sĩ giỏi thuộc các chuyên khoa hàng đầu. Đặt lịch theo mốc giờ mong muốn, chủ động thời gian.',
    icon: UserCheck,
    href: '/bac-si',
    badge: 'Được đặt nhiều nhất',
    features: ['Hơn 500+ Bác sĩ chuyên khoa', 'Đặt giờ khám chính xác', 'Không phải xếp hàng chờ đợi']
  },
  {
    id: 'chuyen-khoa',
    title: 'Đặt khám theo Chuyên khoa',
    description: 'Hệ thống hơn 30+ chuyên khoa phong phú: Tim mạch, Thần kinh, Nhi khoa, Sản phụ khoa, Tiêu hóa...',
    icon: Sparkles,
    href: '/chuyen-khoa',
    badge: 'Đa dạng',
    features: ['Phân loại bệnh chuẩn xác', 'Tư vấn chuyên sâu', 'Thiết bị y tế hiện đại']
  },
  {
    id: 'goi-kham-suc-khoe',
    title: 'Gói khám sức khỏe tổng quát',
    description: 'Chương trình tầm soát sức khỏe định kỳ cho cá nhân, gia đình, người cao tuổi và tầm soát ung thư.',
    icon: ShieldCheck,
    href: '/dich-vu/goi-kham-suc-khoe',
    badge: 'Ưu đãi hot',
    features: ['Tiết kiệm đến 30% chi phí', 'Đầy đủ danh mục xét nghiệm', 'Bác sĩ đọc kết quả 1-1']
  },
  {
    id: 'kham-tai-nha',
    title: 'Khám bệnh tại nhà',
    description: 'Bác sĩ và điều dưỡng đến tận nhà thăm khám, lấy mẫu xét nghiệm và chăm sóc y tế an toàn.',
    icon: HomeIcon,
    href: '/dich-vu/kham-tai-nha',
    badge: 'Tiện lợi',
    features: ['Phù hợp người già, trẻ nhỏ', 'Trả kết quả tận nơi', 'Phục vụ tận tâm 24/7']
  },
  {
    id: 'tu-van-tu-xa',
    title: 'Tư vấn khám từ xa (Telehealth)',
    description: 'Khám bệnh trực tuyến qua Video call 1-1 với bác sĩ. Nhận tư vấn và đơn thuốc điện tử ngay trên ứng dụng.',
    icon: Video,
    href: '/dich-vu/tu-van-tu-xa',
    badge: 'Online 24/7',
    features: ['Không cần di chuyển', 'Bảo mật thông tin', 'Tư vấn nhanh chóng']
  },
  {
    id: 'xet-nghiem',
    title: 'Xét nghiệm & Chẩn đoán hình ảnh',
    description: 'Dịch vụ xét nghiệm máu, sinh hóa, tầm soát gen, chụp X-quang, Siêu âm, MRI công nghệ tiên tiến.',
    icon: Microscope,
    href: '/dich-vu/xet-nghiem',
    badge: 'Chính xác cao',
    features: ['Máy móc chuẩn ISO/CLIA', 'Trả kết quả online nhanh', 'Tư vấn hướng điều trị']
  }
];

export default function MedicalServicesPage() {
  return (
    <div className="bg-[#F8F9FA] min-h-screen pb-20">
      {/* Banner Section */}
      <section className="bg-[#0c4b39] text-white py-16 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(102,255,51,0.12),transparent_60%)]"></div>
        <div className="container-custom relative z-10 text-center">
          <span className="text-xs uppercase font-extrabold tracking-widest text-[#66FF33] bg-white/10 px-4 py-1.5 rounded-full border border-white/10 inline-block mb-3">
            Giải pháp Y tế toàn diện
          </span>
          <h1 className="text-3xl md:text-5xl font-black mb-4 tracking-tight">
            Dịch Vụ Y Tế & Chăm Sóc Sức Khỏe
          </h1>
          <p className="text-white/80 max-w-2xl mx-auto text-sm md:text-base leading-relaxed">
            NovaCare kết nối bạn với mạng lưới bác sĩ chuyên khoa và cơ sở y tế uy tín, mang lại trải nghiệm đặt khám thông minh, nhanh chóng và an tâm nhất.
          </p>
        </div>
      </section>

      {/* Services Grid Section */}
      <div className="container-custom mt-12 space-y-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {MEDICAL_SERVICES.map((service) => {
            const Icon = service.icon;
            return (
              <Card
                key={service.id}
                className="hover:shadow-2xl transition-all duration-300 border border-slate-200/80 bg-white rounded-3xl overflow-hidden flex flex-col justify-between group"
              >
                <CardContent className="p-7 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-5">
                      <div className="w-14 h-14 bg-[#0c4b39]/8 group-hover:bg-[#0c4b39] rounded-2xl flex items-center justify-center transition-colors duration-300 shadow-inner">
                        <Icon className="h-7 w-7 text-[#0c4b39] group-hover:text-[#66FF33] transition-colors duration-300" />
                      </div>
                      <span className="text-xs font-bold text-[#0c4b39] bg-[#0c4b39]/10 px-3 py-1 rounded-full border border-[#0c4b39]/15">
                        {service.badge}
                      </span>
                    </div>

                    <h3 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-[#0c4b39] transition-colors">
                      {service.title}
                    </h3>
                    <p className="text-slate-600 text-xs leading-relaxed mb-6">
                      {service.description}
                    </p>

                    <div className="space-y-2 mb-6 border-t border-slate-100 pt-4">
                      {service.features.map((feat, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-xs text-slate-700 font-medium">
                          <CheckCircle2 className="h-4 w-4 text-[#0c4b39] shrink-0" />
                          <span>{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Link
                      href={service.href}
                      className="w-full flex items-center justify-center gap-2 py-3 px-5 bg-[#0c4b39] hover:bg-[#083327] active:bg-[#06241c] text-white font-bold rounded-2xl text-xs uppercase tracking-wider transition-all duration-200 shadow-md group-hover:shadow-lg"
                    >
                      <span>Trải nghiệm dịch vụ</span>
                      <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Commitment Banner */}
        <div className="bg-gradient-to-br from-[#0c4b39] via-[#083327] to-[#041a14] rounded-3xl p-8 md:p-12 text-white shadow-2xl relative overflow-hidden">
          <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none">
            <Award className="h-96 w-96 text-white" />
          </div>
          <div className="max-w-3xl space-y-6 relative z-10">
            <span className="text-xs uppercase font-extrabold tracking-widest text-[#66FF33] bg-white/10 px-3.5 py-1.5 rounded-full border border-white/10 inline-block">
              Cam kết chất lượng NovaCare
            </span>
            <h2 className="text-2xl md:text-4xl font-extrabold tracking-tight">
              An tâm chăm sóc sức khỏe cho bạn và gia đình
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-4">
              <div className="flex items-start gap-3">
                <Clock className="h-6 w-6 text-[#66FF33] shrink-0 mt-1" />
                <div>
                  <h4 className="font-bold text-sm">Tiết kiệm thời gian</h4>
                  <p className="text-white/70 text-xs mt-1">Khám đúng giờ, không xếp hàng lấy số</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Award className="h-6 w-6 text-[#66FF33] shrink-0 mt-1" />
                <div>
                  <h4 className="font-bold text-sm">Bác sĩ chuyên khoa</h4>
                  <p className="text-white/70 text-xs mt-1">Đội ngũ y bác sĩ giàu kinh nghiệm</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <PhoneCall className="h-6 w-6 text-[#66FF33] shrink-0 mt-1" />
                <div>
                  <h4 className="font-bold text-sm">Hỗ trợ 24/7</h4>
                  <p className="text-white/70 text-xs mt-1">Tư vấn và hỗ trợ khách hàng liên tục</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
