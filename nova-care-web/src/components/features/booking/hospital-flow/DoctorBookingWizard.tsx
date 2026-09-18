'use client';

import { useState } from 'react';
import { Step1BookingInfo } from './Step1BookingInfo';
import { Step2SelectPatientProfile } from './Step2SelectPatientProfile';
import { Step3ConfirmInfo } from './Step3ConfirmInfo';
import { Step4Payment } from './Step4Payment';
import { InpatientVerificationStep } from './InpatientVerificationStep';
import { Hospital, Specialty, Doctor, MedicalService } from '@/types';
import { PatientProfile } from '@/types/profile.types';
import { Stethoscope, Users, CheckCircle2, CreditCard, ChevronRight, FileCheck } from 'lucide-react';
import { ClinicRoom } from './RoomSelectModal';
import { BookingType, BOOKING_TYPES_CONFIG } from '@/config/bookingTypes';

interface DoctorBookingWizardProps {
  hospital: Hospital;
  bookingMode?: BookingType | null;
}

export function DoctorBookingWizard({ hospital, bookingMode = 'DOCTOR' }: DoctorBookingWizardProps) {
  // Wizard current step: 1 | 2 | 3 | 4 | 5
  const [step, setStep] = useState<number>(1);

  // Form selections state
  const [selectedSpecialty, setSelectedSpecialty] = useState<Specialty | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<ClinicRoom | null>(null);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [selectedService, setSelectedService] = useState<MedicalService | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedSlotTime, setSelectedSlotTime] = useState<string>('');
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [selectedProfile, setSelectedProfile] = useState<PatientProfile | null>(null);
  const [selectedEncounter, setSelectedEncounter] = useState<any | null>(null);
  const [reason, setReason] = useState<string>('');

  const currentConfig = bookingMode ? BOOKING_TYPES_CONFIG[bookingMode] : null;
  const isInpatientMode = bookingMode === 'INPATIENT_FOLLOWUP';

  const wizardSteps = isInpatientMode
    ? [
        { id: 1, label: 'Xác minh hồ sơ nội trú', icon: FileCheck },
        { id: 2, label: 'Thông tin khám', icon: Stethoscope },
        { id: 3, label: 'Hồ sơ người bệnh', icon: Users },
        { id: 4, label: 'Xác nhận thông tin', icon: CheckCircle2 },
        { id: 5, label: 'Thanh toán', icon: CreditCard },
      ]
    : [
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
                    if (isCompleted) setStep(ws.id);
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
        {/* INPATIENT MODE STEP 1: VERIFICATION */}
        {isInpatientMode && step === 1 && (
          <InpatientVerificationStep
            hospitalId={hospital.id}
            hospitalName={hospital.name}
            selectedEncounterId={selectedEncounter?.id}
            onSelectEncounter={(enc) => setSelectedEncounter(enc)}
            onNext={() => setStep(2)}
          />
        )}

        {/* STEP: BOOKING INFO */}
        {((!isInpatientMode && step === 1) || (isInpatientMode && step === 2)) && (
          <Step1BookingInfo
            hospital={hospital}
            bookingMode={bookingMode}
            selectedSpecialty={selectedSpecialty}
            setSelectedSpecialty={setSelectedSpecialty}
            selectedRoom={selectedRoom}
            setSelectedRoom={setSelectedRoom}
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
            onNext={() => setStep(isInpatientMode ? 3 : 2)}
          />
        )}

        {/* STEP: PATIENT PROFILE */}
        {((!isInpatientMode && step === 2) || (isInpatientMode && step === 3)) && (
          <Step2SelectPatientProfile
            selectedProfileId={selectedProfile?.id || null}
            setSelectedProfile={setSelectedProfile}
            onNext={() => setStep(isInpatientMode ? 4 : 3)}
            onBack={() => setStep(isInpatientMode ? 2 : 1)}
          />
        )}

        {/* STEP: CONFIRM INFO */}
        {((!isInpatientMode && step === 3) || (isInpatientMode && step === 4)) && (
          <Step3ConfirmInfo
            hospital={hospital}
            specialty={selectedSpecialty}
            room={selectedRoom}
            doctor={selectedDoctor}
            service={selectedService}
            bookingMode={bookingMode as any}
            selectedDate={selectedDate}
            selectedSlotTime={selectedSlotTime}
            patientProfile={selectedProfile}
            reason={reason}
            setReason={setReason}
            onNext={() => {
              const requiresPayment = currentConfig?.requiresPayment !== false;
              if (requiresPayment) {
                setStep(isInpatientMode ? 5 : 4);
              } else {
                setStep(isInpatientMode ? 5 : 4);
              }
            }}
            onBack={() => setStep(isInpatientMode ? 3 : 2)}
          />
        )}

        {/* STEP: PAYMENT */}
        {((!isInpatientMode && step === 4) || (isInpatientMode && step === 5)) && (
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
            onBack={() => setStep(isInpatientMode ? 4 : 3)}
          />
        )}
      </div>
    </div>
  );
}
