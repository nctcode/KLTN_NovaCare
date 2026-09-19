'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAdminTheme } from './AdminThemeContext';
import {
  LayoutDashboard,
  Users,
  UserCheck,
  Building2,
  Stethoscope,
  Network,
  CalendarCheck,
  Calendar,
  ClipboardList,
  ExternalLink,
} from 'lucide-react';
import { Suspense } from 'react';

interface MenuItem {
  id: string;
  label: string;
  href: string;
  icon: any;
}

const ADMIN_MENU_ITEMS: MenuItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    href: '/admin',
    icon: LayoutDashboard,
  },
  {
    id: 'hospitals',
    label: 'Bệnh viện',
    href: '/admin/hospitals',
    icon: Building2,
  },
  {
    id: 'doctors',
    label: 'Bác sĩ',
    href: '/admin/doctors',
    icon: UserCheck,
  },
  {
    id: 'specialties',
    label: 'Chuyên khoa',
    href: '/admin/specialties',
    icon: Stethoscope,
  },
  {
    id: 'schedules',
    label: 'Lịch khám',
    href: '/admin/schedules',
    icon: Calendar,
  },
  {
    id: 'appointments',
    label: 'Lịch hẹn',
    href: '/admin/appointments',
    icon: CalendarCheck,
  },
  {
    id: 'users',
    label: 'Người dùng',
    href: '/admin/users',
    icon: Users,
  },
  {
    id: 'his-sync',
    label: 'Tích hợp HIS',
    href: '/admin/his-sync',
    icon: Network,
  },
  {
    id: 'audit-logs',
    label: 'Logs',
    href: '/admin/audit-logs',
    icon: ClipboardList,
  },
];

function AdminSidebarInner() {
  const pathname = usePathname();
  const { theme } = useAdminTheme();
  const isLight = theme === 'light';

  return (
    <aside
      className={`w-64 flex flex-col shrink-0 border-r ${
        isLight
          ? 'bg-white text-slate-800 border-slate-200'
          : 'bg-slate-900 text-slate-200 border-slate-800'
      }`}
    >
      {/* Brand Header */}
      <div className={`h-16 flex items-center px-5 border-b ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
        <Link href="/admin" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white font-bold flex items-center justify-center text-sm">
            N
          </div>
          <div>
            <span className="font-bold text-sm tracking-tight block">NovaCare Admin</span>
            <span className="text-[11px] text-slate-400 block -mt-0.5">Quản trị nền tảng</span>
          </div>
        </Link>
      </div>

      {/* Nav List */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {ADMIN_MENU_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === '/admin'
              ? pathname === '/admin'
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.id}
              href={item.href}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                isActive
                  ? isLight
                    ? 'bg-emerald-50 text-emerald-800 font-bold border border-emerald-200/60'
                    : 'bg-emerald-950/40 text-emerald-400 font-bold border border-emerald-800/50'
                  : isLight
                  ? 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
              }`}
            >
              <Icon
                className={`w-4 h-4 shrink-0 ${
                  isActive
                    ? isLight
                      ? 'text-emerald-700'
                      : 'text-emerald-400'
                    : 'text-slate-400'
                }`}
              />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className={`p-3 border-t ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
        <Link
          href="/"
          target="_blank"
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition ${
            isLight
              ? 'text-slate-600 hover:bg-slate-100'
              : 'text-slate-400 hover:bg-slate-800 hover:text-white'
          }`}
        >
          <ExternalLink className="w-4 h-4 shrink-0" />
          <span>Trang Bệnh nhân</span>
        </Link>
      </div>
    </aside>
  );
}

export function AdminSidebar() {
  return (
    <Suspense fallback={<div className="w-64 shrink-0 border-r border-slate-200 bg-white" />}>
      <AdminSidebarInner />
    </Suspense>
  );
}
