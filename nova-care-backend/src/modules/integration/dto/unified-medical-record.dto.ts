export class UnifiedPatientDto {
  id: string;
  fullName: string;
  gender: string;
  dateOfBirth: Date | string;
}

export class UnifiedHospitalDto {
  id: string;
  name: string;
}

export class UnifiedDiagnosisDto {
  icdCode: string;
  diseaseName: string;
  isPrimary: boolean;
}

export class UnifiedObservationDto {
  category: string;
  code?: string;
  name: string;
  value: string;
  unit?: string;
  referenceRange?: string;
  interpretation?: string;
}

export class UnifiedPrescriptionItemDto {
  drugName: string;
  dosage: string;
  usageInstruction: string;
  quantity: number;
  unit?: string;
  duration?: string;
}

export class UnifiedPrescriptionDto {
  prescriptionCode: string;
  prescribedAt: Date | string;
  note?: string;
  items: UnifiedPrescriptionItemDto[];
}

export class UnifiedEncounterDto {
  encounterId: string;
  encounterCode: string;
  encounterDate: Date | string;
  doctor: {
    name: string;
    title?: string;
  };
  specialty: string;
  chiefComplaint?: string;
  clinicalSummary?: string;
  diagnoses: UnifiedDiagnosisDto[];
  observations: UnifiedObservationDto[];
  prescription?: UnifiedPrescriptionDto | null;
}

export class UnifiedMedicalRecordDto {
  patient: UnifiedPatientDto;
  sourceHospital: UnifiedHospitalDto;
  targetHospital: UnifiedHospitalDto;
  encounters: UnifiedEncounterDto[];
}
