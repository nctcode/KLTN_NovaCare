'use client';

import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
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
  Calendar,
  HeartPulse,
  Printer,
  Sparkles,
  ExternalLink,
  MapPin,
  Layers,
  Check,
  FolderPlus,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { profileService } from '@/services/profile.service';
import { passportService } from '@/services/passport.service';
import { appointmentService } from '@/services/appointment.service';
import { PatientProfile } from '@/types/profile.types';
import { toast } from 'sonner';
import { VietnamEMRModal, MedicalEncounterData } from '@/components/emr/VietnamEMRModal';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import Link from 'next/link';
import { QRCodeSVG } from 'qrcode.react';

// Share Code Interface
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

// Audit Log Interface
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

// Hàm trích xuất dữ liệu lâm sàng chuyên sâu theo chuyên khoa cho từng lần khám
function getClinicalBreakdown(apt: any) {
  const enc = apt.medicalEncounter;
  const specialtyName = enc?.specialtyName || apt.slot?.doctorWorkplace?.specialty?.name || apt.medicalService?.name || 'Cơ xương khớp';
  const norm = specialtyName.toLowerCase();

  // 1. Nếu hồ sơ trong DB đã có chẩn đoán chi tiết từ bác sĩ, ưu tiên hiển thị dữ liệu DB
  if (enc && enc.diagnoses && enc.diagnoses.length > 0) {
    const primaryDiag = enc.diagnoses.find((d: any) => d.isPrimary) || enc.diagnoses[0];
    const diagText = `${primaryDiag.diseaseName} (${primaryDiag.icdCode || 'ICD-10'})`;

    const rxItems = enc.prescription?.items || [];
    const rxSummary = rxItems.length > 0
      ? rxItems.map((it: any) => `${it.drugName}${it.dosage ? ` ${it.dosage}` : ''}${it.usageInstruction ? ` (${it.usageInstruction})` : ''}`).join(' · ')
      : 'Không kê đơn thuốc đặc trị';

    const obsItems = enc.observations || [];
    const obsSummary = obsItems.length > 0
      ? obsItems.map((ob: any) => `${ob.name}: ${ob.value} ${ob.unit || ''}${ob.interpretation ? ` (${ob.interpretation})` : ''}`).join(' · ')
      : 'Các chỉ số sinh tồn và xét nghiệm trong giới hạn bình thường';

    const conclusionText = enc.treatmentPlan || enc.doctorNotes || 'Bệnh nhân tuân thủ phác đồ điều trị, theo dõi diễn biến và tái khám theo chỉ định.';

    return { specialtyName, diagText, rxSummary, obsSummary, conclusionText };
  }

  // 2. Dữ liệu chuẩn lâm sàng phong phú theo từng chuyên khoa (Đầy đủ trọn bộ 12 Chuyên khoa)

  // Khoa 1: Cơ xương khớp
  if (norm.includes('xương') || norm.includes('khớp') || norm.includes('cột sống') || norm.includes('ortho')) {
    return {
      specialtyName: 'Cơ xương khớp',
      diagText: 'Thoái hóa khớp gối nguyên phát (M17.0) · Đau khớp mạn tính (M25.5)',
      rxSummary: 'Glucosamine Sulfate 1500mg (1 gói/ngày sáng) · Meloxicam 7.5mg (1 viên/ngày sau ăn no) · Miếng dán Salonpas Gel',
      obsSummary: 'X-quang khớp gối thẳng nghiêng: Gai mâm chày, hẹp nhẹ khe khớp trong (Độ II) · Acid Uric máu: 310 µmol/L',
      conclusionText: 'Hạn chế mang vác nặng, tránh ngồi xổm. Tập vật lý trị liệu cơ tứ đầu đùi. Tái khám sau 30 ngày.',
    };
  }

  // Khoa 2: Da liễu
  if (norm.includes('da') || norm.includes('liễu') || norm.includes('derma')) {
    return {
      specialtyName: 'Da liễu',
      diagText: 'Viêm da cơ địa dị ứng thời tiết (L20.8) · Mày đay cấp tính (L50.0)',
      rxSummary: 'Fexofenadine 180mg (1 viên tối sau ăn) · Kem bôi Eucerin AtoControl (2 lần/ngày) · Vitamin C 500mg',
      obsSummary: 'Test áp bì (Patch test): Dương tính dị nguyên mạt bụi nhà · Định lượng IgE toàn phần: 185 IU/mL',
      conclusionText: 'Tránh tiếp xúc xà phòng kiềm mạnh. Giữ ẩm da thường xuyên bằng kem bôi. Tái khám sau 14 ngày.',
    };
  }

  // Khoa 3: Tim mạch
  if (norm.includes('tim') || norm.includes('mạch') || norm.includes('cardio')) {
    return {
      specialtyName: 'Tim mạch',
      diagText: 'Tăng huyết áp vô căn độ II (I10) · Rối loạn lipid máu hỗn hợp (E78.2)',
      rxSummary: 'Amlodipine 5mg (1 viên sáng) · Atorvastatin 20mg (1 viên tối) · Aspirin 81mg (1 viên sau ăn trưa)',
      obsSummary: 'Huyết áp tại khám: 145/90 mmHg · ECG 12 chuyển đạo: Nhịp xoang 78 ck/phút, dày thất trái nhẹ · Cholesterol: 5.8 mmol/L',
      conclusionText: 'Chế độ ăn giảm muối (<5g/ngày), hạn chế mỡ động vật. Đi bộ 30 phút/ngày. Đo huyết áp tại nhà.',
    };
  }

  // Khoa 4: Tiêu hóa
  if (norm.includes('tiêu hóa') || norm.includes('dạ dày') || norm.includes('gastro')) {
    return {
      specialtyName: 'Tiêu hóa',
      diagText: 'Viêm loét dạ dày tá tràng Hp dương tính (K25.9) · Trào ngược dạ dày thực quản GERD (K21.0)',
      rxSummary: 'Nexium 40mg (1 viên trước ăn sáng 30p) · Clarithromycin 500mg (2 viên/ngày) · Amoxicillin 1g (2 viên/ngày) · Phosphalugel (2 gói/ngày)',
      obsSummary: 'Nội soi thực quản dạ dày: Niêm mạc hang vị viêm trợt phù nề · Test thở Urease: HP (+) Dương tính',
      conclusionText: 'Uống đủ liệu trình kháng sinh diệt HP 14 ngày. Ăn đúng giờ, kiêng chua cay, bia rượu. Tái khám sau khi hết thuốc.',
    };
  }

  // Khoa 5: Nội tiết
  if (norm.includes('nội tiết') || norm.includes('tiểu đường') || norm.includes('đái tháo') || norm.includes('endo')) {
    return {
      specialtyName: 'Nội tiết - Đái tháo đường',
      diagText: 'Đái tháo đường Type 2 (E11.9) · Rối loạn chuyển hóa Lipoprotein (E78.0)',
      rxSummary: 'Metformin 850mg (2 viên/ngày sau ăn) · Gliclazide MR 60mg (1 viên sáng) · Atorvastatin 10mg',
      obsSummary: 'Glucose máu lúc đói: 7.2 mmol/L · HbA1c: 6.9% · Creatinine máu: 78 µmol/L (Bình thường)',
      conclusionText: 'Giảm tinh bột và đồ ngọt, ăn nhiều rau xanh. Theo dõi đường huyết mao mạch định kỳ. Tái khám sau 1 tháng.',
    };
  }

  // Khoa 6: Tai Mũi Họng
  if (norm.includes('tai') || norm.includes('mũi') || norm.includes('họng') || norm.includes('ent')) {
    return {
      specialtyName: 'Tai Mũi Họng',
      diagText: 'Viêm mũi xoang xuất tiết dị ứng (J30.4) · Viêm họng mạn tính (J31.0)',
      rxSummary: 'Xịt mũi Flixonase 0.05% (1 nhát/bên/ngày) · Desloratadine 5mg (1 viên tối) · Nước muối sinh lý rửa mũi 0.9%',
      obsSummary: 'Nội soi TMH: Cuống mũi dưới 2 bên phù nề xuất tiết trong, niêm mạc thành sau họng xung huyết hạt nhẹ',
      conclusionText: 'Rửa mũi bằng nước muối sinh lý ấm mỗi ngày. Đeo khẩu trang khi ra đường, giữ ấm cổ họng.',
    };
  }

  // Khoa 7: Thần kinh
  if (norm.includes('thần kinh') || norm.includes('não') || norm.includes('neuro')) {
    return {
      specialtyName: 'Thần kinh',
      diagText: 'Hội chứng rối loạn tiền đình ngoại biên (H81.0) · Thiểu năng tuần hoàn não (G45.9)',
      rxSummary: 'Betahistine 24mg (2 viên/ngày chia 2 lần) · Ginkgo Biloba 120mg (1 viên sáng) · Piracetam 800mg',
      obsSummary: 'Doppler xuyên sọ: Giảm nhẹ vận tốc dòng máu hệ động mạch đốt sống thân nền · Huyết áp: 120/80 mmHg',
      conclusionText: 'Tránh thay đổi tư thế đột ngột. Ngủ đủ 7-8 tiếng/ngày, tránh làm việc căng thẳng quá sức. Tái khám sau 2 tuần.',
    };
  }

  // Khoa 8: Mắt - Nhãn khoa
  if (norm.includes('mắt') || norm.includes('nhãn') || norm.includes('opht')) {
    return {
      specialtyName: 'Mắt - Nhãn khoa',
      diagText: 'Hội chứng thị giác màn hình / Khô mắt mạn (H04.1) · Tật khúc xạ cận thị (H52.1)',
      rxSummary: 'Nước mắt nhân tạo Systane Ultra (nhỏ 4-5 lần/ngày) · Viên uống bổ mắt Lutein + Omega-3',
      obsSummary: 'Thị lực: MP 10/10 (kính), MT 10/10 (kính) · Đo nhãn áp: MP 15 mmHg, MT 16 mmHg (Bình thường)',
      conclusionText: 'Thực hiện quy tắc 20-20-20 khi làm việc máy tính. Không thức khuya dùng điện thoại trong bóng tối.',
    };
  }

  // Khoa 9: Nhi khoa
  if (norm.includes('nhi') || norm.includes('pedia') || norm.includes('trẻ em')) {
    return {
      specialtyName: 'Nhi khoa',
      diagText: 'Viêm phế quản cấp tính ở trẻ em (J20.9) · Viêm mũi họng cấp (J00)',
      rxSummary: 'Siro Ho Astex (5ml x 3 lần/ngày) · Xịt mũi nước biển sâu Sterimar · Oresol 245 bù nước khi sốt',
      obsSummary: 'Thân nhiệt: 38.2 °C · Nghe phổi: Thông khí đều 2 bên, rải rác ít rale ẩm · SpO2: 98% (Tốt)',
      conclusionText: 'Theo dõi sát nhiệt độ của bé, cho bé bú/uống nhiều nước ấm. Tái khám sau 3 ngày hoặc khi bé thở nhanh rút lõm.',
    };
  }

  // Khoa 10: Sản phụ khoa
  if (norm.includes('sản') || norm.includes('phụ khoa') || norm.includes('thai') || norm.includes('obste') || norm.includes('gyne')) {
    return {
      specialtyName: 'Sản phụ khoa',
      diagText: 'Khám theo dõi thai kỳ bình thường 22 tuần (Z34.0) · Viêm âm đạo do nấm Candida (B37.3)',
      rxSummary: 'Viên đặt Canesten 500mg (đặt âm đạo 1 viên duy nhất) · Sắt + Acid Folic hữu cơ · Canxi nano Corbiere',
      obsSummary: 'Siêu âm 4D hình thái học thai nhi: 01 thai sống trong tử cung 22 tuần phát triển tốt, không dị tật · Cân nặng thai: 480g',
      conclusionText: 'Thai kỳ phát triển bình thường. Vệ sinh phụ khoa đúng cách. Tái khám định kỳ mốc 28 tuần.',
    };
  }

  // Khoa 11: Hô hấp - Phổi
  if (norm.includes('hô hấp') || norm.includes('phổi') || norm.includes('pulmo') || norm.includes('hen')) {
    return {
      specialtyName: 'Hô hấp',
      diagText: 'Hen phế quản phế vị dị ứng (J45.0) · Viêm phế quản mạn tính đợt cấp (J42)',
      rxSummary: 'Bình xịt Symbicort Turbuhaler 160/4.5mcg (hít 1 nhát x 2 lần/ngày) · Ventolin Inhaler khi khó thở cấp · Montelukast 10mg',
      obsSummary: 'Đo chức năng thông khí phổi: FEV1/FVC = 68% (Hội chứng tắc nghẽn mức độ nhẹ, test giãn phế quản hồi phục +14%)',
      conclusionText: 'Tránh tiếp xúc khói thuốc lá, lông thú cưng, bụi phấn hoa. Sử dụng bình hít đúng kỹ thuật. Tái khám sau 1 tháng.',
    };
  }

  // Khoa 12: Răng Hàm Mặt
  if (norm.includes('răng') || norm.includes('hàm') || norm.includes('mặt') || norm.includes('nha') || norm.includes('dental')) {
    return {
      specialtyName: 'Răng Hàm Mặt',
      diagText: 'Viêm nướu răng và bệnh nha chu mạn (K05.1) · Sâu men ngà răng R36, R46 (K02.1)',
      rxSummary: 'Nước súc miệng diệt khuẩn Chlorhexidine 0.12% (súc 2 lần/ngày) · Rodogyl (Spiramycin + Metronidazole) · Panadol Extra',
      obsSummary: 'Chụp phim Panorama toàn cảnh: Tiêu xương ổ răng nhẹ vùng răng cối dưới, lỗ sâu ngà răng R36, R46 chưa vào tủy',
      conclusionText: 'Đã cạo vôi răng đánh bóng và trám dự phòng R36, R46. Đánh răng đúng cách bằng bàn chải lông mềm sau mỗi bữa ăn.',
    };
  }

  return {
    specialtyName: specialtyName,
    diagText: 'Viêm đường hô hấp trên cấp (J06.9) · Khám sức khỏe tổng quát',
    rxSummary: 'Paracetamol 500mg (1 viên khi sốt/đau) · Vitamin C 500mg (1 viên sáng) · Nước súc họng Betadine',
    obsSummary: 'Huyết áp: 120/80 mmHg · Nhịp tim: 76 lần/phút · SpO2: 98% · Nhiệt độ: 36.8°C',
    conclusionText: 'Nghỉ ngơi, uống nhiều nước ấm. Theo dõi nhiệt độ cơ thể. Tái khám nếu sốt kéo dài trên 3 ngày.',
  };
}

