'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import AuthBrandPanel from '@/components/auth/AuthBrandPanel';
import {
  Eye,
  EyeOff,
  Loader2,
  Mail,
  Lock,
  User,
  Phone,
  AlertCircle,
  ShieldCheck,
  Activity,
  HeartHandshake
} from 'lucide-react';

export default function RegisterPage() {
  const { registerAsync, isRegisterLoading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);

    const newErrors: Record<string, string> = {};

    // Validation
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Vui lòng nhập họ và tên';
    }
    if (!formData.phone.trim() && !formData.email.trim()) {
      newErrors.phone = 'Vui lòng nhập số điện thoại hoặc email';
    }
    if (formData.password.length < 8) {
      newErrors.password = 'Mật khẩu phải có ít nhất 8 ký tự';
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Mật khẩu xác nhận không khớp';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      const registerData = {
        fullName: formData.fullName.trim(),
        password: formData.password,
        ...(formData.email.trim() && { email: formData.email.trim() }),
        ...(formData.phone.trim() && { phone: formData.phone.trim() }),
      };
      await registerAsync(registerData);
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        'Đăng ký tài khoản không thành công. Vui lòng thử lại.';
      setServerError(msg);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-[#F7FAF8]">
      {/* Cột trái: NovaCare Healthcare Branding Panel (Desktop >= 1024px) */}
      <AuthBrandPanel />

      {/* Cột phải: Khu vực Đăng ký (45–50% Desktop, Fullwidth trên Mobile/Tablet) */}
      <div className="flex-1 flex flex-col justify-between px-4 py-8 sm:px-8 sm:py-10 lg:px-12 xl:px-16 min-h-screen bg-[#F7FAF8] lg:bg-white/80 overflow-y-auto">
        {/* Mobile / Tablet Header */}
        <div className="lg:hidden flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#10A66A] to-[#075E47] flex items-center justify-center text-white shadow-md shadow-[#10A66A]/20">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-bold text-xl tracking-tight text-gray-900 flex items-center gap-1">
                NovaCare
                <span className="text-xs px-1.5 py-0.5 rounded-full bg-[#EAF8F2] text-[#075E47] font-medium">Y tế số</span>
              </span>
            </div>
          </Link>
          <div className="flex items-center gap-1.5 text-xs text-gray-500 bg-white px-3 py-1.5 rounded-full border border-gray-200">
            <HeartHandshake className="w-3.5 h-3.5 text-[#10A66A]" />
            <span>Đăng ký mới</span>
          </div>
        </div>

        {/* Khung Form đăng ký chính */}
        <div className="w-full max-w-[460px] mx-auto my-auto py-2">
          {/* Card container nhẹ nhàng theo chuẩn Healthcare SaaS */}
          <div className="bg-white rounded-2xl sm:border sm:border-[#E5EBE8] sm:shadow-[0_4px_24px_rgba(0,0,0,0.03)] p-6 sm:p-9 transition-all">
            {/* Header Form */}
            <div className="mb-6">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#EAF8F2] text-[#075E47] text-xs font-semibold tracking-wider uppercase mb-3">
                <span className="w-1.5 h-1.5 rounded-full bg-[#10A66A]" />
                NovaCare Health
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">
                Tạo tài khoản mới
              </h1>
              <p className="text-sm text-gray-500 mt-1.5">
                Bắt đầu trải nghiệm đặt khám và quản lý hồ sơ sức khỏe trực tuyến.
              </p>
            </div>

            {/* Inline Error Alert nếu đăng ký thất bại */}
            {serverError && (
              <div
                role="alert"
                aria-live="polite"
                className="mb-5 p-4 rounded-xl bg-red-50/90 border border-red-200/80 text-red-900 flex items-start gap-3 text-sm animate-in fade-in duration-200"
              >
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold text-red-900">Không thể đăng ký</p>
                  <p className="text-xs text-red-700 mt-0.5 leading-relaxed">{serverError}</p>
                </div>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              {/* Field: Họ và tên */}
              <div className="space-y-1.5">
                <label
                  htmlFor="fullName"
                  className="block text-sm font-medium text-gray-700"
                >
                  Họ và tên <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    id="fullName"
                    name="fullName"
                    type="text"
                    autoComplete="name"
                    placeholder="Nguyễn Văn A"
                    value={formData.fullName}
                    onChange={(e) => {
                      setFormData({ ...formData, fullName: e.target.value });
                      if (errors.fullName) setErrors((prev) => { const n = { ...prev }; delete n.fullName; return n; });
                      if (serverError) setServerError(null);
                    }}
                    className={`w-full h-11 sm:h-12 pl-10 pr-4 rounded-xl bg-white border text-sm text-gray-900 placeholder:text-gray-400 transition-colors focus:outline-none focus:ring-4 ${
                      errors.fullName
                        ? 'border-red-400 focus:border-red-500 focus:ring-red-100'
                        : 'border-[#DDE5E1] focus:border-[#10A66A] focus:ring-[#10A66A]/10'
                    }`}
                  />
                </div>
                {errors.fullName && (
                  <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{errors.fullName}</span>
                  </p>
                )}
              </div>

              {/* Field: Số điện thoại */}
              <div className="space-y-1.5">
                <label
                  htmlFor="phone"
                  className="block text-sm font-medium text-gray-700"
                >
                  Số điện thoại <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                    <Phone className="w-4 h-4" />
                  </div>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    autoComplete="tel"
                    placeholder="Ví dụ: 0912345678"
                    value={formData.phone}
                    onChange={(e) => {
                      setFormData({ ...formData, phone: e.target.value });
                      if (errors.phone) setErrors((prev) => { const n = { ...prev }; delete n.phone; return n; });
                      if (serverError) setServerError(null);
                    }}
                    className={`w-full h-11 sm:h-12 pl-10 pr-4 rounded-xl bg-white border text-sm text-gray-900 placeholder:text-gray-400 transition-colors focus:outline-none focus:ring-4 ${
                      errors.phone
                        ? 'border-red-400 focus:border-red-500 focus:ring-red-100'
                        : 'border-[#DDE5E1] focus:border-[#10A66A] focus:ring-[#10A66A]/10'
                    }`}
                  />
                </div>
                {errors.phone && (
                  <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{errors.phone}</span>
                  </p>
                )}
              </div>

              {/* Field: Email */}
              <div className="space-y-1.5">
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700"
                >
                  Email <span className="text-xs text-gray-400 font-normal">(tùy chọn)</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="user@novacare.vn"
                    value={formData.email}
                    onChange={(e) => {
                      setFormData({ ...formData, email: e.target.value });
                      if (errors.email) setErrors((prev) => { const n = { ...prev }; delete n.email; return n; });
                      if (serverError) setServerError(null);
                    }}
                    className="w-full h-11 sm:h-12 pl-10 pr-4 rounded-xl bg-white border border-[#DDE5E1] text-sm text-gray-900 placeholder:text-gray-400 transition-colors focus:outline-none focus:border-[#10A66A] focus:ring-4 focus:ring-[#10A66A]/10"
                  />
                </div>
              </div>

              {/* Field: Mật khẩu */}
              <div className="space-y-1.5">
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700"
                >
                  Mật khẩu <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    placeholder="Ít nhất 8 ký tự"
                    value={formData.password}
                    onChange={(e) => {
                      setFormData({ ...formData, password: e.target.value });
                      if (errors.password) setErrors((prev) => { const n = { ...prev }; delete n.password; return n; });
                      if (serverError) setServerError(null);
                    }}
                    className={`w-full h-11 sm:h-12 pl-10 pr-11 rounded-xl bg-white border text-sm text-gray-900 placeholder:text-gray-400 transition-colors focus:outline-none focus:ring-4 ${
                      errors.password
                        ? 'border-red-400 focus:border-red-500 focus:ring-red-100'
                        : 'border-[#DDE5E1] focus:border-[#10A66A] focus:ring-[#10A66A]/10'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiển thị mật khẩu'}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none focus-visible:text-[#10A66A] cursor-pointer"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{errors.password}</span>
                  </p>
                )}
              </div>

              {/* Field: Xác nhận mật khẩu */}
              <div className="space-y-1.5">
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium text-gray-700"
                >
                  Xác nhận mật khẩu <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    placeholder="Nhập lại mật khẩu"
                    value={formData.confirmPassword}
                    onChange={(e) => {
                      setFormData({ ...formData, confirmPassword: e.target.value });
                      if (errors.confirmPassword) setErrors((prev) => { const n = { ...prev }; delete n.confirmPassword; return n; });
                      if (serverError) setServerError(null);
                    }}
                    className={`w-full h-11 sm:h-12 pl-10 pr-11 rounded-xl bg-white border text-sm text-gray-900 placeholder:text-gray-400 transition-colors focus:outline-none focus:ring-4 ${
                      errors.confirmPassword
                        ? 'border-red-400 focus:border-red-500 focus:ring-red-100'
                        : 'border-[#DDE5E1] focus:border-[#10A66A] focus:ring-[#10A66A]/10'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    aria-label={showConfirmPassword ? 'Ẩn xác nhận mật khẩu' : 'Hiển thị xác nhận mật khẩu'}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none focus-visible:text-[#10A66A] cursor-pointer"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{errors.confirmPassword}</span>
                  </p>
                )}
              </div>

              {/* Nút Đăng ký */}
              <div className="pt-3">
                <button
                  type="submit"
                  disabled={isRegisterLoading}
                  className="w-full h-12 rounded-xl bg-[#10A66A] hover:bg-[#0D8F5B] active:bg-[#0A7A4D] text-white font-semibold text-sm sm:text-base flex items-center justify-center gap-2 shadow-sm hover:shadow shadow-[#10A66A]/20 transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer focus:outline-none focus-visible:ring-4 focus-visible:ring-[#10A66A]/30"
                >
                  {isRegisterLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>Đang tạo tài khoản...</span>
                    </>
                  ) : (
                    <span>Đăng ký tài khoản</span>
                  )}
                </button>
              </div>

              {/* Điều hướng Đăng nhập */}
              <div className="text-center pt-3 text-sm text-gray-600">
                Đã có tài khoản?{' '}
                <Link
                  href="/dang-nhap"
                  className="font-semibold text-[#10A66A] hover:text-[#0D8F5B] hover:underline ml-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#10A66A]/30 rounded transition-colors"
                >
                  Đăng nhập
                </Link>
              </div>
            </form>

            {/* Thông điệp bảo mật */}
            <div className="mt-6 pt-5 border-t border-[#E5EBE8] flex items-center justify-center gap-2 text-xs text-gray-500">
              <ShieldCheck className="w-4 h-4 text-[#10A66A] shrink-0" />
              <span className="text-center">Thông tin cá nhân được bảo mật theo tiêu chuẩn Y tế NovaCare</span>
            </div>
          </div>
        </div>

        {/* Footer bản quyền */}
        <div className="mt-6 text-center text-xs text-gray-400">
          © {new Date().getFullYear()} NovaCare Medical Platform. All rights reserved.
        </div>
      </div>
    </div>
  );
}
