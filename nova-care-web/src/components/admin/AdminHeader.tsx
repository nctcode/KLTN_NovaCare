'use client';

import { useAuthStore } from '@/stores/auth.store';
import { useAdminTheme } from './AdminThemeContext';
import { useRouter } from 'next/navigation';
import { Bell, LogOut, Search, Sun, Moon, ShieldCheck, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import Link from 'next/link';

export function AdminHeader() {
  const router = useRouter();
  const { user, clearAuth } = useAuthStore();
  const { theme, toggleTheme } = useAdminTheme();

  const isLight = theme === 'light';

  const handleLogout = () => {
    clearAuth();
    router.push('/dang-nhap');
  };

  return (
    <header
      className={`h-16 px-6 flex items-center justify-between z-20 shrink-0 border-b transition-colors duration-200 ${
        isLight
          ? 'bg-white border-slate-200 text-slate-800'
          : 'bg-slate-900 border-slate-800 text-white'
      }`}
    >
      {/* Left Search Bar */}
      <div className="flex items-center gap-3">
        <div className="relative hidden sm:block w-72">
          <Search className={`w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 ${isLight ? 'text-slate-400' : 'text-slate-400'}`} />
          <input
            type="text"
            placeholder="Tìm kiếm dữ liệu quản trị..."
            className={`w-full pl-9 pr-4 py-1.5 rounded-xl text-xs font-semibold placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#0c4b39] transition ${
              isLight
                ? 'bg-slate-100 border border-slate-200 text-slate-900'
                : 'bg-slate-950 border border-slate-800 text-white'
            }`}
          />
        </div>
      </div>

      {/* Right User Actions & Theme Toggle */}
      <div className="flex items-center gap-3">
        {/* Theme Mode Switcher Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={toggleTheme}
          className={`flex items-center gap-2 rounded-xl text-xs font-extrabold transition border ${
            isLight
              ? 'bg-slate-100 border-slate-300 text-slate-800 hover:bg-slate-200'
              : 'bg-slate-950 border-slate-800 text-[#66FF33] hover:bg-slate-800'
          }`}
          title={isLight ? 'Chuyển sang Chế độ Nền Tối (Dark Mode)' : 'Chuyển sang Chế độ Nền Sáng (Light Mode)'}
        >
          {isLight ? (
            <>
              <Moon className="w-4 h-4 text-purple-600" />
              <span className="hidden sm:inline">Nền Tối</span>
            </>
          ) : (
            <>
              <Sun className="w-4 h-4 text-amber-400 animate-spin-slow" />
              <span className="hidden sm:inline">Nền Sáng</span>
            </>
          )}
        </Button>

        {/* Notification Bell */}
        <Button
          variant="ghost"
          size="icon"
          className={`rounded-xl relative ${isLight ? 'text-slate-600 hover:bg-slate-100' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
        >
          <Bell className="w-4 h-4" />
          <span className="w-2 h-2 bg-[#66FF33] rounded-full absolute top-2 right-2 ring-2 ring-slate-900" />
        </Button>

        {/* User Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className={`pl-2 pr-3 py-1 rounded-xl border text-left gap-2 ${
                isLight
                  ? 'bg-slate-100 border-slate-200 text-slate-800 hover:bg-slate-200'
                  : 'bg-slate-950 border-slate-800 text-white hover:bg-slate-800'
              }`}
            >
              <Avatar className="h-7 w-7">
                <AvatarFallback className="bg-[#0c4b39] text-[#66FF33] font-black text-xs">
                  {user?.fullName?.charAt(0) || 'A'}
                </AvatarFallback>
              </Avatar>
              <div className="text-left hidden sm:block">
                <p className="text-xs font-bold truncate max-w-[120px]">{user?.fullName || 'Quản trị viên'}</p>
                <p className="text-[10px] text-[#0c4b39] font-black">ADMIN</p>
              </div>
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            align="end"
            className={`w-56 border ${
              isLight
                ? 'bg-white border-slate-200 text-slate-800 shadow-xl'
                : 'bg-slate-900 border-slate-800 text-white shadow-xl'
            }`}
          >
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-xs font-bold">{user?.fullName}</p>
                <p className="text-[11px] opacity-70 truncate">{user?.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className={isLight ? 'bg-slate-200' : 'bg-slate-800'} />
            <DropdownMenuItem asChild className="cursor-pointer text-xs font-semibold">
              <Link href="/tra-cuu-ho-so" target="_blank">
                <ShieldCheck className="mr-2 h-4 w-4 text-[#0c4b39]" />
                Cổng Liên thông Hồ sơ Y tế
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild className="cursor-pointer text-xs font-semibold">
              <Link href="/" target="_blank">
                <ExternalLink className="mr-2 h-4 w-4 text-emerald-600" />
                Về Trang Khách hàng
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator className={isLight ? 'bg-slate-200' : 'bg-slate-800'} />
            <DropdownMenuItem
              onClick={handleLogout}
              className="cursor-pointer text-rose-600 font-bold text-xs hover:bg-rose-50 hover:text-rose-700"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Đăng xuất
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
