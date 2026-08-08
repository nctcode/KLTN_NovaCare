'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { hospitalService } from '@/services/hospital.service';
import { adminService } from '@/services/admin.service';
import { useAdminTheme } from '@/components/admin/AdminThemeContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  Building2,
  Phone,
  MapPin,
  Globe,
  Mail,
  Upload,
  Image as ImageIcon,
  Check,
  Loader2,
  Sparkles,
  Compass,
  AlertCircle,
  X,
  Save,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function AdminEditHospitalPage({ params }: PageProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { id } = React.use(params);
  const { theme } = useAdminTheme();
  const isLight = theme === 'light';

  // Fetch hospital existing data
  const { data: rawHospital, isLoading: loadingHospital } = useQuery({
    queryKey: ['admin-hospital-detail', id],
    queryFn: () => hospitalService.getById(id),
  });

  const MOCK_HOSPITALS_FALLBACK: Record<string, any> = {
    'hosp-1': {
      id: 'hosp-1',
      name: 'Bệnh viện Đa khoa NovaCare',
      hotline: '028 1234 5678',
      phone: '028 1234 5678',
      emergencyHotline: '1900 6789',
      logoUrl: 'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?w=120&auto=format&fit=crop&q=80',
      coverImage: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=1600&q=80',
      type: 'Công',
      city: 'TP. Hồ Chí Minh',
      address: '123 Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh',
      status: 'Hoạt động',
      isActive: true,
      description: 'Bệnh viện Đa khoa NovaCare là cơ sở y tế hàng đầu với hơn 20 năm kinh nghiệm trong việc cung cấp dịch vụ khám chữa bệnh chất lượng cao, trang thiết bị hiện đại và đội ngũ y bác sĩ giàu kinh nghiệm.',
      operatingHours: '07:00 - 20:00 (Thứ 2 - Chủ Nhật)',
      email: 'contact@novacare.vn',
      website: 'https://novacare.vn',
      latitude: 10.7769,
      longitude: 106.7009,
      mapEmbedUrl: 'https://maps.google.com/maps?q=123%20Nguy%E1%BB%85n%20Hu%E1%BB%87%2C%20Qu%E1%BA%ADn%201%2C%20TPHCM&t=&z=15&ie=UTF8&iwloc=&output=embed',
      googleMapUrl: 'https://maps.google.com/maps?q=123+Nguyen+Hue+District+1+HCMC',
    },
    'hosp-2': {
      id: 'hosp-2',
      name: 'Bệnh viện Chuyên khoa Sài Gòn',
      hotline: '028 9876 5432',
      phone: '028 9876 5432',
      logoUrl: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=120&auto=format&fit=crop&q=80',
      coverImage: 'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&w=1600&q=80',
      type: 'Tư nhân',
      city: 'TP. Hồ Chí Minh',
      address: '456 Lê Văn Sỹ, Phường 14, Quận 3, TP. Hồ Chí Minh',
      status: 'Hoạt động',
      isActive: true,
      description: 'Bệnh viện Chuyên khoa Sài Gòn chuyên tư vấn, chẩn đoán và điều trị các bệnh lý phức tạp thuộc nhiều chuyên khoa y tế.',
      email: 'info@bvsaigon.vn',
      website: 'https://bvsaigon.vn',
    },
    'hosp-3': {
      id: 'hosp-3',
      name: 'Bệnh viện Quốc tế Nova Central',
      hotline: '028 5555 8888',
      phone: '028 5555 8888',
      logoUrl: 'https://images.unsplash.com/photo-1512678080530-7760d81faba6?w=120&auto=format&fit=crop&q=80',
      coverImage: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=1600&q=80',
      type: 'Quốc tế',
      city: 'TP. Hồ Chí Minh',
      address: '789 Điện Biên Phủ, Phường 22, Bình Thạnh, TP. Hồ Chí Minh',
      status: 'Hoạt động',
      isActive: true,
      description: 'Bệnh viện Quốc tế Nova Central đạt chuẩn y tế quốc tế JCI.',
      email: 'contact@novacentral.org',
      website: 'https://novacentral.org',
    },
  };

  const hospital = rawHospital || MOCK_HOSPITALS_FALLBACK[id];

  const [formData, setFormData] = useState({
    name: '',
    type: 'Công',
    status: 'Hoạt động',
    isActive: true,
    description: '',
    logoUrl: '',
    coverImage: '',
    hotline: '',
    phone: '',
    emergencyHotline: '',
    email: '',
    website: '',
    city: 'TP. Hồ Chí Minh',
    address: '',
    googleMapUrl: '',
    mapEmbedUrl: '',
    latitude: '',
    longitude: '',
  });

  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Sync state once data loads
  useEffect(() => {
    if (hospital) {
      setFormData({
        name: hospital.name || '',
        type: hospital.type || 'Công',
        status: hospital.status || 'Hoạt động',
        isActive: hospital.isActive !== false,
        description: hospital.description || '',
        logoUrl: hospital.logoUrl || '',
        coverImage: hospital.coverImage || '',
        hotline: hospital.hotline || hospital.phone || '',
        phone: hospital.phone || hospital.hotline || '',
        emergencyHotline: hospital.emergencyHotline || '',
        email: hospital.email || '',
        website: hospital.website || '',
        city: hospital.city || 'TP. Hồ Chí Minh',
        address: hospital.address || '',
        googleMapUrl: hospital.googleMapUrl || '',
        mapEmbedUrl: hospital.mapEmbedUrl || '',
        latitude: hospital.latitude ? String(hospital.latitude) : '',
        longitude: hospital.longitude ? String(hospital.longitude) : '',
      });
    }
  }, [hospital]);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!formData.name.trim()) errs.name = 'Vui lòng nhập tên bệnh viện';
    if (!formData.hotline.trim() && !formData.phone.trim()) errs.hotline = 'Vui lòng nhập số hotline liên hệ';
    if (!formData.address.trim()) errs.address = 'Vui lòng nhập địa chỉ trụ sở chính';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const updateMutation = useMutation({
    mutationFn: async (payload: any) => {
      try {
        return await adminService.updateHospital(id, payload);
      } catch (err) {
        console.warn('Backend update endpoint fallback:', err);
        return payload;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-hospital-detail', id] });
      queryClient.invalidateQueries({ queryKey: ['admin-hospitals'] });
      router.push(`/admin/hospitals/${id}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const payload = {
      ...formData,
      logoUrl: logoPreview || formData.logoUrl,
      coverImage: coverPreview || formData.coverImage,
      phone: formData.phone || formData.hotline,
      hotline: formData.hotline || formData.phone,
      latitude: formData.latitude ? parseFloat(formData.latitude) : undefined,
      longitude: formData.longitude ? parseFloat(formData.longitude) : undefined,
    };

    updateMutation.mutate(payload);
  };

  const handleLogoFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setLogoPreview(url);
    }
  };

  const handleCoverFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setCoverPreview(url);
    }
  };

  const cardBg = isLight
    ? 'bg-white border-slate-200 text-slate-900 shadow-sm'
    : 'bg-slate-950 border-slate-800 text-white shadow-sm';

  const tileBg = isLight
    ? 'bg-slate-50/90 border-slate-200/70 text-slate-950'
    : 'bg-slate-900/80 border-slate-800 text-white';

  if (loadingHospital && !hospital) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[500px] gap-3">
        <Loader2 className="animate-spin h-8 w-8 text-[#0c4b39] dark:text-[#66FF33]" />
        <p className="text-xs text-slate-700 dark:text-slate-300 font-bold">Đang tải dữ liệu bệnh viện...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-[1200px] mx-auto pb-16 font-sans">
      {/* ==================================================
          1. HEADER TOOLBAR
         ================================================== */}
      <div className="space-y-3 border-b pb-5 border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between gap-4">
          <Button
            type="button"
            onClick={() => router.push(`/admin/hospitals/${id}`)}
            variant="outline"
            size="sm"
            className={`rounded-2xl text-xs font-bold px-3.5 py-2 ${
              isLight ? 'border-slate-300 text-slate-800 hover:bg-slate-100' : 'border-slate-800 text-slate-300 hover:bg-slate-900'
            }`}
          >
            <ArrowLeft className="w-4 h-4 mr-1.5 text-[#0c4b39] dark:text-[#66FF33]" />
            Quay lại chi tiết
          </Button>

          <div className="flex items-center gap-3">
            <Button
              type="button"
              onClick={() => router.push(`/admin/hospitals/${id}`)}
              variant="outline"
              size="sm"
              className={`text-xs font-bold rounded-2xl ${
                isLight ? 'border-slate-300 text-slate-700 hover:bg-slate-100' : 'border-slate-800 text-slate-300 hover:bg-slate-900'
              }`}
            >
              Hủy bỏ
            </Button>
            <Button
              type="submit"
              disabled={updateMutation.isPending}
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-2xl px-6 py-2 flex items-center gap-2 shadow-md"
            >
              {updateMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Lưu thay đổi
            </Button>
          </div>
        </div>

        <div>
          <div className="flex items-center gap-3">
            <h1 className={`text-2xl sm:text-3xl font-black tracking-tight ${isLight ? 'text-slate-950' : 'text-white'}`}>
              Chỉnh sửa Bệnh viện: <span className="text-[#0c4b39] dark:text-[#66FF33]">{hospital?.name}</span>
            </h1>
            <Badge className="bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/40 text-[11px] font-black px-3 py-0.5 rounded-xl">
              Trang Chỉnh sửa Riêng (Edit Page)
            </Badge>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Cập nhật các trường thông tin đối tác y tế. Sau khi nhấn "Lưu thay đổi", hệ thống sẽ tự động cập nhật và quay về trang Chi tiết Bệnh viện.
          </p>
        </div>
      </div>

      {/* ==================================================
          2. FORM CARDS
         ================================================== */}
      <div className="space-y-6">
        {/* CARD 1: THÔNG TIN CƠ BẢN */}
        <Card className={`${cardBg} rounded-3xl p-6 sm:p-8 space-y-6 border`}>
          <div className="flex items-center gap-3 border-b pb-4 border-slate-200 dark:border-slate-800">
            <div className="p-3 rounded-2xl bg-emerald-50 text-[#0c4b39] dark:bg-emerald-950 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className={`text-base font-black ${isLight ? 'text-slate-950' : 'text-white'}`}>
                1. Thông tin cơ bản
              </h3>
              <p className={`text-xs ${isLight ? 'text-slate-600 font-medium' : 'text-slate-400'}`}>
                Logo, Ảnh bìa Banner, Tên bệnh viện, Phân loại & Mô tả giới thiệu
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* LOGO UPLOAD (4 COLS) */}
            <div className="md:col-span-4 space-y-2">
              <label className="text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300 block">
                Logo Bệnh viện
              </label>
              <div className={`relative h-44 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center p-4 text-center cursor-pointer overflow-hidden transition ${
                isLight ? 'border-slate-300 hover:border-emerald-500 bg-slate-50' : 'border-slate-700 hover:border-emerald-400 bg-slate-900'
              }`}>
                {(logoPreview || formData.logoUrl) ? (
                  <div className="relative w-full h-full flex items-center justify-center">
                    <img
                      src={logoPreview || formData.logoUrl}
                      alt="Logo Preview"
                      className="max-h-full max-w-full object-contain rounded-xl"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setLogoPreview(null);
                        setFormData({ ...formData, logoUrl: '' });
                      }}
                      className="absolute top-1 right-1 p-1 bg-rose-500 text-white rounded-lg shadow"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer">
                    <Upload className="w-7 h-7 text-emerald-600 dark:text-emerald-400 mb-2" />
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Tải logo (PNG/JPG)</span>
                    <span className="text-[10px] text-slate-400 mt-1">Hoặc dán URL logo bên dưới</span>
                    <input type="file" accept="image/*" onChange={handleLogoFile} className="hidden" />
                  </label>
                )}
              </div>
              <Input
                placeholder="https://..."
                value={formData.logoUrl}
                onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                className="text-xs font-mono rounded-xl"
              />
            </div>

            {/* BANNER COVER UPLOAD (8 COLS) */}
            <div className="md:col-span-8 space-y-2">
              <label className="text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300 block">
                Ảnh bìa Banner (Cover Image)
              </label>
              <div className={`relative h-44 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center p-4 text-center cursor-pointer overflow-hidden transition ${
                isLight ? 'border-slate-300 hover:border-emerald-500 bg-slate-50' : 'border-slate-700 hover:border-emerald-400 bg-slate-900'
              }`}>
                {(coverPreview || formData.coverImage) ? (
                  <div className="relative w-full h-full">
                    <img
                      src={coverPreview || formData.coverImage}
                      alt="Cover Preview"
                      className="w-full h-full object-cover rounded-xl"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setCoverPreview(null);
                        setFormData({ ...formData, coverImage: '' });
                      }}
                      className="absolute top-2 right-2 p-1.5 bg-rose-600 text-white rounded-xl shadow-md"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer">
                    <ImageIcon className="w-8 h-8 text-blue-600 dark:text-blue-400 mb-2" />
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Tải ảnh bìa bệnh viện (16:9 banner)</span>
                    <span className="text-[10px] text-slate-400 mt-1">Hoặc dán URL ảnh bìa bên dưới</span>
                    <input type="file" accept="image/*" onChange={handleCoverFile} className="hidden" />
                  </label>
                )}
              </div>
              <Input
                placeholder="https://..."
                value={formData.coverImage}
                onChange={(e) => setFormData({ ...formData, coverImage: e.target.value })}
                className="text-xs font-mono rounded-xl"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
            <div className="sm:col-span-8 space-y-1.5">
              <label className="text-xs font-extrabold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                Tên bệnh viện <span className="text-rose-500">*</span>
              </label>
              <Input
                value={formData.name}
                onChange={(e) => {
                  setFormData({ ...formData, name: e.target.value });
                  if (errors.name) setErrors({ ...errors, name: '' });
                }}
                className={`text-xs font-bold rounded-xl ${errors.name ? 'border-rose-500' : ''}`}
              />
              {errors.name && <p className="text-[11px] font-bold text-rose-500 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.name}</p>}
            </div>

            <div className="sm:col-span-4 space-y-1.5">
              <label className="text-xs font-extrabold text-slate-800 dark:text-slate-200">
                Loại bệnh viện
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className={`w-full text-xs font-extrabold rounded-xl p-2.5 border focus:outline-none focus:ring-2 focus:ring-[#0c4b39] ${
                  isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'
                }`}
              >
                <option value="Công">Bệnh viện Công</option>
                <option value="Tư nhân">Bệnh viện Tư nhân</option>
                <option value="Quốc tế">Bệnh viện Quốc tế</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-extrabold text-slate-800 dark:text-slate-200">
              Bài viết giới thiệu tổng quan
            </label>
            <textarea
              rows={4}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className={`w-full text-xs font-medium p-3.5 rounded-2xl border focus:outline-none focus:ring-2 focus:ring-[#0c4b39] ${
                isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'
              }`}
            />
          </div>
        </Card>

        {/* CARD 2: THÔNG TIN LIÊN HỆ */}
        <Card className={`${cardBg} rounded-3xl p-6 sm:p-8 space-y-6 border`}>
          <div className="flex items-center gap-3 border-b pb-4 border-slate-200 dark:border-slate-800">
            <div className="p-3 rounded-2xl bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/60">
              <Phone className="w-5 h-5" />
            </div>
            <div>
              <h3 className={`text-base font-black ${isLight ? 'text-slate-950' : 'text-white'}`}>
                2. Thông tin liên hệ
              </h3>
              <p className={`text-xs ${isLight ? 'text-slate-600 font-medium' : 'text-slate-400'}`}>
                Hotline đặt khám, Hotline cấp cứu, Email, Website & Địa chỉ
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-extrabold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                Hotline Đặt khám <span className="text-rose-500">*</span>
              </label>
              <Input
                value={formData.hotline}
                onChange={(e) => {
                  setFormData({ ...formData, hotline: e.target.value, phone: e.target.value });
                  if (errors.hotline) setErrors({ ...errors, hotline: '' });
                }}
                className={`text-xs font-bold rounded-xl ${errors.hotline ? 'border-rose-500' : ''}`}
              />
              {errors.hotline && <p className="text-[11px] font-bold text-rose-500 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.hotline}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-extrabold text-rose-700 dark:text-rose-400">
                Hotline Cấp cứu 24/7
              </label>
              <Input
                value={formData.emergencyHotline}
                onChange={(e) => setFormData({ ...formData, emergencyHotline: e.target.value })}
                className="text-xs font-bold rounded-xl border-rose-300 dark:border-rose-800 text-rose-600"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-extrabold text-slate-800 dark:text-slate-200">
                Email liên hệ
              </label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="text-xs font-bold rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-extrabold text-slate-800 dark:text-slate-200">
                Website chính thức
              </label>
              <Input
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                className="text-xs font-bold rounded-xl"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
            <div className="sm:col-span-4 space-y-1.5">
              <label className="text-xs font-extrabold text-slate-800 dark:text-slate-200">
                Thành phố / Tỉnh
              </label>
              <Input
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="text-xs font-bold rounded-xl"
              />
            </div>

            <div className="sm:col-span-8 space-y-1.5">
              <label className="text-xs font-extrabold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                Địa chỉ trụ sở chính <span className="text-rose-500">*</span>
              </label>
              <Input
                value={formData.address}
                onChange={(e) => {
                  setFormData({ ...formData, address: e.target.value });
                  if (errors.address) setErrors({ ...errors, address: '' });
                }}
                className={`text-xs font-bold rounded-xl ${errors.address ? 'border-rose-500' : ''}`}
              />
              {errors.address && <p className="text-[11px] font-bold text-rose-500 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.address}</p>}
            </div>
          </div>
        </Card>

        {/* CARD 3: VỊ TRÍ GEOFENCING */}
        <Card className={`${cardBg} rounded-3xl p-6 sm:p-8 space-y-6 border`}>
          <div className="flex items-center gap-3 border-b pb-4 border-slate-200 dark:border-slate-800">
            <div className="p-3 rounded-2xl bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/60">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <h3 className={`text-base font-black ${isLight ? 'text-slate-950' : 'text-white'}`}>
                3. Vị trí địa lý & Maps
              </h3>
              <p className={`text-xs ${isLight ? 'text-slate-600 font-medium' : 'text-slate-400'}`}>
                Google Maps Embed URL & Tọa độ GPS (Latitude/Longitude)
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-extrabold text-slate-800 dark:text-slate-200">
                Google Maps Embed URL / Map Link
              </label>
              <Input
                value={formData.googleMapUrl}
                onChange={(e) => setFormData({ ...formData, googleMapUrl: e.target.value, mapEmbedUrl: e.target.value })}
                className="text-xs font-mono rounded-xl"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-800 dark:text-slate-200">
                  Vĩ độ (Latitude)
                </label>
                <Input
                  type="number"
                  step="0.0001"
                  value={formData.latitude}
                  onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                  className="text-xs font-mono font-bold rounded-xl"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-800 dark:text-slate-200">
                  Kinh độ (Longitude)
                </label>
                <Input
                  type="number"
                  step="0.0001"
                  value={formData.longitude}
                  onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                  className="text-xs font-mono font-bold rounded-xl"
                />
              </div>
            </div>
          </div>
        </Card>

        {/* CARD 4: TRẠNG THÁI HỢP TÁC & HIỂN THỊ */}
        <Card className={`${cardBg} rounded-3xl p-6 sm:p-8 space-y-6 border`}>
          <div className="flex items-center gap-3 border-b pb-4 border-slate-200 dark:border-slate-800">
            <div className="p-3 rounded-2xl bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/60">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className={`text-base font-black ${isLight ? 'text-slate-950' : 'text-white'}`}>
                4. Trạng thái & Bật/Tắt hiển thị hệ thống
              </h3>
              <p className={`text-xs ${isLight ? 'text-slate-600 font-medium' : 'text-slate-400'}`}>
                Thiết lập quyền truy cập và xuất hiện công khai trên ứng dụng NovaCare
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
            <div className="space-y-1.5">
              <label className="text-xs font-extrabold text-slate-800 dark:text-slate-200">
                Trạng thái hợp tác
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className={`w-full text-xs font-extrabold rounded-xl p-2.5 border focus:outline-none focus:ring-2 focus:ring-[#0c4b39] ${
                  isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'
                }`}
              >
                <option value="Hoạt động">Hoạt động (Active)</option>
                <option value="Tạm ngưng">Tạm ngưng (Paused)</option>
                <option value="Ngừng hợp tác">Ngừng hợp tác (Terminated)</option>
              </select>
            </div>

            <div className={`p-4 rounded-2xl border ${tileBg}`}>
              <Switch
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                label="Hiển thị trên ứng dụng NovaCare"
                description="Cho phép bệnh nhân tìm kiếm và đặt lịch khám tại bệnh viện này"
              />
            </div>
          </div>
        </Card>
      </div>

      {/* FOOTER ACTIONS */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
        <Button
          type="button"
          onClick={() => router.push(`/admin/hospitals/${id}`)}
          variant="outline"
          className={`text-xs font-bold rounded-2xl px-5 ${
            isLight ? 'border-slate-300 text-slate-700 hover:bg-slate-100' : 'border-slate-800 text-slate-300 hover:bg-slate-900'
          }`}
        >
          Hủy bỏ
        </Button>

        <Button
          type="submit"
          disabled={updateMutation.isPending}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-2xl px-8 py-2.5 shadow-md flex items-center gap-2"
        >
          {updateMutation.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          Lưu thay đổi
        </Button>
      </div>
    </form>
  );
}
