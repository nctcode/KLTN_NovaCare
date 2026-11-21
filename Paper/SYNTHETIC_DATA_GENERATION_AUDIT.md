# Synthetic Data Generation and Fixture Provenance Audit

## 1. Executive summary

This is a read-only audit of the V0 harness in the current backend workspace, the preserved V1 harness/source snapshot, and the preserved V0/V1 JSON/CSV artifacts. No database, migration, source, configuration, container, volume or artifact was modified; no harness or experiment was run.

Overall status: **PARTIALLY VERIFIED**.

The source code directly verifies that the experiments used synthetic records created by the harness, direct NestJS service calls, trial-specific slots/patients, and a shared hospital/specialty/doctor/workplace/service fixture. It also verifies `capacity = 1`, `bookedCount = 0`, available/active slots, UUID generation, Promise-based concurrent calls, the V1 barrier/order hooks, and post-call invariant checks.

The source does **not** verify a cleanup/reset between trials: no `DELETE`, `TRUNCATE`, or per-trial rollback routine is present in either harness. The harness creates new records during each trial and accumulates them in the disposable experiment database. The artifacts and reports support the totals, but do not by themselves prove that the original V0/V1 databases had no pre-existing rows before the harness started.

The evidence is sufficient to describe the data as **harness-generated synthetic fixtures**. It is not sufficient to claim AI-generated data, a fixed random seed, identical database state before every trial, or complete reproducibility of UUID/timestamp values.

## 2. Sources inspected

### V0

- `D:\KLTN_NovaCare\nova-care-backend\test\occupancy-v0.harness.ts`
- `D:\KLTN_NovaCare\V0_EXPERIMENT_RESULTS.json`
- `D:\KLTN_NovaCare\V0_EXPERIMENT_RESULTS.csv`
- `D:\KLTN_NovaCare\V0_EXPERIMENT_REPORT.md`

### V1

- `C:\Users\trinh\.copilot\session-state\c430313c-a6ee-4b4e-b2b7-aac21ab492db\v1-source\nova-care-backend\test\occupancy-v1.harness.ts`
- The same preserved V1 source snapshot's `prisma/schema.prisma`
- `D:\KLTN_NovaCare\V1_EXPERIMENT_RESULTS.json`
- `D:\KLTN_NovaCare\V1_EXPERIMENT_RESULTS.csv`
- `D:\KLTN_NovaCare\V1_EXPERIMENT_REPORT.md`

The V1 source snapshot was used instead of assuming that the current workspace is identical to historical V1.

## 3. V0 evidence

### 3.1 Shared fixture created once per harness run

In `test/occupancy-v0.harness.ts:249–270`, `main()` creates once:

- `Hospital`: one synthetic hospital;
- `Specialty`: one synthetic specialty;
- `Doctor`: one synthetic doctor with `qualification: 'Synthetic fixture'`;
- `DoctorWorkplace`: one workplace joining the doctor, hospital and specialty, with `consultationFee: 100`;
- `MedicalService`: one 60-minute synthetic service with `duration: 60`, `price: 100`.

These records are shared by all V0 trials in the harness run. Their names contain `V0 Synthetic` and `randomUUID()` values. This is direct source evidence.

### 3.2 Trial-specific records

`createPatient()` at `occupancy-v0.harness.ts:101–108` creates one `User` and one `PatientProfile` per synthetic patient. The user has `passwordHash: 'synthetic-v0-only'`; the profile has `isDefault: true`.

`createSlot()` at `occupancy-v0.harness.ts:111–129` creates a new `AppointmentSlot` for each call. It sets `capacity` from the argument, whose default is `1`; all measured calls use the default. It sets `bookedCount: 0`, `isAvailable: true`, `isActive: true`, and `status: SlotStatus.AVAILABLE`.

Normal appointments are created through `appointmentsService.create()` at `occupancy-v0.harness.ts:141–143`, not by direct Prisma appointment insertion. E2 also creates one `PreExamSession` directly at lines `307–314`, with `status: 'COMPLETED'`, synthetic structured data and a one-hour expiry.

