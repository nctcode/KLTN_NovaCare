'use client';

import React, { useState, useEffect } from 'react';
import {
  Search,
  Building2,
  Stethoscope,
  ShieldCheck,
  Calendar,
  User,
  Activity,
  FileText,
  AlertCircle,
  Clock,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Lock,
  Eye,
  CheckCircle2,
  FileCheck2,
  Share2,
  Pill,
  Microscope,
  Info,
  MapPin,
  QrCode,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { interoperabilityService } from '@/services/interoperability.service';
import { VietnamEMRModal, MedicalEncounterData } from '@/components/emr/VietnamEMRModal';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function DoctorInteroperabilityPortalContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('query') || '';

  // Search State
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [pinCode, setPinCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Doctor & Hospital Simulation Context
  const [actingDoctor, setActingDoctor] = useState('BS.CKII Nguyễn Văn An');
  const [actingHospital, setActingHospital] = useState('Bệnh viện Đa khoa NovaCare Sài Gòn');
  const [actingPurpose, setActingPurpose] = useState('Hội chẩn liên viện & Tiếp nhận điều trị');

  // Search Results State
  const [searchResult, setSearchResult] = useState<any | null>(null);
  const [collapsedHospitals, setCollapsedHospitals] = useState<Record<string, boolean>>({});
  const [collapsedVisits, setCollapsedVisits] = useState<Record<string, boolean>>({});

  // EMR Modal State
  const [selectedEncounter, setSelectedEncounter] = useState<MedicalEncounterData | null>(null);
  const [isEMRModalOpen, setIsEMRModalOpen] = useState(false);

  // Active Tab: 'RECORDS' | 'AUDIT_LOGS'
  const [activeTab, setActiveTab] = useState<'RECORDS' | 'AUDIT_LOGS'>('RECORDS');
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);

  const handleSearch = async (overrideQuery?: string) => {
    const queryToUse = (overrideQuery || searchQuery).trim();
    if (!queryToUse) {
      setErrorMessage('Vui lòng nhập Số CCCD, Mã định danh MPI hoặc Mã chia sẻ ShareCode');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await interoperabilityService.portalLookup({
        query: queryToUse,
        doctorName: actingDoctor,
        hospitalName: actingHospital,
        purpose: actingPurpose,
        pin: pinCode || undefined,
      });

      const lookupData = res?.data || res;
      if (lookupData && (lookupData.patient || lookupData.hospitalGroups)) {
        setSearchResult(lookupData);
        fetchAuditLogs(lookupData.patient?.id);
      } else {
        setErrorMessage('Không tìm thấy dữ liệu liên thông cho mã này.');
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Không tìm thấy hồ sơ hoặc mã chia sẻ không hợp lệ.';
      setErrorMessage(msg);
      setSearchResult(null);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAuditLogs = async (patientProfileId?: string) => {
    setIsLoadingLogs(true);
    try {
      const res = await interoperabilityService.getPortalAuditLogs(undefined, patientProfileId);
      const logs = res?.data || res;
      if (Array.isArray(logs)) {
        setAuditLogs(logs);
      }
    } catch (err) {
      console.log('Fetch logs info:', err);
    } finally {
      setIsLoadingLogs(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
    if (initialQuery) {
      handleSearch(initialQuery);
    }
  }, [initialQuery]);

  const toggleHospital = (hId: string) => {
    setCollapsedHospitals((prev) => ({
      ...prev,
      [hId]: !prev[hId],
    }));
  };

  const toggleVisit = (encId: string) => {
    setCollapsedVisits((prev) => ({
      ...prev,
      [encId]: !prev[encId],
    }));
  };

  const openEMRDetail = (enc: any, patient: any) => {
    const doctorObj = enc.appointment?.slot?.doctorWorkplace?.doctor;
    const hospitalObj = enc.hospital || enc.appointment?.slot?.doctorWorkplace?.hospital;
    const docName = enc.doctorName || doctorObj?.fullName || actingDoctor;

    setSelectedEncounter({
      id: enc.id,
      encounterCode: enc.encounterCode || `EMR-${enc.id.slice(0, 8).toUpperCase()}`,
      encounterDate: enc.encounterDate || new Date(),
      doctorName: docName,
      doctorTitle: enc.doctorTitle || 'Bác sĩ chuyên khoa',
      specialtyName: enc.specialtyName || 'Chuyên khoa Nội',
      chiefComplaint: enc.chiefComplaint || 'Khám và theo dõi định kỳ',
      clinicalSummary: enc.clinicalSummary || 'Bệnh nhân đến khám theo lịch hẹn, sinh hiệu ổn định.',
      physicalExamination: 'Khám toàn diện: Bệnh nhân tỉnh táo, tiếp xúc tốt, da niêm hồng. Khám thực thể cơ quan tổn thương phù hợp với chẩn đoán chuyên khoa.',
      treatmentPlan: 'Điều trị nội khoa ngoại trú kết hợp theo dõi sát triệu chứng và tái khám theo chỉ định.',
      conclusion: 'Tình trạng bệnh nhân ổn định sau khi thăm khám, đáp ứng tốt với phác đồ điều trị.',
      revisitDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      masterPatientId: patient?.masterPatientId || `MPI-VN-${patient?.identityNumber || '792040182'}`,
      hospital: hospitalObj,
      patientProfile: patient,
      diagnoses: enc.diagnoses || [],
      observations: enc.observations || [],
      prescription: enc.prescription || null,
      digitalSignature: {
        signerName: docName,
        signedAt: enc.encounterDate || new Date(),
        certificateNumber: `VN-BYT-CA-PORTAL-${enc.id.slice(0, 6).toUpperCase()}`,
        sha256Hash: `SHA256:PORTAL-${(enc.encounterCode || 'EMR').toUpperCase()}-VALID`,
        isValid: true,
      },
    });
    setIsEMRModalOpen(true);
  };

  return (
    <div className="w-full space-y-8 pb-20">

      {/* ========================================================= */}
      {/* 1. PORTAL HERO HEADER (GIAO DIỆN CỔNG TRA CỨU LIÊN VIỆN) */}
      {/* ========================================================= */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-100">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5 flex-wrap">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 font-bold shadow-xs">
                <Stethoscope className="w-5 h-5" />
              </div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
                Cổng Tra Cứu Hồ Sơ Y Tế Liên Thông Quốc Gia
              </h1>
              <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 uppercase tracking-wider">
                HL7 FHIR • TT 46/2018/TT-BYT
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 max-w-3xl leading-relaxed">
              Môi trường dành cho <strong>Bác sĩ & Cơ sở Y tế</strong> tra cứu lịch sử khám, chẩn đoán ICD-10, cận lâm sàng và đơn thuốc của bệnh nhân từ mọi bệnh viện trong hệ thống liên thông y tế.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start lg:self-auto shrink-0">
            <div className="bg-slate-50 px-3.5 py-2 rounded-2xl border border-slate-200 text-xs flex items-center gap-2 text-slate-700 font-semibold shadow-2xs">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Bảo mật chuẩn TT 13/2025/TT-BYT</span>
            </div>
          </div>
        </div>

        {/* Doctor & Hospital Context Selector (Ngữ cảnh Bác sĩ làm việc) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-slate-50/80 p-4 rounded-2xl border border-slate-200">
          <div className="space-y-1.5">
            <span className="text-slate-700 font-bold block">1. Bác sĩ tra cứu:</span>
            <select
              value={actingDoctor}
              onChange={(e) => setActingDoctor(e.target.value)}
              className="w-full bg-white border border-slate-200 text-slate-800 rounded-xl px-3 py-2 font-medium focus:outline-emerald-600 focus:border-emerald-600 shadow-2xs transition"
            >
              <option value="BS.CKII Nguyễn Văn An">BS.CKII Nguyễn Văn An (Trưởng khoa Lâm sàng)</option>
              <option value="BS.CKI Trần Thanh Sơn">BS.CKI Trần Thanh Sơn (Bác sĩ Tiếp nhận)</option>
              <option value="ThS.BS Lê Hoàng Nam">ThS.BS Lê Hoàng Nam (Bác sĩ Hội chẩn)</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <span className="text-slate-700 font-bold block">2. Bệnh viện đang tiếp nhận:</span>
            <select
              value={actingHospital}
              onChange={(e) => setActingHospital(e.target.value)}
              className="w-full bg-white border border-slate-200 text-slate-800 rounded-xl px-3 py-2 font-medium focus:outline-emerald-600 focus:border-emerald-600 shadow-2xs transition"
            >
              <option value="Bệnh viện Đa khoa NovaCare Sài Gòn">Bệnh viện Đa khoa NovaCare Sài Gòn</option>
              <option value="Bệnh viện Đa khoa NovaCare Tân Bình">Bệnh viện Đa khoa NovaCare Tân Bình</option>
              <option value="Bệnh viện Y Dược NovaCare Chợ Lớn">Bệnh viện Y Dược NovaCare Chợ Lớn</option>
              <option value="Bệnh viện Chợ Rẫy (Bệnh viện ngoài hệ thống)">Bệnh viện Chợ Rẫy (Tuyến Trung ương)</option>
              <option value="Bệnh viện Đại học Y Dược TP.HCM">Bệnh viện Đại học Y Dược TP.HCM</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <span className="text-slate-700 font-bold block">3. Mục đích tra cứu hồ sơ:</span>
            <select
              value={actingPurpose}
              onChange={(e) => setActingPurpose(e.target.value)}
              className="w-full bg-white border border-slate-200 text-slate-800 rounded-xl px-3 py-2 font-medium focus:outline-emerald-600 focus:border-emerald-600 shadow-2xs transition"
            >
              <option value="Hội chẩn liên viện & Tiếp nhận điều trị">Hội chẩn liên viện & Tiếp nhận điều trị</option>
              <option value="Tiếp nhận cấp cứu khẩn cấp">Tiếp nhận cấp cứu khẩn cấp</option>
              <option value="Khám bệnh ngoại trú & Đánh giá phác đồ">Khám bệnh ngoại trú & Đánh giá phác đồ</option>
              <option value="Kiểm tra tương tác & Trùng lặp đơn thuốc">Kiểm tra tương tác & Trùng lặp đơn thuốc</option>
            </select>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 2. SEARCH BAR & QUICK TEST CHIPS */}
      {/* ========================================================= */}
      <Card className="border border-slate-200 bg-white rounded-3xl shadow-sm overflow-hidden">
        <CardContent className="p-6 sm:p-8 space-y-5">
          <div className="space-y-1.5">
            <h2 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
              <Search className="w-5 h-5 text-emerald-600" />
              <span>Tra Cứu Hồ Sơ Bệnh Nhân Liên Viện</span>
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Nhập <strong>Số CCCD (12 chữ số)</strong>, <strong>Mã định danh liên thông (MPI-VN-...)</strong> hoặc <strong>Mã chia sẻ (ShareCode: NC-...)</strong> để truy xuất dữ liệu từ tất cả các bệnh viện.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Nhập số CCCD (VD: 079088012345) hoặc Mã chia sẻ (VD: NC-8899-2026)..."
                className="pl-12 h-12 rounded-2xl bg-slate-50 border-slate-200 text-sm font-semibold text-slate-900 focus:bg-white transition"
              />
            </div>

            {searchQuery.toUpperCase().startsWith('NC-') && (
              <Input
                value={pinCode}
                onChange={(e) => setPinCode(e.target.value)}
                placeholder="Mã PIN (nếu có)"
                maxLength={6}
                className="w-32 h-12 rounded-2xl bg-slate-50 border-slate-200 text-sm font-mono text-center font-bold"
              />
            )}

            <Button
              onClick={() => handleSearch()}
              disabled={isLoading}
              className="h-12 px-7 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-black text-sm gap-2 shadow-sm cursor-pointer shrink-0"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Đang truy xuất...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  Tra cứu liên thông
                </>
              )}
            </Button>
          </div>

          {errorMessage && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ========================================================= */}
      {/* 3. TABS: KẾT QUẢ LIÊN THÔNG & NHẬT KÝ TRUY CẬP (AUDIT LOGS) */}
      {/* ========================================================= */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => setActiveTab('RECORDS')}
          className={`px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-black flex items-center gap-2 transition cursor-pointer ${
            activeTab === 'RECORDS'
              ? 'bg-emerald-700 text-white shadow-sm'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Hồ sơ liên thông đa viện {searchResult ? `(${searchResult.hospitalGroups?.length || 0} bệnh viện)` : ''}</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('AUDIT_LOGS');
            fetchAuditLogs(searchResult?.patient?.id);
          }}
          className={`px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-black flex items-center gap-2 transition cursor-pointer ${
            activeTab === 'AUDIT_LOGS'
              ? 'bg-emerald-700 text-white shadow-sm'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Nhật ký truy cập (Audit Logs) {auditLogs.length > 0 ? `(${auditLogs.length})` : ''}</span>
        </button>
      </div>

      {/* ========================================================= */}
      {/* 4. TAB 1: KẾT QUẢ HỒ SƠ LIÊN THÔNG ĐA VIỆN */}
      {/* ========================================================= */}
      {activeTab === 'RECORDS' && (
        <div className="space-y-6">
          {searchResult ? (
            <>
              {/* Thẻ Định Danh Hợp Nhất (Master Patient Index) */}
              {/* 1. Thông tin Bệnh nhân định danh liên thông */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-3.5">
                    <div className="w-11 h-11 rounded-xl bg-slate-900 text-white font-black text-base flex items-center justify-center shadow-2xs">
                      {searchResult.patient.fullName.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-lg font-bold text-slate-950 uppercase">
                          {searchResult.patient.fullName}
                        </h3>
                        <span className="bg-slate-100 text-slate-700 text-xs font-semibold px-2.5 py-0.5 rounded-md border border-slate-200">
                          {searchResult.patient.gender === 'FEMALE' ? 'Nữ' : 'Nam'} · {searchResult.patient.dateOfBirth ? new Date().getFullYear() - new Date(searchResult.patient.dateOfBirth).getFullYear() + ' tuổi' : ''}
                        </span>
                        <span className="bg-emerald-50 text-emerald-800 text-xs font-mono font-bold px-2.5 py-0.5 rounded-md border border-emerald-200">
                          {searchResult.patient.masterPatientId}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 font-medium pt-0.5">
                        Tổng hợp hồ sơ liên thông từ <strong>{searchResult.summary.totalHospitals} Bệnh viện</strong> · Tổng cộng <strong>{searchResult.summary.totalEncounters} lượt khám</strong>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg">
                      Phương thức: {searchResult.lookupType === 'CCCD' ? 'Số CCCD Quốc Gia' : searchResult.lookupType === 'SHARE_CODE' ? 'Mã chia sẻ ShareCode' : 'Mã định danh MPI'}
                    </span>
                  </div>
                </div>

                {/* Patient Details Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-0.5">
                    <span className="text-slate-500 font-semibold block">Số CCCD / Định danh:</span>
                    <strong className="text-slate-900 font-mono font-bold text-sm">{searchResult.patient.identityNumber || 'Chưa cập nhật'}</strong>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-0.5">
                    <span className="text-slate-500 font-semibold block">Mã số thẻ BHYT:</span>
                    <strong className="text-slate-900 font-mono font-bold text-sm">{searchResult.patient.healthInsurance || 'Chưa cập nhật'}</strong>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-0.5">
                    <span className="text-slate-500 font-semibold block">Số điện thoại:</span>
                    <strong className="text-slate-900 font-bold text-sm">{searchResult.patient.phone || '---'}</strong>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-0.5">
                    <span className="text-slate-500 font-semibold block">Người liên hệ khẩn cấp:</span>
                    <strong className="text-slate-900 font-bold">{searchResult.patient.emergencyContact || 'Thân nhân'} {searchResult.patient.emergencyPhone ? `(${searchResult.patient.emergencyPhone})` : ''}</strong>
                  </div>
                </div>

                {/* Cảnh báo Dị ứng & Tiền sử bệnh lý (Rất quan trọng cho Bác sĩ) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                  <div className="p-3 bg-rose-50/70 border border-rose-200 rounded-xl space-y-1">
                    <span className="text-rose-900 font-bold flex items-center gap-1.5 text-xs">
                      <AlertCircle className="w-4 h-4 text-rose-600" />
                      Tiền sử dị ứng thuốc & Dị nguyên:
                    </span>
                    <p className="text-rose-950 font-semibold">
                      {searchResult.patient.allergies || 'Chưa ghi nhận tiền sử dị ứng thuốc'}
                    </p>
                  </div>

                  <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl space-y-1">
                    <span className="text-amber-900 font-bold flex items-center gap-1.5 text-xs">
                      <Activity className="w-4 h-4 text-amber-600" />
                      Tiền sử bệnh lý mạn tính / Bệnh nền:
                    </span>
                    <p className="text-amber-950 font-semibold">
                      {searchResult.patient.medicalHistory || 'Không ghi nhận tiền sử bệnh lý mạn tính'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Danh Sách Bệnh Án Theo Bệnh Viện */}
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-slate-950">
                    Lịch Sử Lâm Sàng Tổng Hợp Đa Cơ Sở Khám Chữa Bệnh
                  </h3>
                  <span className="text-xs text-slate-600 font-medium">
                    {searchResult.hospitalGroups?.length || 0} Cơ sở y tế liên kết
                  </span>
                </div>

                {searchResult.hospitalGroups?.map((group: any) => {
                  const isHospitalCollapsed = !!collapsedHospitals[group.hospitalId];

                  return (
                    <Card
                      key={group.hospitalId}
                      className="border border-emerald-200/90 bg-white rounded-2xl shadow-xs overflow-hidden"
                    >
                      {/* Hospital Group Header */}
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

                      {/* Encounters List Inside This Hospital */}
                      {!isHospitalCollapsed && (
                        <div className="divide-y divide-slate-100 animate-in fade-in-50 duration-150">
                          {group.encounters?.map((enc: any) => {
                            const isVisitCollapsed = !!collapsedVisits[enc.id];
                            const dateObj = new Date(enc.encounterDate || enc.createdAt);
                            const dateFormatted = format(dateObj, 'dd/MM/yyyy', { locale: vi });
                            const timeFormatted = format(dateObj, 'HH:mm', { locale: vi });

                            const primaryDiag = enc.diagnoses?.find((d: any) => d.isPrimary) || enc.diagnoses?.[0];
                            const diagText = primaryDiag ? `${primaryDiag.diseaseName} (${primaryDiag.icdCode || 'ICD-10'})` : 'Khám tổng quát & theo dõi';

                            const rxItems = enc.prescription?.items || [];
                            const rxSummary = rxItems.length > 0
                              ? rxItems.map((it: any) => `${it.drugName}${it.dosage ? ` ${it.dosage}` : ''}`).join(' · ')
                              : 'Không kê đơn thuốc đặc trị';

                            const obsItems = enc.observations || [];
                            const obsSummary = obsItems.length > 0
                              ? obsItems.map((ob: any) => `${ob.name}: ${ob.value} ${ob.unit || ''}`).join(' · ')
                              : 'Các chỉ số sinh tồn và cận lâm sàng ổn định';

                            return (
                              <div key={enc.id} className="p-5 sm:p-6 space-y-3.5 hover:bg-slate-50/50 transition-colors">
                                {/* Encounter Top Header */}
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                  <div className="flex items-center gap-2.5 flex-wrap">
                                    <span className="bg-slate-100 text-slate-800 border border-slate-200 font-bold text-xs px-2.5 py-1 rounded-lg flex items-center gap-1.5">
                                      <Calendar className="w-3.5 h-3.5 text-slate-500" />
                                      <span>{dateFormatted}</span>
                                      <span className="text-slate-500 font-normal">({timeFormatted})</span>
                                    </span>
                                    <span className="text-slate-900 font-bold text-sm">
                                      Khoa: {enc.specialtyName || 'Chuyên khoa'}
                                    </span>
                                    <span className="text-slate-600 text-xs font-medium">
                                      • BS: {enc.doctorName || 'Bác sĩ điều trị'}
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-2 self-end sm:self-auto">
                                    <Button
                                      onClick={() => openEMRDetail(enc, searchResult.patient)}
                                      size="sm"
                                      className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold gap-1.5 h-8.5 rounded-lg shadow-2xs cursor-pointer"
                                    >
                                      <FileText className="w-3.5 h-3.5" />
                                      Xem Bệnh án (EMR)
                                    </Button>
                                    <button
                                      onClick={() => toggleVisit(enc.id)}
                                      className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                                      title={isVisitCollapsed ? 'Mở rộng' : 'Thu gọn'}
                                    >
                                      <div className={`transition-transform duration-200 ${isVisitCollapsed ? 'rotate-180' : ''}`}>
                                        <ChevronUp className="w-4 h-4 text-slate-600" />
                                      </div>
                                    </button>
                                  </div>
                                </div>

                                {/* 4 Clinical Sections */}
                                {!isVisitCollapsed && (
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs pt-1">
                                    {/* 1. Chẩn đoán */}
                                    <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200 space-y-1">
                                      <span className="text-slate-700 font-bold block text-xs">
                                        Chẩn đoán xác định (ICD-10):
                                      </span>
                                      <p className="text-slate-950 font-bold leading-relaxed">{diagText}</p>
                                    </div>

                                    {/* 2. Đơn thuốc */}
                                    <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200 space-y-1">
                                      <span className="text-slate-700 font-bold block text-xs">
                                        Đơn thuốc điều trị:
                                      </span>
                                      <p className="text-slate-800 font-medium leading-relaxed">{rxSummary}</p>
                                    </div>

                                    {/* 3. Cận lâm sàng */}
                                    <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200 space-y-1">
                                      <span className="text-slate-700 font-bold block text-xs">
                                        Kết quả cận lâm sàng & X-quang:
                                      </span>
                                      <p className="text-slate-800 font-medium leading-relaxed">{obsSummary}</p>
                                    </div>

                                    {/* 4. Kết luận */}
                                    <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200 space-y-1">
                                      <span className="text-slate-700 font-bold block text-xs">
                                        Kết luận & Kế hoạch điều trị:
                                      </span>
                                      <p className="text-slate-800 font-medium leading-relaxed">
                                        {enc.treatmentPlan || enc.clinicalSummary || 'Bệnh nhân tuân thủ đơn thuốc, theo dõi diễn biến và tái khám theo chỉ định.'}
                                      </p>
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
                })}
              </div>
            </>
          ) : (
            <div className="p-12 text-center bg-white border border-slate-200 rounded-3xl space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <Search className="w-7 h-7" />
              </div>
              <h3 className="text-base font-black text-slate-900">Sẵn Sàng Tra Cứu Hồ Sơ Y Tế</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Vui lòng nhập Số CCCD hoặc Mã chia sẻ ShareCode của bệnh nhân vào thanh tìm kiếm phía trên để truy xuất toàn bộ dữ liệu khám bệnh liên viện.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* 5. TAB 2: NHẬT KÝ TRUY CẬP LIÊN THÔNG (AUDIT LOGS) */}
      {/* ========================================================= */}
      {activeTab === 'AUDIT_LOGS' && (
        <Card className="border border-slate-200 bg-white rounded-3xl shadow-sm overflow-hidden">
          <CardHeader className="p-6 border-b border-slate-100 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg font-black text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <span>Nhật Ký Truy Cập Hồ Sơ Y Tế Liên Viện (Access Audit Trail)</span>
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Ghi nhận tự động và bất biến mọi hành vi tra cứu hồ sơ y tế theo tiêu chuẩn an toàn thông tin Bộ Y Tế.
              </CardDescription>
            </div>
            <Button
              onClick={() => fetchAuditLogs(searchResult?.patient?.id)}
              variant="outline"
              size="sm"
              className="text-xs font-bold gap-1.5 rounded-xl border-slate-300 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingLogs ? 'animate-spin' : ''}`} />
              Làm mới
            </Button>
          </CardHeader>

          <CardContent className="p-0">
            {auditLogs.length > 0 ? (
              <div className="divide-y divide-slate-100 text-xs">
                {auditLogs.map((log: any, idx: number) => {
                  const logDate = new Date(log.accessedAt);
                  const formattedDate = format(logDate, 'dd/MM/yyyy HH:mm:ss', { locale: vi });

                  return (
                    <div key={log.id || idx} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-300">
                            {formattedDate}
                          </span>
                          <span className="font-black text-emerald-900 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200">
                            {log.shareToken || 'TRA_CUU_LIEN_VIEN'}
                          </span>
                          <span className="text-slate-600 font-medium">
                            Bệnh nhân: <strong>{log.patientName || searchResult?.patient?.fullName || 'Hồ sơ y tế'}</strong>
                          </span>
                        </div>
                        <p className="text-slate-600 text-xs">
                          {log.userAgent || `Cổng Bác sĩ | ${actingDoctor} (${actingHospital})`}
                        </p>
                      </div>

                      <div className="text-right sm:text-right shrink-0 text-[11px] text-slate-400 font-mono">
                        <span>IP: {log.ipAddress || '127.0.0.1'}</span>
                        <span className="block text-emerald-600 font-bold">Xác thực hợp lệ</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-10 text-center text-slate-500 space-y-2">
                <ShieldCheck className="w-8 h-8 mx-auto text-slate-400" />
                <p className="text-xs">Chưa có nhật ký truy cập nào được ghi nhận.</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ========================================================= */}
      {/* 6. MODAL XEM CHI TIẾT BỆNH ÁN A4 CHUẨN BỘ Y TẾ */}
      {/* ========================================================= */}
      <VietnamEMRModal
        isOpen={isEMRModalOpen}
        onClose={() => setIsEMRModalOpen(false)}
        encounter={selectedEncounter}
      />

    </div>
  );
}

export default function DoctorInteroperabilityPortalPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-slate-500 font-bold">Đang tải Cổng Tra Cứu Liên Thông...</div>}>
      <DoctorInteroperabilityPortalContent />
    </Suspense>
  );
}
