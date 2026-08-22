'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { doctorService } from '@/services/doctor.service';
import { useBookingStore } from '@/stores/booking.store';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, ChevronRight, Loader2, User, Search, Star, CheckCircle2, Award, Building2, Stethoscope } from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import { toast } from 'sonner';

interface Step6DoctorProps {
  onNext: () => void;
  onBack: () => void;
}

export function Step6Doctor({ onNext, onBack }: Step6DoctorProps) {
  const { bookingData, setBookingData } = useBookingStore();
  const { hospitalId, specialtyId, specialtyName, hospitalName } = bookingData;
  const [selectedDoctorId, setSelectedDoctorId] = useState<string | null>(bookingData.doctorId);
  const [searchTerm, setSearchTerm] = useState('');

  const { data: doctors = [], isLoading } = useQuery({
    queryKey: ['doctors-step6', hospitalId, specialtyId],
    queryFn: () =>
      doctorService.search({
        hospitalId: hospitalId || undefined,
        specialtyId: specialtyId || undefined,
      }),
  });

  const filteredDoctors = doctors.filter((doc) =>
    doc.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (doc.qualification && doc.qualification.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleSelectDoctor = (doctor: any) => {
    setSelectedDoctorId(doctor.id);
    const primaryWorkplace = doctor.workPlaces?.[0];
    setBookingData({
      doctorId: doctor.id,
      doctorName: doctor.fullName,
      workplaceId: primaryWorkplace?.id || doctor.workPlaces?.[0]?.id || null,
      // Clear time choices when doctor changes
      slotId: null,
      slot: null,
    });
  };

  const handleContinue = () => {
    if (!selectedDoctorId) {
      toast.error('Vui lòng chọn một Bác sĩ trước khi tiếp tục.');
      return;
    }
    onNext();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-gray-100">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#0c4b39]/10 text-[#0c4b39] text-xs font-black uppercase tracking-wider mb-1">
            <User className="w-3.5 h-3.5" />
            Bước 6: Chọn bác sĩ
          </div>
          <h2 className="text-xl md:text-2xl font-extrabold text-secondary">
            Chọn Bác Sĩ Khám Bệnh
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Danh sách Bác sĩ chuyên khoa giàu kinh nghiệm thuộc {hospitalName || 'Bệnh viện'}.
          </p>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Tìm theo tên Bác sĩ hoặc học hàm/học vị (Vd: GS.TS Nguyễn Văn A...)"
          className="pl-10 h-11 bg-white border-gray-200 focus-visible:ring-0 focus-visible:border-[#0c4b39] rounded-2xl text-sm font-medium"
        />
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-12 text-gray-400">
          <Loader2 className="animate-spin h-8 w-8 text-[#0c4b39] mb-2" />
          <p className="text-sm font-medium">Đang tải danh sách Bác sĩ...</p>
        </div>
      ) : filteredDoctors.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-200 text-gray-500">
          <User className="w-8 h-8 text-gray-300 mx-auto mb-2" />
          <p className="font-bold text-gray-700">Chưa có Bác sĩ phù hợp</p>
          <p className="text-xs text-gray-400 mt-1">Vui lòng thử chọn chuyên khoa hoặc bệnh viện khác</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[480px] overflow-y-auto pr-1">
          {filteredDoctors.map((doctor) => {
            const isSelected = selectedDoctorId === doctor.id;
            const primaryWp = doctor.workPlaces?.[0];
            const fee = primaryWp?.consultationFee ? Number(primaryWp.consultationFee) : 300000;

            return (
              <Card
                key={doctor.id}
                onClick={() => handleSelectDoctor(doctor)}
                className={`cursor-pointer transition-all duration-200 rounded-2xl relative overflow-hidden bg-white ${isSelected
                    ? 'border-2 border-[#0c4b39] bg-emerald-50/20 shadow-sm ring-2 ring-[#0c4b39]/15'
                    : 'border border-gray-200 hover:border-gray-300 hover:bg-gray-50/60'
                  }`}
              >
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-[#0c4b39]/10 text-[#0c4b39] flex items-center justify-center font-bold shrink-0 text-lg">
                      {(doctor as any).avatar ? (
                        <img src={(doctor as any).avatar} alt={doctor.fullName} className="w-full h-full object-cover rounded-2xl" />
                      ) : (
                        doctor.fullName.charAt(0)
                      )}
                    </div>

                    <div className="min-w-0 flex-1 space-y-0.5">
                      <div className="flex items-center justify-between gap-1">
                        <h3 className="font-extrabold text-secondary text-base truncate">{doctor.fullName}</h3>
                        {isSelected && (
                          <span className="text-[10px] font-bold bg-[#0c4b39] text-white px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0">
                            <CheckCircle2 className="w-3 h-3 text-emerald-300" />
                            Đã chọn
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-[#0c4b39] font-bold truncate flex items-center gap-1">
                        <Award className="w-3.5 h-3.5" />
                        <span>{doctor.qualification || 'Bác sĩ Chuyên Khoa'}</span>
                      </p>

                      <p className="text-xs text-gray-500 truncate flex items-center gap-1">
                        <Stethoscope className="w-3.5 h-3.5 text-gray-400" />
                        <span>Khoa: {specialtyName || 'Đa khoa'}</span>
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs">
                    <span className="text-gray-500">Giá khám cố định:</span>
                    <span className="font-extrabold text-[#0c4b39] text-sm">
                      {formatPrice(fee)}đ
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
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
          disabled={!selectedDoctorId}
          className="bg-[#0c4b39] hover:bg-[#09382b] text-white px-8 py-2.5 rounded-xl font-extrabold flex items-center gap-2 shadow-md shadow-emerald-100 disabled:opacity-50 transition-all cursor-pointer"
        >
          Tiếp tục chọn Ngày khám
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
