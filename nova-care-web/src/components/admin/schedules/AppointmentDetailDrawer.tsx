'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService } from '@/services/admin.service';
import { useAdminTheme } from '@/components/admin/AdminThemeContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, Phone, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { RecordContactModal } from './RecordContactModal';
import { NoShowConfirmModal } from './NoShowConfirmModal';
import { RevertNoShowModal } from './RevertNoShowModal';

const STATUS_BADGE: Record<string, { label: string; styleDark: string; styleLight: string }> = {
  PENDING: { label: 'Chờ xác nhận', styleDark: 'bg-amber-950/40 text-amber-400 border-amber-800', styleLight: 'bg-amber-50 text-amber-700 border-amber-200' },
  AWAITING_PAYMENT: { label: 'Chờ thanh toán', styleDark: 'bg-orange-950/40 text-orange-400 border-orange-800', styleLight: 'bg-orange-50 text-orange-700 border-orange-200' },
  CONFIRMED: { label: 'Đã xác nhận', styleDark: 'bg-blue-950/40 text-blue-400 border-blue-800', styleLight: 'bg-blue-50 text-blue-700 border-blue-200' },
  PAID: { label: 'Đã thanh toán', styleDark: 'bg-purple-950/40 text-purple-400 border-purple-800', styleLight: 'bg-purple-50 text-purple-700 border-purple-200' },
  COMPLETED: { label: 'Hoàn tất khám', styleDark: 'bg-emerald-950/40 text-emerald-400 border-emerald-800', styleLight: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  CANCELLED: { label: 'Đã hủy', styleDark: 'bg-rose-950/40 text-rose-400 border-rose-800', styleLight: 'bg-rose-50 text-rose-700 border-rose-200' },
  EXPIRED: { label: 'Quá hạn', styleDark: 'bg-slate-800 text-slate-400 border-slate-700', styleLight: 'bg-slate-100 text-slate-600 border-slate-200' },
  NO_SHOW: { label: 'Vắng mặt', styleDark: 'bg-rose-950/40 text-rose-400 border-rose-800', styleLight: 'bg-rose-50 text-rose-700 border-rose-200' },
  FAILED: { label: 'Thất bại', styleDark: 'bg-rose-950/40 text-rose-400 border-rose-800', styleLight: 'bg-rose-50 text-rose-700 border-rose-200' },
  REFUNDED: { label: 'Đã hoàn tiền', styleDark: 'bg-amber-950/40 text-amber-400 border-amber-800', styleLight: 'bg-amber-50 text-amber-700 border-amber-200' },
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

  const [showContactModal, setShowContactModal] = useState(false);
  const [showNoShowModal, setShowNoShowModal] = useState(false);
  const [showRevertModal, setShowRevertModal] = useState(false);

  const { data: appt, isLoading } = useQuery({
    queryKey: ['admin-appointment-detail', appointmentId],
    queryFn: () => adminService.getAppointmentDetail(appointmentId!),
    enabled: !!appointmentId && open,
  });

  const checkInMutation = useMutation({
    mutationFn: () => adminService.checkInAppointment(appointmentId!, { note: 'Tiếp đón tại quầy' }),
    onSuccess: () => {
      toast.success('Xác nhận tiếp đón và check-in thành công');
      queryClient.invalidateQueries({ queryKey: ['admin-appointments'] });
      queryClient.invalidateQueries({ queryKey: ['admin-appointment-detail', appointmentId] });
      queryClient.invalidateQueries({ queryKey: ['admin-appointment-stats'] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || err.message || 'Không thể check-in');
    },
  });

  const st = appt ? STATUS_BADGE[appt.status] || { label: appt.status, styleDark: 'bg-slate-800 text-slate-300 border-slate-700', styleLight: 'bg-slate-100 text-slate-700 border-slate-200' } : null;

  const slot = appt?.slot;
  const docWp = slot?.doctorWorkplace;
  const doctor = docWp?.doctor;
  const hospital = docWp?.hospital;
  const specialty = docWp?.specialty;
  const patient = appt?.patientProfile;
  const user = appt?.user;
  const payment = appt?.payment;
  const service = appt?.medicalService;

  const slotStartTime = slot?.startTime ? new Date(slot.startTime) : null;
  const slotEndTime = slot?.endTime ? new Date(slot.endTime) : null;

  const labelCellClass = `w-[140px] sm:w-[170px] px-3 py-2 text-slate-500 font-medium border-r ${
    isLight ? 'bg-slate-50/80 border-slate-200' : 'bg-slate-900/60 border-slate-800'
  }`;
  const valueCellClass = 'px-3 py-2 text-slate-900 dark:text-slate-100 font-normal';
  const tableContainerClass = `rounded-lg border overflow-hidden ${
    isLight ? 'border-slate-200 bg-white' : 'border-slate-800 bg-slate-950'
  }`;
  const sectionHeaderClass = `px-3 py-1.5 font-bold text-xs border-b ${
    isLight ? 'bg-slate-100 text-slate-800 border-slate-200' : 'bg-slate-900 text-slate-200 border-slate-800'
  }`;

  return (
    <Dialog open={open} onOpenChange={(v: boolean) => !v && onClose()}>
      <DialogContent
        className={`max-w-xl p-5 sm:p-6 rounded-xl text-xs max-h-[88vh] overflow-y-auto ${
          isLight ? 'bg-white text-slate-900 border-slate-200' : 'bg-slate-950 text-white border-slate-800'
        }`}
      >
        <DialogHeader className="pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-base font-bold text-slate-900 dark:text-white">
              Bảng chi tiết lịch hẹn #{appt?.bookingCode || ''}
            </DialogTitle>
            {st && (
              <span className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${isLight ? st.styleLight : st.styleDark}`}>
                {st.label}
              </span>
            )}
          </div>
        </DialogHeader>

        {isLoading ? (
          <div className="py-12 flex justify-center">
            <Loader2 className="w-6 h-6 text-emerald-600 animate-spin" />
          </div>
        ) : !appt ? (
          <div className="py-8 text-center text-slate-500">Không tìm thấy thông tin lịch khám</div>
        ) : (
          <div className="space-y-3.5 py-2">
            {/* 1. Thông tin Lịch hẹn */}
            <div className={tableContainerClass}>
              <div className={sectionHeaderClass}>1. Thông tin lịch hẹn</div>
              <table className="w-full text-xs border-collapse">
                <tbody className={`divide-y ${isLight ? 'divide-slate-200' : 'divide-slate-800'}`}>
                  <tr>
                    <td className={labelCellClass}>Mã đặt lịch</td>
                    <td className={`${valueCellClass} font-mono font-bold text-emerald-600 dark:text-emerald-400`}>
                      #{appt.bookingCode}
                    </td>
                  </tr>
                  <tr>
                    <td className={labelCellClass}>Ngày khám</td>
                    <td className={`${valueCellClass} font-semibold`}>
                      {slotStartTime
                        ? slotStartTime.toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: '2-digit', day: '2-digit' })
                        : 'Chưa xếp'}
                    </td>
                  </tr>
                  <tr>
                    <td className={labelCellClass}>Giờ khám</td>
                    <td className={`${valueCellClass} font-mono`}>
                      {slotStartTime && slotEndTime
                        ? `${slotStartTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} - ${slotEndTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`
                        : 'Chưa xếp'}
                    </td>
                  </tr>
                  <tr>
                    <td className={labelCellClass}>Trạng thái hiện tại</td>
                    <td className={valueCellClass}>
                      {st?.label || appt.status}
                    </td>
                  </tr>
                  <tr>
                    <td className={labelCellClass}>Tiếp đón / Check-in</td>
                    <td className={valueCellClass}>
                      {appt.checkInAt ? (
                        <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                          ✓ Đã check-in lúc {new Date(appt.checkInAt).toLocaleTimeString('vi-VN')} ({new Date(appt.checkInAt).toLocaleDateString('vi-VN')})
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">Chưa check-in tại quầy</span>
                      )}
                    </td>
                  </tr>
                  {appt.noShowAt && (
                    <tr>
                      <td className={labelCellClass}>Ghi nhận vắng mặt</td>
                      <td className={`${valueCellClass} text-rose-600 dark:text-rose-400 font-semibold`}>
                        Xác nhận NO_SHOW lúc {new Date(appt.noShowAt).toLocaleTimeString('vi-VN')} ({new Date(appt.noShowAt).toLocaleDateString('vi-VN')})
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* 2. Thông tin Bệnh nhân */}
            <div className={tableContainerClass}>
              <div className={sectionHeaderClass}>2. Thông tin bệnh nhân</div>
              <table className="w-full text-xs border-collapse">
                <tbody className={`divide-y ${isLight ? 'divide-slate-200' : 'divide-slate-800'}`}>
                  <tr>
                    <td className={labelCellClass}>Họ và tên</td>
                    <td className={`${valueCellClass} font-bold text-slate-900 dark:text-white`}>
                      {patient?.fullName || user?.fullName || 'N/A'}
                    </td>
                  </tr>
                  <tr>
                    <td className={labelCellClass}>Số điện thoại</td>
                    <td className={`${valueCellClass} font-mono`}>
                      {patient?.phone || user?.phone || 'N/A'}
                    </td>
                  </tr>
                  <tr>
                    <td className={labelCellClass}>Giới tính</td>
                    <td className={valueCellClass}>
                      {patient?.gender === 'MALE' ? 'Nam' : patient?.gender === 'FEMALE' ? 'Nữ' : 'Chưa cập nhật'}
                    </td>
                  </tr>
                  <tr>
                    <td className={labelCellClass}>Ngày sinh</td>
                    <td className={valueCellClass}>
                      {patient?.dateOfBirth ? new Date(patient.dateOfBirth).toLocaleDateString('vi-VN') : 'Chưa cập nhật'}
                    </td>
                  </tr>
                  {patient?.healthInsurance && (
                    <tr>
                      <td className={labelCellClass}>Mã BHYT</td>
                      <td className={`${valueCellClass} font-mono font-medium text-emerald-600`}>
                        {patient.healthInsurance}
                      </td>
                    </tr>
                  )}
                  {appt.reason && (
                    <tr>
                      <td className={labelCellClass}>Lý do khám</td>
                      <td className={valueCellClass}>{appt.reason}</td>
                    </tr>
                  )}
                  {appt.symptoms && (
                    <tr>
                      <td className={labelCellClass}>Triệu chứng</td>
                      <td className={valueCellClass}>{appt.symptoms}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* 3. Bác sĩ & Cơ sở khám */}
            <div className={tableContainerClass}>
              <div className={sectionHeaderClass}>3. Bác sĩ & Cơ sở y tế</div>
              <table className="w-full text-xs border-collapse">
                <tbody className={`divide-y ${isLight ? 'divide-slate-200' : 'divide-slate-800'}`}>
                  <tr>
                    <td className={labelCellClass}>Bác sĩ khám</td>
                    <td className={`${valueCellClass} font-semibold`}>
                      {doctor?.fullName ? `BS. ${doctor.fullName}` : 'Chưa phân công'}
                    </td>
                  </tr>
                  <tr>
                    <td className={labelCellClass}>Chuyên khoa</td>
                    <td className={valueCellClass}>{specialty?.name || '---'}</td>
                  </tr>
                  <tr>
                    <td className={labelCellClass}>Dịch vụ khám</td>
                    <td className={valueCellClass}>{service?.name || 'Khám chuyên khoa'}</td>
                  </tr>
                  <tr>
                    <td className={labelCellClass}>Bệnh viện</td>
                    <td className={`${valueCellClass} font-semibold`}>{hospital?.name || 'N/A'}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* 4. Chi phí & Thanh toán */}
            <div className={tableContainerClass}>
              <div className={sectionHeaderClass}>4. Chi phí & Thanh toán</div>
              <table className="w-full text-xs border-collapse">
                <tbody className={`divide-y ${isLight ? 'divide-slate-200' : 'divide-slate-800'}`}>
                  <tr>
                    <td className={labelCellClass}>Phí khám bác sĩ</td>
                    <td className={`${valueCellClass} font-mono`}>
                      {Number(appt.consultationFee || 0).toLocaleString('vi-VN')}đ
                    </td>
                  </tr>
                  {appt.serviceFee ? (
                    <tr>
                      <td className={labelCellClass}>Phí dịch vụ</td>
                      <td className={`${valueCellClass} font-mono`}>
                        {Number(appt.serviceFee || 0).toLocaleString('vi-VN')}đ
                      </td>
                    </tr>
                  ) : null}
                  <tr className={isLight ? 'bg-slate-50/50' : 'bg-slate-900/30'}>
                    <td className={`${labelCellClass} font-bold text-slate-800 dark:text-slate-200`}>
                      Tổng chi phí
                    </td>
                    <td className={`${valueCellClass} font-mono font-bold text-emerald-600 text-sm`}>
                      {Number(appt.totalPrice || appt.consultationFee || 0).toLocaleString('vi-VN')}đ
                    </td>
                  </tr>
                  {payment && (
                    <>
                      <tr>
                        <td className={labelCellClass}>Phương thức thanh toán</td>
                        <td className={valueCellClass}>{payment.paymentMethod}</td>
                      </tr>
                      <tr>
                        <td className={labelCellClass}>Trạng thái thanh toán</td>
                        <td className={`${valueCellClass} font-semibold text-emerald-600`}>
                          {payment.status}
                        </td>
                      </tr>
                    </>
                  )}
                </tbody>
              </table>
            </div>

            {/* 5. Lịch sử trạng thái */}
            {appt.statusHistory && appt.statusHistory.length > 0 && (
              <div className={tableContainerClass}>
                <div className={sectionHeaderClass}>5. Lịch sử cập nhật trạng thái</div>
                <table className="w-full text-xs border-collapse">
                  <thead className={isLight ? 'bg-slate-50 border-b border-slate-200' : 'bg-slate-900 border-b border-slate-800'}>
                    <tr>
                      <th className="px-3 py-1.5 text-left font-semibold text-slate-500 w-[140px]">Thời gian</th>
                      <th className="px-3 py-1.5 text-left font-semibold text-slate-500 w-[120px]">Trạng thái</th>
                      <th className="px-3 py-1.5 text-left font-semibold text-slate-500">Ghi chú</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${isLight ? 'divide-slate-200' : 'divide-slate-800'}`}>
                    {appt.statusHistory.map((h: any, idx: number) => (
                      <tr key={h.id || idx}>
                        <td className="px-3 py-1.5 font-mono text-slate-500 text-[11px]">
                          {new Date(h.createdAt).toLocaleString('vi-VN')}
                        </td>
                        <td className="px-3 py-1.5 font-medium">
                          {STATUS_BADGE[h.status]?.label || h.status}
                        </td>
                        <td className="px-3 py-1.5 text-slate-600 dark:text-slate-400">
                          {h.note || '---'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* 6. Nhật ký liên hệ bệnh nhân */}
            <div className={tableContainerClass}>
              <div className="flex items-center justify-between px-3 py-2 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
                <span className="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  6. Nhật ký liên hệ người bệnh ({appt.contactLogs?.length || 0} lượt)
                </span>
                {appt.contactLogs?.length > 0 && (
                  <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-800">
                    {appt.contactLogs.length} lần liên hệ
                  </span>
                )}
              </div>
              {appt.contactLogs && appt.contactLogs.length > 0 ? (
                <table className="w-full text-xs border-collapse">
                  <thead className={isLight ? 'bg-slate-50 border-b border-slate-200' : 'bg-slate-900 border-b border-slate-800'}>
                    <tr>
                      <th className="px-3 py-1.5 text-left font-semibold text-slate-500 w-[130px]">Thời gian</th>
                      <th className="px-3 py-1.5 text-left font-semibold text-slate-500 w-[90px]">Kênh</th>
                      <th className="px-3 py-1.5 text-left font-semibold text-slate-500 w-[140px]">Kết quả</th>
                      <th className="px-3 py-1.5 text-left font-semibold text-slate-500 w-[120px]">Nhân viên</th>
                      <th className="px-3 py-1.5 text-left font-semibold text-slate-500">Ghi chú</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${isLight ? 'divide-slate-200' : 'divide-slate-800'}`}>
                    {appt.contactLogs.map((log: any, idx: number) => {
                      const outcomeLabel: Record<string, string> = {
                        NO_ANSWER: 'Không bắt máy',
                        BUSY: 'Máy bận',
                        UNREACHABLE: 'Không liên lạc được',
                        ANSWERED: 'Đã liên hệ được',
                        WRONG_NUMBER: 'Nhầm số',
                        RESCHEDULE_REQUESTED: 'Yêu cầu dời lịch',
                        OTHER: 'Khác',
                      };
                      const channelLabel: Record<string, string> = {
                        PHONE: 'Điện thoại',
                        SMS: 'SMS',
                        ZALO: 'Zalo',
                        DIRECT: 'Trực tiếp',
                        OTHER: 'Khác',
                      };
                      return (
                        <tr key={log.id || idx}>
                          <td className="px-3 py-1.5 font-mono text-slate-500 text-[11px]">
                            {new Date(log.contactedAt || log.createdAt).toLocaleString('vi-VN')}
                          </td>
                          <td className="px-3 py-1.5 font-medium text-slate-700 dark:text-slate-300">
                            {channelLabel[log.channel] || log.channel}
                          </td>
                          <td className="px-3 py-1.5">
                            <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${
                              log.outcome === 'ANSWERED'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}>
                              {outcomeLabel[log.outcome] || log.outcome}
                            </span>
                          </td>
                          <td className="px-3 py-1.5 text-slate-600 dark:text-slate-400">
                            {log.staffName || 'Nhân viên'}
                          </td>
                          <td className="px-3 py-1.5 text-slate-600 dark:text-slate-400">
                            {log.note || '---'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <div className="p-4 text-center text-xs text-slate-400 italic">
                  Chưa ghi nhận lượt liên hệ nào cho lịch hẹn này.
                </div>
              )}
            </div>
          </div>
        )}

        <DialogFooter className="pt-3 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Check-in */}
            {appt && !appt.checkInAt && ['PENDING', 'CONFIRMED', 'PAID'].includes(appt.status) && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={checkInMutation.isPending}
                onClick={() => checkInMutation.mutate()}
                className="text-xs text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 font-semibold rounded-lg"
              >
                Check-in tiếp đón
              </Button>
            )}

            {/* Record contact */}
            {appt && ['PENDING', 'CONFIRMED', 'PAID'].includes(appt.status) && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setShowContactModal(true)}
                className="text-xs text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-950/50 font-medium rounded-lg gap-1"
              >
                <Phone className="w-3.5 h-3.5" /> Ghi nhận liên hệ
              </Button>
            )}

            {/* Mark NO_SHOW */}
            {appt && slotStartTime && slotStartTime.getTime() < Date.now() && !appt.checkInAt && !appt.medicalEncounter && ['PENDING', 'CONFIRMED', 'PAID'].includes(appt.status) && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setShowNoShowModal(true)}
                className="text-xs text-rose-600 dark:text-rose-400 border-rose-300 dark:border-rose-800 hover:bg-rose-50 dark:hover:bg-rose-950/50 font-semibold rounded-lg"
              >
                Xác nhận vắng mặt (NO_SHOW)
              </Button>
            )}

            {/* Revert NO_SHOW */}
            {appt && appt.status === 'NO_SHOW' && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setShowRevertModal(true)}
                className="text-xs text-amber-600 dark:text-amber-400 border-amber-300 dark:border-amber-800 hover:bg-amber-50 dark:hover:bg-amber-950/50 font-semibold rounded-lg gap-1"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Khôi phục lịch hẹn
              </Button>
            )}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="rounded-lg text-xs"
          >
            Đóng
          </Button>
        </DialogFooter>

        {/* Modals for actions */}
        <RecordContactModal
          appointment={appt}
          open={showContactModal}
          onClose={() => setShowContactModal(false)}
        />

        <NoShowConfirmModal
          appointment={appt}
          open={showNoShowModal}
          onClose={() => setShowNoShowModal(false)}
          onOpenContactLog={() => setShowContactModal(true)}
        />

        <RevertNoShowModal
          appointment={appt}
          open={showRevertModal}
          onClose={() => setShowRevertModal(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
