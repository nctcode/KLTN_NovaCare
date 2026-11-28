'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { adminService } from '@/services/admin.service';
import { useAdminTheme } from '@/components/admin/AdminThemeContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  Network,
  Activity,
  RefreshCw,
  Search,
  Server,
  Loader2,
  Copy,
  ShieldCheck,
  Building2,
  Terminal,
  Users,
  Eye,
  AlertCircle,
  CheckCircle2,
  Info,
  Clock,
  ExternalLink,
  Layers,
  UserCheck,
} from 'lucide-react';

import { useAuthStore } from '@/stores/auth.store';
import { HospitalIntegrationView } from '@/components/hospital-admin/integration/HospitalIntegrationView';

interface HospitalSyncLogItem {
  id: string;
  createdAt: string;
  success: boolean;
  errorMessage: string | null;
  endpointUrl: string | null;
  createdCount: number;
  updatedCount: number;
  unchangedCount: number;
  totalSynced: number;
  durationMs: number | null;
  actorName: string;
}

interface GatewayItem {
  id: string;
  hospitalId: string;
  hospitalName: string;
  hospitalCode: string;
  authLabel: string;
  endpoint: string | null;
  configUpdatedAt: string | null;
  status: 'CONFIGURED' | 'FAILED' | 'MANUAL';
  lastSyncDurationMs: number | null;
  lastSyncAt: string | null;
  lastSyncStatus: 'SUCCESS' | 'FAILED' | null;
  lastSyncError: string | null;
  syncedDoctors: number;
  apiDoctorCount: number;
  manualDoctorCount: number;
  specialtyCount: number;
  syncedServices: number;
  source: string;
  city?: string;
  address?: string;
  recentSyncLogs: HospitalSyncLogItem[];
}