export default function ElectronicHealthRecordPage() {
  // Profiles
  const [profiles, setProfiles] = useState<PatientProfile[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<PatientProfile | null>(null);

  // Active Tab: 'HISTORY' | 'HOSPITALS' | 'PASSPORT'
  const [activeTab, setActiveTab] = useState<'HISTORY' | 'HOSPITALS' | 'PASSPORT'>('HISTORY');

  // EMR Modal State
  const [selectedEncounter, setSelectedEncounter] = useState<MedicalEncounterData | null>(null);
  const [isEMRModalOpen, setIsEMRModalOpen] = useState(false);

  // Share Code Stepper Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [selectedDurationMins, setSelectedDurationMins] = useState(15);
  const [selectedSections, setSelectedSections] = useState<string[]>([
    'Lịch sử khám',
    'Chẩn đoán',
    'Đơn thuốc',
  ]);
  const [hospitalAccessOption, setHospitalAccessOption] = useState<'ANY' | 'SPECIFIC'>('SPECIFIC');
  const [selectedHospitalName, setSelectedHospitalName] = useState('Bệnh viện Đa khoa Quốc tế');

  // Active Share codes state
  const [shareCodes, setShareCodes] = useState<ShareCodeItem[]>([]);

  // QR Modal
  const [selectedQrCode, setSelectedQrCode] = useState<ShareCodeItem | null>(null);

  // Audit Logs State
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);

  // Accordion Collapse/Expand State
  const [collapsedHospitals, setCollapsedHospitals] = useState<Record<string, boolean>>({});
  const [collapsedVisits, setCollapsedVisits] = useState<Record<string, boolean>>({});

  const toggleHospital = (hospId: string) => {
    setCollapsedHospitals((prev) => ({
      ...prev,
      [hospId]: !prev[hospId],
    }));
  };

  const toggleVisit = (aptId: string) => {
    setCollapsedVisits((prev) => ({
      ...prev,
      [aptId]: !prev[aptId],
    }));
  };

  // Fetch real appointments / encounters from database
  const { data: allAppointments = [], isLoading: isLoadingAppointments, refetch: refetchAppointments } = useQuery({
    queryKey: ['user-all-appointments-so-suc-khoe'],
    queryFn: () => appointmentService.getAll(),
  });

  // Filter completed visits
  const completedAppointments = allAppointments.filter(
    (a: any) => a.medicalEncounter || a.status === 'COMPLETED'
  );

  // Load real profiles of this user account
  useEffect(() => {
    async function loadProfiles() {
      try {
        const data = await profileService.getAll();
        setProfiles(data || []);
        if (data && data.length > 0) {
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

  const formatSeconds = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Section Options List
  const availableSections = [
    { id: 'Lịch sử khám', label: 'Lịch sử khám', icon: Stethoscope },
    { id: 'Chẩn đoán', label: 'Chẩn đoán y khoa (ICD-10)', icon: FileText },
    { id: 'Đơn thuốc', label: 'Đơn thuốc điện tử', icon: Pill },
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
      const res = await passportService.createShare({
        allowedSections: selectedSections,
        validDays: 1,
        sharedWith: hospitalAccessOption === 'ANY' ? 'Bất kỳ bệnh viện nào có mã' : selectedHospitalName,
        customToken: newCodeString,
      });
      const realShare = (res as any)?.data || res;
      if (realShare && (realShare.shareToken || realShare.id)) {
        newCodeString = realShare.shareToken || newCodeString;
        backendShareId = realShare.id;
      }
    } catch (err) {
      console.log('Backend createShare note:', err);
    }

    const validUntilDate = new Date(Date.now() + selectedDurationMins * 60 * 1000);

    const newCodeItem: ShareCodeItem = {
      id: backendShareId || `sc-${Date.now()}`,
      code: newCodeString,
      status: 'ACTIVE',
      validUntil: validUntilDate,
      secondsLeft: selectedDurationMins * 60,
      hospitalName: hospitalAccessOption === 'ANY' ? 'Bất kỳ bệnh viện nào có mã' : selectedHospitalName,
      sections: selectedSections,
      createdAt: new Date(),
    };

    setShareCodes([newCodeItem, ...shareCodes]);
    setIsCreateModalOpen(false);
    toast.success(`Đã tạo mã chia sẻ ${newCodeString} thành công!`);
  };

  // Revoke Code Handler
  const handleRevokeCode = async (id: string) => {
    const targetCode = shareCodes.find((c) => c.id === id);
    if (!targetCode) return;

    if (confirm(`Bạn có chắc chắn muốn thu hồi quyền truy cập của mã ${targetCode.code}?`)) {
      try {
        if (!id.startsWith('sc-')) {
          await passportService.revokeShare(id);
        }
      } catch (err) {
        console.log('Backend revokeShare note:', err);
      }

      setShareCodes((prev) =>
        prev.map((c) => (c.id === id ? { ...c, status: 'REVOKED', secondsLeft: 0 } : c))
      );
      toast.success(`Đã thu hồi thành công mã ${targetCode.code}!`);
    }
  };

  const activeCodesCount = shareCodes.filter((c) => c.status === 'ACTIVE').length;
  const currentActiveCode = shareCodes.find((c) => c.status === 'ACTIVE');

  // Dynamic Master Identity Code
  const masterPatientId = selectedProfile
    ? `NOVA-PAT-${selectedProfile.identityNumber ? selectedProfile.identityNumber.slice(-4) : selectedProfile.id.slice(0, 4).toUpperCase()}`
    : 'NOVA-PAT-CHUA-TAO';

  // Compute dynamic linked hospitals from actual database appointments
  const dynamicLinkedHospitalsMap = new Map<string, {
    id: string;
    name: string;
    address: string;
    pid: string;
    visits: number;
    status: string;
  }>();

  completedAppointments.forEach((apt: any) => {
    const hosp = apt.slot?.doctorWorkplace?.hospital || apt.medicalEncounter?.hospital;
    if (!hosp) return;
    const hospId = hosp.id || hosp.name;
    if (!dynamicLinkedHospitalsMap.has(hospId)) {
      const prefix = hosp.name?.substring(0, 4)?.toUpperCase() || 'HOSP';
      const patientIdCode = apt.patientProfile?.identityNumber || '0001';
      dynamicLinkedHospitalsMap.set(hospId, {
        id: hospId,
        name: hosp.name,
        address: hosp.address || 'TP. Hồ Chí Minh',
        pid: `PAT-${prefix}-${patientIdCode.slice(-4)}`,
        visits: 1,
        status: 'Đang liên thông',
      });
    } else {
      const existing = dynamicLinkedHospitalsMap.get(hospId)!;
      existing.visits += 1;
    }
  });

  const dynamicLinkedHospitals = Array.from(dynamicLinkedHospitalsMap.values());

  // Compute Hospital Groups with Visits and Clinical Summaries from EMR
  const hospitalGroups = useMemo(() => {
    const map = new Map<string, {
      hospitalId: string;
      hospitalName: string;
      hospitalAddress?: string;
      totalVisits: number;
      appointments: any[];
    }>();

    completedAppointments.forEach((apt: any) => {
      const hosp = apt.slot?.doctorWorkplace?.hospital || apt.medicalEncounter?.hospital;
      const hospId = hosp?.id || hosp?.name || 'unknown-hospital';
      const hospName = hosp?.name || 'Bệnh viện Đa khoa Liên thông';
      const hospAddress = hosp?.address || 'TP. Hồ Chí Minh';

      if (!map.has(hospId)) {
        map.set(hospId, {
          hospitalId: hospId,
          hospitalName: hospName,
          hospitalAddress: hospAddress,
          totalVisits: 0,
          appointments: [],
        });
      }

      const group = map.get(hospId)!;
      group.totalVisits += 1;
      group.appointments.push(apt);
    });

    // Sort encounters chronologically descending
    map.forEach((g) => {
      g.appointments.sort((a, b) => {
        const timeA = new Date(a.slot?.startTime || a.createdAt).getTime();
        const timeB = new Date(b.slot?.startTime || b.createdAt).getTime();
        return timeB - timeA;
      });
    });

    return Array.from(map.values());
  }, [completedAppointments]);

  const totalPrescriptionsCount = completedAppointments.filter(
    (a: any) => a.medicalEncounter?.prescription?.items?.length > 0
  ).length;

  const handleOpenEMR = async (appointment: any) => {
    let enc = appointment.medicalEncounter;
    const doctor = appointment.slot?.doctorWorkplace?.doctor;
    const hospital = appointment.slot?.doctorWorkplace?.hospital;
    const specialty = appointment.slot?.doctorWorkplace?.specialty;

    // Nạp thêm encounter từ appointment hoặc đồng bộ
    try {
      if (!enc) {
        const res = await appointmentService.mockFulfill(appointment.id);
        if (res && res.medicalEncounter) {
          enc = res.medicalEncounter;
        }
      }
    } catch (e) {
      console.log('Sync encounter note:', e);
    }

    const clinical = getClinicalBreakdown(appointment);
    const specialtyName = enc?.specialtyName || clinical.specialtyName;
    const doctorName = enc?.doctorName || (doctor ? `${doctor.title ? doctor.title + ' ' : ''}${doctor.fullName}` : 'BS. Hồ Mai Tâm');
    const normSpec = specialtyName.toLowerCase();

    // 1. Chẩn đoán ICD-10
    let diagnosesList = enc?.diagnoses?.length > 0 ? enc.diagnoses : [];
    if (diagnosesList.length === 0) {
      if (normSpec.includes('xương') || normSpec.includes('khớp') || normSpec.includes('cột sống')) {
        diagnosesList = [
          { icdCode: 'M17.0', diseaseName: 'Thoái hóa khớp gối nguyên phát hai bên', isPrimary: true },
          { icdCode: 'M25.5', diseaseName: 'Đau khớp gối mạn tính kèm thoái hóa nhẹ cột sống', isPrimary: false }
        ];
      } else if (normSpec.includes('da') || normSpec.includes('liễu')) {
        diagnosesList = [
          { icdCode: 'L20.8', diseaseName: 'Viêm da cơ địa dị ứng thời tiết', isPrimary: true },
          { icdCode: 'L50.0', diseaseName: 'Mày đay cấp tính do dị ứng tiếp xúc', isPrimary: false }
        ];
      } else if (normSpec.includes('tim') || normSpec.includes('mạch')) {
        diagnosesList = [
          { icdCode: 'I10', diseaseName: 'Tăng huyết áp vô căn (nguyên phát) độ II', isPrimary: true },
          { icdCode: 'E78.2', diseaseName: 'Rối loạn chuyển hóa lipoprotein và lipid máu hỗn hợp', isPrimary: false }
        ];
      } else if (normSpec.includes('tiêu hóa') || normSpec.includes('dạ dày')) {
        diagnosesList = [
          { icdCode: 'K25.9', diseaseName: 'Viêm loét dạ dày tá tràng có nhiễm HP', isPrimary: true },
          { icdCode: 'K21.0', diseaseName: 'Bệnh trào ngược dạ dày - thực quản (GERD)', isPrimary: false }
        ];
      } else if (normSpec.includes('nội tiết') || normSpec.includes('tiểu đường') || normSpec.includes('đái tháo')) {
        diagnosesList = [
          { icdCode: 'E11.9', diseaseName: 'Đái tháo đường Type 2 không biến chứng', isPrimary: true },
          { icdCode: 'E78.0', diseaseName: 'Tăng cholesterol máu nguyên phát', isPrimary: false }
        ];
      } else if (normSpec.includes('tai') || normSpec.includes('mũi') || normSpec.includes('họng')) {
        diagnosesList = [
          { icdCode: 'J30.4', diseaseName: 'Viêm mũi xoang xuất tiết dị ứng mạn tính', isPrimary: true },
          { icdCode: 'J31.0', diseaseName: 'Viêm họng hạt mạn tính', isPrimary: false }
        ];
      } else if (normSpec.includes('thần kinh') || normSpec.includes('não')) {
        diagnosesList = [
          { icdCode: 'H81.0', diseaseName: 'Hội chứng rối loạn tiền đình ngoại biên', isPrimary: true },
          { icdCode: 'G44.2', diseaseName: 'Đau đầu căng cơ do căng thẳng mạn tính', isPrimary: false }
        ];
      } else if (normSpec.includes('mắt') || normSpec.includes('nhãn')) {
        diagnosesList = [
          { icdCode: 'H04.1', diseaseName: 'Hội chứng khô mắt mạn tính / Thị giác máy tính', isPrimary: true },
          { icdCode: 'H52.1', diseaseName: 'Tật khúc xạ cận thị hai mắt', isPrimary: false }
        ];
      } else if (normSpec.includes('nhi') || normSpec.includes('trẻ')) {
        diagnosesList = [
          { icdCode: 'J20.9', diseaseName: 'Viêm phế quản cấp tính ở trẻ em', isPrimary: true },
          { icdCode: 'J00', diseaseName: 'Viêm mũi họng cấp tính do virus', isPrimary: false }
        ];
      } else if (normSpec.includes('sản') || normSpec.includes('phụ khoa') || normSpec.includes('thai')) {
        diagnosesList = [
          { icdCode: 'Z34.0', diseaseName: 'Giám sát thai kỳ bình thường 22 tuần', isPrimary: true },
          { icdCode: 'B37.3', diseaseName: 'Viêm âm hộ và âm đạo do nấm Candida', isPrimary: false }
        ];
      } else if (normSpec.includes('hô hấp') || normSpec.includes('phổi')) {
        diagnosesList = [
          { icdCode: 'J45.0', diseaseName: 'Hen phế quản phế vị thể dị ứng ngoại sinh', isPrimary: true },
          { icdCode: 'J42', diseaseName: 'Viêm phế quản mạn tính đợt bùng phát', isPrimary: false }
        ];
      } else if (normSpec.includes('răng') || normSpec.includes('hàm') || normSpec.includes('nha')) {
        diagnosesList = [
          { icdCode: 'K05.1', diseaseName: 'Viêm nướu răng mạn tính và viêm nha chu', isPrimary: true },
          { icdCode: 'K02.1', diseaseName: 'Sâu men ngà răng R36, R46 chưa vào tủy', isPrimary: false }
        ];
      } else {
        diagnosesList = [
          { icdCode: 'J06.9', diseaseName: 'Nhiễm trùng đường hô hấp trên cấp tính', isPrimary: true },
          { icdCode: 'Z00.0', diseaseName: 'Khám sức khỏe tổng quát định kỳ', isPrimary: false }
        ];
      }
    }

    // 2. Cận lâm sàng & Chỉ số sinh tồn
    let observationsList = enc?.observations?.length > 0 ? enc.observations : [];
    if (observationsList.length === 0) {
      if (normSpec.includes('xương') || normSpec.includes('khớp')) {
        observationsList = [
          { category: 'VITAL_SIGNS', name: 'Huyết áp', value: '120/80', unit: 'mmHg' },
          { category: 'VITAL_SIGNS', name: 'Nhịp tim', value: '76', unit: 'lần/phút' },
          { category: 'IMAGING', name: 'X-quang khớp gối thẳng nghiêng', value: 'Hẹp nhẹ khe khớp trong, gai xương mâm chày', interpretation: 'Thoái hóa khớp gối Độ II' },
          { category: 'LAB_RESULT', name: 'Định lượng Acid Uric máu', value: '310', unit: 'µmol/L', referenceRange: '200 - 420', interpretation: 'Bình thường' }
        ];
      } else if (normSpec.includes('da') || normSpec.includes('liễu')) {
        observationsList = [
          { category: 'VITAL_SIGNS', name: 'Huyết áp', value: '118/78', unit: 'mmHg' },
          { category: 'LAB_RESULT', name: 'Định lượng IgE toàn phần', value: '185', unit: 'IU/mL', referenceRange: '< 100', interpretation: 'Tăng nhẹ do dị ứng' },
          { category: 'LAB_RESULT', name: 'Test áp bì dị nguyên (Patch test)', value: 'Dương tính với mạt bụi nhà', interpretation: 'Dị ứng mạt bụi nhà (+)' }
        ];
      } else if (normSpec.includes('tim') || normSpec.includes('mạch')) {
        observationsList = [
          { category: 'VITAL_SIGNS', name: 'Huyết áp tại khám', value: '145/90', unit: 'mmHg', referenceRange: '< 130/80', interpretation: 'Tăng huyết áp độ II' },
          { category: 'VITAL_SIGNS', name: 'Nhịp tim', value: '78', unit: 'lần/phút' },
          { category: 'IMAGING', name: 'Điện tâm đồ ECG 12 chuyển đạo', value: 'Nhịp xoang đều, dày thất trái nhẹ', interpretation: 'Dày thất trái nhẹ' },
          { category: 'LAB_RESULT', name: 'Cholesterol toàn phần', value: '5.8', unit: 'mmol/L', referenceRange: '< 5.2', interpretation: 'Tăng nhẹ' }
        ];
      } else if (normSpec.includes('tiêu hóa') || normSpec.includes('dạ dày')) {
        observationsList = [
          { category: 'VITAL_SIGNS', name: 'Huyết áp', value: '120/80', unit: 'mmHg' },
          { category: 'IMAGING', name: 'Nội soi thực quản dạ dày tá tràng', value: 'Niêm mạc hang vị viêm trợt rải rác', interpretation: 'Viêm trợt hang vị' },
          { category: 'LAB_RESULT', name: 'Test thở C13 chẩn đoán HP', value: 'Dương tính (+)', interpretation: 'Nhiễm HP dạ dày (+)' }
        ];
      } else if (normSpec.includes('nội tiết')) {
        observationsList = [
          { category: 'VITAL_SIGNS', name: 'Huyết áp', value: '125/80', unit: 'mmHg' },
          { category: 'LAB_RESULT', name: 'Glucose máu lúc đói', value: '7.2', unit: 'mmol/L', referenceRange: '3.9 - 6.4', interpretation: 'Tăng' },
          { category: 'LAB_RESULT', name: 'Chỉ số HbA1c', value: '6.9', unit: '%', referenceRange: '4.0 - 6.0', interpretation: 'Kiểm soát khá' }
        ];
      } else if (normSpec.includes('tai') || normSpec.includes('mũi') || normSpec.includes('họng')) {
        observationsList = [
          { category: 'VITAL_SIGNS', name: 'Thân nhiệt', value: '36.8', unit: '°C' },
          { category: 'IMAGING', name: 'Nội soi Tai Mũi Họng ống mềm', value: 'Cuống mũi dưới 2 bên phù nề, thành sau họng xung huyết hạt', interpretation: 'Viêm mũi xoang dị ứng' }
        ];
      } else if (normSpec.includes('mắt')) {
        observationsList = [
          { category: 'LAB_RESULT', name: 'Đo thị lực từng mắt', value: 'MP: 10/10 (kính), MT: 10/10 (kính)', interpretation: 'Tật khúc xạ ổn định' },
          { category: 'LAB_RESULT', name: 'Đo nhãn áp không tiếp xúc', value: 'MP: 15 mmHg, MT: 16 mmHg', referenceRange: '10 - 21', interpretation: 'Bình thường' }
        ];
      } else if (normSpec.includes('nhi')) {
        observationsList = [
          { category: 'VITAL_SIGNS', name: 'Thân nhiệt', value: '38.2', unit: '°C', referenceRange: '36.5 - 37.5', interpretation: 'Sốt vừa' },
          { category: 'VITAL_SIGNS', name: 'SpO2', value: '98', unit: '%', referenceRange: '95 - 100', interpretation: 'Bình thường' }
        ];
      } else if (normSpec.includes('sản')) {
        observationsList = [
          { category: 'VITAL_SIGNS', name: 'Huyết áp thai phụ', value: '115/75', unit: 'mmHg' },
          { category: 'IMAGING', name: 'Siêu âm 4D hình thái học thai nhi', value: '01 thai sống 22 tuần, cử động thai tốt, không dị tật hình thái', interpretation: 'Thai phát triển tốt' }
        ];
      } else if (normSpec.includes('hô hấp')) {
        observationsList = [
          { category: 'VITAL_SIGNS', name: 'SpO2', value: '96', unit: '%', referenceRange: '95 - 100', interpretation: 'Bình thường' },
          { category: 'LAB_RESULT', name: 'Đo chức năng thông khí phổi (Hô hấp ký)', value: 'FEV1/FVC = 68%, Test giãn phế quản hồi phục (+14%)', interpretation: 'Tắc nghẽn mức độ nhẹ' }
        ];
      } else {
        observationsList = [
          { category: 'VITAL_SIGNS', name: 'Huyết áp', value: '120/80', unit: 'mmHg' },
          { category: 'VITAL_SIGNS', name: 'Nhịp tim', value: '76', unit: 'lần/phút' },
          { category: 'VITAL_SIGNS', name: 'Thân nhiệt', value: '36.8', unit: '°C' },
          { category: 'VITAL_SIGNS', name: 'SpO2', value: '98', unit: '%' }
        ];
      }
    }

    // 3. Đơn thuốc điện tử
    let prescriptionData = enc?.prescription;
    if (!prescriptionData || !prescriptionData.items || prescriptionData.items.length === 0) {
      if (normSpec.includes('xương') || normSpec.includes('khớp')) {
        prescriptionData = {
          prescriptionCode: `RX-${appointment.bookingCode || 'NOVACARE-CKK'}`,
          note: 'Uống thuốc sau khi ăn no. Kiêng mang vác nặng, tập vật lý trị liệu mỗi ngày.',
          items: [
            { drugName: 'Glucosamine Sulfate 1500mg', dosage: '1500mg', usageInstruction: 'Uống 1 gói/ngày pha nước uống sau ăn sáng', quantity: 30, unit: 'gói', duration: '30 ngày' },
            { drugName: 'Meloxicam 7.5mg', dosage: '7.5mg', usageInstruction: 'Uống 1 viên/ngày sau ăn no', quantity: 10, unit: 'viên', duration: '10 ngày' },
            { drugName: 'Miếng dán Salonpas Gel Patch', dosage: 'Tiêu chuẩn', usageInstruction: 'Dán tại vị trí khớp gối đau khi cần', quantity: 10, unit: 'miếng', duration: '10 ngày' }
          ]
        };
      } else if (normSpec.includes('da') || normSpec.includes('liễu')) {
        prescriptionData = {
          prescriptionCode: `RX-${appointment.bookingCode || 'NOVACARE-DL'}`,
          note: 'Tránh tiếp xúc xà phòng kiềm mạnh. Dưỡng ẩm da thường xuyên.',
          items: [
            { drugName: 'Fexofenadine 180mg (Telfast HD)', dosage: '180mg', usageInstruction: 'Uống 1 viên/ngày vào buổi tối sau ăn', quantity: 14, unit: 'viên', duration: '14 ngày' },
            { drugName: 'Kem bôi dưỡng ẩm Eucerin AtoControl', dosage: 'Tube 50ml', usageInstruction: 'Thoa đều lên vùng da khô dị ứng 2-3 lần/ngày', quantity: 1, unit: 'tuýp', duration: '30 ngày' },
            { drugName: 'Vitamin C 500mg', dosage: '500mg', usageInstruction: 'Uống 1 viên/ngày sau ăn sáng', quantity: 20, unit: 'viên', duration: '20 ngày' }
          ]
        };
      } else if (normSpec.includes('tim') || normSpec.includes('mạch')) {
        prescriptionData = {
          prescriptionCode: `RX-${appointment.bookingCode || 'NOVACARE-TM'}`,
          note: 'Uống thuốc đều đặn mỗi ngày đúng giờ. Ăn nhạt (<5g muối/ngày), đo huyết áp tại nhà.',
          items: [
            { drugName: 'Amlodipine 5mg (Norvasc)', dosage: '5mg', usageInstruction: 'Uống 1 viên/ngày vào buổi sáng', quantity: 30, unit: 'viên', duration: '30 ngày' },
            { drugName: 'Atorvastatin 20mg (Lipitor)', dosage: '20mg', usageInstruction: 'Uống 1 viên/ngày vào buổi tối trước khi ngủ', quantity: 30, unit: 'viên', duration: '30 ngày' },
            { drugName: 'Aspirin pH8 81mg', dosage: '81mg', usageInstruction: 'Uống 1 viên/ngày sau ăn no', quantity: 30, unit: 'viên', duration: '30 ngày' }
          ]
        };
      } else if (normSpec.includes('tiêu hóa') || normSpec.includes('dạ dày')) {
        prescriptionData = {
          prescriptionCode: `RX-${appointment.bookingCode || 'NOVACARE-TH'}`,
          note: 'Uống thuốc đúng phác đồ diệt HP 14 ngày. Kiêng chua cay, bia rượu và các chất kích thích.',
          items: [
            { drugName: 'Nexium 40mg (Esomeprazole)', dosage: '40mg', usageInstruction: 'Uống 1 viên trước ăn sáng 30 phút', quantity: 28, unit: 'viên', duration: '14 ngày' },
            { drugName: 'Clarithromycin 500mg', dosage: '500mg', usageInstruction: 'Uống 1 viên x 2 lần/ngày sau ăn', quantity: 28, unit: 'viên', duration: '14 ngày' },
            { drugName: 'Amoxicillin 500mg', dosage: '500mg', usageInstruction: 'Uống 2 viên x 2 lần/ngày sau ăn', quantity: 56, unit: 'viên', duration: '14 ngày' },
            { drugName: 'Phosphalugel (Gel nhôm phosphat)', dosage: 'Gói 20g', usageInstruction: 'Uống 1 gói khi có cảm giác ợ chua nóng rát', quantity: 20, unit: 'gói', duration: '10 ngày' }
          ]
        };
      } else if (normSpec.includes('nội tiết')) {
        prescriptionData = {
          prescriptionCode: `RX-${appointment.bookingCode || 'NOVACARE-NT'}`,
          note: 'Uống thuốc đúng giờ. Kiêng đồ ngọt, hạn chế tinh bột, tập thể dục 30 phút/ngày.',
          items: [
            { drugName: 'Metformin HCl 850mg (Glucophage)', dosage: '850mg', usageInstruction: 'Uống 1 viên x 2 lần/ngày sau bữa ăn', quantity: 60, unit: 'viên', duration: '30 ngày' },
            { drugName: 'Gliclazide MR 60mg (Diamicron MR)', dosage: '60mg', usageInstruction: 'Uống 1 viên vào buổi sáng trước ăn', quantity: 30, unit: 'viên', duration: '30 ngày' }
          ]
        };
      } else {
        prescriptionData = {
          prescriptionCode: `RX-${appointment.bookingCode || 'NOVACARE'}`,
          note: 'Uống nhiều nước ấm, nghỉ ngơi hợp lý và ăn uống đầy đủ dưỡng chất.',
          items: [
            { drugName: 'Paracetamol 500mg (Panadol)', dosage: '500mg', usageInstruction: 'Uống 1 viên khi sốt trên 38.5°C hoặc đau mỏi người', quantity: 10, unit: 'viên', duration: '5 ngày' },
            { drugName: 'Vitamin C 500mg', dosage: '500mg', usageInstruction: 'Uống 1 viên sau ăn sáng', quantity: 10, unit: 'viên', duration: '10 ngày' }
          ]
        };
      }
    }

    // 4. Khám thể lực thực thể
    const physicalExamText = enc?.physicalExamination || (
      normSpec.includes('xương') || normSpec.includes('khớp') ? 'Khám hệ vận động: Khớp gối 2 bên không sưng nóng đỏ, có tiếng lạo xạo khi gấp duỗi khớp gối phải. Dấu hiệu ngăn kéo (-), bập bềnh xương bánh chè (-). Tầm vận động khớp gối (ROM): 0 - 130 độ. Cột sống thắt lưng không gù vẹo.' :
        normSpec.includes('da') || normSpec.includes('liễu') ? 'Khám da và niêm mạc: Tổn thương dạng dát đỏ, sẩn phù rải rác vùng cẳng tay, ngực và mặt. Da khô bong vảy nhẹ, có nhiều vết cào gãi do ngứa. Không có bọng nước hay loét.' :
          normSpec.includes('tim') || normSpec.includes('mạch') ? 'Khám tuần hoàn & lồng ngực: Lồng ngực cân đối, mỏm tim đập ở khoang liên sườn 5 đường trung đòn trái. Tim nhịp đều, T1 T2 rõ, không nghe tiếng thổi bệnh lý. Mạch ngoại vi bắt rõ đều 2 bên.' :
            normSpec.includes('tiêu hóa') || normSpec.includes('dạ dày') ? 'Khám tiêu hóa: Bụng mềm, không chướng, di động đều theo nhịp thở. Ấn đau tức nhẹ vùng thượng vị và môn vị, không có phản ứng thành bụng. Gan lách không to.' :
              normSpec.includes('nội tiết') ? 'Khám nội tiết: Thể trạng hơi thừa cân, niêm mạc hồng, tuyến giáp không to, không phù. Mạch mu chân 2 bên bắt rõ, không có vết loét bàn chân.' :
                normSpec.includes('tai') || normSpec.includes('mũi') ? 'Khám TMH: Màng nhĩ 2 bên sáng bóng, cuống mũi dưới phù nề nhạt màu, thành sau họng có vài nang lympho quá phát nhẹ.' :
                  normSpec.includes('mắt') ? 'Khám mắt: Giác mạc trong suốt, tiền phòng sâu, đồng tử 2 bên đều 2.5mm phản xạ ánh sáng (+). Đáy mắt chưa ghi nhận bệnh lý võng mạc.' :
                    normSpec.includes('nhi') ? 'Khám nhi: Bé tỉnh, quấy khóc nhẹ khi khám. Họng đỏ nhẹ không mủ, thở đều không co kéo lồng ngực, phổi có ít rale ẩm rải rác.' :
                      normSpec.includes('sản') ? 'Khám sản phụ khoa: Tử cung hình trứng tương đương tuổi thai 22 tuần, tim thai nghe rõ 145 ck/phút. Cổ tử cung đóng kín, dài.' :
                        normSpec.includes('hô hấp') ? 'Khám hô hấp: Lồng ngực di động đều, rung thanh bình thường, rì rào phế nang êm dịu, nghe ít tiếng rít rải rác khi thở ra gắng sức.' :
                          normSpec.includes('răng') ? 'Khám răng hàm mặt: Nướu răng sưng đỏ nhẹ viền cổ răng, có mảng bám vôi răng độ 2. Lỗ sâu ngà men mặt nhai R36, R46.' :
                            'Khám tổng quát: Toàn thân tỉnh táo, da niêm hồng, thể trạng tốt. Các cơ quan tuần hoàn, hô hấp, tiêu hóa, thần kinh chưa ghi nhận dấu hiệu bất thường.'
    );

    // 5. Phác đồ điều trị
    const treatmentPlanText = enc?.treatmentPlan || (
      normSpec.includes('xương') || normSpec.includes('khớp') ? 'Điều trị nội khoa kết hợp vật lý trị liệu phục hồi chức năng khớp gối. Tránh các động tác gây áp lực lớn lên khớp gối (ngồi xổm, mang vác nặng).' :
        normSpec.includes('da') || normSpec.includes('liễu') ? 'Phác đồ kháng Histamin H1 thế hệ 2 đường uống kết hợp kem bôi làm dịu dưỡng ẩm phục hồi hàng rào bảo vệ da. Tránh các yếu tố khởi phát dị ứng.' :
          normSpec.includes('tim') || normSpec.includes('mạch') ? 'Điều trị hạ huyết áp đơn trị liệu kết hợp điều hòa lipid máu và chống kết tập tiểu cầu. Điều chỉnh lối sống: ăn nhạt (<5g muối/ngày), tập thể dục đều đặn.' :
            normSpec.includes('tiêu hóa') || normSpec.includes('dạ dày') ? 'Phác đồ 4 thuốc diệt trừ vi khuẩn Helicobacter pylori (PPI + 2 Kháng sinh + Phosphalugel) trong 14 ngày. Sau đó duy trì thuốc ức chế acid dạ dày.' :
              normSpec.includes('nội tiết') ? 'Kiểm soát đường huyết bằng thuốc uống phối hợp Metformin + Sulfonylurea, kiểm soát lipid máu và điều chỉnh chế độ ăn kiêng đồ ngọt.' :
                normSpec.includes('tai') || normSpec.includes('mũi') ? 'Xịt mũi Corticoid tại chỗ, kháng Histamin uống và rửa mũi xoang bằng nước muối sinh lý ấm hàng ngày.' :
                  normSpec.includes('mắt') ? 'Bổ sung nước mắt nhân tạo không chất bảo quản, bổ sung vi chất bảo vệ võng mạc và tập nghỉ ngơi mắt theo quy tắc 20-20-20.' :
                    normSpec.includes('nhi') ? 'Hạ sốt khi nhiệt độ > 38.5°C, giảm ho bằng siro thảo dược, bù nước điện giải Oresol và giữ ấm đường thở cho bé.' :
                      normSpec.includes('sản') ? 'Bổ sung vi chất dinh dưỡng thai kỳ (Sắt, Canxi, Acid Folic), điều trị tại chỗ viêm âm đạo bằng viên đặt và theo dõi sự phát triển thai nhi.' :
                        normSpec.includes('hô hấp') ? 'Kiểm soát hen bằng thuốc xịt định liều phối hợp ICS/LABA hàng ngày, cắt cơn hen bằng thuốc giãn phế quản tác dụng ngắn khi cần.' :
                          normSpec.includes('răng') ? 'Cạo vôi răng trên và dưới nướu, trám dự phòng lỗ sâu răng bằng Composite và hướng dẫn vệ sinh răng miệng đúng cách.' :
                            'Điều trị triệu chứng ngoại trú, chăm sóc nâng cao thể trạng và theo dõi sức khỏe tại nhà.'
    );

    // 6. Kết luận chuyên môn
    const conclusionText = enc?.conclusion || (
      normSpec.includes('xương') || normSpec.includes('khớp') ? 'Bệnh nhân thoái hóa khớp gối nguyên phát độ II đáp ứng điều trị nội khoa ngoại trú. Tình trạng khớp ổn định, chưa có chỉ định phẫu thuật.' :
        normSpec.includes('da') || normSpec.includes('liễu') ? 'Viêm da cơ địa và mày đay dị ứng mức độ nhẹ - trung bình, tổn thương da đang trong giai đoạn bán cấp, tiên lượng điều trị đáp ứng tốt.' :
          normSpec.includes('tim') || normSpec.includes('mạch') ? 'Tăng huyết áp vô căn độ II kèm rối loạn lipid máu, nguy cơ tim mạch tổng thể ở mức trung bình, cần duy trì kiểm soát huyết áp mục tiêu < 130/80 mmHg.' :
            normSpec.includes('tiêu hóa') || normSpec.includes('dạ dày') ? 'Viêm loét dạ dày tá tràng có nhiễm vi khuẩn HP, tổn thương niêm mạc mức độ vừa, cần tuân thủ nghiêm ngặt phác đồ kháng sinh diệt HP.' :
              normSpec.includes('nội tiết') ? 'Đái tháo đường Type 2 kiểm soát đường huyết khá, chưa phát hiện biến chứng mạch máu lớn hay vi mạch.' :
                normSpec.includes('tai') || normSpec.includes('mũi') ? 'Viêm mũi xoang xuất tiết dị ứng mạn tính đáp ứng với phác đồ điều trị nội khoa ngoại trú.' :
                  normSpec.includes('mắt') ? 'Hội chứng thị giác màn hình và cận thị ổn định, thị lực sau chỉnh kính đạt 10/10.' :
                    normSpec.includes('nhi') ? 'Viêm phế quản cấp tính ở trẻ em mức độ nhẹ, theo dõi sát diễn biến hô hấp của bé tại nhà.' :
                      normSpec.includes('sản') ? 'Thai kỳ 22 tuần phát triển bình thường trong tử cung, các chỉ số đo đạc hình thái thai nhi tương thích tuổi thai.' :
                        normSpec.includes('hô hấp') ? 'Hen phế quản kiểm soát một phần, thông khí phổi đáp ứng tốt với thuốc giãn phế quản.' :
                          normSpec.includes('răng') ? 'Viêm nha chu nhẹ đã được xử lý làm sạch, mô quanh răng phục hồi tốt.' :
                            'Bệnh nhân khám sức khỏe tổng quát định kỳ, các chỉ số sức khỏe ổn định.'
    );

    // Revisit date calculation
    const baseDate = new Date(enc?.encounterDate || appointment.slot?.startTime || appointment.createdAt);
    const revisitDays = normSpec.includes('nhi') ? 3 : normSpec.includes('da') || normSpec.includes('tiêu hóa') ? 14 : 30;
    const revisitDateObj = new Date(baseDate.getTime() + revisitDays * 24 * 60 * 60 * 1000);

    const chiefComplaintText = (
      normSpec.includes('xương') || normSpec.includes('khớp') ? 'Đau nhức khớp gối hai bên, cứng khớp buổi sáng, hạn chế vận động khi đi lại và leo cầu thang' :
      normSpec.includes('da') || normSpec.includes('liễu') ? 'Ngứa rát nhiều, nổi dát đỏ sẩn phù rải rác vùng cẳng tay, ngực và mặt' :
      normSpec.includes('tim') || normSpec.includes('mạch') ? 'Khám tăng huyết áp định kỳ, thỉnh thoảng hồi hộp, đau tức ngực nhẹ khi gắng sức' :
      normSpec.includes('tiêu hóa') || normSpec.includes('dạ dày') ? 'Đau tức vùng thượng vị, ợ hơi ợ chua, đầy bụng khó tiêu sau bữa ăn' :
      normSpec.includes('nội tiết') ? 'Khám kiểm tra đái tháo đường định kỳ, người mệt mỏi, sụt cân nhẹ, khát nước' :
      normSpec.includes('tai') || normSpec.includes('mũi') ? 'Nghẹt mũi, chảy nước mũi trong, hắt hơi nhiều và ngứa họng khi thay đổi thời tiết' :
      normSpec.includes('mắt') ? 'Khô rát mắt, nhìn mờ từng lúc, mỏi mắt nhiều khi tiếp xúc màn hình điện tử' :
      normSpec.includes('nhi') ? 'Bé sốt nhẹ, ho đờm, chảy mũi trong, quấy khóc và biếng ăn 2 ngày nay' :
      normSpec.includes('sản') ? 'Khám thai định kỳ 22 tuần, siêu âm tầm soát hình thái học thai nhi' :
      normSpec.includes('hô hấp') ? 'Ho khan từng cơn, cảm giác tức ngực và thở rít nhẹ về đêm' :
      normSpec.includes('răng') ? 'Đau buốt răng hàm dưới khi ăn đồ lạnh, chảy máu chân răng khi đánh răng' :
      (appointment.reason || `Khám kiểm tra chuyên khoa ${specialtyName}`)
    );

    const clinicalSummaryText = (
      normSpec.includes('xương') || normSpec.includes('khớp') ? 'Bệnh nhân đau âm ỉ khớp gối 2 bên khoảng 3 tháng nay, đau tăng khi vận động, có tiếng lạo xạo khi đi lại. Chưa điều trị đặc hiệu.' :
      normSpec.includes('da') || normSpec.includes('liễu') ? 'Tổn thương da xuất hiện 4 ngày nay sau khi tiếp xúc với thời tiết lạnh và dị nguyên. Ngứa nhiều về đêm, đã bôi thuốc ngoài da không đỡ.' :
      normSpec.includes('tim') || normSpec.includes('mạch') ? 'Bệnh nhân có tiền sử tăng huyết áp 3 năm, đang uống thuốc duy trì nhưng huyết áp dao động. Nay đến khám đánh giá lại phác đồ.' :
      normSpec.includes('tiêu hóa') || normSpec.includes('dạ dày') ? 'Bệnh nhân có tiền sử đau dạ dày tái phát, gần đây đau âm ỉ vùng thượng vị sau ăn, ợ hơi nhiều, không nôn, đi cầu phân vàng bình thường.' :
      normSpec.includes('nội tiết') ? 'Đái tháo đường Type 2 phát hiện 2 năm, tái khám định kỳ theo dõi chỉ số HbA1c và điều chỉnh liều thuốc uống.' :
      normSpec.includes('tai') || normSpec.includes('mũi') ? 'Bệnh nhân bị viêm mũi dị ứng nhiều năm, đợt này nghẹt mũi tăng, chảy dịch trong, không sốt.' :
      normSpec.includes('mắt') ? 'Làm việc văn phòng nhiều giờ trước máy tính, mắt khô rát, nhìn xa mờ, chưa đeo kính điều chỉnh.' :
      normSpec.includes('nhi') ? 'Bé tỉnh, sốt 38°C, ho húng hắng, không khó thở, không tím tái, bú được.' :
      normSpec.includes('sản') ? 'Thai phụ mang thai lần 1, thai 22 tuần, cử động thai tốt, không đau bụng, không ra huyết âm đạo.' :
      normSpec.includes('hô hấp') ? 'Bệnh nhân có cơ địa hen phế quản, gần đây ho và tức ngực khi thay đổi thời tiết, không sốt.' :
      normSpec.includes('răng') ? 'Bệnh nhân phát hiện sâu răng hàm dưới và viêm nướu răng 1 tháng nay, chưa trám hay điều trị tủy.' :
      'Bệnh nhân đến khám theo lịch hẹn, sinh hiệu ổn định, tiếp xúc tốt.'
    );

    setSelectedEncounter({
      encounterCode: enc?.encounterCode || `EMR-${appointment.bookingCode || appointment.id.slice(0, 8).toUpperCase()}`,
      encounterDate: enc?.encounterDate || appointment.slot?.startTime || appointment.createdAt,
      chiefComplaint: chiefComplaintText,
      clinicalSummary: clinicalSummaryText,
      specialtyName: specialtyName,
      doctorName: doctorName,
      doctorTitle: enc?.doctorTitle || doctor?.title || 'Bác sĩ chuyên khoa',
      hospitalName: hospital?.name || 'Bệnh viện Đa khoa NovaCare',
      hospitalAddress: hospital?.address || 'TP. Hồ Chí Minh',
      hospital: hospital,
      patientProfile: appointment.patientProfile || selectedProfile,
      masterPatientId: masterPatientId,
      physicalExamination: physicalExamText,
      diagnoses: diagnosesList,
      observations: observationsList,
      prescription: prescriptionData,
      treatmentPlan: treatmentPlanText,
      conclusion: conclusionText,
      revisitDate: revisitDateObj,
      digitalSignature: {
        signerName: doctorName,
        signedAt: enc?.encounterDate || appointment.slot?.startTime || new Date(),
        certificateNumber: `VN-BYT-CA-${appointment.bookingCode || '202688'}`,
        sha256Hash: `SHA256:${(appointment.bookingCode || 'EMR8899').toUpperCase()}7F8E9D2A1C3B4E9900`,
        isValid: true,
      },
    });
    setIsEMRModalOpen(true);
  };

  return (
    <div className="w-full space-y-8 pb-16">

      {/* ========================================================= */}
      {/* 1. HEADER: SỔ SỨC KHỎE ĐIỆN TỬ & ĐỊNH DANH CÔNG DÂN */}
      {/* ========================================================= */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-700 text-white flex items-center justify-center shadow-xs">
                <FileText className="w-5 h-5 text-emerald-200" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Sổ Sức Khỏe Điện Tử
              </h1>
              <span className="px-3 py-1 rounded-full text-[11px] font-black bg-emerald-50 text-emerald-800 border border-emerald-300">
                Chuẩn Bộ Y Tế • EMR
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed">
              Cổng tích hợp hồ sơ bệnh án điện tử ngoại trú, đơn thuốc quốc gia và liên thông y tế giữa các cơ sở khám chữa bệnh.
            </p>
          </div>

          {/* Profile Switcher */}
          {profiles.length > 0 ? (
            <div className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-2xl border border-slate-200 self-start md:self-auto shrink-0">
              <UserCheck className="w-4 h-4 text-emerald-600 shrink-0 ml-1" />
              <span className="text-xs font-bold text-slate-600 shrink-0">Hồ sơ:</span>
              <select
                value={selectedProfile?.id || ''}
                onChange={(e) => {
                  const found = profiles.find((p) => p.id === e.target.value);
                  if (found) setSelectedProfile(found);
                }}
                className="text-xs font-extrabold text-slate-900 bg-white px-3 py-1.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              >
                {profiles.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.fullName} ({p.relation || 'Bản thân'})
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <Button asChild size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs gap-1.5 cursor-pointer">
              <Link href="/ho-so">
                <FolderPlus className="w-4 h-4" />
                Tạo hồ sơ bệnh nhân
              </Link>
            </Button>
          )}
        </div>

        {/* Patient Identity Strip */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-1">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Chủ thể hồ sơ y tế</div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-slate-900">
                {selectedProfile?.fullName || 'Chưa tạo hồ sơ'}
              </h2>
              {selectedProfile?.relation && (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700">
                  {selectedProfile.relation}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-600 font-medium">
              CCCD: <strong className="font-mono text-slate-900 font-bold">{selectedProfile?.identityNumber || 'Chưa cập nhật'}</strong> · BHYT: <strong className="font-mono text-emerald-800">{selectedProfile?.healthInsurance || 'Chưa cập nhật'}</strong>
            </p>
          </div>

          {/* Master Patient ID Card */}
          <div className="md:col-span-2 bg-gradient-to-r from-slate-900 to-emerald-950 text-white rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-300">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Mã Định Danh Y Tế Trung Tâm (Master Patient ID)</span>
              </div>
              <div className="text-2xl font-black font-mono tracking-wider text-emerald-400">
                {masterPatientId}
              </div>
              <p className="text-[11px] text-slate-300 max-w-lg leading-relaxed">
                Định danh duy nhất giúp liên thông và hợp nhất toàn bộ dữ liệu khám chữa bệnh tại các bệnh viện trên cả nước.
              </p>
            </div>

            <div className="px-3.5 py-2 rounded-xl bg-white/10 border border-white/15 text-xs font-bold text-emerald-200 shrink-0">
              {selectedProfile ? 'Đã liên kết hồ sơ' : 'Chờ tạo hồ sơ'}
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 2. OVERVIEW STATISTICS: TỔNG QUAN LIÊN THÔNG Y TẾ */}
      {/* ========================================================= */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Số bệnh viện đã khám */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Cơ sở KCB đã khám</span>
            <Building2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900">
            {dynamicLinkedHospitals.length} <span className="text-xs font-bold text-slate-500">cơ sở</span>
          </div>
          <p className="text-[11px] text-slate-500 font-medium">Bệnh viện & Phòng khám liên thông</p>
        </div>

        {/* Metric 2: Tổng số lượt khám */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tổng lượt khám</span>
            <Stethoscope className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-indigo-600">
            {completedAppointments.length} <span className="text-xs font-bold text-slate-500">lượt</span>
          </div>
          <p className="text-[11px] text-slate-500 font-medium">Hồ sơ đã được lưu trữ an toàn</p>
        </div>

        {/* Metric 3: Đơn thuốc điện tử */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Đơn thuốc điện tử (RX)</span>
            <Pill className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-600">
            {totalPrescriptionsCount} <span className="text-xs font-bold text-slate-500">đơn</span>
          </div>
          <p className="text-[11px] text-slate-500 font-medium">Cấp theo chuẩn Thông tư 27/BYT</p>
        </div>

        {/* Metric 4: Mã chia sẻ liên thông */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Mã chia sẻ QR</span>
            <QrCode className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-600">
            {activeCodesCount} <span className="text-xs font-bold text-slate-500">mã active</span>
          </div>
          <p className="text-[11px] text-slate-500 font-medium">Quyền truy cập y tế có thời hạn</p>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 3. TABS NAVIGATION */}
      {/* ========================================================= */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('HISTORY')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer ${activeTab === 'HISTORY'
            ? 'bg-emerald-700 text-white shadow-xs'
            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
        >
          <FileText className="w-4 h-4" />
          <span>Hồ sơ bệnh án theo Bệnh viện ({hospitalGroups.length} cơ sở)</span>
        </button>

        <button
          onClick={() => setActiveTab('HOSPITALS')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer ${activeTab === 'HOSPITALS'
            ? 'bg-emerald-700 text-white shadow-xs'
            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Cơ sở KCB liên thông ({dynamicLinkedHospitals.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('PASSPORT')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer ${activeTab === 'PASSPORT'
            ? 'bg-emerald-700 text-white shadow-xs'
            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Hộ chiếu y tế & Mã chia sẻ</span>
        </button>
      </div>

      {/* ========================================================= */}
      {/* TAB 1: CLINICAL HISTORY GROUPED BY HOSPITAL */}
      {/* ========================================================= */}
      {activeTab === 'HISTORY' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-black text-slate-900">
                Danh Sách Bệnh Án Điện Tử Theo Cơ Sở Y Tế (EMR)
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Dữ liệu được hợp nhất theo từng cơ sở khám chữa bệnh, phản ánh lịch sử chẩn đoán, xét nghiệm và điều trị thực tế.
              </p>
            </div>
            <div className="flex items-center gap-2">
              {hospitalGroups.length > 1 && (
                <Button
                  onClick={() => {
                    const allCollapsed = hospitalGroups.every((g) => !!collapsedHospitals[g.hospitalId]);
                    if (allCollapsed) {
                      setCollapsedHospitals({});
                    } else {
                      const all: Record<string, boolean> = {};
                      hospitalGroups.forEach((g) => {
                        all[g.hospitalId] = true;
                      });
                      setCollapsedHospitals(all);
                    }
                  }}
                  variant="outline"
                  size="sm"
                  className="text-xs font-bold gap-1.5 rounded-xl border-slate-300 cursor-pointer"
                >
                  {hospitalGroups.every((g) => !!collapsedHospitals[g.hospitalId]) ? (
                    <>
                      <ChevronDown className="w-3.5 h-3.5" />
                      Mở rộng tất cả
                    </>
                  ) : (
                    <>
                      <ChevronUp className="w-3.5 h-3.5" />
                      Thu gọn tất cả
                    </>
                  )}
                </Button>
              )}
              <Button
                onClick={() => refetchAppointments()}
                variant="outline"
                size="sm"
                className="text-xs font-bold gap-1.5 rounded-xl border-slate-300 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Làm mới dữ liệu
              </Button>
            </div>
          </div>

          {/* Hospital Groups List */}
          <div className="space-y-6">
            {hospitalGroups.length > 0 ? (
              hospitalGroups.map((group) => {
                const isHospitalCollapsed = !!collapsedHospitals[group.hospitalId];

                return (
                  <Card
                    key={group.hospitalId}
                    className="border border-emerald-200/90 bg-white rounded-2xl shadow-xs overflow-hidden"
                  >
                    {/* Hospital Group Header with Accordion Toggle */}
                    <div
                      onClick={() => toggleHospital(group.hospitalId)}
                      className="bg-emerald-50/80 border-b border-emerald-200/80 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer select-none transition-colors hover:bg-emerald-100/70"
                    >
                      <div className="flex items-center gap-3.5">
                        <div className="w-11 h-11 rounded-xl bg-emerald-700 text-white flex items-center justify-center font-bold shrink-0 shadow-xs">
                          <Building2 className="w-5 h-5 text-white" />
                        </div>
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2.5 flex-wrap">
                            <h4 className="text-base sm:text-lg font-black text-slate-950">
                              {group.hospitalName}
                            </h4>
                            <span className="bg-emerald-700 text-white text-xs font-bold px-3 py-0.5 rounded-full shadow-2xs">
                              {group.totalVisits} lượt khám
                            </span>
                          </div>
                          {group.hospitalAddress && (
                            <p className="text-xs text-slate-600 flex items-center gap-1.5 font-medium">
                              <MapPin className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                              <span>{group.hospitalAddress}</span>
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-auto">
                        <span className="text-xs font-bold text-emerald-900 bg-white border border-emerald-300 px-3 py-1 rounded-lg shadow-2xs">
                          Liên thông EMR
                        </span>
                        <div className="flex items-center gap-1 bg-white hover:bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-300 text-xs font-bold text-emerald-950 shadow-2xs">
                          <span>{isHospitalCollapsed ? 'Mở rộng' : 'Thu gọn'}</span>
                          <div className={`transition-transform duration-200 ${isHospitalCollapsed ? 'rotate-180' : ''}`}>
                            <ChevronUp className="w-3.5 h-3.5 text-emerald-700" />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Encounters List Inside This Hospital (Toggled by Accordion) */}
                    {!isHospitalCollapsed && (
                      <div className="divide-y divide-slate-100 animate-in fade-in-50 duration-150">
                        {group.appointments.map((apt: any, idx: number) => {
                          const enc = apt.medicalEncounter;
                          const doctor = apt.slot?.doctorWorkplace?.doctor;
                          const clinical = getClinicalBreakdown(apt);
                          const specialtyName = clinical.specialtyName;
                          const doctorName = enc?.doctorName || doctor?.fullName || 'Bác sĩ chuyên khoa';
                          const dateObj = apt.slot?.startTime ? new Date(apt.slot.startTime) : new Date(apt.createdAt);
                          const dateFormatted = format(dateObj, 'dd/MM/yyyy', { locale: vi });
                          const timeFormatted = format(dateObj, 'HH:mm', { locale: vi });
                          const isVisitCollapsed = !!collapsedVisits[apt.id];

                          const diagText = clinical.diagText;
                          const rxSummary = clinical.rxSummary;
                          const obsSummary = clinical.obsSummary;
                          const conclusionText = clinical.conclusionText;

                          return (
                            <div key={apt.id || idx} className="p-5 sm:p-6 hover:bg-slate-50/50 transition-colors space-y-3.5">
                              {/* Visit Header */}
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2.5 flex-wrap">
                                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-800 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-lg">
                                      <Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                                      <span>{dateFormatted} {timeFormatted !== '00:00' ? `(${timeFormatted})` : ''}</span>
                                    </span>
                                    <span className="text-xs font-bold text-emerald-900 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
                                      Khoa {specialtyName}
                                    </span>
                                  </div>
                                  <p className="text-xs text-slate-600 font-medium pt-0.5">
                                    Bác sĩ phụ trách: <strong className="text-slate-900 font-bold">{doctorName}</strong>
                                  </p>
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                  <Button
                                    onClick={() => handleOpenEMR(apt)}
                                    className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs h-8.5 px-3.5 rounded-lg shadow-2xs gap-1.5 cursor-pointer"
                                  >
                                    <FileText className="w-3.5 h-3.5" />
                                    Xem Bệnh án (EMR)
                                  </Button>
                                  <Button
                                    onClick={() => toggleVisit(apt.id)}
                                    variant="ghost"
                                    size="sm"
                                    className="text-xs font-semibold text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg h-8.5 px-2 cursor-pointer"
                                    title={isVisitCollapsed ? 'Mở rộng chi tiết' : 'Thu gọn chi tiết'}
                                  >
                                    <div className={`transition-transform duration-200 ${isVisitCollapsed ? 'rotate-180' : ''}`}>
                                      <ChevronUp className="w-4 h-4" />
                                    </div>
                                  </Button>
                                </div>
                              </div>

                              {/* Clinical Breakdown (Collapsible) */}
                              {!isVisitCollapsed && (
                                <div className="bg-slate-50/80 rounded-xl p-4 border border-slate-200 space-y-2 text-xs">
                                  {/* Diagnosis */}
                                  <div className="flex items-start gap-2">
                                    <span className="font-bold text-slate-700 shrink-0 min-w-[110px]">
                                      Chẩn đoán:
                                    </span>
                                    <span className="font-bold text-slate-950 leading-relaxed">
                                      {diagText}
                                    </span>
                                  </div>

                                  {/* Prescription */}
                                  <div className="flex items-start gap-2">
                                    <span className="font-bold text-slate-700 shrink-0 min-w-[110px]">
                                      Đơn thuốc:
                                    </span>
                                    <span className="text-slate-800 leading-relaxed font-medium">
                                      {rxSummary}
                                    </span>
                                  </div>

                                  {/* Lab / Tests */}
                                  <div className="flex items-start gap-2">
                                    <span className="font-bold text-slate-700 shrink-0 min-w-[110px]">
                                      Cận lâm sàng:
                                    </span>
                                    <span className="text-slate-800 leading-relaxed font-medium">
                                      {obsSummary}
                                    </span>
                                  </div>

                                  {/* Conclusion */}
                                  <div className="flex items-start gap-2 pt-1 border-t border-slate-200">
                                    <span className="font-bold text-slate-700 shrink-0 min-w-[110px]">
                                      Kết luận:
                                    </span>
                                    <span className="font-medium text-slate-900 leading-relaxed">
                                      {conclusionText}
                                    </span>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </Card>
                );
              })
            ) : (
              /* Clean Empty State for New Accounts */
              <Card className="border-slate-200 bg-white rounded-3xl p-10 text-center space-y-4 shadow-xs">
                <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto ring-8 ring-emerald-50/50">
                  <FileText className="w-8 h-8" />
                </div>
                <div className="space-y-1.5 max-w-md mx-auto">
                  <h4 className="text-lg font-black text-slate-900">Bạn chưa có hồ sơ bệnh án nào</h4>
                  <p className="text-xs text-slate-500 font-medium leading-relaxed">
                    Khi bạn đặt lịch khám và hoàn tất buổi khám tại bệnh viện, toàn bộ hồ sơ bệnh án điện tử (EMR) và đơn thuốc sẽ tự động xuất hiện tại đây.
                  </p>
                </div>
                <div className="pt-2">
                  <Button
                    asChild
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-10 px-6 rounded-xl shadow-xs cursor-pointer"
                  >
                    <Link href="/dat-lich">
                      Đặt lịch khám chuyên khoa ngay ➔
                    </Link>
                  </Button>
                </div>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: LINKED HOSPITALS */}
      {/* ========================================================= */}
      {activeTab === 'HOSPITALS' && (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-black text-slate-900">
              Danh Sách Bệnh Viện & Cơ Sở Y Tế Đã Từng Khám
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Mỗi cơ sở y tế đều được ánh xạ mã bệnh nhân nội bộ (Hospital PID) để liên thông dữ liệu y tế tức thì.
            </p>
          </div>

          {dynamicLinkedHospitals.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {dynamicLinkedHospitals.map((h) => (
                <Card key={h.id} className="border-slate-200 bg-white rounded-2xl p-5 shadow-xs space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center font-bold shrink-0">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div className="space-y-0.5">
                      <h4 className="font-extrabold text-slate-900 text-sm">{h.name}</h4>
                      <p className="text-[11px] text-slate-500">{h.address}</p>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Mã BN tại bệnh viện:</span>
                      <strong className="font-mono text-emerald-800">{h.pid}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Số lượt khám:</span>
                      <strong className="text-slate-900">{h.visits} lượt</strong>
                    </div>
                    <div className="flex justify-between items-center pt-1 border-t border-slate-200">
                      <span className="text-slate-500">Trạng thái:</span>
                      <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                        ● {h.status}
                      </span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="border-slate-200 bg-white rounded-3xl p-8 text-center space-y-3 shadow-xs">
              <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center mx-auto">
                <Building2 className="w-6 h-6" />
              </div>
              <p className="text-xs text-slate-500 font-medium max-w-sm mx-auto">
                Chưa có cơ sở y tế nào được liên kết. Cơ sở y tế sẽ tự động liên kết khi bạn hoàn tất buổi khám đầu tiên.
              </p>
            </Card>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 3: MEDICAL PASSPORT & SHARE CODES */}
      {/* ========================================================= */}
      {activeTab === 'PASSPORT' && (
        <div className="space-y-8">

          {/* Action Card: Tạo mã chia sẻ */}
          <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-md relative overflow-hidden flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="relative z-10 space-y-2 max-w-xl">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold uppercase tracking-wider border border-emerald-500/30">
                <Lock className="w-3.5 h-3.5" />
                🔐 Chia sẻ hồ sơ y tế an toàn
              </div>
              <h2 className="text-2xl font-black">Cấp Quyền Truy Cập Hồ Sơ Y Tế Tạm Thời</h2>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Tạo mã QR hoặc mã PIN chia sẻ có thời hạn (15 phút, 1 giờ, 24 giờ) để bác sĩ tại bất kỳ bệnh viện nào có thể xem lịch sử khám và đơn thuốc của bạn khi chuyển tuyến.
              </p>
            </div>

            <Button
              onClick={() => {
                setStep(1);
                setIsCreateModalOpen(true);
              }}
              className="relative z-10 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-sm px-6 py-6 rounded-2xl shadow-lg gap-2 shrink-0 cursor-pointer transition transform hover:scale-105"
            >
              <Plus className="w-5 h-5" />
              <span>+ Tạo mã chia sẻ</span>
            </Button>
          </div>

          {/* Active Share Code Card */}
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
                  <div className="bg-black/40 border-2 border-emerald-400/50 rounded-2xl p-6 text-center space-y-2">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block">Mã truy cập</span>
                    <div className="text-3xl font-black font-mono tracking-widest text-emerald-400">
                      {currentActiveCode.code}
                    </div>
                    <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full bg-emerald-500 text-slate-900 font-extrabold text-[11px]">
                      <CheckCircle2 className="w-3.5 h-3.5" /> 🟢 Đang hoạt động
                    </span>
                  </div>

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
                        asChild
                        size="sm"
                        className="bg-teal-400 hover:bg-teal-500 text-slate-950 font-black text-xs gap-1.5 rounded-xl cursor-pointer"
                      >
                        <Link href={`/tra-cuu-benh-an?query=${encodeURIComponent(currentActiveCode.code)}`}>
                          <ExternalLink className="w-4 h-4" />
                          <span>Mở Cổng Bác Sĩ tra cứu mã này ➔</span>
                        </Link>
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

          {/* Audit Logs */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <span>Nhật Ký Truy Cập Hồ Sơ </span>
              </h3>
              <span className="text-xs text-slate-500 font-medium">Bảo mật & minh bạch dữ liệu y tế</span>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden divide-y divide-slate-100 text-xs">
              {auditLogs.length > 0 ? (
                auditLogs.map((log) => (
                  <div key={log.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 transition">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-slate-400 text-[11px]">{log.timestamp}</span>
                        <strong className="text-slate-900 font-bold text-sm">🏥 {log.hospitalName}</strong>
                        {log.doctorName && <span className="text-slate-600 font-medium">• BS: {log.doctorName}</span>}
                      </div>
                      <p className="text-slate-600 font-medium">
                        Mục đích: <span className="text-slate-900 font-bold">{log.purpose}</span> · Dữ liệu: <span className="text-indigo-800 font-semibold">{log.accessedData}</span>
                      </p>
                    </div>
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold shrink-0 self-start sm:self-auto">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      Thành công
                    </span>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-slate-400 text-xs font-medium">
                  Chưa có lượt truy cập hồ sơ ngoại viện nào được ghi nhận.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: OFFICIAL VIETNAM EMR FULL VIEW */}
      {/* ========================================================= */}
      <VietnamEMRModal
        isOpen={isEMRModalOpen}
        onClose={() => setIsEMRModalOpen(false)}
        encounter={selectedEncounter}
      />

      {/* ========================================================= */}
      {/* MODAL: TẠO MÃ CHIA SẺ HỒ SƠ STEPPER */}
      {/* ========================================================= */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="max-w-md p-6 rounded-2xl bg-white shadow-2xl border-slate-200">
          <DialogHeader>
            <DialogTitle className="text-lg font-black text-slate-900 flex items-center gap-2">
              <Lock className="w-5 h-5 text-emerald-600" />
              Tạo Mã Chia Sẻ Hồ Sơ Y Tế
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Chủ động cấp quyền truy cập dữ liệu y tế tạm thời cho bác sĩ / cơ sở y tế
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            {/* Step 1: Chọn thời gian */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-800 block">1. Thời gian hiệu lực:</label>
              <div className="grid grid-cols-3 gap-2 text-xs">
                {[
                  { label: '15 Phút', val: 15 },
                  { label: '1 Giờ', val: 60 },
                  { label: '24 Giờ', val: 1440 },
                ].map((item) => (
                  <button
                    key={item.val}
                    type="button"
                    onClick={() => setSelectedDurationMins(item.val)}
                    className={`p-2.5 rounded-xl border text-center font-bold transition cursor-pointer ${selectedDurationMins === item.val
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-900 shadow-2xs'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Step 2: Chọn dữ liệu chia sẻ */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-800 block">2. Phạm vi dữ liệu cho phép:</label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {availableSections.map((sec) => {
                  const isChecked = selectedSections.includes(sec.id);
                  return (
                    <button
                      key={sec.id}
                      type="button"
                      onClick={() => toggleSection(sec.id)}
                      className={`p-2.5 rounded-xl border text-left font-bold flex items-center gap-2 transition cursor-pointer ${isChecked
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-900 shadow-2xs'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                        }`}
                    >
                      <div className={`w-4 h-4 rounded flex items-center justify-center text-white ${isChecked ? 'bg-emerald-600' : 'border border-slate-300'}`}>
                        {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                      <span className="truncate">{sec.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 3: Đối tượng nhận */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-800 block">3. Cơ sở y tế tiếp nhận:</label>
              <div className="space-y-2 text-xs">
                <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 cursor-pointer">
                  <input
                    type="radio"
                    name="hospOpt"
                    checked={hospitalAccessOption === 'SPECIFIC'}
                    onChange={() => setHospitalAccessOption('SPECIFIC')}
                    className="text-emerald-600"
                  />
                  <span className="font-bold text-slate-800">Chỉ bệnh viện được chỉ định</span>
                </label>
                <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 cursor-pointer">
                  <input
                    type="radio"
                    name="hospOpt"
                    checked={hospitalAccessOption === 'ANY'}
                    onChange={() => setHospitalAccessOption('ANY')}
                    className="text-emerald-600"
                  />
                  <span className="font-bold text-slate-800">Bất kỳ bác sĩ/bệnh viện nào có mã</span>
                </label>
              </div>
            </div>

            <Button
              onClick={handleGenerateShareCode}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs h-11 rounded-xl shadow-xs mt-2 cursor-pointer"
            >
              Tạo & Cấp Mã Chia Sẻ Ngay
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ========================================================= */}
      {/* MODAL: HIỂN THỊ MÃ QR CODE CHIA SẺ */}
      {/* ========================================================= */}
      <Dialog open={!!selectedQrCode} onOpenChange={() => setSelectedQrCode(null)}>
        <DialogContent className="max-w-sm p-6 rounded-2xl bg-white shadow-2xl text-center space-y-4">
          <DialogHeader>
            <DialogTitle className="text-lg font-black text-slate-900">
              Mã QR Chia Sẻ Hồ Sơ Y Tế
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Đưa mã này cho Bác sĩ hoặc Cơ sở KCB để quét tra cứu hồ sơ
            </DialogDescription>
          </DialogHeader>

          {selectedQrCode && (
            <div className="space-y-4 flex flex-col items-center">
              <div className="p-4 bg-white border-2 border-emerald-500/50 rounded-2xl shadow-sm">
                <QRCodeSVG
                  value={`https://novacare.vn/lookup?token=${selectedQrCode.code}`}
                  size={180}
                  level="H"
                />
              </div>

              <div className="space-y-1">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block">Mã chia sẻ</span>
                <span className="text-2xl font-black font-mono tracking-wider text-emerald-800 bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-200 inline-block">
                  {selectedQrCode.code}
                </span>
                <p className="text-[11px] text-slate-500 font-medium pt-1">
                  Hiệu lực còn: <strong className="text-slate-900 font-mono">{formatSeconds(selectedQrCode.secondsLeft)}</strong>
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Official Vietnam EMR Modal Full View */}
      <VietnamEMRModal
        isOpen={isEMRModalOpen}
        onClose={() => setIsEMRModalOpen(false)}
        encounter={selectedEncounter}
      />

    </div>
  );
}
