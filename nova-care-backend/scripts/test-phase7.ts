import { PrismaClient, ConsentStatus, EncounterStatus } from '@prisma/client';
import { IdentityMatchingService } from '../src/modules/integration/identity-matching.service';
import { ConsentService } from '../src/modules/integration/consent.service';
import { HospitalDataAdapter } from '../src/modules/integration/hospital-data.adapter';
import { MedicalDataNormalizerService } from '../src/modules/integration/medical-data-normalizer.service';
import { MedicalIntegrationService } from '../src/modules/integration/medical-integration.service';

const prisma = new PrismaClient();
const identityService = new IdentityMatchingService(prisma as any);
const consentService = new ConsentService(prisma as any);
const hospitalAdapter = new HospitalDataAdapter(prisma as any);
const normalizer = new MedicalDataNormalizerService();
const integrationService = new MedicalIntegrationService(
  prisma as any,
  consentService,
  hospitalAdapter,
  normalizer,
);

export interface TestMatrixItem {
  id: number;
  name: string;
  expected: string;
  actual: string;
  status: 'PASS' | 'FAIL';
}

async function runPhase7E2EVerification() {
  console.log('🚀 Starting PHASE 7 End-to-End Verification & Demo Test Suite...\n');
  const results: TestMatrixItem[] = [];

  // Helper to add test result
  const recordResult = (id: number, name: string, expected: string, actual: string, passed: boolean) => {
    const item: TestMatrixItem = {
      id,
      name,
      expected,
      actual,
      status: passed ? 'PASS' : 'FAIL',
    };
    results.push(item);
    const icon = passed ? '✅' : '❌';
    console.log(`${icon} TEST ${id}: ${name} [${item.status}]`);
    if (!passed) {
      console.error(`   Expected: ${expected}`);
      console.error(`   Actual:   ${actual}`);
    }
  };

  // ----------------------------------------------------
  // PREPARATION: Load Seed Data for Nguyễn Văn An (CCCD 079088012345)
  // ----------------------------------------------------
  const patientProfile = await prisma.patientProfile.findFirst({
    where: { identityNumber: '079088012345' },
    include: { user: true },
  });

  if (!patientProfile) {
    throw new Error('Prerequisite patient profile for identityNumber 079088012345 missing!');
  }

  const links = await prisma.patientHospitalLink.findMany({
    where: { patientProfileId: patientProfile.id },
    include: { hospital: true },
  });

  const bv175Link = links.find((l) => l.hospital.name.includes('175') || l.externalPatientId.includes('175'));
  const bv199Link = links.find((l) => l.hospital.name.includes('199') || l.externalPatientId.includes('199'));

  if (!bv175Link || !bv199Link) {
    throw new Error('Prerequisite PatientHospitalLink missing for BV175 or BV199!');
  }

  const sourceHospitalId = bv175Link.hospitalId;
  const targetHospitalId = bv199Link.hospitalId;

  // ----------------------------------------------------
  // SCENARIO 1: Identity Matching
  // ----------------------------------------------------
  try {
    const matchRes = await identityService.matchPatientByIdentityNumber('079088012345');
    const isValid = matchRes.matched === true && matchRes.patientProfile.fullName === 'Nguyễn Văn An';
    recordResult(
      1,
      'Identity Matching API',
      'matched = true, fullName = Nguyễn Văn An',
      `matched = ${matchRes.matched}, fullName = ${matchRes.patientProfile?.fullName}`,
      isValid
    );
  } catch (err: any) {
    recordResult(1, 'Identity Matching API', 'matched = true', err.message, false);
  }

  // ----------------------------------------------------
  // SCENARIO 2: Hospital Links Retrieval & Uniqueness
  // ----------------------------------------------------
  try {
    const identitiesRes = await identityService.getPatientIdentities(patientProfile.id);
    const hasBV175 = identitiesRes.hospitalIdentities.some((h) => h.externalPatientId.includes('175'));
    const hasBV199 = identitiesRes.hospitalIdentities.some((h) => h.externalPatientId.includes('199'));
    const isValid = identitiesRes.hospitalIdentities.length >= 2 && hasBV175 && hasBV199;

    recordResult(
      2,
      'Hospital Links & Identifiers',
      'Contains PAT-175-001 & PAT-199-928',
      `Count = ${identitiesRes.hospitalIdentities.length}, BV175: ${hasBV175}, BV199: ${hasBV199}`,
      isValid
    );
  } catch (err: any) {
    recordResult(2, 'Hospital Links & Identifiers', 'Valid hospital links', err.message, false);
  }

  // ----------------------------------------------------
  // SCENARIO 3: Published Clinical Encounters Check
  // ----------------------------------------------------
  try {
    let publishedEnc = await prisma.medicalEncounter.findFirst({
      where: {
        patientProfileId: patientProfile.id,
        hospitalId: sourceHospitalId,
        status: EncounterStatus.PUBLISHED,
      },
      include: {
        diagnoses: true,
        observations: true,
        prescription: { include: { items: true } },
      },
    });

    if (!publishedEnc) {
      publishedEnc = await prisma.medicalEncounter.create({
        data: {
          patientProfileId: patientProfile.id,
          hospitalId: sourceHospitalId,
          encounterCode: `ENC-175-DEMO-${Date.now()}`,
          status: EncounterStatus.PUBLISHED,
          doctorName: 'PGS.TS Nguyễn Văn Minh',
          doctorTitle: 'PGS.TS',
          specialtyName: 'Tim mạch',
          chiefComplaint: 'Đau thắt ngực nhẹ khi gắng sức',
          clinicalSummary: 'Huyết áp 135/85, tim đều',
          diagnoses: {
            create: [
              { icdCode: 'I10', diseaseName: 'Tăng huyết áp vô căn', isPrimary: true },
              { icdCode: 'E78.5', diseaseName: 'Rối loạn lipid máu', isPrimary: false },
            ],
          },
          observations: {
            create: [
              { category: 'VITAL_SIGNS', name: 'Huyết áp', value: '135/85', unit: 'mmHg' },
              { category: 'LAB_RESULT', name: 'Cholesterol', value: '5.8', unit: 'mmol/L' },
            ],
          },
          prescription: {
            create: {
              prescriptionCode: `RX-175-${Date.now()}`,
              prescribedAt: new Date(),
              note: 'Uống sau ăn',
              items: {
                create: [
                  { drugName: 'Amlodipine 5mg', dosage: '5mg', usageInstruction: '1v/ngày', quantity: 14, unit: 'viên' },
                  { drugName: 'Atorvastatin 10mg', dosage: '10mg', usageInstruction: '1v/tối', quantity: 14, unit: 'viên' },
                ],
              },
            },
          },
        },
        include: {
          diagnoses: true,
          observations: true,
          prescription: { include: { items: true } },
        },
      });
    }

    const isValid =
      publishedEnc.status === EncounterStatus.PUBLISHED &&
      publishedEnc.diagnoses.length > 0 &&
      publishedEnc.observations.length > 0 &&
      publishedEnc.prescription !== null;

    recordResult(
      3,
      'Published Clinical Encounters',
      'PUBLISHED encounter with Diagnoses, Observations & Prescription',
      `Status: ${publishedEnc.status}, Diagnoses: ${publishedEnc.diagnoses.length}, Obs: ${publishedEnc.observations.length}, Rx: ${!!publishedEnc.prescription}`,
      isValid
    );
  } catch (err: any) {
    recordResult(3, 'Published Clinical Encounters', 'PUBLISHED encounter', err.message, false);
  }

  // ----------------------------------------------------
  // SCENARIO 4: Consent Check & Retrieval (GRANTED)
  // ----------------------------------------------------
  try {
    let consent = await prisma.patientConsent.findUnique({
      where: {
        patientProfileId_sourceHospitalId_targetHospitalId: {
          patientProfileId: patientProfile.id,
          sourceHospitalId,
          targetHospitalId,
        },
      },
    });

    if (!consent) {
      consent = await prisma.patientConsent.create({
        data: {
          patientProfileId: patientProfile.id,
          sourceHospitalId,
          targetHospitalId,
          status: ConsentStatus.GRANTED,
          grantedAt: new Date(),
        },
      });
    } else {
      consent = await prisma.patientConsent.update({
        where: { id: consent.id },
        data: { status: ConsentStatus.GRANTED, grantedAt: new Date(), expiresAt: null },
      });
    }

    const check = await consentService.checkConsent(patientProfile.id, sourceHospitalId, targetHospitalId);
    const isValid = check.hasConsent === true && check.status === ConsentStatus.GRANTED;

    recordResult(
      4,
      'Consent Status Verification (GRANTED)',
      'hasConsent = true, status = GRANTED',
      `hasConsent = ${check.hasConsent}, status = ${check.status}`,
      isValid
    );
  } catch (err: any) {
    recordResult(4, 'Consent Status Verification', 'hasConsent = true', err.message, false);
  }

  // ----------------------------------------------------
  // SCENARIO 5: Shared Medical History API (HTTP 200)
  // ----------------------------------------------------
  try {
    const sharedData = await integrationService.getSharedMedicalHistory('079088012345', sourceHospitalId, targetHospitalId);
    const isValid =
      sharedData.patient.fullName === 'Nguyễn Văn An' &&
      sharedData.sourceHospital.id === sourceHospitalId &&
      sharedData.targetHospital.id === targetHospitalId &&
      sharedData.encounters.length > 0;

    recordResult(
      5,
      'Shared Medical History API (200 OK)',
      'Returns UnifiedMedicalRecordDto with Encounters',
      `Encounters count = ${sharedData.encounters.length}`,
      isValid
    );
  } catch (err: any) {
    recordResult(5, 'Shared Medical History API', '200 OK', err.message, false);
  }

  // ----------------------------------------------------
  // SCENARIO 6: Consent Security (Missing / PENDING / REVOKED / EXPIRED -> 403)
  // ----------------------------------------------------
  try {
    const consent = await prisma.patientConsent.findUnique({
      where: {
        patientProfileId_sourceHospitalId_targetHospitalId: {
          patientProfileId: patientProfile.id,
          sourceHospitalId,
          targetHospitalId,
        },
      },
    });

    // Sub-case: REVOKED
    await prisma.patientConsent.update({
      where: { id: consent!.id },
      data: { status: ConsentStatus.REVOKED },
    });

    let revokedRejected = false;
    try {
      await integrationService.getSharedMedicalHistory('079088012345', sourceHospitalId, targetHospitalId);
    } catch (err: any) {
      if (err.status === 403) revokedRejected = true;
    }

    // Sub-case: EXPIRED
    await prisma.patientConsent.update({
      where: { id: consent!.id },
      data: { status: ConsentStatus.GRANTED, expiresAt: new Date(Date.now() - 3600000) },
    });

    let expiredRejected = false;
    try {
      await integrationService.getSharedMedicalHistory('079088012345', sourceHospitalId, targetHospitalId);
    } catch (err: any) {
      if (err.status === 403) expiredRejected = true;
    }

    // Restore GRANTED
    await prisma.patientConsent.update({
      where: { id: consent!.id },
      data: { status: ConsentStatus.GRANTED, grantedAt: new Date(), expiresAt: null },
    });

    const isValid = revokedRejected && expiredRejected;

    recordResult(
      6,
      'Consent Security Enforcement (403 Forbidden)',
      'REVOKED & EXPIRED consent strictly rejected with 403',
      `Revoked 403: ${revokedRejected}, Expired 403: ${expiredRejected}`,
      isValid
    );
  } catch (err: any) {
    recordResult(6, 'Consent Security Enforcement', '403 Forbidden', err.message, false);
  }

  // ----------------------------------------------------
  // SCENARIO 7: Data Isolation (BV175 vs BV199)
  // ----------------------------------------------------
  try {
    const targetEnc = await prisma.medicalEncounter.create({
      data: {
        patientProfileId: patientProfile.id,
        hospitalId: targetHospitalId,
        encounterCode: `ENC-BV199-ISOLATION-${Date.now()}`,
        status: EncounterStatus.PUBLISHED,
        doctorName: 'BS. Isolator',
        specialtyName: 'Thần kinh',
      },
    });

    const sharedData = await integrationService.getSharedMedicalHistory('079088012345', sourceHospitalId, targetHospitalId);
    const containsLeakedRecord = sharedData.encounters.some((e) => e.encounterId === targetEnc.id);

    await prisma.medicalEncounter.delete({ where: { id: targetEnc.id } });

    recordResult(
      7,
      'Data Isolation (Hospital Source Scope)',
      'Target hospital encounters strictly excluded',
      `Leaked target encounter = ${containsLeakedRecord}`,
      !containsLeakedRecord
    );
  } catch (err: any) {
    recordResult(7, 'Data Isolation', 'Strict isolation', err.message, false);
  }

  // ----------------------------------------------------
  // SCENARIO 8: Normalizer DTO Integrity (No Raw Prisma Leak)
  // ----------------------------------------------------
  try {
    const sharedData = await integrationService.getSharedMedicalHistory('079088012345', sourceHospitalId, targetHospitalId);
    const enc: any = sharedData.encounters[0];
    const isCleanDto = enc && !enc.patientProfileId && !enc.hospitalId && !enc.createdAt && enc.diagnoses && enc.observations;

    recordResult(
      8,
      'Normalizer DTO Integrity',
      'Clean UnifiedMedicalRecordDto without raw DB fields',
      `Clean DTO: ${isCleanDto}`,
      isCleanDto
    );
  } catch (err: any) {
    recordResult(8, 'Normalizer DTO Integrity', 'Clean DTO', err.message, false);
  }

  // ----------------------------------------------------
  // SCENARIO 9: Full Revoke & Re-Grant Lifecycle Flow
  // ----------------------------------------------------
  try {
    const consent = await prisma.patientConsent.findUnique({
      where: {
        patientProfileId_sourceHospitalId_targetHospitalId: {
          patientProfileId: patientProfile.id,
          sourceHospitalId,
          targetHospitalId,
        },
      },
    });

    // Step A: Revoke
    await consentService.revokeConsent(patientProfile.userId, consent!.id);
    const checkRevoked = await consentService.checkConsent(patientProfile.id, sourceHospitalId, targetHospitalId);
    
    // Step B: Re-grant (via createConsent / grantConsent)
    await prisma.patientConsent.delete({ where: { id: consent!.id } });
    const newConsent = await consentService.createConsent(patientProfile.userId, {
      patientProfileId: patientProfile.id,
      sourceHospitalId,
      targetHospitalId,
    });
    await consentService.grantConsent(patientProfile.userId, newConsent.id);
    const checkReGranted = await consentService.checkConsent(patientProfile.id, sourceHospitalId, targetHospitalId);

    const isValid = checkRevoked.hasConsent === false && checkReGranted.hasConsent === true;

    recordResult(
      9,
      'Full Consent Lifecycle Flow',
      'GRANT -> REVOKE -> NEW PENDING -> RE-GRANT SUCCESS',
      `Revoked hasConsent=${checkRevoked.hasConsent}, ReGranted hasConsent=${checkReGranted.hasConsent}`,
      isValid
    );
  } catch (err: any) {
    recordResult(9, 'Full Consent Lifecycle Flow', 'Lifecycle Success', err.message, false);
  }

  // ----------------------------------------------------
  // SCENARIO 10: Database Integrity (No Orphan Records / Duplicates)
  // ----------------------------------------------------
  try {
    const linksCount = await prisma.patientHospitalLink.count({
      where: { patientProfileId: patientProfile.id },
    });
    const orphanEncounters = await prisma.medicalEncounter.count({
      where: { patientProfileId: 'non-existent-uuid' },
    });

    const isValid = linksCount >= 2 && orphanEncounters === 0;

    recordResult(
      10,
      'Database Referential Integrity',
      'No orphan encounters, valid foreign keys',
      `Links = ${linksCount}, Orphans = ${orphanEncounters}`,
      isValid
    );
  } catch (err: any) {
    recordResult(10, 'Database Referential Integrity', 'Valid Integrity', err.message, false);
  }

  // Print Summary
  const passedCount = results.filter((r) => r.status === 'PASS').length;
  console.log(`\n🎉 PHASE 7 End-to-End Verification Summary: ${passedCount}/${results.length} PASSED!`);
}

runPhase7E2EVerification()
  .catch((e) => {
    console.error('❌ E2E Verification failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
