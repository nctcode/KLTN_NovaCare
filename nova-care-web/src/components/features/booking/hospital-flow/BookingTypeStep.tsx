'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sparkles, Check, ArrowRight } from 'lucide-react';
import { BookingType, BOOKING_TYPES_CONFIG } from '@/config/bookingTypes';

interface BookingTypeStepProps {
  hospitalName: string;
  selectedMode: BookingType | null;
  onSelectMode: (mode: BookingType) => void;
}

export function BookingTypeStep({ hospitalName, selectedMode, onSelectMode }: BookingTypeStepProps) {
  const bookingOptions = Object.values(BOOKING_TYPES_CONFIG);

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-extrabold text-[#0c4b39]">
          <Sparkles className="w-3.5 h-3.5 text-[#0c4b39]" />
          <span>6 Hình thức đặt khám sẵn có</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">
          Lựa Chọn Hình Thức Đặt Khám Tại {hospitalName}
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 max-w-xl mx-auto font-medium">
          Vui lòng chọn 1 trong 6 hình thức đăng ký bên dưới để tiến hành đặt lịch khám phù hợp nhất với nhu cầu của bạn.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
        {bookingOptions.map((opt) => {
          const Icon = opt.icon;
          const isSelected = selectedMode === opt.id;

          return (
            <Card
              key={opt.id}
              onClick={() => onSelectMode(opt.id)}
              className={`border-2 transition-all duration-300 cursor-pointer rounded-3xl p-6 relative flex flex-col justify-between hover:shadow-xl hover:-translate-y-1 ${
                isSelected
                  ? `${opt.color} shadow-lg ring-2 ring-[#0c4b39]`
                  : 'bg-white border-slate-200/90 hover:border-emerald-400'
              }`}
            >
              <CardContent className="p-0 space-y-4 flex flex-col justify-between h-full">
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <div className={`w-12 h-12 rounded-2xl ${opt.iconBg} border border-slate-200/60 shadow-xs flex items-center justify-center shrink-0`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <Badge className={`${opt.badgeColor} text-[10px] font-extrabold px-2.5 py-1 rounded-full text-right leading-tight shadow-xs`}>
                      {opt.badge}
                    </Badge>
                  </div>

                  <div className="space-y-1.5">
                    <h3 className="text-base font-black text-slate-950 tracking-tight leading-snug">{opt.title}</h3>
                    <p className="text-xs text-slate-600 font-medium leading-relaxed">{opt.description}</p>
                  </div>

                  <ul className="space-y-1.5 pt-3 border-t border-slate-200/70 text-xs text-slate-700 font-semibold">
                    {opt.features.map((f, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <Check className="w-3.5 h-3.5 text-[#0c4b39] shrink-0 mt-0.5" />
                        <span className="leading-snug">{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <Button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectMode(opt.id);
                  }}
                  variant={isSelected ? 'default' : 'outline'}
                  className={`w-full text-xs font-bold rounded-2xl h-11 mt-4 transition-all ${
                    isSelected
                      ? 'bg-[#0c4b39] hover:bg-[#09392b] text-white shadow-md'
                      : 'border-[#0c4b39]/30 text-[#0c4b39] hover:bg-emerald-50'
                  }`}
                >
                  <span>{isSelected ? 'Đã Chọn - Tiếp Tục' : 'Chọn hình thức này'}</span>
                  <ArrowRight className="w-4 h-4 ml-1.5" />
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
