'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService } from '@/services/admin.service';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Phone, MessageSquare, Loader2, UserCheck, AlertTriangle } from 'lucide-react';
import { useAdminTheme } from '@/components/admin/AdminThemeContext';

interface RecordContactModalProps {
  appointment: any | null;
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function RecordContactModal({ appointment, open, onClose, onSuccess }: RecordContactModalProps) {
  const queryClient = useQueryClient();
  const { theme } = useAdminTheme();
  const isLight = theme === 'light';

  const [channel, setChannel] = useState<'PHONE' | 'SMS' | 'ZALO' | 'DIRECT' | 'OTHER'>('PHONE');
  const [outcome, setOutcome] = useState<'NO_ANSWER' | 'BUSY' | 'UNREACHABLE' | 'ANSWERED' | 'WRONG_NUMBER' | 'RESCHEDULE_REQUESTED' | 'OTHER'>('NO_ANSWER');
  const [staffName, setStaffName] = useState('');
  const [note, setNote] = useState('');

  const mutation = useMutation({
    mutationFn: () => {
      if (!appointment) throw new Error('Không có lịch hẹn');
      return adminService.recordContactLog(appointment.id, {
        channel,
        outcome,
        staffName: staffName.trim() || undefined,
        note: note.trim() || undefined,
      });
    },
    onSuccess: () => {
      toast.success('Đã lưu nhật ký liên hệ bệnh nhân thành công');
      queryClient.invalidateQueries({ queryKey: ['admin-appointments'] });
      queryClient.invalidateQueries({ queryKey: ['admin-appointment-detail', appointment?.id] });
      onSuccess?.();
      onClose();
      setNote('');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || err.message || 'Không thể lưu nhật ký liên hệ');
    },
  });

  if (!appointment) return null;

  const patientName = appointment.patientProfile?.fullName || appointment.user?.fullName || 'Bệnh nhân';
  const patientPhone = appointment.patientProfile?.phoneNumber || appointment.user?.phoneNumber || 'Chưa có SĐT';

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className={`max-w-md p-6 rounded-2xl ${isLight ? 'bg-white text-slate-900 border-slate-200' : 'bg-slate-950 text-white border-slate-800'}`}>
        <DialogHeader className="pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Phone className="w-4 h-4" />
            </div>
            <div>
              <DialogTitle className="text-sm font-bold text-slate-900 dark:text-white">
                Ghi nhận liên hệ người bệnh
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Mã lịch: <strong className="font-mono text-emerald-600 dark:text-emerald-400">#{appointment.bookingCode}</strong>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Patient quick info */}
        <div className={`p-3 rounded-xl border text-xs flex justify-between items-center ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900 border-slate-800'}`}>
          <div>
            <div className="font-bold text-slate-900 dark:text-white">{patientName}</div>
            <div className="text-slate-500 font-mono mt-0.5">{patientPhone}</div>
          </div>
          <div className="text-right text-[11px] text-slate-500">
            <div>Số lượt đã gọi: <strong className="text-blue-600 dark:text-blue-400 font-bold">{appointment.contactLogs?.length || 0}</strong></div>
          </div>
        </div>

        <div className="space-y-4 py-2 text-xs">
          {/* Channel */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Hình thức / Kênh liên hệ</Label>
            <select
              value={channel}
              onChange={(e) => setChannel(e.target.value as any)}
              className={`w-full px-3 py-2 text-xs rounded-lg border focus:outline-none focus:ring-1 focus:ring-slate-400 ${
                isLight ? 'bg-white text-slate-900 border-slate-300' : 'bg-slate-900 text-white border-slate-700'
              }`}
            >
              <option value="PHONE">📞 Cuộc gọi thoại (Điện thoại)</option>
              <option value="SMS">💬 Tin nhắn SMS</option>
              <option value="ZALO">📱 Zalo OA / Zalo</option>
              <option value="DIRECT">🏢 Gọi loa / Tìm tại sảnh tiếp đón</option>
              <option value="OTHER">🌐 Kênh khác</option>
            </select>
          </div>

          {/* Outcome */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Kết quả liên hệ</Label>
            <select
              value={outcome}
              onChange={(e) => setOutcome(e.target.value as any)}
              className={`w-full px-3 py-2 text-xs rounded-lg border focus:outline-none focus:ring-1 focus:ring-slate-400 ${
                isLight ? 'bg-white text-slate-900 border-slate-300' : 'bg-slate-900 text-white border-slate-700'
              }`}
            >
              <option value="NO_ANSWER">❌ Chuông reo nhưng không bắt máy</option>
              <option value="BUSY">⚠️ Máy bận / Bị ngắt cuộc gọi</option>
              <option value="UNREACHABLE">📵 Thuê bao không liên lạc được / Tắt máy</option>
              <option value="ANSWERED">✅ Đã liên hệ được (bệnh nhân bắt máy)</option>
              <option value="WRONG_NUMBER">❓ Nhầm số điện thoại</option>
              <option value="RESCHEDULE_REQUESTED">🗓️ Bệnh nhân xin dời lịch hẹn</option>
              <option value="OTHER">🔘 Kết quả khác</option>
            </select>
          </div>

          {/* Staff name */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Nhân viên thực hiện (tùy chọn)</Label>
            <Input
              type="text"
              placeholder="VD: Điều dưỡng tiếp đón Nguyễn Văn A"
              value={staffName}
              onChange={(e) => setStaffName(e.target.value)}
              className="text-xs h-9 rounded-lg"
            />
          </div>

          {/* Note */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Ghi chú cuộc gọi</Label>
            <Textarea
              rows={3}
              placeholder="VD: Đã đổ chuông 3 hồi nhưng không nhấc máy; hoặc bệnh nhân báo kẹt xe đang đến..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
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
            Hủy
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
            className="rounded-lg text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold gap-1.5"
          >
            {mutation.isPending ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Đang lưu...
              </>
            ) : (
              'Lưu nhật ký liên hệ'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
