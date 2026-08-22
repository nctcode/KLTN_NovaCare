'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useBookingStore } from '@/stores/booking.store';
import { BookingStepper } from '@/components/features/BookingStepper';
import { Step1Profile } from '@/components/features/booking/steps/Step1Profile';
import { Step2Specialty } from '@/components/features/booking/steps/Step2Specialty';
import { Step3Service } from '@/components/features/booking/steps/Step3Service';
import { Step4ExamType } from '@/components/features/booking/steps/Step4ExamType';
import { Step5Hospital } from '@/components/features/booking/steps/Step5Hospital';
import { Step6Doctor } from '@/components/features/booking/steps/Step6Doctor';
import { Step7Date } from '@/components/features/booking/steps/Step7Date';
import { Step8Slot } from '@/components/features/booking/steps/Step8Slot';
import { Step9Review } from '@/components/features/booking/steps/Step9Review';
import { Step10Confirm } from '@/components/features/booking/steps/Step10Confirm';
import { AIHealthAssessmentWizard } from '@/components/features/booking/AIHealthAssessmentWizard';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { doctorService } from '@/services/doctor.service';
import { BookingSummary } from '@/components/features/booking/BookingSummary';
import { Loader2, HeartHandshake, Sparkles, ListOrdered, Bot, HelpCircle } from 'lucide-react';
import { BookingStep } from '@/types/booking.types';

const BOOKING_STEPS = [
  { id: 1, label: 'Hồ sơ' },
  { id: 2, label: 'Chuyên khoa' },
  { id: 3, label: 'Dịch vụ' },
  { id: 4, label: 'Hình thức' },
  { id: 5, label: 'Bệnh viện' },
  { id: 6, label: 'Bác sĩ' },
  { id: 7, label: 'Ngày khám' },
  { id: 8, label: 'Khung giờ' },
  { id: 9, label: 'Kiểm tra' },
  { id: 10, label: 'Thanh toán' },
];

