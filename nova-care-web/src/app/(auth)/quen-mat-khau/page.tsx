'use client';
import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import AuthBrandPanel from '@/components/auth/AuthBrandPanel';
import OtpInput from '@/components/auth/OtpInput';
import { authService } from '@/services/auth.service';
type Step = 'PHONE' | 'OTP' | 'PASSWORD' | 'DONE';
const message = (e: any) => e?.response?.data?.message || 'Không thể thực hiện yêu cầu. Vui lòng thử lại.';
export default function ForgotPasswordPage() {
  const [step, setStep] = useState<Step>('PHONE'); const [phone, setPhone] = useState(''); const [otp, setOtp] = useState(''); const [token, setToken] = useState('');
  const [password, setPassword] = useState(''); const [confirm, setConfirm] = useState(''); const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const [seconds, setSeconds] = useState(0);
  useEffect(() => { if (!seconds) return; const id = setInterval(() => setSeconds(v => Math.max(0, v - 1)), 1000); return () => clearInterval(id); }, [seconds]);
  const request = async (e?: FormEvent) => { e?.preventDefault(); setBusy(true); setError(''); try { await authService.forgotPassword({ phone: phone.trim() }); setStep('OTP'); setOtp(''); setSeconds(60); } catch (x) { setError(message(x)); } finally { setBusy(false); } };
  const verify = async (e: FormEvent) => { e.preventDefault(); if (otp.length !== 6) return setError('Vui lòng nhập đủ 6 chữ số.'); setBusy(true); setError(''); try { const r: any = await authService.verifyPasswordOtp({ phone: phone.trim(), otpCode: otp }); setToken(r.data.resetToken); setStep('PASSWORD'); } catch (x) { setError(message(x)); } finally { setBusy(false); } };
  const reset = async (e: FormEvent) => { e.preventDefault(); if (password.length < 6 || password.length > 128) return setError('Mật khẩu phải có từ 6 đến 128 ký tự.'); if (password !== confirm) return setError('Mật khẩu xác nhận không khớp.'); setBusy(true); setError(''); try { await authService.resetPassword({ resetToken: token, newPassword: password }); setStep('DONE'); } catch (x) { setError(message(x)); } finally { setBusy(false); } };
  const title = step === 'PHONE' ? 'Quên mật khẩu?' : step === 'OTP' ? 'Nhập mã OTP' : step === 'PASSWORD' ? 'Tạo mật khẩu mới' : 'Đổi mật khẩu thành công';
  return <div className="min-h-screen flex bg-[#F7FAF8] lg:bg-white"><AuthBrandPanel/><main className="flex flex-1 items-center justify-center p-4 sm:p-8"><section className="w-full max-w-[470px] rounded-2xl border border-[#E1E8E5] bg-white p-6 shadow-sm sm:p-9"><div className="mb-6 text-xs font-semibold uppercase tracking-wider text-[#075E47]">Khôi phục tài khoản</div><h1 className="text-3xl font-bold text-[#15231F]">{title}</h1><p className="mt-2 mb-6 text-sm text-[#66756F]">{step === 'PHONE' ? 'Nhập số điện thoại đã đăng ký.' : step === 'OTP' ? `Chỉ nhập mã 6 chữ số được gửi đến ${phone}.` : step === 'PASSWORD' ? 'OTP đã đúng. Bây giờ bạn có thể tạo mật khẩu mới.' : 'Hãy đăng nhập bằng mật khẩu mới.'}</p>{error && <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
    {step === 'PHONE' && <form onSubmit={request} className="space-y-4"><Field label="Số điện thoại" value={phone} set={setPhone}/><Primary busy={busy}>Gửi mã OTP</Primary></form>}
    {step === 'OTP' && <form onSubmit={verify} className="space-y-5"><OtpInput value={otp} onChange={setOtp} disabled={busy}/><Primary busy={busy}>Xác nhận OTP</Primary><button type="button" disabled={busy || seconds > 0} onClick={() => request()} className="w-full text-sm font-semibold text-[#075E47] disabled:text-gray-400">{seconds ? `Gửi lại sau ${seconds}s` : 'Gửi lại mã'}</button></form>}
    {step === 'PASSWORD' && <form onSubmit={reset} className="space-y-4"><Field label="Mật khẩu mới" value={password} set={setPassword} type="password"/><Field label="Xác nhận mật khẩu" value={confirm} set={setConfirm} type="password"/><Primary busy={busy}>Đổi mật khẩu</Primary></form>}
    {step === 'DONE' ? <Link href="/dang-nhap" className="flex h-12 items-center justify-center rounded-xl bg-[#10A66A] font-bold text-white">Đăng nhập</Link> : <p className="mt-6 text-center"><Link href="/dang-nhap" className="text-sm font-semibold text-[#075E47]">Quay lại đăng nhập</Link></p>}
  </section></main></div>;
}
function Field({ label, value, set, type = 'tel' }: any) { return <label className="block text-sm font-medium text-[#15231F]">{label}<input required type={type} value={value} onChange={e => set(e.target.value)} className="mt-1.5 h-12 w-full rounded-xl border border-[#DDE5E1] px-4 outline-none focus:border-[#10A66A] focus:ring-4 focus:ring-[#10A66A]/10" /></label>; }
function Primary({ children, busy }: any) { return <button disabled={busy} className="h-12 w-full rounded-xl bg-[#10A66A] font-bold text-white disabled:opacity-60">{busy ? 'Đang xử lý…' : children}</button>; }
