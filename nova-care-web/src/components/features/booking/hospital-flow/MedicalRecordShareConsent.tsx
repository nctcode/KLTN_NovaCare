'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  FileText,
  Loader2,
  ShieldCheck,
  Share2,
  Building2,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { PatientProfile } from '@/types/profile.types';
import { ConsentSection, interoperabilityService, ShareableMedicalRecord } from '@/services/interoperability.service';

export interface HospitalShareItem {
  sourceHospitalId: string;
  sourceHospitalName: string;
  encounterIds: string[];
}

export interface MedicalRecordShareDraft {
  sourceHospitalId: string;
  sourceHospitalName: string;
  encounterIds: string[];
  allowedSections: ConsentSection[];
  expiresAt: string;
  hospitalShares?: HospitalShareItem[];
}

const SECTION_OPTIONS: { id: ConsentSection; label: string; description: string }[] = [
  { id: 'SUMMARY', label: 'Khám lâm sàng & Tóm tắt', description: 'Lý do khám, chuyên khoa và diễn biến' },
  { id: 'DIAGNOSES', label: 'Chẩn đoán', description: 'Chẩn đoán và mã bệnh đã công bố' },
  { id: 'OBSERVATIONS', label: 'Xét nghiệm & Cận lâm sàng', description: 'Chỉ số, xét nghiệm và quan sát' },
  { id: 'PRESCRIPTIONS', label: 'Đơn thuốc', description: 'Thuốc và hướng dẫn dùng thuốc' },
];

interface Props {
  patientProfile: PatientProfile | null;
  targetHospitalId: string;
  targetHospitalName: string;
  value: MedicalRecordShareDraft | null;
  onChange: (value: MedicalRecordShareDraft | null) => void;
}

