'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Activity, Bell, CalendarCheck, CalendarRange, CheckCircle2, ChevronRight, Loader2, Stethoscope } from 'lucide-react';
import { doctorPortalService } from '@/services/doctor-portal.service';
import { DoctorAppointmentCard } from '@/components/doctor/DoctorAppointmentCard';

export default function DoctorDashboardPage() {
  const { data, isLoading, isError } = useQuery({ queryKey: ['doctor-dashboard'], queryFn: doctorPortalService.getDashboard });
  if (isLoading) return <div className="grid min-h-[50vh] place-items-center"><Loader2 className="h-8 w-8 animate-spin text-emerald-700" /></div>;
  if (isError || !data) return <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm font-semibold text-rose-800">Không thể tải tổng quan. Vui lòng kiểm tra liên kết hồ sơ bác sĩ hoặc thử lại.</div>;
  const stats = [
    { label: 'Lịch hẹn hôm nay', value: data.stats.totalToday, icon: CalendarCheck, color: 'text-sky-700 bg-sky-50' },
    { label: 'Đang chờ khám', value: data.stats.upcomingToday, icon: Activity, color: 'text-amber-700 bg-amber-50' },
    { label: 'Đã hoàn thành', value: data.stats.completedToday, icon: CheckCircle2, color: 'text-emerald-700 bg-emerald-50' },
    { label: 'Thông báo chưa đọc', value: data.stats.unreadNotifications, icon: Bell, color: 'text-violet-700 bg-violet-50' },
  ];
  return <div className="space-y-7">
    <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-[#083d30] to-[#12634e] p-7 text-white shadow-lg sm:p-9">
      <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center"><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-[#9cff7c]">{new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })}</p><h1 className="mt-3 text-3xl font-black tracking-tight">Xin chào, {data.doctor.title ? `${data.doctor.title} ` : ''}{data.doctor.fullName}</h1><p className="mt-2 max-w-2xl text-sm text-emerald-100">Theo dõi lịch trực và các lịch hẹn được phân công. Kết quả sàng lọc AI chỉ là thông tin tham khảo trước khám.</p></div><Link href="/doctor/lich-lam-viec" className="inline-flex items-center justify-center gap-2 self-start rounded-xl bg-[#66ff33] px-5 py-3 text-sm font-extrabold text-[#083d30]"><CalendarRange className="h-5 w-5" />Xem lịch làm việc</Link></div>
    </section>
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{stats.map(({ label, value, icon: Icon, color }) => <div key={label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p><p className="mt-2 text-3xl font-black text-slate-900">{value}</p></div><span className={`grid h-11 w-11 place-items-center rounded-2xl ${color}`}><Icon className="h-5 w-5" /></span></div></div>)}</section>
    <section className="grid gap-6 xl:grid-cols-[1fr_340px]">
      <div><div className="mb-4 flex items-center justify-between"><div><h2 className="text-xl font-black text-slate-900">Lịch hẹn sắp tới</h2><p className="text-xs text-slate-500">Các bệnh nhân thuộc phạm vi phân công của bác sĩ</p></div><Link href="/doctor/lich-hen" className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700">Xem tất cả<ChevronRight className="h-4 w-4" /></Link></div><div className="space-y-3">{data.nextAppointments.length ? data.nextAppointments.map((appointment) => <DoctorAppointmentCard key={appointment.id} appointment={appointment} />) : <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">Không có lịch hẹn sắp tới.</div>}</div></div>
      <aside className="space-y-4"><div className="rounded-2xl border border-slate-200 bg-white p-5"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-50 text-emerald-700"><Stethoscope className="h-5 w-5" /></span><div><p className="font-extrabold text-slate-900">Nơi công tác</p><p className="text-xs text-slate-500">{data.doctor.workPlaces.length} phân công đang hoạt động</p></div></div><div className="mt-4 space-y-3">{data.doctor.workPlaces.map((workplace) => <div key={workplace.id} className="rounded-xl bg-slate-50 p-3"><p className="text-sm font-bold text-slate-800">{workplace.hospital.name}</p><p className="mt-1 text-xs text-slate-500">{workplace.branch?.name || 'Cơ sở chính'} · {workplace.specialty.name}</p></div>)}</div></div></aside>
    </section>
  </div>;
}