V0 E4/E5 create a `PaymentTransaction` through `createPayment()` at lines `216–228`; the callback payload is synthetic and signed using an ephemeral HMAC key created at line 33. No real payment provider is called. `AppointmentSlotBooking` rows are inspected by the harness; the harness does not directly create membership rows.

No `PatientHospitalLink` is created by the V0 harness. The membership relevant to the measured occupancy checks is `AppointmentSlotBooking`.

### 3.3 V0 measured scenario fixture table

The counts below are per trial, inferred directly from the scenario blocks at lines `287–460`; appointment counts are operation-dependent where the service call can fail.

| Scenario | Trials | New slots/trial | Patients/trial | Pre-exam sessions | Payment records | Competing requests | Appointment handling |
|---|---:|---:|---:|---:|---:|---:|---|
| E1 concurrent normal create | 30 | 1 | 2 | 0 | 0 | 2 simultaneous normal calls | Created by successful calls; expected 1 success in artifact |
| E2 normal vs AI pre-exam | 30 | 1 | 2 | 1 | 0 | 2 simultaneous calls, normal + AI | Created by each successful path; artifact records both success in V0 |
| E3 create vs cancel | 30 | 1 | 2 | 0 | 0 | 2 simultaneous calls after 1 holder appointment | 1 existing appointment, then cancel/create race |
| E4 payment vs expiry | 30 | 1 | 1 | 0 | 1 | 2 simultaneous calls | 1 existing appointment; expiry and synthetic callback race |
| E5 duplicate payment callback | 30 | 1 | 1 | 0 | 1 | 2 identical simultaneous callback calls | 1 existing appointment |
| E6 multi-slot booking | 30 | 2 | 1 | 0 | 0 | 1 multi-slot create call | 1 appointment may occupy 2 slots |
| E7 capacity reduction vs create | 30 | 1 | 1 | 0 | 0 | 2 simultaneous calls | Normal create competes with capacity update |
| E8 duplicate cancel | 30 | 1 | 1 | 0 | 0 | 2 simultaneous cancel calls | 1 existing appointment |

Artifact evidence in `V0_EXPERIMENT_RESULTS.json` confirms 8 scenario IDs, 30 rows per scenario, 240 rows total and 450 service calls. The artifact does not contain a complete per-record fixture manifest for every trial; the per-trial counts above are source-derived.

## 4. V1 evidence

### 4.1 Shared fixture created once per harness run

In the preserved V1 harness `test/occupancy-v1.harness.ts:297–318`, `main()` creates once:

- one synthetic `Hospital`;
- one synthetic `Specialty`;
- one synthetic `Doctor`;
- one `DoctorWorkplace` linking them, with `consultationFee: 100`;
- one 60-minute `MedicalService` with `duration: 60`, `price: 100`.

Names contain `V1 Synthetic`; the doctor has `qualification: 'Synthetic fixture'`. These records are shared across all V1 trials.

### 4.2 Trial-specific records and V1 paths

`createPatient()` at `occupancy-v1.harness.ts:112–121` creates a new `User` and `PatientProfile` per patient. `createSlot()` at lines `124–143` creates new slots with `capacity = 1` by default, `bookedCount = 0`, `isAvailable = true`, `isActive = true`, and `SlotStatus.AVAILABLE`.

Normal booking is called through `createNormal()` at lines `146–157`. AI booking is called through `createAiBooking()` at lines `159–166`. The AI path uses a trial-specific `PreExamSession` created at lines `168–177` with `status: 'COMPLETED'` and synthetic structured data.

V1 E6 uses two slots and the shared 60-minute service. V1 fault injection installs a test hook at lines `396–400`; it throws after `writeCount === 1`. The harness then checks appointment and status-history counts at lines `404–416`. It does not directly insert `AppointmentSlotBooking` rows; those are produced by the service implementation and inspected afterward.

