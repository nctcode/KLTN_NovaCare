'use client';

import { use } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar, User, Clock, ArrowLeft, Share2, Heart, MessageSquare, ShieldCheck, ChevronRight } from 'lucide-react';

export default function ArticleDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = use(params);

  return (
    <div className="bg-[#F8F9FA] min-h-screen pb-20">
      {/* Header Banner */}
      <section className="bg-[#0c4b39] text-white py-12">
        <div className="container-custom">
          <Link
            href="/tin-tuc"
            className="inline-flex items-center gap-1 text-xs text-[#66FF33] font-bold hover:underline mb-4"
          >
            <ArrowLeft className="h-4 w-4" /> Quay lại danh sách tin tức
          </Link>
          <div className="max-w-4xl space-y-4">
            <span className="text-xs uppercase font-extrabold tracking-widest text-[#66FF33] bg-white/10 px-3 py-1 rounded-full border border-white/10 inline-block">
              Y học thường thức
            </span>
            <h1 className="text-2xl md:text-4xl font-extrabold leading-tight tracking-tight">
              5 Dấu hiệu cảnh báo sớm bệnh lý tim mạch ở người trẻ tuổi & Cách phòng ngừa
            </h1>
            <div className="flex items-center gap-4 text-xs text-white/80 font-medium">
              <span className="flex items-center gap-1.5"><User className="h-3.5 w-3.5 text-[#66FF33]" /> TS.BS Nguyễn Văn An</span>
              <span>•</span>
              <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> 24/07/2026</span>
              <span>•</span>
              <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> 5 phút đọc</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Article Content */}
      <div className="container-custom mt-8">
        <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-3 space-y-8">
            <Card className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 md:p-10 space-y-6 text-slate-800 text-sm leading-relaxed">
              <img
                src="https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&q=80&w=800"
                alt="Bệnh tim mạch"
                className="w-full h-80 object-cover rounded-2xl shadow-sm"
              />

              <p className="font-semibold text-slate-700 text-base italic border-l-4 border-[#0c4b39] pl-4 py-1 bg-slate-50 rounded-r-xl">
                "Thói quen thức khuya, lười vận động, sử dụng thức ăn nhanh và căng thẳng công việc kéo dài là những nguyên nhân chính khiến số ca mắc bệnh tim mạch ở người dưới 40 tuổi tăng nhanh."
              </p>

              <h2 className="text-xl font-bold text-slate-900 pt-2">1. Đau thắt ngực hoặc cảm giác đè nặng vùng ngực</h2>
              <p>
                Đây là triệu chứng điển hình nhất của bệnh mạch vành. Cảm giác đau có thể lan ra cánh tay trái, vai, cổ hoặc hàm. Ngay cả khi cơn đau chỉ diễn ra trong vài phút rồi biến mất, bạn cũng không nên chủ quan.
              </p>

              <h2 className="text-xl font-bold text-slate-900 pt-2">2. Khó thở bất thường khi vận động nhẹ</h2>
              <p>
                Nếu bạn cảm thấy hụt hơi, khó thở sau khi leo vài bậc cầu thang hoặc đi bộ quãng ngắn, đó có thể là dấu hiệu tim không bơm đủ máu cho cơ thể.
              </p>

              <h2 className="text-xl font-bold text-slate-900 pt-2">3. Hoa mắt, chóng mặt và nhịp tim đập nhanh liên tục</h2>
              <p>
                Nhịp tim đập thình thịch, đập bỏ nhịp hoặc cảm giác choáng váng khi đứng dậy đột ngột cảnh báo rối loạn nhịp tim hoặc huyết áp không ổn định.
              </p>

              <div className="bg-[#0c4b39]/5 border border-[#0c4b39]/15 rounded-2xl p-6 space-y-3 mt-8">
                <div className="flex items-center gap-2 text-[#0c4b39] font-bold text-base">
                  <ShieldCheck className="h-5 w-5" />
                  <span>Lời khuyên từ Bác sĩ NovaCare</span>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed">
                  Hãy duy trì thói quen khám sức khỏe và tầm soát tim mạch định kỳ 6 tháng/lần. Nếu xuất hiện các cơn đau ngực dữ dội kèm vã mồ hôi lạnh, hãy đến cơ sở y tế gần nhất hoặc gọi cấp cứu 115 ngay lập tức.
                </p>
                <div className="pt-2">
                  <Link
                    href="/bac-si"
                    className="inline-block py-2 px-4 bg-[#0c4b39] text-white font-bold text-xs rounded-xl hover:bg-[#083327] transition"
                  >
                    Đặt lịch khám Tim mạch
                  </Link>
                </div>
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-xs">
              <h3 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-3">Tác giả bài viết</h3>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-[#0c4b39] text-white font-bold flex items-center justify-center text-sm">
                  AN
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-xs">TS.BS Nguyễn Văn An</h4>
                  <p className="text-[11px] text-slate-500">Cố vấn Y khoa NovaCare</p>
                </div>
              </div>
            </Card>

            <Card className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-xs">
              <h3 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-3">Bài viết liên quan</h3>
              <div className="space-y-3">
                <Link href="/tin-tuc" className="block text-xs font-bold text-slate-800 hover:text-[#0c4b39] transition">
                  Chế độ dinh dưỡng khoa học giúp ổn định đường huyết
                </Link>
                <Link href="/tin-tuc" className="block text-xs font-bold text-slate-800 hover:text-[#0c4b39] transition">
                  Giải mã nguyên nhân suy giảm trí nhớ ở dân văn phòng
                </Link>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
