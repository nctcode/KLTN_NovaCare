'use client';

import { useState } from 'react';
import { AlertOctagon, X, AlertTriangle } from 'lucide-react';
import { interoperabilityService, PatientConsentItem } from '@/services/interoperability.service';

interface RevokeModalProps {
  isOpen: boolean;
  onClose: () => void;
  consent: PatientConsentItem | null;
  onSuccess: () => void;
}

export function RevokeModal({ isOpen, onClose, consent, onSuccess }: RevokeModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen || !consent) return null;

  const handleRevoke = async () => {
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      await interoperabilityService.revokeConsent(consent.id);
      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Không thể thu hồi quyền chia sẻ. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100 transition-all">
        {/* Header */}
        <div className="bg-red-600 px-6 py-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-md">
              <AlertOctagon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-lg leading-snug">Thu hồi quyền chia sẻ</h3>
              <p className="text-xs text-red-100 font-medium">Bệnh viện sẽ ngừng truy cập lịch sử khám</p>
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
        <div className="p-6 space-y-4">
          <p className="text-sm text-slate-600 leading-relaxed">
            Bạn có chắc chắn muốn thu hồi quyền chia sẻ dữ liệu y tế từ{' '}
            <strong className="text-slate-800">{consent.sourceHospital.name}</strong> sang{' '}
            <strong className="text-slate-800">{consent.targetHospital.name}</strong> không?
          </p>

          <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200 text-amber-800 text-xs font-medium flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span>
              Sau khi thu hồi, bệnh viện tiếp nhận sẽ không thể xem thêm thông tin khám y tế của bạn cho đến khi bạn cấp quyền lại.
            </span>
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
            Giữ lại quyền
          </button>
          <button
            type="button"
            onClick={handleRevoke}
            disabled={isSubmitting}
            className="px-5 py-2.5 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 active:bg-red-800 rounded-xl shadow-md shadow-red-500/20 transition flex items-center gap-2 disabled:opacity-50"
          >
            {isSubmitting ? (
              <span>Đang thu hồi...</span>
            ) : (
              <>
                <AlertOctagon className="w-4 h-4" />
                <span>Xác nhận thu hồi</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
