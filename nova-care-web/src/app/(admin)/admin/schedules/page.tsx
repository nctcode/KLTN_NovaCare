'use client';

import { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Calendar, CalendarCheck, Clock, Zap } from 'lucide-react';
import { DailySlotsTab } from '@/components/admin/schedules/DailySlotsTab';
import { DoctorScheduleTab } from '@/components/admin/schedules/DoctorScheduleTab';
import { Button } from '@/components/ui/button';
import { useAdminTheme } from '@/components/admin/AdminThemeContext';

function AdminSchedulesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { theme } = useAdminTheme();
  const isLight = theme === 'light';

  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState<'slots' | 'recurring'>(
    tabParam === 'recurring' ? 'recurring' : 'slots'
  );

  const handleTabChange = (tab: 'slots' | 'recurring') => {
    setActiveTab(tab);
    router.push(`/admin/schedules?tab=${tab}`);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-emerald-600" />
            Quản lý Lịch khám hệ thống
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Điều phối khung giờ khám thực tế và cấu hình lịch làm việc định kỳ của bác sĩ.
          </p>
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

      {/* Medpro Dual Tab Switcher */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className={`p-1 rounded-xl border flex items-center gap-1 ${isLight ? 'bg-slate-100 border-slate-200' : 'bg-slate-900 border-slate-800'
          }`}>
          <button
            onClick={() => handleTabChange('slots')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition ${activeTab === 'slots'
                ? isLight
                  ? 'bg-white text-emerald-700 shadow-xs'
                  : 'bg-slate-800 text-emerald-400 shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
          >
            <Clock className="w-4 h-4 text-amber-500" />
            <span>Khung giờ khám theo ngày</span>
          </button>

          <button
            onClick={() => handleTabChange('recurring')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition ${activeTab === 'recurring'
                ? isLight
                  ? 'bg-white text-emerald-700 shadow-xs'
                  : 'bg-slate-800 text-emerald-400 shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
          >
            <Calendar className="w-4 h-4 text-emerald-600" />
            <span>Lịch làm việc định kỳ (Lịch khung)</span>
          </button>
        </div>
      </div>

      {/* Tab Contents */}
      {activeTab === 'slots' ? <DailySlotsTab /> : <DoctorScheduleTab />}
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
