'use client';

import { AdminGuard } from '@/components/admin/AdminGuard';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { AdminThemeProvider, useAdminTheme } from '@/components/admin/AdminThemeContext';

function AdminLayoutContent({ children }: { children: React.ReactNode }) {
  const { theme } = useAdminTheme();
  const isLight = theme === 'light';

  return (
    <div className={`flex h-screen w-full overflow-hidden transition-colors duration-200 ${isLight ? 'bg-slate-100 text-slate-900' : 'bg-slate-950 text-slate-100'}`}>
      <AdminSidebar />
      <div className="flex flex-col flex-1 min-w-0 h-full overflow-hidden">
        <AdminHeader />
        <main className={`flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 transition-colors duration-200 ${isLight ? 'bg-slate-100' : 'bg-slate-950'}`}>
          {children}
        </main>
      </div>
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminGuard>
      <AdminThemeProvider>
        <AdminLayoutContent>{children}</AdminLayoutContent>
      </AdminThemeProvider>
    </AdminGuard>
  );
}
