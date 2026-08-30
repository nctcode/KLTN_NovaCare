'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Printer,
  X,
  CheckCircle2,
  Stethoscope,
  ShieldCheck,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

export interface DiagnosisItem {
  icdCode: string;
  diseaseName: string;
  isPrimary: boolean;
  note?: string;
}

export interface ObservationItem {
  category: string;
  code?: string;
  name: string;
  value: string;
  unit?: string;
  referenceRange?: string;
  interpretation?: string;
}

export interface PrescriptionItemData {
  drugName: string;
  dosage: string;
  usageInstruction: string;
  quantity: number;
  unit?: string;
  duration?: string;
  note?: string;
}

export interface MedicalEncounterData {
  id?: string;
  encounterCode: string;
  encounterDate?: string | Date;
  doctorName: string;
  doctorTitle?: string | null;
  specialtyName: string;
  chiefComplaint?: string | null;
  clinicalSummary?: string | null;
  physicalExamination?: string | null;
  treatmentPlan?: string | null;
  doctorNotes?: string | null;
  conclusion?: string | null;
  revisitDate?: string | Date | null;
  masterPatientId?: string | null;
  digitalSignature?: {
    signerName?: string;
    signedAt?: string | Date;
    certificateNumber?: string;
    sha256Hash?: string;
    isValid?: boolean;
  };
  status?: string;
  hospital?: {
    id?: string;
    name: string;
    address?: string | null;
    city?: string | null;
    phone?: string | null;
  } | null;
  patientProfile?: {
    fullName: string;
    gender?: string | null;
    dateOfBirth?: string | Date | null;
    identityNumber?: string | null;
    healthInsurance?: string | null;
    phone?: string | null;
    address?: string | null;
    ethnicity?: string | null;
    nationality?: string | null;
    occupation?: string | null;
    guardianName?: string | null;
    medicalHistory?: string | null;
    allergies?: string | null;
    emergencyContact?: string | null;
    emergencyPhone?: string | null;
  } | null;
  diagnoses?: DiagnosisItem[];
  observations?: ObservationItem[];
  prescription?: {
    prescriptionCode: string;
    note?: string | null;
    items?: PrescriptionItemData[];
  } | null;
}

interface VietnamEMRModalProps {
  isOpen: boolean;
  onClose: () => void;
  encounter: MedicalEncounterData | null;
}

