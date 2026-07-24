'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { doctorService } from '@/services/doctor.service';
import { hospitalService } from '@/services/hospital.service';
import { specialtyService } from '@/services/specialty.service';
import { useBookingStore } from '@/stores/booking.store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Search, ChevronRight, Star, Loader2, Stethoscope, Building2, MapPin, CheckCircle2, Filter, Users } from 'lucide-react';
import { formatPrice, getDoctorSpecialtyName } from '@/lib/utils';

interface StepSelectDoctorProps {
  onNext: () => void;
}

export function StepSelectDoctor({ onNext }: StepSelectDoctorProps) {
  const { bookingData, setBookingData } = useBookingStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDoctorId, setSelectedDoctorId] = useState<string | null>(bookingData.doctorId);
  const [selectedHospitalId, setSelectedHospitalId] = useState<string>('');
  const [selectedSpecialtyId, setSelectedSpecialtyId] = useState<string>('');

  const { data: doctors = [], isLoading } = useQuery({
    queryKey: ['doctors-search', searchQuery, selectedHospitalId, selectedSpecialtyId],
    queryFn: () =>
      doctorService.search({
        q: searchQuery || undefined,
        hospitalId: selectedHospitalId || undefined,
        specialtyId: selectedSpecialtyId || undefined,
      }),
  });

  const { data: hospitals = [] } = useQuery({
    queryKey: ['hospitals'],
    queryFn: hospitalService.getAll,
  });

  const { data: specialties = [] } = useQuery({
    queryKey: ['specialties'],
    queryFn: specialtyService.getAll,
  });

  const handleSelectDoctor = (doctorId: string) => {
    const doctor = doctors.find((d) => d.id === doctorId);
    if (doctor) {
      setSelectedDoctorId(doctorId);
      setBookingData({
        doctorId: doctor.id,
        doctorName: doctor.fullName,
        specialtyId: doctor.workPlaces?.[0]?.specialtyId || null,
        hospitalId: doctor.workPlaces?.[0]?.hospitalId || null,
        workplaceId: doctor.workPlaces?.[0]?.id || null,
      });
    }
  };

  const handleNext = () => {
    if (selectedDoctorId) {
      onNext();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Badge & Title */}
      <div className="flex items-center justify-between pb-4 border-b border-gray-100">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#4caf50]/10 text-[#4caf50] text-xs font-bold uppercase tracking-wider mb-1">
            <Stethoscope className="w-3.5 h-3.5" />
            Bước 1: Chọn bác sĩ
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-secondary">Danh sách bác sĩ chuyên khoa</h2>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-gray-50/70 p-4 rounded-2xl border border-gray-100 space-y-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
          <Filter className="w-3.5 h-3.5 text-[#4caf50]" />
          Bộ lọc tìm kiếm
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Tìm theo tên bác sĩ..."
              className="pl-9 bg-white border-gray-200 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-[#4caf50] transition-all rounded-xl text-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <Select value={selectedHospitalId} onValueChange={setSelectedHospitalId}>
            <SelectTrigger className="bg-white border-gray-200 focus:ring-0 focus:border-[#4caf50] rounded-xl text-sm">
              <div className="flex items-center gap-2 truncate">
                <Building2 className="w-4 h-4 text-gray-400 shrink-0" />
                <SelectValue placeholder="Tất cả cơ sở y tế" />
              </div>
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="all">Tất cả cơ sở y tế</SelectItem>
              {hospitals.map((h) => (
                <SelectItem key={h.id} value={h.id}>
                  {h.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedSpecialtyId} onValueChange={setSelectedSpecialtyId}>
            <SelectTrigger className="bg-white border-gray-200 focus:ring-0 focus:border-[#4caf50] rounded-xl text-sm">
              <div className="flex items-center gap-2 truncate">
                <Stethoscope className="w-4 h-4 text-gray-400 shrink-0" />
                <SelectValue placeholder="Tất cả chuyên khoa" />
              </div>
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="all">Tất cả chuyên khoa</SelectItem>
              {specialties.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Doctor Cards Container */}
      <div className="max-h-[520px] overflow-y-auto pr-1 space-y-4 scrollbar-thin">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <Loader2 className="animate-spin h-8 w-8 text-[#4caf50] mb-2" />
            <p className="text-sm">Đang tải danh sách bác sĩ...</p>
          </div>
        ) : doctors.length === 0 ? (
          <div className="text-center py-16 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
            <Stethoscope className="h-10 w-10 text-gray-300 mx-auto mb-2" />
            <p className="font-semibold text-gray-700">Không tìm thấy bác sĩ nào</p>
            <p className="text-xs text-gray-400 mt-1">Vui lòng thử lại với từ khóa hoặc bộ lọc khác</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {doctors.map((doctor) => {
              const workplace = doctor.workPlaces?.[0];
              const isSelected = selectedDoctorId === doctor.id;
              const visitsCount = doctor.consultationCount || (doctor.reviewCount ? doctor.reviewCount * 12 + 50 : 350);

              return (
                <Card
                  key={doctor.id}
                  className={`cursor-pointer transition-all duration-200 rounded-2xl bg-white relative overflow-hidden ${
                    isSelected
                      ? 'border-2 border-[#4caf50] bg-[#4caf50]/[0.02] shadow-md ring-2 ring-[#4caf50]/20'
                      : 'border border-gray-200 hover:border-[#4caf50]/60 hover:shadow-sm'
                  }`}
                  onClick={() => handleSelectDoctor(doctor.id)}
                >
                  {/* Selected Indicator Ribbon */}
                  {isSelected && (
                    <div className="absolute top-0 right-0 bg-[#4caf50] text-white px-3 py-1 rounded-bl-xl text-[10px] font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      ĐÃ CHỌN
                    </div>
                  )}

                  <CardContent className="p-4 space-y-3">
                    {/* Top Row: Avatar & Basic Info */}
                    <div className="flex items-start gap-3">
                      <div className="relative shrink-0">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#4caf50]/20 to-[#4caf50]/5 border border-[#4caf50]/20 flex items-center justify-center text-[#4caf50] font-bold text-xl shadow-inner">
                          {doctor.fullName.charAt(0)}
                        </div>
                        <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full" title="Sẵn sàng nhận lịch" />
                      </div>

                      <div className="flex-1 min-w-0 pr-12">
                        <h3 className="font-bold text-secondary text-base truncate leading-snug">
                          {doctor.fullName}
                        </h3>
                        
                        {/* Chuyên khoa badge */}
                        <div className="flex items-center gap-1 text-[11px] font-bold text-[#0c4b39] bg-[#0c4b39]/10 px-2 py-0.5 rounded-md mt-1 w-fit">
                          <Stethoscope className="w-3 h-3 text-[#0c4b39]" />
                          <span>Chuyên khoa: {getDoctorSpecialtyName(doctor)}</span>
                        </div>

                        {/* Rating & Reviews & Lượt khám */}
                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                          <div className="flex items-center text-amber-400">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                            ))}
                          </div>
                          <span className="text-xs font-bold text-gray-700">
                            {doctor.rating || 4.9}
                          </span>
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                            <Users className="w-3 h-3 text-emerald-600" />
                            {visitsCount}+ lượt khám
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Middle Row: Workplace & Address */}
                    {workplace?.hospital && (
                      <div className="bg-gray-50/80 rounded-xl p-2.5 text-xs space-y-1 text-gray-600 border border-gray-100">
                        <div className="flex items-center gap-1.5 font-semibold text-secondary truncate">
                          <Building2 className="w-3.5 h-3.5 text-[#4caf50] shrink-0" />
                          <span className="truncate">{workplace.hospital.name}</span>
                        </div>
                        <div className="flex items-start gap-1.5 text-gray-500 text-[11px]">
                          <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-0.5" />
                          <span className="line-clamp-1">{workplace.hospital.address}</span>
                        </div>
                      </div>
                    )}

                    {/* Bottom Row: Price & Action */}
                    <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                      <div>
                        <span className="text-[11px] text-gray-400 font-medium block">Phí khám công khai</span>
                        <span className="font-bold text-secondary text-base">
                          {workplace?.consultationFee ? `${formatPrice(workplace.consultationFee)}đ` : '350.000đ'}
                        </span>
                      </div>

                      <div className={`text-xs font-bold py-1.5 px-3 rounded-xl flex items-center gap-1 transition-all ${
                        isSelected
                          ? 'bg-[#4caf50] text-white'
                          : 'bg-emerald-50 text-[#4caf50] group-hover:bg-[#4caf50] group-hover:text-white'
                      }`}>
                        {isSelected ? 'Đã chọn bác sĩ' : 'Chọn lịch hẹn'}
                        <ChevronRight className="h-3.5 w-3.5" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Action Navigation */}
      <div className="flex justify-end pt-4 border-t border-gray-100">
        <Button
          onClick={handleNext}
          disabled={!selectedDoctorId}
          className="bg-[#4caf50] hover:bg-[#439e47] text-white px-8 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-md shadow-emerald-100 disabled:opacity-50 transition-all cursor-pointer"
        >
          Tiếp tục chọn thời gian
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

