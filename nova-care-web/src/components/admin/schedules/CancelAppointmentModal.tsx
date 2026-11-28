'use client';

import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService } from '@/services/admin.service';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { XCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { useAdminTheme } from '@/components/admin/AdminThemeContext';

const QUICK_REASONS = [
  'Bệnh nhân liên hệ yêu cầu hủy lịch khám',
  'Bác sĩ có lịch công tác đột xuất tại cơ sở y tế',
  'Điều chỉnh lịch khám theo yêu cầu của cơ sở y tế',
];

interface CancelAppointmentModalProps {
  appointment: any | null;
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function CancelAppointmentModal({
  appointment,
  open,
  onClose,
  onSuccess,
}: CancelAppointmentModalProps) {
  const queryClient = useQueryClient();
  const { theme } = useAdminTheme();
  const isLight = theme === 'light';

  const [reason, setReason] = useState('');

  useEffect(() => {
    if (!open) {
      setReason('');
    }
  }, [open]);

  const mutation = useMutation({
    mutationFn: () => {
      if (!appointment) throw new Error('Không có lịch hẹn');
      const trimmed = reason.trim();
      if (!trimmed) throw new Error('Vui lòng nhập lý do hủy lịch hẹn');
      return adminService.updateAppointmentStatus(appointment.id, 'CANCELLED', trimmed);
    },
    onSuccess: () => {
      toast.success('Đã hủy lịch hẹn và giải phóng suất khám thành công');
      queryClient.invalidateQueries({ queryKey: ['admin-appointments'] });
      queryClient.invalidateQueries({ queryKey: ['admin-appointment-stats'] });
      queryClient.invalidateQueries({ queryKey: ['admin-appointment-detail', appointment?.id] });
      onSuccess?.();
      onClose();
      setReason('');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || err.message || 'Không thể hủy lịch hẹn');
    },
  });

  if (!appointment) return null;

  const patientName = appointment.patientProfile?.fullName || appointment.user?.fullName || 'Bệnh nhân';
  const doctorName = appointment.slot?.doctorWorkplace?.doctor?.fullName;
  const slotStart = appointment.slot?.startTime ? new Date(appointment.slot.startTime) : null;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && !mutation.isPending && onClose()}>
      <DialogContent
        className={`max-w-md p-6 rounded-2xl ${
          isLight ? 'bg-white text-slate-900 border-slate-200' : 'bg-slate-950 text-white border-slate-800'
        }`}
      >
        <DialogHeader className="pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
              <XCircle className="w-4 h-4" />
            </div>
            <div>
              <DialogTitle className="text-sm font-bold text-slate-900 dark:text-white">
                Xác nhận hủy lịch hẹn khám
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Mã lịch: <strong className="font-mono text-emerald-600 dark:text-emerald-400">#{appointment.bookingCode}</strong> — {patientName}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-3.5 py-2 text-xs">
          {/* Appointment brief */}
          <div
            className={`p-3 rounded-xl border text-xs space-y-1 ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900 border-slate-800'
            }`}
          >
            {doctorName && (
              <div className="text-slate-700 dark:text-slate-300">
                Bác sĩ phụ trách: <strong className="text-slate-900 dark:text-white">BS. {doctorName}</strong>
              </div>
            )}
            {slotStart && (
              <div className="text-slate-600 dark:text-slate-400">
                Thời gian hẹn:{' '}
                <strong className="font-mono text-slate-800 dark:text-slate-200">
                  {slotStart.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} — {slotStart.toLocaleDateString('vi-VN')}
                </strong>
              </div>
            )}
          </div>

          <div className="p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/60 rounded-xl space-y-1 text-rose-800 dark:text-rose-300">
            <div className="font-bold flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
              Lưu ý khi hủy lịch
            </div>
            <p className="text-[11px] leading-relaxed text-rose-700 dark:text-rose-300">
              Hệ thống sẽ chuyển lịch hẹn sang trạng thái <strong>Đã hủy</strong>, tự động giải phóng suất khám của bác sĩ, lưu lịch sử trạng thái và gửi thông báo tới người bệnh.
            </p>
          </div>

          {/* Quick reasons */}
          <div className="space-y-1.5">
            <Label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              Chọn nhanh lý do phổ biến
            </Label>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_REASONS.map((qr) => (
                <button
                  key={qr}
                  type="button"
                  onClick={() => setReason(qr)}
                  className={`text-[11px] px-2.5 py-1 rounded-lg border transition text-left ${
                    reason === qr
                      ? 'bg-rose-50 border-rose-300 text-rose-700 dark:bg-rose-950/50 dark:border-rose-700 dark:text-rose-300 font-semibold'
                      : isLight
                        ? 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        : 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  {qr}
                </button>
              ))}
            </div>
          </div>

          {/* Reason textarea */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-900 dark:text-white">
              Lý do hủy lịch hẹn <span className="text-rose-500">*</span>
            </Label>
            <Textarea
              rows={3}
              placeholder="Nhập lý do hủy lịch hẹn để thông báo tới bệnh nhân và lưu vết kiểm soát..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="text-xs rounded-lg"
            />
          </div>
        </div>

        <DialogFooter className="pt-3 border-t border-slate-200 dark:border-slate-800 gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={mutation.isPending}
            className="rounded-lg text-xs"
          >
            Đóng
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending || !reason.trim()}
            className="rounded-lg text-xs bg-rose-600 hover:bg-rose-700 text-white font-semibold gap-1.5"
          >
            {mutation.isPending ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Đang hủy lịch...
              </>
            ) : (
              'Xác nhận hủy lịch'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
