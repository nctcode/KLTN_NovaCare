'use client';

import React, { useState, useMemo } from 'react';
import {
  User,
  Calendar,
  CreditCard,
  HeartPulse,
  Building2,
  FileText,
  Activity,
  Pill,
  ChevronDown,
  ChevronUp,
  Stethoscope,
  Clock,
  ExternalLink,
  Sparkles,
  ClipboardList,
  Eye,
  Printer,
  Search,
  RotateCcw,
  X,
  ChevronLeft,
  ChevronRight,
  MapPin,
  FileCheck2,
} from 'lucide-react';
import { LookupResponseData, EncounterItem, HospitalGroup } from '@/services/novacare-api.service';
import { VietnamEMRModal, MedicalEncounterData } from './VietnamEMRModal';
import { Qd4750ExtractionModal } from './Qd4750ExtractionModal';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

interface PatientRecordDisplayProps {
  data: LookupResponseData;
}

function TablePagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  itemName = 'cơ sở KCB',
}: {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  itemName?: string;
}) {
  if (totalItems <= pageSize) return null;

  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 pb-1 border-t border-slate-200 text-xs text-slate-500 font-medium select-none">
      <div>
        Hiển thị <strong className="text-slate-800 font-bold">{startItem} - {endItem}</strong> trong tổng số <strong className="text-slate-800 font-bold">{totalItems}</strong> {itemName}
      </div>

      <div className="flex items-center gap-1.5 self-end sm:self-auto">
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage <= 1}
          className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-bold text-slate-700 flex items-center gap-1 transition cursor-pointer"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Trước</span>
        </button>

        <span className="px-3 py-1 font-bold text-slate-800 bg-slate-100 rounded-lg">
          {currentPage} / {totalPages}
        </span>

        <button
          type="button"
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage >= totalPages}
          className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-bold text-slate-700 flex items-center gap-1 transition cursor-pointer"
        >
          <span className="hidden sm:inline">Sau</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

