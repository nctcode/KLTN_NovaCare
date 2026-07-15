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
      <h2 className="text-xl font-semibold text-secondary">Chọn bác sĩ khám</h2>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Tìm bác sĩ..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select value={selectedHospitalId} onValueChange={setSelectedHospitalId}>
          <SelectTrigger>
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
          <SelectTrigger>
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

      {/* Doctor List */}
      <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="animate-spin h-10 w-10 text-primary" />
          </div>
        ) : doctors.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            Không tìm thấy bác sĩ nào phù hợp
          </div>
        ) : (
          doctors.map((doctor) => (
            <Card
              key={doctor.id}
              className={`cursor-pointer transition hover:shadow-md ${
                selectedDoctorId === doctor.id ? 'border-2 border-primary bg-primary/5' : ''
              }`}
              onClick={() => handleSelectDoctor(doctor.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 text-secondary">
                    {doctor.fullName.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-secondary truncate">{doctor.fullName}</h3>
                    <p className="text-sm text-gray-500 truncate">{doctor.qualification || 'Bác sĩ'}</p>
                    <div className="flex items-center gap-4 mt-1 text-sm text-gray-500 flex-wrap">
                      <div className="flex items-center gap-1 shrink-0">
                        <Star className="h-3.5 w-3.5 text-yellow-400 fill-current" />
                        <span className="font-medium text-secondary">{doctor.rating || 4.8}</span>
                      </div>
                      <span className="text-gray-300">|</span>
                      <span className="truncate">
                        {doctor.workPlaces?.[0]?.hospital?.name || ''}
                      </span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-gray-500">Phí khám</p>
                    <p className="font-bold text-secondary">
                      {doctor.workPlaces?.[0]?.consultationFee?.toLocaleString() || 0}đ
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Actions */}
      <div className="flex justify-end pt-4 border-t">
        <Button onClick={handleNext} disabled={!selectedDoctorId}>
          Tiếp tục
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}
