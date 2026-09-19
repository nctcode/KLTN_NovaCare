'use client';

import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService } from '@/services/admin.service';
import { useAdminTheme } from '@/components/admin/AdminThemeContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SearchableSelect } from '@/components/ui/searchable-select';
import {
  Loader2,
  Building2,
  Stethoscope,
  AlertCircle,
  Clock,
  Sun,
  Sunrise,
  CheckCircle2,
  Calendar,
} from 'lucide-react';
import { toast } from 'sonner';

const DAYS = [
  { value: 1, label: 'Thứ 2', fullLabel: 'Thứ Hai' },
  { value: 2, label: 'Thứ 3', fullLabel: 'Thứ Ba' },
  { value: 3, label: 'Thứ 4', fullLabel: 'Thứ Tư' },
  { value: 4, label: 'Thứ 5', fullLabel: 'Thứ Năm' },
  { value: 5, label: 'Thứ 6', fullLabel: 'Thứ Sáu' },
  { value: 6, label: 'Thứ 7', fullLabel: 'Thứ Bảy' },
  { value: 0, label: 'Chủ Nhật', fullLabel: 'Chủ Nhật' },
];

const PRESET_SHIFTS = [
  {
    id: 'morning',
    label: 'Ca sáng',
    timeLabel: '07:30 - 11:30',
    startTime: '07:30',
    endTime: '11:30',
    hasBreak: false,
    breakStart: '',
    breakEnd: '',
    icon: Sunrise,
  },
  {
    id: 'afternoon',
    label: 'Ca chiều',
    timeLabel: '13:30 - 17:30',
    startTime: '13:30',
    endTime: '17:30',
    hasBreak: false,
    breakStart: '',
    breakEnd: '',
    icon: Sun,
  },
  {
    id: 'full_day',
    label: 'Cả ngày',
    timeLabel: '07:30 - 17:00 (Nghỉ 11:30 - 13:30)',
    startTime: '07:30',
    endTime: '17:00',
    hasBreak: true,
    breakStart: '11:30',
    breakEnd: '13:30',
    icon: Clock,
  },
];

interface DoctorScheduleDialogProps {
  open: boolean;
  onClose: () => void;
  scheduleToEdit?: any;
  defaultHospitalId?: string;
  defaultSpecialtyId?: string;
}

