'use client';

import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Microscope, Activity, ShieldCheck, CheckCircle2, FileText, ArrowRight } from 'lucide-react';

const LAB_TESTS = [
  {
    title: 'Xét Nghiệm Máu Tổng Quát (Công thức máu 22 chỉ số)',
    desc: 'Đánh giá nguy cơ thiếu máu, tình trạng viêm nhiễm, phát hiện các bệnh lý về máu đường huyết và mỡ máu.',
    price: '220.000đ',
    time: '2 - 4 giờ trả kq'
  },
  {
    title: 'Xét Nghiệm Chức Năng Gan & Thận Chuyên Sâu',
    desc: 'Đo các chỉ số men gan AST/ALT/GGT, Bilirubin, Ure, Creatinin giúp tầm soát sớm viêm gan và suy thận.',
    price: '350.000đ',
    time: '2 - 4 giờ trả kq'
  },
  {
    title: 'Tầm Soát Ung Thư Sớm (Marker Ung Thư)',
    desc: 'Xét nghiệm các chỉ số dấu ấn ung thư gan (AFP), ung thư phổi (CEA), ung thư vú (CA 15-3), tiền liệt tuyến (PSA).',
    price: '980.000đ',
    time: 'Trong ngày'
  },
  {
    title: 'Chụp X-Quang Kỹ Thuật Số & Siêu Âm Màu 4D',
    desc: 'Chẩn đoán hình ảnh kỹ thuật số độ phân giải cao cho kết quả rõ nét, phát hiện sớm các tổn thương tạng.',
    price: '400.000đ',
    time: '30 phút'
  }
];

export default function LabTestsPage() {
  return (
    <div className="bg-[#F8F9FA] min-h-screen pb-20">
      {/* Banner */}
      <section className="bg-[#0c4b39] text-white py-16 relative overflow-hidden">
        <div className="container-custom relative z-10 text-center">
          <span className="text-xs uppercase font-extrabold tracking-widest text-[#66FF33] bg-white/10 px-4 py-1.5 rounded-full border border-white/10 inline-block mb-3">
            Trung tâm Xét nghiệm Chuẩn Quốc tế
          </span>
          <h1 className="text-3xl md:text-5xl font-black mb-4 tracking-tight">
            Xét Nghiệm & Chẩn Đoán Hình Ảnh
          </h1>
          <p className="text-white/80 max-w-2xl mx-auto text-sm md:text-base leading-relaxed">
            Hệ thống phòng lab hiện đại tiêu chuẩn ISO/CLIA. Trả kết quả trực tuyến nhanh chóng, bảo mật và chính xác tuyệt đối.
          </p>
        </div>
      </section>

      <div className="container-custom mt-12 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {LAB_TESTS.map((test, idx) => (
            <Card key={idx} className="hover:shadow-lg transition border border-slate-200 bg-white rounded-3xl p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-[#0c4b39] bg-[#0c4b39]/10 px-3 py-1 rounded-full">
                    {test.time}
                  </span>
                  <Microscope className="h-6 w-6 text-[#0c4b39]" />
                </div>
                <h3 className="font-bold text-slate-900 text-lg mb-2">{test.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed mb-6">{test.desc}</p>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xl font-black text-[#0c4b39]">{test.price}</span>
                <Link
                  href="/dat-lich"
                  className="py-2.5 px-5 bg-[#0c4b39] hover:bg-[#083327] text-white font-bold rounded-xl text-xs uppercase tracking-wider shadow-sm transition"
                >
                  Đặt xét nghiệm
                </Link>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
