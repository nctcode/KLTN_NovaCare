'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { doctorService } from '@/services/doctor.service';
import { useBookingStore } from '@/stores/booking.store';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, ChevronRight, Loader2, Calendar as CalendarIcon, Clock, Sun, Sunset, MapPin, Building2, CheckCircle2 } from 'lucide-react';

interface StepSelectTimeProps {
  onNext: () => void;
  onBack: () => void;
}

export function StepSelectTime({ onNext, onBack }: StepSelectTimeProps) {
  const { bookingData, setBookingData } = useBookingStore();
  const { doctorId, workplaceId } = bookingData;

  // Next 7 days list
  const dates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d;
  });

  const [selectedDate, setSelectedDate] = useState<Date>(dates[0]);
  const [selectedWorkplaceId, setSelectedWorkplaceId] = useState<string>(workplaceId || '');
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(bookingData.slotId);

  const formattedDate = selectedDate.toISOString().split('T')[0];

  // Get doctor details to get list of workplaces
  const { data: doctor, isLoading: loadingDoctor } = useQuery({
    queryKey: ['doctor-details', doctorId],
    queryFn: () => doctorService.getById(doctorId!),
    enabled: !!doctorId,
  });

  // Get available slots for the selected workplace & date
  const { data: slots = [], isLoading: loadingSlots } = useQuery({
    queryKey: ['available-slots', doctorId, selectedWorkplaceId, formattedDate],
    queryFn: () => doctorService.getAvailableSlots(doctorId!, selectedWorkplaceId, formattedDate),
    enabled: !!doctorId && !!selectedWorkplaceId && !!formattedDate,
  });

  useEffect(() => {
    if (doctor?.workPlaces && doctor.workPlaces.length > 0 && !selectedWorkplaceId) {
      setSelectedWorkplaceId(doctor.workPlaces[0].id);
      setBookingData({ workplaceId: doctor.workPlaces[0].id });
    }
  }, [doctor, selectedWorkplaceId, setBookingData]);

  const handleSelectWorkplace = (wpId: string) => {
    setSelectedWorkplaceId(wpId);
    setSelectedSlotId(null);
    setBookingData({ workplaceId: wpId, slotId: null, slot: null });
  };

  const handleSelectSlot = (slot: any) => {
    setSelectedSlotId(slot.id);
    setBookingData({ slotId: slot.id, slot });
  };

  const handleNext = () => {
    if (selectedSlotId) {
      onNext();
    }
  };

  const formatDayName = (date: Date) => {
    const days = ['Chủ Nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
    const today = new Date();
    if (date.toDateString() === today.toDateString()) {
      return 'Hôm nay';
    }
    return days[date.getDay()];
  };

  // Group slots into Morning and Afternoon sessions
  const morningSlots = slots.filter((slot: any) => {
    const hour = new Date(slot.startTime).getHours();
    return hour < 12;
  });

  const afternoonSlots = slots.filter((slot: any) => {
    const hour = new Date(slot.startTime).getHours();
    return hour >= 12;
  });

  const selectedSlot = slots.find((s: any) => s.id === selectedSlotId);
  const selectedSlotTimeStr = selectedSlot
    ? new Date(selectedSlot.startTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    : null;

  return (
    <div className="space-y-6">
      {/* Step Title Header */}
      <div className="flex items-center justify-between pb-4 border-b border-gray-100">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#4caf50]/10 text-[#4caf50] text-xs font-bold uppercase tracking-wider mb-1">
            <CalendarIcon className="w-3.5 h-3.5" />
            Bước 2: chọn lịch khám
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-secondary">Chọn ngày & khung giờ khám</h2>
        </div>
      </div>

      {/* Workplace Select Section */}
      {doctor?.workPlaces && doctor.workPlaces.length > 1 && (
        <div className="space-y-2">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-[#4caf50]" />
            Chọn địa điểm khám
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {doctor.workPlaces.map((wp) => (
              <Card
                key={wp.id}
                onClick={() => handleSelectWorkplace(wp.id)}
                className={`cursor-pointer transition-all duration-200 rounded-2xl ${
                  selectedWorkplaceId === wp.id
                    ? 'border-2 border-[#4caf50] bg-[#4caf50]/[0.02] shadow-sm'
                    : 'border border-gray-200 hover:border-gray-300'
                }`}
              >
                <CardContent className="p-3.5 space-y-1">
                  <p className="font-bold text-secondary text-sm flex items-center justify-between">
                    <span>{wp.hospital?.name}</span>
                    {selectedWorkplaceId === wp.id && (
                      <CheckCircle2 className="w-4 h-4 text-[#4caf50]" />
                    )}
                  </p>
                  <p className="text-xs text-gray-500 line-clamp-1">{wp.hospital?.address}</p>
                  <p className="text-xs font-semibold text-[#4caf50]">
                    Phí khám: {wp.consultationFee.toLocaleString()}đ
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Horizontal Date Picker */}
      <div className="space-y-2.5">
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
          <CalendarIcon className="w-3.5 h-3.5 text-[#4caf50]" />
          Chọn ngày khám trong tuần
        </label>
        <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-thin">
          {dates.map((d) => {
            const isSelected = d.toDateString() === selectedDate.toDateString();
            return (
              <button
                key={d.toDateString()}
                type="button"
                onClick={() => {
                  setSelectedDate(d);
                  setSelectedSlotId(null);
                }}
                className={`flex flex-col items-center p-3 rounded-2xl border min-w-[82px] transition-all duration-200 shrink-0 cursor-pointer ${
                  isSelected
                    ? 'bg-[#4caf50] border-[#4caf50] text-white font-bold shadow-md shadow-emerald-100 scale-105'
                    : 'bg-white hover:bg-gray-50 border-gray-200 text-gray-700'
                }`}
              >
                <span className={`text-[10px] font-bold uppercase tracking-wider ${isSelected ? 'text-white/90' : 'text-gray-400'}`}>
                  {formatDayName(d)}
                </span>
                <span className="text-xl font-bold my-0.5">{d.getDate()}</span>
                <span className={`text-[10px] ${isSelected ? 'text-white/80' : 'text-gray-400'}`}>
                  Thg {d.getMonth() + 1}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Slots Picker Organized by Session */}
      <div className="space-y-4 pt-2">
        {loadingSlots ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400">
            <Loader2 className="animate-spin h-8 w-8 text-[#4caf50] mb-2" />
            <p className="text-sm">Đang kiểm tra khung giờ trống...</p>
          </div>
        ) : slots.length === 0 ? (
          <div className="text-center py-12 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200 p-6 text-gray-500">
            <Clock className="h-10 w-10 text-gray-300 mx-auto mb-2" />
            <p className="font-semibold text-gray-700">Chưa có lịch khám trống vào ngày này</p>
            <p className="text-xs text-gray-400 mt-1">Vui lòng chọn một ngày khác trong danh sách trên</p>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Morning Session */}
            {morningSlots.length > 0 && (
              <div className="space-y-2.5">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-700 bg-amber-50/80 px-3 py-1.5 rounded-xl w-fit border border-amber-200/60">
                  <Sun className="w-3.5 h-3.5 text-amber-500" />
                  Buổi Sáng (07:00 - 12:00)
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2.5">
                  {morningSlots.map((slot: any) => {
                    const start = new Date(slot.startTime);
                    const formattedTime = start.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
                    const isSelected = selectedSlotId === slot.id;
                    const isFull = slot.bookedCount >= slot.capacity;

                    return (
                      <button
                        key={slot.id}
                        type="button"
                        disabled={isFull}
                        onClick={() => handleSelectSlot(slot)}
                        className={`py-2.5 px-3 rounded-xl border text-xs font-semibold transition-all duration-200 text-center cursor-pointer relative ${
                          isFull
                            ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed opacity-60'
                            : isSelected
                            ? 'bg-[#4caf50] border-[#4caf50] text-white shadow-md shadow-emerald-100 font-bold scale-[1.02]'
                            : 'bg-white hover:bg-emerald-50/50 border-gray-200 text-secondary hover:border-[#4caf50]/40'
                        }`}
                      >
                        {formattedTime}
                        {isFull && <span className="block text-[9px] font-normal text-gray-400">Đã đầy</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Afternoon Session */}
            {afternoonSlots.length > 0 && (
              <div className="space-y-2.5">
                <div className="flex items-center gap-2 text-xs font-bold text-sky-700 bg-sky-50/80 px-3 py-1.5 rounded-xl w-fit border border-sky-200/60">
                  <Sunset className="w-3.5 h-3.5 text-sky-500" />
                  Buổi Chiều (13:00 - 17:30)
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2.5">
                  {afternoonSlots.map((slot: any) => {
                    const start = new Date(slot.startTime);
                    const formattedTime = start.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
                    const isSelected = selectedSlotId === slot.id;
                    const isFull = slot.bookedCount >= slot.capacity;

                    return (
                      <button
                        key={slot.id}
                        type="button"
                        disabled={isFull}
                        onClick={() => handleSelectSlot(slot)}
                        className={`py-2.5 px-3 rounded-xl border text-xs font-semibold transition-all duration-200 text-center cursor-pointer relative ${
                          isFull
                            ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed opacity-60'
                            : isSelected
                            ? 'bg-[#4caf50] border-[#4caf50] text-white shadow-md shadow-emerald-100 font-bold scale-[1.02]'
                            : 'bg-white hover:bg-emerald-50/50 border-gray-200 text-secondary hover:border-[#4caf50]/40'
                        }`}
                      >
                        {formattedTime}
                        {isFull && <span className="block text-[9px] font-normal text-gray-400">Đã đầy</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Selected Time Banner Preview */}
      {selectedSlotId && selectedSlotTimeStr && (
        <div className="bg-[#4caf50]/10 border border-[#4caf50]/30 rounded-xl p-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-secondary font-medium">
            <CheckCircle2 className="w-4 h-4 text-[#4caf50] shrink-0" />
            <span>
              Khung giờ đã chọn: <strong className="text-[#4caf50]">{selectedSlotTimeStr}</strong>, {formatDayName(selectedDate)} ({selectedDate.getDate()}/{selectedDate.getMonth() + 1}/{selectedDate.getFullYear()})
            </span>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-between pt-4 border-t border-gray-100">
        <Button variant="outline" onClick={onBack} className="rounded-xl px-5 text-gray-600 border-gray-300 hover:bg-gray-50 font-semibold cursor-pointer">
          <ArrowLeft className="h-4 w-4 mr-1.5" />
          Quay lại
        </Button>
        <Button
          onClick={handleNext}
          disabled={!selectedSlotId}
          className="bg-[#4caf50] hover:bg-[#439e47] text-white px-8 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-md shadow-emerald-100 disabled:opacity-50 transition-all cursor-pointer"
        >
          Tiếp tục chọn hồ sơ
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

