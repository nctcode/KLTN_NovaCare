'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { addDays, format } from 'date-fns';
import { CalendarDays, Loader2 } from 'lucide-react';
import { doctorPortalService } from '@/services/doctor-portal.service';
import { DoctorAppointmentCard } from '@/components/doctor/DoctorAppointmentCard';

const statuses = ['', 'CONFIRMED', 'PAID', 'COMPLETED', 'CANCELLED', 'NO_SHOW'];
const labels: Record<string, string> = { '': 'Tất cả', CONFIRMED: 'Đã xác nhận', PAID: 'Đã thanh toán', COMPLETED: 'Hoàn thành', CANCELLED: 'Đã hủy', NO_SHOW: 'Không đến' };

export default function DoctorAppointmentsPage() {
  const [startDate, setStartDate] = useState(format(addDays(new Date(), -7), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(addDays(new Date(), 30), 'yyyy-MM-dd'));
  const [status, setStatus] = useState('');
  const { data, isLoading, isError } = useQuery({ queryKey: ['doctor-appointments', startDate, endDate, status], queryFn: () => doctorPortalService.getAppointments({ startDate, endDate, status: status || undefined, limit: 100 }) });
  return <div className="space-y-6"><div className="rounded-2xl border border-slate-200 bg-white p-6"><h1 className="flex items-center gap-2 text-2xl font-black"><CalendarDays className="h-6 w-6 text-emerald-700" />Lịch hẹn bệnh nhân</h1><p className="mt-1 text-sm text-slate-500">Chỉ hiển thị lịch hẹn thuộc các nơi công tác được phân công cho tài khoản hiện tại.</p><div className="mt-5 flex flex-wrap gap-3"><label className="text-xs font-bold text-slate-600">Từ ngày<input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="mt-1 block rounded-xl border border-slate-200 px-3 py-2 text-sm" /></label><label className="text-xs font-bold text-slate-600">Đến ngày<input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="mt-1 block rounded-xl border border-slate-200 px-3 py-2 text-sm" /></label><label className="text-xs font-bold text-slate-600">Trạng thái<select value={status} onChange={(e) => setStatus(e.target.value)} className="mt-1 block rounded-xl border border-slate-200 px-3 py-2 text-sm">{statuses.map((item) => <option key={item} value={item}>{labels[item]}</option>)}</select></label></div></div>
    {isLoading ? <div className="grid min-h-60 place-items-center"><Loader2 className="h-8 w-8 animate-spin text-emerald-700" /></div> : isError ? <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-800">Không thể tải lịch hẹn.</div> : <div className="space-y-3"><p className="text-sm font-bold text-slate-600">{data?.total || 0} lịch hẹn</p>{data?.items.length ? data.items.map((appointment) => <DoctorAppointmentCard key={appointment.id} appointment={appointment} />) : <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center text-sm text-slate-500">Không có lịch hẹn phù hợp bộ lọc.</div>}</div>}
  </div>;
}
