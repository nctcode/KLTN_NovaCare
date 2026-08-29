'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import {
  Stethoscope,
  Building2,
  Calendar as CalendarIcon,
  Clock,
  User,
  Star,
  ChevronRight,
  ChevronLeft,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  MapPin,
  DollarSign,
  Award,
  Sparkles,
  RefreshCw,
  PlusCircle,
} from 'lucide-react';
import { hospitalService } from '@/services/hospital.service';
import { doctorService } from '@/services/doctor.service';
import { profileService } from '@/services/profile.service';
import { appointmentService } from '@/services/appointment.service';
import { paymentService } from '@/services/payment.service';
import { PatientProfile } from '@/types/profile.types';
import { format, addDays } from 'date-fns';
import { vi } from 'date-fns/locale';
import { toast } from 'sonner';

interface SpecialtyBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  hospital: {
    id: string;
    name: string;
    address?: string;
    logoUrl?: string;
  } | null;
  specialty: {
    id: string;
    name: string;
  } | null;
}

export function SpecialtyBookingModal({
  isOpen,
  onClose,
  hospital,
  specialty,
}: SpecialtyBookingModalProps) {
  const queryClient = useQueryClient();

  // Booking Flow Steps: 1 (Doctor), 2 (Slot), 3 (Profile & Notes), 4 (Confirm/Success)
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Selected state
  const [selectedDoctor, setSelectedDoctor] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState<string>(
    format(new Date(), 'yyyy-MM-dd')
  );
  const [selectedSlot, setSelectedSlot] = useState<any>(null);
  const [selectedProfile, setSelectedProfile] = useState<PatientProfile | null>(null);
  const [reason, setReason] = useState<string>('');
  const [symptoms, setSymptoms] = useState<string>('');

  // Race condition / alternative slot state
  const [conflictError, setConflictError] = useState<string | null>(null);
  const [alternativeSlots, setAlternativeSlots] = useState<any[]>([]);

  // Booking result state
  const [createdAppointment, setCreatedAppointment] = useState<any>(null);

  // Reset modal state when hospital/specialty changes or modal opens
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setSelectedDoctor(null);
      setSelectedSlot(null);
      setSelectedProfile(null);
      setReason('');
      setSymptoms('');
      setConflictError(null);
      setAlternativeSlots([]);
      setCreatedAppointment(null);
    }
  }, [isOpen, hospital?.id, specialty?.id]);

  // Query doctors in hospital & specialty
  const { data: doctors = [], isLoading: loadingDoctors } = useQuery({
    queryKey: ['specialty-doctors', hospital?.id, specialty?.id],
    queryFn: () =>
      hospital?.id && specialty?.id
        ? hospitalService.getDoctorsBySpecialty(hospital.id, specialty.id)
        : Promise.resolve([]),
    enabled: isOpen && !!hospital?.id && !!specialty?.id,
  });

  // Query workplace slots for selected doctor & date
  const { data: workplaceSlotsData, isLoading: loadingSlots, refetch: refetchSlots } = useQuery({
    queryKey: ['workplace-slots', selectedDoctor?.workplaceId, selectedDate],
    queryFn: () =>
      selectedDoctor?.workplaceId
        ? doctorService.getWorkplaceSlots(selectedDoctor.workplaceId, selectedDate)
        : Promise.resolve({ slots: [] }),
    enabled: isOpen && step === 2 && !!selectedDoctor?.workplaceId,
  });

  // Query patient profiles
  const { data: profiles = [], isLoading: loadingProfiles } = useQuery({
    queryKey: ['patient-profiles-booking'],
    queryFn: () => profileService.getAll(),
    enabled: isOpen && step >= 3,
  });

  // Select profile default if present
  useEffect(() => {
    if (profiles.length > 0 && !selectedProfile) {
      const defaultProf = profiles.find((p) => p.isDefault) || profiles[0];
      setSelectedProfile(defaultProf);
    }
  }, [profiles, selectedProfile]);

  // Mutation to create appointment
  const createAppointmentMutation = useMutation({
    mutationFn: async () => {
      if (!selectedSlot?.id || !selectedProfile?.id) {
        throw new Error('Vui lòng chọn đầy đủ thông tin khung giờ và hồ sơ bệnh nhân');
      }
      return appointmentService.create({
        slotId: selectedSlot.id,
        patientProfileId: selectedProfile.id,
        reason: reason || `Khám chuyên khoa ${specialty?.name}`,
        symptoms: symptoms || undefined,
        idempotencyKey: typeof window !== 'undefined' && window.crypto?.randomUUID ? window.crypto.randomUUID() : `spc-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      });
    },
    onSuccess: (data: any) => {
      setCreatedAppointment(data?.data || data);
      setConflictError(null);
      setAlternativeSlots([]);
      setStep(4);
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    },

    onError: (err: any) => {
      const errResponse = err?.response?.data || err?.data;
      if (errResponse?.statusCode === 409 || err?.response?.status === 409) {
        const msg =
          errResponse?.message ||
          'Khung giờ này vừa được đặt bởi bệnh nhân khác. Vui lòng chọn khung giờ khác.';
        setConflictError(msg);
        if (errResponse?.alternativeSlots && Array.isArray(errResponse.alternativeSlots)) {
          setAlternativeSlots(errResponse.alternativeSlots);
        } else {
          setAlternativeSlots([]);
        }
      } else {
        setConflictError(errResponse?.message || err?.message || 'Có lỗi xảy ra khi tạo lịch hẹn');
      }
    },
  });

  if (!hospital || !specialty) return null;

  // Next 7 days helper for date selection tab
  const dateTabs = Array.from({ length: 7 }).map((_, i) => {
    const d = addDays(new Date(), i);
    return {
      dateStr: format(d, 'yyyy-MM-dd'),
      label: i === 0 ? 'Hôm nay' : i === 1 ? 'Ngày mai' : format(d, 'EEEE', { locale: vi }),
      subLabel: format(d, 'dd/MM'),
    };
  });

  const slotsList = workplaceSlotsData?.slots || [];

  const handleSelectAlternativeSlot = (alt: any) => {
    setConflictError(null);
    setAlternativeSlots([]);
    if (alt.doctor) {
      setSelectedDoctor({
        workplaceId: alt.workplaceId,
        doctorId: alt.doctor.id,
        fullName: alt.doctor.fullName,
        title: alt.doctor.title,
        qualification: alt.doctor.qualification,
        avatarUrl: alt.doctor.avatarUrl,
        rating: alt.doctor.rating,
        consultationFee: alt.slot?.consultationFee || selectedDoctor?.consultationFee || 200000,
      });
    }
    setSelectedSlot(alt.slot);
    setSelectedDate(format(new Date(alt.slot.startTime), 'yyyy-MM-dd'));
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl p-0 gap-0 border-none shadow-2xl bg-white">
        {/* Modal Header */}
        <div className="bg-[#0c4b39] text-white p-6 sm:p-8 rounded-t-3xl relative">
          <div className="flex items-center gap-3 mb-2">
            <Badge className="bg-emerald-500/20 border border-emerald-400/40 text-emerald-200 text-xs font-bold px-3 py-0.5 rounded-full">
              Đặt lịch theo chuyên khoa • {specialty.name}
            </Badge>
          </div>
          <DialogTitle className="text-xl sm:text-2xl font-black text-white">
            {hospital.name}
          </DialogTitle>
          <DialogDescription className="text-emerald-100/90 text-xs sm:text-sm font-medium mt-1">
            {step === 1 && 'Bước 1: Lựa chọn Bác sĩ chuyên khoa ưu tiên'}
            {step === 2 && `Bước 2: Chọn khung giờ khám với ${selectedDoctor?.title ? selectedDoctor.title + ' ' : ''}${selectedDoctor?.fullName}`}
            {step === 3 && 'Bước 3: Chọn hồ sơ người khám & Lý do khám'}
            {step === 4 && 'Hoàn tất đăng ký đặt lịch khám thành công'}
          </DialogDescription>

          {/* Stepper indicators */}
          {step < 4 && (
            <div className="grid grid-cols-3 gap-2 mt-6">
              <div
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  step >= 1 ? 'bg-emerald-400' : 'bg-emerald-900/50'
                }`}
              />
              <div
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  step >= 2 ? 'bg-emerald-400' : 'bg-emerald-900/50'
                }`}
              />
              <div
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  step >= 3 ? 'bg-emerald-400' : 'bg-emerald-900/50'
                }`}
              />
            </div>
          )}
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-8 space-y-6">
          {/* Conflict / Double-Booking Error Banner */}
          {conflictError && (
            <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-4 sm:p-5 space-y-3">
              <div className="flex items-start gap-3 text-red-800">
                <AlertTriangle className="w-6 h-6 shrink-0 text-red-600 mt-0.5" />
                <div>
                  <h4 className="font-extrabold text-sm sm:text-base">{conflictError}</h4>
                  <p className="text-xs text-red-700 font-medium mt-0.5">
                    Hệ thống tự động lọc và gợi ý các khung giờ còn trống khả dụng bên dưới:
                  </p>
                </div>
              </div>

              {/* Alternative Slots Suggestions Grid */}
              {alternativeSlots.length > 0 && (
                <div className="mt-3 pt-3 border-t border-red-200 space-y-2">
                  <p className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    👉 Đề xuất khung giờ khác khả dụng (1-Click chọn ngay):
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {alternativeSlots.map((alt, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSelectAlternativeSlot(alt)}
                        className="flex flex-col text-left p-3 rounded-xl bg-white border border-red-200 hover:border-[#0c4b39] hover:bg-emerald-50/60 transition-all group"
                      >
                        <span className="text-[11px] font-extrabold text-[#0c4b39] group-hover:underline flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-amber-500" />
                          {alt.reason}
                        </span>
                        <span className="text-xs font-black text-slate-900 mt-1">
                          {format(new Date(alt.slot.startTime), 'HH:mm - dd/MM/yyyy')}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 1: CHỌN BÁC SĨ */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <Stethoscope className="w-5 h-5 text-[#0c4b39]" />
                  <span>Danh sách Bác sĩ chuyên khoa {specialty.name}</span>
                </h3>
                <span className="text-xs text-slate-500 font-bold">
                  {doctors.length} bác sĩ sẵn sàng
                </span>
              </div>

              {loadingDoctors ? (
                <div className="py-12 flex flex-col items-center justify-center gap-2">
                  <Loader2 className="w-8 h-8 text-[#0c4b39] animate-spin" />
                  <p className="text-xs font-bold text-slate-600">Đang tìm danh sách bác sĩ...</p>
                </div>
              ) : doctors.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 border border-slate-200 rounded-2xl p-6">
                  <Stethoscope className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                  <h4 className="font-bold text-slate-700">Chưa có bác sĩ niêm yết lịch online</h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Cơ sở y tế này hiện chưa cập nhật danh sách bác sĩ trực tuyến cho chuyên khoa {specialty.name}.
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                  {doctors.map((doc: any) => {
                    const isSelected = selectedDoctor?.workplaceId === doc.workplaceId;
                    return (
                      <Card
                        key={doc.workplaceId}
                        onClick={() => setSelectedDoctor(doc)}
                        className={`cursor-pointer transition-all duration-200 rounded-2xl border-2 ${
                          isSelected
                            ? 'border-[#0c4b39] bg-emerald-50/40 shadow-sm'
                            : 'border-slate-200/90 hover:border-emerald-200 hover:bg-slate-50/50'
                        }`}
                      >
                        <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                          <div className="flex items-center gap-4">
                            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-emerald-100 border border-emerald-200 overflow-hidden shrink-0 flex items-center justify-center">
                              {doc.avatarUrl ? (
                                <img
                                  src={doc.avatarUrl}
                                  alt={doc.fullName}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <User className="w-8 h-8 text-[#0c4b39]" />
                              )}
                            </div>

                            <div className="space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                {doc.title && (
                                  <Badge className="bg-emerald-100 text-[#0c4b39] border border-emerald-300 text-[10px] font-bold px-2 py-0">
                                    {doc.title}
                                  </Badge>
                                )}
                                {doc.yearsOfExperience && (
                                  <span className="text-[11px] font-semibold text-slate-500">
                                    {doc.yearsOfExperience} năm kinh nghiệm
                                  </span>
                                )}
                              </div>

                              <h4 className="font-extrabold text-slate-900 text-base leading-tight">
                                {doc.fullName}
                              </h4>

                              {doc.qualification && (
                                <p className="text-xs text-slate-600 font-medium">
                                  {doc.qualification}
                                </p>
                              )}

                              <div className="flex items-center gap-3 text-xs font-bold pt-1">
                                {doc.rating && (
                                  <span className="flex items-center gap-1 text-amber-500">
                                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                                    <span>{doc.rating}</span>
                                    <span className="text-slate-400">({doc.reviewCount || 0})</span>
                                  </span>
                                )}
                                <span className="text-[#0c4b39]">
                                  Phí khám: {doc.consultationFee?.toLocaleString('vi-VN')}đ
                                </span>
                              </div>
                            </div>
                          </div>

                          <Button
                            type="button"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedDoctor(doc);
                              setStep(2);
                            }}
                            className="w-full sm:w-auto bg-[#0c4b39] hover:bg-[#09382b] text-white font-bold text-xs rounded-xl px-5 h-10 shrink-0 flex items-center justify-center gap-1.5"
                          >
                            <span>Chọn lịch khám</span>
                            <ChevronRight className="w-4 h-4" />
                          </Button>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* STEP 2: CHỌN KHUNG GIỜ */}
          {step === 2 && selectedDoctor && (
            <div className="space-y-6">
              {/* Doctor Summary Header */}
              <div className="flex items-center justify-between bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-white border border-emerald-200 p-0.5 overflow-hidden shrink-0 flex items-center justify-center">
                    {selectedDoctor.avatarUrl ? (
                      <img
                        src={selectedDoctor.avatarUrl}
                        alt={selectedDoctor.fullName}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <User className="w-6 h-6 text-[#0c4b39]" />
                    )}
                  </div>
                  <div>
                    <h4 className="font-black text-slate-900 text-sm sm:text-base">
                      {selectedDoctor.title ? selectedDoctor.title + ' ' : ''}
                      {selectedDoctor.fullName}
                    </h4>
                    <p className="text-xs font-bold text-[#0c4b39]">
                      Phí tư vấn khám: {selectedDoctor.consultationFee?.toLocaleString('vi-VN')}đ
                    </p>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setStep(1)}
                  className="text-xs font-bold text-slate-700 border-slate-300 rounded-xl h-9 px-3"
                >
                  <ChevronLeft className="w-3.5 h-3.5 mr-1" />
                  Đổi bác sĩ
                </Button>
              </div>

              {/* Date Tabs */}
              <div className="space-y-2">
                <label className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <CalendarIcon className="w-4 h-4 text-[#0c4b39]" />
                  <span>Chọn ngày khám</span>
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-7 gap-2">
                  {dateTabs.map((tab) => {
                    const isSelected = selectedDate === tab.dateStr;
                    return (
                      <button
                        key={tab.dateStr}
                        type="button"
                        onClick={() => {
                          setSelectedDate(tab.dateStr);
                          setSelectedSlot(null);
                        }}
                        className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center justify-center ${
                          isSelected
                            ? 'border-[#0c4b39] bg-[#0c4b39] text-white shadow-xs font-black'
                            : 'border-slate-200 bg-white hover:border-emerald-300 text-slate-700 font-bold'
                        }`}
                      >
                        <span className="text-[11px] opacity-90">{tab.label}</span>
                        <span className="text-xs font-black">{tab.subLabel}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Time Slots Grid */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-[#0c4b39]" />
                    <span>Khung giờ khả dụng ({format(new Date(selectedDate), 'dd/MM/yyyy')})</span>
                  </label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => refetchSlots()}
                    className="text-[11px] font-bold text-[#0c4b39] hover:bg-emerald-50 h-7 px-2"
                  >
                    <RefreshCw className="w-3 h-3 mr-1" />
                    Làm mới giờ
                  </Button>
                </div>

                {loadingSlots ? (
                  <div className="py-8 flex justify-center items-center gap-2">
                    <Loader2 className="w-6 h-6 text-[#0c4b39] animate-spin" />
                    <span className="text-xs font-bold text-slate-600">Đang tải lịch trống...</span>
                  </div>
                ) : slotsList.length === 0 ? (
                  <div className="text-center py-8 bg-amber-50/60 border border-amber-200/80 rounded-2xl p-4">
                    <Clock className="w-8 h-8 text-amber-500 mx-auto mb-1" />
                    <p className="text-xs font-bold text-amber-800">
                      Rất tiếc, không có khung giờ khám khả dụng trong ngày đã chọn
                    </p>
                    <p className="text-[11px] text-amber-700 mt-0.5">
                      Vui lòng chuyển sang ngày khám khác phía trên.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {slotsList.map((slot: any) => {
                      const isAvailable = slot.isSlotAvailable !== false && slot.isAvailable && slot.bookedCount < slot.capacity;
                      const isSelected = selectedSlot?.id === slot.id;
                      const timeString = `${format(new Date(slot.startTime), 'HH:mm')} - ${format(
                        new Date(slot.endTime),
                        'HH:mm'
                      )}`;

                      return (
                        <button
                          key={slot.id}
                          type="button"
                          disabled={!isAvailable}
                          onClick={() => setSelectedSlot(slot)}
                          className={`p-3 rounded-xl border text-center transition-all duration-150 flex flex-col items-center justify-center ${
                            isSelected
                              ? 'border-[#0c4b39] bg-emerald-100/90 text-[#0c4b39] font-black ring-2 ring-[#0c4b39]'
                              : isAvailable
                              ? 'border-slate-200 bg-white hover:border-[#0c4b39] hover:bg-emerald-50 text-slate-900 font-bold'
                              : 'border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed line-through'
                          }`}
                        >
                          <span className="text-xs font-black">{timeString}</span>
                          <span className="text-[10px] font-semibold mt-0.5">
                            {isAvailable ? `Trống ${slot.capacity - slot.bookedCount} suất` : 'Đã hết chỗ'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Step 2 Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(1)}
                  className="font-bold text-xs h-11 px-5 rounded-xl border-slate-300"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Quay lại
                </Button>

                <Button
                  type="button"
                  disabled={!selectedSlot}
                  onClick={() => setStep(3)}
                  className="bg-[#0c4b39] hover:bg-[#09382b] text-white font-bold text-xs h-11 px-6 rounded-xl flex items-center gap-1.5"
                >
                  <span>Tiếp tục chọn hồ sơ</span>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {/* STEP 3: CHỌN HỒ SƠ & LÝ DO KHÁM */}
          {step === 3 && (
            <div className="space-y-6">
              {/* Summary Card */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs space-y-2">
                <div className="flex justify-between font-bold text-slate-800">
                  <span>Chuyên khoa:</span>
                  <span className="text-[#0c4b39]">{specialty.name}</span>
                </div>
                <div className="flex justify-between font-bold text-slate-800">
                  <span>Cơ sở y tế:</span>
                  <span>{hospital.name}</span>
                </div>
                <div className="flex justify-between font-bold text-slate-800">
                  <span>Bác sĩ:</span>
                  <span>
                    {selectedDoctor?.title ? selectedDoctor.title + ' ' : ''}
                    {selectedDoctor?.fullName}
                  </span>
                </div>
                {selectedSlot && (
                  <div className="flex justify-between font-bold text-slate-800">
                    <span>Thời gian:</span>
                    <span className="text-emerald-700">
                      {format(new Date(selectedSlot.startTime), 'HH:mm')} -{' '}
                      {format(new Date(selectedSlot.startTime), 'dd/MM/yyyy')}
                    </span>
                  </div>
                )}
              </div>

              {/* Patient Profile Selection */}
              <div className="space-y-3">
                <label className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <User className="w-4 h-4 text-[#0c4b39]" />
                  <span>Chọn Hồ sơ Bệnh nhân</span>
                </label>

                {loadingProfiles ? (
                  <div className="py-6 flex justify-center items-center gap-2">
                    <Loader2 className="w-5 h-5 text-[#0c4b39] animate-spin" />
                    <span className="text-xs text-slate-500 font-bold">Đang tải danh sách hồ sơ...</span>
                  </div>
                ) : profiles.length === 0 ? (
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-center space-y-2">
                    <p className="text-xs text-amber-800 font-bold">Bạn chưa có hồ sơ bệnh nhân nào</p>
                    <p className="text-[11px] text-amber-700">
                      Vui lòng tạo hồ sơ bệnh nhân trong tài khoản của bạn trước khi đăng ký khám.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {profiles.map((prof) => {
                      const isSelected = selectedProfile?.id === prof.id;
                      return (
                        <div
                          key={prof.id}
                          onClick={() => setSelectedProfile(prof)}
                          className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                            isSelected
                              ? 'border-[#0c4b39] bg-emerald-50/70 ring-1 ring-[#0c4b39]'
                              : 'border-slate-200 bg-white hover:border-emerald-200'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-emerald-100 text-[#0c4b39] flex items-center justify-center font-extrabold text-sm">
                              {prof.fullName.charAt(0)}
                            </div>
                            <div>
                              <h5 className="font-extrabold text-slate-900 text-xs sm:text-sm">
                                {prof.fullName}
                              </h5>
                              <p className="text-[11px] text-slate-500 font-medium">
                                SĐT: {prof.phone || 'N/A'} • Ngày sinh:{' '}
                                {prof.dateOfBirth
                                  ? format(new Date(prof.dateOfBirth), 'dd/MM/yyyy')
                                  : 'N/A'}
                              </p>
                            </div>
                          </div>
                          {isSelected && (
                            <CheckCircle2 className="w-5 h-5 text-[#0c4b39] shrink-0" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Reason & Symptoms Input */}
              <div className="space-y-3">
                <label className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                  Lý do khám / Triệu chứng bệnh lý
                </label>
                <Textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder={`Mô tả tình trạng sức khỏe hoặc lý do bạn cần khám chuyên khoa ${specialty.name}...`}
                  className="text-xs border-slate-200 rounded-xl min-h-[80px] focus-visible:ring-[#0c4b39]"
                />
              </div>

              {/* Step 3 Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(2)}
                  className="font-bold text-xs h-11 px-5 rounded-xl border-slate-300"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Quay lại chọn giờ
                </Button>

                <Button
                  type="button"
                  disabled={!selectedProfile || createAppointmentMutation.isPending}
                  onClick={() => createAppointmentMutation.mutate()}
                  className="bg-[#0c4b39] hover:bg-[#09382b] text-white font-bold text-xs h-11 px-6 rounded-xl flex items-center gap-2 shadow-md"
                >
                  {createAppointmentMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Đang xác nhận đặt lịch...</span>
                    </>
                  ) : (
                    <>
                      <span>Xác nhận & Tạo lịch hẹn</span>
                      <CheckCircle2 className="w-4 h-4" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* STEP 4: XÁC NHẬN THÀNH CÔNG */}
          {step === 4 && createdAppointment && (
            <div className="text-center py-6 space-y-6">
              <div className="w-16 h-16 bg-emerald-100 text-[#0c4b39] rounded-full flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 className="w-10 h-10 text-[#0c4b39]" />
              </div>

              <div className="space-y-1">
                <Badge className="bg-emerald-100 text-[#0c4b39] border border-emerald-300 font-extrabold text-xs px-3 py-0.5 rounded-full">
                  Đặt khám thành công
                </Badge>
                <h3 className="text-2xl font-black text-slate-950 mt-2">
                  Lịch Hẹn Của Bạn Đã ĐƯỢC GHI NHẬN
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Mã tra cứu lịch khám trên hệ thống NovaCare:
                </p>
                <p className="text-xl font-black text-[#0c4b39] tracking-wider pt-1">
                  {createdAppointment.bookingCode || 'NV-SUCCESS'}
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 text-left text-xs space-y-2.5 max-w-lg mx-auto">
                <div className="flex justify-between font-bold">
                  <span className="text-slate-500">Người khám:</span>
                  <span className="text-slate-900 font-black">{selectedProfile?.fullName}</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span className="text-slate-500">Chuyên khoa:</span>
                  <span className="text-[#0c4b39] font-black">{specialty.name}</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span className="text-slate-500">Cơ sở y tế:</span>
                  <span className="text-slate-900 font-black">{hospital.name}</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span className="text-slate-500">Bác sĩ phụ trách:</span>
                  <span className="text-slate-900 font-black">
                    {selectedDoctor?.title ? selectedDoctor.title + ' ' : ''}
                    {selectedDoctor?.fullName}
                  </span>
                </div>
                {selectedSlot && (
                  <div className="flex justify-between font-bold">
                    <span className="text-slate-500">Thời gian khám:</span>
                    <span className="text-emerald-700 font-black">
                      {format(new Date(selectedSlot.startTime), 'HH:mm - dd/MM/yyyy')}
                    </span>
                  </div>
                )}
                <div className="flex justify-between font-bold pt-2 border-t border-slate-200 text-sm">
                  <span className="text-slate-700">Tổng chi phí tư vấn:</span>
                  <span className="text-[#0c4b39] font-black">
                    {(createdAppointment.totalPrice || selectedDoctor?.consultationFee)?.toLocaleString(
                      'vi-VN'
                    )}
                    đ
                  </span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
                <Button
                  type="button"
                  onClick={async () => {
                    if (createdAppointment?.id) {
                      await paymentService.simulateSuccess(createdAppointment.id, 'MOMO');
                      toast.success('Thanh toán thành công (Demo Instant)!');
                      onClose();
                      window.location.href = `/lich-kham/${createdAppointment.id}`;
                    }
                  }}
                  className="bg-[#0c4b39] hover:bg-[#09382b] text-white font-extrabold text-xs h-11 px-6 rounded-xl w-full sm:w-auto shadow-md"
                >
                  💳 Thanh toán ngay (Demo Instant) ➔
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    onClose();
                    if (createdAppointment?.id) {
                      window.location.href = `/lich-kham/${createdAppointment.id}`;
                    }
                  }}
                  className="border-slate-300 font-bold text-slate-700 text-xs h-11 px-6 rounded-xl w-full sm:w-auto"
                >
                  Xem Chi Tiết Lịch Khám
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
