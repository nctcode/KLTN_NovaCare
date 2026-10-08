'use client';

import { useRef } from 'react';

export default function OtpInput({ value, onChange, disabled = false }: { value: string; onChange: (value: string) => void; disabled?: boolean }) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const digits = Array.from({ length: 6 }, (_, index) => value[index] || '');
  const setDigit = (index: number, raw: string) => {
    const input = raw.replace(/\D/g, '');
    if (input.length > 1) { const pasted = input.slice(0, 6); onChange(pasted); refs.current[Math.min(pasted.length, 5)]?.focus(); return; }
    const next = [...digits]; next[index] = input; onChange(next.join('').slice(0, 6));
    if (input && index < 5) refs.current[index + 1]?.focus();
  };
  return <div className="grid grid-cols-6 gap-2" aria-label="Mã OTP gồm 6 chữ số">
    {digits.map((digit, index) => <input key={index} ref={node => { refs.current[index] = node; }} value={digit} disabled={disabled}
      inputMode="numeric" autoComplete={index === 0 ? 'one-time-code' : 'off'} maxLength={1}
      onChange={event => setDigit(index, event.target.value)}
      onKeyDown={event => { if (event.key === 'Backspace' && !digit && index > 0) refs.current[index - 1]?.focus(); }}
      onPaste={event => { event.preventDefault(); setDigit(index, event.clipboardData.getData('text')); }}
      className="h-12 min-w-0 rounded-xl border border-[#DDE5E1] text-center text-xl font-bold text-[#15231F] outline-none focus:border-[#10A66A] focus:ring-4 focus:ring-[#10A66A]/10 disabled:bg-gray-100" />)}
  </div>;
}
