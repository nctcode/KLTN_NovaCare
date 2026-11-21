'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Activity, ChevronDown, ChevronUp, HeartPulse, Image as ImageIcon, Loader2, Sparkles } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { appointmentService } from '@/services/appointment.service';
import type { AppointmentScreening, AppointmentScreeningMedia } from '@/types/appointment.types';

type Props = { appointmentId: string; enabled: boolean; isLight: boolean };

function textValue(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value : undefined;
}

const REGION_LABELS: Record<string, string> = {
  head: 'Đầu / Trán', eyes_nose: 'Mắt / Mũi / Tai', neck: 'Cổ / Vùng họng', nape: 'Gáy / Cổ sau',
  chest: 'Vùng ngực / Tim', abdomen_upper: 'Bụng trên', abdomen_lower: 'Bụng dưới',
  right_shoulder: 'Vai phải', left_shoulder: 'Vai trái', right_arm: 'Cánh tay phải', left_arm: 'Cánh tay trái',
  right_hand: 'Bàn tay phải', left_hand: 'Bàn tay trái', upper_back: 'Lưng trên / Vai sau', lower_back: 'Thắt lưng / Cột sống',
  glutes: 'Vùng mông / Hông', right_thigh: 'Đùi phải', left_thigh: 'Đùi trái', right_knee: 'Đầu gối phải',
  left_knee: 'Đầu gối trái', right_calf: 'Bắp chân phải', left_calf: 'Bắp chân trái', right_foot: 'Bàn chân phải', left_foot: 'Bàn chân trái',
};

function localizedRegions(value: unknown): string | undefined {
  if (!Array.isArray(value)) return undefined;
  const labels = value.filter((item): item is string => typeof item === 'string')
    .map((item) => REGION_LABELS[item] || item.replaceAll('_', ' '));
  return labels.length ? labels.join(', ') : undefined;
}

function riskLabel(value?: string): string | undefined {
  const labels: Record<string, string> = { MONITOR: 'Theo dõi', CONSULT: 'Nên khám bác sĩ', URGENT: 'Cần khám sớm', EMERGENCY: 'Khẩn cấp' };
  return value ? labels[value.toUpperCase()] || value : undefined;
}

function answerLabel(value?: string): string {
  const labels: Record<string, string> = { yes: 'Có', true: 'Có', no: 'Không', false: 'Không', unknown: 'Không chắc', unsure: 'Không chắc', none: 'Không có' };
  return value ? labels[value.trim().toLowerCase()] || value : 'Chưa trả lời';
}

function ProtectedScreeningImage({ media }: { media: AppointmentScreeningMedia }) {
  const [src, setSrc] = useState<string>();
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let objectUrl: string | undefined;
    let active = true;
    apiClient.getClient().get(media.fileUrl, { responseType: 'blob' })
      .then((response) => {
        if (!active) return;
        objectUrl = URL.createObjectURL(response.data);
        setSrc(objectUrl);
      })
      .catch(() => active && setFailed(true));
    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [media.fileUrl]);

  if (failed) return <div className="flex aspect-square items-center justify-center rounded-xl bg-slate-100 text-slate-400 dark:bg-slate-800"><ImageIcon className="h-5 w-5" /></div>;
  if (!src) return <div className="flex aspect-square items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-950/30"><Loader2 className="h-5 w-5 animate-spin text-emerald-600" /></div>;
  // Blob URL is created from an authenticated API response, so Next Image optimization cannot fetch it.
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt="Ảnh tổn thương do bệnh nhân cung cấp" className="aspect-square w-full rounded-xl object-cover" />;
}

