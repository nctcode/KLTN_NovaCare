import React from 'react';
import { Calendar, Stethoscope, Building2, ShieldCheck, Sparkles, FolderHeart } from 'lucide-react';

export function AuthBrandPanel() {
  return (
    <div className="hidden lg:flex lg:w-[50%] xl:w-[52%] bg-gradient-to-br from-[#064E3B] via-[#075E47] to-[#0A6C50] text-white p-10 xl:p-14 flex-col justify-between relative overflow-hidden select-none">
      {/* Subtle Background Ambient Accents */}
      <div className="absolute top-0 right-0 -mt-16 -mr-16 w-80 h-80 bg-white/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-96 h-96 bg-[#10A66A]/15 rounded-full blur-3xl pointer-events-none" />

      {/* Top Branding Section */}
      <div className="relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-inner">
            <svg
              className="w-6 h-6 text-[#A7F3D0]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {/* Medical Cross + Heart Pulse */}
              <path d="M12 4v16m-8-8h16" />
              <circle cx="12" cy="12" r="3" className="fill-white/20" />
            </svg>
          </div>
          <div>
            <div className="text-2xl font-black tracking-tight text-white flex items-center gap-1.5">
              NovaCare
              <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-[#10A66A]/30 text-[#A7F3D0] border border-[#10A66A]/40">
                Healthcare
              </span>
            </div>
            <p className="text-xs text-[#A7F3D0]/90 font-medium">Hệ thống Y tế & Đặt khám Trực tuyến</p>
          </div>
        </div>
      </div>

      {/* Center Section: Value Proposition & Feature Highlights */}
      <div className="relative z-10 my-auto py-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-[#A7F3D0] text-xs font-semibold mb-5 border border-white/15">
          <Sparkles className="w-3.5 h-3.5 text-[#34D399]" />
          Nền tảng chăm sóc sức khỏe thế hệ mới
        </div>

        <h1 className="text-3xl xl:text-4xl font-extrabold text-white tracking-tight leading-tight mb-4">
          Chăm sóc sức khỏe <br />
          <span className="text-[#34D399]">thông minh & dễ dàng hơn</span>
        </h1>

        <p className="text-white/80 text-sm xl:text-base leading-relaxed max-w-lg mb-8">
          Đặt lịch khám tại các cơ sở y tế hàng đầu, quản lý hồ sơ bệnh án tập trung và nhận tư vấn định hướng chuyên khoa từ AI an toàn.
        </p>

        {/* Feature List */}
        <div className="space-y-4 mb-8">
          <div className="flex items-start gap-3.5">
            <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center shrink-0 mt-0.5 border border-white/15">
              <Calendar className="w-4 h-4 text-[#34D399]" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Đặt khám nhanh chóng & chủ động</p>
              <p className="text-xs text-white/70">Tiết kiệm thời gian chờ đợi với mạng lưới bệnh viện và phòng khám uy tín.</p>
            </div>
          </div>

          <div className="flex items-start gap-3.5">
            <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center shrink-0 mt-0.5 border border-white/15">
              <FolderHeart className="w-4 h-4 text-[#34D399]" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Hồ sơ sức khỏe & Bệnh án số</p>
              <p className="text-xs text-white/70">Lưu trữ kết quả khám, đơn thuốc và chỉ số sức khỏe bảo mật trọn đời.</p>
            </div>
          </div>

          <div className="flex items-start gap-3.5">
            <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center shrink-0 mt-0.5 border border-white/15">
              <ShieldCheck className="w-4 h-4 text-[#34D399]" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Bảo mật dữ liệu chuẩn liên thông y tế</p>
              <p className="text-xs text-white/70">Kiểm soát hoàn toàn quyền chia sẻ thông tin cho các bác sĩ điều trị.</p>
            </div>
          </div>
        </div>

        {/* Floating Appointment Preview Mockup Card */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/15 max-w-md shadow-lg shadow-black/10">
          <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-white/10">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#34D399] animate-pulse" />
              <span className="text-xs font-semibold text-white/90">Lịch khám sắp tới</span>
            </div>
            <span className="text-[11px] font-bold text-[#34D399] bg-[#34D399]/15 px-2 py-0.5 rounded-full border border-[#34D399]/30">
              Đã xác nhận
            </span>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs text-white">
              <Stethoscope className="w-3.5 h-3.5 text-[#A7F3D0] shrink-0" />
              <span className="font-semibold">PGS.TS Hoàng Nha Quỳnh</span>
              <span className="text-white/60">· Cơ xương khớp</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-white/80">
              <Building2 className="w-3.5 h-3.5 text-[#A7F3D0] shrink-0" />
              <span className="truncate">Bệnh viện Y Dược NovaCare Chợ Lớn</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-[#A7F3D0] font-medium">
              <Calendar className="w-3.5 h-3.5 shrink-0" />
              <span>09:00 · Thứ Tư, 15/10/2026</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Footer Section */}
      <div className="relative z-10 pt-4 border-t border-white/15 flex items-center justify-between text-xs text-white/70">
        <span>© 2026 NovaCare. Nền tảng Y tế Số</span>
        <div className="flex items-center gap-1.5 text-[#A7F3D0] font-medium">
          <ShieldCheck className="w-4 h-4 text-[#34D399]" />
          <span>Bảo mật chuẩn Bộ Y Tế</span>
        </div>
      </div>
    </div>
  );
}

export default AuthBrandPanel;
