'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { User, Calendar, Bell, UserCheck, LogOut, X, Activity, PanelLeftClose } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

interface SidebarProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  collapsed?: boolean;
  setCollapsed?: (collapsed: boolean) => void;
}

export function Sidebar({ open, setOpen, collapsed, setCollapsed }: SidebarProps) {
  const pathname = usePathname();
  const { logout } = useAuth();

  const menuItems = [
    {
      label: 'Tài khoản của tôi',
      href: '/tai-khoan',
      icon: User,
    },
    {
      label: 'Hồ sơ bệnh nhân',
      href: '/ho-so',
      icon: UserCheck,
    },
    {
      label: 'Lịch khám của tôi',
      href: '/lich-kham',
      icon: Calendar,
    },
    {
      label: 'Sổ sức khỏe điện tử',
      href: '/lich-su-kham',
      icon: Activity,
    },
    {
      label: 'Thông báo',
      href: '/thong-bao',
      icon: Bell,
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
        />
      )}

      {/* Sidebar Drawer */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-200 bg-white transition-all duration-300 ease-in-out shadow-xs",
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
          collapsed && "lg:-translate-x-full lg:opacity-0 pointer-events-none"
        )}
      >
        <div className="flex h-16 items-center justify-between px-5 border-b border-slate-100">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-[#0c4b39] rounded-xl flex items-center justify-center shadow-xs">
              <span className="text-[#66FF33] font-black text-sm">N</span>
            </div>
            <span className="text-xl font-black text-[#1A2B3C] tracking-tight">
              Nova<span className="text-[#0c4b39]">Care</span>
            </span>
          </Link>
          <div className="flex items-center gap-1">
            {setCollapsed && (
              <button
                onClick={() => setCollapsed(true)}
                className="hidden lg:flex p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                title="Đóng menu (Xem toàn màn hình)"
              >
                <PanelLeftClose className="h-5 w-5" />
              </button>
            )}
            <button
              onClick={() => setOpen(false)}
              className="lg:hidden p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <nav className="flex-1 space-y-1 px-4 py-6">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition",
                  isActive
                    ? "bg-primary/10 text-primary-dark"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                )}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Specialized Demo Link: Cổng Bác Sĩ Tra Cứu Liên Thông Đa Viện */}
        <div className="px-4 py-3 border-t border-slate-100">
          <Link
            href="/tra-cuu-benh-an"
            onClick={() => setOpen(false)}
            className={cn(
              "flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs font-bold transition border",
              pathname === '/tra-cuu-benh-an'
                ? "bg-emerald-700 text-white border-emerald-800 shadow-xs"
                : "bg-emerald-50/80 text-emerald-900 border-emerald-200 hover:bg-emerald-100/80"
            )}
          >
            <Activity className="h-4 w-4 text-emerald-600 shrink-0" />
            <div className="flex-1 text-left">
              <span className="block font-black text-slate-900">Cổng Bác Sĩ Tra Cứu</span>
              <span className="text-[10px] font-semibold text-emerald-700 block">Liên thông y tế đa viện (KLTN)</span>
            </div>
          </Link>
        </div>

        <div className="border-t p-4">
          <button
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-danger hover:bg-red-50 transition cursor-pointer"
          >
            <LogOut className="h-5 w-5" />
            Đăng xuất
          </button>
        </div>
      </aside>
    </>
  );
}
