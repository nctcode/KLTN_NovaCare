import { Injectable, Logger } from '@nestjs/common';
import {
  RawHisCatalog,
  RawHisDoctor,
  NormalizedHospital,
  NormalizedDoctor,
} from './catalog-sync.types';

@Injectable()
export class CatalogNormalizerService {
  private readonly logger = new Logger(CatalogNormalizerService.name);

  // Bảng ánh xạ chuyên khoa định sẵn (Hard/Explicit Mapping theo thiết kế KLTN)
  private readonly specialtyMapping: Record<string, string> = {
    K_TIM_CAN_THIEP: 'Tim mạch',
    K_NHI_SO_SINH: 'Nhi khoa',
    K_DA_LIEU_THAM_MY: 'Da liễu',
  };

  /**
   * Chuẩn hóa thông tin Bệnh viện
   */
  normalizeHospital(raw: RawHisCatalog): NormalizedHospital {
    return {
      name: raw.hospital_name?.trim() || 'Bệnh Viện Chưa Đặt Tên',
      externalId: raw.hospital_code?.trim(),
      hotline: raw.hotline?.trim() || '1900 6868',
      address: raw.address?.trim() || '',
      city: raw.city?.trim() || 'TP. Hồ Chí Minh',
      operatingHours: raw.operating_hours?.trim() || '08:00 - 17:00',
    };
  }

  /**
   * Ánh xạ mã khoa HIS sang tên chuyên khoa chuẩn của NovaCare
   */
  resolveSpecialtyName(deptCode: string): string {
    const mapped = this.specialtyMapping[deptCode];
    if (mapped) return mapped;

    this.logger.warn(
      `Chưa có ánh xạ định sẵn cho mã khoa "${deptCode}". Mặc định dùng "Nội tiết".`
    );
    return 'Nội tiết';
  }

  /**
   * Chuẩn hóa danh sách Bác sĩ
   */
  normalizeDoctors(rawDoctors: RawHisDoctor[]): NormalizedDoctor[] {
    return (rawDoctors || []).map((raw) => {
      const targetSpecialty = this.resolveSpecialtyName(raw.dept_code);

      return {
        externalId: raw.staff_id?.trim(),
        fullName: raw.full_name?.trim(),
        title: raw.academic_degree?.trim() || 'BS',
        qualification:
          raw.qualification_title?.trim() || 'Bác sĩ Đa khoa',
        gender: raw.gender === 'FEMALE' ? 'FEMALE' : 'MALE',
        targetSpecialtyName: targetSpecialty,
        consultationFee: Number(raw.consultation_fee) || 200000,
        yearsOfExperience: Number(raw.experience_years) || 5,
        avatarUrl:
          raw.avatar_url ||
          'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400&auto=format&fit=crop&q=80',
        weeklyShifts: raw.weekly_shifts || [
          { day_of_week: 1, start_time: '08:00', end_time: '12:00' },
        ],
      };
    });
  }
}
