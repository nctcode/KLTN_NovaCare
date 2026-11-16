import { createHmac, randomUUID, createHash } from 'crypto';
import { mkdir, readFile, writeFile } from 'fs/promises';
import path from 'path';
import { performance } from 'perf_hooks';
import { PrismaClient, AppointmentStatus, PaymentStatus, SlotStatus } from '@prisma/client';
import { AppointmentsService } from '../src/modules/appointments/appointments.service';
import { SlotStatusService } from '../src/modules/schedules/slot-status.service';
import { AppointmentSlotsService } from '../src/modules/appointment-slots/appointment-slots.service';
import { PreExamService } from '../src/modules/pre-exam/pre-exam.service';
import { PaymentsService } from '../src/modules/payments/payments.service';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error('DATABASE_URL is required.');
const parsedDatabaseUrl = new URL(databaseUrl);
if (
  parsedDatabaseUrl.hostname !== '127.0.0.1' ||
  parsedDatabaseUrl.port !== '55439' ||
  parsedDatabaseUrl.pathname !== '/novacare_occupancy_test'
) {
  throw new Error('Refusing to run: DATABASE_URL must target the isolated local V0 test database.');
}

const repetitions = Number(process.env.V0_REPETITIONS || 30);
if (!Number.isInteger(repetitions) || repetitions < 1 || repetitions > 30) {
  throw new Error('V0_REPETITIONS must be an integer from 1 to 30.');
}

const prisma = new PrismaClient();
const slotStatusService = new SlotStatusService(prisma as any);
const appointmentsService = new AppointmentsService(prisma as any, slotStatusService);
const appointmentSlotsService = new AppointmentSlotsService(prisma as any);
const queueCalls = { email: 0, push: 0 };
const testSigningKey = randomUUID();
const paymentsService = new PaymentsService(
  { get: (name: string) => (name === 'VNP_HASH_SECRET' ? testSigningKey : undefined) } as any,
  prisma as any,
  {
    addEmailJob: async () => { queueCalls.email++; },
    addPushJob: async () => { queueCalls.push++; },
  } as any,
);
const preExamService = new PreExamService(prisma as any, {} as any);

type TrialRow = {
  scenario: string;
  trial: number;
  calls: number;
  succeeded: number;
  failed: number;
  http_5xx: number | null;
  latency_avg_ms: number;
  latency_p50_ms: number;
  latency_p95_ms: number;
  over_capacity: boolean;
  negative_booked_count: boolean;
  counter_membership_inconsistent: boolean;
  missing_or_extra_membership: boolean;
  slot_state_inconsistent: boolean;
  appointment_payment_occupancy_signal: boolean;
  duplicate_side_effects: boolean;
  deadlock_or_transaction_conflict: number;
  request_latency_ms: number[];
  observed: Record<string, unknown>;
  errors: Array<Record<string, unknown>>;
};

const rows: TrialRow[] = [];
const randomId = () => randomUUID();

function percentile(values: number[], p: number): number {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.max(0, Math.ceil(p * sorted.length) - 1)];
}

function isConflict(error: any): boolean {
  const code = String(error?.code || error?.meta?.code || '');
  return ['40P01', '40001', 'P2034'].includes(code);
}

async function attempt<T>(name: string, operation: () => Promise<T>) {
  const started = performance.now();
  try {
    const value = await operation();
    return { name, ok: true, elapsed: performance.now() - started, value };
  } catch (error: any) {
    return {
      name,
      ok: false,
      elapsed: performance.now() - started,
      error: {
        name: error?.name || 'Error',
        code: error?.code || error?.meta?.code || null,
        httpStatus: typeof error?.getStatus === 'function' ? error.getStatus() : null,
        message: String(error?.message || 'Unknown error').slice(0, 300),
      },
    };
  }
}

async function createPatient() {
  const user = await prisma.user.create({
    data: { passwordHash: 'synthetic-v0-only', fullName: `V0 Synthetic ${randomId()}` },
  });
  const profile = await prisma.patientProfile.create({
    data: { userId: user.id, fullName: user.fullName, isDefault: true },
  });
  return { user, profile };
}