function BookingPageContent() {
  const { currentStep, setStep, setBookingData } = useBookingStore();
  const searchParams = useSearchParams();

  const workplaceIdParam = searchParams.get('workplaceId');
  const hospitalIdParam = searchParams.get('hospitalId');
  const specialtyIdParam = searchParams.get('specialtyId');
  const doctorIdParam = searchParams.get('doctorId');

  // Mode Selection: 'STEPS' (Known info 10-step wizard) or 'AI_SCREENING' (New patient needing AI suggestions)
  const [patientMode, setPatientMode] = useState<'STEPS' | 'AI_SCREENING'>('STEPS');

  // Load workplace preselected if passed in URL
  const { data: workplace } = useQuery({
    queryKey: ['workplace-preload', workplaceIdParam],
    queryFn: () => doctorService.getWorkplace(workplaceIdParam!),
    enabled: !!workplaceIdParam,
  });

  useEffect(() => {
    // Pre-fill URL parameters into booking store if provided
    const updatePayload: any = {};
    if (hospitalIdParam) updatePayload.hospitalId = hospitalIdParam;
    if (specialtyIdParam) updatePayload.specialtyId = specialtyIdParam;
    if (doctorIdParam) updatePayload.doctorId = doctorIdParam;

    if (Object.keys(updatePayload).length > 0) {
      setBookingData(updatePayload);
    }

    if (workplace) {
      setBookingData({
        doctorId: workplace.doctorId,
        doctorName: workplace.doctor?.fullName || '',
        specialtyId: workplace.specialtyId,
        specialtyName: workplace.specialty?.name || '',
        hospitalId: workplace.hospitalId,
        hospitalName: workplace.hospital?.name || '',
        workplaceId: workplace.id,
      });
    }
  }, [workplace, workplaceIdParam, hospitalIdParam, specialtyIdParam, doctorIdParam, setBookingData]);

  const handleNext = () => {
    if (currentStep < 10) {
      setStep((currentStep + 1) as BookingStep);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setStep((currentStep - 1) as BookingStep);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/60 py-6 md:py-10">
      <div className="container-custom max-w-6xl space-y-6">
        {/* Page Header Banner */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-bold text-[#0c4b39]">
            <HeartHandshake className="w-4 h-4 text-[#0c4b39]" />
            Nền tảng đặt khám y tế số 1 NovaCare
          </div>
          <h1 className="text-2xl md:text-4xl font-black text-secondary tracking-tight">
            Đặt Lịch Khám Bệnh Trực Tuyến
          </h1>
          <p className="text-xs md:text-sm text-gray-500 max-w-2xl mx-auto font-medium">
            Hệ thống thông minh đáp ứng cho cả người bệnh mới và người bệnh đã có thông tin định hướng.
          </p>

          {/* Mode Switcher Tabs for Both Patient Types */}
          <div className="inline-flex p-1.5 bg-gray-200/70 backdrop-blur-xs rounded-2xl gap-1 mt-2 shadow-2xs">
            <button
              onClick={() => setPatientMode('STEPS')}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer ${
                patientMode === 'STEPS'
                  ? 'bg-white text-[#0c4b39] shadow-sm'
                  : 'text-gray-600 hover:text-secondary'
              }`}
            >
              <ListOrdered className="w-4 h-4 text-[#0c4b39]" />
              <span>Đã biết thông tin khám (Quy trình 10 bước)</span>
            </button>

            <button
              onClick={() => setPatientMode('AI_SCREENING')}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer ${
                patientMode === 'AI_SCREENING'
                  ? 'bg-[#0c4b39] text-white shadow-sm'
                  : 'text-gray-600 hover:text-secondary'
              }`}
            >
              <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
              <span>Bệnh nhân mới (Gợi ý Sàng lọc AI)</span>
            </button>
          </div>
        </div>

        {/* MODE A: AI HEALTH ASSESSMENT WIZARD */}
        {patientMode === 'AI_SCREENING' ? (
          <Card className="rounded-3xl border border-emerald-100 shadow-md overflow-hidden bg-white">
            <CardContent className="p-0">
              <AIHealthAssessmentWizard
                onCancel={() => setPatientMode('STEPS')}
                onCompleteAssessment={() => {
                  setPatientMode('STEPS');
                }}
              />
            </CardContent>
          </Card>
        ) : (
          /* MODE B: 10-STEP STANDARD BOOKING WIZARD */
          <>
            {/* Stepper Bar */}
            <div className="bg-white border border-gray-200/80 rounded-2xl p-4 md:p-5 shadow-2xs">
              <BookingStepper steps={BOOKING_STEPS} currentStep={currentStep} />
            </div>

            {/* Step Body & Summary Sidebar */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
              <div className={currentStep >= 2 && currentStep <= 9 ? 'lg:col-span-2' : 'lg:col-span-3'}>
                <Card className="rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden bg-white">
                  <CardContent className="p-5 md:p-8">
                    {currentStep === 1 && <Step1Profile onNext={handleNext} />}
                    {currentStep === 2 && <Step2Specialty onNext={handleNext} onBack={handleBack} />}
                    {currentStep === 3 && <Step3Service onNext={handleNext} onBack={handleBack} />}
                    {currentStep === 4 && <Step4ExamType onNext={handleNext} onBack={handleBack} />}
                    {currentStep === 5 && <Step5Hospital onNext={handleNext} onBack={handleBack} />}
                    {currentStep === 6 && <Step6Doctor onNext={handleNext} onBack={handleBack} />}
                    {currentStep === 7 && <Step7Date onNext={handleNext} onBack={handleBack} />}
                    {currentStep === 8 && <Step8Slot onNext={handleNext} onBack={handleBack} />}
                    {currentStep === 9 && <Step9Review onNext={handleNext} onBack={handleBack} />}
                    {currentStep === 10 && <Step10Confirm />}
                  </CardContent>
                </Card>
              </div>

              {currentStep >= 2 && currentStep <= 9 && (
                <div className="lg:col-span-1 sticky top-6">
                  <BookingSummary />
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function BookingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex flex-col items-center justify-center py-20 text-gray-400">
          <Loader2 className="animate-spin h-10 w-10 text-[#0c4b39] mb-3" />
          <p className="text-sm font-medium">Đang tải luồng đặt lịch NovaCare...</p>
        </div>
      }
    >
      <BookingPageContent />
    </Suspense>
  );
}
