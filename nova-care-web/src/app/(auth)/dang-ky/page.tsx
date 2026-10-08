'use client';
import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import AuthBrandPanel from '@/components/auth/AuthBrandPanel';
import OtpInput from '@/components/auth/OtpInput';
import { authService } from '@/services/auth.service';
import { useAuth } from '@/hooks/useAuth';

type Step = 'PHONE' | 'OTP' | 'PROFILE';
const message = (e: any) => e?.response?.data?.message || 'Không thể thực hiện yêu cầu. Vui lòng thử lại.';
export default function RegisterPage() {
  const { registerAsync, isRegisterLoading } = useAuth();
  const [step, setStep] = useState<Step>('PHONE'); const [phone, setPhone] = useState(''); const [otp, setOtp] = useState('');
  const [token, setToken] = useState(''); const [name, setName] = useState(''); const [email, setEmail] = useState('');
  const [password, setPassword] = useState(''); const [confirm, setConfirm] = useState(''); const [busy, setBusy] = useState(false);
  const [error, setError] = useState(''); const [seconds, setSeconds] = useState(0);
  useEffect(() => { if (!seconds) return; const id = setInterval(() => setSeconds(v => Math.max(0, v - 1)), 1000); return () => clearInterval(id); }, [seconds]);
  const request = async (e?: FormEvent) => { e?.preventDefault(); setBusy(true); setError(''); try { await authService.requestRegistrationOtp(phone.trim()); setStep('OTP'); setOtp(''); setSeconds(60); } catch (x) { setError(message(x)); } finally { setBusy(false); } };
  const verify = async (e: FormEvent) => { e.preventDefault(); if (otp.length !== 6) return setError('Vui lòng nhập đủ 6 chữ số.'); setBusy(true); setError(''); try { const r: any = await authService.verifyRegistrationOtp(phone.trim(), otp); setToken(r.data.verificationToken); setPhone(r.data.phone); setStep('PROFILE'); } catch (x) { setError(message(x)); } finally { setBusy(false); } };
  const submit = async (e: FormEvent) => { e.preventDefault(); setError(''); if (!name.trim()) return setError('Vui lòng nhập họ và tên.'); if (password.length < 8 || !/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/\d/.test(password)) return setError('Mật khẩu cần ít nhất 8 ký tự, gồm chữ hoa, chữ thường và số.'); if (password !== confirm) return setError('Mật khẩu xác nhận không khớp.'); try { await registerAsync({ phone, verificationToken: token, fullName: name.trim(), email: email.trim() || undefined, password }); } catch (x) { setError(message(x)); } };
  return <AuthShell title={step === 'PHONE' ? 'Xác minh số điện thoại' : step === 'OTP' ? 'Nhập mã xác thực' : 'Tạo tài khoản mới'} subtitle={step === 'PHONE' ? 'Nhập số điện thoại để nhận mã OTP.' : step === 'OTP' ? `Mã 6 chữ số đã được gửi đến ${phone}.` : `Số điện thoại ${phone} đã được xác minh.`} step={step === 'PHONE' ? '1/3' : step === 'OTP' ? '2/3' : '3/3'} error={error}>
    {step === 'PHONE' && <form onSubmit={request} className="space-y-4"><Field label="Số điện thoại" value={phone} set={setPhone} type="tel" /><Primary busy={busy}>Gửi mã OTP</Primary></form>}
    {step === 'OTP' && <form onSubmit={verify} className="space-y-5"><OtpInput value={otp} onChange={setOtp} disabled={busy} /><Primary busy={busy}>Xác nhận OTP</Primary><button type="button" disabled={busy || seconds > 0} onClick={() => request()} className="w-full text-sm font-semibold text-[#075E47] disabled:text-gray-400">{seconds ? `Gửi lại sau ${seconds}s` : 'Gửi lại mã'}</button><button type="button" onClick={() => setStep('PHONE')} className="w-full text-sm text-gray-500">Đổi số điện thoại</button></form>}
    {step === 'PROFILE' && <form onSubmit={submit} className="space-y-4"><Field label="Họ và tên" value={name} set={setName} /><Field label="Email (tùy chọn)" value={email} set={setEmail} type="email" optional /><Field label="Mật khẩu" value={password} set={setPassword} type="password" /><Field label="Xác nhận mật khẩu" value={confirm} set={setConfirm} type="password" /><Primary busy={isRegisterLoading}>Đăng ký tài khoản</Primary></form>}
    <p className="mt-6 text-center text-sm text-gray-500">Đã có tài khoản? <Link href="/dang-nhap" className="font-semibold text-[#10A66A]">Đăng nhập</Link></p>
  </AuthShell>;
}
function AuthShell({ title, subtitle, step, error, children }: any) { return <div className="min-h-screen flex bg-[#F7FAF8] lg:bg-white"><AuthBrandPanel/><main className="flex flex-1 items-center justify-center p-4 sm:p-8"><section className="w-full max-w-[470px] rounded-2xl border border-[#E1E8E5] bg-white p-6 shadow-sm sm:p-9"><div className="mb-6 text-xs font-semibold uppercase tracking-wider text-[#075E47]">NovaCare Health · Bước {step}</div><h1 className="text-3xl font-bold text-[#15231F]">{title}</h1><p className="mt-2 mb-6 text-sm text-[#66756F]">{subtitle}</p>{error && <div role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}{children}</section></main></div>; }
function Field({ label, value, set, type = 'text', optional = false }: any) { return <label className="block text-sm font-medium text-[#15231F]">{label}<input required={!optional} type={type} value={value} onChange={e => set(e.target.value)} className="mt-1.5 h-12 w-full rounded-xl border border-[#DDE5E1] px-4 outline-none focus:border-[#10A66A] focus:ring-4 focus:ring-[#10A66A]/10" /></label>; }
function Primary({ children, busy }: any) { return <button disabled={busy} className="h-12 w-full rounded-xl bg-[#10A66A] font-bold text-white disabled:opacity-60">{busy ? 'Đang xử lý…' : children}</button>; }
