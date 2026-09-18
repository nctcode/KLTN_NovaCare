'use client';

import React from 'react';
import { AlertTriangle, ShieldAlert } from 'lucide-react';
import { RedFlagTriggered } from '@/types/screening';

interface RedFlagAlertProps {
  triggeredRedFlags: RedFlagTriggered[];
  urgentAdvice?: string;
}

export function RedFlagAlert({ triggeredRedFlags, urgentAdvice }: RedFlagAlertProps) {
  if (!triggeredRedFlags || triggeredRedFlags.length === 0) return null;

  const hasCritical = triggeredRedFlags.some((rf) => rf.severity === 'CRITICAL');

  return (
    <div
      className={`p-4.5 rounded-3xl border-2 transition-all space-y-2.5 ${
        hasCritical
          ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-400 text-rose-950 dark:text-rose-200'
          : 'bg-amber-50 dark:bg-amber-950/40 border-amber-400 text-amber-950 dark:text-amber-200'
      }`}
    >
      <div className="flex items-center gap-2.5">
        <div
          className={`w-9 h-9 rounded-2xl flex items-center justify-center text-white shrink-0 font-black ${
            hasCritical ? 'bg-rose-600' : 'bg-amber-600'
          }`}
        >
          {hasCritical ? <ShieldAlert className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
        </div>
        <div>
          <h4 className="text-xs font-black uppercase tracking-wider">
            ⚠️ Dấu hiệu cần lưu ý
          </h4>
          <p className="text-xs font-bold opacity-90">
            {urgentAdvice || 'Nội dung bạn cung cấp có một số dấu hiệu cần được đánh giá y tế sớm.'}
          </p>
        </div>
      </div>

      <div className="space-y-1.5 pt-1 pl-11 text-xs">
        {triggeredRedFlags.map((rf, idx) => (
          <div key={idx} className="flex items-start gap-1.5">
            <span className="font-black text-rose-600">•</span>
            <span>
              <strong>{rf.questionText}</strong>: {rf.advice}
            </span>
          </div>
        ))}
      </div>

      <p className="text-[11px] font-semibold text-slate-500 pt-1 border-t border-slate-200/60 dark:border-slate-800">
        * Lưu ý: Đây là đánh giá nguy cơ ban đầu hỗ trợ hướng dẫn y tế, không thay thế cho chẩn đoán chuyên môn từ Bác sĩ.
      </p>
    </div>
  );
}
