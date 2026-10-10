'use client';

import React from 'react';
import { useAuthStore } from '@/stores/auth.store';
import { useRouter } from 'next/navigation';
import { LogOut, Building2, ExternalLink } from 'lucide-react';
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

export function HospitalAdminHeader() {
  const router = useRouter();
  const { user, clearAuth } = useAuthStore();

  const handleLogout = () => {
    clearAuth();
    router.push('/dang-nhap');
  };

  const hospitalName = user?.hospital?.name || 'Cơ sở Y tế NovaCare';

  return (
    <header className="h-16 px-6 flex items-center justify-between z-20 shrink-0 border-b border-slate-200 bg-white text-slate-900 shadow-xs">
      {/* Left: Active Hospital Banner */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
          <Building2 className="w-4 h-4" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm text-slate-900 tracking-tight truncate max-w-sm sm:max-w-md">
              {hospitalName}
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              Đang hoạt động
            </span>
          </div>
          <p className="text-[11px] text-slate-500 -mt-0.5">
            Dữ liệu được giới hạn trong phạm vi cơ sở này
          </p>
        </div>
      </div>

      {/* Right User Actions */}
      <div className="flex items-center gap-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="pl-2 pr-3 py-1 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 hover:bg-slate-100 gap-2.5"
            >
              <Avatar className="h-7 w-7">
                <AvatarFallback className="bg-emerald-600 text-white font-bold text-xs">
                  {user?.fullName?.charAt(0) || 'H'}
                </AvatarFallback>
              </Avatar>
              <div className="text-left hidden sm:block">
                <p className="text-xs font-semibold text-slate-800 truncate max-w-[130px]">
                  {user?.fullName || 'Quản trị Bệnh viện'}
                </p>
                <p className="text-[10px] text-emerald-700 font-bold">
                  {user?.role || 'HOSPITAL_ADMIN'}
                </p>
              </div>
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            align="end"
            className="w-60 border border-slate-200 bg-white text-slate-900 shadow-xl"
          >
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-xs font-bold text-slate-900">{user?.fullName}</p>
                <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
                <div className="pt-1">
                  <span className="inline-block text-[10px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Cơ sở: {hospitalName}
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-slate-200" />
            <DropdownMenuItem asChild className="cursor-pointer text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-50">
              <Link href="/" target="_blank">
                <ExternalLink className="mr-2 h-4 w-4 text-emerald-600" />
                Về Trang Khách hàng
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-slate-200" />
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
