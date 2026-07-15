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
    <form onSubmit={handleSubmit} className="space-y-4 pt-4">
      <div className="space-y-2">
        <Label htmlFor="fullName">Họ và tên *</Label>
        <Input
          id="fullName"
          value={formData.fullName}
          onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
          placeholder="Nguyễn Văn A"
          className={errors.fullName ? 'border-danger' : ''}
        />
        {errors.fullName && <p className="text-xs text-danger">{errors.fullName}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="gender">Giới tính</Label>
          <Select
            value={formData.gender}
            onValueChange={(val) => setFormData({ ...formData, gender: val as 'MALE' | 'FEMALE' | 'OTHER' })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="MALE">Nam</SelectItem>
              <SelectItem value="FEMALE">Nữ</SelectItem>
              <SelectItem value="OTHER">Khác</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="dateOfBirth">Ngày sinh *</Label>
          <Input
            id="dateOfBirth"
            type="date"
            value={formData.dateOfBirth}
            onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
            className={errors.dateOfBirth ? 'border-danger' : ''}
          />
          {errors.dateOfBirth && <p className="text-xs text-danger">{errors.dateOfBirth}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="phone">Số điện thoại liên hệ</Label>
          <Input
            id="phone"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="0123456789"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="identityNumber">Số CCCD / Hộ chiếu</Label>
          <Input
            id="identityNumber"
            value={formData.identityNumber}
            onChange={(e) => setFormData({ ...formData, identityNumber: e.target.value })}
            placeholder="Số CCCD"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="relation">Mối quan hệ</Label>
        <Input
          id="relation"
          value={formData.relation}
          onChange={(e) => setFormData({ ...formData, relation: e.target.value })}
          placeholder="Ví dụ: Bản thân, Bố, Mẹ, Con..."
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">Địa chỉ thường trú</Label>
        <Input
          id="address"
          value={formData.address}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          placeholder="Số nhà, đường, phường/xã, quận/huyện..."
        />
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button type="submit" disabled={mutation.isPending} className="w-full sm:w-auto">
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
