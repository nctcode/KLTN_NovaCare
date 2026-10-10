'use client';

import React from 'react';
import { HospitalAdminGuard } from '@/components/hospital-admin/HospitalAdminGuard';
import { HospitalAdminSidebar } from '@/components/hospital-admin/HospitalAdminSidebar';
import { HospitalAdminHeader } from '@/components/hospital-admin/HospitalAdminHeader';

export default function HospitalAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <HospitalAdminGuard>
      <div className="flex h-screen w-full overflow-hidden bg-slate-100 text-slate-900">
        <HospitalAdminSidebar />
        <div className="flex flex-col flex-1 min-w-0 h-full overflow-hidden">
          <HospitalAdminHeader />
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-slate-100 text-slate-900">
            {children}
          </main>
        </div>
      </div>
    </HospitalAdminGuard>
  );
}
