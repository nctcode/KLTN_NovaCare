'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService } from '@/services/admin.service';
import { useAdminTheme } from '@/components/admin/AdminThemeContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Calendar,
  Clock,
  User,
  Building2,
  Stethoscope,
  Activity,
  CreditCard,
  History,
  CheckCircle2,
  XCircle,
  Loader2,
  MapPin,
} from 'lucide-react';
import { toast } from 'sonner';

const STATUS_BADGE: Record<string, { label: string; styleDark: string; styleLight: string }> = {
  PENDING: { label: 'Chờ xác nhận', styleDark: 'bg-amber-950 text-amber-400 border-amber-800', styleLight: 'bg-amber-100 text-amber-800 border-amber-300' },
  AWAITING_PAYMENT: { label: 'Chờ thanh toán', styleDark: 'bg-orange-950 text-orange-400 border-orange-800', styleLight: 'bg-orange-100 text-orange-800 border-orange-300' },
  CONFIRMED: { label: 'Đã xác nhận', styleDark: 'bg-blue-950 text-blue-400 border-blue-800', styleLight: 'bg-blue-100 text-blue-800 border-blue-300' },
  PAID: { label: 'Đã thanh toán', styleDark: 'bg-purple-950 text-purple-400 border-purple-800', styleLight: 'bg-purple-100 text-purple-800 border-purple-300' },
  COMPLETED: { label: 'Hoàn tất khám', styleDark: 'bg-emerald-950 text-[#66FF33] border-emerald-800', styleLight: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
  CANCELLED: { label: 'Đã hủy', styleDark: 'bg-rose-950 text-rose-400 border-rose-800', styleLight: 'bg-rose-100 text-rose-800 border-rose-300' },
  EXPIRED: { label: 'Quá hạn', styleDark: 'bg-slate-900 text-slate-400 border-slate-800', styleLight: 'bg-slate-100 text-slate-700 border-slate-300' },
  NO_SHOW: { label: 'Vắng mặt', styleDark: 'bg-rose-950 text-rose-400 border-rose-800', styleLight: 'bg-rose-100 text-rose-800 border-rose-300' },
  FAILED: { label: 'Thất bại', styleDark: 'bg-rose-950 text-rose-400 border-rose-800', styleLight: 'bg-rose-100 text-rose-800 border-rose-300' },
  REFUNDED: { label: 'Đã hoàn tiền', styleDark: 'bg-amber-950 text-amber-300 border-amber-800', styleLight: 'bg-amber-100 text-amber-800 border-amber-300' },
};

interface AppointmentDetailDrawerProps {
  appointmentId: string | null;
  open: boolean;
  onClose: () => void;
}

export function AppointmentDetailDrawer({ appointmentId, open, onClose }: AppointmentDetailDrawerProps) {
  const queryClient = useQueryClient();
  const { theme } = useAdminTheme();
  const isLight = theme === 'light';

  const { data: appt, isLoading } = useQuery({
    queryKey: ['admin-appointment-detail', appointmentId],
    queryFn: () => adminService.getAppointmentDetail(appointmentId!),
    enabled: !!appointmentId && open,
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      adminService.updateAppointmentStatus(id, status),
    onSuccess: () => {
      toast.success('Cập nhật trạng thái lịch khám thành công');
      queryClient.invalidateQueries({ queryKey: ['admin-appointments'] });
      queryClient.invalidateQueries({ queryKey: ['admin-appointment-detail', appointmentId] });
      queryClient.invalidateQueries({ queryKey: ['admin-appointment-stats'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Không thể cập nhật trạng thái');
    },
  });

  const cancelMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      adminService.cancelAppointment(id, reason),
    onSuccess: () => {
      toast.success('Hủy lịch khám thành công');
      queryClient.invalidateQueries({ queryKey: ['admin-appointments'] });
      queryClient.invalidateQueries({ queryKey: ['admin-appointment-detail', appointmentId] });
      queryClient.invalidateQueries({ queryKey: ['admin-appointment-stats'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Không thể hủy lịch khám');
    },
  });

  const handleCancel = () => {
    if (!appointmentId) return;
    const reason = prompt('Nhập lý do hủy lịch khám:');
    if (reason !== null) {
      cancelMutation.mutate({ id: appointmentId, reason: reason || 'Admin hủy lịch' });
    }
  };

  const st = appt ? STATUS_BADGE[appt.status] || { label: appt.status, styleDark: 'bg-slate-800 text-white', styleLight: 'bg-slate-100 text-slate-800' } : null;

  const slot = appt?.slot;
  const docWp = slot?.doctorWorkplace;
  const doctor = docWp?.doctor;
  const hospital = docWp?.hospital;
  const branch = docWp?.branch;
  const specialty = docWp?.specialty;
  const patient = appt?.patientProfile;
  const user = appt?.user;
  const payment = appt?.payment;
  const service = appt?.medicalService;

  const slotStartTime = slot?.startTime ? new Date(slot.startTime) : null;
  const slotEndTime = slot?.endTime ? new Date(slot.endTime) : null;

  const capacity = slot?.capacity ?? 1;
  const bookedCount = slot?.bookedCount ?? 0;
  const availableCount = Math.max(0, capacity - bookedCount);

  return (
    <Dialog open={open} onOpenChange={(v: boolean) => !v && onClose()}>
      <DialogContent
        className={`max-w-2xl max-h-[90vh] overflow-y-auto p-6 rounded-2xl ${
          isLight ? 'bg-white text-slate-900 border-slate-200' : 'bg-slate-950 text-white border-slate-800'
        }`}
      >
        <DialogHeader className="pb-3 border-b border-slate-200 dark:border-slate-800">
          <DialogTitle className="text-lg font-black flex items-center gap-2">
            <Calendar className="w-5 h-5 text-emerald-600 dark:text-[#66FF33]" />
            Chi tiết lịch khám #{appt?.bookingCode || ''}
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="p-12 flex justify-center">
            <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
          </div>
        ) : !appt ? (
          <div className="p-6 text-center text-slate-500 font-medium">Không tìm thấy thông tin lịch khám</div>
        ) : (
          <div className="space-y-5 pt-2 text-xs">
            {/* Header Info Banner */}
            <div
              className={`p-4 rounded-2xl border flex items-center justify-between ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900 border-slate-800'
              }`}
            >
              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Mã đặt lịch</div>
                <div className="text-base font-mono font-black text-emerald-600 dark:text-[#66FF33]">
                  #{appt.bookingCode}
                </div>
              </div>

              <span
                className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider border ${
                  isLight ? st?.styleLight : st?.styleDark
                }`}
              >
                {st?.label}
              </span>
            </div>

            {/* Thông tin Bệnh nhân */}
            <div className="space-y-2">
              <h3 className="font-bold text-xs uppercase tracking-wider flex items-center gap-2 text-slate-800 dark:text-slate-200">
                <User className="w-4 h-4 text-emerald-500" />
                Thông tin bệnh nhân
              </h3>

              <div
                className={`p-4 rounded-2xl border space-y-2 ${
                  isLight ? 'bg-white border-slate-200' : 'bg-slate-900/60 border-slate-800'
                }`}
              >
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-slate-400 font-semibold">Tên bệnh nhân:</span>
                    <p className="font-extrabold text-sm text-slate-900 dark:text-white">
                      {patient?.fullName || user?.fullName || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold">Số điện thoại:</span>
                    <p className="font-bold font-mono text-slate-800 dark:text-slate-200">
                      {patient?.phone || user?.phone || 'N/A'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                  <div>
                    <span className="text-slate-400 font-semibold">Giới tính:</span>
                    <p className="font-semibold text-slate-700 dark:text-slate-300">
                      {patient?.gender === 'MALE' ? 'Nam' : patient?.gender === 'FEMALE' ? 'Nữ' : 'Khác'}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold">Ngày sinh:</span>
                    <p className="font-semibold text-slate-700 dark:text-slate-300">
                      {patient?.dateOfBirth ? new Date(patient.dateOfBirth).toLocaleDateString('vi-VN') : 'N/A'}
                    </p>
                  </div>
                </div>

                {patient?.healthInsurance && (
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                    <span className="text-slate-400 font-semibold">Mã BHYT:</span>
                    <p className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      {patient.healthInsurance}
                    </p>
                  </div>
                )}

                {/* Lý do & Triệu chứng */}
                {(appt.reason || appt.symptoms) && (
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-1">
                    {appt.reason && (
                      <div>
                        <span className="text-slate-400 font-semibold">Lý do khám:</span>
                        <p className="font-medium text-slate-700 dark:text-slate-300 bg-amber-500/5 p-2 rounded-xl border border-amber-500/20 mt-0.5">
                          {appt.reason}
                        </p>
                      </div>
                    )}
                    {appt.symptoms && (
                      <div>
                        <span className="text-slate-400 font-semibold">Triệu chứng mô tả:</span>
                        <p className="font-medium text-slate-700 dark:text-slate-300 bg-blue-500/5 p-2 rounded-xl border border-blue-500/20 mt-0.5">
                          {appt.symptoms}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Thông tin Khám */}
            <div className="space-y-2">
              <h3 className="font-bold text-xs uppercase tracking-wider flex items-center gap-2 text-slate-800 dark:text-slate-200">
                <Stethoscope className="w-4 h-4 text-purple-500" />
                Thông tin chuyên môn & Địa điểm
              </h3>

              <div
                className={`p-4 rounded-2xl border space-y-3 ${
                  isLight ? 'bg-white border-slate-200' : 'bg-slate-900/60 border-slate-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center font-bold text-emerald-600 shrink-0">
                    BS
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase">Bác sĩ phụ trách</div>
                    <div className="font-extrabold text-sm text-slate-900 dark:text-white">
                      {doctor?.title ? `${doctor.title} ` : ''}{doctor?.fullName || 'Chưa phân công'}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <div>
                      <span className="text-slate-400 font-semibold">Bệnh viện:</span>
                      <p className="font-bold text-slate-800 dark:text-slate-200">{hospital?.name || 'N/A'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-blue-500 shrink-0" />
                    <div>
                      <span className="text-slate-400 font-semibold">Cơ sở:</span>
                      <p className="font-bold text-slate-800 dark:text-slate-200">{branch?.name || branch?.address || 'Cơ sở chính'}</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <Stethoscope className="w-4 h-4 text-purple-500 shrink-0" />
                    <div>
                      <span className="text-slate-400 font-semibold">Chuyên khoa:</span>
                      <p className="font-bold text-slate-800 dark:text-slate-200">{specialty?.name || 'N/A'}</p>
                    </div>
                  </div>

                  {service && (
                    <div className="flex items-center gap-2">
                      <Activity className="w-4 h-4 text-amber-500 shrink-0" />
                      <div>
                        <span className="text-slate-400 font-semibold">Dịch vụ y tế:</span>
                        <p className="font-bold text-slate-800 dark:text-slate-200">{service.name}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Thông tin AppointmentSlot */}
            <div className="space-y-2">
              <h3 className="font-bold text-xs uppercase tracking-wider flex items-center gap-2 text-slate-800 dark:text-slate-200">
                <Clock className="w-4 h-4 text-amber-500" />
                Khung giờ khám (Appointment Slot)
              </h3>

              <div
                className={`p-4 rounded-2xl border space-y-2 ${
                  isLight ? 'bg-white border-slate-200' : 'bg-slate-900/60 border-slate-800'
                }`}
              >
                {slotStartTime && slotEndTime ? (
                  <>
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-slate-400 font-semibold">Ngày khám:</span>
                        <p className="font-black text-sm text-emerald-600 dark:text-[#66FF33]">
                          {slotStartTime.toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: '2-digit', day: '2-digit' })}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-slate-400 font-semibold">Giờ khám:</span>
                        <p className="font-mono font-bold text-sm text-slate-900 dark:text-white">
                          {slotStartTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} - {slotEndTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200 dark:border-slate-800 text-center">
                      <div className="p-2 rounded-xl bg-slate-500/10">
                        <div className="text-[10px] text-slate-400 font-bold uppercase">Sức chứa</div>
                        <div className="font-extrabold text-xs text-slate-800 dark:text-slate-200">{capacity}</div>
                      </div>
                      <div className="p-2 rounded-xl bg-blue-500/10">
                        <div className="text-[10px] text-blue-500 font-bold uppercase">Đã đặt</div>
                        <div className="font-extrabold text-xs text-blue-600 dark:text-blue-400">{bookedCount}</div>
                      </div>
                      <div className="p-2 rounded-xl bg-emerald-500/10">
                        <div className="text-[10px] text-emerald-500 font-bold uppercase">Còn trống</div>
                        <div className="font-extrabold text-xs text-emerald-600 dark:text-emerald-400">{availableCount}</div>
                      </div>
                    </div>
                  </>
                ) : (
                  <p className="text-slate-500 italic">Chưa liên kết khung giờ khám</p>
                )}
              </div>
            </div>

            {/* Thông tin Tài chính */}
            <div className="space-y-2">
              <h3 className="font-bold text-xs uppercase tracking-wider flex items-center gap-2 text-slate-800 dark:text-slate-200">
                <CreditCard className="w-4 h-4 text-emerald-500" />
                Thông tin tài chính
              </h3>

              <div
                className={`p-4 rounded-2xl border space-y-2 ${
                  isLight ? 'bg-white border-slate-200' : 'bg-slate-900/60 border-slate-800'
                }`}
              >
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500">Phí khám bác sĩ:</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                    {Number(appt.consultationFee || 0).toLocaleString()}đ
                  </span>
                </div>

                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500">Phí dịch vụ y tế:</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                    {Number(appt.serviceFee || 0).toLocaleString()}đ
                  </span>
                </div>

                <div className="flex justify-between items-center text-sm pt-2 border-t border-slate-200 dark:border-slate-800 font-black">
                  <span className="text-slate-900 dark:text-white">Tổng tiền:</span>
                  <span className="font-mono text-emerald-600 dark:text-[#66FF33] text-base">
                    {Number(appt.totalPrice || appt.consultationFee || 0).toLocaleString()}đ
                  </span>
                </div>

                {payment && (
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-800 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-slate-400 font-semibold">Phương thức:</span>
                      <p className="font-bold text-slate-800 dark:text-slate-200">{payment.paymentMethod}</p>
                    </div>
                    <div>
                      <span className="text-slate-400 font-semibold">Trạng thái thanh toán:</span>
                      <p className="font-bold text-emerald-600">{payment.status}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Lịch sử trạng thái (Timeline) */}
            <div className="space-y-2">
              <h3 className="font-bold text-xs uppercase tracking-wider flex items-center gap-2 text-slate-800 dark:text-slate-200">
                <History className="w-4 h-4 text-blue-500" />
                Lịch sử trạng thái cuộc hẹn
              </h3>

              <div
                className={`p-4 rounded-2xl border ${
                  isLight ? 'bg-white border-slate-200' : 'bg-slate-900/60 border-slate-800'
                }`}
              >
                {!appt.statusHistory || appt.statusHistory.length === 0 ? (
                  <p className="text-slate-500 italic text-center py-2">Chưa ghi nhận lịch sử trạng thái</p>
                ) : (
                  <div className="relative pl-4 space-y-4 border-l-2 border-slate-200 dark:border-slate-800 my-1">
                    {appt.statusHistory.map((h: any, idx: number) => {
                      const histBadge = STATUS_BADGE[h.status] || { label: h.status, styleDark: 'bg-slate-800 text-white', styleLight: 'bg-slate-100 text-slate-800' };
                      return (
                        <div key={h.id || idx} className="relative">
                          <div className="absolute -left-[21px] top-1 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-950" />
                          <div className="flex items-center justify-between gap-2">
                            <span
                              className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider border ${
                                isLight ? histBadge.styleLight : histBadge.styleDark
                              }`}
                            >
                              {histBadge.label}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {new Date(h.createdAt).toLocaleString('vi-VN')}
                            </span>
                          </div>
                          {h.note && (
                            <p className="text-slate-600 dark:text-slate-400 text-xs mt-1 font-medium">
                              {h.note}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-wrap gap-2 justify-end">
              {appt.status !== 'COMPLETED' && appt.status !== 'CANCELLED' && (
                <Button
                  disabled={updateStatusMutation.isPending}
                  onClick={() => updateStatusMutation.mutate({ id: appt.id, status: 'COMPLETED' })}
                  className="rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <CheckCircle2 className="w-4 h-4 mr-1.5" /> Duyệt hoàn tất khám
                </Button>
              )}

              {appt.status !== 'CANCELLED' && (
                <Button
                  variant="outline"
                  disabled={cancelMutation.isPending}
                  onClick={handleCancel}
                  className={`rounded-xl font-bold text-xs ${
                    isLight ? 'border-rose-300 text-rose-700 hover:bg-rose-50' : 'border-rose-900 text-rose-400 hover:bg-rose-950'
                  }`}
                >
                  <XCircle className="w-4 h-4 mr-1.5" /> Hủy lịch khám
                </Button>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
