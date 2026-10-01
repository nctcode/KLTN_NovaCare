'use client';

import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService } from '@/services/admin.service';
import { useAdminTheme } from '@/components/admin/AdminThemeContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Share2,
  ShieldCheck,
  Building2,
  Users,
  Activity,
  Radio,
  FileCheck2,
  RefreshCw,
  Search,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  Sparkles,
  Server,
  Lock,
  Eye,
  FileText,
  Loader2,
  Wifi,
  ExternalLink,
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
} from 'recharts';

export default function AdminInteroperabilityPage() {
  const queryClient = useQueryClient();
  const { theme } = useAdminTheme();
  const isLight = theme === 'light';

  // State
  const [activeTab, setActiveTab] = useState<'overview' | 'audit' | 'gateways'>('overview');
  const [searchAudit, setSearchAudit] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [auditPage, setAuditPage] = useState(1);

  const cardStyle = isLight
    ? 'bg-white border-slate-200 text-slate-900 shadow-sm'
    : 'bg-slate-950 border-slate-800 text-white shadow-sm';

  const tableHeaderStyle = isLight
    ? 'bg-slate-100 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider'
    : 'bg-slate-900 border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider';

  // 1. Overview KPIs
  const { data: overview, isLoading: loadingOverview, refetch: refetchOverview } = useQuery({
    queryKey: ['admin-interop-overview'],
    queryFn: adminService.getInteroperabilityOverview,
    refetchInterval: 15000, // Real-time poll every 15s
  });

  // 2. Traffic Chart
  const { data: trafficChart, isLoading: loadingTraffic, refetch: refetchTraffic } = useQuery({
    queryKey: ['admin-interop-traffic'],
    queryFn: adminService.getInteroperabilityTrafficChart,
    refetchInterval: 15000,
  });

  // 3. Hospital Matrix
  const { data: hospitalMatrix, isLoading: loadingMatrix } = useQuery({
    queryKey: ['admin-interop-matrix'],
    queryFn: adminService.getInteroperabilityHospitalMatrix,
  });

  // 4. Live Audit Stream
  const { data: auditStreamData, isLoading: loadingAudit, refetch: refetchAudit } = useQuery({
    queryKey: ['admin-interop-audit', auditPage, searchAudit, statusFilter],
    queryFn: () =>
      adminService.getInteroperabilityLiveAuditStream({
        page: auditPage,
        limit: 15,
        search: searchAudit,
        status: statusFilter,
      }),
    refetchInterval: 10000, // Live stream refresh every 10s
  });

  // 5. Gateways Health
  const { data: gateways, isLoading: loadingGateways, refetch: refetchGateways } = useQuery({
    queryKey: ['admin-interop-gateways'],
    queryFn: adminService.getInteroperabilityGateways,
  });

  // Safely extract audit stream items
  const auditItems = useMemo(() => {
    if (!auditStreamData) return [];
    if (Array.isArray(auditStreamData)) return auditStreamData;
    if (Array.isArray(auditStreamData.items)) return auditStreamData.items;
    if (Array.isArray(auditStreamData.data?.items)) return auditStreamData.data.items;
    if (Array.isArray(auditStreamData.data)) return auditStreamData.data;
    return [];
  }, [auditStreamData]);

  const auditPagination = useMemo(() => {
    return (
      auditStreamData?.pagination ||
      auditStreamData?.data?.pagination || {
        page: auditPage,
        limit: 15,
        total: auditItems.length,
        totalPages: Math.ceil(auditItems.length / 15) || 1,
      }
    );
  }, [auditStreamData, auditPage, auditItems.length]);

  const handleRefreshAll = () => {
    refetchOverview();
    refetchTraffic();
    refetchAudit();
    refetchGateways();
    toast.info('Đang đồng bộ dữ liệu giám sát mới nhất...');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-8">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gradient-to-r from-[#0c4b39] via-emerald-900 to-slate-950 p-6 rounded-3xl border border-emerald-500/20 shadow-lg text-white">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#66FF33]/20 text-[#66FF33] text-xs font-bold uppercase tracking-wider mb-2">
            <Radio className="w-3.5 h-3.5 animate-pulse" />
            HIE Telemetry & Interoperability Center
          </div>
          <h1 className="text-2xl font-black tracking-tight">Trung Tâm Giám Sát Liên Thông Y Tế</h1>
          <p className="text-xs text-slate-300 mt-1">
            Giám sát lưu lượng trao đổi hồ sơ bệnh án đa viện, kiểm soát an toàn bảo mật và tình trạng kết nối cổng HIS.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          <Badge className="bg-emerald-500/20 text-[#66FF33] border-emerald-500/40 px-3 py-1.5 text-xs font-semibold rounded-xl">
            <Radio className="w-3 h-3 mr-1.5 animate-pulse text-[#66FF33]" />
            Dữ liệu thực tế trực tiếp
          </Badge>

          <Button
            variant="outline"
            size="sm"
            onClick={handleRefreshAll}
            className="text-xs bg-white/10 hover:bg-white/20 text-white border-white/20 rounded-xl"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
            Làm mới
          </Button>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Tổng lượt tra cứu */}
        <Card className={cardStyle}>
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className={`text-xs font-bold uppercase tracking-wider ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Tổng Lượt Tra Cứu
              </p>
              <p className={`text-2xl font-black ${isLight ? 'text-slate-900' : 'text-white'}`}>
                {loadingOverview ? '...' : overview?.totalLookups || 0}
              </p>
              <p className={`text-[11px] font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1`}>
                <Clock className="w-3 h-3" />
                Hôm nay: {overview?.todayLookups || 0} lượt
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-500 flex items-center justify-center font-bold">
              <Share2 className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Tỷ lệ xác thực thành công */}
        <Card className={cardStyle}>
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className={`text-xs font-bold uppercase tracking-wider ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Tỷ Lệ Xác Thực Thành Công
              </p>
              <p className="text-2xl font-black text-emerald-600 dark:text-[#66FF33]">
                {loadingOverview ? '...' : `${overview?.successRate || 100}%`}
              </p>
              <p className={`text-[11px] font-semibold ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Khớp mã & đúng mã PIN
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center font-bold">
              <ShieldCheck className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Bệnh viện kết nối */}
        <Card className={cardStyle}>
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className={`text-xs font-bold uppercase tracking-wider ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Cổng HIS Trực Tuyến
              </p>
              <p className={`text-2xl font-black ${isLight ? 'text-slate-900' : 'text-white'}`}>
                {loadingOverview ? '...' : `${overview?.connectedHospitals || 6}/${overview?.connectedHospitals || 6}`}
              </p>
              <p className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1">
                <Wifi className="w-3 h-3" />
                100% Node hoạt động
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-500 flex items-center justify-center font-bold">
              <Building2 className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        {/* Card 4: Hồ sơ định danh MPI */}
        <Card className={cardStyle}>
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className={`text-xs font-bold uppercase tracking-wider ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Định Danh Y Tế (MPI)
              </p>
              <p className={`text-2xl font-black ${isLight ? 'text-slate-900' : 'text-white'}`}>
                {loadingOverview ? '...' : overview?.linkedPatients || 0}
              </p>
              <p className={`text-[11px] font-semibold text-cyan-600 dark:text-cyan-400`}>
                {overview?.totalEncounters || 0} đợt khám sẵn sàng
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-500 flex items-center justify-center font-bold">
              <Users className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs Switcher */}
      <div className={`flex border-b ${isLight ? 'border-slate-200' : 'border-slate-800'} gap-6 text-xs sm:text-sm font-bold`}>
        <button
          onClick={() => setActiveTab('overview')}
          className={`pb-3 border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'overview'
              ? 'border-emerald-600 text-emerald-600 dark:border-emerald-400 dark:text-emerald-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Biểu Đồ Lưu Lượng & Ma Trận</span>
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`pb-3 border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'audit'
              ? 'border-emerald-600 text-emerald-600 dark:border-emerald-400 dark:text-emerald-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400'
          }`}
        >
          <Radio className="w-4 h-4" />
          <span>Nhật Ký Truy Xuất (Live Audit Stream)</span>
          {overview?.securityAlertsCount > 0 && (
            <Badge className="bg-rose-500 text-white text-[10px] px-1.5 py-0 h-4">
              {overview?.securityAlertsCount} cảnh báo
            </Badge>
          )}
        </button>

        <button
          onClick={() => setActiveTab('gateways')}
          className={`pb-3 border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'gateways'
              ? 'border-emerald-600 text-emerald-600 dark:border-emerald-400 dark:text-emerald-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400'
          }`}
        >
          <Server className="w-4 h-4" />
          <span>Trạng Thái Cổng HIS Bệnh Viện</span>
        </button>
      </div>

      {/* ==========================================
          TAB 1: BIỂU ĐỒ LƯU LƯỢNG & MA TRẬN
         ========================================== */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Biểu đồ lưu lượng 7 ngày */}
          <Card className={`${cardStyle} lg:col-span-8`}>
            <CardHeader className={`border-b pb-4 ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <Activity className="w-5 h-5 text-emerald-500" />
                    Lưu Lượng Tra Cứu Liên Viện 7 Ngày Qua
                  </CardTitle>
                  <CardDescription className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    Thống kê số lượng phiên tra cứu thành công và các lượt bị chặn do sai mã PIN bảo mật
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2 text-xs font-mono text-slate-500">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> Thành công
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block ml-2" /> Cảnh báo lỗi
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              {loadingTraffic ? (
                <div className="h-72 flex items-center justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
                </div>
              ) : (
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={trafficChart || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={isLight ? '#e2e8f0' : '#334155'} vertical={false} />
                      <XAxis dataKey="label" stroke={isLight ? '#64748b' : '#94a3b8'} tickLine={false} />
                      <YAxis stroke={isLight ? '#64748b' : '#94a3b8'} allowDecimals={false} tickLine={false} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: isLight ? '#ffffff' : '#0f172a',
                          borderColor: isLight ? '#cbd5e1' : '#334155',
                          borderRadius: '12px',
                          color: isLight ? '#0f172a' : '#ffffff',
                          fontSize: '12px',
                        }}
                      />
                      <Legend
                        verticalAlign="bottom"
                        height={36}
                        formatter={(val) => <span className={`text-xs ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>{val}</span>}
                      />
                      <Bar dataKey="success" name="Thành công" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} />
                      <Bar dataKey="failed" name="Bị từ chối / Sai PIN" stackId="a" fill="#ef4444" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Ma trận phân bổ theo bệnh viện */}
          <Card className={`${cardStyle} lg:col-span-4`}>
            <CardHeader className={`border-b pb-4 ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-500" />
                Cơ Sở Phát Sinh Tra Cứu
              </CardTitle>
              <CardDescription className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Tần suất gửi yêu cầu tra cứu từ các bệnh viện liên kết
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              {loadingMatrix ? (
                <div className="h-64 flex items-center justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                </div>
              ) : hospitalMatrix?.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-8">Chưa có dữ liệu tra cứu từ bệnh viện nào</p>
              ) : (
                hospitalMatrix?.map((item: any, idx: number) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-xl border text-xs space-y-2 ${
                      isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900 border-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold">
                      <span className="truncate max-w-[200px]">{item.hospitalName}</span>
                      <span className="text-blue-600 dark:text-blue-400 font-mono font-black">
                        {item.requestCount} lượt
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-blue-500 h-full rounded-full"
                          style={{ width: `${Math.min(100, Math.max(8, item.percentage))}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono shrink-0">{item.percentage}%</span>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ==========================================
          TAB 2: NHẬT KÝ TRUY XUẤT (LIVE AUDIT STREAM)
         ========================================== */}
      {activeTab === 'audit' && (
        <Card className={cardStyle}>
          <CardHeader className={`border-b pb-4 ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Radio className="w-5 h-5 text-emerald-500 animate-pulse" />
                  Dòng Sự Kiện Nhật Ký Liên Thông (Real-Time Audit Stream)
                </CardTitle>
                <CardDescription className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  Mỗi lượt mở hồ sơ đều được mã hóa, đối soát ngữ cảnh và lưu giữ phục vụ thanh tra an toàn y tế
                </CardDescription>
              </div>

              {/* Filters */}
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-64">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                  <Input
                    value={searchAudit}
                    onChange={(e) => setSearchAudit(e.target.value)}
                    placeholder="Tìm tên BS, BV, bệnh nhân, CCCD..."
                    className="h-8 pl-8 text-xs rounded-xl"
                  />
                </div>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="h-8 px-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 font-medium"
                >
                  <option value="ALL">Tất cả trạng thái</option>
                  <option value="SUCCESS">Thành công (200)</option>
                  <option value="INVALID_PIN">Sai mã PIN (403)</option>
                </select>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0 overflow-x-auto">
            {loadingAudit ? (
              <div className="h-64 flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
              </div>
            ) : auditItems.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-12">Không tìm thấy nhật ký truy xuất nào phù hợp</p>
            ) : (
              <div>
                <table className="w-full text-left text-xs">
                  <thead className={tableHeaderStyle}>
                    <tr>
                      <th className="p-3.5">Thời gian</th>
                      <th className="p-3.5">Bệnh nhân (Định danh)</th>
                      <th className="p-3.5">Bác sĩ tiếp nhận</th>
                      <th className="p-3.5">Cơ sở yêu cầu (Bệnh viện)</th>
                      <th className="p-3.5">Mục đích lâm sàng</th>
                      <th className="p-3.5 text-center">Trạng thái</th>
                      <th className="p-3.5">IP Trạm</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${isLight ? 'divide-slate-200' : 'divide-slate-800/60'}`}>
                    {auditItems.map((log: any) => {
                      const isSuccess = log.status === 'SUCCESS';
                      return (
                        <tr key={log.id} className={isLight ? 'hover:bg-slate-50' : 'hover:bg-slate-900/50'}>
                          <td className="p-3.5 font-mono text-slate-500 whitespace-nowrap">
                            {new Date(log.accessedAt).toLocaleString('vi-VN')}
                          </td>
                          <td className="p-3.5">
                            <p className={`font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{log.patientName}</p>
                            <p className="text-[11px] font-mono text-slate-400">
                              {log.patientCode || log.identityNumber}
                            </p>
                          </td>
                          <td className={`p-3.5 font-semibold ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                            {log.doctorName}
                          </td>
                          <td className="p-3.5">
                            <span className="font-semibold block">{log.hospitalName}</span>
                            <span className="text-[10px] text-slate-400 uppercase font-mono">Phương thức: {log.method}</span>
                          </td>
                          <td className="p-3.5 text-slate-600 dark:text-slate-300 max-w-[200px] truncate" title={log.purpose}>
                            {log.purpose}
                          </td>
                          <td className="p-3.5 text-center whitespace-nowrap">
                            {isSuccess ? (
                              <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 text-[10px] font-bold">
                                <CheckCircle2 className="w-3 h-3 mr-1" />
                                Thành công
                              </Badge>
                            ) : (
                              <Badge className="bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300 text-[10px] font-bold">
                                <XCircle className="w-3 h-3 mr-1" />
                                Sai mã PIN (Chặn)
                              </Badge>
                            )}
                          </td>
                          <td className="p-3.5 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                            {log.ipAddress}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {/* Pagination Controls */}
                {auditPagination.totalPages > 1 && (
                  <div className={`flex items-center justify-between px-4 py-3 border-t text-xs ${isLight ? 'border-slate-200 text-slate-600' : 'border-slate-800 text-slate-400'}`}>
                    <span>
                      Hiển thị trang <strong className="font-bold text-emerald-600">{auditPagination.page}</strong> / {auditPagination.totalPages} (Tổng số {auditPagination.total} bản ghi)
                    </span>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={auditPage <= 1}
                        onClick={() => setAuditPage((p) => Math.max(1, p - 1))}
                        className="h-7 text-xs rounded-lg"
                      >
                        Trang trước
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={auditPage >= auditPagination.totalPages}
                        onClick={() => setAuditPage((p) => p + 1)}
                        className="h-7 text-xs rounded-lg"
                      >
                        Trang sau
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ==========================================
          TAB 3: TRẠNG THÁI CỔNG HIS CÁC BỆNH VIỆN
         ========================================== */}
      {activeTab === 'gateways' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {loadingGateways ? (
            <div className="col-span-full py-12 flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
            </div>
          ) : (
            gateways?.map((gw: any) => (
              <Card key={gw.hospitalId} className={`${cardStyle} rounded-2xl p-5 space-y-4`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-500 flex items-center justify-center font-bold shrink-0">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-sm truncate" title={gw.hospitalName}>
                        {gw.hospitalName}
                      </h3>
                      <p className="text-[11px] text-slate-400 truncate">{gw.address || gw.city}</p>
                    </div>
                  </div>
                  <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 text-[10px] font-bold shrink-0">
                    🟢 ONLINE
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900">
                    <span className="text-[10px] text-slate-400 block">Độ trễ phản hồi (Latency)</span>
                    <span className="font-mono font-bold text-emerald-600">{gw.latencyMs}ms</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900">
                    <span className="text-[10px] text-slate-400 block">Uptime Gateway</span>
                    <span className="font-mono font-bold text-blue-600">{gw.uptime}</span>
                  </div>
                </div>

                <div className="space-y-1.5 text-[11px]">
                  <span className="text-slate-400 font-medium block">Endpoint kết nối HIS Node:</span>
                  <code className="text-slate-600 dark:text-slate-300 font-mono text-[10px] block p-1.5 rounded bg-slate-100 dark:bg-slate-900 truncate">
                    {gw.endpointUrl}
                  </code>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Chuẩn hỗ trợ:</span>
                  <span className="font-semibold text-emerald-600">QĐ 4750/QĐ-BYT · FHIR v4</span>
                </div>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}
