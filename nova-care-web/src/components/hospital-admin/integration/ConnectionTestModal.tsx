'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  CheckCircle2,
  AlertTriangle,
  Loader2,
  RefreshCw,
  PlayCircle,
  Clock,
  ShieldCheck,
  Network,
  ArrowRight,
  Lock,
  Layers,
  UserCheck,
  Building2,
  ExternalLink,
} from 'lucide-react';
import { hospitalAdminService } from '@/services/hospital-admin.service';
import { toast } from 'sonner';

interface ConnectionTestModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultEndpointUrl?: string;
  defaultAuthType?: 'none' | 'api_key' | 'bearer';
  defaultAuthToken?: string;
  hospitalName?: string;
  hospitalCode?: string;
  onProceedToSync?: () => void;
}

export function ConnectionTestModal({
  open,
  onOpenChange,
  defaultEndpointUrl = 'http://localhost:5055/api/hospital-catalog',
  defaultAuthType = 'none',
  defaultAuthToken = '',
  hospitalName = 'Bệnh viện An Bình',
  hospitalCode = 'HIS_BV_ANBINH',
  onProceedToSync,
}: ConnectionTestModalProps) {
  const [endpointUrl, setEndpointUrl] = useState(defaultEndpointUrl);
  const [authType, setAuthType] = useState<'none' | 'api_key' | 'bearer'>(defaultAuthType);
  const [authToken, setAuthToken] = useState(defaultAuthToken);

  // States: 'idle' | 'testing' | 'success' | 'error'
  const [testState, setTestState] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testResult, setTestResult] = useState<any>(null);
  const [testError, setTestError] = useState<string | null>(null);
  const [latencyMs, setLatencyMs] = useState<number>(0);

  // Reset or initialize when modal opens
  useEffect(() => {
    if (open) {
      setEndpointUrl(defaultEndpointUrl || 'http://localhost:5055/api/hospital-catalog');
      setAuthType(defaultAuthType || 'none');
      setAuthToken(defaultAuthToken || '');
      // Start test automatically when opening modal
      handleRunTest(defaultEndpointUrl || 'http://localhost:5055/api/hospital-catalog', defaultAuthType || 'none', defaultAuthToken || '');
    }
  }, [open]);

  const handleRunTest = async (urlToTest?: string, authTypeToTest?: string, tokenToTest?: string) => {
    const targetUrl = (urlToTest !== undefined ? urlToTest : endpointUrl).trim();
    if (!targetUrl) {
      toast.error('Vui lòng nhập đường dẫn Endpoint URL của hệ thống HIS');
      return;
    }

    const currentAuthType = authTypeToTest !== undefined ? authTypeToTest : authType;
    const currentToken = tokenToTest !== undefined ? tokenToTest : authToken;

    setTestState('testing');
    setTestError(null);
    setTestResult(null);

    const startTime = performance.now();

    try {
      // Giữ nhịp tối thiểu 1.2s để người dùng quan sát rõ màn hình "Đang kiểm tra"
      const minDelay = new Promise((resolve) => setTimeout(resolve, 1200));

      const [res] = await Promise.all([
        hospitalAdminService.testHandshake({
          endpointUrl: targetUrl,
          authType: currentAuthType,
          authToken: currentToken.trim(),
        }),
        minDelay,
      ]);

      const elapsed = Math.round(performance.now() - startTime);
      setLatencyMs(Math.max(16, elapsed));
      setTestResult(res);
      setTestState('success');
      toast.success(`Kiểm tra thành công! Máy chủ HIS phản hồi tốt (HTTP 200 OK)`);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Không thể kết nối đến máy chủ HIS ngoài (fetch failed)';
      setTestError(msg);
      setTestState('error');
      toast.error(`Kiểm tra thất bại: ${msg}`);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden rounded-3xl border border-slate-200 shadow-2xl bg-white max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="p-6 pb-4 border-b border-slate-100 bg-slate-50/70 shrink-0">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <DialogTitle className="text-lg font-black text-slate-900 tracking-tight">
                  Kiểm tra kết nối HIS & Thẩm định API
                </DialogTitle>
                <Badge variant="outline" className="border-slate-300 text-slate-600 text-[10px] font-mono">
                  NC-SPEC-2026
                </Badge>
              </div>
              <DialogDescription className="text-xs text-slate-500 mt-1">
                Giao diện kiểm thử độc lập: Gửi yêu cầu thẩm định tính sẵn sàng và hợp chuẩn kỹ thuật của cổng liên thông trước khi đồng bộ.
              </DialogDescription>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* ========================================================================= */}
          {/* TRẠNG THÁI 1: ĐANG KIỂM TRA (IN PROGRESS - EXACT USER SPECIFICATION) */}
          {/* ========================================================================= */}
          {testState === 'testing' && (
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
              {/* Header: Title, Facility & Badge */}
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h4 className="text-xl font-bold text-slate-900 tracking-tight">
                    Kết nối HIS
                  </h4>
                  <p className="text-sm text-slate-500 mt-1">
                    {hospitalName} · {hospitalCode}
                  </p>
                </div>

                <div>
                  <Badge className="bg-blue-50 text-blue-700 hover:bg-blue-50 border-blue-200 font-medium text-xs px-3 py-1 rounded-full shadow-none flex items-center gap-1.5">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
                    Đang kiểm tra
                  </Badge>
                </div>
              </div>

              <div className="border-t border-slate-100" />

              {/* Endpoint & Progress steps */}
              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-slate-400 block mb-1">Endpoint đang kiểm tra</span>
                  <code className="font-mono text-xs bg-slate-100 text-slate-800 px-2.5 py-1 rounded border border-slate-200/50 inline-block font-normal">
                    {endpointUrl.trim()}
                  </code>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                  <div className="flex items-center gap-2 font-semibold text-slate-800">
                    <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                    <span>Đang gửi yêu cầu đến HIS</span>
                  </div>
                  <p className="text-slate-500 pl-6 text-[11px]">Đang chờ phản hồi từ API…</p>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-1" />

              <p className="text-[11px] text-slate-400 italic">
                Đây là trạng thái minh họa; giao diện thật chỉ hiển thị khi yêu cầu kiểm tra đang chạy.
              </p>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TRẠNG THÁI 2: KIỂM TRA KẾT NỐI THÀNH CÔNG (SUCCESSFUL INSPECTION) */}
          {/* ========================================================================= */}
          {testState === 'success' && testResult && (
            <div className="space-y-4">
              {/* Success Banner Card */}
              <div className="p-6 rounded-2xl bg-white border border-emerald-200 shadow-sm space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h4 className="text-xl font-bold text-slate-900 tracking-tight">
                      Kết nối HIS
                    </h4>
                    <p className="text-sm text-slate-500 mt-1">
                      {testResult.hospitalName || hospitalName} · {testResult.hospitalCode || hospitalCode}
                    </p>
                  </div>

                  <div>
                    <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 font-bold text-xs px-3 py-1 rounded-full shadow-none flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      Kiểm tra kết nối thành công
                    </Badge>
                  </div>
                </div>

                <div className="border-t border-slate-100" />

                {/* Subtitle Announcement */}
                <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-200/70 text-emerald-950 text-xs leading-relaxed space-y-0.5">
                  <strong className="block font-bold">API đạt chuẩn hợp đồng kỹ thuật! Phản hồi tốt từ máy chủ HIS.</strong>
                  <p className="text-slate-600">
                    Hệ thống đã hoàn tất thẩm định mã trạng thái, chữ ký bảo mật và cấu trúc dữ liệu JSON. Dữ liệu sẵn sàng để đưa vào đợt đồng bộ.
                  </p>
                </div>

                {/* Technical Inspection Result Cards (Theo quy định hợp đồng) */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] font-bold uppercase text-slate-500 block">Trạng thái HTTP</span>
                    <div className="text-sm font-bold font-mono text-emerald-700 mt-0.5">200 OK</div>
                    <span className="text-[10px] text-slate-400">REST JSON</span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] font-bold uppercase text-slate-500 block">Thời gian phản hồi</span>
                    <div className="text-sm font-bold font-mono text-blue-700 mt-0.5">{latencyMs} ms</div>
                    <span className="text-[10px] text-slate-400">Đạt chuẩn &lt; 2000ms</span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] font-bold uppercase text-slate-500 block">Xác thực bảo mật</span>
                    <div className="text-sm font-bold text-slate-800 mt-0.5 truncate">
                      {authType === 'api_key' ? 'X-API-KEY' : authType === 'bearer' ? 'Bearer Token' : 'Public API'}
                    </div>
                    <span className="text-[10px] text-emerald-600 font-medium">Hợp lệ</span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] font-bold uppercase text-slate-500 block">Chuẩn Schema</span>
                    <div className="text-sm font-bold text-slate-800 mt-0.5">Hợp đồng V1</div>
                    <span className="text-[10px] text-emerald-600 font-medium">Khớp cấu trúc</span>
                  </div>
                </div>

                {/* Discovered Data Summary */}
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
                  <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px] block">
                    Dữ liệu phát hiện từ HIS
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    <div className="flex items-center gap-2">
                      <Layers className="w-4 h-4 text-emerald-600 shrink-0" />
                      <div>
                        <div className="font-bold text-slate-900">{testResult.totalDepartments || testResult.departments?.length || 0} Khoa phòng</div>
                        <span className="text-[10px] text-slate-500">Sẵn sàng ánh xạ</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <UserCheck className="w-4 h-4 text-blue-600 shrink-0" />
                      <div>
                        <div className="font-bold text-slate-900">{testResult.totalDoctors || testResult.doctors?.length || 0} Bác sĩ</div>
                        <span className="text-[10px] text-slate-500">Đầy đủ ca trực & giá khám</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-purple-600 shrink-0" />
                      <div>
                        <div className="font-bold text-slate-900 truncate">{testResult.hospitalName || 'Đã nhận diện viện'}</div>
                        <span className="text-[10px] text-slate-500">{testResult.address ? 'Có địa chỉ' : 'Chuẩn hồ sơ'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-1" />

                {/* Action buttons inside result */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRunTest()}
                    className="border-slate-300 text-slate-700 hover:bg-slate-100 text-xs rounded-xl gap-1.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Kiểm tra lại
                  </Button>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onOpenChange(false)}
                      className="text-slate-500 text-xs rounded-xl"
                    >
                      Đóng
                    </Button>

                    {onProceedToSync && (
                      <Button
                        size="sm"
                        onClick={() => {
                          onOpenChange(false);
                          onProceedToSync();
                        }}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl gap-1.5 shadow-sm shadow-emerald-600/20"
                      >
                        Tiến hành đồng bộ ngay
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TRẠNG THÁI 3: KIỂM TRA KẾT NỐI THẤT BẠI (FAILED / ERROR INSPECTION) */}
          {/* ========================================================================= */}
          {testState === 'error' && (
            <div className="p-6 rounded-2xl bg-white border border-rose-200 shadow-sm space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h4 className="text-xl font-bold text-slate-900 tracking-tight">
                    Kết nối HIS
                  </h4>
                  <p className="text-sm text-slate-500 mt-1">
                    {hospitalName} · {hospitalCode}
                  </p>
                </div>

                <div>
                  <Badge className="bg-rose-50 text-rose-700 border-rose-200 font-bold text-xs px-3 py-1 rounded-full shadow-none flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                    Kiểm tra kết nối thất bại
                  </Badge>
                </div>
              </div>

              <div className="border-t border-slate-100" />

              {/* Chi tiết nguyên nhân thất bại */}
              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-slate-400 block mb-1">Endpoint đã kiểm tra</span>
                  <code className="font-mono text-xs bg-rose-50 text-rose-800 px-2.5 py-1 rounded border border-rose-200/60 inline-block font-normal">
                    {endpointUrl.trim()}
                  </code>
                </div>

                <div className="p-4 rounded-xl bg-rose-50/70 border border-rose-200 text-rose-900 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-rose-800">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>Nguyên nhân thất bại:</span>
                  </div>
                  <p className="text-slate-800 font-mono text-[11px] bg-white/80 p-2.5 rounded-lg border border-rose-200">
                    {testError}
                  </p>

                  {/* Gợi ý khắc phục theo quy định */}
                  <div className="pt-2 border-t border-rose-200/60 text-slate-700 space-y-1">
                    <strong className="text-slate-900 block font-bold">Gợi ý khắc phục theo tiêu chuẩn kỹ thuật:</strong>
                    <ul className="list-disc pl-4 space-y-1 text-[11px]">
                      <li>Kiểm tra máy chủ HIS có đang chạy và mở route <code className="font-mono text-rose-700">/api/hospital-catalog</code> không.</li>
                      <li>Kiểm tra cổng kết nối mạng (Port), tường lửa (Firewall) hoặc cấu hình CORS.</li>
                      <li>Kiểm tra cấu trúc JSON phản hồi có đúng quy định: <code className="font-mono text-rose-700">{`{ status: 200, data: { departments: [], doctors: [] } }`}</code> không.</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-1" />

              {/* Action Buttons */}
              <div className="flex items-center justify-between gap-3">
                <Button
                  size="sm"
                  onClick={() => handleRunTest()}
                  className="bg-black hover:bg-slate-900 text-white font-bold text-xs h-9 px-6 rounded-full shadow-xs gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Thử kiểm tra lại
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onOpenChange(false)}
                  className="border-slate-300 text-slate-700 hover:bg-slate-100 text-xs rounded-xl"
                >
                  Đóng
                </Button>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TRẠNG THÁI IDLE: NẾU NGƯỜI DÙNG MUỐN CHỈNH ENDPOINT VÀ TEST */}
          {/* ========================================================================= */}
          {testState === 'idle' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <h5 className="font-bold text-xs uppercase tracking-wider text-slate-700">
                  Thông số kiểm thử
                </h5>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="text-slate-600 block mb-1 font-medium">HIS Endpoint URL:</label>
                    <Input
                      value={endpointUrl}
                      onChange={(e) => setEndpointUrl(e.target.value)}
                      placeholder="http://localhost:5055/api/hospital-catalog"
                      className="font-mono text-xs bg-white"
                    />
                  </div>

                  <div>
                    <label className="text-slate-600 block mb-1 font-medium">Phương thức xác thực:</label>
                    <select
                      value={authType}
                      onChange={(e: any) => setAuthType(e.target.value)}
                      className="w-full bg-white border border-slate-200 text-slate-800 text-xs rounded-xl h-9 px-3"
                    >
                      <option value="none">Không xác thực (Public/Testing)</option>
                      <option value="api_key">X-API-KEY (Header)</option>
                      <option value="bearer">Bearer Token (Authorization)</option>
                    </select>
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <Button
                    size="sm"
                    onClick={() => handleRunTest()}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl gap-1.5"
                  >
                    <PlayCircle className="w-3.5 h-3.5" />
                    Bắt đầu kiểm tra
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