export function DoctorScheduleDialog({
  open,
  onClose,
  scheduleToEdit,
  defaultHospitalId = '',
  defaultSpecialtyId = '',
}: DoctorScheduleDialogProps) {
  const queryClient = useQueryClient();
  const { theme } = useAdminTheme();
  const isLight = theme === 'light';

  const isEdit = !!scheduleToEdit;

  // Filters & selection
  const [hospitalId, setHospitalId] = useState<string>(defaultHospitalId);
  const [specialtyId, setSpecialtyId] = useState<string>(defaultSpecialtyId);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('');
  const [doctorWorkplaceId, setDoctorWorkplaceId] = useState<string>('');

  // Single day (edit) or multiple days (create)
  const [singleDay, setSingleDay] = useState<number>(1);
  const [selectedDays, setSelectedDays] = useState<number[]>([1]);

  // Shift & times
  const [selectedShiftPreset, setSelectedShiftPreset] = useState<string>('morning');
  const [startTime, setStartTime] = useState<string>('07:30');
  const [endTime, setEndTime] = useState<string>('11:30');
  const [breakStart, setBreakStart] = useState<string>('');
  const [breakEnd, setBreakEnd] = useState<string>('');
  const [hasBreak, setHasBreak] = useState<boolean>(false);
  const [isActive, setIsActive] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Fetch hospitals
  const { data: hospitalsData } = useQuery({
    queryKey: ['admin-hospitals-simple-modal'],
    queryFn: () => adminService.getHospitals({ limit: 100 }),
    enabled: open && !isEdit,
  });

  // Fetch specialties
  const { data: specialtiesData } = useQuery({
    queryKey: ['admin-specialties-simple-modal'],
    queryFn: () => adminService.getSpecialties({ limit: 100 }),
    enabled: open && !isEdit,
  });

  // Fetch doctors filtered by hospital and specialty
  const { data: doctorsData, isLoading: isLoadingDoctors } = useQuery({
    queryKey: ['admin-doctors-schedule-modal', hospitalId, specialtyId],
    queryFn: () =>
      adminService.getDoctors({
        limit: 100,
        hospitalId: hospitalId || undefined,
        specialtyId: specialtyId || undefined,
        isActive: 'true',
      }),
    enabled: open && !isEdit && !!hospitalId,
  });

  // Hospital options for SearchableSelect
  const hospitalOptions = useMemo(() => {
    return (hospitalsData?.items || []).map((h: any) => ({
      value: h.id,
      label: h.name,
    }));
  }, [hospitalsData]);

  // Specialty options for SearchableSelect
  const specialtyOptions = useMemo(() => {
    const list = (specialtiesData?.items || []).map((s: any) => ({
      value: s.id,
      label: s.name,
    }));
    return [{ value: '', label: '-- Tất cả chuyên khoa --' }, ...list];
  }, [specialtiesData]);

  // Doctor options for SearchableSelect (with specialty badge / subLabel)
  const doctorOptions = useMemo(() => {
    return (doctorsData?.items || []).map((doc: any) => {
      const docSpec = doc.workPlaces?.find(
        (w: any) => w.hospitalId === hospitalId || w.hospital?.id === hospitalId
      )?.specialty?.name;
      return {
        value: doc.id,
        label: doc.fullName,
        subLabel: docSpec,
      };
    });
  }, [doctorsData, hospitalId]);

  // Currently selected doctor
  const currentDoctor = doctorsData?.items?.find((d: any) => d.id === selectedDoctorId);

  // Available workplaces for this doctor (at the selected hospital)
  const availableWorkplaces = useMemo(() => {
    const wps = currentDoctor?.workPlaces || [];
    return wps.filter((w: any) => {
      if (!hospitalId) return true;
      return w.hospitalId === hospitalId || w.hospital?.id === hospitalId;
    });
  }, [currentDoctor, hospitalId]);

  // Selected workplace
  const currentWorkplace = isEdit
    ? scheduleToEdit?.doctorWorkplace
    : availableWorkplaces.find((w: any) => w.id === doctorWorkplaceId);

  // Existing days with schedules for this workplace
  const existingScheduleDays: number[] = (currentWorkplace?.schedules || []).map((s: any) => Number(s.dayOfWeek));

  // Initialize form state
  useEffect(() => {
    if (scheduleToEdit) {
      const wp = scheduleToEdit.doctorWorkplace;
      setHospitalId(wp?.hospitalId || wp?.hospital?.id || '');
      setSpecialtyId(wp?.specialtyId || wp?.specialty?.id || '');
      setSelectedDoctorId(wp?.doctorId || '');
      setDoctorWorkplaceId(scheduleToEdit.doctorWorkplaceId || '');
      setSingleDay(scheduleToEdit.dayOfWeek !== undefined ? Number(scheduleToEdit.dayOfWeek) : 1);
      setSelectedDays([scheduleToEdit.dayOfWeek !== undefined ? Number(scheduleToEdit.dayOfWeek) : 1]);
      setStartTime(scheduleToEdit.startTime || '07:30');
      setEndTime(scheduleToEdit.endTime || '11:30');
      setBreakStart(scheduleToEdit.breakStart || '');
      setBreakEnd(scheduleToEdit.breakEnd || '');
      setHasBreak(!!(scheduleToEdit.breakStart && scheduleToEdit.breakEnd));
      setIsActive(scheduleToEdit.isActive !== undefined ? scheduleToEdit.isActive : true);
      setSelectedShiftPreset('custom');
      setErrorMsg('');
    } else {
      setHospitalId(defaultHospitalId);
      setSpecialtyId(defaultSpecialtyId);
      setSelectedDoctorId('');
      setDoctorWorkplaceId('');
      setSingleDay(1);
      setSelectedDays([1]);
      setStartTime('07:30');
      setEndTime('11:30');
      setBreakStart('');
      setBreakEnd('');
      setHasBreak(false);
      setSelectedShiftPreset('morning');
      setIsActive(true);
      setErrorMsg('');
    }
  }, [scheduleToEdit, open, defaultHospitalId, defaultSpecialtyId]);

  // Auto-select doctor's workplace when doctor or filtered specialty changes
  useEffect(() => {
    if (!isEdit && availableWorkplaces.length > 0) {
      if (specialtyId) {
        const matched = availableWorkplaces.find(
          (w: any) => w.specialtyId === specialtyId || w.specialty?.id === specialtyId
        );
        if (matched) {
          setDoctorWorkplaceId(matched.id);
          return;
        }
      }
      const firstActive = availableWorkplaces.find((w: any) => w.isActive) || availableWorkplaces[0];
      setDoctorWorkplaceId(firstActive.id);
    } else if (!isEdit && availableWorkplaces.length === 0) {
      setDoctorWorkplaceId('');
    }
  }, [selectedDoctorId, hospitalId, specialtyId, availableWorkplaces, isEdit]);

  // Apply preset shift
  const applyPreset = (preset: typeof PRESET_SHIFTS[0]) => {
    setSelectedShiftPreset(preset.id);
    setStartTime(preset.startTime);
    setEndTime(preset.endTime);
    setHasBreak(preset.hasBreak);
    setBreakStart(preset.breakStart);
    setBreakEnd(preset.breakEnd);
  };

  // Toggle day selection
  const handleToggleDay = (dayVal: number) => {
    if (isEdit) {
      setSingleDay(dayVal);
      return;
    }

    if (existingScheduleDays.includes(dayVal)) {
      toast.warning(`Thứ ${dayVal === 0 ? 'Chủ Nhật' : dayVal + 1} đã có lịch khám tại nơi này`);
      return;
    }

    if (selectedDays.includes(dayVal)) {
      if (selectedDays.length === 1) {
        toast.info('Phải chọn ít nhất 1 ngày làm việc');
        return;
      }
      setSelectedDays(selectedDays.filter((d) => d !== dayVal));
    } else {
      setSelectedDays([...selectedDays, dayVal].sort((a, b) => a - b));
    }
  };

  // Quick select day presets
  const handleSelectDayGroup = (targetDays: number[]) => {
    const validDays = targetDays.filter((d) => !existingScheduleDays.includes(d));
    if (validDays.length === 0) {
      toast.warning('Tất cả các ngày trong nhóm này đã có lịch khám!');
      return;
    }
    setSelectedDays(validDays);
  };

  // Save Mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      setErrorMsg('');

      if (!hospitalId) {
        throw new Error('Vui lòng chọn Bệnh viện');
      }
      if (!isEdit && !selectedDoctorId) {
        throw new Error('Vui lòng chọn Bác sĩ');
      }
      if (!doctorWorkplaceId) {
        throw new Error('Vui lòng chọn Chuyên khoa / Nơi công tác');
      }
      if (startTime >= endTime) {
        throw new Error('Giờ bắt đầu làm việc phải sớm hơn giờ kết thúc');
      }

      let bStart: string | undefined = undefined;
      let bEnd: string | undefined = undefined;
      if (hasBreak) {
        if (!breakStart || !breakEnd) {
          throw new Error('Vui lòng nhập đầy đủ giờ bắt đầu và kết thúc nghỉ trưa');
        }
        if (breakStart >= breakEnd) {
          throw new Error('Giờ bắt đầu nghỉ phải sớm hơn giờ kết thúc nghỉ');
        }
        if (breakStart < startTime || breakEnd > endTime) {
          throw new Error('Khoảng thời gian nghỉ phải nằm trong khung giờ làm việc');
        }
        bStart = breakStart;
        bEnd = breakEnd;
      }

      if (isEdit) {
        return adminService.updateDoctorSchedule(scheduleToEdit.id, {
          dayOfWeek: Number(singleDay),
          startTime,
          endTime,
          breakStart: bStart,
          breakEnd: bEnd,
          isActive,
        });
      }

      // Create mode: Batch create for all selected days
      if (selectedDays.length === 0) {
        throw new Error('Vui lòng chọn ít nhất 1 ngày làm việc');
      }

      const results = [];
      const errors = [];

      for (const day of selectedDays) {
        try {
          const res = await adminService.createDoctorSchedule(doctorWorkplaceId, {
            doctorWorkplaceId,
            dayOfWeek: Number(day),
            startTime,
            endTime,
            breakStart: bStart,
            breakEnd: bEnd,
            isActive,
          });
          results.push(day);
        } catch (err: any) {
          errors.push({ day, msg: err.response?.data?.message || err.message });
        }
      }

      if (results.length === 0 && errors.length > 0) {
        throw new Error(errors[0].msg || 'Không thể tạo ca khám');
      }

      return { successCount: results.length, errorCount: errors.length };
    },
    onSuccess: (data: any) => {
      if (isEdit) {
        toast.success('Cập nhật lịch khám thành công');
      } else {
        toast.success(`Đã thêm thành công ${data.successCount} ca khám định kỳ`);
      }
      queryClient.invalidateQueries({ queryKey: ['admin-doctor-schedules'] });
      queryClient.invalidateQueries({ queryKey: ['admin-doctors-schedule-modal'] });
      onClose();
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || err.message || 'Thao tác không thành công';
      setErrorMsg(msg);
      toast.error(msg);
    },
  });

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        className={`max-w-xl p-6 rounded-2xl max-h-[90vh] overflow-y-auto ${
          isLight ? 'bg-white text-slate-900 border-slate-200' : 'bg-slate-950 text-white border-slate-800'
        }`}
      >
        <DialogHeader>
          <DialogTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-emerald-600" />
            {isEdit ? 'Chỉnh Sửa Ca Khám Định Kỳ' : 'Thêm Ca Khám Định Kỳ Cho Bác Sĩ'}
          </DialogTitle>
        </DialogHeader>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="space-y-4 py-1 text-xs">
          {/* Section 1: Hospital & Specialty with Integrated Dropdown Search */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Hospital */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-emerald-600" /> Bệnh viện <span className="text-rose-500">*</span>
              </label>
              {isEdit ? (
                <div className={`p-2.5 rounded-xl border font-semibold ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900 border-slate-800'}`}>
                  {scheduleToEdit?.doctorWorkplace?.hospital?.name || 'N/A'}
                </div>
              ) : (
                <SearchableSelect
                  options={hospitalOptions}
                  value={hospitalId}
                  onChange={(val) => {
                    setHospitalId(val);
                    setSelectedDoctorId('');
                    setDoctorWorkplaceId('');
                  }}
                  placeholder="-- Chọn bệnh viện --"
                  searchPlaceholder="Tìm kiếm bệnh viện..."
                  isLight={isLight}
                  emptyMessage="Không có bệnh viện phù hợp"
                />
              )}
            </div>

            {/* Specialty Filter */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <Stethoscope className="w-3.5 h-3.5 text-purple-600" /> Chuyên khoa
              </label>
              {isEdit ? (
                <div className={`p-2.5 rounded-xl border font-semibold ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900 border-slate-800'}`}>
                  {scheduleToEdit?.doctorWorkplace?.specialty?.name || 'Đa khoa'}
                </div>
              ) : (
                <SearchableSelect
                  options={specialtyOptions}
                  value={specialtyId}
                  onChange={(val) => {
                    setSpecialtyId(val);
                    setSelectedDoctorId('');
                    setDoctorWorkplaceId('');
                  }}
                  placeholder="-- Tất cả chuyên khoa --"
                  searchPlaceholder="Tìm kiếm chuyên khoa..."
                  isLight={isLight}
                  emptyMessage="Không có chuyên khoa phù hợp"
                />
              )}
            </div>
          </div>

          {/* Section 2: Doctor Selection with Integrated Dropdown Search */}
          {!isEdit && (
            <div className="space-y-1.5 pt-1 border-t border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <Stethoscope className="w-3.5 h-3.5 text-blue-600" /> Bác sĩ <span className="text-rose-500">*</span>
                </label>
                {hospitalId && (
                  <span className="text-[11px] text-slate-400">
                    {doctorOptions.length} bác sĩ phù hợp
                  </span>
                )}
              </div>

              <SearchableSelect
                options={doctorOptions}
                value={selectedDoctorId}
                disabled={!hospitalId || isLoadingDoctors}
                onChange={(val) => setSelectedDoctorId(val)}
                placeholder={
                  !hospitalId
                    ? '-- Vui lòng chọn bệnh viện trước --'
                    : isLoadingDoctors
                    ? 'Đang tải danh sách bác sĩ...'
                    : doctorOptions.length === 0
                    ? '-- Không có bác sĩ nào thuộc chuyên khoa này --'
                    : '-- Chọn bác sĩ --'
                }
                searchPlaceholder="Tìm kiếm tên bác sĩ..."
                isLight={isLight}
                emptyMessage="Không tìm thấy bác sĩ phù hợp"
              />
            </div>
          )}

          {/* If editing, show doctor info cleanly */}
          {isEdit && (
            <div className={`p-3 rounded-xl border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900 border-slate-800'}`}>
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Bác sĩ</div>
              <div className="font-bold text-sm text-emerald-600 dark:text-emerald-400 mt-0.5">
                {scheduleToEdit?.doctorWorkplace?.doctor?.fullName}
              </div>
            </div>
          )}

          {/* Workplace / Specialty confirmation */}
          {selectedDoctorId && !isEdit && (
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 dark:text-slate-300">
                Chuyên khoa công tác <span className="text-rose-500">*</span>
              </label>
              {availableWorkplaces.length === 0 ? (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-600 text-xs font-semibold">
                  Bác sĩ này chưa được gán chuyên khoa tại bệnh viện đã chọn.
                </div>
              ) : availableWorkplaces.length === 1 ? (
                <div
                  className={`p-2.5 rounded-xl border font-semibold text-emerald-600 flex items-center justify-between ${
                    isLight ? 'bg-emerald-50/50 border-emerald-200' : 'bg-emerald-950/20 border-emerald-800'
                  }`}
                >
                  <span>{availableWorkplaces[0].specialty?.name || 'Đa khoa'}</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                </div>
              ) : (
                <select
                  value={doctorWorkplaceId}
                  onChange={(e) => setDoctorWorkplaceId(e.target.value)}
                  className={`w-full p-2.5 rounded-xl border font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                    isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'
                  }`}
                >
                  {availableWorkplaces.map((wp: any) => (
                    <option key={wp.id} value={wp.id}>
                      {wp.specialty?.name || 'Đa khoa'}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          {/* Section 3: Day of Week Selection */}
          <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-700 dark:text-slate-300">
                {isEdit ? 'Ngày trong tuần' : 'Chọn các ngày áp dụng'} <span className="text-rose-500">*</span>
              </label>
              {!isEdit && (
                <div className="flex items-center gap-1.5 text-[11px]">
                  <button
                    type="button"
                    onClick={() => handleSelectDayGroup([1, 2, 3, 4, 5])}
                    className="px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-800 hover:bg-emerald-50 hover:text-emerald-700 transition"
                  >
                    T2 - T6
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectDayGroup([1, 3, 5])}
                    className="px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-800 hover:bg-emerald-50 hover:text-emerald-700 transition"
                  >
                    T2, 4, 6
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectDayGroup([2, 4, 6])}
                    className="px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-800 hover:bg-emerald-50 hover:text-emerald-700 transition"
                  >
                    T3, 5, 7
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectDayGroup([1, 2, 3, 4, 5, 6, 0])}
                    className="px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-800 hover:bg-emerald-50 hover:text-emerald-700 transition"
                  >
                    Cả tuần
                  </button>
                </div>
              )}
            </div>

            {/* Days pills */}
            <div className="grid grid-cols-7 gap-1.5">
              {DAYS.map((day) => {
                const isExisting = !isEdit && existingScheduleDays.includes(day.value);
                const isSelected = isEdit ? singleDay === day.value : selectedDays.includes(day.value);

                return (
                  <button
                    key={day.value}
                    type="button"
                    disabled={isExisting}
                    onClick={() => handleToggleDay(day.value)}
                    className={`py-2 px-1 rounded-xl text-center border font-semibold text-xs transition cursor-pointer flex flex-col items-center justify-center gap-0.5 ${
                      isExisting
                        ? 'opacity-40 bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-800 cursor-not-allowed text-slate-400'
                        : isSelected
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : isLight
                        ? 'bg-slate-50 border-slate-200 text-slate-700 hover:border-emerald-300'
                        : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-emerald-700'
                    }`}
                  >
                    <span>{day.label}</span>
                    {isExisting && (
                      <span className="text-[9px] font-normal text-rose-500">Đã có</span>
                    )}
                  </button>
                );
              })}
            </div>
            {!isEdit && (
              <p className="text-[11px] text-slate-400">
                * Bạn có thể chọn nhiều ngày cùng lúc để tạo lịch làm việc đồng loạt. Các ngày đã có ca làm việc sẽ bị ẩn để tránh xung đột.
              </p>
            )}
          </div>

          {/* Section 4: Shift Presets */}
          <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
            <label className="font-bold text-slate-700 dark:text-slate-300">
              Khung giờ ca khám <span className="text-rose-500">*</span>
            </label>

            {/* Shift preset buttons */}
            <div className="grid grid-cols-3 gap-2">
              {PRESET_SHIFTS.map((preset) => {
                const Icon = preset.icon;
                const isSelected = selectedShiftPreset === preset.id;

                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => applyPreset(preset)}
                    className={`p-2.5 rounded-xl border text-left transition flex items-center gap-2 cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-500 text-emerald-700 dark:text-emerald-400 font-semibold ring-1 ring-emerald-500'
                        : isLight
                        ? 'bg-slate-50 border-slate-200 text-slate-700 hover:border-emerald-300'
                        : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-emerald-700'
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${isSelected ? 'text-emerald-600' : 'text-slate-400'}`} />
                    <div className="truncate">
                      <div className="font-bold text-xs">{preset.label}</div>
                      <div className="text-[10px] text-slate-500 truncate">{preset.timeLabel}</div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Custom time inputs */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="space-y-1">
                <label className="font-semibold text-[11px] text-slate-600 dark:text-slate-400">Giờ bắt đầu làm việc</label>
                <Input
                  type="time"
                  value={startTime}
                  onChange={(e) => {
                    setStartTime(e.target.value);
                    setSelectedShiftPreset('custom');
                  }}
                  className={`rounded-xl font-mono text-xs ${
                    isLight ? 'bg-white border-slate-300' : 'bg-slate-900 border-slate-800 text-white'
                  }`}
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-[11px] text-slate-600 dark:text-slate-400">Giờ kết thúc làm việc</label>
                <Input
                  type="time"
                  value={endTime}
                  onChange={(e) => {
                    setEndTime(e.target.value);
                    setSelectedShiftPreset('custom');
                  }}
                  className={`rounded-xl font-mono text-xs ${
                    isLight ? 'bg-white border-slate-300' : 'bg-slate-900 border-slate-800 text-white'
                  }`}
                />
              </div>
            </div>

            {/* Break time toggle */}
            <div className="pt-2">
              <label className="font-bold text-slate-700 dark:text-slate-300 cursor-pointer flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={hasBreak}
                  onChange={(e) => {
                    setHasBreak(e.target.checked);
                    if (e.target.checked && (!breakStart || !breakEnd)) {
                      setBreakStart('11:30');
                      setBreakEnd('13:30');
                    }
                    setSelectedShiftPreset('custom');
                  }}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                />
                <span>Có thời gian nghỉ giữa ca (nghỉ trưa)</span>
              </label>

              {hasBreak && (
                <div className="grid grid-cols-2 gap-3 pl-6 mt-2">
                  <div className="space-y-1">
                    <span className="text-[11px] font-medium text-slate-500">Giờ bắt đầu nghỉ</span>
                    <Input
                      type="time"
                      value={breakStart}
                      onChange={(e) => {
                        setBreakStart(e.target.value);
                        setSelectedShiftPreset('custom');
                      }}
                      className={`rounded-xl font-mono text-xs ${
                        isLight ? 'bg-white border-slate-300' : 'bg-slate-900 border-slate-800 text-white'
                      }`}
                    />
                  </div>

                  <div className="space-y-1">
                    <span className="text-[11px] font-medium text-slate-500">Giờ kết thúc nghỉ</span>
                    <Input
                      type="time"
                      value={breakEnd}
                      onChange={(e) => {
                        setBreakEnd(e.target.value);
                        setSelectedShiftPreset('custom');
                      }}
                      className={`rounded-xl font-mono text-xs ${
                        isLight ? 'bg-white border-slate-300' : 'bg-slate-900 border-slate-800 text-white'
                      }`}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Section 5: Status */}
          <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <span className="font-bold text-slate-700 dark:text-slate-300">Trạng thái ca khám</span>
            <select
              value={isActive ? 'true' : 'false'}
              onChange={(e) => setIsActive(e.target.value === 'true')}
              className={`p-2 rounded-xl border text-xs font-bold ${
                isActive
                  ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30'
                  : 'bg-slate-500/10 text-slate-500 border-slate-500/30'
              }`}
            >
              <option value="true">Đang hoạt động</option>
              <option value="false">Tạm ngưng</option>
            </select>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0 mt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className={`rounded-xl text-xs ${isLight ? 'border-slate-300 text-slate-700' : 'border-slate-800 text-slate-300'}`}
          >
            Hủy bỏ
          </Button>
          <Button
            type="button"
            disabled={saveMutation.isPending || (!isEdit && (!hospitalId || !selectedDoctorId || !doctorWorkplaceId))}
            onClick={() => saveMutation.mutate()}
            className="rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            {saveMutation.isPending && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
            {isEdit
              ? 'Lưu thay đổi'
              : selectedDays.length > 1
              ? `Tạo ${selectedDays.length} ca khám`
              : 'Tạo ca khám'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
