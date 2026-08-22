'use client';

import { useState } from 'react';
import {
  Calendar,
  User,
  Stethoscope,
  Activity,
  FileText,
  Pill,
  ChevronDown,
  ChevronUp,
  Building2,
  Clock,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { UnifiedMedicalRecordResponse, UnifiedEncounter } from '@/services/interoperability.service';

interface SharedMedicalTimelineProps {
  data: UnifiedMedicalRecordResponse | null;
  isLoading: boolean;
  errorStatus: number | null;
  onGrantRequest?: () => void;
}

export function SharedMedicalTimeline({
  data,
  isLoading,
  errorStatus,
  onGrantRequest,
}: SharedMedicalTimelineProps) {
  const [expandedEncounterId, setExpandedEncounterId] = useState<string | null>(null);

  // 1. Loading State
  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200/80 text-center space-y-4">
        <div className="inline-flex p-4 rounded-2xl bg-blue-50 text-blue-600 animate-pulse">
          <Activity className="w-8 h-8 animate-spin" />
        </div>
        <div>
          <h3 className="font-bold text-slate-800 text-base">Đang tải lịch sử khám y tế liên thông...</h3>
          <p className="text-xs text-slate-500 mt-1">Đang truy xuất và chuẩn hóa dữ liệu từ hệ thống bệnh viện nguồn</p>
        </div>
      </div>
    );
  }

  // 2. 403 Consent Enforcement State
  if (errorStatus === 403) {
    return (
      <div className="bg-gradient-to-br from-amber-50/80 to-orange-50/50 rounded-2xl p-8 border border-amber-200/80 text-center space-y-4 shadow-sm">
        <div className="inline-flex p-4 rounded-2xl bg-amber-100 text-amber-700 shadow-inner">
          <ShieldAlert className="w-10 h-10" />
        </div>
        <div className="max-w-md mx-auto space-y-2">
          <h3 className="font-bold text-slate-900 text-lg">Chưa có quyền truy cập lịch sử khám</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Bạn chưa cấp quyền chia sẻ dữ liệu y tế cho bệnh viện tiếp nhận hoặc quyền truy cập đã hết hạn/thu hồi.
          </p>
        </div>
        {onGrantRequest && (
          <div className="pt-2">
            <button
              type="button"
              onClick={onGrantRequest}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-xs rounded-xl shadow-md shadow-blue-500/20 transition inline-flex items-center gap-2"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Quản lý & Cấp quyền chia sẻ ngay</span>
            </button>
          </div>
        )}
      </div>
    );
  }

  // 3. Other Error State
  if (errorStatus && errorStatus !== 403) {
    return (
      <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center space-y-3">
        <p className="text-sm font-semibold text-slate-700">Không thể tải dữ liệu liên thông (Mã lỗi: {errorStatus})</p>
        <p className="text-xs text-slate-500">Vui lòng kiểm tra lại trạng thái liên kết mã bệnh nhân hoặc thử lại sau.</p>
      </div>
    );
  }

  // 4. Empty State
  if (!data || !data.encounters || data.encounters.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center space-y-3">
        <div className="inline-flex p-3 rounded-full bg-slate-100 text-slate-400">
          <FileText className="w-6 h-6" />
        </div>
        <h3 className="font-semibold text-slate-700 text-sm">Chưa có lịch sử khám bệnh liên thông</h3>
        <p className="text-xs text-slate-500">Bệnh nhân chưa có lượt khám nào ở trạng thái đã phát hành (PUBLISHED) tại bệnh viện này.</p>
      </div>
    );
  }

  const toggleExpand = (id: string) => {
    setExpandedEncounterId(expandedEncounterId === id ? null : id);
  };

  return (
    <div className="space-y-6">
      {/* Interoperability Header Card */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-2xl p-6 shadow-md border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-semibold tracking-wide border border-emerald-500/30">
            <CheckCircle2 className="w-3.5 h-3.5" /> Dữ liệu đã chuẩn hóa (Unified Interoperable Record)
          </div>
          <h3 className="text-lg font-bold text-white">Lịch sử khám liên thông</h3>
          <p className="text-xs text-slate-300">
            Truy xuất từ <strong className="text-white">{data.sourceHospital.name}</strong> sang{' '}
            <strong className="text-white">{data.targetHospital.name}</strong>
          </p>
        </div>
        <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 px-4 border border-white/10 text-right">
          <div className="text-[11px] text-slate-300 uppercase font-semibold">Tổng số lượt khám</div>
          <div className="text-2xl font-black text-white">{data.encounters.length}</div>
        </div>
      </div>

      {/* Timeline Section */}
      <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-2.5 sm:before:left-3.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-blue-200">
        {data.encounters.map((enc: UnifiedEncounter) => {
          const isExpanded = expandedEncounterId === enc.encounterId;

          return (
            <div key={enc.encounterId} className="relative group">
              {/* Timeline Bullet Node */}
              <div className="absolute -left-6 sm:-left-8 top-4 w-5 h-5 rounded-full bg-blue-600 border-4 border-white shadow-md text-white flex items-center justify-center">
                <div className="w-1.5 h-1.5 bg-white rounded-full" />
              </div>

              {/* Encounter Card */}
              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md transition-all overflow-hidden">
                {/* Main Summary Header */}
                <div
                  onClick={() => toggleExpand(enc.encounterId)}
                  className="p-5 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50 hover:bg-slate-50 transition"
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500">
                      <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-md font-mono text-[11px] border border-blue-100">
                        <FileText className="w-3 h-3" /> {enc.encounterCode}
                      </span>
                      <span className="inline-flex items-center gap-1 text-slate-600">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {new Date(enc.encounterDate).toLocaleDateString('vi-VN', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                        })}
                      </span>
                      <span className="inline-flex items-center gap-1 text-slate-600">
                        <Building2 className="w-3.5 h-3.5 text-slate-400" />
                        {enc.specialty}
                      </span>
                    </div>

                    <div className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <span>Lý do khám: {enc.chiefComplaint || 'Khám tổng quát'}</span>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-600">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span>Bác sĩ: <strong>{enc.doctor.title ? `${enc.doctor.title} ` : ''}{enc.doctor.name}</strong></span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 border-t sm:border-t-0 pt-3 sm:pt-0">
                    <div className="text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg border border-blue-200 transition flex items-center gap-1.5">
                      <span>{isExpanded ? 'Thu gọn' : 'Xem chi tiết'}</span>
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </div>
                </div>

                {/* Expanded Detailed Sections */}
                {isExpanded && (
                  <div className="p-5 border-t border-slate-100 space-y-6 bg-white animate-fadeIn">
                    {/* Clinical Summary */}
                    {enc.clinicalSummary && (
                      <div className="space-y-1.5">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                          <Stethoscope className="w-4 h-4 text-blue-600" /> Tóm tắt lâm sàng
                        </h4>
                        <p className="text-sm text-slate-700 bg-slate-50 p-3.5 rounded-xl border border-slate-100 leading-relaxed font-medium">
                          {enc.clinicalSummary}
                        </p>
                      </div>
                    )}

                    {/* Diagnoses Section */}
                    {enc.diagnoses && enc.diagnoses.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                          <FileText className="w-4 h-4 text-indigo-600" /> Chẩn đoán y khoa (ICD-10)
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {enc.diagnoses.map((diag, idx) => (
                            <div
                              key={idx}
                              className={`p-3 rounded-xl border flex items-center gap-3 text-xs ${diag.isPrimary
                                  ? 'bg-indigo-50/70 border-indigo-200 text-indigo-900 font-medium'
                                  : 'bg-slate-50 border-slate-200 text-slate-700'
                                }`}
                            >
                              <span className="font-mono font-bold bg-white px-2 py-0.5 rounded border border-indigo-200 text-indigo-700">
                                {diag.icdCode}
                              </span>
                              <span>{diag.diseaseName}</span>
                              {diag.isPrimary && (
                                <span className="bg-indigo-600 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">
                                  Chính
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Observations Section */}
                    {enc.observations && enc.observations.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                          <Activity className="w-4 h-4 text-emerald-600" /> Sinh hiệu & Chỉ số xét nghiệm
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          {enc.observations.map((obs, idx) => (
                            <div key={idx} className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                              <div className="text-[11px] text-slate-500 font-medium flex items-center justify-between">
                                <span>{obs.name}</span>
                                <span className="text-[10px] uppercase font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                                  {obs.category}
                                </span>
                              </div>
                              <div className="text-sm font-bold text-slate-900">
                                {obs.value} {obs.unit || ''}
                              </div>
                              {obs.interpretation && (
                                <div className="text-[11px] text-slate-600">Đánh giá: {obs.interpretation}</div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Prescription Section */}
                    {enc.prescription && (
                      <div className="space-y-2">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                          <Pill className="w-4 h-4 text-rose-600" /> Đơn thuốc & Hướng dẫn sử dụng
                        </h4>
                        <div className="bg-rose-50/40 rounded-xl border border-rose-100 p-4 space-y-3">
                          <div className="flex items-center justify-between text-xs text-rose-800 font-semibold border-b border-rose-200/60 pb-2">
                            <span>Mã đơn: {enc.prescription.prescriptionCode}</span>
                            <span>
                              Ngày kê:{' '}
                              {new Date(enc.prescription.prescribedAt).toLocaleDateString('vi-VN')}
                            </span>
                          </div>

                          {enc.prescription.note && (
                            <p className="text-xs italic text-slate-600">Ghi chú: {enc.prescription.note}</p>
                          )}

                          <div className="space-y-2">
                            {enc.prescription.items.map((item, idx) => (
                              <div key={idx} className="bg-white p-3 rounded-lg border border-rose-100 text-xs space-y-1">
                                <div className="flex items-center justify-between font-bold text-slate-800">
                                  <span>{idx + 1}. {item.drugName} ({item.dosage})</span>
                                  <span className="text-rose-700 font-mono">
                                    {item.quantity} {item.unit || 'viên'}
                                  </span>
                                </div>
                                <div className="text-slate-600 text-[11px] font-medium">
                                  Cách dùng: {item.usageInstruction} {item.duration ? `(${item.duration})` : ''}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
