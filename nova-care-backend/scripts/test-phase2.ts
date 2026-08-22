import { PrismaClient, AppointmentStatus, EncounterStatus, ObservationCategory } from '@prisma/client';
import { AppointmentsService } from '../src/modules/appointments/appointments.service';
import { ClinicalService } from '../src/modules/clinical/clinical.service';

const prisma = new PrismaClient();
const appointmentsService = new AppointmentsService(prisma as any);
const clinicalService = new ClinicalService(prisma as any);

async function runPhase2Tests() {
  console.log('🧪 Starting PHASE 2 Automated Verification Suite...\n');
  let passedTests = 0;
  let totalTests = 12;

  // ----------------------------------------------------
  // TEST 1: GET encounter không tồn tại → 404 Exception
  // ----------------------------------------------------
  try {
    await clinicalService.getEncounter('00000000-0000-0000-0000-000000000000');
    console.error('❌ TEST 1 FAILED: Expected 404 exception for non-existent encounter');
  } catch (error: any) {
    if (error.status === 404 || error.response?.statusCode === 404 || error.message.includes('không tồn tại')) {
      console.log('✅ TEST 1 PASSED: GET non-existent encounter returns 404 Not Found');
      passedTests++;
    } else {
      console.error('❌ TEST 1 FAILED with unexpected error:', error.message);
    }
  }

  // Prepare dynamic test objects
  const user = await prisma.user.findFirst({ where: { role: 'PATIENT' } });
  const profile = await prisma.patientProfile.findFirst({ where: { userId: user?.id } });
  const slot = await prisma.appointmentSlot.findFirst({
    where: { isAvailable: true },
    include: { doctorWorkplace: { include: { doctor: true, hospital: true, specialty: true } } },
  });

  if (!user || !profile || !slot) {
    throw new Error('Test environment missing prerequisite user, profile, or slot');
  }

  // Create dynamic new Appointment
  const dynamicBookingCode = `NOVA-TEST-${Date.now()}`;
  const newAppointment = await prisma.appointment.create({
    data: {
      bookingCode: dynamicBookingCode,
      patientProfileId: profile.id,
      userId: user.id,
      slotId: slot.id,
      status: AppointmentStatus.CONFIRMED,
      reason: 'Khám kiểm tra hen phế quản định kỳ',
      symptoms: 'Thỉnh thoảng khó thở về đêm',
      totalPrice: 300000,
    },
  });

  console.log(`\n📌 Created Dynamic New Appointment: ${newAppointment.id} (BookingCode: ${newAppointment.bookingCode})`);

  // ----------------------------------------------------
  // TEST 2: Complete Appointment hợp lệ → tạo MedicalEncounter (IN_PROGRESS)
  // ----------------------------------------------------
  let createdEncounterId = '';
  try {
    const completedResult: any = await appointmentsService.complete(newAppointment.id);
    const encounter = completedResult.medicalEncounter || await prisma.medicalEncounter.findUnique({ where: { appointmentId: newAppointment.id } });

    if (encounter && encounter.status === EncounterStatus.IN_PROGRESS && encounter.encounterCode.startsWith('ENC-')) {
      createdEncounterId = encounter.id;
      console.log(`✅ TEST 2 PASSED: Appointment completed, created MedicalEncounter: ${encounter.encounterCode} (${encounter.status})`);
      passedTests++;
    } else {
      console.error('❌ TEST 2 FAILED: Encounter not created or status invalid', encounter);
    }
  } catch (error: any) {
    console.error('❌ TEST 2 FAILED:', error.message);
  }

  // ----------------------------------------------------
  // TEST 3: Complete cùng Appointment lần 2 → reject
  // ----------------------------------------------------
  try {
    await appointmentsService.complete(newAppointment.id);
    console.error('❌ TEST 3 FAILED: Expected complete 2nd time to throw error');
  } catch (error: any) {
    if (error.status === 400 || error.message.includes('hoàn thành')) {
      console.log('✅ TEST 3 PASSED: Completing completed appointment thrown BadRequestException');
      passedTests++;
    } else {
      console.error('❌ TEST 3 FAILED with unexpected error:', error.message);
    }
  }

  // ----------------------------------------------------
  // TEST 4: Thêm Diagnosis vào IN_PROGRESS → thành công
  // ----------------------------------------------------
  try {
    const diagnosis = await clinicalService.addDiagnosis(createdEncounterId, {
      icdCode: 'J45.0',
      diseaseName: 'Hen phế quản dị ứng',
      isPrimary: true,
      note: 'Khó thở nhẹ về đêm',
    });
    if (diagnosis && diagnosis.icdCode === 'J45.0') {
      console.log('✅ TEST 4 PASSED: Added Diagnosis to IN_PROGRESS encounter');
      passedTests++;
    } else {
      console.error('❌ TEST 4 FAILED');
    }
  } catch (error: any) {
    console.error('❌ TEST 4 FAILED:', error.message);
  }

  // ----------------------------------------------------
  // TEST 5: Thêm Observation vào IN_PROGRESS → thành công
  // ----------------------------------------------------
  try {
    const observation = await clinicalService.addObservation(createdEncounterId, {
      category: ObservationCategory.VITAL_SIGNS,
      code: 'RR',
      name: 'Nhịp thở',
      value: '19',
      unit: 'lần/phút',
      interpretation: 'Bình thường',
    });
    if (observation && observation.name === 'Nhịp thở') {
      console.log('✅ TEST 5 PASSED: Added Observation to IN_PROGRESS encounter');
      passedTests++;
    } else {
      console.error('❌ TEST 5 FAILED');
    }
  } catch (error: any) {
    console.error('❌ TEST 5 FAILED:', error.message);
  }

  // ----------------------------------------------------
  // TEST 6: Tạo Prescription cho IN_PROGRESS → thành công
  // ----------------------------------------------------
  let createdPrescriptionId = '';
  try {
    const prescription = await clinicalService.createPrescription(createdEncounterId, {
      note: 'Sử dụng xịt dự phòng hàng ngày',
    });
    if (prescription && prescription.prescriptionCode.startsWith('RX-')) {
      createdPrescriptionId = prescription.id;
      console.log(`✅ TEST 6 PASSED: Created Prescription: ${prescription.prescriptionCode}`);
      passedTests++;
    } else {
      console.error('❌ TEST 6 FAILED');
    }
  } catch (error: any) {
    console.error('❌ TEST 6 FAILED:', error.message);
  }

  // ----------------------------------------------------
  // TEST 7: Tạo PrescriptionItem vào IN_PROGRESS → thành công
  // ----------------------------------------------------
  try {
    const item = await clinicalService.addPrescriptionItem(createdPrescriptionId, {
      drugName: 'Salbutamol 100mcg',
      dosage: '100mcg',
      usageInstruction: 'Xịt 2 nhát khi khó thở',
      quantity: 1,
      unit: 'Lọ',
      duration: '30 ngày',
    });
    if (item && item.drugName === 'Salbutamol 100mcg') {
      console.log('✅ TEST 7 PASSED: Added PrescriptionItem');
      passedTests++;
    } else {
      console.error('❌ TEST 7 FAILED');
    }
  } catch (error: any) {
    console.error('❌ TEST 7 FAILED:', error.message);
  }

  // ----------------------------------------------------
  // TEST 8: Complete Encounter → IN_PROGRESS → COMPLETED
  // ----------------------------------------------------
  try {
    const completedEncounter = await clinicalService.completeEncounter(createdEncounterId);
    if (completedEncounter && completedEncounter.status === EncounterStatus.COMPLETED) {
      console.log('✅ TEST 8 PASSED: Encounter status changed from IN_PROGRESS to COMPLETED');
      passedTests++;
    } else {
      console.error('❌ TEST 8 FAILED');
    }
  } catch (error: any) {
    console.error('❌ TEST 8 FAILED:', error.message);
  }

  // ----------------------------------------------------
  // TEST 9: Publish Encounter → COMPLETED → PUBLISHED
  // ----------------------------------------------------
  try {
    const publishedEncounter = await clinicalService.publishEncounter(createdEncounterId);
    if (publishedEncounter && publishedEncounter.status === EncounterStatus.PUBLISHED) {
      console.log('✅ TEST 9 PASSED: Encounter status changed from COMPLETED to PUBLISHED');
      passedTests++;
    } else {
      console.error('❌ TEST 9 FAILED');
    }
  } catch (error: any) {
    console.error('❌ TEST 9 FAILED:', error.message);
  }

  // ----------------------------------------------------
  // TEST 10: Thử thêm Diagnosis vào PUBLISHED → reject
  // ----------------------------------------------------
  try {
    await clinicalService.addDiagnosis(createdEncounterId, {
      icdCode: 'J30',
      diseaseName: 'Viêm mũi dị ứng',
    });
    console.error('❌ TEST 10 FAILED: Added diagnosis to PUBLISHED encounter without error');
  } catch (error: any) {
    if (error.status === 400 || error.message.includes('trạng thái') || error.message.includes('PUBLISHED')) {
      console.log('✅ TEST 10 PASSED: Adding Diagnosis to PUBLISHED encounter was rejected');
      passedTests++;
    } else {
      console.error('❌ TEST 10 FAILED with unexpected error:', error.message);
    }
  }

  // ----------------------------------------------------
  // TEST 11: Thử thêm Observation vào PUBLISHED → reject
  // ----------------------------------------------------
  try {
    await clinicalService.addObservation(createdEncounterId, {
      category: ObservationCategory.VITAL_SIGNS,
      name: 'SpO2',
      value: '99',
    });
    console.error('❌ TEST 11 FAILED: Added observation to PUBLISHED encounter without error');
  } catch (error: any) {
    if (error.status === 400 || error.message.includes('trạng thái') || error.message.includes('PUBLISHED')) {
      console.log('✅ TEST 11 PASSED: Adding Observation to PUBLISHED encounter was rejected');
      passedTests++;
    } else {
      console.error('❌ TEST 11 FAILED with unexpected error:', error.message);
    }
  }

  // ----------------------------------------------------
  // TEST 12: Thử tạo Prescription thứ 2 → reject hoặc return existing
  // ----------------------------------------------------
  try {
    const rx2 = await clinicalService.createPrescription(createdEncounterId, { note: 'Duplicate Rx test' });
    if (rx2 && rx2.id === createdPrescriptionId) {
      console.log('✅ TEST 12 PASSED: 2nd prescription request returned existing prescription without creating duplicate');
      passedTests++;
    } else {
      console.error('❌ TEST 12 FAILED: Created duplicate prescription');
    }
  } catch (error: any) {
    if (error.status === 400 || error.message.includes('đơn thuốc') || error.message.includes('PUBLISHED')) {
      console.log('✅ TEST 12 PASSED: 2nd prescription request rejected with 400 Bad Request');
      passedTests++;
    } else {
      console.error('❌ TEST 12 FAILED with unexpected error:', error.message);
    }
  }

  console.log(`\n🎉 Verification Summary: ${passedTests}/${totalTests} TESTS PASSED!`);
}

runPhase2Tests()
  .catch((e) => {
    console.error('❌ Test suite failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
