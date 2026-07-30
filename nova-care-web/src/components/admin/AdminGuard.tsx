'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth.store';
import { Loader2, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <Loader2 className="w-8 h-8 text-[#66FF33] animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-white p-6 space-y-4 text-center">
        <ShieldAlert className="w-12 h-12 text-amber-400" />
        <h2 className="text-xl font-bold">Yêu cầu Đăng nhập Quản trị viên</h2>
        <p className="text-xs text-slate-400 max-w-md">
          Bạn cần đăng nhập bằng tài khoản Quản trị viên (Admin) để truy cập hệ thống NovaCare Admin.
        </p>
        <Button
          onClick={() => router.push('/dang-nhap')}
          className="bg-[#66FF33] text-slate-950 hover:bg-[#52e622] font-bold text-xs px-6 py-2 rounded-xl"
        >
          Đăng nhập ngay
        </Button>
      </div>
    );
  }

  if (user.role !== 'ADMIN') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-white p-6 space-y-4 text-center">
        <ShieldAlert className="w-12 h-12 text-rose-500" />
        <h2 className="text-xl font-bold">Truy cập bị Từ chối (403 Forbidden)</h2>
        <p className="text-xs text-slate-400 max-w-md">
          Tài khoản <strong>{user.email || user.fullName}</strong> của bạn không có quyền Quản trị viên (Role: {user.role}).
        </p>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => router.push('/')}
            className="border-slate-700 text-slate-300 hover:bg-slate-800 text-xs font-bold rounded-xl"
          >
            Trang chủ Bệnh nhân
          </Button>
          <Button
            onClick={() => router.push('/dang-nhap')}
            className="bg-[#66FF33] text-slate-950 hover:bg-[#52e622] font-bold text-xs rounded-xl"
          >
            Đăng nhập tài khoản khác
          </Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
