'use client';

import { StepAdaptiveBooking } from './StepAdaptiveBooking';

interface StepSelectDoctorProps {
  onNext: () => void;
}

export function StepSelectDoctor({ onNext }: StepSelectDoctorProps) {
  return <StepAdaptiveBooking onNext={onNext} />;
}
