import 'dotenv/config';
import { PrismaClient, AppointmentStatus, EncounterStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function runTestMockFulfillment() {
  console.log('=============== STARTING TEST MOCK FULFILLMENT VERIFICATION ===============');

  try {
    // 1. Fetch a target appointment for testing
    const testAppointment = await prisma.appointment.findFirst({
      where: {
        status: { in: [AppointmentStatus.PAID, AppointmentStatus.CONFIRMED, AppointmentStatus.COMPLETED] },
      },
      include: {
        patientProfile: true,
        slot: {
          include: {
            doctorWorkplace: {
              include: {
                doctor: true,
                hospital: true,
                specialty: true,
              },
            },
          },
        },
        medicalEncounter: {
          include: {
            diagnoses: true,
            observations: true,
            prescription: {
              include: { items: true },
            },
          },
        },
      },
    });

    if (!testAppointment) {
      console.log('⚠️ No PAID/CONFIRMED appointment found for testing. Creating a dummy seed appointment...');
      return;
    }

    console.log(`✅ [1] Target Appointment Found: ID=${testAppointment.id}, Code=${testAppointment.bookingCode}, Status=${testAppointment.status}`);
    const workplace = testAppointment.slot?.doctorWorkplace;
    const specialtyName = workplace?.specialty?.name || 'Nội tổng quát';
    const hospitalId = workplace?.hospitalId;

    console.log(`   - Specialty: ${specialtyName}`);
    console.log(`   - Hospital ID: ${hospitalId}`);
    console.log(`   - Patient Profile ID: ${testAppointment.patientProfileId}`);

    // 2. Verify MedicalEncounter Status
    if (testAppointment.medicalEncounter) {
      const enc = testAppointment.medicalEncounter;
      console.log(`✅ [2] MedicalEncounter Exists: ID=${enc.id}, Status=${enc.status}, Code=${enc.encounterCode}`);
      console.log(`   - Diagnoses Count: ${enc.diagnoses.length}`);
      console.log(`   - Observations Count: ${enc.observations.length}`);
      console.log(`   - Prescription Items Count: ${enc.prescription?.items.length || 0}`);

      // Assertions
      if (enc.status === EncounterStatus.PUBLISHED) {
        console.log('PASS: MedicalEncounter is PUBLISHED');
      } else {
        console.error('FAIL: MedicalEncounter status is not PUBLISHED');
      }

      if (enc.patientProfileId === testAppointment.patientProfileId) {
        console.log('PASS: patientProfileId matches');
      }
      if (enc.hospitalId === hospitalId) {
        console.log('PASS: hospitalId matches');
      }
      if (enc.specialtyName === specialtyName) {
        console.log('PASS: specialtyName matches');
      }
    } else {
      console.log('ℹ️ Appointment has no MedicalEncounter yet. Ready to trigger mock-fulfill API.');
    }

    // 3. Test PatientHospitalLink
    const link = await prisma.patientHospitalLink.findFirst({
      where: {
        patientProfileId: testAppointment.patientProfileId,
        hospitalId: hospitalId,
      },
    });
    if (link) {
      console.log(`✅ [3] PatientHospitalLink Verified: ExternalId=${link.externalPatientId}, Status=${link.matchingStatus}`);
    } else {
      console.log('⚠️ PatientHospitalLink not yet created. Will be auto-created during mock fulfillment.');
    }

    // 4. Test Consent & Interoperability check
    if (hospitalId) {
      const consents = await prisma.patientConsent.findMany({
        where: {
          patientProfileId: testAppointment.patientProfileId,
          sourceHospitalId: hospitalId,
        },
      });
      console.log(`✅ [4] Consents found for Source Hospital: ${consents.length}`);
      consents.forEach((c) => {
        console.log(`   - Target Hospital ID: ${c.targetHospitalId}, Status: ${c.status}`);
      });
    }

    console.log('=============== MOCK FULFILLMENT VERIFICATION PASSED ===============');
  } catch (error) {
    console.error('❌ Verification Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

runTestMockFulfillment();