export function PatientRecordDisplay({ data }: PatientRecordDisplayProps) {
  const { patient, summary, hospitalGroups } = data;

  // State quản lý mở EMR Modal chính thống
  const [selectedEncounter, setSelectedEncounter] = useState<MedicalEncounterData | null>(null);
  const [isEMRModalOpen, setIsEMRModalOpen] = useState(false);

  // State quản lý mở QĐ 4750 Extraction Modal
  const [selected4750EncounterCode, setSelected4750EncounterCode] = useState<string | null>(null);
  const [isQd4750ModalOpen, setIsQd4750ModalOpen] = useState(false);

  // State quản lý mở/đóng danh sách lần khám của từng bệnh viện (mặc định thu gọn)
  const [expandedHospitals, setExpandedHospitals] = useState<Record<string, boolean>>({});

  const toggleHospitalExpand = (hospId: string) => {
    setExpandedHospitals((prev) => ({
      ...prev,
      [hospId]: !prev[hospId],
    }));
  };

  // State quản lý bộ lọc
  const [filterDateSort, setFilterDateSort] = useState<'DESC' | 'ASC'>('DESC');
  const [filterTimePreset, setFilterTimePreset] = useState<'ALL' | '30DAYS' | '90DAYS' | '1YEAR'>('ALL');
  const [filterSpecialty, setFilterSpecialty] = useState<string>('ALL');
  const [filterHospital, setFilterHospital] = useState<string>('ALL');
  const [searchKeyword, setSearchKeyword] = useState<string>('');

  // Thu thập tất cả các đợt khám phẳng
  const allEncounters = useMemo(() => {
    const list: { enc: EncounterItem; group: HospitalGroup }[] = [];
    hospitalGroups?.forEach((group) => {
      group.encounters?.forEach((enc) => {
        list.push({ enc, group });
      });
    });
    return list;
  }, [hospitalGroups]);

  // Danh sách chuyên khoa trong kết quả tra cứu
  const availableSpecialties = useMemo(() => {
    const set = new Set<string>();
    allEncounters.forEach(({ enc }) => {
      if (enc.specialtyName) set.add(enc.specialtyName);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'vi'));
  }, [allEncounters]);

  // Danh sách bệnh viện trong kết quả tra cứu
  const availableHospitals = useMemo(() => {
    const set = new Set<string>();
    allEncounters.forEach(({ group }) => {
      if (group.hospitalName) set.add(group.hospitalName);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'vi'));
  }, [allEncounters]);

  // Lọc và sắp xếp các đợt khám
  const filteredEncounters = useMemo(() => {
    return allEncounters
      .filter(({ enc, group }) => {
        const specName = enc.specialtyName || 'Khoa Khám Bệnh';
        const hospName = group.hospitalName || '';
        const docName = enc.doctorName || '';
        const encDate = new Date(enc.encounterDate || 0);

        if (filterSpecialty !== 'ALL' && specName !== filterSpecialty) {
          return false;
        }

        if (filterHospital !== 'ALL' && hospName !== filterHospital) {
          return false;
        }

        if (filterTimePreset !== 'ALL') {
          const now = Date.now();
          const diffDays = (now - encDate.getTime()) / (1000 * 60 * 60 * 24);
          if (filterTimePreset === '30DAYS' && diffDays > 30) return false;
          if (filterTimePreset === '90DAYS' && diffDays > 90) return false;
          if (filterTimePreset === '1YEAR' && diffDays > 365) return false;
        }

        if (searchKeyword.trim()) {
          const q = searchKeyword.toLowerCase().trim();
          const matchHosp = hospName.toLowerCase().includes(q);
          const matchDoctor = docName.toLowerCase().includes(q);
          const matchSpec = specName.toLowerCase().includes(q);
          const matchReason = (enc.chiefComplaint || '').toLowerCase().includes(q);
          const matchSummary = (enc.clinicalSummary || '').toLowerCase().includes(q);
          if (!matchHosp && !matchDoctor && !matchSpec && !matchReason && !matchSummary) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        const timeA = new Date(a.enc.encounterDate || 0).getTime();
        const timeB = new Date(b.enc.encounterDate || 0).getTime();
        return filterDateSort === 'DESC' ? timeB - timeA : timeA - timeB;
      });
  }, [allEncounters, filterSpecialty, filterHospital, filterTimePreset, searchKeyword, filterDateSort]);

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
    setCurrentPage(1);
  };

  // Gom nhóm các lần khám theo Bệnh viện (Hospital Groups) giống giao diện bệnh nhân
  const groupedHospitals = useMemo(() => {
    const map = new Map<string, {
      hospitalId: string;
      hospitalName: string;
      hospitalAddress?: string;
      latestVisitDate: Date | null;
      encounters: { enc: EncounterItem; group: HospitalGroup }[];
      originalGroup: HospitalGroup;
    }>();

    filteredEncounters.forEach((item) => {
      const { enc, group } = item;
      const hospId = group.hospitalId || group.hospitalName || 'default-hospital';
      const hospName = group.hospitalName || 'Cơ sở KCB liên thông';
      const hospAddress = group.hospitalAddress || 'TP. Hồ Chí Minh';
      const encDate = enc.encounterDate ? new Date(enc.encounterDate) : null;

      if (!map.has(hospId)) {
        map.set(hospId, {
          hospitalId: hospId,
          hospitalName: hospName,
          hospitalAddress: hospAddress,
          latestVisitDate: encDate,
          encounters: [],
          originalGroup: group,
        });
      }

      const hospGroup = map.get(hospId)!;
      hospGroup.encounters.push(item);
      if (encDate && (!hospGroup.latestVisitDate || encDate > hospGroup.latestVisitDate)) {
        hospGroup.latestVisitDate = encDate;
      }
    });

    return Array.from(map.values());
  }, [filteredEncounters]);

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;
  const totalPages = Math.max(1, Math.ceil(groupedHospitals.length / pageSize));
  const paginatedHospitals = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return groupedHospitals.slice(start, start + pageSize);
  }, [groupedHospitals, currentPage, pageSize]);

  const handleOpenEMR = (enc: EncounterItem, group: HospitalGroup) => {
    setSelectedEncounter({
      id: enc.id,
      encounterCode: enc.encounterCode || `EMR-${enc.id?.slice(0, 8).toUpperCase()}`,
      encounterDate: enc.encounterDate,
      doctorName: enc.doctorName || 'Bác sĩ điều trị',
      doctorTitle: enc.doctorTitle,
      specialtyName: enc.specialtyName || 'Khoa Khám Bệnh',
      chiefComplaint: enc.chiefComplaint,
      clinicalSummary: enc.clinicalSummary,
      physicalExamination: enc.physicalExamination,
      initialDiagnosis: enc.initialDiagnosis,
      differentialDiagnosis: enc.differentialDiagnosis,
      treatmentPlan: enc.treatmentPlan,
      doctorNotes: enc.doctorNotes,
      conclusion: enc.conclusion,
      treatmentResult: enc.treatmentResult,
      revisitDate: enc.revisitDate,
      diagnoses: enc.diagnoses,
      observations: enc.observations,
      prescription: enc.prescription ? {
        prescriptionCode: enc.prescription.prescriptionCode || `RX-${enc.id?.slice(0, 8).toUpperCase()}`,
        note: enc.prescription.note,
        items: enc.prescription.items,
      } : null,
      hospital: {
        id: group.hospitalId,
        name: group.hospitalName,
        address: group.hospitalAddress,
      },
      patientProfile: {
        fullName: patient.fullName,
        gender: patient.gender,
        dateOfBirth: patient.dateOfBirth,
        identityNumber: patient.identityNumber,
        healthInsurance: patient.healthInsurance,
        phone: patient.phone,
        address: patient.address,
        medicalHistory: patient.medicalHistory,
        allergies: patient.allergies,
        emergencyContact: patient.emergencyContact,
        emergencyPhone: patient.emergencyPhone,
      },
      masterPatientId: patient.masterPatientId,
    });
    setIsEMRModalOpen(true);
  };

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return 'Chưa ghi nhận';
    try {
      return format(new Date(dateStr), 'dd/MM/yyyy', { locale: vi });
    } catch {
      return dateStr;
    }
  };

  const translateGender = (gender?: string) => {
    if (!gender) return null;
    const g = gender.toUpperCase();
    if (g === 'MALE' || g === 'NAM') return 'Nam';
    if (g === 'FEMALE' || g === 'NU' || g === 'NỮ') return 'Nữ';
    return gender;
  };

  return (
    <div className="space-y-5">
      {/* 1. THÔNG TIN HÀNH CHÍNH BỆNH NHÂN */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="bg-slate-800 text-white px-5 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <User className="w-5 h-5 text-blue-400" />
            <h3 className="font-bold text-sm sm:text-base uppercase tracking-wide">
              Thông Tin Bệnh Nhân
            </h3>
          </div>
          {patient?.masterPatientId && (
            <span className="font-mono text-xs bg-slate-700 px-2.5 py-1 rounded text-blue-300 border border-slate-600 font-semibold">
              Mã MPI: {patient.masterPatientId}
            </span>
          )}
        </div>

        <div className="p-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 text-xs sm:text-sm">
          {patient?.fullName && (
            <div>
              <span className="text-slate-500 block text-xs">Họ và tên</span>
              <span className="font-bold text-slate-900 text-sm sm:text-base uppercase">
                {patient.fullName}
              </span>
            </div>
          )}

          {patient?.dateOfBirth && (
            <div>
              <span className="text-slate-500 block text-xs">Ngày sinh</span>
              <span className="font-medium text-slate-800">
                {formatDate(patient.dateOfBirth)}
              </span>
            </div>
          )}

          {patient?.gender && (
            <div>
              <span className="text-slate-500 block text-xs">Giới tính</span>
              <span className="font-medium text-slate-800">
                {translateGender(patient.gender)}
              </span>
            </div>
          )}

          {patient?.identityNumber && (
            <div>
              <span className="text-slate-500 block text-xs">Số CCCD / Định danh</span>
              <span className="font-mono font-medium text-slate-800">
                {patient.identityNumber}
              </span>
            </div>
          )}

          {patient?.healthInsurance && (
            <div>
              <span className="text-slate-500 block text-xs">Mã thẻ BHYT</span>
              <span className="font-mono font-medium text-emerald-700">
                {patient.healthInsurance}
              </span>
            </div>
          )}

          {patient?.phone && (
            <div>
              <span className="text-slate-500 block text-xs">Số điện thoại</span>
              <span className="font-medium text-slate-800">{patient.phone}</span>
            </div>
          )}

          {patient?.address && (
            <div className="col-span-2">
              <span className="text-slate-500 block text-xs">Địa chỉ thường trú</span>
              <span className="font-medium text-slate-800">{patient.address}</span>
            </div>
          )}
        </div>

        {(patient?.medicalHistory || patient?.allergies) && (
          <div className="px-5 pb-4 pt-2 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {patient.medicalHistory && (
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                <span className="font-semibold text-slate-700 block mb-0.5">Tiền sử bệnh:</span>
                <span className="text-slate-600">{patient.medicalHistory}</span>
              </div>
            )}
            {patient.allergies && (
              <div className="bg-amber-50/80 p-2.5 rounded-lg border border-amber-200">
                <span className="font-semibold text-amber-800 block mb-0.5">Dị ứng thuốc/thức ăn:</span>
                <span className="text-amber-900">{patient.allergies}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 2. TỔNG QUAN HỒ SƠ */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-3.5">
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-500">Cơ sở y tế liên thông</div>
            <div className="text-lg font-bold text-slate-800">
              {summary?.totalHospitals || hospitalGroups?.length || 0} bệnh viện
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-3.5">
          <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-lg">
            <ClipboardList className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-500">Tổng số đợt khám</div>
            <div className="text-lg font-bold text-slate-800">
              {summary?.totalEncounters || 0} lượt khám
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-3.5">
          <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-lg">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-500">Lần khám gần nhất</div>
            <div className="text-base font-bold text-slate-800">
              {formatDate(summary?.lastEncounterDate)}
            </div>
          </div>
        </div>
      </div>

      {/* 3. DANH SÁCH BỆNH VIỆN & CÁC LẦN KHÁM LIÊN THÔNG */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-base text-slate-800 flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-600" />
            LỊCH SỬ KHÁM BỆNH LIÊN VIỆN
          </h3>
          <span className="text-xs text-slate-500">
            Nhấn vào từng đợt khám để xem Hồ sơ Bệnh án điện tử A4 chuẩn Bộ Y Tế
          </span>
        </div>

        {allEncounters.length > 0 && (
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
            {/* Tìm kiếm từ khóa */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                placeholder="Tìm nhanh theo tên bác sĩ, bệnh viện, chuyên khoa, chẩn đoán..."
                className="w-full pl-10 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
              />
              {searchKeyword && (
                <button
                  onClick={() => setSearchKeyword('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Các bộ chọn lọc */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              {/* Lọc 1: Thứ tự ngày */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-blue-600" />
                  <span>Sắp xếp thời gian</span>
                </label>
                <select
                  value={filterDateSort}
                  onChange={(e) => setFilterDateSort(e.target.value as 'DESC' | 'ASC')}
                  className="w-full text-xs font-semibold text-slate-800 bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="DESC">📅 Ngày gần nhất (Mới nhất)</option>
                  <option value="ASC">📅 Ngày xa nhất (Cũ nhất)</option>
                </select>
              </div>

              {/* Lọc 2: Khoảng thời gian */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                  <Clock className="w-3 h-3 text-teal-600" />
                  <span>Khoảng thời gian</span>
                </label>
                <select
                  value={filterTimePreset}
                  onChange={(e) => setFilterTimePreset(e.target.value as any)}
                  className="w-full text-xs font-semibold text-slate-800 bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="ALL">Tất cả thời gian</option>
                  <option value="30DAYS">30 ngày gần đây</option>
                  <option value="90DAYS">3 tháng gần đây</option>
                  <option value="1YEAR">1 năm gần đây</option>
                </select>
              </div>

              {/* Lọc 3: Chuyên khoa */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                  <Stethoscope className="w-3 h-3 text-indigo-600" />
                  <span>Chuyên khoa</span>
                </label>
                <select
                  value={filterSpecialty}
                  onChange={(e) => setFilterSpecialty(e.target.value)}
                  className="w-full text-xs font-semibold text-slate-800 bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
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
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                  <Building2 className="w-3 h-3 text-sky-600" />
                  <span>Bệnh viện / Cơ sở</span>
                </label>
                <select
                  value={filterHospital}
                  onChange={(e) => setFilterHospital(e.target.value)}
                  className="w-full text-xs font-semibold text-slate-800 bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer truncate"
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

            {/* Thống kê & Nút Reset */}
            <div className="flex items-center justify-between pt-1 text-xs border-t border-slate-100">
              <div className="text-slate-600">
                Hiển thị <strong className="text-slate-900 font-bold">{filteredEncounters.length}</strong> / {allEncounters.length} đợt khám
                {isFiltered && <span className="text-blue-700 font-semibold ml-1.5 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">Đang lọc</span>}
              </div>

              {isFiltered && (
                <button
                  onClick={resetFilters}
                  className="inline-flex items-center gap-1 text-blue-700 hover:text-blue-800 font-bold hover:underline cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Đặt lại bộ lọc</span>
                </button>
              )}
            </div>
          </div>
        )}

        {allEncounters.length === 0 && (
          <div className="p-8 text-center bg-white rounded-xl border border-slate-200 text-slate-500">
            Chưa có đợt khám nào được ghi nhận cho hồ sơ bệnh nhân này.
          </div>
        )}

        <div className="space-y-3">
          {allEncounters.length > 0 && filteredEncounters.length === 0 && (
            <div className="p-8 text-center bg-white rounded-xl border border-slate-200 space-y-3">
              <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <Search className="w-5 h-5" />
              </div>
              <p className="text-xs text-slate-500 font-medium">Không tìm thấy đợt khám nào phù hợp với bộ lọc.</p>
              <button
                onClick={resetFilters}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Xóa bộ lọc & Xem tất cả</span>
              </button>
            </div>
          )}

          {paginatedHospitals.map((hGroup) => {
            const isExpanded = !!expandedHospitals[hGroup.hospitalId];
            const latestDateFormatted = hGroup.latestVisitDate
              ? format(hGroup.latestVisitDate, 'dd/MM/yyyy', { locale: vi })
              : null;

            return (
              <div
                key={hGroup.hospitalId}
                className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:border-slate-300 transition-all overflow-hidden"
              >
                {/* 1. Header Bệnh viện (Click để mở rộng/thu gọn) */}
                <div
                  onClick={() => toggleHospitalExpand(hGroup.hospitalId)}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/60 transition select-none"
                >
                  <div className="flex items-start gap-3.5">
                    <div className="w-11 h-11 rounded-xl bg-slate-100 border border-slate-200 text-slate-800 flex items-center justify-center font-bold shrink-0 mt-0.5">
                      <Building2 className="w-5 h-5 text-slate-700" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-base font-extrabold text-slate-900 leading-snug">
                          {hGroup.hospitalName}
                        </h4>
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-700 bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-full">
                          {hGroup.encounters.length} lượt khám
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{hGroup.hospitalAddress || 'TP. Hồ Chí Minh'}</span>
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
                      <span>{isExpanded ? 'Thu gọn' : `Xem ${hGroup.encounters.length} lần khám`}</span>
                      <ChevronDown
                        className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${
                          isExpanded ? 'rotate-180 text-slate-900' : ''
                        }`}
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Chi tiết các lần khám khi mở rộng */}
                {isExpanded && (
                  <div className="border-t border-slate-200 bg-slate-50/50 p-4 sm:p-5 space-y-3">
                    <div className="flex items-center justify-between text-xs text-slate-500 font-semibold px-1">
                      <span>Chi tiết các lần khám tại {hGroup.hospitalName} ({hGroup.encounters.length})</span>
                      <span className="text-[11px] text-slate-400 hidden sm:inline">Nhấn &quot;Xem bệnh án (EMR)&quot; để tra cứu chi tiết</span>
                    </div>

                    <div className="space-y-2.5">
                      {hGroup.encounters.map(({ enc, group }, idx) => {
                        const dateObj = enc.encounterDate ? new Date(enc.encounterDate) : new Date();
                        const dateFormatted = format(dateObj, 'dd/MM/yyyy', { locale: vi });
                        const timeFormatted = format(dateObj, 'HH:mm', { locale: vi });
                        const timeStr = timeFormatted !== '00:00' ? timeFormatted : '14:30';

                        const diagText = enc.diagnoses && enc.diagnoses.length > 0
                          ? `${enc.diagnoses[0].diseaseName} (${enc.diagnoses[0].icdCode || 'ICD-10'})`
                          : enc.initialDiagnosis || enc.clinicalSummary || 'Khám tổng quát';

                        return (
                          <div
                            key={enc.id || idx}
                            className="border border-slate-200 bg-white rounded-xl shadow-2xs p-4 hover:border-slate-300 hover:shadow-xs transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                          >
                            <div className="space-y-1 text-left">
                              <div className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                <span>Ngày {dateFormatted} · {timeStr}</span>
                              </div>
                              <div className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                                <Stethoscope className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                                <span>{enc.specialtyName || 'Khoa Khám Bệnh'} · {enc.doctorName || 'Bác sĩ chuyên khoa'}</span>
                              </div>
                              <div className="text-xs text-slate-600 font-medium">
                                Chẩn đoán: <span className="text-slate-800 font-semibold">{diagText}</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto flex-wrap">
                              <button
                                type="button"
                                onClick={() => handleOpenEMR(enc, group)}
                                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer"
                              >
                                <FileText className="w-3.5 h-3.5 text-slate-300" />
                                <span>Xem bệnh án (EMR)</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setSelected4750EncounterCode(enc.encounterCode || enc.id);
                                  setIsQd4750ModalOpen(true);
                                }}
                                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-bold text-xs rounded-xl shadow-2xs transition cursor-pointer"
                                title="Trích xuất gói dữ liệu chuẩn QĐ 4750/QĐ-BYT gửi Cổng BHYT"
                              >
                                <FileCheck2 className="w-3.5 h-3.5 text-indigo-600" />
                                <span>Trích xuất QĐ 4750</span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* Phân trang Bệnh viện */}
          <TablePagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={groupedHospitals.length}
            pageSize={pageSize}
            onPageChange={(page) => setCurrentPage(page)}
            itemName="bệnh viện / cơ sở KCB"
          />
        </div>
      </div>

      {/* MODAL BỆNH ÁN ĐIỆN TỬ CHUẨN BỘ Y TẾ (A4 FORMAT) */}
      <VietnamEMRModal
        isOpen={isEMRModalOpen}
        onClose={() => setIsEMRModalOpen(false)}
        encounter={selectedEncounter}
      />

      {/* MODAL TRÍCH XUẤT CHUẨN QĐ 4750/QĐ-BYT (BẢNG CHECK-IN & BẢNG 1) */}
      <Qd4750ExtractionModal
        isOpen={isQd4750ModalOpen}
        onClose={() => setIsQd4750ModalOpen(false)}
        encounterCode={selected4750EncounterCode}
      />
    </div>
  );
}
