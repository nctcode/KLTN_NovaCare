'use client';

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { hospitalAdminService } from '@/services/hospital-admin.service';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import {
  Building2,
  Phone,
  Clock,
  MapPin,
  Mail,
  Globe,
  Loader2,
  Save,
  ShieldCheck,
} from 'lucide-react';

export default function HospitalInfoPage() {
  const queryClient = useQueryClient();

  const { data: hospital, isLoading } = useQuery({
    queryKey: ['hospital-admin-my-hospital'],
    queryFn: hospitalAdminService.getMyHospital,
  });

  const [formData, setFormData] = useState({
    phone: '',
    hotline: '',
    emergencyHotline: '',
    address: '',
    operatingHours: '',
    email: '',
    website: '',
    description: '',
  });

  useEffect(() => {
    if (hospital) {
      setFormData({
        phone: hospital.phone || '',
        hotline: hospital.hotline || '',
        emergencyHotline: hospital.emergencyHotline || '',
        address: hospital.address || '',
        operatingHours: hospital.operatingHours || '',
        email: hospital.email || '',
        website: hospital.website || '',
        description: hospital.description || '',
      });
    }
  }, [hospital]);

  const updateMutation = useMutation({
    mutationFn: (data: typeof formData) => hospitalAdminService.updateMyHospital(data),
    onSuccess: () => {
      toast.success('Cập nhật thông tin cơ sở y tế thành công!');
      queryClient.invalidateQueries({ queryKey: ['hospital-admin-my-hospital'] });
      queryClient.invalidateQueries({ queryKey: ['hospital-admin-dashboard'] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Không thể cập nhật thông tin bệnh viện');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <div className="py-20 text-center text-slate-500">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-emerald-600 mb-2" />
        Đang tải thông tin cơ sở...
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Page Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
          <Building2 className="w-6 h-6 text-emerald-600" />
          Hồ Sơ & Thông Tin Cơ Sở Y Tế
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Cập nhật thông tin liên hệ, hotline cấp cứu và thời gian làm việc để bệnh nhân tra cứu chính xác.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Read-only Platform Metadata */}
        <Card className="bg-white border-slate-200 text-slate-900 shadow-sm rounded-2xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Thông tin định danh do Nền tảng quản lý
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[11px] text-slate-500 block mb-1">Tên cơ sở y tế</span>
              <span className="font-bold text-slate-900 text-sm">{hospital?.name}</span>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[11px] text-slate-500 block mb-1">Loại hình / Quy mô</span>
              <span className="font-bold text-slate-900 text-sm">
                {hospital?.type || 'PUBLIC'} ({hospital?.bedCount || '—'} giường)
              </span>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[11px] text-slate-500 block mb-1">Mã kết nối HIS / External ID</span>
              <span className="font-bold font-mono text-emerald-700 text-sm">
                {hospital?.externalId || hospital?.hospitalCode || 'NOVA_CORE'}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Editable Contact & Operations */}
        <Card className="bg-white border-slate-200 text-slate-900 shadow-sm rounded-2xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Phone className="w-4 h-4 text-emerald-600" />
              Kênh Liên Hệ & Vận Hành
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Những thông tin này được hiển thị công khai trên ứng dụng đặt lịch của bệnh nhân.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-500" />
                  Số điện thoại bàn:
                </label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="028 1234 5678"
                  className="bg-slate-50 border-slate-200 text-slate-900 text-xs h-9 rounded-xl focus:bg-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-amber-600" />
                  Hotline tổng đài tư vấn:
                </label>
                <Input
                  value={formData.hotline}
                  onChange={(e) => setFormData({ ...formData, hotline: e.target.value })}
                  placeholder="1900 1234"
                  className="bg-slate-50 border-slate-200 text-slate-900 text-xs h-9 rounded-xl focus:bg-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-rose-700 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-rose-600" />
                  Hotline Cấp cứu (24/7):
                </label>
                <Input
                  value={formData.emergencyHotline}
                  onChange={(e) => setFormData({ ...formData, emergencyHotline: e.target.value })}
                  placeholder="115 hoặc 090 999 9999"
                  className="bg-rose-50 border-rose-200 text-rose-700 text-xs h-9 font-bold rounded-xl focus:bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  Thời gian làm việc / Khám bệnh:
                </label>
                <Input
                  value={formData.operatingHours}
                  onChange={(e) => setFormData({ ...formData, operatingHours: e.target.value })}
                  placeholder="7:00 - 17:00 (Thứ 2 - Thứ 7)"
                  className="bg-slate-50 border-slate-200 text-slate-900 text-xs h-9 rounded-xl focus:bg-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-500" />
                  Địa chỉ cơ sở:
                </label>
                <Input
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Số nhà, đường, phường, quận/huyện..."
                  className="bg-slate-50 border-slate-200 text-slate-900 text-xs h-9 rounded-xl focus:bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-500" />
                  Email tiếp nhận liên hệ:
                </label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="contact@benhvien.vn"
                  className="bg-slate-50 border-slate-200 text-slate-900 text-xs h-9 rounded-xl focus:bg-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-slate-500" />
                  Website chính thức:
                </label>
                <Input
                  type="url"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  placeholder="https://benhvien.vn"
                  className="bg-slate-50 border-slate-200 text-slate-900 text-xs h-9 rounded-xl focus:bg-white"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700">
                Mô tả giới thiệu cơ sở y tế:
              </label>
              <Textarea
                rows={4}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Giới thiệu về thế mạnh chuyên khoa, cơ sở vật chất, đội ngũ giáo sư bác sĩ..."
                className="bg-slate-50 border-slate-200 text-slate-900 text-xs rounded-xl focus:bg-white"
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button
            type="submit"
            disabled={updateMutation.isPending}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-10 px-6 rounded-xl shadow-md gap-2 shadow-emerald-600/20"
          >
            {updateMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Đang lưu...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Lưu Thay Đổi Thông Tin
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
