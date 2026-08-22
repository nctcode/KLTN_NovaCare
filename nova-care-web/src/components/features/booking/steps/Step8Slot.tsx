'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { doctorService } from '@/services/doctor.service';
import { useBookingStore } from '@/stores/booking.store';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ChevronRight, Loader2, Clock, Sun, Sunset, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

interface Step8SlotProps {
  onNext: () => void;
  onBack: () => void;
}

export function Step8Slot({ onNext, onBack }: Step8SlotProps) {
  const { bookingData, setBookingData } = useBookingStore();
  const { doctorId, workplaceId, selectedDate } = bookingData;
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(bookingData.slotId);

  const formattedDate = selectedDate || new Date().toISOString().split('T')[0];

  // Get available slots
  const { data: slots = [], isLoading } = useQuery({
    queryKey: ['available-slots-step8', doctorId, workplaceId, formattedDate],
    queryFn: () => doctorService.getAvailableSlots(doctorId!, workplaceId!, formattedDate),
    enabled: !!doctorId && !!workplaceId,
  });

  const handleSelectSlot = (slot: any) => {
    setSelectedSlotId(slot.id);
    setBookingData({ slotId: slot.id, slot });
  };

  const handleContinue = () => {
    if (!selectedSlotId) {
      toast.error('Vui lòng chọn một khung giờ khám còn trống.');
      return;
    }
    onNext();
  };

  // Group slots into Morning and Afternoon
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
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-gray-100">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#0c4b39]/10 text-[#0c4b39] text-xs font-black uppercase tracking-wider mb-1">
            <Clock className="w-3.5 h-3.5" />
            Bước 8: Chọn khung giờ
          </div>
          <h2 className="text-xl md:text-2xl font-extrabold text-secondary">
            Chọn Khung Giờ Khám Bệnh
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Các khung giờ khám khả dụng trong ngày {formattedDate}.
          </p>
        </div>
      </div>

      {/* Slots Picker Organized by Session */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400">
            <Loader2 className="animate-spin h-8 w-8 text-[#0c4b39] mb-2" />
            <p className="text-sm font-medium">Đang kiểm tra các khung giờ trống...</p>
          </div>
        ) : slots.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-200 p-6 text-gray-500">
            <Clock className="h-10 w-10 text-gray-300 mx-auto mb-2" />
            <p className="font-bold text-gray-700">Không có khung giờ trống vào ngày này</p>
            <p className="text-xs text-gray-400 mt-1">Vui lòng quay lại bước 7 để chọn một ngày khám khác</p>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Morning Session */}
            {morningSlots.length > 0 && (
              <div className="space-y-2.5">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-700 bg-amber-50 px-3 py-1.5 rounded-xl w-fit border border-amber-200/60">
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
                        className={`py-3 px-3 rounded-xl border text-xs font-bold transition-all duration-200 text-center cursor-pointer relative ${
                          isFull
                            ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed opacity-60'
                            : isSelected
                            ? 'bg-[#0c4b39] border-[#0c4b39] text-white shadow-md shadow-emerald-100 font-extrabold scale-[1.03]'
                            : 'bg-white hover:bg-emerald-50/50 border-gray-200 text-secondary hover:border-[#0c4b39]/40'
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
                <div className="flex items-center gap-2 text-xs font-bold text-sky-700 bg-sky-50 px-3 py-1.5 rounded-xl w-fit border border-sky-200/60">
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
                        className={`py-3 px-3 rounded-xl border text-xs font-bold transition-all duration-200 text-center cursor-pointer relative ${
                          isFull
                            ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed opacity-60'
                            : isSelected
                            ? 'bg-[#0c4b39] border-[#0c4b39] text-white shadow-md shadow-emerald-100 font-extrabold scale-[1.03]'
                            : 'bg-white hover:bg-emerald-50/50 border-gray-200 text-secondary hover:border-[#0c4b39]/40'
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

      {/* Selected Time Banner */}
      {selectedSlotId && selectedSlotTimeStr && (
        <div className="bg-emerald-50/90 border border-emerald-200 rounded-2xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-secondary font-medium">
            <CheckCircle2 className="w-4 h-4 text-[#0c4b39] shrink-0" />
            <span>
              Khung giờ đã chọn: <strong className="text-[#0c4b39] font-black text-sm">{selectedSlotTimeStr}</strong>, ngày {formattedDate}
            </span>
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
          disabled={!selectedSlotId}
          className="bg-[#0c4b39] hover:bg-[#09382b] text-white px-8 py-2.5 rounded-xl font-extrabold flex items-center gap-2 shadow-md shadow-emerald-100 disabled:opacity-50 transition-all cursor-pointer"
        >
          Kiểm tra thông tin
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
