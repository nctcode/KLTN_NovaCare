import Link from 'next/link';
import { CalendarClock, ChevronRight, MapPin, ShieldAlert, UserRound } from 'lucide-react';
import { DoctorAppointmentView } from '@/types/doctor-portal.types';

export const doctorStatusLabel: Record<string, string> = {
  PENDING: 'Chờ xác nhận', AWAITING_PAYMENT: 'Chờ thanh toán', CONFIRMED: 'Đã xác nhận', PAID: 'Đã thanh toán',
  COMPLETED: 'Đã hoàn thành', CANCELLED: 'Đã hủy', EXPIRED: 'Hết hạn', NO_SHOW: 'Không đến', FAILED: 'Thất bại', REFUNDED: 'Đã hoàn tiền',
};

export function DoctorAppointmentCard({ appointment }: { appointment: DoctorAppointmentView }) {
  const start = new Date(appointment.slot.startTime);
  const workplace = appointment.slot.doctorWorkplace;
  return (
    <Link href={`/doctor/lich-hen/${appointment.id}`} className="group block rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-800">{doctorStatusLabel[appointment.status] || appointment.status}</span>
            <span className="text-xs font-semibold text-slate-400">#{appointment.bookingCode}</span>
            {appointment.preExamSession?.riskLevel && <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-800"><ShieldAlert className="h-3.5 w-3.5" />AI: {appointment.preExamSession.riskLevel}</span>}
          </div>
          <div><h3 className="flex items-center gap-2 font-extrabold text-slate-900"><UserRound className="h-4 w-4 text-emerald-700" />{appointment.patientProfile.fullName}</h3><p className="mt-1 text-xs text-slate-500">{appointment.reason || appointment.medicalService?.name || 'Khám theo lịch hẹn'}</p></div>
          <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs font-medium text-slate-600">
            <span className="inline-flex items-center gap-1.5"><CalendarClock className="h-4 w-4 text-emerald-700" />{start.toLocaleDateString('vi-VN')} · {start.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
            <span className="inline-flex items-center gap-1.5"><MapPin className="h-4 w-4 text-emerald-700" />{workplace.branch?.name || workplace.hospital.name}{appointment.slot.roomSession?.room ? ` · ${appointment.slot.roomSession.room.name}` : ''}</span>
          </div>
        </div>
        <ChevronRight className="mt-1 h-5 w-5 shrink-0 text-slate-300 transition group-hover:translate-x-1 group-hover:text-emerald-600" />
      </div>
    </Link>
  );
}
