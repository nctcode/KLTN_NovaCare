'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { Building2, Loader2, RotateCcw, Save } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { hospitalAdminService } from '@/services/hospital-admin.service';

interface HospitalDetails {
  id: string;
  name: string;
  city?: string | null;
  address?: string | null;
  phone?: string | null;
  hotline?: string | null;
  emergencyHotline?: string | null;
  operatingHours?: string | null;
  description?: string | null;
  website?: string | null;
  email?: string | null;
  status?: string;
  _count?: {
    workPlaces?: number;
    services?: number;
    packages?: number;
  };
}

type HospitalForm = Pick<
  HospitalDetails,
  | 'address'
  | 'phone'
  | 'hotline'
  | 'emergencyHotline'
  | 'operatingHours'
  | 'description'
  | 'website'
  | 'email'
>;

const hospitalQueryKey = ['hospital-admin-my-hospital'];

const editableFields: {
  name: keyof HospitalForm;
  label: string;
  type?: string;
  multiline?: boolean;
}[] = [
  { name: 'address', label: 'Địa chỉ', multiline: true },
  { name: 'phone', label: 'Số điện thoại', type: 'tel' },
  { name: 'hotline', label: 'Hotline', type: 'tel' },
  { name: 'emergencyHotline', label: 'Hotline cấp cứu', type: 'tel' },
  { name: 'email', label: 'Email', type: 'email' },
  { name: 'website', label: 'Website', type: 'url' },
  { name: 'operatingHours', label: 'Giờ hoạt động' },
  { name: 'description', label: 'Giới thiệu cơ sở y tế', multiline: true },
];

function toHospitalForm(hospital: HospitalDetails): HospitalForm {
  return {
    address: hospital.address || '',
    phone: hospital.phone || '',
    hotline: hospital.hotline || '',
    emergencyHotline: hospital.emergencyHotline || '',
    operatingHours: hospital.operatingHours || '',
    description: hospital.description || '',
    website: hospital.website || '',
    email: hospital.email || '',
  };
}

function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError<{ message?: string | string[] }>(error)) {
    const message = error.response?.data?.message;
    if (Array.isArray(message)) return message.join(', ');
    if (message) return message;
  }
  return error instanceof Error ? error.message : 'Vui lòng thử lại.';
}

export default function HospitalInfoPage() {
  const hospitalQuery = useQuery<HospitalDetails>({
    queryKey: hospitalQueryKey,
    queryFn: () => hospitalAdminService.getMyHospital(),
  });
  const hospital = hospitalQuery.data;

  if (hospitalQuery.isPending) {
    return (
      <div className="flex min-h-64 items-center justify-center">
        <Loader2 className="h-7 w-7 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (hospitalQuery.isError || !hospital) {
    return (
      <section className="rounded-2xl border border-rose-200 bg-white p-6">
        <h1 className="text-lg font-bold text-slate-900">Không tải được hồ sơ bệnh viện</h1>
        <p className="mt-2 text-sm text-slate-600">
          {getErrorMessage(hospitalQuery.error)}
        </p>
        <Button className="mt-4" onClick={() => void hospitalQuery.refetch()}>
          Thử tải lại
        </Button>
      </section>
    );
  }

  return <HospitalInfoEditor hospital={hospital} />;
}

function HospitalInfoEditor({ hospital }: { hospital: HospitalDetails }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(() => toHospitalForm(hospital));

  const updateMutation = useMutation({
    mutationFn: (data: HospitalForm) => hospitalAdminService.updateMyHospital(data),
    onSuccess: (updatedHospital: HospitalDetails) => {
      queryClient.setQueryData<HospitalDetails>(hospitalQueryKey, (current) =>
        current ? { ...current, ...updatedHospital } : updatedHospital,
      );
      queryClient.invalidateQueries({ queryKey: ['hospital-admin-dashboard'] });
      setForm(toHospitalForm(updatedHospital));
      toast.success('Đã cập nhật thông tin bệnh viện.');
    },
    onError: (error: unknown) => {
      toast.error(`Không thể cập nhật thông tin bệnh viện: ${getErrorMessage(error)}`);
    },
  });

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    updateMutation.mutate(form);
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header>
        <p className="text-sm font-semibold text-emerald-700">Quản lý cơ sở y tế</p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">Hồ sơ Bệnh viện</h1>
        <p className="mt-2 text-sm text-slate-600">
          Xem và cập nhật thông tin liên hệ, địa chỉ và giới thiệu của cơ sở.
        </p>
      </header>

      <section className="flex items-start gap-4 rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
          <Building2 className="h-6 w-6" />
        </div>
        <div className="min-w-0">
          <h2 className="truncate text-lg font-bold text-slate-900">{hospital.name}</h2>
          <p className="mt-1 text-sm text-slate-500">
            {[hospital.city, hospital.address].filter(Boolean).join(' · ') || 'Chưa cập nhật địa chỉ'}
          </p>
          <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-600">
            <span className="rounded-full bg-slate-100 px-3 py-1">
              Bác sĩ: {hospital._count?.workPlaces ?? 0}
            </span>
            <span className="rounded-full bg-slate-100 px-3 py-1">
              Dịch vụ: {hospital._count?.services ?? 0}
            </span>
            <span className="rounded-full bg-slate-100 px-3 py-1">
              Gói khám: {hospital._count?.packages ?? 0}
            </span>
          </div>
        </div>
      </section>

      <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="grid gap-5 sm:grid-cols-2">
          {editableFields.map((field) => (
            <label
              key={field.name}
              className={`block space-y-1.5 ${field.multiline ? 'sm:col-span-2' : ''}`}
            >
              <span className="text-sm font-medium text-slate-700">{field.label}</span>
              {field.multiline ? (
                <textarea
                  rows={field.name === 'description' ? 5 : 2}
                  value={form[field.name] || ''}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, [field.name]: event.target.value }))
                  }
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />
              ) : (
                <input
                  type={field.type || 'text'}
                  value={form[field.name] || ''}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, [field.name]: event.target.value }))
                  }
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />
              )}
            </label>
          ))}
        </div>

        <div className="mt-6 flex flex-wrap justify-end gap-3 border-t border-slate-100 pt-5">
          <Button
            type="button"
            variant="outline"
            disabled={updateMutation.isPending}
            onClick={() => setForm(toHospitalForm(hospital))}
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            Hoàn tác
          </Button>
          <Button type="submit" disabled={updateMutation.isPending}>
            {updateMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Lưu thay đổi
          </Button>
        </div>
      </form>
    </div>
  );
}
