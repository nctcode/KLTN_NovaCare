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
    K_NOI_TIM_MACH: 'Tim mạch',
    K_NHI_SO_SINH: 'Nhi khoa',
    K_NHI_KHOA: 'Nhi khoa',
    K_DA_LIEU_THAM_MY: 'Da liễu',
    K_DA_LIEU: 'Da liễu',
    K_CO_XUONG_KHOP: 'Cơ xương khớp',
    K_SAN_PHU_KHOA: 'Sản phụ khoa',
    K_THAN_KINH: 'Thần kinh',
    K_TIEU_HOA: 'Tiêu hóa',
    K_HO_HAP: 'Hô hấp',
    K_TAI_MUI_HONG: 'Tai Mũi Họng',
    K_MAT: 'Mắt',
    K_RANG_HAM_MAT: 'Răng Hàm Mặt',
    K_NOI_TIET: 'Nội tiết',
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
  /**
   * Làm sạch tên khoa phòng để làm tên Chuyên khoa chuẩn (bỏ tiền tố Khoa, Trung tâm...)
   */
  cleanDepartmentName(rawName?: string): string {
    if (!rawName) return 'Đa khoa';
    let name = rawName.trim();
    // Bỏ tiền tố hành chính phổ biến trong bệnh viện
    name = name.replace(/^(Khoa|Phòng|Trung tâm|Đơn vị|Đơn nguyên|Ban|Viện)\s+/i, '').trim();
    if (name.length > 0) {
      name = name.charAt(0).toUpperCase() + name.slice(1);
    }
    return name || 'Đa khoa';
  }

  /**
   * Ánh xạ mã khoa HIS sang tên chuyên khoa chuẩn của NovaCare
   */
  resolveSpecialtyName(deptCode: string, deptName?: string): string | null {
    const code = deptCode?.trim();
    if (code && this.specialtyMapping[code]) {
      return this.specialtyMapping[code];
    }

    // Keyword heuristics if deptName or deptCode contains key phrases
    const target = `${code || ''} ${deptName || ''}`.toLowerCase();
    if (target.includes('tim') || target.includes('mach')) return 'Tim mạch';
    if (target.includes('xương') || target.includes('khớp') || target.includes('xuong')) return 'Cơ xương khớp';
    if (target.includes('sản') || target.includes('phụ') || target.includes('san')) return 'Sản phụ khoa';
    if (target.includes('nhi')) return 'Nhi khoa';
    if (target.includes('da') || target.includes('liễu') || target.includes('lieu')) return 'Da liễu';
    if (target.includes('mắt') || target.includes('mat')) return 'Mắt';
    if (target.includes('tai') || target.includes('mũi') || target.includes('họng')) return 'Tai Mũi Họng';
    if (target.includes('răng') || target.includes('hàm')) return 'Răng Hàm Mặt';
    if (target.includes('tiêu') || target.includes('hóa') || target.includes('tieu')) return 'Tiêu hóa';
    if (target.includes('hô') || target.includes('hấp') || target.includes('ho_hap')) return 'Hô hấp';
    if (target.includes('thần') || target.includes('kinh')) return 'Thần kinh';
    if (target.includes('tiết') || target.includes('tiet')) return 'Nội tiết';

    // Mở rộng các chuyên khoa phổ biến khác theo chuẩn Bộ Y Tế
    if (target.includes('ung bướu') || target.includes('ung buou') || target.includes('xạ trị') || target.includes('ung_buou')) return 'Ung bướu';
    if (target.includes('cổ truyền') || target.includes('co_truyen') || target.includes('đông y')) return 'Y học cổ truyền';
    if (target.includes('phục hồi') || target.includes('vật lý trị liệu') || target.includes('phuc_hoi')) return 'Phục hồi chức năng';
    if (target.includes('nam học') || target.includes('nam_hoc')) return 'Nam học';
    if (target.includes('tiết niệu') || target.includes('tiet_nieu') || target.includes('thận')) return 'Thận - Tiết niệu';
    if (target.includes('tâm thần') || target.includes('tam_than') || target.includes('tâm lý')) return 'Tâm thần';
    if (target.includes('lão') || target.includes('lao_khoa')) return 'Lão khoa';
    if (target.includes('truyền nhiễm') || target.includes('nhiễm') || target.includes('nhiem')) return 'Truyền nhiễm';
    if (target.includes('huyết học') || target.includes('truyền máu')) return 'Huyết học';

    // Trả về null để phía Service tự động kích hoạt Auto-Provisioning tạo Chuyên khoa mới
    return null;
  }

  /**
   * Chuẩn hóa danh sách Bác sĩ
   */
  normalizeDoctors(rawDoctors: RawHisDoctor[]): NormalizedDoctor[] {
    return (rawDoctors || []).map((raw) => {
      const resolved = this.resolveSpecialtyName(raw.dept_code);
      const targetSpecialty = resolved || this.cleanDepartmentName(raw.dept_code);

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
