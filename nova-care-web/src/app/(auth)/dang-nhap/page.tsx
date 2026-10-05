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
  AlertCircle,
  ShieldCheck,
  Activity,
  HeartHandshake
} from 'lucide-react';

export default function LoginPage() {
  const { loginAsync, isLoginLoading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [errors, setErrors] = useState<{ username?: string; password?: string }>({});
  const [serverError, setServerError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);

    const newErrors: { username?: string; password?: string } = {};

    // Validation
    if (!formData.username.trim()) {
      newErrors.username = 'Vui lòng nhập email hoặc số điện thoại';
    }
    if (!formData.password) {
      newErrors.password = 'Vui lòng nhập mật khẩu';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      await loginAsync({
        username: formData.username.trim(),
        password: formData.password,
      });
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        'Email, số điện thoại hoặc mật khẩu chưa chính xác.';
      setServerError(msg);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-[#F7FAF8]">
      {/* Cột trái: NovaCare Healthcare Branding Panel (Desktop >= 1024px) */}
      <AuthBrandPanel />

      {/* Cột phải: Khu vực Đăng nhập (45–50% Desktop, Fullwidth trên Mobile/Tablet) */}
      <div className="flex-1 flex flex-col justify-between px-4 py-8 sm:px-8 sm:py-12 lg:px-12 xl:px-16 min-h-screen bg-[#F7FAF8] lg:bg-white/80">
        {/* Mobile / Tablet Header: Chỉ hiển thị trên màn hình nhỏ khi ẩn Brand Panel */}
        <div className="lg:hidden flex items-center justify-between mb-8 pb-4 border-b border-gray-100">
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
            <span>Nền tảng y tế</span>
          </div>
        </div>

        {/* Khung Form đăng nhập chính giữa */}
        <div className="w-full max-w-[450px] mx-auto my-auto">
          {/* Card container nhẹ nhàng theo chuẩn Healthcare SaaS */}
          <div className="bg-white rounded-2xl sm:border sm:border-[#E5EBE8] sm:shadow-[0_4px_24px_rgba(0,0,0,0.03)] p-6 sm:p-9 lg:p-10 transition-all">
            {/* Header Form */}
            <div className="mb-7">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#EAF8F2] text-[#075E47] text-xs font-semibold tracking-wider uppercase mb-3">
                <span className="w-1.5 h-1.5 rounded-full bg-[#10A66A]" />
                NovaCare Portal
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">
                Chào mừng trở lại
              </h1>
              <p className="text-sm text-gray-500 mt-1.5">
                Đăng nhập để tiếp tục quản lý hồ sơ và đặt khám cùng NovaCare.
              </p>
            </div>

            {/* Inline Error Alert nếu đăng nhập thất bại */}
            {serverError && (
              <div
                role="alert"
                aria-live="polite"
                className="mb-6 p-4 rounded-xl bg-red-50/90 border border-red-200/80 text-red-900 flex items-start gap-3 text-sm animate-in fade-in duration-200"
              >
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold text-red-900">Không thể đăng nhập</p>
                  <p className="text-xs text-red-700 mt-0.5 leading-relaxed">{serverError}</p>
                </div>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} noValidate className="space-y-5">
              {/* Field: Email / Số điện thoại */}
              <div className="space-y-1.5">
                <label
                  htmlFor="username"
                  className="block text-sm font-medium text-gray-700"
                >
                  Email hoặc số điện thoại <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    id="username"
                    name="username"
                    type="text"
                    autoComplete="username"
                    placeholder="Nhập email hoặc số điện thoại"
                    value={formData.username}
                    onChange={(e) => {
                      setFormData({ ...formData, username: e.target.value });
                      if (errors.username) setErrors((prev) => ({ ...prev, username: undefined }));
                      if (serverError) setServerError(null);
                    }}
                    className={`w-full h-12 pl-10 pr-4 rounded-xl bg-white border text-sm text-gray-900 placeholder:text-gray-400 transition-colors focus:outline-none focus:ring-4 ${
                      errors.username
                        ? 'border-red-400 focus:border-red-500 focus:ring-red-100'
                        : 'border-[#DDE5E1] focus:border-[#10A66A] focus:ring-[#10A66A]/10'
                    }`}
                  />
                </div>
                {errors.username && (
                  <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{errors.username}</span>
                  </p>
                )}
              </div>

              {/* Field: Mật khẩu */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Mật khẩu <span className="text-red-500">*</span>
                  </label>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="Nhập mật khẩu của bạn"
                    value={formData.password}
                    onChange={(e) => {
                      setFormData({ ...formData, password: e.target.value });
                      if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
                      if (serverError) setServerError(null);
                    }}
                    className={`w-full h-12 pl-10 pr-11 rounded-xl bg-white border text-sm text-gray-900 placeholder:text-gray-400 transition-colors focus:outline-none focus:ring-4 ${
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

              {/* Hàng bổ trợ: Quên mật khẩu? */}
              <div className="flex items-center justify-end pt-0.5">
                <Link
                  href="/quen-mat-khau"
                  className="text-xs sm:text-sm font-medium text-[#10A66A] hover:text-[#0D8F5B] hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[#10A66A]/30 rounded transition-colors"
                >
                  Quên mật khẩu?
                </Link>
              </div>

              {/* Nút Đăng nhập */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoginLoading}
                  className="w-full h-12 rounded-xl bg-[#10A66A] hover:bg-[#0D8F5B] active:bg-[#0A7A4D] text-white font-semibold text-sm sm:text-base flex items-center justify-center gap-2 shadow-sm hover:shadow shadow-[#10A66A]/20 transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer focus:outline-none focus-visible:ring-4 focus-visible:ring-[#10A66A]/30"
                >
                  {isLoginLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>Đang đăng nhập...</span>
                    </>
                  ) : (
                    <span>Đăng nhập</span>
                  )}
                </button>
              </div>

              {/* Điều hướng Đăng ký */}
              <div className="text-center pt-3 text-sm text-gray-600">
                Chưa có tài khoản?{' '}
                <Link
                  href="/dang-ky"
                  className="font-semibold text-[#10A66A] hover:text-[#0D8F5B] hover:underline ml-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#10A66A]/30 rounded transition-colors"
                >
                  Đăng ký ngay
                </Link>
              </div>
            </form>

            {/* Thông điệp bảo mật y tế */}
            <div className="mt-8 pt-5 border-t border-[#E5EBE8] flex items-center justify-center gap-2 text-xs text-gray-500">
              <ShieldCheck className="w-4 h-4 text-[#10A66A] shrink-0" />
              <span className="text-center">Thông tin của bạn được bảo vệ theo chính sách bảo mật NovaCare</span>
            </div>
          </div>
        </div>

        {/* Footer bản quyền chân trang */}
        <div className="mt-8 text-center text-xs text-gray-400">
          © {new Date().getFullYear()} NovaCare Medical Platform. All rights reserved.
        </div>
      </div>
    </div>
  );
}
