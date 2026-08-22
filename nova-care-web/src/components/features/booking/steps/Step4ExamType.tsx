'use client';

import { useState } from 'react';
import { useBookingStore } from '@/stores/booking.store';
import { ExaminationType, EXAMINATION_TYPES } from '@/types/booking.types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, ChevronRight, ShieldCheck, Stethoscope, Zap, CheckCircle2, Info } from 'lucide-react';

interface Step4ExamTypeProps {
  onNext: () => void;
  onBack: () => void;
}

export function Step4ExamType({ onNext, onBack }: Step4ExamTypeProps) {
  const { bookingData, setBookingData } = useBookingStore();
  const [selectedType, setSelectedType] = useState<ExaminationType>(
    bookingData.examinationType || 'REGULAR'
  );

  const handleSelect = (type: ExaminationType) => {
    setSelectedType(type);
    setBookingData({ examinationType: type });
  };

  const handleContinue = () => {
    onNext();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-gray-100">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#0c4b39]/10 text-[#0c4b39] text-xs font-black uppercase tracking-wider mb-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            Bước 4: Chọn hình thức khám
          </div>
          <h2 className="text-xl md:text-2xl font-extrabold text-secondary">Chọn Hình Thức Khám Bệnh</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Lựa chọn 1 trong 3 hình thức khám bệnh dưới đây tùy theo nhu cầu và chế độ bảo hiểm của bạn.
          </p>
        </div>
      </div>

      {/* 3 Options Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 1. Khám thường */}
        <Card
          onClick={() => handleSelect('REGULAR')}
          className={`cursor-pointer transition-all duration-200 rounded-2xl relative overflow-hidden bg-white ${
            selectedType === 'REGULAR'
              ? 'border-2 border-[#0c4b39] bg-emerald-50/20 shadow-md ring-2 ring-[#0c4b39]/15'
              : 'border border-gray-200 hover:border-gray-300 hover:bg-gray-50/60'
          }`}
        >
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-11 h-11 rounded-2xl bg-emerald-100 text-[#0c4b39] flex items-center justify-center font-bold">
                <Stethoscope className="w-6 h-6" />
              </div>
              <Badge className="bg-[#0c4b39] text-white border-none text-[10px] font-bold px-2.5 py-0.5">
                Tiêu chuẩn
              </Badge>
            </div>

            <div>
              <h3 className="font-extrabold text-secondary text-lg">Khám Thường</h3>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                Quy trình lấy số thứ tự khám bệnh tiêu chuẩn tại khoa khám bệnh của bệnh viện.
              </p>
            </div>

            <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs font-bold text-emerald-800">
              <span>Chi phí tiêu chuẩn</span>
              {selectedType === 'REGULAR' && (
                <span className="flex items-center gap-1 text-[#0c4b39] font-black">
                  <CheckCircle2 className="w-4 h-4" />
                  Đang chọn
                </span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 2. Khám BHYT */}
        <Card
          onClick={() => handleSelect('BHYT')}
          className={`cursor-pointer transition-all duration-200 rounded-2xl relative overflow-hidden bg-white ${
            selectedType === 'BHYT'
              ? 'border-2 border-blue-600 bg-blue-50/40 shadow-md ring-2 ring-blue-600/15'
              : 'border border-gray-200 hover:border-gray-300 hover:bg-gray-50/60'
          }`}
        >
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-11 h-11 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <Badge className="bg-blue-600 text-white border-none text-[10px] font-bold px-2.5 py-0.5">
                BHYT
              </Badge>
            </div>

            <div>
              <h3 className="font-extrabold text-secondary text-lg">Khám BHYT</h3>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                Khám Bảo hiểm y tế - Áp dụng giảm trừ theo đúng quy định y tế nhà nước.
              </p>
            </div>

            <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs font-bold text-blue-800">
              <span>Có giảm trừ BHYT</span>
              {selectedType === 'BHYT' && (
                <span className="flex items-center gap-1 text-blue-700 font-black">
                  <CheckCircle2 className="w-4 h-4" />
                  Đang chọn
                </span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 3. Khám dịch vụ */}
        <Card
          onClick={() => handleSelect('SERVICE')}
          className={`cursor-pointer transition-all duration-200 rounded-2xl relative overflow-hidden bg-white ${
            selectedType === 'SERVICE'
              ? 'border-2 border-amber-500 bg-amber-50/40 shadow-md ring-2 ring-amber-500/15'
              : 'border border-gray-200 hover:border-gray-300 hover:bg-gray-50/60'
          }`}
        >
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-11 h-11 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                <Zap className="w-6 h-6" />
              </div>
              <Badge className="bg-amber-600 text-white border-none text-[10px] font-bold px-2.5 py-0.5">
                Ưu tiên VIP
              </Badge>
            </div>

            <div>
              <h3 className="font-extrabold text-secondary text-lg">Khám Dịch Vụ</h3>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                Khám nhanh ưu tiên, không chờ đợi, lựa chọn Bác sĩ Chuyên gia hàng đầu.
              </p>
            </div>

            <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs font-bold text-amber-800">
              <span>Được ưu tiên chọn Bác sĩ</span>
              {selectedType === 'SERVICE' && (
                <span className="flex items-center gap-1 text-amber-700 font-black">
                  <CheckCircle2 className="w-4 h-4" />
                  Đang chọn
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* BHYT Notification Alert Banner */}
      {selectedType === 'BHYT' && (
        <div className="bg-blue-50/90 border border-blue-200 rounded-2xl p-4 flex items-start gap-3 text-xs text-blue-900 shadow-2xs animate-in fade-in">
          <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <p className="font-extrabold text-blue-950 text-sm">Lưu ý quan trọng khi chọn Khám BHYT</p>
            <p className="text-blue-800 leading-relaxed">
              Bạn vui lòng mang theo <strong>Thẻ BHYT bản cứng hoặc ứng dụng VssID</strong> cùng <strong>Giấy tờ tùy thân (CCCD/CMND)</strong> để xuất trình tại quầy tiếp đón bệnh viện.
            </p>
          </div>
        </div>
      )}

      {/* Actions Footer */}
      <div className="flex justify-between pt-4 border-t border-gray-100">
        <Button variant="outline" onClick={onBack} className="rounded-xl px-5 text-gray-600 border-gray-300 hover:bg-gray-50 font-semibold cursor-pointer">
          <ArrowLeft className="h-4 w-4 mr-1.5" />
          Quay lại
        </Button>
        <Button
          onClick={handleContinue}
          className="bg-[#0c4b39] hover:bg-[#09382b] text-white px-8 py-2.5 rounded-xl font-extrabold flex items-center gap-2 shadow-md shadow-emerald-100 cursor-pointer"
        >
          Tiếp tục chọn Bệnh viện
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
