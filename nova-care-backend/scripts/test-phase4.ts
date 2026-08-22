import { PrismaClient, ConsentStatus } from '@prisma/client';
import { ConsentService } from '../src/modules/integration/consent.service';

const prisma = new PrismaClient();
const consentService = new ConsentService(prisma as any);

async function runPhase4Tests() {
  console.log('🧪 Starting PHASE 4 Automated Verification Suite...\n');
  let passedTests = 0;
  const totalTests = 15;

  // 1. Fetch test patient (Nguyễn Văn An: CCCD 079088012345) & hospitals
  const patientProfile = await prisma.patientProfile.findFirst({
    where: { identityNumber: '079088012345' },
    include: { user: true },
  });

  const hospitals = await prisma.hospital.findMany({ take: 3 });

  if (!patientProfile || hospitals.length < 2) {
    throw new Error('Test environment missing prerequisite patientProfile or hospitals');
  }

  const userId = patientProfile.userId;
  const sourceHospitalId = hospitals[0].id; // e.g. BV175
  const targetHospitalId = hospitals[1].id; // e.g. BV199

  // Ensure clean test state by removing existing consent for this pair if needed
  await prisma.patientConsent.deleteMany({
    where: {
      patientProfileId: patientProfile.id,
      sourceHospitalId,
      targetHospitalId,
    },
  });

  let createdConsentId = '';

  // ----------------------------------------------------
  // TEST 1: Tạo Consent PENDING → PASS
  // ----------------------------------------------------
  try {
    const consent = await consentService.createConsent(userId, {
      patientProfileId: patientProfile.id,
      sourceHospitalId,
      targetHospitalId,
    });
    if (consent && consent.status === ConsentStatus.PENDING) {
      createdConsentId = consent.id;
      console.log('✅ TEST 1 PASSED: Created Consent PENDING');
      passedTests++;
    } else {
      console.error('❌ TEST 1 FAILED:', consent);
    }
  } catch (error: any) {
    console.error('❌ TEST 1 FAILED:', error.message);
  }

  // ----------------------------------------------------
  // TEST 2: Check Consent trước khi grant → hasConsent = false
  // ----------------------------------------------------
  try {
    const check = await consentService.checkConsent(patientProfile.id, sourceHospitalId, targetHospitalId);
    if (check.hasConsent === false && check.status === ConsentStatus.PENDING) {
      console.log('✅ TEST 2 PASSED: Check consent before grant returns hasConsent = false');
      passedTests++;
    } else {
      console.error('❌ TEST 2 FAILED:', check);
    }
  } catch (error: any) {
    console.error('❌ TEST 2 FAILED:', error.message);
  }

  // ----------------------------------------------------
  // TEST 3: Grant Consent → status = GRANTED
  // ----------------------------------------------------
  try {
    const granted = await consentService.grantConsent(userId, createdConsentId);
    if (granted && granted.status === ConsentStatus.GRANTED && granted.grantedAt) {
      console.log('✅ TEST 3 PASSED: Grant consent status = GRANTED');
      passedTests++;
    } else {
      console.error('❌ TEST 3 FAILED:', granted);
    }
  } catch (error: any) {
    console.error('❌ TEST 3 FAILED:', error.message);
  }

  // ----------------------------------------------------
  // TEST 4: Check Consent sau khi grant → hasConsent = true
  // ----------------------------------------------------
  try {
    const check = await consentService.checkConsent(patientProfile.id, sourceHospitalId, targetHospitalId);
    if (check.hasConsent === true && check.status === ConsentStatus.GRANTED) {
      console.log('✅ TEST 4 PASSED: Check consent after grant returns hasConsent = true');
      passedTests++;
    } else {
      console.error('❌ TEST 4 FAILED:', check);
    }
  } catch (error: any) {
    console.error('❌ TEST 4 FAILED:', error.message);
  }

  // ----------------------------------------------------
  // TEST 5: Sai patientProfileId → bị từ chối
  // ----------------------------------------------------
  try {
    await consentService.createConsent(userId, {
      patientProfileId: '00000000-0000-0000-0000-000000000000',
      sourceHospitalId,
      targetHospitalId,
    });
    console.error('❌ TEST 5 FAILED: Expected invalid patientProfileId to throw NotFoundException');
  } catch (error: any) {
    if (error.status === 404 || error.message.includes('không tồn tại')) {
      console.log('✅ TEST 5 PASSED: Invalid patientProfileId rejected with 404 Not Found');
      passedTests++;
    } else {
      console.error('❌ TEST 5 FAILED with unexpected error:', error.message);
    }
  }

  // ----------------------------------------------------
  // TEST 6: sourceHospitalId === targetHospitalId → bị từ chối
  // ----------------------------------------------------
  try {
    await consentService.createConsent(userId, {
      patientProfileId: patientProfile.id,
      sourceHospitalId,
      targetHospitalId: sourceHospitalId,
    });
    console.error('❌ TEST 6 FAILED: Expected source === target to throw BadRequestException');
  } catch (error: any) {
    if (error.status === 400 || error.message.includes('khác nhau')) {
      console.log('✅ TEST 6 PASSED: Same source and target hospital rejected with BadRequestException');
      passedTests++;
    } else {
      console.error('❌ TEST 6 FAILED with unexpected error:', error.message);
    }
  }

  // ----------------------------------------------------
  // TEST 7: Duplicate Consent → bị từ chối
  // ----------------------------------------------------
  try {
    await consentService.createConsent(userId, {
      patientProfileId: patientProfile.id,
      sourceHospitalId,
      targetHospitalId,
    });
    console.error('❌ TEST 7 FAILED: Expected active duplicate consent to throw ConflictException');
  } catch (error: any) {
    if (error.status === 409 || error.message.includes('tồn tại')) {
      console.log('✅ TEST 7 PASSED: Active duplicate consent rejected with ConflictException');
      passedTests++;
    } else {
      console.error('❌ TEST 7 FAILED with unexpected error:', error.message);
    }
  }

  // ----------------------------------------------------
  // TEST 8: Revoke Consent → status = REVOKED
  // ----------------------------------------------------
  try {
    const revoked = await consentService.revokeConsent(userId, createdConsentId);
    if (revoked && revoked.status === ConsentStatus.REVOKED) {
      console.log('✅ TEST 8 PASSED: Revoke consent status = REVOKED');
      passedTests++;
    } else {
      console.error('❌ TEST 8 FAILED:', revoked);
    }
  } catch (error: any) {
    console.error('❌ TEST 8 FAILED:', error.message);
  }

  // ----------------------------------------------------
  // TEST 9: Check sau revoke → hasConsent = false
  // ----------------------------------------------------
  try {
    const check = await consentService.checkConsent(patientProfile.id, sourceHospitalId, targetHospitalId);
    if (check.hasConsent === false && check.status === ConsentStatus.REVOKED) {
      console.log('✅ TEST 9 PASSED: Check consent after revoke returns hasConsent = false');
      passedTests++;
    } else {
      console.error('❌ TEST 9 FAILED:', check);
    }
  } catch (error: any) {
    console.error('❌ TEST 9 FAILED:', error.message);
  }

  // ----------------------------------------------------
  // TEST 10: Consent hết hạn → hasConsent = false & status = EXPIRED
  // ----------------------------------------------------
  try {
    // Create a past-expired consent manually in DB to test checkConsent expiration logic
    const pastDate = new Date(Date.now() - 3600000); // 1 hour ago
    const tempConsent = await prisma.patientConsent.create({
      data: {
        patientProfileId: patientProfile.id,
        sourceHospitalId: hospitals[1].id,
        targetHospitalId: hospitals[2]?.id || hospitals[0].id,
        status: ConsentStatus.GRANTED,
        grantedAt: new Date(Date.now() - 7200000),
        expiresAt: pastDate,
      },
    });

    const check = await consentService.checkConsent(patientProfile.id, tempConsent.sourceHospitalId, tempConsent.targetHospitalId);
    if (check.hasConsent === false && check.status === ConsentStatus.EXPIRED) {
      console.log('✅ TEST 10 PASSED: Expired consent returns hasConsent = false and updates status to EXPIRED');
      passedTests++;
    } else {
      console.error('❌ TEST 10 FAILED:', check);
    }

    // Cleanup temp consent
    await prisma.patientConsent.delete({ where: { id: tempConsent.id } });
  } catch (error: any) {
    console.error('❌ TEST 10 FAILED:', error.message);
  }

  // ----------------------------------------------------
  // TEST 11: User không sở hữu PatientProfile → bị từ chối
  // ----------------------------------------------------
  try {
    await consentService.createConsent('wrong-user-uuid-999', {
      patientProfileId: patientProfile.id,
      sourceHospitalId,
      targetHospitalId,
    });
    console.error('❌ TEST 11 FAILED: Expected non-owner user to throw ForbiddenException');
  } catch (error: any) {
    if (error.status === 403 || error.message.includes('quyền')) {
      console.log('✅ TEST 11 PASSED: Non-owner user rejected with ForbiddenException');
      passedTests++;
    } else {
      console.error('❌ TEST 11 FAILED with unexpected error:', error.message);
    }
  }

  // ----------------------------------------------------
  // TEST 12: Controller có JwtAuthGuard
  // ----------------------------------------------------
  const consentControllerClass = require('../src/modules/integration/consent.controller').ConsentController;
  const guardsMeta = Reflect.getMetadata('__guards__', consentControllerClass) || Reflect.getMetadata('guards', consentControllerClass);
  if (guardsMeta && guardsMeta.length > 0) {
    console.log('✅ TEST 12 PASSED: ConsentController is protected with JwtAuthGuard');
    passedTests++;
  } else {
    console.error('❌ TEST 12 FAILED: ConsentController missing JwtAuthGuard');
  }

  // ----------------------------------------------------
  // TEST 13: Grant Consent đã REVOKED → bị từ chối
  // ----------------------------------------------------
  try {
    await consentService.grantConsent(userId, createdConsentId); // createdConsentId is currently REVOKED from TEST 8
    console.error('❌ TEST 13 FAILED: Expected granting REVOKED consent to throw BadRequestException');
  } catch (error: any) {
    if (error.status === 400 || error.message.includes('REVOKED') || error.message.includes('PENDING')) {
      console.log('✅ TEST 13 PASSED: Granting REVOKED consent rejected with BadRequestException');
      passedTests++;
    } else {
      console.error('❌ TEST 13 FAILED with unexpected error:', error.message);
    }
  }

  // ----------------------------------------------------
  // TEST 14: Grant Consent đã EXPIRED → bị từ chối
  // ----------------------------------------------------
  try {
    const expiredConsent = await prisma.patientConsent.create({
      data: {
        patientProfileId: patientProfile.id,
        sourceHospitalId: hospitals[1].id,
        targetHospitalId: hospitals[2]?.id || hospitals[0].id,
        status: ConsentStatus.EXPIRED,
        grantedAt: new Date(Date.now() - 7200000),
        expiresAt: new Date(Date.now() - 3600000),
      },
    });

    await consentService.grantConsent(userId, expiredConsent.id);
    console.error('❌ TEST 14 FAILED: Expected granting EXPIRED consent to throw BadRequestException');
  } catch (error: any) {
    if (error.status === 400 || error.message.includes('EXPIRED') || error.message.includes('quá hạn') || error.message.includes('PENDING')) {
      console.log('✅ TEST 14 PASSED: Granting EXPIRED consent rejected with BadRequestException');
      passedTests++;
    } else {
      console.error('❌ TEST 14 FAILED with unexpected error:', error.message);
    }
  }

  // ----------------------------------------------------
  // TEST 15: expiresAt nằm trong quá khứ → bị từ chối
  // ----------------------------------------------------
  try {
    await consentService.createConsent(userId, {
      patientProfileId: patientProfile.id,
      sourceHospitalId,
      targetHospitalId: hospitals[2]?.id || hospitals[1].id,
      expiresAt: '2020-01-01T00:00:00.000Z',
    });
    console.error('❌ TEST 15 FAILED: Expected past expiresAt to throw BadRequestException');
  } catch (error: any) {
    if (error.status === 400 || error.message.includes('quá khứ')) {
      console.log('✅ TEST 15 PASSED: Past expiresAt rejected with BadRequestException');
      passedTests++;
    } else {
      console.error('❌ TEST 15 FAILED with unexpected error:', error.message);
    }
  }

  console.log(`\n🎉 Verification Summary: ${passedTests}/${totalTests} TESTS PASSED!`);
}

runPhase4Tests()
  .catch((e) => {
    console.error('❌ Test suite failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