export function MedicalRecordShareConsent({ patientProfile, targetHospitalId, targetHospitalName, value, onChange }: Props) {
  const [enabled, setEnabled] = useState(Boolean(value));
  const [records, setRecords] = useState<ShareableMedicalRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [encounterIds, setEncounterIds] = useState<string[]>(value?.encounterIds || []);
  const [sections, setSections] = useState<ConsentSection[]>(
    value?.allowedSections || ['SUMMARY', 'DIAGNOSES', 'OBSERVATIONS', 'PRESCRIPTIONS'],
  );
  const [validDays, setValidDays] = useState('7');
  const [accepted, setAccepted] = useState(Boolean(value));

  // Quản lý trạng thái mở/thu gọn nhóm từng bệnh viện (Accordion)
  const [expandedHospitals, setExpandedHospitals] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!enabled || !patientProfile?.id) return;
    let active = true;
    setIsLoading(true);
    setError(null);
    interoperabilityService
      .getShareableRecords(patientProfile.id, targetHospitalId)
      .then((data) => {
        if (active) {
          setRecords(data);
          if (!value && data.length > 0 && encounterIds.length === 0) {
            setEncounterIds([data[0].id]);
          }
        }
      })
      .catch((requestError: any) => {
        if (active) setError(requestError?.response?.data?.message || 'Không tải được hồ sơ có thể chia sẻ');
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [enabled, patientProfile?.id, targetHospitalId]);

  // Gom nhóm các lần khám theo bệnh viện (Lấy tối đa 3 bệnh viện gần nhất)
  const hospitalGroups = useMemo(() => {
    const map = new Map<string, { hospital: { id: string; name: string }; encounters: ShareableMedicalRecord[] }>();
    records.forEach((r) => {
      if (!map.has(r.hospital.id)) {
        map.set(r.hospital.id, { hospital: r.hospital, encounters: [] });
      }
      map.get(r.hospital.id)!.encounters.push(r);
    });
    // Lấy tối đa 3 cơ sở y tế gần nhất
    return [...map.values()].slice(0, 3);
  }, [records]);

  // Tự động mở sẵn bệnh viện có lần khám gần nhất khi tải dữ liệu xong
  useEffect(() => {
    if (hospitalGroups.length > 0) {
      setExpandedHospitals((prev) => {
        if (Object.keys(prev).length === 0) {
          return { [hospitalGroups[0].hospital.id]: true };
        }
        return prev;
      });
    }
  }, [hospitalGroups]);

  const toggleHospital = (hospId: string) => {
    setExpandedHospitals((prev) => ({
      ...prev,
      [hospId]: !prev[hospId],
    }));
  };

  const clearDraft = () => {
    setEnabled(false);
    setEncounterIds([]);
    setAccepted(false);
    onChange(null);
  };

  const toggleEncounter = (id: string) => {
    setEncounterIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
    setAccepted(false);
    onChange(null);
  };

  const toggleSection = (id: ConsentSection) => {
    setSections((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
    setAccepted(false);
    onChange(null);
  };

  const saveDraft = () => {
    const days = Number(validDays);
    if (!encounterIds.length || !sections.length || !accepted || !Number.isFinite(days) || days < 1) return;

    const selectedRecs = records.filter((r) => encounterIds.includes(r.id));
    const hospitalMap = new Map<string, { id: string; name: string; encounters: string[] }>();
    selectedRecs.forEach((r) => {
      if (!hospitalMap.has(r.hospital.id)) {
        hospitalMap.set(r.hospital.id, { id: r.hospital.id, name: r.hospital.name, encounters: [] });
      }
      hospitalMap.get(r.hospital.id)!.encounters.push(r.id);
    });

    const hospitalShares: HospitalShareItem[] = [...hospitalMap.values()].map((h) => ({
      sourceHospitalId: h.id,
      sourceHospitalName: h.name,
      encounterIds: h.encounters,
    }));

    const primaryShare = hospitalShares[0] || { sourceHospitalId: '', sourceHospitalName: '', encounterIds: [] };
    const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();

    onChange({
      sourceHospitalId: primaryShare.sourceHospitalId,
      sourceHospitalName: hospitalShares.map((h) => h.sourceHospitalName).join(', '),
      encounterIds,
      allowedSections: sections,
      expiresAt,
      hospitalShares,
    });
  };

  return (
    <section className="rounded-3xl border border-emerald-200 bg-emerald-50/50 p-5 space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-3">
          <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-700 text-white">
            <Share2 className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-black text-slate-950">Chia sẻ hồ sơ cho {targetHospitalName}</h3>
            <p className="mt-1 text-xs leading-relaxed text-slate-600">
              Tùy chọn. Bạn chọn chính xác lần khám, nhóm dữ liệu và thời hạn. Quyền có thể thu hồi trong Sổ sức khỏe điện tử.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => (enabled ? clearDraft() : setEnabled(true))}
          className={`rounded-xl px-3 py-2 text-xs font-bold ${
            enabled ? 'bg-slate-200 text-slate-700' : 'bg-emerald-700 text-white'
          }`}
        >
          {enabled ? 'Không chia sẻ' : 'Chọn hồ sơ chia sẻ'}
        </button>
      </div>

      {enabled && (
        <div className="space-y-4 border-t border-emerald-200 pt-4">
          {isLoading && (
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <Loader2 className="h-4 w-4 animate-spin" />
              Đang tải hồ sơ đã công bố…
            </div>
          )}

          {error && <p className="text-xs font-medium text-red-600">{error}</p>}

          {!isLoading && !error && records.length === 0 && (
            <p className="text-xs text-slate-600">Hồ sơ này chưa có bệnh án đã công bố tại cơ sở khác để chia sẻ.</p>
          )}

          {hospitalGroups.length > 0 && (
            <>
              {/* 1. GOM NHÓM THEO CÁC CƠ SỞ Y TẾ THỰC TẾ TRONG SỔ SỨC KHỎE */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-slate-800">
                    1. Chọn lần khám cần chia sẻ:
                  </p>
                </div>

                <div className="space-y-2">
                  {hospitalGroups.map((group) => {
                    const isExpanded = Boolean(expandedHospitals[group.hospital.id]);
                    const selectedCountInGroup = group.encounters.filter((e) => encounterIds.includes(e.id)).length;

                    return (
                      <div key={group.hospital.id} className="space-y-2">
                        {/* Thanh tiêu đề bệnh viện - Click để mở rộng / thu gọn */}
                        <button
                          type="button"
                          onClick={() => toggleHospital(group.hospital.id)}
                          className="flex items-center justify-between w-full p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition text-left cursor-pointer"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4 text-emerald-700 shrink-0" />
                            ) : (
                              <ChevronRight className="h-4 w-4 text-slate-400 shrink-0" />
                            )}
                            <Building2 className="h-4 w-4 text-emerald-700 shrink-0" />
                            <span className="font-bold text-slate-900 text-xs truncate">
                              {group.hospital.name}
                            </span>
                            <span className="text-[11px] text-slate-500 shrink-0">
                              ({group.encounters.length} lần khám)
                            </span>
                          </div>

                          {selectedCountInGroup > 0 && (
                            <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 shrink-0">
                              Đã chọn {selectedCountInGroup}
                            </span>
                          )}
                        </button>

                        {/* Danh sách các lần khám của bệnh viện này khi mở rộng */}
                        {isExpanded && (
                          <div className="space-y-2 pl-3 sm:pl-4 border-l-2 border-emerald-200 my-1">
                            {group.encounters.map((record) => (
                              <label
                                key={record.id}
                                className="flex cursor-pointer gap-3 rounded-2xl border border-slate-200 bg-white p-3 text-xs"
                              >
                                <input
                                  type="checkbox"
                                  checked={encounterIds.includes(record.id)}
                                  onChange={() => toggleEncounter(record.id)}
                                  className="mt-1 h-4 w-4 accent-emerald-700 shrink-0"
                                />
                                <FileText className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />
                                <span className="flex-1 min-w-0">
                                  <strong className="block text-slate-900">
                                    {new Date(record.encounterDate).toLocaleDateString('vi-VN')} · Khoa {record.specialtyName}
                                    {record.doctorName ? ` · BS: ${record.doctorName}` : ''}
                                  </strong>
                                  <span className="text-slate-500 block mt-0.5">
                                    {record.diagnoses?.[0]
                                      ? `Chẩn đoán: ${record.diagnoses[0].diseaseName} (${record.diagnoses[0].icdCode}) · `
                                      : ''}
                                    {record.clinicalSummary || record.chiefComplaint || `Mã hồ sơ ${record.encounterCode}`}
                                  </span>
                                </span>
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 2. NHÓM DỮ LIỆU ĐƯỢC PHÉP XEM */}
              <div className="space-y-2">
                <p className="text-xs font-bold text-slate-800">2. Nhóm dữ liệu được phép xem</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {SECTION_OPTIONS.map((section) => (
                    <label
                      key={section.id}
                      className="flex cursor-pointer gap-2 rounded-xl border border-slate-200 bg-white p-3 text-xs"
                    >
                      <input
                        type="checkbox"
                        checked={sections.includes(section.id)}
                        onChange={() => toggleSection(section.id)}
                        className="mt-0.5 accent-emerald-700"
                      />
                      <span>
                        <strong className="block text-slate-900">{section.label}</strong>
                        <span className="text-slate-500">{section.description}</span>
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* 3. THỜI HẠN & XÁC NHẬN */}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                <label className="block text-xs font-bold text-slate-800">
                  Thời hạn (ngày)
                  <input
                    type="number"
                    min="1"
                    max="365"
                    value={validDays}
                    onChange={(event) => {
                      setValidDays(event.target.value);
                      setAccepted(false);
                      onChange(null);
                    }}
                    className="mt-1 block h-10 w-28 rounded-xl border border-slate-300 bg-white px-3 text-sm"
                  />
                </label>

                <label className="flex flex-1 cursor-pointer gap-2 rounded-xl bg-white p-3 text-xs text-slate-700">
                  <input
                    type="checkbox"
                    checked={accepted}
                    onChange={(event) => {
                      setAccepted(event.target.checked);
                      if (!event.target.checked) onChange(null);
                    }}
                    className="mt-0.5 accent-emerald-700"
                  />
                  <span>
                    Tôi xác nhận cho <strong>{targetHospitalName}</strong> truy xuất đúng phạm vi đã chọn để phục vụ lần khám này.
                  </span>
                </label>
              </div>

              <button
                type="button"
                onClick={saveDraft}
                disabled={!encounterIds.length || !sections.length || !accepted}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-xs font-bold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                <ShieldCheck className="h-4 w-4" />
                Xác nhận phạm vi chia sẻ
              </button>
            </>
          )}

          {value && (
            <div className="flex items-center gap-2 rounded-xl bg-emerald-100 p-3 text-xs font-bold text-emerald-900">
              <CheckCircle2 className="h-4 w-4" />
              Đã chọn {value.encounterIds.length} hồ sơ từ {value.sourceHospitalName}; quyền có hiệu lực đến{' '}
              {new Date(value.expiresAt).toLocaleDateString('vi-VN')}.
            </div>
          )}
        </div>
      )}
    </section>
  );
}
