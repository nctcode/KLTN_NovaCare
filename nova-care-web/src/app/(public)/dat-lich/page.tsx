'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useBookingStore } from '@/stores/booking.store';
import { BookingStepper } from '@/components/features/BookingStepper';
import { PreExamScreening } from '@/components/features/booking/PreExamScreening';
import { StepSelectDoctor } from '@/components/features/booking/StepSelectDoctor';
import { StepSelectTime } from '@/components/features/booking/StepSelectTime';
import { StepSelectProfile } from '@/components/features/booking/StepSelectProfile';
import { StepConfirm } from '@/components/features/booking/StepConfirm';
import { StepPayment } from '@/components/features/booking/StepPayment';
import { Card, CardContent } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { doctorService } from '@/services/doctor.service';
import { BookingSummary } from '@/components/features/booking/BookingSummary';
import { Loader2, HeartHandshake } from 'lucide-react';

const steps = [
  { id: 1, label: 'Chọn bác sĩ' },
  { id: 2, label: 'Chọn thời gian' },
  { id: 3, label: 'Hồ sơ người bệnh' },
  { id: 4, label: 'Xác nhận' },
  { id: 5, label: 'Thanh toán' },
];

function BookingPageContent() {
  const { currentStep, bookingData, preExamResult, setStep, setBookingData, resetBooking } = useBookingStore();
  const searchParams = useSearchParams();
  const workplaceId = searchParams.get('workplaceId');
  const mode = searchParams.get('mode');

  const [skipScreening, setSkipScreening] = useState(false);

  // Load workplace preselected if passed in URL
  const { data: workplace } = useQuery({
    queryKey: ['workplace-preload', workplaceId],
    queryFn: () => doctorService.getWorkplace(workplaceId!),
    enabled: !!workplaceId,
  });

  useEffect(() => {
    // If preselected workplace or mode passed
    if (workplaceId || mode === 'traditional' || mode === 'skip-screening') {
      setSkipScreening(true);
    }

    if (!workplaceId && !preExamResult && !mode) {
      resetBooking();
    }

    if (workplace) {
      setBookingData({
        doctorId: workplace.doctorId,
        doctorName: workplace.doctor?.fullName || '',
        specialtyId: workplace.specialtyId,
        hospitalId: workplace.hospitalId,
        workplaceId: workplace.id,
      });
      setStep(2); // Jump directly to select time step
    }
  }, [workplace, workplaceId, mode, preExamResult, setBookingData, setStep, resetBooking]);

  const handleNext = () => {
    if (currentStep < 5) {
      setStep((currentStep + 1) as any);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setStep((currentStep - 1) as any);
    }
  };

  // Show Pre-Exam Screening wizard first unless user skipped or already completed screening
  if (!skipScreening && !preExamResult && !workplaceId && mode !== 'pre-filled') {
    return (
      <div className="min-h-screen bg-slate-50/60 py-8 md:py-12">
        <div className="container-custom max-w-4xl space-y-6">
          <PreExamScreening
            onSkip={() => setSkipScreening(true)}
            onCompleted={() => setSkipScreening(true)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/60 py-8 md:py-12">
      <div className="container-custom max-w-6xl space-y-6">
        {/* Page Title & Subtitle Banner */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-gray-200 shadow-2xs text-xs font-semibold text-gray-600 mb-1">
            <HeartHandshake className="w-4 h-4 text-[#4caf50]" />
            Nền tảng đặt khám y tế số 1 NovaCare
          </div>
          <h1 className="text-2xl md:text-4xl font-extrabold text-secondary tracking-tight">
            Đặt Lịch Khám Bệnh Trực Tuyến
          </h1>
          <p className="text-sm md:text-base text-gray-500 max-w-2xl mx-auto">
            Đặt khám nhanh chóng trong 5 bước • Chọn bác sĩ chuyên khoa • Giữ chỗ tức thì
          </p>
        </div>

        {/* Stepper Card Header */}
        <div className="bg-white border border-gray-200/80 rounded-2xl p-5 md:p-6 shadow-xs">
          <BookingStepper steps={steps} currentStep={currentStep} />
        </div>

        {/* Main Content & Sidebar Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <div className={currentStep > 1 ? 'lg:col-span-2' : 'lg:col-span-3'}>
            <Card className="rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden bg-white">
              <CardContent className="p-5 md:p-8">
                {currentStep === 1 && <StepSelectDoctor onNext={handleNext} />}
                {currentStep === 2 && <StepSelectTime onNext={handleNext} onBack={handleBack} />}
                {currentStep === 3 && <StepSelectProfile onNext={handleNext} onBack={handleBack} />}
                {currentStep === 4 && <StepConfirm onNext={handleNext} onBack={handleBack} />}
                {currentStep === 5 && <StepPayment />}
              </CardContent>
            </Card>
          </div>

          {currentStep > 1 && (
            <div className="lg:col-span-1">
              <BookingSummary />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function BookingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex flex-col items-center justify-center py-20 text-gray-400">
          <Loader2 className="animate-spin h-10 w-10 text-[#4caf50] mb-3" />
          <p className="text-sm font-medium">Đang tải luồng đặt lịch NovaCare...</p>
        </div>
      }
    >
      <BookingPageContent />
    </Suspense>
  );
}
