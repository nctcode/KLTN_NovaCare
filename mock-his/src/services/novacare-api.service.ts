export interface InteroperabilityLookupPayload {
  query: string;
  pin?: string;
  doctorName?: string;
  hospitalName?: string;
  purpose?: string;
}

export interface PatientInfo {
  id: string;
  fullName: string;
  dateOfBirth?: string;
  gender?: string;
  identityNumber?: string;
  healthInsurance?: string;
  phone?: string;
  address?: string;
  medicalHistory?: string;
  allergies?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  masterPatientId?: string;
}

export interface DiagnosisItem {
  icdCode: string;
  diseaseName: string;
  isPrimary: boolean;
}

export interface ObservationItem {
  category: string;
  name: string;
  value: string;
  unit?: string;
}

export interface PrescriptionItem {
  drugName: string;
  dosage?: string;
  quantity: number;
  unit?: string;
  duration?: string;
  usageInstruction?: string;
}

export interface EncounterItem {
  id: string;
  encounterCode?: string;
  encounterDate: string;
  doctorName?: string;
  doctorTitle?: string;
  specialtyName?: string;
  chiefComplaint?: string;
  clinicalSummary?: string;
  physicalExamination?: string;
  initialDiagnosis?: string;
  differentialDiagnosis?: string;
  treatmentPlan?: string;
  doctorNotes?: string;
  conclusion?: string;
  treatmentResult?: string;
  revisitDate?: string;
  diagnoses?: DiagnosisItem[];
  observations?: ObservationItem[];
  prescription?: {
    prescriptionCode?: string;
    note?: string;
    items?: PrescriptionItem[];
  };
}

export interface HospitalGroup {
  hospitalId: string;
  hospitalName: string;
  hospitalAddress?: string;
  totalVisits: number;
  encounters: EncounterItem[];
}

export interface LookupResponseData {
  success: boolean;
  lookupType: string;
  searchedQuery: string;
  queriedAt: string;
  queriedBy: {
    doctorName: string;
    hospitalName: string;
    purpose: string;
    ipAddress: string;
  };
  patient: PatientInfo;
  summary: {
    totalHospitals: number;
    totalEncounters: number;
    lastEncounterDate: string | null;
  };
  hospitalGroups: HospitalGroup[];
  latestAuditLog?: {
    id: string;
    accessedAt: string;
    queriedBy: string;
    ipAddress: string;
  };
}

const CANDIDATE_URLS = [
  process.env.NEXT_PUBLIC_NOVACARE_API_URL,
  'http://localhost:5000',
  'http://localhost:3000',
].filter(Boolean) as string[];

export async function lookupPatientRecord(payload: InteroperabilityLookupPayload): Promise<LookupResponseData> {
  let response: Response | null = null;
  let lastError: any = null;

  for (const baseUrl of CANDIDATE_URLS) {
    const url = `${baseUrl}/api/v1/interoperability/portal/lookup`;
    try {
      response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      // If we got a network response (even if 4xx/5xx), we successfully reached the backend
      break;
    } catch (netErr: any) {
      lastError = netErr;
      // Try next candidate URL
      continue;
    }
  }

  if (!response) {
    throw new Error('Không thể kết nối đến hệ thống NovaCare. Vui lòng kiểm tra NovaCare Backend đang chạy (cổng 5000 hoặc 3000).');
  }

  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    const status = response.status;
    const backendMessage = (result.message || '').toString().toLowerCase();

    if (status === 400) {
      throw new Error(result.message || 'Vui lòng nhập đầy đủ mã định danh và mã PIN bảo mật.');
    }

    if (status === 403) {
      if (backendMessage.includes('pin')) {
        throw new Error(result.message || 'Mã PIN bảo mật không chính xác. Vui lòng xác nhận lại với người bệnh.');
      }
      throw new Error(result.message || 'Mã định danh hoặc mã PIN bảo mật không hợp lệ.');
    }

    if (status === 404) {
      throw new Error(result.message || 'Không tìm thấy hồ sơ bệnh nhân tương ứng với mã định danh này.');
    }

    throw new Error(result.message || `Lỗi khi tra cứu hồ sơ (Mã HTTP: ${status}).`);
  }

  // Support both standard { statusCode: 200, data: { ... } } and direct payload
  return (result.data || result) as LookupResponseData;
}

export interface BangCheckInDto {
  MA_LK: string;
  STT: number;
  MA_BN: string;
  HO_TEN: string;
  SO_CCCD: string;
  NGAY_SINH: string;
  GIOI_TINH: number;
  MA_THE_BHYT: string;
  MA_DKBD: string;
  GT_THE_TU: string;
  GT_THE_DEN: string;
  MA_DOITUONG_KCB: string;
  NGAY_VAO: string;
  NGAY_VAO_NOI_TRU: string;
  LY_DO_VNT: string;
  MA_LY_DO_VNT: string;
  MA_LOAI_KCB: string;
  MA_CSKCB: string;
  MA_DICH_VU: string;
  TEN_DICH_VU: string;
  MA_THUOC: string;
  TEN_THUOC: string;
  MA_VAT_TU: string;
  TEN_VAT_TU: string;
  NGAY_YL: string;
  DU_PHONG: string;
}

export interface Bang1TongHopDto {
  MA_LK: string;
  STT: number;
  MA_BN: string;
  HO_TEN: string;
  SO_CCCD: string;
  NGAY_SINH: string;
  GIOI_TINH: number;
  NHOM_MAU: string;
  MA_QUOCTICH: string;
  MA_DANTOC: string;
  MA_NGHE_NGHIEP: string;
  DIA_CHI: string;
  MATINH_CUTRU: string;
  MAHUYEN_CU_TRU: string;
  MAXA_CU_TRU: string;
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
    standard: string;
    version: string;
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

export async function getQd4750Extraction(encounterCodeOrId: string): Promise<Qd4750ExportPackage> {
  let response: Response | null = null;
  let lastError: any = null;

  for (const baseUrl of CANDIDATE_URLS) {
    const url = `${baseUrl}/api/v1/integration/byt-4750/extract/${encodeURIComponent(encounterCodeOrId)}`;
    try {
      response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      break;
    } catch (netErr: any) {
      lastError = netErr;
      continue;
    }
  }

  if (!response) {
    throw new Error('Không thể kết nối đến hệ thống NovaCare Backend để trích xuất chuẩn QĐ 4750.');
  }

  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(result.message || `Lỗi khi trích xuất hồ sơ QĐ 4750 (Mã HTTP: ${response.status}).`);
  }

  return (result.data || result) as Qd4750ExportPackage;
}

