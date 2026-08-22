import { Injectable } from '@nestjs/common';
import {
  UnifiedMedicalRecordDto,
  UnifiedEncounterDto,
} from './dto/unified-medical-record.dto';

@Injectable()
export class MedicalDataNormalizerService {
  normalizeMedicalRecord(
    patientProfile: any,
    sourceHospital: any,
    targetHospital: any,
    rawEncounters: any[],
  ): UnifiedMedicalRecordDto {
    const encounters: UnifiedEncounterDto[] = rawEncounters.map((enc) => {
      const diagnoses = (enc.diagnoses || []).map((d: any) => ({
        icdCode: d.icdCode,
        diseaseName: d.diseaseName,
        isPrimary: d.isPrimary,
      }));

      const observations = (enc.observations || []).map((o: any) => ({
        category: o.category,
        code: o.code || undefined,
        name: o.name,
        value: o.value,
        unit: o.unit || undefined,
        referenceRange: o.referenceRange || undefined,
        interpretation: o.interpretation || undefined,
      }));

      let prescription: any = null;
      if (enc.prescription) {
        prescription = {
          prescriptionCode: enc.prescription.prescriptionCode,
          prescribedAt: enc.prescription.prescribedAt,
          note: enc.prescription.note || undefined,
          items: (enc.prescription.items || []).map((item: any) => ({
            drugName: item.drugName,
            dosage: item.dosage,
            usageInstruction: item.usageInstruction,
            quantity: item.quantity,
            unit: item.unit || undefined,
            duration: item.duration || undefined,
          })),
        };
      }

      return {
        encounterId: enc.id,
        encounterCode: enc.encounterCode,
        encounterDate: enc.encounterDate,
        doctor: {
          name: enc.doctorName,
          title: enc.doctorTitle || undefined,
        },
        specialty: enc.specialtyName,
        chiefComplaint: enc.chiefComplaint || undefined,
        clinicalSummary: enc.clinicalSummary || undefined,
        diagnoses,
        observations,
        prescription,
      };
    });

    return {
      patient: {
        id: patientProfile.id,
        fullName: patientProfile.fullName,
        gender: patientProfile.gender,
        dateOfBirth: patientProfile.dateOfBirth,
      },
      sourceHospital: {
        id: sourceHospital.id,
        name: sourceHospital.name,
      },
      targetHospital: {
        id: targetHospital.id,
        name: targetHospital.name,
      },
      encounters,
    };
  }
}
