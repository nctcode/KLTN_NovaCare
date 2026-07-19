'use client';

import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export function BookingStepper({
  steps,
  currentStep,
}: {
  steps: { id: number; label: string }[];
  currentStep: number;
}) {
  return (
    <div className="w-full py-2">
      <div className="flex items-center justify-between relative max-w-4xl mx-auto px-4">
        {/* Connecting Line Background */}
        <div className="absolute left-10 right-10 top-6 h-0.5 bg-gray-200 -translate-y-1/2 z-0" />
        
        {/* Active/Completed Line Progress */}
        <div 
          className="absolute left-10 top-6 h-0.5 bg-[#4caf50] -translate-y-1/2 transition-all duration-300 z-0"
          style={{ 
            width: `${((currentStep - 1) / (steps.length - 1)) * 90}%` // Adjust slightly to not overshoot last circle
          }}
        />

        {steps.map((step) => {
          const isCompleted = currentStep > step.id;
          const isActive = currentStep === step.id;

          return (
            <div key={step.id} className="flex flex-col items-center relative z-10 flex-1">
              {/* Step Circle */}
              <div
                className={cn(
                  "w-12 h-12 rounded-full flex items-center justify-center text-base font-semibold border-2 transition-all duration-300",
                  isCompleted || isActive
                    ? "bg-[#4caf50] border-[#4caf50] text-white shadow-sm"
                    : "bg-white border-gray-300 text-gray-400"
                )}
              >
                {isCompleted ? (
                  <Check className="h-5 w-5 stroke-[3px]" />
                ) : (
                  <span>{step.id}</span>
                )}
              </div>

              {/* Step Label */}
              <span
                className={cn(
                  "mt-3 text-xs md:text-sm font-medium text-center transition-all duration-300 block",
                  isActive || isCompleted
                    ? "text-[#4caf50] font-semibold"
                    : "text-gray-500"
                )}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
