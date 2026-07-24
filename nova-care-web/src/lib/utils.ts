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
