'use client';

import { useState } from 'react';
import { useBookingStore } from '@/stores/booking.store';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, ChevronRight, Calendar as CalendarIcon, CheckCircle2, Clock } from 'lucide-react';

interface Step7DateProps {
  onNext: () => void;
  onBack: () => void;
}

export function Step7Date({ onNext, onBack }: Step7DateProps) {
  const { bookingData, setBookingData } = useBookingStore();
  const { doctorName } = bookingData;

  // Next 14 days list
  const dates = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d;
  });

  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    if (bookingData.selectedDate) {
      return new Date(bookingData.selectedDate);
    }
    return dates[0];
  });

  const formatDayName = (date: Date) => {
    const days = ['Chủ Nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
    const today = new Date();
    if (date.toDateString() === today.toDateString()) {
      return 'Hôm nay';
    }
    return days[date.getDay()];
  };

  const handleSelectDate = (date: Date) => {
    setSelectedDate(date);
    const dateStr = date.toISOString().split('T')[0];
    setBookingData({
      selectedDate: dateStr,
      // Clear slot choice if date changed
      slotId: null,
      slot: null,
    });
  };

  const handleContinue = () => {
    const dateStr = selectedDate.toISOString().split('T')[0];
    setBookingData({ selectedDate: dateStr });
    onNext();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-gray-100">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#0c4b39]/10 text-[#0c4b39] text-xs font-black uppercase tracking-wider mb-1">
            <CalendarIcon className="w-3.5 h-3.5" />
            Bước 7: Chọn ngày khám
          </div>
          <h2 className="text-xl md:text-2xl font-extrabold text-secondary">
            Chọn Ngày Khám Bệnh
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Lựa chọn ngày thăm khám mong muốn với Bác sĩ {doctorName || ''}.
          </p>
        </div>
      </div>

      {/* Date Picker Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
        {dates.map((d) => {
          const isSelected = d.toDateString() === selectedDate.toDateString();

          return (
            <Card
              key={d.toDateString()}
              onClick={() => handleSelectDate(d)}
              className={`cursor-pointer transition-all duration-200 rounded-2xl relative overflow-hidden text-center bg-white ${
                isSelected
                  ? 'border-2 border-[#0c4b39] bg-[#0c4b39] text-white shadow-md shadow-emerald-100 scale-105'
                  : 'border border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <CardContent className="p-3.5 space-y-1">
                <span className={`text-[10px] font-black uppercase tracking-wider block ${isSelected ? 'text-white/90' : 'text-gray-400'}`}>
                  {formatDayName(d)}
                </span>
                <span className={`text-2xl font-black block my-0.5 ${isSelected ? 'text-white' : 'text-secondary'}`}>
                  {d.getDate()}
                </span>
                <span className={`text-[11px] font-semibold block ${isSelected ? 'text-white/80' : 'text-gray-500'}`}>
                  Thg {d.getMonth() + 1}
                </span>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Selected Date Recap Banner */}
      <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-4 flex items-center gap-3">
        <CheckCircle2 className="w-5 h-5 text-[#0c4b39] shrink-0" />
        <p className="text-xs font-semibold text-[#0c4b39]">
          Ngày đã chọn: <strong className="text-secondary font-black text-sm">{formatDayName(selectedDate)}, ngày {selectedDate.getDate()} tháng {selectedDate.getMonth() + 1} năm {selectedDate.getFullYear()}</strong>
        </p>
      </div>

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
          Tiếp tục chọn Khung giờ
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
