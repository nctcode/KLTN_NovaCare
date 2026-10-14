'use client';

import { use, useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { io } from 'socket.io-client';
import { useAuthStore } from '@/stores/auth.store';
import { consultationService, consultationStatus, ConsultationMessage, VideoAccess } from '@/services/consultation.service';
import { ConsultationVideoRoom } from '@/components/features/ConsultationVideoRoom';

export default function ConsultationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const user = useAuthStore(s => s.user);
  const token = useAuthStore(s => s.accessToken);
  const cache = useQueryClient();
  const query = useQuery({ queryKey: ['consultation', id, user?.id], queryFn: () => consultationService.detail(id), enabled: !!user?.id });
  const session = query.data?.data;
  const [access, setAccess] = useState<VideoAccess | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [draft, setDraft] = useState('');
  const [messages, setMessages] = useState<ConsultationMessage[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [realtime, setRealtime] = useState(false);
  const sendId = useRef<string | null>(null);
  const leave = useCallback(() => setAccess(null), []);
  const report = useCallback((e: unknown) => setError(isAxiosError(e) && typeof e.response?.data?.message === 'string'
    ? e.response.data.message : 'Không thể thực hiện thao tác. Vui lòng thử lại.'), []);
  const refreshMessages = useCallback(async () => {
    const result = await consultationService.messages(id);
    setMessages(old => Array.from(new Map([...old, ...result.data.items].map(m => [m.id, m])).values()).sort((a, b) => a.sentAt.localeCompare(b.sentAt)));
    setCursor(old => old ?? result.data.nextCursor);
  }, [id]);
  useEffect(() => {
    let active = true;
    consultationService.messages(id).then(result => {
      if (active) { setMessages(result.data.items); setCursor(result.data.nextCursor); }
    }).catch(report);
    const origin = (process.env.NEXT_PUBLIC_API_URL || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000')).replace(/\/api\/v1\/?$/, '');
    const socket = io(`${origin}/consultations`, { auth: { token }, transports: ['websocket', 'polling'] });
    socket.on('connect', () => { setRealtime(true); socket.emit('consultation.join', { consultationId: id });
      cache.invalidateQueries({ queryKey: ['consultation', id] }); refreshMessages().catch(report); });
    socket.on('disconnect', () => setRealtime(false));
    socket.on('connect_error', () => setRealtime(false));
    socket.on('consultation.status.changed', (updated: { status: string }) => {
      cache.invalidateQueries({ queryKey: ['consultation', id] });
      if (!['ACCEPTED', 'ACTIVE'].includes(updated.status)) leave();
    });
    socket.on('consultation.message.created', () => refreshMessages().catch(report));
    return () => { active = false; socket.disconnect(); };
  }, [id, token, cache, refreshMessages, report, leave]);
  useEffect(() => {
    if (!access) return;
    const timeout = setTimeout(leave, Math.max(0, Date.parse(access.endsAt) - Date.now()));
    return () => clearTimeout(timeout);
  }, [access, leave]);
  async function perform(action: () => Promise<unknown>) {
    if (busy) return;
    setBusy(true); setError('');
    try { await action(); await query.refetch(); } catch (e) { report(e); } finally { setBusy(false); }
  }
  const isDoctor = session?.doctor.userId === user?.id;
  return <section className="space-y-4">
    <Link href="/tu-van" className="text-emerald-800">← Cuộc tư vấn</Link>
    <h1 className="text-2xl font-bold text-emerald-900">Phòng tư vấn NovaCare</h1>
    {query.isPending && <p>Đang tải…</p>}
    {query.isError && <button onClick={() => query.refetch()}>Không tải được phiên. Thử lại</button>}
    {session && <>
      <div className="rounded-2xl border bg-white p-5">
        <h2 className="font-bold">{session.doctor.fullName} · {session.doctorWorkplace.specialty.name}</h2>
        <p>Người bệnh: {session.patientProfile.fullName}</p>
        <p>{new Date(session.scheduledStartAt).toLocaleString('vi-VN')} · {consultationStatus[session.status]}</p>
        <p className="mt-3 font-semibold">{session.topic}</p><p className="whitespace-pre-wrap">{session.description}</p>
      </div>
      <p className="rounded-xl bg-emerald-50 p-3 text-emerald-900">Trong trường hợp khẩn cấp, gọi 115 hoặc đến cơ sở y tế gần nhất. Cuộc gọi không được ghi hình.</p>
      <div className="flex flex-wrap gap-3">
        {isDoctor && ['SCHEDULED', 'WAITING', 'ACCEPTED', 'ACTIVE'].includes(session.status) &&
          <button disabled={busy} className="rounded-xl bg-emerald-800 p-3 text-white" onClick={() => {
            const action = session.status === 'ACTIVE' ? 'complete' : session.status === 'ACCEPTED' ? 'start' : 'accept';
            if (action !== 'complete' || window.confirm('Kết thúc phiên tư vấn và đóng phòng video?')) perform(() => consultationService.transition(id, action));
          }}>{session.status === 'ACTIVE' ? 'Hoàn thành tư vấn' : session.status === 'ACCEPTED' ? 'Bắt đầu tư vấn' : 'Tiếp nhận phiên'}</button>}
        {session.videoEnabled && ['ACCEPTED', 'ACTIVE'].includes(session.status) && !access &&
          <button disabled={busy} className="rounded-xl bg-emerald-600 p-3 text-white" onClick={() => perform(async () => {
            const result = await consultationService.join(id); setAccess(result.data);
          })}>Tham gia video</button>}
      </div>
      {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-red-800">{error}</p>}
      {access && ['ACCEPTED', 'ACTIVE'].includes(session.status) && <ConsultationVideoRoom access={access} leave={leave} onError={setError} />}
      <div className="space-y-3 rounded-2xl border bg-white p-4">
        <h2 className="font-bold">Tin nhắn của phiên tư vấn</h2>
        {!realtime && <p role="status">Đang kết nối lại chat. <button onClick={() => refreshMessages().catch(report)}>Tải lại tin nhắn</button></p>}
        {cursor && <button disabled={busy} onClick={() => perform(async () => {
          const result = await consultationService.messages(id, cursor); setCursor(result.data.nextCursor);
          setMessages(old => Array.from(new Map([...result.data.items, ...old].map(m => [m.id, m])).values()));
        })}>Xem tin cũ hơn</button>}
        <div className="max-h-80 space-y-3 overflow-y-auto" aria-live="polite">
          {messages.map(m => <div key={m.id} className={`rounded-xl p-3 ${m.senderUserId === user?.id ? 'ml-8 bg-emerald-50' : 'mr-8 bg-slate-50'}`}>
            <p className="text-xs text-slate-500">{m.senderType === 'DOCTOR' ? 'Bác sĩ' : 'Người bệnh'} · {new Date(m.sentAt).toLocaleTimeString('vi-VN')}</p>
            <p className="whitespace-pre-wrap break-words">{m.text}</p>
            {m.attachments?.map(a => <button key={a.id} className="block text-emerald-800 underline" onClick={async () => {
              try {
                const { apiClient } = await import('@/lib/api-client');
                const response = await apiClient.getClient().get(`/consultations/${id}/attachments/${a.id}`, { responseType: 'blob' });
                const url = URL.createObjectURL(response.data); const link = document.createElement('a'); link.href = url; link.download = a.fileName; link.click(); setTimeout(() => URL.revokeObjectURL(url), 10000);
              } catch (e) { report(e); }
            }}>{a.fileName}</button>)}
          </div>)}
        </div>
        {['ACCEPTED', 'ACTIVE'].includes(session.status) ? <form className="flex gap-2" onSubmit={e => {
          e.preventDefault(); if (!draft.trim()) return;
          sendId.current ??= crypto.randomUUID();
          perform(async () => { await consultationService.send(id, draft.trim(), sendId.current!); setDraft(''); sendId.current = null; await refreshMessages(); });
        }}>
          <textarea aria-label="Tin nhắn" value={draft} disabled={busy} maxLength={4000} onChange={e => { setDraft(e.target.value); sendId.current = null; }} className="min-w-0 flex-1 rounded-xl border p-3" />
          <button disabled={busy || !draft.trim()} className="rounded-xl bg-emerald-800 px-4 text-white">Gửi</button>
        </form> : <p>Chat chưa mở hoặc phiên đã kết thúc. Bạn vẫn có thể xem lịch sử.</p>}
      </div>
    </>}
  </section>;
}
