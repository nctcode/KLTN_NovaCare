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
  User,
  Users,
  Settings,
  AlertTriangle,
  Lock,
  KeyRound,
  Eye,
  RefreshCw,
  Search,
  ChevronLeft,
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
  ChevronUp,
  Filter,
  RotateCcw,
  SlidersHorizontal,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { profileService } from '@/services/profile.service';
import { passportService } from '@/services/passport.service';
import { interoperabilityService } from '@/services/interoperability.service';
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
  pinCode?: string;
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

// Reusable Pagination Component
interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  itemName?: string;
}

function TablePagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  itemName = 'mục',
}: PaginationProps) {
  if (totalItems <= 0) return null;

  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  // Generate page numbers array
  const pages: (number | string)[] = [];
  if (totalPages <= 5) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (currentPage > 3) pages.push('...');
    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);
    for (let i = start; i <= end; i++) {
      if (!pages.includes(i)) pages.push(i);
    }
    if (currentPage < totalPages - 2) pages.push('...');
    if (!pages.includes(totalPages)) pages.push(totalPages);
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 text-xs">
      <div className="text-slate-500 font-medium">
        Hiển thị <strong className="text-slate-900 font-bold">{startItem} - {endItem}</strong> trong tổng số{' '}
        <strong className="text-slate-900 font-bold">{totalItems}</strong> {itemName}
      </div>

      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage <= 1}
          className="p-1.5 sm:p-2 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
          title="Trang trước"
        >
          <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </button>

        {pages.map((p, idx) => {
          if (p === '...') {
            return (
              <span key={`ellipsis-${idx}`} className="px-1.5 py-1 text-slate-400 font-bold">
                ...
              </span>
            );
          }
          const pageNum = p as number;
          const isActive = pageNum === currentPage;
          return (
            <button
              key={pageNum}
              type="button"
              onClick={() => onPageChange(pageNum)}
              className={`min-w-8 h-8 px-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                isActive
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              {pageNum}
            </button>
          );
        })}

        <button
          type="button"
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage >= totalPages}
          className="p-1.5 sm:p-2 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
          title="Trang sau"
        >
          <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </button>
      </div>
    </div>
  );
}

export default function ElectronicHealthRecordPage() {
  // Profiles
  const [profiles, setProfiles] = useState<PatientProfile[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<PatientProfile | null>(null);

  // Active Tab: 'HISTORY' | 'HOSPITALS' | 'PASSPORT'
  const [activeTab, setActiveTab] = useState<'HISTORY' | 'HOSPITALS' | 'PASSPORT'>('HISTORY');

  // Pagination States for all 3 tabs
  const [pageHistory, setPageHistory] = useState(1);
  const pageSizeHistory = 5;

  const [pageHospitals, setPageHospitals] = useState(1);
  const pageSizeHospitals = 6;

  const [pageAuditLogs, setPageAuditLogs] = useState(1);
  const pageSizeAuditLogs = 5;

  // EMR Modal State
  const [selectedEncounter, setSelectedEncounter] = useState<MedicalEncounterData | null>(null);
  const [isEMRModalOpen, setIsEMRModalOpen] = useState(false);

  // Share Code Stepper Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [selectedDurationMins, setSelectedDurationMins] = useState(15);
  const [selectedSections, setSelectedSections] = useState<string[]>([
    'Thông tin hành chính',
    'Thông tin lần khám',
    'Kết quả khám',
    'Cận lâm sàng',
    'Chẩn đoán',
    'Điều trị',
    'Kết quả & tái khám',
  ]);
  const [hospitalAccessOption, setHospitalAccessOption] = useState<'ANY' | 'SPECIFIC'>('SPECIFIC');
  const [selectedHospitalName, setSelectedHospitalName] = useState('Bệnh viện Đa khoa Quốc tế');

  // PIN Code State for Share Code
  const [usePinCode, setUsePinCode] = useState(true);
  const [customPin, setCustomPin] = useState(() => String(Math.floor(1000 + Math.random() * 9000)));

  const generateRandomPin = () => {
    const pin = String(Math.floor(1000 + Math.random() * 9000));
    setCustomPin(pin);
  };

  // Active Share codes state
  const [shareCodes, setShareCodes] = useState<ShareCodeItem[]>([]);

  // QR Modal
  const [selectedQrCode, setSelectedQrCode] = useState<ShareCodeItem | null>(null);

  // Security PIN Modal State
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinConfirmInput, setPinConfirmInput] = useState('');
  const [isSavingPin, setIsSavingPin] = useState(false);

  // Query: Lấy thông tin định danh và trạng thái PIN từ server
  const { data: identityData, refetch: refetchIdentity } = useQuery({
    queryKey: ['my-portal-identity', selectedProfile?.id],
    queryFn: async () => {
      try {
        const res = await interoperabilityService.getMyIdentity(selectedProfile?.id);
        return (res as any)?.data || res;
      } catch (err) {
        return null;
      }
    },
  });

  const handleSavePin = async () => {
    if (!pinInput || pinInput.length < 4 || pinInput.length > 6 || !/^\d+$/.test(pinInput)) {
      toast.error('Mã PIN phải gồm từ 4 đến 6 chữ số');
      return;
    }
    if (pinInput !== pinConfirmInput) {
      toast.error('Mã PIN xác nhận không trùng khớp');
      return;
    }
    setIsSavingPin(true);
    try {
      await interoperabilityService.updateSecurityPin(pinInput, selectedProfile?.id);
      toast.success('Thiết lập mã PIN bảo mật hồ sơ thành công!');
      setIsPinModalOpen(false);
      setPinInput('');
      setPinConfirmInput('');
      refetchIdentity();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Lỗi khi lưu mã PIN');
    } finally {
      setIsSavingPin(false);
    }
  };

  // Query: Lấy danh sách mã chia sẻ từ cơ sở dữ liệu (lưu trữ vĩnh viễn, F5 không mất)
  const { data: rawServerShareCodes, refetch: refetchShareCodes } = useQuery({
    queryKey: ['my-share-codes'],
    queryFn: async () => {
      try {
        const res = await interoperabilityService.getMyShareCodes();
        const list = (res as any)?.data || res;
        return Array.isArray(list) ? list : [];
      } catch (err) {
        console.log('Error fetching share codes:', err);
        return [];
      }
    },
  });

  // Query: Lấy nhật ký truy cập hồ sơ (Audit Logs) từ cơ sở dữ liệu
  const { data: rawServerAuditLogs, isLoading: isLoadingAuditLogs, refetch: refetchAuditLogs } = useQuery({
    queryKey: ['my-portal-audit-logs', selectedProfile?.id],
    queryFn: async () => {
      try {
        const res = await interoperabilityService.getPortalAuditLogs(undefined, selectedProfile?.id);
        const list = (res as any)?.data || res;
        return Array.isArray(list) ? list : [];
      } catch (err) {
        console.log('Error fetching audit logs:', err);
        return [];
      }
    },
    refetchInterval: 5000, // Tự động cập nhật mỗi 5s để đón lượt tra cứu từ Mock HIS
  });

  // Đồng bộ mã chia sẻ từ server vào state đếm ngược (tránh vòng lặp vô tận)
  useEffect(() => {
    if (!rawServerShareCodes) return;

    if (rawServerShareCodes.length > 0) {
      const now = Date.now();
      const mapped: ShareCodeItem[] = rawServerShareCodes
        .filter((s: any) => !s.shareToken?.startsWith('NC-AUDIT-'))
        .map((s: any) => {
          const validUntil = new Date(s.validUntil);
          const diffSecs = Math.max(0, Math.floor((validUntil.getTime() - now) / 1000));
          const isRevoked = !s.isActive || !!s.revokedAt;
          const isExpired = diffSecs === 0 || validUntil.getTime() <= now;
          return {
            id: s.id,
            code: s.shareToken,
            status: isRevoked ? 'REVOKED' : isExpired ? 'EXPIRED' : 'ACTIVE',
            validUntil,
            secondsLeft: diffSecs,
            hospitalName: s.sharedWith || 'Bất kỳ bệnh viện nào có mã',
            sections: s.allowedSections && s.allowedSections.length > 0
              ? s.allowedSections
              : ['Thông tin hành chính', 'Thông tin lần khám', 'Kết quả khám', 'Cận lâm sàng', 'Chẩn đoán', 'Điều trị', 'Kết quả & tái khám'],
            createdAt: new Date(s.createdAt),
            pinCode: s.pinCode || undefined,
          };
        });
      setShareCodes(mapped);
    } else {
      setShareCodes((prev) => (prev.length === 0 ? prev : []));
    }
  }, [rawServerShareCodes]);

  // Đồng bộ nhật ký truy cập từ server thành danh sách hiển thị
  const auditLogs: AuditLogItem[] = useMemo(() => {
    if (!Array.isArray(rawServerAuditLogs) || rawServerAuditLogs.length === 0) return [];
    return rawServerAuditLogs.map((log: any) => {
      const logDate = new Date(log.accessedAt);
      const formattedDate = format(logDate, 'dd/MM/yyyy HH:mm:ss', { locale: vi });

      let cleanHosp = log.hospitalName;
      if (
        !cleanHosp ||
        cleanHosp.toLowerCase().includes('bất kỳ') ||
        /Windows NT|Macintosh|iPhone|Android|Linux x86|WebKit|Chrome|Safari|Mozilla/i.test(cleanHosp)
      ) {
        cleanHosp = (log.sharedWith && !log.sharedWith.toLowerCase().includes('bất kỳ') && !/Windows NT/i.test(log.sharedWith))
          ? log.sharedWith
          : 'Bệnh viện liên kết NovaCare';
      }

      const cleanDoctor = log.doctorName || 'BS. Tiếp nhận điều trị';

      return {
        id: log.id,
        timestamp: formattedDate,
        hospitalName: cleanHosp,
        doctorName: cleanDoctor,
        purpose: log.purpose || 'Tra cứu liên viện tiếp nhận điều trị',
        accessedData: log.accessedData || 'Lịch sử khám, Chẩn đoán, Đơn thuốc',
        status: 'SUCCESS' as const,
        note: log.ipAddress ? `IP: ${log.ipAddress}` : undefined,
      };
    });
  }, [rawServerAuditLogs]);

  // State quản lý mở/đóng danh sách lần khám của từng bệnh viện (mặc định thu gọn)
  const [expandedHospitals, setExpandedHospitals] = useState<Record<string, boolean>>({});

  const toggleHospitalExpand = (hospId: string) => {
    setExpandedHospitals((prev) => ({
      ...prev,
      [hospId]: !prev[hospId],
    }));
  };

  // Fetch real appointments / encounters from database
  const { data: allAppointments = [], isLoading: isLoadingAppointments, refetch: refetchAppointments } = useQuery({
    queryKey: ['user-all-appointments-so-suc-khoe'],
    queryFn: () => appointmentService.getAll(),
  });

  // Filter completed visits by selected profile
  const completedAppointments = useMemo(() => {
    return allAppointments.filter((a: any) => {
      const isCompleted = a.medicalEncounter || a.status === 'COMPLETED';
      if (!isCompleted) return false;
      if (!selectedProfile) return true;
      return a.patientProfileId === selectedProfile.id || (!a.patientProfileId && selectedProfile.isDefault);
    });
  }, [allAppointments, selectedProfile]);

  // Bộ lọc & Tìm kiếm hồ sơ bệnh án
  const [filterDateSort, setFilterDateSort] = useState<'DESC' | 'ASC'>('DESC');
  const [filterTimePreset, setFilterTimePreset] = useState<'ALL' | '30DAYS' | '90DAYS' | '1YEAR'>('ALL');
  const [filterSpecialty, setFilterSpecialty] = useState<string>('ALL');
  const [filterHospital, setFilterHospital] = useState<string>('ALL');
  const [searchKeyword, setSearchKeyword] = useState<string>('');

  // Danh sách chuyên khoa có trong các đợt khám thực tế
  const availableSpecialties = useMemo(() => {
    const set = new Set<string>();
    completedAppointments.forEach((apt: any) => {
      const clinical = getClinicalBreakdown(apt);
      if (clinical.specialtyName) set.add(clinical.specialtyName);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'vi'));
  }, [completedAppointments]);

  // Danh sách bệnh viện có trong các đợt khám thực tế
  const availableHospitals = useMemo(() => {
    const set = new Set<string>();
    completedAppointments.forEach((apt: any) => {
      const hosp = apt.slot?.doctorWorkplace?.hospital || apt.medicalEncounter?.hospital;
      const hospName = hosp?.name || apt.medicalEncounter?.hospitalName;
      if (hospName) set.add(hospName);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'vi'));
  }, [completedAppointments]);

  // Danh sách đợt khám đã qua lọc và sắp xếp
  const filteredAppointments = useMemo(() => {
    return completedAppointments
      .filter((apt: any) => {
        const enc = apt.medicalEncounter;
        const doctor = apt.slot?.doctorWorkplace?.doctor;
        const hospital = apt.slot?.doctorWorkplace?.hospital || enc?.hospital;
        const hospName = hospital?.name || enc?.hospitalName || 'Bệnh viện Đa khoa NovaCare Sài Gòn';
        const clinical = getClinicalBreakdown(apt);
        const specialtyName = clinical.specialtyName;
        const doctorName = enc?.doctorName || doctor?.fullName || 'Bác sĩ chuyên khoa';
        const aptDate = new Date(apt.slot?.startTime || apt.createdAt);

        // 1. Lọc theo chuyên khoa
        if (filterSpecialty !== 'ALL' && specialtyName !== filterSpecialty) {
          return false;
        }

        // 2. Lọc theo bệnh viện
        if (filterHospital !== 'ALL' && hospName !== filterHospital) {
          return false;
        }

        // 3. Lọc theo khoảng thời gian gần nhất
        if (filterTimePreset !== 'ALL') {
          const now = Date.now();
          const diffDays = (now - aptDate.getTime()) / (1000 * 60 * 60 * 24);
          if (filterTimePreset === '30DAYS' && diffDays > 30) return false;
          if (filterTimePreset === '90DAYS' && diffDays > 90) return false;
          if (filterTimePreset === '1YEAR' && diffDays > 365) return false;
        }

        // 4. Tìm kiếm từ khóa (bác sĩ, bệnh viện, chuyên khoa, chẩn đoán, lý do khám)
        if (searchKeyword.trim()) {
          const q = searchKeyword.toLowerCase().trim();
          const matchHosp = hospName.toLowerCase().includes(q);
          const matchDoctor = doctorName.toLowerCase().includes(q);
          const matchSpec = specialtyName.toLowerCase().includes(q);
          const matchReason = (apt.reason || '').toLowerCase().includes(q);
          const matchDiag = (clinical.diagText || '').toLowerCase().includes(q);
          if (!matchHosp && !matchDoctor && !matchSpec && !matchReason && !matchDiag) {
            return false;
          }
        }

        return true;
      })
      .sort((a: any, b: any) => {
        const timeA = new Date(a.slot?.startTime || a.createdAt).getTime();
        const timeB = new Date(b.slot?.startTime || b.createdAt).getTime();
        return filterDateSort === 'DESC' ? timeB - timeA : timeA - timeB;
      });
  }, [completedAppointments, filterSpecialty, filterHospital, filterTimePreset, searchKeyword, filterDateSort]);

  // Reset page when filter criteria change
  useEffect(() => {
    setPageHistory(1);
  }, [filterSpecialty, filterHospital, filterTimePreset, searchKeyword, filterDateSort]);

  // Group filtered appointments by Hospital
  const filteredHospitalGroups = useMemo(() => {
    const map = new Map<string, {
      hospitalId: string;
      hospitalName: string;
      hospitalAddress?: string;
      totalVisits: number;
      latestVisitDate?: Date;
      appointments: any[];
    }>();

    filteredAppointments.forEach((apt: any) => {
      const hosp = apt.slot?.doctorWorkplace?.hospital || apt.medicalEncounter?.hospital;
      const hospId = hosp?.id || hosp?.name || 'unknown-hospital';
      const hospName = hosp?.name || 'Bệnh viện Đa khoa Liên thông';
      const hospAddress = hosp?.address || 'TP. Hồ Chí Minh';
      const aptDate = new Date(apt.slot?.startTime || apt.createdAt);

      if (!map.has(hospId)) {
        map.set(hospId, {
          hospitalId: hospId,
          hospitalName: hospName,
          hospitalAddress: hospAddress,
          totalVisits: 0,
          latestVisitDate: aptDate,
          appointments: [],
        });
      }

      const group = map.get(hospId)!;
      group.totalVisits += 1;
      if (!group.latestVisitDate || aptDate > group.latestVisitDate) {
        group.latestVisitDate = aptDate;
      }
      group.appointments.push(apt);
    });

    // Sort encounters within each hospital
    map.forEach((g) => {
      g.appointments.sort((a, b) => {
        const timeA = new Date(a.slot?.startTime || a.createdAt).getTime();
        const timeB = new Date(b.slot?.startTime || b.createdAt).getTime();
        return filterDateSort === 'DESC' ? timeB - timeA : timeA - timeB;
      });
    });

    return Array.from(map.values());
  }, [filteredAppointments, filterDateSort]);

  // Paginated Hospital Groups for Tab 1
  const paginatedHospitalGroups = useMemo(() => {
    const start = (pageHistory - 1) * pageSizeHistory;
    return filteredHospitalGroups.slice(start, start + pageSizeHistory);
  }, [filteredHospitalGroups, pageHistory, pageSizeHistory]);

  const isFiltered =
    filterDateSort !== 'DESC' ||
    filterTimePreset !== 'ALL' ||
    filterSpecialty !== 'ALL' ||
    filterHospital !== 'ALL' ||
    searchKeyword.trim().length > 0;

  const resetFilters = () => {
    setFilterDateSort('DESC');
    setFilterTimePreset('ALL');
    setFilterSpecialty('ALL');
    setFilterHospital('ALL');
    setSearchKeyword('');
    setPageHistory(1);
  };

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
    if (secs <= 0) return 'Đã hết hạn';

    const days = Math.floor(secs / 86400);
    const hours = Math.floor((secs % 86400) / 3600);
    const minutes = Math.floor((secs % 3600) / 60);
    const seconds = secs % 60;

    if (days > 0) {
      return `${days} ngày ${hours > 0 ? `${hours} giờ ` : ''}${minutes} phút`;
    }
    if (hours > 0) {
      return `${hours} giờ ${minutes.toString().padStart(2, '0')} phút ${seconds.toString().padStart(2, '0')}s`;
    }
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Section Options List: Phạm vi dữ liệu chia sẻ chuẩn Hồ Sơ Bệnh Án (EMR)
  const availableSections = [
    {
      id: 'Thông tin hành chính',
      label: 'Thông tin hành chính',
      description: 'Thông tin định danh và thông tin người bệnh',
      icon: UserCheck,
    },
    {
      id: 'Thông tin lần khám',
      label: 'Thông tin lần khám',
      description: 'Lý do khám, tiền sử, quản lý người bệnh',
      icon: Calendar,
    },
    {
      id: 'Kết quả khám',
      label: 'Kết quả khám',
      description: 'Khám toàn thân, dấu hiệu sinh tồn, khám chuyên khoa',
      icon: HeartPulse,
    },
    {
      id: 'Cận lâm sàng',
      label: 'Cận lâm sàng',
      description: 'Xét nghiệm và kết quả chẩn đoán hình ảnh',
      icon: TestTube,
    },
    {
      id: 'Chẩn đoán',
      label: 'Chẩn đoán',
      description: 'Chẩn đoán và mã ICD-10',
      icon: FileText,
    },
    {
      id: 'Điều trị',
      label: 'Điều trị',
      description: 'Hướng điều trị và đơn thuốc',
      icon: Pill,
    },
    {
      id: 'Kết quả & tái khám',
      label: 'Kết quả & tái khám',
      description: 'Kết quả điều trị, tình trạng ra về, lịch tái khám',
      icon: RotateCcw,
    },
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

    if (usePinCode && customPin.trim().length < 4) {
      toast.error('Vui lòng nhập mã PIN bảo mật có từ 4 đến 6 chữ số');
      return;
    }

    const finalPin = usePinCode && customPin.trim() ? customPin.trim() : undefined;
    const randomPart1 = Math.random().toString(36).substring(2, 6).toUpperCase();
    const randomPart2 = Math.random().toString(36).substring(2, 6).toUpperCase();
    let newCodeString = `NC-${randomPart1}-${randomPart2}`;
    let backendShareId: string | null = null;
    let backendPinCode: string | undefined = finalPin;
    const targetHospName = hospitalAccessOption === 'ANY' ? 'Bất kỳ bệnh viện nào có mã' : selectedHospitalName;

    try {
      const res = await interoperabilityService.createShareCode({
        validMinutes: selectedDurationMins,
        allowedSections: selectedSections,
        sharedWith: targetHospName,
        customToken: newCodeString,
        pinCode: finalPin,
      });
      const realShare = (res as any)?.data || res;
      if (realShare && (realShare.shareToken || realShare.id)) {
        newCodeString = realShare.shareToken || newCodeString;
        backendShareId = realShare.id;
        if (realShare.pinCode) {
          backendPinCode = realShare.pinCode;
        }
      }
      refetchShareCodes();
    } catch (err) {
      console.log('Backend createShareCode note:', err);
    }

    const validUntilDate = new Date(Date.now() + selectedDurationMins * 60 * 1000);

    const newCodeItem: ShareCodeItem = {
      id: backendShareId || `sc-${Date.now()}`,
      code: newCodeString,
      status: 'ACTIVE',
      validUntil: validUntilDate,
      secondsLeft: selectedDurationMins * 60,
      hospitalName: targetHospName,
      sections: selectedSections,
      createdAt: new Date(),
      pinCode: backendPinCode,
    };

    setShareCodes([newCodeItem, ...shareCodes.filter((c) => c.code !== newCodeString)]);
    setIsCreateModalOpen(false);
    if (backendPinCode) {
      toast.success(`Đã tạo mã ${newCodeString} (Mã PIN: ${backendPinCode}) thành công!`);
    } else {
      toast.success(`Đã tạo mã chia sẻ ${newCodeString} thành công!`);
    }
  };

  // Revoke Code Handler
  const handleRevokeCode = async (id: string) => {
    const targetCode = shareCodes.find((c) => c.id === id);
    if (!targetCode) return;

    if (confirm(`Bạn có chắc chắn muốn thu hồi quyền truy cập của mã ${targetCode.code}?`)) {
      try {
        if (!id.startsWith('sc-')) {
          await interoperabilityService.revokeShareCode(id);
        }
      } catch (err) {
        console.log('Backend revokeShare note:', err);
      }

      setShareCodes((prev) =>
        prev.map((c) => (c.id === id ? { ...c, status: 'REVOKED', secondsLeft: 0 } : c))
      );
      refetchShareCodes();
      toast.success(`Đã thu hồi thành công mã ${targetCode.code}!`);
    }
  };

  const activeCodesCount = shareCodes.filter((c) => c.status === 'ACTIVE' && c.secondsLeft > 0).length;
  const currentActiveCode = shareCodes.find((c) => c.status === 'ACTIVE' && c.secondsLeft > 0);

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

  // Paginated Hospitals for Tab 2
  const paginatedHospitals = useMemo(() => {
    const start = (pageHospitals - 1) * pageSizeHospitals;
    return dynamicLinkedHospitals.slice(start, start + pageSizeHospitals);
  }, [dynamicLinkedHospitals, pageHospitals, pageSizeHospitals]);

  // Paginated Audit Logs for Tab 3
  const paginatedAuditLogs = useMemo(() => {
    const start = (pageAuditLogs - 1) * pageSizeAuditLogs;
    return auditLogs.slice(start, start + pageSizeAuditLogs);
  }, [auditLogs, pageAuditLogs, pageSizeAuditLogs]);

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
      {/* 1. TIÊU ĐỀ TRANG (BÊN NGOÀI THẺ TRẮNG) */}
      {/* ========================================================= */}
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-slate-200/80 border border-slate-300/80 flex items-center justify-center text-slate-800 shrink-0">
          <FileText className="w-4 h-4" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Sổ Sức Khỏe Điện Tử
        </h1>
        <span className="px-2.5 py-0.5 rounded-full text-xs font-medium border border-slate-300 text-slate-700 bg-white/50">
          Chuẩn Bộ Y Tế • EMR
        </span>
      </div>

      {/* ========================================================= */}
      {/* 2. THẺ CHÍNH: THÔNG TIN BỆNH NHÂN & MÃ ĐỊNH DANH */}
      {/* ========================================================= */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs space-y-5">
        {/* Hàng trên: Avatar, Tên người dùng, Quan hệ & Nút Quản lý hồ sơ */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full border border-slate-300 flex items-center justify-center text-slate-700 bg-white shrink-0">
              <User className="w-5 h-5 text-slate-700" />
            </div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-xl font-bold text-slate-900">
                {selectedProfile?.fullName || 'Nguyễn Thị Minh Thu1'}
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-medium border border-slate-300 text-slate-600 bg-white">
                {selectedProfile?.relation || 'Bản thân'}
              </span>
            </div>
          </div>

          <Link
            href="/ho-so"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-900 text-xs font-bold transition shadow-2xs shrink-0 self-start sm:self-auto cursor-pointer"
          >
            <Settings className="w-3.5 h-3.5 text-slate-600" />
            <span>Quản lý hồ sơ</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          </Link>
        </div>

        {/* Thanh chuyển đổi hồ sơ (Bản thân / Người thân) */}
        {profiles.length > 1 && (
          <div className="flex items-center gap-2 pt-2 border-t border-slate-100 overflow-x-auto no-scrollbar">
            <span className="text-xs font-semibold text-slate-500 shrink-0 flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-slate-400" />
              <span>Xem hồ sơ:</span>
            </span>
            <div className="flex items-center gap-1.5 flex-wrap">
              {profiles.map((prof) => {
                const isSelected = selectedProfile?.id === prof.id;
                return (
                  <button
                    key={prof.id}
                    type="button"
                    onClick={() => {
                      setSelectedProfile(prof);
                      setPageHistory(1);
                    }}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200/80'
                    }`}
                  >
                    <span>{prof.fullName}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-md font-medium ${
                        isSelected
                          ? 'bg-emerald-700/80 text-emerald-100'
                          : 'bg-slate-200/90 text-slate-600'
                      }`}
                    >
                      {prof.relation || (prof.isDefault ? 'Bản thân' : 'Người thân')}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Hàng dưới: Cột trái (CCCD/BHYT) & Cột phải (Khung Mã Định Danh) */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
          {/* Cột trái: CCCD & BHYT (5 cols) */}
          <div className="md:col-span-5 space-y-3 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-slate-500 font-medium text-xs">CCCD:</span>
              <span className="font-mono font-bold text-slate-900 text-xs">
                {selectedProfile?.identityNumber || '080303008255'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-slate-500 font-medium text-xs">BHYT:</span>
              {selectedProfile?.healthInsurance ? (
                <span className="font-mono font-bold text-emerald-800 text-xs bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  {selectedProfile.healthInsurance}
                </span>
              ) : (
                <Link
                  href="/ho-so"
                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 text-xs font-bold transition cursor-pointer"
                >
                  <Plus className="w-3 h-3 text-amber-700" />
                  <span>Cập nhật</span>
                </Link>
              )}
            </div>
          </div>

          {/* Cột phải: Thẻ Mã Định Danh (7 cols) - Nổi bật thanh lịch với viền nhấn emerald */}
          <div className="md:col-span-7 bg-slate-50/90 rounded-2xl p-4.5 border border-slate-200 border-l-[3.5px] border-l-emerald-600 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs text-slate-700 font-bold">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Mã Định Danh Y Tế Trung Tâm</span>
              </div>
              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                Toàn quốc
              </span>
            </div>

            <div className="flex items-center gap-2 pt-0.5">
              <div className="text-lg sm:text-xl font-black font-mono text-slate-900 tracking-wider">
                {masterPatientId || 'NOVA-PAT-8255'}
              </div>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(masterPatientId);
                  toast.success(`Đã sao chép mã định danh: ${masterPatientId}`);
                }}
                title="Sao chép mã định danh"
                className="inline-flex items-center gap-1 px-2 py-1 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 shadow-2xs transition cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5 text-slate-500" />
                <span>Sao chép</span>
              </button>
            </div>

            {/* Hàng Mã PIN bảo mật cá nhân */}
            <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-200/80 flex-wrap">
              <div className="flex items-center gap-1.5 text-xs">
                <KeyRound className="w-3.5 h-3.5 text-amber-600" />
                <span className="text-slate-500 font-medium">Mã PIN bảo mật:</span>
                <span className="font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                  {identityData?.hasPin ? '•••••• (Đã kích hoạt)' : 'Chưa đặt (4 số cuối CCCD)'}
                </span>
              </div>

              <button
                type="button"
                onClick={() => {
                  setPinInput('');
                  setPinConfirmInput('');
                  setIsPinModalOpen(true);
                }}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg text-xs font-bold transition cursor-pointer shadow-2xs"
              >
                <KeyRound className="w-3 h-3 text-emerald-700" />
                <span>{identityData?.hasPin ? 'Đổi mã PIN' : 'Cài đặt mã PIN'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 3. 4 THẺ THỐNG KÊ (STAT CARDS CÓ ĐIỀU HƯỚNG RÕ RÀNG) */}
      {/* ========================================================= */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Thẻ 1: CƠ SỞ KCB ĐÃ KHÁM */}
        <div
          onClick={() => setActiveTab('HOSPITALS')}
          className="group bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs hover:border-slate-400 hover:shadow-xs transition-all cursor-pointer flex flex-col justify-between h-[130px]"
        >
          <div className="flex items-start justify-between">
            <span className="text-[11px] font-bold text-slate-500 group-hover:text-slate-900 uppercase tracking-wider transition-colors">
              CƠ SỞ KCB ĐÃ KHÁM
            </span>
            <Building2 className="w-5 h-5 text-slate-600 group-hover:text-emerald-700 transition-colors" />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-slate-900">{dynamicLinkedHospitals.length}</span>
              <span className="text-xs font-medium text-slate-500 ml-1">cơ sở</span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-800 group-hover:translate-x-0.5 transition-all" />
          </div>

          <p className="text-[11px] text-slate-500 font-medium truncate">
            Bệnh viện & Phòng khám liên thông
          </p>
        </div>

        {/* Thẻ 2: TỔNG LƯỢT KHÁM */}
        <div
          onClick={() => setActiveTab('HISTORY')}
          className="group bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs hover:border-slate-400 hover:shadow-xs transition-all cursor-pointer flex flex-col justify-between h-[130px]"
        >
          <div className="flex items-start justify-between">
            <span className="text-[11px] font-bold text-slate-500 group-hover:text-slate-900 uppercase tracking-wider transition-colors">
              TỔNG LƯỢT KHÁM
            </span>
            <Stethoscope className="w-5 h-5 text-slate-600 group-hover:text-emerald-700 transition-colors" />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-slate-900">{completedAppointments.length}</span>
              <span className="text-xs font-medium text-slate-500 ml-1">lượt</span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-800 group-hover:translate-x-0.5 transition-all" />
          </div>

          <p className="text-[11px] text-slate-500 font-medium truncate">
            Hồ sơ đã được lưu trữ an toàn
          </p>
        </div>

        {/* Thẻ 3: ĐƠN THUỐC ĐIỆN TỬ (RX) */}
        <div
          onClick={() => setActiveTab('HISTORY')}
          className="group bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs hover:border-slate-400 hover:shadow-xs transition-all cursor-pointer flex flex-col justify-between h-[130px]"
        >
          <div className="flex items-start justify-between">
            <span className="text-[11px] font-bold text-slate-500 group-hover:text-slate-900 uppercase tracking-wider transition-colors">
              ĐƠN THUỐC ĐIỆN TỬ (RX)
            </span>
            <Pill className="w-5 h-5 text-slate-600 group-hover:text-emerald-700 transition-colors" />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-slate-900">{totalPrescriptionsCount}</span>
              <span className="text-xs font-medium text-slate-500 ml-1">đơn</span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-800 group-hover:translate-x-0.5 transition-all" />
          </div>

          <p className="text-[11px] text-slate-500 font-medium truncate">
            Cấp theo chuẩn Thông tư 27/BYT
          </p>
        </div>

        {/* Thẻ 4: MÃ PIN BẢO MẬT HỒ SƠ */}
        <div
          onClick={() => {
            setPinInput('');
            setPinConfirmInput('');
            setIsPinModalOpen(true);
          }}
          className="group bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs hover:border-slate-400 hover:shadow-xs transition-all cursor-pointer flex flex-col justify-between h-[130px]"
        >
          <div className="flex items-start justify-between">
            <span className="text-[11px] font-bold text-slate-500 group-hover:text-slate-900 uppercase tracking-wider transition-colors">
              MÃ PIN BẢO MẬT
            </span>
            <KeyRound className="w-5 h-5 text-amber-600 group-hover:text-emerald-700 transition-colors" />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-baseline gap-1">
              <span className="text-xl sm:text-2xl font-black text-slate-900 font-mono tracking-widest">
                {identityData?.hasPin ? '••••••' : 'Chưa đặt'}
              </span>
            </div>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border ${
              identityData?.hasPin
                ? 'text-emerald-800 bg-emerald-50 border-emerald-200'
                : 'text-amber-800 bg-amber-50 border-amber-200'
            }`}>
              {identityData?.hasPin ? 'Đã kích hoạt' : 'Thiết lập ngay'}
            </span>
          </div>

          <p className="text-[11px] text-slate-500 font-medium truncate">
            Bảo vệ tra cứu liên thông y tế
          </p>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 3. TABS NAVIGATION */}
      {/* ========================================================= */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab('HISTORY')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer shrink-0 ${activeTab === 'HISTORY'
            ? 'bg-slate-900 text-white shadow-xs'
            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
        >
          <FileText className="w-4 h-4" />
          <span>Danh sách bệnh án điện tử ({completedAppointments.length} lượt khám)</span>
        </button>

        <button
          onClick={() => setActiveTab('HOSPITALS')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer shrink-0 ${activeTab === 'HOSPITALS'
            ? 'bg-slate-900 text-white shadow-xs'
            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Cơ sở KCB liên thông ({dynamicLinkedHospitals.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('PASSPORT')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer shrink-0 ${activeTab === 'PASSPORT'
            ? 'bg-slate-900 text-white shadow-xs'
            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Định danh y tế & Nhật ký Bác sĩ tra cứu ({auditLogs.length})</span>
        </button>
      </div>

      {/* ========================================================= */}
      {/* TAB 1: CLINICAL HISTORY LIST */}
      {/* ========================================================= */}
      {activeTab === 'HISTORY' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-black text-slate-900">
                Danh Sách Bệnh Án Điện Tử (EMR)
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Toàn bộ hồ sơ khám bệnh, chẩn đoán và đơn thuốc điện tử được lưu trữ tập trung.
              </p>
            </div>
            <div className="flex items-center gap-2">
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

          {/* Filter Bar: Tìm kiếm theo Ngày gần nhất, Chuyên khoa, Bệnh viện & Từ khóa */}
          {completedAppointments.length > 0 && (
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3.5">
              {/* Hàng 1: Ô tìm kiếm nhanh */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  placeholder="Tìm nhanh theo tên bác sĩ, chẩn đoán, bệnh viện, chuyên khoa..."
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
                />
                {searchKeyword && (
                  <button
                    onClick={() => setSearchKeyword('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Hàng 2: Các bộ chọn filter: Sắp xếp ngày / Thời gian / Chuyên khoa / Bệnh viện */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* Lọc 1: Thứ tự ngày (Gần nhất / Xa nhất) */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Sắp xếp thời gian</span>
                  </label>
                  <select
                    value={filterDateSort}
                    onChange={(e) => setFilterDateSort(e.target.value as 'DESC' | 'ASC')}
                    className="w-full text-xs font-semibold text-slate-800 bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                  >
                    <option value="DESC">📅 Ngày gần nhất (Mới nhất)</option>
                    <option value="ASC">📅 Ngày xa nhất (Cũ nhất)</option>
                  </select>
                </div>

                {/* Lọc 2: Khoảng thời gian */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-teal-600" />
                    <span>Khoảng thời gian</span>
                  </label>
                  <select
                    value={filterTimePreset}
                    onChange={(e) => setFilterTimePreset(e.target.value as any)}
                    className="w-full text-xs font-semibold text-slate-800 bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                  >
                    <option value="ALL">Tất cả thời gian</option>
                    <option value="30DAYS">30 ngày gần đây</option>
                    <option value="90DAYS">3 tháng gần đây</option>
                    <option value="1YEAR">1 năm gần đây</option>
                  </select>
                </div>

                {/* Lọc 3: Chuyên khoa */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                    <Stethoscope className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Chuyên khoa</span>
                  </label>
                  <select
                    value={filterSpecialty}
                    onChange={(e) => setFilterSpecialty(e.target.value)}
                    className="w-full text-xs font-semibold text-slate-800 bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                  >
                    <option value="ALL">Tất cả chuyên khoa</option>
                    {availableSpecialties.map((spec) => (
                      <option key={spec} value={spec}>
                        {spec}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Lọc 4: Bệnh viện */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5 text-blue-600" />
                    <span>Bệnh viện / Cơ sở</span>
                  </label>
                  <select
                    value={filterHospital}
                    onChange={(e) => setFilterHospital(e.target.value)}
                    className="w-full text-xs font-semibold text-slate-800 bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer truncate"
                  >
                    <option value="ALL">Tất cả bệnh viện</option>
                    {availableHospitals.map((hosp) => (
                      <option key={hosp} value={hosp}>
                        {hosp}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Hàng 3: Thống kê kết quả & Nút Reset bộ lọc */}
              <div className="flex items-center justify-between pt-1 text-xs border-t border-slate-100">
                <div className="text-slate-600 font-medium">
                  Hiển thị <strong className="text-slate-900 font-bold">{filteredAppointments.length}</strong> / {completedAppointments.length} hồ sơ bệnh án
                  {isFiltered && <span className="text-emerald-700 font-semibold ml-1.5 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">Đang lọc</span>}
                </div>

                {isFiltered && (
                  <button
                    onClick={resetFilters}
                    className="inline-flex items-center gap-1 text-emerald-700 hover:text-emerald-800 font-bold hover:underline cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Đặt lại bộ lọc</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Hospital-grouped Encounters List */}
          <div className="space-y-4">
            {completedAppointments.length > 0 ? (
              filteredHospitalGroups.length > 0 ? (
                <>
                  {paginatedHospitalGroups.map((group) => {
                    const isExpanded = !!expandedHospitals[group.hospitalId];
                    const latestDateFormatted = group.latestVisitDate
                      ? format(group.latestVisitDate, 'dd/MM/yyyy', { locale: vi })
                      : null;

                    return (
                      <div
                        key={group.hospitalId}
                        className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:border-slate-300 transition-all overflow-hidden"
                      >
                        {/* 1. Hospital Header (Click to expand/collapse visits) */}
                        <div
                          onClick={() => toggleHospitalExpand(group.hospitalId)}
                          className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/60 transition select-none"
                        >
                          <div className="flex items-start gap-3.5">
                            <div className="w-11 h-11 rounded-xl bg-slate-100 border border-slate-200 text-slate-800 flex items-center justify-center font-bold shrink-0 mt-0.5">
                              <Building2 className="w-5 h-5 text-slate-700" />
                            </div>
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="text-base font-extrabold text-slate-900 leading-snug">
                                  {group.hospitalName}
                                </h4>
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-700 bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-full">
                                  {group.appointments.length} lượt khám
                                </span>
                              </div>
                              <p className="text-xs text-slate-500 flex items-center gap-1">
                                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                <span>{group.hospitalAddress || 'TP. Hồ Chí Minh'}</span>
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                            {latestDateFormatted && (
                              <div className="text-xs text-slate-500 font-medium hidden sm:block text-right">
                                <div>Khám gần nhất:</div>
                                <strong className="text-slate-800 font-bold">{latestDateFormatted}</strong>
                              </div>
                            )}

                            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200/80 px-3 py-1.5 rounded-xl transition">
                              <span>{isExpanded ? 'Thu gọn' : `Xem ${group.appointments.length} lần khám`}</span>
                              <ChevronDown
                                className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${
                                  isExpanded ? 'rotate-180 text-slate-900' : ''
                                }`}
                              />
                            </div>
                          </div>
                        </div>

                        {/* 2. Expanded Encounters List */}
                        {isExpanded && (
                          <div className="border-t border-slate-200 bg-slate-50/50 p-4 sm:p-5 space-y-3">
                            <div className="flex items-center justify-between text-xs text-slate-500 font-semibold px-1">
                              <span>Chi tiết các lần khám tại {group.hospitalName} ({group.appointments.length})</span>
                              <span className="text-[11px] text-slate-400 hidden sm:inline">Nhấn &quot;Xem bệnh án (EMR)&quot; để tra cứu chi tiết</span>
                            </div>

                            <div className="space-y-2.5">
                              {group.appointments.map((apt: any, idx: number) => {
                                const enc = apt.medicalEncounter;
                                const doctor = apt.slot?.doctorWorkplace?.doctor;
                                const clinical = getClinicalBreakdown(apt);
                                const specialtyName = clinical.specialtyName;
                                const doctorName = enc?.doctorName || doctor?.fullName || 'Bác sĩ chuyên khoa';
                                const dateObj = apt.slot?.startTime ? new Date(apt.slot.startTime) : new Date(apt.createdAt);
                                const dateFormatted = format(dateObj, 'dd/MM/yyyy', { locale: vi });
                                const timeFormatted = format(dateObj, 'HH:mm', { locale: vi });

                                return (
                                  <div
                                    key={apt.id || idx}
                                    className="border border-slate-200 bg-white rounded-xl shadow-2xs p-4 hover:border-slate-300 hover:shadow-xs transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                                  >
                                    <div className="space-y-1 text-left">
                                      <div className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
                                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                        <span>Ngày {dateFormatted} · {timeFormatted !== '00:00' ? timeFormatted : '14:30'}</span>
                                      </div>
                                      <div className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                                        <Stethoscope className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                        <span>{specialtyName} · {doctorName}</span>
                                      </div>
                                      <div className="text-xs text-slate-600 font-medium">
                                        Chẩn đoán: <span className="text-slate-800 font-semibold">{clinical.diagText || 'Khám tổng quát'}</span>
                                      </div>
                                    </div>

                                    <Button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleOpenEMR(apt);
                                      }}
                                      className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs h-9 px-4 rounded-xl shadow-xs gap-1.5 cursor-pointer shrink-0 self-start sm:self-auto transition-colors"
                                    >
                                      <FileText className="w-3.5 h-3.5 text-slate-300" />
                                      <span>Xem bệnh án (EMR)</span>
                                    </Button>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Pagination Control for Tab 1 (Paginated by Hospital) */}
                  <TablePagination
                    currentPage={pageHistory}
                    totalPages={Math.max(1, Math.ceil(filteredHospitalGroups.length / pageSizeHistory))}
                    totalItems={filteredHospitalGroups.length}
                    pageSize={pageSizeHistory}
                    onPageChange={(p) => {
                      setPageHistory(p);
                      window.scrollTo({ top: 350, behavior: 'smooth' });
                    }}
                    itemName="bệnh viện"
                  />
                </>
              ) : (
                /* No Results for Current Filter */
                <Card className="border-slate-200 bg-white rounded-2xl p-8 text-center space-y-3 shadow-xs">
                  <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center mx-auto">
                    <Search className="w-6 h-6" />
                  </div>
                  <div className="space-y-1 max-w-sm mx-auto">
                    <h4 className="text-base font-bold text-slate-900">Không tìm thấy hồ sơ nào phù hợp</h4>
                    <p className="text-xs text-slate-500">
                      Không có đợt khám nào khớp với tiêu chí ngày, chuyên khoa hoặc bệnh viện đã chọn.
                    </p>
                  </div>
                  <Button
                    onClick={resetFilters}
                    variant="outline"
                    size="sm"
                    className="text-xs font-bold gap-1.5 rounded-xl border-slate-300 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Xóa bộ lọc & Xem tất cả</span>
                  </Button>
                </Card>
              )
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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-black text-slate-900">
                Cơ Sở Khám Chữa Bệnh Liên Thông
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Mỗi cơ sở y tế đều được ánh xạ mã bệnh nhân nội bộ (Hospital PID) để liên thông dữ liệu y tế tức thì.
              </p>
            </div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 self-start sm:self-auto shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Đang liên thông: <strong className="text-slate-900">{dynamicLinkedHospitals.length}</strong> cơ sở</span>
            </div>
          </div>

          {dynamicLinkedHospitals.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4.5">
                {paginatedHospitals.map((h) => (
                  <div
                    key={h.id}
                    className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:border-slate-300 hover:shadow-sm transition flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-3.5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 text-slate-800 flex items-center justify-center font-bold shrink-0">
                          <Building2 className="w-5 h-5" />
                        </div>
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          {h.status}
                        </span>
                      </div>

                      <div>
                        <h4 className="font-extrabold text-slate-900 text-sm leading-snug">{h.name}</h4>
                        <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="line-clamp-1">{h.address}</span>
                        </p>
                      </div>

                      <div className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-200 text-xs space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500 font-medium">Mã BN tại viện:</span>
                          <span className="font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded-md border border-slate-200 text-[11px]">
                            {h.pid}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500 font-medium">Số lượt khám:</span>
                          <strong className="text-slate-900 font-bold">{h.visits} lượt khám</strong>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setFilterHospital(h.name);
                        setActiveTab('HISTORY');
                      }}
                      className="w-full py-2.5 px-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800 font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                    >
                      <span>Xem lịch sử tại bệnh viện này</span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Pagination Control for Tab 2 */}
              <TablePagination
                currentPage={pageHospitals}
                totalPages={Math.max(1, Math.ceil(dynamicLinkedHospitals.length / pageSizeHospitals))}
                totalItems={dynamicLinkedHospitals.length}
                pageSize={pageSizeHospitals}
                onPageChange={(p) => {
                  setPageHospitals(p);
                  window.scrollTo({ top: 350, behavior: 'smooth' });
                }}
                itemName="cơ sở KCB"
              />
            </>
          ) : (
            <div className="border border-slate-200 bg-white rounded-2xl p-8 text-center space-y-3 shadow-xs">
              <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <Building2 className="w-6 h-6" />
              </div>
              <p className="text-xs text-slate-500 font-medium max-w-sm mx-auto">
                Chưa có cơ sở y tế nào được liên kết. Cơ sở y tế sẽ tự động liên kết khi bạn hoàn tất buổi khám đầu tiên.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 3: ĐỊNH DANH Y TẾ & NHẬT KÝ BÁC SĨ TRA CỨU */}
      {/* ========================================================= */}
      {activeTab === 'PASSPORT' && (
        <div className="space-y-6">

          {/* Thẻ Căn Cước Y Tế & Mã PIN Bảo Mật */}
          <div className="bg-white rounded-3xl border border-slate-200 border-l-[5px] border-l-emerald-600 p-6 sm:p-7 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Cổng Liên Thông Y Tế Quốc Gia (Đề án 06 / VNeID)</span>
                </div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                    Định Danh Y Tế & Mã PIN Bảo Mật
                  </h2>
                  <span className="px-3 py-1 rounded-xl text-xs font-bold bg-slate-100 text-slate-800 border border-slate-200">
                    {selectedProfile?.fullName || 'Người bệnh'} ({selectedProfile?.relation || 'Bản thân'})
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-500 font-medium leading-relaxed">
                  Khi đưa người bệnh đến khám tại bất kỳ Bệnh viện nào, chỉ cần cung cấp <strong>Mã Định Danh ({masterPatientId || 'NOVA-PAT-8255'})</strong> hoặc <strong>Số CCCD</strong> cùng <strong>Mã PIN bảo mật</strong> này để Bác sĩ mở hồ sơ bệnh án liên thông.
                </p>
              </div>

              <Button
                onClick={() => {
                  setPinInput('');
                  setPinConfirmInput('');
                  setIsPinModalOpen(true);
                }}
                className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm px-5 py-3 h-auto rounded-xl shadow-xs gap-2 shrink-0 cursor-pointer transition transform active:scale-95"
              >
                <KeyRound className="w-4 h-4 text-amber-400" />
                <span>{identityData?.hasPin ? 'Đổi mã PIN bảo mật' : 'Cài đặt mã PIN'}</span>
              </Button>
            </div>

            {/* Thanh chuyển nhanh hồ sơ người thân trực tiếp trong Tab Định Danh */}
            {profiles.length > 1 && (
              <div className="flex items-center gap-2 p-3 bg-slate-50/90 border border-slate-200 rounded-2xl overflow-x-auto no-scrollbar">
                <span className="text-xs font-bold text-slate-600 shrink-0 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-emerald-600" />
                  <span>Xem mã của:</span>
                </span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {profiles.map((prof) => {
                    const isSelected = selectedProfile?.id === prof.id;
                    return (
                      <button
                        key={prof.id}
                        type="button"
                        onClick={() => {
                          setSelectedProfile(prof);
                          setPageHistory(1);
                        }}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-300/80'
                        }`}
                      >
                        <span>{prof.fullName}</span>
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded-md font-medium ${
                            isSelected
                              ? 'bg-emerald-700/80 text-emerald-100'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {prof.relation || (prof.isDefault ? 'Bản thân' : 'Người thân')}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Box 1: Mã Định Danh Trung Tâm */}
              <div className="bg-slate-50/90 border border-slate-200 rounded-2xl p-4.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Mã Sổ Y Tế Điện Tử</span>
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    Trung tâm
                  </span>
                </div>
                <div className="text-xl sm:text-2xl font-black font-mono tracking-wider text-slate-900">
                  {masterPatientId || 'NOVA-PAT-8255'}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(masterPatientId);
                    toast.success(`Đã sao chép mã định danh: ${masterPatientId}`);
                  }}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-800 hover:text-emerald-900 transition cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Sao chép mã sổ</span>
                </button>
              </div>

              {/* Box 2: Số CCCD 12 Số */}
              <div className="bg-slate-50/90 border border-slate-200 rounded-2xl p-4.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Số CCCD / VNeID</span>
                  <span className="text-[10px] font-bold text-blue-800 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                    Quốc gia
                  </span>
                </div>
                <div className="text-xl sm:text-2xl font-black font-mono tracking-widest text-slate-900">
                  {selectedProfile?.identityNumber || '080303008255'}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const cccd = selectedProfile?.identityNumber || '080303008255';
                    navigator.clipboard.writeText(cccd);
                    toast.success(`Đã sao chép số CCCD: ${cccd}`);
                  }}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-800 hover:text-blue-900 transition cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Sao chép số CCCD</span>
                </button>
              </div>

              {/* Box 3: Trạng thái mã PIN */}
              <div className="bg-slate-50/90 border border-slate-200 rounded-2xl p-4.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Mã PIN Bảo Mật</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    identityData?.hasPin
                      ? 'text-emerald-800 bg-emerald-50 border-emerald-200'
                      : 'text-amber-800 bg-amber-50 border-amber-200'
                  }`}>
                    {identityData?.hasPin ? 'Đang kích hoạt' : 'Chưa đặt'}
                  </span>
                </div>
                <div className="text-xl sm:text-2xl font-black font-mono tracking-widest text-slate-900">
                  {identityData?.hasPin ? '••••••' : '4 số cuối CCCD'}
                </div>
                <p className="text-[11px] text-slate-500 leading-snug">
                  Đảm bảo quyền riêng tư: chỉ người có mã PIN mới mở được hồ sơ.
                </p>
              </div>
            </div>
          </div>

          {/* Audit Logs */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                  <span>Nhật Ký Truy Cập Hồ Sơ {auditLogs.length > 0 ? `(${auditLogs.length})` : ''}</span>
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Ghi nhận minh bạch mọi phiên tra cứu bệnh án từ các bác sĩ & bệnh viện liên thông
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => {
                    refetchAuditLogs();
                    toast.success('Đã cập nhật nhật ký truy cập mới nhất');
                  }}
                  variant="outline"
                  size="sm"
                  className="text-xs font-bold gap-1.5 rounded-xl border-slate-300 cursor-pointer h-8"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-slate-600 ${isLoadingAuditLogs ? 'animate-spin' : ''}`} />
                  <span>Làm mới nhật ký</span>
                </Button>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              {auditLogs.length > 0 ? (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                          <th className="py-3 px-4 sm:px-5 font-bold whitespace-nowrap">Thời gian</th>
                          <th className="py-3 px-4 sm:px-5 font-bold">Cơ sở y tế</th>
                          <th className="py-3 px-4 sm:px-5 font-bold">Bác sĩ tra cứu</th>
                          <th className="py-3 px-4 sm:px-5 font-bold">Mục đích tra cứu</th>
                          <th className="py-3 px-4 sm:px-5 font-bold text-right whitespace-nowrap">Trạng thái</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs">
                        {paginatedAuditLogs.map((log) => (
                          <tr key={log.id} className="hover:bg-slate-50/60 transition">
                            {/* 1. Thời gian */}
                            <td className="py-3.5 px-4 sm:px-5 whitespace-nowrap">
                              <span className="font-mono text-slate-600 font-semibold text-[11px] bg-slate-100 px-2 py-0.5 rounded-md">
                                {log.timestamp}
                              </span>
                            </td>

                            {/* 2. Cơ sở y tế */}
                            <td className="py-3.5 px-4 sm:px-5">
                              <div className="font-bold text-slate-900 flex items-center gap-2 text-sm">
                                <Building2 className="w-4 h-4 text-blue-600 shrink-0" />
                                <span>{log.hospitalName}</span>
                              </div>
                            </td>

                            {/* 3. Bác sĩ tra cứu */}
                            <td className="py-3.5 px-4 sm:px-5 whitespace-nowrap">
                              <div className="font-semibold text-slate-800 flex items-center gap-1.5 text-xs">
                                <Stethoscope className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                <span className="bg-emerald-50 text-emerald-900 px-2.5 py-1 rounded-lg border border-emerald-200/80 font-bold">
                                  {log.doctorName}
                                </span>
                              </div>
                            </td>

                            {/* 4. Mục đích tra cứu */}
                            <td className="py-3.5 px-4 sm:px-5">
                              <span className="text-slate-700 font-medium text-xs">
                                {log.purpose}
                              </span>
                            </td>

                            {/* 5. Trạng thái */}
                            <td className="py-3.5 px-4 sm:px-5 text-right whitespace-nowrap">
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                <span>Đã xác thực</span>
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination Control for Tab 3 Audit Logs */}
                  <div className="p-3.5 sm:p-4 border-t border-slate-100 bg-slate-50/50">
                    <TablePagination
                      currentPage={pageAuditLogs}
                      totalPages={Math.max(1, Math.ceil(auditLogs.length / pageSizeAuditLogs))}
                      totalItems={auditLogs.length}
                      pageSize={pageSizeAuditLogs}
                      onPageChange={(p) => setPageAuditLogs(p)}
                      itemName="lượt tra cứu"
                    />
                  </div>
                </>
              ) : (
                <div className="p-10 text-center space-y-2">
                  <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <p className="text-xs text-slate-500 font-medium">
                    Chưa có lượt truy cập hồ sơ ngoại viện nào được ghi nhận.
                  </p>
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
        <DialogContent className="max-w-lg sm:max-w-xl p-6 rounded-2xl bg-white shadow-2xl border-slate-200 max-h-[92vh] overflow-y-auto">
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

            {/* Step 2: PHẠM VI DỮ LIỆU CHIA SẺ */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black text-slate-900 tracking-wide">
                  2. Phạm vi dữ liệu chia sẻ ({selectedSections.length}/{availableSections.length}):
                </label>
                <button
                  type="button"
                  onClick={() => {
                    if (selectedSections.length === availableSections.length) {
                      setSelectedSections([]);
                    } else {
                      setSelectedSections(availableSections.map((s) => s.id));
                    }
                  }}
                  className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 cursor-pointer"
                >
                  {selectedSections.length === availableSections.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                </button>
              </div>

              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {availableSections.map((sec) => {
                  const isChecked = selectedSections.includes(sec.id);
                  const IconComp = sec.icon;
                  return (
                    <button
                      key={sec.id}
                      type="button"
                      onClick={() => toggleSection(sec.id)}
                      className={`w-full p-2.5 sm:p-3 rounded-xl border text-left flex items-start gap-3 transition cursor-pointer ${
                        isChecked
                          ? 'bg-emerald-50/70 border-emerald-500 shadow-2xs'
                          : 'border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                    >
                      {/* Checkbox */}
                      <div
                        className={`w-4 h-4 rounded mt-0.5 shrink-0 flex items-center justify-center transition ${
                          isChecked ? 'bg-emerald-600 text-white' : 'border border-slate-300 bg-white'
                        }`}
                      >
                        {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>

                      {/* Icon */}
                      <div
                        className={`p-1.5 rounded-lg shrink-0 ${
                          isChecked ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        <IconComp className="w-4 h-4" />
                      </div>

                      {/* Label & Description */}
                      <div className="min-w-0 flex-1 space-y-0.5">
                        <div className="font-bold text-xs text-slate-900 leading-snug">
                          {sec.label}
                        </div>
                        <p className="text-[11px] text-slate-500 font-medium leading-tight">
                          {sec.description}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 3: Mã PIN xác thực bảo mật */}
            <div className="space-y-2.5 p-3.5 sm:p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-amber-600" />
                  <span>3. Thiết lập Mã PIN bảo mật (4 - 6 số):</span>
                </label>
                <label className="text-[11px] font-bold text-slate-600 cursor-pointer flex items-center gap-1.5 select-none">
                  <input
                    type="checkbox"
                    checked={usePinCode}
                    onChange={(e) => setUsePinCode(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                  />
                  <span>Bảo vệ bằng PIN</span>
                </label>
              </div>

              {usePinCode ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={customPin}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                          setCustomPin(val);
                        }}
                        placeholder="Nhập mã PIN (4-6 số)"
                        maxLength={6}
                        className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-mono font-bold tracking-widest text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    <Button
                      type="button"
                      onClick={generateRandomPin}
                      variant="outline"
                      size="sm"
                      className="bg-white hover:bg-slate-100 text-slate-700 border-slate-300 text-xs font-bold gap-1 rounded-xl h-9.5 px-3 shrink-0 cursor-pointer"
                      title="Đổi mã PIN ngẫu nhiên khác"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                      <span>Đổi mã PIN</span>
                    </Button>
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Bác sĩ hoặc cơ sở KCB sẽ cần nhập mã PIN này cùng với mã truy cập để xem dữ liệu bệnh án.
                  </p>
                </div>
              ) : (
                <p className="text-[11px] text-amber-700 bg-amber-50 p-2 rounded-lg border border-amber-200">
                  Cảnh báo: Bất kỳ ai có Mã truy cập hoặc quét QR Code đều có thể xem dữ liệu mà không cần mã PIN.
                </p>
              )}
            </div>

            {/* Step 4: Đối tượng nhận */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-800 block">4. Cơ sở y tế tiếp nhận:</label>
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
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs h-11 rounded-xl shadow-xs mt-2 cursor-pointer transition"
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
        <DialogContent className="max-w-sm p-6 rounded-2xl bg-white shadow-2xl text-center space-y-4 border-slate-200">
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
              <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs">
                <QRCodeSVG
                  value={`https://novacare.vn/lookup?token=${selectedQrCode.code}`}
                  size={180}
                  level="H"
                />
              </div>

              <div className="space-y-2.5 w-full">
                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block">Mã truy cập</span>
                  <div className="text-2xl font-black font-mono tracking-wider text-slate-900 bg-slate-100 px-4 py-1.5 rounded-xl border border-slate-200 inline-block mt-1">
                    {selectedQrCode.code}
                  </div>
                </div>

                {selectedQrCode.pinCode && (
                  <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-2.5 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs text-amber-900 font-bold">
                      <KeyRound className="w-3.5 h-3.5 text-amber-600" />
                      <span>Mã PIN xác thực:</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-base font-black tracking-widest text-amber-950 bg-white px-2.5 py-0.5 rounded-lg border border-amber-300">
                        {selectedQrCode.pinCode}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(selectedQrCode.pinCode!);
                          toast.success(`Đã sao chép mã PIN: ${selectedQrCode.pinCode}`);
                        }}
                        className="p-1 hover:bg-amber-100 rounded-md text-amber-800 transition cursor-pointer"
                        title="Sao chép mã PIN"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}

                <p className="text-[11px] text-slate-500 font-medium pt-1">
                  Hiệu lực còn: <strong className="text-slate-900 font-mono">{formatSeconds(selectedQrCode.secondsLeft)}</strong>
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  <Button
                    onClick={() => {
                      const textToCopy = selectedQrCode.pinCode
                        ? `Mã truy cập: ${selectedQrCode.code} | Mã PIN: ${selectedQrCode.pinCode}`
                        : selectedQrCode.code;
                      navigator.clipboard.writeText(textToCopy);
                      toast.success(selectedQrCode.pinCode ? 'Đã sao chép mã chia sẻ & mã PIN!' : 'Đã sao chép mã chia sẻ!');
                    }}
                    size="sm"
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs gap-1.5 rounded-xl cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Sao chép mã {selectedQrCode.pinCode ? '& PIN' : ''}</span>
                  </Button>

                  {selectedQrCode.pinCode && (
                    <Button
                      onClick={() => {
                        navigator.clipboard.writeText(selectedQrCode.pinCode!);
                        toast.success(`Đã sao chép mã PIN: ${selectedQrCode.pinCode}`);
                      }}
                      size="sm"
                      variant="outline"
                      className="w-full bg-white hover:bg-slate-50 text-slate-800 border-slate-300 font-bold text-xs gap-1.5 rounded-xl cursor-pointer"
                    >
                      <KeyRound className="w-3.5 h-3.5 text-amber-600" />
                      <span>Chỉ chép PIN</span>
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ========================================================= */}
      {/* MODAL: THIẾT LẬP / ĐỔI MÃ PIN BẢO MẬT HỒ SƠ */}
      {/* ========================================================= */}
      <Dialog open={isPinModalOpen} onOpenChange={setIsPinModalOpen}>
        <DialogContent className="max-w-sm p-6 rounded-2xl bg-white shadow-2xl space-y-4 border-slate-200">
          <DialogHeader>
            <DialogTitle className="text-lg font-black text-slate-900 flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-amber-600" />
              <span>{identityData?.hasPin ? 'Đổi Mã PIN Bảo Mật' : 'Thiết Lập Mã PIN Bảo Mật'}</span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 text-xs">
            <p className="text-slate-500 font-medium leading-relaxed">
              Mã PIN (4 - 6 số) giúp bảo vệ quyền riêng tư hồ sơ y tế của bạn. Bác sĩ tại các bệnh viện liên thông sẽ cần bạn cung cấp mã PIN này để mở khóa tra cứu hồ sơ.
            </p>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Mã PIN mới (4 - 6 chữ số):</label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    maxLength={6}
                    value={pinInput}
                    onChange={(e) => setPinInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="Nhập 4-6 số (VD: 123456)"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono font-bold tracking-widest text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Xác nhận lại mã PIN:</label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    maxLength={6}
                    value={pinConfirmInput}
                    onChange={(e) => setPinConfirmInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="Nhập lại mã PIN trên"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono font-bold tracking-widest text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsPinModalOpen(false)}
                className="flex-1 rounded-xl text-xs font-bold border-slate-300 cursor-pointer"
              >
                Hủy
              </Button>
              <Button
                type="button"
                onClick={handleSavePin}
                disabled={isSavingPin || !pinInput}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
              >
                {isSavingPin ? 'Đang lưu...' : 'Lưu Mã PIN'}
              </Button>
            </div>
          </div>
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
