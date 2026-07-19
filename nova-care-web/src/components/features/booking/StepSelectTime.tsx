'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { doctorService } from '@/services/doctor.service';
import { useBookingStore } from '@/stores/booking.store';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, ChevronRight, Loader2, Calendar as CalendarIcon, Clock } from 'lucide-react';

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


  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-800">Chọn khung giờ khám</h2>

      {/* Workplace select */}
      {doctor?.workPlaces && doctor.workPlaces.length > 1 && (
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Chọn địa điểm khám</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {doctor.workPlaces.map((wp) => (
              <Card
                key={wp.id}
                onClick={() => handleSelectWorkplace(wp.id)}
                className={`cursor-pointer transition hover:shadow ${
                  selectedWorkplaceId === wp.id ? 'border-2 border-[#4caf50] bg-[#4caf50]/5' : ''
                }`}
              >
                <CardContent className="p-4 space-y-1">
                  <p className="font-semibold text-secondary text-sm">{wp.hospital.name}</p>
                  <p className="text-xs text-gray-500">{wp.hospital.address}</p>
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
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">Chọn ngày khám</label>
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
          {dates.map((d) => {
            const isSelected = d.toDateString() === selectedDate.toDateString();
            return (
              <button
                key={d.toDateString()}
                onClick={() => {
                  setSelectedDate(d);
                  setSelectedSlotId(null);
                }}
                className={`flex flex-col items-center p-3 rounded-lg border min-w-[76px] transition shrink-0 cursor-pointer ${
                  isSelected
                    ? 'bg-[#4caf50] border-[#4caf50] text-white font-semibold shadow-sm'
                    : 'bg-white hover:bg-gray-50 text-gray-700'
                }`}
              >
                <span className="text-[11px] uppercase tracking-wider">{formatDayName(d)}</span>
                <span className="text-lg font-bold">{d.getDate()}</span>
                <span className="text-[11px]">{d.getMonth() + 1}/{d.getFullYear().toString().slice(-2)}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Slots picker */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-gray-700">Khung giờ còn trống</label>
        {loadingSlots ? (
          <div className="flex justify-center py-12">
            <Loader2 className="animate-spin h-10 w-10 text-[#4caf50]" />
          </div>
        ) : slots.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border p-6 text-gray-500">
            <Clock className="h-10 w-10 text-gray-300 mx-auto mb-2" />
            Không có khung giờ khám trống nào trong ngày này. Vui lòng chọn ngày khác.
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
            {slots.map((slot: any) => {
              const start = new Date(slot.startTime);
              const formattedTime = start.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
              const isSelected = selectedSlotId === slot.id;
              const isFull = slot.bookedCount >= slot.capacity;

              return (
                <button
                  key={slot.id}
                  disabled={isFull}
                  onClick={() => handleSelectSlot(slot)}
                  className={`py-2 px-3 text-sm rounded-md border transition text-center font-medium cursor-pointer ${
                    isFull
                      ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                      : isSelected
                      ? 'bg-[#4caf50] border-[#4caf50] text-white font-bold shadow-sm'
                      : 'bg-white hover:bg-gray-50 border-gray-200 text-secondary'
                  }`}
                >
                  {formattedTime}
                  {isFull && <p className="text-[9px] text-gray-400">Hết</p>}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex justify-between pt-4 border-t">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          Quay lại
        </Button>
        <Button 
          onClick={handleNext} 
          disabled={!selectedSlotId}
          className="bg-[#4caf50] hover:bg-[#439e47] text-white px-6 py-2 rounded-lg font-bold flex items-center gap-1 cursor-pointer transition-all disabled:opacity-50"
        >
          Tiếp tục
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