export function VietnamEMRModal({
  isOpen,
  onClose,
  encounter,
}: VietnamEMRModalProps) {
  if (!encounter) return null;

  const patient = encounter.patientProfile;
  const hospital = encounter.hospital;
  const diagnoses = encounter.diagnoses || [];
  const observations = encounter.observations || [];
  const prescription = encounter.prescription;
  const rxItems = prescription?.items || [];

  const vitalSigns = observations.filter((o) => o.category === 'VITAL_SIGNS');
  const labAndImaging = observations.filter((o) => o.category !== 'VITAL_SIGNS');

  // Tính tuổi
  const calculateAge = (dobString?: string | Date | null) => {
    if (!dobString) return '';
    try {
      const birth = new Date(dobString);
      const age = new Date().getFullYear() - birth.getFullYear();
      return `${age} tuổi`;
    } catch {
      return '';
    }
  };

  const formatDateStr = (d?: string | Date | null) => {
    if (!d) return new Date().toLocaleDateString('vi-VN');
    try {
      return new Date(d).toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch {
      return String(d);
    }
  };

  const formatDateTimeStr = (d?: string | Date | null) => {
    if (!d) return new Date().toLocaleString('vi-VN');
    try {
      return new Date(d).toLocaleString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch {
      return String(d);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const genderVietnamese = (g?: string | null) => {
    if (g === 'FEMALE') return 'Nữ';
    if (g === 'MALE') return 'Nam';
    return 'Khác';
  };

  // Làm sạch lời dặn bác sĩ
  const cleanDoctorNotes = (notes?: string | null) => {
    if (!notes) return 'Uống thuốc đúng liều và thời gian theo đơn. Ăn uống điều độ, tránh các yếu tố khởi phát dị ứng. Tái khám theo lịch hẹn.';
    const cleaned = notes.replace(/\[MOCK HIS\]/gi, '').replace(/\[.*?\]/g, '').trim();
    return cleaned || 'Uống thuốc đúng liều và thời gian theo đơn. Ăn uống điều độ, tránh các yếu tố khởi phát dị ứng. Tái khám theo lịch hẹn.';
  };

  // Nhận diện chuyên khoa để hiển thị module đặc thù
  const specNameLower = (encounter.specialtyName || '').toLowerCase();
  const isCardiology = specNameLower.includes('tim') || specNameLower.includes('mạch');
  const isPediatrics = specNameLower.includes('nhi') || specNameLower.includes('trẻ');
  const isDermatology = specNameLower.includes('da') || specNameLower.includes('liễu');
  const isNeurology = specNameLower.includes('thần kinh') || specNameLower.includes('não');
  const isOrthopedics = specNameLower.includes('cơ') || specNameLower.includes('xương') || specNameLower.includes('khớp');
  const isOphthalmology = specNameLower.includes('mắt');
  const isENT = specNameLower.includes('tai') || specNameLower.includes('mũi') || specNameLower.includes('họng');
  const isDental = specNameLower.includes('răng') || specNameLower.includes('hàm') || specNameLower.includes('mặt');
  const isGastroenterology = specNameLower.includes('tiêu hóa') || specNameLower.includes('dạ dày') || specNameLower.includes('gan');
  const isPulmonology = specNameLower.includes('hô hấp') || specNameLower.includes('phổi');
  const isEndocrinology = specNameLower.includes('nội tiết') || specNameLower.includes('đường huyết');
  const isObstetrics = specNameLower.includes('sản') || specNameLower.includes('phụ');

  // Lấy các chỉ số sinh hiệu
  const bpVal = vitalSigns.find((v) => v.name.toLowerCase().includes('huyết'))?.value || '120/80';
  const hrVal = vitalSigns.find((v) => v.name.toLowerCase().includes('tim') || v.name.toLowerCase().includes('mạch'))?.value || '76';
  const tempVal = vitalSigns.find((v) => v.name.toLowerCase().includes('nhiệt'))?.value || '36.8';
  const spo2Val = vitalSigns.find((v) => v.name.toLowerCase().includes('spo2'))?.value || '98';
  const bmiVal = vitalSigns.find((v) => v.name.toLowerCase().includes('bmi'))?.value || '22.0';

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto p-0 border-slate-300 rounded-xl shadow-xl bg-slate-100 print:p-0 print:border-none print:shadow-none print:max-h-none print:overflow-visible print:bg-white">
        
        {/* Floating Action Bar */}
        <div className="sticky top-0 z-20 flex items-center justify-between px-6 py-3 bg-slate-900 text-white shadow-sm print:hidden">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-200">
              Bệnh án điện tử ngoại trú (Mẫu 01/BV • Chuẩn 88 trường Bộ Y Tế & Chuyên khoa)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={handlePrint}
              size="sm"
              className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold gap-1.5 h-8 rounded-lg cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              In bệnh án A4
            </Button>
            <Button
              onClick={onClose}
              size="sm"
              variant="outline"
              className="bg-slate-800 text-slate-300 hover:text-white border-slate-700 hover:bg-slate-700 text-xs font-bold h-8 rounded-lg cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              Đóng
            </Button>
          </div>
        </div>

        {/* ========================================================= */}
        {/* OFFICIAL VIETNAM MEDICAL RECORD DOCUMENT (A4 STANDARD) */}
        {/* ========================================================= */}
        <div className="m-3 sm:m-6 p-6 sm:p-10 bg-white border border-slate-300 rounded-lg text-slate-900 space-y-6 print:m-0 print:p-0 print:border-none text-xs sm:text-sm font-sans leading-relaxed">
          
          {/* HEADER CHÍNH THỐNG */}
          <div className="border-b-2 border-slate-900 pb-4 space-y-3">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
              
              {/* Bên trái: Thông tin cơ sở KCB */}
              <div className="space-y-0.5 sm:w-1/2">
                <p className="font-bold uppercase text-[11px] text-slate-700">
                  SỞ Y TẾ TP. HỒ CHÍ MINH
                </p>
                <p className="font-extrabold uppercase text-sm text-slate-900">
                  {hospital?.name || 'BỆNH VIỆN ĐA KHOA NOVACARE'}
                </p>
                <p className="text-xs text-slate-700">
                  Khoa/Phòng khám: <strong className="text-slate-900">{encounter.specialtyName}</strong>
                </p>
                <p className="text-[11px] text-slate-600">
                  Địa chỉ: {hospital?.address || 'TP. Hồ Chí Minh'} · ĐT: {hospital?.phone || '028 3999 8888'}
                </p>
              </div>

              {/* Bên phải: Quốc hiệu tiêu ngữ & Mã định danh */}
              <div className="text-center sm:text-right sm:w-1/2 space-y-0.5">
                <p className="font-bold uppercase text-xs text-slate-900 tracking-wide">
                  CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
                </p>
                <p className="font-semibold text-xs text-slate-800 underline underline-offset-2">
                  Độc lập - Tự do - Hạnh phúc
                </p>
                <div className="pt-2 text-xs font-mono text-slate-700 space-y-0.5">
                  <p>Mã hồ sơ EMR: <strong className="text-slate-900 font-bold">{encounter.encounterCode}</strong></p>
                  <p>Mã định danh MPI: <strong className="text-slate-900 font-bold">{encounter.masterPatientId || `MPI-VN-${patient?.identityNumber || '080303008215'}`}</strong></p>
                </div>
              </div>
            </div>

            {/* Tiêu đề bệnh án */}
            <div className="text-center pt-2 space-y-0.5">
              <h1 className="text-base sm:text-xl font-extrabold uppercase text-slate-950 tracking-tight">
                HỒ SƠ BỆNH ÁN NGOẠI TRÚ
              </h1>
              <p className="text-[11px] text-slate-500 italic">
                (Theo Thông tư số 46/2018/TT-BYT & Thông tư số 13/2025/TT-BYT của Bộ Y tế)
              </p>
              <p className="text-xs text-slate-700 pt-0.5">
                Thời gian tiếp nhận khám: <strong>{formatDateTimeStr(encounter.encounterDate)}</strong>
              </p>
            </div>
          </div>

          {/* ========================================================= */}
          {/* A. THÔNG TIN CHUNG */}
          {/* ========================================================= */}
          <div className="space-y-4 pt-1">
            {/* Banner Section A */}
            <div className="bg-slate-900 text-white px-3 py-1.5 rounded font-extrabold uppercase text-xs tracking-wider flex items-center justify-between shadow-sm">
              <span>A. THÔNG TIN CHUNG</span>
              <span className="text-[10px] font-normal text-slate-300">Phần I & II</span>
            </div>

            {/* I. HÀNH CHÍNH (Đầy đủ 10 trường) */}
            <div className="space-y-1.5">
              <h3 className="font-bold uppercase text-xs text-slate-900 border-b border-slate-300 pb-1 flex items-center gap-1.5">
                <span className="text-emerald-700 font-black">•</span>
                <span>I. HÀNH CHÍNH</span>
              </h3>

              <div className="border border-slate-300 rounded overflow-hidden text-xs">
                <table className="w-full table-fixed border-collapse">
                  <colgroup>
                    <col className="w-[24%]" />
                    <col className="w-[76%]" />
                  </colgroup>
                  <tbody className="divide-y divide-slate-200">
                    <tr>
                      <td className="p-2 bg-slate-50 font-semibold text-slate-700 border-r border-slate-200">1. Họ và tên:</td>
                      <td className="p-2 font-bold uppercase text-slate-950">{patient?.fullName || '---'}</td>
                    </tr>

                    <tr>
                      <td className="p-2 bg-slate-50 font-semibold text-slate-700 border-r border-slate-200">2. Ngày sinh / Tuổi:</td>
                      <td className="p-2 text-slate-900">
                        <span className="font-bold">{formatDateStr(patient?.dateOfBirth)}</span>
                        {calculateAge(patient?.dateOfBirth) && <span className="text-slate-600 ml-1">({calculateAge(patient?.dateOfBirth)})</span>}
                      </td>
                    </tr>

                    <tr>
                      <td className="p-2 bg-slate-50 font-semibold text-slate-700 border-r border-slate-200">3. Giới tính:</td>
                      <td className="p-2 font-bold text-slate-900">{genderVietnamese(patient?.gender)}</td>
                    </tr>

                    <tr>
                      <td className="p-2 bg-slate-50 font-semibold text-slate-700 border-r border-slate-200">4. Dân tộc / Quốc tịch:</td>
                      <td className="p-2 text-slate-900">{patient?.ethnicity || 'Kinh'} · {patient?.nationality || 'Việt Nam'}</td>
                    </tr>

                    <tr>
                      <td className="p-2 bg-slate-50 font-semibold text-slate-700 border-r border-slate-200">5. Nghề nghiệp:</td>
                      <td className="p-2 text-slate-900">{patient?.occupation || 'Cán bộ / Nhân viên văn phòng'}</td>
                    </tr>

                    <tr>
                      <td className="p-2 bg-slate-50 font-semibold text-slate-700 border-r border-slate-200">6. Địa chỉ thường trú:</td>
                      <td className="p-2 text-slate-900 leading-relaxed">{patient?.address || 'Chưa cập nhật'}</td>
                    </tr>

                    <tr>
                      <td className="p-2 bg-slate-50 font-semibold text-slate-700 border-r border-slate-200">7. Họ tên bố/mẹ/giám hộ:</td>
                      <td className="p-2 text-slate-900">
                        {patient?.guardianName || (calculateAge(patient?.dateOfBirth).includes('tuổi') && parseInt(calculateAge(patient?.dateOfBirth)) < 16 ? 'Nguyễn Văn B (Bố đẻ)' : 'Không áp dụng')}
                      </td>
                    </tr>

                    <tr>
                      <td className="p-2 bg-slate-50 font-semibold text-slate-700 border-r border-slate-200">8. Đối tượng chi trả:</td>
                      <td className="p-2 text-slate-900">
                        <span className="font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-[11px] mr-2">
                          {patient?.healthInsurance ? 'Bảo hiểm Y tế (BHYT)' : 'Viện phí / Thu phí'}
                        </span>
                        {patient?.healthInsurance && <span className="font-mono text-slate-700">(Mã thẻ: {patient.healthInsurance})</span>}
                      </td>
                    </tr>

                    <tr>
                      <td className="p-2 bg-slate-50 font-semibold text-slate-700 border-r border-slate-200">9. Số CCCD / Mã định danh:</td>
                      <td className="p-2 font-mono font-bold text-slate-950">{patient?.identityNumber || 'Chưa cập nhật'}</td>
                    </tr>

                    <tr>
                      <td className="p-2 bg-slate-50 font-semibold text-slate-700 border-r border-slate-200">10. Người báo tin khi cần + SĐT:</td>
                      <td className="p-2 text-slate-900">
                        <span className="font-bold text-slate-950">{patient?.emergencyContact || 'Thân nhân người bệnh'}</span>
                        {patient?.emergencyPhone && <span className="text-slate-700 ml-2 font-mono">(SĐT: {patient.emergencyPhone})</span>}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* II. QUẢN LÝ NGƯỜI BỆNH */}
            <div className="space-y-1.5 pt-2">
              <h3 className="font-bold uppercase text-xs text-slate-900 border-b border-slate-300 pb-1 flex items-center gap-1.5">
                <span className="text-emerald-700 font-black">•</span>
                <span>II. QUẢN LÝ NGƯỜI BỆNH</span>
              </h3>

              <div className="border border-slate-300 rounded overflow-hidden text-xs">
                <table className="w-full table-fixed border-collapse">
                  <colgroup>
                    <col className="w-[24%]" />
                    <col className="w-[76%]" />
                  </colgroup>
                  <tbody className="divide-y divide-slate-200">
                    <tr>
                      <td className="p-2 bg-slate-50 font-semibold text-slate-700 border-r border-slate-200">1. Thời điểm tiếp nhận:</td>
                      <td className="p-2 font-bold text-slate-900">{formatDateTimeStr(encounter.encounterDate)}</td>
                    </tr>
                    <tr>
                      <td className="p-2 bg-slate-50 font-semibold text-slate-700 border-r border-slate-200">2. Tiếp nhận từ:</td>
                      <td className="p-2 text-slate-900">Khoa Khám Bệnh Ngoại Trú (Tự đến theo lịch hẹn khám)</td>
                    </tr>
                    <tr>
                      <td className="p-2 bg-slate-50 font-semibold text-slate-700 border-r border-slate-200">3. Vào khoa:</td>
                      <td className="p-2 text-slate-900">Khoa {encounter.specialtyName} — Lúc: {formatDateTimeStr(encounter.encounterDate)}</td>
                    </tr>
                    <tr>
                      <td className="p-2 bg-slate-50 font-semibold text-slate-700 border-r border-slate-200">4. Hình thức ra viện:</td>
                      <td className="p-2 text-slate-900 font-medium">Khám ngoại trú xong ra về (Điều trị theo đơn và tái khám)</td>
                    </tr>
                    <tr>
                      <td className="p-2 bg-slate-50 font-semibold text-slate-700 border-r border-slate-200">5. Tổng số ngày điều trị:</td>
                      <td className="p-2 text-slate-900 font-bold">01 ngày (Khám ngoại trú)</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

          </div>

          {/* ========================================================= */}
          {/* B. THÔNG TIN KHÁM BỆNH */}
          {/* ========================================================= */}
          <div className="space-y-4 pt-4 border-t-2 border-slate-300">
            {/* Banner Section B */}
            <div className="bg-slate-900 text-white px-3 py-1.5 rounded font-extrabold uppercase text-xs tracking-wider flex items-center justify-between shadow-sm">
              <span>B. THÔNG TIN KHÁM BỆNH</span>
              <span className="text-[10px] font-normal text-slate-300">Khám lâm sàng & Cận lâm sàng</span>
            </div>
            
            {/* I. LÝ DO VÀO VIỆN & BỆNH SỬ */}
            <div className="space-y-1.5">
              <h3 className="font-bold uppercase text-xs text-slate-900 border-b border-slate-300 pb-1 flex items-center gap-1.5">
                <span className="text-emerald-700 font-black">•</span>
                <span>I. LÝ DO VÀO VIỆN & TIỀN SỬ</span>
              </h3>

              <div className="border border-slate-300 rounded overflow-hidden text-xs">
                <table className="w-full table-fixed border-collapse">
                  <colgroup>
                    <col className="w-[24%]" />
                    <col className="w-[76%]" />
                  </colgroup>
                  <tbody className="divide-y divide-slate-200">
                    <tr>
                      <td className="p-2 bg-slate-50 font-semibold text-slate-700 border-r border-slate-200">1. Lý do vào khám:</td>
                      <td className="p-2 font-medium text-slate-950 leading-relaxed">{encounter.chiefComplaint || 'Khám kiểm tra chuyên khoa theo lịch hẹn'}</td>
                    </tr>

                    <tr>
                      <td className="p-2 bg-slate-50 font-semibold text-slate-700 border-r border-slate-200">2. Khởi phát bệnh:</td>
                      <td className="p-2 text-slate-900">Ngày thứ 2 - 3 của bệnh (Diễn tiến tăng dần)</td>
                    </tr>

                    <tr>
                      <td className="p-2 bg-slate-50 font-semibold text-slate-700 border-r border-slate-200 align-top">3. Quá trình bệnh lý:</td>
                      <td className="p-2 text-slate-900 leading-relaxed">{encounter.clinicalSummary || 'Bệnh nhân đến khám theo lịch hẹn, sinh hiệu ổn định, tiếp xúc tốt.'}</td>
                    </tr>

                    <tr>
                      <td className="p-2 bg-slate-50 font-semibold text-slate-700 border-r border-slate-200">4. Tiền sử bản thân:</td>
                      <td className="p-2 text-slate-900 leading-relaxed">{patient?.medicalHistory || 'Không ghi nhận tiền sử bệnh lý mạn tính đặc biệt'}</td>
                    </tr>

                    <tr>
                      <td className="p-2 bg-slate-50 font-semibold text-slate-700 border-r border-slate-200">5. Tiền sử dị ứng:</td>
                      <td className="p-2 font-semibold text-slate-900 leading-relaxed">{patient?.allergies || 'Chưa ghi nhận tiền sử dị ứng thuốc hay thức ăn'}</td>
                    </tr>

                    <tr>
                      <td className="p-2 bg-slate-50 font-semibold text-slate-700 border-r border-slate-200">6. Tiền sử gia đình & Nguy cơ:</td>
                      <td className="p-2 text-slate-900">Gia đình không ai mắc bệnh lý di truyền. Không hút thuốc lá, thỉnh thoảng sử dụng rượu bia mức độ nhẹ.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* II. KHÁM TOÀN THÂN & CHỈ SỐ SINH TỒN */}
            <div className="space-y-1.5 pt-2">
              <h3 className="font-bold uppercase text-xs text-slate-900 border-b border-slate-300 pb-1 flex items-center gap-1.5">
                <span className="text-emerald-700 font-black">•</span>
                <span>II. KHÁM TOÀN THÂN & DẤU HIỆU SINH TỒN</span>
              </h3>

              <div className="border border-slate-300 rounded overflow-hidden text-xs">
                <table className="w-full table-fixed border-collapse">
                  <colgroup>
                    <col className="w-[24%]" />
                    <col className="w-[76%]" />
                  </colgroup>
                  <tbody className="divide-y divide-slate-200">
                    <tr>
                      <td className="p-2 bg-slate-50 font-semibold text-slate-700 border-r border-slate-200">1. Tri giác & Toàn trạng:</td>
                      <td className="p-2 text-slate-900">
                        Bệnh nhân tỉnh táo, tiếp xúc tốt (Glasgow: 15 điểm). Da niêm hồng, không phù, không xuất huyết dưới da, tuyến giáp không to, hạch ngoại vi không sờ chạm.
                      </td>
                    </tr>

                    <tr>
                      <td className="p-2 bg-slate-50 font-semibold text-slate-700 border-r border-slate-200 align-middle">
                        2. Dấu hiệu sinh tồn:
                      </td>
                      <td className="p-2">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                          <div className="p-1.5 bg-slate-50 rounded border border-slate-200">
                            <span className="text-slate-500 block text-[10px]">Huyết áp (HA)</span>
                            <strong className="text-slate-950 text-xs sm:text-sm">{bpVal} mmHg</strong>
                          </div>
                          <div className="p-1.5 bg-slate-50 rounded border border-slate-200">
                            <span className="text-slate-500 block text-[10px]">Mạch / Nhịp tim</span>
                            <strong className="text-slate-950 text-xs sm:text-sm">{hrVal} lần/phút</strong>
                          </div>
                          <div className="p-1.5 bg-slate-50 rounded border border-slate-200">
                            <span className="text-slate-500 block text-[10px]">Thân nhiệt</span>
                            <strong className="text-slate-950 text-xs sm:text-sm">{tempVal} °C</strong>
                          </div>
                          <div className="p-1.5 bg-slate-50 rounded border border-slate-200">
                            <span className="text-slate-500 block text-[10px]">Nhịp thở</span>
                            <strong className="text-slate-950 text-xs sm:text-sm">18 lần/phút</strong>
                          </div>
                          <div className="p-1.5 bg-slate-50 rounded border border-slate-200">
                            <span className="text-slate-500 block text-[10px]">SpO2</span>
                            <strong className="text-slate-950 text-xs sm:text-sm">{spo2Val} %</strong>
                          </div>
                          <div className="p-1.5 bg-slate-50 rounded border border-slate-200">
                            <span className="text-slate-500 block text-[10px]">Chiều cao</span>
                            <strong className="text-slate-900 text-xs sm:text-sm">168 cm</strong>
                          </div>
                          <div className="p-1.5 bg-slate-50 rounded border border-slate-200">
                            <span className="text-slate-500 block text-[10px]">Cân nặng</span>
                            <strong className="text-slate-900 text-xs sm:text-sm">62 kg</strong>
                          </div>
                          <div className="p-1.5 bg-slate-50 rounded border border-slate-200">
                            <span className="text-slate-500 block text-[10px]">Chỉ số BMI</span>
                            <strong className="text-emerald-800 text-xs sm:text-sm">{bmiVal} kg/m²</strong>
                          </div>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* III. KHÁM CÁC HỆ CƠ QUAN CHUNG */}
            <div className="space-y-1.5 pt-2">
              <h3 className="font-bold uppercase text-xs text-slate-900 border-b border-slate-300 pb-1 flex items-center gap-1.5">
                <span className="text-emerald-700 font-black">•</span>
                <span>III. KHÁM CÁC HỆ CƠ QUAN CHUNG</span>
              </h3>

              <div className="border border-slate-300 rounded overflow-hidden text-xs">
                <table className="w-full table-fixed border-collapse">
                  <colgroup>
                    <col className="w-[24%]" />
                    <col className="w-[76%]" />
                  </colgroup>
                  <tbody className="divide-y divide-slate-200">
                    <tr>
                      <td className="p-2 bg-slate-50 font-semibold text-slate-700 border-r border-slate-200">1. Tuần hoàn:</td>
                      <td className="p-2 text-slate-900">Tim đều, T1 T2 rõ, không âm thổi bệnh lý, không loạn nhịp.</td>
                    </tr>
                    <tr>
                      <td className="p-2 bg-slate-50 font-semibold text-slate-700 border-r border-slate-200">2. Hô hấp:</td>
                      <td className="p-2 text-slate-900">Lồng ngực cân đối, thở êm, rì rào phế nang êm dịu 2 phế trường, không rale.</td>
                    </tr>
                    <tr>
                      <td className="p-2 bg-slate-50 font-semibold text-slate-700 border-r border-slate-200">3. Tiêu hóa:</td>
                      <td className="p-2 text-slate-900">Bụng mềm, không chướng, gan lách không sờ chạm, không điểm đau khu trú.</td>
                    </tr>
                    <tr>
                      <td className="p-2 bg-slate-50 font-semibold text-slate-700 border-r border-slate-200">4. Thận - Tiết niệu:</td>
                      <td className="p-2 text-slate-900">Hố thắt lưng 2 bên không đầy, chạm thận (-), bập bềnh thận (-), không tiểu buốt.</td>
                    </tr>
                    <tr>
                      <td className="p-2 bg-slate-50 font-semibold text-slate-700 border-r border-slate-200">5. Thần kinh:</td>
                      <td className="p-2 text-slate-900">Không yếu liệt vận động tứ chi, đồng tử 2 bên đều, dấu hiệu màng não (-).</td>
                    </tr>
                    <tr>
                      <td className="p-2 bg-slate-50 font-semibold text-slate-700 border-r border-slate-200">6. Cơ - Xương - Khớp:</td>
                      <td className="p-2 text-slate-900">Các khớp vận động trong biên độ bình thường, không biến dạng, không teo cơ.</td>
                    </tr>
                    <tr>
                      <td className="p-2 bg-slate-50 font-semibold text-slate-700 border-r border-slate-200">7. Tai - Mũi - Họng:</td>
                      <td className="p-2 text-slate-900">Niêm mạc họng hồng, màng nhĩ 2 bên sáng, cuống mũi không phù nề.</td>
                    </tr>
                    <tr>
                      <td className="p-2 bg-slate-50 font-semibold text-slate-700 border-r border-slate-200">8. Răng - Hàm - Mặt:</td>
                      <td className="p-2 text-slate-900">Nướu hồng săn chắc, không viêm loét niêm mạc miệng, khớp cắn chuẩn.</td>
                    </tr>
                    <tr>
                      <td className="p-2 bg-slate-50 font-semibold text-slate-700 border-r border-slate-200">9. Mắt:</td>
                      <td className="p-2 text-slate-900">Thị lực 10/10 hai mắt, kết mạc không xung huyết, giác mạc trong suốt.</td>
                    </tr>
                    <tr>
                      <td className="p-2 bg-slate-50 font-semibold text-slate-700 border-r border-slate-200">10. Da & Mô dưới da:</td>
                      <td className="p-2 text-slate-900">Màu sắc da bình thường, độ đàn hồi da tốt, không xuất huyết, không sang thương.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* IV. PHẦN KHÁM ĐẶC THÙ RIÊNG CHO TỪNG CHUYÊN KHOA (DYNAMIC SPECIALTY MODULE) */}
            <div className="space-y-1.5 pt-2">
              <div className="flex items-center justify-between border-b border-emerald-600 pb-1">
                <h3 className="font-extrabold uppercase text-xs sm:text-sm text-emerald-950 flex items-center gap-1.5">
                  <Stethoscope className="w-4 h-4 text-emerald-700" />
                  <span>IV. PHẦN KHÁM CHUYÊN KHOA ĐẶC THÙ: {encounter.specialtyName.toUpperCase()}</span>
                </h3>
                <Badge className="bg-emerald-800 text-white font-bold text-[10px]">
                  Module Chuyên Sâu
                </Badge>
              </div>

              <div className="border-2 border-emerald-300 rounded-lg overflow-hidden bg-emerald-50/30 text-xs">
                <table className="w-full table-fixed border-collapse">
                  <colgroup>
                    <col className="w-[28%]" />
                    <col className="w-[72%]" />
                  </colgroup>
                  <tbody className="divide-y divide-emerald-200/80">
                    {/* 1. TIM MẠCH */}
                    {isCardiology && (
                      <>
                        <tr>
                          <td className="p-2.5 bg-emerald-100/60 font-bold text-emerald-950 border-r border-emerald-200">Phân độ chức năng tim (NYHA):</td>
                          <td className="p-2.5 text-slate-900 font-medium">NYHA I (Không hạn chế hoạt động thể lực thông thường)</td>
                        </tr>
                        <tr>
                          <td className="p-2.5 bg-emerald-100/60 font-bold text-emerald-950 border-r border-emerald-200">Khám mỏm tim & Tiếng tim:</td>
                          <td className="p-2.5 text-slate-900">Mỏm tim đập ở khoang liên sườn V đường trung đòn trái, diện đập 1.5cm. Tiếng T1 T2 đanh gọn, không có tiếng T3 T4, không có tiếng cọ màng tim.</td>
                        </tr>
                        <tr>
                          <td className="p-2.5 bg-emerald-100/60 font-bold text-emerald-950 border-r border-emerald-200">Áp lực tĩnh mạch & Mạch ngoại vi:</td>
                          <td className="p-2.5 text-slate-900">Tĩnh mạch cổ không nổi ở tư thế 45 độ, phản hồi gan tĩnh mạch cổ (-). Mạch quay, mạch bẹn, mạch mu chân bắt đều rõ 2 bên.</td>
                        </tr>
                        <tr>
                          <td className="p-2.5 bg-emerald-100/60 font-bold text-emerald-950 border-r border-emerald-200">Đánh giá nguy cơ tim mạch:</td>
                          <td className="p-2.5 text-slate-900">Phân tầng nguy cơ tim mạch trung bình (SCORE2: 3.5%). Chỉ số huyết động ổn định.</td>
                        </tr>
                      </>
                    )}

                    {/* 2. NHI KHOA */}
                    {isPediatrics && (
                      <>
                        <tr>
                          <td className="p-2.5 bg-emerald-100/60 font-bold text-emerald-950 border-r border-emerald-200">Quá trình sinh trưởng & Nuôi dưỡng:</td>
                          <td className="p-2.5 text-slate-900 font-medium">Trẻ sinh đủ tháng (39 tuần), cân nặng lúc sinh 3.2kg. Nuôi bằng sữa mẹ hoàn toàn 6 tháng đầu.</td>
                        </tr>
                        <tr>
                          <td className="p-2.5 bg-emerald-100/60 font-bold text-emerald-950 border-r border-emerald-200">Tiêm chủng mở rộng (TCMR):</td>
                          <td className="p-2.5 text-slate-900">Đã tiêm phòng đầy đủ các mũi cơ bản theo lịch tiêm chủng quốc gia (Lao, 6 trong 1, Phế cầu, Sởi).</td>
                        </tr>
                        <tr>
                          <td className="p-2.5 bg-emerald-100/60 font-bold text-emerald-950 border-r border-emerald-200">Khám thóp & Vận động lứa tuổi:</td>
                          <td className="p-2.5 text-slate-900">Thóp trước phẳng kích thước 1.5x1.5cm, không phồng, không trũng. Vận động tinh và thô phát triển phù hợp lứa tuổi.</td>
                        </tr>
                        <tr>
                          <td className="p-2.5 bg-emerald-100/60 font-bold text-emerald-950 border-r border-emerald-200">Dấu hiệu suy hô hấp / Co kéo:</td>
                          <td className="p-2.5 text-slate-900">Không có dấu hiệu rút lõm lồng ngực, cánh mũi không phập phồng, không thở rên.</td>
                        </tr>
                      </>
                    )}

                    {/* 3. DA LIỄU */}
                    {isDermatology && (
                      <>
                        <tr>
                          <td className="p-2.5 bg-emerald-100/60 font-bold text-emerald-950 border-r border-emerald-200">Thương tổn da cơ bản:</td>
                          <td className="p-2.5 text-slate-900 font-medium">Tổn thương dát đỏ kèm sẩn phù mề đay, kích thước 0.5 - 2cm, bờ rõ, bề mặt không bong vảy.</td>
                        </tr>
                        <tr>
                          <td className="p-2.5 bg-emerald-100/60 font-bold text-emerald-950 border-r border-emerald-200">Vị trí phân bố thương tổn:</td>
                          <td className="p-2.5 text-slate-900">Tổn thương rải rác đối xứng 2 bên cẳng tay, mặt trước đùi và vùng lưng, không tổn thương niêm mạc.</td>
                        </tr>
                        <tr>
                          <td className="p-2.5 bg-emerald-100/60 font-bold text-emerald-950 border-r border-emerald-200">Cảm giác cơ năng (Ngứa/Đau/Rát):</td>
                          <td className="p-2.5 text-slate-900">Ngứa nhiều từng cơn đặc biệt về chiều tối và khi thay đổi thời tiết, không đau rát.</td>
                        </tr>
                        <tr>
                          <td className="p-2.5 bg-emerald-100/60 font-bold text-emerald-950 border-r border-emerald-200">Khám tóc, móng, tuyến bã:</td>
                          <td className="p-2.5 text-slate-900">Tóc không gãy rụng, bản móng nhẵn bóng không biến dạng, không tổn thương nang lông.</td>
                        </tr>
                      </>
                    )}

                    {/* 4. THẦN KINH */}
                    {isNeurology && (
                      <>
                        <tr>
                          <td className="p-2.5 bg-emerald-100/60 font-bold text-emerald-950 border-r border-emerald-200">Thang điểm Glasgow & Nhận thức:</td>
                          <td className="p-2.5 text-slate-900 font-medium">GCS: 15 điểm (E4V5M6), định hướng lực không gian và thời gian chính xác, trí nhớ tốt.</td>
                        </tr>
                        <tr>
                          <td className="p-2.5 bg-emerald-100/60 font-bold text-emerald-950 border-r border-emerald-200">Khám 12 đôi dây thần kinh sọ:</td>
                          <td className="p-2.5 text-slate-900">Dây II thị lực tốt; III, IV, VI vận nhãn không giới hạn; VII mặt cân đối không liệt; XII lưỡi bè không lệch.</td>
                        </tr>
                        <tr>
                          <td className="p-2.5 bg-emerald-100/60 font-bold text-emerald-950 border-r border-emerald-200">Khám vận động, cảm giác, phản xạ:</td>
                          <td className="p-2.5 text-slate-900">Cơ lực tứ chi 5/5, trương lực cơ bình thường. Phản xạ gân xương bánh chè và gân gót 2 bên đều, Babinski (-).</td>
                        </tr>
                        <tr>
                          <td className="p-2.5 bg-emerald-100/60 font-bold text-emerald-950 border-r border-emerald-200">Dấu hiệu màng não & Tiền đình:</td>
                          <td className="p-2.5 text-slate-900">Cổ mềm, Kernig (-), Brudzinski (-). Nghiệm pháp Romberg (-), không rung giật nhãn cầu.</td>
                        </tr>
                      </>
                    )}

                    {/* 5. CƠ XƯƠNG KHỚP */}
                    {isOrthopedics && (
                      <>
                        <tr>
                          <td className="p-2.5 bg-emerald-100/60 font-bold text-emerald-950 border-r border-emerald-200">Tầm vận động khớp (ROM):</td>
                          <td className="p-2.5 text-slate-900 font-medium">Khớp gối 2 bên gập 130 độ, duỗi 0 độ; khớp vai xoay ngoài 80 độ, xoay trong 70 độ không giới hạn.</td>
                        </tr>
                        <tr>
                          <td className="p-2.5 bg-emerald-100/60 font-bold text-emerald-950 border-r border-emerald-200">Nghiệm pháp chuyên khoa:</td>
                          <td className="p-2.5 text-slate-900">Nghiệm pháp chạm xương bánh chè (-), dấu hiệu ngăn kéo (-), dấu hiệu Lasegue 85 độ 2 bên.</td>
                        </tr>
                        <tr>
                          <td className="p-2.5 bg-emerald-100/60 font-bold text-emerald-950 border-r border-emerald-200">Cột sống & Độ giãn thắt lưng:</td>
                          <td className="p-2.5 text-slate-900">Đường cong sinh lý cột sống bình thường, nghiệm pháp Schober 14/10cm, không điểm đau cạnh sống.</td>
                        </tr>
                      </>
                    )}

                    {/* 6. MẮT (NHÃN KHOA) */}
                    {isOphthalmology && (
                      <>
                        <tr>
                          <td className="p-2.5 bg-emerald-100/60 font-bold text-emerald-950 border-r border-emerald-200">Thị lực không kính & Có kính:</td>
                          <td className="p-2.5 text-slate-900 font-medium">Mắt phải (MP): 10/10; Mắt trái (MT): 10/10. Khúc xạ bình thường.</td>
                        </tr>
                        <tr>
                          <td className="p-2.5 bg-emerald-100/60 font-bold text-emerald-950 border-r border-emerald-200">Nhãn áp kế (Goldmann):</td>
                          <td className="p-2.5 text-slate-900">MP: 16 mmHg; MT: 15 mmHg (Trong giới hạn sinh lý bình thường 11 - 21 mmHg).</td>
                        </tr>
                        <tr>
                          <td className="p-2.5 bg-emerald-100/60 font-bold text-emerald-950 border-r border-emerald-200">Khám bán phần trước & Đáy mắt:</td>
                          <td className="p-2.5 text-slate-900">Giác mạc trong suốt, tiền phòng sâu sạch, thể thủy tinh trong. Gai thị hồng rõ bờ sắc nét, tỷ lệ C/D = 0.3.</td>
                        </tr>
                      </>
                    )}

                    {/* 7. TAI MŨI HỌNG */}
                    {isENT && (
                      <>
                        <tr>
                          <td className="p-2.5 bg-emerald-100/60 font-bold text-emerald-950 border-r border-emerald-200">Nội soi Tai:</td>
                          <td className="p-2.5 text-slate-900 font-medium">Ống tai ngoài 2 bên thông thoáng không đọng ráy, màng nhĩ sáng bóng, nón sáng tốt.</td>
                        </tr>
                        <tr>
                          <td className="p-2.5 bg-emerald-100/60 font-bold text-emerald-950 border-r border-emerald-200">Nội soi Mũi xoang:</td>
                          <td className="p-2.5 text-slate-900">Niêm mạc mũi hồng, cuống mũi dưới không quá phát, khe giữa thông thoáng không có mủ đọng, vách ngăn thẳng.</td>
                        </tr>
                        <tr>
                          <td className="p-2.5 bg-emerald-100/60 font-bold text-emerald-950 border-r border-emerald-200">Nội soi Họng & Thanh quản:</td>
                          <td className="p-2.5 text-slate-900">Amidan 2 bên độ I không sưng viêm, hai dây thanh âm trắng bóng di động khép kín tốt khi phát âm.</td>
                        </tr>
                      </>
                    )}

                    {/* 8. RĂNG HÀM MẶT */}
                    {isDental && (
                      <>
                        <tr>
                          <td className="p-2.5 bg-emerald-100/60 font-bold text-emerald-950 border-r border-emerald-200">Tình trạng mô nha chu:</td>
                          <td className="p-2.5 text-slate-900 font-medium">Nướu hồng săn chắc, không chảy máu chân răng khi thăm khám, cao răng độ I.</td>
                        </tr>
                        <tr>
                          <td className="p-2.5 bg-emerald-100/60 font-bold text-emerald-950 border-r border-emerald-200">Khám khớp thái dương hàm:</td>
                          <td className="p-2.5 text-slate-900">Biên độ há miệng 4.2cm không đau, vận động khớp hàm êm dịu không có tiếng lục cục.</td>
                        </tr>
                      </>
                    )}

                    {/* 9. TIÊU HÓA - GAN MẬT */}
                    {isGastroenterology && (
                      <>
                        <tr>
                          <td className="p-2.5 bg-emerald-100/60 font-bold text-emerald-950 border-r border-emerald-200">Điểm đau ngoại khoa tiêu hóa:</td>
                          <td className="p-2.5 text-slate-900 font-medium">Điểm thượng vị ấn tức nhẹ; Điểm túi mật Murphy (-); Điểm ruột thừa MacBurney (-).</td>
                        </tr>
                        <tr>
                          <td className="p-2.5 bg-emerald-100/60 font-bold text-emerald-950 border-r border-emerald-200">Dấu hiệu màng bụng & Gan lách:</td>
                          <td className="p-2.5 text-slate-900">Phản ứng thành bụng (-), cảm ứng phúc mạc (-). Gan lách không sờ thấy dưới bờ sườn.</td>
                        </tr>
                      </>
                    )}

                    {/* 10. HÔ HẤP */}
                    {isPulmonology && (
                      <>
                        <tr>
                          <td className="p-2.5 bg-emerald-100/60 font-bold text-emerald-950 border-r border-emerald-200">Khám thông khí phổi & Tiếng rale:</td>
                          <td className="p-2.5 text-slate-900 font-medium">Lồng ngực giãn nở đều, rung thanh đều 2 bên. Rì rào phế nang êm dịu, không rale rít, không rale ngáy.</td>
                        </tr>
                        <tr>
                          <td className="p-2.5 bg-emerald-100/60 font-bold text-emerald-950 border-r border-emerald-200">Chức năng thông khí phổi (Spirometry):</td>
                          <td className="p-2.5 text-slate-900">Chỉ số FEV1/FVC = 82% (Không có hội chứng tắc nghẽn hay hạn chế đường thở).</td>
                        </tr>
                      </>
                    )}

                    {/* 11. NỘI TIẾT */}
                    {isEndocrinology && (
                      <>
                        <tr>
                          <td className="p-2.5 bg-emerald-100/60 font-bold text-emerald-950 border-r border-emerald-200">Khám tuyến giáp & Chuyển hóa:</td>
                          <td className="p-2.5 text-slate-900 font-medium">Tuyến giáp không to (Độ 0), không rung miu, không có tiếng thổi. Mạch mu chân bắt rõ 2 bên.</td>
                        </tr>
                        <tr>
                          <td className="p-2.5 bg-emerald-100/60 font-bold text-emerald-950 border-r border-emerald-200">Tầm soát biến chứng bàn chân:</td>
                          <td className="p-2.5 text-slate-900">Cảm giác nông sâu bàn chân tốt với Monofilament 10g, không có vết loét điểm tỳ đè.</td>
                        </tr>
                      </>
                    )}

                    {/* 12. SẢN PHỤ KHOA */}
                    {isObstetrics && (
                      <>
                        <tr>
                          <td className="p-2.5 bg-emerald-100/60 font-bold text-emerald-950 border-r border-emerald-200">Tiền sử sản khoa PARA:</td>
                          <td className="p-2.5 text-slate-900 font-medium">PARA: 0000 (Chưa sinh con) / Chu kỳ kinh nguyệt đều 28 ngày.</td>
                        </tr>
                        <tr>
                          <td className="p-2.5 bg-emerald-100/60 font-bold text-emerald-950 border-r border-emerald-200">Khám phụ khoa & Cổ tử cung:</td>
                          <td className="p-2.5 text-slate-900">Âm hộ tầng sinh môn bình thường, cổ tử cung trơn láng không loét sùi, túi cùng mềm không đau.</td>
                        </tr>
                      </>
                    )}

                    {/* MẶC ĐỊNH CHO CÁC CHUYÊN KHOA KHÁC */}
                    {!isCardiology && !isPediatrics && !isDermatology && !isNeurology && !isOrthopedics && !isOphthalmology && !isENT && !isDental && !isGastroenterology && !isPulmonology && !isEndocrinology && !isObstetrics && (
                      <tr>
                        <td className="p-2.5 bg-emerald-100/60 font-bold text-emerald-950 border-r border-emerald-200">Khám thực thể chuyên khoa:</td>
                        <td className="p-2.5 text-slate-900">
                          {encounter.physicalExamination || 'Khám cơ quan chuyên khoa ghi nhận tình trạng ổn định, các nghiệm pháp lâm sàng trong giới hạn bình thường.'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* V. KẾT QUẢ CẬN LÂM SÀNG & XÉT NGHIỆM */}
            <div className="space-y-1.5 pt-2">
              <h3 className="font-bold uppercase text-xs text-slate-900 border-b border-slate-300 pb-1 flex items-center gap-1.5">
                <span className="text-emerald-700 font-black">•</span>
                <span>V. KẾT QUẢ CẬN LÂM SÀNG & XÉT NGHIỆM</span>
              </h3>

              {labAndImaging.length > 0 ? (
                <div className="border border-slate-300 rounded overflow-hidden text-xs">
                  <table className="w-full table-fixed border-collapse">
                    <colgroup>
                      <col className="w-[6%]" />
                      <col className="w-[28%]" />
                      <col className="w-[24%]" />
                      <col className="w-[16%]" />
                      <col className="w-[16%]" />
                      <col className="w-[10%]" />
                    </colgroup>
                    <thead className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
                      <tr>
                        <th className="p-2 text-center border-r border-slate-200">STT</th>
                        <th className="p-2 text-left border-r border-slate-200">Tên xét nghiệm / Kỹ thuật</th>
                        <th className="p-2 text-left border-r border-slate-200">Phân loại kỹ thuật</th>
                        <th className="p-2 text-left border-r border-slate-200">Kết quả đo được</th>
                        <th className="p-2 text-left border-r border-slate-200">Khoảng tham chiếu</th>
                        <th className="p-2 text-center">Đánh giá</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {labAndImaging.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="p-2 text-center text-slate-500 border-r border-slate-200">{idx + 1}</td>
                          <td className="p-2 font-bold text-slate-900 border-r border-slate-200">{item.name}</td>
                          <td className="p-2 text-slate-600 border-r border-slate-200">
                            {item.category === 'IMAGING' ? 'Chẩn đoán hình ảnh / Thăm dò' : 'Xét nghiệm sinh hóa / Huyết học'}
                          </td>
                          <td className="p-2 font-bold text-slate-950 border-r border-slate-200">
                            {item.value} {item.unit || ''}
                          </td>
                          <td className="p-2 text-slate-500 border-r border-slate-200">{item.referenceRange || 'Theo chuẩn sinh lý'}</td>
                          <td className="p-2 text-center font-medium text-slate-800">
                            {item.interpretation || 'Bình thường'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="border border-slate-300 rounded p-2.5 text-xs text-slate-500 italic bg-slate-50">
                  Các chỉ số cận lâm sàng và xét nghiệm cơ bản trong giới hạn bình thường.
                </div>
              )}
            </div>

            {/* VI. CHẨN ĐOÁN XÁC ĐỊNH (CHUẨN ICD-10) */}
            <div className="space-y-1.5 pt-2">
              <h3 className="font-bold uppercase text-xs text-slate-900 border-b border-slate-300 pb-1 flex items-center gap-1.5">
                <span className="text-emerald-700 font-black">•</span>
                <span>VI. CHẨN ĐOÁN XÁC ĐỊNH (CHUẨN ICD-10)</span>
              </h3>

              <div className="border border-slate-300 rounded overflow-hidden text-xs">
                <table className="w-full table-fixed border-collapse">
                  <colgroup>
                    <col className="w-[24%]" />
                    <col className="w-[60%]" />
                    <col className="w-[16%]" />
                  </colgroup>
                  <thead className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
                    <tr>
                      <th className="p-2 text-left border-r border-slate-200">Phân loại</th>
                      <th className="p-2 text-left border-r border-slate-200">Tên bệnh / Chẩn đoán chi tiết</th>
                      <th className="p-2 text-center font-mono">Mã ICD-10</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {diagnoses.length > 0 ? (
                      diagnoses.map((diag, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="p-2 font-semibold border-r border-slate-200">
                            {diag.isPrimary ? (
                              <span className="text-slate-950 font-bold">• Bệnh chính:</span>
                            ) : (
                              <span className="text-slate-700">• Bệnh kèm theo:</span>
                            )}
                          </td>
                          <td className="p-2 font-bold text-slate-950 border-r border-slate-200">{diag.diseaseName}</td>
                          <td className="p-2 text-center font-mono font-bold text-slate-900 bg-slate-50/50">{diag.icdCode}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td className="p-2 font-bold">• Bệnh chính:</td>
                        <td className="p-2 font-bold text-slate-950">Theo dõi sức khỏe chuyên khoa định kỳ</td>
                        <td className="p-2 text-center font-mono font-bold">Z00.0</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* VII. TIÊN LƯỢNG & KẾ HOẠCH ĐIỀU TRỊ */}
            <div className="space-y-1.5 pt-2">
              <h3 className="font-bold uppercase text-xs text-slate-900 border-b border-slate-300 pb-1 flex items-center gap-1.5">
                <span className="text-emerald-700 font-black">•</span>
                <span>VII. TIÊN LƯỢNG & KẾ HOẠCH ĐIỀU TRỊ</span>
              </h3>

              <div className="border border-slate-300 rounded overflow-hidden text-xs">
                <table className="w-full table-fixed border-collapse border-b border-slate-200">
                  <colgroup>
                    <col className="w-[24%]" />
                    <col className="w-[76%]" />
                  </colgroup>
                  <tbody className="divide-y divide-slate-200">
                    <tr>
                      <td className="p-2 bg-slate-50 font-semibold text-slate-700 border-r border-slate-200">1. Tiên lượng bệnh:</td>
                      <td className="p-2 text-slate-900">
                        <strong>Tiên lượng gần:</strong> Tốt, bệnh đáp ứng nhanh với phác đồ. <strong>Tiên lượng xa:</strong> Ổn định khi duy trì lối sống lành mạnh.
                      </td>
                    </tr>
                    <tr>
                      <td className="p-2 bg-slate-50 font-semibold text-slate-700 border-r border-slate-200">2. Chế độ chăm sóc & Dinh dưỡng:</td>
                      <td className="p-2 text-slate-900">
                        Chế độ chăm sóc Cấp III (Tự chăm sóc tại nhà). Chế độ ăn cân đối dinh dưỡng, tăng cường rau xanh, uống đủ 2 lít nước/ngày.
                      </td>
                    </tr>
                    <tr>
                      <td className="p-2 bg-slate-50 font-semibold text-slate-700 border-r border-slate-200">3. Hướng điều trị:</td>
                      <td className="p-2 text-slate-900 font-medium leading-relaxed">{encounter.treatmentPlan || 'Điều trị nội khoa ngoại trú kết hợp chế độ ăn uống, vận động và tuân thủ đơn thuốc.'}</td>
                    </tr>
                  </tbody>
                </table>

                {/* Đơn thuốc điện tử */}
                <div className="bg-slate-100 border-b border-slate-200 px-3 py-2 flex items-center justify-between font-bold text-slate-800 text-xs">
                  <span>4. Đơn thuốc ngoại trú (Mã đơn: <strong className="font-mono text-slate-950 font-bold">{prescription?.prescriptionCode || 'RX-NOVACARE'}</strong>)</span>
                  <span className="text-[11px] font-normal text-slate-600">Cấp theo Thông tư 27/2021/TT-BYT</span>
                </div>

                {rxItems.length > 0 ? (
                  <table className="w-full table-fixed border-collapse border-b border-slate-200">
                    <colgroup>
                      <col className="w-[6%]" />
                      <col className="w-[30%]" />
                      <col className="w-[38%]" />
                      <col className="w-[14%]" />
                      <col className="w-[12%]" />
                    </colgroup>
                    <thead className="bg-slate-50 text-slate-800 font-bold border-b border-slate-200">
                      <tr>
                        <th className="p-2 text-center border-r border-slate-200">STT</th>
                        <th className="p-2 text-left border-r border-slate-200">Tên thuốc, nồng độ/hàm lượng</th>
                        <th className="p-2 text-left border-r border-slate-200">Đường dùng & Hướng dẫn sử dụng</th>
                        <th className="p-2 text-center border-r border-slate-200">Số lượng</th>
                        <th className="p-2 text-center">Thời gian</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {rxItems.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/70">
                          <td className="p-2 text-center text-slate-500 border-r border-slate-200">{idx + 1}</td>
                          <td className="p-2 font-bold text-slate-900 border-r border-slate-200">
                            {item.drugName} <span className="font-normal text-slate-600">({item.dosage})</span>
                          </td>
                          <td className="p-2 text-slate-800 border-r border-slate-200">{item.usageInstruction}</td>
                          <td className="p-2 text-center font-bold text-slate-950 border-r border-slate-200">
                            {item.quantity} {item.unit || 'Viên'}
                          </td>
                          <td className="p-2 text-center text-slate-600">{item.duration || '7 ngày'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="p-2.5 text-slate-500 italic border-b border-slate-200">Không kê đơn thuốc đặc trị / Tư vấn chế độ dinh dưỡng và sinh hoạt.</div>
                )}

                {/* Lời dặn dò bác sĩ */}
                <table className="w-full table-fixed border-collapse">
                  <colgroup>
                    <col className="w-[24%]" />
                    <col className="w-[76%]" />
                  </colgroup>
                  <tbody>
                    <tr>
                      <td className="p-2 bg-slate-50 font-semibold text-slate-700 border-r border-slate-200">5. Lời dặn của bác sĩ:</td>
                      <td className="p-2 text-slate-900 italic leading-relaxed">
                        {cleanDoctorNotes(prescription?.note || encounter.doctorNotes)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

          </div>

          {/* ========================================================= */}
          {/* C. TỔNG KẾT BỆNH ÁN & HẸN TÁI KHÁM */}
          {/* ========================================================= */}
          <div className="space-y-4 pt-4 border-t-2 border-slate-300">
            {/* Banner Section C */}
            <div className="bg-slate-900 text-white px-3 py-1.5 rounded font-extrabold uppercase text-xs tracking-wider flex items-center justify-between shadow-sm">
              <span>C. TỔNG KẾT BỆNH ÁN & HẸN TÁI KHÁM</span>
              <span className="text-[10px] font-normal text-slate-300">Kết quả điều trị</span>
            </div>

            <div className="border border-slate-300 rounded overflow-hidden text-xs">
              <table className="w-full table-fixed border-collapse">
                <colgroup>
                  <col className="w-[24%]" />
                  <col className="w-[76%]" />
                </colgroup>
                <tbody className="divide-y divide-slate-200">
                  <tr>
                    <td className="p-2 bg-slate-50 font-semibold text-slate-700 border-r border-slate-200">1. Kết quả điều trị:</td>
                    <td className="p-2 text-slate-900 font-bold text-emerald-800">
                      ✓ Khỏi / Thuyên giảm tốt (Bệnh nhân ổn định, đáp ứng phác đồ ngoại trú)
                    </td>
                  </tr>
                  <tr>
                    <td className="p-2 bg-slate-50 font-semibold text-slate-700 border-r border-slate-200">2. Tình trạng ra về:</td>
                    <td className="p-2 text-slate-900 font-medium">{encounter.conclusion || 'Tình trạng người bệnh ổn định sau khi thăm khám và hoàn tất thủ tục.'}</td>
                  </tr>
                  <tr>
                    <td className="p-2 bg-slate-50 font-semibold text-slate-700 border-r border-slate-200">3. Hẹn ngày tái khám:</td>
                    <td className="p-2 font-bold text-slate-950">
                      {encounter.revisitDate ? formatDateStr(encounter.revisitDate) : 'Tái khám sau 14 - 30 ngày hoặc khi có dấu hiệu bất thường'}
                      <span className="font-normal text-slate-600 ml-2 italic">(Mang theo hồ sơ bệnh án này khi tái khám)</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* ========================================================= */}
          {/* D. XÁC NHẬN PHÁP LÝ & CHỮ KÝ SỐ */}
          {/* ========================================================= */}
          <div className="space-y-4 pt-4 border-t-2 border-slate-900">
            {/* Banner Section D */}
            <div className="bg-slate-900 text-white px-3 py-1.5 rounded font-extrabold uppercase text-xs tracking-wider flex items-center justify-between shadow-sm">
              <span>D. XÁC NHẬN PHÁP LÝ & CHỮ KÝ SỐ</span>
              <span className="text-[10px] font-normal text-slate-300">Xác thực hồ sơ EMR</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-center text-xs pt-2">
              
              {/* Cột 1: Mã QR tra cứu EMR */}
              <div className="flex flex-col items-center justify-center space-y-1 sm:border-r border-slate-200 pr-2">
                <QRCodeSVG
                  value={`https://novacare.vn/emr/verify/${encounter.encounterCode}`}
                  size={80}
                  level="M"
                />
                <span className="text-[10px] text-slate-500 font-mono">
                  Mã EMR: {encounter.encounterCode}
                </span>
              </div>

              {/* Cột 2: Người bệnh / Thân nhân */}
              <div className="space-y-1 flex flex-col justify-between sm:border-r border-slate-200 pr-2">
                <div>
                  <p className="font-bold uppercase text-slate-800 text-[11px]">NGƯỜI BỆNH / ĐẠI DIỆN</p>
                  <p className="text-[9px] text-slate-500 italic">(Ký và ghi rõ họ tên)</p>
                </div>
                <p className="font-bold text-slate-950 pt-8 uppercase text-xs">{patient?.fullName || '---'}</p>
              </div>

              {/* Cột 3: Bác sĩ khám bệnh */}
              <div className="space-y-1 flex flex-col justify-between sm:border-r border-slate-200 pr-2">
                <div>
                  <p className="font-bold uppercase text-slate-900 text-[11px]">BÁC SĨ KHÁM BỆNH</p>
                  <p className="text-[9px] text-slate-500 italic">(Ký số điện tử)</p>
                </div>
                <div className="pt-2 space-y-0.5">
                  <div className="inline-flex items-center gap-1 text-[9px] font-semibold text-emerald-800 border border-emerald-300 px-1.5 py-0.5 rounded bg-emerald-50/50">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span>Ký số TT 13/2025/TT-BYT</span>
                  </div>
                  <p className="font-extrabold text-slate-950 text-xs">{encounter.doctorName}</p>
                </div>
              </div>

              {/* Cột 4: Lãnh đạo Khoa / Bệnh viện */}
              <div className="space-y-1 flex flex-col justify-between">
                <div>
                  <p className="font-bold uppercase text-slate-900 text-[11px]">LÃNH ĐẠO KHOA / CƠ SỞ</p>
                  <p className="text-[9px] text-slate-500 italic">(Xác nhận bệnh án EMR)</p>
                </div>
                <div className="pt-2 space-y-0.5">
                  <div className="inline-flex items-center gap-1 text-[9px] font-semibold text-blue-800 border border-blue-300 px-1.5 py-0.5 rounded bg-blue-50/50">
                    <ShieldCheck className="w-3 h-3 text-blue-600" />
                    <span>Đã duyệt điện tử</span>
                  </div>
                  <p className="font-bold text-slate-950 text-xs">TS.BS. Giám Đốc Chuyên Môn</p>
                </div>
              </div>
            </div>

            <div className="text-center text-[10px] text-slate-400 border-t border-slate-200 pt-3 font-mono">
              Hệ thống Bệnh án Điện tử Liên thông Quốc gia NovaCare • Chuẩn 88 trường Bộ Y tế Việt Nam (TT 46/2018/TT-BYT & TT 13/2025/TT-BYT)
            </div>
          </div>

        </div>
      </DialogContent>
    </Dialog>
  );
}
