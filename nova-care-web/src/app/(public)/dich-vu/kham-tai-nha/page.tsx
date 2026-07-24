'use client';

import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Home as HomeIcon,
  Clock,
  ShieldCheck,
  CheckCircle2,
  PhoneCall,
  UserCheck,
  Calendar,
  HeartPulse,
  Award
} from 'lucide-react';

const HOME_SERVICES = [
  {
    id: 'kham-tong-quat-tai-nha',
    title: 'Khám Bác Sĩ Tổng Quát Tại Nhà',
    desc: 'Bác sĩ chuyên khoa Nội/Nhi đến tận nhà khám lâm sàng, kê đơn thuốc và tư vấn chế độ chăm sóc cho bệnh nhân.',
    price: '450.000đ / lượt',
    duration: '45 - 60 phút',
    badge: 'Phổ biến nhất'
  },
  {
    id: 'lay-mau-xet-nghiem-tai-nha',
    title: 'Lấy Mẫu Xét Nghiệm Tận Nơi',
    desc: 'Điều dưỡng mang trang thiết bị vô trùng đến tận nhà lấy máu/nước tiểu, bảo quản chuẩn y khoa và gửi trả kết quả tận tay hoặc online.',
    price: '150.000đ + Phí XN',
    duration: '15 - 20 phút',
    badge: 'An toàn & Tiện lợi'
  },
  {
    id: 'chieu-den-thay-bang-tai-nha',
    title: 'Thay Băng, Rửa Vết Thương & Chăm Sóc Y Tế',
    desc: 'Dành cho bệnh nhân sau phẫu thuật, người cao tuổi hạn chế di chuyển. Thao tác vô trùng tuyệt đối bởi điều dưỡng có chứng chỉ hành nghề.',
    price: '250.000đ / lượt',
    duration: '30 phút',
    badge: 'Chuẩn y khoa'
  },
  {
    id: 'truyen-dich-cham-soc-tai-nha',
    title: 'Bác Sĩ & Điều Dưỡng Thăm Khám Định Kỳ Người Già',
    desc: 'Chăm sóc toàn diện cho người cao tuổi, người bệnh mạn tính (huyết áp, đái tháo đường, tai biến) ngay tại không gian sống quen thuộc.',
    price: '600.000đ / lượt',
    duration: '60 - 90 phút',
    badge: 'Chăm sóc tận tâm'
  }
];

export default function HomeHealthcarePage() {
  return (
    <div className="bg-[#F8F9FA] min-h-screen pb-20">
      {/* Hero Banner */}
      <section className="bg-[#0c4b39] text-white py-16 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(102,255,51,0.12),transparent_60%)]"></div>
        <div className="container-custom relative z-10 text-center">
          <span className="text-xs uppercase font-extrabold tracking-widest text-[#66FF33] bg-white/10 px-4 py-1.5 rounded-full border border-white/10 inline-block mb-3">
            Dịch vụ y tế tại nhà NovaCare
          </span>
          <h1 className="text-3xl md:text-5xl font-black mb-4 tracking-tight">
            Khám Bệnh & Chăm Sóc Y Tế Tại Nhà
          </h1>
          <p className="text-white/80 max-w-2xl mx-auto text-sm md:text-base leading-relaxed">
            Mang chất lượng dịch vụ bệnh viện cao cấp đến ngay phòng khách gia đình bạn. Đội ngũ y bác sĩ giàu kinh nghiệm, phục vụ chu đáo 24/7.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <div className="container-custom mt-12 space-y-12">
        {/* Benefits Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-xl bg-[#0c4b39]/10 text-[#0c4b39] flex items-center justify-center mb-4">
              <HomeIcon className="h-6 w-6" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm mb-1">Không Cần Di Chuyển</h3>
            <p className="text-slate-500 text-xs leading-relaxed">Tránh khói bụi, mệt mỏi và chờ đợi mòn mỏi tại các cơ sở y tế quá tải.</p>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-xl bg-[#0c4b39]/10 text-[#0c4b39] flex items-center justify-center mb-4">
              <UserCheck className="h-6 w-6" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm mb-1">Bác Sĩ Giàu Kinh Nghiệm</h3>
            <p className="text-slate-500 text-xs leading-relaxed">Đội ngũ y bác sĩ đang công tác tại các bệnh viện lớn tuyến Trung ương.</p>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-xl bg-[#0c4b39]/10 text-[#0c4b39] flex items-center justify-center mb-4">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm mb-1">Thiết Bị Vô Trùng Chuẩn</h3>
            <p className="text-slate-500 text-xs leading-relaxed">Toàn bộ dụng cụ y tế và quy trình thực hiện tuân thủ nghiêm ngặt chuẩn Bộ Y Tế.</p>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-xl bg-[#0c4b39]/10 text-[#0c4b39] flex items-center justify-center mb-4">
              <Clock className="h-6 w-6" />
            </div>
            <h3 className="font-bold text-slate-[#0c4b39] text-sm mb-1">Chủ Động Khung Giờ</h3>
            <p className="text-slate-500 text-xs leading-relaxed">Đặt lịch linh hoạt cả buổi tối và ngày nghỉ cuối tuần theo yêu cầu gia đình.</p>
          </div>
        </div>

        {/* Services List */}
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 mb-6">Các gói dịch vụ khám tại nhà</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {HOME_SERVICES.map((srv) => (
              <Card key={srv.id} className="hover:shadow-lg transition border border-slate-200 bg-white rounded-3xl overflow-hidden p-6 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-[#0c4b39] bg-[#0c4b39]/10 px-3 py-1 rounded-full border border-[#0c4b39]/15">
                      {srv.badge}
                    </span>
                    <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" /> {srv.duration}
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-900 text-lg mb-2">{srv.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed mb-6">{srv.desc}</p>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Chi phí niêm yết</span>
                    <span className="text-lg font-black text-[#0c4b39]">{srv.price}</span>
                  </div>
                  <Link
                    href="/dat-lich"
                    className="py-2.5 px-5 bg-[#0c4b39] hover:bg-[#083327] text-white font-bold rounded-xl text-xs uppercase tracking-wider shadow-sm transition"
                  >
                    Đặt lịch khám tại nhà
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
