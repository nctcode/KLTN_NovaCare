'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { hospitalService } from '@/services/hospital.service';
import { HospitalSelectModal } from '@/components/features/booking/hospital-flow/HospitalSelectModal';
import { BookingTypeStep } from '@/components/features/booking/hospital-flow/BookingTypeStep';
import { DoctorBookingWizard } from '@/components/features/booking/hospital-flow/DoctorBookingWizard';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Building2,
  MapPin,
  Star,
  ChevronLeft,
  Loader2,
  HeartHandshake,
  RefreshCw,
  ArrowLeft,
  LayoutGrid
} from 'lucide-react';
import { Hospital } from '@/types';
import { BookingType, BOOKING_TYPES_CONFIG } from '@/config/bookingTypes';

function HospitalBookingPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const hospitalIdParam = searchParams.get('hospitalId');
  const modeParam = searchParams.get('mode');

  // Helper to parse valid BookingType from query parameter
  const parseBookingType = (modeStr: string | null): BookingType | null => {
    if (!modeStr) return null;
    const normalized = modeStr.toUpperCase();
    if (normalized in BOOKING_TYPES_CONFIG) {
      return normalized as BookingType;
    }
    // Backward compatibility mappings
    if (normalized === 'SPECIALTY' || normalized === 'STANDARD') return 'GENERAL';
    return null;
  };

  // Selected hospital state
  const [selectedHospital, setSelectedHospital] = useState<Hospital | null>(null);
  const [isHospitalModalOpen, setIsHospitalModalOpen] = useState(false);

  // Booking mode state: null (selection screen) or 1 of 6 BookingType values
  const [bookingMode, setBookingMode] = useState<BookingType | null>(parseBookingType(modeParam));

  useEffect(() => {
    setBookingMode(parseBookingType(modeParam));
  }, [modeParam]);

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
      setSelectedHospital(hospitals[0]);
    }
  }, [fetchedHospital, hospitals, selectedHospital, hospitalIdParam]);

  const handleSelectBookingMode = (mode: BookingType) => {
    setBookingMode(mode);
    if (selectedHospital) {
      router.push(`/dat-kham-co-so?hospitalId=${selectedHospital.id}&mode=${mode.toLowerCase()}`);
    }
  };

  const handleResetMode = () => {
    setBookingMode(null);
    if (selectedHospital) {
      router.push(`/dat-kham-co-so?hospitalId=${selectedHospital.id}`);
    }
  };

  if (loadingHospitals || (hospitalIdParam && loadingFetchedHospital)) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-slate-50 gap-3">
        <Loader2 className="animate-spin h-10 w-10 text-[#0c4b39]" />
        <p className="text-xs font-bold text-slate-700">Đang khởi tạo luồng đặt khám theo cơ sở NovaCare...</p>
      </div>
    );
  }

  const currentConfig = bookingMode ? BOOKING_TYPES_CONFIG[bookingMode] : null;

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
              Lựa chọn cơ sở y tế • Chọn 1 trong 6 hình thức đăng ký • Giữ chỗ khám ưu tiên
            </p>
          </div>

          <Button
            onClick={() => router.back()}
            variant="outline"
            size="sm"
            className="border-slate-300 text-slate-800 hover:bg-slate-100 font-bold text-xs rounded-2xl h-10 px-4 shrink-0"
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
                      Cơ sở y tế được chọn
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
                <span>Đổi cơ sở y tế khác</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* STEP 2: CHỌN HÌNH THỨC ĐẶT KHÁM (KHỚP BOOKINGTYPE NULL) HOẶC THỰC HIỆN WIZARD */}
        {selectedHospital && (
          <div className="space-y-8">
            {bookingMode === null ? (
              <BookingTypeStep
                hospitalName={selectedHospital.name}
                selectedMode={bookingMode}
                onSelectMode={handleSelectBookingMode}
              />
            ) : (
              <div className="space-y-6">
                {/* Back button to re-select booking mode */}
                <div className="flex items-center justify-between bg-emerald-50/90 border border-emerald-200/80 p-4 rounded-2xl">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#0c4b39]">
                    <LayoutGrid className="w-4 h-4 text-[#0c4b39]" />
                    <span>
                      Đang trong quy trình:{' '}
                      <strong className="uppercase">
                        {currentConfig ? currentConfig.title : bookingMode}
                      </strong>
                    </span>
                  </div>

                  <Button
                    type="button"
                    onClick={handleResetMode}
                    variant="outline"
                    size="sm"
                    className="border-[#0c4b39] text-[#0c4b39] hover:bg-white text-xs font-bold rounded-xl h-9 px-3.5"
                  >
                    <ArrowLeft className="w-3.5 h-3.5 mr-1" />
                    Đổi hình thức đặt khám khác
                  </Button>
                </div>

                {/* Multi-step Wizard */}
                <DoctorBookingWizard hospital={selectedHospital} bookingMode={bookingMode} />
              </div>
            )}
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
            router.push(`/dat-kham-co-so?hospitalId=${hosp.id}${bookingMode ? `&mode=${bookingMode.toLowerCase()}` : ''}`);
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