No `PatientHospitalLink` is created by the V1 harness. The relevant membership model is `AppointmentSlotBooking`.

### 4.3 V1 measured scenario fixture table

| Scenario | Trials | New slots/trial | Patients/trial | Pre-exam sessions | Competing requests | Coordination |
|---|---:|---:|---:|---:|---:|---|
| E1 concurrent normal create | 30 | 1 | 2 | 0 | 2 normal calls | `Promise.all` |
| E2 normal vs AI baseline | 30 | 1 | 2 | 1 | 2 calls: normal + AI | `Promise.all` |
| E2 normal-first | 30 | 1 | 2 | 1 | 2 calls: normal + AI | V1 `beforeClaim` hook releases normal first and delays the other |
| E2 pre-exam-first | 30 | 1 | 2 | 1 | 2 calls: normal + AI | V1 `beforeClaim` hook releases AI first and delays the other |
| E2 barrier-release | 30 | 1 | 2 | 1 | 2 calls: normal + AI | V1 `beforeClaim` barrier waits for both arrivals |
| E6 multi-slot success | 30 | 2 | 1 | 0 | 1 normal multi-slot call | Sequential single operation |
| E6 fault rollback | 30 | 2 | 1 | 0 | 1 normal multi-slot call | Fault after first occupancy write |

Artifact evidence in `V1_EXPERIMENT_RESULTS.json` confirms 7 scenario IDs, 30 rows per scenario, 210 rows total and 360 service calls. The artifact records the final inventory, but source code is the evidence for per-trial fixture construction.

## 5. Answers to questions A–F

### A. Generated records

| Record/model | V0 | V1 | Scope/status |
|---|---|---|---|
| `Hospital` | Direct Prisma create, line 249 | Direct Prisma create, line 297 | One shared run-level fixture |
| `Specialty` | Direct Prisma create, line 250 | Direct Prisma create, line 298 | One shared run-level fixture |
| `Doctor` | Direct Prisma create, lines 251–253 | Direct Prisma create, lines 299–301 | One shared run-level fixture |
| `DoctorWorkplace` | Direct Prisma create, lines 254–261 | Direct Prisma create, lines 302–309 | One shared run-level fixture |
| `MedicalService` | Direct Prisma create, lines 262–270 | Direct Prisma create, lines 310–318 | One shared run-level fixture, used for E6 |
| `User` | `createPatient()`, lines 101–104 | `createPatient()`, lines 112–116 | New trial-specific patient users |
| `PatientProfile` | `createPatient()`, lines 105–108 | `createPatient()`, lines 118–121 | New trial-specific profiles |
| `AppointmentSlot` | `createSlot()`, lines 111–129 | `createSlot()`, lines 124–143 | New per-scenario/per-trial slots |
| `Appointment` | Created through service calls | Created through service calls | Created only when a booking path succeeds; existing holder appointment in V0 E3–E5/E8 |
| `AppointmentSlotBooking` | Service-generated and read back/grouped at lines 164–171 | Service-generated and read back/grouped at lines 200–208 | Membership observation; not direct harness insertion |
| `PreExamSession` | Direct create in V0 E2, lines 307–314 | Helper create in V1 lines 168–177 | Trial-specific AI fixture |
| `PaymentTransaction` | Direct helper at V0 lines 216–228, E4/E5 | Not created by V1 | V0 synthetic payment-only fixture |
| `PatientHospitalLink` | Not created/found in harness | Not created/found in harness | UNVERIFIED as an application-side side effect; not a harness-created fixture |

### B. Fixture size and total inventory

The source confirms per-trial creation patterns shown in the V0/V1 tables above. The preserved artifacts confirm totals of 240 V0 trials/450 calls and 210 V1 trials/360 calls. The source does not expose a cleanup loop, so records are not proven to be recreated from a blank database each trial. Instead, slots and patient-side fixtures are newly created while the shared run-level fixture is reused.

The V1 artifact's final inventory of 180 appointments, 270 slots and 210 membership rows is artifact evidence, not a universal per-trial fixture size. It is consistent with the source scenario structure and the recorded success/failure outcomes.

