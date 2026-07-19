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
import { Search, ChevronRight, Star, Loader2 } from 'lucide-react';
import { Doctor } from '@/types';
import { formatPrice } from '@/lib/utils';

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
      <h2 className="text-2xl font-bold text-gray-800">Chọn bác sĩ khám</h2>

      {/* Filters with Green Styling */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Tìm bác sĩ..."
            className="pl-10 border-gray-200 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-[#4caf50] focus-visible:outline-none transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select value={selectedHospitalId} onValueChange={setSelectedHospitalId}>
          <SelectTrigger className="border-gray-200 focus:ring-0 focus:ring-offset-0 focus:border-[#4caf50] focus:outline-none transition-all">
            <SelectValue placeholder="Cơ sở y tế" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả cơ sở</SelectItem>
            {hospitals.map((h) => (
              <SelectItem key={h.id} value={h.id}>
                {h.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={selectedSpecialtyId} onValueChange={setSelectedSpecialtyId}>
          <SelectTrigger className="border-gray-200 focus:ring-0 focus:ring-offset-0 focus:border-[#4caf50] focus:outline-none transition-all">
            <SelectValue placeholder="Chuyên khoa" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả chuyên khoa</SelectItem>
            {specialties.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Doctor Grid (2 columns as shown in the image) */}
      <div className="max-h-[500px] overflow-y-auto pr-2 space-y-4">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="animate-spin h-10 w-10 text-[#4caf50]" />
          </div>
        ) : doctors.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            Không tìm thấy bác sĩ nào phù hợp
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {doctors.map((doctor) => {
              const workplace = doctor.workPlaces?.[0];
              const isSelected = selectedDoctorId === doctor.id;
              
              return (
                <Card
                  key={doctor.id}
                  className={`cursor-pointer transition-all duration-200 border rounded-2xl bg-white hover:shadow-md ${
                    isSelected 
                      ? 'border-2 border-[#4caf50] bg-[#4caf50]/5 shadow-sm' 
                      : 'border-gray-200 hover:border-[#4caf50]/50'
                  }`}
                  onClick={() => handleSelectDoctor(doctor.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4 justify-between h-full">
                      {/* Left: Avatar and Info */}
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-20 h-20 rounded-full bg-[#4caf50]/10 flex items-center justify-center text-[#4caf50] font-bold text-2xl shrink-0">
                          {doctor.fullName.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-gray-900 text-base truncate">
                            {doctor.fullName}
                          </h3>
                          <p className="text-xs text-gray-500 truncate mt-0.5">
                            {doctor.qualification || 'Bác sĩ chuyên khoa'}
                          </p>
                          <div className="flex items-center gap-1 mt-2">
                            <div className="flex items-center gap-0.5">
                              {[...Array(5)].map((_, i) => (
                                <Star key={i} className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500" />
                              ))}
                            </div>
                            <span className="text-xs font-semibold text-gray-600 ml-1 mt-0.5">
                              {doctor.rating || 4.7}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Pricing and Choose Link */}
                      <div className="flex flex-col items-end justify-between self-stretch flex-shrink-0 text-right min-w-[100px] pl-2">
                        <div className="mb-2">
                          <p className="text-[10px] text-gray-400 font-medium">Phí khám</p>
                          <p className="font-bold text-gray-800 text-sm mt-0.5">
                            {workplace?.consultationFee ? `${formatPrice(workplace.consultationFee)}đ` : '350.000đ'}
                          </p>
                        </div>
                        <div className="text-xs font-bold text-[#4caf50] hover:text-[#439e47] flex items-center gap-0.5">
                          Chọn lịch hẹn
                          <ChevronRight className="h-3.5 w-3.5" />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
      <div className="flex justify-end pt-4 border-t border-gray-100">
        <Button 
          onClick={handleNext} 
          disabled={!selectedDoctorId}
          className="bg-[#4caf50] hover:bg-[#439e47] text-white px-6 py-2 rounded-lg font-bold flex items-center gap-1 cursor-pointer transition-all disabled:opacity-50"
        >
          Tiếp tục
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