async function createSlot(workplaceId: string, trial: number, part = 0, capacity = 1) {
  const startTime = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000 + trial * 2 * 60 * 60 * 1000);
  startTime.setSeconds(0, 0);
  startTime.setMinutes(startTime.getMinutes() + part * 30);
  const endTime = new Date(startTime.getTime() + 30 * 60 * 1000);
  const date = new Date(Date.UTC(startTime.getUTCFullYear(), startTime.getUTCMonth(), startTime.getUTCDate()));
  return prisma.appointmentSlot.create({
    data: {
      doctorWorkplaceId: workplaceId,
      date,
      startTime,
      endTime,
      capacity,
      bookedCount: 0,
      isAvailable: true,
      isActive: true,
      status: SlotStatus.AVAILABLE,
    },
  });
}

function normalDto(profileId: string, slotId: string, serviceId?: string) {
  return {
    patientProfileId: profileId,
    slotId,
    ...(serviceId ? { medicalServiceId: serviceId } : {}),
    idempotencyKey: randomId(),
  } as any;
}

async function createNormal(patient: { user: any; profile: any }, slotId: string, serviceId?: string) {
  return appointmentsService.create(patient.user.id, normalDto(patient.profile.id, slotId, serviceId));
}

async function inspectSlots(slotIds: string[]) {
  return prisma.appointmentSlot.findMany({
    where: { id: { in: slotIds } },
    orderBy: { startTime: 'asc' },
    select: { id: true, capacity: true, bookedCount: true, status: true, isAvailable: true },
  });
}

async function recordTrial(
  scenario: string,
  trial: number,
  attempts: any[],
  slotIds: string[],
  expectedCounter: number[] | null,
  expectedMembershipCounts: number[] | null,
  observedExtra: Record<string, unknown> = {},
  paymentOccupancySignal = false,
  duplicateSideEffects = false,
) {
  const slots = await inspectSlots(slotIds);
  const memberships = await prisma.appointmentSlotBooking.groupBy({
    by: ['slotId'],
    where: { slotId: { in: slotIds } },
    _count: { _all: true },
  });
  const membershipBySlot = new Map(memberships.map((item) => [item.slotId, item._count._all]));
  const membershipCounts = slotIds.map((id) => membershipBySlot.get(id) || 0);
  const latencies = attempts.map((item) => item.elapsed);
  const succeeded = attempts.filter((item) => item.ok).length;
  const errors = attempts.filter((item) => !item.ok).map((item) => ({ name: item.name, ...item.error }));
  const conflictCount = errors.filter((item) => isConflict(item)).length;
  const inconsistentCounter = expectedCounter !== null &&
    slots.some((slot, index) => slot.bookedCount !== expectedCounter[index]);
  const membershipMismatch = expectedMembershipCounts !== null &&
    membershipCounts.some((count, index) => count !== expectedMembershipCounts[index]);
  const expectedSlotAvailable = slots.map((slot) => slot.bookedCount < slot.capacity);
  const slotStateInconsistent = slots.some((slot, index) =>
    slot.isAvailable !== expectedSlotAvailable[index] ||
    slot.status !== (expectedSlotAvailable[index] ? SlotStatus.AVAILABLE : SlotStatus.FULL));

  rows.push({
    scenario,
    trial,
    calls: attempts.length,
    succeeded,
    failed: attempts.length - succeeded,
    http_5xx: null,
    latency_avg_ms: latencies.length ? latencies.reduce((sum, value) => sum + value, 0) / latencies.length : 0,
    latency_p50_ms: percentile(latencies, 0.50),
    latency_p95_ms: percentile(latencies, 0.95),
    over_capacity: slots.some((slot) => slot.bookedCount > slot.capacity),
    negative_booked_count: slots.some((slot) => slot.bookedCount < 0),
    counter_membership_inconsistent: Boolean(inconsistentCounter || membershipMismatch),
    missing_or_extra_membership: Boolean(membershipMismatch),
    slot_state_inconsistent: slotStateInconsistent,
    appointment_payment_occupancy_signal: paymentOccupancySignal,
    duplicate_side_effects: duplicateSideEffects,
    deadlock_or_transaction_conflict: conflictCount,
    request_latency_ms: latencies,
    observed: {
      slots,
      rawHistoricalMembershipCounts: membershipCounts,
      expectedCounterFromScenarioOperations: expectedCounter,
      expectedMembershipCountsForScenario: expectedMembershipCounts,
      expectedSlotAvailabilityForSyntheticFixture: expectedSlotAvailable,
      ...observedExtra,
    },
    errors,
  });
}

