'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { addDays, endOfMonth, endOfWeek, format, startOfMonth, startOfWeek } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Building2, CalendarRange, Clock3, Loader2, MapPin } from 'lucide-react';
import { doctorPortalService } from '@/services/doctor-portal.service';
import { DoctorSlotView } from '@/types/doctor-portal.types';

type ViewMode = 'day' | 'week' | 'month';
const dayName = ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy'];

export default function DoctorSchedulePage() {
  const [view, setView] = useState<ViewMode>('week');
  const [anchor, setAnchor] = useState(format(new Date(), 'yyyy-MM-dd'));
  const range = useMemo(() => {
    const date = new Date(`${anchor}T00:00:00`);
    if (view === 'day') return { start: date, end: date };
    if (view === 'month') return { start: startOfMonth(date), end: endOfMonth(date) };
    return { start: startOfWeek(date, { weekStartsOn: 1 }), end: endOfWeek(date, { weekStartsOn: 1 }) };
  }, [anchor, view]);
  const startDate = format(range.start, 'yyyy-MM-dd');
  const endDate = format(range.end, 'yyyy-MM-dd');
  const { data, isLoading } = useQuery({ queryKey: ['doctor-schedules', startDate, endDate], queryFn: () => doctorPortalService.getSchedules(startDate, endDate) });
  const slotsByDate = useMemo(() => {
    const map = new Map<string, DoctorSlotView[]>();
    data?.slots.forEach((slot) => { const key = format(new Date(slot.startTime), 'yyyy-MM-dd'); map.set(key, [...(map.get(key) || []), slot]); });
    return map;
  }, [data]);
  const days = useMemo(() => { const result: Date[] = []; for (let d = range.start; d <= range.end; d = addDays(d, 1)) result.push(d); return result; }, [range]);
  return <div className="space-y-6"><div className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-6 sm:flex-row sm:items-center"><div><h1 className="flex items-center gap-2 text-2xl font-black"><CalendarRange className="h-6 w-6 text-emerald-700" />Lịch làm việc</h1><p className="mt-1 text-sm text-slate-500">Lịch chỉ đọc do cơ sở y tế hoặc quản trị viên thiết lập.</p></div><div className="flex flex-wrap gap-2"><input type="date" value={anchor} onChange={(event) => setAnchor(event.target.value)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold" />{(['day','week','month'] as ViewMode[]).map((item) => <button key={item} onClick={() => setView(item)} className={`rounded-xl px-4 py-2 text-xs font-bold ${view === item ? 'bg-[#083d30] text-white' : 'bg-slate-100 text-slate-600'}`}>{item === 'day' ? 'Ngày' : item === 'week' ? 'Tuần' : 'Tháng'}</button>)}</div></div>
    {isLoading ? <div className="grid min-h-60 place-items-center"><Loader2 className="h-8 w-8 animate-spin text-emerald-700" /></div> : <>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{data?.workplaces.map((workplace) => <div key={workplace.id} className="rounded-2xl border border-slate-200 bg-white p-5"><div className="flex items-start gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-50 text-emerald-700"><Building2 className="h-5 w-5" /></span><div><p className="font-extrabold">{workplace.hospital.name}</p><p className="mt-1 text-xs text-slate-500">{workplace.branch?.name || 'Cơ sở chính'} · {workplace.specialty.name}</p></div></div></div>)}</div>
      <div className={view === 'month' ? 'grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7' : 'grid gap-4 lg:grid-cols-2'}>{days.map((date) => { const key = format(date, 'yyyy-MM-dd'); const slots = slotsByDate.get(key) || []; const recurring = data?.recurringSchedules.filter((item) => item.dayOfWeek === date.getDay()) || []; return <section key={key} className="min-h-36 rounded-2xl border border-slate-200 bg-white p-4"><div className="border-b border-slate-100 pb-3"><p className="text-xs font-bold uppercase text-emerald-700">{dayName[date.getDay()]}</p><p className="text-sm font-extrabold">{format(date, 'dd/MM/yyyy')}</p></div><div className="mt-3 space-y-2">{slots.map((slot) => <div key={slot.id} className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-3"><p className="flex items-center gap-1.5 text-xs font-extrabold text-emerald-900"><Clock3 className="h-3.5 w-3.5" />{format(new Date(slot.startTime), 'HH:mm')}–{format(new Date(slot.endTime), 'HH:mm')}</p><p className="mt-1 flex items-center gap-1 text-[11px] text-slate-600"><MapPin className="h-3 w-3" />{slot.roomSession?.room.name || slot.doctorWorkplace.branch?.name || slot.doctorWorkplace.hospital.name}</p><p className="mt-1 text-[11px] font-semibold text-slate-500">{slot._count?.primaryAppointments || slot.bookedCount}/{slot.capacity} lịch hẹn</p></div>)}{!slots.length && recurring.map((schedule) => <div key={schedule.id} className="rounded-xl border border-dashed border-slate-200 p-3"><p className="text-xs font-bold text-slate-700">{schedule.startTime}–{schedule.endTime}</p><p className="mt-1 text-[11px] text-slate-500">Ca định kỳ · {schedule.doctorWorkplace.hospital.name}</p></div>)}{!slots.length && !recurring.length && <p className="py-3 text-center text-xs text-slate-400">Không có ca trực</p>}</div></section>; })}</div>
      <p className="text-xs text-slate-500">Khoảng hiển thị: {format(range.start, 'dd/MM/yyyy', { locale: vi })} – {format(range.end, 'dd/MM/yyyy', { locale: vi })}</p>
    </>}
  </div>;
}
