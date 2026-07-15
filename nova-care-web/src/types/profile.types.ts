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
}

export interface UpdatePatientProfileDto extends Partial<CreatePatientProfileDto> {}
