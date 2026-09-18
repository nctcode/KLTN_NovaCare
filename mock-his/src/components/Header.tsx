import React from 'react';
import { Building2, ShieldAlert, Activity } from 'lucide-react';

export function Header() {
  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-3.5">
          <div className="bg-blue-600 p-2.5 rounded-lg flex items-center justify-center shadow-inner">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2 flex-wrap gap-y-1">
              <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white uppercase">
                CỔNG TRA CỨU HỒ SƠ LIÊN THÔNG
              </h1>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                HỆ THỐNG BỆNH VIỆN MÔ PHỎNG
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Bệnh viện mô phỏng NovaCare (Mock HIS) · Gọi trực tiếp API Liên thông NovaCare Core
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-xs bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700 text-slate-300">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="font-mono text-emerald-400">Mock HIS :4000</span>
          <span className="text-slate-500">→</span>
          <span className="font-mono text-blue-400">NovaCare API (Active)</span>
        </div>
      </div>
    </header>
  );
}
