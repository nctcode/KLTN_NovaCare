'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { profileService } from '@/services/profile.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface PatientProfileFormProps {
  onSuccess: () => void;
}

export function PatientProfileForm({ onSuccess }: PatientProfileFormProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    gender: 'MALE' as 'MALE' | 'FEMALE' | 'OTHER',
    dateOfBirth: '',
    identityNumber: '',
    address: '',
    relation: 'Bản thân',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const mutation = useMutation({
    mutationFn: profileService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
      toast.success('Tạo hồ sơ bệnh nhân thành công!');
      onSuccess();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi tạo hồ sơ');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validate
    if (!formData.fullName.trim()) {
      setErrors((prev) => ({ ...prev, fullName: 'Họ tên không được để trống' }));
      return;
    }
    if (!formData.dateOfBirth) {
      setErrors((prev) => ({ ...prev, dateOfBirth: 'Ngày sinh không được để trống' }));
      return;
    }

    const payload = {
      fullName: formData.fullName,
      phone: formData.phone || undefined,
      gender: formData.gender,
      dateOfBirth: formData.dateOfBirth ? new Date(formData.dateOfBirth).toISOString() : undefined,
      identityNumber: formData.identityNumber || undefined,
      address: formData.address || undefined,
      relation: formData.relation || undefined,
    };

    mutation.mutate(payload);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-2">
      <div className="space-y-1.5">
        <Label htmlFor="fullName" className="text-xs font-semibold text-slate-700">Họ và tên *</Label>
        <Input
          id="fullName"
          value={formData.fullName}
          onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
          placeholder="Nguyễn Văn A"
          className={`bg-slate-50 border-slate-200 focus-visible:ring-slate-900 ${errors.fullName ? 'border-red-500' : ''}`}
        />
        {errors.fullName && <p className="text-xs text-red-500">{errors.fullName}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="gender" className="text-xs font-semibold text-slate-700">Giới tính</Label>
          <Select
            value={formData.gender}
            onValueChange={(val) => setFormData({ ...formData, gender: val as 'MALE' | 'FEMALE' | 'OTHER' })}
          >
            <SelectTrigger className="bg-slate-50 border-slate-200">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="MALE">Nam</SelectItem>
              <SelectItem value="FEMALE">Nữ</SelectItem>
              <SelectItem value="OTHER">Khác</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="dateOfBirth" className="text-xs font-semibold text-slate-700">Ngày sinh *</Label>
          <Input
            id="dateOfBirth"
            type="date"
            value={formData.dateOfBirth}
            onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
            className={`bg-slate-50 border-slate-200 focus-visible:ring-slate-900 ${errors.dateOfBirth ? 'border-red-500' : ''}`}
          />
          {errors.dateOfBirth && <p className="text-xs text-red-500">{errors.dateOfBirth}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="phone" className="text-xs font-semibold text-slate-700">Số điện thoại liên hệ</Label>
          <Input
            id="phone"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="0123456789"
            className="bg-slate-50 border-slate-200 focus-visible:ring-slate-900"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="identityNumber" className="text-xs font-semibold text-slate-700">Số CCCD / Hộ chiếu</Label>
          <Input
            id="identityNumber"
            value={formData.identityNumber}
            onChange={(e) => setFormData({ ...formData, identityNumber: e.target.value })}
            placeholder="Mã số CCCD"
            className="bg-slate-50 border-slate-200 focus-visible:ring-slate-900"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="relation" className="text-xs font-semibold text-slate-700">Mối quan hệ</Label>
        <Input
          id="relation"
          value={formData.relation}
          onChange={(e) => setFormData({ ...formData, relation: e.target.value })}
          placeholder="Bản thân, Bố, Mẹ, Con, Vợ/Chồng..."
          className="bg-slate-50 border-slate-200 focus-visible:ring-slate-900"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="address" className="text-xs font-semibold text-slate-700">Địa chỉ thường trú</Label>
        <Input
          id="address"
          value={formData.address}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          placeholder="Số nhà, đường, phường/xã, quận/huyện..."
          className="bg-slate-50 border-slate-200 focus-visible:ring-slate-900"
        />
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
        <Button type="submit" disabled={mutation.isPending} className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 text-white">
          {mutation.isPending ? (
            <>
              <Loader2 className="animate-spin mr-2 h-4 w-4" />
              Đang lưu hồ sơ...
            </>
          ) : (
            'Lưu hồ sơ'
          )}
        </Button>
      </div>
    </form>
  );
}
