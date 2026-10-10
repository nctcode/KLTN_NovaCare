'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService } from '@/services/admin.service';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { RotateCcw, AlertTriangle, Loader2 } from 'lucide-react';
import { useAdminTheme } from '@/components/admin/AdminThemeContext';

interface RevertNoShowModalProps {
  appointment: any | null;
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function RevertNoShowModal({ appointment, open, onClose, onSuccess }: RevertNoShowModalProps) {
  const queryClient = useQueryClient();
  const { theme } = useAdminTheme();
  const isLight = theme === 'light';

  const [reason, setReason] = useState('');

  const mutation = useMutation({
    mutationFn: () => {
      if (!appointment) throw new Error('Không có lịch hẹn');
      if (reason.trim().length < 5) throw new Error('Vui lòng nhập lý do giải trình rõ ràng (tối thiểu 5 ký tự)');
      return adminService.revertNoShowAppointment(appointment.id, { reason: reason.trim() });
    },
    onSuccess: () => {
      toast.success('Đã khôi phục trạng thái lịch hẹn thành công');
      queryClient.invalidateQueries({ queryKey: ['admin-appointments'] });
      queryClient.invalidateQueries({ queryKey: ['admin-appointment-stats'] });
      queryClient.invalidateQueries({ queryKey: ['admin-appointment-detail', appointment?.id] });
      onSuccess?.();
      onClose();
      setReason('');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || err.message || 'Không thể khôi phục lịch hẹn');
    },
  });

  if (!appointment) return null;

  const patientName = appointment.patientProfile?.fullName || appointment.user?.fullName || 'Bệnh nhân';

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className={`max-w-md p-6 rounded-2xl ${isLight ? 'bg-white text-slate-900 border-slate-200' : 'bg-slate-950 text-white border-slate-800'}`}>
        <DialogHeader className="pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <RotateCcw className="w-4 h-4" />
            </div>
            <div>
              <DialogTitle className="text-sm font-bold text-slate-900 dark:text-white">
                Khôi phục lịch khám (Bệnh nhân đến muộn / ghi nhận nhầm)
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Mã lịch: <strong className="font-mono text-emerald-600 dark:text-emerald-400">#{appointment.bookingCode}</strong> — {patientName}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-3.5 py-2 text-xs">
          <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-xl space-y-1 text-amber-800 dark:text-amber-300">
            <div className="font-bold flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
              Lưu ý trách nhiệm nghiệp vụ
            </div>
            <p className="text-[11px] leading-relaxed text-amber-700 dark:text-amber-300">
              Lịch khám sẽ được khôi phục về trạng thái hợp lệ trước đó (Đã thanh toán hoặc Đã xác nhận). Suất khám sẽ được kiểm tra và ghi nhận lại. Toàn bộ lý do và người thực hiện sẽ được lưu vĩnh viễn trong Audit Log để đối soát.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-900 dark:text-white">
              Lý do khôi phục / giải trình <span className="text-rose-500">*</span>
            </Label>
            <Textarea
              rows={3}
              placeholder="VD: Bệnh nhân đến muộn 20 phút do mưa bão, bác sĩ phụ trách đồng ý khám bổ sung vào cuối ca; hoặc nhân viên gọi nhầm số..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="text-xs rounded-lg"
            />
            <p className="text-[10px] text-slate-400">Tối thiểu 5 ký tự. Bắt buộc để phục vụ thanh tra chất lượng dịch vụ.</p>
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
            Hủy
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending || reason.trim().length < 5}
            className="rounded-lg text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold gap-1.5"
          >
            {mutation.isPending ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Đang khôi phục...
              </>
            ) : (
              'Xác nhận khôi phục lịch'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
