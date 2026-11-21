'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { CalendarDays, CalendarRange, LayoutDashboard, LogOut, Menu, Stethoscope, UserRound, X, Bell } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

const navigation = [
  { href: '/doctor', label: 'Tổng quan', icon: LayoutDashboard },
  { href: '/doctor/lich-lam-viec', label: 'Lịch làm việc', icon: CalendarRange },
  { href: '/doctor/lich-hen', label: 'Lịch hẹn bệnh nhân', icon: CalendarDays },
  { href: '/doctor/thong-bao', label: 'Thông báo', icon: Bell },
  { href: '/doctor/ho-so', label: 'Hồ sơ bác sĩ', icon: UserRound },
];

export function DoctorPortalShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.replace('/dang-nhap');
    else if (!isLoading && user && user.role !== 'DOCTOR') router.replace('/');
  }, [isAuthenticated, isLoading, router, user]);

  if (isLoading || !isAuthenticated || !user || user.role !== 'DOCTOR') {
    return <div className="min-h-screen grid place-items-center bg-slate-50 text-sm font-semibold text-slate-500">Đang xác thực không gian bác sĩ...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {open && <button aria-label="Đóng menu" className="fixed inset-0 z-40 bg-slate-950/40 lg:hidden" onClick={() => setOpen(false)} />}
      <aside className={cn('fixed inset-y-0 left-0 z-50 w-72 border-r border-emerald-950/10 bg-[#083d30] text-white transition-transform lg:translate-x-0', open ? 'translate-x-0' : '-translate-x-full')}>
        <div className="flex h-20 items-center justify-between border-b border-white/10 px-6">
          <Link href="/doctor" className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-[#66ff33] text-[#083d30]"><Stethoscope className="h-5 w-5" /></span>
            <span><span className="block text-lg font-black tracking-tight">NovaCare</span><span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-200">Doctor Portal</span></span>
          </Link>
          <button className="lg:hidden" onClick={() => setOpen(false)}><X className="h-5 w-5" /></button>
        </div>
        <nav className="space-y-1.5 p-4">
          {navigation.map((item) => {
            const active = pathname === item.href || (item.href !== '/doctor' && pathname.startsWith(`${item.href}/`));
            const Icon = item.icon;
            return <Link key={item.href} href={item.href} onClick={() => setOpen(false)} className={cn('flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition', active ? 'bg-[#66ff33] text-[#083d30]' : 'text-emerald-50 hover:bg-white/10')}><Icon className="h-5 w-5" />{item.label}</Link>;
          })}
        </nav>
        <div className="absolute inset-x-4 bottom-4 rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="truncate text-sm font-bold">{user.fullName}</p>
          <p className="truncate text-xs text-emerald-200">{user.email || user.phone}</p>
          <button onClick={() => logout()} className="mt-3 flex w-full items-center gap-2 rounded-lg px-2 py-2 text-xs font-semibold text-emerald-100 hover:bg-white/10"><LogOut className="h-4 w-4" />Đăng xuất</button>
        </div>
      </aside>
      <div className="lg:pl-72">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-8">
          <button className="rounded-xl border border-slate-200 p-2 lg:hidden" onClick={() => setOpen(true)}><Menu className="h-5 w-5" /></button>
          <div className="hidden lg:block"><p className="text-xs font-bold uppercase tracking-[0.15em] text-emerald-700">Không gian làm việc bác sĩ</p></div>
          <div className="text-right"><p className="text-sm font-bold text-slate-800">{user.fullName}</p><p className="text-[11px] text-slate-500">Bác sĩ NovaCare</p></div>
        </header>
        <main className="mx-auto max-w-[1500px] p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
