'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/stores/auth.store';
import {
  LayoutDashboard,
  Building2,
  UserCheck,
  Calendar,
  Stethoscope,
  ClipboardList,
  CalendarCheck,
  ExternalLink,
  ShieldAlert,
  Network,
} from 'lucide-react';

interface MenuItem {
  id: string;
  label: string;
  href: string;
  icon: any;
  exact?: boolean;
}

const HOSPITAL_MENU_ITEMS: MenuItem[] = [
  {
    id: 'dashboard',
    label: 'Tổng quan cơ sở',
    href: '/hospital-admin',
    icon: LayoutDashboard,
    exact: true,
  },
  {
    id: 'hospital-info',
    label: 'Hồ sơ Bệnh viện',
    href: '/hospital-admin/hospital-info',
    icon: Building2,
  },
  {
    id: 'integration',
    label: 'Tích hợp & Kết nối HIS',
    href: '/hospital-admin/integration',
    icon: Network,
  },
  {
    id: 'doctors',
    label: 'Bác sĩ trực thuộc',
    href: '/hospital-admin/doctors',
    icon: UserCheck,
  },
  {
    id: 'schedules',
    label: 'Lịch trực Bác sĩ',
    href: '/hospital-admin/schedules',
    icon: Calendar,
  },
  {
    id: 'specialties',
    label: 'Chuyên khoa cung cấp',
    href: '/hospital-admin/specialties',
    icon: Stethoscope,
  },
  {
    id: 'services',
    label: 'Dịch vụ Y tế & Khám',
    href: '/hospital-admin/services',
    icon: ClipboardList,
  },
  {
    id: 'appointments',
    label: 'Quản lý Lịch hẹn',
    href: '/hospital-admin/appointments',
    icon: CalendarCheck,
  },
];

export function HospitalAdminSidebar() {
  const pathname = usePathname();
  const { user } = useAuthStore();

  const hospitalName = user?.hospital?.name || 'Bệnh viện của tôi';

  const checkActive = (item: MenuItem) => {
    if (item.exact) return pathname === item.href;
    return pathname.startsWith(item.href);
  };

  return (
    <aside className="w-64 flex flex-col shrink-0 border-r select-none bg-white text-slate-800 border-slate-200">
      {/* Brand Header */}
      <div className="p-4 border-b border-slate-200 shrink-0">
        <Link href="/hospital-admin" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white font-black flex items-center justify-center text-base shadow-sm shrink-0">
            H
          </div>
          <div className="min-w-0 flex-1">
            <span className="font-bold text-xs tracking-tight text-slate-900 block truncate" title={hospitalName}>
              {hospitalName}
            </span>
            <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 font-semibold px-1.5 py-0.5 rounded bg-emerald-50 border border-emerald-200 mt-1">
              Hospital Admin Portal
            </span>
          </div>
        </Link>
      </div>

      {/* Nav List */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Vận hành cơ sở
        </div>
        {HOSPITAL_MENU_ITEMS.map((item) => {
          const ItemIcon = item.icon;
          const isActive = checkActive(item);

          return (
            <Link
              key={item.id}
              href={item.href}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                isActive
                  ? 'bg-emerald-50 text-emerald-800 font-bold border border-emerald-200/60 shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <ItemIcon
                className={`w-4 h-4 shrink-0 ${
                  isActive ? 'text-emerald-700' : 'text-slate-400'
                }`}
              />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer Links */}
      <div className="p-3 border-t border-slate-200 shrink-0 space-y-1">
        {user?.role === 'ADMIN' && (
          <Link
            href="/admin"
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-emerald-700 hover:bg-emerald-50 transition"
          >
            <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
            <span>Về Platform Admin</span>
          </Link>
        )}
        <Link
          href="/"
          target="_blank"
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition"
        >
          <ExternalLink className="w-3.5 h-3.5 shrink-0" />
          <span>Trang Bệnh nhân NovaCare</span>
        </Link>
      </div>
    </aside>
  );
}
