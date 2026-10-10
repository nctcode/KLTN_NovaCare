'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth.store';
import { Loader2, ShieldAlert, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function HospitalAdminGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-white p-6 space-y-4 text-center">
        <ShieldAlert className="w-12 h-12 text-blue-400" />
        <h2 className="text-xl font-bold">Cổng Quản Trị Bệnh Viện (Hospital Admin)</h2>
        <p className="text-xs text-slate-400 max-w-md">
          Bạn cần đăng nhập bằng tài khoản Quản trị viên Bệnh viện để truy cập dữ liệu và vận hành cơ sở y tế.
        </p>
        <Button
          onClick={() => router.push('/dang-nhap')}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-6 py-2 rounded-xl"
        >
          Đăng nhập ngay
        </Button>
      </div>
    );
  }

  // Phải là HOSPITAL_ADMIN hoặc ADMIN (ADMIN được cấp quyền giám sát/hỗ trợ)
  if (user.role !== 'HOSPITAL_ADMIN' && user.role !== 'ADMIN') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-white p-6 space-y-4 text-center">
        <ShieldAlert className="w-12 h-12 text-rose-500" />
        <h2 className="text-xl font-bold">Truy cập bị Từ chối (403 Forbidden)</h2>
        <p className="text-xs text-slate-400 max-w-md">
          Tài khoản <strong>{user.email || user.fullName}</strong> của bạn không có quyền Quản trị viên Bệnh viện (Role: {user.role}).
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
            className="bg-blue-600 text-white hover:bg-blue-700 font-bold text-xs rounded-xl"
          >
            Đăng nhập tài khoản khác
          </Button>
        </div>
      </div>
    );
  }

  // Kiểm tra tài khoản HOSPITAL_ADMIN đã được gán bệnh viện chưa
  if (user.role === 'HOSPITAL_ADMIN' && !user.hospitalId) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-white p-6 space-y-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-inner">
          <Building2 className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-amber-300">Tài Khoản Chưa Gán Bệnh Viện</h2>
        <p className="text-xs text-slate-300 max-w-md leading-relaxed">
          Tài khoản <strong>{user.email || user.fullName}</strong> đã có quyền <strong>Quản trị viên Bệnh viện</strong>, nhưng chưa được liên kết với cơ sở y tế cụ thể nào.
          <br /><br />
          Vui lòng liên hệ <strong>Quản trị viên Nền tảng NovaCare (Platform Admin)</strong> để gán cơ sở bệnh viện trực thuộc trước khi thao tác.
        </p>
        <div className="flex items-center gap-3 pt-2">
          <Button
            variant="outline"
            onClick={() => router.push('/')}
            className="border-slate-700 text-slate-300 hover:bg-slate-800 text-xs font-bold rounded-xl"
          >
            Về Trang chủ
          </Button>
          <Button
            onClick={() => router.push('/dang-nhap')}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl"
          >
            Đổi tài khoản khác
          </Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
