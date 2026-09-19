'use client';

import * as React from 'react';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminService } from '@/services/admin.service';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import {
  ShieldAlert,
  Building2,
  Mail,
  Lock,
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

  const [formData, setFormData] = useState({
    hospitalId: '',
    email: '',
    password: '',
  });

  // Query hospitals list for dropdown
  const { data: hospitalsData, isLoading: isLoadingHospitals } = useQuery({
    queryKey: ['admin-hospitals-simple-list'],
    queryFn: () => adminService.getHospitals({ limit: 100 }),
    enabled: open,
  });

  const hospitals: any[] = hospitalsData?.items || [];

  const createMutation = useMutation({
    mutationFn: (data: typeof formData) =>
      adminService.createHospitalAdmin({
        ...data,
        fullName: 'Quản trị viên Bệnh viện',
      }),
    onSuccess: () => {
      toast.success('Cấp tài khoản Quản trị viên Bệnh viện thành công!');
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-recent-audit-logs'] });
      setFormData({
        hospitalId: '',
        email: '',
        password: '',
      });
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Không thể cấp tài khoản Quản trị viên');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.hospitalId) {
      toast.error('Vui lòng chọn cơ sở y tế trực thuộc');
      return;
    }
    if (!formData.email.trim()) {
      toast.error('Vui lòng nhập tài khoản / email đăng nhập');
      return;
    }
    if (!formData.password.trim() || formData.password.length < 6) {
      toast.error('Mật khẩu khởi tạo phải có ít nhất 6 ký tự');
      return;
    }
    createMutation.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] bg-slate-900 border-slate-800 text-slate-100 p-0 overflow-hidden shadow-2xl">
        <div className="bg-gradient-to-r from-[#0c4b39] to-emerald-900 p-6 text-white border-b border-emerald-800/40">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-[#66FF33] shadow-inner">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold text-white tracking-tight">
                  Cấp Tài Khoản Quản Trị Viện (Hospital Admin)
                </DialogTitle>
                <DialogDescription className="text-xs text-emerald-200/90 mt-0.5">
                  Chỉ định cơ sở y tế, tài khoản đăng nhập và mật khẩu khởi tạo.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {/* 1. Chọn Cơ sở Bệnh viện */}
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-300 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-emerald-400" />
              Cơ sở y tế trực thuộc <span className="text-rose-400">*</span>
            </label>
            <select
              value={formData.hospitalId}
              onChange={(e) => setFormData({ ...formData, hospitalId: e.target.value })}
              className="w-full h-10 px-3 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-emerald-500"
              required
            >
              <option value="">-- Chọn cơ sở bệnh viện quản lý --</option>
              {hospitals.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name} {h.city ? `(${h.city})` : ''}
                </option>
              ))}
            </select>
            {isLoadingHospitals && (
              <span className="text-[11px] text-slate-500 flex items-center gap-1">
                <Loader2 className="w-3 h-3 animate-spin" /> Đang tải danh sách cơ sở...
              </span>
            )}
          </div>

          {/* 2. Tài khoản / Email */}
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-300 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-emerald-400" />
              Tài khoản / Email đăng nhập <span className="text-rose-400">*</span>
            </label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="admin.bv@novacare.vn"
              className="bg-slate-950 border-slate-700 text-white text-xs h-10"
              required
            />
          </div>

          {/* 3. Mật khẩu khởi tạo */}
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-300 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-emerald-400" />
              Mật khẩu khởi tạo <span className="text-rose-400">*</span>
            </label>
            <Input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="Tối thiểu 6 ký tự"
              className="bg-slate-950 border-slate-700 text-white text-xs h-10"
              required
              minLength={6}
            />
          </div>

          <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-[11px] leading-relaxed">
            * Tài khoản này được tự động gán quyền <strong>HOSPITAL_ADMIN</strong> và chỉ được phép quản lý dữ liệu nội bộ thuộc cơ sở y tế được chọn.
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs h-9"
            >
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending}
              className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs h-9 px-4 rounded-lg shadow-sm"
            >
              {createMutation.isPending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                  Đang tạo...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                  Cấp tài khoản
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
