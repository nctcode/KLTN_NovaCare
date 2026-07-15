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
    <div className="flex items-center justify-between w-full py-4 px-2">
      {steps.map((step, index) => {
        const isCompleted = currentStep > step.id;
        const isActive = currentStep === step.id;

        return (
          <div key={step.id} className="flex items-center flex-1 last:flex-initial">
            <div className="flex flex-col items-center relative">
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold border-2 transition",
                  isCompleted
                    ? "bg-primary border-primary text-secondary font-bold"
                    : isActive
                    ? "border-primary text-primary bg-white font-bold"
                    : "border-gray-300 text-gray-400 bg-white"
                )}
              >
                {isCompleted ? <Check className="h-4 w-4 stroke-[3px]" /> : step.id}
              </div>
              <span
                className={cn(
                  "absolute top-10 text-xs font-medium whitespace-nowrap text-center hidden md:block",
                  isActive ? "text-primary font-bold" : "text-gray-500"
                )}
              >
                {step.label}
              </span>
            </div>

            {index < steps.length - 1 && (
              <div
                className={cn(
                  "h-0.5 mx-2 flex-1 transition",
                  isCompleted ? "bg-primary" : "bg-gray-200"
                )}
              />
            )}
          </div>
        );
      })}
      <div className="h-4 md:h-6" /> {/* Spacer for labels */}
    </div>
  );
}
