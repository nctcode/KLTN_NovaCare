'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService } from '@/services/admin.service';
import { useAdminTheme } from '@/components/admin/AdminThemeContext';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { AppointmentDetailDrawer } from './AppointmentDetailDrawer';
import {
  CalendarCheck,
  Search,
  CheckCircle2,
  XCircle,
  Building2,
  Stethoscope,
  Loader2,
  ChevronLeft,
  ChevronRight,
  List,
  Calendar as CalendarIcon,
  Eye,
  Clock,
  Activity,
  User,
  RotateCcw,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';

const STATUS_MAP: Record<string, { label: string; styleDark: string; styleLight: string }> = {
  PENDING: { label: 'Chờ xác nhận', styleDark: 'bg-amber-950/40 text-amber-400 border-amber-800/60', styleLight: 'bg-amber-50 text-amber-700 border-amber-200' },
  AWAITING_PAYMENT: { label: 'Chờ thanh toán', styleDark: 'bg-orange-950/40 text-orange-400 border-orange-800/60', styleLight: 'bg-orange-50 text-orange-700 border-orange-200' },
  CONFIRMED: { label: 'Đã xác nhận', styleDark: 'bg-blue-950/40 text-blue-400 border-blue-800/60', styleLight: 'bg-blue-50 text-blue-700 border-blue-200' },
  PAID: { label: 'Đã thanh toán', styleDark: 'bg-purple-950/40 text-purple-400 border-purple-800/60', styleLight: 'bg-purple-50 text-purple-700 border-purple-200' },
  COMPLETED: { label: 'Hoàn thành khám', styleDark: 'bg-emerald-950/40 text-emerald-400 border-emerald-800/60', styleLight: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  CANCELLED: { label: 'Đã hủy', styleDark: 'bg-rose-950/40 text-rose-400 border-rose-800/60', styleLight: 'bg-rose-50 text-rose-700 border-rose-200' },
  EXPIRED: { label: 'Quá hạn', styleDark: 'bg-slate-800 text-slate-400 border-slate-700', styleLight: 'bg-slate-100 text-slate-600 border-slate-200' },
  NO_SHOW: { label: 'Vắng mặt', styleDark: 'bg-rose-950/40 text-rose-400 border-rose-800/60', styleLight: 'bg-rose-50 text-rose-700 border-rose-200' },
  FAILED: { label: 'Thất bại', styleDark: 'bg-rose-950/40 text-rose-400 border-rose-800/60', styleLight: 'bg-rose-50 text-rose-700 border-rose-200' },
  REFUNDED: { label: 'Đã hoàn tiền', styleDark: 'bg-amber-950/40 text-amber-400 border-amber-800/60', styleLight: 'bg-amber-50 text-amber-700 border-amber-200' },
};

export function AppointmentTab() {
  const queryClient = useQueryClient();
  const { theme } = useAdminTheme();
  const isLight = theme === 'light';

  const [viewMode, setViewMode] = useState<'table' | 'calendar'>('table');
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [hospitalId, setHospitalId] = useState('');
  const [doctorId, setDoctorId] = useState('');
  const [specialtyId, setSpecialtyId] = useState('');
  const [medicalServiceId, setMedicalServiceId] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(null);

  const cardStyle = isLight
    ? 'bg-white border-slate-200 text-slate-900 shadow-sm'
    : 'bg-slate-950 border-slate-800 text-white shadow-sm';

  const tableHeaderStyle = isLight
    ? 'bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-xs'
    : 'bg-slate-900 border-b border-slate-800 text-slate-400 font-semibold text-xs';

  // Fetch Stats (4 small stat cards)
  const { data: stats } = useQuery({
    queryKey: ['admin-appointment-stats'],
    queryFn: () => adminService.getAppointmentStats(),
  });

  // Fetch Hospitals for filter dropdown
  const { data: hospitalsData } = useQuery({
    queryKey: ['admin-hospitals-filter-appointments'],
    queryFn: () => adminService.getHospitals({ limit: 100 }),
  });

  // Fetch Doctors for filter dropdown
  const { data: doctorsData } = useQuery({
    queryKey: ['admin-doctors-filter-appointments'],
    queryFn: () => adminService.getDoctors({ limit: 100 }),
  });

  // Fetch Specialties for filter dropdown
  const { data: specialtiesData } = useQuery({
    queryKey: ['admin-specialties-filter-appointments'],
    queryFn: () => adminService.getSpecialties({ limit: 100 }),
  });

  // Fetch Medical Services for filter dropdown
  const { data: servicesData } = useQuery({
    queryKey: ['admin-medical-services-filter-appointments'],
    queryFn: () => adminService.getMedicalServices({ limit: 100 }),
  });

  // Fetch Appointments list
  const { data, isLoading } = useQuery({
    queryKey: ['admin-appointments', page, search, statusFilter, hospitalId, doctorId, specialtyId, medicalServiceId, dateFilter],
    queryFn: () =>
      adminService.getAppointments({
        page,
        limit: viewMode === 'calendar' ? 100 : 10,
        search,
        status: statusFilter,
        hospitalId,
        doctorId,
        specialtyId,
        medicalServiceId,
        date: dateFilter,
      }),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      adminService.updateAppointmentStatus(id, status),
    onSuccess: () => {
      toast.success('Cập nhật trạng thái thành công');
      queryClient.invalidateQueries({ queryKey: ['admin-appointments'] });
      queryClient.invalidateQueries({ queryKey: ['admin-appointment-stats'] });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      adminService.cancelAppointment(id, reason),
    onSuccess: () => {
      toast.success('Hủy lịch khám thành công');
      queryClient.invalidateQueries({ queryKey: ['admin-appointments'] });
      queryClient.invalidateQueries({ queryKey: ['admin-appointment-stats'] });
    },
  });

  const handleCancelClick = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const reason = prompt('Nhập lý do hủy lịch khám:');
    if (reason !== null) {
      cancelMutation.mutate({ id, reason: reason || 'Admin hủy lịch' });
    }
  };

  const handleResetFilters = () => {
    setSearch('');
    setHospitalId('');
    setDoctorId('');
    setSpecialtyId('');
    setMedicalServiceId('');
    setStatusFilter('');
    setDateFilter('');
    setPage(1);
  };

  const hasActiveFilter = !!(search || hospitalId || doctorId || specialtyId || medicalServiceId || statusFilter || dateFilter);

  return (
    <div className="space-y-6">
      {/* Subheader */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className={`text-lg font-black flex items-center gap-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
            <CalendarCheck className="w-5 h-5 text-emerald-600 dark:text-[#66FF33]" />
            Quản lý lịch khám
          </h2>
          <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
            Theo dõi và quản lý các lịch hẹn khám được đặt trên nền tảng NovaCare.
          </p>
        </div>

        {/* View Switcher: List vs Calendar */}
        <div className={`flex p-1 rounded-xl border ${isLight ? 'bg-slate-100 border-slate-300' : 'bg-slate-900 border-slate-800'}`}>
          <button
            onClick={() => setViewMode('table')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${viewMode === 'table'
                ? isLight
                  ? 'bg-white text-emerald-800 shadow-sm'
                  : 'bg-emerald-600 text-white shadow-sm'
                : isLight
                  ? 'text-slate-600 hover:text-slate-900'
                  : 'text-slate-400 hover:text-white'
              }`}
          >
            <List className="w-4 h-4" /> Danh sách
          </button>

          <button
            onClick={() => setViewMode('calendar')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${viewMode === 'calendar'
                ? isLight
                  ? 'bg-white text-emerald-800 shadow-sm'
                  : 'bg-emerald-600 text-white shadow-sm'
                : isLight
                  ? 'text-slate-600 hover:text-slate-900'
                  : 'text-slate-400 hover:text-white'
              }`}
          >
            <CalendarIcon className="w-4 h-4" /> Lịch
          </button>
        </div>
      </div>

      {/* 4 Small Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Today Total */}
        <Card className={`${cardStyle} p-4 rounded-xl border border-slate-200 dark:border-slate-800`}>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-medium text-slate-500 dark:text-slate-400">Lịch hôm nay</div>
              <div className="text-xl font-bold text-slate-900 dark:text-white mt-1">
                {stats?.todayTotal ?? 0}
              </div>
            </div>
            <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <CalendarIcon className="w-4 h-4" />
            </div>
          </div>
        </Card>

        {/* Confirmed */}
        <Card className={`${cardStyle} p-4 rounded-xl border border-slate-200 dark:border-slate-800`}>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-medium text-slate-500 dark:text-slate-400">Đã xác nhận</div>
              <div className="text-xl font-bold text-blue-600 dark:text-blue-400 mt-1">
                {stats?.confirmed ?? 0}
              </div>
            </div>
            <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
        </Card>

        {/* Completed */}
        <Card className={`${cardStyle} p-4 rounded-xl border border-slate-200 dark:border-slate-800`}>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-medium text-slate-500 dark:text-slate-400">Đã hoàn thành</div>
              <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                {stats?.completed ?? 0}
              </div>
            </div>
            <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
          </div>
        </Card>

        {/* Cancelled */}
        <Card className={`${cardStyle} p-4 rounded-xl border border-slate-200 dark:border-slate-800`}>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-medium text-slate-500 dark:text-slate-400">Đã hủy</div>
              <div className="text-xl font-bold text-rose-600 dark:text-rose-400 mt-1">
                {stats?.cancelled ?? 0}
              </div>
            </div>
            <div className="w-9 h-9 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <XCircle className="w-4 h-4" />
            </div>
          </div>
        </Card>
      </div>

      {/* Toolbar / Multi-Filter Bar */}
      <Card className={`${cardStyle} p-3.5 rounded-xl border border-slate-200 dark:border-slate-800`}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {/* Search input */}
          <div className="relative w-full lg:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              type="text"
              placeholder="Tìm mã đặt lịch, tên bệnh nhân, số điện thoại..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className={`pl-9 text-xs rounded-lg h-9 border-slate-200 dark:border-slate-700 ${
                isLight
                  ? 'bg-white text-slate-900 placeholder:text-slate-400'
                  : 'bg-slate-900 text-white placeholder:text-slate-500'
              }`}
            />
          </div>

          {/* Hospital Select */}
          <select
            value={hospitalId}
            onChange={(e) => {
              setHospitalId(e.target.value);
              setPage(1);
            }}
            className={`border text-xs font-normal px-2.5 py-1.5 h-9 rounded-lg border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-400 ${
              isLight ? 'bg-white text-slate-800' : 'bg-slate-900 text-white'
            }`}
          >
            <option value="">Bệnh viện (Tất cả)</option>
            {hospitalsData?.items?.map((h: any) => (
              <option key={h.id} value={h.id}>
                {h.name}
              </option>
            ))}
          </select>

          {/* Doctor Select */}
          <select
            value={doctorId}
            onChange={(e) => {
              setDoctorId(e.target.value);
              setPage(1);
            }}
            className={`border text-xs font-normal px-2.5 py-1.5 h-9 rounded-lg border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-400 ${
              isLight ? 'bg-white text-slate-800' : 'bg-slate-900 text-white'
            }`}
          >
            <option value="">Bác sĩ (Tất cả)</option>
            {doctorsData?.items?.map((d: any) => (
              <option key={d.id} value={d.id}>
                {d.title ? `${d.title} ` : ''}{d.fullName}
              </option>
            ))}
          </select>

          {/* Specialty Select */}
          <select
            value={specialtyId}
            onChange={(e) => {
              setSpecialtyId(e.target.value);
              setPage(1);
            }}
            className={`border text-xs font-normal px-2.5 py-1.5 h-9 rounded-lg border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-400 ${
              isLight ? 'bg-white text-slate-800' : 'bg-slate-900 text-white'
            }`}
          >
            <option value="">Chuyên khoa (Tất cả)</option>
            {specialtiesData?.items?.map((s: any) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>

          {/* Medical Service Select */}
          <select
            value={medicalServiceId}
            onChange={(e) => {
              setMedicalServiceId(e.target.value);
              setPage(1);
            }}
            className={`border text-xs font-normal px-2.5 py-1.5 h-9 rounded-lg border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-400 ${
              isLight ? 'bg-white text-slate-800' : 'bg-slate-900 text-white'
            }`}
          >
            <option value="">Dịch vụ (Tất cả)</option>
            {servicesData?.items?.map((srv: any) => (
              <option key={srv.id} value={srv.id}>
                {srv.name}
              </option>
            ))}
          </select>

          {/* Status Select */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className={`border text-xs font-normal px-2.5 py-1.5 h-9 rounded-lg border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-400 ${
              isLight ? 'bg-white text-slate-800' : 'bg-slate-900 text-white'
            }`}
          >
            <option value="">Trạng thái (Tất cả)</option>
            <option value="PENDING">Chờ xác nhận</option>
            <option value="AWAITING_PAYMENT">Chờ thanh toán</option>
            <option value="CONFIRMED">Đã xác nhận</option>
            <option value="PAID">Đã thanh toán</option>
            <option value="COMPLETED">Hoàn thành khám</option>
            <option value="CANCELLED">Đã hủy</option>
            <option value="EXPIRED">Quá hạn</option>
            <option value="NO_SHOW">Vắng mặt</option>
          </select>

          {/* Date Picker Filter */}
          <div className="flex items-center gap-2">
            <Input
              type="date"
              value={dateFilter}
              onChange={(e) => {
                setDateFilter(e.target.value);
                setPage(1);
              }}
              className={`text-xs rounded-lg h-9 font-mono border-slate-200 dark:border-slate-700 ${
                isLight ? 'bg-white text-slate-900' : 'bg-slate-900 text-white'
              }`}
            />
            {hasActiveFilter && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleResetFilters}
                className="h-9 px-2.5 rounded-lg text-xs shrink-0 border-slate-200 dark:border-slate-700 text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                title="Đặt lại bộ lọc"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Main Content Area: Table vs Calendar */}
      {viewMode === 'table' ? (
        /* TABLE VIEW */
        <Card className={`${cardStyle} rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs`}>
          <CardContent className="p-0 overflow-x-auto">
            {isLoading ? (
              <div className="p-12 flex justify-center">
                <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
              </div>
            ) : (
              <table className="w-full text-left text-xs whitespace-nowrap">
                <thead className={tableHeaderStyle}>
                  <tr>
                    <th className="py-2.5 px-3 w-[120px] font-semibold">Mã đặt lịch</th>
                    <th className="py-2.5 px-3 min-w-[150px] font-semibold">Bệnh nhân</th>
                    <th className="py-2.5 px-3 min-w-[130px] font-semibold">Bác sĩ</th>
                    <th className="py-2.5 px-3 min-w-[180px] max-w-[240px] font-semibold">Bệnh viện</th>
                    <th className="py-2.5 px-3 min-w-[110px] font-semibold">Chuyên khoa</th>
                    <th className="py-2.5 px-3 min-w-[130px] font-semibold">Ngày giờ khám</th>
                    <th className="py-2.5 px-3 min-w-[150px] max-w-[200px] font-semibold">Dịch vụ</th>
                    <th className="py-2.5 px-3 text-right min-w-[95px] font-semibold">Tổng tiền</th>
                    <th className="py-2.5 px-3 text-center min-w-[120px] font-semibold">Trạng thái</th>
                    <th className="py-2.5 px-3 text-right min-w-[90px] font-semibold">Thao tác</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isLight ? 'divide-slate-100' : 'divide-slate-800/60'}`}>
                  {data?.items?.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-10 text-center text-slate-500 font-normal">
                        <div className="flex flex-col items-center gap-2">
                          <AlertCircle className="w-5 h-5 text-slate-400" />
                          <span>Chưa có lịch khám phù hợp với bộ lọc hiện tại.</span>
                          {hasActiveFilter && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleResetFilters}
                              className="mt-2 rounded-lg text-xs"
                            >
                              Đặt lại bộ lọc
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    data?.items?.map((appt: any) => {
                      const st = STATUS_MAP[appt.status] || { label: appt.status, styleDark: 'bg-slate-800 text-slate-300 border-slate-700', styleLight: 'bg-slate-100 text-slate-700 border-slate-200' };
                      const docWp = appt.slot?.doctorWorkplace;
                      const slotStart = appt.slot?.startTime ? new Date(appt.slot.startTime) : null;
                      const slotEnd = appt.slot?.endTime ? new Date(appt.slot.endTime) : null;

                      return (
                        <tr
                          key={appt.id}
                          onClick={() => setSelectedAppointmentId(appt.id)}
                          className={`border-b transition cursor-pointer text-xs ${isLight ? 'border-slate-100 hover:bg-slate-50/80' : 'border-slate-800/60 hover:bg-slate-900/50'}`}
                        >
                          {/* Booking Code */}
                          <td className="py-2.5 px-3 font-mono text-slate-700 dark:text-slate-300 font-medium align-middle whitespace-nowrap">
                            #{appt.bookingCode}
                          </td>

                          {/* Patient */}
                          <td className="py-2.5 px-3 align-middle">
                            <div className="font-medium text-slate-900 dark:text-white leading-tight">
                              {appt.patientProfile?.fullName || appt.user?.fullName}
                            </div>
                            <div className="text-[11px] text-slate-500 font-mono mt-0.5 leading-tight">
                              {appt.patientProfile?.phone || appt.user?.phone}
                            </div>
                          </td>

                          {/* Doctor */}
                          <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300 align-middle whitespace-nowrap">
                            {docWp?.doctor?.fullName ? (
                              <span className="font-medium">BS. {docWp.doctor.fullName}</span>
                            ) : (
                              <span className="text-slate-400 italic">Chưa xếp</span>
                            )}
                          </td>

                          {/* Hospital */}
                          <td className="py-2.5 px-3 align-middle max-w-[240px]">
                            <div className="text-slate-800 dark:text-slate-200 font-medium truncate leading-tight">
                              {docWp?.hospital?.name || 'N/A'}
                            </div>
                            <div className="text-[11px] text-slate-400 truncate mt-0.5 leading-tight">
                              {docWp?.branch?.name || docWp?.branch?.address || 'Cơ sở chính'}
                            </div>
                          </td>

                          {/* Specialty */}
                          <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400 align-middle whitespace-nowrap">
                            {docWp?.specialty?.name || '---'}
                          </td>

                          {/* Date/Time */}
                          <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300 align-middle whitespace-nowrap leading-tight">
                            {slotStart ? (
                              <div>
                                <div>{slotStart.toLocaleDateString('vi-VN')}</div>
                                <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                                  {slotStart.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} - {slotEnd?.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                                </div>
                              </div>
                            ) : (
                              <span className="text-slate-400 italic">Chưa xếp</span>
                            )}
                          </td>

                          {/* Service */}
                          <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400 align-middle max-w-[200px]">
                            <div className="truncate" title={appt.medicalService?.name || 'Khám chuyên khoa'}>
                              {appt.medicalService?.name || 'Khám chuyên khoa'}
                            </div>
                          </td>

                          {/* Price */}
                          <td className="py-2.5 px-3 font-mono text-slate-800 dark:text-slate-200 text-right align-middle whitespace-nowrap font-medium">
                            {Number(appt.totalPrice || appt.consultationFee || 0).toLocaleString('vi-VN')}đ
                          </td>

                          {/* Status */}
                          <td className="py-2.5 px-3 text-center align-middle whitespace-nowrap">
                            <span
                              className={`inline-block px-2 py-0.5 rounded text-[11px] font-medium border ${isLight ? st.styleLight : st.styleDark}`}
                            >
                              {st.label}
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="py-2.5 px-3 text-right align-middle whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedAppointmentId(appt.id)}
                              className="h-7 text-xs font-normal rounded-lg px-2.5 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                            >
                              <Eye className="w-3.5 h-3.5 mr-1 text-slate-500" /> Chi tiết
                            </Button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      ) : (
        /* CALENDAR VIEW MODE */
        <Card className={`${cardStyle} p-6`}>
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-extrabold text-sm flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-emerald-600" />
                Lịch xem trực quan theo danh sách hẹn khám ({data?.items?.length || 0} lịch)
              </h3>
              <p className="text-xs text-slate-400">Click vào bất kỳ cuộc hẹn nào để xem thông tin chi tiết</p>
            </div>

            {isLoading ? (
              <div className="p-12 flex justify-center">
                <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
              </div>
            ) : !data?.items || data.items.length === 0 ? (
              <div className="p-12 text-center text-slate-500 font-medium flex flex-col items-center gap-2">
                <AlertCircle className="w-8 h-8 text-slate-400" />
                <span>Không có lịch hẹn khám nào trong khung hiển thị này</span>
                {hasActiveFilter && (
                  <Button variant="outline" size="sm" onClick={handleResetFilters} className="mt-2 rounded-xl text-xs">
                    Đặt lại bộ lọc
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {data.items.map((appt: any) => {
                  const st = STATUS_MAP[appt.status] || { label: appt.status, styleDark: 'bg-slate-800 text-white', styleLight: 'bg-slate-100 text-slate-800' };
                  const docWp = appt.slot?.doctorWorkplace;
                  const slotStart = appt.slot?.startTime ? new Date(appt.slot.startTime) : null;

                  return (
                    <div
                      key={appt.id}
                      onClick={() => setSelectedAppointmentId(appt.id)}
                      className={`p-3.5 rounded-2xl border transition cursor-pointer hover:scale-[1.01] ${isLight
                          ? 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-800'
                          : 'bg-slate-900/80 hover:bg-slate-900 border-slate-800 text-slate-200'
                        }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-mono font-black text-xs text-emerald-600 dark:text-[#66FF33]">
                          #{appt.bookingCode}
                        </span>
                        <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider border ${isLight ? st.styleLight : st.styleDark}`}>
                          {st.label}
                        </span>
                      </div>

                      <div className="space-y-1 text-xs">
                        <div className="font-extrabold flex items-center gap-1.5 text-slate-900 dark:text-white">
                          <User className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                          <span>{appt.patientProfile?.fullName || appt.user?.fullName}</span>
                        </div>

                        <div className="text-slate-500 text-[11px] flex items-center gap-1.5">
                          <Stethoscope className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                          <span>BS. {docWp?.doctor?.fullName || 'N/A'}</span>
                        </div>

                        <div className="text-slate-500 text-[11px] flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          <span className="truncate">{docWp?.hospital?.name || 'N/A'}</span>
                        </div>

                        {slotStart && (
                          <div className="pt-2 mt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {slotStart.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            <span>{slotStart.toLocaleDateString('vi-VN')}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Pagination (for Table mode) */}
      {viewMode === 'table' && data?.totalPages > 1 && (
        <div
          className={`flex items-center justify-between p-4 rounded-xl border text-xs ${isLight ? 'bg-white border-slate-200 text-slate-600' : 'bg-slate-950 border-slate-800 text-slate-400'
            }`}
        >
          <span>
            Hiển thị trang <strong>{data.page}</strong> / <strong>{data.totalPages}</strong> (Tổng {data.total} lịch)
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              className={isLight ? 'border-slate-300 text-slate-800 rounded-xl' : 'border-slate-800 text-white rounded-xl'}
            >
              <ChevronLeft className="w-4 h-4 mr-1" /> Trang trước
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= data.totalPages}
              onClick={() => setPage(page + 1)}
              className={isLight ? 'border-slate-300 text-slate-800 rounded-xl' : 'border-slate-800 text-white rounded-xl'}
            >
              Trang sau <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* Detail Drawer */}
      <AppointmentDetailDrawer
        appointmentId={selectedAppointmentId}
        open={!!selectedAppointmentId}
        onClose={() => setSelectedAppointmentId(null)}
      />
    </div>
  );
}
