'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAdminTheme } from '@/components/admin/AdminThemeContext';
import { Calendar, CalendarCheck } from 'lucide-react';
import { DoctorScheduleTab } from '@/components/admin/schedules/DoctorScheduleTab';
import { AppointmentTab } from '@/components/admin/schedules/AppointmentTab';

export default function AdminSchedulesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { theme } = useAdminTheme();
  const isLight = theme === 'light';

  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState<'schedules' | 'appointments'>(
    tabParam === 'appointments' ? 'appointments' : 'schedules'
  );

  useEffect(() => {
    if (tabParam === 'appointments' || tabParam === 'schedules') {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  const handleTabChange = (tab: 'schedules' | 'appointments') => {
    setActiveTab(tab);
    router.push(`/admin/appointments?tab=${tab}`);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className={`text-xl font-black flex items-center gap-2.5 ${isLight ? 'text-slate-900' : 'text-white'}`}>
            <CalendarCheck className="w-6 h-6 text-[#0c4b39] dark:text-[#66FF33]" />
            Quản Lý Lịch Hệ Thống
          </h1>
          <p className={`text-xs mt-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
            Quản lý cấu hình lịch làm việc bác sĩ và theo dõi toàn bộ danh sách lịch hẹn khám NovaCare.
          </p>
        </div>

        {/* Dual Tab Switcher */}
        <div className={`flex p-1 rounded-2xl border ${isLight ? 'bg-slate-100 border-slate-300' : 'bg-slate-900 border-slate-800'}`}>
          <button
            onClick={() => handleTabChange('schedules')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition ${
              activeTab === 'schedules'
                ? isLight
                  ? 'bg-white text-[#0c4b39] shadow-sm'
                  : 'bg-emerald-600 text-white shadow-sm'
                : isLight
                ? 'text-slate-600 hover:text-slate-900'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Calendar className="w-4 h-4" />
            Lịch làm việc
          </button>

          <button
            onClick={() => handleTabChange('appointments')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition ${
              activeTab === 'appointments'
                ? isLight
                  ? 'bg-white text-[#0c4b39] shadow-sm'
                  : 'bg-emerald-600 text-white shadow-sm'
                : isLight
                ? 'text-slate-600 hover:text-slate-900'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <CalendarCheck className="w-4 h-4" />
            Lịch khám
          </button>
        </div>
      </div>

      {/* Tab Contents */}
      {activeTab === 'schedules' ? <DoctorScheduleTab /> : <AppointmentTab />}
    </div>
  );
}
