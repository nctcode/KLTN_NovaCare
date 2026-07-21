export interface PatientProfile {
  id: string;
  userId: string;
  fullName: string;
  phone?: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  dateOfBirth?: string;
  identityNumber?: string;
  address?: string;
  relation?: string;
  healthInsurance?: string;
  medicalHistory?: string;
  allergies?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePatientProfileDto {
  fullName: string;
  phone?: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  dateOfBirth?: string;
  identityNumber?: string;
  address?: string;
  relation?: string;
  healthInsurance?: string;
  medicalHistory?: string;
  allergies?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  isDefault?: boolean;
}

export interface UpdatePatientProfileDto extends Partial<CreatePatientProfileDto> {}

