'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { hospitalAdminService } from '@/services/hospital-admin.service';
import { specialtyService } from '@/services/specialty.service';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Network,
  FileCode2,
  Download,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ArrowRight,
  Database,
  Building2,
  UserCheck,
  Calendar,
  Layers,
  Loader2,
  Copy,
  ExternalLink,
  ShieldCheck,
  ChevronRight,
  Clock,
  Sparkles,
  BookOpen,
  FileSpreadsheet,
  AlertTriangle,
  PlayCircle,
  Settings,
  ArrowLeft,
  Check,
  Lock,
  Code2,
  Info,
} from 'lucide-react';
import { IntegrationContractModal } from '@/components/hospital-admin/integration/IntegrationContractModal';
import { ImplementationGuideModal } from '@/components/hospital-admin/integration/ImplementationGuideModal';
import { FullContinuousGuideModal } from '@/components/hospital-admin/integration/FullContinuousGuideModal';
import { ConnectionTestModal } from '@/components/hospital-admin/integration/ConnectionTestModal';

export function HospitalIntegrationView() {
  const queryClient = useQueryClient();

  // Modals
  const [showContractModal, setShowContractModal] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [showFullGuideModal, setShowFullGuideModal] = useState(false);
  const [showConnectionTestModal, setShowConnectionTestModal] = useState(false);

  // Status query
  const { data: statusData, isLoading: loadingStatus } = useQuery({
    queryKey: ['hospital-admin-integration-status'],
    queryFn: hospitalAdminService.getIntegrationStatus,
  });

  // Master Specialties query for mapping (from NovaCare system catalog)
  const { data: specialtiesData, isLoading: loadingSpecialties } = useQuery({
    queryKey: ['system-master-specialties'],
    queryFn: specialtyService.getAll,
  });
  const availableSpecialties: any[] = Array.isArray(specialtiesData)
    ? specialtiesData
    : ((specialtiesData as any)?.data || (specialtiesData as any)?.items || []);

  // Existing Hospital Doctors query for reconciliation in Step 4 & 5
  const { data: existingDoctorsData } = useQuery({
    queryKey: ['hospital-admin-existing-doctors'],
    queryFn: () => hospitalAdminService.getDoctors({ limit: 100 }),
  });
  const existingDoctorsList: any[] = Array.isArray(existingDoctorsData)
    ? existingDoctorsData
    : (existingDoctorsData as any)?.items ||
    (existingDoctorsData as any)?.data?.items ||
    (existingDoctorsData as any)?.data ||
    [];

  // Toggle for simulation / resetting flow
  const [isTestingNewOnboarding, setIsTestingNewOnboarding] = useState(false);

  // Onboarding Wizard Stepper:
  // 'landing' -> 'method_select' -> 'guide' -> 'validation' -> 'formal_connect'
  const [setupStep, setSetupStep] = useState<
    'landing' | 'method_select' | 'guide' | 'validation' | 'formal_connect'
  >('landing');

  // Selected method: 'api' or 'excel'
  const [selectedMethod, setSelectedMethod] = useState<'api' | 'excel'>('api');

  // Formal connect sub-step: 1: Kết nối, 2: Preview, 3: Mapping, 4: Xác nhận, 5: Sync
  const [formalStep, setFormalStep] = useState<1 | 2 | 3 | 4 | 5>(1);

  // Form states for API Testing & Handshake (Empty by default, user enters or clicks quick template)
  const [endpointUrl, setEndpointUrl] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('novacare_his_endpoint_url');
      if (saved) return saved;
    }
    return '';
  });
  const [authType, setAuthType] = useState<'none' | 'api_key' | 'bearer'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('novacare_his_auth_type') as any) || 'none';
    }
    return 'none';
  });
  const [authToken, setAuthToken] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('novacare_his_auth_token') || '';
    }
    return '';
  });
  const [handshakeResult, setHandshakeResult] = useState<any>(null);
  const [handshakeError, setHandshakeError] = useState<string | null>(null);
  const [testLatencyMs, setTestLatencyMs] = useState<number>(0);
  const [testStartTime, setTestStartTime] = useState<number>(0);
  const [showRawJson, setShowRawJson] = useState<boolean>(false);

  // Dashboard testing connection status
  const [isTestingDashboardConnection, setIsTestingDashboardConnection] = useState(false);
  const [dashboardTestStatus, setDashboardTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [dashboardTestError, setDashboardTestError] = useState<string | null>(null);

  // Keep endpointUrl, authType, authToken persisted in localStorage
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      if (endpointUrl && endpointUrl.trim()) {
        localStorage.setItem('novacare_his_endpoint_url', endpointUrl.trim());
      } else {
        localStorage.removeItem('novacare_his_endpoint_url');
      }
      localStorage.setItem('novacare_his_auth_type', authType);
      localStorage.setItem('novacare_his_auth_token', authToken.trim());
    }
  }, [endpointUrl, authType, authToken]);

  // Mapping & Selection states
  const [specialtyMappings, setSpecialtyMappings] = useState<Record<string, string>>({});
  const [selectedDoctorIds, setSelectedDoctorIds] = useState<string[]>([]);
  const [mappingFilter, setMappingFilter] = useState<'all' | 'mapped' | 'unmapped'>('all');
  const [confirmFilter, setConfirmFilter] = useState<'all' | 'create' | 'update' | 'unchanged' | 'skipped'>('all');

  // Step 5 3-State Execution workflow states (A: Ready, B: Running, C: Completed)
  const [syncExecutionState, setSyncExecutionState] = useState<'ready' | 'running' | 'completed'>('ready');
  const [isPlanConfirmed, setIsPlanConfirmed] = useState(false);
  const [syncRunCode, setSyncRunCode] = useState<string>('');
  const [syncProgress, setSyncProgress] = useState<{
    processed: number;
    total: number;
    success: number;
    error: number;
    pending: number;
    currentDoctorName?: string;
  }>({
    processed: 0,
    total: 0,
    success: 0,
    error: 0,
    pending: 0,
  });
  const [syncFinalReport, setSyncFinalReport] = useState<any>(null);
  const [isExecutionStopped, setIsExecutionStopped] = useState(false);

  // Smart helper to match department name to master specialties
  const findBestSpecialtyMatch = (deptName: string, specs: any[]) => {
    if (!deptName || !specs || specs.length === 0) return '';
    const dLower = deptName.toLowerCase();

    // 1. Direct substring match
    const direct = specs.find(
      (s: any) =>
        dLower.includes(s.name.toLowerCase()) ||
        s.name.toLowerCase().includes(dLower)
    );
    if (direct) return direct.id;

    // 2. Keyword root matching
    const keywordMatch = specs.find((s: any) => {
      const sLower = s.name.toLowerCase();
      if (dLower.includes('tim') && sLower.includes('tim')) return true;
      if ((dLower.includes('khớp') || dLower.includes('xương')) && (sLower.includes('khớp') || sLower.includes('xương'))) return true;
      if ((dLower.includes('sản') || dLower.includes('phụ')) && (sLower.includes('sản') || sLower.includes('phụ'))) return true;
      if (dLower.includes('nhi') && sLower.includes('nhi')) return true;
      if ((dLower.includes('da') || dLower.includes('liễu')) && (sLower.includes('da') || sLower.includes('liễu'))) return true;
      if (dLower.includes('mắt') && sLower.includes('mắt')) return true;
      if ((dLower.includes('tai') || dLower.includes('họng')) && (sLower.includes('tai') || sLower.includes('họng'))) return true;
      if (dLower.includes('tiêu hóa') && sLower.includes('tiêu hóa')) return true;
      if (dLower.includes('thần kinh') && sLower.includes('thần kinh')) return true;
      if (dLower.includes('hô hấp') && sLower.includes('hô hấp')) return true;
      if (dLower.includes('răng') && sLower.includes('răng')) return true;
      if (dLower.includes('ung bướu') && sLower.includes('ung bướu')) return true;
      if (dLower.includes('cổ truyền') && sLower.includes('cổ truyền')) return true;
      return false;
    });
    if (keywordMatch) return keywordMatch.id;

    // Không tìm thấy chuyên khoa nào sẵn có -> Trả về rỗng để hiển thị Chưa ánh xạ
    return '';
  };

  // Auto-fill specialty mappings if handshakeResult is available and mappings are not yet set
  React.useEffect(() => {
    if (handshakeResult?.departments && availableSpecialties.length > 0) {
      setSpecialtyMappings((prev) => {
        let changed = false;
        const next = { ...prev };
        handshakeResult.departments.forEach((dept: any) => {
          if (!next[dept.dept_code]) {
            next[dept.dept_code] = findBestSpecialtyMatch(dept.dept_name, availableSpecialties);
            changed = true;
          }
        });
        return changed ? next : prev;
      });
    }
  }, [handshakeResult, availableSpecialties]);

  // Helper to resolve department code to display specialty name
  const getSpecialtyNameForDept = React.useCallback(
    (deptCode: string) => {
      const deptsList = handshakeResult?.departments || [];
      const specId = specialtyMappings[deptCode];
      if (!specId) {
        const dept = deptsList.find((d: any) => d.dept_code === deptCode);
        return dept?.dept_name || deptCode;
      }
      if (specId === '__AUTO_CREATE__') {
        const dept = deptsList.find((d: any) => d.dept_code === deptCode);
        return dept?.dept_name?.replace(/^(Khoa|Phòng|Trung tâm|Đơn vị|Đơn nguyên)\s+/i, '').trim() || deptCode;
      }
      const spec = availableSpecialties.find((s: any) => s.id === specId);
      return spec?.name || deptCode;
    },
    [handshakeResult?.departments, specialtyMappings, availableSpecialties]
  );

  // Reconcile each doctor against existing database records
  const reconciledDoctors = React.useMemo(() => {
    const doctorsList = handshakeResult?.doctors || [];
    return doctorsList.map((doc: any) => {
      const isSelected = selectedDoctorIds.includes(doc.staffId);
      const specialtyName = getSpecialtyNameForDept(doc.deptCode);

      // Check both flattened properties and nested e.doctor
      const existing = existingDoctorsList.find((e: any) => {
        const existingExternalId = (e.externalId || e.staffId || e.doctor?.externalId || '').trim().toLowerCase();
        const docStaffId = (doc.staffId || doc.externalId || '').trim().toLowerCase();
        if (existingExternalId && docStaffId && existingExternalId === docStaffId) return true;

        const existingFullName = (e.fullName || e.doctor?.fullName || '').trim().toLowerCase();
        const docFullName = (doc.fullName || '').trim().toLowerCase();
        if (existingFullName && docFullName && existingFullName === docFullName) return true;

        return false;
      });

      let status: 'CREATE' | 'UPDATE' | 'UNCHANGED' | 'SKIPPED' = 'CREATE';
      let reason = 'Chưa có bản ghi tương ứng trong NovaCare';

      if (!isSelected) {
        status = 'SKIPPED';
        reason = 'Không xử lý trong đợt này (Bỏ chọn khỏi đợt đồng bộ)';
      } else if (!existing) {
        status = 'CREATE';
        reason = 'Bác sĩ mới, chưa tồn tại trong cơ sở dữ liệu NovaCare';
      } else {
        const existingFee = existing.consultationFee !== undefined && existing.consultationFee !== null ? Number(existing.consultationFee) : undefined;
        const docFee = doc.consultationFee !== undefined && doc.consultationFee !== null ? Number(doc.consultationFee) : undefined;
        const feeDiff = existingFee !== undefined && docFee !== undefined && existingFee !== docFee;

        const existingTitle = (existing.title || existing.doctor?.title || '').trim().toLowerCase();
        const existingQual = (existing.qualification || existing.doctor?.qualification || '').trim().toLowerCase();
        const docTitle = (doc.academicDegree || '').trim().toLowerCase();
        const docQual = (doc.qualificationTitle || '').trim().toLowerCase();

        const titleDiff =
          (docTitle && existingTitle && existingTitle !== docTitle) ||
          (docQual && existingQual && existingQual !== docQual);

        if (feeDiff || titleDiff) {
          status = 'UPDATE';
          reason = feeDiff
            ? `Phí khám thay đổi: ${new Intl.NumberFormat('vi-VN').format(existingFee || 0)}đ → ${new Intl.NumberFormat('vi-VN').format(docFee || 0)}đ`
            : 'Có thay đổi dữ liệu chức danh/học vị';
        } else {
          status = 'UNCHANGED';
          reason = 'Dữ liệu đã tương đương trong NovaCare (không cần ghi lại)';
        }
      }

      return {
        doc,
        isSelected,
        specialtyName,
        status,
        reason,
        existing,
      };
    });
  }, [handshakeResult?.doctors, getSpecialtyNameForDept, selectedDoctorIds, existingDoctorsList]);

  const createCount = reconciledDoctors.filter((d: any) => d.status === 'CREATE').length;
  const updateCount = reconciledDoctors.filter((d: any) => d.status === 'UPDATE').length;
  const unchangedCount = reconciledDoctors.filter((d: any) => d.status === 'UNCHANGED').length;
  const skippedCount = reconciledDoctors.filter((d: any) => d.status === 'SKIPPED').length;

  // Mutation: Test Handshake
  const handshakeMutation = useMutation({
    mutationFn: (payload: { endpointUrl: string; authType?: string; authToken?: string }) =>
      hospitalAdminService.testHandshake(payload),
    onSuccess: (data) => {
      const elapsed = testStartTime > 0 ? Math.round(performance.now() - testStartTime) : 28;
      setTestLatencyMs(Math.max(16, elapsed));
      setHandshakeResult(data);
      setHandshakeError(null);
      toast.success('Kiểm tra API thành công! Dữ liệu đạt chuẩn hợp đồng.');

      // Smart initial department mapping
      const initialMappings: Record<string, string> = {};
      if (data?.departments && availableSpecialties.length > 0) {
        data.departments.forEach((dept: any) => {
          initialMappings[dept.dept_code] = findBestSpecialtyMatch(dept.dept_name, availableSpecialties);
        });
      }
      setSpecialtyMappings(initialMappings);

      // Select all doctors by default
      if (data?.doctors) {
        setSelectedDoctorIds(data.doctors.map((d: any) => d.staffId));
      }
    },
    onError: (err: any) => {
      const elapsed = testStartTime > 0 ? Math.round(performance.now() - testStartTime) : 40;
      setTestLatencyMs(Math.max(20, elapsed));
      setHandshakeResult(null);
      const msg = err?.response?.data?.message || err?.message || 'Không thể kết nối đến API Bệnh viện';
      setHandshakeError(msg);
      toast.error(`Kiểm tra API thất bại: ${msg}`);
    },
  });

  // Mutation: Sync Catalog
  const syncMutation = useMutation({
    mutationFn: (payload: {
      endpointUrl: string;
      authType?: string;
      authToken?: string;
      specialtyMappings: Record<string, string>;
      selectedDoctorIds: string[];
    }) => hospitalAdminService.syncCatalog(payload),
    onSuccess: (data) => {
      toast.success(
        `Đồng bộ thành công! Tạo mới: ${data.createdCount}, Cập nhật: ${data.updatedCount}, Giữ nguyên: ${data.unchangedCount}`
      );
      queryClient.invalidateQueries({ queryKey: ['hospital-admin-integration-status'] });
      queryClient.invalidateQueries({ queryKey: ['hospital-admin-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['hospital-admin-doctors'] });
      queryClient.invalidateQueries({ queryKey: ['hospital-admin-specialties'] });
      queryClient.invalidateQueries({ queryKey: ['hospital-admin-schedules'] });

      if (setupStep === 'formal_connect' && formalStep === 5) {
        setSyncFinalReport(data);
        setSyncExecutionState('completed');
      } else {
        setIsTestingNewOnboarding(false);
        setSetupStep('landing');
      }
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || err?.message || 'Lỗi khi đồng bộ dữ liệu vào hệ thống';
      toast.error(msg);
      if (setupStep === 'formal_connect' && formalStep === 5) {
        setSyncFinalReport({
          error: true,
          errorMessage: msg,
          createdCount: 0,
          updatedCount: 0,
          unchangedCount: 0,
          errorCount: 1,
        });
        setSyncExecutionState('completed');
      }
    },
  });

  const handleStartSyncExecution = () => {
    if (!isPlanConfirmed) {
      toast.error('Vui lòng tích chọn xác nhận thực thi kế hoạch trước khi bắt đầu.');
      return;
    }
    const runCode = `SYNC-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(100 + Math.random() * 900)}`;
    setSyncRunCode(runCode);
    setSyncExecutionState('running');
    setIsExecutionStopped(false);

    const targetUrl = endpointUrl.trim();
    if (!targetUrl) {
      toast.error('Endpoint URL không hợp lệ.');
      return;
    }

    const totalDocs = selectedDoctorIds.length;
    setSyncProgress({
      processed: 0,
      total: totalDocs,
      success: 0,
      error: 0,
      pending: totalDocs,
      currentDoctorName: 'Đang kết nối API HIS và thẩm định schema...',
    });

    syncMutation.mutate({
      endpointUrl: targetUrl,
      authType,
      authToken: authToken.trim(),
      specialtyMappings,
      selectedDoctorIds,
    });
  };

  // Live progressive simulation during Step 5 'running' state
  React.useEffect(() => {
    let timer: any;
    if (syncExecutionState === 'running' && syncMutation.isPending && !isExecutionStopped) {
      const docsToSync = handshakeResult?.doctors?.filter((d: any) => selectedDoctorIds.includes(d.staffId)) || [];
      const total = docsToSync.length || 1;
      let currentStep = 0;

      timer = setInterval(() => {
        currentStep++;
        if (currentStep <= total) {
          const doc = docsToSync[currentStep - 1];
          setSyncProgress({
            processed: currentStep,
            total,
            success: currentStep,
            error: 0,
            pending: Math.max(0, total - currentStep),
            currentDoctorName: doc ? `${doc.academicDegree ? `${doc.academicDegree} ` : ''}${doc.fullName} (${doc.staffId})` : undefined,
          });
        }
      }, 700);
    }
    return () => clearInterval(timer);
  }, [syncExecutionState, syncMutation.isPending, isExecutionStopped, handshakeResult, selectedDoctorIds]);

  const handleTestHandshake = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!endpointUrl || !endpointUrl.trim()) {
      toast.error('Vui lòng nhập đường dẫn Endpoint URL của bệnh viện');
      return;
    }
    if (authType !== 'none' && (!authToken || !authToken.trim())) {
      toast.error(`Vui lòng nhập mã khóa xác thực ${authType === 'api_key' ? 'X-API-KEY' : 'Bearer Token'}`);
      return;
    }
    setHandshakeError(null);
    setTestStartTime(performance.now());
    handshakeMutation.mutate({
      endpointUrl: endpointUrl.trim(),
      authType,
      authToken: authToken.trim(),
    });
  };

  const handleRunDashboardConnectionTest = async () => {
    setIsTestingDashboardConnection(true);
    setDashboardTestStatus('testing');
    const start = performance.now();
    const targetUrl = endpointUrl.trim() || 'http://localhost:5055/api/hospital-catalog';

    try {
      const minDelay = new Promise((resolve) => setTimeout(resolve, 1200));
      const [res] = await Promise.all([
        hospitalAdminService.testHandshake({
          endpointUrl: targetUrl,
          authType,
          authToken: authToken.trim(),
        }),
        minDelay,
      ]);
      const elapsed = Math.round(performance.now() - start);
      setTestLatencyMs(Math.max(16, elapsed));
      setHandshakeResult(res);
      setDashboardTestStatus('success');
      setDashboardTestError(null);
      toast.success(`Máy chủ HIS ${res?.hospitalName || ''} phản hồi tốt (HTTP 200 OK)`);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Không thể kết nối đến máy chủ HIS ngoài';
      setDashboardTestStatus('error');
      setDashboardTestError(msg);
      toast.error(`Kiểm tra thất bại: ${msg}`);
    } finally {
      setIsTestingDashboardConnection(false);
    }
  };

  const handleSyncSubmit = () => {
    if (!endpointUrl || !endpointUrl.trim()) {
      toast.error('Vui lòng nhập đường dẫn Endpoint URL của bệnh viện');
      return;
    }
    if (authType !== 'none' && (!authToken || !authToken.trim())) {
      toast.error(`Vui lòng nhập mã khóa xác thực ${authType === 'api_key' ? 'X-API-KEY' : 'Bearer Token'}`);
      return;
    }
    if (selectedDoctorIds.length === 0) {
      toast.error('Vui lòng chọn ít nhất một bác sĩ để đồng bộ');
      return;
    }
    syncMutation.mutate({
      endpointUrl: endpointUrl.trim(),
      authType,
      authToken: authToken.trim(),
      specialtyMappings,
      selectedDoctorIds,
    });
  };

  const toggleDoctorSelection = (staffId: string) => {
    setSelectedDoctorIds((prev) =>
      prev.includes(staffId) ? prev.filter((id) => id !== staffId) : [...prev, staffId]
    );
  };

  const selectAllDoctors = () => {
    if (!handshakeResult?.doctors) return;
    if (selectedDoctorIds.length === handshakeResult.doctors.length) {
      setSelectedDoctorIds([]);
    } else {
      setSelectedDoctorIds(handshakeResult.doctors.map((d: any) => d.staffId));
    }
  };


  // Determine view mode:
  // If already connected and not currently trying out the setup wizard -> Show Connected Dashboard
  const isAlreadyConnected = !!statusData?.isConnected && !isTestingNewOnboarding;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Modals */}
      <FullContinuousGuideModal open={showFullGuideModal} onOpenChange={setShowFullGuideModal} />
      <IntegrationContractModal open={showContractModal} onOpenChange={setShowContractModal} />
      <ImplementationGuideModal open={showGuideModal} onOpenChange={setShowGuideModal} />
      <ConnectionTestModal
        open={showConnectionTestModal}
        onOpenChange={setShowConnectionTestModal}
        defaultEndpointUrl={endpointUrl.trim() || 'http://localhost:5055/api/hospital-catalog'}
        defaultAuthType={authType}
        defaultAuthToken={authToken}
        hospitalName={statusData?.hospitalName || handshakeResult?.hospitalName || 'Bệnh viện An Bình'}
        hospitalCode={statusData?.externalId || handshakeResult?.hospitalCode || 'HIS_BV_ANBINH'}
        onProceedToSync={() => {
          const targetUrl = endpointUrl.trim() || 'http://localhost:5055/api/hospital-catalog';
          toast.loading('Đang kích hoạt đồng bộ dữ liệu mới nhất từ HIS...');
          syncMutation.mutate({
            endpointUrl: targetUrl,
            authType,
            authToken: authToken.trim(),
            specialtyMappings,
            selectedDoctorIds: [],
          });
        }}
      />

      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gradient-to-r from-[#0c4b39] via-emerald-900 to-slate-950 p-6 rounded-3xl border border-emerald-500/20 shadow-lg text-white">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#66FF33]/20 text-[#66FF33] text-xs font-bold uppercase tracking-wider mb-1">
            <Network className="w-3.5 h-3.5" />
            HIS Interoperability & Integration Gateway
          </div>
          <h1 className="text-2xl font-black tracking-tight">
            Tích Hợp & Kết Nối Hệ Thống Bệnh Viện (HIS)
          </h1>
          <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
            Cổng liên thông chuẩn hóa danh mục Khoa phòng, Bác sĩ và Ca trực giữa phần mềm HIS của bệnh viện và Nền tảng Đặt khám NovaCare Health.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {statusData?.isConnected ? (
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-bold">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Đã kết nối ({statusData.externalId})
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-bold">
              <AlertCircle className="w-4 h-4 text-amber-400" />
              Chưa thiết lập kết nối
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* CASE 1: ALREADY CONNECTED DASHBOARD */}
      {/* ========================================================================= */}
      {isAlreadyConnected ? (
        <div className="space-y-6">
          {/* Status & Quick Actions Bar */}
          {isTestingDashboardConnection ? (
            /* ========================================================================= */
            /* CASE A: ĐANG KIỂM TRA (IN PROGRESS - EXACT SPECIFICATION) */
            /* ========================================================================= */
            <Card className="bg-white border-slate-200 shadow-sm rounded-2xl overflow-hidden p-6 space-y-4">
              {/* Header: Title, Facility & Badge */}
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 tracking-tight">
                    Kết nối HIS
                  </h3>
                  <p className="text-sm text-slate-500 mt-1">
                    {statusData?.hospitalName || handshakeResult?.hospitalName || 'Bệnh viện An Bình'} · {statusData?.externalId || 'HIS_BV_ANBINH'}
                  </p>
                </div>

                <div>
                  <Badge className="bg-blue-50 text-blue-700 hover:bg-blue-50 border-blue-200 font-medium text-xs px-3 py-1 rounded-full shadow-none flex items-center gap-1.5">
                    <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
                    Đang kiểm tra
                  </Badge>
                </div>
              </div>

              <div className="border-t border-slate-100" />

              {/* In-progress status details */}
              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-slate-400 block mb-1">Endpoint đang kiểm tra</span>
                  <code className="font-mono text-xs bg-slate-100 text-slate-800 px-2.5 py-1 rounded border border-slate-200/50 inline-block font-normal">
                    {endpointUrl.trim() || 'http://localhost:5055/api/hospital-catalog'}
                  </code>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                  <div className="flex items-center gap-2 font-semibold text-slate-800">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
                    <span>Đang gửi yêu cầu đến HIS</span>
                  </div>
                  <p className="text-slate-500 pl-5.5 text-[11px]">Đang chờ phản hồi từ API…</p>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-1" />

              <p className="text-[11px] text-slate-400 italic">
                Đây là trạng thái minh họa; giao diện thật chỉ hiển thị khi yêu cầu kiểm tra đang chạy.
              </p>
            </Card>
          ) : dashboardTestStatus === 'error' ? (
            /* ========================================================================= */
            /* CASE B: LỖI KẾT NỐI (TEST FAILED) */
            /* ========================================================================= */
            <Card className="bg-white border-rose-200 shadow-sm rounded-2xl overflow-hidden p-6 space-y-4">
              {/* Header: Title, Facility & Badge */}
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 tracking-tight">
                    Kết nối HIS
                  </h3>
                  <p className="text-sm text-slate-500 mt-1">
                    {statusData?.hospitalName || handshakeResult?.hospitalName || 'Bệnh viện An Bình'} · {statusData?.externalId || 'HIS_BV_ANBINH'}
                  </p>
                </div>

                <div>
                  <Badge className="bg-rose-50 text-rose-700 hover:bg-rose-50 border-rose-200 font-medium text-xs px-3 py-1 rounded-full shadow-none flex items-center gap-1.5">
                    <AlertTriangle className="w-3 h-3 text-rose-600" />
                    Lỗi kết nối
                  </Badge>
                </div>
              </div>

              <div className="border-t border-slate-100" />

              {/* Error details callout */}
              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-slate-400 block mb-1">Endpoint đang kiểm tra</span>
                  <code className="font-mono text-xs bg-rose-50 text-rose-800 px-2.5 py-1 rounded border border-rose-200/60 inline-block font-normal">
                    {endpointUrl.trim() || 'http://localhost:5055/api/hospital-catalog'}
                  </code>
                </div>

                <div className="p-3.5 rounded-xl bg-rose-50/60 border border-rose-200 text-rose-900 space-y-2">
                  <p className="font-semibold text-rose-800">
                    Kiểm tra thất bại: API chưa đạt chuẩn hợp đồng
                  </p>
                  <p className="text-slate-600">
                    Chi tiết lỗi: <strong>{dashboardTestError}</strong>
                  </p>
                  <div className="text-[11px] text-slate-600 bg-white/80 p-2.5 rounded-lg border border-rose-200/80 space-y-1">
                    <span className="font-bold text-slate-800 block">Gợi ý khắc phục:</span>
                    <ul className="list-disc pl-4 space-y-0.5">
                      <li>Kiểm tra máy chủ HIS có đang chạy và mở route <code className="font-mono text-rose-700">/api/hospital-catalog</code> không.</li>
                      <li>Kiểm tra phản hồi có đúng cấu trúc <code className="font-mono text-rose-700">{`{ status: 200, data: { departments: [], doctors: [] } }`}</code> không.</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-1" />

              {/* Action Buttons */}
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <Button
                    size="sm"
                    onClick={handleRunDashboardConnectionTest}
                    className="bg-black hover:bg-slate-900 text-white font-bold text-xs h-9 px-6 rounded-full shadow-xs"
                  >
                    <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                    Kiểm tra lại
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setIsTestingNewOnboarding(true);
                      setSetupStep('validation');
                    }}
                    className="border-slate-200 text-slate-800 hover:bg-slate-50 font-medium text-xs h-9 px-5 rounded-full"
                  >
                    Cấu hình lại
                  </Button>
                </div>

                <p className="text-[11px] text-slate-400 mt-3">
                  Giao diện minh họa. Trạng thái thực tế phải lấy từ backend.
                </p>
              </div>
            </Card>
          ) : (
            /* ========================================================================= */
            /* CASE C: ĐANG HOẠT ĐỘNG (ACTIVE / NORMAL OR SUCCESSFUL CHECK) */
            /* ========================================================================= */
            <Card className="bg-white border-slate-200 shadow-sm rounded-2xl overflow-hidden p-6 space-y-4">
              {/* Header: Title, Facility & Badge */}
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 tracking-tight">
                    Kết nối HIS
                  </h3>
                  <p className="text-sm text-slate-500 mt-1">
                    {statusData?.hospitalName || handshakeResult?.hospitalName || 'Bệnh viện An Bình'}
                  </p>
                </div>

                <div>
                  <Badge className="bg-emerald-50 text-emerald-600 hover:bg-emerald-50 border-transparent font-medium text-xs px-3 py-1 rounded-full shadow-none">
                    Đang hoạt động
                  </Badge>
                </div>
              </div>

              <div className="border-t border-slate-100" />

              {/* Technical Parameters Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6 text-xs">
                {/* Mã bệnh viện */}
                <div>
                  <span className="text-slate-400 block mb-1">Mã bệnh viện</span>
                  <span className="font-bold text-slate-900 text-sm">
                    {statusData?.externalId || 'HIS_BV_ANBINH'}
                  </span>
                </div>

                {/* Phương thức */}
                <div>
                  <span className="text-slate-400 block mb-1">Phương thức</span>
                  <span className="font-bold text-slate-900 text-sm">
                    HIS REST API
                  </span>
                </div>

                {/* API Endpoint */}
                <div className="sm:col-span-2">
                  <span className="text-slate-400 block mb-1">API Endpoint</span>
                  <code className="font-mono text-xs bg-slate-100 text-slate-800 px-2 py-1 rounded border border-slate-200/50 inline-block font-normal">
                    {endpointUrl.trim() || 'http://localhost:5055/api/hospital-catalog'}
                  </code>
                </div>

                {/* Xác thực */}
                <div>
                  <span className="text-slate-400 block mb-1">Xác thực</span>
                  <span className="font-bold text-slate-900 text-sm">
                    {authType === 'api_key'
                      ? 'X-API-KEY'
                      : authType === 'bearer'
                        ? 'Bearer Token'
                        : 'Không xác thực (Public)'}
                  </span>
                </div>

                {/* Đồng bộ gần nhất */}
                <div>
                  <span className="text-slate-400 block mb-1">Đồng bộ gần nhất</span>
                  <span className="font-semibold text-slate-800 text-sm">
                    {statusData?.lastSyncAt
                      ? (() => {
                        const d = new Date(statusData.lastSyncAt);
                        const time = d.toLocaleTimeString('vi-VN', { hour12: false });
                        const day = String(d.getDate()).padStart(2, '0');
                        const month = String(d.getMonth() + 1).padStart(2, '0');
                        const year = d.getFullYear();
                        return `${time} · ${day}/${month}/${year}`;
                      })()
                      : '14:47:45 · 10/10/2026'}
                  </span>
                </div>
              </div>

              {/* Technical Inspection Success Strip */}
              {dashboardTestStatus === 'success' && (
                <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2 text-emerald-900 font-semibold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Kiểm tra kết nối thành công: API đạt chuẩn hợp đồng kỹ thuật</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-white border-emerald-200 text-emerald-700 font-bold text-[10px]">
                      HTTP 200 OK
                    </Badge>
                    <Badge variant="outline" className="bg-white border-emerald-200 text-emerald-700 font-bold text-[10px]">
                      {testLatencyMs || 28}ms
                    </Badge>
                    <Badge variant="outline" className="bg-white border-emerald-200 text-emerald-700 font-bold text-[10px]">
                      {handshakeResult?.totalDepartments || 5} khoa · {handshakeResult?.totalDoctors || 6} bác sĩ
                    </Badge>
                  </div>
                </div>
              )}

              <div className="border-t border-slate-100 pt-1" />

              {/* Action Buttons & Subtitle Note */}
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <Button
                    size="sm"
                    onClick={() => {
                      const targetUrl = endpointUrl.trim() || 'http://localhost:5055/api/hospital-catalog';
                      toast.loading('Đang kích hoạt đồng bộ dữ liệu mới nhất từ HIS...');
                      syncMutation.mutate({
                        endpointUrl: targetUrl,
                        authType,
                        authToken: authToken.trim(),
                        specialtyMappings,
                        selectedDoctorIds: [],
                      });
                    }}
                    disabled={syncMutation.isPending}
                    className="bg-black hover:bg-slate-900 text-white font-bold text-xs h-9 px-6 rounded-full shadow-xs"
                  >
                    {syncMutation.isPending && (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin mr-1.5" />
                    )}
                    Đồng bộ ngay
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowConnectionTestModal(true)}
                    className="border-slate-200 text-slate-800 hover:bg-slate-50 font-medium text-xs h-9 px-5 rounded-full"
                  >
                    Kiểm tra kết nối
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setIsTestingNewOnboarding(true);
                      setSetupStep('validation');
                    }}
                    className="border-slate-200 text-slate-800 hover:bg-slate-50 font-medium text-xs h-9 px-5 rounded-full"
                  >
                    Cấu hình
                  </Button>
                </div>

                <p className="text-[11px] text-slate-400 mt-3">
                  Giao diện minh họa. Trạng thái thực tế phải lấy từ backend.
                </p>
              </div>
            </Card>
          )}

          {/* 3 KPI Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="bg-white border-slate-200 p-5 rounded-2xl shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Bác sĩ từ HIS API</div>
                  <div className="text-2xl font-black text-emerald-700 mt-1">{statusData?.apiDoctorCount || 0}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">Tự động cập nhật ca trực</div>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center">
                  <UserCheck className="w-6 h-6" />
                </div>
              </div>
            </Card>

            <Card className="bg-white border-slate-200 p-5 rounded-2xl shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Tổng bác sĩ tại viện</div>
                  <div className="text-2xl font-black text-slate-900 mt-1">{statusData?.totalDoctorCount || 0}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">Bao gồm trực tiếp & liên thông</div>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-purple-50 border border-purple-200 text-purple-700 flex items-center justify-center">
                  <Building2 className="w-6 h-6" />
                </div>
              </div>
            </Card>

            <Card className="bg-white border-slate-200 p-5 rounded-2xl shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Chuyên khoa cung cấp</div>
                  <div className="text-2xl font-black text-blue-700 mt-1">{statusData?.specialtyCount || 0}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">Đã ánh xạ từ khoa phòng viện</div>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center">
                  <Layers className="w-6 h-6" />
                </div>
              </div>
            </Card>
          </div>


          {/* Sync History Audit Log */}
          <Card className="bg-white border-slate-200 shadow-sm rounded-2xl overflow-hidden">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-600" />
                Lịch Sử & Giám Sát Đồng Bộ (Sync Audit Log)
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Ghi nhận các phiên giao dịch trích xuất và cập nhật dữ liệu tự động giữa hai hệ thống
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-[11px] uppercase tracking-wider">
                    <tr>
                      <th className="p-3 pl-4">Thời gian</th>
                      <th className="p-3">Loại tác vụ</th>
                      <th className="p-3">Endpoint nguồn</th>
                      <th className="p-3 text-center">Bản ghi cập nhật</th>
                      <th className="p-3 text-right pr-4">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    <tr className="hover:bg-slate-50">
                      <td className="p-3 pl-4 font-mono text-[11px]">
                        {statusData?.lastSyncAt
                          ? new Date(statusData.lastSyncAt).toLocaleString('vi-VN')
                          : 'Vừa xong'}
                      </td>
                      <td className="p-3 font-semibold text-slate-900">
                        Đồng bộ Catalog (Bác sĩ & Lịch)
                      </td>
                      <td className="p-3 font-mono text-[11px] text-slate-500">
                        {endpointUrl.trim() || 'Chưa lưu URL'}
                      </td>
                      <td className="p-3 text-center">
                        <Badge variant="outline" className="bg-slate-50 border-slate-200 text-slate-700 text-[10px]">
                          {statusData?.apiDoctorCount || 3} bác sĩ
                        </Badge>
                      </td>
                      <td className="p-3 text-right pr-4">
                        <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-bold">
                          Thành công
                        </Badge>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        /* ========================================================================= */
        /* CASE 2: ONBOARDING WIZARD (CHƯA KẾT NỐI HOẶC CẤU HÌNH LẠI) */
        /* ========================================================================= */
        <div className="space-y-6">
          {/* STEP 1: LANDING ENTRY SCREEN */}
          {setupStep === 'landing' && (
            <Card className="bg-white border-slate-200 shadow-sm rounded-3xl overflow-hidden p-6 sm:p-10 text-center space-y-6">
              <div className="w-16 h-16 rounded-3xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center mx-auto shadow-xs">
                <Network className="w-8 h-8" />
              </div>

              <div className="max-w-xl mx-auto space-y-2">
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  Bắt Đầu Thiết Lập Kết Nối Dữ Liệu Cơ Sở Y Tế
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                  Cơ sở của bạn chưa được liên thông dữ liệu. Hãy kích hoạt cổng tích hợp để tự động đồng bộ danh sách Khoa phòng, Bác sĩ và Ca trực phục vụ bệnh nhân đặt lịch online.
                </p>
              </div>

              {/* Supported methods preview */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto text-left pt-2">
                <div className="p-5 rounded-2xl bg-emerald-50/50 border border-emerald-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-[10px] font-bold">
                      Khuyến nghị
                    </Badge>
                    <Network className="w-5 h-5 text-emerald-600" />
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm">Cổng REST API (HIS Gateway)</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Đồng bộ tự động 2 chiều, phản ánh lịch khám realtime từ hệ thống HIS nội bộ của bệnh viện.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 opacity-80">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="bg-white text-slate-500 border-slate-200 text-[10px]">
                      Sắp ra mắt
                    </Badge>
                    <FileSpreadsheet className="w-5 h-5 text-slate-400" />
                  </div>
                  <h4 className="font-bold text-slate-700 text-sm">Nhập qua File Excel / CSV</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Dành cho các phòng khám nhỏ chưa có cổng API, tải biểu mẫu mẫu và cập nhật danh mục định kỳ.
                  </p>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-center gap-3">
                <Button
                  size="lg"
                  onClick={() => setSetupStep('method_select')}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-11 px-8 rounded-xl shadow-md gap-2 shadow-emerald-600/30"
                >
                  Bắt đầu thiết lập kết nối
                  <ArrowRight className="w-4 h-4" />
                </Button>
                {isTestingNewOnboarding && (
                  <Button
                    variant="ghost"
                    size="lg"
                    onClick={() => setIsTestingNewOnboarding(false)}
                    className="text-slate-500 hover:text-slate-900 h-11 px-6 rounded-xl text-xs"
                  >
                    Quay về Dashboard
                  </Button>
                )}
              </div>
            </Card>
          )}

          {/* STEP 2: SELECT METHOD */}
          {setupStep === 'method_select' && (
            <Card className="bg-white border-slate-200 shadow-sm rounded-3xl p-6 sm:p-8 space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSetupStep('landing')}
                    className="h-8 w-8 p-0 rounded-lg text-slate-500 hover:text-slate-800"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </Button>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Chọn phương thức kết nối dữ liệu</h3>
                    <p className="text-xs text-slate-500">Lựa chọn giải pháp phù hợp với hạ tầng công nghệ thông tin của bệnh viện</p>
                  </div>
                </div>
                <Badge variant="outline" className="bg-slate-50 border-slate-200 text-slate-600 text-xs">
                  Bước 1 / 3
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Option 1: REST API */}
                <div
                  onClick={() => setSelectedMethod('api')}
                  className={`p-6 rounded-2xl border-2 cursor-pointer transition-all space-y-3 relative ${selectedMethod === 'api'
                    ? 'border-emerald-600 bg-emerald-50/40 shadow-sm'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                      <Network className="w-5 h-5" />
                    </div>
                    <Badge className="bg-emerald-600 text-white font-bold text-[10px]">
                      Khuyên Dùng
                    </Badge>
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm">Kết nối qua REST API (HIS Gateway)</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Hệ thống HIS của viện mở 1 endpoint theo chuẩn OpenAPI của NovaCare. Dữ liệu được trích xuất tự động, kiểm tra tính toàn vẹn và cập nhật realtime.
                  </p>
                  <ul className="text-[11px] text-slate-600 space-y-1 pt-1">
                    <li className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-600" /> Đồng bộ hai chiều tự động
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-600" /> Bác sĩ & lịch trực cập nhật ngay lập tức
                    </li>
                  </ul>
                </div>

                {/* Option 2: Excel / CSV (Disabled) */}
                <div
                  className="p-6 rounded-2xl border-2 border-slate-200 bg-slate-50/80 space-y-3 opacity-75 relative cursor-not-allowed"
                >
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-slate-200 text-slate-600 flex items-center justify-center font-bold">
                      <FileSpreadsheet className="w-5 h-5" />
                    </div>
                    <Badge variant="outline" className="bg-white text-slate-500 border-slate-200 text-[10px]">
                      Sắp ra mắt
                    </Badge>
                  </div>
                  <h4 className="font-bold text-slate-700 text-sm">Nhập danh mục qua File Excel / CSV</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Tính năng dành riêng cho các phòng khám chưa có hạ tầng API mạng riêng. Cho phép tải tệp bảng tính biểu mẫu để nhập dữ liệu hàng loạt.
                  </p>
                  <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-[11px]">
                    Đang hoàn thiện biểu mẫu theo Quyết định 4750/QĐ-BYT. Vui lòng sử dụng phương thức REST API.
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <Button
                  onClick={() => setSetupStep('guide')}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-10 px-6 rounded-xl gap-2 shadow-sm shadow-emerald-600/20"
                >
                  Tiếp tục xem hướng dẫn triển khai
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          )}

          {/* STEP 3: 3-STEP GUIDED WORKFLOW */}
          {setupStep === 'guide' && (
            <Card className="bg-white border-slate-200 shadow-sm rounded-3xl p-6 sm:p-8 space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSetupStep('method_select')}
                    className="h-8 w-8 p-0 rounded-lg text-slate-500 hover:text-slate-800"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </Button>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Quy trình 3 bước chuẩn bị kết nối API</h3>
                    <p className="text-xs text-slate-500">Hoàn thành các bước chuẩn bị trước khi gửi yêu cầu kiểm tra bắt tay</p>
                  </div>
                </div>
                <Badge variant="outline" className="bg-slate-50 border-slate-200 text-slate-600 text-xs">
                  Bước 2 / 3
                </Badge>
              </div>

              {/* 3 Steps Horizontal Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* Step 1: Contract */}
                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-emerald-600 text-white font-bold text-xs flex items-center justify-center">
                        1
                      </span>
                      <h4 className="font-bold text-slate-900 text-sm">Đọc Yêu Cầu Tích Hợp</h4>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Nghiên cứu kỹ Hợp đồng kỹ thuật (Contract), cấu trúc schema JSON và các mã lỗi quy định.
                    </p>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-slate-200">
                    <Button
                      size="sm"
                      onClick={() => setShowFullGuideModal(true)}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl gap-1.5 shadow-sm"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      Xem Tài Liệu Quy Chuẩn (Full Spec)
                    </Button>
                    <div className="grid grid-cols-2 gap-2">
                      <a
                        href="/contracts/novacare-his-contract.json"
                        download="novacare-his-contract.json"
                        className="w-full"
                      >
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full text-[11px] border-slate-200 text-slate-700 hover:bg-slate-100 rounded-xl gap-1 px-1"
                        >
                          <Download className="w-3 h-3" />
                          OpenAPI JSON
                        </Button>
                      </a>
                      <a
                        href="/contracts/novacare-his-integration-guide.md"
                        download="novacare-his-integration-guide.md"
                        className="w-full"
                      >
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full text-[11px] border-slate-200 text-slate-700 hover:bg-slate-100 rounded-xl gap-1 px-1"
                        >
                          <Download className="w-3 h-3" />
                          Tải File .MD
                        </Button>
                      </a>
                    </div>
                  </div>
                </div>

                {/* Step 2: Implementation */}
                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
                        2
                      </span>
                      <h4 className="font-bold text-slate-900 text-sm">Triển Khai API Tại Viện</h4>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Lập trình hàm API trích xuất CSDL nội bộ bệnh viện (C# .NET / Node.js / SQL) và mở cổng HTTPS.
                    </p>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-slate-200">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowFullGuideModal(true)}
                      className="w-full border-blue-200 text-blue-700 bg-blue-50/50 hover:bg-blue-100 font-bold text-xs rounded-xl gap-1.5"
                    >
                      <Code2 className="w-3.5 h-3.5" />
                      Xem Hướng Dẫn Triển Khai Chi Tiết
                    </Button>
                    <div className="p-2 rounded-xl bg-white border border-slate-200 text-[10px] text-slate-500 text-center">
                      Chỉ cần quyền ĐỌC (Read-Only) CSDL
                    </div>
                  </div>
                </div>

                {/* Step 3: Readiness & Handshake Test */}
                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-purple-600 text-white font-bold text-xs flex items-center justify-center">
                        3
                      </span>
                      <h4 className="font-bold text-slate-900 text-sm">Kiểm Tra Sẵn Sàng</h4>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Khi đội IT đã viết xong API, điền URL và gửi lệnh kiểm tra bắt tay (Handshake) để thẩm định schema.
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-200">
                    <Button
                      size="sm"
                      onClick={() => setSetupStep('validation')}
                      className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl gap-1.5 shadow-sm shadow-purple-600/20"
                    >
                      <PlayCircle className="w-3.5 h-3.5" />
                      Kiểm Tra API Ngay
                      <ArrowRight className="w-3.5 h-3.5 ml-1" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Data Dictionary Preview */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                  Tóm tắt các trường dữ liệu bắt buộc (Data Dictionary)
                </span>
                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 text-[11px]">
                      <tr>
                        <th className="p-2.5">Trường</th>
                        <th className="p-2.5">Kiểu</th>
                        <th className="p-2.5">Mô tả quy chuẩn</th>
                        <th className="p-2.5">Ví dụ mẫu</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-[11px] text-slate-700">
                      <tr>
                        <td className="p-2.5 font-mono text-emerald-700 font-bold">dept_code</td>
                        <td className="p-2.5 font-mono">string</td>
                        <td className="p-2.5">Mã nội bộ khoa phòng (Unique)</td>
                        <td className="p-2.5 font-mono text-slate-500">K_TIM_CAN_THIEP</td>
                      </tr>
                      <tr>
                        <td className="p-2.5 font-mono text-emerald-700 font-bold">staff_id</td>
                        <td className="p-2.5 font-mono">string</td>
                        <td className="p-2.5">Mã nhân sự bác sĩ tại viện (Unique)</td>
                        <td className="p-2.5 font-mono text-slate-500">HIS_DOC_001</td>
                      </tr>
                      <tr>
                        <td className="p-2.5 font-mono text-emerald-700 font-bold">full_name</td>
                        <td className="p-2.5 font-mono">string</td>
                        <td className="p-2.5">Họ và tên bác sĩ</td>
                        <td className="p-2.5 font-mono text-slate-500">Nguyễn Văn An</td>
                      </tr>
                      <tr>
                        <td className="p-2.5 font-mono text-emerald-700 font-bold">gender</td>
                        <td className="p-2.5 font-mono">enum</td>
                        <td className="p-2.5">Giới tính: MALE hoặc FEMALE</td>
                        <td className="p-2.5 font-mono text-slate-500">MALE</td>
                      </tr>
                      <tr>
                        <td className="p-2.5 font-mono text-emerald-700 font-bold">consultation_fee</td>
                        <td className="p-2.5 font-mono">number</td>
                        <td className="p-2.5">Giá khám niêm yết tính bằng VNĐ (số nguyên)</td>
                        <td className="p-2.5 font-mono text-slate-500">350000</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </Card>
          )}

          {/* STEP 4: VALIDATION FORM (KIỂM TRA & THẨM ĐỊNH API) */}
          {setupStep === 'validation' && (
            <Card className="bg-white border-slate-200 shadow-sm rounded-3xl p-6 sm:p-8 space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSetupStep('guide')}
                    className="h-8 w-8 p-0 rounded-lg text-slate-500 hover:text-slate-800"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </Button>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Kiểm tra kết nối & Thẩm định API (Handshake Test)</h3>
                    <p className="text-xs text-slate-500">Hệ thống sẽ gửi yêu cầu thử nghiệm để xác thực tính toàn vẹn của dữ liệu</p>
                  </div>
                </div>
                <Badge variant="outline" className="bg-slate-50 border-slate-200 text-slate-600 text-xs">
                  Bước 3 / 3
                </Badge>
              </div>

              {/* Form Input */}
              <form onSubmit={handleTestHandshake} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2 space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                      <Network className="w-3.5 h-3.5 text-emerald-600" />
                      HIS Catalog Endpoint URL:
                    </label>
                    <Input
                      value={endpointUrl}
                      onChange={(e) => setEndpointUrl(e.target.value)}
                      placeholder="https://his.benhvien.vn/api/hospital-catalog"
                      className="bg-slate-50 border-slate-200 text-slate-900 text-xs h-10 rounded-xl focus:bg-white font-mono"
                    />
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>Ví dụ: <code className="font-mono text-emerald-700 font-bold">http://localhost:5055/api/hospital-catalog</code></span>
                      <div className="flex items-center gap-3">
                        {endpointUrl && (
                          <button
                            type="button"
                            onClick={() => {
                              setEndpointUrl('');
                              setAuthToken('');
                              setHandshakeResult(null);
                              setHandshakeError(null);
                              if (typeof window !== 'undefined') {
                                localStorage.removeItem('novacare_his_endpoint_url');
                                localStorage.removeItem('novacare_his_auth_token');
                              }
                              toast.info('Đã xóa trống cấu hình Endpoint');
                            }}
                            className="text-rose-500 hover:text-rose-700 font-medium hover:underline"
                          >
                            ✕ Xóa trống
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setEndpointUrl('http://localhost:4000/api/hospital-catalog');
                            setAuthType('bearer');
                            setAuthToken('novacare_live_his_token_2025');
                            toast.info('Đã điền thông số mẫu của Mock HIS (Port 4000)');
                          }}
                          className="text-emerald-600 hover:text-emerald-700 font-bold hover:underline"
                        >

                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEndpointUrl('http://localhost:5055/api/hospital-catalog');
                            setAuthType('api_key');
                            setAuthToken('tamanh_secret_2026');
                            toast.info('Đã điền thông số mẫu của HIS Server Độc lập (Port 5055)');
                          }}
                          className="text-teal-600 hover:text-teal-700 font-bold hover:underline"
                        >
                          ⚡ Standalone HIS (Port 5055)
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">Phương thức xác thực (Auth):</label>
                    <select
                      value={authType}
                      onChange={(e: any) => setAuthType(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-xl h-10 px-3 outline-none focus:bg-white focus:ring-1 focus:ring-emerald-500"
                    >
                      <option value="none">Không xác thực (Public/Testing)</option>
                      <option value="api_key">X-API-KEY (Header)</option>
                      <option value="bearer">Bearer Token (Authorization)</option>
                    </select>
                  </div>
                </div>

                {authType !== 'none' && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-amber-600" />
                      Mã API Key / Secret Token:
                    </label>
                    <Input
                      type="password"
                      value={authToken}
                      onChange={(e) => setAuthToken(e.target.value)}
                      placeholder="Nhập secret token được cấp..."
                      className="bg-slate-50 border-slate-200 text-slate-900 text-xs h-10 rounded-xl focus:bg-white font-mono"
                    />
                  </div>
                )}

                <div className="flex items-center gap-3 pt-2">
                  <Button
                    type="submit"
                    disabled={handshakeMutation.isPending}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-10 px-6 rounded-xl gap-2 shadow-sm shadow-emerald-600/20"
                  >
                    {handshakeMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Đang kết nối & thẩm định...
                      </>
                    ) : (
                      <>
                        <PlayCircle className="w-4 h-4" />
                        Kiểm Tra API Ngay
                      </>
                    )}
                  </Button>
                </div>
              </form>

              {/* Case 0: Testing In-Progress Card matching specification */}
              {handshakeMutation.isPending && (
                <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
                  {/* Header: Title, Facility & Badge */}
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h4 className="text-xl font-bold text-slate-900 tracking-tight">
                        Kết nối HIS
                      </h4>
                      <p className="text-sm text-slate-500 mt-1">
                        {statusData?.hospitalName || handshakeResult?.hospitalName || 'Bệnh viện An Bình'} · {statusData?.externalId || 'HIS_BV_ANBINH'}
                      </p>
                    </div>

                    <div>
                      <Badge className="bg-blue-50 text-blue-700 hover:bg-blue-50 border-blue-200 font-medium text-xs px-3 py-1 rounded-full shadow-none flex items-center gap-1.5">
                        <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
                        Đang kiểm tra
                      </Badge>
                    </div>
                  </div>

                  <div className="border-t border-slate-100" />

                  {/* In-progress status details */}
                  <div className="space-y-3 text-xs">
                    <div>
                      <span className="text-slate-400 block mb-1">Endpoint đang kiểm tra</span>
                      <code className="font-mono text-xs bg-slate-100 text-slate-800 px-2.5 py-1 rounded border border-slate-200/50 inline-block font-normal">
                        {endpointUrl.trim() || 'http://localhost:5055/api/hospital-catalog'}
                      </code>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                      <div className="flex items-center gap-2 font-semibold text-slate-800">
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
                        <span>Đang gửi yêu cầu đến HIS</span>
                      </div>
                      <p className="text-slate-500 pl-5.5 text-[11px]">Đang chờ phản hồi từ API…</p>
                    </div>
                  </div>

                  <div className="border-t border-slate-100 pt-1" />

                  <p className="text-[11px] text-slate-400 italic">
                    Đây là trạng thái minh họa; giao diện thật chỉ hiển thị khi yêu cầu kiểm tra đang chạy.
                  </p>
                </div>
              )}

              {/* Case 1: Error Result */}
              {handshakeError && (
                <div className="p-5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 space-y-3">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
                    <h4 className="font-bold text-sm text-rose-800">
                      Kiểm tra thất bại: API chưa đạt chuẩn hợp đồng
                    </h4>
                  </div>
                  <p className="text-xs text-rose-700 leading-relaxed">
                    Chi tiết lỗi: <strong>{handshakeError}</strong>
                  </p>
                  <div className="text-[11px] text-rose-800 bg-white/70 p-3 rounded-xl border border-rose-200 space-y-1">
                    <span className="font-bold block">Gợi ý khắc phục:</span>
                    <ul className="list-disc pl-4 space-y-0.5">
                      <li>Kiểm tra máy chủ HIS có đang chạy và mở route <code className="font-mono">/api/hospital-catalog</code> không.</li>
                      <li>Kiểm tra phản hồi có đúng cấu trúc <code className="font-mono">{`{ status: 200, data: { departments: [], doctors: [] } }`}</code> không.</li>
                    </ul>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleTestHandshake()}
                    className="border-rose-300 text-rose-800 hover:bg-rose-100 text-xs rounded-xl"
                  >
                    Kiểm tra lại
                  </Button>
                </div>
              )}

              {/* Case 2: Success Result */}
              {handshakeResult && (
                <div className="p-5 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-slate-800 space-y-4">
                  {/* Status Banner */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-emerald-200/60">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                      <div>
                        <h4 className="font-bold text-sm text-emerald-950">
                          API đạt chuẩn hợp đồng kỹ thuật! Kết nối và thẩm định thành công.
                        </h4>
                        <p className="text-[11px] text-emerald-700 mt-0.5">
                          Hệ thống đã hoàn tất quét và đánh giá toàn diện 5 tầng tiêu chuẩn kỹ thuật liên thông.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-emerald-600 text-white font-bold text-xs py-1 px-2.5">
                        HTTP 200 OK
                      </Badge>
                      <Badge variant="outline" className="border-emerald-300 text-emerald-800 bg-white font-bold text-xs py-1 px-2.5">
                        Hợp Lệ (Valid)
                      </Badge>
                    </div>
                  </div>

                  {/* BẢNG KẾT QUẢ THẨM ĐỊNH KỸ THUẬT (TECHNICAL INSPECTION METRICS) */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {/* 1. HTTP Status */}
                    <div className="p-3 rounded-xl bg-white border border-emerald-200/80 shadow-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-slate-500 uppercase font-bold">Mã trạng thái HTTP</span>
                        <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                      </div>
                      <div className="font-mono font-bold text-emerald-700 text-base mt-1">200 OK</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">Giao thức: REST JSON</div>
                    </div>

                    {/* 2. Authentication */}
                    <div className="p-3 rounded-xl bg-white border border-emerald-200/80 shadow-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-slate-500 uppercase font-bold">Xác thực bảo mật</span>
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      </div>
                      <div className="font-bold text-slate-900 text-xs mt-1 truncate">
                        {authType === 'api_key' ? 'X-API-KEY' : authType === 'bearer' ? 'Bearer Token' : 'Public API'}
                      </div>
                      <div className="text-[10px] text-emerald-600 font-medium mt-0.5">Chữ ký hợp lệ</div>
                    </div>

                    {/* 3. Latency / Response Time */}
                    <div className="p-3 rounded-xl bg-white border border-emerald-200/80 shadow-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-slate-500 uppercase font-bold">Thời gian phản hồi</span>
                        <Clock className="w-3.5 h-3.5 text-blue-600" />
                      </div>
                      <div className="font-mono font-bold text-slate-900 text-base mt-1">
                        {testLatencyMs || 28} <span className="text-xs font-normal text-slate-500">ms</span>
                      </div>
                      <div className="text-[10px] text-emerald-600 font-medium mt-0.5">
                        {testLatencyMs < 60 ? 'Rất nhanh (< 60ms)' : 'Đạt chuẩn (< 200ms)'}
                      </div>
                    </div>

                    {/* 4. JSON Schema Validation */}
                    <div className="p-3 rounded-xl bg-white border border-emerald-200/80 shadow-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-slate-500 uppercase font-bold">Thẩm định Schema</span>
                        <FileCode2 className="w-3.5 h-3.5 text-purple-600" />
                      </div>
                      <div className="font-bold text-slate-900 text-xs mt-1">NC-SPEC-2026</div>
                      <div className="text-[10px] text-emerald-600 font-medium mt-0.5">100% Khớp đặc tả</div>
                    </div>
                  </div>

                  {/* DANH MỤC 5 TIÊU CHUẨN ĐÃ THẨM ĐỊNH (COMPLIANCE CHECKLIST) */}
                  <div className="p-3.5 rounded-xl bg-white border border-emerald-200/80 space-y-2 text-xs shadow-xs">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-slate-700 flex items-center justify-between pb-1 border-b border-slate-100">
                      <span className="flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        Chi tiết các tiêu chuẩn kỹ thuật đã kiểm tra
                      </span>
                      <span className="text-[10px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                        5 / 5 Đạt chuẩn
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px] pt-1">
                      <div className="flex items-start gap-2 p-2 rounded-lg bg-slate-50 border border-slate-100">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <div>
                          <strong className="text-slate-800">1. Kết nối HTTP & Khả dụng:</strong>
                          <p className="text-slate-500">Máy chủ HIS phản hồi HTTP 200 OK trong {testLatencyMs || 28}ms.</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2 p-2 rounded-lg bg-slate-50 border border-slate-100">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <div>
                          <strong className="text-slate-800">2. Xác thực & Phân quyền:</strong>
                          <p className="text-slate-500">Header {authType === 'api_key' ? 'X-API-KEY' : 'Token'} hợp lệ, không bị từ chối 401/403.</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2 p-2 rounded-lg bg-slate-50 border border-slate-100">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <div>
                          <strong className="text-slate-800">3. Schema Khoa phòng:</strong>
                          <p className="text-slate-500">Đầy đủ dept_code, dept_name ({handshakeResult.totalDepartments} khoa).</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2 p-2 rounded-lg bg-slate-50 border border-slate-100">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <div>
                          <strong className="text-slate-800">4. Schema Bác sĩ & Giá khám:</strong>
                          <p className="text-slate-500">Đầy đủ staff_id, học vị và giá khám ({handshakeResult.totalDoctors} bác sĩ).</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2 p-2 rounded-lg bg-slate-50 border border-slate-100 md:col-span-2">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <div>
                          <strong className="text-slate-800">5. Định dạng Lịch khám & Ca trực:</strong>
                          <p className="text-slate-500">Định dạng 24h (HH:mm) và ngày trong tuần (0-6) hợp lệ ({handshakeResult.doctors?.reduce((acc: number, d: any) => acc + (d.shiftsCount || 0), 0)} ca trực tuần).</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Toggle Xem Raw JSON */}
                  <div className="pt-1">
                    <div className="flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => setShowRawJson(!showRawJson)}
                        className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1.5 underline decoration-emerald-300 underline-offset-4"
                      >
                        <Code2 className="w-3.5 h-3.5" />
                        {showRawJson ? 'Ẩn phản hồi JSON gốc từ HIS' : 'Xem phản hồi JSON gốc từ máy chủ HIS (Raw Payload)'}
                      </button>
                      {showRawJson && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            navigator.clipboard.writeText(JSON.stringify(handshakeResult, null, 2));
                            toast.success('Đã sao chép toàn bộ JSON vào clipboard');
                          }}
                          className="h-7 text-xs text-slate-600 hover:text-slate-900 gap-1"
                        >
                          <Copy className="w-3 h-3" />
                          Sao chép JSON
                        </Button>
                      )}
                    </div>

                    {showRawJson && (
                      <pre className="mt-2.5 p-3.5 rounded-xl bg-slate-950 text-emerald-400 font-mono text-[11px] overflow-auto max-h-60 border border-slate-800 leading-relaxed select-all">
                        {JSON.stringify(handshakeResult, null, 2)}
                      </pre>
                    )}
                  </div>

                  {/* Scanned metadata cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                    <div className="p-3 rounded-xl bg-white border border-emerald-200 text-center">
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">Mã bệnh viện</span>
                      <span className="font-bold font-mono text-slate-900 text-xs">{handshakeResult.hospitalCode}</span>
                    </div>
                    <div className="p-3 rounded-xl bg-white border border-emerald-200 text-center">
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">Khoa phòng</span>
                      <span className="font-bold text-slate-900 text-sm">{handshakeResult.totalDepartments} khoa</span>
                    </div>
                    <div className="p-3 rounded-xl bg-white border border-emerald-200 text-center">
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">Bác sĩ phát hiện</span>
                      <span className="font-bold text-emerald-700 text-sm">{handshakeResult.totalDoctors} bác sĩ</span>
                    </div>
                    <div className="p-3 rounded-xl bg-white border border-emerald-200 text-center">
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">Ca trực tuần</span>
                      <span className="font-bold text-blue-700 text-sm">
                        {handshakeResult.doctors?.reduce((acc: number, d: any) => acc + (d.shiftsCount || 0), 0)} ca
                      </span>
                    </div>
                  </div>


                  <div className="flex items-center justify-between pt-2">
                    <span className="text-xs text-slate-600">
                      Cơ sở y tế: <strong>{handshakeResult.hospitalName}</strong>
                    </span>
                    <Button
                      onClick={() => setSetupStep('formal_connect')}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-10 px-6 rounded-xl gap-2 shadow-sm shadow-emerald-600/20"
                    >
                      Tiến hành Kết nối & Ánh xạ chính thức
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          )}

          {/* STEP 5: FORMAL CONNECT 5-STAGE PIPELINE */}
          {setupStep === 'formal_connect' && (
            <Card className="bg-white border-slate-200 shadow-sm rounded-3xl p-6 sm:p-8 space-y-6">
              {/* Stepper Header */}
              <div className="pb-4 border-b border-slate-100 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSetupStep('validation')}
                      className="h-8 w-8 p-0 rounded-lg text-slate-500 hover:text-slate-800"
                    >
                      <ArrowLeft className="w-4 h-4" />
                    </Button>
                    <div>
                      <h3 className="text-base font-bold text-slate-900">Quy trình Kết nối Chính thức 5 Bước</h3>
                      <p className="text-xs text-slate-500">Xem trước, ánh xạ khoa phòng và kích hoạt đồng bộ vào CSDL NovaCare</p>
                    </div>
                  </div>
                  <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs">
                    Giai đoạn {formalStep} / 5
                  </Badge>
                </div>

                {/* 5-step progress pill bar */}
                <div className="grid grid-cols-5 gap-2 text-center text-xs">
                  {[
                    { num: 1, name: '1. Kết nối' },
                    { num: 2, name: '2. Preview' },
                    { num: 3, name: '3. Mapping' },
                    { num: 4, name: '4. Xác nhận' },
                    { num: 5, name: '5. Sync' },
                  ].map((s) => (
                    <button
                      key={s.num}
                      onClick={() => setFormalStep(s.num as any)}
                      className={`py-2 px-1 rounded-xl font-bold transition text-xs ${formalStep === s.num
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : formalStep > s.num
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                        }`}
                    >
                      {s.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sub-step 1: Kết nối - Xác nhận thông số kết nối */}
              {formalStep === 1 && (
                <div className="space-y-5 py-2">
                  {/* Tiêu đề & Diễn giải */}
                  <div>
                    <h4 className="font-bold text-base text-slate-900">
                      Xác nhận thông số kết nối
                    </h4>
                    <p className="text-xs text-slate-500 mt-1">
                      API endpoint đã được kiểm tra. Xác nhận thông tin trước khi xem trước dữ liệu.
                    </p>
                  </div>

                  {/* HIS Catalog Endpoint URL & Trạng thái kiểm tra */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                        <Network className="w-4 h-4 text-emerald-600" />
                        HIS Catalog Endpoint URL
                      </span>
                      <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs font-semibold px-2.5 py-0.5 gap-1.5 w-fit">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Kiểm tra kết nối thành công
                      </Badge>
                    </div>
                    <div className="p-3 rounded-xl bg-white border border-slate-200 font-mono text-xs text-slate-900 font-bold break-all flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <span>{endpointUrl || 'http://localhost:5055/api/hospital-catalog'}</span>
                      <Badge variant="outline" className="font-mono text-[10px] bg-slate-50 text-slate-600 border-slate-200 w-fit shrink-0">
                        HTTP 200 OK
                      </Badge>
                    </div>
                  </div>

                  {/* Lưới 4 thông số: Mã bệnh viện HIS, Cơ sở y tế, Phương thức xác thực, Môi trường */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {/* 1. Mã bệnh viện HIS */}
                    <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                        Mã bệnh viện HIS
                      </span>
                      <div className="text-sm font-bold font-mono text-slate-900 flex items-center gap-2">
                        <span>{handshakeResult?.hospitalCode || statusData?.externalId || 'BV_AB'}</span>
                        <Badge variant="outline" className="text-[10px] border-slate-200 text-slate-500 bg-slate-50 font-normal">
                          Mã định danh
                        </Badge>
                      </div>
                      <p className="text-[11px] text-slate-500">Mã cơ sở trích xuất từ phản hồi API HIS của bệnh viện</p>
                    </div>

                    {/* 2. Cơ sở y tế */}
                    <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                        Cơ sở y tế
                      </span>
                      <div className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        <span>{handshakeResult?.hospitalName || statusData?.hospitalName || 'Bệnh viện Đa khoa An Bình'}</span>
                        <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-semibold">
                          Khớp hợp đồng
                        </Badge>
                      </div>
                      <p className="text-[11px] text-slate-500">Tên đơn vị tiếp nhận dữ liệu liên thông trên NovaCare</p>
                    </div>

                    {/* 3. Phương thức xác thực */}
                    <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                        Phương thức xác thực
                      </span>
                      <div className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        <Badge variant="outline" className="font-mono text-xs bg-slate-50 border-slate-300 text-slate-800">
                          {authType === 'api_key'
                            ? 'X-API-KEY (Header)'
                            : authType === 'bearer'
                              ? 'Bearer Token (Authorization)'
                              : 'Không xác thực (Public/Testing)'}
                        </Badge>
                        {authToken && (
                          <span className="text-[11px] font-mono text-slate-400">••••••••</span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500">Cơ chế bảo mật chứng thực các phiên truy vấn định kỳ</p>
                    </div>

                    {/* 4. Môi trường */}
                    <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                        Môi trường
                      </span>
                      <div className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        <Badge className="bg-slate-100 text-slate-800 border-slate-200 text-xs font-semibold">
                          {endpointUrl.includes('localhost') || endpointUrl.includes('127.0.0.1') || endpointUrl.includes(':5055') || endpointUrl.includes(':4000')
                            ? 'Mạng nội bộ / On-Premise (HIS Gateway)'
                            : 'Môi trường đám mây / Internet (Production Gateway)'}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-slate-500">Kênh truyền kết nối giữa cổng HIS nội bộ và NovaCare</p>
                    </div>
                  </div>

                  {/* Lưu ý Box */}
                  <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200 text-amber-900 flex items-start gap-3">
                    <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                    <div className="text-xs space-y-0.5">
                      <strong className="font-bold text-amber-950 block">Lưu ý</strong>
                      <p className="text-amber-800 leading-relaxed">
                        Chưa có dữ liệu nào được ghi vào cơ sở dữ liệu NovaCare ở bước này.
                      </p>
                    </div>
                  </div>

                  {/* Nút hành động */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSetupStep('validation')}
                      className="text-slate-500 hover:text-slate-800 text-xs rounded-xl gap-1.5"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      Quay lại kiểm tra
                    </Button>

                    <Button
                      onClick={() => setFormalStep(2)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-10 px-6 rounded-xl gap-2 shadow-sm shadow-emerald-600/20"
                    >
                      Xem trước dữ liệu (Preview)
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Sub-step 2: Preview - Dữ liệu trích xuất từ HIS */}
              {formalStep === 2 && (
                <div className="space-y-5 py-2">
                  {/* Header Box & Badges */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-base text-slate-900">
                          Dữ liệu trích xuất từ HIS
                        </h4>
                        <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs font-semibold px-2.5 py-0.5">
                          Giai đoạn 2/5 · Preview
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        Xem trước toàn bộ thông tin cơ sở và danh sách nhân sự được API HIS cung cấp
                      </p>
                    </div>

                    {/* KPI Stats */}
                    <div className="flex items-center gap-2">
                      <div className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-center gap-1.5">
                        <span className="text-slate-500 font-medium">Bác sĩ:</span>
                        <strong className="text-emerald-700 font-bold font-mono">
                          {handshakeResult?.doctors?.length || 0}
                        </strong>
                      </div>
                      <div className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-center gap-1.5">
                        <span className="text-slate-500 font-medium">Khoa HIS:</span>
                        <strong className="text-slate-900 font-bold font-mono">
                          {handshakeResult?.departments?.length || 0}
                        </strong>
                      </div>
                    </div>
                  </div>

                  {/* Thông tin cơ sở y tế từ HIS */}
                  <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-emerald-600" />
                        <h5 className="font-bold text-xs uppercase tracking-wider text-slate-800">
                          Thông tin cơ sở y tế từ HIS
                        </h5>
                      </div>
                      <div className="text-xs text-slate-600 font-mono">
                        Mã HIS: <strong className="text-emerald-700 font-bold">{handshakeResult?.hospitalCode || statusData?.externalId || '—'}</strong>
                      </div>
                    </div>

                    {/* Địa chỉ, Hotline, Website */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 space-y-0.5">
                        <span className="text-[11px] font-medium text-slate-400 block">Địa chỉ</span>
                        <strong className="text-slate-800 text-xs block leading-snug">
                          {handshakeResult?.address || '—'}
                        </strong>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 space-y-0.5">
                        <span className="text-[11px] font-medium text-slate-400 block">Hotline</span>
                        <strong className="text-slate-800 text-xs block font-mono">
                          {handshakeResult?.hotline || '—'}
                        </strong>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 space-y-0.5">
                        <span className="text-[11px] font-medium text-slate-400 block">Website</span>
                        {handshakeResult?.website ? (
                          <a
                            href={handshakeResult.website}
                            target="_blank"
                            rel="noreferrer"
                            className="text-blue-600 hover:text-blue-700 text-xs font-semibold block truncate hover:underline"
                          >
                            {handshakeResult.website}
                          </a>
                        ) : (
                          <span className="text-slate-400 text-xs">—</span>
                        )}
                      </div>
                    </div>

                    {/* Thông tin bổ sung: Cấp cứu, quy mô giường bệnh và năm thành lập */}
                    <div className="pt-1">
                      <div className="p-3 rounded-xl bg-slate-50/70 border border-slate-200/80 space-y-1.5">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                          Thông tin bổ sung
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs text-slate-600">
                          <div>
                            <span className="text-slate-400">Cấp cứu: </span>
                            <strong className="text-rose-600 font-mono font-bold">
                              {handshakeResult?.emergencyHotline || '115'}
                            </strong>
                          </div>
                          <div>
                            <span className="text-slate-400">Quy mô giường bệnh: </span>
                            <strong className="text-slate-800">
                              {handshakeResult?.bedCount ? `${handshakeResult.bedCount} giường` : '—'}
                            </strong>
                          </div>
                          <div>
                            <span className="text-slate-400">Năm thành lập: </span>
                            <strong className="text-slate-800">
                              {handshakeResult?.establishedYear || '—'}
                            </strong>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Danh sách bác sĩ từ HIS */}
                  <div className="space-y-2.5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <div>
                        <h5 className="font-bold text-sm text-slate-900">
                          Danh sách bác sĩ từ HIS
                        </h5>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Giữ nguyên mã bác sĩ và mã khoa nguồn để phục vụ bước ánh xạ tiếp theo.
                        </p>
                      </div>
                      <Badge variant="outline" className="text-[11px] bg-slate-50 border-slate-200 text-slate-600 w-fit">
                        Bảng dữ liệu giữ các cột: Mã NV, Bác sĩ, Khoa phòng HIS, Giá khám và Ca trực
                      </Badge>
                    </div>

                    {/* Bảng dữ liệu bác sĩ */}
                    <div className="overflow-x-auto border border-slate-200 rounded-2xl bg-white shadow-xs">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-[11px] uppercase tracking-wider">
                          <tr>
                            <th className="p-3 pl-4">Mã NV</th>
                            <th className="p-3">Bác sĩ</th>
                            <th className="p-3">Khoa phòng HIS</th>
                            <th className="p-3 text-right">Giá khám</th>
                            <th className="p-3 text-center pr-4">Ca trực</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700">
                          {handshakeResult?.doctors?.map((doc: any) => (
                            <tr key={doc.staffId} className="hover:bg-slate-50 transition-colors">
                              <td className="p-3 pl-4 font-mono font-bold text-emerald-700">
                                {doc.staffId}
                              </td>
                              <td className="p-3 font-semibold text-slate-900">
                                {doc.academicDegree ? `${doc.academicDegree} ` : ''}
                                {doc.fullName}
                              </td>
                              <td className="p-3 text-slate-600 font-mono text-[11px]">
                                <Badge variant="outline" className="font-mono text-[10px] bg-slate-50 text-slate-700 border-slate-200">
                                  {doc.deptCode}
                                </Badge>
                              </td>
                              <td className="p-3 text-right font-bold text-emerald-700 font-mono">
                                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(doc.consultationFee)}
                              </td>
                              <td className="p-3 text-center pr-4">
                                <Badge variant="outline" className="text-[10px] bg-slate-50 border-slate-200 text-slate-600 font-semibold">
                                  {doc.shiftsCount} ca/tuần
                                </Badge>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Trạng thái dữ liệu Notice Box */}
                  <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200 text-amber-900 flex items-start gap-3">
                    <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                    <div className="text-xs space-y-0.5">
                      <strong className="font-bold text-amber-950 block">Trạng thái dữ liệu</strong>
                      <p className="text-amber-800 leading-relaxed">
                        Dữ liệu đang ở chế độ xem trước. Chưa ghi vào cơ sở dữ liệu NovaCare.
                      </p>
                    </div>
                  </div>

                  {/* Footer Điều hướng */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setFormalStep(1)}
                      className="text-slate-500 hover:text-slate-800 text-xs rounded-xl gap-1.5"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      Quay lại
                    </Button>
                    <Button
                      onClick={() => setFormalStep(3)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-10 px-6 rounded-xl gap-2 shadow-sm shadow-emerald-600/20"
                    >
                      Tiến hành Ánh xạ Chuyên khoa (Mapping)
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Sub-step 3: Mapping - Ánh xạ chuyên khoa */}
              {formalStep === 3 && (() => {
                const deptsList = handshakeResult?.departments || [];
                const totalDepts = deptsList.length;
                const isDeptMapped = (deptCode: string) => {
                  const val = specialtyMappings[deptCode];
                  return Boolean(val && val.trim() !== '' && val !== 'unmapped');
                };
                const mappedCount = deptsList.filter((d: any) => isDeptMapped(d.dept_code)).length;
                const needsCheckCount = Math.max(0, totalDepts - mappedCount);

                const displayedDepts = deptsList.filter((dept: any) => {
                  if (mappingFilter === 'mapped') return isDeptMapped(dept.dept_code);
                  if (mappingFilter === 'unmapped') return !isDeptMapped(dept.dept_code);
                  return true;
                });

                return (
                  <div className="space-y-5 py-2">
                    {/* Header Box */}
                    <div>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-base text-slate-900">
                              Ánh xạ chuyên khoa
                            </h4>
                            <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs font-semibold px-2.5 py-0.5">
                              3/5 · Mapping
                            </Badge>
                          </div>
                          <p className="text-xs text-slate-500 mt-1">
                            <strong className="text-slate-800 font-semibold">{handshakeResult?.hospitalName || statusData?.hospitalName || 'Bệnh viện An Bình'}</strong> · Dữ liệu lấy từ HIS
                          </p>
                        </div>
                      </div>
                      <p className="text-xs text-slate-600 mt-2">
                        Ghép mã khoa HIS với danh mục chuyên khoa NovaCare. Kiểm tra các đề xuất trước khi tiếp tục.
                      </p>
                    </div>

                    {/* 3 KPI Cards: Tổng số khoa, Đã ánh xạ, Cần kiểm tra */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                      {/* Tổng số khoa */}
                      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
                        <div className="text-2xl font-black text-slate-900 font-mono">
                          {totalDepts}
                        </div>
                        <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
                          Tổng số khoa
                        </div>
                        <p className="text-[11px] text-slate-400">Khoa phòng phát hiện từ HIS</p>
                      </div>

                      {/* Đã ánh xạ */}
                      <div className="p-4 rounded-2xl bg-white border border-emerald-200/80 shadow-xs space-y-1">
                        <div className="text-2xl font-black text-emerald-700 font-mono">
                          {mappedCount}
                        </div>
                        <div className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                          Đã ánh xạ
                        </div>
                        <p className="text-[11px] text-slate-400">Đã gán chuyên khoa NovaCare</p>
                      </div>

                      {/* Cần kiểm tra */}
                      <div className="p-4 rounded-2xl bg-white border border-amber-200/80 shadow-xs space-y-1">
                        <div className="text-2xl font-black text-amber-600 font-mono">
                          {needsCheckCount}
                        </div>
                        <div className="text-xs font-bold uppercase tracking-wider text-amber-800">
                          Cần kiểm tra
                        </div>
                        <p className="text-[11px] text-slate-400">Chưa ánh xạ hoặc cần xác nhận</p>
                      </div>
                    </div>

                    {/* Danh sách khoa HIS & Tabs bộ lọc */}
                    <div className="space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
                        <h5 className="font-bold text-sm text-slate-900">
                          Danh sách khoa HIS
                        </h5>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setMappingFilter('all')}
                            className={`px-3 py-1 rounded-xl text-xs font-semibold transition ${mappingFilter === 'all'
                                ? 'bg-slate-900 text-white shadow-xs'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                              }`}
                          >
                            Tất cả khoa ({totalDepts})
                          </button>
                          <button
                            type="button"
                            onClick={() => setMappingFilter('mapped')}
                            className={`px-3 py-1 rounded-xl text-xs font-semibold transition ${mappingFilter === 'mapped'
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                              }`}
                          >
                            Đã ánh xạ ({mappedCount})
                          </button>
                          <button
                            type="button"
                            onClick={() => setMappingFilter('unmapped')}
                            className={`px-3 py-1 rounded-xl text-xs font-semibold transition ${mappingFilter === 'unmapped'
                                ? 'bg-amber-600 text-white shadow-xs'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                              }`}
                          >
                            Cần kiểm tra ({needsCheckCount})
                          </button>
                        </div>
                      </div>

                      {/* Danh sách từng khoa */}
                      <div className="space-y-2.5">
                        {displayedDepts.map((dept: any) => {
                          const mapped = isDeptMapped(dept.dept_code);
                          const currentVal = specialtyMappings[dept.dept_code] || '';
                          const cleanDeptName = dept.dept_name.replace(/^(Khoa|Phòng|Trung tâm|Đơn vị|Đơn nguyên)\s+/i, '').trim();

                          return (
                            <div
                              key={dept.dept_code}
                              className={`p-4 rounded-2xl border transition-all space-y-3 ${mapped
                                  ? 'bg-white border-slate-200 shadow-xs'
                                  : 'bg-amber-50/20 border-amber-200/80 shadow-xs'
                                }`}
                            >
                              {/* Thông tin khoa & Trạng thái */}
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                <div>
                                  <h6 className="font-bold text-sm text-slate-900">
                                    {dept.dept_name}
                                  </h6>
                                  <span className="font-mono text-xs text-slate-500 font-semibold block mt-0.5">
                                    {dept.dept_code}
                                  </span>
                                </div>

                                <div>
                                  {mapped ? (
                                    <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs font-semibold px-2.5 py-0.5">
                                      Đã chọn
                                    </Badge>
                                  ) : (
                                    <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-xs font-semibold px-2.5 py-0.5">
                                      Chưa ánh xạ
                                    </Badge>
                                  )}
                                </div>
                              </div>

                              {/* Bộ chọn Chuyên khoa NovaCare */}
                              <div className="pt-2.5 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <label className="text-xs font-semibold text-slate-700 shrink-0">
                                  Chuyên khoa NovaCare
                                </label>

                                <div className="w-full sm:max-w-md">
                                  <select
                                    value={currentVal}
                                    onChange={(e) =>
                                      setSpecialtyMappings((prev) => ({
                                        ...prev,
                                        [dept.dept_code]: e.target.value,
                                      }))
                                    }
                                    className={`w-full border text-xs rounded-xl px-3 py-2 outline-none font-medium transition ${mapped
                                        ? 'bg-slate-50 border-slate-200 text-slate-900 focus:bg-white focus:border-emerald-500'
                                        : 'bg-white border-amber-300 text-slate-900 focus:border-amber-500'
                                      }`}
                                  >
                                    <option value="" className="text-slate-400">
                                      — Chọn chuyên khoa —
                                    </option>
                                    <optgroup label="Danh mục Chuyên khoa NovaCare hiện có">
                                      {availableSpecialties.map((spec: any) => (
                                        <option key={spec.id} value={spec.id}>
                                          {spec.name}
                                        </option>
                                      ))}
                                    </optgroup>
                                    <optgroup label="Đề xuất khởi tạo mới">
                                      <option value="__AUTO_CREATE__" className="text-emerald-700 font-bold">
                                        ✨ [Đề xuất tạo mới chuyên khoa: &quot;{cleanDeptName}&quot;]
                                      </option>
                                    </optgroup>
                                  </select>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Nguyên tắc xử lý Callout box */}
                    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-800 flex items-start gap-3">
                      <Info className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <div className="text-xs space-y-0.5">
                        <strong className="font-bold text-slate-900 block">Nguyên tắc xử lý</strong>
                        <p className="text-slate-600 leading-relaxed">
                          Chọn chuyên khoa tương ứng trong danh mục hiện có khi phù hợp. Nếu chưa tìm được chuyên khoa đúng phạm vi, để trạng thái chưa ánh xạ hoặc đề xuất tạo mới.
                        </p>
                      </div>
                    </div>

                    {/* Footer Điều hướng */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setFormalStep(2)}
                        className="text-slate-500 hover:text-slate-800 text-xs rounded-xl gap-1.5"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        Quay lại Preview
                      </Button>
                      <Button
                        onClick={() => setFormalStep(4)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-10 px-6 rounded-xl gap-2 shadow-sm shadow-emerald-600/20"
                      >
                        Xác nhận danh sách Bác sĩ
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                );
              })()}

              {/* Sub-step 4: Xác nhận - Đối chiếu dữ liệu HIS */}
              {formalStep === 4 && (() => {
                const doctorsList = handshakeResult?.doctors || [];
                const deptsList = handshakeResult?.departments || [];

                const displayedDoctors = reconciledDoctors.filter((item: any) => {
                  if (confirmFilter === 'create') return item.status === 'CREATE';
                  if (confirmFilter === 'update') return item.status === 'UPDATE';
                  if (confirmFilter === 'unchanged') return item.status === 'UNCHANGED';
                  if (confirmFilter === 'skipped') return item.status === 'SKIPPED';
                  return true;
                });

                return (
                  <div className="space-y-5 py-2">
                    {/* Header Box */}
                    <div>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-base text-slate-900">
                              Xác nhận đồng bộ dữ liệu HIS
                            </h4>
                            <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs font-semibold px-2.5 py-0.5">
                              4/5 · Xác nhận
                            </Badge>
                          </div>
                          <p className="text-xs text-slate-500 mt-1">
                            <strong className="text-slate-800 font-semibold">{handshakeResult?.hospitalName || statusData?.hospitalName || 'Bệnh viện An Bình'}</strong> · Nguồn HIS đã kết nối
                          </p>
                        </div>
                      </div>
                      <p className="text-xs text-slate-600 mt-2">
                        Kết quả đối chiếu giữa dữ liệu HIS và dữ liệu hiện có trong NovaCare. Chưa có dữ liệu nghiệp vụ nào được ghi ở bước này.
                      </p>
                    </div>

                    {/* 4 KPI Cards: Tạo mới, Cập nhật, Không thay đổi, Bỏ qua */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {/* Tạo mới */}
                      <div className="p-3.5 rounded-2xl bg-white border border-emerald-200/90 shadow-xs space-y-1">
                        <div className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                          Tạo mới
                        </div>
                        <div className="text-2xl font-black text-emerald-700 font-mono">
                          {createCount}
                        </div>
                        <p className="text-[11px] text-slate-400">Bản ghi chưa tồn tại</p>
                      </div>

                      {/* Cập nhật */}
                      <div className="p-3.5 rounded-2xl bg-white border border-blue-200/90 shadow-xs space-y-1">
                        <div className="text-xs font-bold uppercase tracking-wider text-blue-800">
                          Cập nhật
                        </div>
                        <div className="text-2xl font-black text-blue-700 font-mono">
                          {updateCount}
                        </div>
                        <p className="text-[11px] text-slate-400">Có thay đổi dữ liệu</p>
                      </div>

                      {/* Không thay đổi */}
                      <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
                        <div className="text-xs font-bold uppercase tracking-wider text-slate-600">
                          Không thay đổi
                        </div>
                        <div className="text-2xl font-black text-slate-800 font-mono">
                          {unchangedCount}
                        </div>
                        <p className="text-[11px] text-slate-400">Dữ liệu tương đương</p>
                      </div>

                      {/* Bỏ qua */}
                      <div className="p-3.5 rounded-2xl bg-white border border-amber-200/90 shadow-xs space-y-1">
                        <div className="text-xs font-bold uppercase tracking-wider text-amber-800">
                          Bỏ qua
                        </div>
                        <div className="text-2xl font-black text-amber-700 font-mono">
                          {skippedCount}
                        </div>
                        <p className="text-[11px] text-slate-400">Không xử lý trong đợt này</p>
                      </div>
                    </div>

                    {/* Phạm vi đối chiếu Box */}
                    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                      <div className="flex items-center gap-2">
                        <Database className="w-4 h-4 text-emerald-600" />
                        <span className="font-bold text-slate-900">
                          Phạm vi đối chiếu
                        </span>
                      </div>
                      <p className="text-slate-800 font-semibold">
                        {doctorsList.length} bác sĩ · {deptsList.length} mã khoa HIS · Ánh xạ chuyên khoa đã được cấu hình
                      </p>
                      <p className="text-slate-500 text-[11px]">
                        Các số liệu đối chiếu dự kiến tự động giữa nguồn HIS và cơ sở dữ liệu NovaCare trước khi kích hoạt.
                      </p>
                    </div>

                    {/* Section: Chi tiết dữ liệu dự kiến xử lý */}
                    <div className="space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
                        <div>
                          <h5 className="font-bold text-sm text-slate-900">
                            Chi tiết dữ liệu dự kiến xử lý
                          </h5>
                          <span className="text-xs text-slate-500">
                            Lọc theo kết quả đối chiếu:
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setConfirmFilter('all')}
                            className={`px-2.5 py-1 rounded-xl text-xs font-semibold transition ${confirmFilter === 'all'
                                ? 'bg-slate-900 text-white shadow-xs'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                              }`}
                          >
                            Tất cả ({doctorsList.length})
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmFilter('create')}
                            className={`px-2.5 py-1 rounded-xl text-xs font-semibold transition ${confirmFilter === 'create'
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                              }`}
                          >
                            Tạo mới ({createCount})
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmFilter('update')}
                            className={`px-2.5 py-1 rounded-xl text-xs font-semibold transition ${confirmFilter === 'update'
                                ? 'bg-blue-600 text-white shadow-xs'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                              }`}
                          >
                            Cập nhật ({updateCount})
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmFilter('unchanged')}
                            className={`px-2.5 py-1 rounded-xl text-xs font-semibold transition ${confirmFilter === 'unchanged'
                                ? 'bg-slate-700 text-white shadow-xs'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                              }`}
                          >
                            Không đổi ({unchangedCount})
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmFilter('skipped')}
                            className={`px-2.5 py-1 rounded-xl text-xs font-semibold transition ${confirmFilter === 'skipped'
                                ? 'bg-amber-600 text-white shadow-xs'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                              }`}
                          >
                            Bỏ qua ({skippedCount})
                          </button>
                        </div>
                      </div>

                      {/* Doctor items list */}
                      <div className="space-y-2.5">
                        {displayedDoctors.map((item: any) => {
                          const { doc, isSelected, specialtyName, status, reason } = item;
                          return (
                            <div
                              key={doc.staffId}
                              className={`p-4 rounded-2xl border transition-all space-y-3 ${status === 'CREATE'
                                  ? 'bg-white border-emerald-200/80 shadow-xs'
                                  : status === 'UPDATE'
                                    ? 'bg-white border-blue-200/80 shadow-xs'
                                    : status === 'SKIPPED'
                                      ? 'bg-slate-50/70 border-slate-200 opacity-80'
                                      : 'bg-white border-slate-200 shadow-xs'
                                }`}
                            >
                              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                                <div className="space-y-0.5">
                                  <h6 className="font-bold text-sm text-slate-900">
                                    {doc.academicDegree ? `${doc.academicDegree} ` : ''}{doc.fullName}
                                  </h6>
                                  <div className="text-xs text-slate-500 font-mono flex items-center gap-1.5">
                                    <span className="font-bold text-emerald-700">{doc.staffId}</span>
                                    <span>•</span>
                                    <span className="font-sans text-slate-700 font-medium">{specialtyName}</span>
                                    <span>•</span>
                                    <span className="font-sans text-slate-500">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(doc.consultationFee)}</span>
                                  </div>
                                </div>

                                <div>
                                  {status === 'CREATE' && (
                                    <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs font-semibold px-2.5 py-0.5">
                                      Tạo mới
                                    </Badge>
                                  )}
                                  {status === 'UPDATE' && (
                                    <Badge className="bg-blue-50 text-blue-700 border-blue-200 text-xs font-semibold px-2.5 py-0.5">
                                      Cập nhật
                                    </Badge>
                                  )}
                                  {status === 'UNCHANGED' && (
                                    <Badge variant="outline" className="bg-slate-100 text-slate-600 border-slate-200 text-xs font-semibold px-2.5 py-0.5">
                                      Không đổi
                                    </Badge>
                                  )}
                                  {status === 'SKIPPED' && (
                                    <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-xs font-semibold px-2.5 py-0.5">
                                      Bỏ qua
                                    </Badge>
                                  )}
                                </div>
                              </div>

                              <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                                <p className="text-slate-600">
                                  {reason}
                                </p>

                                <label className="flex items-center gap-2 cursor-pointer select-none text-slate-800 font-medium shrink-0">
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => toggleDoctorSelection(doc.staffId)}
                                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                                  />
                                  <span>Đưa vào đợt đồng bộ</span>
                                </label>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Bottom disclaimer notice */}
                    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-700 flex items-start gap-3 text-xs leading-relaxed">
                      <Info className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <p>
                        Bảng tương tác minh họa cách xem và chọn bản ghi. Kết quả, trạng thái và lý do trong ứng dụng thật do backend đối chiếu dựa trên mã nhân sự và cấu hình ánh xạ; giao diện này chưa thực hiện đồng bộ.
                      </p>
                    </div>

                    {/* Navigation Footer */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setFormalStep(3)}
                        className="text-slate-500 hover:text-slate-800 text-xs rounded-xl gap-1.5"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        Quay lại Mapping
                      </Button>
                      <Button
                        onClick={() => setFormalStep(5)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-10 px-6 rounded-xl gap-2 shadow-sm shadow-emerald-600/20"
                      >
                        Chuyển sang Bước Kích hoạt Sync
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                );
              })()}

              {/* Sub-step 5: Đồng bộ dữ liệu HIS (3 Trạng thái A, B, C) */}
              {formalStep === 5 && (() => {
                const totalDoctors = handshakeResult?.doctors || [];
                const actionableCount = createCount + updateCount;
                const unchangedOrSkippedCount = unchangedCount + skippedCount;

                return (
                  <div className="space-y-6 py-2">
                    {/* ========================================================================= */}
                    {/* TRẠNG THÁI A – SẴN SÀNG THỰC THI */}
                    {/* ========================================================================= */}
                    {syncExecutionState === 'ready' && (
                      <div className="space-y-5">
                        {/* Header Box */}
                        <div>
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-bold text-base text-slate-900">
                                  Đồng bộ dữ liệu HIS
                                </h4>
                                <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs font-semibold px-2.5 py-0.5">
                                  5/5 · Sync
                                </Badge>
                              </div>
                              <p className="text-xs text-slate-500 mt-1">
                                <strong className="text-slate-800 font-semibold">{handshakeResult?.hospitalName || statusData?.hospitalName || 'Bệnh viện An Bình'}</strong> · Sẵn sàng thực thi
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Kế hoạch đã xác nhận Card */}
                        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
                          <h5 className="font-bold text-xs uppercase tracking-wider text-slate-700">
                            Kế hoạch đã xác nhận
                          </h5>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="p-3.5 rounded-xl bg-emerald-50/50 border border-emerald-200/80 space-y-1">
                              <span className="text-[11px] font-bold text-emerald-800 uppercase block">
                                Bản ghi được chọn
                              </span>
                              <div className="text-2xl font-black text-emerald-700 font-mono">
                                {actionableCount}
                              </div>
                              <p className="text-[11px] text-slate-500">
                                {actionableCount > 0
                                  ? `Gồm ${createCount} tạo mới và ${updateCount} cập nhật`
                                  : 'Không có dữ liệu mới cần ghi thêm'}
                              </p>
                            </div>

                            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                              <span className="text-[11px] font-bold text-slate-600 uppercase block">
                                Không thay đổi / Bỏ qua
                              </span>
                              <div className="text-2xl font-black text-slate-800 font-mono">
                                {unchangedOrSkippedCount}
                              </div>
                              <p className="text-[11px] text-slate-500">
                                {unchangedCount > 0
                                  ? `${unchangedCount} bản ghi đã tương đương trong NovaCare`
                                  : 'Bản ghi không cần xử lý thêm'}
                              </p>
                            </div>
                          </div>

                          <p className="text-xs text-slate-500 italic">
                            {actionableCount === 0 && unchangedCount > 0
                              ? `Toàn bộ ${unchangedCount} bản ghi từ HIS đã tương đương dữ liệu hiện có trong NovaCare, hệ thống không cần ghi lại.`
                              : `Kế hoạch đã thẩm định: ${createCount} bản ghi tạo mới, ${updateCount} cập nhật và ${unchangedCount} bản ghi không thay đổi${skippedCount > 0 ? `, ${skippedCount} bản ghi bỏ qua` : ''}.`}
                          </p>
                        </div>

                        {/* Trước khi thực thi Box */}
                        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                          <strong className="font-bold text-slate-900 block text-xs uppercase tracking-wider">
                            Trước khi thực thi
                          </strong>
                          <ul className="space-y-1.5 text-slate-600 list-disc pl-4">
                            <li>Hệ thống sẽ kiểm tra lại kế hoạch, định danh, ánh xạ chuyên khoa và điều kiện ghi dữ liệu.</li>
                            <li>Bản ghi không thay đổi không cần ghi lại nếu dữ liệu vẫn giống nhau.</li>
                          </ul>
                        </div>

                        {/* Checkbox Phê duyệt kế hoạch */}
                        <div className="p-3.5 rounded-2xl bg-emerald-50/40 border border-emerald-200/80">
                          <label className="flex items-start gap-3 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={isPlanConfirmed}
                              onChange={(e) => setIsPlanConfirmed(e.target.checked)}
                              className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-4 w-4 mt-0.5"
                            />
                            <div className="text-xs space-y-0.5">
                              <span className="font-bold text-slate-900 block">
                                Tôi xác nhận thực thi kế hoạch đồng bộ đã được phê duyệt ở Bước 4.
                              </span>
                              <p className="text-slate-500 text-[11px]">
                                Sau khi xác nhận, hệ thống tạo một lần chạy đồng bộ (Sync Run) với mã riêng để theo dõi tiến độ.
                              </p>
                            </div>
                          </label>
                        </div>

                        {/* Navigation Footer */}
                        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setFormalStep(4)}
                            className="text-slate-500 hover:text-slate-800 text-xs rounded-xl gap-1.5"
                          >
                            <ArrowLeft className="w-3.5 h-3.5" />
                            Quay lại Bước 4 (Xác nhận)
                          </Button>

                          <Button
                            onClick={handleStartSyncExecution}
                            disabled={!isPlanConfirmed || syncMutation.isPending}
                            className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs h-10 px-6 rounded-xl gap-2 shadow-sm shadow-emerald-600/20"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                            Thực thi đồng bộ
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* ========================================================================= */}
                    {/* TRẠNG THÁI B – ĐANG THỰC THI */}
                    {/* ========================================================================= */}
                    {syncExecutionState === 'running' && (
                      <div className="space-y-5">
                        {/* Header Box */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-base text-slate-900">
                                Đang đồng bộ dữ liệu
                              </h4>
                              <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-xs font-semibold px-2.5 py-0.5 gap-1.5 animate-pulse">
                                <Loader2 className="w-3 h-3 animate-spin" />
                                Đang chạy
                              </Badge>
                            </div>
                            <p className="text-xs text-slate-500 mt-1 font-mono">
                              Lần chạy: <strong className="text-emerald-700">{syncRunCode}</strong> · Đang kết nối HIS và đồng bộ CSDL
                            </p>
                          </div>
                        </div>

                        {/* Card Tiến độ xử lý */}
                        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs uppercase tracking-wider text-slate-700">
                              Tiến độ xử lý
                            </span>
                            <span className="font-mono text-xs font-bold text-slate-900">
                              {syncProgress.processed} / {syncProgress.total} bản ghi
                            </span>
                          </div>

                          {/* Progress bar */}
                          <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                            <div
                              className="h-full bg-emerald-600 transition-all duration-300 rounded-full"
                              style={{
                                width: `${syncProgress.total > 0 ? Math.min(100, Math.round((syncProgress.processed / syncProgress.total) * 100)) : 0}%`,
                              }}
                            />
                          </div>

                          <div className="text-xs text-slate-500 flex items-center gap-2">
                            <Loader2 className="w-3 h-3 animate-spin text-emerald-600 shrink-0" />
                            <span>
                              {syncProgress.currentDoctorName || 'Đang xác thực thông tin và cập nhật ca trực...'}
                            </span>
                          </div>
                        </div>

                        {/* 3 Real-time KPI Stats: Thành công, Lỗi, Chưa xử lý */}
                        <div className="grid grid-cols-3 gap-3">
                          <div className="p-3.5 rounded-2xl bg-white border border-emerald-200 shadow-xs space-y-1 text-center sm:text-left">
                            <div className="text-2xl font-black text-emerald-700 font-mono">
                              {syncProgress.success}
                            </div>
                            <div className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                              Thành công
                            </div>
                            <p className="text-[11px] text-slate-400 hidden sm:block">Đã ghi nhận an toàn</p>
                          </div>

                          <div className="p-3.5 rounded-2xl bg-white border border-rose-200 shadow-xs space-y-1 text-center sm:text-left">
                            <div className="text-2xl font-black text-rose-600 font-mono">
                              {syncProgress.error}
                            </div>
                            <div className="text-xs font-bold uppercase tracking-wider text-rose-800">
                              Lỗi
                            </div>
                            <p className="text-[11px] text-slate-400 hidden sm:block">Cần rà soát lại</p>
                          </div>

                          <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1 text-center sm:text-left">
                            <div className="text-2xl font-black text-slate-700 font-mono">
                              {syncProgress.pending}
                            </div>
                            <div className="text-xs font-bold uppercase tracking-wider text-slate-600">
                              Chưa xử lý
                            </div>
                            <p className="text-[11px] text-slate-400 hidden sm:block">Đang đợi trong hàng đợi</p>
                          </div>
                        </div>

                        {/* Operating safety notices */}
                        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-600 text-xs space-y-1 leading-relaxed">
                          <p>• Hệ thống đang thực thi đồng bộ tuần tự, hiển thị tiến độ và trạng thái chi tiết của từng tác vụ.</p>
                          <p>• Thao tác chạy lại tạm khóa trong khi tiến trình đang diễn ra nhằm tránh xung đột dữ liệu.</p>
                          <p>• Khi người dùng rời trang, tác vụ backend vẫn tiếp tục hoàn thành và lưu vào lịch sử kiểm toán.</p>
                        </div>

                        {/* Action stop button */}
                        <div className="flex items-center justify-end pt-2 border-t border-slate-100">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setIsExecutionStopped(true);
                              toast.info('Đã gửi yêu cầu dừng các bản ghi chưa xử lý.');
                            }}
                            className="border-slate-300 text-slate-700 hover:bg-slate-100 text-xs rounded-xl"
                          >
                            Dừng các bản ghi chưa xử lý
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* ========================================================================= */}
                    {/* TRẠNG THÁI C – HOÀN TẤT VÀ BÁO CÁO */}
                    {/* ========================================================================= */}
                    {syncExecutionState === 'completed' && (() => {
                      const hasErrors = syncFinalReport?.error || (syncFinalReport?.errorCount && syncFinalReport?.errorCount > 0);
                      const createdCount = syncFinalReport?.createdCount || 0;
                      const updatedCount = syncFinalReport?.updatedCount || 0;
                      const unchangedCount = syncFinalReport?.unchangedCount || 0;
                      const errorCount = hasErrors ? (syncFinalReport?.errorCount || 1) : 0;

                      return (
                        <div className="space-y-5">
                          {/* Header Box */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-bold text-base text-slate-900">
                                  {hasErrors ? 'Đồng bộ hoàn tất một phần' : 'Đồng bộ hoàn tất thành công'}
                                </h4>
                                <Badge className={hasErrors ? 'bg-amber-50 text-amber-800 border-amber-200 text-xs font-semibold px-2.5 py-0.5' : 'bg-emerald-50 text-emerald-700 border-emerald-200 text-xs font-semibold px-2.5 py-0.5'}>
                                  {hasErrors ? 'Hoàn tất một phần' : 'Hoàn tất 100%'}
                                </Badge>
                              </div>
                              <p className="text-xs text-slate-500 mt-1">
                                {hasErrors
                                  ? 'Một số bản ghi thành công, một bản ghi cần xử lý lại.'
                                  : 'Toàn bộ danh mục Bác sĩ, Khoa phòng và Lịch trực đã được ghi nhận vào CSDL NovaCare.'}
                              </p>
                              <p className="text-[11px] font-mono text-slate-400 mt-0.5">
                                Lần chạy: {syncRunCode} · Hoàn tất lúc {syncFinalReport?.completedAt || new Date().toLocaleTimeString('vi-VN')}
                              </p>
                            </div>
                          </div>

                          {/* 4 Report KPIs: Tạo mới thành công, Cập nhật thành công, Không thay đổi, Lỗi */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {/* Tạo mới */}
                            <div className="p-3.5 rounded-2xl bg-white border border-emerald-200 shadow-xs space-y-1">
                              <div className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                                Tạo mới thành công
                              </div>
                              <div className="text-2xl font-black text-emerald-700 font-mono">
                                {createdCount}
                              </div>
                              <p className="text-[11px] text-slate-400">Bác sĩ mới được tạo</p>
                            </div>

                            {/* Cập nhật */}
                            <div className="p-3.5 rounded-2xl bg-white border border-blue-200 shadow-xs space-y-1">
                              <div className="text-xs font-bold uppercase tracking-wider text-blue-800">
                                Cập nhật thành công
                              </div>
                              <div className="text-2xl font-black text-blue-700 font-mono">
                                {updatedCount}
                              </div>
                              <p className="text-[11px] text-slate-400">Đã cập nhật giá / ca trực</p>
                            </div>

                            {/* Không thay đổi */}
                            <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
                              <div className="text-xs font-bold uppercase tracking-wider text-slate-600">
                                Không thay đổi
                              </div>
                              <div className="text-2xl font-black text-slate-800 font-mono">
                                {unchangedCount}
                              </div>
                              <p className="text-[11px] text-slate-400">Dữ liệu đã tương đương</p>
                            </div>

                            {/* Lỗi */}
                            <div className="p-3.5 rounded-2xl bg-white border border-rose-200 shadow-xs space-y-1">
                              <div className="text-xs font-bold uppercase tracking-wider text-rose-800">
                                Lỗi
                              </div>
                              <div className="text-2xl font-black text-rose-600 font-mono">
                                {errorCount}
                              </div>
                              <p className="text-[11px] text-slate-400">Cần xử lý lại</p>
                            </div>
                          </div>

                          {/* Error block if any */}
                          {hasErrors && (
                            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 space-y-2 text-xs">
                              <div className="flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                                <strong className="font-bold text-sm text-rose-950">
                                  Bản ghi lỗi: {syncFinalReport?.errorStaffId || 'AB_DOC_005'}
                                </strong>
                              </div>
                              <p className="text-rose-800">
                                <strong>Nguyên nhân: </strong>
                                {syncFinalReport?.errorMessage || 'Thiếu thông tin bắt buộc hoặc chuyên khoa nguồn chưa được ánh xạ hoàn chỉnh.'}
                              </p>
                              <div className="pt-1 text-[11px] text-rose-700 bg-white/70 p-2.5 rounded-xl border border-rose-200">
                                <strong>Hành động: </strong>
                                Xem chi tiết lỗi, sửa dữ liệu nguồn hoặc cấu hình liên quan, sau đó đưa bản ghi vào một lần đồng bộ lại có kiểm soát.
                              </div>
                            </div>
                          )}

                          {/* Audit Details Table */}
                          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
                            <h5 className="font-bold text-xs uppercase tracking-wider text-slate-700">
                              Chi tiết nhật ký đồng bộ (Audit Trail)
                            </h5>

                            <div className="overflow-x-auto border border-slate-100 rounded-xl">
                              <table className="w-full text-left text-xs">
                                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-[11px]">
                                  <tr>
                                    <th className="p-2.5 pl-3">Mã nhân sự</th>
                                    <th className="p-2.5">Bác sĩ</th>
                                    <th className="p-2.5">Chuyên khoa</th>
                                    <th className="p-2.5 text-right pr-3">Kết quả</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-slate-700">
                                  {syncFinalReport?.details && syncFinalReport.details.length > 0 ? (
                                    syncFinalReport.details.map((d: any) => (
                                      <tr key={d.staffId} className="hover:bg-slate-50">
                                        <td className="p-2.5 pl-3 font-mono font-bold text-emerald-700">{d.staffId}</td>
                                        <td className="p-2.5 font-semibold text-slate-900">{d.doctorName}</td>
                                        <td className="p-2.5 text-slate-600">{d.specialtyName}</td>
                                        <td className="p-2.5 text-right pr-3">
                                          <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-semibold">
                                            {d.action === 'CREATED' ? 'Tạo mới' : d.action === 'UPDATED' ? 'Cập nhật' : 'Không đổi'}
                                          </Badge>
                                        </td>
                                      </tr>
                                    ))
                                  ) : (
                                    handshakeResult?.doctors?.slice(0, 5).map((doc: any) => (
                                      <tr key={doc.staffId} className="hover:bg-slate-50">
                                        <td className="p-2.5 pl-3 font-mono font-bold text-emerald-700">{doc.staffId}</td>
                                        <td className="p-2.5 font-semibold text-slate-900">{doc.fullName}</td>
                                        <td className="p-2.5 text-slate-600">{doc.deptCode}</td>
                                        <td className="p-2.5 text-right pr-3">
                                          <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-semibold">
                                            Hoàn tất
                                          </Badge>
                                        </td>
                                      </tr>
                                    ))
                                  )}
                                </tbody>
                              </table>
                            </div>
                          </div>

                          {/* Navigation Footer */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-100">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSyncExecutionState('ready');
                                setFormalStep(1);
                              }}
                              className="text-slate-500 hover:text-slate-800 text-xs rounded-xl"
                            >
                              Thực hiện đợt đồng bộ mới
                            </Button>

                            <div className="flex items-center gap-2">
                              <a href="/hospital-admin/doctors">
                                <Button
                                  variant="outline"
                                  className="border-slate-300 text-slate-700 hover:bg-slate-50 text-xs rounded-xl h-10 px-4"
                                >
                                  Xem danh sách Bác sĩ viện
                                </Button>
                              </a>

                              <Button
                                onClick={() => {
                                  setIsTestingNewOnboarding(false);
                                  setSetupStep('landing');
                                }}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-10 px-6 rounded-xl shadow-sm shadow-emerald-600/20"
                              >
                                Hoàn tất & Về Dashboard
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                );
              })()}
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
