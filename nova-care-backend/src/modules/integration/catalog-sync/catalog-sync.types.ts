export interface RawHisDepartment {
  dept_code: string;
  dept_name: string;
}

export interface RawHisWeeklyShift {
  day_of_week: number;
  start_time: string;
  end_time: string;
}

export interface RawHisDoctor {
  staff_id: string;
  full_name: string;
  academic_degree: string;
  qualification_title: string;
  gender: 'MALE' | 'FEMALE';
  dept_code: string;
  consultation_fee: number;
  experience_years: number;
  avatar_url?: string;
  bio?: string;
  weekly_shifts?: RawHisWeeklyShift[];
}

export interface RawHisCatalog {
  hospital_code: string;
  hospital_name: string;
  hotline: string;
  address: string;
  city: string;
  hospital_type?: string;
  operating_hours?: string;
  current_state?: number;
  departments: RawHisDepartment[];
  doctors: RawHisDoctor[];
}

export interface NormalizedHospital {
  name: string;
  externalId: string;
  hotline: string;
  address: string;
  city: string;
  operatingHours: string;
}

export interface NormalizedDoctor {
  externalId: string;
  fullName: string;
  title: string;
  qualification: string;
  gender: 'MALE' | 'FEMALE';
  targetSpecialtyName: string;
  consultationFee: number;
  yearsOfExperience: number;
  avatarUrl?: string;
  weeklyShifts: RawHisWeeklyShift[];
}

export interface SyncItemDetail {
  staffId: string;
  doctorName: string;
  specialtyName: string;
  action: 'CREATED' | 'UPDATED' | 'UNCHANGED';
  changes?: string[];
}

export interface SyncResult {
  hospital: {
    id: string;
    name: string;
    externalId: string;
  };
  summary: {
    total: number;
    created: number;
    updated: number;
    unchanged: number;
  };
  details: SyncItemDetail[];
  syncedAt: string;
}
