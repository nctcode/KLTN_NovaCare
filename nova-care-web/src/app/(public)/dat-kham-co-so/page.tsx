'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { hospitalService } from '@/services/hospital.service';
import { HospitalSelectModal } from '@/components/features/booking/hospital-flow/HospitalSelectModal';
import { BookingTypeStep, HospitalBookingMode } from '@/components/features/booking/hospital-flow/BookingTypeStep';
import { DoctorBookingWizard } from '@/components/features/booking/hospital-flow/DoctorBookingWizard';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Building2,
  MapPin,
  Phone,
  Star,
  ChevronLeft,
  Loader2,
  HeartHandshake,
  ShieldCheck,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { Hospital } from '@/types';
import Link from 'next/link';

function HospitalBookingPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const hospitalIdParam = searchParams.get('hospitalId');
  const modeParam = searchParams.get('mode') as HospitalBookingMode | null;

  // Selected hospital state
  const [selectedHospital, setSelectedHospital] = useState<Hospital | null>(null);
  const [isHospitalModalOpen, setIsHospitalModalOpen] = useState(false);

  // Flow step mode: 'select-type' | 'wizard-doctor' | 'wizard-service' | 'wizard-standard'
  const [bookingMode, setBookingMode] = useState<HospitalBookingMode>(modeParam || 'doctor');

  // Query all hospitals for hospital selector modal
  const { data: hospitals = [], isLoading: loadingHospitals } = useQuery({
    queryKey: ['hospitals-all-booking'],
    queryFn: () => hospitalService.getAll(),
  });

  // Query details if hospitalIdParam is passed
  const { data: fetchedHospital, isLoading: loadingFetchedHospital } = useQuery({
    queryKey: ['hospital-detail-preload', hospitalIdParam],
    queryFn: () => hospitalService.getById(hospitalIdParam!),
    enabled: !!hospitalIdParam,
  });

  useEffect(() => {
    if (fetchedHospital) {
      setSelectedHospital(fetchedHospital);
    } else if (hospitals.length > 0 && !selectedHospital && !hospitalIdParam) {
      // Preselect first hospital if none provided
      setSelectedHospital(hospitals[0]);
    }
  }, [fetchedHospital, hospitals, selectedHospital, hospitalIdParam]);

  if (loadingHospitals || (hospitalIdParam && loadingFetchedHospital)) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-slate-50 gap-3">
        <Loader2 className="animate-spin h-10 w-10 text-[#0c4b39]" />
        <p className="text-xs font-bold text-slate-700">Đang khởi tạo luồng đặt khám theo cơ sở NovaCare...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-8 md:py-12 text-slate-900">
      <div className="container-custom max-w-6xl space-y-8">
        {/* Banner Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-extrabold text-[#0c4b39]">
              <HeartHandshake className="w-4 h-4 text-[#0c4b39]" />
              <span>Luồng Đặt Khám Theo Cơ Sở Y Tế NovaCare</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-slate-950 tracking-tight">
              Đăng Ký Đặt Khám Tại Bệnh Viện
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              Chọn cơ sở y tế • Chọn hình thức đặt khám • Đặt hẹn với bác sĩ ưu tiên
            </p>
          </div>

          <Button
            onClick={() => router.back()}
            variant="outline"
            size="sm"
            className="border-slate-300 text-slate-800 hover:bg-slate-100 font-bold text-xs rounded-2xl h-10 px-4"
          >
            <ChevronLeft className="w-4 h-4 mr-1 text-[#0c4b39]" />
            Quay lại
          </Button>
        </div>

        {/* STEP 1: XÁC NHẬN / CHỌN CƠ SỞ Y TẾ */}
        <Card className="border border-slate-200/90 shadow-md rounded-3xl bg-white overflow-hidden">
          <CardContent className="p-6 sm:p-8">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="flex items-start md:items-center gap-4 flex-1">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white border-2 border-emerald-100 p-1.5 shadow-xs shrink-0 flex items-center justify-center">
                  {selectedHospital?.logoUrl ? (
                    <img
                      src={selectedHospital.logoUrl}
                      alt={selectedHospital.name}
                      className="w-full h-full object-cover rounded-xl"
                    />
                  ) : (
                    <Building2 className="w-9 h-9 text-[#0c4b39]" />
                  )}
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className="bg-emerald-100/90 text-[#0c4b39] border border-emerald-300 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                      Bước 1 • Cơ sở y tế đã chọn
                    </Badge>
                    {selectedHospital?.rating && (
                      <span className="flex items-center gap-1 text-amber-500 font-black text-xs">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                        {selectedHospital.rating}
                      </span>
                    )}
                  </div>

                  <h2 className="text-xl sm:text-2xl font-black text-slate-950 leading-tight">
                    {selectedHospital ? selectedHospital.name : 'Chưa chọn cơ sở y tế'}
                  </h2>

                  {selectedHospital?.address && (
                    <p className="text-xs text-slate-600 font-semibold flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-[#0c4b39] shrink-0" />
                      <span>{selectedHospital.address}</span>
                    </p>
                  )}
                </div>
              </div>

              <Button
                type="button"
                onClick={() => setIsHospitalModalOpen(true)}
                variant="outline"
                className="border-[#0c4b39] text-[#0c4b39] hover:bg-emerald-50 font-bold text-xs h-11 px-5 rounded-2xl w-full md:w-auto shrink-0 flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Thay đổi cơ sở y tế khác</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* STEP 2: CHỌN HÌNH THỨC ĐẶT KHÁM */}
        {selectedHospital && (
          <div className="space-y-8">
            <BookingTypeStep
              hospitalName={selectedHospital.name}
              selectedMode={bookingMode}
              onSelectMode={(mode) => setBookingMode(mode)}
            />

            {/* RENDER 4-STEP WIZARD FOR ALL BOOKING MODES */}
            <DoctorBookingWizard hospital={selectedHospital} bookingMode={bookingMode} />
          </div>
        )}

        {/* HOSPITAL SELECTOR POPUP MODAL */}
        <HospitalSelectModal
          isOpen={isHospitalModalOpen}
          onClose={() => setIsHospitalModalOpen(false)}
          hospitals={hospitals}
          selectedHospitalId={selectedHospital?.id || null}
          onSelect={(hosp) => {
            setSelectedHospital(hosp);
            router.push(`/dat-kham-co-so?hospitalId=${hosp.id}`);
          }}
        />
      </div>
    </div>
  );
}

export default function HospitalBookingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center py-20 bg-[#F8FAFC]">
          <Loader2 className="animate-spin h-10 w-10 text-[#0c4b39]" />
        </div>
      }
    >
      <HospitalBookingPageContent />
    </Suspense>
  );
}
