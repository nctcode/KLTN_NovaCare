'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService } from '@/services/admin.service';
import { useAdminTheme } from '@/components/admin/AdminThemeContext';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { DoctorScheduleDialog } from './DoctorScheduleDialog';
import {
  Calendar,
  Plus,
  Search,
  Building2,
  Stethoscope,
  Clock,
  Loader2,
  Edit,
  Power,
  MapPin,
  AlertCircle,
  Trash2,
  LayoutList,
  CalendarDays,
  UserCheck,
  CheckCircle2,
  XCircle,
  Coffee,
} from 'lucide-react';
import { toast } from 'sonner';

const DAYS_OF_WEEK = [
  { value: 1, label: 'Thứ 2', fullLabel: 'Thứ Hai' },
  { value: 2, label: 'Thứ 3', fullLabel: 'Thứ Ba' },
  { value: 3, label: 'Thứ 4', fullLabel: 'Thứ Tư' },
  { value: 4, label: 'Thứ 5', fullLabel: 'Thứ Năm' },
  { value: 5, label: 'Thứ 6', fullLabel: 'Thứ Sáu' },
  { value: 6, label: 'Thứ 7', fullLabel: 'Thứ Bảy' },
  { value: 0, label: 'Chủ Nhật', fullLabel: 'Chủ Nhật' },
];

const DAY_NAMES: Record<number, string> = {
  1: 'Thứ 2',
  2: 'Thứ 3',
  3: 'Thứ 4',
  4: 'Thứ 5',
  5: 'Thứ 6',
  6: 'Thứ 7',
  0: 'Chủ Nhật',
};

