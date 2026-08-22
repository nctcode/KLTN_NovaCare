'use client';

import { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Building2,
  Activity,
  Clock,
  CheckCircle2,
  XCircle,
  QrCode,
  Copy,
  Plus,
  ArrowRight,
  UserCheck,
  AlertTriangle,
  Lock,
  Eye,
  RefreshCw,
  Search,
  ChevronRight,
  Shield,
  Trash2,
  Ban,
  FileText,
  Stethoscope,
  Pill,
  TestTube,
  FileCheck2,
  AlertOctagon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { profileService } from '@/services/profile.service';
import { PatientProfile } from '@/types/profile.types';
import { toast } from 'sonner';

// Sample Share Code Interface
interface ShareCodeItem {
  id: string;
  code: string;
  status: 'ACTIVE' | 'EXPIRED' | 'REVOKED';
  validUntil: Date;
  secondsLeft: number;
  hospitalName: string;
  hospitalId?: string;
  sections: string[];
  createdAt: Date;
}

// Audit Log Event Interface
interface AuditLogItem {
  id: string;
  timestamp: string;
  hospitalName: string;
  doctorName?: string;
  purpose: string;
  accessedData: string;
  status: 'SUCCESS' | 'DENIED';
  note?: string;
}

export default function PatientInteroperabilityDashboard() {
  // Profiles
  const [profiles, setProfiles] = useState<PatientProfile[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<PatientProfile | null>(null);

  // Stepper Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [selectedDurationMins, setSelectedDurationMins] = useState(15);
  const [selectedSections, setSelectedSections] = useState<string[]>([
    'Lịch sử khám',
    'Chẩn đoán',
    'Đơn thuốc',
  ]);
  const [hospitalAccessOption, setHospitalAccessOption] = useState<'ANY' | 'SPECIFIC'>('SPECIFIC');
  const [selectedHospitalName, setSelectedHospitalName] = useState('Bệnh viện Quốc tế Nova Central');

  // Active & Historical Share Codes
  const [shareCodes, setShareCodes] = useState<ShareCodeItem[]>([
    {
      id: 'sc-1',
      code: 'NC-8F3K-29QX',
      status: 'ACTIVE',
      validUntil: new Date(Date.now() + 14 * 60 * 1000 + 32 * 1000), // 14 mins 32 secs left
      secondsLeft: 872,
      hospitalName: 'Bệnh viện Quốc tế Nova Central',
      sections: ['Lịch sử khám', 'Chẩn đoán', 'Đơn thuốc'],
      createdAt: new Date(Date.now() - 2 * 60 * 1000),
    },
    {
      id: 'sc-2',
      code: 'NC-2K91-XP72',
      status: 'EXPIRED',
      validUntil: new Date(Date.now() - 2 * 60 * 60 * 1000),
      secondsLeft: 0,
      hospitalName: 'Bất kỳ bệnh viện nào có mã',
      sections: ['Lịch sử khám', 'Chẩn đoán', 'Dị ứng'],
      createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
    },
    {
      id: 'sc-3',
      code: 'NC-9H22-AB31',
      status: 'REVOKED',
      validUntil: new Date(Date.now() - 24 * 60 * 60 * 1000),
      secondsLeft: 0,
      hospitalName: 'Bệnh viện Đa khoa NovaCare Sài Gòn',
      sections: ['Tất cả hồ sơ y tế'],
      createdAt: new Date(Date.now() - 25 * 60 * 60 * 1000),
    },
  ]);

  // QR Modal
  const [selectedQrCode, setSelectedQrCode] = useState<ShareCodeItem | null>(null);

  // Audit Logs State
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([
    {
      id: 'log-1',
      timestamp: '21/08/2026 – 15:42',
      hospitalName: 'Bệnh viện Quốc tế Nova Central',
      doctorName: 'BS.CKI Nguyễn Văn A',
      purpose: 'Khám bệnh chuyên khoa',
      accessedData: 'Lịch sử khám + Chẩn đoán + Đơn thuốc',
      status: 'SUCCESS',
    },
    {
      id: 'log-2',
      timestamp: '21/08/2026 – 15:45',
      hospitalName: 'Bệnh viện Quốc tế Nova Central',
      purpose: 'Tra cứu thử nghiệm',
      accessedData: 'Không thể truy cập',
      status: 'DENIED',
      note: 'Mã chia sẻ không hợp lệ hoặc đã hết hạn',
    },
    {
      id: 'log-3',
      timestamp: '15/08/2026 – 09:15',
      hospitalName: 'Bệnh viện Đa khoa NovaCare Sài Gòn',
      doctorName: 'BS.CKII Trần Thanh Sơn',
      purpose: 'Tái khám định kỳ',
      accessedData: 'Toàn bộ hồ sơ y tế',
      status: 'SUCCESS',
    },
  ]);

  // Linked Hospitals
  const linkedHospitals = [
    {
      id: 'hosp-1',
      name: 'Bệnh viện Đa khoa NovaCare Sài Gòn',
      externalPatientId: 'PAT-175-THU01',
      encountersCount: 4,
      status: 'Đã liên kết',
    },
    {
      id: 'hosp-2',
      name: 'Bệnh viện Quốc tế Nova Central',
      externalPatientId: 'PAT-199-THU02',
      encountersCount: 1,
      status: 'Đã liên kết',
    },
    {
      id: 'hosp-3',
      name: 'Bệnh viện Y Dược NovaCare Chợ Lớn',
      externalPatientId: 'PAT-BỆNH-080303008211',
      encountersCount: 2,
      status: 'Đã liên kết',
    },
  ];

  // Load profiles
  useEffect(() => {
    async function loadProfiles() {
      try {
        const data = await profileService.getAll();
        setProfiles(data);
        if (data.length > 0) {
          const defaultProf = data.find((p) => p.isDefault) || data[0];
          setSelectedProfile(defaultProf);
        }
      } catch (err) {
        console.error('Lỗi khi tải hồ sơ:', err);
      }
    }
    loadProfiles();
  }, []);

  // Realtime Timer Ticker for Active Share Codes
  useEffect(() => {
    const timer = setInterval(() => {
      setShareCodes((prevCodes) =>
        prevCodes.map((code) => {
          if (code.status !== 'ACTIVE') return code;
          const diff = Math.max(0, Math.floor((code.validUntil.getTime() - Date.now()) / 1000));
          if (diff === 0) {
            return { ...code, status: 'EXPIRED', secondsLeft: 0 };
          }
          return { ...code, secondsLeft: diff };
        })
      );
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Helper formatting seconds
  const formatSeconds = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Section Options List
  const availableSections = [
    { id: 'Lịch sử khám', label: 'Lịch sử khám', icon: Stethoscope },
    { id: 'Chẩn đoán', label: 'Chẩn đoán y khoa', icon: FileText },
    { id: 'Đơn thuốc', label: 'Đơn thuốc', icon: Pill },
    { id: 'Kết quả xét nghiệm', label: 'Kết quả xét nghiệm', icon: TestTube },
    { id: 'Kết quả cận lâm sàng', label: 'Kết quả cận lâm sàng', icon: FileCheck2 },
    { id: 'Dị ứng', label: 'Tiền sử dị ứng', icon: AlertOctagon },
    { id: 'Tiền sử bệnh', label: 'Tiền sử bệnh lý', icon: Activity },
  ];

  const toggleSection = (id: string) => {
    if (selectedSections.includes(id)) {
      setSelectedSections(selectedSections.filter((s) => s !== id));
    } else {
      setSelectedSections([...selectedSections, id]);
    }
  };

  // Generate Share Code Handler
  const handleGenerateShareCode = async () => {
    if (selectedSections.length === 0) {
      toast.error('Vui lòng chọn ít nhất 1 loại dữ liệu muốn chia sẻ');
      return;
    }

    const randomPart1 = Math.random().toString(36).substring(2, 6).toUpperCase();
    const randomPart2 = Math.random().toString(36).substring(2, 6).toUpperCase();
    let newCodeString = `NC-${randomPart1}-${randomPart2}`;
    let backendShareId: string | null = null;

    try {
      const realShare = await passportService.createShare({
        allowedSections: selectedSections,
        validDays: 1,
        sharedWith: hospitalAccessOption === 'ANY' ? 'Bất kỳ bệnh viện nào có mã' : selectedHospitalName,
        customToken: newCodeString,
      });
      if (realShare && (realShare.shareToken || realShare.id)) {
        newCodeString = realShare.shareToken || newCodeString;
        backendShareId = realShare.id;
      }
    } catch (err) {
      console.log('Backend createShare fallback to local token generation:', newCodeString);
    }

    const validUntilDate = new Date(Date.now() + selectedDurationMins * 60 * 1000);

    const newCodeItem: ShareCodeItem = {
      id: backendShareId || `sc-${Date.now()}`,
      code: newCodeString,
      status: 'ACTIVE',
      validUntil: validUntilDate,
      secondsLeft: selectedDurationMins * 60,
      hospitalName:
        hospitalAccessOption === 'ANY'
          ? 'Bất kỳ bệnh viện nào có mã'
          : selectedHospitalName,
      sections: [...selectedSections],
      createdAt: new Date(),
    };

    setShareCodes([newCodeItem, ...shareCodes]);

    // Sync active code to localStorage for real-time validation across tabs
    const existingActive = JSON.parse(localStorage.getItem('novacare_active_codes') || '[]');
    localStorage.setItem('novacare_active_codes', JSON.stringify([newCodeString, ...existingActive]));

    const existingLocalShares = JSON.parse(localStorage.getItem('novacare_local_shares') || '[]');
    localStorage.setItem('novacare_local_shares', JSON.stringify([newCodeItem, ...existingLocalShares]));

    setIsCreateModalOpen(false);
    setStep(1);
    toast.success(`Đã tạo mã chia sẻ ${newCodeString} hiệu lực trong ${selectedDurationMins} phút!`);
  };

  // Revoke Share Code Handler
  const handleRevokeCode = async (id: string) => {
    const targetCode = shareCodes.find((c) => c.id === id);
    if (!targetCode) return;

    if (confirm(`Bạn có chắc chắn muốn thu hồi mã chia sẻ ${targetCode.code} ngay lập tức?`)) {
      try {
        if (!id.startsWith('sc-')) {
          await passportService.revokeShare(id);
        }
      } catch (err) {
        console.log('Backend revokeShare note:', err);
      }

      // Save revoked code to localStorage so lookup portal immediately blocks it!
      const existingRevoked = JSON.parse(localStorage.getItem('novacare_revoked_codes') || '[]');
      if (!existingRevoked.includes(targetCode.code)) {
        localStorage.setItem('novacare_revoked_codes', JSON.stringify([...existingRevoked, targetCode.code]));
      }

      setShareCodes((prev) =>
        prev.map((c) => (c.id === id ? { ...c, status: 'REVOKED', secondsLeft: 0 } : c))
      );
      toast.success(`Đã thu hồi thành công mã ${targetCode.code}! Cổng tra cứu sẽ từ chối truy cập.`);
    }
  };

  const activeCodesCount = shareCodes.filter((c) => c.status === 'ACTIVE').length;
  const currentActiveCode = shareCodes.find((c) => c.status === 'ACTIVE');

  // Dynamic Master Identity Code
  const masterPatientId = selectedProfile
    ? `NOVA-PAT-${selectedProfile.identityNumber ? selectedProfile.identityNumber.slice(-3) : '001'}`
    : 'NOVA-PAT-001';

  // Masked Identity
  const maskedIdentity = selectedProfile?.identityNumber
    ? `${selectedProfile.identityNumber.slice(0, 4)}****${selectedProfile.identityNumber.slice(-3)}`
    : '0803****211';

  return (
    <div className="w-full space-y-8 pb-16">
      {/* SECTION 2: HEADER & MASTER PATIENT IDENTITY */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Hồ sơ & Liên thông y tế</h1>
              <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-blue-50 text-blue-700 border border-blue-200">
                Patient-Led Consent Control
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              Chủ động phân quyền & cấp mã chia sẻ hồ sơ y tế tạm thời giữa các bệnh viện liên thông
            </p>
          </div>

          {/* Profile Switcher */}
          {profiles.length > 0 && (
            <div className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-2xl border border-slate-200 self-start md:self-auto">
              <UserCheck className="w-4 h-4 text-blue-600 shrink-0 ml-1" />
              <span className="text-xs font-bold text-slate-600 shrink-0">Hồ sơ:</span>
              <select
                value={selectedProfile?.id || ''}
                onChange={(e) => {
                  const found = profiles.find((p) => p.id === e.target.value);
                  if (found) setSelectedProfile(found);
                }}
                className="text-xs font-extrabold text-slate-900 bg-white px-3 py-1.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                {profiles.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.fullName} ({p.relation || 'Bản thân'})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Patient Identity Detail Strip */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Patient Bio */}
          <div className="space-y-1">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Bệnh nhân</div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-slate-900">
                {selectedProfile?.fullName || 'Nguyễn Thị Minh Thư'}
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700">
                {selectedProfile?.relation || 'Bản thân'}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Giới tính: {selectedProfile?.gender === 'FEMALE' ? 'Nữ' : 'Nam'} · CCCD: <strong className="font-mono text-slate-800">{maskedIdentity}</strong>
            </p>
          </div>

          {/* Master Patient Identity Box */}
          <div className="md:col-span-2 bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-bold text-blue-300">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Master Patient Identity (Định danh trung tâm NovaCare)</span>
              </div>
              <div className="text-2xl font-black font-mono tracking-wider text-emerald-400">
                {masterPatientId}
              </div>
              <p className="text-[11px] text-slate-300 max-w-lg leading-relaxed">
                Định danh trung tâm được sử dụng để liên kết hồ sơ bệnh nhân tại các bệnh viện đã xác thực.
              </p>
            </div>

            <div className="px-3 py-1.5 rounded-xl bg-white/10 border border-white/15 text-[11px] font-bold text-slate-200 shrink-0">
              CCCD bảo mật: {maskedIdentity}
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 3: OVERVIEW STATISTICS (4 CARDS) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Bệnh viện liên kết</div>
          <div className="text-2xl font-black text-slate-900">3 bệnh viện</div>
          <div className="text-xs text-slate-500 font-medium">Đã ánh xạ mã BN</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Lượt khám</div>
          <div className="text-2xl font-black text-indigo-600">7 lượt khám</div>
          <div className="text-xs text-slate-500 font-medium">Tất cả bệnh viện</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Mã chia sẻ hoạt động</div>
          <div className="text-2xl font-black text-emerald-600">{activeCodesCount} mã</div>
          <div className="text-xs text-slate-500 font-medium">Đang có hiệu lực</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Lần truy cập gần đây</div>
          <div className="text-sm font-extrabold text-slate-900">21/08/2026 – 15:42</div>
          <div className="text-[11px] text-emerald-700 font-bold">🏥 Nova Central</div>
        </div>
      </div>

      {/* SECTION 4: PROMINENT ACTION CARD: CHIA SẺ HỒ SƠ Y TẾ */}
      <div className="bg-gradient-to-r from-blue-900 via-slate-900 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 shadow-md relative overflow-hidden flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="absolute right-0 top-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="relative z-10 space-y-2 max-w-xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-bold uppercase tracking-wider border border-blue-500/30">
            <Lock className="w-3.5 h-3.5" />
            🔐 Chia sẻ hồ sơ y tế chủ động
          </div>
          <h2 className="text-2xl font-black">Tạo Mã Chia Sẻ Hồ Sơ Tạm Thời</h2>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Tạo mã chia sẻ tạm thời để bệnh viện hoặc bác sĩ được phép truy cập hồ sơ y tế của bạn trong khoảng thời gian xác định.
          </p>
        </div>

        <Button
          onClick={() => {
            setStep(1);
            setIsCreateModalOpen(true);
          }}
          className="relative z-10 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-sm px-6 py-6 rounded-2xl shadow-lg shadow-emerald-900/30 gap-2 shrink-0 cursor-pointer transition transform hover:scale-105"
        >
          <Plus className="w-5 h-5" />
          <span>+ Tạo mã chia sẻ</span>
        </Button>
      </div>

      {/* SECTION 6: CURRENT ACTIVE SHARE CODE DISPLAY */}
      {currentActiveCode && (
        <Card className="border-2 border-emerald-500/60 bg-gradient-to-br from-slate-900 to-emerald-950 text-white rounded-3xl p-6 shadow-xl relative overflow-hidden">
          <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-3 pb-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-emerald-400 animate-ping" />
                <div>
                  <h3 className="text-base font-extrabold text-white">Mã chia sẻ hồ sơ đang hoạt động</h3>
                  <p className="text-xs text-emerald-300">Bệnh nhân chủ động cấp quyền truy cập y tế</p>
                </div>
              </div>

              <div className="flex items-center gap-2 bg-emerald-500/20 px-3 py-1.5 rounded-full border border-emerald-500/40 text-xs font-bold text-emerald-300">
                <Clock className="w-4 h-4 text-emerald-400 animate-spin" />
                <span>Còn hiệu lực: <strong className="font-mono text-sm text-white">{formatSeconds(currentActiveCode.secondsLeft)}</strong></span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
              {/* Big Code Box */}
              <div className="bg-black/40 border-2 border-emerald-400/50 rounded-2xl p-6 text-center space-y-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block">Mã truy cập</span>
                <div className="text-3xl font-black font-mono tracking-widest text-emerald-400">
                  {currentActiveCode.code}
                </div>
                <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full bg-emerald-500 text-slate-900 font-extrabold text-[11px]">
                  <CheckCircle2 className="w-3.5 h-3.5" /> 🟢 Đang hoạt động
                </span>
              </div>

              {/* Scope & Hospital details */}
              <div className="space-y-3 text-xs md:col-span-2">
                <div className="bg-white/5 p-4 rounded-2xl border border-white/10 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-semibold">Bệnh viện được phép:</span>
                    <strong className="text-white font-bold">{currentActiveCode.hospitalName}</strong>
                  </div>
                  <div className="flex items-start justify-between gap-2 border-t border-white/10 pt-2">
                    <span className="text-slate-400 font-semibold shrink-0">Phạm vi dữ liệu:</span>
                    <div className="flex flex-wrap gap-1 justify-end">
                      {currentActiveCode.sections.map((sec, idx) => (
                        <span key={idx} className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 font-semibold text-[11px] border border-emerald-500/30">
                          {sec}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <Button
                    onClick={() => {
                      navigator.clipboard.writeText(currentActiveCode.code);
                      toast.success('Đã sao chép mã chia sẻ!');
                    }}
                    size="sm"
                    className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs gap-1.5 rounded-xl cursor-pointer"
                  >
                    <Copy className="w-4 h-4" />
                    <span>Sao chép mã</span>
                  </Button>

                  <Button
                    onClick={() => setSelectedQrCode(currentActiveCode)}
                    size="sm"
                    variant="outline"
                    className="bg-white/10 hover:bg-white/20 text-white border-white/20 font-bold text-xs gap-1.5 rounded-xl cursor-pointer"
                  >
                    <QrCode className="w-4 h-4 text-emerald-400" />
                    <span>Hiển thị QR Code</span>
                  </Button>

                  <Button
                    onClick={() => handleRevokeCode(currentActiveCode.id)}
                    size="sm"
                    variant="destructive"
                    className="bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40 font-bold text-xs gap-1.5 rounded-xl cursor-pointer ml-auto"
                  >
                    <Ban className="w-4 h-4" />
                    <span>Thu hồi ngay</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* SECTION 13: AUDIT LOG (LỊCH SỬ TRUY CẬP HỒ SƠ) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-indigo-600" />
            <span>Lịch sử truy cập hồ sơ (Audit Trail Log)</span>
          </h2>
          <span className="text-xs text-slate-500 font-medium">Ghi vết bảo mật thời gian thực</span>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="divide-y divide-slate-100">
            {auditLogs.map((log) => {
              const isSuccess = log.status === 'SUCCESS';
              return (
                <div key={log.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/80 transition">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-mono font-bold text-slate-400">{log.timestamp}</span>
                      <span className="font-extrabold text-slate-900 text-sm">🏥 {log.hospitalName}</span>
                      {log.doctorName && (
                        <span className="text-xs text-slate-600 font-semibold">· Bác sĩ: <strong className="text-slate-900">{log.doctorName}</strong></span>
                      )}
                    </div>

                    <div className="text-xs text-slate-600 flex items-center gap-3 flex-wrap">
                      <span>Mục đích: <strong className="text-slate-800">{log.purpose}</strong></span>
                      <span>Dữ liệu truy cập: <strong className="text-blue-700">{log.accessedData}</strong></span>
                    </div>
                  </div>

                  <div className="shrink-0">
                    {isSuccess ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        🟢 Thành công
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-red-50 text-red-800 border border-red-200">
                        <XCircle className="w-4 h-4 text-red-600" />
                        🔴 Truy cập bị từ chối
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* SECTION 14: SHARE CODE HISTORY */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <Clock className="w-5 h-5 text-blue-600" />
          <span>Danh sách mã chia sẻ gần đây</span>
        </h2>

        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="divide-y divide-slate-100">
            {shareCodes.map((code) => {
              const isActive = code.status === 'ACTIVE';
              const isExpired = code.status === 'EXPIRED';
              const isRevoked = code.status === 'REVOKED';

              return (
                <div key={code.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50 transition">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="font-mono font-black text-slate-900 text-base">{code.code}</span>
                      {isActive && (
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                          🟢 Đang hoạt động ({formatSeconds(code.secondsLeft)})
                        </span>
                      )}
                      {isExpired && (
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600">
                          ⚪ Đã hết hạn
                        </span>
                      )}
                      {isRevoked && (
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-100 text-red-800">
                          🔴 Đã thu hồi
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-600 font-medium">
                      Bệnh viện: <strong>{code.hospitalName}</strong> · Phạm vi: <span className="text-blue-700 font-semibold">{code.sections.join(', ')}</span>
                    </p>
                  </div>

                  {isActive && (
                    <Button
                      onClick={() => handleRevokeCode(code.id)}
                      size="sm"
                      variant="outline"
                      className="text-xs font-bold text-red-600 border-red-200 hover:bg-red-50 rounded-xl"
                    >
                      Thu hồi mã
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* SECTION 10 & 15: LINKED HOSPITALS & PATIENT ID MAPPING */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <Building2 className="w-5 h-5 text-indigo-600" />
          <span>Danh sách Bệnh viện đã liên kết & Ánh xạ Mã Bệnh nhân</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {linkedHospitals.map((h) => (
            <div key={h.id} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-3">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-bold text-slate-900 text-sm">{h.name}</h3>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 shrink-0">
                  {h.status}
                </span>
              </div>

              <div className="space-y-1 text-xs text-slate-600 border-t border-slate-100 pt-2">
                <div>
                  Mã bệnh nhân tại cơ sở: <strong className="font-mono text-blue-700">{h.externalPatientId}</strong>
                </div>
                <div>
                  Số lượt khám đã ghi nhận: <strong>{h.encountersCount} lượt</strong>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* STEPPER MODAL: TẠO MÃ CHIA SẺ (4 BƯỚC) */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="max-w-xl border-slate-200 rounded-3xl p-6 sm:p-8 space-y-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-slate-900 flex items-center gap-2">
              <Lock className="w-5 h-5 text-blue-600" />
              <span>Tạo Mã Chia Sẻ Hồ Sơ Y Tế</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Quy trình 4 bước thiết lập thời gian hiệu lực và phân quyền chia sẻ dữ liệu an toàn.
            </DialogDescription>
          </DialogHeader>

          {/* Stepper Indicator Banner */}
          <div className="grid grid-cols-4 gap-2 text-center text-xs font-bold border-b border-slate-100 pb-4">
            <div className={`p-2 rounded-xl border ${step === 1 ? 'bg-blue-600 text-white border-blue-600' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>
              1. Hiệu lực
            </div>
            <div className={`p-2 rounded-xl border ${step === 2 ? 'bg-blue-600 text-white border-blue-600' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>
              2. Phạm vi
            </div>
            <div className={`p-2 rounded-xl border ${step === 3 ? 'bg-blue-600 text-white border-blue-600' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>
              3. Nơi nhận
            </div>
            <div className={`p-2 rounded-xl border ${step === 4 ? 'bg-blue-600 text-white border-blue-600' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>
              4. Xác nhận
            </div>
          </div>

          {/* STEP 1 — CHỌN THỜI GIAN HIỆU LỰC */}
          {step === 1 && (
            <div className="space-y-4">
              <label className="block text-xs font-bold text-slate-700">
                Chọn thời gian hiệu lực cho mã chia sẻ:
              </label>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[5, 15, 30, 60].map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => setSelectedDurationMins(mins)}
                    className={`p-4 rounded-2xl border text-center transition cursor-pointer ${
                      selectedDurationMins === mins
                        ? 'border-blue-600 bg-blue-50/70 text-blue-900 font-extrabold ring-2 ring-blue-500/20'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 font-bold'
                    }`}
                  >
                    <div className="text-base">{mins} phút</div>
                    {mins === 15 && <span className="text-[10px] text-blue-600 font-bold block mt-0.5">Mặc định</span>}
                  </button>
                ))}
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-2 text-xs text-amber-900">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p>
                  <strong>Cảnh báo:</strong> Mã sẽ tự động hết hiệu lực ngay sau khi hết thời gian ({selectedDurationMins} phút). Bác sĩ hoặc bệnh viện không thể tiếp tục xem hồ sơ khi đã hết giờ.
                </p>
              </div>
            </div>
          )}

          {/* STEP 2 — CHỌN PHẠM VI DỮ LIỆU */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">
                  Chọn các danh mục dữ liệu được phép chia sẻ:
                </label>
                <p className="text-[11px] text-slate-500">Chỉ dữ liệu được chọn mới có thể được truy cập bằng mã này.</p>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {availableSections.map((sec) => {
                  const isChecked = selectedSections.includes(sec.id);
                  const Icon = sec.icon;
                  return (
                    <label
                      key={sec.id}
                      onClick={() => toggleSection(sec.id)}
                      className={`flex items-center justify-between p-3.5 rounded-2xl border cursor-pointer transition ${
                        isChecked
                          ? 'border-blue-600 bg-blue-50/60 font-bold text-blue-950'
                          : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium'
                      }`}
                    >
                      <div className="flex items-center gap-3 text-xs">
                        <Icon className={`w-4 h-4 ${isChecked ? 'text-blue-600' : 'text-slate-400'}`} />
                        <span>{sec.label}</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}}
                        className="w-4 h-4 accent-blue-600 rounded"
                      />
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 3 — GIỚI HẠN NƠI ĐƯỢC TRUY CẬP */}
          {step === 3 && (
            <div className="space-y-4">
              <label className="block text-xs font-bold text-slate-700">
                Giới hạn cơ sở y tế được phép truy cập:
              </label>

              <div className="space-y-3">
                <label
                  onClick={() => setHospitalAccessOption('SPECIFIC')}
                  className={`flex items-start gap-3 p-4 rounded-2xl border cursor-pointer transition ${
                    hospitalAccessOption === 'SPECIFIC'
                      ? 'border-blue-600 bg-blue-50/60 ring-2 ring-blue-500/20'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="hospOpt"
                    checked={hospitalAccessOption === 'SPECIFIC'}
                    onChange={() => {}}
                    className="mt-1 accent-blue-600"
                  />
                  <div className="space-y-1 text-xs">
                    <strong className="text-slate-900 font-extrabold block">Chỉ bệnh viện được chọn</strong>
                    <p className="text-slate-500">Giới hạn duy nhất một cơ sở y tế cụ thể được phép mở mã.</p>

                    {hospitalAccessOption === 'SPECIFIC' && (
                      <select
                        value={selectedHospitalName}
                        onChange={(e) => setSelectedHospitalName(e.target.value)}
                        className="mt-2 text-xs font-bold text-slate-900 bg-white p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 w-full"
                      >
                        {linkedHospitals.map((h) => (
                          <option key={h.id} value={h.name}>
                            🏥 {h.name}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </label>

                <label
                  onClick={() => setHospitalAccessOption('ANY')}
                  className={`flex items-start gap-3 p-4 rounded-2xl border cursor-pointer transition ${
                    hospitalAccessOption === 'ANY'
                      ? 'border-blue-600 bg-blue-50/60 ring-2 ring-blue-500/20'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="hospOpt"
                    checked={hospitalAccessOption === 'ANY'}
                    onChange={() => {}}
                    className="mt-1 accent-blue-600"
                  />
                  <div className="space-y-0.5 text-xs">
                    <strong className="text-slate-900 font-extrabold block">Bất kỳ bệnh viện nào có mã</strong>
                    <p className="text-slate-500">Cho phép bất kỳ Bác sĩ/Bệnh viện nào sở hữu mã Token được truy xuất.</p>
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* STEP 4 — XÁC NHẬN & TẠO MÃ */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3 text-xs">
                <h4 className="font-extrabold text-slate-900 text-sm border-b border-slate-200 pb-2">
                  Tóm tắt thiết lập mã chia sẻ
                </h4>

                <div className="flex justify-between">
                  <span className="text-slate-500">Bệnh nhân:</span>
                  <strong className="text-slate-900 font-bold">{selectedProfile?.fullName || 'Nguyễn Thị Minh Thư'}</strong>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-500">Thời gian hiệu lực:</span>
                  <strong className="text-emerald-700 font-bold">{selectedDurationMins} phút</strong>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-500">Bệnh viện được phép:</span>
                  <strong className="text-blue-700 font-bold">
                    {hospitalAccessOption === 'ANY' ? 'Bất kỳ bệnh viện nào có mã' : selectedHospitalName}
                  </strong>
                </div>

                <div className="space-y-1 pt-2 border-t border-slate-200">
                  <span className="text-slate-500 font-semibold block">Dữ liệu được phép chia sẻ ({selectedSections.length} danh mục):</span>
                  <div className="flex flex-wrap gap-1 pt-1">
                    {selectedSections.map((sec, idx) => (
                      <span key={idx} className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 text-[11px] font-bold">
                        ✓ {sec}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Stepper Control Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            {step > 1 ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep(step - 1)}
                className="text-xs font-bold rounded-xl"
              >
                Quay lại
              </Button>
            ) : (
              <div />
            )}

            {step < 4 ? (
              <Button
                type="button"
                onClick={() => setStep(step + 1)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl px-6"
              >
                Tiếp theo ➔
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleGenerateShareCode}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl px-6 py-2.5 shadow-md shadow-emerald-200 cursor-pointer"
              >
                [Tạo mã chia sẻ]
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* QR CODE MODAL DISPLAY */}
      <Dialog open={!!selectedQrCode} onOpenChange={() => setSelectedQrCode(null)}>
        <DialogContent className="max-w-sm text-center p-6 rounded-3xl space-y-4">
          <DialogHeader>
            <DialogTitle className="text-lg font-black text-slate-900">
              Mã QR Chia Sẻ Hồ Sơ Y Tế
            </DialogTitle>
          </DialogHeader>

          {selectedQrCode && (
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-2xl border-2 border-emerald-400 inline-block shadow-md">
                {/* SVG Mock QR Code */}
                <div className="w-48 h-48 bg-slate-900 text-white p-3 rounded-xl flex flex-col items-center justify-center space-y-2">
                  <QrCode className="w-32 h-32 text-emerald-400" />
                  <span className="font-mono text-xs font-bold text-emerald-300">{selectedQrCode.code}</span>
                </div>
              </div>

              <div className="text-xs text-slate-600 space-y-1 font-medium">
                <p>Bác sĩ hoặc Bệnh viện đưa camera để quét mã tra cứu</p>
                <p className="text-emerald-700 font-bold">Bệnh viện: {selectedQrCode.hospitalName}</p>
              </div>

              <Button
                onClick={() => {
                  navigator.clipboard.writeText(selectedQrCode.code);
                  toast.success('Đã sao chép chuỗi mã QR!');
                }}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl"
              >
                Sao chép mã QR
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
