'use client';

import { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Stethoscope,
  UserCheck,
  FileText,
  Calendar as CalendarIcon,
  Clock,
  ChevronRight,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Sun,
  Sunset,
  Moon,
  Loader2,
  Info,
  Building2,
} from 'lucide-react';
import { SpecialtySelectModal } from './SpecialtySelectModal';
import { DoctorSelectModal } from './DoctorSelectModal';
import { ServiceSelectModal } from './ServiceSelectModal';
import { RoomSelectModal, ClinicRoom } from './RoomSelectModal';
import { specialtyService } from '@/services/specialty.service';
import { doctorService } from '@/services/doctor.service';
import { medicalServiceService } from '@/services/medical-service.service';
import { Hospital, Specialty, Doctor, MedicalService } from '@/types';
import { formatPrice } from '@/lib/utils';
import { toast } from 'sonner';

import { AIAssistedBookingModal } from '../ai/AIAssistedBookingModal';
import { HospitalBookingMode } from './BookingTypeStep';

interface Step1BookingInfoProps {
  hospital: Hospital;
  bookingMode?: HospitalBookingMode;
  selectedSpecialty: Specialty | null;
  setSelectedSpecialty: (specialty: Specialty | null) => void;
  selectedRoom: ClinicRoom | null;
  setSelectedRoom: (room: ClinicRoom | null) => void;
  selectedDoctor: Doctor | null;
  setSelectedDoctor: (doctor: Doctor | null) => void;
  selectedService: MedicalService | null;
  setSelectedService: (service: MedicalService | null) => void;
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  selectedSlotTime: string;
  setSelectedSlotTime: (slotTime: string) => void;
  selectedSlotId: string | null;
  setSelectedSlotId: (slotId: string | null) => void;
  onNext: () => void;
}

