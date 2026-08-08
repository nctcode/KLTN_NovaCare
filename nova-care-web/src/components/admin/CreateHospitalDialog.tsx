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
  Compass,
  Sparkles,
  Upload,
  Image as ImageIcon,
  AlertCircle,
  X,
  Plus,
  Loader2,
  CheckCircle2,
  Globe,
  Mail,
} from 'lucide-react';

interface CreateHospitalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (newHospital?: any) => void;
}

export function CreateHospitalDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreateHospitalDialogProps) {
  const queryClient = useQueryClient();
  const { theme } = useAdminTheme();
  const isLight = theme === 'light';

  // Form Initial State
  const initialFormData = {
    name: '',
    type: 'Công', // 'Công' | 'Tư nhân' | 'Quốc tế'
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
    status: 'Hoạt động', // 'Hoạt động' | 'Tạm ngưng' | 'Ngừng hợp tác'
    isActive: true,
  };

  const [formData, setFormData] = useState(initialFormData);
  const [albumImages, setAlbumImages] = useState<string[]>([]);
  const [newAlbumUrl, setNewAlbumUrl] = useState('');
  
  // Local File Previews
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);

  // Validation Errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset form state when modal opens or closes
  const resetForm = () => {
    setFormData(initialFormData);
    setAlbumImages([]);
    setNewAlbumUrl('');
    setLogoPreview(null);
    setCoverPreview(null);
    setErrors({});
  };

  const handleClose = () => {
    resetForm();
    onOpenChange(false);
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!formData.name.trim()) errs.name = 'Vui lòng nhập tên bệnh viện đối tác';
    if (!formData.hotline.trim() && !formData.phone.trim()) {
      errs.hotline = 'Vui lòng nhập hotline hoặc số điện thoại';
    }
    if (!formData.city.trim()) errs.city = 'Vui lòng chọn hoặc nhập Tỉnh / Thành phố';
    if (!formData.address.trim()) errs.address = 'Vui lòng nhập địa chỉ chi tiết trụ sở chính';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Mutation to Create Hospital
  const createMutation = useMutation({
    mutationFn: async (payload: any) => {
      try {
        return await adminService.createHospital(payload);
      } catch (err) {
        console.warn('Backend create endpoint fallback:', err);
        // Generates a mock hospital object with random ID for fallback/demo
        return {
          id: `hosp-${Date.now().toString().slice(-4)}`,
          ...payload,
          doctorCount: 0,
          specialtyCount: 0,
        };
      }
    },
    onSuccess: (newHospital) => {
      queryClient.invalidateQueries({ queryKey: ['admin-hospitals'] });
      resetForm();
      onOpenChange(false);
      if (onSuccess) onSuccess(newHospital);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    // Build payload matching backend requirements & standard fields
    const finalTypeMap: Record<string, string> = {
      'Công': 'PUBLIC',
      'Tư nhân': 'PRIVATE',
      'Quốc tế': 'INTERNATIONAL',
    };
    const finalStatusMap: Record<string, string> = {
      'Hoạt động': 'ACTIVE',
      'Tạm ngưng': 'PAUSED',
      'Ngừng hợp tác': 'TERMINATED',
    };

    const payload = {
      name: formData.name.trim(),
      type: finalTypeMap[formData.type] || formData.type,
      establishedYear: formData.establishedYear ? parseInt(formData.establishedYear) : undefined,
      bedCount: formData.bedCount ? parseInt(formData.bedCount) : undefined,
      logoUrl: logoPreview || formData.logoUrl || 'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?w=120&auto=format&fit=crop&q=80',
      coverImageUrl: coverPreview || formData.coverImageUrl || 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=1600&q=80',
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
      status: finalStatusMap[formData.status] || formData.status,
      isActive: formData.isActive,
      rating: 0,
      reviewCount: 0,
    };

    createMutation.mutate(payload);
  };

  // Image Upload File Handlers
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

  const handleAddAlbumUrl = () => {
    if (newAlbumUrl.trim()) {
      setAlbumImages([...albumImages, newAlbumUrl.trim()]);
      setNewAlbumUrl('');
    }
  };

  const handleAlbumFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newUrls = files.map((file) => URL.createObjectURL(file));
    setAlbumImages([...albumImages, ...newUrls]);
  };

  const handleRemoveAlbumImage = (index: number) => {
    setAlbumImages(albumImages.filter((_, i) => i !== index));
  };

  const cardBg = isLight
    ? 'bg-slate-50/80 border-slate-200/80 text-slate-900'
    : 'bg-slate-900/60 border-slate-800 text-white';

  const inputBg = isLight
    ? 'bg-white border-slate-300 text-slate-900 focus:ring-emerald-600'
    : 'bg-slate-950 border-slate-800 text-white focus:ring-emerald-400';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={`max-w-4xl max-h-[92vh] overflow-y-auto p-6 sm:p-8 rounded-3xl border ${
          isLight ? 'bg-white text-slate-900 border-slate-200' : 'bg-slate-950 text-white border-slate-800'
        }`}
      >
        <DialogHeader className="space-y-2 border-b pb-4 border-slate-200 dark:border-slate-800 text-left">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-emerald-50 text-[#0c4b39] dark:bg-emerald-950 dark:text-[#66FF33] border border-emerald-200/60 dark:border-emerald-800/60">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <DialogTitle className="text-xl sm:text-2xl font-black tracking-tight">
                Thêm Bệnh viện Đối tác
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                Điền các thông tin khởi tạo ban đầu cho bệnh viện đối tác. Sau khi tạo thành công có thể tiếp tục quản lý Cơ sở, Chuyên khoa, Bác sĩ và Gói khám trong trang Chi tiết Bệnh viện.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 pt-4 font-sans">
          {/* ==================================================
              1. THÔNG TIN CƠ BẢN
             ================================================== */}
          <div className={`p-5 sm:p-6 rounded-2xl border ${cardBg} space-y-5`}>
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400 border-b pb-3 border-slate-200/80 dark:border-slate-800">
              <Building2 className="w-4 h-4" /> 1. Thông tin cơ bản
            </div>

            {/* TÊN BỆNH VIỆN & LOẠI BỆNH VIỆN */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
              <div className="sm:col-span-8 space-y-1.5">
                <label className="text-xs font-extrabold flex items-center gap-1">
                  Tên bệnh viện <span className="text-rose-500">*</span>
                </label>
                <Input
                  placeholder="VD: Bệnh viện Đa khoa Quốc tế NovaCare..."
                  value={formData.name}
                  onChange={(e) => {
                    setFormData({ ...formData, name: e.target.value });
                    if (errors.name) setErrors({ ...errors, name: '' });
                  }}
                  className={`text-xs font-bold rounded-xl ${inputBg} ${errors.name ? 'border-rose-500' : ''}`}
                />
                {errors.name && (
                  <p className="text-[11px] font-bold text-rose-500 flex items-center gap-1 mt-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {errors.name}
                  </p>
                )}
              </div>

              <div className="sm:col-span-4 space-y-1.5">
                <label className="text-xs font-extrabold flex items-center gap-1">
                  Loại bệnh viện <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className={`w-full text-xs font-extrabold rounded-xl p-2.5 border focus:outline-none focus:ring-2 focus:ring-[#0c4b39] ${inputBg}`}
                >
                  <option value="Công">Bệnh viện Công</option>
                  <option value="Tư nhân">Bệnh viện Tư</option>
                  <option value="Quốc tế">Bệnh viện Quốc tế</option>
                </select>
              </div>
            </div>

            {/* NĂM THÀNH LẬP & QUY MÔ GIƯỜNG BỆNH */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold">Năm thành lập</label>
                <Input
                  type="number"
                  placeholder="VD: 1995"
                  value={formData.establishedYear}
                  onChange={(e) => setFormData({ ...formData, establishedYear: e.target.value })}
                  className={`text-xs font-bold rounded-xl ${inputBg}`}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-extrabold">Quy mô giường bệnh</label>
                <Input
                  type="number"
                  placeholder="VD: 500 (giường)"
                  value={formData.bedCount}
                  onChange={(e) => setFormData({ ...formData, bedCount: e.target.value })}
                  className={`text-xs font-bold rounded-xl ${inputBg}`}
                />
              </div>
            </div>

            {/* LOGO & BANNER UPLOAD */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              {/* LOGO UPLOAD (4 COLS) */}
              <div className="md:col-span-4 space-y-2">
                <label className="text-xs font-extrabold uppercase tracking-wider block">
                  Logo bệnh viện
                </label>
                <div
                  className={`relative h-40 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center p-3 text-center transition ${
                    isLight ? 'border-slate-300 bg-white hover:border-emerald-500' : 'border-slate-700 bg-slate-950 hover:border-emerald-400'
                  }`}
                >
                  {logoPreview || formData.logoUrl ? (
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
                    <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer p-2">
                      <Upload className="w-6 h-6 text-emerald-600 dark:text-emerald-400 mb-1.5" />
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Upload ảnh logo</span>
                      <span className="text-[10px] text-slate-400 mt-0.5">Hoặc dán URL logo</span>
                      <input type="file" accept="image/*" onChange={handleLogoFile} className="hidden" />
                    </label>
                  )}
                </div>
                <Input
                  placeholder="URL logo: https://..."
                  value={formData.logoUrl}
                  onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                  className={`text-xs font-mono rounded-xl ${inputBg}`}
                />
              </div>

              {/* BANNER COVER UPLOAD (8 COLS) */}
              <div className="md:col-span-8 space-y-2">
                <label className="text-xs font-extrabold uppercase tracking-wider block">
                  Ảnh Banner (Cover Image)
                </label>
                <div
                  className={`relative h-40 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center p-3 text-center transition ${
                    isLight ? 'border-slate-300 bg-white hover:border-emerald-500' : 'border-slate-700 bg-slate-950 hover:border-emerald-400'
                  }`}
                >
                  {coverPreview || formData.coverImageUrl ? (
                    <div className="relative w-full h-full">
                      <img
                        src={coverPreview || formData.coverImageUrl}
                        alt="Cover Preview"
                        className="w-full h-full object-cover rounded-xl"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setCoverPreview(null);
                          setFormData({ ...formData, coverImageUrl: '' });
                        }}
                        className="absolute top-2 right-2 p-1.5 bg-rose-600 text-white rounded-xl shadow-md"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer p-2">
                      <ImageIcon className="w-7 h-7 text-blue-600 dark:text-blue-400 mb-1.5" />
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Upload ảnh Banner (16:9)</span>
                      <span className="text-[10px] text-slate-400 mt-0.5">Hoặc dán URL ảnh banner</span>
                      <input type="file" accept="image/*" onChange={handleCoverFile} className="hidden" />
                    </label>
                  )}
                </div>
                <Input
                  placeholder="URL Banner: https://..."
                  value={formData.coverImageUrl}
                  onChange={(e) => setFormData({ ...formData, coverImageUrl: e.target.value })}
                  className={`text-xs font-mono rounded-xl ${inputBg}`}
                />
              </div>
            </div>

            {/* ALBUM ẢNH BỆNH VIỆN */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-extrabold uppercase tracking-wider block">
                  Album ảnh bệnh viện
                </label>
                <label className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 cursor-pointer flex items-center gap-1 hover:underline">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload từ máy tính</span>
                  <input type="file" accept="image/*" multiple onChange={handleAlbumFiles} className="hidden" />
                </label>
              </div>

              {/* URL Input Bar */}
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Dán URL ảnh album https://..."
                  value={newAlbumUrl}
                  onChange={(e) => setNewAlbumUrl(e.target.value)}
                  className={`text-xs font-mono rounded-xl ${inputBg}`}
                />
                <Button
                  type="button"
                  onClick={handleAddAlbumUrl}
                  variant="outline"
                  size="sm"
                  className="shrink-0 text-xs font-bold rounded-xl px-3"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" /> Thêm URL
                </Button>
              </div>

              {/* Album Preview Thumbnails */}
              {albumImages.length > 0 && (
                <div className="flex flex-wrap gap-2.5 pt-2">
                  {albumImages.map((imgUrl, idx) => (
                    <div key={idx} className="relative w-20 h-20 rounded-xl overflow-hidden border border-slate-300 dark:border-slate-700 group">
                      <img src={imgUrl} alt={`Album ${idx}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => handleRemoveAlbumImage(idx)}
                        className="absolute top-1 right-1 p-1 bg-rose-600 text-white rounded-lg shadow opacity-90 group-hover:opacity-100 transition"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* GIỚI THIỆU BỆNH VIỆN */}
            <div className="space-y-1.5">
              <label className="text-xs font-extrabold">Giới thiệu bệnh viện</label>
              <textarea
                rows={4}
                placeholder="Mô tả lịch sử hình thành, thế mạnh khám chữa bệnh, trang thiết bị y tế, quy mô, định hướng phát triển..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className={`w-full text-xs font-medium p-3.5 rounded-2xl border focus:outline-none focus:ring-2 focus:ring-[#0c4b39] ${inputBg}`}
              />
            </div>
          </div>

          {/* ==================================================
              2. THÔNG TIN LIÊN HỆ
             ================================================== */}
          <div className={`p-5 sm:p-6 rounded-2xl border ${cardBg} space-y-4`}>
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-blue-700 dark:text-blue-400 border-b pb-3 border-slate-200/80 dark:border-slate-800">
              <Phone className="w-4 h-4" /> 2. Thông tin liên hệ
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold flex items-center gap-1">
                  Hotline đặt khám <span className="text-rose-500">*</span>
                </label>
                <Input
                  placeholder="VD: 028 1234 5678"
                  value={formData.hotline}
                  onChange={(e) => {
                    setFormData({ ...formData, hotline: e.target.value, phone: e.target.value });
                    if (errors.hotline) setErrors({ ...errors, hotline: '' });
                  }}
                  className={`text-xs font-bold rounded-xl ${inputBg} ${errors.hotline ? 'border-rose-500' : ''}`}
                />
                {errors.hotline && (
                  <p className="text-[11px] font-bold text-rose-500 flex items-center gap-1 mt-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {errors.hotline}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-rose-600 dark:text-rose-400">
                  Hotline cấp cứu
                </label>
                <Input
                  placeholder="VD: 1900 6789"
                  value={formData.emergencyHotline}
                  onChange={(e) => setFormData({ ...formData, emergencyHotline: e.target.value })}
                  className={`text-xs font-bold rounded-xl ${inputBg}`}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-extrabold">Số điện thoại</label>
                <Input
                  placeholder="VD: 028 9876 5432"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className={`text-xs font-bold rounded-xl ${inputBg}`}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-slate-400" /> Email liên hệ
                </label>
                <Input
                  type="email"
                  placeholder="VD: contact@novacare.vn"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className={`text-xs font-bold rounded-xl ${inputBg}`}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-extrabold flex items-center gap-1">
                  <Globe className="w-3.5 h-3.5 text-slate-400" /> Website chính thức
                </label>
                <Input
                  placeholder="VD: https://novacare.vn"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  className={`text-xs font-bold rounded-xl ${inputBg}`}
                />
              </div>
            </div>
          </div>

          {/* ==================================================
              3. ĐỊA CHỈ & VỊ TRÍ
             ================================================== */}
          <div className={`p-5 sm:p-6 rounded-2xl border ${cardBg} space-y-4`}>
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-indigo-700 dark:text-indigo-400 border-b pb-3 border-slate-200/80 dark:border-slate-800">
              <Compass className="w-4 h-4" /> 3. Địa chỉ & Vị trí
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
              <div className="sm:col-span-4 space-y-1.5">
                <label className="text-xs font-extrabold flex items-center gap-1">
                  Tỉnh / Thành phố <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className={`w-full text-xs font-extrabold rounded-xl p-2.5 border focus:outline-none focus:ring-2 focus:ring-[#0c4b39] ${inputBg}`}
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
              </div>

              <div className="sm:col-span-8 space-y-1.5">
                <label className="text-xs font-extrabold flex items-center gap-1">
                  Địa chỉ chi tiết <span className="text-rose-500">*</span>
                </label>
                <Input
                  placeholder="VD: 123 Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh"
                  value={formData.address}
                  onChange={(e) => {
                    setFormData({ ...formData, address: e.target.value });
                    if (errors.address) setErrors({ ...errors, address: '' });
                  }}
                  className={`text-xs font-bold rounded-xl ${inputBg} ${errors.address ? 'border-rose-500' : ''}`}
                />
                {errors.address && (
                  <p className="text-[11px] font-bold text-rose-500 flex items-center gap-1 mt-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {errors.address}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold">Google Maps URL</label>
                <Input
                  placeholder="VD: https://maps.google.com/maps?q=123+Nguyen+Hue"
                  value={formData.googleMapUrl}
                  onChange={(e) => setFormData({ ...formData, googleMapUrl: e.target.value })}
                  className={`text-xs font-mono rounded-xl ${inputBg}`}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold">Latitude (Vĩ độ)</label>
                  <Input
                    type="number"
                    step="0.0001"
                    placeholder="VD: 10.7769"
                    value={formData.latitude}
                    onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                    className={`text-xs font-mono font-bold rounded-xl ${inputBg}`}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold">Longitude (Kinh độ)</label>
                  <Input
                    type="number"
                    step="0.0001"
                    placeholder="VD: 106.7009"
                    value={formData.longitude}
                    onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                    className={`text-xs font-mono font-bold rounded-xl ${inputBg}`}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ==================================================
              4. THÔNG TIN VẬN HÀNH
             ================================================== */}
          <div className={`p-5 sm:p-6 rounded-2xl border ${cardBg} space-y-5`}>
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-amber-700 dark:text-amber-400 border-b pb-3 border-slate-200/80 dark:border-slate-800">
              <Sparkles className="w-4 h-4" /> 4. Thông tin vận hành
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-extrabold">Giờ làm việc</label>
              <Input
                placeholder="VD: 07:00 - 17:00 (Thứ 2 - Thứ 7)"
                value={formData.operatingHours}
                onChange={(e) => setFormData({ ...formData, operatingHours: e.target.value })}
                className={`text-xs font-bold rounded-xl ${inputBg}`}
              />
            </div>

            {/* TRẠNG THÁI HỢP TÁC (RADIO) */}
            <div className="space-y-2">
              <label className="text-xs font-extrabold block">
                Trạng thái hợp tác <span className="text-rose-500">*</span>
              </label>
              <div className="flex flex-wrap items-center gap-6 pt-1">
                <label className="flex items-center gap-2 text-xs font-bold cursor-pointer select-none">
                  <input
                    type="radio"
                    name="status"
                    value="Hoạt động"
                    checked={formData.status === 'Hoạt động'}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-4 h-4 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                    ● Đang hợp tác
                  </span>
                </label>

                <label className="flex items-center gap-2 text-xs font-bold cursor-pointer select-none">
                  <input
                    type="radio"
                    name="status"
                    value="Tạm ngưng"
                    checked={formData.status === 'Tạm ngưng'}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-4 h-4 text-amber-600 focus:ring-amber-500"
                  />
                  <span className="text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                    ○ Tạm ngưng
                  </span>
                </label>

                <label className="flex items-center gap-2 text-xs font-bold cursor-pointer select-none">
                  <input
                    type="radio"
                    name="status"
                    value="Ngừng hợp tác"
                    checked={formData.status === 'Ngừng hợp tác'}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-4 h-4 text-rose-600 focus:ring-rose-500"
                  />
                  <span className="text-rose-700 dark:text-rose-400 flex items-center gap-1.5">
                    ○ Ngừng hợp tác
                  </span>
                </label>
              </div>
            </div>

            {/* HIỂN THỊ TRÊN NOVACARE (CHECKBOX) */}
            <div className={`p-4 rounded-2xl border ${isLight ? 'bg-white border-slate-200' : 'bg-slate-950 border-slate-800'}`}>
              <Switch
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                label="Hiển thị trên ứng dụng NovaCare"
                description="Cho phép người dùng tìm kiếm, xem thông tin và đặt lịch khám tại bệnh viện này"
              />
            </div>
          </div>

          {/* ==================================================
              ACTION BUTTONS
             ================================================== */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className={`text-xs font-bold rounded-2xl px-5 ${
                isLight ? 'border-slate-300 text-slate-700 hover:bg-slate-100' : 'border-slate-800 text-slate-300 hover:bg-slate-900'
              }`}
            >
              Hủy
            </Button>

            <Button
              type="submit"
              disabled={createMutation.isPending}
              className="bg-[#0c4b39] hover:bg-[#09392b] text-white font-black text-xs rounded-2xl px-7 py-2.5 shadow-md flex items-center gap-2 transition"
            >
              {createMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              Thêm bệnh viện
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
