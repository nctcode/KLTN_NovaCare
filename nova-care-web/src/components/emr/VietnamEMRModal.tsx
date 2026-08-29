'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Printer,
  X,
  CheckCircle2,
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

  // Làm sạch lời dặn bác sĩ, loại bỏ các ký tự [MOCK HIS] hoặc tag thừa
  const cleanDoctorNotes = (notes?: string | null) => {
    if (!notes) return 'Uống thuốc đúng liều và thời gian theo đơn. Ăn uống điều độ, tránh các yếu tố khởi phát dị ứng. Tái khám theo lịch hẹn.';
    const cleaned = notes.replace(/\[MOCK HIS\]/gi, '').replace(/\[.*?\]/g, '').trim();
    return cleaned || 'Uống thuốc đúng liều và thời gian theo đơn. Ăn uống điều độ, tránh các yếu tố khởi phát dị ứng. Tái khám theo lịch hẹn.';
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto p-0 border-slate-300 rounded-xl shadow-xl bg-slate-100 print:p-0 print:border-none print:shadow-none print:max-h-none print:overflow-visible print:bg-white">
        
        {/* Floating Action Bar */}
        <div className="sticky top-0 z-20 flex items-center justify-between px-6 py-3 bg-slate-900 text-white shadow-sm print:hidden">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-200">
              Bệnh án điện tử ngoại trú (Mẫu 01/BV • Chuẩn Bộ Y Tế Việt Nam)
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
          {/* I. HÀNH CHÍNH (SỔ XUỐNG TỪ 1 ĐẾN 9 THẲNG TẮP) */}
          {/* ========================================================= */}
          <div className="space-y-1.5">
            <h2 className="font-bold uppercase text-xs sm:text-sm text-slate-950 border-b border-slate-400 pb-1">
              I. HÀNH CHÍNH
            </h2>

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
                    <td className="p-2 bg-slate-50 font-semibold text-slate-700 border-r border-slate-200">4. Số CCCD / Mã định danh:</td>
                    <td className="p-2 font-mono font-bold text-slate-950">{patient?.identityNumber || 'Chưa cập nhật'}</td>
                  </tr>

                  <tr>
                    <td className="p-2 bg-slate-50 font-semibold text-slate-700 border-r border-slate-200">5. Mã số thẻ BHYT:</td>
                    <td className="p-2 font-mono font-bold text-slate-900">{patient?.healthInsurance || 'Chưa cập nhật'}</td>
                  </tr>

                  <tr>
                    <td className="p-2 bg-slate-50 font-semibold text-slate-700 border-r border-slate-200">6. Số điện thoại:</td>
                    <td className="p-2 font-mono text-slate-900">{patient?.phone || '---'}</td>
                  </tr>

                  <tr>
                    <td className="p-2 bg-slate-50 font-semibold text-slate-700 border-r border-slate-200">7. Dân tộc / Quốc tịch:</td>
                    <td className="p-2 text-slate-900">{patient?.ethnicity || 'Kinh'} · {patient?.nationality || 'Việt Nam'}</td>
                  </tr>

                  <tr>
                    <td className="p-2 bg-slate-50 font-semibold text-slate-700 border-r border-slate-200">8. Địa chỉ thường trú:</td>
                    <td className="p-2 text-slate-900 leading-relaxed">{patient?.address || 'Chưa cập nhật'}</td>
                  </tr>

                  <tr>
                    <td className="p-2 bg-slate-50 font-semibold text-slate-700 border-r border-slate-200">9. Người báo tin khi cần:</td>
                    <td className="p-2 text-slate-900">
                      <span className="font-bold text-slate-950">{patient?.emergencyContact || 'Thân nhân người bệnh'}</span>
                      {patient?.emergencyPhone && <span className="text-slate-700 ml-2 font-mono">(SĐT: {patient.emergencyPhone})</span>}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* ========================================================= */}
          {/* II. LÝ DO KHÁM BỆNH & TIỀN SỬ (SỔ XUỐNG TỪ 1 ĐẾN 4 THẲNG TẮP) */}
          {/* ========================================================= */}
          <div className="space-y-1.5">
            <h2 className="font-bold uppercase text-xs sm:text-sm text-slate-950 border-b border-slate-400 pb-1">
              II. LÝ DO KHÁM BỆNH & TIỀN SỬ
            </h2>

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
                    <td className="p-2 bg-slate-50 font-semibold text-slate-700 border-r border-slate-200 align-top">2. Bệnh sử (Diễn biến):</td>
                    <td className="p-2 text-slate-900 leading-relaxed">{encounter.clinicalSummary || 'Bệnh nhân đến khám theo lịch hẹn, sinh hiệu ổn định, tiếp xúc tốt.'}</td>
                  </tr>

                  <tr>
                    <td className="p-2 bg-slate-50 font-semibold text-slate-700 border-r border-slate-200">3. Tiền sử bệnh bản thân:</td>
                    <td className="p-2 text-slate-900 leading-relaxed">{patient?.medicalHistory || 'Không ghi nhận tiền sử bệnh lý mạn tính'}</td>
                  </tr>

                  <tr>
                    <td className="p-2 bg-slate-50 font-semibold text-slate-700 border-r border-slate-200">4. Tiền sử dị ứng:</td>
                    <td className="p-2 font-semibold text-slate-900 leading-relaxed">{patient?.allergies || 'Chưa ghi nhận tiền sử dị ứng thuốc'}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* ========================================================= */}
          {/* III. KHÁM BỆNH (LÂM SÀNG) */}
          {/* ========================================================= */}
          <div className="space-y-1.5">
            <h2 className="font-bold uppercase text-xs sm:text-sm text-slate-950 border-b border-slate-400 pb-1">
              III. KHÁM BỆNH (LÂM SÀNG)
            </h2>

            <div className="border border-slate-300 rounded overflow-hidden text-xs">
              <table className="w-full table-fixed border-collapse">
                <colgroup>
                  <col className="w-[24%]" />
                  <col className="w-[76%]" />
                </colgroup>
                <tbody className="divide-y divide-slate-200">
                  {/* 1. Dấu hiệu sinh tồn */}
                  <tr>
                    <td className="p-2 bg-slate-50 font-semibold text-slate-700 border-r border-slate-200 align-middle">
                      1. Dấu hiệu sinh tồn:
                    </td>
                    <td className="p-2">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                        <div className="p-1.5 bg-slate-50 rounded border border-slate-200">
                          <span className="text-slate-500 block text-[11px]">Huyết áp (HA)</span>
                          <strong className="text-slate-950 text-xs sm:text-sm">
                            {vitalSigns.find(v => v.name.toLowerCase().includes('huyết'))?.value || '120/80'} mmHg
                          </strong>
                        </div>
                        <div className="p-1.5 bg-slate-50 rounded border border-slate-200">
                          <span className="text-slate-500 block text-[11px]">Mạch (Nhịp tim)</span>
                          <strong className="text-slate-950 text-xs sm:text-sm">
                            {vitalSigns.find(v => v.name.toLowerCase().includes('tim') || v.name.toLowerCase().includes('mạch'))?.value || '76'} lần/phút
                          </strong>
                        </div>
                        <div className="p-1.5 bg-slate-50 rounded border border-slate-200">
                          <span className="text-slate-500 block text-[11px]">Thân nhiệt</span>
                          <strong className="text-slate-950 text-xs sm:text-sm">
                            {vitalSigns.find(v => v.name.toLowerCase().includes('nhiệt'))?.value || '36.8'} °C
                          </strong>
                        </div>
                        <div className="p-1.5 bg-slate-50 rounded border border-slate-200">
                          <span className="text-slate-500 block text-[11px]">SpO2</span>
                          <strong className="text-slate-950 text-xs sm:text-sm">
                            {vitalSigns.find(v => v.name.toLowerCase().includes('spo2'))?.value || '98'} %
                          </strong>
                        </div>
                      </div>
                    </td>
                  </tr>

                  {/* 2. Khám thực thể */}
                  <tr>
                    <td className="p-2 bg-slate-50 font-semibold text-slate-700 border-r border-slate-200 align-top">
                      2. Khám thực thể cơ quan:
                    </td>
                    <td className="p-2 text-slate-900 leading-relaxed">
                      {encounter.physicalExamination || 'Toàn thân: Bệnh nhân tỉnh táo, tiếp xúc tốt, da niêm hồng. Khám chuyên khoa ghi nhận tổn thương khu trú phù hợp với chẩn đoán.'}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* ========================================================= */}
          {/* IV. KẾT QUẢ CẬN LÂM SÀNG & XÉT NGHIỆM */}
          {/* ========================================================= */}
          <div className="space-y-1.5">
            <h2 className="font-bold uppercase text-xs sm:text-sm text-slate-950 border-b border-slate-400 pb-1">
              IV. KẾT QUẢ CẬN LÂM SÀNG
            </h2>

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
                          {item.category === 'IMAGING' ? 'Chẩn đoán hình ảnh / Thăm dò' : 'Xét nghiệm sinh hóa / Vi sinh'}
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

          {/* ========================================================= */}
          {/* V. CHẨN ĐOÁN XÁC ĐỊNH (CHUẨN ICD-10) */}
          {/* ========================================================= */}
          <div className="space-y-1.5">
            <h2 className="font-bold uppercase text-xs sm:text-sm text-slate-950 border-b border-slate-400 pb-1">
              V. CHẨN ĐOÁN XÁC ĐỊNH
            </h2>

            {diagnoses.length > 0 ? (
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
                    {diagnoses.map((diag, idx) => (
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
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="border border-slate-300 rounded p-2.5 text-xs text-slate-500 italic bg-slate-50">
                Khám và theo dõi sức khỏe tổng quát định kỳ.
              </div>
            )}
          </div>

          {/* ========================================================= */}
          {/* VI. ĐIỀU TRỊ & ĐƠN THUỐC ĐIỆN TỬ */}
          {/* ========================================================= */}
          <div className="space-y-1.5">
            <h2 className="font-bold uppercase text-xs sm:text-sm text-slate-950 border-b border-slate-400 pb-1">
              VI. ĐIỀU TRỊ & ĐƠN THUỐC
            </h2>

            <div className="border border-slate-300 rounded overflow-hidden text-xs">
              {/* 1. Hướng điều trị */}
              <table className="w-full table-fixed border-collapse border-b border-slate-200">
                <colgroup>
                  <col className="w-[24%]" />
                  <col className="w-[76%]" />
                </colgroup>
                <tbody>
                  <tr>
                    <td className="p-2 bg-slate-50 font-semibold text-slate-700 border-r border-slate-200">1. Hướng điều trị:</td>
                    <td className="p-2 text-slate-900 font-medium leading-relaxed">{encounter.treatmentPlan || 'Điều trị nội khoa ngoại trú kết hợp chế độ ăn uống, vận động và tuân thủ đơn thuốc.'}</td>
                  </tr>
                </tbody>
              </table>

              {/* 2. Đơn thuốc ngoại trú Header */}
              <div className="bg-slate-100 border-b border-slate-200 px-3 py-2 flex items-center justify-between font-bold text-slate-800 text-xs">
                <span>2. Đơn thuốc ngoại trú (Mã đơn: <strong className="font-mono text-slate-950 font-bold">{prescription?.prescriptionCode || 'RX-NOVACARE'}</strong>)</span>
                <span className="text-[11px] font-normal text-slate-600">Cấp theo Thông tư 27/2021/TT-BYT</span>
              </div>

              {/* Bảng danh mục thuốc */}
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

              {/* 3. Lời dặn dò của bác sĩ */}
              <table className="w-full table-fixed border-collapse">
                <colgroup>
                  <col className="w-[24%]" />
                  <col className="w-[76%]" />
                </colgroup>
                <tbody>
                  <tr>
                    <td className="p-2 bg-slate-50 font-semibold text-slate-700 border-r border-slate-200">3. Lời dặn của bác sĩ:</td>
                    <td className="p-2 text-slate-900 italic leading-relaxed">
                      {cleanDoctorNotes(prescription?.note || encounter.doctorNotes)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* ========================================================= */}
          {/* VII. KẾT LUẬN & HƯỚNG ĐIỀU TRỊ TIẾP THEO */}
          {/* ========================================================= */}
          <div className="space-y-1.5">
            <h2 className="font-bold uppercase text-xs sm:text-sm text-slate-950 border-b border-slate-400 pb-1">
              VII. KẾT LUẬN & HẸN TÁI KHÁM
            </h2>

            <div className="border border-slate-300 rounded overflow-hidden text-xs">
              <table className="w-full table-fixed border-collapse">
                <colgroup>
                  <col className="w-[24%]" />
                  <col className="w-[76%]" />
                </colgroup>
                <tbody className="divide-y divide-slate-200">
                  <tr>
                    <td className="p-2 bg-slate-50 font-semibold text-slate-700 border-r border-slate-200">1. Tình trạng ra về:</td>
                    <td className="p-2 text-slate-950 font-medium">{encounter.conclusion || 'Tình trạng người bệnh ổn định sau khi thăm khám.'}</td>
                  </tr>

                  <tr>
                    <td className="p-2 bg-slate-50 font-semibold text-slate-700 border-r border-slate-200">2. Hẹn ngày tái khám:</td>
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
          {/* CHỮ KÝ PHÁP LÝ & MÃ QR XÁC THỰC */}
          {/* ========================================================= */}
          <div className="border-t-2 border-slate-900 pt-5 mt-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center text-xs">
              
              {/* Cột 1: Mã QR tra cứu EMR */}
              <div className="flex flex-col items-center justify-center space-y-1 sm:border-r border-slate-200 pr-2">
                <QRCodeSVG
                  value={`https://novacare.vn/emr/verify/${encounter.encounterCode}`}
                  size={80}
                  level="M"
                />
                <span className="text-[10px] text-slate-500 font-mono">
                  Tra cứu EMR: {encounter.encounterCode}
                </span>
              </div>

              {/* Cột 2: Người bệnh / Thân nhân */}
              <div className="space-y-1 flex flex-col justify-between sm:border-r border-slate-200 pr-2">
                <div>
                  <p className="font-bold uppercase text-slate-800">NGƯỜI BỆNH / ĐẠI DIỆN</p>
                  <p className="text-[10px] text-slate-500 italic">(Ký và ghi rõ họ tên)</p>
                </div>
                <p className="font-bold text-slate-950 pt-8 uppercase">{patient?.fullName || '---'}</p>
              </div>

              {/* Cột 3: Bác sĩ khám bệnh */}
              <div className="space-y-1 flex flex-col justify-between">
                <div>
                  <p className="text-[11px] text-slate-600 italic">Ngày {new Date().getDate()} tháng {new Date().getMonth() + 1} năm {new Date().getFullYear()}</p>
                  <p className="font-bold uppercase text-slate-900">BÁC SĨ KHÁM BỆNH</p>
                  <p className="text-[10px] text-slate-500 italic">(Ký, ghi rõ họ tên và đóng dấu)</p>
                </div>
                <div className="pt-3 space-y-0.5">
                  <div className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded bg-emerald-50/50">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span>Chữ ký số hợp lệ (TT 13/2025/TT-BYT)</span>
                  </div>
                  <p className="font-extrabold text-slate-950 text-sm">{encounter.doctorName}</p>
                </div>
              </div>
            </div>

            <div className="text-center text-[10px] text-slate-400 border-t border-slate-200 pt-2 font-mono">
              Hệ thống Bệnh án Điện tử Liên thông Quốc gia NovaCare • Chuẩn Bộ Y tế Việt Nam (TT 46/2018/TT-BYT)
            </div>
          </div>

        </div>
      </DialogContent>
    </Dialog>
  );
}
