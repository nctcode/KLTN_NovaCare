'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminService } from '@/services/admin.service';
import { useAdminTheme } from '@/components/admin/AdminThemeContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import {
  ShieldCheck,
  Building2,
  Mail,
  User,
  Loader2,
  CheckCircle2,
} from 'lucide-react';

interface CreateHospitalAdminDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function CreateHospitalAdminDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreateHospitalAdminDialogProps) {
  const queryClient = useQueryClient();
  const { theme } = useAdminTheme();
  const isLight = theme === 'light';

  const [formData, setFormData] = useState({
    hospitalId: '',
    fullName: '',
    email: '',
  });

  useEffect(() => {
    if (!open) {
      setFormData({ hospitalId: '', fullName: '', email: '' });
    }
  }, [open]);

  const { data: hospitalsData, isLoading: isLoadingHospitals } = useQuery({
    queryKey: ['admin-hospitals-simple-list'],
    queryFn: () => adminService.getHospitals({ limit: 100 }),
    enabled: open,
  });

  const hospitals: any[] = (hospitalsData?.items || []).filter(
    (h: any) => (h.rawStatus || h.status) !== 'TERMINATED' && h.status !== 'Ngừng hợp tác',
  );

  const createMutation = useMutation({
    mutationFn: (data: typeof formData) =>
      adminService.createHospitalAdmin({
        hospitalId: data.hospitalId,
        fullName: data.fullName.trim(),
        email: data.email.trim(),
      }),
    onSuccess: () => {
      toast.success('Đã cấp tài khoản quản trị cơ sở và gửi email kích hoạt thành công!');
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-roles-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-recent-audit-logs'] });
      setFormData({ hospitalId: '', fullName: '', email: '' });
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Không thể cấp tài khoản quản trị cơ sở y tế');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.hospitalId) {
      toast.error('Vui lòng chọn cơ sở y tế trực thuộc');
      return;
    }
    if (!formData.fullName.trim()) {
      toast.error('Vui lòng nhập họ và tên quản trị viên');
      return;
    }
    if (!formData.email.trim()) {
      toast.error('Vui lòng nhập email công vụ đăng nhập');
      return;
    }
    createMutation.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !createMutation.isPending && onOpenChange(v)}>
      <DialogContent
        className={`sm:max-w-[460px] p-6 rounded-2xl ${
          isLight
            ? 'bg-white text-slate-900 border-slate-200'
            : 'bg-slate-950 text-slate-100 border-slate-800'
        }`}
      >
        <DialogHeader className="pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-start gap-2.5">
            <div
              className={`w-9 h-9 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 ${
                isLight
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                  : 'bg-emerald-950/40 border-emerald-800 text-emerald-400'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <DialogTitle className="text-sm font-bold">
                Cấp tài khoản quản trị cơ sở y tế
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Tạo tài khoản bổ sung gắn vai trò HOSPITAL_ADMIN và gửi liên kết kích hoạt qua email (hiệu lực 24 giờ).
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2 text-xs">
          {/* 1. Cơ sở y tế trực thuộc */}
          <div className="space-y-1.5">
            <label className={`font-semibold flex items-center gap-1.5 ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
              <Building2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              Cơ sở y tế trực thuộc <span className="text-rose-500">*</span>
            </label>
            <select
              value={formData.hospitalId}
              onChange={(e) => setFormData({ ...formData, hospitalId: e.target.value })}
              className={`w-full h-10 px-3 rounded-lg border text-xs focus:outline-none focus:ring-1 focus:ring-emerald-600 ${
                isLight
                  ? 'bg-white border-slate-300 text-slate-900'
                  : 'bg-slate-900 border-slate-700 text-white'
              }`}
              required
            >
              <option value="">-- Chọn cơ sở y tế đối tác --</option>
              {hospitals.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name} {h.city ? `(${h.city})` : ''}
                </option>
              ))}
            </select>
            {isLoadingHospitals && (
              <span className="text-[11px] text-slate-400 flex items-center gap-1">
                <Loader2 className="w-3 h-3 animate-spin" /> Đang tải danh sách cơ sở...
              </span>
            )}
          </div>

          {/* 2. Họ và tên */}
          <div className="space-y-1.5">
            <label className={`font-semibold flex items-center gap-1.5 ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
              <User className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              Họ và tên quản trị viên <span className="text-rose-500">*</span>
            </label>
            <Input
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              placeholder="VD: Nguyễn Minh Anh — Phòng Kế hoạch Tổng hợp"
              className={`text-xs h-10 rounded-lg ${
                isLight
                  ? 'bg-white border-slate-300 text-slate-900'
                  : 'bg-slate-900 border-slate-700 text-white'
              }`}
              required
            />
          </div>

          {/* 3. Email công vụ */}
          <div className="space-y-1.5">
            <label className={`font-semibold flex items-center gap-1.5 ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
              <Mail className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              Email công vụ đăng nhập <span className="text-rose-500">*</span>
            </label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="quantri@benhvien.vn"
              className={`text-xs h-10 rounded-lg ${
                isLight
                  ? 'bg-white border-slate-300 text-slate-900'
                  : 'bg-slate-900 border-slate-700 text-white'
              }`}
              required
            />
          </div>

          {/* Ghi chú bảo mật */}
          <div
            className={`p-3 rounded-xl border text-[11px] leading-relaxed ${
              isLight
                ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                : 'bg-emerald-950/30 border-emerald-800/60 text-emerald-200'
            }`}
          >
            Tài khoản được tự động gán vai trò <strong>HOSPITAL_ADMIN</strong> trong phạm vi cơ sở y tế đã chọn và ở trạng thái chờ kích hoạt cho đến khi người nhận tự thiết lập mật khẩu qua email.
          </div>

          <DialogFooter className="pt-3 border-t border-slate-200 dark:border-slate-800 gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={createMutation.isPending}
              onClick={() => onOpenChange(false)}
              className="text-xs rounded-lg"
            >
              Hủy
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={createMutation.isPending}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-lg gap-1.5"
            >
              {createMutation.isPending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Đang cấp tài khoản...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Cấp tài khoản &amp; gửi email
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
