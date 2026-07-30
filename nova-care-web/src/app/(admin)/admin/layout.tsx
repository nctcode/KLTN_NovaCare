import { AdminGuard } from '@/components/admin/AdminGuard';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminHeader } from '@/components/admin/AdminHeader';

export const metadata = {
  title: 'NovaCare Admin Portal - Quản trị Hệ thống',
  description: 'Trang quản trị hệ thống đặt lịch khám trực tuyến đa cơ sở NovaCare',
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminGuard>
      <div className="flex h-screen w-full bg-slate-900 text-slate-100 overflow-hidden">
        <AdminSidebar />
        <div className="flex flex-col flex-1 min-w-0 h-full overflow-hidden">
          <AdminHeader />
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-slate-900">
            {children}
          </main>
        </div>
      </div>
    </AdminGuard>
  );
}