function Detail({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return <div><div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</div><div className="whitespace-pre-wrap text-xs leading-5 text-slate-700 dark:text-slate-200">{value}</div></div>;
}

export function AiScreeningAppointmentCard({ appointmentId, enabled, isLight }: Props) {
  const [expanded, setExpanded] = useState(false);
  const { data, isLoading, isError } = useQuery<AppointmentScreening>({
    queryKey: ['appointment-screening', appointmentId],
    queryFn: () => appointmentService.getScreening(appointmentId),
    enabled,
    staleTime: 60_000,
  });

  if (!enabled) return null;
  const recommendation = data?.recommendations || {};
  const structured = data?.structuredData || {};
  const body = data?.bodyDiagramData || {};
  const ppg = structured.ppg && typeof structured.ppg === 'object' ? structured.ppg : {};
  const summary = textValue(recommendation.summary) || textValue(recommendation.decisionReason);
  const specialty = textValue(recommendation.recommendedSpecialtyName);
  const bpm = typeof ppg.bpm === 'number' ? `${ppg.bpm} nhịp/phút` : undefined;
  const regions = localizedRegions(body.regions) || localizedRegions(structured.regions);
  const screeningLevel = riskLabel(data?.riskLevel);
  const images = data?.media.filter((item) => item.type === 'SYMPTOM_IMAGE') || [];

  return (
    <section className={`overflow-hidden rounded-2xl border ${isLight ? 'border-emerald-200 bg-gradient-to-br from-emerald-50 to-white' : 'border-emerald-900 bg-gradient-to-br from-emerald-950/50 to-slate-950'}`}>
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm"><Sparkles className="h-5 w-5" /></div>
          <div className="min-w-0 flex-1"><div className="font-bold text-emerald-900 dark:text-emerald-100">Phiếu sàng lọc AI trước khám</div><div className="mt-0.5 text-[11px] text-emerald-700 dark:text-emerald-300">Thông tin bệnh nhân đã cung cấp, được đính kèm với lịch khám này</div></div>
          {isLoading && <Loader2 className="h-5 w-5 animate-spin text-emerald-600" />}
        </div>
        {isError && <div className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">Không thể tải phiếu sàng lọc. Vui lòng thử lại sau.</div>}
        {data && <>
          {summary && <p className="mt-3 text-xs leading-5 text-slate-700 dark:text-slate-200">{summary}</p>}
          <div className="mt-3 flex flex-wrap gap-2">
            {specialty && <span className="rounded-full border border-emerald-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">{specialty}</span>}
            {bpm && <span className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300"><HeartPulse className="h-3.5 w-3.5" />{bpm}</span>}
            {screeningLevel && <span className="inline-flex items-center gap-1 rounded-full border border-sky-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-sky-700 dark:border-sky-900 dark:bg-sky-950/40 dark:text-sky-300"><Activity className="h-3.5 w-3.5" />Mức sàng lọc: {screeningLevel}</span>}
          </div>
          <button type="button" onClick={() => setExpanded((value) => !value)} className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-emerald-700 hover:text-emerald-800 dark:text-emerald-300">{expanded ? 'Thu gọn phiếu' : 'Xem toàn bộ thông tin'}{expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}</button>
          {expanded && <div className="mt-3 space-y-4 border-t border-emerald-200 pt-4 dark:border-emerald-900">
            <Detail label="Triệu chứng bệnh nhân mô tả" value={data.symptoms} />
            <Detail label="Vùng cơ thể đã chọn" value={regions} />
            <Detail label="Lời kể đã xác nhận" value={data.voiceTranscript} />
            {!!data.questions.length && <div><div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">Câu hỏi sàng lọc</div><div className="space-y-2">{data.questions.map((item, index) => <div key={item.id} className="rounded-xl border border-emerald-100 bg-white/80 p-3 dark:border-emerald-900 dark:bg-slate-900/70"><div className="text-xs text-slate-600 dark:text-slate-300">{index + 1}. {item.question}</div><div className="mt-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300">{answerLabel(item.answer)}</div></div>)}</div></div>}
            {!!images.length && <div><div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">Ảnh tổn thương ({images.length})</div><div className="grid grid-cols-3 gap-2">{images.map((media) => <ProtectedScreeningImage key={media.id} media={media} />)}</div></div>}
            <div className="rounded-xl bg-amber-50 px-3 py-2 text-[11px] leading-4 text-amber-800 dark:bg-amber-950/30 dark:text-amber-200">Kết quả AI chỉ hỗ trợ định hướng chuyên khoa, không thay thế chẩn đoán và quyết định chuyên môn của bác sĩ.</div>
          </div>}
        </>}
      </div>
    </section>
  );
}
