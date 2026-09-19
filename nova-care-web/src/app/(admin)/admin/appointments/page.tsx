'use client';

import Link from 'next/link';
import { Calendar, CalendarCheck } from 'lucide-react';
import { AppointmentTab } from '@/components/admin/schedules/AppointmentTab';
import { Button } from '@/components/ui/button';

export default function AdminAppointmentsPage() {
  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <CalendarCheck className="w-5 h-5 text-emerald-600" />
            Quản lý lịch hẹn
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Theo dõi danh sách và trạng thái các lịch hẹn khám trên toàn hệ thống.
          </p>
        </div>

        <Button
          asChild
          variant="outline"
          size="sm"
          className="rounded-xl text-xs font-semibold border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900"
        >
          <Link href="/admin/schedules" className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
            <Calendar className="w-4 h-4 text-emerald-600" />
            <span>Xem Quản lý lịch khám (Bác sĩ)</span>
          </Link>
        </Button>
      </div>

      {/* Appointment Monitoring Grid & Details */}
      <AppointmentTab />
    </div>
  );
}
