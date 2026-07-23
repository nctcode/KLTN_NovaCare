'use client';

import { Check, Stethoscope, Calendar, UserCheck, FileCheck2, CreditCard } from 'lucide-react';
import { cn } from '@/lib/utils';

const stepIcons = [
  Stethoscope,
  Calendar,
  UserCheck,
  FileCheck2,
  CreditCard,
];

export function BookingStepper({
  steps,
  currentStep,
}: {
  steps: { id: number; label: string }[];
  currentStep: number;
}) {
  return (
    <div className="w-full">
      {/* Mobile Step Counter Header */}
      <div className="md:hidden flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <span className="flex items-center justify-center w-7 h-7 rounded-full bg-[#4caf50] text-white text-xs font-bold">
            {currentStep}
          </span>
          <span className="font-semibold text-secondary text-sm">
            {steps.find((s) => s.id === currentStep)?.label}
          </span>
        </div>
        <span className="text-xs font-medium text-gray-500">
          Bước {currentStep} / {steps.length}
        </span>
      </div>

      {/* Desktop Stepper */}
      <div className="relative max-w-4xl mx-auto px-2 md:px-6 py-2">
        {/* Background Track Line */}
        <div className="absolute left-8 right-8 top-6 h-[3px] bg-gray-100 -translate-y-1/2 z-0 rounded-full" />

        {/* Active Progress Fill Line */}
        <div
          className="absolute left-8 top-6 h-[3px] bg-[#4caf50] -translate-y-1/2 transition-all duration-500 ease-in-out z-0 rounded-full"
          style={{
            width: `${((currentStep - 1) / (steps.length - 1)) * 92}%`,
          }}
        />

        <div className="flex items-center justify-between relative z-10">
          {steps.map((step, idx) => {
            const isCompleted = currentStep > step.id;
            const isActive = currentStep === step.id;
            const Icon = stepIcons[idx] || Stethoscope;

            return (
              <div key={step.id} className="flex flex-col items-center group cursor-default">
                {/* Step Circle Button */}
                <div
                  className={cn(
                    "w-11 h-11 md:w-12 md:h-12 rounded-2xl flex items-center justify-center text-sm md:text-base font-bold transition-all duration-300 shadow-sm",
                    isCompleted
                      ? "bg-[#4caf50] border-2 border-[#4caf50] text-white shadow-emerald-100"
                      : isActive
                      ? "bg-white border-2 border-[#4caf50] text-[#4caf50] shadow-md ring-4 ring-[#4caf50]/15 scale-105"
                      : "bg-white border-2 border-gray-200 text-gray-400"
                  )}
                >
                  {isCompleted ? (
                    <Check className="h-5 w-5 stroke-[3px]" />
                  ) : (
                    <Icon className={cn("h-5 w-5 transition-transform duration-300", isActive && "scale-110")} />
                  )}
                </div>

                {/* Step Title Label */}
                <div className="mt-2.5 text-center">
                  <span
                    className={cn(
                      "text-xs md:text-sm font-semibold transition-colors duration-200 block",
                      isActive
                        ? "text-[#4caf50]"
                        : isCompleted
                        ? "text-secondary font-medium"
                        : "text-gray-400 font-normal"
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
