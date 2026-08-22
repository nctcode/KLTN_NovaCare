'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { medicalServiceService } from '@/services/medical-service.service';
import { useBookingStore } from '@/stores/booking.store';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, ChevronRight, Loader2, Activity, CheckCircle2, Clock, Sparkles } from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import { toast } from 'sonner';

interface Step3ServiceProps {
  onNext: () => void;
  onBack: () => void;
}

export function Step3Service({ onNext, onBack }: Step3ServiceProps) {
  const { bookingData, setBookingData } = useBookingStore();
  const { specialtyId, specialtyName, hospitalId } = bookingData;
  const [selectedId, setSelectedId] = useState<string | null>(bookingData.medicalServiceId);

  // Query live services filtered by hospitalId & specialtyId from Backend DB
  const { data: responseData, isLoading } = useQuery({
    queryKey: ['medical-services-step3', hospitalId, specialtyId],
    queryFn: () => medicalServiceService.getAll(hospitalId || undefined, specialtyId || undefined),
  });

  const servicesList = useMemo(() => {
    const raw = Array.isArray(responseData) ? responseData : (responseData as any)?.data || [];
    
    // 1. Strict filter by specialtyId if present
    const filtered = specialtyId
      ? raw.filter((s: any) => s.specialtyId === specialtyId || s.specialty?.id === specialtyId)
      : raw;

    // 2. Deduplicate by service name to prevent identical cards
    const uniqueMap = new Map<string, any>();
    for (const service of filtered) {
      const key = service.name.trim().toLowerCase();
      if (!uniqueMap.has(key)) {
        uniqueMap.set(key, service);
      }
    }
    return Array.from(uniqueMap.values());
  }, [responseData, specialtyId]);

  const handleSelectService = (service: any) => {
    if (service === null) {
      setSelectedId('STANDARD_CONSULTATION');
      setBookingData({
        medicalServiceId: null,
        medicalServiceName: `Khám Chuyên Khoa ${specialtyName || ''} Tiêu Chuẩn`,
      });
    } else {
      setSelectedId(service.id);
      setBookingData({
        medicalServiceId: service.id,
        medicalServiceName: service.name,
      });
    }
  };

  const handleContinue = () => {
    onNext();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-gray-100">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#0c4b39]/10 text-[#0c4b39] text-xs font-black uppercase tracking-wider mb-1">
            <Activity className="w-3.5 h-3.5" />
            Bước 3: Chọn dịch vụ khám
          </div>
          <h2 className="text-xl md:text-2xl font-extrabold text-secondary">
            Chọn Dịch Vụ Khám {specialtyName ? `- Khoa ${specialtyName}` : ''}
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Các gói dịch vụ y tế chuyên khoa thực tế từ cơ sở bệnh viện NovaCare.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-12 text-gray-400">
          <Loader2 className="animate-spin h-8 w-8 text-[#0c4b39] mb-2" />
          <p className="text-sm font-medium">Đang tải danh sách dịch vụ y tế từ cơ sở dữ liệu...</p>
        </div>
      ) : (
        <div className="space-y-3.5">
          {/* Default Standard Option */}
          <Card
            onClick={() => handleSelectService(null)}
            className={`cursor-pointer transition-all duration-200 rounded-2xl relative overflow-hidden bg-white ${
              selectedId === null || selectedId === 'STANDARD_CONSULTATION'
                ? 'border-2 border-[#0c4b39] bg-emerald-50/20 shadow-sm ring-2 ring-[#0c4b39]/15'
                : 'border border-gray-200 hover:border-gray-300 hover:bg-gray-50/60'
            }`}
          >
            <CardContent className="p-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#0c4b39]/10 text-[#0c4b39] flex items-center justify-center font-bold shrink-0">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-secondary text-base">
                      Khám Chuyên Khoa {specialtyName || 'Tổng Quát'} Tiêu Chuẩn
                    </h3>
                    <Badge className="bg-emerald-100 text-emerald-800 border-none text-[10px] font-bold">Gợi ý</Badge>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Khám trực tiếp 1:1 với Bác sĩ chuyên khoa, chẩn đoán ban đầu và chỉ định xét nghiệm nếu cần.
                  </p>
                </div>
              </div>

              {(selectedId === null || selectedId === 'STANDARD_CONSULTATION') && (
                <span className="text-[10px] font-bold bg-[#0c4b39] text-white px-2.5 py-1 rounded-full flex items-center gap-1 shrink-0">
                  <CheckCircle2 className="w-3 h-3 text-emerald-300" />
                  Đã chọn
                </span>
              )}
            </CardContent>
          </Card>

          {/* Unique Specialty Medical Services */}
          {servicesList.map((service: any) => {
            const isSelected = selectedId === service.id;

            return (
              <Card
                key={service.id}
                onClick={() => handleSelectService(service)}
                className={`cursor-pointer transition-all duration-200 rounded-2xl relative overflow-hidden bg-white ${
                  isSelected
                    ? 'border-2 border-[#0c4b39] bg-emerald-50/20 shadow-sm ring-2 ring-[#0c4b39]/15'
                    : 'border border-gray-200 hover:border-gray-300 hover:bg-gray-50/60'
                }`}
              >
                <CardContent className="p-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-2xl bg-[#0c4b39]/10 text-[#0c4b39] flex items-center justify-center font-bold shrink-0">
                      <Activity className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-extrabold text-secondary text-base truncate">{service.name}</h3>
                      <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">
                        {service.description || 'Dịch vụ y tế chuyên khoa thực tế từ hệ thống.'}
                      </p>
                      <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-600 font-semibold">
                        <span className="text-[#0c4b39] font-extrabold">
                          Giá niêm yết: {formatPrice(Number(service.price))}đ
                        </span>
                        {service.duration && (
                          <span className="flex items-center gap-1 text-gray-400 font-normal">
                            <Clock className="w-3 h-3" />
                            {service.duration} phút
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {isSelected && (
                    <span className="text-[10px] font-bold bg-[#0c4b39] text-white px-2.5 py-1 rounded-full flex items-center gap-1 shrink-0">
                      <CheckCircle2 className="w-3 h-3 text-emerald-300" />
                      Đã chọn
                    </span>
                  )}
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
          className="bg-[#0c4b39] hover:bg-[#09382b] text-white px-8 py-2.5 rounded-xl font-extrabold flex items-center gap-2 shadow-md shadow-emerald-100 cursor-pointer"
        >
          Tiếp tục chọn Hình thức khám
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
