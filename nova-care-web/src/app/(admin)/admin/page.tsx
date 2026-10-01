'use client';

import { useQuery } from '@tanstack/react-query';
import { adminService } from '@/services/admin.service';
import { useAdminTheme } from '@/components/admin/AdminThemeContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Users,
  UserCheck,
  Building2,
  CalendarCheck,
  Activity,
  History,
  Loader2,
  Award,
  ShieldCheck,
  PieChart as PieChartIcon,
  CheckCircle2,
  Clock,
  XCircle,
  CreditCard,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

export default function AdminDashboardPage() {
  const { theme } = useAdminTheme();
  const isLight = theme === 'light';

  const cardStyle = isLight
    ? 'bg-white border-slate-200 text-slate-900 shadow-sm'
    : 'bg-slate-950 border-slate-800 text-white shadow-sm';

  const tableHeaderStyle = isLight
    ? 'bg-slate-100 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider'
    : 'bg-slate-900 border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider';

  const { data: overview, isLoading: loadingOverview } = useQuery({
    queryKey: ['admin-overview'],
    queryFn: adminService.getOverview,
  });

  const { data: apptChart, isLoading: loadingApptChart } = useQuery({
    queryKey: ['admin-appt-chart'],
    queryFn: adminService.getAppointmentsByDay,
  });

  const { data: statusDist, isLoading: loadingStatusDist } = useQuery({
    queryKey: ['admin-status-dist'],
    queryFn: adminService.getAppointmentStatusDistribution,
  });

  const { data: topDoctors } = useQuery({
    queryKey: ['admin-top-doctors'],
    queryFn: adminService.getTopDoctors,
  });

  const { data: topHospitals } = useQuery({
    queryKey: ['admin-top-hospitals'],
    queryFn: adminService.getTopHospitals,
  });

  const { data: auditLogs } = useQuery({
    queryKey: ['admin-recent-audit-logs'],
    queryFn: () => adminService.getAuditLogs({ limit: 5 }),
  });

  const totalApptCount = overview?.totalAppointments || 0;

  // Custom Tooltip for 7-day Stacked Bar Chart
  const CustomBarTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const dayData = payload[0]?.payload;
      return (
        <div
          className={`p-3 rounded-xl shadow-xl border text-xs space-y-1.5 min-w-[190px] ${
            isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'
          }`}
        >
          <div className="flex items-center justify-between border-b pb-1.5 font-bold">
            <span>Ngày {label}</span>
            <span className="text-emerald-500 font-mono font-black">{dayData?.total || 0} lịch</span>
          </div>
          <div className="space-y-1 pt-0.5">
            {payload.map((entry: any, index: number) => {
              if (!entry.value || entry.value === 0) return null;
              return (
                <div key={`item-${index}`} className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
                    <span className="text-[11px] text-slate-400">{entry.name}:</span>
                  </div>
                  <span className="font-bold text-[11px]">{entry.value}</span>
                </div>
              );
            })}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gradient-to-r from-[#0c4b39] via-emerald-900 to-slate-950 p-6 rounded-3xl border border-emerald-500/20 shadow-lg text-white">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#66FF33]/20 text-[#66FF33] text-xs font-bold uppercase tracking-wider mb-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            NovaCare Central Control Panel
          </div>
          <h1 className="text-2xl font-black tracking-tight">Bảng Điều Khiển Quản Trị Viên</h1>
          <p className="text-xs text-slate-300 mt-1">
            Theo dõi tổng quan số lượng người dùng, bác sĩ, cơ sở y tế và trạng thái lịch hẹn toàn hệ thống.
          </p>
        </div>
      </div>

      {/* KPI Cards: Tổng user, Tổng lịch hẹn, Cơ sở y tế (Bệnh viện), Bác sĩ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Tổng User */}
        <Card className={cardStyle}>
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className={`text-xs font-bold uppercase tracking-wider ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Tổng Người Dùng
              </p>
              <p className={`text-2xl font-black ${isLight ? 'text-slate-900' : 'text-white'}`}>
                {loadingOverview ? '...' : overview?.totalUsers || 0}
              </p>
              <p className={`text-[11px] font-semibold ${isLight ? 'text-purple-600' : 'text-purple-400'}`}>
                {overview?.totalPatients || 0} bệnh nhân đăng ký
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-500 flex items-center justify-center font-bold">
              <Users className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        {/* 2. Tổng Lịch Hẹn */}
        <Card className={cardStyle}>
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className={`text-xs font-bold uppercase tracking-wider ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Tổng Lịch Khám
              </p>
              <p className="text-2xl font-black text-emerald-600 dark:text-[#66FF33]">
                {loadingOverview ? '...' : overview?.totalAppointments || 0}
              </p>
              <p className={`text-[11px] font-semibold ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Hôm nay: <strong className="text-emerald-600">{overview?.todayAppointments || 0}</strong> lượt hẹn
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center font-bold">
              <CalendarCheck className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        {/* 3. Tổng Bệnh Viện */}
        <Card className={cardStyle}>
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className={`text-xs font-bold uppercase tracking-wider ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Cơ Sở Y Tế
              </p>
              <p className={`text-2xl font-black ${isLight ? 'text-slate-900' : 'text-white'}`}>
                {loadingOverview ? '...' : overview?.totalHospitals || 0}
              </p>
              <p className={`text-[11px] font-semibold ${isLight ? 'text-blue-600' : 'text-blue-400'}`}>
                Bệnh viện & phòng khám
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-500 flex items-center justify-center font-bold">
              <Building2 className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        {/* 4. Tổng Bác Sĩ */}
        <Card className={cardStyle}>
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className={`text-xs font-bold uppercase tracking-wider ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Đội Ngũ Bác Sĩ
              </p>
              <p className={`text-2xl font-black ${isLight ? 'text-slate-900' : 'text-white'}`}>
                {loadingOverview ? '...' : overview?.totalDoctors || 0}
              </p>
              <p className={`text-[11px] font-semibold ${isLight ? 'text-amber-600' : 'text-amber-400'}`}>
                Bác sĩ đang hoạt động
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center font-bold">
              <UserCheck className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row: Biểu đồ trạng thái lịch hẹn 7 ngày qua + Phân bổ trạng thái lịch hẹn */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Biểu đồ trạng thái lịch hẹn 7 ngày qua */}
        <Card className={`${cardStyle} lg:col-span-7 xl:col-span-8`}>
          <CardHeader className={`border-b pb-4 ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Activity className="w-5 h-5 text-emerald-500" />
                  Trạng Thái Lịch Hẹn 7 Ngày Qua
                </CardTitle>
                <CardDescription className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  Biến động số lượng và phân loại trạng thái đặt khám theo từng ngày
                </CardDescription>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-500 bg-slate-100 dark:bg-slate-900 px-2.5 py-1 rounded-lg">
                <Clock className="w-3.5 h-3.5 text-emerald-500" />
                <span>7 ngày gần nhất</span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {loadingApptChart ? (
              <div className="h-72 flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
              </div>
            ) : (
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={apptChart || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={isLight ? '#e2e8f0' : '#334155'} vertical={false} />
                    <XAxis dataKey="label" stroke={isLight ? '#64748b' : '#94a3b8'} tickLine={false} />
                    <YAxis stroke={isLight ? '#64748b' : '#94a3b8'} allowDecimals={false} tickLine={false} />
                    <Tooltip content={<CustomBarTooltip />} />
                    <Legend
                      verticalAlign="bottom"
                      height={36}
                      iconType="circle"
                      formatter={(val) => <span className={`text-xs ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>{val}</span>}
                    />
                    <Bar dataKey="completed" name="Đã hoàn thành" stackId="a" fill="#10b981" />
                    <Bar dataKey="confirmed" name="Đã xác nhận" stackId="a" fill="#3b82f6" />
                    <Bar dataKey="pending" name="Chờ duyệt / khám" stackId="a" fill="#f59e0b" />
                    <Bar dataKey="paid" name="Đã thanh toán" stackId="a" fill="#06b6d4" />
                    <Bar dataKey="awaitingPayment" name="Chờ thanh toán" stackId="a" fill="#8b5cf6" />
                    <Bar dataKey="cancelled" name="Đã hủy" stackId="a" fill="#ef4444" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Phân bổ trạng thái lịch hẹn (Donut Chart & List) */}
        <Card className={`${cardStyle} lg:col-span-5 xl:col-span-4`}>
          <CardHeader className={`border-b pb-4 ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <PieChartIcon className="w-5 h-5 text-blue-500" />
              Trạng Thái Lịch Hẹn
            </CardTitle>
            <CardDescription className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              Phân bổ tỷ lệ trạng thái lịch hẹn trên toàn hệ thống ({totalApptCount} lượt)
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            {loadingStatusDist ? (
              <div className="h-64 flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
              </div>
            ) : (
              <>
                {/* Donut Chart */}
                <div className="h-44 w-full relative flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusDist || []}
                        dataKey="count"
                        nameKey="label"
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={75}
                        paddingAngle={3}
                      >
                        {(statusDist || []).map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={entry.color} stroke={isLight ? '#ffffff' : '#0f172a'} strokeWidth={2} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(val: any, name: any, item: any) => [
                          `${val} lượt (${item?.payload?.percentage || 0}%)`,
                          name,
                        ]}
                        contentStyle={{
                          backgroundColor: isLight ? '#ffffff' : '#0f172a',
                          borderColor: isLight ? '#cbd5e1' : '#334155',
                          borderRadius: '12px',
                          color: isLight ? '#0f172a' : '#ffffff',
                          fontSize: '12px',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  {/* Center Text */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-xs text-slate-400 font-medium">Tổng lịch</span>
                    <span className={`text-xl font-black ${isLight ? 'text-slate-900' : 'text-white'}`}>
                      {totalApptCount}
                    </span>
                  </div>
                </div>

                {/* Status Breakdown Legend List */}
                <div className="space-y-2 pt-1 border-t border-slate-100 dark:border-slate-800">
                  {(statusDist || []).map((item: any) => (
                    <div key={item.status} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                        <span className={isLight ? 'text-slate-700 font-medium' : 'text-slate-300 font-medium'}>
                          {item.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                          {item.count}
                        </span>
                        <span className="text-[11px] text-slate-400 w-11 text-right">
                          ({item.percentage}%)
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Bệnh Viện & Top Bác Sĩ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Cơ Sở Y Tế / Bệnh Viện */}
        <Card className={cardStyle}>
          <CardHeader className={`border-b pb-3 ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
            <CardTitle className="text-sm font-bold flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-blue-500" />
                Top Bệnh Viện Được Đặt Lịch Nhiều Nhất
              </span>
              <span className="text-xs font-normal text-slate-400">
                Xếp hạng theo lượt khám
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-3">
            {topHospitals?.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-6">Chưa có dữ liệu thống kê bệnh viện</p>
            ) : (
              topHospitals?.map((hosp: any, index: number) => {
                const badgeColor =
                  index === 0
                    ? 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800'
                    : index === 1
                    ? 'bg-slate-200 text-slate-800 border-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700'
                    : index === 2
                    ? 'bg-amber-700/10 text-amber-700 border-amber-600/30 dark:bg-amber-900/30 dark:text-amber-400'
                    : isLight
                    ? 'bg-slate-100 text-slate-600 border-slate-200'
                    : 'bg-slate-900 text-slate-400 border-slate-800';

                return (
                  <div
                    key={hosp.id || index}
                    className={`p-3.5 rounded-2xl border transition-all text-xs ${
                      isLight ? 'bg-slate-50/80 border-slate-200 hover:bg-slate-100/70' : 'bg-slate-900/70 border-slate-800 hover:bg-slate-900'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <span
                          className={`w-7 h-7 rounded-xl font-black text-xs flex items-center justify-center shrink-0 border ${badgeColor}`}
                        >
                          #{index + 1}
                        </span>
                        <div className="min-w-0">
                          <p className={`font-black truncate ${isLight ? 'text-slate-900' : 'text-white'}`}>
                            {hosp.name}
                          </p>
                          <p className={`text-[11px] truncate ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                            {hosp.address || hosp.city || 'Cơ sở khám chữa bệnh liên kết'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span
                          className={`font-black px-2.5 py-1 rounded-lg border text-xs inline-block ${
                            isLight
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : 'bg-blue-950 text-blue-400 border-blue-800'
                          }`}
                        >
                          {hosp.appointmentCount} lượt đặt
                        </span>
                      </div>
                    </div>

                    {/* Progress indicator */}
                    <div className="mt-2.5 flex items-center gap-2">
                      <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-blue-500 h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${Math.min(
                              100,
                              Math.max(
                                4,
                                totalApptCount > 0 ? (hosp.appointmentCount / totalApptCount) * 100 : 0
                              )
                            )}%`,
                          }}
                        />
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono shrink-0">
                        {hosp.percentage || (totalApptCount > 0 ? Math.round((hosp.appointmentCount / totalApptCount) * 100) : 0)}%
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* Top Bác Sĩ Được Đặt Lịch */}
        <Card className={cardStyle}>
          <CardHeader className={`border-b pb-3 ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
            <CardTitle className="text-sm font-bold flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-500" />
                Top Bác Sĩ Được Đặt Lịch Nhiều Nhất
              </span>
              <span className="text-xs font-normal text-slate-400">
                Xếp hạng theo lượt khám
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-3">
            {topDoctors?.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-6">Chưa có dữ liệu thống kê bác sĩ</p>
            ) : (
              topDoctors?.map((doc: any, index: number) => {
                const badgeColor =
                  index === 0
                    ? 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800'
                    : index === 1
                    ? 'bg-slate-200 text-slate-800 border-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700'
                    : index === 2
                    ? 'bg-amber-700/10 text-amber-700 border-amber-600/30 dark:bg-amber-900/30 dark:text-amber-400'
                    : isLight
                    ? 'bg-slate-100 text-slate-600 border-slate-200'
                    : 'bg-slate-900 text-slate-400 border-slate-800';

                return (
                  <div
                    key={doc.id || index}
                    className={`p-3.5 rounded-2xl border transition-all text-xs ${
                      isLight ? 'bg-slate-50/80 border-slate-200 hover:bg-slate-100/70' : 'bg-slate-900/70 border-slate-800 hover:bg-slate-900'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <span
                          className={`w-7 h-7 rounded-xl font-black text-xs flex items-center justify-center shrink-0 border ${badgeColor}`}
                        >
                          #{index + 1}
                        </span>
                        <div className="min-w-0">
                          <p className={`font-black truncate ${isLight ? 'text-slate-900' : 'text-white'}`}>
                            {doc.title ? `${doc.title} ` : ''}{doc.fullName}
                          </p>
                          <p className={`text-[11px] truncate ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                            {doc.specialties || doc.qualification || 'Bác sĩ chuyên khoa'}
                            {doc.hospitals ? ` • ${doc.hospitals}` : ''}
                          </p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span
                          className={`font-black px-2.5 py-1 rounded-lg border text-xs inline-block ${
                            isLight
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-emerald-950 text-[#66FF33] border-emerald-800'
                          }`}
                        >
                          {doc.appointmentCount} lượt khám
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>

      {/* Audit Logs Table Preview */}
      <Card className={cardStyle}>
        <CardHeader className={`border-b pb-3 flex flex-row items-center justify-between ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <History className="w-4 h-4 text-emerald-600" />
            Nhật Ký Thao Tác Quản Trị Viên (Audit Logs)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className={tableHeaderStyle}>
              <tr>
                <th className="p-3">Hành động</th>
                <th className="p-3">Đối tượng</th>
                <th className="p-3">Người thực hiện</th>
                <th className="p-3">Địa chỉ IP</th>
                <th className="p-3">Thời gian</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isLight ? 'divide-slate-200' : 'divide-slate-800/60'}`}>
              {auditLogs?.items?.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-4 text-center text-slate-500">Chưa có nhật ký thao tác nào</td>
                </tr>
              ) : (
                auditLogs?.items?.map((log: any) => (
                  <tr key={log.id} className={isLight ? 'hover:bg-slate-50' : 'hover:bg-slate-900/50'}>
                    <td className="p-3 font-bold text-emerald-600 font-mono">{log.action}</td>
                    <td className={`p-3 font-semibold ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>{log.entityType} ({log.entityId?.slice(0, 8) || 'N/A'})</td>
                    <td className={`p-3 font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>{log.user?.fullName || log.userId}</td>
                    <td className="p-3 text-slate-500 font-mono">{log.ipAddress || '127.0.0.1'}</td>
                    <td className="p-3 text-slate-500">{new Date(log.createdAt).toLocaleString('vi-VN')}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
