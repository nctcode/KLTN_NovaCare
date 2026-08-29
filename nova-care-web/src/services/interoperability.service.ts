import { apiClient } from '@/lib/api-client';

export interface HospitalIdentity {
  hospitalId: string;
  hospitalName: string;
  externalPatientId: string;
  matchingStatus: string;
  encounterCount: number;
}

export interface PatientIdentityResponse {
  patientProfile: {
    id: string;
    fullName: string;
    identityNumber: string;
    gender: string;
    dateOfBirth: string;
    phone?: string;
  };
  hospitalIdentities: HospitalIdentity[];
}

export interface PatientConsentItem {
  id: string;
  patientProfileId: string;
  sourceHospitalId: string;
  targetHospitalId: string;
  status: 'PENDING' | 'GRANTED' | 'REVOKED' | 'EXPIRED';
  grantedAt?: string | null;
  expiresAt?: string | null;
  createdAt: string;
  sourceHospital: {
    id: string;
    name: string;
    city?: string;
  };
  targetHospital: {
    id: string;
    name: string;
    city?: string;
  };
}

export interface UnifiedDiagnosis {
  icdCode: string;
  diseaseName: string;
  isPrimary: boolean;
}

export interface UnifiedObservation {
  category: string;
  code?: string;
  name: string;
  value: string;
  unit?: string;
  referenceRange?: string;
  interpretation?: string;
}

export interface UnifiedPrescriptionItem {
  drugName: string;
  dosage: string;
  usageInstruction: string;
  quantity: number;
  unit?: string;
  duration?: string;
}

export interface UnifiedPrescription {
  prescriptionCode: string;
  prescribedAt: string;
  note?: string;
  items: UnifiedPrescriptionItem[];
}

export interface UnifiedEncounter {
  encounterId: string;
  encounterCode: string;
  encounterDate: string;
  doctor: {
    name: string;
    title?: string;
  };
  specialty: string;
  chiefComplaint?: string;
  clinicalSummary?: string;
  diagnoses: UnifiedDiagnosis[];
  observations: UnifiedObservation[];
  prescription?: UnifiedPrescription | null;
}

export interface UnifiedMedicalRecordResponse {
  patient: {
    id: string;
    fullName: string;
    gender: string;
    dateOfBirth: string;
  };
  sourceHospital: {
    id: string;
    name: string;
  };
  targetHospital: {
    id: string;
    name: string;
  };
  encounters: UnifiedEncounter[];
}

export const interoperabilityService = {
  async matchPatientByIdentity(identityNumber: string) {
    const res = await apiClient.get<any>(`/integration/patients/match?identityNumber=${encodeURIComponent(identityNumber)}`);
    return res.data;
  },

  async getPatientIdentities(patientProfileId: string): Promise<PatientIdentityResponse> {
    const res = await apiClient.get<any>(`/integration/patients/${patientProfileId}/identities`);
    return res.data;
  },

  async getPatientConsents(patientProfileId: string): Promise<PatientConsentItem[]> {
    const res = await apiClient.get<any>(`/integration/patients/${patientProfileId}/consents`);
    return res.data;
  },

  async checkConsent(patientProfileId: string, sourceHospitalId: string, targetHospitalId: string) {
    const res = await apiClient.get<any>(
      `/integration/consents/check?patientProfileId=${patientProfileId}&sourceHospitalId=${sourceHospitalId}&targetHospitalId=${targetHospitalId}`
    );
    return res.data;
  },

  async grantConsent(consentId: string): Promise<PatientConsentItem> {
    const res = await apiClient.patch<any>(`/integration/consents/${consentId}/grant`);
    return res.data;
  },

  async revokeConsent(consentId: string): Promise<PatientConsentItem> {
    const res = await apiClient.patch<any>(`/integration/consents/${consentId}/revoke`);
    return res.data;
  },

  async portalLookup(params: {
    query: string;
    doctorName?: string;
    hospitalName?: string;
    purpose?: string;
    pin?: string;
  }) {
    const res = await apiClient.post<any>('/interoperability/portal/lookup', params);
    return res.data;
  },

  async getPortalAuditLogs(userId?: string, patientProfileId?: string) {
    const query = new URLSearchParams();
    if (userId) query.append('userId', userId);
    if (patientProfileId) query.append('patientProfileId', patientProfileId);
    const res = await apiClient.get<any>(`/interoperability/portal/audit-logs?${query.toString()}`);
    return res.data;
  },

  async createShareCode(dto: {
    validDays?: number;
    allowedSections?: string[];
    sharedWith?: string;
    pinCode?: string;
  }) {
    const res = await apiClient.post<any>('/interoperability/portal/share-codes', dto);
    return res.data;
  },

  async getMyShareCodes() {
    const res = await apiClient.get<any>('/interoperability/portal/share-codes');
    return res.data;
  },

  async revokeShareCode(shareId: string) {
    const res = await apiClient.patch<any>(`/interoperability/portal/share-codes/${shareId}/revoke`);
    return res.data;
  },
};
