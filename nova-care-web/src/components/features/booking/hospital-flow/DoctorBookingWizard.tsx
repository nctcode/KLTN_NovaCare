'use client';

import { useState } from 'react';
import { Step1BookingInfo } from './Step1BookingInfo';
import { Step2SelectPatientProfile } from './Step2SelectPatientProfile';
import { Step3ConfirmInfo } from './Step3ConfirmInfo';
import { Step4Payment } from './Step4Payment';
import { Hospital, Specialty, Doctor, MedicalService } from '@/types';
import { PatientProfile } from '@/types/profile.types';
import { Stethoscope, Users, CheckCircle2, CreditCard, ChevronRight } from 'lucide-react';

interface DoctorBookingWizardProps {
  hospital: Hospital;
}

export function DoctorBookingWizard({ hospital }: DoctorBookingWizardProps) {
  // Wizard current step: 1 | 2 | 3 | 4
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Form selections state
  const [selectedSpecialty, setSelectedSpecialty] = useState<Specialty | null>(null);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [selectedService, setSelectedService] = useState<MedicalService | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedSlotTime, setSelectedSlotTime] = useState<string>('');
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [selectedProfile, setSelectedProfile] = useState<PatientProfile | null>(null);
  const [reason, setReason] = useState<string>('');

  const wizardSteps = [
    { id: 1, label: 'Thông tin khám', icon: Stethoscope },
    { id: 2, label: 'Hồ sơ người bệnh', icon: Users },
    { id: 3, label: 'Xác nhận thông tin', icon: CheckCircle2 },
    { id: 4, label: 'Xác nhận thanh toán', icon: CreditCard },
  ];

  return (
    <div className="space-y-6">
      {/* Stepper Progress Bar */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-4 sm:p-6 shadow-xs">
        <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 scrollbar-none">
          {wizardSteps.map((ws, idx) => {
            const Icon = ws.icon;
            const isCurrent = step === ws.id;
            const isCompleted = step > ws.id;

            return (
              <div key={ws.id} className="flex items-center gap-2 shrink-0">
                <div
                  onClick={() => {
                    if (isCompleted) setStep(ws.id as any);
                  }}
                  className={`flex items-center gap-2.5 px-3.5 py-2 rounded-2xl transition-all ${
                    isCompleted ? 'cursor-pointer' : ''
                  } ${
                    isCurrent
                      ? 'bg-[#0c4b39] text-white shadow-md font-bold'
                      : isCompleted
                      ? 'bg-emerald-100/80 text-[#0c4b39] font-bold'
                      : 'bg-slate-100 text-slate-400 font-semibold'
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-black ${
                      isCurrent
                        ? 'bg-white text-[#0c4b39]'
                        : isCompleted
                        ? 'bg-[#0c4b39] text-white'
                        : 'bg-slate-200 text-slate-500'
                    }`}
                  >
                    {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : ws.id}
                  </div>
                  <span className="text-xs tracking-tight whitespace-nowrap">{ws.label}</span>
                </div>

                {idx < wizardSteps.length - 1 && (
                  <ChevronRight className="w-4 h-4 text-slate-300 shrink-0 hidden sm:block" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Render Step Form Content */}
      <div className="transition-all duration-300">
        {step === 1 && (
          <Step1BookingInfo
            hospital={hospital}
            selectedSpecialty={selectedSpecialty}
            setSelectedSpecialty={setSelectedSpecialty}
            selectedDoctor={selectedDoctor}
            setSelectedDoctor={setSelectedDoctor}
            selectedService={selectedService}
            setSelectedService={setSelectedService}
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            selectedSlotTime={selectedSlotTime}
            setSelectedSlotTime={setSelectedSlotTime}
            selectedSlotId={selectedSlotId}
            setSelectedSlotId={setSelectedSlotId}
            onNext={() => setStep(2)}
          />
        )}

        {step === 2 && (
          <Step2SelectPatientProfile
            selectedProfileId={selectedProfile?.id || null}
            setSelectedProfile={setSelectedProfile}
            onNext={() => setStep(3)}
            onBack={() => setStep(1)}
          />
        )}

        {step === 3 && (
          <Step3ConfirmInfo
            hospital={hospital}
            specialty={selectedSpecialty}
            doctor={selectedDoctor}
            service={selectedService}
            selectedDate={selectedDate}
            selectedSlotTime={selectedSlotTime}
            patientProfile={selectedProfile}
            reason={reason}
            setReason={setReason}
            onNext={() => setStep(4)}
            onBack={() => setStep(2)}
          />
        )}

        {step === 4 && (
          <Step4Payment
            hospital={hospital}
            specialty={selectedSpecialty}
            doctor={selectedDoctor}
            service={selectedService}
            selectedDate={selectedDate}
            selectedSlotTime={selectedSlotTime}
            selectedSlotId={selectedSlotId}
            patientProfile={selectedProfile}
            reason={reason}
            onBack={() => setStep(3)}
          />
        )}
      </div>
    </div>
  );
}
