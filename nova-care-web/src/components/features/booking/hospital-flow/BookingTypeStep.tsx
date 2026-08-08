'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { UserCheck, Stethoscope, FileText, Sparkles, ShieldCheck, ChevronRight, Check } from 'lucide-react';

export type HospitalBookingMode = 'doctor' | 'service' | 'standard';

interface BookingTypeStepProps {
  hospitalName: string;
  selectedMode: HospitalBookingMode;
  onSelectMode: (mode: HospitalBookingMode) => void;
}

export function BookingTypeStep({ hospitalName, selectedMode, onSelectMode }: BookingTypeStepProps) {
  const bookingOptions = [
    {
      id: 'doctor' as HospitalBookingMode,
      title: 'Khám Theo Bác Sĩ',
      badge: 'Khuyên dùng • Chọn bác sĩ giỏi',
      description: 'Chủ động chọn Bác sĩ chuyên khoa, xem học vị, lịch khám theo ca và giữ chỗ khám ưu tiên.',
      icon: UserCheck,
      color: 'border-[#0c4b39] bg-emerald-50/70',
      badgeColor: 'bg-[#0c4b39] text-white',
      features: ['Chọn chuyên khoa & bác sĩ phụ trách', 'Xem giá khám & khung giờ trống', 'Giữ chỗ tức thì không chờ đợi'],
    },
    {
      id: 'service' as HospitalBookingMode,
      title: 'Khám Dịch Vụ / Xét Nghiệm',
      badge: 'Khám theo gói dịch vụ y tế',
      description: 'Đặt hẹn các gói khám chuyên sâu, xét nghiệm tổng quát, chẩn đoán hình ảnh kỹ thuật cao.',
      icon: FileText,
      color: 'border-blue-500 bg-blue-50/60',
      badgeColor: 'bg-blue-600 text-white',
      features: ['Gói khám sức khỏe định kỳ', 'Xét nghiệm & chẩn đoán nhanh', 'Nhận kết quả số qua ứng dụng'],
    },
    {
      id: 'standard' as HospitalBookingMode,
      title: 'Khám Thường / Phân Luồng',
      badge: 'Khám tiêu chuẩn tại bệnh viện',
      description: 'Đăng ký khám tổng quát, phân luồng tiếp nhận theo quy trình tiêu chuẩn tại bệnh viện.',
      icon: Stethoscope,
      color: 'border-[#0c4b39] bg-slate-50',
      badgeColor: 'bg-[#0c4b39] text-white',
      features: ['Lấy số thứ tự điện tử', 'Phân luồng phòng khám nhanh', 'Thanh toán tại quầy thu ngân'],
    },
  ];

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <Badge variant="outline" className="bg-emerald-50 text-[#0c4b39] border-emerald-200 text-xs font-bold px-3 py-1 rounded-full">
          Bước 2 • Chọn hình thức đặt khám
        </Badge>
        <h2 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">
          Chọn Hình Thức Đặt Khám Tại {hospitalName}
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 max-w-xl mx-auto font-medium">
          Vui lòng chọn 1 trong 3 hình thức đăng ký đặt khám bên dưới để tiếp tục quy trình
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
        {bookingOptions.map((opt) => {
          const Icon = opt.icon;
          const isSelected = selectedMode === opt.id;

          return (
            <Card
              key={opt.id}
              onClick={() => onSelectMode(opt.id)}
              className={`border-2 transition-all cursor-pointer rounded-3xl p-6 relative flex flex-col justify-between hover:shadow-lg ${
                isSelected
                  ? `${opt.color} shadow-md ring-2 ring-[#0c4b39]`
                  : 'bg-white border-slate-200 hover:border-emerald-300'
              }`}
            >
              <CardContent className="p-0 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-center text-[#0c4b39]">
                    <Icon className="w-6 h-6" />
                  </div>
                  <Badge className={`${opt.badgeColor} text-[10px] font-bold px-2.5 py-0.5 rounded-full`}>
                    {opt.badge}
                  </Badge>
                </div>

                <div className="space-y-1.5">
                  <h3 className="text-lg font-black text-slate-900 tracking-tight">{opt.title}</h3>
                  <p className="text-xs text-slate-600 font-medium leading-relaxed">{opt.description}</p>
                </div>

                <ul className="space-y-1.5 pt-2 border-t border-slate-200/60 text-xs text-slate-700 font-semibold">
                  {opt.features.map((f, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-[#0c4b39] shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  variant={isSelected ? 'default' : 'outline'}
                  className={`w-full text-xs font-bold rounded-2xl h-11 mt-4 ${
                    isSelected
                      ? 'bg-[#0c4b39] hover:bg-[#09392b] text-white'
                      : 'border-slate-300 text-slate-800 hover:bg-slate-100'
                  }`}
                >
                  {isSelected ? 'Đã Chọn - Tiếp Tục' : 'Chọn hình thức này'}
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
