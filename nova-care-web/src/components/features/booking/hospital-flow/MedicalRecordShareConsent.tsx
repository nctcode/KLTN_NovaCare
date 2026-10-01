'use client';

import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, FileText, Loader2, ShieldCheck, Share2 } from 'lucide-react';
import { PatientProfile } from '@/types/profile.types';
import { ConsentSection, interoperabilityService, ShareableMedicalRecord } from '@/services/interoperability.service';

export interface MedicalRecordShareDraft {
  sourceHospitalId: string;
  sourceHospitalName: string;
  encounterIds: string[];
  allowedSections: ConsentSection[];
  expiresAt: string;
}

const SECTION_OPTIONS: { id: ConsentSection; label: string; description: string }[] = [
  { id: 'SUMMARY', label: 'Tóm tắt khám', description: 'Lý do khám, chuyên khoa và diễn biến' },
  { id: 'DIAGNOSES', label: 'Chẩn đoán', description: 'Chẩn đoán và mã bệnh đã công bố' },
  { id: 'OBSERVATIONS', label: 'Kết quả theo dõi', description: 'Chỉ số, xét nghiệm và quan sát' },
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
  const [sourceHospitalId, setSourceHospitalId] = useState(value?.sourceHospitalId || '');
  const [encounterIds, setEncounterIds] = useState<string[]>(value?.encounterIds || []);
  const [sections, setSections] = useState<ConsentSection[]>(value?.allowedSections || ['SUMMARY', 'DIAGNOSES']);
  const [validDays, setValidDays] = useState('30');
  const [accepted, setAccepted] = useState(Boolean(value));

  useEffect(() => {
    if (!enabled || !patientProfile?.id) return;
    let active = true;
    setIsLoading(true);
    setError(null);
    interoperabilityService.getShareableRecords(patientProfile.id, targetHospitalId)
      .then((data) => active && setRecords(data))
      .catch((requestError: any) => active && setError(requestError?.response?.data?.message || 'Không tải được hồ sơ có thể chia sẻ'))
      .finally(() => active && setIsLoading(false));
    return () => { active = false; };
  }, [enabled, patientProfile?.id, targetHospitalId]);

  const hospitals = useMemo(() => {
    const map = new Map<string, string>();
    records.forEach((record) => map.set(record.hospital.id, record.hospital.name));
    return [...map.entries()].map(([id, name]) => ({ id, name }));
  }, [records]);
  const selectedRecords = records.filter((record) => record.hospital.id === sourceHospitalId);

  const clearDraft = () => {
    setEnabled(false); setSourceHospitalId(''); setEncounterIds([]); setAccepted(false); onChange(null);
  };
  const updateSource = (id: string) => { setSourceHospitalId(id); setEncounterIds([]); setAccepted(false); onChange(null); };
  const toggleEncounter = (id: string) => {
    setEncounterIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
    setAccepted(false); onChange(null);
  };
  const toggleSection = (id: ConsentSection) => {
    setSections((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
    setAccepted(false); onChange(null);
  };
  const saveDraft = () => {
    const source = hospitals.find((hospital) => hospital.id === sourceHospitalId);
    const days = Number(validDays);
    if (!source || !encounterIds.length || !sections.length || !accepted || !Number.isFinite(days) || days < 1) return;
    const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
    onChange({ sourceHospitalId, sourceHospitalName: source.name, encounterIds, allowedSections: sections, expiresAt });
  };

  return (
    <section className="rounded-3xl border border-emerald-200 bg-emerald-50/50 p-5 space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-3">
          <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-700 text-white"><Share2 className="h-5 w-5" /></div>
          <div>
            <h3 className="font-black text-slate-950">Chia sẻ hồ sơ cho {targetHospitalName}</h3>
            <p className="mt-1 text-xs leading-relaxed text-slate-600">Tùy chọn. Bạn chọn chính xác lần khám, nhóm dữ liệu và thời hạn. Quyền có thể thu hồi trong Sổ sức khỏe điện tử.</p>
          </div>
        </div>
        <button type="button" onClick={() => enabled ? clearDraft() : setEnabled(true)} className={`rounded-xl px-3 py-2 text-xs font-bold ${enabled ? 'bg-slate-200 text-slate-700' : 'bg-emerald-700 text-white'}`}>
          {enabled ? 'Không chia sẻ' : 'Chọn hồ sơ chia sẻ'}
        </button>
      </div>

      {enabled && (
        <div className="space-y-4 border-t border-emerald-200 pt-4">
          {isLoading && <div className="flex items-center gap-2 text-xs text-slate-600"><Loader2 className="h-4 w-4 animate-spin" />Đang tải hồ sơ đã công bố…</div>}
          {error && <p className="text-xs font-medium text-red-600">{error}</p>}
          {!isLoading && !error && records.length === 0 && <p className="text-xs text-slate-600">Hồ sơ này chưa có bệnh án đã công bố tại cơ sở khác để chia sẻ.</p>}
          {records.length > 0 && <>
            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-800">1. Chọn cơ sở lưu hồ sơ nguồn</p>
              <div className="flex flex-wrap gap-2">{hospitals.map((hospital) => <button key={hospital.id} type="button" onClick={() => updateSource(hospital.id)} className={`rounded-xl border px-3 py-2 text-xs font-bold ${sourceHospitalId === hospital.id ? 'border-emerald-700 bg-emerald-700 text-white' : 'border-slate-200 bg-white text-slate-700'}`}>{hospital.name}</button>)}</div>
            </div>
            {sourceHospitalId && <div className="space-y-2">
              <p className="text-xs font-bold text-slate-800">2. Chọn lần khám cần chia sẻ</p>
              <div className="space-y-2">{selectedRecords.map((record) => <label key={record.id} className="flex cursor-pointer gap-3 rounded-2xl border border-slate-200 bg-white p-3 text-xs"><input type="checkbox" checked={encounterIds.includes(record.id)} onChange={() => toggleEncounter(record.id)} className="mt-1 h-4 w-4 accent-emerald-700" /><FileText className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" /><span><strong className="block text-slate-900">{new Date(record.encounterDate).toLocaleDateString('vi-VN')} · {record.specialtyName}</strong><span className="text-slate-500">{record.clinicalSummary || `Mã hồ sơ ${record.encounterCode}`}</span></span></label>)}</div>
            </div>}
            {sourceHospitalId && <div className="space-y-2"><p className="text-xs font-bold text-slate-800">3. Nhóm dữ liệu được phép xem</p><div className="grid gap-2 sm:grid-cols-2">{SECTION_OPTIONS.map((section) => <label key={section.id} className="flex cursor-pointer gap-2 rounded-xl border border-slate-200 bg-white p-3 text-xs"><input type="checkbox" checked={sections.includes(section.id)} onChange={() => toggleSection(section.id)} className="mt-0.5 accent-emerald-700" /><span><strong className="block text-slate-900">{section.label}</strong><span className="text-slate-500">{section.description}</span></span></label>)}</div></div>}
            {sourceHospitalId && <div className="flex flex-col gap-3 sm:flex-row sm:items-end"><label className="block text-xs font-bold text-slate-800">Thời hạn (ngày)<input type="number" min="1" max="365" value={validDays} onChange={(event) => { setValidDays(event.target.value); setAccepted(false); onChange(null); }} className="mt-1 block h-10 w-28 rounded-xl border border-slate-300 bg-white px-3 text-sm" /></label><label className="flex flex-1 cursor-pointer gap-2 rounded-xl bg-white p-3 text-xs text-slate-700"><input type="checkbox" checked={accepted} onChange={(event) => { setAccepted(event.target.checked); if (!event.target.checked) onChange(null); }} className="mt-0.5 accent-emerald-700" /><span>Tôi xác nhận cho <strong>{targetHospitalName}</strong> truy xuất đúng phạm vi đã chọn để phục vụ lần khám này.</span></label></div>}
            {sourceHospitalId && <button type="button" onClick={saveDraft} disabled={!encounterIds.length || !sections.length || !accepted} className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-xs font-bold text-white disabled:cursor-not-allowed disabled:bg-slate-300"><ShieldCheck className="h-4 w-4" />Xác nhận phạm vi chia sẻ</button>}
          </>}
          {value && <div className="flex items-center gap-2 rounded-xl bg-emerald-100 p-3 text-xs font-bold text-emerald-900"><CheckCircle2 className="h-4 w-4" />Đã chọn {value.encounterIds.length} hồ sơ từ {value.sourceHospitalName}; quyền có hiệu lực đến {new Date(value.expiresAt).toLocaleDateString('vi-VN')}.</div>}
        </div>
      )}
    </section>
  );
}
