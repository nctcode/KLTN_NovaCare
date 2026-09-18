'use client';

import React, { useState, useEffect } from 'react';
import { Search, Lock, KeyRound, User, Building2, FileText, Loader2, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { InteroperabilityLookupPayload } from '@/services/novacare-api.service';

interface LookupFormProps {
  isLoading: boolean;
  onSearch: (payload: InteroperabilityLookupPayload) => void;
  errorMessage: string | null;
  onClearError: () => void;
}

export function LookupForm({ isLoading, onSearch, errorMessage, onClearError }: LookupFormProps) {
  const [query, setQuery] = useState('');
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [doctorName, setDoctorName] = useState('BS. Nguyễn Văn An');
  const [hospitalName, setHospitalName] = useState('Bệnh viện mô phỏng NovaCare');
  const [purpose, setPurpose] = useState('Tiếp nhận khám và hội chẩn liên viện');

  // Multi-step sequential loading messages
  const [loadingStep, setLoadingStep] = useState(0);
  const loadingMessages = [
    'Đang xác thực quyền truy cập...',
    'Đang kết nối NovaCare...',
    'Đang lấy hồ sơ được cấp quyền...',
  ];

  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isLoading) {
      setLoadingStep(0);
      timer = setInterval(() => {
        setLoadingStep((prev) => (prev < loadingMessages.length - 1 ? prev + 1 : prev));
      }, 700);
    } else {
      setLoadingStep(0);
    }
    return () => clearInterval(timer);
  }, [isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    setLocalError(null);
    onClearError();

    const q = query.trim();
    const p = pin.trim();

    if (!q) {
      setLocalError('Vui lòng nhập Mã định danh sổ y tế (NOVA-PAT-...) hoặc Số CCCD của bệnh nhân.');
      return;
    }

    if (!p) {
      setLocalError('Vui lòng nhập Mã PIN bảo mật cá nhân do bệnh nhân cung cấp để tiếp tục tra cứu.');
      return;
    }

    onSearch({
      query: q,
      pin: p,
      doctorName: doctorName.trim(),
      hospitalName: hospitalName.trim(),
      purpose: purpose.trim(),
    });
  };

  const displayError = errorMessage || localError;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="bg-gradient-to-r from-blue-700 to-indigo-800 px-5 py-4 text-white">
        <div className="flex items-center space-x-2.5">
          <Search className="w-5 h-5 text-blue-200" />
          <div>
            <h2 className="font-bold text-base sm:text-lg">TRA CỨU BỆNH ÁN LIÊN THÔNG ĐA VIỆN</h2>
            <p className="text-xs text-blue-100">
              Nhập Mã định danh y tế (NOVA-PAT-...) hoặc Số CCCD cùng Mã PIN bảo mật của bệnh nhân
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-5 space-y-4">
        {displayError && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-2.5 text-rose-800 text-sm">
            <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-semibold block">Không thể hoàn tất tra cứu</span>
              <span>{displayError}</span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Mã định danh / CCCD */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
              Mã Định Danh Sổ Y Tế / Số CCCD <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <KeyRound className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  if (localError) setLocalError(null);
                }}
                placeholder="VD: NOVA-PAT-8255 hoặc 080303008255"
                disabled={isLoading}
                className="w-full pl-9 pr-3 py-2 text-sm font-mono uppercase bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-slate-100 disabled:cursor-not-allowed tracking-wider font-semibold placeholder:font-normal placeholder:tracking-normal"
                required
              />
            </div>
            <span className="text-[11px] text-slate-500">Mã trên Sổ sức khỏe điện tử NovaCare hoặc 12 số CCCD</span>
          </div>

          {/* Mã PIN */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
              Mã PIN bảo mật cá nhân <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showPin ? 'text' : 'password'}
                value={pin}
                onChange={(e) => {
                  setPin(e.target.value);
                  if (localError) setLocalError(null);
                }}
                placeholder="Nhập 4-6 số PIN bảo mật"
                disabled={isLoading}
                maxLength={8}
                required
                className="w-full pl-9 pr-10 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-slate-100 disabled:cursor-not-allowed font-mono tracking-widest"
              />
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                tabIndex={-1}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
              >
                {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <span className="text-[11px] text-slate-500">Mã PIN xác thực bảo vệ bệnh án</span>
          </div>
        </div>

        {/* Thông tin ngữ cảnh tra cứu */}
        <div className="pt-2 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-600">
              Người tra cứu (Bác sĩ)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
                <User className="w-3.5 h-3.5" />
              </div>
              <input
                type="text"
                value={doctorName}
                onChange={(e) => setDoctorName(e.target.value)}
                disabled={isLoading}
                className="w-full pl-8 pr-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-600">
              Cơ sở y tế yêu cầu
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
                <Building2 className="w-3.5 h-3.5" />
              </div>
              <input
                type="text"
                value={hospitalName}
                onChange={(e) => setHospitalName(e.target.value)}
                disabled={isLoading}
                className="w-full pl-8 pr-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-600">
              Mục đích tra cứu
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
                <FileText className="w-3.5 h-3.5" />
              </div>
              <input
                type="text"
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                disabled={isLoading}
                className="w-full pl-8 pr-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Action Button & Loading Display */}
        <div className="pt-3">
          <button
            type="submit"
            disabled={isLoading || !query.trim()}
            className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-sm rounded-lg shadow transition-all duration-150 flex items-center justify-center space-x-2 disabled:bg-slate-300 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{loadingMessages[loadingStep]}</span>
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                <span>TRA CỨU HỒ SƠ</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
