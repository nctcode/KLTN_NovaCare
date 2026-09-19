'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService } from '@/services/admin.service';
import { useAdminTheme } from '@/components/admin/AdminThemeContext';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { GenerateSlotsDialog } from './GenerateSlotsDialog';
import {
  Calendar,
  Zap,
  Search,
  Building2,
  Stethoscope,
  Clock,
  Users,
  Loader2,
  Lock,
  Unlock,
  Plus,
  Minus,
  Trash2,
  Sun,
  Sunset,
  Moon,
  CheckCircle2,
  AlertCircle,
  XCircle,
} from 'lucide-react';
import { toast } from 'sonner';

export function DailySlotsTab() {
  const queryClient = useQueryClient();
  const { theme } = useAdminTheme();
  const isLight = theme === 'light';

  // Date helpers
  const getTodayStr = () => new Date().toISOString().split('T')[0];
  const getDatePlusDays = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
  };

  // State
  const [selectedDate, setSelectedDate] = useState<string>(getTodayStr());
  const [hospitalId, setHospitalId] = useState('');
  const [specialtyId, setSpecialtyId] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState(''); // 'available', 'full', 'locked'

  const [isGenerateOpen, setIsGenerateOpen] = useState(false);
  const [slotToDelete, setSlotToDelete] = useState<any>(null);

  // Styles
  const cardBg = isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-800 text-white';

  // Fetch Hospitals
  const { data: hospitalsData } = useQuery({
    queryKey: ['admin-hospitals-filter-slots'],
    queryFn: () => adminService.getHospitals({ limit: 100 }),
  });

  // Fetch Specialties
  const { data: specialtiesData } = useQuery({
    queryKey: ['admin-specialties-filter-slots'],
    queryFn: () => adminService.getSpecialties({ limit: 100 }),
  });

  // Fetch Slots for selected Date
  const { data: slots = [], isLoading } = useQuery({
    queryKey: ['admin-appointment-slots', selectedDate, hospitalId, specialtyId, search],
    queryFn: () =>
      adminService.getAppointmentSlots({
        date: selectedDate,
        hospitalId: hospitalId || undefined,
        specialtyId: specialtyId || undefined,
        search: search || undefined,
      }),
  });

  // Mutations
  const updateSlotMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return adminService.updateAppointmentSlot(id, data);
    },
    onSuccess: () => {
      toast.success('Cập nhật khung giờ thành công');
      queryClient.invalidateQueries({ queryKey: ['admin-appointment-slots'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Không thể cập nhật khung giờ');
    },
  });

  const deleteSlotMutation = useMutation({
    mutationFn: async (id: string) => {
      return adminService.deleteAppointmentSlot(id);
    },
    onSuccess: () => {
      toast.success('Xóa khung giờ thành công');
      queryClient.invalidateQueries({ queryKey: ['admin-appointment-slots'] });
      setSlotToDelete(null);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Không thể xóa khung giờ đã có lịch hẹn');
    },
  });

  // Filtered Slots
  const filteredSlots = useMemo(() => {
    if (!Array.isArray(slots)) return [];
    return slots.filter((slot: any) => {
      if (statusFilter === 'locked') {
        return !slot.isAvailable || !slot.isActive;
      }
      if (statusFilter === 'full') {
        return slot.isAvailable && slot.isActive && slot.bookedCount >= slot.capacity;
      }
      if (statusFilter === 'available') {
        return slot.isAvailable && slot.isActive && slot.bookedCount < slot.capacity;
      }
      return true;
    });
  }, [slots, statusFilter]);

  // Group by Shift (Medpro format: Morning, Afternoon, Evening)
  const groupedShifts = useMemo(() => {
    const morning: any[] = [];
    const afternoon: any[] = [];
    const evening: any[] = [];

    filteredSlots.forEach((slot: any) => {
      const d = new Date(slot.startTime);
      const hours = d.getHours();

      if (hours < 12) {
        morning.push(slot);
      } else if (hours < 17) {
        afternoon.push(slot);
      } else {
        evening.push(slot);
      }
    });

    return { morning, afternoon, evening };
  }, [filteredSlots]);

  // Daily Stats calculation
  const dailyStats = useMemo(() => {
    if (!Array.isArray(slots)) return { totalSlots: 0, totalBooked: 0, totalCapacity: 0, fullSlots: 0, availableSlots: 0 };
    let totalBooked = 0;
    let totalCapacity = 0;
    let fullSlots = 0;
    let availableSlots = 0;

    slots.forEach((s: any) => {
      totalBooked += s.bookedCount || 0;
      totalCapacity += s.capacity || 0;
      if (s.isAvailable && s.isActive && (s.bookedCount || 0) >= (s.capacity || 1)) {
        fullSlots++;
      } else if (s.isAvailable && s.isActive && (s.bookedCount || 0) < (s.capacity || 1)) {
        availableSlots++;
      }
    });

    return {
      totalSlots: slots.length,
      totalBooked,
      totalCapacity,
      fullSlots,
      availableSlots,
    };
  }, [slots]);

  // Format time (HH:mm)
  const formatTimeStr = (iso: string) => {
    const d = new Date(iso);
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  };

  const handleToggleLock = (slot: any) => {
    updateSlotMutation.mutate({
      id: slot.id,
      data: { isAvailable: !slot.isAvailable },
    });
  };

  const handleAdjustCapacity = (slot: any, delta: number) => {
    const newCap = Math.max(1, (slot.capacity || 1) + delta);
    if (newCap < slot.bookedCount) {
      toast.error(`Không thể giảm sức chứa nhỏ hơn số bệnh nhân đã đặt (${slot.bookedCount})`);
      return;
    }
    updateSlotMutation.mutate({
      id: slot.id,
      data: { capacity: newCap },
    });
  };

  return (
    <div className="space-y-5">
      {/* Header & Generate Button */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-emerald-600" />
            Khung giờ khám theo ngày
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Theo dõi thời gian thực các ca khám, số lượng bệnh nhân đã đặt và sức chứa từng khung giờ.
          </p>
        </div>

        <Button
          onClick={() => setIsGenerateOpen(true)}
          className="rounded-xl text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-white shadow-xs"
        >
          <Zap className="w-4 h-4 mr-1.5 fill-current" />
          Sinh khung giờ tự động
        </Button>
      </div>

      {/* Date Navigation & Presets */}
      <Card className={`${cardBg} p-3.5 shadow-xs`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Quick Date Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto">
            <button
              onClick={() => setSelectedDate(getTodayStr())}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${selectedDate === getTodayStr()
                  ? 'bg-emerald-600 text-white'
                  : isLight
                    ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
            >
              Hôm nay
            </button>
            <button
              onClick={() => setSelectedDate(getDatePlusDays(1))}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${selectedDate === getDatePlusDays(1)
                  ? 'bg-emerald-600 text-white'
                  : isLight
                    ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
            >
              Ngày mai
            </button>
            <button
              onClick={() => setSelectedDate(getDatePlusDays(2))}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${selectedDate === getDatePlusDays(2)
                  ? 'bg-emerald-600 text-white'
                  : isLight
                    ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
            >
              Ngày kia
            </button>
          </div>

          {/* Date Picker Input */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-500">Chọn ngày:</span>
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className={`text-xs h-9 w-40 rounded-lg font-mono ${isLight ? 'bg-white border-slate-200' : 'bg-slate-950 border-slate-800 text-white'
                }`}
            />
          </div>
        </div>
      </Card>

      {/* Daily Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className={`${cardBg} p-3.5 shadow-xs`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-slate-500">Tổng slot trong ngày</p>
              <p className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">{dailyStats.totalSlots}</p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
        </Card>

        <Card className={`${cardBg} p-3.5 shadow-xs`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-slate-500">Bệnh nhân đã đặt / Sức chứa</p>
              <p className="text-xl font-bold text-emerald-600 mt-0.5">
                {dailyStats.totalBooked} <span className="text-xs font-normal text-slate-400">/ {dailyStats.totalCapacity}</span>
              </p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
        </Card>

        <Card className={`${cardBg} p-3.5 shadow-xs`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-slate-500">Khung giờ còn chỗ</p>
              <p className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">{dailyStats.availableSlots}</p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
        </Card>

        <Card className={`${cardBg} p-3.5 shadow-xs`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-slate-500">Khung giờ đã đầy</p>
              <p className="text-xl font-bold text-rose-600 mt-0.5">{dailyStats.fullSlots}</p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 flex items-center justify-center">
              <XCircle className="w-4 h-4" />
            </div>
          </div>
        </Card>
      </div>

      {/* Filters Toolbar */}
      <Card className={`${cardBg} p-3.5 shadow-xs`}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
          {/* Doctor search */}
          <div className="relative w-full lg:col-span-2">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              type="text"
              placeholder="Tìm theo tên bác sĩ..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={`pl-8 text-xs h-9 rounded-lg ${isLight
                  ? 'bg-white border-slate-200 text-slate-900 placeholder:text-slate-400'
                  : 'bg-slate-950 border-slate-800 text-white placeholder:text-slate-500'
                }`}
            />
          </div>

          {/* Hospital select */}
          <select
            value={hospitalId}
            onChange={(e) => setHospitalId(e.target.value)}
            className={`border text-xs px-2.5 h-9 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 ${isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-950 border-slate-800 text-white'
              }`}
          >
            <option value="">Bệnh viện (Tất cả)</option>
            {hospitalsData?.items?.map((h: any) => (
              <option key={h.id} value={h.id}>
                {h.name}
              </option>
            ))}
          </select>

          {/* Specialty select */}
          <select
            value={specialtyId}
            onChange={(e) => setSpecialtyId(e.target.value)}
            className={`border text-xs px-2.5 h-9 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 ${isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-950 border-slate-800 text-white'
              }`}
          >
            <option value="">Chuyên khoa (Tất cả)</option>
            {specialtiesData?.items?.map((s: any) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>

          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={`border text-xs px-2.5 h-9 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 ${isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-950 border-slate-800 text-white'
              }`}
          >
            <option value="">Trạng thái slot (Tất cả)</option>
            <option value="available">Còn chỗ trống</option>
            <option value="full">Đã hết chỗ</option>
            <option value="locked">Đã khóa</option>
          </select>
        </div>
      </Card>

      {/* Shifts Breakdown (Medpro Layout) */}
      {isLoading ? (
        <Card className={`${cardBg} p-12 flex justify-center items-center shadow-xs`}>
          <div className="flex flex-col items-center gap-2 text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
            <span className="text-xs">Đang tải khung giờ khám trong ngày...</span>
          </div>
        </Card>
      ) : filteredSlots.length === 0 ? (
        <Card className={`${cardBg} p-12 text-center text-slate-500 shadow-xs`}>
          <div className="flex flex-col items-center gap-2 max-w-sm mx-auto">
            <AlertCircle className="w-8 h-8 text-amber-500" />
            <span className="font-semibold text-sm">Chưa có khung giờ khám nào cho ngày này</span>
            <p className="text-xs text-slate-400">
              Bạn có thể sử dụng nút <b>"Sinh khung giờ tự động"</b> để tạo hàng loạt slot khám từ lịch làm việc của bác sĩ.
            </p>
            <Button
              size="sm"
              onClick={() => setIsGenerateOpen(true)}
              className="mt-2 text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-white"
            >
              <Zap className="w-3.5 h-3.5 mr-1.5 fill-current" />
              Sinh khung giờ ngay
            </Button>
          </div>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Shift 1: Ca Sáng */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 pb-1 border-b border-slate-200 dark:border-slate-800">
              <Sun className="w-4 h-4 text-amber-500" />
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800 dark:text-slate-200">
                Ca Sáng (07:00 - 12:00) • <span className="font-normal text-slate-500">{groupedShifts.morning.length} khung giờ</span>
              </h3>
            </div>
            {groupedShifts.morning.length === 0 ? (
              <p className="text-xs text-slate-400 italic">Không có khung giờ khám ca sáng.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {groupedShifts.morning.map((slot) => renderSlotCard(slot))}
              </div>
            )}
          </div>

          {/* Shift 2: Ca Chiều */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 pb-1 border-b border-slate-200 dark:border-slate-800">
              <Sunset className="w-4 h-4 text-orange-500" />
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800 dark:text-slate-200">
                Ca Chiều (12:00 - 17:00) • <span className="font-normal text-slate-500">{groupedShifts.afternoon.length} khung giờ</span>
              </h3>
            </div>
            {groupedShifts.afternoon.length === 0 ? (
              <p className="text-xs text-slate-400 italic">Không có khung giờ khám ca chiều.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {groupedShifts.afternoon.map((slot) => renderSlotCard(slot))}
              </div>
            )}
          </div>

          {/* Shift 3: Ca Tối */}
          {groupedShifts.evening.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 pb-1 border-b border-slate-200 dark:border-slate-800">
                <Moon className="w-4 h-4 text-indigo-500" />
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800 dark:text-slate-200">
                  Ca Tối / Ngoài giờ (Sau 17:00) • <span className="font-normal text-slate-500">{groupedShifts.evening.length} khung giờ</span>
                </h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {groupedShifts.evening.map((slot) => renderSlotCard(slot))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Generate Slots Dialog */}
      <GenerateSlotsDialog
        open={isGenerateOpen}
        onClose={() => setIsGenerateOpen(false)}
        defaultHospitalId={hospitalId}
      />

      {/* Delete Slot Confirmation Modal */}
      {slotToDelete && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div
            className={`max-w-md w-full p-5 rounded-2xl border shadow-lg space-y-4 ${isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'
              }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm">Xóa khung giờ khám</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Chỉ xóa được khung giờ chưa có bệnh nhân đặt hẹn.
                </p>
              </div>
            </div>

            <div className={`p-3 rounded-xl border text-xs space-y-1 ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'}`}>
              <div>
                <span className="text-slate-500">Bác sĩ: </span>
                <span className="font-semibold">{slotToDelete.doctorWorkplace?.doctor?.fullName}</span>
              </div>
              <div>
                <span className="text-slate-500">Khung giờ: </span>
                <span className="font-semibold font-mono text-emerald-600">
                  {formatTimeStr(slotToDelete.startTime)} - {formatTimeStr(slotToDelete.endTime)}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSlotToDelete(null)}
                className={`text-xs rounded-xl ${isLight ? 'border-slate-200 text-slate-700' : 'border-slate-800 text-slate-300'}`}
              >
                Hủy bỏ
              </Button>
              <Button
                variant="destructive"
                size="sm"
                disabled={deleteSlotMutation.isPending}
                onClick={() => deleteSlotMutation.mutate(slotToDelete.id)}
                className="text-xs rounded-xl font-semibold bg-rose-600 hover:bg-rose-700 text-white"
              >
                {deleteSlotMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />}
                Xác nhận xóa
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // Render individual Slot Card
  function renderSlotCard(slot: any) {
    const doc = slot.doctorWorkplace?.doctor;
    const hosp = slot.doctorWorkplace?.hospital;
    const spec = slot.doctorWorkplace?.specialty;

    const booked = slot.bookedCount || 0;
    const cap = slot.capacity || 1;
    const isFull = booked >= cap;
    const isLocked = !slot.isAvailable || !slot.isActive;
    const percent = Math.min(100, Math.round((booked / cap) * 100));

    return (
      <div
        key={slot.id}
        className={`p-3 rounded-xl border text-xs space-y-2 transition ${isLocked
            ? 'opacity-65 bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800'
            : isLight
              ? 'bg-white border-slate-200 hover:border-emerald-300 shadow-xs'
              : 'bg-slate-950 border-slate-800 hover:border-emerald-700 shadow-xs'
          }`}
      >
        {/* Time and Status Badge */}
        <div className="flex items-center justify-between">
          <span className="font-mono font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            {formatTimeStr(slot.startTime)} - {formatTimeStr(slot.endTime)}
          </span>

          <span
            className={`px-2 py-0.5 rounded-md text-[10px] font-semibold ${isLocked
                ? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                : isFull
                  ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400'
                  : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
              }`}
          >
            {isLocked ? 'Đã khóa' : isFull ? 'Hết chỗ' : 'Còn chỗ'}
          </span>
        </div>

        {/* Doctor and Specialty */}
        <div className="space-y-0.5">
          <div className="font-semibold text-slate-900 dark:text-white truncate">
            {doc?.title ? `${doc.title} ` : 'BS. '}{doc?.fullName || 'N/A'}
          </div>
          <div className="text-[11px] text-slate-500 truncate">
            {spec?.name || 'Đa khoa'} • {hosp?.name || 'N/A'}
          </div>
        </div>

        {/* Capacity Progress Bar (Medpro style) */}
        <div className="space-y-1 pt-1 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-500">Tiến độ đặt:</span>
            <span className="font-bold">
              {booked} / {cap} <span className="font-normal text-slate-400">người</span>
            </span>
          </div>

          <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${isFull ? 'bg-rose-500' : percent > 50 ? 'bg-amber-500' : 'bg-emerald-500'
                }`}
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800 text-[11px]">
          {/* Capacity adjust buttons */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => handleAdjustCapacity(slot, -1)}
              disabled={cap <= 1 || cap <= booked}
              className="w-5 h-5 rounded flex items-center justify-center bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 disabled:opacity-40 text-slate-700 dark:text-slate-300"
              title="Giảm sức chứa"
            >
              <Minus className="w-3 h-3" />
            </button>
            <span className="font-mono text-[10px] px-1 font-semibold">{cap}</span>
            <button
              onClick={() => handleAdjustCapacity(slot, 1)}
              className="w-5 h-5 rounded flex items-center justify-center bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300"
              title="Tăng sức chứa"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>

          {/* Lock/Unlock & Delete buttons */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => handleToggleLock(slot)}
              className={`flex items-center gap-1 font-medium hover:underline ${slot.isAvailable ? 'text-amber-600' : 'text-emerald-600'
                }`}
            >
              {slot.isAvailable ? (
                <>
                  <Lock className="w-3 h-3" /> Khóa
                </>
              ) : (
                <>
                  <Unlock className="w-3 h-3" /> Mở
                </>
              )}
            </button>

            {booked === 0 && (
              <button
                onClick={() => setSlotToDelete(slot)}
                className="text-rose-500 hover:text-rose-700 p-0.5"
                title="Xóa slot"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }
}
