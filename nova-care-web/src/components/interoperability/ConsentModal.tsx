'use client';

import { useState } from 'react';
import { ShieldCheck, X, CheckCircle2, AlertTriangle, Building2, ArrowRight } from 'lucide-react';
import { interoperabilityService, PatientConsentItem } from '@/services/interoperability.service';

interface ConsentModalProps {
  isOpen: boolean;
  onClose: () => void;
  consent: PatientConsentItem | null;
  onSuccess: () => void;
}

export function ConsentModal({ isOpen, onClose, consent, onSuccess }: ConsentModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen || !consent) return null;

  const handleGrant = async () => {
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      await interoperabilityService.grantConsent(consent.id);
      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Không thể cấp quyền chia sẻ. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-100 transition-all">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-md">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-lg leading-snug">Xác nhận đồng ý chia sẻ dữ liệu y tế</h3>
              <p className="text-xs text-blue-100 font-medium">Bảo mật & Liên thông dữ liệu NovaCare</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Explanation */}
          <p className="text-sm text-slate-600 leading-relaxed">
            Bạn đang cho phép bệnh viện đích truy cập và xem lịch sử khám bệnh của bạn từ bệnh viện nguồn nhằm hỗ trợ chẩn đoán và điều trị liên thông tốt hơn.
          </p>

          {/* Hospital Transfer Card */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 flex items-center justify-between gap-3">
            <div className="flex-1 text-center sm:text-left">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1 justify-center sm:justify-start">
                <Building2 className="w-3.5 h-3.5 text-slate-500" /> Bệnh viện nguồn
              </div>
              <div className="font-bold text-slate-800 text-sm">{consent.sourceHospital.name}</div>
            </div>

            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 shrink-0">
              <ArrowRight className="w-4 h-4" />
            </div>

            <div className="flex-1 text-center sm:text-right">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1 justify-center sm:justify-end">
                <Building2 className="w-3.5 h-3.5 text-blue-600" /> Bệnh viện tiếp nhận
              </div>
              <div className="font-bold text-blue-700 text-sm">{consent.targetHospital.name}</div>
            </div>
          </div>

          {/* Data types shared */}
          <div className="space-y-3">
            <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Dữ liệu y tế sẽ được chia sẻ:
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs font-medium text-slate-700">
              <div className="flex items-center gap-2 bg-emerald-50 text-emerald-800 p-2.5 rounded-lg border border-emerald-100">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Thông tin lượt khám</span>
              </div>
              <div className="flex items-center gap-2 bg-emerald-50 text-emerald-800 p-2.5 rounded-lg border border-emerald-100">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Chẩn đoán bệnh (ICD-10)</span>
              </div>
              <div className="flex items-center gap-2 bg-emerald-50 text-emerald-800 p-2.5 rounded-lg border border-emerald-100">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Sinh hiệu & Chỉ số xét nghiệm</span>
              </div>
              <div className="flex items-center gap-2 bg-emerald-50 text-emerald-800 p-2.5 rounded-lg border border-emerald-100">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Đơn thuốc & Liều dùng</span>
              </div>
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-lg bg-red-50 text-red-600 text-xs font-medium flex items-center gap-2 border border-red-200">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 rounded-xl transition"
          >
            Hủy bỏ
          </button>
          <button
            type="button"
            onClick={handleGrant}
            disabled={isSubmitting}
            className="px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-xl shadow-md shadow-blue-500/20 transition flex items-center gap-2 disabled:opacity-50"
          >
            {isSubmitting ? (
              <span>Đang xử lý...</span>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>Xác nhận đồng ý chia sẻ</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