function PlatformAdminHisSync() {
  const { theme } = useAdminTheme();
  const isLight = theme === 'light';

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'CONFIGURED' | 'MANUAL' | 'FAILED'>('ALL');
  const [logStatusFilter, setLogStatusFilter] = useState<'ALL' | 'SUCCESS' | 'FAILED'>('ALL');
  const [activeTab, setActiveTab] = useState<'GATEWAYS' | 'LOGS'>('GATEWAYS');

  const [selectedGateway, setSelectedGateway] = useState<GatewayItem | null>(null);
  const [selectedAuditLog, setSelectedAuditLog] = useState<any | null>(null);
  const [pingingId, setPingingId] = useState<string | null>(null);
  const [pingResults, setPingResults] = useState<
    Record<string, { online: boolean; latencyMs?: number; message: string; checkedAt: string }>
  >({});

  // 1. Dữ liệu thật từ PostgreSQL (bao gồm integrationConfig & trạng thái đồng bộ HIS gần nhất)
  const {
    data: rawHospitalsData,
    isLoading: loadingHospitals,
    refetch: refetchHospitals,
  } = useQuery({
    queryKey: ['admin-hospitals-for-his'],
    queryFn: () => adminService.getHospitals({ limit: 100 }),
  });

  const hospitalsList: any[] = useMemo(() => {
    if (!rawHospitalsData) return [];
    if (Array.isArray(rawHospitalsData)) return rawHospitalsData;
    return rawHospitalsData?.items || rawHospitalsData?.data || [];
  }, [rawHospitalsData]);

  // 2. Nhật ký đồng bộ HIS chuyên biệt từ PostgreSQL (chỉ lọc action=HIS_CATALOG_SYNC)
  const {
    data: rawAuditLogsData,
    isLoading: loadingAuditLogs,
    refetch: refetchAuditLogs,
  } = useQuery({
    queryKey: ['admin-audit-logs-his'],
    queryFn: () => adminService.getAuditLogs({ limit: 50, action: 'HIS_CATALOG_SYNC' }),
  });

  const auditLogsList: any[] = useMemo(() => {
    if (!rawAuditLogsData) return [];
    if (Array.isArray(rawAuditLogsData)) return rawAuditLogsData;
    return rawAuditLogsData?.items || rawAuditLogsData?.data || [];
  }, [rawAuditLogsData]);

  const hospitalMapById = useMemo(() => {
    const map = new Map<string, any>();
    hospitalsList.forEach((h: any) => {
      if (h?.id) map.set(h.id, h);
    });
    return map;
  }, [hospitalsList]);

  const hisSyncLogs = useMemo(() => {
    return auditLogsList.map((log: any) => {
      const payload = (log.newValue || {}) as Record<string, any>;
      const hospital = log.entityId ? hospitalMapById.get(log.entityId) : null;
      const isSuccess = log.success !== false;
      const hospitalName =
        hospital?.name ||
        payload.hospitalName ||
        (log.entityId ? `Cơ sở #${String(log.entityId).substring(0, 8)}` : 'Cơ sở y tế');
      const hospitalCode =
        hospital?.externalId ||
        payload.hospitalCode ||
        (log.entityId ? `BV-${String(log.entityId).substring(0, 6).toUpperCase()}` : '—');
      const endpointUrl =
        payload.endpointUrl || hospital?.integrationConfig?.endpointUrl || null;
      const authType = payload.authType || hospital?.integrationConfig?.authType || 'api_key';
      const actorName = log.user?.fullName || log.user?.email || 'Quản trị cơ sở';
      const errorMessage = !isSuccess
        ? log.description || payload.errorMessage || 'Đồng bộ HIS thất bại'
        : null;

      return {
        ...log,
        isSuccess,
        hospitalName,
        hospitalCode,
        endpointUrl,
        authLabel: authType === 'bearer' ? 'Bearer Token' : 'X-API-KEY',
        actorName,
        createdCount: Number(payload.createdCount ?? 0),
        updatedCount: Number(payload.updatedCount ?? 0),
        unchangedCount: Number(payload.unchangedCount ?? 0),
        totalSynced: Number(payload.totalSynced ?? 0),
        durationMs: typeof payload.durationMs === 'number' ? payload.durationMs : null,
        errorMessage,
      };
    });
  }, [auditLogsList, hospitalMapById]);

  // Ánh xạ 100% dữ liệu thật từ DB, tuyệt đối không sinh URL / độ trễ / API key giả
  const gateways: GatewayItem[] = useMemo(() => {
    return hospitalsList.map((h: any) => {
      const cfg = h.integrationConfig || null;
      const endpoint = cfg?.endpointUrl?.trim() || null;
      const hasConfig = Boolean(endpoint);
      const isApi = hasConfig || h.source === 'API' || Boolean(h.externalId);
      const code = h.externalId || h.hospitalCode || `BV-${h.id.substring(0, 6).toUpperCase()}`;

      let status: GatewayItem['status'] = 'MANUAL';
      if (hasConfig) {
        status = h.lastSyncStatus === 'FAILED' ? 'FAILED' : 'CONFIGURED';
      } else if (isApi) {
        status = h.lastSyncStatus === 'FAILED' ? 'FAILED' : 'CONFIGURED';
      }

      const authLabel = !hasConfig
        ? 'Nhập liệu thủ công'
        : cfg.authType === 'bearer'
          ? 'REST API · Bearer Token'
          : 'REST API · X-API-KEY';

      return {
        id: h.id,
        hospitalId: h.id,
        hospitalName: h.name,
        hospitalCode: code,
        authLabel,
        endpoint,
        configUpdatedAt: cfg?.updatedAt || null,
        status,
        lastSyncDurationMs: typeof h.lastSyncDurationMs === 'number' ? h.lastSyncDurationMs : null,
        lastSyncAt: h.lastSyncAt || null,
        lastSyncStatus: h.lastSyncStatus || null,
        lastSyncError: h.lastSyncError || null,
        syncedDoctors: Number(h.doctorCount ?? h.workPlaces?.length ?? 0),
        apiDoctorCount: Number(h.apiDoctorCount ?? 0),
        manualDoctorCount: Number(h.manualDoctorCount ?? 0),
        specialtyCount: Number(h.specialtyCount ?? 0),
        syncedServices: Number(h.serviceCount ?? h.services?.length ?? 0),
        source: h.source || 'MANUAL',
        city: h.city || 'TP. Hồ Chí Minh',
        address: h.address || '',
        recentSyncLogs: Array.isArray(h.recentSyncLogs) ? h.recentSyncLogs : [],
      };
    });
  }, [hospitalsList]);

  const handlePingGateway = async (gw: GatewayItem) => {
    if (!gw.endpoint) return;
    setPingingId(gw.id);
    try {
      const res = await adminService.testHisGateway({ endpointUrl: gw.endpoint });
      const latencyMs = typeof res?.latencyMs === 'number' ? res.latencyMs : undefined;
      const msg = res?.message || `Máy chủ HIS đang Online (${latencyMs ?? 0} ms)`;
      setPingResults((prev) => ({
        ...prev,
        [gw.id]: {
          online: true,
          latencyMs,
          message: msg,
          checkedAt: new Date().toLocaleTimeString('vi-VN'),
        },
      }));
      toast.success(`${gw.hospitalName}: ${msg}`);
    } catch (error: any) {
      const msg = error?.response?.data?.message || error?.message || 'Máy chủ HIS không phản hồi';
      setPingResults((prev) => ({
        ...prev,
        [gw.id]: {
          online: false,
          message: msg,
          checkedAt: new Date().toLocaleTimeString('vi-VN'),
        },
      }));
      toast.error(`${gw.hospitalName}: ${msg}`);
    } finally {
      setPingingId(null);
    }
  };

  const filteredGateways = useMemo(() => {
    return gateways.filter((gw) => {
      const q = search.trim().toLowerCase();
      const matchSearch =
        !q ||
        gw.hospitalName.toLowerCase().includes(q) ||
        gw.hospitalCode.toLowerCase().includes(q) ||
        (gw.endpoint || '').toLowerCase().includes(q);
      const matchStatus = statusFilter === 'ALL' || gw.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [gateways, search, statusFilter]);

  const filteredAuditLogs = useMemo(() => {
    const q = search.trim().toLowerCase();
    return hisSyncLogs.filter((log: any) => {
      if (logStatusFilter === 'SUCCESS' && !log.isSuccess) return false;
      if (logStatusFilter === 'FAILED' && log.isSuccess) return false;
      if (!q) return true;
      return (
        log.hospitalName?.toLowerCase().includes(q) ||
        log.hospitalCode?.toLowerCase().includes(q) ||
        log.endpointUrl?.toLowerCase().includes(q) ||
        log.actorName?.toLowerCase().includes(q) ||
        log.errorMessage?.toLowerCase().includes(q) ||
        log.description?.toLowerCase().includes(q)
      );
    });
  }, [hisSyncLogs, search, logStatusFilter]);

  const totalHospitals = gateways.length;
  const configuredCount = gateways.filter((g) => g.status === 'CONFIGURED').length;
  const failedCount = gateways.filter((g) => g.status === 'FAILED').length;
  const totalDoctors = gateways.reduce((acc, g) => acc + g.syncedDoctors, 0);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`Đã sao chép ${label}`);
  };

  return (
    <div className={`p-6 max-w-7xl mx-auto space-y-6 ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
      {/* 1. Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/70 dark:border-emerald-800/60">
              <Network className="w-5 h-5" />
            </div>
            <h1 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
              Giám sát Tích hợp HIS Đối tác
            </h1>
            <Badge
              variant="outline"
              className="font-medium border-emerald-200 text-emerald-700 bg-emerald-50/70 dark:border-emerald-800 dark:text-emerald-400 dark:bg-emerald-950/40"
            >
              NC-HIS-SPEC-2026-V1
            </Badge>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Giám sát cấu hình cổng kết nối HIS thực tế, thời gian đồng bộ gần nhất và nhật ký kiểm toán trên toàn nền tảng.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            refetchHospitals();
            refetchAuditLogs();
          }}
          disabled={loadingHospitals || loadingAuditLogs}
          className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 rounded-lg text-xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loadingHospitals || loadingAuditLogs ? 'animate-spin' : ''}`} />
          Làm mới dữ liệu
        </Button>
      </div>

      {/* Ghi chú phân tách trách nhiệm */}
      <div
        className={`flex items-start gap-2.5 px-4 py-3 rounded-xl border text-xs ${isLight
          ? 'bg-emerald-50/60 border-emerald-200/80 text-emerald-900'
          : 'bg-emerald-950/30 border-emerald-800/60 text-emerald-200'
          }`}
      >
        <Info className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          Quản trị nền tảng (<strong>ADMIN</strong>) theo dõi tập trung trạng thái kết nối và nhật ký đồng bộ toàn hệ thống. Việc cấu hình Endpoint, khóa bảo mật và ánh xạ khoa phòng được thực hiện độc lập bởi từng cơ sở y tế (<strong>HOSPITAL_ADMIN</strong>).
        </p>
      </div>

      {/* 2. KPI Cards (100% Real DB Data) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs rounded-xl">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Tổng cơ sở y tế</p>
              <h3 className="text-2xl font-bold mt-1 text-slate-900 dark:text-white">
                {loadingHospitals ? '...' : totalHospitals}
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Cơ sở đối tác trên NovaCare</p>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              <Building2 className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs rounded-xl">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Đã cấu hình cổng HIS</p>
              <h3 className="text-2xl font-bold mt-1 text-emerald-600 dark:text-emerald-400">
                {loadingHospitals ? '...' : configuredCount}
              </h3>
              <p className="text-[11px] text-emerald-600/80 dark:text-emerald-400/80 mt-0.5">
                {totalHospitals > 0 ? `${Math.round((configuredCount / totalHospitals) * 100)}% cơ sở đã kết nối` : '0%'}
              </p>
            </div>
            <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50">
              <Server className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs rounded-xl">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Cảnh báo lỗi đồng bộ</p>
              <h3 className={`text-2xl font-bold mt-1 ${failedCount > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'}`}>
                {loadingHospitals ? '...' : failedCount}
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {failedCount > 0 ? 'Cần kiểm tra lại kết nối HIS' : 'Không có lỗi đồng bộ gần nhất'}
              </p>
            </div>
            <div className={`p-2.5 rounded-lg ${failedCount > 0 ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}>
              <Activity className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs rounded-xl">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Tổng hồ sơ bác sĩ</p>
              <h3 className="text-2xl font-bold mt-1 text-emerald-600 dark:text-emerald-400">
                {loadingHospitals ? '...' : totalDoctors}
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Đang hoạt động tại các cơ sở</p>
            </div>
            <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50">
              <Users className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 3. Tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-900 rounded-lg w-fit border border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={() => setActiveTab('GATEWAYS')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${activeTab === 'GATEWAYS'
              ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
          >
            Trạng thái HIS cơ sở ({gateways.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('LOGS')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${activeTab === 'LOGS'
              ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
          >
            Nhật ký đồng bộ HIS ({hisSyncLogs.length})
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[240px]">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={
                activeTab === 'GATEWAYS'
                  ? 'Tìm bệnh viện, mã HIS, endpoint...'
                  : 'Tìm bệnh viện, người thực hiện, lỗi...'
              }
              className="pl-8 h-8 text-xs bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
            />
          </div>

          {activeTab === 'GATEWAYS' ? (
            <div className="flex items-center gap-1 text-xs">
              {([
                { key: 'ALL', label: 'Tất cả' },
                { key: 'CONFIGURED', label: 'Đã kết nối HIS' },
                { key: 'MANUAL', label: 'Thủ công' },
                { key: 'FAILED', label: 'Lỗi gần nhất' },
              ] as const).map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setStatusFilter(item.key)}
                  className={`px-2.5 py-1 rounded text-[11px] font-medium border transition-colors ${statusFilter === item.key
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800'
                    }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              {([
                { key: 'ALL', label: 'Tất cả' },
                { key: 'SUCCESS', label: 'Thành công' },
                { key: 'FAILED', label: 'Thất bại' },
              ] as const).map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setLogStatusFilter(item.key)}
                  className={`px-2.5 py-1 rounded text-[11px] font-medium border transition-colors ${logStatusFilter === item.key
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800'
                    }`}
                >
                  {item.label}
                </button>
              ))}
              <Link
                href="/admin/audit-logs"
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-medium border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:border-emerald-300 hover:text-emerald-700 transition-colors"
              >
                Nhật ký toàn hệ thống
                <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* 4. Tab: Danh sách trạng thái HIS thật */}
      {activeTab === 'GATEWAYS' && (
        <Card className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-semibold">
                <tr>
                  <th className="py-3 px-4">Cơ sở y tế đối tác</th>
                  <th className="py-3 px-4">Mã HIS / Cơ sở</th>
                  <th className="py-3 px-4">Phương thức &amp; Endpoint thực tế</th>
                  <th className="py-3 px-4 text-center">Trạng thái tích hợp</th>
                  <th className="py-3 px-4 text-center">Thời lượng sync</th>
                  <th className="py-3 px-4 text-center">Bác sĩ / Dịch vụ</th>
                  <th className="py-3 px-4">Đồng bộ gần nhất</th>
                  <th className="py-3 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {loadingHospitals ? (
                  <tr>
                    <td colSpan={8} className="py-10 text-center text-slate-400">
                      <Loader2 className="w-5 h-5 mx-auto animate-spin mb-2 text-emerald-600" />
                      Đang tải cấu hình tích hợp HIS thực tế từ cơ sở dữ liệu...
                    </td>
                  </tr>
                ) : filteredGateways.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-10 text-center text-slate-400">
                      Không tìm thấy cơ sở y tế nào phù hợp với bộ lọc.
                    </td>
                  </tr>
                ) : (
                  filteredGateways.map((gw) => (
                    <tr key={gw.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-900 dark:text-white flex items-center gap-1.5">
                          <span>{gw.hospitalName}</span>
                          {gw.status === 'CONFIGURED' && (
                            <Badge variant="outline" className="text-[10px] py-0 px-1.5 border-emerald-300 text-emerald-700 bg-emerald-50/60">
                              HIS API
                            </Badge>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate max-w-[220px]">
                          {gw.address || gw.city}
                        </p>
                      </td>

                      <td className="py-3 px-4 font-mono text-[11px] text-slate-600 dark:text-slate-300">
                        {gw.hospitalCode}
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-medium text-[11px] text-slate-700 dark:text-slate-300">
                          {gw.authLabel}
                        </div>
                        <div
                          className="font-mono text-[11px] text-slate-400 dark:text-slate-500 truncate max-w-[260px]"
                          title={gw.endpoint || ''}
                        >
                          {gw.endpoint || 'Chưa cấu hình Endpoint HIS'}
                        </div>
                      </td>

                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        {gw.status === 'CONFIGURED' ? (
                          <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-medium hover:bg-emerald-50">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Đã kết nối HIS
                          </Badge>
                        ) : gw.status === 'FAILED' ? (
                          <Badge className="bg-rose-50 text-rose-700 border border-rose-200 text-[11px] font-medium hover:bg-rose-50">
                            <AlertCircle className="w-3 h-3 mr-1" />
                            Lỗi đồng bộ
                          </Badge>
                        ) : (
                          <Badge className="bg-slate-100 text-slate-600 border border-slate-200 text-[11px] font-normal hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">
                            Nhập thủ công
                          </Badge>
                        )}
                      </td>

                      <td className="py-3 px-4 text-center font-mono text-[11px] whitespace-nowrap">
                        {pingResults[gw.id] ? (
                          pingResults[gw.id].online ? (
                            <span className="text-emerald-600 dark:text-emerald-400 font-semibold" title={pingResults[gw.id].message}>
                              {pingResults[gw.id].latencyMs ?? 0} ms (Ping)
                            </span>
                          ) : (
                            <span className="text-rose-600 dark:text-rose-400 font-semibold" title={pingResults[gw.id].message}>
                              Offline
                            </span>
                          )
                        ) : gw.lastSyncDurationMs !== null ? (
                          <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                            {gw.lastSyncDurationMs} ms
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <span className="font-semibold text-slate-800 dark:text-slate-200">{gw.syncedDoctors}</span>
                        <span className="text-slate-400 mx-1">/</span>
                        <span className="text-slate-500">{gw.syncedServices} dv</span>
                      </td>

                      <td className="py-3 px-4 text-slate-500 dark:text-slate-400 text-[11px] whitespace-nowrap">
                        {gw.lastSyncAt ? new Date(gw.lastSyncAt).toLocaleString('vi-VN') : 'Chưa đồng bộ'}
                      </td>

                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center justify-end gap-1.5">
                          {gw.endpoint && (
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={pingingId === gw.id}
                              onClick={() => handlePingGateway(gw)}
                              className="h-7 px-2.5 text-xs border-emerald-200 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-400 dark:hover:bg-emerald-950/40 rounded-lg"
                              title="Kiểm tra phản hồi máy chủ HIS (không cần khóa bí mật)"
                            >
                              {pingingId === gw.id ? (
                                <Loader2 className="w-3 h-3 animate-spin mr-1" />
                              ) : (
                                <Activity className="w-3 h-3 mr-1" />
                              )}
                              Ping
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedGateway(gw)}
                            className="h-7 px-2.5 text-xs border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-lg"
                          >
                            <Eye className="w-3.5 h-3.5 mr-1 text-slate-500" />
                            Chi tiết
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* 5. Tab: Nhật ký đồng bộ HIS (Chuyên biệt HIS_CATALOG_SYNC) */}
      {activeTab === 'LOGS' && (
        <Card className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-semibold">
                <tr>
                  <th className="py-3 px-4">Thời gian</th>
                  <th className="py-3 px-4">Cơ sở y tế &amp; Endpoint</th>
                  <th className="py-3 px-4">Người thực hiện</th>
                  <th className="py-3 px-4">Kết quả đồng bộ</th>
                  <th className="py-3 px-4 text-center">Thời lượng</th>
                  <th className="py-3 px-4 text-center">Trạng thái</th>
                  <th className="py-3 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
                {loadingAuditLogs ? (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-slate-400">
                      <Loader2 className="w-5 h-5 mx-auto animate-spin mb-2 text-emerald-600" />
                      Đang tải nhật ký đồng bộ HIS thực tế...
                    </td>
                  </tr>
                ) : filteredAuditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-slate-400">
                      {hisSyncLogs.length === 0
                        ? 'Chưa ghi nhận phiên đồng bộ HIS nào trên toàn nền tảng.'
                        : 'Không có phiên đồng bộ HIS nào phù hợp với bộ lọc hiện tại.'}
                    </td>
                  </tr>
                ) : (
                  filteredAuditLogs.map((log: any) => (
                    <tr key={log.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-600 dark:text-slate-400 whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleString('vi-VN')}
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-900 dark:text-white flex items-center gap-1.5">
                          <span>{log.hospitalName}</span>
                          <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                            {log.authLabel}
                          </span>
                        </div>
                        <div
                          className="font-mono text-[11px] text-slate-400 dark:text-slate-500 truncate max-w-[260px]"
                          title={log.endpointUrl || ''}
                        >
                          {log.endpointUrl || log.hospitalCode}
                        </div>
                      </td>

                      <td className="py-3 px-4 text-slate-700 dark:text-slate-300 whitespace-nowrap">
                        {log.actorName}
                      </td>

                      <td className="py-3 px-4">
                        {log.isSuccess ? (
                          <div className="text-[11px] whitespace-nowrap">
                            <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                              +{log.createdCount} mới
                            </span>
                            <span className="text-slate-300 dark:text-slate-600 mx-1.5">·</span>
                            <span className="font-semibold text-sky-600 dark:text-sky-400">
                              ↻{log.updatedCount} cập nhật
                            </span>
                            <span className="text-slate-300 dark:text-slate-600 mx-1.5">·</span>
                            <span className="text-slate-500 dark:text-slate-400">
                              ={log.unchangedCount} giữ nguyên
                            </span>
                          </div>
                        ) : (
                          <div
                            className="text-[11px] text-rose-600 dark:text-rose-400 truncate max-w-[260px]"
                            title={log.errorMessage || ''}
                          >
                            {log.errorMessage}
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-4 text-center font-mono text-[11px] text-slate-600 dark:text-slate-400 whitespace-nowrap">
                        {log.durationMs !== null ? `${log.durationMs} ms` : '—'}
                      </td>

                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        {log.isSuccess ? (
                          <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-medium hover:bg-emerald-50">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Thành công
                          </Badge>
                        ) : (
                          <Badge className="bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-medium hover:bg-rose-50">
                            <AlertCircle className="w-3 h-3 mr-1" />
                            Thất bại
                          </Badge>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedAuditLog(log)}
                          className="h-7 px-2.5 text-xs border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-lg"
                        >
                          <Eye className="w-3.5 h-3.5 mr-1 text-slate-500" />
                          Chi tiết
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* 6. Modal: Chi tiết cấu hình & Lịch sử đồng bộ HIS của cơ sở */}
      {selectedGateway && (
        <Dialog open={!!selectedGateway} onOpenChange={(open) => !open && setSelectedGateway(null)}>
          <DialogContent className="max-w-2xl max-h-[88vh] overflow-y-auto bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-2xl">
            <DialogHeader className="pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <DialogTitle className="text-base font-semibold flex items-center gap-2">
                    <Network className="w-4 h-4 text-emerald-600" />
                    Giám sát tích hợp HIS: {selectedGateway.hospitalName}
                  </DialogTitle>
                  <DialogDescription className="text-xs text-slate-500 mt-0.5">
                    Mã cơ sở: <strong className="font-mono text-slate-700 dark:text-slate-200">{selectedGateway.hospitalCode}</strong>
                    {selectedGateway.configUpdatedAt
                      ? ` · Cập nhật cấu hình: ${new Date(selectedGateway.configUpdatedAt).toLocaleString('vi-VN')}`
                      : ' · Chưa thiết lập cấu hình cổng HIS'}
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-4 py-2 text-xs">
              {/* Khối 1: Phân tách nguồn dữ liệu thật */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-3 rounded-xl border border-emerald-200/70 dark:border-emerald-800/50 bg-emerald-50/50 dark:bg-emerald-950/20">
                  <div className="text-[11px] text-slate-500 flex items-center gap-1">
                    <UserCheck className="w-3.5 h-3.5 text-emerald-600" /> Bác sĩ từ HIS API
                  </div>
                  <div className="text-lg font-bold text-emerald-700 dark:text-emerald-400 mt-1">
                    {selectedGateway.apiDoctorCount}
                  </div>
                </div>
                <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40">
                  <div className="text-[11px] text-slate-500 flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-slate-500" /> Bác sĩ nhập tay
                  </div>
                  <div className="text-lg font-bold text-slate-800 dark:text-white mt-1">
                    {selectedGateway.manualDoctorCount}
                  </div>
                </div>
                <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40">
                  <div className="text-[11px] text-slate-500 flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5 text-sky-600" /> Chuyên khoa
                  </div>
                  <div className="text-lg font-bold text-slate-800 dark:text-white mt-1">
                    {selectedGateway.specialtyCount}
                  </div>
                </div>
                <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40">
                  <div className="text-[11px] text-slate-500 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-teal-600" /> Dịch vụ y tế
                  </div>
                  <div className="text-lg font-bold text-slate-800 dark:text-white mt-1">
                    {selectedGateway.syncedServices}
                  </div>
                </div>
              </div>

              {/* Khối 2: Cấu hình Endpoint & Kiểm tra phản hồi (Ping) */}
              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/30 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="text-[11px] text-slate-400">Phương thức xác thực:</span>{' '}
                    <strong className="text-slate-800 dark:text-slate-100">{selectedGateway.authLabel}</strong>
                  </div>
                  {selectedGateway.endpoint && (
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pingingId === selectedGateway.id}
                      onClick={() => handlePingGateway(selectedGateway)}
                      className="h-7 px-3 text-xs rounded-lg border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-400"
                    >
                      {pingingId === selectedGateway.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                      ) : (
                        <Activity className="w-3.5 h-3.5 mr-1.5" />
                      )}
                      Kiểm tra phản hồi máy chủ (Ping)
                    </Button>
                  )}
                </div>

                <div>
                  <label className="text-[11px] font-medium text-slate-500">Endpoint URL đã cấu hình</label>
                  <div className="flex items-center gap-2 mt-1">
                    <Input
                      value={selectedGateway.endpoint || 'Cơ sở y tế chưa cấu hình cổng HIS'}
                      readOnly
                      className="font-mono text-xs bg-white dark:bg-slate-950"
                    />
                    {selectedGateway.endpoint && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCopy(selectedGateway.endpoint!, 'Endpoint URL')}
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>
                </div>

                {pingResults[selectedGateway.id] && (
                  <div
                    className={`p-2.5 rounded-lg border text-[11px] flex items-center justify-between gap-2 ${
                      pingResults[selectedGateway.id].online
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/30 dark:border-emerald-800 dark:text-emerald-300'
                        : 'bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-950/30 dark:border-rose-800 dark:text-rose-300'
                    }`}
                  >
                    <span className="font-medium">{pingResults[selectedGateway.id].message}</span>
                    <span className="font-mono text-[10px] opacity-80 shrink-0">
                      Lúc {pingResults[selectedGateway.id].checkedAt}
                    </span>
                  </div>
                )}
              </div>

              {/* Khối 3: Lịch sử 5 phiên đồng bộ HIS gần nhất của riêng bệnh viện này */}
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                <div className="px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <span className="font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-emerald-600" />
                    Lịch sử đồng bộ HIS gần nhất ({selectedGateway.recentSyncLogs.length})
                  </span>
                </div>

                {selectedGateway.recentSyncLogs.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-[11px]">
                      <thead className="bg-slate-50/70 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-slate-500">
                        <tr>
                          <th className="py-2 px-3">Thời gian</th>
                          <th className="py-2 px-3">Người thực hiện</th>
                          <th className="py-2 px-3 text-center">Kết quả</th>
                          <th className="py-2 px-3 text-center">Thời lượng</th>
                          <th className="py-2 px-3 text-right">Trạng thái</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {selectedGateway.recentSyncLogs.map((log) => (
                          <tr key={log.id}>
                            <td className="py-2 px-3 font-mono text-slate-600 dark:text-slate-400 whitespace-nowrap">
                              {new Date(log.createdAt).toLocaleString('vi-VN')}
                            </td>
                            <td className="py-2 px-3 text-slate-700 dark:text-slate-300">
                              {log.actorName}
                            </td>
                            <td className="py-2 px-3 text-center whitespace-nowrap">
                              {log.success ? (
                                <span className="text-slate-700 dark:text-slate-200">
                                  <strong className="text-emerald-600">+{log.createdCount}</strong> mới ·{' '}
                                  <strong className="text-sky-600">↻{log.updatedCount}</strong> cập nhật ·{' '}
                                  <span className="text-slate-400">={log.unchangedCount}</span>
                                </span>
                              ) : (
                                <span className="text-rose-600 truncate max-w-[180px] inline-block" title={log.errorMessage || ''}>
                                  {log.errorMessage || 'Lỗi đồng bộ'}
                                </span>
                              )}
                            </td>
                            <td className="py-2 px-3 text-center font-mono text-slate-500 whitespace-nowrap">
                              {log.durationMs !== null ? `${log.durationMs} ms` : '—'}
                            </td>
                            <td className="py-2 px-3 text-right whitespace-nowrap">
                              {log.success ? (
                                <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]">
                                  Thành công
                                </Badge>
                              ) : (
                                <Badge className="bg-rose-50 text-rose-700 border-rose-200 text-[10px]">
                                  Thất bại
                                </Badge>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-5 text-center text-slate-400 text-xs">
                    Cơ sở y tế này chưa ghi nhận phiên đồng bộ HIS nào trên hệ thống.
                  </div>
                )}
              </div>
            </div>

            <DialogFooter className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between sm:justify-between gap-2">
              <Button asChild variant="outline" size="sm" className="rounded-lg text-xs">
                <Link href={`/admin/hospitals/${selectedGateway.hospitalId}`}>
                  <ExternalLink className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
                  Mở hồ sơ cơ sở y tế
                </Link>
              </Button>
              <Button variant="outline" size="sm" onClick={() => setSelectedGateway(null)} className="rounded-lg text-xs">
                Đóng
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* 7. Modal: Chi tiết phiên đồng bộ HIS */}
      {selectedAuditLog && (
        <Dialog open={!!selectedAuditLog} onOpenChange={(open) => !open && setSelectedAuditLog(null)}>
          <DialogContent className="max-w-2xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-2xl">
            <DialogHeader className="pb-3 border-b border-slate-200 dark:border-slate-800">
              <DialogTitle className="text-base font-semibold flex items-center gap-2">
                <Terminal className="w-4 h-4 text-emerald-600" />
                Chi tiết phiên đồng bộ HIS: {selectedAuditLog.hospitalName}
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Thực hiện lúc {new Date(selectedAuditLog.createdAt).toLocaleString('vi-VN')} bởi{' '}
                <strong className="text-slate-700 dark:text-slate-200">{selectedAuditLog.actorName}</strong>
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3.5 py-2 text-xs">
              <div className="grid grid-cols-2 gap-2.5 p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800">
                <div>
                  <span className="text-slate-400">Cơ sở y tế:</span>{' '}
                  <span className="font-semibold text-slate-800 dark:text-slate-100">
                    {selectedAuditLog.hospitalName}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400">Mã HIS / Cơ sở:</span>{' '}
                  <span className="font-mono text-slate-700 dark:text-slate-200">
                    {selectedAuditLog.hospitalCode}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400">Xác thực:</span>{' '}
                  <span className="font-medium">{selectedAuditLog.authLabel}</span>
                </div>
                <div>
                  <span className="text-slate-400">Thời lượng / Trạng thái:</span>{' '}
                  <span className="font-mono mr-1.5">
                    {selectedAuditLog.durationMs !== null ? `${selectedAuditLog.durationMs} ms` : '—'}
                  </span>
                  <span
                    className={
                      selectedAuditLog.isSuccess
                        ? 'text-emerald-600 font-semibold'
                        : 'text-rose-600 font-semibold'
                    }
                  >
                    ({selectedAuditLog.isSuccess ? 'Thành công' : 'Thất bại'})
                  </span>
                </div>
                {selectedAuditLog.endpointUrl && (
                  <div className="col-span-2 pt-1 border-t border-slate-200/70 dark:border-slate-700/60 flex items-center justify-between gap-2">
                    <div className="truncate">
                      <span className="text-slate-400">Endpoint:</span>{' '}
                      <span className="font-mono text-slate-700 dark:text-slate-200">
                        {selectedAuditLog.endpointUrl}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopy(selectedAuditLog.endpointUrl, 'Endpoint URL')}
                      className="h-6 px-2 shrink-0"
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                )}
              </div>

              {selectedAuditLog.isSuccess ? (
                <div className="grid grid-cols-3 gap-2.5">
                  <div className="p-2.5 rounded-xl border border-emerald-200/70 bg-emerald-50/50 dark:border-emerald-800/50 dark:bg-emerald-950/20 text-center">
                    <div className="text-[11px] text-slate-500">Thêm mới</div>
                    <div className="text-base font-bold text-emerald-700 dark:text-emerald-400">
                      +{selectedAuditLog.createdCount}
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl border border-sky-200/70 bg-sky-50/50 dark:border-sky-800/50 dark:bg-sky-950/20 text-center">
                    <div className="text-[11px] text-slate-500">Cập nhật</div>
                    <div className="text-base font-bold text-sky-700 dark:text-sky-400">
                      ↻{selectedAuditLog.updatedCount}
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/40 text-center">
                    <div className="text-[11px] text-slate-500">Giữ nguyên</div>
                    <div className="text-base font-bold text-slate-700 dark:text-slate-200">
                      ={selectedAuditLog.unchangedCount}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/60 text-rose-700 dark:text-rose-300 text-xs">
                  <div className="font-semibold mb-1">Nguyên nhân thất bại:</div>
                  <div className="font-mono text-[11px] break-words">
                    {selectedAuditLog.errorMessage}
                  </div>
                </div>
              )}

              <div>
                <p className="font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Dữ liệu kỹ thuật ghi nhận (Audit Payload):
                </p>
                <pre className="p-3 rounded-xl bg-slate-950 text-emerald-400 font-mono text-[11px] overflow-auto max-h-52">
                  {selectedAuditLog.newValue ? JSON.stringify(selectedAuditLog.newValue, null, 2) : 'Không có'}
                </pre>
              </div>
            </div>

            <DialogFooter className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between sm:justify-between gap-2">
              {selectedAuditLog.entityId ? (
                <Button asChild variant="outline" size="sm" className="rounded-lg text-xs">
                  <Link href={`/admin/hospitals/${selectedAuditLog.entityId}`}>
                    <ExternalLink className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
                    Mở hồ sơ cơ sở y tế
                  </Link>
                </Button>
              ) : (
                <span />
              )}
              <Button size="sm" variant="outline" onClick={() => setSelectedAuditLog(null)} className="rounded-lg text-xs">
                Đóng
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

export default function AdminHisSyncPage() {
  const { user } = useAuthStore();
  const isHospitalAdmin = user?.role === 'HOSPITAL_ADMIN';

  if (isHospitalAdmin) {
    return <HospitalIntegrationView />;
  }

  return <PlatformAdminHisSync />;
}
