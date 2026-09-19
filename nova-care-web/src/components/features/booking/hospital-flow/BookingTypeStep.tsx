'use client';

import { Sparkles, ChevronRight, CheckCircle2 } from 'lucide-react';
import { BookingType, BOOKING_TYPES_CONFIG } from '@/config/bookingTypes';

interface BookingTypeStepProps {
  hospitalName: string;
  selectedMode: BookingType | null;
  onSelectMode: (mode: BookingType) => void;
}

export function BookingTypeStep({ hospitalName, selectedMode, onSelectMode }: BookingTypeStepProps) {
  const bookingOptions = Object.values(BOOKING_TYPES_CONFIG);

  return (
    <div className="space-y-6 max-w-4xl mx-auto py-2">
      {/* Header section - Medpro style */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-extrabold text-[#0c4b39]">
          <Sparkles className="w-3.5 h-3.5 text-[#0c4b39]" />
          <span>Hình thức đặt khám</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-[#0c4b39] tracking-tight">
          Các hình thức đặt khám
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 max-w-lg mx-auto font-medium">
          Đặt khám nhanh chóng, không phải chờ đợi tại {hospitalName}
        </p>
      </div>

      {/* Grid 2-column layout - Medpro style */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
        {bookingOptions.map((opt) => {
          const Icon = opt.icon;
          const isSelected = selectedMode === opt.id;

          return (
            <div
              key={opt.id}
              onClick={() => onSelectMode(opt.id)}
              className={`group flex items-center justify-between p-4 sm:p-5 rounded-2xl border-2 transition-all duration-200 cursor-pointer shadow-xs hover:shadow-md hover:-translate-y-0.5 ${
                isSelected
                  ? `${opt.color} ring-2 ring-[#0c4b39]/20 shadow-md`
                  : 'bg-white border-slate-200/90 hover:border-emerald-400 hover:bg-slate-50/50'
              }`}
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className={`w-12 h-12 sm:w-13 sm:h-13 rounded-2xl ${opt.iconBg} border border-slate-200/60 shadow-xs flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform`}>
                  <Icon className="w-6 h-6 text-current" />
                </div>
                <div className="space-y-0.5 min-w-0">
                  <h3 className="text-base font-black text-slate-950 tracking-tight leading-snug truncate">
                    {opt.title}
                  </h3>
                  <p className="text-xs font-semibold text-slate-500 truncate">
                    {opt.badge}
                  </p>
                </div>
              </div>

              <div className="shrink-0 ml-3">
                {isSelected ? (
                  <CheckCircle2 className="w-6 h-6 text-[#0c4b39]" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-[#0c4b39] group-hover:translate-x-1 transition-all" />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
