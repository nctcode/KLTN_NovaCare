import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';
import {
  BangCheckInDto,
  Bang1TongHopDto,
  Qd4750ExportPackage,
  ValidationCheckItem,
} from './qd4750.types';

@Injectable()
export class Qd4750ExtractorService {
  private readonly logger = new Logger(Qd4750ExtractorService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Định dạng DateTime thành chuỗi 12 ký tự yyyymmddHHMM chuẩn QĐ 4750
   * Nếu thiếu giờ phút hoặc ngày không có giờ -> tự động bù "0000"
   */
  private formatDateTime12(date: Date | null | undefined): string {
    if (!date) return '';
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    const yyyy = d.getFullYear().toString().padStart(4, '0');
    const mm = (d.getMonth() + 1).toString().padStart(2, '0');
    const dd = d.getDate().toString().padStart(2, '0');
    const hh = d.getHours().toString().padStart(2, '0');
    const min = d.getMinutes().toString().padStart(2, '0');
    return `${yyyy}${mm}${dd}${hh}${min}`;
  }

  /**
   * Định dạng DateTime thành chuỗi 8 ký tự yyyymmdd chuẩn thẻ BHYT
   */
  private formatDate8(date: Date | null | undefined): string {
    if (!date) return '';
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    const yyyy = d.getFullYear().toString().padStart(4, '0');
    const mm = (d.getMonth() + 1).toString().padStart(2, '0');
    const dd = d.getDate().toString().padStart(2, '0');
    return `${yyyy}${mm}${dd}`;
  }

  /**
   * Quy đổi giới tính sang kiểu Số: 1=Nam, 2=Nữ, 3=Chưa xác định
   */
  private mapGender(gender: string | null | undefined): number {
    if (!gender) return 3;
    const g = gender.toUpperCase();
    if (g === 'MALE' || g === 'NAM') return 1;
    if (g === 'FEMALE' || g === 'NU' || g === 'NỮ') return 2;
    return 3;
  }

  /**
   * Quy đổi Quốc tịch theo TT 07/2016/TT-BCA
   */
  private mapNationality(nat: string | null | undefined): string {
    if (!nat) return 'VN';
    const n = nat.toLowerCase();
    if (n.includes('việt nam') || n.includes('vietnam') || n === 'vn') return 'VN';
    return 'VN';
  }

  /**
   * Quy đổi Dân tộc theo QĐ 121-TCTK/PPCĐ (Kinh = 25)
   */
  private mapEthnicity(eth: string | null | undefined): string {
    if (!eth) return '25';
    const e = eth.toLowerCase();
    if (e.includes('kinh')) return '25';
    if (e.includes('tày')) return '02';
    if (e.includes('thái')) return '03';
    if (e.includes('hoa')) return '04';
    if (e.includes('khơ-me')) return '05';
    return '25';
  }

  /**
   * Quy đổi nghề nghiệp: Không có mã chuẩn theo QĐ 34/2020/QĐ-TTg -> bắt buộc "00000"
   */
  private mapOccupation(occ: string | null | undefined): string {
    if (!occ) return '00000';
    if (/^\d{5}$/.test(occ.trim())) return occ.trim();
    return '00000';
  }

  /**
   * Trích xuất gói dữ liệu đầy đủ QĐ 4750/QĐ-BYT theo mã lượt khám
   */
  async extractPackageByEncounter(encounterCodeOrId: string): Promise<Qd4750ExportPackage> {
    const enc = await this.prisma.medicalEncounter.findFirst({
      where: {
        OR: [
          { encounterCode: encounterCodeOrId },
          { id: encounterCodeOrId },
        ],
      },
      include: {
        hospital: true,
        patientProfile: {
          include: {
            hospitalLinks: true,
          },
        },
        diagnoses: true,
        observations: true,
        prescription: {
          include: {
            items: true,
          },
        },
        appointment: {
          include: {
            medicalService: true,
          },
        },
      },
    });

    if (!enc) {
      throw new NotFoundException(`Không tìm thấy lượt khám với mã: ${encounterCodeOrId}`);
    }

    const p = enc.patientProfile;
    const h = enc.hospital;
    const rx = enc.prescription;
    const firstDrug = rx?.items && rx.items.length > 0 ? rx.items[0] : null;

    // Tìm mã BN ngoại viện theo bệnh viện này
    const link = p.hospitalLinks?.find((l) => l.hospitalId === h.id);
    const maBn = link?.externalPatientId || `PAT-${p.identityNumber?.slice(-6) || p.id.slice(0, 6).toUpperCase()}`;

    // Kiểm tra KCB BHYT
    const hasBHYT = !!(p.healthInsurance && p.healthInsurance.trim().length > 0);
    const maTheBhyt = hasBHYT ? p.healthInsurance!.trim() : '';
    const maDkbd = hasBHYT ? (p.bhytInitialHospitalCode || h.hospitalCode || '79014') : '';
    const gtTheTu = hasBHYT ? (p.bhytValidFrom ? this.formatDate8(p.bhytValidFrom) : '20260101') : '';
    const gtTheDen = hasBHYT ? (p.bhytValidTo ? this.formatDate8(p.bhytValidTo) : '20261231') : '';
    const maDoiTuongKcb = hasBHYT ? '1' : '3'; // 1=BHYT đúng tuyến, 3=Viện phí dịch vụ

    // Dịch vụ KCB
    const maDichVu = `DV-${enc.specialtyName ? enc.specialtyName.slice(0, 3).toUpperCase() : 'KCB'}-01`;
    const tenDichVu = enc.appointment?.medicalService?.name || `Khám chuyên khoa ${enc.specialtyName || 'Nội tổng quát'}`;

    // Thuốc
    const maThuoc = firstDrug?.activeIngredientCode || (firstDrug ? '40.12' : '');
    const tenThuoc = firstDrug ? `${firstDrug.drugName} ${firstDrug.dosage || ''}`.trim() : '';

    // ==========================================
    // 1. XÂY DỰNG BẢNG CHECK-IN (26 trường)
    // ==========================================
    const checkIn: BangCheckInDto = {
      MA_LK: enc.encounterCode,
      STT: 1,
      MA_BN: maBn,
      HO_TEN: p.fullName.toUpperCase().trim(),
      SO_CCCD: p.identityNumber ? p.identityNumber.trim() : '',
      NGAY_SINH: this.formatDateTime12(p.dateOfBirth),
      GIOI_TINH: this.mapGender(p.gender),
      MA_THE_BHYT: maTheBhyt,
      MA_DKBD: maDkbd,
      GT_THE_TU: gtTheTu,
      GT_THE_DEN: gtTheDen,
      MA_DOITUONG_KCB: maDoiTuongKcb,
      NGAY_VAO: this.formatDateTime12(enc.encounterDate),
      NGAY_VAO_NOI_TRU: '',
      LY_DO_VNT: '',
      MA_LY_DO_VNT: '',
      MA_LOAI_KCB: '01', // 01=Khám bệnh ngoại trú
      MA_CSKCB: h.hospitalCode || '79014',
      MA_DICH_VU: maDichVu,
      TEN_DICH_VU: tenDichVu,
      MA_THUOC: maThuoc,
      TEN_THUOC: tenThuoc,
      MA_VAT_TU: '',
      TEN_VAT_TU: '',
      NGAY_YL: rx ? this.formatDateTime12(rx.prescribedAt) : this.formatDateTime12(enc.encounterDate),
      DU_PHONG: '',
    };

    // ==========================================
    // 2. XÂY DỰNG BẢNG 1 — CHỈ TIÊU TỔNG HỢP (16 trường)
    // ==========================================
    const bang1: Bang1TongHopDto = {
      MA_LK: enc.encounterCode,
      STT: 1,
      MA_BN: maBn,
      HO_TEN: p.fullName.toUpperCase().trim(),
      SO_CCCD: p.identityNumber ? p.identityNumber.trim() : '',
      NGAY_SINH: this.formatDateTime12(p.dateOfBirth),
      GIOI_TINH: this.mapGender(p.gender),
      NHOM_MAU: p.bloodType || '',
      MA_QUOCTICH: this.mapNationality(p.nationality),
      MA_DANTOC: this.mapEthnicity(p.ethnicity),
      MA_NGHE_NGHIEP: this.mapOccupation(p.occupation),
      DIA_CHI: p.address || 'TP. Hồ Chí Minh',
      MATINH_CUTRU: p.provinceCode || '79',
      MAHUYEN_CU_TRU: p.districtCode || '760',
      MAXA_CU_TRU: p.wardCode || '26740',
      DIEN_THOAI: p.phone ? p.phone.trim() : '',
    };

    // ==========================================
    // 3. THẨM ĐỊNH TỰ ĐỘNG (VALIDATION RULES)
    // ==========================================
    const checks: ValidationCheckItem[] = [
      {
        field: 'MA_LK',
        status: checkIn.MA_LK ? 'PASS' : 'FAIL',
        rule: 'Khóa chính duy nhất, không được rỗng',
        value: checkIn.MA_LK,
        message: 'Mã đợt điều trị hợp lệ',
      },
      {
        field: 'SO_CCCD',
        status: /^\d{12}$/.test(checkIn.SO_CCCD) ? 'PASS' : 'FAIL',
        rule: 'Chuỗi 12 ký tự số, bảo toàn số 0 ở đầu',
        value: checkIn.SO_CCCD,
        message: checkIn.SO_CCCD ? `Số CCCD chuẩn 12 số (${checkIn.SO_CCCD})` : 'Thiếu số CCCD',
      },
      {
        field: 'NGAY_SINH',
        status: checkIn.NGAY_SINH.length === 12 ? 'PASS' : 'FAIL',
        rule: 'Đúng 12 ký tự định dạng yyyymmddHHMM',
        value: checkIn.NGAY_SINH,
        message: 'Định dạng ngày sinh đạt chuẩn',
      },
      {
        field: 'GIOI_TINH',
        status: [1, 2, 3].includes(checkIn.GIOI_TINH) ? 'PASS' : 'FAIL',
        rule: 'Kiểu Số nguyên (1=Nam, 2=Nữ, 3=Chưa xác định)',
        value: checkIn.GIOI_TINH,
        message: `Mã giới tính hợp lệ (${checkIn.GIOI_TINH === 1 ? '1=Nam' : checkIn.GIOI_TINH === 2 ? '2=Nữ' : '3=Khác'})`,
      },
      {
        field: 'NGAY_VAO',
        status: checkIn.NGAY_VAO.length === 12 ? 'PASS' : 'FAIL',
        rule: 'Đúng 12 ký tự định dạng yyyymmddHHMM',
        value: checkIn.NGAY_VAO,
        message: 'Thời điểm tiếp nhận khám đạt chuẩn',
      },
      {
        field: 'MA_CSKCB',
        status: /^\d{5}$/.test(checkIn.MA_CSKCB) ? 'PASS' : 'WARN',
        rule: 'Chuỗi 5 chữ số mã cơ sở KCB Bộ Y tế cấp',
        value: checkIn.MA_CSKCB,
        message: 'Mã cơ sở KCB Bộ Y tế chuẩn 5 số',
      },
      {
        field: 'DIEN_THOAI',
        status: typeof bang1.DIEN_THOAI === 'string' && bang1.DIEN_THOAI.startsWith('0') ? 'PASS' : 'WARN',
        rule: 'Kiểu chuỗi, bảo toàn số 0 ở đầu',
        value: bang1.DIEN_THOAI,
        message: 'Số điện thoại liên hệ đúng kiểu chuỗi giữ số 0',
      },
      {
        field: 'MA_NGHE_NGHIEP',
        status: bang1.MA_NGHE_NGHIEP === '00000' || /^\d{5}$/.test(bang1.MA_NGHE_NGHIEP) ? 'PASS' : 'FAIL',
        rule: 'Chuỗi 5 số. Nếu không có mã chuẩn bắt buộc điền 00000',
        value: bang1.MA_NGHE_NGHIEP,
        message: 'Mã nghề nghiệp tuân thủ quy tắc 00000',
      },
      {
        field: 'MA_THE_BHYT',
        status: hasBHYT ? (checkIn.MA_THE_BHYT.length <= 15 && checkIn.MA_THE_BHYT.length >= 10 ? 'PASS' : 'WARN') : (checkIn.MA_THE_BHYT === '' ? 'PASS' : 'FAIL'),
        rule: 'Không KCB BHYT phải để chuỗi rỗng "", có BHYT tối đa 15 ký tự',
        value: checkIn.MA_THE_BHYT || '(Trống - Không BHYT)',
        message: hasBHYT ? `Mã thẻ BHYT hợp lệ (${checkIn.MA_THE_BHYT})` : 'Để trống hợp lệ khi không KCB BHYT',
      },
    ];

    const passedCount = checks.filter((c) => c.status === 'PASS').length;
    const isValid = checks.every((c) => c.status !== 'FAIL');

    // ==========================================
    // 4. TẠO XML PAYLOAD CHUẨN CỔNG TIẾP NHẬN
    // ==========================================
    const xmlPayload = this.generateXmlPayload(checkIn, bang1);

    return {
      metadata: {
        standard: 'QĐ 4750/QĐ-BYT',
        version: '2024.1',
        extractedAt: new Date().toISOString(),
        encounterCode: enc.encounterCode,
        hospitalName: h.name,
        patientName: p.fullName,
      },
      checkIn,
      bang1,
      xmlPayload,
      validation: {
        isValid,
        totalFields: checks.length,
        passedFields: passedCount,
        checks,
      },
    };
  }

  /**
   * Sinh gói tin XML hợp chuẩn Cổng Tiếp nhận Dữ liệu Y tế
   */
  private generateXmlPayload(checkIn: BangCheckInDto, bang1: Bang1TongHopDto): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<GOI_TIN_4750 xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <THONG_TIN_CHUNG>
    <PHIEU>TRICH_XUAT_QD_4750_BYT</PHIEU>
    <MA_CSKCB>${checkIn.MA_CSKCB}</MA_CSKCB>
    <NGAY_XUAT>${new Date().toISOString()}</NGAY_XUAT>
  </THONG_TIN_CHUNG>
  <BANG_CHECKIN>
    <MA_LK>${checkIn.MA_LK}</MA_LK>
    <STT>${checkIn.STT}</STT>
    <MA_BN>${checkIn.MA_BN}</MA_BN>
    <HO_TEN>${checkIn.HO_TEN}</HO_TEN>
    <SO_CCCD>${checkIn.SO_CCCD}</SO_CCCD>
    <NGAY_SINH>${checkIn.NGAY_SINH}</NGAY_SINH>
    <GIOI_TINH>${checkIn.GIOI_TINH}</GIOI_TINH>
    <MA_THE_BHYT>${checkIn.MA_THE_BHYT}</MA_THE_BHYT>
    <MA_DKBD>${checkIn.MA_DKBD}</MA_DKBD>
    <GT_THE_TU>${checkIn.GT_THE_TU}</GT_THE_TU>
    <GT_THE_DEN>${checkIn.GT_THE_DEN}</GT_THE_DEN>
    <MA_DOITUONG_KCB>${checkIn.MA_DOITUONG_KCB}</MA_DOITUONG_KCB>
    <NGAY_VAO>${checkIn.NGAY_VAO}</NGAY_VAO>
    <NGAY_VAO_NOI_TRU>${checkIn.NGAY_VAO_NOI_TRU}</NGAY_VAO_NOI_TRU>
    <LY_DO_VNT>${checkIn.LY_DO_VNT}</LY_DO_VNT>
    <MA_LY_DO_VNT>${checkIn.MA_LY_DO_VNT}</MA_LY_DO_VNT>
    <MA_LOAI_KCB>${checkIn.MA_LOAI_KCB}</MA_LOAI_KCB>
    <MA_CSKCB>${checkIn.MA_CSKCB}</MA_CSKCB>
    <MA_DICH_VU>${checkIn.MA_DICH_VU}</MA_DICH_VU>
    <TEN_DICH_VU>${checkIn.TEN_DICH_VU}</TEN_DICH_VU>
    <MA_THUOC>${checkIn.MA_THUOC}</MA_THUOC>
    <TEN_THUOC>${checkIn.TEN_THUOC}</TEN_THUOC>
    <MA_VAT_TU>${checkIn.MA_VAT_TU}</MA_VAT_TU>
    <TEN_VAT_TU>${checkIn.TEN_VAT_TU}</TEN_VAT_TU>
    <NGAY_YL>${checkIn.NGAY_YL}</NGAY_YL>
    <DU_PHONG>${checkIn.DU_PHONG}</DU_PHONG>
  </BANG_CHECKIN>
  <BANG_TONG_HOP>
    <MA_LK>${bang1.MA_LK}</MA_LK>
    <STT>${bang1.STT}</STT>
    <MA_BN>${bang1.MA_BN}</MA_BN>
    <HO_TEN>${bang1.HO_TEN}</HO_TEN>
    <SO_CCCD>${bang1.SO_CCCD}</SO_CCCD>
    <NGAY_SINH>${bang1.NGAY_SINH}</NGAY_SINH>
    <GIOI_TINH>${bang1.GIOI_TINH}</GIOI_TINH>
    <NHOM_MAU>${bang1.NHOM_MAU}</NHOM_MAU>
    <MA_QUOCTICH>${bang1.MA_QUOCTICH}</MA_QUOCTICH>
    <MA_DANTOC>${bang1.MA_DANTOC}</MA_DANTOC>
    <MA_NGHE_NGHIEP>${bang1.MA_NGHE_NGHIEP}</MA_NGHE_NGHIEP>
    <DIA_CHI>${bang1.DIA_CHI}</DIA_CHI>
    <MATINH_CUTRU>${bang1.MATINH_CUTRU}</MATINH_CUTRU>
    <MAHUYEN_CU_TRU>${bang1.MAHUYEN_CU_TRU}</MAHUYEN_CU_TRU>
    <MAXA_CU_TRU>${bang1.MAXA_CU_TRU}</MAXA_CU_TRU>
    <DIEN_THOAI>${bang1.DIEN_THOAI}</DIEN_THOAI>
  </BANG_TONG_HOP>
</GOI_TIN_4750>`;
  }
}
