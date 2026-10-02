'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { useAdminTheme } from './AdminThemeContext';
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
    label: 'Dashboard',
    icon: LayoutDashboard,
    href: '/admin',
  },
  {
    id: 'users-group',
    label: 'Quản lý người dùng',
    icon: Users,
    items: [
      {
        id: 'users-list',
        label: 'Danh sách người dùng',
        href: '/admin/users',
        icon: Users,
        exact: true,
      },
      {
        id: 'users-roles',
        label: 'Vai trò & Phân quyền',
        href: '/admin/users/roles',
        icon: ShieldCheck,
      },
      {
        id: 'users-activity',
        label: 'Lịch sử hoạt động',
        href: '/admin/users/activity',
        icon: History,
      },
    ],
  },
  {
    id: 'hospitals-group',
    label: 'Quản lý bệnh viện',
    icon: Building2,
    items: [
      {
        id: 'hospitals-list',
        label: 'Danh sách bệnh viện',
        href: '/admin/hospitals',
        icon: Building2,
      },
      {
        id: 'specialties',
        label: 'Chuyên khoa',
        href: '/admin/specialties',
        icon: Stethoscope,
      },
      {
        id: 'doctors',
        label: 'Bác sĩ',
        href: '/admin/doctors',
        icon: UserCheck,
      },
      {
        id: 'schedules',
        label: 'Lịch trực bác sĩ',
        href: '/admin/schedules',
        icon: Calendar,
      },
    ],
  },
  {
    id: 'appointments-group',
    label: 'Quản lý lịch hẹn',
    icon: CalendarCheck,
    items: [
      {
        id: 'appointments-list',
        label: 'Danh sách lịch hẹn',
        href: '/admin/appointments',
        icon: CalendarCheck,
        exact: true,
      },
      {
        id: 'appointments-today',
        label: 'Lịch hẹn hôm nay',
        href: '/admin/appointments/today',
        icon: Clock,
      },
      {
        id: 'appointments-history',
        label: 'Lịch sử khám',
        href: '/admin/appointments/history',
        icon: FileText,
      },
    ],
  },
  {
    id: 'interoperability-group',
    label: 'Giám sát liên thông',
    icon: Share2,
    items: [
      {
        id: 'interop-overview',
        label: 'Tổng quan',
        href: '/admin/interoperability',
        icon: Activity,
        exact: true,
      },
      {
        id: 'interop-lookups',
        label: 'Lượt tra cứu',
        href: '/admin/interoperability?tab=lookups',
        icon: BarChart2,
      },
      {
        id: 'interop-audit',
        label: 'Audit Log',
        href: '/admin/interoperability?tab=audit',
        icon: ClipboardList,
      },
    ],
  },
];

function AdminSidebarInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { theme } = useAdminTheme();
  const isLight = theme === 'light';

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
    ADMIN_MENU_CONFIG.forEach((group) => {
      if (group.items?.some((sub) => checkSubItemActive(sub))) {
        setOpenGroups((prev) => ({ ...prev, [group.id]: true }));
      }
    });
  }, [pathname, searchParams]);

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
        <Link href="/admin" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white font-bold flex items-center justify-center text-sm shadow-sm">
            N
          </div>
          <div>
            <span className="font-bold text-sm tracking-tight block">NovaCare Admin</span>
            <span className="text-[11px] text-slate-400 block -mt-0.5">Quản trị nền tảng</span>
          </div>
        </Link>
      </div>

      {/* Nav List */}
      <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto">
        {ADMIN_MENU_CONFIG.map((group) => {
          const GroupIcon = group.icon;

          // Single item without submenu (e.g. Dashboard)
          if (!group.items && group.href) {
            const isSingleActive = pathname === group.href;

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

        {/* Secondary: HIS Integration */}
        <div className="pt-2">
          <Link
            href="/admin/his-sync"
            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
              pathname.startsWith('/admin/his-sync')
                ? isLight
                  ? 'bg-emerald-50 text-emerald-800 font-bold border border-emerald-200/60'
                  : 'bg-emerald-950/40 text-emerald-400 font-bold border border-emerald-800/50'
                : isLight
                ? 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
                : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
            }`}
          >
            <Network className="w-4 h-4 shrink-0 text-slate-400" />
            <span className="truncate">Tích hợp HIS</span>
          </Link>
        </div>
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
