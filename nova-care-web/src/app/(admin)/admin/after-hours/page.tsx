'use client';

import { useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Building2,
  CalendarClock,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  DoorOpen,
  Layers,
  Loader2,
  Moon,
  Plus,
  Save,
  Search,
  Sparkles,
  Stethoscope,
  Trash2,
  UserRound,
  Users,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { adminService } from '@/services/admin.service';
import { useAuthStore } from '@/stores/auth.store';
import { useAdminTheme } from '@/components/admin/AdminThemeContext';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

type RoomMode = 'SERVICE' | 'AFTER_HOURS';
type WorkspaceTab = 'ROOMS' | 'SESSIONS' | 'SPECIALTIES';

const ROOMS_PER_PAGE = 12;
const SESSIONS_PER_PAGE = 10;

const formatMoney = (value: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);

const formatDateShort = (value: string) =>
  new Intl.DateTimeFormat('vi-VN', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(value));

const formatTimeShort = (value: string) =>
  new Intl.DateTimeFormat('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));

const formatDateTime = (value: string) =>
  new Intl.DateTimeFormat('vi-VN', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));

const toVnDateKey = (value: string) => {
  const dt = new Date(new Date(value).getTime() + 7 * 60 * 60 * 1000);
  const y = dt.getUTCFullYear();
  const m = String(dt.getUTCMonth() + 1).padStart(2, '0');
  const d = String(dt.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

export default function ClinicRoomManagementPage() {
  const { user } = useAuthStore();
  const { theme } = useAdminTheme();
  const isLight = theme === 'light';
  const queryClient = useQueryClient();
  const isHospitalAdmin = user?.role === 'HOSPITAL_ADMIN';

  const [hospitalId, setHospitalId] = useState(isHospitalAdmin ? user?.hospitalId || '' : '');
  const [mode, setMode] = useState<RoomMode>('SERVICE');
  const [activeTab, setActiveTab] = useState<WorkspaceTab>('ROOMS');

  // State for After-Hours specialties
  const [enabledIds, setEnabledIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  // Filters & Pagination for Rooms
  const [roomSearch, setRoomSearch] = useState('');
  const [roomSpecialtyFilter, setRoomSpecialtyFilter] = useState('ALL');
  const [roomTypeFilter, setRoomTypeFilter] = useState<'ALL' | 'DV' | 'NG'>('ALL');
  const [roomPage, setRoomPage] = useState(1);

  // Filters & Pagination for Sessions
  const [sessionSearch, setSessionSearch] = useState('');
  const [sessionSpecialtyFilter, setSessionSpecialtyFilter] = useState('ALL');
  const [sessionDateFilter, setSessionDateFilter] = useState('ALL');
  const [sessionPage, setSessionPage] = useState(1);
  const [deletingSessionId, setDeletingSessionId] = useState<string | null>(null);

  // Dialogs
  const [createRoomOpen, setCreateRoomOpen] = useState(false);
  const [assignSessionOpen, setAssignSessionOpen] = useState(false);
  const [roomForm, setRoomForm] = useState({ specialtyId: '', code: '', name: '' });
  const [sessionForm, setSessionForm] = useState({
    specialtyId: '',
    medicalServiceId: '',
    roomId: '',
    slotId: '',
    capacity: 5,
  });

  const { data: hospitalsData } = useQuery({
    queryKey: ['clinic-room-hospitals'],
    queryFn: () => adminService.getHospitals({ limit: 100 }),
    enabled: !isHospitalAdmin,
  });
  const hospitals = hospitalsData?.items || (Array.isArray(hospitalsData) ? hospitalsData : []);

  useEffect(() => {
    if (!isHospitalAdmin && !hospitalId && hospitals.length) {
      setHospitalId(hospitals[0].id);
    }
  }, [hospitalId, hospitals, isHospitalAdmin]);

  const queryKey = ['clinic-room-management', hospitalId, mode];
  const { data: config, isLoading } = useQuery({
    queryKey,
    queryFn: () => adminService.getClinicRoomManagement(hospitalId, mode),
    enabled: !!hospitalId,
  });

  useEffect(() => {
    if (config?.specialties) {
      setEnabledIds(
        config.specialties.filter((item: any) => item.enabled).map((item: any) => item.id),
      );
    }
    setRoomForm({ specialtyId: '', code: '', name: '' });
    setSessionForm({ specialtyId: '', medicalServiceId: '', roomId: '', slotId: '', capacity: 5 });
    setRoomPage(1);
    setSessionPage(1);
    setSessionDateFilter('ALL');
    setRoomTypeFilter(mode === 'AFTER_HOURS' ? 'NG' : 'DV');
    if (mode === 'SERVICE' && activeTab === 'SPECIALTIES') {
      setActiveTab('ROOMS');
    }
  }, [config, mode]);

  const specialtiesMap = useMemo(() => {
    const map = new Map<string, string>();
    (config?.specialties || []).forEach((s: any) => map.set(s.id, s.name));
    return map;
  }, [config?.specialties]);

  const enabledSpecialties = useMemo(
    () =>
      (config?.specialties || []).filter(
        (item: any) => mode === 'SERVICE' || enabledIds.includes(item.id),
      ),
    [config, enabledIds, mode],
  );

  // Count sessions per room for badges
  const sessionCountByRoom = useMemo(() => {
    const counts = new Map<string, number>();
    (config?.sessions || []).forEach((s: any) => {
      if (s.roomId) counts.set(s.roomId, (counts.get(s.roomId) || 0) + 1);
    });
    return counts;
  }, [config?.sessions]);

  // Filtered rooms + pagination
  const filteredRoomsList = useMemo(() => {
    const q = roomSearch.trim().toLowerCase();
    return (config?.rooms || []).filter((room: any) => {
      if (roomSpecialtyFilter !== 'ALL' && room.specialtyId !== roomSpecialtyFilter) return false;
      const codeUpper = String(room.code || '').toUpperCase();
      if (roomTypeFilter === 'DV' && codeUpper.startsWith('NG-')) return false;
      if (roomTypeFilter === 'NG' && codeUpper.startsWith('DV-')) return false;
      if (q) {
        const specName = (specialtiesMap.get(room.specialtyId) || '').toLowerCase();
        return (
          codeUpper.toLowerCase().includes(q) ||
          String(room.name || '').toLowerCase().includes(q) ||
          specName.includes(q)
        );
      }
      return true;
    });
  }, [config?.rooms, roomSearch, roomSpecialtyFilter, roomTypeFilter, specialtiesMap]);

  const totalRoomPages = Math.max(1, Math.ceil(filteredRoomsList.length / ROOMS_PER_PAGE));
  const paginatedRooms = useMemo(() => {
    const start = (roomPage - 1) * ROOMS_PER_PAGE;
    return filteredRoomsList.slice(start, start + ROOMS_PER_PAGE);
  }, [filteredRoomsList, roomPage]);

  // Available dates in sessions for date dropdown filter
  const sessionDates = useMemo(() => {
    const set = new Set<string>();
    (config?.sessions || []).forEach((s: any) => {
      if (s.slot?.startTime) set.add(toVnDateKey(s.slot.startTime));
    });
    return Array.from(set).sort();
  }, [config?.sessions]);

  // Filtered sessions + pagination
  const filteredSessionsList = useMemo(() => {
    const q = sessionSearch.trim().toLowerCase();
    return (config?.sessions || []).filter((session: any) => {
      if (
        sessionSpecialtyFilter !== 'ALL' &&
        session.service?.specialtyId !== sessionSpecialtyFilter
      ) {
        return false;
      }
      if (sessionDateFilter !== 'ALL' && session.slot?.startTime) {
        if (toVnDateKey(session.slot.startTime) !== sessionDateFilter) return false;
      }
      if (q) {
        const hay = [
          session.room?.code,
          session.room?.name,
          session.service?.name,
          session.service?.specialty?.name,
          session.slot?.doctorWorkplace?.doctor?.fullName,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        return hay.includes(q);
      }
      return true;
    });
  }, [config?.sessions, sessionSearch, sessionSpecialtyFilter, sessionDateFilter]);

  const totalSessionPages = Math.max(
    1,
    Math.ceil(filteredSessionsList.length / SESSIONS_PER_PAGE),
  );
  const paginatedSessions = useMemo(() => {
    const start = (sessionPage - 1) * SESSIONS_PER_PAGE;
    return filteredSessionsList.slice(start, start + SESSIONS_PER_PAGE);
  }, [filteredSessionsList, sessionPage]);

  // Cascading form selectors for Assign Session dialog
  const formServices = (config?.services || []).filter(
    (item: any) => item.specialtyId === sessionForm.specialtyId,
  );
  const formRooms = (config?.rooms || []).filter(
    (item: any) => item.specialtyId === sessionForm.specialtyId,
  );
  const formSlots = (config?.candidateSlots || []).filter(
    (item: any) =>
      item.doctorWorkplace?.specialtyId === sessionForm.specialtyId &&
      item.compatibleServiceIds?.includes(sessionForm.medicalServiceId),
  );

  const reload = async () => queryClient.invalidateQueries({ queryKey });

  const saveSpecialties = async () => {
    setSaving(true);
    try {
      await adminService.saveAfterHoursSpecialties(hospitalId, enabledIds);
      toast.success('Đã lưu cấu hình chuyên khoa khám ngoài giờ');
      await reload();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Không thể lưu cấu hình');
    } finally {
      setSaving(false);
    }
  };

  const createRoom = async () => {
    if (!roomForm.specialtyId || !roomForm.code.trim() || !roomForm.name.trim()) {
      return toast.error('Vui lòng nhập đầy đủ chuyên khoa, mã phòng và tên phòng');
    }
    setSaving(true);
    try {
      await adminService.createClinicRoom({
        hospitalId,
        specialtyId: roomForm.specialtyId,
        code: roomForm.code.trim().toUpperCase(),
        name: roomForm.name.trim(),
      });
      setRoomForm({ specialtyId: '', code: '', name: '' });
      setCreateRoomOpen(false);
      toast.success('Đã thêm phòng khám thực tế thành công');
      await reload();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Không thể tạo phòng khám');
    } finally {
      setSaving(false);
    }
  };

  const assignSession = async () => {
    const { specialtyId: _specialtyId, ...payload } = sessionForm;
    if (!payload.medicalServiceId || !payload.roomId || !payload.slotId) {
      return toast.error('Vui lòng chọn đủ dịch vụ, phòng khám và khung giờ');
    }
    setSaving(true);
    try {
      await adminService.assignClinicRoomSession({ ...payload, mode });
      setSessionForm({ specialtyId: '', medicalServiceId: '', roomId: '', slotId: '', capacity: 5 });
      setAssignSessionOpen(false);
      toast.success(
        mode === 'SERVICE' ? 'Đã phân phòng khám cho dịch vụ' : 'Đã mở ca khám ngoài giờ',
      );
      await reload();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Không thể phân phòng khám');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    setDeletingSessionId(sessionId);
    try {
      await adminService.deleteAfterHoursSession(sessionId);
      toast.success('Đã xóa lịch phân phòng khám');
      await reload();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Không thể xóa phiên khám này');
    } finally {
      setDeletingSessionId(null);
    }
  };

  // Theme helper classes matching NovaCare Admin design system
  const cardSurface = isLight
    ? 'bg-white border-slate-200/90 shadow-xs'
    : 'bg-slate-900 border-slate-800';
  const inputSurface = isLight
    ? 'bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15'
    : 'bg-slate-950 border-slate-700 text-slate-100 placeholder:text-slate-500 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20';
  const mutedText = isLight ? 'text-slate-500' : 'text-slate-400';
  const primaryBtn =
    'inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-xs transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer';
  const secondaryBtn = isLight
    ? 'inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 cursor-pointer'
    : 'inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2 text-xs font-semibold text-slate-200 transition hover:bg-slate-700 cursor-pointer';

  const totalRoomsCount = (config?.rooms || []).length;
  const totalSessionsCount = (config?.sessions || []).length;
  const totalServicesCount = (config?.services || []).length;
  const totalSpecialtiesCount = (config?.specialties || []).length;

  return (
    <div className="space-y-5 pb-8">
      {/* Header Banner */}
      <div className={`rounded-2xl border p-5 sm:p-6 ${cardSurface}`}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
              <DoorOpen className="h-3.5 w-3.5" />
              <span>Điều phối hạ tầng phòng khám</span>
            </div>
            <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
              Quản lý Phòng khám &amp; Dịch vụ
            </h1>
            <p className={`max-w-2xl text-sm ${mutedText}`}>
              Quản lý danh mục phòng khám thực tế, cấu hình chuyên khoa và phân ca khám dịch vụ
              hoặc khám ngoài giờ cuối tuần cho từng cơ sở y tế.
            </p>
          </div>

          <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
            {!isHospitalAdmin && (
              <div className="relative min-w-[260px]">
                <Building2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-600" />
                <select
                  value={hospitalId}
                  onChange={(e) => setHospitalId(e.target.value)}
                  className={`h-10 w-full appearance-none rounded-xl border pl-9 pr-8 text-sm font-medium outline-none transition ${inputSurface}`}
                >
                  <option value="">Chọn cơ sở y tế...</option>
                  {hospitals.map((item: any) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Mode Segmented Switcher */}
            <div
              className={`inline-flex rounded-xl border p-1 ${
                isLight ? 'border-slate-200 bg-slate-100/80' : 'border-slate-800 bg-slate-950'
              }`}
            >
              <button
                type="button"
                onClick={() => setMode('SERVICE')}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-semibold transition cursor-pointer ${
                  mode === 'SERVICE'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : isLight
                      ? 'text-slate-600 hover:text-slate-900'
                      : 'text-slate-400 hover:text-white'
                }`}
              >
                <Stethoscope className="h-3.5 w-3.5" />
                Khám dịch vụ
              </button>
              <button
                type="button"
                onClick={() => setMode('AFTER_HOURS')}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-semibold transition cursor-pointer ${
                  mode === 'AFTER_HOURS'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : isLight
                      ? 'text-slate-600 hover:text-slate-900'
                      : 'text-slate-400 hover:text-white'
                }`}
              >
                <Moon className="h-3.5 w-3.5" />
                Khám ngoài giờ
              </button>
            </div>
          </div>
        </div>
      </div>

      {!hospitalId ? (
        <div className={`rounded-2xl border border-dashed p-12 text-center ${cardSurface}`}>
          <Building2 className="mx-auto mb-3 h-10 w-10 text-slate-300" />
          <p className="font-semibold">Chưa chọn cơ sở y tế</p>
          <p className={`mt-1 text-sm ${mutedText}`}>
            Vui lòng chọn một bệnh viện ở góc trên bên phải để xem và quản lý phòng khám.
          </p>
        </div>
      ) : isLoading ? (
        <div className={`flex flex-col items-center justify-center rounded-2xl border p-16 ${cardSurface}`}>
          <Loader2 className="h-7 w-7 animate-spin text-emerald-600" />
          <p className={`mt-3 text-sm ${mutedText}`}>Đang tải dữ liệu phòng khám...</p>
        </div>
      ) : (
        <>
          {/* Compact KPI Strip */}
          <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
            <div className={`rounded-2xl border p-4 ${cardSurface}`}>
              <div className="flex items-center justify-between">
                <span className={`text-xs font-medium ${mutedText}`}>Phòng khám thực tế</span>
                <div className="rounded-lg bg-emerald-500/10 p-1.5 text-emerald-600">
                  <DoorOpen className="h-4 w-4" />
                </div>
              </div>
              <p className="mt-2 text-2xl font-bold tracking-tight">{totalRoomsCount}</p>
              <p className={`mt-0.5 text-xs ${mutedText}`}>Đang hoạt động tại cơ sở</p>
            </div>

            <div className={`rounded-2xl border p-4 ${cardSurface}`}>
              <div className="flex items-center justify-between">
                <span className={`text-xs font-medium ${mutedText}`}>
                  {mode === 'AFTER_HOURS' ? 'Chuyên khoa ngoài giờ' : 'Chuyên khoa áp dụng'}
                </span>
                <div className="rounded-lg bg-sky-500/10 p-1.5 text-sky-600">
                  <Layers className="h-4 w-4" />
                </div>
              </div>
              <p className="mt-2 text-2xl font-bold tracking-tight">
                {enabledSpecialties.length}
                <span className={`text-sm font-medium ${mutedText}`}>/{totalSpecialtiesCount}</span>
              </p>
              <p className={`mt-0.5 text-xs ${mutedText}`}>Chuyên khoa đã kích hoạt</p>
            </div>

            <div className={`rounded-2xl border p-4 ${cardSurface}`}>
              <div className="flex items-center justify-between">
                <span className={`text-xs font-medium ${mutedText}`}>Dịch vụ khám</span>
                <div className="rounded-lg bg-amber-500/10 p-1.5 text-amber-600">
                  <Sparkles className="h-4 w-4" />
                </div>
              </div>
              <p className="mt-2 text-2xl font-bold tracking-tight">{totalServicesCount}</p>
              <p className={`mt-0.5 text-xs ${mutedText}`}>
                {mode === 'AFTER_HOURS'
                  ? `Đồng giá ${formatMoney(config?.fixedPrice || 270000)} · ${config?.duration || 60}p`
                  : 'Gói & dịch vụ theo chuyên khoa'}
              </p>
            </div>

            <div className={`rounded-2xl border p-4 ${cardSurface}`}>
              <div className="flex items-center justify-between">
                <span className={`text-xs font-medium ${mutedText}`}>Phiên khám sắp tới</span>
                <div className="rounded-lg bg-violet-500/10 p-1.5 text-violet-600">
                  <CalendarClock className="h-4 w-4" />
                </div>
              </div>
              <p className="mt-2 text-2xl font-bold tracking-tight">{totalSessionsCount}</p>
              <p className={`mt-0.5 text-xs ${mutedText}`}>
                {mode === 'AFTER_HOURS' ? 'Lịch Thứ 7 & Chủ nhật' : 'Lịch dịch vụ đã mở đặt'}
              </p>
            </div>
          </div>

          {/* Workspace Sub-Navigation Tabs + Quick Actions */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('ROOMS')}
                className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition cursor-pointer ${
                  activeTab === 'ROOMS'
                    ? isLight
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-emerald-600 text-white'
                    : isLight
                      ? 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      : 'border border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <DoorOpen className="h-3.5 w-3.5" />
                Danh mục phòng khám
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[11px] ${
                    activeTab === 'ROOMS'
                      ? 'bg-white/20 text-white'
                      : isLight
                        ? 'bg-slate-100 text-slate-600'
                        : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {totalRoomsCount}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('SESSIONS')}
                className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition cursor-pointer ${
                  activeTab === 'SESSIONS'
                    ? isLight
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-emerald-600 text-white'
                    : isLight
                      ? 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      : 'border border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <CalendarClock className="h-3.5 w-3.5" />
                Lịch phân ca khám
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[11px] ${
                    activeTab === 'SESSIONS'
                      ? 'bg-white/20 text-white'
                      : isLight
                        ? 'bg-slate-100 text-slate-600'
                        : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {totalSessionsCount}
                </span>
              </button>

              {mode === 'AFTER_HOURS' && (
                <button
                  type="button"
                  onClick={() => setActiveTab('SPECIALTIES')}
                  className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition cursor-pointer ${
                    activeTab === 'SPECIALTIES'
                      ? isLight
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'bg-emerald-600 text-white'
                      : isLight
                        ? 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                        : 'border border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <Moon className="h-3.5 w-3.5" />
                  Chuyên khoa ngoài giờ
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-[11px] ${
                      activeTab === 'SPECIALTIES'
                        ? 'bg-white/20 text-white'
                        : isLight
                          ? 'bg-slate-100 text-slate-600'
                          : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {enabledIds.length}/{totalSpecialtiesCount}
                  </span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              {activeTab === 'ROOMS' && (
                <button
                  type="button"
                  onClick={() => setCreateRoomOpen(true)}
                  className={primaryBtn}
                >
                  <Plus className="h-4 w-4" />
                  Thêm phòng khám
                </button>
              )}
              {activeTab === 'SESSIONS' && (
                <button
                  type="button"
                  onClick={() => setAssignSessionOpen(true)}
                  className={primaryBtn}
                >
                  <Plus className="h-4 w-4" />
                  Phân ca phòng khám
                </button>
              )}
              {activeTab === 'SPECIALTIES' && mode === 'AFTER_HOURS' && (
                <button
                  type="button"
                  onClick={saveSpecialties}
                  disabled={saving}
                  className={primaryBtn}
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Lưu cấu hình
                </button>
              )}
            </div>
          </div>

          {/* TAB 1: ROOMS DIRECTORY */}
          {activeTab === 'ROOMS' && (
            <div className={`rounded-2xl border ${cardSurface}`}>
              {/* Filter bar */}
              <div
                className={`flex flex-col gap-3 border-b p-4 md:flex-row md:items-center md:justify-between ${
                  isLight ? 'border-slate-100' : 'border-slate-800'
                }`}
              >
                <div className="flex flex-1 flex-col gap-2.5 sm:flex-row sm:items-center">
                  <div className="relative flex-1 sm:max-w-xs">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={roomSearch}
                      onChange={(e) => {
                        setRoomSearch(e.target.value);
                        setRoomPage(1);
                      }}
                      placeholder="Tìm mã phòng, tên phòng..."
                      className={`h-9 w-full rounded-xl border pl-9 pr-3 text-sm outline-none transition ${inputSurface}`}
                    />
                  </div>

                  <select
                    value={roomSpecialtyFilter}
                    onChange={(e) => {
                      setRoomSpecialtyFilter(e.target.value);
                      setRoomPage(1);
                    }}
                    className={`h-9 rounded-xl border px-3 text-xs font-medium outline-none transition ${inputSurface}`}
                  >
                    <option value="ALL">Tất cả chuyên khoa</option>
                    {(config?.specialties || []).map((item: any) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Room group quick pill */}
                <div
                  className={`inline-flex rounded-xl border p-0.5 text-xs ${
                    isLight ? 'border-slate-200 bg-slate-50' : 'border-slate-800 bg-slate-950'
                  }`}
                >
                  {[
                    { key: 'ALL', label: 'Tất cả' },
                    { key: 'DV', label: 'Dịch vụ (DV)' },
                    { key: 'NG', label: 'Ngoài giờ (NG)' },
                  ].map((item) => (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => {
                        setRoomTypeFilter(item.key as 'ALL' | 'DV' | 'NG');
                        setRoomPage(1);
                      }}
                      className={`rounded-lg px-2.5 py-1.5 font-medium transition cursor-pointer ${
                        roomTypeFilter === item.key
                          ? isLight
                            ? 'bg-white text-emerald-700 shadow-xs'
                            : 'bg-slate-800 text-emerald-400'
                          : mutedText
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Rooms Grid */}
              <div className="p-4">
                {paginatedRooms.length === 0 ? (
                  <div className="py-12 text-center">
                    <DoorOpen className="mx-auto mb-2.5 h-9 w-9 text-slate-300" />
                    <p className="text-sm font-semibold">Không tìm thấy phòng khám phù hợp</p>
                    <p className={`mt-1 text-xs ${mutedText}`}>
                      Thử đổi bộ lọc hoặc bấm &ldquo;Thêm phòng khám&rdquo; để tạo mới.
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {paginatedRooms.map((room: any) => {
                      const isAfterHoursRoom = String(room.code || '')
                        .toUpperCase()
                        .startsWith('NG-');
                      const specName = specialtiesMap.get(room.specialtyId) || 'Chuyên khoa';
                      const count = sessionCountByRoom.get(room.id) || 0;
                      return (
                        <div
                          key={room.id}
                          className={`group flex flex-col justify-between rounded-xl border p-4 transition ${
                            isLight
                              ? 'border-slate-200/80 bg-slate-50/40 hover:border-emerald-300 hover:bg-white hover:shadow-xs'
                              : 'border-slate-800 bg-slate-950/60 hover:border-emerald-700'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span
                              className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold ${
                                isAfterHoursRoom
                                  ? 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300'
                                  : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                              }`}
                            >
                              {isAfterHoursRoom ? (
                                <Moon className="h-3 w-3" />
                              ) : (
                                <DoorOpen className="h-3 w-3" />
                              )}
                              {room.code}
                            </span>
                            <span
                              className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                                count > 0
                                  ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                                  : isLight
                                    ? 'bg-slate-100 text-slate-500'
                                    : 'bg-slate-800 text-slate-400'
                              }`}
                            >
                              {count} phiên đang mở
                            </span>
                          </div>

                          <div className="mt-3">
                            <p className="line-clamp-1 text-sm font-semibold">{room.name}</p>
                            <p className={`mt-1 flex items-center gap-1.5 text-xs ${mutedText}`}>
                              <Stethoscope className="h-3.5 w-3.5 text-emerald-600" />
                              <span>{specName}</span>
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Rooms Pagination */}
              {filteredRoomsList.length > ROOMS_PER_PAGE && (
                <div
                  className={`flex items-center justify-between border-t px-4 py-3 text-xs ${
                    isLight ? 'border-slate-100 text-slate-500' : 'border-slate-800 text-slate-400'
                  }`}
                >
                  <span>
                    Hiển thị {(roomPage - 1) * ROOMS_PER_PAGE + 1}–
                    {Math.min(roomPage * ROOMS_PER_PAGE, filteredRoomsList.length)} /{' '}
                    {filteredRoomsList.length} phòng khám
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      disabled={roomPage <= 1}
                      onClick={() => setRoomPage((p) => Math.max(1, p - 1))}
                      className={`${secondaryBtn} !px-2.5 !py-1.5 disabled:opacity-40`}
                    >
                      <ChevronLeft className="h-3.5 w-3.5" />
                    </button>
                    <span className="px-2 font-semibold">
                      {roomPage} / {totalRoomPages}
                    </span>
                    <button
                      type="button"
                      disabled={roomPage >= totalRoomPages}
                      onClick={() => setRoomPage((p) => Math.min(totalRoomPages, p + 1))}
                      className={`${secondaryBtn} !px-2.5 !py-1.5 disabled:opacity-40`}
                    >
                      <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: SESSIONS SCHEDULE TABLE */}
          {activeTab === 'SESSIONS' && (
            <div className={`overflow-hidden rounded-2xl border ${cardSurface}`}>
              {/* Filter Toolbar */}
              <div
                className={`flex flex-col gap-3 border-b p-4 md:flex-row md:items-center md:justify-between ${
                  isLight ? 'border-slate-100' : 'border-slate-800'
                }`}
              >
                <div className="flex flex-1 flex-wrap items-center gap-2.5">
                  <div className="relative min-w-[220px] flex-1 sm:max-w-xs">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={sessionSearch}
                      onChange={(e) => {
                        setSessionSearch(e.target.value);
                        setSessionPage(1);
                      }}
                      placeholder="Tìm dịch vụ, bác sĩ, phòng..."
                      className={`h-9 w-full rounded-xl border pl-9 pr-3 text-sm outline-none transition ${inputSurface}`}
                    />
                  </div>

                  <select
                    value={sessionSpecialtyFilter}
                    onChange={(e) => {
                      setSessionSpecialtyFilter(e.target.value);
                      setSessionPage(1);
                    }}
                    className={`h-9 rounded-xl border px-3 text-xs font-medium outline-none transition ${inputSurface}`}
                  >
                    <option value="ALL">Tất cả chuyên khoa</option>
                    {enabledSpecialties.map((item: any) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select>

                  <select
                    value={sessionDateFilter}
                    onChange={(e) => {
                      setSessionDateFilter(e.target.value);
                      setSessionPage(1);
                    }}
                    className={`h-9 rounded-xl border px-3 text-xs font-medium outline-none transition ${inputSurface}`}
                  >
                    <option value="ALL">Tất cả ngày ({sessionDates.length})</option>
                    {sessionDates.map((d) => (
                      <option key={d} value={d}>
                        {d.split('-').reverse().join('/')}
                      </option>
                    ))}
                  </select>

                  {(sessionSearch || sessionSpecialtyFilter !== 'ALL' || sessionDateFilter !== 'ALL') && (
                    <button
                      type="button"
                      onClick={() => {
                        setSessionSearch('');
                        setSessionSpecialtyFilter('ALL');
                        setSessionDateFilter('ALL');
                        setSessionPage(1);
                      }}
                      className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium transition cursor-pointer ${
                        isLight
                          ? 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
                          : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <X className="h-3.5 w-3.5" />
                      Xóa lọc
                    </button>
                  )}
                </div>

                <span className={`text-xs font-medium ${mutedText}`}>
                  {filteredSessionsList.length} phiên khám
                </span>
              </div>

              {/* Clean Responsive Data Table */}
              {paginatedSessions.length === 0 ? (
                <div className="py-14 text-center">
                  <CalendarClock className="mx-auto mb-2.5 h-9 w-9 text-slate-300" />
                  <p className="text-sm font-semibold">Chưa có phiên khám nào phù hợp</p>
                  <p className={`mt-1 text-xs ${mutedText}`}>
                    Bấm &ldquo;Phân ca phòng khám&rdquo; để gán dịch vụ vào phòng khám và khung giờ thực tế.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead
                      className={`border-b text-xs font-semibold uppercase tracking-wider ${
                        isLight
                          ? 'border-slate-100 bg-slate-50/70 text-slate-500'
                          : 'border-slate-800 bg-slate-950/60 text-slate-400'
                      }`}
                    >
                      <tr>
                        <th className="px-4 py-3">Dịch vụ &amp; Chuyên khoa</th>
                        <th className="px-4 py-3">Phòng khám</th>
                        <th className="px-4 py-3">Bác sĩ trực</th>
                        <th className="px-4 py-3">Thời gian</th>
                        <th className="px-4 py-3 text-center">Đã đặt</th>
                        <th className="px-4 py-3 text-right">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody
                      className={`divide-y ${isLight ? 'divide-slate-100' : 'divide-slate-800/80'}`}
                    >
                      {paginatedSessions.map((session: any) => {
                        const booked = session.slot?.bookedCount ?? 0;
                        const cap = session.slot?.capacity ?? 1;
                        return (
                          <tr
                            key={session.id}
                            className={`transition ${
                              isLight ? 'hover:bg-slate-50/70' : 'hover:bg-slate-800/40'
                            }`}
                          >
                            <td className="px-4 py-3">
                              <p className="font-semibold leading-snug">
                                {session.service?.name}
                              </p>
                              <div className={`mt-0.5 flex items-center gap-2 text-xs ${mutedText}`}>
                                <span>{session.service?.specialty?.name}</span>
                                <span>·</span>
                                <span className="font-medium text-emerald-600 dark:text-emerald-400">
                                  {formatMoney(Number(session.service?.price || 0))}
                                </span>
                                <span>· {session.service?.duration || 30}p</span>
                              </div>
                            </td>

                            <td className="px-4 py-3">
                              <span
                                className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-bold ${
                                  mode === 'AFTER_HOURS'
                                    ? 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300'
                                    : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                                }`}
                              >
                                {session.room?.code}
                              </span>
                              <p className={`mt-0.5 max-w-[190px] truncate text-xs ${mutedText}`}>
                                {session.room?.name}
                              </p>
                            </td>

                            <td className="px-4 py-3">
                              <div className="flex items-center gap-1.5 text-xs font-medium">
                                <UserRound className="h-3.5 w-3.5 text-slate-400" />
                                <span>
                                  {session.slot?.doctorWorkplace?.doctor?.title
                                    ? `${session.slot.doctorWorkplace.doctor.title} `
                                    : ''}
                                  {session.slot?.doctorWorkplace?.doctor?.fullName || '—'}
                                </span>
                              </div>
                            </td>

                            <td className="px-4 py-3 whitespace-nowrap">
                              <p className="text-xs font-semibold">
                                {session.slot?.startTime ? formatDateShort(session.slot.startTime) : '—'}
                              </p>
                              <p className={`mt-0.5 flex items-center gap-1 text-xs ${mutedText}`}>
                                <Clock className="h-3 w-3" />
                                {session.slot?.startTime ? formatTimeShort(session.slot.startTime) : ''}
                              </p>
                            </td>

                            <td className="px-4 py-3 text-center">
                              <span
                                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                                  booked >= cap
                                    ? 'bg-rose-500/10 text-rose-600'
                                    : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                                }`}
                              >
                                <Users className="h-3 w-3" />
                                {booked}/{cap}
                              </span>
                            </td>

                            <td className="px-4 py-3 text-right">
                              <button
                                type="button"
                                disabled={booked > 0 || deletingSessionId === session.id}
                                title={
                                  booked > 0
                                    ? 'Không thể xóa phiên đã có bệnh nhân đặt'
                                    : 'Xóa lịch phân phòng'
                                }
                                onClick={() => handleDeleteSession(session.id)}
                                className={`inline-flex h-8 w-8 items-center justify-center rounded-lg border transition cursor-pointer disabled:cursor-not-allowed disabled:opacity-40 ${
                                  isLight
                                    ? 'border-slate-200 text-slate-500 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600'
                                    : 'border-slate-700 text-slate-400 hover:border-rose-800 hover:bg-rose-950 hover:text-rose-400'
                                }`}
                              >
                                {deletingSessionId === session.id ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <Trash2 className="h-3.5 w-3.5" />
                                )}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Sessions Pagination */}
              {filteredSessionsList.length > SESSIONS_PER_PAGE && (
                <div
                  className={`flex items-center justify-between border-t px-4 py-3 text-xs ${
                    isLight ? 'border-slate-100 text-slate-500' : 'border-slate-800 text-slate-400'
                  }`}
                >
                  <span>
                    Hiển thị {(sessionPage - 1) * SESSIONS_PER_PAGE + 1}–
                    {Math.min(sessionPage * SESSIONS_PER_PAGE, filteredSessionsList.length)} /{' '}
                    {filteredSessionsList.length} phiên khám
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      disabled={sessionPage <= 1}
                      onClick={() => setSessionPage((p) => Math.max(1, p - 1))}
                      className={`${secondaryBtn} !px-2.5 !py-1.5 disabled:opacity-40`}
                    >
                      <ChevronLeft className="h-3.5 w-3.5" />
                    </button>
                    <span className="px-2 font-semibold">
                      {sessionPage} / {totalSessionPages}
                    </span>
                    <button
                      type="button"
                      disabled={sessionPage >= totalSessionPages}
                      onClick={() => setSessionPage((p) => Math.min(totalSessionPages, p + 1))}
                      className={`${secondaryBtn} !px-2.5 !py-1.5 disabled:opacity-40`}
                    >
                      <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: AFTER-HOURS SPECIALTY CONFIGURATION */}
          {activeTab === 'SPECIALTIES' && mode === 'AFTER_HOURS' && (
            <div className={`rounded-2xl border p-5 ${cardSurface}`}>
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-base font-bold">Chuyên khoa cho phép khám ngoài giờ</h2>
                  <p className={`mt-0.5 text-xs ${mutedText}`}>
                    Áp dụng vào Thứ 7 &amp; Chủ nhật với mức giá đồng nhất{' '}
                    <span className="font-semibold text-emerald-600">
                      {formatMoney(config?.fixedPrice || 270000)}
                    </span>{' '}
                    ({config?.duration || 60} phút). Ứng dụng di động chỉ hiển thị các chuyên khoa được bật.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setEnabledIds((config?.specialties || []).map((item: any) => item.id))
                    }
                    className={secondaryBtn}
                  >
                    Chọn tất cả
                  </button>
                  <button
                    type="button"
                    onClick={() => setEnabledIds([])}
                    className={secondaryBtn}
                  >
                    Bỏ chọn
                  </button>
                </div>
              </div>

              <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                {(config?.specialties || []).map((item: any) => {
                  const checked = enabledIds.includes(item.id);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() =>
                        setEnabledIds((old) =>
                          checked ? old.filter((id) => id !== item.id) : [...old, item.id],
                        )
                      }
                      className={`flex items-center justify-between rounded-xl border p-3.5 text-left text-sm font-medium transition cursor-pointer ${
                        checked
                          ? isLight
                            ? 'border-emerald-500 bg-emerald-50/80 text-emerald-900'
                            : 'border-emerald-500/70 bg-emerald-950/40 text-emerald-200'
                          : isLight
                            ? 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                            : 'border-slate-800 bg-slate-950 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <Stethoscope
                          className={`h-4 w-4 ${checked ? 'text-emerald-600' : 'text-slate-400'}`}
                        />
                        {item.name}
                      </span>
                      <span
                        className={`flex h-5 w-5 items-center justify-center rounded-md border ${
                          checked
                            ? 'border-emerald-600 bg-emerald-600 text-white'
                            : isLight
                              ? 'border-slate-300 bg-white'
                              : 'border-slate-700 bg-slate-900'
                        }`}
                      >
                        {checked && <Check className="h-3.5 w-3.5" />}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      {/* MODAL: CREATE CLINIC ROOM */}
      <Dialog open={createRoomOpen} onOpenChange={setCreateRoomOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <DoorOpen className="h-5 w-5 text-emerald-600" />
              Thêm phòng khám thực tế
            </DialogTitle>
            <DialogDescription>
              Phòng khám được gắn với đúng chuyên khoa của bệnh viện và có thể phân bổ cho các ca
              dịch vụ hoặc ngoài giờ.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                Chuyên khoa <span className="text-rose-500">*</span>
              </label>
              <select
                value={roomForm.specialtyId}
                onChange={(e) => setRoomForm({ ...roomForm, specialtyId: e.target.value })}
                className={`h-10 w-full rounded-xl border px-3 text-sm outline-none transition ${inputSurface}`}
              >
                <option value="">Chọn chuyên khoa...</option>
                {enabledSpecialties.map((item: any) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                Mã phòng <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Ví dụ: DV-13-01 hoặc NG-05-02"
                value={roomForm.code}
                onChange={(e) => setRoomForm({ ...roomForm, code: e.target.value })}
                className={`h-10 w-full rounded-xl border px-3 text-sm outline-none transition ${inputSurface}`}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                Tên phòng khám <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Ví dụ: Phòng khám Dịch vụ Tim mạch 02"
                value={roomForm.name}
                onChange={(e) => setRoomForm({ ...roomForm, name: e.target.value })}
                className={`h-10 w-full rounded-xl border px-3 text-sm outline-none transition ${inputSurface}`}
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-2">
            <button
              type="button"
              onClick={() => setCreateRoomOpen(false)}
              className={secondaryBtn}
            >
              Hủy bỏ
            </button>
            <button type="button" onClick={createRoom} disabled={saving} className={primaryBtn}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Tạo phòng khám
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL: ASSIGN CLINIC ROOM SESSION */}
      <Dialog open={assignSessionOpen} onOpenChange={setAssignSessionOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarClock className="h-5 w-5 text-emerald-600" />
              {mode === 'SERVICE' ? 'Phân ca khám dịch vụ' : 'Mở ca khám ngoài giờ'}
            </DialogTitle>
            <DialogDescription>
              Chọn tuần tự chuyên khoa, dịch vụ, phòng khám và khung giờ trống tương thích.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3.5 py-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                1. Chuyên khoa <span className="text-rose-500">*</span>
              </label>
              <select
                value={sessionForm.specialtyId}
                onChange={(e) =>
                  setSessionForm({
                    ...sessionForm,
                    specialtyId: e.target.value,
                    medicalServiceId: '',
                    roomId: '',
                    slotId: '',
                  })
                }
                className={`h-10 w-full rounded-xl border px-3 text-sm outline-none transition ${inputSurface}`}
              >
                <option value="">Chọn chuyên khoa...</option>
                {enabledSpecialties.map((item: any) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                2. Dịch vụ khám <span className="text-rose-500">*</span>
              </label>
              <select
                disabled={!sessionForm.specialtyId}
                value={sessionForm.medicalServiceId}
                onChange={(e) =>
                  setSessionForm({
                    ...sessionForm,
                    medicalServiceId: e.target.value,
                    roomId: '',
                    slotId: '',
                  })
                }
                className={`h-10 w-full rounded-xl border px-3 text-sm outline-none transition disabled:opacity-50 ${inputSurface}`}
              >
                <option value="">Chọn dịch vụ...</option>
                {formServices.map((item: any) => (
                  <option key={item.id} value={item.id}>
                    {item.name} · {formatMoney(Number(item.price))} ({item.duration}p)
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  3. Phòng khám <span className="text-rose-500">*</span>
                </label>
                <select
                  disabled={!sessionForm.medicalServiceId}
                  value={sessionForm.roomId}
                  onChange={(e) =>
                    setSessionForm({ ...sessionForm, roomId: e.target.value, slotId: '' })
                  }
                  className={`h-10 w-full rounded-xl border px-3 text-sm outline-none transition disabled:opacity-50 ${inputSurface}`}
                >
                  <option value="">Chọn phòng khám...</option>
                  {formRooms.map((item: any) => (
                    <option key={item.id} value={item.id}>
                      {item.code} · {item.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  Sức chứa
                </label>
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={sessionForm.capacity}
                  onChange={(e) =>
                    setSessionForm({
                      ...sessionForm,
                      capacity: Math.max(1, Math.min(100, Number(e.target.value) || 1)),
                    })
                  }
                  className={`h-10 w-full rounded-xl border px-3 text-sm outline-none transition ${inputSurface}`}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                4. Khung giờ &amp; Bác sĩ phụ trách <span className="text-rose-500">*</span>
              </label>
              <select
                disabled={!sessionForm.roomId}
                value={sessionForm.slotId}
                onChange={(e) => setSessionForm({ ...sessionForm, slotId: e.target.value })}
                className={`h-10 w-full rounded-xl border px-3 text-sm outline-none transition disabled:opacity-50 ${inputSurface}`}
              >
                <option value="">
                  {sessionForm.roomId
                    ? formSlots.length
                      ? `Chọn khung giờ (${formSlots.length} khung trống)...`
                      : 'Không có khung giờ trống tương thích'
                    : 'Chọn phòng khám trước...'}
                </option>
                {formSlots.map((item: any) => (
                  <option key={item.id} value={item.id}>
                    {formatDateTime(item.startTime)} · {item.doctorWorkplace?.doctor?.fullName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-2">
            <button
              type="button"
              onClick={() => setAssignSessionOpen(false)}
              className={secondaryBtn}
            >
              Hủy bỏ
            </button>
            <button
              type="button"
              onClick={assignSession}
              disabled={saving || !sessionForm.slotId}
              className={primaryBtn}
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4" />
              )}
              Xác nhận phân phòng
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