export function DoctorScheduleTab() {
  const queryClient = useQueryClient();
  const { theme } = useAdminTheme();
  const isLight = theme === 'light';

  // Filters & View mode
  const [viewMode, setViewMode] = useState<'table' | 'calendar'>('table');
  const [search, setSearch] = useState('');
  const [hospitalId, setHospitalId] = useState('');
  const [specialtyId, setSpecialtyId] = useState('');
  const [dayOfWeek, setDayOfWeek] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState('');

  // Dialog & Delete states
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<any>(null);
  const [scheduleToDelete, setScheduleToDelete] = useState<any>(null);

  // Styling helpers
  const cardBg = isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-800 text-white';
  const tableHeaderBg = isLight
    ? 'bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-xs'
    : 'bg-slate-950 border-b border-slate-800 text-slate-400 font-semibold text-xs';

  // Fetch Hospitals for filter dropdown
  const { data: hospitalsData } = useQuery({
    queryKey: ['admin-hospitals-filter-schedules'],
    queryFn: () => adminService.getHospitals({ limit: 100 }),
  });

  // Fetch Specialties for filter dropdown
  const { data: specialtiesData } = useQuery({
    queryKey: ['admin-specialties-filter-schedules'],
    queryFn: () => adminService.getSpecialties({ limit: 100 }),
  });

  // Fetch Doctor Schedules list
  const { data: schedules, isLoading } = useQuery({
    queryKey: ['admin-doctor-schedules', search, hospitalId, specialtyId, statusFilter, dayOfWeek],
    queryFn: () =>
      adminService.getDoctorSchedules({
        search,
        hospitalId,
        specialtyId,
        isActive: statusFilter,
        dayOfWeek: dayOfWeek !== '' ? Number(dayOfWeek) : undefined,
      }),
  });

  // Toggle active/inactive mutation
  const toggleMutation = useMutation({
    mutationFn: async ({ id, currentActive }: { id: string; currentActive: boolean }) => {
      return adminService.updateDoctorSchedule(id, { isActive: !currentActive });
    },
    onSuccess: () => {
      toast.success('Cập nhật trạng thái ca khám thành công');
      queryClient.invalidateQueries({ queryKey: ['admin-doctor-schedules'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Không thể thay đổi trạng thái');
    },
  });

  // Delete schedule mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return adminService.deleteDoctorSchedule(id);
    },
    onSuccess: () => {
      toast.success('Đã xóa ca khám thành công');
      queryClient.invalidateQueries({ queryKey: ['admin-doctor-schedules'] });
      setScheduleToDelete(null);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Không thể xóa ca khám');
    },
  });

  // Stats calculation
  const stats = useMemo(() => {
    if (!schedules || !Array.isArray(schedules)) {
      return { total: 0, active: 0, inactive: 0, doctorsCount: 0, hospitalsCount: 0 };
    }
    const total = schedules.length;
    const active = schedules.filter((s: any) => s.isActive).length;
    const inactive = total - active;
    const docIds = new Set(schedules.map((s: any) => s.doctorWorkplace?.doctorId).filter(Boolean));
    const hospIds = new Set(schedules.map((s: any) => s.doctorWorkplace?.hospitalId).filter(Boolean));
    return {
      total,
      active,
      inactive,
      doctorsCount: docIds.size,
      hospitalsCount: hospIds.size,
    };
  }, [schedules]);

  // Group schedules by day of week for calendar view
  const schedulesByDay = useMemo(() => {
    const map: Record<number, any[]> = { 1: [], 2: [], 3: [], 4: [], 5: [], 6: [], 0: [] };
    if (schedules && Array.isArray(schedules)) {
      schedules.forEach((s: any) => {
        if (map[s.dayOfWeek] !== undefined) {
          map[s.dayOfWeek].push(s);
        }
      });
    }
    return map;
  }, [schedules]);

  const handleOpenAdd = () => {
    setSelectedSchedule(null);
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (sched: any) => {
    setSelectedSchedule(sched);
    setIsDialogOpen(true);
  };

  const hasActiveFilters = Boolean(search || hospitalId || specialtyId || dayOfWeek !== '' || statusFilter);

  return (
    <div className="space-y-5">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-emerald-600" />
            Lịch khám định kỳ của Bác sĩ
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Quản lý các ca khám bệnh theo tuần của bác sĩ tại các cơ sở, bệnh viện và chuyên khoa.
          </p>
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto">
          {/* View Mode Switcher */}
          <div className={`p-1 rounded-xl border flex items-center gap-1 ${isLight ? 'bg-slate-100 border-slate-200' : 'bg-slate-900 border-slate-800'}`}>
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                viewMode === 'table'
                  ? isLight
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'bg-slate-800 text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <LayoutList className="w-3.5 h-3.5" />
              <span>Danh sách</span>
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                viewMode === 'calendar'
                  ? isLight
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'bg-slate-800 text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              <span>Lịch tuần</span>
            </button>
          </div>

          <Button
            onClick={handleOpenAdd}
            className="rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Thêm ca khám
          </Button>
        </div>
      </div>

      {/* Quick Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className={`${cardBg} p-3.5 shadow-xs`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-slate-500">Tổng ca khám</p>
              <p className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">{stats.total}</p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
        </Card>

        <Card className={`${cardBg} p-3.5 shadow-xs`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-slate-500">Đang hoạt động</p>
              <p className="text-xl font-bold text-emerald-600 mt-0.5">{stats.active}</p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
        </Card>

        <Card className={`${cardBg} p-3.5 shadow-xs`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-slate-500">Bác sĩ có lịch</p>
              <p className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">{stats.doctorsCount}</p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 flex items-center justify-center">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
        </Card>

        <Card className={`${cardBg} p-3.5 shadow-xs`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-slate-500">Cơ sở / Bệnh viện</p>
              <p className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">{stats.hospitalsCount}</p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
        </Card>
      </div>

      {/* Filter Toolbar */}
      <Card className={`${cardBg} p-3.5 shadow-xs`}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2.5">
          {/* Search Doctor */}
          <div className="relative w-full lg:col-span-2">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              type="text"
              placeholder="Tìm theo tên bác sĩ..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={`pl-8 text-xs h-9 rounded-lg ${
                isLight
                  ? 'bg-white border-slate-200 text-slate-900 placeholder:text-slate-400'
                  : 'bg-slate-950 border-slate-800 text-white placeholder:text-slate-500'
              }`}
            />
          </div>

          {/* Hospital Select */}
          <select
            value={hospitalId}
            onChange={(e) => setHospitalId(e.target.value)}
            className={`border text-xs px-2.5 h-9 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
              isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-950 border-slate-800 text-white'
            }`}
          >
            <option value="">Bệnh viện (Tất cả)</option>
            {hospitalsData?.items?.map((h: any) => (
              <option key={h.id} value={h.id}>
                {h.name}
              </option>
            ))}
          </select>

          {/* Specialty Select */}
          <select
            value={specialtyId}
            onChange={(e) => setSpecialtyId(e.target.value)}
            className={`border text-xs px-2.5 h-9 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
              isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-950 border-slate-800 text-white'
            }`}
          >
            <option value="">Chuyên khoa (Tất cả)</option>
            {specialtiesData?.items?.map((s: any) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>

          {/* Day of Week Select */}
          <select
            value={dayOfWeek}
            onChange={(e) => setDayOfWeek(e.target.value)}
            className={`border text-xs px-2.5 h-9 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
              isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-950 border-slate-800 text-white'
            }`}
          >
            <option value="">Thứ trong tuần (Tất cả)</option>
            {DAYS_OF_WEEK.map((d) => (
              <option key={d.value} value={d.value.toString()}>
                {d.fullLabel}
              </option>
            ))}
          </select>

          {/* Status Select */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={`border text-xs px-2.5 h-9 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
              isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-950 border-slate-800 text-white'
            }`}
          >
            <option value="">Trạng thái (Tất cả)</option>
            <option value="true">Đang hoạt động</option>
            <option value="false">Đã tắt</option>
          </select>
        </div>

        {hasActiveFilters && (
          <div className="flex items-center justify-between pt-2.5 mt-2.5 border-t border-slate-100 dark:border-slate-800 text-xs">
            <span className="text-slate-500">
              Đang áp dụng bộ lọc: hiển thị <b>{schedules?.length || 0}</b> ca khám phù hợp
            </span>
            <button
              onClick={() => {
                setSearch('');
                setHospitalId('');
                setSpecialtyId('');
                setDayOfWeek('');
                setStatusFilter('');
              }}
              className="text-emerald-600 hover:text-emerald-700 font-medium hover:underline"
            >
              Xóa bộ lọc
            </button>
          </div>
        )}
      </Card>

      {/* Main Content: Table View vs Calendar View */}
      {isLoading ? (
        <Card className={`${cardBg} p-12 flex justify-center items-center shadow-xs`}>
          <div className="flex flex-col items-center gap-2 text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
            <span className="text-xs">Đang tải lịch khám...</span>
          </div>
        </Card>
      ) : viewMode === 'table' ? (
        /* TABLE VIEW */
        <Card className={`${cardBg} overflow-hidden shadow-xs`}>
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className={tableHeaderBg}>
                <tr>
                  <th className="py-3 px-4">Bác sĩ</th>
                  <th className="py-3 px-4">Bệnh viện & Cơ sở</th>
                  <th className="py-3 px-4">Chuyên khoa</th>
                  <th className="py-3 px-4">Thứ làm việc</th>
                  <th className="py-3 px-4">Khung giờ</th>
                  <th className="py-3 px-4">Nghỉ giữa ca</th>
                  <th className="py-3 px-4">Trạng thái</th>
                  <th className="py-3 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isLight ? 'divide-slate-200' : 'divide-slate-800'}`}>
                {!schedules || schedules.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-500">
                      <div className="flex flex-col items-center gap-2">
                        <AlertCircle className="w-6 h-6 text-slate-400" />
                        <span>Chưa có ca khám nào phù hợp với bộ lọc hiện tại.</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  schedules.map((sched: any) => {
                    const wp = sched.doctorWorkplace;
                    const doc = wp?.doctor;
                    const hosp = wp?.hospital;
                    const branch = wp?.branch;
                    const spec = wp?.specialty;

                    return (
                      <tr
                        key={sched.id}
                        className={`transition ${isLight ? 'hover:bg-slate-50' : 'hover:bg-slate-800/40'}`}
                      >
                        {/* Doctor */}
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-900 dark:text-white">
                            {doc?.title ? `${doc.title} ` : 'BS. '}
                            {doc?.fullName || 'Chưa cập nhật'}
                          </div>
                          {doc?.qualification && (
                            <div className="text-[11px] text-slate-500">{doc.qualification}</div>
                          )}
                        </td>

                        {/* Hospital & Branch */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5 font-medium text-slate-800 dark:text-slate-200">
                            <Building2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>{hosp?.name || 'N/A'}</span>
                          </div>
                          <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-0.5">
                            <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>{branch?.name || branch?.address || 'Cơ sở chính'}</span>
                          </div>
                        </td>

                        {/* Specialty */}
                        <td className="py-3 px-4 text-slate-700 dark:text-slate-300">
                          <div className="flex items-center gap-1">
                            <Stethoscope className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                            <span>{spec?.name || 'Đa khoa'}</span>
                          </div>
                        </td>

                        {/* Day of Week */}
                        <td className="py-3 px-4 font-semibold text-emerald-700 dark:text-emerald-400">
                          {DAY_NAMES[sched.dayOfWeek] || `Thứ ${sched.dayOfWeek}`}
                        </td>

                        {/* Time */}
                        <td className="py-3 px-4 font-mono font-medium text-slate-900 dark:text-white">
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                            <span>
                              {sched.startTime} - {sched.endTime}
                            </span>
                          </div>
                        </td>

                        {/* Break */}
                        <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-400">
                          {sched.breakStart && sched.breakEnd ? (
                            <div className="flex items-center gap-1">
                              <Coffee className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span>
                                {sched.breakStart} - {sched.breakEnd}
                              </span>
                            </div>
                          ) : (
                            <span className="text-slate-400 italic">Không</span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium ${
                              sched.isActive
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800'
                                : 'bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                            }`}
                          >
                            {sched.isActive ? 'Hoạt động' : 'Tắt'}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-right space-x-1 whitespace-nowrap">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenEdit(sched)}
                            className={`h-7 px-2 text-xs rounded-lg ${
                              isLight ? 'border-slate-200 text-slate-700 hover:bg-slate-100' : 'border-slate-800 text-slate-300 hover:bg-slate-800'
                            }`}
                          >
                            <Edit className="w-3 h-3 mr-1 text-blue-500" /> Sửa
                          </Button>

                          <Button
                            variant="outline"
                            size="sm"
                            disabled={toggleMutation.isPending}
                            onClick={() =>
                              toggleMutation.mutate({ id: sched.id, currentActive: sched.isActive })
                            }
                            className={`h-7 px-2 text-xs rounded-lg ${
                              sched.isActive
                                ? isLight
                                  ? 'border-amber-200 text-amber-700 hover:bg-amber-50'
                                  : 'border-amber-800 text-amber-400 hover:bg-amber-950'
                                : isLight
                                ? 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                                : 'border-emerald-800 text-emerald-400 hover:bg-emerald-950'
                            }`}
                          >
                            <Power className="w-3 h-3 mr-1" />
                            {sched.isActive ? 'Tắt' : 'Bật'}
                          </Button>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setScheduleToDelete(sched)}
                            className="h-7 px-2 text-xs rounded-lg border-rose-200 text-rose-600 hover:bg-rose-50 dark:border-rose-900 dark:text-rose-400 dark:hover:bg-rose-950"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>
      ) : (
        /* WEEKLY CALENDAR GRID VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-3">
          {DAYS_OF_WEEK.map((day) => {
            const daySchedules = schedulesByDay[day.value] || [];
            return (
              <div
                key={day.value}
                className={`flex flex-col rounded-xl border overflow-hidden ${
                  isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
                }`}
              >
                {/* Column Day Header */}
                <div
                  className={`p-2.5 text-center border-b ${
                    isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
                  }`}
                >
                  <div className="font-bold text-xs text-slate-900 dark:text-white">{day.fullLabel}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">{daySchedules.length} ca khám</div>
                </div>

                {/* Column Items */}
                <div className="p-2 space-y-2 flex-1 overflow-y-auto max-h-[550px]">
                  {daySchedules.length === 0 ? (
                    <div className="p-4 text-center text-slate-400 text-[11px] italic">
                      Không có ca
                    </div>
                  ) : (
                    daySchedules.map((sched: any) => {
                      const wp = sched.doctorWorkplace;
                      const doc = wp?.doctor;
                      const hosp = wp?.hospital;
                      const spec = wp?.specialty;

                      return (
                        <div
                          key={sched.id}
                          className={`p-2.5 rounded-lg border text-xs space-y-1.5 transition ${
                            sched.isActive
                              ? isLight
                                ? 'bg-white border-slate-200 hover:border-emerald-300'
                                : 'bg-slate-950 border-slate-800 hover:border-emerald-700'
                              : 'opacity-60 bg-slate-50 border-slate-200 dark:bg-slate-900 dark:border-slate-800'
                          }`}
                        >
                          {/* Time tag */}
                          <div className="flex items-center justify-between">
                            <span className="font-mono font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                              <Clock className="w-3 h-3 text-amber-500" />
                              {sched.startTime} - {sched.endTime}
                            </span>
                            <span
                              className={`w-2 h-2 rounded-full ${
                                sched.isActive ? 'bg-emerald-500' : 'bg-slate-400'
                              }`}
                              title={sched.isActive ? 'Đang hoạt động' : 'Đã tắt'}
                            />
                          </div>

                          {/* Doctor */}
                          <div className="font-semibold text-slate-900 dark:text-white truncate">
                            {doc?.fullName || 'N/A'}
                          </div>

                          {/* Specialty & Hospital */}
                          <div className="text-[11px] text-slate-500 truncate">
                            {spec?.name || 'Đa khoa'} • {hosp?.name || 'N/A'}
                          </div>

                          {/* Break time */}
                          {sched.breakStart && sched.breakEnd && (
                            <div className="text-[10px] text-slate-400 flex items-center gap-1">
                              <Coffee className="w-2.5 h-2.5" />
                              <span>Nghỉ: {sched.breakStart}-{sched.breakEnd}</span>
                            </div>
                          )}

                          {/* Quick Actions */}
                          <div className="pt-1.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                            <button
                              onClick={() => handleOpenEdit(sched)}
                              className="text-[11px] font-medium text-blue-600 hover:underline flex items-center gap-0.5"
                            >
                              <Edit className="w-2.5 h-2.5" /> Sửa
                            </button>
                            <button
                              onClick={() =>
                                toggleMutation.mutate({ id: sched.id, currentActive: sched.isActive })
                              }
                              className={`text-[11px] font-medium hover:underline ${
                                sched.isActive ? 'text-amber-600' : 'text-emerald-600'
                              }`}
                            >
                              {sched.isActive ? 'Tắt' : 'Bật'}
                            </button>
                            <button
                              onClick={() => setScheduleToDelete(sched)}
                              className="text-[11px] font-medium text-rose-600 hover:underline"
                            >
                              Xóa
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Dialog for Add/Edit DoctorSchedule */}
      <DoctorScheduleDialog
        open={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        scheduleToEdit={selectedSchedule}
      />

      {/* Confirmation Modal for Delete */}
      {scheduleToDelete && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div
            className={`max-w-md w-full p-5 rounded-2xl border shadow-lg space-y-4 ${
              isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm">Xác nhận xóa ca khám</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Bạn có chắc muốn xóa ca làm việc này? Các slot chưa được đặt trong tương lai sẽ bị hủy bỏ.
                </p>
              </div>
            </div>

            <div className={`p-3 rounded-xl border text-xs space-y-1 ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'}`}>
              <div>
                <span className="text-slate-500">Bác sĩ: </span>
                <span className="font-semibold">{scheduleToDelete.doctorWorkplace?.doctor?.fullName}</span>
              </div>
              <div>
                <span className="text-slate-500">Thời gian: </span>
                <span className="font-semibold text-emerald-600">
                  {DAY_NAMES[scheduleToDelete.dayOfWeek]} ({scheduleToDelete.startTime} - {scheduleToDelete.endTime})
                </span>
              </div>
              <div>
                <span className="text-slate-500">Cơ sở: </span>
                <span>{scheduleToDelete.doctorWorkplace?.hospital?.name}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setScheduleToDelete(null)}
                className={`text-xs rounded-xl ${isLight ? 'border-slate-200 text-slate-700' : 'border-slate-800 text-slate-300'}`}
              >
                Hủy bỏ
              </Button>
              <Button
                variant="destructive"
                size="sm"
                disabled={deleteMutation.isPending}
                onClick={() => deleteMutation.mutate(scheduleToDelete.id)}
                className="text-xs rounded-xl font-semibold bg-rose-600 hover:bg-rose-700 text-white"
              >
                {deleteMutation.isPending ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                ) : (
                  <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                )}
                Xác nhận xóa
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
