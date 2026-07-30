'use client';

import { useQuery } from '@tanstack/react-query';
import { adminService } from '@/services/admin.service';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Users,
  UserCheck,
  Building2,
  CalendarCheck,
  DollarSign,
  TrendingUp,
  Activity,
  History,
  Loader2,
  Award,
  ShieldCheck,
  Clock,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

export default function AdminDashboardPage() {
  const { data: overview, isLoading: loadingOverview } = useQuery({
    queryKey: ['admin-overview'],
    queryFn: adminService.getOverview,
  });

  const { data: apptChart, isLoading: loadingApptChart } = useQuery({
    queryKey: ['admin-appt-chart'],
    queryFn: adminService.getAppointmentsByDay,
  });

  const { data: revChart, isLoading: loadingRevChart } = useQuery({
    queryKey: ['admin-rev-chart'],
    queryFn: adminService.getRevenueByMonth,
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
            Theo dõi tổng quan chỉ số phát triển hệ thống, doanh thu và các hoạt động đặt khám đa cơ sở.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-slate-950 border-slate-800 text-white shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tổng Doanh Thu</p>
              <p className="text-2xl font-black text-[#66FF33]">
                {loadingOverview ? '...' : (overview?.totalRevenue || 0).toLocaleString()}đ
              </p>
              <p className="text-[11px] text-emerald-400 flex items-center gap-1 font-semibold">
                <TrendingUp className="w-3 h-3" />
                Hôm nay: {(overview?.todayRevenue || 0).toLocaleString()}đ
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-[#66FF33] flex items-center justify-center font-bold">
              <DollarSign className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-950 border-slate-800 text-white shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tổng Lịch Khám</p>
              <p className="text-2xl font-black text-white">
                {loadingOverview ? '...' : overview?.totalAppointments || 0}
              </p>
              <p className="text-[11px] text-slate-400 font-semibold">
                Hôm nay: <strong className="text-white">{overview?.todayAppointments || 0}</strong> lượt
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center font-bold">
              <CalendarCheck className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-950 border-slate-800 text-white shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Bệnh Nhân Đăng Ký</p>
              <p className="text-2xl font-black text-white">
                {loadingOverview ? '...' : overview?.totalUsers || 0}
              </p>
              <p className="text-[11px] text-slate-400 font-semibold">Tài khoản hoạt động</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center font-bold">
              <Users className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-950 border-slate-800 text-white shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Bác Sĩ & Cơ Sở</p>
              <p className="text-2xl font-black text-white">
                {loadingOverview ? '...' : `${overview?.totalDoctors || 0} BS / ${overview?.totalHospitals || 0} BV`}
              </p>
              <p className="text-[11px] text-slate-400 font-semibold">Mạng lưới NovaCare</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
              <Building2 className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Appointments by Day */}
        <Card className="bg-slate-950 border-slate-800 text-white shadow-sm">
          <CardHeader className="border-b border-slate-800/80 pb-4">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Activity className="w-5 h-5 text-[#66FF33]" />
              Số Lượng Đặt Lịch (7 Ngày Gần Nhất)
            </CardTitle>
            <CardDescription className="text-xs text-slate-400">
              Thống kê lượng bệnh nhân đăng ký khám hàng ngày
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {loadingApptChart ? (
              <div className="h-64 flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-[#66FF33]" />
              </div>
            ) : (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={apptChart || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="label" stroke="#94a3b8" textAnchor="end" />
                    <YAxis stroke="#94a3b8" allowDecimals={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff' }}
                    />
                    <Bar dataKey="count" fill="#4caf50" radius={[6, 6, 0, 0]} name="Số lượt hẹn" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Revenue by Month */}
        <Card className="bg-slate-950 border-slate-800 text-white shadow-sm">
          <CardHeader className="border-b border-slate-800/80 pb-4">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
              Doanh Thu Hệ Thống (6 Tháng Gần Nhất)
            </CardTitle>
            <CardDescription className="text-xs text-slate-400">
              Tổng doanh thu từ các giao dịch thanh toán thành công
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {loadingRevChart ? (
              <div className="h-64 flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
              </div>
            ) : (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revChart || []}>
                    <defs>
                      <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="label" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip
                      formatter={(val: any) => [`${Number(val).toLocaleString()}đ`, 'Doanh thu']}
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff' }}
                    />
                    <Area type="monotone" dataKey="revenue" stroke="#10b981" fillOpacity={1} fill="url(#colorRev)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top 5 Doctors & Top 5 Hospitals */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Doctors */}
        <Card className="bg-slate-950 border-slate-800 text-white shadow-sm">
          <CardHeader className="border-b border-slate-800 pb-3">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-400" />
              Top Bác Sĩ Được Đặt Lịch Nhiều Nhất
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-3">
            {topDoctors?.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-4">Chưa có dữ liệu thống kê bác sĩ</p>
            ) : (
              topDoctors?.map((doc: any, index: number) => (
                <div key={doc.id || index} className="flex items-center justify-between bg-slate-900 p-3 rounded-xl border border-slate-800 text-xs">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-slate-800 text-amber-400 font-extrabold flex items-center justify-center shrink-0">
                      {index + 1}
                    </span>
                    <div>
                      <p className="font-extrabold text-white">{doc.title} {doc.fullName}</p>
                      <p className="text-[11px] text-slate-400">{doc.qualification || 'Bác sĩ chuyên khoa'}</p>
                    </div>
                  </div>
                  <span className="font-bold text-[#66FF33] bg-emerald-950 px-2.5 py-1 rounded-lg border border-emerald-800">
                    {doc.appointmentCount} lượt khám
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Top Hospitals */}
        <Card className="bg-slate-950 border-slate-800 text-white shadow-sm">
          <CardHeader className="border-b border-slate-800 pb-3">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Building2 className="w-4 h-4 text-blue-400" />
              Top Cơ Sở Y Tế Hot Nhất
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-3">
            {topHospitals?.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-4">Chưa có dữ liệu thống kê bệnh viện</p>
            ) : (
              topHospitals?.map((hosp: any, index: number) => (
                <div key={hosp.id || index} className="flex items-center justify-between bg-slate-900 p-3 rounded-xl border border-slate-800 text-xs">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-slate-800 text-blue-400 font-extrabold flex items-center justify-center shrink-0">
                      {index + 1}
                    </span>
                    <div>
                      <p className="font-extrabold text-white">{hosp.name}</p>
                      <p className="text-[11px] text-slate-400 truncate max-w-[200px]">{hosp.address || 'Chưa cập nhật địa chỉ'}</p>
                    </div>
                  </div>
                  <span className="font-bold text-blue-400 bg-blue-950 px-2.5 py-1 rounded-lg border border-blue-800">
                    {hosp.appointmentCount} lượt đặt
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Audit Logs Table Preview */}
      <Card className="bg-slate-950 border-slate-800 text-white shadow-sm">
        <CardHeader className="border-b border-slate-800 pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <History className="w-4 h-4 text-emerald-400" />
            Nhật Ký Thao Tác Quản Trị Viên (Audit Logs)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
              <tr>
                <th className="p-3">Hành động</th>
                <th className="p-3">Đối tượng</th>
                <th className="p-3">Người thực hiện</th>
                <th className="p-3">Địa chỉ IP</th>
                <th className="p-3">Thời gian</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {auditLogs?.items?.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-4 text-center text-slate-500">Chưa có nhật ký thao tác nào</td>
                </tr>
              ) : (
                auditLogs?.items?.map((log: any) => (
                  <tr key={log.id} className="hover:bg-slate-900/50">
                    <td className="p-3 font-bold text-[#66FF33] font-mono">{log.action}</td>
                    <td className="p-3 font-semibold text-slate-300">{log.entityType} ({log.entityId?.slice(0, 8) || 'N/A'})</td>
                    <td className="p-3 font-semibold text-white">{log.user?.fullName || log.userId}</td>
                    <td className="p-3 text-slate-400 font-mono">{log.ipAddress || '127.0.0.1'}</td>
                    <td className="p-3 text-slate-400">{new Date(log.createdAt).toLocaleString('vi-VN')}</td>
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
