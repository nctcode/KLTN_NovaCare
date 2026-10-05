'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authService } from '@/services/auth.service';
import AuthBrandPanel from '@/components/auth/AuthBrandPanel';
import {
  Phone,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
  RotateCcw,
  ShieldCheck,
  Activity,
  HeartHandshake,
  KeyRound
} from 'lucide-react';
import { toast } from 'sonner';

type Step = 'REQUEST_OTP' | 'VERIFY_AND_RESET' | 'SUCCESS';

export default function ForgotPasswordPage() {
  const router = useRouter();

  // Stepper state
  const [step, setStep] = useState<Step>('REQUEST_OTP');
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  // Form State
  const [phoneOrEmail, setPhoneOrEmail] = useState('');
  const [maskedDestination, setMaskedDestination] = useState('');
  const [demoOtp, setDemoOtp] = useState<string | null>(null);

  // OTP inputs (6 digits)
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Password State
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Field errors
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Countdown timer for Resend OTP (60s)
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (step === 'VERIFY_AND_RESET' && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [step, countdown]);

  // Handle Send OTP (Step 1)
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);
    setFieldErrors({});

    const trimmed = phoneOrEmail.trim();
    if (!trimmed) {
      setFieldErrors({ phoneOrEmail: 'Vui lòng nhập số điện thoại hoặc email' });
      return;
    }

    setIsLoading(true);
    try {
      const isEmail = trimmed.includes('@');
      const payload = isEmail ? { email: trimmed } : { phone: trimmed };
      const response: any = await authService.forgotPassword(payload);
      const resData = response?.data || response;

      const masked = resData?.maskedPhone || response?.maskedPhone || trimmed;
      setMaskedDestination(masked);

      if (resData?.otpCode || response?.otpCode) {
        setDemoOtp(resData?.otpCode || response?.otpCode);
      }

      toast.success(response?.message || 'Mã OTP đã được gửi thành công!');
      setStep('VERIFY_AND_RESET');
      setCountdown(60);
      setCanResend(false);
      setTimeout(() => {
        otpInputRefs.current[0]?.focus();
      }, 100);
    } catch (err: any) {
      const errMessage = err?.response?.data?.message;
      let msg = 'Không tìm thấy tài khoản tương ứng với thông tin đã cung cấp.';
      if (Array.isArray(errMessage)) {
        msg = errMessage.join(' · ');
      } else if (typeof errMessage === 'string') {
        msg = errMessage;
      }
      setServerError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Resend OTP
  const handleResendOtp = async () => {
    if (!canResend || isLoading) return;
    setServerError(null);
    setIsLoading(true);
    try {
      const isEmail = phoneOrEmail.includes('@');
      const payload = isEmail ? { email: phoneOrEmail.trim() } : { phone: phoneOrEmail.trim() };
      const response: any = await authService.forgotPassword(payload);
      if (response.otpCode) {
        setDemoOtp(response.otpCode);
      }
      toast.success('Đã gửi lại mã OTP mới!');
      setCountdown(60);
      setCanResend(false);
      setOtpDigits(['', '', '', '', '', '']);
      otpInputRefs.current[0]?.focus();
    } catch (err: any) {
      setServerError(err?.response?.data?.message || 'Không thể gửi lại mã OTP');
    } finally {
      setIsLoading(false);
    }
  };

  // OTP Input Handlers
  const handleOtpChange = (index: number, value: string) => {
    // Only accept numeric digit
    const cleaned = value.replace(/\D/g, '');
    const newDigits = [...otpDigits];

    if (cleaned.length > 1) {
      // Handle paste of 6 digits
      const pasted = cleaned.slice(0, 6).split('');
      for (let i = 0; i < 6; i++) {
        newDigits[i] = pasted[i] || '';
      }
      setOtpDigits(newDigits);
      const nextFocus = Math.min(pasted.length, 5);
      otpInputRefs.current[nextFocus]?.focus();
      return;
    }

    newDigits[index] = cleaned;
    setOtpDigits(newDigits);

    // Auto-focus next input
    if (cleaned && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  // Handle Reset Password (Step 2)
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);
    setFieldErrors({});

    const otpCode = otpDigits.join('');
    const newErrors: Record<string, string> = {};

    if (otpCode.length < 6) {
      newErrors.otp = 'Vui lòng nhập đầy đủ mã OTP 6 chữ số';
    }
    if (newPassword.length < 6) {
      newErrors.newPassword = 'Mật khẩu mới phải có ít nhất 6 ký tự';
    }
    if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = 'Mật khẩu xác nhận không khớp';
    }

    if (Object.keys(newErrors).length > 0) {
      setFieldErrors(newErrors);
      return;
    }

    setIsLoading(true);
    try {
      const isEmail = phoneOrEmail.includes('@');
      const payload = {
        ...(isEmail ? { email: phoneOrEmail.trim() } : { phone: phoneOrEmail.trim() }),
        otpCode,
        newPassword,
      };

      const response = await authService.resetPassword(payload);
      toast.success(response.message || 'Đặt lại mật khẩu thành công!');
      setStep('SUCCESS');
    } catch (err: any) {
      const errMessage = err?.response?.data?.message;
      let msg = 'Mã OTP không hợp lệ hoặc đã hết hạn. Vui lòng kiểm tra lại.';
      if (Array.isArray(errMessage)) {
        msg = errMessage.join(' · ');
      } else if (typeof errMessage === 'string') {
        msg = errMessage;
      }
      setServerError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-[#F7FAF8]">
      {/* Cột trái: NovaCare Healthcare Branding Panel (Desktop >= 1024px) */}
      <AuthBrandPanel />

      {/* Cột phải: Khu vực Quên Mật Khẩu (Fullwidth Mobile/Tablet, 45-50% Desktop) */}
      <div className="flex-1 flex flex-col justify-between px-4 py-8 sm:px-8 sm:py-12 lg:px-12 xl:px-16 min-h-screen bg-[#F7FAF8] lg:bg-white/80 overflow-y-auto">
        {/* Mobile / Tablet Header */}
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
            <span>Khôi phục tài khoản</span>
          </div>
        </div>

        {/* Khung Form trung tâm */}
        <div className="w-full max-w-[460px] mx-auto my-auto py-4">
          <div className="bg-white rounded-2xl sm:border sm:border-[#E5EBE8] sm:shadow-[0_4px_24px_rgba(0,0,0,0.03)] p-6 sm:p-9 transition-all">
            {/* ============================================================== */}
            {/* STEP 1: YÊU CẦU NHẬP SỐ ĐIỆN THOẠI ĐỂ GỬI MÃ OTP                */}
            {/* ============================================================== */}
            {step === 'REQUEST_OTP' && (
              <div>
                <div className="mb-6">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#EAF8F2] text-[#075E47] text-xs font-semibold tracking-wider uppercase mb-3">
                    <KeyRound className="w-3.5 h-3.5 text-[#10A66A]" />
                    Xác thực OTP
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">
                    Quên mật khẩu?
                  </h1>
                  <p className="text-sm text-gray-500 mt-1.5 leading-relaxed">
                    Nhập số điện thoại đã đăng ký để nhận mã xác thực OTP gửi qua tin nhắn SMS đặt lại mật khẩu.
                  </p>
                </div>

                {/* Inline Error Alert */}
                {serverError && (
                  <div
                    role="alert"
                    className="mb-5 p-4 rounded-xl bg-red-50/90 border border-red-200/80 text-red-900 flex items-start gap-3 text-sm animate-in fade-in duration-200"
                  >
                    <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-semibold text-red-900">Không thể gửi mã OTP</p>
                      <p className="text-xs text-red-700 mt-0.5 leading-relaxed">{serverError}</p>
                    </div>
                  </div>
                )}

                <form onSubmit={handleRequestOtp} noValidate className="space-y-5">
                  <div className="space-y-1.5">
                    <label
                      htmlFor="phoneOrEmail"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Số điện thoại <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                        <Phone className="w-4 h-4" />
                      </div>
                      <input
                        id="phoneOrEmail"
                        type="text"
                        autoComplete="tel"
                        placeholder="Nhập số điện thoại (ví dụ: 0912345678)"
                        value={phoneOrEmail}
                        onChange={(e) => {
                          setPhoneOrEmail(e.target.value);
                          if (fieldErrors.phoneOrEmail) {
                            setFieldErrors((prev) => {
                              const n = { ...prev };
                              delete n.phoneOrEmail;
                              return n;
                            });
                          }
                          if (serverError) setServerError(null);
                        }}
                        className={`w-full h-12 pl-10 pr-4 rounded-xl bg-white border text-sm text-gray-900 placeholder:text-gray-400 transition-colors focus:outline-none focus:ring-4 ${
                          fieldErrors.phoneOrEmail
                            ? 'border-red-400 focus:border-red-500 focus:ring-red-100'
                            : 'border-[#DDE5E1] focus:border-[#10A66A] focus:ring-[#10A66A]/10'
                        }`}
                      />
                    </div>
                    {fieldErrors.phoneOrEmail && (
                      <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>{fieldErrors.phoneOrEmail}</span>
                      </p>
                    )}
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full h-12 rounded-xl bg-[#10A66A] hover:bg-[#0D8F5B] active:bg-[#0A7A4D] text-white font-semibold text-sm sm:text-base flex items-center justify-center gap-2 shadow-sm hover:shadow shadow-[#10A66A]/20 transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer focus:outline-none focus-visible:ring-4 focus-visible:ring-[#10A66A]/30"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-white" />
                          <span>Đang gửi mã OTP...</span>
                        </>
                      ) : (
                        <span>Nhận mã xác thực OTP</span>
                      )}
                    </button>
                  </div>

                  <div className="pt-2 text-center">
                    <Link
                      href="/dang-nhap"
                      className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span>Quay lại trang Đăng nhập</span>
                    </Link>
                  </div>
                </form>
              </div>
            )}

            {/* ============================================================== */}
            {/* STEP 2: NHẬP MÃ OTP 6 CHỮ SỐ VÀ ĐẶT MẬT KHẨU MỚI              */}
            {/* ============================================================== */}
            {step === 'VERIFY_AND_RESET' && (
              <div>
                <div className="mb-6">
                  <button
                    type="button"
                    onClick={() => {
                      setStep('REQUEST_OTP');
                      setServerError(null);
                    }}
                    className="inline-flex items-center gap-1 text-xs text-[#075E47] hover:text-[#064E3B] font-medium mb-3 cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" /> Thay đổi số điện thoại
                  </button>

                  <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">
                    Xác thực OTP
                  </h1>
                  <p className="text-sm text-gray-500 mt-1.5 leading-relaxed">
                    Mã xác thực 6 chữ số đã được gửi tới số{' '}
                    <strong className="text-gray-800 font-semibold">{maskedDestination}</strong>.
                  </p>

                  {/* Hiển thị demo OTP nếu có để tiện kiểm thử */}
                  {demoOtp && (
                    <div className="mt-2.5 px-3 py-1.5 rounded-lg bg-[#EAF8F2] border border-[#10A66A]/30 flex items-center justify-between text-xs text-[#075E47]">
                      <span>Mã OTP thử nghiệm: <strong className="tracking-widest font-bold text-sm text-[#064E3B]">{demoOtp}</strong></span>
                      <button
                        type="button"
                        onClick={() => {
                          const digits = demoOtp.split('');
                          setOtpDigits(digits);
                          toast.info('Đã tự động điền mã OTP thử nghiệm');
                        }}
                        className="text-xs font-semibold text-[#10A66A] hover:underline cursor-pointer"
                      >
                        Tự động điền
                      </button>
                    </div>
                  )}
                </div>

                {/* Inline Error Alert */}
                {serverError && (
                  <div
                    role="alert"
                    className="mb-5 p-4 rounded-xl bg-red-50/90 border border-red-200/80 text-red-900 flex items-start gap-3 text-sm animate-in fade-in duration-200"
                  >
                    <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-semibold text-red-900">Xác thực không thành công</p>
                      <p className="text-xs text-red-700 mt-0.5 leading-relaxed">{serverError}</p>
                    </div>
                  </div>
                )}

                <form onSubmit={handleResetPassword} noValidate className="space-y-4">
                  {/* Ô nhập OTP 6 chữ số */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Mã xác thực OTP (6 chữ số) <span className="text-red-500">*</span>
                    </label>
                    <div className="flex justify-between gap-1.5 sm:gap-2">
                      {otpDigits.map((digit, idx) => (
                        <input
                          key={idx}
                          ref={(el) => { otpInputRefs.current[idx] = el; }}
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          value={digit}
                          onChange={(e) => handleOtpChange(idx, e.target.value)}
                          onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                          className="w-11 sm:w-13 h-12 text-center text-lg sm:text-xl font-bold rounded-xl border border-[#DDE5E1] bg-white focus:outline-none focus:border-[#10A66A] focus:ring-4 focus:ring-[#10A66A]/10 text-gray-900"
                        />
                      ))}
                    </div>
                    {fieldErrors.otp && (
                      <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>{fieldErrors.otp}</span>
                      </p>
                    )}

                    {/* Resend Countdown */}
                    <div className="flex items-center justify-between text-xs pt-1 text-gray-500">
                      <span>Không nhận được mã?</span>
                      {canResend ? (
                        <button
                          type="button"
                          onClick={handleResendOtp}
                          disabled={isLoading}
                          className="font-semibold text-[#10A66A] hover:text-[#0D8F5B] hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <RotateCcw className="w-3.5 h-3.5" /> Gửi lại mã OTP
                        </button>
                      ) : (
                        <span className="text-gray-400">
                          Gửi lại sau <strong className="text-gray-600">{countdown}s</strong>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Field: Mật khẩu mới */}
                  <div className="space-y-1.5 pt-1">
                    <label
                      htmlFor="newPassword"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Mật khẩu mới <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                        <Lock className="w-4 h-4" />
                      </div>
                      <input
                        id="newPassword"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Tối thiểu 6 ký tự"
                        value={newPassword}
                        onChange={(e) => {
                          setNewPassword(e.target.value);
                          if (fieldErrors.newPassword) {
                            setFieldErrors((prev) => {
                              const n = { ...prev };
                              delete n.newPassword;
                              return n;
                            });
                          }
                          if (serverError) setServerError(null);
                        }}
                        className={`w-full h-11 sm:h-12 pl-10 pr-11 rounded-xl bg-white border text-sm text-gray-900 placeholder:text-gray-400 transition-colors focus:outline-none focus:ring-4 ${
                          fieldErrors.newPassword
                            ? 'border-red-400 focus:border-red-500 focus:ring-red-100'
                            : 'border-[#DDE5E1] focus:border-[#10A66A] focus:ring-[#10A66A]/10'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiển thị mật khẩu'}
                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {fieldErrors.newPassword && (
                      <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>{fieldErrors.newPassword}</span>
                      </p>
                    )}
                  </div>

                  {/* Field: Xác nhận mật khẩu mới */}
                  <div className="space-y-1.5">
                    <label
                      htmlFor="confirmPassword"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Xác nhận mật khẩu mới <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                        <Lock className="w-4 h-4" />
                      </div>
                      <input
                        id="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="Nhập lại mật khẩu mới"
                        value={confirmPassword}
                        onChange={(e) => {
                          setConfirmPassword(e.target.value);
                          if (fieldErrors.confirmPassword) {
                            setFieldErrors((prev) => {
                              const n = { ...prev };
                              delete n.confirmPassword;
                              return n;
                            });
                          }
                          if (serverError) setServerError(null);
                        }}
                        className={`w-full h-11 sm:h-12 pl-10 pr-11 rounded-xl bg-white border text-sm text-gray-900 placeholder:text-gray-400 transition-colors focus:outline-none focus:ring-4 ${
                          fieldErrors.confirmPassword
                            ? 'border-red-400 focus:border-red-500 focus:ring-red-100'
                            : 'border-[#DDE5E1] focus:border-[#10A66A] focus:ring-[#10A66A]/10'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        aria-label={showConfirmPassword ? 'Ẩn xác nhận mật khẩu' : 'Hiển thị xác nhận mật khẩu'}
                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none cursor-pointer"
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {fieldErrors.confirmPassword && (
                      <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>{fieldErrors.confirmPassword}</span>
                      </p>
                    )}
                  </div>

                  {/* Nút Đổi mật khẩu */}
                  <div className="pt-3">
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full h-12 rounded-xl bg-[#10A66A] hover:bg-[#0D8F5B] active:bg-[#0A7A4D] text-white font-semibold text-sm sm:text-base flex items-center justify-center gap-2 shadow-sm hover:shadow shadow-[#10A66A]/20 transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer focus:outline-none focus-visible:ring-4 focus-visible:ring-[#10A66A]/30"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-white" />
                          <span>Đang xác thực & đổi mật khẩu...</span>
                        </>
                      ) : (
                        <span>Xác nhận & Đổi mật khẩu</span>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* ============================================================== */}
            {/* STEP 3: THÀNH CÔNG                                             */}
            {/* ============================================================== */}
            {step === 'SUCCESS' && (
              <div className="text-center py-4">
                <div className="w-16 h-16 rounded-full bg-[#EAF8F2] border border-[#10A66A]/30 flex items-center justify-center mx-auto mb-5 text-[#10A66A] shadow-inner animate-in zoom-in-95 duration-300">
                  <CheckCircle2 className="w-9 h-9" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Đổi mật khẩu thành công!
                </h2>
                <p className="text-sm text-gray-500 max-w-sm mx-auto leading-relaxed mb-6">
                  Mật khẩu tài khoản NovaCare của bạn đã được cập nhật thành công. Vui lòng đăng nhập lại với mật khẩu mới.
                </p>

                <button
                  type="button"
                  onClick={() => router.push('/dang-nhap')}
                  className="w-full h-12 rounded-xl bg-[#10A66A] hover:bg-[#0D8F5B] active:bg-[#0A7A4D] text-white font-semibold text-base shadow-sm hover:shadow shadow-[#10A66A]/20 transition-all cursor-pointer"
                >
                  Đăng nhập ngay
                </button>
              </div>
            )}

            {/* Footer bảo mật */}
            <div className="mt-6 pt-5 border-t border-[#E5EBE8] flex items-center justify-center gap-2 text-xs text-gray-500">
              <ShieldCheck className="w-4 h-4 text-[#10A66A] shrink-0" />
              <span className="text-center">Xác thực OTP bảo mật 2 lớp chuẩn y tế NovaCare</span>
            </div>
          </div>
        </div>

        {/* Chân trang */}
        <div className="mt-6 text-center text-xs text-gray-400">
          © {new Date().getFullYear()} NovaCare Medical Platform. All rights reserved.
        </div>
      </div>
    </div>
  );
}
