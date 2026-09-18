'use client';

import React from 'react';
import { ScreeningTriageResult } from '@/types/screening';
import { Stethoscope, ShieldAlert, AlertTriangle, CheckCircle2, Sparkles, Building2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface ScreeningSummaryProps {
  triageResult: ScreeningTriageResult;
  onSelectSpecialty?: (specialtyId: string, name: string) => void;
}

export function ScreeningSummary({ triageResult, onSelectSpecialty }: ScreeningSummaryProps) {
  const { riskLevel, recommendationType, urgentAdvice, specialtyCandidates, triggeredRedFlags } = triageResult;

  const isUrgent = riskLevel === 'URGENT' || recommendationType === 'TRIAGE';

  return (
    <div className="space-y-5 select-none">
      {/* Risk Assessment Banner */}
      <div
        className={`p-5 rounded-3xl border-2 flex items-start gap-4 ${
          isUrgent
            ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-500 text-rose-950 dark:text-rose-200'
            : riskLevel === 'HIGH'
            ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-500 text-amber-950 dark:text-amber-200'
            : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-950 dark:text-emerald-200'
        }`}
      >
        <div
          className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 text-white font-black ${
            isUrgent ? 'bg-rose-600' : riskLevel === 'HIGH' ? 'bg-amber-600' : 'bg-emerald-600'
          }`}
        >
          {isUrgent ? <ShieldAlert className="w-6 h-6" /> : riskLevel === 'HIGH' ? <AlertTriangle className="w-6 h-6" /> : <CheckCircle2 className="w-6 h-6" />}
        </div>

        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black uppercase tracking-wider">Đánh giá nguy cơ (Triage)</span>
            <Badge className="bg-white/80 font-black text-[10px] border border-current text-slate-900">
              Mức độ: {riskLevel}
            </Badge>
          </div>
          <h3 className="text-base font-black tracking-tight">
            {isUrgent
              ? 'Triệu chứng có dấu hiệu cần được đánh giá y tế sớm'
              : 'Có dấu hiệu triệu chứng cần được Bác sĩ kiểm tra chuyên khoa'}
          </h3>
          <p className="text-xs font-semibold opacity-90">
            {urgentAdvice || 'Dựa trên câu trả lời sàng lọc, hệ thống ghi nhận một số yếu tố nguy cơ cần theo dõi.'}
          </p>
        </div>
      </div>

      {/* Red Flags Card if Triggered */}
      {triggeredRedFlags && triggeredRedFlags.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 text-xs space-y-1.5">
          <p className="font-extrabold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-amber-600" /> Các triệu chứng cần lưu ý:
          </p>
          <ul className="space-y-1 pl-5 list-disc text-slate-700 dark:text-slate-300 font-medium">
            {triggeredRedFlags.map((rf, idx) => (
              <li key={idx}>
                <strong>{rf.questionText}</strong> ({rf.advice})
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Specialty Candidates Ranking & Transparent Explainability */}
      {specialtyCandidates && specialtyCandidates.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
              <Stethoscope className="w-4 h-4 text-[#0c4b39] dark:text-[#66FF33]" />
              <span>Gợi ý Chuyên khoa phù hợp nhất ({specialtyCandidates.length})</span>
            </h4>
            <span className="text-[10px] text-slate-400 font-bold">Xếp hạng theo độ tương thích</span>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {specialtyCandidates.map((cand, idx) => (
              <div
                key={cand.specialtyId}
                className={`p-4 rounded-2xl border transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                  idx === 0
                    ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-500/60 shadow-sm'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                }`}
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-[#0c4b39] text-[#66FF33] text-xs font-black flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <h5 className="text-sm font-black text-slate-900 dark:text-white">
                      Chuyên khoa {cand.specialtyName}
                    </h5>
                    {idx === 0 && (
                      <Badge className="bg-[#0c4b39] text-[#66FF33] font-black text-[10px]">
                        Khuyên dùng nhất
                      </Badge>
                    )}
                  </div>

                  <div className="pl-8 space-y-1">
                    <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">Lý do gợi ý:</p>
                    <ul className="space-y-0.5 text-[11px] text-slate-500 font-medium list-disc pl-4">
                      {cand.reasons.map((r, rIdx) => (
                        <li key={rIdx}>{r}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                {onSelectSpecialty && (
                  <Button
                    type="button"
                    onClick={() => onSelectSpecialty(cand.specialtyId, cand.specialtyName)}
                    className="bg-[#0c4b39] hover:bg-[#083629] text-white text-xs font-extrabold rounded-xl px-4 py-2 shrink-0 self-end sm:self-center"
                  >
                    <span>Chọn chuyên khoa này</span>
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Non-diagnostic Disclaimer */}
      <p className="text-[11px] text-slate-400 text-center italic pt-2">
        * Disclaimer: Đây là kết quả gợi ý hỗ trợ từ hệ thống sàng lọc ban đầu và không thay thế cho chẩn đoán y tế xác định từ Bác sĩ chuyên khoa.
      </p>
    </div>
  );
}