async function createPayment(appointmentId: string) {
  const transactionCode = `V0_${randomId()}`;
  await prisma.paymentTransaction.create({
    data: {
      appointmentId,
      amount: 100,
      paymentMethod: 'VNPAY',
      transactionCode,
      status: PaymentStatus.PENDING,
    },
  });
  return transactionCode;
}

function fakeSignedCallback(transactionCode: string) {
  const params: Record<string, string> = {
    vnp_TxnRef: transactionCode,
    vnp_ResponseCode: '00',
    vnp_TransactionNo: `SYNTHETIC_${randomId()}`,
  };
  const signingData = Object.keys(params).sort().map((key) => `${key}=${params[key]}`).join('&');
  params.vnp_SecureHash = createHmac('sha512', testSigningKey).update(signingData, 'utf8').digest('hex');
  return params;
}

async function main() {
  const dbIdentity = await prisma.$queryRaw<Array<{ database: string; version: string }>>`
    SELECT current_database() AS database, version() AS version
  `;
  if (dbIdentity[0]?.database !== 'novacare_occupancy_test') {
    throw new Error(`Refusing writes: connected database is ${dbIdentity[0]?.database || 'unknown'}.`);
  }

  const hospital = await prisma.hospital.create({ data: { name: `V0 Synthetic Hospital ${randomId()}` } });
  const specialty = await prisma.specialty.create({ data: { name: `V0 Synthetic Specialty ${randomId()}` } });
  const doctor = await prisma.doctor.create({
    data: { fullName: `V0 Synthetic Doctor ${randomId()}`, qualification: 'Synthetic fixture' },
  });
  const workplace = await prisma.doctorWorkplace.create({
    data: {
      doctorId: doctor.id,
      hospitalId: hospital.id,
      specialtyId: specialty.id,
      consultationFee: 100,
    },
  });
  const longService = await prisma.medicalService.create({
    data: {
      hospitalId: hospital.id,
      specialtyId: specialty.id,
      name: `V0 Synthetic 60 Minute Service ${randomId()}`,
      duration: 60,
      price: 100,
    },
  });
  const sourceRoot = path.resolve(__dirname, '..');
  const sourceFiles = [
    'prisma/schema.prisma',
    'src/modules/appointments/appointments.service.ts',
    'src/modules/pre-exam/pre-exam.service.ts',
    'src/modules/payments/payments.service.ts',
    'src/modules/appointment-slots/appointment-slots.service.ts',
    'prisma/migrations/20260919163000_add_scheduling_and_availability_engine/migration.sql',
    'test/occupancy-v0.harness.ts',
  ];
  const hashes: Record<string, string> = {};
  for (const relativePath of sourceFiles) {
    const contents = await readFile(path.join(sourceRoot, relativePath));
    hashes[relativePath] = createHash('sha256').update(contents).digest('hex');
  }

  for (let trial = 1; trial <= repetitions; trial++) {
    // E1: two normal booking commands race for a single capacity unit.
    {
      const slot = await createSlot(workplace.id, trial);
      const patients = [await createPatient(), await createPatient()];
      const attempts = await Promise.all(patients.map((patient, index) =>
        attempt(`normal-create-${index + 1}`, () => createNormal(patient, slot.id))));
      const successes = attempts.filter((item) => item.ok).length;
      const appointmentIds = attempts.flatMap((item) => item.ok ? [(item as any).value.id] : []);
      const actualMemberships = await prisma.appointmentSlotBooking.count({ where: { slotId: slot.id } });
      await recordTrial('E1_concurrent_create', trial, attempts, [slot.id], [successes], [successes], {
        successfulAppointmentIds: appointmentIds,
        rawMembershipCount: actualMemberships,
      });
    }

    // E2: the lock-protected normal path races the separately implemented AI path.
    {
      const slot = await createSlot(workplace.id, trial + repetitions, 0);
      const [normalPatient, aiPatient] = [await createPatient(), await createPatient()];
      const preExam = await prisma.preExamSession.create({
        data: {
          userId: aiPatient.user.id,
          status: 'COMPLETED',
          expiresAt: new Date(Date.now() + 60 * 60 * 1000),
          structuredData: { chiefComplaint: 'Synthetic V0 test', symptoms: ['synthetic'] },
        },
      });
      const attempts = await Promise.all([
        attempt('normal-create', () => createNormal(normalPatient, slot.id)),
        attempt('ai-preexam-create', () => preExamService.createAppointmentFromPreExam(
          aiPatient.user.id, preExam.id, slot.id, aiPatient.profile.id)),
      ]);
      const successes = attempts.filter((item) => item.ok).length;
      await recordTrial('E2_normal_vs_ai_preexam', trial, attempts, [slot.id], [successes], [successes], {
        successfulPaths: attempts.filter((item) => item.ok).map((item) => item.name),
        sourceObservation: 'Each successful path increments bookedCount; only the normal path creates a membership in the inspected source.',
      });
    }

    // E3: a new normal create races cancellation of the current holder.
    {
      const slot = await createSlot(workplace.id, trial + 2 * repetitions, 0);
      const holder = await createPatient();
      const contender = await createPatient();
      const existing = await createNormal(holder, slot.id);
      const attempts = await Promise.all([
        attempt('cancel-existing', () => appointmentsService.cancel(existing.id, holder.user.id, { reason: 'Synthetic V0 cancellation' } as any)),
        attempt('create-after-release-race', () => createNormal(contender, slot.id)),
      ]);
      const latest = await prisma.appointment.findMany({
        where: { id: existing.id },
        select: { id: true, status: true },
      });
      const newSuccesses = attempts.filter((item) => item.ok && item.name === 'create-after-release-race').length;
      await recordTrial('E3_create_vs_cancel', trial, attempts, [slot.id], [newSuccesses], null, {
        existingAppointmentStatus: latest[0]?.status,
        contenderCreated: newSuccesses === 1,
        rawMembershipCount: await prisma.appointmentSlotBooking.count({ where: { slotId: slot.id } }),
      });
    }

    // E4: a valid synthetic signed payment callback races the actual expiry sweep.
    {
      const slot = await createSlot(workplace.id, trial + 3 * repetitions, 0);
      const patient = await createPatient();
      const appointment = await createNormal(patient, slot.id);
      const transactionCode = await createPayment(appointment.id);
      await prisma.appointment.update({
        where: { id: appointment.id },
        data: { expiresAt: new Date(Date.now() - 60_000) },
      });
      const callback = fakeSignedCallback(transactionCode);
      const attempts = await Promise.all([
        attempt('expiry-sweep', () => appointmentsService.expirePendingAppointments()),
        attempt('synthetic-payment-callback', () => paymentsService.handleIpn(callback)),
      ]);
      const [appointmentState, paymentState] = await Promise.all([
        prisma.appointment.findUnique({ where: { id: appointment.id }, select: { status: true, slotId: true } }),
        prisma.paymentTransaction.findUnique({ where: { appointmentId: appointment.id }, select: { status: true } }),
      ]);
      const slotState = (await inspectSlots([slot.id]))[0];
      const inconsistentSignal = paymentState?.status === 'PAID' &&
        (appointmentState?.status !== 'PAID' || slotState?.bookedCount === 0);
      await recordTrial('E4_payment_vs_expiry', trial, attempts, [slot.id], null, [1], {
        appointmentStatus: appointmentState?.status,
        paymentStatus: paymentState?.status,
        postRaceBookedCount: slotState?.bookedCount,
        expiryReturnedCount: attempts.find((item) => item.name === 'expiry-sweep' && item.ok)?.value ?? null,
        signalDefinition: 'Payment PAID while appointment not PAID or slot counter is zero; classification is business-policy unresolved.',
      }, Boolean(inconsistentSignal));
    }

    // E5: two identical signed callback deliveries are processed concurrently.
    {
      const slot = await createSlot(workplace.id, trial + 4 * repetitions, 0);
      const patient = await createPatient();
      const appointment = await createNormal(patient, slot.id);
      const transactionCode = await createPayment(appointment.id);
      const callback = fakeSignedCallback(transactionCode);
      const queueBefore = { ...queueCalls };
      const attempts = await Promise.all([
        attempt('duplicate-callback-1', () => paymentsService.handleIpn(callback)),
        attempt('duplicate-callback-2', () => paymentsService.handleIpn(callback)),
      ]);
      const [appointmentState, paymentState, historyCount] = await Promise.all([
        prisma.appointment.findUnique({ where: { id: appointment.id }, select: { status: true } }),
        prisma.paymentTransaction.findUnique({ where: { appointmentId: appointment.id }, select: { status: true } }),
        prisma.appointmentStatusHistory.count({ where: { appointmentId: appointment.id, status: AppointmentStatus.PAID } }),
      ]);
      await recordTrial('E5_duplicate_payment_callback', trial, attempts, [slot.id], [1], [1], {
        appointmentStatus: appointmentState?.status,
        paymentStatus: paymentState?.status,
        paidHistoryRows: historyCount,
        notificationQueueAttemptsThisTrial: {
          email: queueCalls.email - queueBefore.email,
          push: queueCalls.push - queueBefore.push,
        },
      }, false, Boolean(historyCount > 1 || queueCalls.email - queueBefore.email > 1 || queueCalls.push - queueBefore.push > 1));
    }

    // E6: normal booking with a 60-minute service requires both consecutive slots.
    {
      const firstSlot = await createSlot(workplace.id, trial + 5 * repetitions, 0);
      const secondSlot = await createSlot(workplace.id, trial + 5 * repetitions, 1);
      const patient = await createPatient();
      const result = await attempt('multi-slot-create', () => createNormal(patient, firstSlot.id, longService.id));
      const successes = result.ok ? 1 : 0;
      await recordTrial('E6_multi_slot_booking', trial, [result], [firstSlot.id, secondSlot.id],
        successes ? [1, 1] : [0, 0], successes ? [1, 1] : [0, 0], {
          appointmentId: result.ok ? (result as any).value.id : null,
          selectedSlots: [firstSlot.id, secondSlot.id],
        });
    }

    // E7: existing capacity-update service races a capacity reduction with create.
    {
      const slot = await createSlot(workplace.id, trial + 6 * repetitions, 0);
      const patient = await createPatient();
      const attempts = await Promise.all([
        attempt('normal-create', () => createNormal(patient, slot.id)),
        attempt('capacity-reduction-to-zero', () => appointmentSlotsService.updateSlot(slot.id, { capacity: 0 } as any)),
      ]);
      const finalSlot = (await inspectSlots([slot.id]))[0];
      await recordTrial('E7_capacity_reduction_vs_create', trial, attempts, [slot.id],
        [finalSlot.bookedCount], null, {
          finalCapacity: finalSlot.capacity,
          createSucceeded: attempts.some((item) => item.ok && item.name === 'normal-create'),
          capacityReductionSucceeded: attempts.some((item) => item.ok && item.name === 'capacity-reduction-to-zero'),
          sourceCheck: 'updateSlot reads bookedCount before a separate update; race outcome is runtime-observed only for this test.',
        });
    }

    // E8: duplicate cancellation of one appointment.
    {
      const slot = await createSlot(workplace.id, trial + 7 * repetitions, 0);
      const patient = await createPatient();
      const appointment = await createNormal(patient, slot.id);
      const attempts = await Promise.all([
        attempt('cancel-1', () => appointmentsService.cancel(appointment.id, patient.user.id, { reason: 'Synthetic duplicate cancel' } as any)),
        attempt('cancel-2', () => appointmentsService.cancel(appointment.id, patient.user.id, { reason: 'Synthetic duplicate cancel' } as any)),
      ]);
      const [state, historyCount, finalSlot] = await Promise.all([
        prisma.appointment.findUnique({ where: { id: appointment.id }, select: { status: true } }),
        prisma.appointmentStatusHistory.count({ where: { appointmentId: appointment.id, status: AppointmentStatus.CANCELLED } }),
        prisma.appointmentSlot.findUnique({ where: { id: slot.id }, select: { bookedCount: true, capacity: true } }),
      ]);
      await recordTrial('E8_duplicate_cancel', trial, attempts, [slot.id], [0], null, {
        appointmentStatus: state?.status,
        cancellationHistoryRows: historyCount,
        rawHistoricalMembershipCount: await prisma.appointmentSlotBooking.count({ where: { appointmentId: appointment.id } }),
        finalCapacity: finalSlot?.capacity,
      }, false, Boolean(historyCount > 1));
    }
  }

  const outputDirectory = process.env.V0_OUTPUT_DIR || process.cwd();
  await mkdir(outputDirectory, { recursive: true });
  const output = {
    experiment: 'NovaCare occupancy V0 source behavior',
    generatedAt: new Date().toISOString(),
    database: {
      name: dbIdentity[0].database,
      serverVersion: dbIdentity[0].version.split(' ')[1],
      connectionTarget: '127.0.0.1:55439/novacare_occupancy_test',
      syntheticOnly: true,
    },
    source: {
      gitHead: process.env.V0_GIT_HEAD || null,
      branch: process.env.V0_BRANCH || null,
      workingTreeStatusHash: process.env.V0_STATUS_SHA256 || null,
      workingTreeStatusAtSnapshot: process.env.V0_STATUS_TEXT || null,
      isolatedSourceCopy: process.env.V0_SOURCE_COPY || null,
      hashes,
    },
    execution: {
      repetitionsPerScenario: repetitions,
      transport: 'Direct service invocation; no HTTP server was exercised.',
      payment: 'Synthetic callback payload signed with an ephemeral test-only HMAC key; no payment provider called.',
      redis: 'Not used.',
      scenarios: rows,
    },
    metricSemantics: {
      http5xx: 'null/not measured because calls invoke services directly, not HTTP endpoints.',
      membership: 'Raw membership counts are retained as observations, not treated as active occupancy truth.',
      inconsistentSignal: 'Only source-operation expectations or explicitly labeled state tuple signals; unresolved business policy is not automatically called a violation.',
    },
  };

  await writeFile(path.join(outputDirectory, 'V0_EXPERIMENT_RESULTS.json'), `${JSON.stringify(output, null, 2)}\n`);
  const csvColumns = [
    'scenario', 'trial', 'calls', 'succeeded', 'failed', 'http_5xx',
    'latency_avg_ms', 'latency_p50_ms', 'latency_p95_ms',
    'over_capacity', 'negative_booked_count', 'counter_membership_inconsistent',
    'missing_or_extra_membership', 'slot_state_inconsistent',
    'appointment_payment_occupancy_signal', 'duplicate_side_effects',
    'deadlock_or_transaction_conflict',
  ] as const;
  const csvCell = (value: unknown) => {
    const text = value === null || value === undefined ? '' : String(value);
    return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };
  const csv = [
    csvColumns.join(','),
    ...rows.map((row) => csvColumns.map((column) => csvCell(row[column])).join(',')),
  ].join('\r\n');
  await writeFile(path.join(outputDirectory, 'V0_EXPERIMENT_RESULTS.csv'), `${csv}\r\n`);
  console.log(JSON.stringify({
    database: dbIdentity[0].database,
    repetitionsPerScenario: repetitions,
    trialRows: rows.length,
    outputDirectory,
    sourceHashes: hashes,
  }, null, 2));
}

main()
  .catch((error) => {
    console.error(error?.stack || error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