### C. Initial slot state and capacity rules

**VERIFIED from source:** `createSlot()` sets `capacity` to its default `1`, `bookedCount = 0`, `isAvailable = true`, `isActive = true`, and `status = SlotStatus.AVAILABLE` (`occupancy-v0.harness.ts:111–129`; preserved V1: `124–143`). E6 creates two such slots with `part = 0` and `part = 1`; the second slot begins 30 minutes later.

The harness does not set appointment status directly for normal creates; the service implementation determines it. E2 pre-exam sessions are explicitly `COMPLETED`. V0 E4 explicitly sets an appointment expiry to one minute in the past before racing expiry and callback. V0 E5/E8 use service-created appointments and then race callbacks/cancellation.

The capacity-one statement is verified for the measured harness slot creation calls. It should not be generalized to every slot in NovaCare.

### D. Construction of concurrent conflicts

**V0 E1/E2 and other races:** the harness constructs both `attempt()` promises and passes them to `Promise.all` (for example V0 lines `292–293`, `315–319`; V1 baseline lines `350–353`). Both calls receive the same `slot.id`. E1 uses two different patients and two normal calls. E2 uses two different patients and one normal plus one AI call. The harness awaits `Promise.all` before recording slot and membership invariants (`recordTrial`).

**V1 ordered modes:** `runE2Interleaving()` at lines `250–289` uses `setOccupancyTestHooksForV1()` and `beforeClaim`. `normal_first` and `pre_exam_first` release one actor first and delay the other by 50 ms after the first claim hook; `barrier_release` waits until both actors arrive. The actual service calls are still started as two promises and awaited together.

This verifies actual asynchronous overlap and controlled interleaving, not merely sequential calls. The source does not prove OS-level simultaneous thread execution; it proves concurrent promise initiation plus the specified hook coordination.

### E. Randomness and reproducibility

Both harnesses import and call `crypto.randomUUID()` (`V0: line 1 and line 68`; preserved V1: line 1 and line 64) for user/profile fixture names, idempotency keys, service/hospital names and related identifiers. V0 also uses a random UUID for the ephemeral HMAC signing key (`line 33`).

Both harnesses use `Date.now()` for future slot and expiry timestamps. No `Math.random`, `seedrandom`, explicit random seed, deterministic UUID seed, or fixed PRNG configuration was found.

Classification: **random generation without a fixed seed**. Scenario structure and capacity values are deterministic, but generated UUIDs, HMAC key, timestamps and resulting database IDs are not reproducible byte-for-byte.

There is no evidence that an AI model generated the fixture values. The source labels them “Synthetic” and uses hard-coded test strings; that supports “harness-generated synthetic data,” not “AI-generated data.”

### F. Reset and isolation between trials

**Verified:** each scenario block calls `createSlot()` and creates new patient-side records for that trial. `recordTrial()` reads the slot and membership state after calls. V1 checks database identity before service calls and fixture writes (`assertTestDatabase`, lines `82–89`, called from `attempt()` and fixture helpers).

**Not found:** no `deleteMany`, `DELETE`, `TRUNCATE`, explicit per-trial cleanup, or transaction wrapping the entire trial appears in either harness. The harness's `finally` only disconnects Prisma. Therefore, the source does not verify reset-to-blank semantics between trials. It verifies new trial-specific records, not cleanup of old records.

**Database isolation:** artifacts and harness guards identify separate V0 and V1 databases (`127.0.0.1:55439/novacare_occupancy_test` in V0 output; `127.0.0.1:55440/novacare_occupancy_v1_test` in V1 output). This supports environment-level separation of the recorded runs. It does not prove the historical databases were empty before the first harness write or that every pre-existing row was absent.

## 6. V0/V1 comparison

