export interface Specialty {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  isActive: boolean;
}

export interface Hospital {
  id: string;
  name: string;
  address: string;
  description?: string;
  logoUrl?: string;
  website?: string;
  email?: string;
  rating?: number;
  reviewCount?: number;
  isActive: boolean;
  services?: any[];
}

export interface Doctor {
  id: string;
  fullName: string;
  title?: string;
  bio?: string;
  experience?: string;
  qualification?: string;
  avatarUrl?: string;
  rating?: number;
  reviewCount?: number;
  consultationCount?: number;
  isActive: boolean;
  workPlaces?: DoctorWorkplace[];
}

export interface DoctorWorkplace {
  id: string;
  doctorId: string;
  hospitalId: string;
  specialtyId: string;
  consultationFee: number;
  doctor: Doctor;
  hospital: Hospital;
  specialty: Specialty;
}

export interface DoctorSearchParams {
  q?: string;
  specialtyId?: string;
  hospitalId?: string;
  page?: number;
  limit?: number;
}
