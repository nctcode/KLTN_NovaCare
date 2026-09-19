'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { Calendar, CalendarCheck } from 'lucide-react';
import { DoctorScheduleTab } from '@/components/admin/schedules/DoctorScheduleTab';
import { Button } from '@/components/ui/button';

function AdminSchedulesContent() {
  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-emerald-600" />
            Quản lý Lịch làm việc định kỳ
          </h1>
        </div>

        {/* Quick Nav to Appointments */}
        <Button
          asChild
          variant="outline"
          size="sm"
          className="rounded-xl text-xs font-semibold border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900"
        >
          <Link href="/admin/appointments" className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
            <CalendarCheck className="w-4 h-4 text-emerald-600" />
            <span>Xem Quản lý lịch hẹn</span>
          </Link>
        </Button>
      </div>

      {/* Main Content: Doctor Schedules */}
      <DoctorScheduleTab />
    </div>
  );
}

export default function AdminSchedulesPage() {
  return (
    <Suspense fallback={<div className="p-8 text-xs text-slate-400">Đang tải lịch khám...</div>}>
      <AdminSchedulesContent />
    </Suspense>
  );
}