export function Step1BookingInfo({
  hospital,
  bookingMode = 'doctor',
  selectedSpecialty,
  setSelectedSpecialty,
  selectedRoom,
  setSelectedRoom,
  selectedDoctor,
  setSelectedDoctor,
  selectedService,
  setSelectedService,
  selectedDate,
  setSelectedDate,
  selectedSlotTime,
  setSelectedSlotTime,
  selectedSlotId,
  setSelectedSlotId,
  onNext,
}: Step1BookingInfoProps) {
  // Modal states
  const [isSpecialtyModalOpen, setIsSpecialtyModalOpen] = useState(false);
  const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);
  const [isDoctorModalOpen, setIsDoctorModalOpen] = useState(false);
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [timeSession, setTimeSession] = useState<'all' | 'morning' | 'afternoon' | 'evening'>('all');

  const handleApplyAIRecommendation = (rec: { specialtyId: string; specialtyName: string; reason: string }) => {
    const targetSpec = specialties.find((s: any) => s.id === rec.specialtyId || s.name?.toLowerCase().includes(rec.specialtyName?.toLowerCase()));
    if (targetSpec) {
      setSelectedSpecialty(targetSpec);
    }
  };

  // Fetch Specialties available at this hospital
  const { data: specialties = [], isLoading: loadingSpecialties } = useQuery({
    queryKey: ['specialties-by-hospital', hospital.id],
    queryFn: () => specialtyService.getAll(),
  });

  // Fetch Doctors at this hospital (filtered by selected specialty if chosen)
  const { data: doctors = [], isLoading: loadingDoctors } = useQuery({
    queryKey: ['doctors-by-hospital-specialty', hospital.id, selectedSpecialty?.id],
    queryFn: () =>
      doctorService.search({
        hospitalId: hospital.id,
        specialtyId: selectedSpecialty?.id || undefined,
      }),
    enabled: !!hospital.id,
  });

  // Fetch Medical Services for this hospital
  const { data: medicalServices = [], isLoading: loadingServices } = useQuery({
    queryKey: ['medical-services-by-hospital', hospital.id, selectedSpecialty?.id],
    queryFn: () => medicalServiceService.getAll(hospital.id, selectedSpecialty?.id),
    enabled: !!hospital.id,
  });

  // Filter Medical Services strictly belonging to the selected Specialty
  const specialtyServices = useMemo(() => {
    if (!selectedSpecialty) return medicalServices;

    const filtered = medicalServices.filter((srv: any) => {
      // 1. Direct specialtyId matching
      if (srv.specialtyId) {
        return srv.specialtyId === selectedSpecialty.id;
      }

      // 2. Keyword matching
      const srvName = (srv.name || '').toLowerCase();
      const specName = (selectedSpecialty.name || '').toLowerCase();
      return (
        srvName.includes(specName) ||
        (specName.includes('tim') && srvName.includes('tim')) ||
        (specName.includes('nhi') && srvName.includes('nhi')) ||
        (specName.includes('mắt') && (srvName.includes('mắt') || srvName.includes('thị lực'))) ||
        (specName.includes('tiêu hóa') && (srvName.includes('dạ dày') || srvName.includes('nội soi'))) ||
        (specName.includes('thần kinh') && (srvName.includes('não') || srvName.includes('thần kinh'))) ||
        (specName.includes('cơ xương khớp') && (srvName.includes('khớp') || srvName.includes('xương'))) ||
        (specName.includes('tai mũi họng') && srvName.includes('tai mũi họng')) ||
        (specName.includes('răng') && srvName.includes('răng')) ||
        (specName.includes('da liễu') && (srvName.includes('da') || srvName.includes('mụn'))) ||
        (specName.includes('hô hấp') && (srvName.includes('hô hấp') || srvName.includes('phổi'))) ||
        (specName.includes('nội') && srvName.includes('nội'))
      );
    });

    // STRICT: Return filtered services only. If no specific service exists, generate a dedicated service for this specialty.
    if (filtered.length === 0) {
      return [
        {
          id: `default-service-${selectedSpecialty.id}`,
          hospitalId: hospital.id,
          specialtyId: selectedSpecialty.id,
          name: `Khám Chuyên Khoa ${selectedSpecialty.name}`,
          description: `Dịch vụ khám y tế chuyên sâu thuộc chuyên khoa ${selectedSpecialty.name}`,
          price: 300000,
          duration: 30,
          isActive: true,
        },
      ];
    }

    return filtered;
  }, [medicalServices, selectedSpecialty, hospital.id]);

  // Auto-select service when specialty changes or when there's only 1 service for that specialty
  useEffect(() => {
    if (!selectedSpecialty || specialtyServices.length === 0) return;

    if (specialtyServices.length === 1) {
      // Auto-select single available service for this specialty
      if (selectedService?.id !== specialtyServices[0].id) {
        setSelectedService(specialtyServices[0]);
      }
    } else if (selectedService && !specialtyServices.some((s) => s.id === selectedService.id)) {
      // If previous selected service does not belong to newly selected specialty, switch to first item
      setSelectedService(specialtyServices[0]);
    }
  }, [selectedSpecialty, specialtyServices, selectedService, setSelectedService]);

  // AUTO-ASSIGNMENT LOGIC FOR SERVICE / STANDARD BOOKING MODE
  useEffect(() => {
    if (bookingMode === 'service' || bookingMode === 'standard') {
      if (doctors && doctors.length > 0 && !selectedDoctor) {
        setSelectedDoctor(doctors[0]);
      }
    }
  }, [bookingMode, doctors, selectedDoctor, setSelectedDoctor]);

  // Generate upcoming 14 dates for date picker
  const dateOptions = useMemo(() => {
    const dates = [];
    const today = new Date();
    for (let i = 0; i < 14; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      const dayOfWeekStr = i === 0 ? 'Hôm nay' : i === 1 ? 'Ngày mai' : d.toLocaleDateString('vi-VN', { weekday: 'short' });
      const displayDate = d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
      dates.push({ dateStr, dayOfWeekStr, displayDate, fullDate: d });
    }
    return dates;
  }, []);

  // Fetch available slots from backend for selected doctor + date
  const doctorWorkplaceId = useMemo(() => {
    if (!selectedDoctor || !selectedDoctor.workPlaces) return null;
    const wp = selectedDoctor.workPlaces.find((w) => w.hospitalId === hospital.id);
    return wp?.id || selectedDoctor.workPlaces[0]?.id || null;
  }, [selectedDoctor, hospital.id]);

  const { data: availableSlots = [], isLoading: loadingSlots } = useQuery({
    queryKey: ['available-slots', selectedDoctor?.id, doctorWorkplaceId, selectedDate],
    queryFn: () => doctorService.getAvailableSlots(selectedDoctor!.id, doctorWorkplaceId!, selectedDate),
    enabled: !!selectedDoctor && !!doctorWorkplaceId && !!selectedDate,
  });

  // Generate fallback mock time slots if backend has no generated slots for the test date
  const timeSlots = useMemo(() => {
    if (availableSlots && availableSlots.length > 0) {
      return availableSlots.map((slot: any) => {
        const start = new Date(slot.startTime);
        const hours = String(start.getHours()).padStart(2, '0');
        const mins = String(start.getMinutes()).padStart(2, '0');
        const timeLabel = `${hours}:${mins}`;
        const hourNum = start.getHours();
        let session: 'morning' | 'afternoon' | 'evening' = 'morning';
        if (hourNum >= 12 && hourNum < 17) session = 'afternoon';
        else if (hourNum >= 17) session = 'evening';

        return {
          id: slot.id,
          timeLabel,
          session,
          isAvailable: slot.isAvailable && slot.bookedCount < slot.capacity,
        };
      });
    }

    // Default mock slots per session for realistic demonstration
    const mockMorning = ['07:30', '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00'];
    const mockAfternoon = ['13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'];
    const mockEvening = ['17:30', '18:00', '18:30', '19:00'];

    const mockSlots: any[] = [];
    mockMorning.forEach((t, idx) => mockSlots.push({ id: `00000000-0000-4000-a000-${(idx + 10).toString().padStart(12, '0')}`, timeLabel: t, session: 'morning', isAvailable: idx !== 2 }));
    mockAfternoon.forEach((t, idx) => mockSlots.push({ id: `00000000-0000-4000-a000-${(idx + 30).toString().padStart(12, '0')}`, timeLabel: t, session: 'afternoon', isAvailable: true }));
    mockEvening.forEach((t, idx) => mockSlots.push({ id: `00000000-0000-4000-a000-${(idx + 50).toString().padStart(12, '0')}`, timeLabel: t, session: 'evening', isAvailable: idx !== 1 }));

    return mockSlots;
  }, [availableSlots]);

  // Filter slots by session tab
  const filteredTimeSlots = useMemo(() => {
    if (timeSession === 'all') return timeSlots;
    return timeSlots.filter((slot: any) => slot.session === timeSession);
  }, [timeSlots, timeSession]);

  const handleValidateAndNext = () => {
    // All modes require specialty selection
    if (!selectedSpecialty) {
      toast.error('Vui lòng chọn Chuyên khoa khám!');
      setIsSpecialtyModalOpen(true);
      return;
    }

    // Doctor Mode Validation (Original doctor flow)
    if (bookingMode === 'doctor') {
      if (!selectedDoctor) {
        toast.error('Vui lòng chọn Bác sĩ thăm khám!');
        setIsDoctorModalOpen(true);
        return;
      }
      if (!selectedService) {
        toast.error('Vui lòng chọn Dịch vụ khám!');
        setIsServiceModalOpen(true);
        return;
      }
    }

    // Service Mode Validation (Phòng khám + Dịch vụ, NO Doctor)
    if (bookingMode === 'service') {
      if (!selectedRoom) {
        toast.error('Vui lòng chọn Phòng Khám Chuyên Khoa!');
        setIsRoomModalOpen(true);
        return;
      }
      if (!selectedService) {
        toast.error('Vui lòng chọn Dịch vụ khám / xét nghiệm!');
        setIsServiceModalOpen(true);
        return;
      }
    }

    // Standard Mode Validation (Phòng khám)
    if (bookingMode === 'standard') {
      if (!selectedRoom) {
        toast.error('Vui lòng chọn Phòng Khám Phân Luồng!');
        setIsRoomModalOpen(true);
        return;
      }
    }

    if (!selectedDate) {
      toast.error('Vui lòng chọn Ngày khám!');
      return;
    }
    if (!selectedSlotTime) {
      toast.error('Vui lòng chọn Giờ khám!');
      return;
    }
    onNext();
  };

  return (
    <div className="space-y-8">
      {/* Header Info Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-[#0c4b39] to-emerald-900 text-white rounded-3xl p-6 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-emerald-300 text-xs font-bold border border-white/10">
            <Sparkles className="w-3.5 h-3.5" />
            <span>
              Bước 1 / 4 • {bookingMode === 'service' ? 'Hình thức Khám Dịch Vụ' : bookingMode === 'standard' ? 'Khám Tiêu Chuẩn Phân Luồng' : 'Thông tin khám bệnh'}
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight">
            {bookingMode === 'service'
              ? 'Chọn Dịch Vụ Y Tế & Khung Giờ Khám'
              : bookingMode === 'standard'
              ? 'Đăng Ký Khám Thường / Phân Luồng'
              : 'Chọn Thông Tin Đặt Khám Bác Sĩ'}
          </h2>
          <p className="text-xs text-emerald-100/80 font-medium">
            {bookingMode === 'service'
              ? `Lựa chọn gói xét nghiệm, dịch vụ kỹ thuật cao & lịch hẹn phù hợp tại ${hospital.name}`
              : `Điền đầy đủ chuyên khoa, bác sĩ, dịch vụ và thời gian khám mong muốn tại ${hospital.name}`}
          </p>
        </div>

        <Badge variant="outline" className="bg-white/10 text-white border-emerald-400/40 text-xs px-3.5 py-1.5 rounded-xl font-bold">
          Cơ sở: {hospital.name}
        </Badge>
      </div>

      {/* AI Assistant Callout Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-[#0c4b39] to-teal-900 rounded-3xl p-5 text-white shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4 border border-emerald-400/30">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0 text-amber-300">
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>
          <div className="space-y-0.5 text-left">
            <div className="flex items-center gap-2">
              <h3 className="font-black text-sm text-white">Chưa biết chọn Chuyên khoa nào phù hợp?</h3>
              <Badge className="bg-amber-400 text-slate-950 font-black text-[10px]">
                100% Smartphone AI
              </Badge>
            </div>
            <p className="text-xs text-emerald-100/90 font-medium">
              Sử dụng AI đo Nhịp tim PPG bằng Camera, phân tích ảnh tổn thương/xét nghiệm & giọng nói để gợi ý ngay
            </p>
          </div>
        </div>

        <Button
          type="button"
          onClick={() => setIsAIModalOpen(true)}
          className="w-full sm:w-auto bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs h-11 px-6 rounded-2xl shadow-md shrink-0 flex items-center justify-center gap-2 transition-transform active:scale-95"
        >
          <Sparkles className="w-4 h-4 text-slate-950" />
          <span>Nhờ AI Sàng Lọc & Gợi Ý Ngay</span>
        </Button>
      </div>

      {/* AI Assisted Booking Modal */}
      <AIAssistedBookingModal
        isOpen={isAIModalOpen}
        onClose={() => setIsAIModalOpen(false)}
        hospital={hospital}
        specialties={specialties}
        onApplyAIRecommendation={handleApplyAIRecommendation}
      />

      {/* Grid of Popup Pickers: Distinct Cards for each of the 3 Booking Modes */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* 1. CHỌN CHUYÊN KHOA (ALL MODES REQUIRE SPECIALTY) */}
        <Card
          onClick={() => setIsSpecialtyModalOpen(true)}
          className={`border-2 transition-all cursor-pointer rounded-3xl p-5 hover:shadow-md ${
            selectedSpecialty
              ? 'bg-emerald-50/70 border-[#0c4b39]'
              : 'bg-white border-dashed border-slate-300 hover:border-[#0c4b39]'
          }`}
        >
          <CardContent className="p-0 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#0c4b39] bg-emerald-100/70 px-2.5 py-1 rounded-md">
                1. Chuyên khoa
              </span>
              {selectedSpecialty && <CheckCircle2 className="w-5 h-5 text-[#0c4b39]" />}
            </div>

            {selectedSpecialty ? (
              <div className="space-y-1">
                <h4 className="font-black text-slate-900 text-base flex items-center gap-2 truncate">
                  <Stethoscope className="w-5 h-5 text-[#0c4b39] shrink-0" />
                  <span className="truncate">{selectedSpecialty.name}</span>
                </h4>
                <p className="text-xs text-slate-500 line-clamp-1 font-medium">
                  {selectedSpecialty.description || 'Chuyên khoa uy tín tại cơ sở'}
                </p>
              </div>
            ) : (
              <div className="py-2 text-center space-y-1">
                <Stethoscope className="w-8 h-8 text-slate-400 mx-auto mb-1" />
                <p className="text-xs font-bold text-slate-700">Chọn Chuyên Khoa</p>
                <p className="text-[11px] text-slate-400 font-medium">Danh mục chuyên khoa</p>
              </div>
            )}

            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full text-xs font-bold rounded-xl border-slate-300 text-slate-800 hover:bg-[#0c4b39] hover:text-white"
            >
              {selectedSpecialty ? 'Thay đổi' : 'Chọn chuyên khoa'}
            </Button>
          </CardContent>
        </Card>

        {/* 2A. CHỌN BÁC SĨ (CHỈ HIỂN THỊ TRONG CHẾ ĐỘ: KHÁM THEO BÁC SĨ) */}
        {bookingMode === 'doctor' && (
          <Card
            onClick={() => {
              if (!selectedSpecialty) {
                toast.info('Vui lòng chọn Chuyên khoa trước!');
                setIsSpecialtyModalOpen(true);
              } else {
                setIsDoctorModalOpen(true);
              }
            }}
            className={`border-2 transition-all cursor-pointer rounded-3xl p-5 hover:shadow-md ${
              selectedDoctor
                ? 'bg-emerald-50/70 border-[#0c4b39]'
                : 'bg-white border-dashed border-slate-300 hover:border-[#0c4b39]'
            }`}
          >
            <CardContent className="p-0 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#0c4b39] bg-emerald-100/70 px-2.5 py-1 rounded-md">
                  2. Bác sĩ
                </span>
                {selectedDoctor && <CheckCircle2 className="w-5 h-5 text-[#0c4b39]" />}
              </div>

              {selectedDoctor ? (
                <div className="flex items-center gap-3">
                  <img
                    src={selectedDoctor.avatarUrl || 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=200'}
                    alt={selectedDoctor.fullName}
                    className="w-12 h-12 rounded-2xl object-cover border border-slate-200"
                  />
                  <div className="space-y-0.5 min-w-0">
                    <span className="text-[10px] text-emerald-800 font-extrabold uppercase truncate block">
                      {selectedDoctor.title || 'Bác sĩ chuyên khoa'}
                    </span>
                    <h4 className="font-black text-slate-900 text-sm truncate">{selectedDoctor.fullName}</h4>
                    <p className="text-[11px] text-[#0c4b39] font-bold">
                      Giá: {formatPrice((selectedDoctor as any).consultationFee || 300000)}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="py-2 text-center space-y-1">
                  <UserCheck className="w-8 h-8 text-slate-400 mx-auto mb-1" />
                  <p className="text-xs font-bold text-slate-700">Chọn Bác Sĩ Thăm Khám</p>
                  <p className="text-[11px] text-slate-400 font-medium">Bác sĩ phụ trách trực tiếp</p>
                </div>
              )}

              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full text-xs font-bold rounded-xl border-slate-300 text-slate-800 hover:bg-[#0c4b39] hover:text-white"
              >
                {selectedDoctor ? 'Thay đổi' : 'Chọn bác sĩ ngay'}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* 2B/3A. CHỌN DỊCH VỤ (HIỂN THỊ LÀ BƯỚC 2 Ở KHÁM DỊCH VỤ, BƯỚC 3 Ở KHÁM BÁC SĨ) */}
        {(bookingMode === 'doctor' || bookingMode === 'service') && (
          <Card
            onClick={() => {
              if (!selectedSpecialty) {
                toast.info('Vui lòng chọn Chuyên khoa trước!');
                setIsSpecialtyModalOpen(true);
              } else {
                setIsServiceModalOpen(true);
              }
            }}
            className={`border-2 transition-all cursor-pointer rounded-3xl p-5 hover:shadow-md ${
              selectedService
                ? 'bg-emerald-50/70 border-[#0c4b39]'
                : 'bg-white border-dashed border-slate-300 hover:border-[#0c4b39]'
            }`}
          >
            <CardContent className="p-0 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#0c4b39] bg-emerald-100/70 px-2.5 py-1 rounded-md">
                  {bookingMode === 'service' ? '2. Dịch vụ' : '3. Dịch vụ'}
                </span>
                {selectedService && <CheckCircle2 className="w-5 h-5 text-[#0c4b39]" />}
              </div>

              {selectedService ? (
                <div className="space-y-1">
                  <h4 className="font-black text-slate-900 text-base flex items-center gap-2 truncate">
                    <FileText className="w-5 h-5 text-[#0c4b39] shrink-0" />
                    <span className="truncate">{selectedService.name}</span>
                  </h4>
                  <p className="text-xs text-[#0c4b39] font-bold">
                    Chi phí: {formatPrice(selectedService.price || (selectedService as any).fee || 300000)}
                  </p>
                </div>
              ) : (
                <div className="py-2 text-center space-y-1">
                  <FileText className="w-8 h-8 text-slate-400 mx-auto mb-1" />
                  <p className="text-xs font-bold text-slate-700">Chọn Dịch Vụ Khám / Xét Nghiệm</p>
                  <p className="text-[11px] text-slate-400 font-medium">Bảng giá dịch vụ kỹ thuật cao</p>
                </div>
              )}

              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full text-xs font-bold rounded-xl border-slate-300 text-slate-800 hover:bg-[#0c4b39] hover:text-white"
              >
                {selectedService ? 'Thay đổi dịch vụ' : 'Chọn dịch vụ ngay'}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* 2C/3B. CHỌN PHÒNG KHÁM (QUY TRÌNH CUỐI Ở KHÁM DỊCH VỤ - BƯỚC 2 Ở KHÁM THƯỜNG) */}
        {(bookingMode === 'service' || bookingMode === 'standard') && (
          <Card
            onClick={() => {
              if (!selectedSpecialty) {
                toast.info('Vui lòng chọn Chuyên khoa trước!');
                setIsSpecialtyModalOpen(true);
              } else {
                setIsRoomModalOpen(true);
              }
            }}
            className={`border-2 transition-all cursor-pointer rounded-3xl p-5 hover:shadow-md ${
              selectedRoom
                ? 'bg-emerald-50/70 border-[#0c4b39]'
                : 'bg-white border-dashed border-slate-300 hover:border-[#0c4b39]'
            }`}
          >
            <CardContent className="p-0 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#0c4b39] bg-emerald-100/70 px-2.5 py-1 rounded-md">
                  {bookingMode === 'service' ? '3. Phòng Khám' : '2. Phòng Khám'}
                </span>
                {selectedRoom && <CheckCircle2 className="w-5 h-5 text-[#0c4b39]" />}
              </div>

              {selectedRoom ? (
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-[#0c4b39] text-white font-black text-xs px-2 py-0.5">
                      {selectedRoom.roomNumber}
                    </Badge>
                    <h4 className="font-black text-slate-900 text-sm truncate">{selectedRoom.name}</h4>
                  </div>
                  <p className="text-xs text-[#0c4b39] font-bold">
                    Vị trí: {selectedRoom.floor} • {selectedRoom.zone}
                  </p>
                </div>
              ) : (
                <div className="py-2 text-center space-y-1">
                  <Building2 className="w-8 h-8 text-slate-400 mx-auto mb-1" />
                  <p className="text-xs font-bold text-slate-700">Chọn Phòng Khám</p>
                  <p className="text-[11px] text-slate-400 font-medium">Số phòng / vị trí tầng</p>
                </div>
              )}

              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full text-xs font-bold rounded-xl border-slate-300 text-slate-800 hover:bg-[#0c4b39] hover:text-white"
              >
                {selectedRoom ? 'Thay đổi phòng' : 'Chọn phòng khám'}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* 5. CHỌN NGÀY KHÁM (DATE PICKER PILLS) */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-black text-slate-950 flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-[#0c4b39]" />
            4. Chọn Ngày Khám Bệnh
          </h3>
          <span className="text-xs text-slate-500 font-semibold">14 ngày tiếp theo</span>
        </div>

        <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-200">
          {dateOptions.map((item) => {
            const isSelected = selectedDate === item.dateStr;
            return (
              <button
                key={item.dateStr}
                type="button"
                onClick={() => {
                  setSelectedDate(item.dateStr);
                  setSelectedSlotTime('');
                  setSelectedSlotId(null);
                }}
                className={`flex flex-col items-center justify-center p-3 rounded-2xl min-w-[95px] border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#0c4b39] text-white border-[#0c4b39] shadow-md scale-105 font-bold'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                }`}
              >
                <span className={`text-[11px] font-extrabold ${isSelected ? 'text-emerald-300' : 'text-slate-500'}`}>
                  {item.dayOfWeekStr}
                </span>
                <span className="text-sm font-black mt-0.5">{item.displayDate}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 5. CHỌN GIỜ KHÁM THEO BUỔI (SESSION-BASED TIME SLOTS) */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 space-y-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="text-base font-black text-slate-950 flex items-center gap-2">
            <Clock className="w-5 h-5 text-[#0c4b39]" />
            5. Chọn Giờ Khám Theo Buổi
          </h3>

          {/* Session Filters Pills: Tất cả / Buổi sáng / Buổi chiều / Buổi tối */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-2xl w-fit">
            <button
              type="button"
              onClick={() => setTimeSession('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                timeSession === 'all' ? 'bg-[#0c4b39] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tất cả
            </button>
            <button
              type="button"
              onClick={() => setTimeSession('morning')}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1 ${
                timeSession === 'morning' ? 'bg-[#0c4b39] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sun className="w-3.5 h-3.5 text-amber-400" />
              Sáng (7h-12h)
            </button>
            <button
              type="button"
              onClick={() => setTimeSession('afternoon')}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1 ${
                timeSession === 'afternoon' ? 'bg-[#0c4b39] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sunset className="w-3.5 h-3.5 text-orange-400" />
              Chiều (13h-17h)
            </button>
            <button
              type="button"
              onClick={() => setTimeSession('evening')}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1 ${
                timeSession === 'evening' ? 'bg-[#0c4b39] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Moon className="w-3.5 h-3.5 text-indigo-400" />
              Tối (17h-20h)
            </button>
          </div>
        </div>

        {/* Time Slots Grid */}
        {loadingSlots ? (
          <div className="flex items-center justify-center py-8 gap-2 text-slate-500 text-xs font-bold">
            <Loader2 className="animate-spin w-5 h-5 text-[#0c4b39]" />
            Đang tải khung giờ trống từ hệ thống...
          </div>
        ) : filteredTimeSlots.length === 0 ? (
          <div className="text-center py-8 space-y-1">
            <Clock className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-xs font-bold text-slate-600">Không có khung giờ khả dụng cho buổi này</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2.5">
            {filteredTimeSlots.map((slot: any) => {
              const isSelected = selectedSlotTime === slot.timeLabel;
              const isAvailable = slot.isAvailable;

              return (
                <button
                  key={slot.id}
                  type="button"
                  disabled={!isAvailable}
                  onClick={() => {
                    setSelectedSlotTime(slot.timeLabel);
                    setSelectedSlotId(slot.id);
                  }}
                  className={`py-2.5 px-2 rounded-xl text-xs font-black border transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5 ${
                    !isAvailable
                      ? 'bg-slate-100 text-slate-400 border-slate-200 opacity-60 cursor-not-allowed line-through'
                      : isSelected
                      ? 'bg-[#0c4b39] text-white border-[#0c4b39] shadow-md scale-105 ring-2 ring-emerald-300'
                      : 'bg-white text-slate-800 border-slate-200 hover:border-[#0c4b39] hover:bg-emerald-50/50'
                  }`}
                >
                  <span>{slot.timeLabel}</span>
                  <span className={`text-[9px] font-normal ${isSelected ? 'text-emerald-200' : 'text-slate-400'}`}>
                    {!isAvailable ? 'Hết chỗ' : 'Còn trống'}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Next Button */}
      <div className="flex justify-end pt-4">
        <Button
          type="button"
          onClick={handleValidateAndNext}
          className="bg-[#0c4b39] hover:bg-[#083629] text-white font-black text-sm h-12 px-8 rounded-2xl shadow-md flex items-center gap-2 transition-transform active:scale-95"
        >
          <span>Tiếp tục: Chọn Hồ Sơ Người Bệnh</span>
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* POPUP MODALS */}
      <SpecialtySelectModal
        isOpen={isSpecialtyModalOpen}
        onClose={() => setIsSpecialtyModalOpen(false)}
        specialties={specialties}
        selectedSpecialtyId={selectedSpecialty?.id || null}
        onSelect={(spec) => {
          setSelectedSpecialty(spec);
          // If selected doctor's specialty differs, reset doctor
          if (selectedDoctor && selectedDoctor.workPlaces) {
            const hasSpec = selectedDoctor.workPlaces.some((wp) => wp.specialtyId === spec.id);
            if (!hasSpec) setSelectedDoctor(null);
          }
        }}
        hospitalName={hospital.name}
      />

      <RoomSelectModal
        isOpen={isRoomModalOpen}
        onClose={() => setIsRoomModalOpen(false)}
        selectedSpecialty={selectedSpecialty}
        selectedRoomId={selectedRoom?.id || null}
        onSelect={(room) => setSelectedRoom(room)}
        hospitalName={hospital.name}
      />

      <DoctorSelectModal
        isOpen={isDoctorModalOpen}
        onClose={() => setIsDoctorModalOpen(false)}
        doctors={doctors}
        selectedDoctorId={selectedDoctor?.id || null}
        onSelect={(doc) => {
          setSelectedDoctor(doc);
          // Auto set default service if available
          if (medicalServices.length > 0 && !selectedService) {
            setSelectedService(medicalServices[0]);
          }
        }}
        specialtyName={selectedSpecialty?.name}
        hospitalName={hospital.name}
      />

      <ServiceSelectModal
        isOpen={isServiceModalOpen}
        onClose={() => setIsServiceModalOpen(false)}
        services={specialtyServices}
        selectedServiceId={selectedService?.id || null}
        onSelect={(srv) => setSelectedService(srv)}
        hospitalName={hospital.name}
      />
    </div>
  );
}
