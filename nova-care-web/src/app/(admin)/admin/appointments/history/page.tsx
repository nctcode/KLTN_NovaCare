'use client';

import { AppointmentTab } from '@/components/admin/schedules/AppointmentTab';

export default function AdminAppointmentsHistoryPage() {
  return (
    <div className="space-y-6">
      <AppointmentTab
        initialMode="history"
        pageTitle="Lịch Sử Khám Bệnh"
        pageSubtitle="Tra cứu và theo dõi các hồ sơ lịch khám đã hoàn thành hoặc kết thúc của người dùng."
      />
    </div>
  );
}
