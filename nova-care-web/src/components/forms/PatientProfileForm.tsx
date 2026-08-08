'use client';

import { useState, useRef, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { profileService } from '@/services/profile.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import {
  Loader2,
  QrCode,
  Camera,
  Upload,
  Sparkles,
  User,
  Shield,
  MapPin,
  PhoneCall,
  Activity,
  X,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import jsQR from 'jsqr';
import { CreatePatientProfileDto } from '@/types/profile.types';

interface PatientProfileFormProps {
  initialData?: any;
  onSuccess: () => void;
}

export function PatientProfileForm({ initialData, onSuccess }: PatientProfileFormProps) {
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    fullName: initialData?.fullName || '',
    phone: initialData?.phone || '',
    gender: (initialData?.gender || 'MALE') as 'MALE' | 'FEMALE' | 'OTHER',
    dateOfBirth: initialData?.dateOfBirth ? initialData.dateOfBirth.split('T')[0] : '',
    identityNumber: initialData?.identityNumber || '',
    address: initialData?.address || '',
    relation: initialData?.relation || 'Bản thân',
    healthInsurance: initialData?.healthInsurance || '',
    medicalHistory: initialData?.medicalHistory || '',
    allergies: initialData?.allergies || '',
    emergencyContact: initialData?.emergencyContact || '',
    emergencyPhone: initialData?.emergencyPhone || '',
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        fullName: initialData.fullName || '',
        phone: initialData.phone || '',
        gender: (initialData.gender || 'MALE') as 'MALE' | 'FEMALE' | 'OTHER',
        dateOfBirth: initialData.dateOfBirth ? initialData.dateOfBirth.split('T')[0] : '',
        identityNumber: initialData.identityNumber || '',
        address: initialData.address || '',
        relation: initialData.relation || 'Bản thân',
        healthInsurance: initialData.healthInsurance || '',
        medicalHistory: initialData.medicalHistory || '',
        allergies: initialData.allergies || '',
        emergencyContact: initialData.emergencyContact || '',
        emergencyPhone: initialData.emergencyPhone || '',
      });
    }
  }, [initialData]);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [rawQrPaste, setRawQrPaste] = useState('');

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Stop camera when unmounting or closing modal
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const stopCamera = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  // Helper parser for Vietnamese CCCD chip card QR & JSON format
  const parseQRCodeData = (rawText: string): Partial<CreatePatientProfileDto> | null => {
    const text = rawText.trim();
    const result: Partial<CreatePatientProfileDto> = {};

    // 1. JSON Format
    if (text.startsWith('{') && text.endsWith('}')) {
      try {
        const data = JSON.parse(text);
        if (data.fullName) result.fullName = data.fullName;
        if (data.identityNumber || data.cccd || data.cmnd)
          result.identityNumber = data.identityNumber || data.cccd || data.cmnd;
        if (data.phone) result.phone = data.phone;
        if (data.dateOfBirth || data.dob) result.dateOfBirth = data.dateOfBirth || data.dob;
        if (data.gender) {
          const g = String(data.gender).toUpperCase();
          result.gender =
            g.includes('NAM') || g === 'MALE'
              ? 'MALE'
              : g.includes('NỮ') || g.includes('NU') || g === 'FEMALE'
                ? 'FEMALE'
                : 'OTHER';
        }
        if (data.address) result.address = data.address;
        if (data.healthInsurance || data.bhyt) result.healthInsurance = data.healthInsurance || data.bhyt;
        if (data.medicalHistory) result.medicalHistory = data.medicalHistory;
        if (data.allergies) result.allergies = data.allergies;
        if (data.emergencyContact) result.emergencyContact = data.emergencyContact;
        if (data.emergencyPhone) result.emergencyPhone = data.emergencyPhone;
        return Object.keys(result).length > 0 ? result : null;
      } catch { }
    }

    // 2. CCCD Pipe Format: CCCD|CMND|HọTen|DDMMYYYY|GiớiTính|ĐịaChỉ|NgàyCấp
    // Ví dụ: 001201012345|123456789|Nguyễn Văn A|15081995|Nam|123 Đường ABC, Phường X, Quận Y, TP.HCM|20102021
    const parts = text.split('|');
    if (parts.length >= 5) {
      const idNum = parts[0].trim();
      if (/^\d{12}$/.test(idNum) || /^\d{9}$/.test(idNum)) {
        result.identityNumber = idNum;
      }

      if (parts[2] && parts[2].trim()) {
        result.fullName = parts[2].trim();
      }

      if (parts[3] && parts[3].trim()) {
        const dobStr = parts[3].trim();
        if (/^\d{8}$/.test(dobStr)) {
          const day = dobStr.substring(0, 2);
          const month = dobStr.substring(2, 4);
          const year = dobStr.substring(4, 8);
          result.dateOfBirth = `${year}-${month}-${day}`;
        } else if (dobStr.includes('/')) {
          const [d, m, y] = dobStr.split('/');
          if (d && m && y) {
            result.dateOfBirth = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
          }
        }
      }

      if (parts[4]) {
        const genderStr = parts[4].trim().toLowerCase();
        if (genderStr.startsWith('nam') || genderStr === 'male' || genderStr === '1') {
          result.gender = 'MALE';
        } else if (
          genderStr.startsWith('nữ') ||
          genderStr.startsWith('nu') ||
          genderStr === 'female' ||
          genderStr === '2'
        ) {
          result.gender = 'FEMALE';
        } else {
          result.gender = 'OTHER';
        }
      }

      if (parts[5] && parts[5].trim()) {
        result.address = parts[5].trim();
      }

      return Object.keys(result).length > 0 ? result : null;
    }

    return null;
  };

  const processQRResult = (rawString: string) => {
    const parsed = parseQRCodeData(rawString);
    if (parsed) {
      setFormData((prev) => ({
        ...prev,
        fullName: parsed.fullName || prev.fullName,
        identityNumber: parsed.identityNumber || prev.identityNumber,
        dateOfBirth: parsed.dateOfBirth || prev.dateOfBirth,
        gender: parsed.gender || prev.gender,
        address: parsed.address || prev.address,
        phone: parsed.phone || prev.phone,
        healthInsurance: parsed.healthInsurance || prev.healthInsurance,
        medicalHistory: parsed.medicalHistory || prev.medicalHistory,
        allergies: parsed.allergies || prev.allergies,
        emergencyContact: parsed.emergencyContact || prev.emergencyContact,
        emergencyPhone: parsed.emergencyPhone || prev.emergencyPhone,
      }));
      toast.success('Đã quét & điền thông tin tự động từ mã QR!');
      setIsScannerOpen(false);
      stopCamera();
    } else {
      toast.error('Mã QR không hợp lệ hoặc không đúng định dạng CCCD/BHYT chuẩn.');
    }
  };

  // Start live camera QR scanning
  const startCamera = async () => {
    try {
      stopCamera();
      setIsCameraActive(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        await videoRef.current.play();
        scanVideoFrame();
      }
    } catch (err) {
      toast.error('Không thể kết nối camera. Vui lòng kiểm tra cấp quyền sử dụng camera trên trình duyệt.');
      setIsCameraActive(false);
    }
  };

  const scanVideoFrame = () => {
    if (!videoRef.current || videoRef.current.readyState !== videoRef.current.HAVE_ENOUGH_DATA) {
      animationFrameRef.current = requestAnimationFrame(scanVideoFrame);
      return;
    }

    const canvas = canvasRef.current || document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'dontInvert',
      });
      if (code && code.data) {
        processQRResult(code.data);
        return;
      }
    }
    animationFrameRef.current = requestAnimationFrame(scanVideoFrame);
  };

  // Upload image QR reader
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const imageData = ctx.getImageData(0, 0, img.width, img.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height);
          if (code && code.data) {
            processQRResult(code.data);
          } else {
            toast.error('Không quét được mã QR từ hình ảnh tải lên. Hãy chọn ảnh rõ nét hơn.');
          }
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const mutation = useMutation({
    mutationFn: (data: CreatePatientProfileDto) =>
      initialData?.id
        ? profileService.update(initialData.id, data)
        : profileService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
      toast.success(initialData?.id ? 'Cập nhật hồ sơ bệnh nhân thành công!' : 'Tạo hồ sơ bệnh nhân thành công!');
      onSuccess();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi lưu hồ sơ');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Form validations
    if (!formData.fullName.trim()) {
      setErrors((prev) => ({ ...prev, fullName: 'Họ tên không được để trống' }));
      return;
    }
    if (!formData.dateOfBirth) {
      setErrors((prev) => ({ ...prev, dateOfBirth: 'Ngày sinh không được để trống' }));
      return;
    }

    const payload: CreatePatientProfileDto = {
      fullName: formData.fullName.trim(),
      phone: formData.phone.trim() || undefined,
      gender: formData.gender,
      dateOfBirth: formData.dateOfBirth ? new Date(formData.dateOfBirth).toISOString() : undefined,
      identityNumber: formData.identityNumber.trim() || undefined,
      address: formData.address.trim() || undefined,
      relation: formData.relation.trim() || undefined,
      healthInsurance: formData.healthInsurance.trim() || undefined,
      medicalHistory: formData.medicalHistory.trim() || undefined,
      allergies: formData.allergies.trim() || undefined,
      emergencyContact: formData.emergencyContact.trim() || undefined,
      emergencyPhone: formData.emergencyPhone.trim() || undefined,
    };

    mutation.mutate(payload);
  };

  return (
    <div className="space-y-5 pt-1">
      {/* 🚀 BANNER QUÉT MÃ QR NHANH */}
      <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-4 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
                Quét mã QR CCCD / BHYT điền nhanh
                <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
              </h4>
              <p className="text-[11px] text-slate-600 font-semibold">
                Quét thẻ CCCD gắn chip để tự động nhập Họ tên, Ngày sinh, CCCD, Địa chỉ chuẩn xác
              </p>
            </div>
          </div>

          <Button
            type="button"
            size="sm"
            onClick={() => {
              setIsScannerOpen(!isScannerOpen);
              if (isScannerOpen) stopCamera();
            }}
            className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs gap-1.5 shadow-xs shrink-0"
          >
            <QrCode className="w-4 h-4" />
            {isScannerOpen ? 'Đóng bộ quét' : 'Mở quét QR'}
          </Button>
        </div>

        {/* CONTROLS QUÉT QR */}
        {isScannerOpen && (
          <div className="bg-white p-4 rounded-xl border border-emerald-200 shadow-sm space-y-4 animate-in fade-in slide-in-from-top-2">
            <div className="flex flex-wrap items-center gap-2 justify-center">
              <Button
                type="button"
                size="sm"
                variant={isCameraActive ? 'destructive' : 'default'}
                onClick={isCameraActive ? stopCamera : startCamera}
                className="gap-1.5 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white"
              >
                <Camera className="w-4 h-4" />
                {isCameraActive ? 'Tắt Camera' : 'Quét qua Camera'}
              </Button>

              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="gap-1.5 text-xs font-bold border-slate-300 text-slate-900 hover:bg-slate-50"
              >
                <Upload className="w-4 h-4" />
                Tải ảnh QR CCCD
              </Button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>

            {/* LIVE CAMERA DISPLAY */}
            {isCameraActive && (
              <div className="relative rounded-xl overflow-hidden bg-black border-2 border-emerald-500 aspect-video max-w-sm mx-auto shadow-md">
                <video ref={videoRef} className="w-full h-full object-cover" />
                <canvas ref={canvasRef} className="hidden" />
                <div className="absolute inset-0 border-2 border-dashed border-emerald-400 m-8 rounded-lg pointer-events-none flex items-center justify-center">
                  <span className="text-[11px] font-bold text-white bg-black/60 px-3 py-1 rounded-full backdrop-blur-xs">
                    Đặt mã QR CCCD vào đây
                  </span>
                </div>
              </div>
            )}

            {/* DIRECT PASTE QR PAYLOAD */}
            <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
              <Input
                type="text"
                placeholder="Dán chuỗi dữ liệu QR CCCD/BHYT (VD: 0012010...|Nguyễn Văn A|...)"
                value={rawQrPaste}
                onChange={(e) => setRawQrPaste(e.target.value)}
                className="text-xs bg-slate-50 border-slate-300 font-mono text-slate-900"
              />
              <Button
                type="button"
                size="sm"
                onClick={() => processQRResult(rawQrPaste)}
                disabled={!rawQrPaste.trim()}
                className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shrink-0"
              >
                Xác nhận
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* FORM INPUTS */}
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* PHẦN 1: THÔNG TIN CƠ BẢN */}
        <div className="space-y-3">
          <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-200 pb-1.5">
            <User className="w-4 h-4 text-slate-700" />
            1. Thông tin cá nhân & Định danh bệnh nhân
          </h4>

          <div className="space-y-1.5">
            <Label htmlFor="fullName" className="text-xs font-bold text-slate-900">
              Họ và tên bệnh nhân <span className="text-red-500">*</span>
            </Label>
            <Input
              id="fullName"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              placeholder="Ví dụ: NGUYỄN VĂN AN"
              className={`bg-white border-slate-300 font-semibold text-slate-900 focus-visible:ring-slate-900 ${errors.fullName ? 'border-red-500' : ''
                }`}
            />
            {errors.fullName && <p className="text-xs text-red-500 font-medium">{errors.fullName}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="gender" className="text-xs font-bold text-slate-900">
                Giới tính <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.gender}
                onValueChange={(val) => setFormData({ ...formData, gender: val as 'MALE' | 'FEMALE' | 'OTHER' })}
              >
                <SelectTrigger className="bg-white border-slate-300 font-semibold text-slate-900">
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
              <Label htmlFor="dateOfBirth" className="text-xs font-bold text-slate-900">
                Ngày sinh <span className="text-red-500">*</span>
              </Label>
              <Input
                id="dateOfBirth"
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                className={`bg-white border-slate-300 font-semibold text-slate-900 focus-visible:ring-slate-900 ${errors.dateOfBirth ? 'border-red-500' : ''
                  }`}
              />
              {errors.dateOfBirth && <p className="text-xs text-red-500 font-medium">{errors.dateOfBirth}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="relation" className="text-xs font-bold text-slate-900">
                Mối quan hệ với bạn
              </Label>
              <Select
                value={formData.relation}
                onValueChange={(val) => setFormData({ ...formData, relation: val })}
              >
                <SelectTrigger className="bg-white border-slate-300 font-semibold text-slate-900">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Bản thân">Bản thân</SelectItem>
                  <SelectItem value="Bố">Bố (Cha)</SelectItem>
                  <SelectItem value="Mẹ">Mẹ</SelectItem>
                  <SelectItem value="Vợ/Chồng">Vợ / Chồng</SelectItem>
                  <SelectItem value="Con">Con cái</SelectItem>
                  <SelectItem value="Ông/Bà">Ông / Bà</SelectItem>
                  <SelectItem value="Người thân">Người thân khác</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="phone" className="text-xs font-bold text-slate-900">
                Số điện thoại liên hệ
              </Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="0912345678"
                className="bg-white border-slate-300 font-semibold text-slate-900 focus-visible:ring-slate-900"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="identityNumber" className="text-xs font-bold text-slate-900">
                Số CCCD / Định danh
              </Label>
              <Input
                id="identityNumber"
                value={formData.identityNumber}
                onChange={(e) => setFormData({ ...formData, identityNumber: e.target.value })}
                placeholder="Mã số 12 chữ số"
                className="bg-white border-slate-300 font-semibold text-slate-900 focus-visible:ring-slate-900"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="healthInsurance" className="text-xs font-bold text-slate-900">
                Mã thẻ BHYT (Bảo hiểm)
              </Label>
              <Input
                id="healthInsurance"
                value={formData.healthInsurance}
                onChange={(e) => setFormData({ ...formData, healthInsurance: e.target.value })}
                placeholder="VD: DN4791234567890"
                className="bg-white border-slate-300 font-semibold text-slate-900 focus-visible:ring-slate-900"
              />
            </div>
          </div>
        </div>

        {/* PHẦN 2: ĐỊA CHỈ THƯỜNG TRÚ */}
        <div className="space-y-3 pt-2">
          <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-200 pb-1.5">
            <MapPin className="w-4 h-4 text-slate-700" />
            2. Địa chỉ cư trú (Chuẩn bệnh viện)
          </h4>

          <div className="space-y-1.5">
            <Label htmlFor="address" className="text-xs font-bold text-slate-900">
              Địa chỉ chi tiết (Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành)
            </Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="VD: 123 Nguyễn Trãi, Phường Bến Thành, Quận 1, TP. Hồ Chí Minh"
              className="bg-white border-slate-300 font-semibold text-slate-900 focus-visible:ring-slate-900"
            />
          </div>
        </div>

        {/* PHẦN 3: LIÊN HỆ KHẨN CẤP */}
        <div className="space-y-3 pt-2">
          <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-200 pb-1.5">
            <PhoneCall className="w-4 h-4 text-slate-700" />
            3. Người liên hệ khẩn cấp (Emergency Contact)
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="emergencyContact" className="text-xs font-bold text-slate-900">
                Họ tên người liên hệ khẩn cấp
              </Label>
              <Input
                id="emergencyContact"
                value={formData.emergencyContact}
                onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                placeholder="VD: Nguyễn Thị B (Mẹ)"
                className="bg-white border-slate-300 font-semibold text-slate-900 focus-visible:ring-slate-900"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="emergencyPhone" className="text-xs font-bold text-slate-900">
                SĐT người liên hệ khẩn cấp
              </Label>
              <Input
                id="emergencyPhone"
                value={formData.emergencyPhone}
                onChange={(e) => setFormData({ ...formData, emergencyPhone: e.target.value })}
                placeholder="0987654321"
                className="bg-white border-slate-300 font-semibold text-slate-900 focus-visible:ring-slate-900"
              />
            </div>
          </div>
        </div>

        {/* PHẦN 4: TIỀN SỬ Y TẾ & DỊ ỨNG */}
        <div className="space-y-3 pt-2">
          <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-200 pb-1.5">
            <Activity className="w-4 h-4 text-slate-700" />
            4. Tiền sử bệnh lý & Dị ứng (Rất quan trọng)
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="medicalHistory" className="text-xs font-bold text-slate-900">
                Tiền sử bệnh lý (Nếu có)
              </Label>
              <Input
                id="medicalHistory"
                value={formData.medicalHistory}
                onChange={(e) => setFormData({ ...formData, medicalHistory: e.target.value })}
                placeholder="VD: Tiểu đường, Tăng huyết áp, Đã từng mổ..."
                className="bg-white border-slate-300 font-semibold text-slate-900 focus-visible:ring-slate-900"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="allergies" className="text-xs font-bold text-slate-900">
                Dị ứng (Thuốc, Thức ăn...)
              </Label>
              <Input
                id="allergies"
                value={formData.allergies}
                onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                placeholder="VD: Dị ứng Penicillin, Hải sản..."
                className="bg-white border-slate-300 font-semibold text-slate-900 focus-visible:ring-slate-900"
              />
            </div>
          </div>
        </div>

        {/* SUBMIT BUTTON */}
        <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
          <Button
            type="submit"
            disabled={mutation.isPending}
            className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm shadow-sm px-6"
          >
            {mutation.isPending ? (
              <>
                <Loader2 className="animate-spin mr-2 h-4 w-4" />
                Đang lưu hồ sơ...
              </>
            ) : (
              'Lưu hồ sơ bệnh nhân'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
