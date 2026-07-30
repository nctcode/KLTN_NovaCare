'use client';

import { useAuthStore } from '@/stores/auth.store';
import { useRouter } from 'next/navigation';
import { Bell, LogOut, Search, User, ShieldCheck, ExternalLink } from 'lucide-react';
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

  const handleLogout = () => {
    clearAuth();
    router.push('/dang-nhap');
  };

  return (
    <header className="h-16 bg-slate-900 border-b border-slate-800 px-6 flex items-center justify-between z-20 shrink-0">
      {/* Left Search Bar */}
      <div className="flex items-center gap-3">
        <div className="relative hidden sm:block w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm kiếm dữ liệu quản trị..."
            className="w-full pl-9 pr-4 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-semibold text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-[#66FF33]"
          />
        </div>
      </div>

      {/* Right User Actions */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl relative">
          <Bell className="w-4 h-4" />
          <span className="w-2 h-2 bg-[#66FF33] rounded-full absolute top-2 right-2 ring-2 ring-slate-900" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="pl-2 pr-3 py-1 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-white gap-2">
              <Avatar className="h-7 w-7">
                <AvatarFallback className="bg-[#0c4b39] text-[#66FF33] font-black text-xs">
                  {user?.fullName?.charAt(0) || 'A'}
                </AvatarFallback>
              </Avatar>
              <div className="text-left hidden sm:block">
                <p className="text-xs font-bold truncate max-w-[120px]">{user?.fullName || 'Quản trị viên'}</p>
                <p className="text-[10px] text-[#66FF33] font-bold">ADMIN</p>
              </div>
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-56 bg-slate-900 border-slate-800 text-white">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-xs font-bold text-white">{user?.fullName}</p>
                <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-slate-800" />
            <DropdownMenuItem asChild className="cursor-pointer hover:bg-slate-800 text-xs font-semibold">
              <Link href="/tra-cuu-ho-so" target="_blank">
                <ShieldCheck className="mr-2 h-4 w-4 text-[#66FF33]" />
                Cổng Liên thông Hồ sơ Y tế
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild className="cursor-pointer hover:bg-slate-800 text-xs font-semibold">
              <Link href="/" target="_blank">
                <ExternalLink className="mr-2 h-4 w-4 text-emerald-400" />
                Về Trang Khách hàng
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-slate-800" />
            <DropdownMenuItem
              onClick={handleLogout}
              className="cursor-pointer text-rose-400 font-bold text-xs hover:bg-rose-950/50 hover:text-rose-300"
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
