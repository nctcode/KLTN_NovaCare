'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService } from '@/services/admin.service';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { AlertTriangle, CheckCircle2, XCircle, Clock, Phone, Loader2, UserX, ShieldAlert } from 'lucide-react';
import { useAdminTheme } from '@/components/admin/AdminThemeContext';

interface NoShowConfirmModalProps {
  appointment: any | null;
  open: boolean;
  onClose: () => void;
  onOpenContactLog?: (appointment: any) => void;
  onSuccess?: () => void;
}

export function NoShowConfirmModal({
  appointment,
  open,
  onClose,
  onOpenContactLog,
  onSuccess,
}: NoShowConfirmModalProps) {
  const queryClient = useQueryClient();
  const { theme } = useAdminTheme();
  const isLight = theme === 'light';

  const { data: eligibility, isLoading: checkingEligibility } = useQuery({
    queryKey: ['no-show-eligibility', appointment?.id],
    queryFn: () => adminService.checkNoShowEligibility(appointment!.id),
    enabled: !!appointment?.id && open,
  });

  const confirmMutation = useMutation({
    mutationFn: () => {
      if (!appointment) throw new Error('Không có lịch hẹn');
      return adminService.updateAppointmentStatus(appointment.id, 'NO_SHOW');
    },
    onSuccess: () => {
      toast.success('Đã ghi nhận vắng mặt (NO_SHOW) cho lịch khám thành công');
      queryClient.invalidateQueries({ queryKey: ['admin-appointments'] });
      queryClient.invalidateQueries({ queryKey: ['admin-appointment-stats'] });
      queryClient.invalidateQueries({ queryKey: ['admin-appointment-detail', appointment?.id] });
      onSuccess?.();
      onClose();
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || err.message || 'Không thể cập nhật trạng thái vắng mặt');
    },
  });

  if (!appointment) return null;

  const patientName = appointment.patientProfile?.fullName || appointment.user?.fullName || 'Bệnh nhân';
  const slotStart = appointment.slot?.startTime ? new Date(appointment.slot.startTime) : null;
  const isEligible = eligibility?.eligible === true;
  const details = eligibility?.details;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className={`max-w-lg p-6 rounded-2xl ${isLight ? 'bg-white text-slate-900 border-slate-200' : 'bg-slate-950 text-white border-slate-800'}`}>
        <DialogHeader className="pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <UserX className="w-4 h-4" />
            </div>
            <div>
              <DialogTitle className="text-sm font-bold text-slate-900 dark:text-white">
                Kiểm tra & Xác nhận bệnh nhân không đến khám (NO_SHOW)
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Mã phiếu: <strong className="font-mono text-slate-900 dark:text-white font-bold">#{appointment.bookingCode}</strong> — {patientName}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {checkingEligibility ? (
          <div className="py-12 flex flex-col items-center justify-center gap-2">
            <Loader2 className="w-6 h-6 text-emerald-600 animate-spin" />
            <span className="text-xs text-slate-500">Đang thẩm định chính sách tiếp đón và điều kiện NO_SHOW...</span>
          </div>
        ) : (
          <div className="space-y-4 py-2 text-xs">
            {/* Checklist of Policy Conditions */}
            <div className={`p-3.5 rounded-xl border space-y-2.5 ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900 border-slate-800'}`}>
              <div className="font-bold text-slate-900 dark:text-white flex items-center justify-between pb-1.5 border-b border-slate-200/80 dark:border-slate-800">
                <span>Bộ tiêu chuẩn nghiệp vụ cơ sở</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                  isEligible ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                }`}>
                  {isEligible ? 'Đủ điều kiện' : 'Chưa đủ điều kiện'}
                </span>
              </div>

              {/* 1. Grace period */}
              <div className="flex items-start gap-2">
                {details?.isOverdue ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                )}
                <div>
                  <div className="font-medium text-slate-800 dark:text-slate-200">
                    Hết thời gian ân hạn ({details?.gracePeriodMinutes || 15} phút sau giờ hẹn)
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Giờ hẹn: {slotStart ? slotStart.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : 'N/A'}{' '}
                    {details?.gracePeriodEndsAt && `— Mốc ân hạn kết thúc: ${new Date(details.gracePeriodEndsAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`}
                  </div>
                </div>
              </div>

              {/* 2. Check-in & Encounter */}
              <div className="flex items-start gap-2">
                {!details?.hasCheckedIn && !details?.hasEncounter ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                )}
                <div>
                  <div className="font-medium text-slate-800 dark:text-slate-200">
                    Chưa check-in tại quầy và chưa tạo bệnh án khám
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    {details?.hasCheckedIn ? '⚠️ Bệnh nhân đã check-in' : '✓ Chưa check-in tiếp đón'} |{' '}
                    {details?.hasEncounter ? '⚠️ Đã có phiên khám' : '✓ Chưa có hồ sơ khám'}
                  </div>
                </div>
              </div>

              {/* 3. Min contact attempts */}
              <div className="flex items-start gap-2">
                {details?.contactCount >= (details?.minContactAttempts || 2) ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                )}
                <div>
                  <div className="font-medium text-slate-800 dark:text-slate-200">
                    Đã liên hệ tối thiểu {details?.minContactAttempts || 2} lần theo quy định
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Hiện tại: <strong className="text-blue-600 dark:text-blue-400 font-bold">{details?.contactCount || 0}</strong> / {details?.minContactAttempts || 2} lượt liên hệ đã lưu nhật ký
                  </div>
                </div>
              </div>

              {/* 4. Min contact interval */}
              <div className="flex items-start gap-2">
                {details?.intervalPassed ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                )}
                <div>
                  <div className="font-medium text-slate-800 dark:text-slate-200">
                    Khoảng cách giữa các lần liên hệ ({details?.minIntervalMinutes || 5} phút)
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    {details?.lastContactAt
                      ? `Lần liên hệ gần nhất: ${new Date(details.lastContactAt).toLocaleTimeString('vi-VN')}`
                      : 'Chưa có lượt liên hệ nào'}
                  </div>
                </div>
              </div>
            </div>

            {/* Ineligible Explanation */}
            {!isEligible && eligibility?.reasons && eligibility.reasons.length > 0 && (
              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-xl space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold text-amber-800 dark:text-amber-300">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
                  <span>Chưa thể xác nhận NO_SHOW vì các lý do sau:</span>
                </div>
                <ul className="list-disc pl-5 space-y-0.5 text-[11px] text-amber-700 dark:text-amber-300">
                  {eligibility.reasons.map((r: string, idx: number) => (
                    <li key={idx}>{r}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Eligible confirmation note */}
            {isEligible && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-xl text-emerald-800 dark:text-emerald-300 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Đầy đủ bằng chứng xác nhận vắng mặt
                </div>
                <p className="text-[11px] text-emerald-700 dark:text-emerald-300 leading-relaxed">
                  Khi xác nhận, hệ thống sẽ giải phóng suất khám, lưu vết Audit Log và gửi thông báo chuẩn mực y tế tới ứng dụng của bệnh nhân.
                </p>
              </div>
            )}
          </div>
        )}

        <DialogFooter className="pt-3 border-t border-slate-200 dark:border-slate-800 gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={confirmMutation.isPending}
            className="rounded-lg text-xs"
          >
            Đóng
          </Button>

          {/* Quick action to add contact log if ineligible due to contact */}
          {!isEligible && onOpenContactLog && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                onClose();
                onOpenContactLog(appointment);
              }}
              className="rounded-lg text-xs text-blue-600 border-blue-200 hover:bg-blue-50 font-semibold gap-1.5"
            >
              <Phone className="w-3.5 h-3.5" />
              Ghi nhận liên hệ ngay
            </Button>
          )}

          {/* Confirm Button */}
          <Button
            type="button"
            size="sm"
            onClick={() => confirmMutation.mutate()}
            disabled={!isEligible || confirmMutation.isPending || checkingEligibility}
            className="rounded-lg text-xs bg-rose-600 hover:bg-rose-700 text-white font-semibold gap-1.5 disabled:opacity-50"
          >
            {confirmMutation.isPending ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Đang xử lý...
              </>
            ) : (
              'Xác nhận không đến khám'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
