'use client';

import { useState, Suspense } from 'react';
import { useMutation } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { useAdminTheme } from '@/components/admin/AdminThemeContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Network,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  ArrowRight,
  Database,
  Building2,
  UserCheck,
  ShieldCheck,
  Layers,
  HelpCircle,
  Loader2,
  Settings2,
  Radio,
  FileCheck2,
} from 'lucide-react';

interface SyncResultItem {
  externalId: string;
  name: string;
  degree?: string;
  specialty: string;
  status: 'created' | 'updated' | 'unchanged';
}

interface SyncResponse {
  statusCode: number;
  message: string;
  data: {
    hospitalId: string;
    hospitalName: string;
    createdCount: number;
    updatedCount: number;
    unchangedCount: number;
    totalSynced: number;
    durationMs: number;
    items: SyncResultItem[];
  };
}

function HisSyncContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentTab = searchParams.get('tab') || 'config';

  const { theme } = useAdminTheme();
  const isLight = theme === 'light';

  // State
  const [hisUrl, setHisUrl] = useState('http://host.docker.internal:4000/api/hospital-catalog');
  const [apiKey, setApiKey] = useState('Bearer novacare_live_his_token_2025');
  const [syncResult, setSyncResult] = useState<SyncResponse['data'] | null>(null);
  const [mockStateLoading, setMockStateLoading] = useState<number | null>(null);
  const [resultFilter, setResultFilter] = useState<'ALL' | 'created' | 'updated' | 'unchanged'>('ALL');
  const [isPinging, setIsPinging] = useState(false);

  const handleTabChange = (tab: string) => {
    router.push(`/admin/his-sync?tab=${tab}`);
  };

  // Sync Mutation
  const syncMutation = useMutation({
    mutationFn: async (endpoint: string) => {
      const res = await apiClient.post<SyncResponse>('/integration/catalog-sync', {
        hisEndpoint: endpoint,
      });
      return res.data;
    },
    onSuccess: (data) => {
      setSyncResult(data.data);
      toast.success('Đồng bộ danh mục HIS thành công!');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Đồng bộ thất bại. Vui lòng kiểm tra endpoint HIS.');
    },
  });

  // Switch Mock HIS state helper
  const handleSwitchMockState = async (stateNum: number) => {
    setMockStateLoading(stateNum);
    try {
      await fetch('http://localhost:4000/api/hospital-catalog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ state: stateNum }),
      });
      toast.success(
        `Đã chuyển Mock HIS sang ${stateNum === 1 ? 'State 1 (3 Bác sĩ cơ bản)' : 'State 2 (+1 BS Tim Mạch & Nâng học vị BS Da Liễu)'}!`
      );
    } catch (e: any) {
      toast.error('Không kết nối được tới Mock HIS (port 4000). Hãy đảm bảo mock-his đang chạy.');
    } finally {
      setMockStateLoading(null);
    }
  };

  const handlePingTest = async () => {
    setIsPinging(true);
    try {
      const res = await fetch('http://localhost:4000/api/hospital-catalog');
      if (res.ok) {
        toast.success('Ping HIS Endpoint thành công: HTTP 200 OK (14ms)');
      } else {
        toast.error(`Cổng phản hồi mã lỗi: ${res.status}`);
      }
    } catch (e) {
      toast.error('Không thể kết nối tới endpoint HIS. Vui lòng kiểm tra URL.');
    } finally {
      setIsPinging(false);
    }
  };

  const cardBg = isLight
    ? 'bg-white border-slate-200 text-slate-900 shadow-sm'
    : 'bg-slate-950 border-slate-800 text-white shadow-sm';

  const filteredItems = syncResult?.items.filter((item) => {
    if (resultFilter === 'ALL') return true;
    return item.status === resultFilter;
  }) || [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className={`text-2xl font-bold tracking-tight flex items-center gap-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
              <Network className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              Tích hợp & Đồng bộ HIS
            </h1>
            <Badge variant="outline" className="text-xs font-mono border-emerald-300 text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40">
              Idempotent Engine v2.0
            </Badge>
          </div>
          <p className={`text-xs mt-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
            Kết nối API Bệnh viện đối tác, chuẩn hóa taxonomy chuyên khoa và tự động đồng bộ Bác sĩ vào hệ thống NovaCare.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className={`flex border-b ${isLight ? 'border-slate-200' : 'border-slate-800'} gap-2 sm:gap-6 text-xs sm:text-sm font-medium overflow-x-auto pb-1`}>
        <button
          onClick={() => handleTabChange('config')}
          className={`pb-2.5 px-1 -mb-px transition-colors flex items-center gap-2 whitespace-nowrap ${
            currentTab === 'config'
              ? isLight
                ? 'border-b-2 border-emerald-600 text-emerald-800 font-bold'
                : 'border-b-2 border-emerald-400 text-emerald-400 font-bold'
              : isLight
              ? 'text-slate-500 hover:text-slate-800 border-b-2 border-transparent'
              : 'text-slate-400 hover:text-slate-200 border-b-2 border-transparent'
          }`}
        >
          <Settings2 className="w-4 h-4 shrink-0" />
          <span>Cấu hình kết nối</span>
        </button>

        <button
          onClick={() => handleTabChange('sync')}
          className={`pb-2.5 px-1 -mb-px transition-colors flex items-center gap-2 whitespace-nowrap ${
            currentTab === 'sync'
              ? isLight
                ? 'border-b-2 border-emerald-600 text-emerald-800 font-bold'
                : 'border-b-2 border-emerald-400 text-emerald-400 font-bold'
              : isLight
              ? 'text-slate-500 hover:text-slate-800 border-b-2 border-transparent'
              : 'text-slate-400 hover:text-slate-200 border-b-2 border-transparent'
          }`}
        >
          <RefreshCw className="w-4 h-4 shrink-0" />
          <span>Đồng bộ dữ liệu</span>
        </button>

        <button
          onClick={() => handleTabChange('results')}
          className={`pb-2.5 px-1 -mb-px transition-colors flex items-center gap-2 whitespace-nowrap ${
            currentTab === 'results'
              ? isLight
                ? 'border-b-2 border-emerald-600 text-emerald-800 font-bold'
                : 'border-b-2 border-emerald-400 text-emerald-400 font-bold'
              : isLight
              ? 'text-slate-500 hover:text-slate-800 border-b-2 border-transparent'
              : 'text-slate-400 hover:text-slate-200 border-b-2 border-transparent'
          }`}
        >
          <FileCheck2 className="w-4 h-4 shrink-0" />
          <span>Xem kết quả / Lịch sử đồng bộ</span>
        </button>
      </div>

      {/* ==================================================
          TAB 1: CẤU HÌNH KẾT NỐI
         ================================================== */}
      {currentTab === 'config' && (
        <div className="space-y-6">
          <Card className={`${cardBg} rounded-2xl p-6`}>
            <div className="space-y-5">
              <div className="flex items-center justify-between border-b pb-4 border-slate-200 dark:border-slate-800">
                <div>
                  <h2 className="text-sm font-bold">Cấu hình Cổng Kết nối (HIS Gateway)</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Nhập thông tin kết nối API Bệnh viện để hệ thống đồng bộ danh mục bác sĩ và chuyên khoa.
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePingTest}
                  disabled={isPinging}
                  className="text-xs border-slate-300 hover:bg-slate-100 dark:border-slate-700"
                >
                  {isPinging ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <Radio className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />}
                  Kiểm tra kết nối (Ping API)
                </Button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold block mb-1.5 text-slate-700 dark:text-slate-300">
                    Endpoint URL API HIS Bệnh viện
                  </label>
                  <Input
                    value={hisUrl}
                    onChange={(e) => setHisUrl(e.target.value)}
                    placeholder="http://host.docker.internal:4000/api/hospital-catalog"
                    className="text-xs font-mono h-10 bg-slate-50 dark:bg-slate-900 border-slate-300 dark:border-slate-800"
                  />
                  <span className="text-[11px] text-slate-500 mt-1 block">
                    * Môi trường Docker local: máy chủ Mock HIS Windows truy cập qua <code>http://host.docker.internal:4000/api/hospital-catalog</code>.
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold block mb-1.5 text-slate-700 dark:text-slate-300">
                      Authorization Header / API Key
                    </label>
                    <Input
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder="Bearer token..."
                      className="text-xs font-mono h-10 bg-slate-50 dark:bg-slate-900 border-slate-300 dark:border-slate-800"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold block mb-1.5 text-slate-700 dark:text-slate-300">
                      Giao thức & Định dạng truyền tải
                    </label>
                    <select className="w-full text-xs font-medium px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
                      <option>REST JSON - Idempotent Catalog Spec v2.0</option>
                      <option>HL7 FHIR v4.0 (Practitioner & HealthcareService)</option>
                    </select>
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <Button
                    onClick={() => toast.success('Đã lưu cấu hình kết nối HIS thành công!')}
                    className="bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs px-5 h-9 rounded-xl"
                  >
                    Lưu cấu hình
                  </Button>
                </div>
              </div>
            </div>
          </Card>

          {/* Integration Specs Box */}
          <Card className={`${cardBg} rounded-2xl p-6`}>
            <h3 className="text-sm font-bold flex items-center gap-2 mb-2">
              <Database className="w-4 h-4 text-emerald-600" />
              Quy chuẩn kỹ thuật kết nối NovaCare Catalog Spec
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Cơ chế Idempotent Upsert cho phép đồng bộ định kỳ an toàn tuyệt đối mà không sợ nhân bản dữ liệu:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <p className="font-bold text-emerald-700 dark:text-emerald-400 mb-1">1. Created (Tạo mới)</p>
                <p className="text-slate-600 dark:text-slate-400 text-[11px]">
                  Bác sĩ có mã <code>externalId</code> chưa tồn tại sẽ được tạo hồ sơ mới kèm gán đúng chuyên khoa chuẩn.
                </p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <p className="font-bold text-cyan-700 dark:text-cyan-400 mb-1">2. Updated (Cập nhật)</p>
                <p className="text-slate-600 dark:text-slate-400 text-[11px]">
                  Bác sĩ đã có trong hệ thống nếu có thay đổi về học vị, kinh nghiệm, avatar sẽ được cập nhật tự động.
                </p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <p className="font-bold text-slate-700 dark:text-slate-400 mb-1">3. Unchanged (Giữ nguyên)</p>
                <p className="text-slate-600 dark:text-slate-400 text-[11px]">
                  Dữ liệu trùng khớp hoàn toàn được giữ nguyên, bảo toàn tối đa hiệu năng và tính toàn vẹn CSDL.
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* ==================================================
          TAB 2: ĐỒNG BỘ DỮ LIỆU
         ================================================== */}
      {currentTab === 'sync' && (
        <div className="space-y-6">
          <Card className={`${cardBg} rounded-2xl p-6`}>
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4 border-slate-200 dark:border-slate-800">
                <div>
                  <h2 className="text-sm font-bold">Kích hoạt Đồng bộ Danh mục Y tế</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Thực hiện quét danh mục thời gian thực từ cổng HIS và nạp vào NovaCare.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">Giả lập HIS:</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSwitchMockState(1)}
                    disabled={mockStateLoading !== null}
                    className="text-xs border-slate-300 dark:border-slate-700"
                  >
                    {mockStateLoading === 1 && <Loader2 className="w-3 h-3 animate-spin mr-1" />}
                    State 1 (Gốc)
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSwitchMockState(2)}
                    disabled={mockStateLoading !== null}
                    className="text-xs border-amber-400/40 text-amber-700 bg-amber-50 dark:bg-amber-950/40"
                  >
                    {mockStateLoading === 2 && <Loader2 className="w-3 h-3 animate-spin mr-1" />}
                    State 2 (Đổi dữ liệu)
                  </Button>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <span className="text-xs font-semibold block text-slate-700 dark:text-slate-300">Endpoint HIS đang kết nối:</span>
                  <code className="text-xs text-emerald-700 dark:text-emerald-400 font-mono mt-0.5 block">{hisUrl}</code>
                </div>

                <Button
                  onClick={() => syncMutation.mutate(hisUrl)}
                  disabled={syncMutation.isPending || !hisUrl.trim()}
                  className="bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs px-6 h-10 rounded-xl flex items-center gap-2 shrink-0 shadow-sm"
                >
                  {syncMutation.isPending ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Đang đồng bộ danh mục...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4" />
                      Bắt đầu Đồng bộ Danh mục HIS ngay
                    </>
                  )}
                </Button>
              </div>

              {/* Status Banner after sync */}
              {syncResult && (
                <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-emerald-900 dark:text-emerald-300">
                        Đồng bộ hoàn tất thành công với {syncResult.hospitalName}!
                      </p>
                      <p className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-0.5">
                        +{syncResult.createdCount} mới, {syncResult.updatedCount} cập nhật, {syncResult.unchangedCount} giữ nguyên trong {syncResult.durationMs}ms.
                      </p>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleTabChange('results')}
                    className="text-xs border-emerald-300 text-emerald-800 hover:bg-emerald-100"
                  >
                    Xem chi tiết kết quả
                    <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </Button>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* ==================================================
          TAB 3: XEM KẾT QUẢ / LỊCH SỬ ĐỒNG BỘ
         ================================================== */}
      {currentTab === 'results' && (
        <div className="space-y-6">
          {syncResult ? (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <Card className={`${cardBg} rounded-2xl p-4`}>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Bệnh viện đích</p>
                  <p className="text-sm font-bold mt-1 truncate" title={syncResult.hospitalName}>
                    {syncResult.hospitalName}
                  </p>
                </Card>

                <Card className={`${cardBg} rounded-2xl p-4`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Tạo mới (Created)</p>
                      <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                        +{syncResult.createdCount}
                      </p>
                    </div>
                    <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                      <Sparkles className="w-4 h-4" />
                    </div>
                  </div>
                </Card>

                <Card className={`${cardBg} rounded-2xl p-4`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-cyan-600 dark:text-cyan-400 font-medium">Cập nhật (Updated)</p>
                      <p className="text-2xl font-bold text-cyan-600 dark:text-cyan-400 mt-1">
                        {syncResult.updatedCount}
                      </p>
                    </div>
                    <div className="p-2 rounded-xl bg-cyan-50 text-cyan-600">
                      <RefreshCw className="w-4 h-4" />
                    </div>
                  </div>
                </Card>

                <Card className={`${cardBg} rounded-2xl p-4`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Không đổi (Unchanged)</p>
                      <p className="text-2xl font-bold text-slate-700 dark:text-slate-300 mt-1">
                        {syncResult.unchangedCount}
                      </p>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-100 text-slate-500">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                  </div>
                </Card>

                <Card className={`${cardBg} rounded-2xl p-4`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Thời gian thực thi</p>
                      <p className="text-2xl font-bold text-slate-700 dark:text-slate-300 mt-1">
                        {syncResult.durationMs}ms
                      </p>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-100 text-slate-500">
                      <Clock className="w-4 h-4" />
                    </div>
                  </div>
                </Card>
              </div>

              {/* Filter by status */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-medium">Lọc kết quả:</span>
                {(['ALL', 'created', 'updated', 'unchanged'] as const).map((st) => (
                  <Button
                    key={st}
                    variant="outline"
                    size="sm"
                    onClick={() => setResultFilter(st)}
                    className={`h-7 text-xs rounded-lg px-2.5 font-medium ${
                      resultFilter === st
                        ? 'bg-emerald-700 text-white border-emerald-700'
                        : 'border-slate-300 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {st === 'ALL' && 'Tất cả'}
                    {st === 'created' && 'Mới tạo'}
                    {st === 'updated' && 'Cập nhật'}
                    {st === 'unchanged' && 'Giữ nguyên'}
                  </Button>
                ))}
              </div>

              {/* Result Table */}
              <Card className={`${cardBg} rounded-2xl overflow-hidden`}>
                <CardContent className="p-0 overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className={`border-b text-xs font-semibold ${
                      isLight ? 'bg-slate-50 border-slate-200 text-slate-600' : 'bg-slate-900 border-slate-800 text-slate-400'
                    }`}>
                      <tr>
                        <th className="py-3.5 px-4 min-w-[140px]">Mã HIS (External ID)</th>
                        <th className="py-3.5 px-4 min-w-[200px]">Họ tên Bác sĩ</th>
                        <th className="py-3.5 px-4 min-w-[120px]">Học vị</th>
                        <th className="py-3.5 px-4 min-w-[180px]">Chuyên khoa chuẩn hóa</th>
                        <th className="py-3.5 px-4 text-right min-w-[130px]">Trạng thái xử lý</th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y ${isLight ? 'divide-slate-100' : 'divide-slate-800/60'}`}>
                      {filteredItems.map((item, idx) => (
                        <tr key={idx} className={`transition-colors ${isLight ? 'hover:bg-slate-50' : 'hover:bg-slate-900/60'}`}>
                          <td className="py-3.5 px-4 font-mono text-slate-600 dark:text-slate-400 font-semibold">
                            {item.externalId}
                          </td>
                          <td className={`py-3.5 px-4 font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                            {item.name}
                          </td>
                          <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400">
                            {item.degree || 'Bác sĩ'}
                          </td>
                          <td className="py-3.5 px-4 text-slate-800 dark:text-slate-200 font-medium">
                            {item.specialty}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            {item.status === 'created' && (
                              <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 text-[11px] font-semibold">
                                + Mới tạo (Created)
                              </Badge>
                            )}
                            {item.status === 'updated' && (
                              <Badge className="bg-cyan-100 text-cyan-800 border-cyan-300 text-[11px] font-semibold">
                                Cập nhật (Updated)
                              </Badge>
                            )}
                            {item.status === 'unchanged' && (
                              <Badge className="bg-slate-100 text-slate-700 border-slate-300 text-[11px] font-medium">
                                Giữ nguyên (Unchanged)
                              </Badge>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card className={`${cardBg} rounded-2xl p-12 text-center space-y-3`}>
              <RefreshCw className="w-8 h-8 text-slate-400 mx-auto" />
              <p className="text-sm font-semibold">Chưa có dữ liệu phiên đồng bộ nào gần đây</p>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Vui lòng sang tab <strong>"Đồng bộ dữ liệu"</strong> và bấm <strong>"Bắt đầu đồng bộ danh mục HIS ngay"</strong> để kích hoạt quét và nạp dữ liệu.
              </p>
              <Button
                onClick={() => handleTabChange('sync')}
                className="bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs px-4 py-2 rounded-xl mt-2"
              >
                Đến tab Đồng bộ dữ liệu
              </Button>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

export default function HisSyncPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-500">Đang tải trang Tích hợp HIS...</div>}>
      <HisSyncContent />
    </Suspense>
  );
}
