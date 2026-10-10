'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { hospitalAdminService } from '@/services/hospital-admin.service';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import {
  Users,
  Calendar,
  CheckCircle2,
  Clock,
  Building2,
  Phone,
  MapPin,
  Loader2,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

export default function HospitalAdminDashboard() {
  const { data: dashboard, isLoading: loadingStats } = useQuery({
    queryKey: ['hospital-admin-dashboard'],
    queryFn: hospitalAdminService.getDashboard,
  });

  const { data: hospital, isLoading: loadingHospital } = useQuery({
    queryKey: ['hospital-admin-my-hospital'],
    queryFn: hospitalAdminService.getMyHospital,
  });

  const { data: appointmentsData, isLoading: loadingAppointments } = useQuery({
    queryKey: ['hospital-admin-recent-appointments'],
    queryFn: () => hospitalAdminService.getAppointments({ limit: 5 }),
  });

  const [dismissOnboarding, setDismissOnboarding] = React.useState(false);

  const appointments = appointmentsData?.items || [];
  const hasNoDoctors = !loadingStats && (dashboard?.totalDoctors ?? 0) === 0;

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gradient-to-r from-[#0c4b39] via-emerald-900 to-slate-950 p-6 rounded-3xl border border-emerald-500/20 shadow-lg text-white">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#66FF33]/20 text-[#66FF33] text-xs font-bold uppercase tracking-wider mb-2">
            <Building2 className="w-3.5 h-3.5" />
            Cổng Quản Trị Cơ Sở Y Tế
          </div>
          <h1 className="text-2xl font-black tracking-tight">{hospital?.name || 'Bệnh viện của bạn'}</h1>
          <p className="text-xs text-slate-300 mt-1 flex flex-wrap items-center gap-x-4 gap-y-1">
            <span className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-emerald-400" />
              {hospital?.address ? `${hospital.address}${hospital?.city ? `, ${hospital.city}` : ''}` : 'Chưa cập nhật địa chỉ'}
            </span>
            {hospital?.hotline && (
              <span className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-emerald-400" />
                Hotline: {hospital.hotline}
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <Link href="/hospital-admin/hospital-info">
            <Button
              variant="outline"
              size="sm"
              className="border-white/20 bg-white/10 text-white hover:bg-white/20 text-xs rounded-xl"
            >
              Cập nhật thông tin
            </Button>
          </Link>
          <Link href="/hospital-admin/appointments">
            <Button
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl gap-1.5 shadow-md shadow-emerald-600/30"
            >
              Xem lịch hẹn
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>
      </div>

      {/* 1.1 Onboarding Banner (Cho Bệnh Viện mới chưa có dữ liệu) */}
      {hasNoDoctors && !dismissOnboarding && (
        <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-5 sm:p-6 shadow-sm relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 relative z-10">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-700 shrink-0">
                <Users className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-amber-100 border border-amber-300 text-amber-800 text-[11px] font-semibold">
                  Bước khởi tạo bắt buộc
                </div>
                <h3 className="text-base font-bold text-slate-900 tracking-tight">
                  Cơ sở chưa có dữ liệu Bác sĩ & Lịch trực khám
                </h3>
                <p className="text-xs text-slate-600 max-w-2xl leading-relaxed">
                  Để bệnh nhân có thể tìm kiếm bác sĩ và đặt lịch trực tuyến, vui lòng kết nối hệ thống dữ liệu HIS của bệnh viện (thông qua API Contract chuẩn) hoặc quản lý trực tiếp trên hệ thống.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0 pl-16 md:pl-0">
              <Link href="/hospital-admin/integration">
                <Button
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl gap-1.5 shadow-md shadow-emerald-600/30"
                >
                  Bắt đầu kết nối & Xem Contract
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDismissOnboarding(true)}
                className="text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 text-xs rounded-xl"
              >
                Để sau
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Metric KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Bác sĩ */}
        <Card className="bg-white border-slate-200 text-slate-900 shadow-sm rounded-2xl">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Bác Sĩ Tại Cơ Sở
              </p>
              <p className="text-2xl font-black text-slate-900">
                {loadingStats ? '...' : dashboard?.totalDoctors ?? 0}
              </p>
              <p className="text-[11px] font-semibold text-purple-600">
                Đang công tác & có lịch trực
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-500 flex items-center justify-center font-bold">
              <Users className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        {/* 2. Lịch hôm nay */}
        <Card className="bg-white border-slate-200 text-slate-900 shadow-sm rounded-2xl">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Lịch Khám Hôm Nay
              </p>
              <p className="text-2xl font-black text-emerald-600">
                {loadingStats ? '...' : dashboard?.todayAppointments ?? 0}
              </p>
              <p className="text-[11px] font-semibold text-slate-500">
                Lượt đặt khám trong ngày
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center font-bold">
              <Calendar className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        {/* 3. Chờ xác nhận */}
        <Card className="bg-white border-slate-200 text-slate-900 shadow-sm rounded-2xl">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Chờ Xác Nhận
              </p>
              <p className="text-2xl font-black text-slate-900">
                {loadingStats ? '...' : dashboard?.pendingAppointments ?? 0}
              </p>
              <p className="text-[11px] font-semibold text-blue-600">
                Lịch hẹn mới cần duyệt
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-500 flex items-center justify-center font-bold">
              <Clock className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        {/* 4. Đã hoàn thành */}
        <Card className="bg-white border-slate-200 text-slate-900 shadow-sm rounded-2xl">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Đã Hoàn Thành
              </p>
              <p className="text-2xl font-black text-slate-900">
                {loadingStats ? '...' : dashboard?.completedAppointments ?? 0}
              </p>
              <p className="text-[11px] font-semibold text-amber-600">
                Lượt khám đã hoàn tất
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center font-bold">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 3. Main Content: Quick Hospital Summary & Recent Appointments */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Recent Appointments */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="bg-white border-slate-200 text-slate-900 rounded-2xl overflow-hidden shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-sm font-bold text-slate-900">
                  Lịch Hẹn Gần Đây
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Danh sách 5 lịch hẹn đặt khám mới nhất tại cơ sở
                </CardDescription>
              </div>
              <Link href="/hospital-admin/appointments">
                <Button variant="ghost" size="sm" className="text-xs text-emerald-700 hover:text-emerald-800 gap-1 hover:bg-emerald-50">
                  Xem tất cả
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-y border-slate-200 text-slate-600 font-semibold uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="p-3 pl-4">Mã Đặt Khám</th>
                      <th className="p-3">Bệnh Nhân</th>
                      <th className="p-3">Bác Sĩ / Chuyên Khoa</th>
                      <th className="p-3">Thời Gian</th>
                      <th className="p-3 text-right pr-4">Trạng Thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {loadingAppointments ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-500">
                          <Loader2 className="w-5 h-5 animate-spin mx-auto text-emerald-600 mb-1" />
                          Đang tải lịch hẹn...
                        </td>
                      </tr>
                    ) : appointments.length > 0 ? (
                      appointments.map((item: any) => (
                        <tr key={item.id} className="hover:bg-slate-50 transition">
                          <td className="p-3 pl-4 font-mono font-bold text-emerald-700">
                            {item.bookingCode}
                          </td>
                          <td className="p-3 font-medium text-slate-900">
                            <div>{item.patientName}</div>
                            <div className="text-[10px] text-slate-500">{item.patientPhone || '—'}</div>
                          </td>
                          <td className="p-3 text-slate-700">
                            <div>{item.doctorName}</div>
                            <div className="text-[10px] text-slate-500">{item.specialty}</div>
                          </td>
                          <td className="p-3 text-slate-600 text-[11px]">
                            {item.startTime
                              ? new Date(item.startTime).toLocaleString('vi-VN', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })
                              : '—'}
                          </td>
                          <td className="p-3 text-right pr-4">
                            <Badge
                              className={`text-[10px] font-bold ${
                                item.status === 'CONFIRMED'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : item.status === 'COMPLETED'
                                  ? 'bg-teal-50 text-teal-700 border border-teal-200'
                                  : item.status === 'CANCELLED'
                                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                  : 'bg-amber-50 text-amber-700 border border-amber-200'
                              }`}
                            >
                              {item.status}
                            </Badge>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-500 text-xs">
                          Chưa có lịch hẹn nào tại cơ sở này.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Col: Scope & Facility Summary */}
        <div className="space-y-4">
          <Card className="bg-white border-slate-200 text-slate-900 rounded-2xl shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Phạm Vi Dữ Liệu
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-emerald-50/80 border border-emerald-200 text-slate-700 space-y-1.5 leading-relaxed">
                <p className="font-semibold text-emerald-800 text-[11px]">
                  Bảo vệ dữ liệu đa cơ sở (Multi-tenant)
                </p>
                <p className="text-[11px] text-slate-600">
                  Tài khoản của bạn được gán cứng với cơ sở <strong>{hospital?.name}</strong>. Mọi truy vấn lịch hẹn, bác sĩ, bảng giá và dịch vụ đều được hệ thống backend thẩm định độc lập theo ID cơ sở y tế.
                </p>
              </div>

              <div className="space-y-2 pt-1 border-t border-slate-200 text-slate-700">
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Mã cơ sở:</span>
                  <span className="font-mono text-slate-800">{hospital?.hospitalCode || hospital?.id?.slice(0, 8)}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Giờ hoạt động:</span>
                  <span className="text-slate-800">{hospital?.operatingHours || '7:00 - 17:00 (Thứ 2 - Thứ 7)'}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Số cấp cứu:</span>
                  <span className="text-rose-600 font-bold">{hospital?.emergencyHotline || hospital?.hotline || '115'}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Dịch vụ đang mở:</span>
                  <span className="text-emerald-700 font-bold">{hospital?._count?.services || 0} dịch vụ</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
