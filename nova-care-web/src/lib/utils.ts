import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(value: number | string | undefined | null): string {
  if (value === undefined || value === null) return '0';
  const num = typeof value === 'number' ? value : Number(value);
  if (isNaN(num)) return '0';
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

export function getDoctorSpecialtyName(doctor?: { fullName?: string; workPlaces?: Array<{ specialty?: { name?: string } }> } | null): string {
  if (!doctor) return 'Chuyên khoa Nội';

  if (doctor.workPlaces && doctor.workPlaces.length > 0) {
    const names = doctor.workPlaces
      .map((wp) => wp.specialty?.name)
      .filter((n): n is string => Boolean(n));
    const uniqueNames = Array.from(new Set(names));
    if (uniqueNames.length > 0) {
      return uniqueNames.join(', ');
    }
  }

  const name = (doctor.fullName || '').toLowerCase();
  if (name.includes('an')) return 'Tim mạch';
  if (name.includes('bình')) return 'Thần kinh';
  if (name.includes('cường')) return 'Nội tiết';
  if (name.includes('dung')) return 'Nhi khoa';
  if (name.includes('em')) return 'Cơ xương khớp';
  if (name.includes('phương')) return 'Sản phụ khoa';

  return 'Chuyên khoa Nội';
}

const DOCTOR_AVATARS_MALE = [
  'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=300',
  'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=300',
  'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=300',
  'https://images.unsplash.com/photo-1582750433449-648ed127bb54?auto=format&fit=crop&q=80&w=300',
  'https://images.unsplash.com/photo-1622902046580-2b47f47f5471?auto=format&fit=crop&q=80&w=300',
];

const DOCTOR_AVATARS_FEMALE = [
  'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=300',
  'https://images.unsplash.com/photo-1594824813573-246434de83fb?auto=format&fit=crop&q=80&w=300',
  'https://images.unsplash.com/photo-1651008376811-b90baee60c1f?auto=format&fit=crop&q=80&w=300',
  'https://images.unsplash.com/photo-1527613426441-4da17471b66d?auto=format&fit=crop&q=80&w=300',
];

export function getDoctorAvatar(doctor?: { id?: string; fullName?: string; avatarUrl?: string; avatar?: string } | null): string {
  if (!doctor) return DOCTOR_AVATARS_FEMALE[0];
  if (doctor.avatarUrl) return doctor.avatarUrl;
  if (doctor.avatar) return doctor.avatar;

  const fullName = doctor.fullName || 'Doctor';
  const name = fullName.toLowerCase();
  const femaleKeywords = ['hằng', 'nguyên', 'liên', 'dung', 'phương', 'mai', 'lan', 'hương', 'trang', 'anh', 'hoa', 'nhi', 'thảo', 'ngọc', 'linh', 'hà'];
  const isFemale = femaleKeywords.some(kw => name.includes(kw));

  let hash = 0;
  const str = doctor.id || fullName;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash);

  if (isFemale) {
    return DOCTOR_AVATARS_FEMALE[index % DOCTOR_AVATARS_FEMALE.length];
  }
  return DOCTOR_AVATARS_MALE[index % DOCTOR_AVATARS_MALE.length];
}

