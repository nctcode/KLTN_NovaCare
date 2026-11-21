'use client';

import { AdminThemeProvider } from '@/components/admin/AdminThemeContext';
import { HospitalAdminGuard } from '@/components/hospital-admin/HospitalAdminGuard';
import { HospitalAdminSidebar } from '@/components/hospital-admin/HospitalAdminSidebar';

export default function HospitalAdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <HospitalAdminGuard>
      <AdminThemeProvider>
        <div className="flex min-h-screen bg-slate-100 dark:bg-slate-950">
          <HospitalAdminSidebar />
          <main className="min-w-0 flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">{children}</main>
        </div>
      </AdminThemeProvider>
    </HospitalAdminGuard>
  );
}
