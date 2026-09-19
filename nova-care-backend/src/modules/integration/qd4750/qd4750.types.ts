/**
 * BỘ CHUẨN TRÍCH XUẤT DỮ LIỆU ĐẦU RA — QUYẾT ĐỊNH SỐ 4750/QĐ-BYT
 * Tuân thủ chính xác 100% Tên trường, Kiểu dữ liệu và Quy tắc định dạng.
 */

export interface BangCheckInDto {
  /** 1. Mã đợt điều trị duy nhất (PRIMARY KEY) - Chuỗi max 100 */
  MA_LK: string;
  /** 2. Số thứ tự tăng từ 1 - Số max 10 */
  STT: number;
  /** 3. Mã người bệnh theo cơ sở KBCB - Chuỗi max 100 */
  MA_BN: string;
  /** 4. Họ tên người bệnh - Chuỗi max 255 */
  HO_TEN: string;
  /** 5. CCCD/CMND/Mã định danh (Bắt buộc kiểu chuỗi để giữ số 0 đầu) - Chuỗi max 15 */
  SO_CCCD: string;
  /** 6. Ngày sinh yyyymmddHHMM (thiếu giờ phút -> 0000) - Chuỗi max 12 */
  NGAY_SINH: string;
  /** 7. Giới tính: 1=Nam, 2=Nữ, 3=Chưa xác định - Số max 1 */
  GIOI_TINH: number;
  /** 8. Mã thẻ BHYT (Không KCB BHYT -> để trống "") - Chuỗi max 15 */
  MA_THE_BHYT: string;
  /** 9. Mã cơ sở đăng ký KCB ban đầu - Chuỗi max 5 */
  MA_DKBD: string;
  /** 10. Thẻ bắt đầu có giá trị yyyymmdd - Chuỗi max 8 */
  GT_THE_TU: string;
  /** 11. Thẻ hết giá trị yyyymmdd - Chuỗi max 8 */
  GT_THE_DEN: string;
  /** 12. Mã đối tượng đến KCB (theo DMDC) - Chuỗi max 4 */
  MA_DOITUONG_KCB: string;
  /** 13. Thời điểm đến KCB yyyymmddHHMM - Chuỗi max 12 */
  NGAY_VAO: string;
  /** 14. Thời điểm vào nội trú yyyymmddHHMM (Ngoại trú -> "") - Chuỗi max 12 */
  NGAY_VAO_NOI_TRU: string;
  /** 15. Lý do vào nội trú (Ngoại trú -> "") - Chuỗi n */
  LY_DO_VNT: string;
  /** 16. Mã lý do vào nội trú (Ngoại trú -> "") - Chuỗi max 5 */
  MA_LY_DO_VNT: string;
  /** 17. Mã hình thức KCB (01=Khám bệnh, 02=Điều trị ngoại trú) - Chuỗi max 2 */
  MA_LOAI_KCB: string;
  /** 18. Mã cơ sở KBCB (5 chữ số theo BYT) - Chuỗi max 5 */
  MA_CSKCB: string;
  /** 19. Mã dịch vụ kỹ thuật/khám bệnh theo DMDC - Chuỗi max 50 */
  MA_DICH_VU: string;
  /** 20. Tên dịch vụ kỹ thuật/khám bệnh - Chuỗi max 1024 */
  TEN_DICH_VU: string;
  /** 21. Mã hoạt chất thuốc theo DMDC - Chuỗi max 255 */
  MA_THUOC: string;
  /** 22. Tên thuốc - Chuỗi max 1024 */
  TEN_THUOC: string;
  /** 23. Mã vật tư y tế - Chuỗi max 255 */
  MA_VAT_TU: string;
  /** 24. Tên vật tư y tế - Chuỗi max 1024 */
  TEN_VAT_TU: string;
  /** 25. Thời điểm ra y lệnh yyyymmddHHMM - Chuỗi max 12 */
  NGAY_YL: string;
  /** 26. Trường dự phòng - Chuỗi n */
  DU_PHONG: string;
}

export interface Bang1TongHopDto {
  /** 1. Mã đợt điều trị duy nhất - Chuỗi max 100 */
  MA_LK: string;
  /** 2. Số thứ tự tăng từ 1 - Số max 10 */
  STT: number;
  /** 3. Mã người bệnh theo cơ sở KBCB - Chuỗi max 100 */
  MA_BN: string;
  /** 4. Họ tên người bệnh - Chuỗi max 255 */
  HO_TEN: string;
  /** 5. CCCD/CMND/Mã định danh - Chuỗi max 15 */
  SO_CCCD: string;
  /** 6. Ngày sinh yyyymmddHHMM - Chuỗi max 12 */
  NGAY_SINH: string;
  /** 7. Giới tính: 1=Nam, 2=Nữ, 3=Chưa xác định - Số max 1 */
  GIOI_TINH: number;
  /** 8. Nhóm máu (nếu có, không có -> "") - Chuỗi max 5 */
  NHOM_MAU: string;
  /** 9. Mã quốc tịch theo TT 07/2016/TT-BCA (VN) - Chuỗi max 3 */
  MA_QUOCTICH: string;
  /** 10. Mã dân tộc theo QĐ 121-TCTK/PPCĐ (Kinh=25) - Chuỗi max 2 */
  MA_DANTOC: string;
  /** 11. Mã nghề nghiệp theo QĐ 34/2020/QĐ-TTg (Không có -> "00000") - Chuỗi max 5 */
  MA_NGHE_NGHIEP: string;
  /** 12. Địa chỉ cư trú hiện tại - Chuỗi max 1024 */
  DIA_CHI: string;
  /** 13. Mã tỉnh cư trú - Chuỗi max 3 */
  MATINH_CUTRU: string;
  /** 14. Mã huyện cư trú - Chuỗi max 3 */
  MAHUYEN_CU_TRU: string;
  /** 15. Mã xã cư trú - Chuỗi max 5 */
  MAXA_CU_TRU: string;
  /** 16. SĐT liên lạc kiểu chuỗi (giữ số 0 đầu) - Chuỗi max 15 */
  DIEN_THOAI: string;
}

export interface ValidationCheckItem {
  field: string;
  status: 'PASS' | 'WARN' | 'FAIL';
  rule: string;
  value: any;
  message: string;
}

export interface Qd4750ExportPackage {
  metadata: {
    standard: 'QĐ 4750/QĐ-BYT';
    version: '2024.1';
    extractedAt: string;
    encounterCode: string;
    hospitalName: string;
    patientName: string;
  };
  checkIn: BangCheckInDto;
  bang1: Bang1TongHopDto;
  xmlPayload: string;
  validation: {
    isValid: boolean;
    totalFields: number;
    passedFields: number;
    checks: ValidationCheckItem[];
  };
}
