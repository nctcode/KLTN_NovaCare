'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Bell, CheckCheck, Loader2 } from 'lucide-react';
import { notificationService } from '@/services/notification.service';

export default function DoctorNotificationsPage() {
  const client = useQueryClient();
  const [unreadOnly, setUnreadOnly] = useState(false);
  const { data = [], isLoading } = useQuery({ queryKey: ['doctor-notifications'], queryFn: notificationService.getAll });
  const markOne = useMutation({ mutationFn: notificationService.markAsRead, onSuccess: () => client.invalidateQueries({ queryKey: ['doctor-notifications'] }) });
  const markAll = useMutation({ mutationFn: notificationService.markAllAsRead, onSuccess: () => client.invalidateQueries({ queryKey: ['doctor-notifications'] }) });
  const filtered = unreadOnly ? data.filter((item) => !item.isRead) : data;
  const unread = data.filter((item) => !item.isRead).length;
  return <div className="space-y-6"><div className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-6 sm:flex-row sm:items-center"><div><h1 className="flex items-center gap-2 text-2xl font-black"><Bell className="h-6 w-6 text-emerald-700" />Thông báo</h1><p className="mt-1 text-sm text-slate-500">Thông báo hệ thống và nhắc việc dành cho tài khoản bác sĩ.</p></div>{unread > 0 && <button onClick={() => markAll.mutate()} className="inline-flex items-center gap-2 self-start rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700"><CheckCheck className="h-4 w-4" />Đọc tất cả</button>}</div><div className="flex gap-2"><button onClick={() => setUnreadOnly(false)} className={`rounded-xl px-4 py-2 text-xs font-bold ${!unreadOnly ? 'bg-[#083d30] text-white' : 'bg-white text-slate-600'}`}>Tất cả ({data.length})</button><button onClick={() => setUnreadOnly(true)} className={`rounded-xl px-4 py-2 text-xs font-bold ${unreadOnly ? 'bg-[#083d30] text-white' : 'bg-white text-slate-600'}`}>Chưa đọc ({unread})</button></div>{isLoading ? <div className="grid min-h-48 place-items-center"><Loader2 className="h-8 w-8 animate-spin text-emerald-700" /></div> : <div className="space-y-3">{filtered.map((item) => <button key={item.id} onClick={() => !item.isRead && markOne.mutate(item.id)} className={`w-full rounded-2xl border p-5 text-left ${item.isRead ? 'border-slate-200 bg-white' : 'border-emerald-300 bg-emerald-50/50'}`}><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-extrabold text-slate-900">{item.title}</p><p className="mt-1 text-xs leading-5 text-slate-600">{item.content}</p><p className="mt-2 text-[11px] font-semibold text-slate-400">{new Date(item.createdAt).toLocaleString('vi-VN')}</p></div>{!item.isRead && <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-emerald-500" />}</div></button>)}{!filtered.length && <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center text-sm text-slate-500">Không có thông báo phù hợp.</div>}</div>}</div>;
}
