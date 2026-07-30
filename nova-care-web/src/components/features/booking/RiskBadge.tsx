'use client';

import React from 'react';
import { AlertTriangle, CheckCircle2, ShieldAlert, PhoneCall } from 'lucide-react';

interface RiskBadgeProps {
  level: 'MONITOR' | 'CONSULT' | 'EMERGENCY' | string;
  label?: string;
  reason?: string;
}

export function RiskBadge({ level, label, reason }: RiskBadgeProps) {
  if (level === 'EMERGENCY') {
    return (
      <div className="p-5 rounded-3xl bg-rose-500/10 border-2 border-rose-500 text-rose-700 dark:text-rose-400 space-y-3 shadow-lg animate-pulse">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-rose-500 text-white flex items-center justify-center font-black">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-black text-lg text-rose-600 dark:text-rose-400 uppercase tracking-tight">
              {label || '🔴 Cảnh Báo Nguy Cơ Cấp Cứu Khẩn Cấp'}
            </h3>
            <p className="text-xs font-bold text-rose-600/90">{reason || 'Ghi nhận dấu hiệu triệu chứng lâm sàng nguy hiểm.'}</p>
          </div>
        </div>

        <div className="pt-2 border-t border-rose-500/20 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs font-extrabold text-rose-700 dark:text-rose-300">
            🚨 Vui lòng không tự điều trị tại nhà hay tự lái xe. Gọi ngay đường dây nóng:
          </p>
          <a
            href="tel:115"
            className="w-full sm:w-auto px-6 py-2.5 rounded-2xl bg-rose-600 text-white font-black text-xs flex items-center justify-center gap-2 shadow-md hover:bg-rose-700 transition"
          >
            <PhoneCall className="w-4 h-4 animate-bounce" /> Gọi Cấp Cứu 115
          </a>
        </div>
      </div>
    );
  }

  if (level === 'CONSULT') {
    return (
      <div className="p-5 rounded-3xl bg-amber-500/10 border-2 border-amber-500 text-amber-900 dark:text-amber-300 space-y-2 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-black">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-black text-base text-amber-700 dark:text-amber-400 uppercase tracking-tight">
              {label || '🟡 Khuyên Dùng Khám Bác Sĩ Chuyên Khoa'}
            </h3>
            <p className="text-xs font-semibold text-amber-800 dark:text-amber-300">{reason || 'Triệu chứng của bạn nên được bác sĩ kiểm tra và chẩn đoán.'}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-5 rounded-3xl bg-emerald-500/10 border-2 border-emerald-500 text-emerald-900 dark:text-emerald-300 space-y-2 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-black">
          <CheckCircle2 className="w-6 h-6" />
        </div>
        <div>
          <h3 className="font-black text-base text-emerald-700 dark:text-[#66FF33] uppercase tracking-tight">
            {label || '🟢 Có Thể Theo Dõi Tại Nhà'}
          </h3>
          <p className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">{reason || 'Triệu chứng ở mức độ nhẹ, nghỉ ngơi và theo dõi diễn biến.'}</p>
        </div>
      </div>
    </div>
  );
}
