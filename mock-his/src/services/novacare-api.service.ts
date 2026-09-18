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
