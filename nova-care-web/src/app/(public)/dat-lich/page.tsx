'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useBookingStore } from '@/stores/booking.store';
import { useAuth } from '@/hooks/useAuth';
import { BookingStepper } from '@/components/features/BookingStepper';
import { StepSelectDoctor } from '@/components/features/booking/StepSelectDoctor';
import { StepSelectTime } from '@/components/features/booking/StepSelectTime';
import { StepSelectProfile } from '@/components/features/booking/StepSelectProfile';
import { StepConfirm } from '@/components/features/booking/StepConfirm';
import { StepPayment } from '@/components/features/booking/StepPayment';
import { Card, CardContent } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { doctorService } from '@/services/doctor.service';
import { BookingSummary } from '@/components/features/booking/BookingSummary';

const steps = [
  { id: 1, label: 'Chọn bác sĩ' },
  { id: 2, label: 'Chọn thời gian' },
  { id: 3, label: 'Hồ sơ người bệnh' },
  { id: 4, label: 'Xác nhận' },
  { id: 5, label: 'Thanh toán' },
];

import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';

function BookingPageContent() {
  const { currentStep, bookingData, setStep, setBookingData, resetBooking } = useBookingStore();
  const searchParams = useSearchParams();
  const workplaceId = searchParams.get('workplaceId');
  const dateStr = searchParams.get('date');

  // Load workplace preselected if passed in URL
  const { data: workplace } = useQuery({
    queryKey: ['workplace-preload', workplaceId],
    queryFn: () => doctorService.getWorkplace(workplaceId!),
    enabled: !!workplaceId,
  });

  useEffect(() => {
    // Reset booking state when loading page for the first time
    resetBooking();

    if (workplace) {
      setBookingData({
        doctorId: workplace.doctorId,
        doctorName: workplace.doctor.fullName,
        specialtyId: workplace.specialtyId,
        hospitalId: workplace.hospitalId,
        workplaceId: workplace.id,
      });
      setStep(2); // Jump directly to select time step!
    }
  }, [workplace, setBookingData, setStep, resetBooking]);

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

  return (
    <div className="container-custom py-8 max-w-5xl">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-secondary">Đặt lịch khám bệnh</h1>
        <p className="text-gray-500 mt-1">Hoàn thành các bước dưới đây để đặt lịch hẹn với bác sĩ</p>
      </div>

      <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm mb-6">
        <BookingStepper steps={steps} currentStep={currentStep} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className={currentStep > 1 ? "lg:col-span-2" : "lg:col-span-3"}>
          <Card className="rounded-2xl border border-gray-100 shadow-sm overflow-hidden bg-white">
            <CardContent className="p-6">
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
  );
}

export default function BookingPage() {
  return (
    <Suspense fallback={
      <div className="flex justify-center py-12">
        <Loader2 className="animate-spin h-10 w-10 text-primary" />
      </div>
    }>
      <BookingPageContent />
    </Suspense>
  );
}
