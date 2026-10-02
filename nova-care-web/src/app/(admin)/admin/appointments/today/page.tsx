'use client';

import { AppointmentTab } from '@/components/admin/schedules/AppointmentTab';

export default function AdminAppointmentsTodayPage() {
  return (
    <div className="space-y-6">
      <AppointmentTab
        initialMode="today"
        pageTitle="Lịch Hẹn Hôm Nay"
        pageSubtitle="Theo dõi và quản lý danh sách bệnh nhân có lịch hẹn trong ngày hôm nay."
      />
    </div>
  );
}
