'use client';

import * as React from 'react';
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService } from '@/services/admin.service';
import { useAdminTheme } from '@/components/admin/AdminThemeContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  Building2,
  Phone,
  MapPin,
  Upload,
  Image as ImageIcon,
  AlertCircle,
  X,
  Plus,
  Loader2,
  Globe,
  Mail,
  Clock3,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface CreateHospitalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (newHospital?: any) => void;
}

const initialFormData = {
  name: '',
  type: 'Công',
  establishedYear: '',
  bedCount: '',
  logoUrl: '',
  coverImageUrl: '',
  description: '',
  hotline: '',
  emergencyHotline: '',
  phone: '',
  email: '',
  website: '',
  city: 'TP. Hồ Chí Minh',
  address: '',
  googleMapUrl: '',
  latitude: '',
  longitude: '',
  operatingHours: '07:00 - 17:00 (Thứ 2 - Thứ 7)',
  status: 'Hoạt động',
  isActive: true,
};

const steps = [
  { label: 'Thông tin chung', description: 'Thông tin nhận diện bệnh viện' },
  { label: 'Liên hệ & địa chỉ', description: 'Thông tin liên lạc và vị trí' },
  { label: 'Vận hành', description: 'Thiết lập trạng thái hoạt động' },
];

export function CreateHospitalDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreateHospitalDialogProps) {
  const queryClient = useQueryClient();
  const { theme } = useAdminTheme();
  const isLight = theme === 'light';

  const [formData, setFormData] = useState(initialFormData);
  const [step, setStep] = useState(1);
  const [albumImages, setAlbumImages] = useState<string[]>([]);
  const [newAlbumUrl, setNewAlbumUrl] = useState('');
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [showMedia, setShowMedia] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState('');

  const surface = isLight
    ? 'bg-white text-slate-900'
    : 'bg-slate-950 text-slate-100';
  const muted = isLight ? 'text-slate-500' : 'text-slate-400';
  const border = isLight ? 'border-slate-200' : 'border-slate-800';
  const fieldClass = isLight
    ? 'border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus-visible:ring-emerald-700'
    : 'border-slate-700 bg-slate-900 text-slate-100 placeholder:text-slate-500 focus-visible:ring-emerald-500';

  const resetForm = () => {
    setFormData(initialFormData);
    setAlbumImages([]);
    setNewAlbumUrl('');
    setLogoPreview(null);
    setCoverPreview(null);
    setShowMedia(false);
    setErrors({});
    setSubmitError('');
    setStep(1);
  };

  const handleClose = () => {
    resetForm();
    onOpenChange(false);
  };

  const validateStep = (currentStep: number) => {
    const nextErrors: Record<string, string> = {};

    if (currentStep === 1 && !formData.name.trim()) {
      nextErrors.name = 'Vui lòng nhập tên bệnh viện.';
    }

    if (currentStep === 2) {
      if (!formData.hotline.trim() && !formData.phone.trim()) {
        nextErrors.hotline = 'Vui lòng nhập hotline hoặc số điện thoại.';
      }
      if (!formData.city.trim()) {
        nextErrors.city = 'Vui lòng chọn tỉnh/thành phố.';
      }
      if (!formData.address.trim()) {
        nextErrors.address = 'Vui lòng nhập địa chỉ chi tiết.';
      }
    }

    setErrors((current) => ({ ...current, ...nextErrors }));
    return Object.keys(nextErrors).length === 0;
  };

  const createMutation = useMutation({
    mutationFn: (payload: any) => adminService.createHospital(payload),
    onError: (error: any) => {
      setSubmitError(
        error?.response?.data?.message ||
          'Không thể tạo bệnh viện. Vui lòng kiểm tra thông tin và thử lại.',
      );
    },
    onSuccess: (newHospital) => {
      queryClient.invalidateQueries({ queryKey: ['admin-hospitals'] });
      resetForm();
      onOpenChange(false);
      onSuccess?.(newHospital);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const submitter = (e.nativeEvent as SubmitEvent).submitter as HTMLElement | null;
    if (submitter?.dataset.action !== 'create-hospital') {
      if (step < 3) goNext();
      return;
    }
    if (step < 3) {
      return;
    }
    if (!validateStep(1) || !validateStep(2)) return;

    const typeMap: Record<string, string> = {
      Công: 'PUBLIC',
      'Tư nhân': 'PRIVATE',
      'Quốc tế': 'INTERNATIONAL',
    };
    const statusMap: Record<string, string> = {
      'Hoạt động': 'ACTIVE',
      'Tạm ngưng': 'PAUSED',
      'Ngừng hợp tác': 'TERMINATED',
    };

    const payload = {
      name: formData.name.trim(),
      type: typeMap[formData.type] || formData.type,
      establishedYear: formData.establishedYear
        ? parseInt(formData.establishedYear, 10)
        : undefined,
      bedCount: formData.bedCount
        ? parseInt(formData.bedCount, 10)
        : undefined,
      logoUrl:
        logoPreview ||
        formData.logoUrl ||
        'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?w=120&auto=format&fit=crop&q=80',
      coverImageUrl:
        coverPreview ||
        formData.coverImageUrl ||
        'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=1600&q=80',
      images: albumImages.filter(Boolean),
      description: formData.description.trim() || undefined,
      hotline: formData.hotline.trim() || formData.phone.trim(),
      emergencyHotline: formData.emergencyHotline.trim() || undefined,
      phone: formData.phone.trim() || formData.hotline.trim(),
      email: formData.email.trim() || undefined,
      website: formData.website.trim() || undefined,
      city: formData.city.trim(),
      address: formData.address.trim(),
      googleMapUrl: formData.googleMapUrl.trim() || undefined,
      latitude: formData.latitude ? parseFloat(formData.latitude) : undefined,
      longitude: formData.longitude ? parseFloat(formData.longitude) : undefined,
      operatingHours: formData.operatingHours.trim() || undefined,
      status: statusMap[formData.status] || formData.status,
      isActive: formData.isActive,
      rating: 0,
      reviewCount: 0,
    };

    createMutation.mutate(payload);
  };

  const goNext = () => {
    if (!validateStep(step)) return;
    setStep((current) => Math.min(current + 1, 3));
  };

  const updateField = (field: keyof typeof initialFormData, value: string | boolean) => {
    setFormData((current) => ({ ...current, [field]: value }));
    if (errors[field]) {
      setErrors((current) => ({ ...current, [field]: '' }));
    }
  };

  const handleFile = (
    event: React.ChangeEvent<HTMLInputElement>,
    type: 'logo' | 'cover',
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    if (type === 'logo') setLogoPreview(url);
    else setCoverPreview(url);
  };

  const addAlbumUrl = () => {
    const value = newAlbumUrl.trim();
    if (!value) return;
    setAlbumImages((current) => [...current, value]);
    setNewAlbumUrl('');
  };

  const addAlbumFiles = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setAlbumImages((current) => [
      ...current,
      ...files.map((file) => URL.createObjectURL(file)),
    ]);
    event.target.value = '';
  };

  const FieldError = ({ name }: { name: string }) =>
    errors[name] ? (
      <p className="mt-1 flex items-center gap-1 text-xs text-rose-500">
        <AlertCircle className="h-3.5 w-3.5 shrink-0" />
        {errors[name]}
      </p>
    ) : null;

  const Label = ({
    children,
    required = false,
  }: {
    children: React.ReactNode;
    required?: boolean;
  }) => (
    <label className="mb-1.5 block text-sm font-medium">
      {children}
      {required && <span className="ml-1 text-rose-500">*</span>}
    </label>
  );

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) handleClose();
        else onOpenChange(true);
      }}
    >
      <DialogContent
        className={`max-h-[92vh] max-w-2xl overflow-y-auto rounded-xl border p-0 shadow-xl ${surface} ${border}`}
      >
        <DialogHeader className={`border-b px-6 py-5 text-left ${border}`}>
          <div className="flex items-start gap-3">
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                isLight
                  ? 'bg-emerald-50 text-emerald-800'
                  : 'bg-emerald-950 text-emerald-400'
              }`}
            >
              <Building2 className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <DialogTitle className="text-lg font-semibold tracking-tight">
                Thêm bệnh viện đối tác
              </DialogTitle>
              <DialogDescription className={`mt-1 text-sm ${muted}`}>
                Nhập thông tin cơ bản để tạo hồ sơ bệnh viện trên NovaCare.
              </DialogDescription>
            </div>
          </div>

          <div className="mt-5">
            <div className="mb-3 flex items-center justify-between text-xs">
              <span className="font-medium text-emerald-700 dark:text-emerald-400">
                Bước {step}/3
              </span>
              <span className={muted}>{steps[step - 1].description}</span>
            </div>
            <div className="mb-3 flex gap-1.5">
              {steps.map((item, index) => (
                <div
                  key={item.label}
                  className={`h-1 flex-1 rounded-full ${
                    index < step
                      ? 'bg-emerald-700 dark:bg-emerald-500'
                      : isLight
                        ? 'bg-slate-200'
                        : 'bg-slate-800'
                  }`}
                />
              ))}
            </div>
            <div className="grid grid-cols-3 gap-2">
              {steps.map((item, index) => (
                <button
                  key={item.label}
                  type="button"
                  disabled={index + 1 > step}
                  onClick={() => setStep(index + 1)}
                  className={`text-left text-xs transition-colors disabled:cursor-default ${
                    step === index + 1
                      ? 'font-semibold text-slate-900 dark:text-white'
                      : muted
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="px-6 pb-6">
          {step === 1 && (
            <section className="space-y-5 py-5">
              <div>
                <h3 className="text-sm font-semibold">Thông tin chung</h3>
                <p className={`mt-1 text-xs ${muted}`}>
                  Các thông tin nhận diện và giới thiệu bệnh viện.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="sm:col-span-2">
                  <Label required>Tên bệnh viện</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => updateField('name', e.target.value)}
                    placeholder="Ví dụ: Bệnh viện Đa khoa An Bình"
                    className={fieldClass}
                  />
                  <FieldError name="name" />
                </div>
                <div>
                  <Label>Loại hình</Label>
                  <select
                    value={formData.type}
                    onChange={(e) => updateField('type', e.target.value)}
                    className={`h-10 w-full rounded-md border px-3 text-sm outline-none focus:ring-2 focus:ring-emerald-700 ${fieldClass}`}
                  >
                    <option value="Công">Công lập</option>
                    <option value="Tư nhân">Tư nhân</option>
                    <option value="Quốc tế">Quốc tế</option>
                  </select>
                </div>
                <div>
                  <Label>Năm thành lập</Label>
                  <Input
                    type="number"
                    min="1800"
                    max="2100"
                    value={formData.establishedYear}
                    onChange={(e) => updateField('establishedYear', e.target.value)}
                    placeholder="Ví dụ: 1995"
                    className={fieldClass}
                  />
                </div>
                <div>
                  <Label>Quy mô giường bệnh</Label>
                  <Input
                    type="number"
                    min="0"
                    value={formData.bedCount}
                    onChange={(e) => updateField('bedCount', e.target.value)}
                    placeholder="Ví dụ: 500"
                    className={fieldClass}
                  />
                </div>
              </div>

              <div>
                <Label>Giới thiệu bệnh viện</Label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => updateField('description', e.target.value)}
                  placeholder="Giới thiệu ngắn về quy mô, chuyên môn và thế mạnh của bệnh viện..."
                  className={`w-full resize-y rounded-md border px-3 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-emerald-700 ${fieldClass}`}
                />
              </div>

              <div className={`rounded-lg border ${border}`}>
                <button
                  type="button"
                  onClick={() => setShowMedia((value) => !value)}
                  className="flex w-full items-center justify-between px-4 py-3 text-left"
                >
                  <div className="flex items-center gap-2">
                    <ImageIcon className={`h-4 w-4 ${muted}`} />
                    <div>
                      <p className="text-sm font-medium">Hình ảnh bệnh viện</p>
                      <p className={`mt-0.5 text-xs ${muted}`}>
                        Không bắt buộc · Có thể bổ sung sau
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
                    {showMedia ? 'Thu gọn' : 'Thêm hình ảnh'}
                  </span>
                </button>

                {showMedia && (
                  <div className={`space-y-4 border-t px-4 py-4 ${border}`}>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <Label>Logo</Label>
                        <div className={`relative flex h-28 items-center justify-center overflow-hidden rounded-md border border-dashed ${border} ${isLight ? 'bg-slate-50' : 'bg-slate-900'}`}>
                          {logoPreview || formData.logoUrl ? (
                            <>
                              <img
                                src={logoPreview || formData.logoUrl}
                                alt="Logo bệnh viện"
                                className="h-full w-full object-contain p-2"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  setLogoPreview(null);
                                  updateField('logoUrl', '');
                                }}
                                className="absolute right-2 top-2 rounded bg-white p-1 text-slate-700 shadow"
                                aria-label="Xóa logo"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </>
                          ) : (
                            <label className={`flex h-full w-full cursor-pointer flex-col items-center justify-center gap-1 text-xs ${muted}`}>
                              <Upload className="h-5 w-5" />
                              Chọn ảnh logo
                              <input type="file" accept="image/*" onChange={(e) => handleFile(e, 'logo')} className="hidden" />
                            </label>
                          )}
                        </div>
                        <Input
                          value={formData.logoUrl}
                          onChange={(e) => updateField('logoUrl', e.target.value)}
                          placeholder="Hoặc nhập URL logo"
                          className={`mt-2 ${fieldClass}`}
                        />
                      </div>

                      <div>
                        <Label>Ảnh bìa</Label>
                        <div className={`relative flex h-28 items-center justify-center overflow-hidden rounded-md border border-dashed ${border} ${isLight ? 'bg-slate-50' : 'bg-slate-900'}`}>
                          {coverPreview || formData.coverImageUrl ? (
                            <>
                              <img
                                src={coverPreview || formData.coverImageUrl}
                                alt="Ảnh bìa bệnh viện"
                                className="h-full w-full object-cover"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  setCoverPreview(null);
                                  updateField('coverImageUrl', '');
                                }}
                                className="absolute right-2 top-2 rounded bg-white p-1 text-slate-700 shadow"
                                aria-label="Xóa ảnh bìa"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </>
                          ) : (
                            <label className={`flex h-full w-full cursor-pointer flex-col items-center justify-center gap-1 text-xs ${muted}`}>
                              <ImageIcon className="h-5 w-5" />
                              Chọn ảnh bìa
                              <input type="file" accept="image/*" onChange={(e) => handleFile(e, 'cover')} className="hidden" />
                            </label>
                          )}
                        </div>
                        <Input
                          value={formData.coverImageUrl}
                          onChange={(e) => updateField('coverImageUrl', e.target.value)}
                          placeholder="Hoặc nhập URL ảnh bìa"
                          className={`mt-2 ${fieldClass}`}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="mb-2 flex items-center justify-between">
                        <Label>Album ảnh</Label>
                        <label className="cursor-pointer text-xs font-medium text-emerald-700 dark:text-emerald-400">
                          Tải ảnh lên
                          <input type="file" accept="image/*" multiple onChange={addAlbumFiles} className="hidden" />
                        </label>
                      </div>
                      <div className="flex gap-2">
                        <Input
                          value={newAlbumUrl}
                          onChange={(e) => setNewAlbumUrl(e.target.value)}
                          placeholder="Nhập URL ảnh"
                          className={fieldClass}
                        />
                        <Button type="button" variant="outline" onClick={addAlbumUrl} className="shrink-0">
                          <Plus className="mr-1 h-4 w-4" />
                          Thêm
                        </Button>
                      </div>
                      {albumImages.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {albumImages.map((url, index) => (
                            <div key={`${url}-${index}`} className="relative h-16 w-16 overflow-hidden rounded border">
                              <img src={url} alt={`Ảnh bệnh viện ${index + 1}`} className="h-full w-full object-cover" />
                              <button
                                type="button"
                                onClick={() => setAlbumImages((current) => current.filter((_, i) => i !== index))}
                                className="absolute right-1 top-1 rounded bg-white p-0.5 text-slate-700"
                                aria-label="Xóa ảnh"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </section>
          )}

          {step === 2 && (
            <section className="space-y-5 py-5">
              <div>
                <h3 className="text-sm font-semibold">Liên hệ và địa chỉ</h3>
                <p className={`mt-1 text-xs ${muted}`}>
                  Cung cấp thông tin để bệnh nhân có thể liên hệ và tìm đến bệnh viện.
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Phone className={`h-4 w-4 ${muted}`} />
                  Thông tin liên hệ
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label required>Hotline đặt khám</Label>
                    <Input
                      value={formData.hotline}
                      onChange={(e) => {
                        updateField('hotline', e.target.value);
                        if (!formData.phone) updateField('phone', e.target.value);
                      }}
                      placeholder="Ví dụ: 028 1234 5678"
                      className={fieldClass}
                    />
                    <FieldError name="hotline" />
                  </div>
                  <div>
                    <Label>Hotline cấp cứu</Label>
                    <Input
                      value={formData.emergencyHotline}
                      onChange={(e) => updateField('emergencyHotline', e.target.value)}
                      placeholder="Ví dụ: 115"
                      className={fieldClass}
                    />
                  </div>
                  <div>
                    <Label>Số điện thoại khác</Label>
                    <Input
                      value={formData.phone}
                      onChange={(e) => updateField('phone', e.target.value)}
                      placeholder="Số điện thoại liên hệ"
                      className={fieldClass}
                    />
                  </div>
                  <div>
                    <Label>Email</Label>
                    <div className="relative">
                      <Mail className={`absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${muted}`} />
                      <Input
                        type="email"
                        value={formData.email}
                        onChange={(e) => updateField('email', e.target.value)}
                        placeholder="contact@benhvien.vn"
                        className={`pl-9 ${fieldClass}`}
                      />
                    </div>
                  </div>
                  <div className="sm:col-span-2">
                    <Label>Website</Label>
                    <div className="relative">
                      <Globe className={`absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${muted}`} />
                      <Input
                        value={formData.website}
                        onChange={(e) => updateField('website', e.target.value)}
                        placeholder="https://benhvien.vn"
                        className={`pl-9 ${fieldClass}`}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className={`border-t pt-4 ${border}`}>
                <div className="mb-4 flex items-center gap-2 text-sm font-medium">
                  <MapPin className={`h-4 w-4 ${muted}`} />
                  Địa chỉ bệnh viện
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <Label required>Tỉnh / Thành phố</Label>
                    <select
                      value={formData.city}
                      onChange={(e) => updateField('city', e.target.value)}
                      className={`h-10 w-full rounded-md border px-3 text-sm outline-none focus:ring-2 focus:ring-emerald-700 ${fieldClass}`}
                    >
                      <option value="TP. Hồ Chí Minh">TP. Hồ Chí Minh</option>
                      <option value="Hà Nội">Hà Nội</option>
                      <option value="Đà Nẵng">Đà Nẵng</option>
                      <option value="Cần Thơ">Cần Thơ</option>
                      <option value="Hải Phòng">Hải Phòng</option>
                      <option value="Thừa Thiên Huế">Thừa Thiên Huế</option>
                      <option value="Bình Dương">Bình Dương</option>
                      <option value="Đồng Nai">Đồng Nai</option>
                      <option value="Quảng Ninh">Quảng Ninh</option>
                    </select>
                    <FieldError name="city" />
                  </div>
                  <div className="sm:col-span-2">
                    <Label required>Địa chỉ chi tiết</Label>
                    <Input
                      value={formData.address}
                      onChange={(e) => updateField('address', e.target.value)}
                      placeholder="Số nhà, đường, phường/xã..."
                      className={fieldClass}
                    />
                    <FieldError name="address" />
                  </div>
                  <div className="sm:col-span-3">
                    <Label>Google Maps URL</Label>
                    <Input
                      value={formData.googleMapUrl}
                      onChange={(e) => updateField('googleMapUrl', e.target.value)}
                      placeholder="Dán liên kết Google Maps"
                      className={fieldClass}
                    />
                  </div>
                  <div>
                    <Label>Vĩ độ</Label>
                    <Input
                      type="number"
                      step="any"
                      value={formData.latitude}
                      onChange={(e) => updateField('latitude', e.target.value)}
                      placeholder="10.7769"
                      className={fieldClass}
                    />
                  </div>
                  <div>
                    <Label>Kinh độ</Label>
                    <Input
                      type="number"
                      step="any"
                      value={formData.longitude}
                      onChange={(e) => updateField('longitude', e.target.value)}
                      placeholder="106.7009"
                      className={fieldClass}
                    />
                  </div>
                </div>
              </div>
            </section>
          )}

          {step === 3 && (
            <section className="space-y-5 py-5">
              <div>
                <h3 className="text-sm font-semibold">Thông tin vận hành</h3>
                <p className={`mt-1 text-xs ${muted}`}>
                  Thiết lập thời gian và trạng thái hợp tác của bệnh viện.
                </p>
              </div>

              <div>
                <Label>Giờ làm việc</Label>
                <div className="relative">
                  <Clock3 className={`absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${muted}`} />
                  <Input
                    value={formData.operatingHours}
                    onChange={(e) => updateField('operatingHours', e.target.value)}
                    placeholder="07:00 - 17:00 (Thứ 2 - Thứ 7)"
                    className={`pl-9 ${fieldClass}`}
                  />
                </div>
              </div>

              <div>
                <Label>Trạng thái hợp tác</Label>
                <div className="grid gap-2 sm:grid-cols-3">
                  {[
                    { value: 'Hoạt động', label: 'Đang hợp tác', dot: 'bg-emerald-500' },
                    { value: 'Tạm ngưng', label: 'Tạm ngưng', dot: 'bg-amber-500' },
                    { value: 'Ngừng hợp tác', label: 'Ngừng hợp tác', dot: 'bg-rose-500' },
                  ].map((item) => (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => updateField('status', item.value)}
                      className={`flex items-center gap-2 rounded-md border px-3 py-3 text-left text-sm transition ${
                        formData.status === item.value
                          ? 'border-emerald-700 bg-emerald-50 text-emerald-900 ring-1 ring-emerald-700 dark:border-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300'
                          : `${border} ${isLight ? 'hover:bg-slate-50' : 'hover:bg-slate-900'}`
                      }`}
                    >
                      <span className={`h-2 w-2 rounded-full ${item.dot}`} />
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className={`rounded-lg border p-4 ${border}`}>
                <Switch
                  checked={formData.isActive}
                  onCheckedChange={(checked) => updateField('isActive', checked)}
                  label="Hiển thị trên NovaCare"
                  description="Bệnh nhân có thể tìm kiếm và xem thông tin bệnh viện."
                />
              </div>

              <div className={`rounded-lg p-4 ${isLight ? 'bg-slate-50' : 'bg-slate-900'}`}>
                <p className="text-sm font-medium">Kiểm tra trước khi tạo</p>
                <dl className={`mt-3 grid grid-cols-1 gap-2 text-sm sm:grid-cols-2 ${muted}`}>
                  <div>
                    <dt className="text-xs">Tên bệnh viện</dt>
                    <dd className="mt-0.5 font-medium text-slate-900 dark:text-slate-100">
                      {formData.name || 'Chưa nhập'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs">Loại hình</dt>
                    <dd className="mt-0.5 font-medium text-slate-900 dark:text-slate-100">
                      {formData.type}
                    </dd>
                  </div>
                  <div className="sm:col-span-2">
                    <dt className="text-xs">Địa chỉ</dt>
                    <dd className="mt-0.5 font-medium text-slate-900 dark:text-slate-100">
                      {formData.address
                        ? `${formData.address}, ${formData.city}`
                        : 'Chưa nhập'}
                    </dd>
                  </div>
                </dl>
              </div>
            </section>
          )}

          {submitError && (
            <div className="mb-3 flex items-start gap-2 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-300">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{submitError}</span>
            </div>
          )}

          <div className={`flex items-center justify-between gap-3 border-t pt-4 ${border}`}>
            <Button
              type="button"
              variant="outline"
              onClick={() => (step === 1 ? handleClose() : setStep((current) => current - 1))}
              className="min-w-24"
            >
              {step === 1 ? 'Hủy' : (
                <>
                  <ChevronLeft className="mr-1 h-4 w-4" />
                  Quay lại
                </>
              )}
            </Button>

            {step < 3 ? (
              <Button
                type="button"
                onClick={goNext}
                className="min-w-28 bg-emerald-800 text-white hover:bg-emerald-900 dark:bg-emerald-700 dark:hover:bg-emerald-600"
              >
                Tiếp tục
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            ) : (
              <Button
                type="submit"
                data-action="create-hospital"
                disabled={createMutation.isPending}
                className="min-w-36 bg-emerald-800 text-white hover:bg-emerald-900 dark:bg-emerald-700 dark:hover:bg-emerald-600"
              >
                {createMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="mr-2 h-4 w-4" />
                )}
                Tạo bệnh viện
              </Button>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
