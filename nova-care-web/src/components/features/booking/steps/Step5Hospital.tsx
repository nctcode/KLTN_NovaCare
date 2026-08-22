'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { hospitalService } from '@/services/hospital.service';
import { useBookingStore } from '@/stores/booking.store';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, ChevronRight, Loader2, Building2, MapPin, Search, Star, CheckCircle2, Phone } from 'lucide-react';
import { toast } from 'sonner';

interface Step5HospitalProps {
  onNext: () => void;
  onBack: () => void;
}

export function Step5Hospital({ onNext, onBack }: Step5HospitalProps) {
  const { bookingData, setBookingData } = useBookingStore();
  const { specialtyId, specialtyName } = bookingData;
  const [selectedId, setSelectedId] = useState<string | null>(bookingData.hospitalId);
  const [searchTerm, setSearchTerm] = useState('');

  const { data: hospitals = [], isLoading } = useQuery({
    queryKey: ['hospitals-step5', specialtyId],
    queryFn: hospitalService.getAll,
  });

  const filteredHospitals = hospitals.filter((h) =>
    h.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (h.address && h.address.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleSelectHospital = (hospital: any) => {
    setSelectedId(hospital.id);
    setBookingData({
      hospitalId: hospital.id,
      hospitalName: hospital.name,
      // Clear dependent choices if hospital changed
      doctorId: null,
      doctorName: null,
      workplaceId: null,
      slotId: null,
      slot: null,
    });
  };

  const handleContinue = () => {
    if (!selectedId) {
      toast.error('Vui lòng chọn một Bệnh viện / Cơ sở y tế trước khi tiếp tục.');
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
            <Building2 className="w-3.5 h-3.5" />
            Bước 5: Chọn bệnh viện / cơ sở
          </div>
          <h2 className="text-xl md:text-2xl font-extrabold text-secondary">
            Chọn Bệnh Viện / Cơ Sở Y Tế {specialtyName ? `- Khoa ${specialtyName}` : ''}
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Lựa chọn cơ sở bệnh viện uy tín có tiếp đón khám chuyên khoa bạn chọn.
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Tìm theo tên bệnh viện hoặc địa chỉ (Vd: Bệnh viện Đa khoa Trung tâm...)"
          className="pl-10 h-11 bg-white border-gray-200 focus-visible:ring-0 focus-visible:border-[#0c4b39] rounded-2xl text-sm font-medium"
        />
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-12 text-gray-400">
          <Loader2 className="animate-spin h-8 w-8 text-[#0c4b39] mb-2" />
          <p className="text-sm font-medium">Đang tải danh sách bệnh viện / cơ sở...</p>
        </div>
      ) : filteredHospitals.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-200 text-gray-500">
          <Building2 className="w-8 h-8 text-gray-300 mx-auto mb-2" />
          <p className="font-bold text-gray-700">Không tìm thấy cơ sở phù hợp</p>
          <p className="text-xs text-gray-400 mt-1">Vui lòng thử tìm với từ khóa khác</p>
        </div>
      ) : (
        <div className="space-y-3.5 max-h-[480px] overflow-y-auto pr-1">
          {filteredHospitals.map((hospital) => {
            const isSelected = selectedId === hospital.id;

            return (
              <Card
                key={hospital.id}
                onClick={() => handleSelectHospital(hospital)}
                className={`cursor-pointer transition-all duration-200 rounded-2xl relative overflow-hidden bg-white ${
                  isSelected
                    ? 'border-2 border-[#0c4b39] bg-emerald-50/20 shadow-sm ring-2 ring-[#0c4b39]/15'
                    : 'border border-gray-200 hover:border-gray-300 hover:bg-gray-50/60'
                }`}
              >
                <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3.5 min-w-0">
                    <div className="w-12 h-12 rounded-2xl bg-[#0c4b39]/10 text-[#0c4b39] flex items-center justify-center font-bold shrink-0">
                      <Building2 className="w-6 h-6" />
                    </div>
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-extrabold text-secondary text-base">{hospital.name}</h3>
                        <Badge className="bg-emerald-100 text-emerald-800 border-none text-[10px] font-bold">
                          Đạt chuẩn Bộ Y Tế
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-600 flex items-start gap-1">
                        <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-0.5" />
                        <span>{hospital.address || 'Địa chỉ đang được cập nhật'}</span>
                      </p>
                      {hospital.phone && (
                        <p className="text-xs text-gray-500 flex items-center gap-1 font-medium">
                          <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                          <span>Hotline: {hospital.phone}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center gap-2 self-end sm:self-center">
                    {isSelected ? (
                      <span className="text-[11px] font-bold bg-[#0c4b39] text-white px-3 py-1 rounded-full flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                        Đã chọn cơ sở
                      </span>
                    ) : (
                      <Button variant="outline" size="sm" className="rounded-xl border-gray-300 text-xs font-bold text-gray-700">
                        Chọn cơ sở này
                      </Button>
                    )}
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
          disabled={!selectedId}
          className="bg-[#0c4b39] hover:bg-[#09382b] text-white px-8 py-2.5 rounded-xl font-extrabold flex items-center gap-2 shadow-md shadow-emerald-100 disabled:opacity-50 transition-all cursor-pointer"
        >
          Tiếp tục chọn Bác sĩ
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
