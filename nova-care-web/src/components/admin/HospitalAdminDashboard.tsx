'use client';

import React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { adminService } from '@/services/admin.service';
import { hospitalService } from '@/services/hospital.service';
import { useAdminTheme } from './AdminThemeContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  UserCheck,
  Building2,
  CalendarCheck,
  Calendar,
  Activity,
  Stethoscope,
  ClipboardList,
  Network,
  Clock,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  ArrowRight,
  Plus,
  RefreshCw,
  Phone,
  MapPin,
  Mail,
  ShieldCheck,
} from 'lucide-react';

interface HospitalAdminDashboardProps {
  hospitalId: string;
  user: any;
}

const getTodayStr = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const STATUS_MAP: Record<string, { label: string; styleDark: string; styleLight: string }> = {
  PENDING: { label: 'Chờ xác nhận', styleDark: 'bg-amber-950/40 text-amber-400 border-amber-800/60', styleLight: 'bg-amber-50 text-amber-700 border-amber-200' },
  AWAITING_PAYMENT: { label: 'Chờ thanh toán', styleDark: 'bg-orange-950/40 text-orange-400 border-orange-800/60', styleLight: 'bg-orange-50 text-orange-700 border-orange-200' },
  CONFIRMED: { label: 'Đã xác nhận', styleDark: 'bg-blue-950/40 text-blue-400 border-blue-800/60', styleLight: 'bg-blue-50 text-blue-700 border-blue-200' },
  PAID: { label: 'Đã thanh toán', styleDark: 'bg-purple-950/40 text-purple-400 border-purple-800/60', styleLight: 'bg-purple-50 text-purple-700 border-purple-200' },
  COMPLETED: { label: 'Hoàn thành khám', styleDark: 'bg-emerald-950/40 text-emerald-400 border-emerald-800/60', styleLight: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  CANCELLED: { label: 'Đã hủy', styleDark: 'bg-rose-950/40 text-rose-400 border-rose-800/60', styleLight: 'bg-rose-50 text-rose-700 border-rose-200' },
  EXPIRED: { label: 'Quá hạn', styleDark: 'bg-slate-800 text-slate-400 border-slate-700', styleLight: 'bg-slate-100 text-slate-600 border-slate-200' },
};

export function HospitalAdminDashboard({ hospitalId, user }: HospitalAdminDashboardProps) {
  const { theme } = useAdminTheme();
  const isLight = theme === 'light';

  const cardStyle = isLight
    ? 'bg-white border-slate-200 text-slate-900 shadow-sm rounded-xl'
    : 'bg-slate-950 border-slate-800 text-white shadow-sm rounded-xl';

  // 1. Fetch Hospital Info
  const { data: hospital, isLoading: loadingHospital } = useQuery({
    queryKey: ['hospital-detail-dashboard', hospitalId],
    queryFn: () => hospitalService.getById(hospitalId),
    enabled: !!hospitalId,
  });

  // 2. Doctor Count
  const { data: doctorsData, isLoading: loadingDoctors } = useQuery({
    queryKey: ['hospital-doctors-count', hospitalId],
    queryFn: () => adminService.getDoctors({ hospitalId, limit: 1 }),
    enabled: !!hospitalId,
  });

  // 3. Medical Services Count
  const { data: servicesData, isLoading: loadingServices } = useQuery({
    queryKey: ['hospital-services-count', hospitalId],
    queryFn: () => adminService.getMedicalServices({ hospitalId, limit: 1 }),
    enabled: !!hospitalId,
  });

  // 4. Health Packages Count
  const { data: packagesData, isLoading: loadingPackages } = useQuery({
    queryKey: ['hospital-packages-count', hospitalId],
    queryFn: () => adminService.getHealthPackages({ hospitalId, limit: 1 }),
    enabled: !!hospitalId,
  });

  // 5. Today's Appointments Count
  const todayStr = getTodayStr();
  const { data: todayApptsData, isLoading: loadingTodayAppts } = useQuery({
    queryKey: ['hospital-today-appts', hospitalId, todayStr],
    queryFn: () => adminService.getAppointments({ hospitalId, date: todayStr, limit: 1 }),
    enabled: !!hospitalId,
  });

  // 6. Total Appointments Count
  const { data: totalApptsData } = useQuery({
    queryKey: ['hospital-total-appts', hospitalId],
    queryFn: () => adminService.getAppointments({ hospitalId, limit: 1 }),
    enabled: !!hospitalId,
  });

  // 7. Recent Appointments List (5 items)
  const { data: recentApptsData, isLoading: loadingRecent } = useQuery({
    queryKey: ['hospital-recent-appts', hospitalId],
    queryFn: () => adminService.getAppointments({ hospitalId, limit: 5 }),
    enabled: !!hospitalId,
  });

  const doctorCount = doctorsData?.total ?? 0;
  const serviceCount = servicesData?.total ?? 0;
  const packageCount = packagesData?.total ?? 0;
  const todayApptCount = todayApptsData?.total ?? 0;
  const totalApptCount = totalApptsData?.total ?? 0;
  const recentAppointments = recentApptsData?.items || [];

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-10">
      {/* 1. Header Banner */}
      <div className="bg-gradient-to-r from-emerald-800 to-teal-950 text-white rounded-2xl p-6 shadow-md border border-emerald-700/30">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold mb-2 border border-emerald-400/20">
              <Building2 className="w-3.5 h-3.5" />
              <span>Cổng Quản Trị Cơ Sở Y Tế</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">
              {hospital?.name || user?.hospital?.name || 'Bệnh Viện Của Bạn'}
            </h1>
            <p className="text-xs text-emerald-100/80 mt-1 max-w-2xl flex flex-wrap items-center gap-x-4 gap-y-1">
              {(hospital?.address || user?.hospital?.address) && (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-emerald-300" />
                  {hospital?.address || user?.hospital?.address}
                </span>
              )}
              {(hospital?.phone || user?.hospital?.phone) && (
                <span className="inline-flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-emerald-300" />
                  {hospital?.phone || user?.hospital?.phone}
                </span>
              )}
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <Button
              asChild
              variant="outline"
              size="sm"
              className="bg-white/10 hover:bg-white/20 text-white border-white/20 text-xs font-medium rounded-lg"
            >
              <Link href={`/admin/hospitals/${hospitalId}`}>
                <Building2 className="w-3.5 h-3.5 mr-1.5" />
                Hồ sơ Cơ sở
              </Link>
            </Button>
            <Button
              asChild
              size="sm"
              className="bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-medium rounded-lg shadow-sm"
            >
              <Link href="/admin/appointments">
                <CalendarCheck className="w-3.5 h-3.5 mr-1.5" />
                Lịch hẹn hôm nay
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* 2. Stat Cards (Metrics) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Bác sĩ */}
        <Card className={`${cardStyle} hover:border-emerald-500/50 transition-colors`}>
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <span className={`text-xs font-semibold uppercase tracking-wider ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Đội ngũ Bác sĩ
              </span>
              <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <UserCheck className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <span className="text-2xl font-bold">
                {loadingDoctors ? '...' : doctorCount}
              </span>
              <Link
                href="/admin/doctors"
                className="text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:underline inline-flex items-center gap-0.5"
              >
                Quản lý <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <p className={`text-[11px] mt-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              Bác sĩ đang công tác tại viện
            </p>
          </CardContent>
        </Card>

        {/* Card 2: Dịch vụ Y tế */}
        <Card className={`${cardStyle} hover:border-blue-500/50 transition-colors`}>
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <span className={`text-xs font-semibold uppercase tracking-wider ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Dịch vụ Y tế
              </span>
              <div className="w-9 h-9 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <ClipboardList className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <span className="text-2xl font-bold">
                {loadingServices ? '...' : serviceCount}
              </span>
              <Link
                href="/admin/medical-services"
                className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-0.5"
              >
                Quản lý <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <p className={`text-[11px] mt-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              Dịch vụ khám, xét nghiệm niêm yết
            </p>
          </CardContent>
        </Card>

        {/* Card 3: Gói khám */}
        <Card className={`${cardStyle} hover:border-purple-500/50 transition-colors`}>
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <span className={`text-xs font-semibold uppercase tracking-wider ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Gói khám Sức khỏe
              </span>
              <div className="w-9 h-9 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                <Stethoscope className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <span className="text-2xl font-bold">
                {loadingPackages ? '...' : packageCount}
              </span>
              <Link
                href="/admin/health-packages"
                className="text-xs font-medium text-purple-600 dark:text-purple-400 hover:underline inline-flex items-center gap-0.5"
              >
                Quản lý <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <p className={`text-[11px] mt-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              Gói khám định kỳ / chuyên sâu
            </p>
          </CardContent>
        </Card>

        {/* Card 4: Lịch hẹn Hôm nay */}
        <Card className={`${cardStyle} hover:border-amber-500/50 transition-colors`}>
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <span className={`text-xs font-semibold uppercase tracking-wider ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Lịch hẹn Hôm nay
              </span>
              <div className="w-9 h-9 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <CalendarCheck className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <span className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                {loadingTodayAppts ? '...' : todayApptCount}
              </span>
              <Link
                href="/admin/appointments"
                className="text-xs font-medium text-amber-600 dark:text-amber-400 hover:underline inline-flex items-center gap-0.5"
              >
                Chi tiết <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <p className={`text-[11px] mt-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              Tổng lịch hẹn: <strong>{totalApptCount}</strong> lượt
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 3. Phím tắt quản lý nhanh (Quick Action Buttons) */}
      <Card className={cardStyle}>
        <CardHeader className="py-3 px-5 border-b border-slate-100 dark:border-slate-800">
          <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Truy cập nhanh chức năng quản lý
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <Link
              href="/admin/doctors"
              className={`p-3 rounded-xl border flex flex-col items-center justify-center text-center gap-2 transition hover:border-emerald-500 hover:shadow-xs ${isLight ? 'bg-slate-50/60 border-slate-200 text-slate-800 hover:bg-emerald-50/40' : 'bg-slate-900 border-slate-800 text-slate-200 hover:bg-slate-800'
                }`}
            >
              <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <UserCheck className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold">Đội ngũ Bác sĩ</span>
            </Link>

            <Link
              href="/admin/medical-services"
              className={`p-3 rounded-xl border flex flex-col items-center justify-center text-center gap-2 transition hover:border-blue-500 hover:shadow-xs ${isLight ? 'bg-slate-50/60 border-slate-200 text-slate-800 hover:bg-blue-50/40' : 'bg-slate-900 border-slate-800 text-slate-200 hover:bg-slate-800'
                }`}
            >
              <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <ClipboardList className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold">Dịch vụ Y tế</span>
            </Link>

            <Link
              href="/admin/health-packages"
              className={`p-3 rounded-xl border flex flex-col items-center justify-center text-center gap-2 transition hover:border-purple-500 hover:shadow-xs ${isLight ? 'bg-slate-50/60 border-slate-200 text-slate-800 hover:bg-purple-50/40' : 'bg-slate-900 border-slate-800 text-slate-200 hover:bg-slate-800'
                }`}
            >
              <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                <Stethoscope className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold">Gói khám Sức khỏe</span>
            </Link>

            <Link
              href="/admin/schedules"
              className={`p-3 rounded-xl border flex flex-col items-center justify-center text-center gap-2 transition hover:border-amber-500 hover:shadow-xs ${isLight ? 'bg-slate-50/60 border-slate-200 text-slate-800 hover:bg-amber-50/40' : 'bg-slate-900 border-slate-800 text-slate-200 hover:bg-slate-800'
                }`}
            >
              <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <Calendar className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold">Lịch trực & Ca khám</span>
            </Link>

            <Link
              href="/admin/appointments"
              className={`p-3 rounded-xl border flex flex-col items-center justify-center text-center gap-2 transition hover:border-teal-500 hover:shadow-xs ${isLight ? 'bg-slate-50/60 border-slate-200 text-slate-800 hover:bg-teal-50/40' : 'bg-slate-900 border-slate-800 text-slate-200 hover:bg-slate-800'
                }`}
            >
              <div className="w-8 h-8 rounded-lg bg-teal-100 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center">
                <CalendarCheck className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold">Lịch hẹn Bệnh nhân</span>
            </Link>

            <Link
              href="/admin/his-sync"
              className={`p-3 rounded-xl border flex flex-col items-center justify-center text-center gap-2 transition hover:border-cyan-500 hover:shadow-xs ${isLight ? 'bg-slate-50/60 border-slate-200 text-slate-800 hover:bg-cyan-50/40' : 'bg-slate-900 border-slate-800 text-slate-200 hover:bg-slate-800'
                }`}
            >
              <div className="w-8 h-8 rounded-lg bg-cyan-100 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
                <Network className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold">Đồng bộ HIS</span>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* 4. Recent Appointments Table & Hospital Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lịch hẹn gần đây (2 columns) */}
        <div className="lg:col-span-2 space-y-4">
          <Card className={cardStyle}>
            <CardHeader className="py-3.5 px-5 border-b border-slate-100 dark:border-slate-800 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <CalendarCheck className="w-4 h-4 text-emerald-600" />
                Lịch hẹn Gần đây của Bệnh viện
              </CardTitle>
              <Link
                href="/admin/appointments"
                className="text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:underline inline-flex items-center gap-1"
              >
                Xem tất cả <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              {loadingRecent ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  Đang tải danh sách lịch hẹn...
                </div>
              ) : recentAppointments.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  Chưa có lịch hẹn nào tại bệnh viện
                </div>
              ) : (
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className={isLight ? 'bg-slate-50 text-slate-500 border-b border-slate-100' : 'bg-slate-900 text-slate-400 border-b border-slate-800'}>
                      <th className="p-3 font-semibold">Mã hẹn</th>
                      <th className="p-3 font-semibold">Bệnh nhân</th>
                      <th className="p-3 font-semibold">Dịch vụ / Bác sĩ</th>
                      <th className="p-3 font-semibold">Thời gian</th>
                      <th className="p-3 font-semibold">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {recentAppointments.map((appt: any) => {
                      const st = STATUS_MAP[appt.status] || {
                        label: appt.status,
                        styleDark: 'bg-slate-800 text-slate-400',
                        styleLight: 'bg-slate-100 text-slate-600',
                      };

                      return (
                        <tr key={appt.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition">
                          <td className="p-3 font-mono font-medium text-slate-700 dark:text-slate-300">
                            {appt.code || appt.id?.slice(0, 8)}
                          </td>
                          <td className="p-3 font-medium text-slate-900 dark:text-white">
                            <div>{appt.patientName || appt.user?.fullName || 'Bệnh nhân'}</div>
                            {appt.patientPhone && (
                              <div className="text-[11px] text-slate-400">{appt.patientPhone}</div>
                            )}
                          </td>
                          <td className="p-3 text-slate-700 dark:text-slate-300">
                            {appt.doctor?.fullName ? (
                              <span>BS. {appt.doctor.fullName}</span>
                            ) : appt.medicalService?.name ? (
                              <span>{appt.medicalService.name}</span>
                            ) : appt.healthPackage?.name ? (
                              <span>{appt.healthPackage.name}</span>
                            ) : (
                              <span>Khám tổng quát</span>
                            )}
                          </td>
                          <td className="p-3 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                            <div>{appt.appointmentDate ? new Date(appt.appointmentDate).toLocaleDateString('vi-VN') : '—'}</div>
                            <div className="text-[11px] text-slate-400">{appt.startTime || appt.timeSlot || ''}</div>
                          </td>
                          <td className="p-3 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${isLight ? st.styleLight : st.styleDark}`}>
                              {st.label}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Thông tin Cơ sở y tế & Giờ tiếp nhận (1 column) */}
        <div className="space-y-4">
          <Card className={cardStyle}>
            <CardHeader className="py-3.5 px-5 border-b border-slate-100 dark:border-slate-800">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Building2 className="w-4 h-4 text-emerald-600" />
                Hồ sơ Cơ sở Y tế
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-3.5 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Mã cơ sở:</span>
                <span className="font-mono font-medium">{(hospital as any)?.code || hospitalId?.slice(0, 8)}</span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Loại hình:</span>
                <span className="font-medium">{hospital?.type || 'Bệnh viện đa khoa'}</span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Trạng thái:</span>
                <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Hoạt động
                </span>
              </div>
              <div className="space-y-1 pb-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 block">Địa chỉ:</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">
                  {hospital?.address || 'Chưa cập nhật địa chỉ'}
                </span>
              </div>
              <div className="pt-1">
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="w-full text-xs font-semibold rounded-lg border-emerald-600/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/50"
                >
                  <Link href={`/admin/hospitals/${hospitalId}`}>
                    Xem & Cập nhật Hồ sơ Chi tiết <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Hướng dẫn kết nối HIS */}
          <Card className={`${cardStyle} border-dashed`}>
            <CardContent className="p-4 space-y-2 text-xs">
              <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-white">
                <Network className="w-4 h-4 text-emerald-600" />
                Cổng Tích Hợp HIS Bệnh Viện
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed">
                Đồng bộ trực tiếp danh mục Bác sĩ, Dịch vụ và Chuyên khoa từ hệ thống Quản lý Bệnh viện (HIS) nội bộ vào NovaCare.
              </p>
              <Button
                asChild
                size="sm"
                variant="outline"
                className="w-full mt-2 text-xs font-medium rounded-lg"
              >
                <Link href="/admin/his-sync">
                  Truy cập Cổng Đồng bộ HIS <ArrowRight className="w-3 h-3 ml-1" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
