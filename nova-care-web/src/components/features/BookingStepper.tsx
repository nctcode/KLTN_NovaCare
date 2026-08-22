'use client';

import {
  Check,
  UserCheck,
  Stethoscope,
  Activity,
  ShieldCheck,
  Building2,
  User,
  Calendar,
  Clock,
  FileCheck2,
  CheckCircle2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useBookingStore } from '@/stores/booking.store';
import { BookingStep } from '@/types/booking.types';

const stepIcons = [
  UserCheck,
  Stethoscope,
  Activity,
  ShieldCheck,
  Building2,
  User,
  Calendar,
  Clock,
  FileCheck2,
  CheckCircle2,
];

export function BookingStepper({
  steps,
  currentStep,
}: {
  steps: { id: number; label: string }[];
  currentStep: number;
}) {
  const { setStep } = useBookingStore();

  return (
    <div className="w-full">
      {/* Mobile Step Counter Header */}
      <div className="md:hidden flex items-center justify-between mb-2 pb-2 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <span className="flex items-center justify-center w-7 h-7 rounded-full bg-[#0c4b39] text-white text-xs font-bold shadow-2xs">
            {currentStep}
          </span>
          <span className="font-extrabold text-secondary text-sm">
            {steps.find((s) => s.id === currentStep)?.label}
          </span>
        </div>
        <span className="text-xs font-bold text-[#0c4b39] bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
          Bước {currentStep} / {steps.length}
        </span>
      </div>

      {/* Responsive 10-Step Horizontal Scroll Bar */}
      <div className="relative overflow-x-auto py-2 scrollbar-none">
        <div className="flex items-center justify-between min-w-[760px] md:min-w-full px-2 gap-1 relative z-10">
          {steps.map((step, idx) => {
            const isCompleted = currentStep > step.id;
            const isActive = currentStep === step.id;
            const Icon = stepIcons[idx] || Stethoscope;
            const isClickable = isCompleted || step.id < currentStep;

            return (
              <div
                key={step.id}
                onClick={() => {
                  if (isClickable) {
                    setStep(step.id as BookingStep);
                  }
                }}
                className={cn(
                  'flex flex-col items-center group flex-1 transition-all duration-200',
                  isClickable ? 'cursor-pointer' : 'cursor-default'
                )}
              >
                {/* Circle step badge */}
                <div
                  className={cn(
                    'w-9 h-9 md:w-10 md:h-10 rounded-2xl flex items-center justify-center text-xs md:text-sm font-extrabold transition-all duration-300 shadow-2xs',
                    isCompleted
                      ? 'bg-[#0c4b39] border-2 border-[#0c4b39] text-white shadow-emerald-100 group-hover:scale-105'
                      : isActive
                      ? 'bg-white border-2 border-[#0c4b39] text-[#0c4b39] shadow-md ring-4 ring-[#0c4b39]/15 scale-110 font-black'
                      : 'bg-white border-2 border-gray-200 text-gray-400'
                  )}
                >
                  {isCompleted ? (
                    <Check className="h-4 w-4 stroke-[3px]" />
                  ) : (
                    <Icon className={cn('h-4 w-4 transition-transform duration-300', isActive && 'scale-110 text-[#0c4b39]')} />
                  )}
                </div>

                {/* Step label */}
                <div className="mt-1.5 text-center px-1">
                  <span
                    className={cn(
                      'text-[10px] md:text-xs transition-colors duration-200 block truncate max-w-[70px] md:max-w-[85px]',
                      isActive
                        ? 'text-[#0c4b39] font-black'
                        : isCompleted
                        ? 'text-secondary font-bold group-hover:text-[#0c4b39]'
                        : 'text-gray-400 font-medium'
                    )}
                  >
                    {step.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
