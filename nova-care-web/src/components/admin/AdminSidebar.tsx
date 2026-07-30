'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAdminTheme } from './AdminThemeContext';
import {
  LayoutDashboard,
  Users,
  UserCheck,
  Building2,
  Package,
  CalendarCheck,
  CreditCard,
  History,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useState } from 'react';

const ADMIN_MENU_ITEMS = [
  { href: '/admin', label: 'Dashboard Thống kê', icon: LayoutDashboard },
  { href: '/admin/users', label: 'Quản lý Người dùng', icon: Users },
  { href: '/admin/doctors', label: 'Quản lý Bác sĩ', icon: UserCheck },
  { href: '/admin/hospitals', label: 'Quản lý Bệnh viện', icon: Building2 },
  { href: '/admin/health-packages', label: 'Quản lý Gói khám', icon: Package },
  { href: '/admin/appointments', label: 'Quản lý Lịch khám', icon: CalendarCheck },
  { href: '/admin/payments', label: 'Quản lý Thanh toán', icon: CreditCard },
  { href: '/admin/audit-logs', label: 'Nhật ký Hệ thống', icon: History },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const { theme } = useAdminTheme();
  const [collapsed, setCollapsed] = useState(false);
  const isLight = theme === 'light';

  return (
    <aside
      className={`transition-all duration-300 flex flex-col z-30 shrink-0 border-r ${
        collapsed ? 'w-20' : 'w-64'
      } ${
        isLight
          ? 'bg-[#0c4b39] text-white border-[#083629]'
          : 'bg-slate-950 text-white border-slate-800'
      }`}
    >
      {/* Sidebar Header Logo */}
      <div className={`h-16 border-b flex items-center justify-between px-4 ${isLight ? 'border-emerald-800/60' : 'border-slate-800/80'}`}>
        <Link href="/admin" className="flex items-center gap-3 overflow-hidden">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center font-black text-xl text-slate-950 shadow-md shrink-0">
            N
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="font-extrabold text-base tracking-tight text-white flex items-center gap-1.5">
                NovaCare <span className="text-[10px] font-black uppercase px-1.5 py-0.2 rounded bg-[#66FF33] text-slate-950">Admin</span>
              </span>
              <span className="text-[10px] text-emerald-200 font-medium">Hệ thống Quản trị</span>
            </div>
          )}
        </Link>

        <button
          onClick={() => setCollapsed(!collapsed)}
          className={`p-1 rounded-lg transition ${isLight ? 'text-emerald-200 hover:text-white hover:bg-emerald-800/60' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
          title={collapsed ? 'Mở rộng thanh menu' : 'Thu gọn thanh menu'}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto">
        {ADMIN_MENU_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-bold text-xs transition-all ${
                isActive
                  ? isLight
                    ? 'bg-emerald-600/60 text-[#66FF33] shadow-sm border border-emerald-400/30'
                    : 'bg-gradient-to-r from-[#0c4b39] to-emerald-800 text-[#66FF33] shadow-sm border border-emerald-500/30'
                  : isLight
                  ? 'text-emerald-100 hover:bg-emerald-800/40 hover:text-white'
                  : 'text-slate-300 hover:bg-slate-900 hover:text-white'
              }`}
              title={collapsed ? item.label : undefined}
            >
              <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-[#66FF33]' : isLight ? 'text-emerald-300' : 'text-slate-400'}`} />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Client Link */}
      <div className={`p-3 border-t ${isLight ? 'border-emerald-800/60' : 'border-slate-800'}`}>
        <Link
          href="/"
          target="_blank"
          className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition border ${
            isLight
              ? 'bg-emerald-900/60 hover:bg-emerald-800 text-emerald-100 border-emerald-700/50'
              : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-800'
          }`}
          title={collapsed ? 'Trang Bệnh nhân' : undefined}
        >
          <ExternalLink className="w-4 h-4 text-[#66FF33] shrink-0" />
          {!collapsed && <span>Về Trang Bệnh nhân</span>}
        </Link>
      </div>
    </aside>
  );
}
