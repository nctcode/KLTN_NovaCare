export interface Specialty {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  isActive: boolean;
}

export interface HospitalSpecialty {
  id: string;
  hospitalId: string;
  specialtyId: string;
  isActive: boolean;
  specialty?: Specialty;
  createdAt?: string;
  updatedAt?: string;
}

export interface Hospital {
  id: string;
  name: string;
  address: string;
  description?: string;
  logoUrl?: string;
  coverImageUrl?: string;
  coverImage?: string;
  images?: string[];
  website?: string;
  email?: string;
  phone?: string;
  hotline?: string;
  rating?: number;
  reviewCount?: number;
  type?: 'Công' | 'Tư nhân' | 'Quốc tế' | string;
  status?: 'Hoạt động' | 'Tạm ngưng' | 'Ngừng hợp tác' | string;
  isActive: boolean;
  city?: string;
  operatingHours?: string;
  emergencyHotline?: string;
  establishedYear?: number;
  bedCount?: number;
  doctorCount?: number;
  specialtyCount?: number;
  googleMapUrl?: string;
  latitude?: number;
  longitude?: number;
  createdAt?: string;
  updatedAt?: string;
  branches?: HospitalBranch[];
  services?: any[];
  hospitalSpecialties?: HospitalSpecialty[];
  specialties?: Specialty[];
}

export type DoctorGender = 'MALE' | 'FEMALE' | 'OTHER';
export type DataSourceType = 'MANUAL' | 'EXCEL' | 'API';

export interface Doctor {
  id: string;
  fullName: string;
  title?: string;
  bio?: string;
  experience?: string; // Forward/backward compatibility for display strings
  yearsOfExperience?: number;
  gender?: DoctorGender;
  externalId?: string | null;
  source?: DataSourceType;
  qualification?: string;
  avatarUrl?: string;
  rating?: number;
  reviewCount?: number;
  consultationCount?: number;
  isActive: boolean;
  workPlaces?: DoctorWorkplace[];
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
}

export interface DoctorWorkplace {
  id: string;
  doctorId: string;
  hospitalId: string;
  branchId?: string | null;
  specialtyId: string;
  consultationFee: number;
  isPrimary?: boolean;
  isActive: boolean;
  doctor?: Doctor;
  hospital?: Hospital;
  branch?: HospitalBranch | null;
  specialty?: Specialty;
  createdAt?: string;
  updatedAt?: string;
}

export interface DoctorSearchParams {
  q?: string;
  specialtyId?: string;
  hospitalId?: string;
  page?: number;
  limit?: number;
}

export interface MedicalService {
  id: string;
  hospitalId: string;
  specialtyId?: string;
  name: string;
  description?: string;
  price: number;
  duration: number;
  isActive: boolean;
  hospital?: Hospital;
}

export interface HealthPackage {
  id: string;
  hospitalId?: string;
  name: string;
  description?: string;
  price: number;
  duration: number;
  services?: string[];
  isActive: boolean;
  hospital?: Hospital;
}

export interface HospitalBranch {
  id: string;
  hospitalId: string;
  name?: string;
  address: string;
  phone?: string;
  email?: string;
  workingHours?: string;
  latitude?: number;
  longitude?: number;
  mapEmbedUrl?: string;
  image?: string;
  isActive: boolean;
  hospital?: Hospital;
}
