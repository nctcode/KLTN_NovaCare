'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { useAdminTheme } from './AdminThemeContext';
import { useAuthStore } from '@/stores/auth.store';
import {
  LayoutDashboard,
  Users,
  Building2,
  CalendarCheck,
  Share2,
  ChevronDown,
  ExternalLink,
  UserCheck,
  Stethoscope,
  Calendar,
  Clock,
  FileText,
  ShieldCheck,
  History,
  Activity,
  BarChart2,
  ClipboardList,
  Network,
  UserPlus,
  MapPin,
} from 'lucide-react';

interface SubMenuItem {
  id: string;
  label: string;
  href: string;
  icon?: any;
  exact?: boolean;
}

interface MenuGroup {
  id: string;
  label: string;
  icon: any;
  href?: string; // Direct link if no subitems
  items?: SubMenuItem[];
}

const ADMIN_MENU_CONFIG: MenuGroup[] = [
  {
    id: 'dashboard',
    label: 'Tổng quan nền tảng',
    icon: LayoutDashboard,
    href: '/admin',
  },
  {
    id: 'hospitals-partner',
    label: 'Bệnh viện đối tác',
    icon: Building2,
    href: '/admin/hospitals',
  },
  {
    id: 'partner-requests',
    label: 'Đăng ký hợp tác',
    icon: UserPlus,
    href: '/admin/partner-requests',
  },
  {
    id: 'hospital-admins',
    label: 'Tài khoản Quản trị viện',
    icon: ShieldCheck,
    href: '/admin/users/roles',
  },
  {
    id: 'his-sync',
    label: 'Tích hợp HIS / API',
    icon: Network,
    href: '/admin/his-sync',
  },
  {
    id: 'interoperability',
    label: 'Liên thông Bệnh án',
    icon: Share2,
    href: '/admin/interoperability',
  },
  {
    id: 'appointments-monitor',
    label: 'Giám sát đặt lịch',
    icon: CalendarCheck,
    href: '/admin/appointments',
  },
  {
    id: 'audit-logs',
    label: 'Nhật ký hệ thống',
    icon: History,
    href: '/admin/audit-logs',
  },
  {
    id: 'master-specialties',
    label: 'Cấu hình & Danh mục chuẩn',
    icon: Stethoscope,
    href: '/admin/specialties',
  },
  {
    id: 'users-list',
    label: 'Người dùng & Bệnh nhân',
    icon: Users,
    href: '/admin/users',
  },
];

function AdminSidebarInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { theme } = useAdminTheme();
  const isLight = theme === 'light';
  const { user } = useAuthStore();

  const isHospitalAdmin = user?.role === 'HOSPITAL_ADMIN';
  const hospitalId = user?.hospitalId || '';

  // Dynamic menu configuration based on role
  const menuConfig: MenuGroup[] = isHospitalAdmin
    ? [
        {
          id: 'dashboard',
          label: 'Tổng quan Bệnh viện',
          icon: LayoutDashboard,
          href: '/admin',
        },
        {
          id: 'hospital-doctors',
          label: 'Đội ngũ Bác sĩ',
          icon: UserCheck,
          href: '/admin/doctors',
        },
        {
          id: 'hospital-services',
          label: 'Dịch vụ Y tế',
          icon: ClipboardList,
          href: '/admin/medical-services',
        },
        {
          id: 'hospital-packages',
          label: 'Gói khám Sức khỏe',
          icon: Stethoscope,
          href: '/admin/health-packages',
        },
        {
          id: 'hospital-specialties',
          label: 'Chuyên khoa Tiếp nhận',
          icon: Activity,
          href: '/admin/specialties',
        },
        {
          id: 'schedules-menu',
          label: 'Lịch trực & Ca khám',
          icon: Calendar,
          href: '/admin/schedules',
        },
        {
          id: 'appointments-menu',
          label: 'Lịch hẹn Bệnh nhân',
          icon: CalendarCheck,
          href: '/admin/appointments',
        },
        {
          id: 'his-sync-menu',
          label: 'Cổng Đồng bộ HIS',
          icon: Network,
          href: '/admin/his-sync',
        },
        {
          id: 'my-hospital',
          label: 'Hồ sơ Cơ sở Y tế',
          icon: Building2,
          href: `/admin/hospitals/${hospitalId}`,
        },
      ]
    : ADMIN_MENU_CONFIG;

  // Helper to determine if a sub-item is active
  const checkSubItemActive = (sub: SubMenuItem) => {
    // Interoperability special tab matching
    if (pathname === '/admin/interoperability') {
      const tab = searchParams.get('tab');
      if (sub.id === 'interop-audit') {
        return tab === 'audit';
      }
      if (sub.id === 'interop-lookups') {
        return tab === 'lookups';
      }
      if (sub.id === 'interop-overview') {
        return !tab || tab === 'overview';
      }
    }

    // Appointment sub-routes or query params
    if (sub.id === 'appointments-today') {
      return pathname.startsWith('/admin/appointments/today') || searchParams.get('filter') === 'today';
    }
    if (sub.id === 'appointments-history') {
      return pathname.startsWith('/admin/appointments/history') || searchParams.get('filter') === 'history';
    }
    if (sub.id === 'appointments-list') {
      return pathname === '/admin/appointments' && !searchParams.get('filter');
    }

    // User activity also matches /admin/audit-logs
    if (sub.id === 'users-activity') {
      return pathname.startsWith('/admin/users/activity') || pathname.startsWith('/admin/audit-logs');
    }

    // Normal matching
    if (sub.exact) {
      return pathname === sub.href;
    }
    return pathname.startsWith(sub.href);
  };

  // State to manage expanded groups (all open by default)
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    'users-group': true,
    'hospitals-group': true,
    'appointments-group': true,
    'interoperability-group': true,
  });

  // Automatically expand group containing active item
  useEffect(() => {
    menuConfig.forEach((group) => {
      if (group.items?.some((sub) => checkSubItemActive(sub))) {
        setOpenGroups((prev) => ({ ...prev, [group.id]: true }));
      }
    });
  }, [pathname, searchParams, menuConfig]);

  const toggleGroup = (groupId: string) => {
    setOpenGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };

  return (
    <aside
      className={`w-64 flex flex-col shrink-0 border-r select-none ${
        isLight
          ? 'bg-white text-slate-800 border-slate-200'
          : 'bg-slate-900 text-slate-200 border-slate-800'
      }`}
    >
      {/* Brand Header */}
      <div className={`h-16 flex items-center px-5 border-b shrink-0 ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
        <Link href="/admin" className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white font-bold flex items-center justify-center text-sm shadow-sm shrink-0">
            {isHospitalAdmin ? 'H' : 'N'}
          </div>
          <div className="min-w-0">
            <span className="font-bold text-sm tracking-tight block truncate">
              {isHospitalAdmin ? (user?.hospital?.name || 'Cổng Bệnh Viện') : 'NovaCare Admin'}
            </span>
            <span className="text-[11px] text-slate-400 block -mt-0.5 truncate">
              {isHospitalAdmin ? 'Quản trị cơ sở y tế' : 'Quản trị nền tảng'}
            </span>
          </div>
        </Link>
      </div>

      {/* Nav List */}
      <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto">
        {menuConfig.map((group) => {
          const GroupIcon = group.icon;

          // Single item without submenu (e.g. Dashboard)
          if (!group.items && group.href) {
            const isSingleActive =
              group.href === '/admin'
                ? pathname === '/admin'
                : group.href === '/admin/users'
                ? pathname === '/admin/users'
                : group.href.includes('?tab=')
                ? pathname.startsWith(`/admin/hospitals/${hospitalId}`) &&
                  searchParams.get('tab') === group.href.split('?tab=')[1]
                : group.href === `/admin/hospitals/${hospitalId}`
                ? pathname === `/admin/hospitals/${hospitalId}` &&
                  (!searchParams.get('tab') || searchParams.get('tab') === 'overview')
                : pathname === group.href || (group.href !== '/admin' && pathname.startsWith(group.href));

            return (
              <Link
                key={group.id}
                href={group.href}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                  isSingleActive
                    ? isLight
                      ? 'bg-emerald-50 text-emerald-800 font-bold border border-emerald-200/60 shadow-xs'
                      : 'bg-emerald-950/40 text-emerald-400 font-bold border border-emerald-800/50'
                    : isLight
                    ? 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                }`}
              >
                <GroupIcon
                  className={`w-4 h-4 shrink-0 ${
                    isSingleActive
                      ? isLight
                        ? 'text-emerald-700'
                        : 'text-emerald-400'
                      : 'text-slate-400'
                  }`}
                />
                <span className="truncate">{group.label}</span>
              </Link>
            );
          }

          // Group with Sub-menu items
          const isOpen = !!openGroups[group.id];
          const hasActiveChild = group.items?.some((sub) => checkSubItemActive(sub));

          return (
            <div key={group.id} className="space-y-1">
              {/* Group Header Button */}
              <button
                type="button"
                onClick={() => toggleGroup(group.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition text-left ${
                  hasActiveChild
                    ? isLight
                      ? 'text-slate-900 bg-slate-50'
                      : 'text-white bg-slate-800/40'
                    : isLight
                    ? 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                    : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3 truncate">
                  <GroupIcon
                    className={`w-4 h-4 shrink-0 ${
                      hasActiveChild
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-slate-400'
                    }`}
                  />
                  <span className="truncate">{group.label}</span>
                </div>
                <ChevronDown
                  className={`w-3.5 h-3.5 shrink-0 text-slate-400 transition-transform duration-200 ${
                    isOpen ? 'rotate-180 text-emerald-600' : ''
                  }`}
                />
              </button>

              {/* Submenu Accordion Content */}
              {isOpen && group.items && (
                <div className="ml-4 pl-3.5 border-l border-slate-200 dark:border-slate-800 space-y-1 py-0.5">
                  {group.items.map((sub) => {
                    const isSubActive = checkSubItemActive(sub);
                    const SubIcon = sub.icon;

                    return (
                      <Link
                        key={sub.id}
                        href={sub.href}
                        className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-[12px] font-medium transition ${
                          isSubActive
                            ? isLight
                              ? 'bg-emerald-50 text-emerald-800 font-bold border border-emerald-200/60 shadow-xs'
                              : 'bg-emerald-950/40 text-emerald-400 font-bold border border-emerald-800/50'
                            : isLight
                            ? 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                            : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                        }`}
                      >
                        {SubIcon ? (
                          <SubIcon
                            className={`w-3.5 h-3.5 shrink-0 ${
                              isSubActive
                                ? isLight
                                  ? 'text-emerald-700'
                                  : 'text-emerald-400'
                                : 'text-slate-400'
                            }`}
                          />
                        ) : (
                          <div
                            className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                              isSubActive
                                ? 'bg-emerald-600'
                                : 'bg-slate-300 dark:bg-slate-600'
                            }`}
                          />
                        )}
                        <span className="truncate">{sub.label}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}


      </nav>

      {/* Footer */}
      <div className={`p-3 border-t shrink-0 ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
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
