'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService } from '@/services/admin.service';
import { useAdminTheme } from '@/components/admin/AdminThemeContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Building2, Stethoscope, MapPin, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

const DAY_OPTIONS = [
  { value: 1, label: 'Thứ Hai' },
  { value: 2, label: 'Thứ Ba' },
  { value: 3, label: 'Thứ Tư' },
  { value: 4, label: 'Thứ Năm' },
  { value: 5, label: 'Thứ Sáu' },
  { value: 6, label: 'Thứ Bảy' },
  { value: 0, label: 'Chủ Nhật' },
];

interface DoctorScheduleDialogProps {
  open: boolean;
  onClose: () => void;
  scheduleToEdit?: any;
}

export function DoctorScheduleDialog({ open, onClose, scheduleToEdit }: DoctorScheduleDialogProps) {
  const queryClient = useQueryClient();
  const { theme } = useAdminTheme();
  const isLight = theme === 'light';

  const isEdit = !!scheduleToEdit;

  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('');
  const [doctorWorkplaceId, setDoctorWorkplaceId] = useState<string>('');
  const [dayOfWeek, setDayOfWeek] = useState<number>(1);
  const [startTime, setStartTime] = useState<string>('08:00');
  const [endTime, setEndTime] = useState<string>('17:00');
  const [breakStart, setBreakStart] = useState<string>('12:00');
  const [breakEnd, setBreakEnd] = useState<string>('13:30');
  const [hasBreak, setHasBreak] = useState<boolean>(true);
  const [isActive, setIsActive] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Fetch doctors list for selection when creating
  const { data: doctorsData, isLoading: isLoadingDoctors } = useQuery({
    queryKey: ['admin-doctors-all-schedule-modal'],
    queryFn: () => adminService.getDoctors({ limit: 100, isActive: 'true' }),
    enabled: open && !isEdit,
  });

  // Fetch detailed info of selected doctor to get their workplaces
  const { data: selectedDoctorDetail, isLoading: isLoadingDoctorDetail } = useQuery({
    queryKey: ['admin-doctor-detail-schedule-modal', selectedDoctorId],
    queryFn: () => adminService.getDoctorDetail(selectedDoctorId),
    enabled: !!selectedDoctorId && open && !isEdit,
  });

  useEffect(() => {
    if (scheduleToEdit) {
      const wp = scheduleToEdit.doctorWorkplace;
      setSelectedDoctorId(wp?.doctorId || '');
      setDoctorWorkplaceId(scheduleToEdit.doctorWorkplaceId || '');
      setDayOfWeek(scheduleToEdit.dayOfWeek !== undefined ? scheduleToEdit.dayOfWeek : 1);
      setStartTime(scheduleToEdit.startTime || '08:00');
      setEndTime(scheduleToEdit.endTime || '17:00');
      setBreakStart(scheduleToEdit.breakStart || '');
      setBreakEnd(scheduleToEdit.breakEnd || '');
      setHasBreak(!!(scheduleToEdit.breakStart && scheduleToEdit.breakEnd));
      setIsActive(scheduleToEdit.isActive !== undefined ? scheduleToEdit.isActive : true);
      setErrorMsg('');
    } else {
      setSelectedDoctorId('');
      setDoctorWorkplaceId('');
      setDayOfWeek(1);
      setStartTime('08:00');
      setEndTime('17:00');
      setBreakStart('12:00');
      setBreakEnd('13:30');
      setHasBreak(true);
      setIsActive(true);
      setErrorMsg('');
    }
  }, [scheduleToEdit, open]);

  // Auto select first active workplace when doctor selected
  useEffect(() => {
    if (!isEdit && selectedDoctorDetail?.workPlaces) {
      const activeWps = selectedDoctorDetail.workPlaces.filter((w: any) => w.isActive);
      if (activeWps.length > 0) {
        setDoctorWorkplaceId(activeWps[0].id);
      } else {
        setDoctorWorkplaceId('');
      }
    }
  }, [selectedDoctorDetail, isEdit]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      setErrorMsg('');
      // Validation rules
      if (!doctorWorkplaceId) {
        throw new Error('Vui lòng chọn Nơi công tác của Bác sĩ');
      }

      if (startTime >= endTime) {
        throw new Error('Giờ bắt đầu làm việc phải nhỏ hơn giờ kết thúc');
      }

      let bStart: string | undefined = undefined;
      let bEnd: string | undefined = undefined;

      if (hasBreak) {
        if (!breakStart || !breakEnd) {
          throw new Error('Vui lòng nhập đầy đủ giờ bắt đầu và kết thúc nghỉ giữa ca');
        }
        if (breakStart >= breakEnd) {
          throw new Error('Giờ bắt đầu nghỉ phải nhỏ hơn giờ kết thúc nghỉ');
        }
        if (breakStart < startTime || breakEnd > endTime) {
          throw new Error('Khoảng thời gian nghỉ giữa ca phải nằm trong thời gian làm việc');
        }
        bStart = breakStart;
        bEnd = breakEnd;
      }

      const payload = {
        doctorWorkplaceId,
        dayOfWeek: Number(dayOfWeek),
        startTime,
        endTime,
        breakStart: bStart,
        breakEnd: bEnd,
        isActive,
      };

      if (isEdit) {
        return adminService.updateDoctorSchedule(scheduleToEdit.id, payload);
      } else {
        return adminService.createDoctorSchedule(doctorWorkplaceId, payload);
      }
    },
    onSuccess: () => {
      toast.success(isEdit ? 'Cập nhật lịch làm việc thành công' : 'Thêm lịch làm việc thành công');
      queryClient.invalidateQueries({ queryKey: ['admin-doctor-schedules'] });
      onClose();
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || err.message || 'Thao tác không thành công';
      setErrorMsg(msg);
      toast.error(msg);
    },
  });

  const selectedWorkplaceInfo = isEdit
    ? scheduleToEdit?.doctorWorkplace
    : selectedDoctorDetail?.workPlaces?.find((w: any) => w.id === doctorWorkplaceId);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        className={`max-w-xl p-6 rounded-2xl ${
          isLight ? 'bg-white text-slate-900 border-slate-200' : 'bg-slate-950 text-white border-slate-800'
        }`}
      >
        <DialogHeader>
          <DialogTitle className="text-lg font-black tracking-tight">
            {isEdit ? 'Sửa Lịch Làm Việc Bác Sĩ' : 'Thêm Lịch Làm Việc Định Kỳ'}
          </DialogTitle>
        </DialogHeader>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="space-y-4 py-2 text-xs">
          {/* Select Doctor (Only when creating) */}
          {!isEdit ? (
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 dark:text-slate-300">
                1. Chọn Bác sĩ <span className="text-rose-500">*</span>
              </label>
              {isLoadingDoctors ? (
                <div className="p-2 text-slate-400 flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> Đang tải danh sách bác sĩ...
                </div>
              ) : (
                <select
                  value={selectedDoctorId}
                  onChange={(e) => setSelectedDoctorId(e.target.value)}
                  className={`w-full p-2.5 rounded-xl border font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                    isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'
                  }`}
                >
                  <option value="">-- Chọn bác sĩ --</option>
                  {doctorsData?.items?.map((doc: any) => (
                    <option key={doc.id} value={doc.id}>
                      {doc.title ? `${doc.title} ` : ''}{doc.fullName} ({doc.qualification})
                    </option>
                  ))}
                </select>
              )}
            </div>
          ) : (
            <div className={`p-3 rounded-xl border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900 border-slate-800'}`}>
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Bác sĩ</div>
              <div className="font-extrabold text-sm text-emerald-600 dark:text-[#66FF33] mt-0.5">
                {scheduleToEdit?.doctorWorkplace?.doctor?.fullName}
              </div>
            </div>
          )}

          {/* Select Doctor Workplace */}
          {selectedDoctorId && !isEdit && (
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 dark:text-slate-300">
                2. Nơi công tác <span className="text-rose-500">*</span>
              </label>
              {isLoadingDoctorDetail ? (
                <div className="p-2 text-slate-400 flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> Đang tải nơi công tác...
                </div>
              ) : selectedDoctorDetail?.workPlaces?.length === 0 ? (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-600 text-xs font-semibold">
                  Bác sĩ này chưa đăng ký nơi công tác nào. Vui lòng thêm nơi công tác cho bác sĩ ở mục Quản lý Bác sĩ trước.
                </div>
              ) : (
                <select
                  value={doctorWorkplaceId}
                  onChange={(e) => setDoctorWorkplaceId(e.target.value)}
                  className={`w-full p-2.5 rounded-xl border font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                    isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'
                  }`}
                >
                  {selectedDoctorDetail?.workPlaces?.filter((w: any) => w.isActive).map((wp: any) => (
                    <option key={wp.id} value={wp.id}>
                      {wp.hospital?.name} - {wp.specialty?.name} {wp.branch ? `(${wp.branch.name || wp.branch.address})` : ''}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          {/* Detailed Display of Selected Workplace */}
          {selectedWorkplaceInfo && (
            <div className={`p-3 rounded-xl border grid grid-cols-1 sm:grid-cols-3 gap-2 ${
              isLight ? 'bg-slate-50 border-slate-200 text-slate-700' : 'bg-slate-900/60 border-slate-800 text-slate-300'
            }`}>
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <div className="truncate">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Bệnh viện</div>
                  <div className="font-bold text-xs truncate">{selectedWorkplaceInfo.hospital?.name || 'N/A'}</div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-blue-500 shrink-0" />
                <div className="truncate">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Cơ sở</div>
                  <div className="font-bold text-xs truncate">{selectedWorkplaceInfo.branch?.name || selectedWorkplaceInfo.branch?.address || 'Cơ sở chính'}</div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Stethoscope className="w-4 h-4 text-purple-500 shrink-0" />
                <div className="truncate">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Chuyên khoa</div>
                  <div className="font-bold text-xs truncate">{selectedWorkplaceInfo.specialty?.name || 'N/A'}</div>
                </div>
              </div>
            </div>
          )}

          {/* Day of week */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 dark:text-slate-300">
              Ngày trong tuần <span className="text-rose-500">*</span>
            </label>
            <select
              value={dayOfWeek}
              onChange={(e) => setDayOfWeek(Number(e.target.value))}
              className={`w-full p-2.5 rounded-xl border font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'
              }`}
            >
              {DAY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Working hours */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 dark:text-slate-300">
                Giờ bắt đầu <span className="text-rose-500">*</span>
              </label>
              <Input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className={`rounded-xl font-mono text-xs ${
                  isLight ? 'bg-white border-slate-300' : 'bg-slate-900 border-slate-800 text-white'
                }`}
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 dark:text-slate-300">
                Giờ kết thúc <span className="text-rose-500">*</span>
              </label>
              <Input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className={`rounded-xl font-mono text-xs ${
                  isLight ? 'bg-white border-slate-300' : 'bg-slate-900 border-slate-800 text-white'
                }`}
              />
            </div>
          </div>

          {/* Break time section */}
          <div className="space-y-2 pt-1 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-700 dark:text-slate-300 cursor-pointer flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={hasBreak}
                  onChange={(e) => setHasBreak(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                />
                Nghỉ giữa ca (trưa)
              </label>
            </div>

            {hasBreak && (
              <div className="grid grid-cols-2 gap-3 pl-6">
                <div className="space-y-1">
                  <span className="text-[11px] font-semibold text-slate-500">Giờ bắt đầu nghỉ</span>
                  <Input
                    type="time"
                    value={breakStart}
                    onChange={(e) => setBreakStart(e.target.value)}
                    className={`rounded-xl font-mono text-xs ${
                      isLight ? 'bg-white border-slate-300' : 'bg-slate-900 border-slate-800 text-white'
                    }`}
                  />
                </div>

                <div className="space-y-1">
                  <span className="text-[11px] font-semibold text-slate-500">Giờ kết thúc nghỉ</span>
                  <Input
                    type="time"
                    value={breakEnd}
                    onChange={(e) => setBreakEnd(e.target.value)}
                    className={`rounded-xl font-mono text-xs ${
                      isLight ? 'bg-white border-slate-300' : 'bg-slate-900 border-slate-800 text-white'
                    }`}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Active status */}
          <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <span className="font-bold text-slate-700 dark:text-slate-300">Trạng thái hoạt động</span>
            <select
              value={isActive ? 'true' : 'false'}
              onChange={(e) => setIsActive(e.target.value === 'true')}
              className={`p-2 rounded-xl border text-xs font-bold ${
                isActive
                  ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30'
                  : 'bg-slate-500/10 text-slate-500 border-slate-500/30'
              }`}
            >
              <option value="true">Hoạt động</option>
              <option value="false">Ngừng hoạt động</option>
            </select>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0 mt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className={`rounded-xl ${isLight ? 'border-slate-300 text-slate-700' : 'border-slate-800 text-slate-300'}`}
          >
            Hủy bỏ
          </Button>
          <Button
            type="button"
            disabled={saveMutation.isPending || (!isEdit && !doctorWorkplaceId)}
            onClick={() => saveMutation.mutate()}
            className="rounded-xl font-bold bg-[#0c4b39] hover:bg-[#083629] text-white dark:bg-emerald-600 dark:hover:bg-emerald-700"
          >
            {saveMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {isEdit ? 'Lưu cập nhật' : 'Tạo lịch làm việc'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