| Property | V0 | V1 | Status |
|---|---|---|---|
| Synthetic fixture source | Hard-coded harness values plus UUIDs | Hard-coded harness values plus UUIDs | VERIFIED |
| Shared run fixture | Hospital, specialty, doctor, workplace, 60-min service | Same structure | VERIFIED |
| Trial slot state | capacity 1, counter 0, available/active | Same | VERIFIED |
| Normal/AI conflict | Normal and AI on same slot, different patients | Same | VERIFIED |
| Controlled barrier/order | No V0 test hook | V1 `beforeClaim` hook and barrier | VERIFIED |
| Reset between trials | New records; no cleanup found | New records; no cleanup found | PARTIALLY VERIFIED |
| Randomness | UUIDs, timestamps, ephemeral HMAC key | UUIDs, timestamps | VERIFIED |
| Fixed seed | None found | None found | VERIFIED absent |
| AI-generated data | No evidence | No evidence | UNVERIFIED/should not be claimed |
| Database separation | V0 DB target in artifact/harness | V1 DB target in artifact/harness | PARTIALLY VERIFIED from preserved evidence |

## 7. Unknown or unverified information

1. Whether the historical V0/V1 databases were completely empty before the first harness write.
2. Whether any external seed, manual SQL, `db push`, migration synchronization or pre-existing rows affected the initial database state.
3. Exact appointment status defaults, unless confirmed in the service implementation for a particular path.
4. Whether application-side service calls created any `PatientHospitalLink` as an indirect side effect; the harness itself does not create one.
5. Exact UUID/timestamp values and execution ordering of historical runs.
6. Whether “reset” in an external orchestration step existed outside the harness source; no such step is present in the inspected harness files.
7. Complete source-to-artifact equivalence for V0, because the preserved V1 source snapshot is available but the V0 artifact's original source copy is not fully preserved in the same form.

## 8. Recommended factual wording for the paper

> The experiments used harness-generated synthetic fixtures. Each harness run created one shared hospital, specialty, doctor, workplace, and 60-minute service fixture, then created new patient users/profiles and appointment slots for each scenario trial. Slots were initialized with capacity one, `bookedCount = 0`, `isAvailable = true`, `isActive = true`, and `AVAILABLE` status. The harness invoked NestJS service methods directly and used Promise-based concurrent calls; V1 additionally used test-only hooks to control selected E2 arrival orders and a shared barrier. The harness used cryptographic random UUIDs and wall-clock timestamps without a fixed seed, so fixture identifiers and exact timestamps were not byte-for-byte reproducible. The preserved V0/V1 artifacts identify separate disposable database targets, but the harness source contains no per-trial DELETE/TRUNCATE reset routine; therefore, the evidence supports newly created trial fixtures, not a claim that the database was blank before every trial. No evidence shows that the synthetic values were AI-generated.

For V0 payment scenarios, add:

> V0 used synthetic payment transactions and an ephemeral test-only HMAC callback; no external payment provider or production payment data was used. V1 did not evaluate payment.

## 9. Claims that must not be included

- “The data was AI-generated.”
- “Every trial started from an empty database” or “the database was reset with DELETE/TRUNCATE between every trial,” unless external orchestration evidence is found.
- “The fixtures were deterministic” or “the experiment used a fixed random seed.”
- “The exact historical UUIDs/timestamps can be reproduced.”
- “All records were recreated from scratch per trial,” because the shared run fixture is reused and no cleanup routine was found.
- “PatientHospitalLink was created by the harness,” because no direct creation was found.
- “All appointment statuses were explicitly initialized by the harness.”
- “The harness alone proves complete database isolation before the first write.”
- Any fixture size claim that confuses per-trial records with final experiment inventory.

## 10. Final assessment

The existing evidence is sufficient to describe the data honestly as **harness-generated synthetic fixtures** with hard-coded scenario values, cryptographic UUIDs, wall-clock timestamps, direct service invocation, and controlled Promise/barrier concurrency. It is not sufficient to claim AI generation, fixed-seed determinism, blank-database reset before every trial, or exact byte-for-byte regeneration of the historical datasets.

Overall audit status: **PARTIALLY VERIFIED**.

