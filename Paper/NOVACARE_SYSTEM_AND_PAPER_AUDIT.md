# NovaCare System and Paper Audit

Date: 2026-11-10
Scope: current `nova-care-backend` workspace, Prisma schema, existing tests, experiment artifacts, and `main.tex`.

## Executive result

The current workspace is not the same implementation described as V1 in the paper artifacts. The paper's V1 claims describe an isolated experimental source copy in which normal booking and AI pre-exam booking share an occupancy claim protocol. In the current workspace:

- normal booking uses a Prisma transaction and PostgreSQL `FOR UPDATE`;
- normal booking writes appointment, membership, and counter updates in one transaction;
- AI pre-exam booking performs an availability read before the transaction, then creates the appointment and status history and increments `bookedCount` inside a transaction;
- the AI path shown in the current source does not acquire `FOR UPDATE` and does not create an `AppointmentSlotBooking` membership row;
- cancellation and expiry have separate counter-release paths;
- therefore the current workspace cannot be presented as identical to the measured V1 source snapshot without restoring or separately identifying the experimental V1 copy.

## Step 1 — System structure and interaction

### Normal booking path

The normal route is exposed by the appointments module and enters `AppointmentsService.create()`:

- controller/module: `src/modules/appointments/appointments.controller.ts`, `appointments.module.ts`;
- service: `src/modules/appointments/appointments.service.ts:26`;
- repository/database access: Prisma calls through `PrismaService` and transaction client `tx`;
- schema entities: `Appointment`, `AppointmentSlot`, `AppointmentSlotBooking`, and `AppointmentStatusHistory`.

The service checks the patient profile and idempotency key, opens a Prisma transaction, locks the primary slot and candidate multi-slot rows with `SELECT ... FOR UPDATE`, rereads slot state, creates the appointment, creates membership rows, increments counters, resolves slot status, and writes status history.

### AI pre-exam path

The AI route is exposed by `src/modules/pre-exam/appointments-from-pre-exam.controller.ts:37` and calls `PreExamService.createAppointmentFromPreExam()` in `src/modules/pre-exam/pre-exam.service.ts:201`.

The method:

1. validates that the pre-exam session is completed;
2. reads the selected slot with Prisma before opening the transaction;
3. checks `isAvailable` and `bookedCount >= capacity` using that pre-transaction read;
4. opens a transaction;
5. creates the appointment and status history;
6. increments `bookedCount`.

The normal and AI flows interact through the same `appointment_slots` row and its `bookedCount`, but they do not currently use the same locking and membership protocol in the checked workspace.

### Schema evidence

`AppointmentSlot` contains `capacity`, `bookedCount`, `isAvailable`, `isActive`, `status`, and `version`. `AppointmentSlotBooking` has a unique constraint on `(appointmentId, slotId)`. The schema does not itself enforce `bookedCount <= capacity` through a database check constraint.

## Step 2 — Technical mechanism comparison

| Mechanism | Normal booking | AI pre-exam booking | Audit result |
|---|---|---|---|
| Prisma transaction | Yes | Yes | Both are transactional, but transaction alone does not serialize the initial AI availability read. |
| PostgreSQL row lock | Yes, `SELECT ... FOR UPDATE` | Not found in current method | The two writers are not symmetric. |
| Guarded capacity update | State is reread after locking, but counter update is an unconditional increment after appointment creation | Unconditional increment | No current database-level `WHERE bookedCount < capacity` guard was found in the AI method. |
| Membership row | Yes, one row per required slot | Not found in current method | The current AI path can diverge from normal membership representation. |
| Rollback | Prisma transaction rolls back thrown errors | Prisma transaction rolls back thrown errors | Atomicity exists within each transaction, but cross-flow correctness is not established. |
| Stable lock ordering | Candidate IDs are passed to `ANY($1::text[])`; the source does not explicitly sort IDs before the raw lock | Not applicable | The paper's stable-ID-order claim should not be attributed to this current source without further verification. |
| Cancellation release | Transactional path decrements slot counters based on membership/primary slot | AI appointments use the same cancellation service later | Release behavior is a separate lifecycle writer and is not covered by the V1 creation experiment. |
| Expiry release | Separate expiry logic also decrements counters | Same lifecycle surface | Requires separate concurrency and policy tests. |

## Step 3 — Functional test execution

### Tests executed in this audit

The following non-database test suites were run:

```text
npm test -- --runInBand \
  src/modules/appointments/appointments-cancellation.spec.ts \
  src/modules/appointments/appointments-demo.spec.ts \
  src/modules/pre-exam-v2/pre-exam-v2.spec.ts
```

Result: **3 suites passed, 19 tests passed, 0 failed**.

These tests validate service/module behavior but do not reproduce a two-writer PostgreSQL race.

### Required database scenarios

The repository contains a dedicated V0 occupancy harness, but it refuses to run unless `DATABASE_URL` targets its isolated loopback test database. No new live database experiment was started during this audit because the required disposable database/container and exact source snapshot must be selected first.

The existing artifacts report:

- V0 E2 normal-versus-AI over-capacity: 30/30 trials in the recorded V0 source snapshot;
- V1 E2 shared protocol: 120/120 trials with one success and one conflict;
- V1 injected multi-slot rollback: 30/30 trials.

Those are artifact results, not a fresh execution against the current workspace source.

## Step 4 — Paper claim audit

### Claims supported by current source or artifacts

- PostgreSQL stores slot capacity and `bookedCount`.
- Normal booking uses transaction-scoped row locking.
- Appointment-slot membership exists in the schema and is written by normal booking.
- The existing experiment artifacts report the V0/V1 results stated in the paper.
- The paper correctly limits the reported experiment to direct service calls, synthetic fixtures, PostgreSQL 16.14, and an isolated source copy.

### Claims requiring qualification

1. **“V1 routes both reservation pathways through a shared database transaction.”** This is supported by `V1_IMPLEMENTATION_REPORT.md` for the isolated V1 copy, but not by the current AI source inspected here.
2. **“Both paths lock target rows using `SELECT ... FOR UPDATE`.”** This is not true of the current AI method.
3. **“The AI path creates the same membership representation.”** This is not true of the current AI method shown in the workspace.
4. **“Stable ID lock ordering.”** The current normal source does not visibly sort IDs before the raw `FOR UPDATE` query.
5. **“Guarded counter updates.”** The current AI increment is unconditional after the earlier non-locking check.

## Recommended correction before submission

Choose one of these two defensible positions:

### Position A — Paper reports the isolated V1 experiment

Keep the paper's V1 claims, but state prominently that the measured implementation is an isolated source snapshot and provide its commit/source hash. Do not imply that the current working tree is the measured V1 implementation.

### Position B — Paper claims the current workspace

Change the implementation first so both normal and AI creation call one shared occupancy helper that locks and rereads every target slot, performs a guarded capacity update, writes membership rows, and keeps appointment/status/membership/counter changes in one transaction. Then rerun the V0/V1-style database experiments against the resulting source and update the paper numbers only from that run.

The current evidence supports Position A, not Position B.
