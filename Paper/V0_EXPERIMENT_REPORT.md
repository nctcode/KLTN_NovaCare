# NovaCare occupancy V0 experiment report

## 1. Executive summary

V0 exercised the current booking-related service methods against a newly created, loopback-only PostgreSQL 16 database containing synthetic data. Each of E1–E8 ran 30 times: **240 scenario trials and 450 service calls**. The test did not use an HTTP server, Redis, or a real payment provider.

The most consequential runtime result is E2: a normal booking and an AI pre-exam booking both succeeded against a slot with capacity 1 in **30/30 trials**. Each trial ended at `bookedCount = 2`, with one membership row. This is direct evidence of over-capacity and a counter/membership discrepancy for this tested source snapshot and call interleaving.

Other repeatable observations were:

- E4 ended in `PAID` appointment/payment state with `bookedCount = 0` after expiry processed the appointment in **30/30 trials**. The callback was synthetic. Whether a late successful payment should restore/retain occupancy is an unresolved business rule; the state tuple itself is a database observation.
- E5 processed both concurrent copies of a successful callback, producing two `PAID` history rows and two email plus two push queue attempts in **30/30 trials**.
- E3 and E8 ended with a slot marked `BLOCKED` and unavailable despite the synthetic fixture having no separate blocking rule; E8 also created two cancellation history rows in all trials.
- E6's successful multi-slot path consistently updated both tested slots and memberships. No partial-failure injection was performed, so rollback atomicity was not established.
- E1's two normal create calls were serialized sufficiently in these trials: one succeeded and one received a service-level conflict in every trial; no over-capacity was observed.

Across 450 measured service invocations, **360 succeeded and 90 failed**. The 90 failures were expected service conflicts in E1, E3, and E7; no deadlock/transaction-conflict codes were observed. HTTP 5xx was not measured because no HTTP requests were made. Latency over service calls (not setup, database readback, or end-to-end HTTP) was average **28.75 ms**, P50 **22.47 ms**, and P95 **57.46 ms**.

These are V0 observations, not proof about production deployment or every possible interleaving. Business-policy questions are kept separate from measurable state and source behavior.

## 2. Baseline, environment, and scope

### Source snapshot

- Git branch: `develop`
- Git HEAD: `585dcd8db9d612b4d35d758fe7d285b4762298b6`
- The working tree was already dirty and included unrelated uncommitted changes. It was preserved; no reset, checkout, stash, or commit was performed.
- The experiment ran from an independent source copy in the session workspace. The exact status text/hash and SHA-256 hashes of exercised files are recorded in `V0_EXPERIMENT_RESULTS.json`.
- No booking business source was changed for the experiment. The rerunnable harness is a new test-only file: [occupancy-v0.harness.ts](./nova-care-backend/test/occupancy-v0.harness.ts).

### Database and safety

- Database: `novacare_occupancy_test`, PostgreSQL 16.14, bound only to `127.0.0.1:55439`.
- Container: `novacare_occupancy_v0_test`. It was created specifically for this test; the pre-existing local PostgreSQL container was not used.
- Fixtures used synthetic users, patient profiles, hospital, specialty, doctor, workplace, slots, service, appointments, and payment records. No patient data or payment provider was used.
- Payment callbacks used a test-only ephemeral HMAC key. Redis was not used.
- Ten repository migrations applied successfully to the empty test database. The migrations-only schema did not fully match the copied working-tree Prisma schema, so `prisma db push --accept-data-loss` was then used **only on this newly created empty test database** to synchronize it with that Prisma schema. Prisma reported potential unique-constraint additions; there were no pre-existing rows at that point. Results therefore apply to the Prisma-schema-synchronized test database, not to migrations-only schema state.
- The harness verifies the database name and exact loopback port before writing.

### Execution and metrics

The harness invoked the actual service methods directly and started concurrent calls with `Promise.all`. It queried PostgreSQL after each trial. It did not start NestJS, exercise HTTP routing/authentication, or establish a deterministic barrier at the exact database write point. Each trial used independent synthetic records.

Average, P50, and P95 in the table are calculated from each measured service invocation's raw latency. Percentiles use nearest-rank (`ceil(p * n)`). The exact per-call latencies and database observations are in the JSON file. `http_5xx` is null/not measured, not zero.

The following fields have deliberately limited meanings:

- `over_capacity` directly checks whether a synthetic slot's final `bookedCount` exceeds its `capacity`.
- `counter_membership_inconsistent` compares final counters and historical membership counts with scenario-operation expectations only where the harness has such an expectation. It does **not** treat raw `AppointmentSlotBooking` row count as universal active occupancy truth.
- `slot_state_inconsistent` compares `isAvailable` and `status` against the synthetic fixture's simple expected state (`bookedCount < capacity` means `AVAILABLE`/available; otherwise `FULL`/unavailable). All test slots were active and had no separate blocking rule. This is a fixture-specific signal, not a general policy judgment.
- `appointment_payment_occupancy_signal` is the explicit E4 state-tuple signal; it is not itself a declaration of approved payment/occupancy policy.
- `duplicate_side_effects` records duplicate status-history and/or notification queue attempts in E5 and duplicate cancellation history in E8.
- `deadlock_or_transaction_conflict` counts recognized database conflict codes; service-level 409 conflicts are reported as failed calls, not database deadlocks.

## 3. Results by scenario

| Scenario | Trials | Calls | Success | Failed | Over capacity | Counter/membership mismatch | Slot-state signal | Payment/occupancy signal | Duplicate side effects | Deadlocks / transaction conflicts | Avg ms | P50 ms | P95 ms |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| E1 Concurrent Create | 30 | 60 | 30 | 30 | 0 | 0 | 0 | 0 | 0 | 0 | 49.08 | 45.66 | 70.41 |
| E2 Normal vs AI Pre-exam | 30 | 60 | 60 | 0 | 30 | 30 | 0 | 0 | 0 | 0 | 49.13 | 44.12 | 76.77 |
| E3 Create vs Cancel | 30 | 60 | 30 | 30 | 0 | 0 | 30 | 0 | 0 | 0 | 22.86 | 22.93 | 37.99 |
| E4 Payment vs Expiry | 30 | 60 | 60 | 0 | 0 | 0 | 30 | 30 | 0 | 0 | 13.33 | 12.37 | 19.30 |
| E5 Duplicate Payment | 30 | 60 | 60 | 0 | 0 | 0 | 0 | 0 | 30 | 0 | 13.09 | 13.09 | 18.71 |
| E6 Multi-slot Booking | 30 | 30 | 30 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 47.11 | 41.52 | 60.76 |
| E7 Capacity Reduction vs Create | 30 | 60 | 30 | 30 | 0 | 0 | 30 | 0 | 0 | 0 | 14.38 | 15.69 | 21.66 |
| E8 Duplicate Cancel | 30 | 60 | 60 | 0 | 0 | 0 | 30 | 0 | 30 | 0 | 30.17 | 31.33 | 44.34 |

Across all scenarios: 240 trials, 450 calls, 360 successful calls, 90 failed calls, 0 observed over-capacity trials outside E2 (E2 had 30), 0 negative counters, and 0 recognized database deadlock/transaction-conflict codes. The 90 service failures were conflicts in E1, E3, and E7 (one losing create per trial). HTTP 5xx is not applicable to this direct-service run.

## 4. Runtime observations and interpretation

### E1 — Concurrent normal create

Every trial produced one successful normal booking and one service-level conflict. The database readback was one occupied unit for capacity 1 with one membership row. No over-capacity was observed for two normal create calls in this test. This does not establish safety for other booking actors or deployment topologies.

### E2 — Normal create vs AI pre-exam create

Both calls succeeded in every trial. Each slot ended with capacity 1, `bookedCount = 2`, and one historical membership row. This is a reproducible over-capacity database observation and a counter/membership discrepancy relative to the two successful booking operations. The source paths differ: normal create uses slot booking membership and counter updates in [appointments.service.ts](./nova-care-backend/src/modules/appointments/appointments.service.ts#L26), while AI pre-exam creation checks and increments the slot through its separate path in [pre-exam.service.ts](./nova-care-backend/src/modules/pre-exam/pre-exam.service.ts#L201). This finding is specific to the tested code snapshot and concurrency.

### E3 — Create vs cancellation

In every trial, cancellation succeeded and the competing create returned a conflict; the create did not retry after cancellation released the unit. The final counter was zero, and the historical membership row remained. In all 30 trials the slot's final `status` was `BLOCKED` and `isAvailable` was false, which differed from the simple expected state for this unblocked synthetic slot. The cancellation path reads memberships and updates slot state in [appointments.service.ts](./nova-care-backend/src/modules/appointments/appointments.service.ts#L546). This experiment did not run duplicate cancellation here.

### E4 — Payment callback vs expiry

Every trial ended with appointment status `PAID`, payment status `PAID`, `bookedCount = 0`, and one retained historical membership row; expiry reported processing one appointment. The slot was `FULL` while `isAvailable` was true, producing the fixture-specific slot-state signal in every trial. The callback and expiry both completed successfully at the service-call level.

This proves the observed race can produce that database tuple in this experiment. It does **not** decide whether a late payment should be refunded, rejected, re-occupy capacity, or trigger another workflow. That is an unresolved business decision. Relevant code paths are `expirePendingAppointments` in [appointments.service.ts](./nova-care-backend/src/modules/appointments/appointments.service.ts#L770) and `handleIpn` in [payments.service.ts](./nova-care-backend/src/modules/payments/payments.service.ts#L96).

### E5 — Duplicate payment callback

Two concurrent deliveries of the same synthetic successful callback both completed in every trial. Appointment and payment ended `PAID`, while the slot counter and membership remained at one. However, each trial created two `PAID` appointment-history rows and attempted two email and two push notification jobs. This is repeatable duplicate processing/side-effect evidence; it did not create an occupancy counter discrepancy in these trials. The early already-paid check and history/queue operations are in [payments.service.ts](./nova-care-backend/src/modules/payments/payments.service.ts#L129).

### E6 — Multi-slot booking

All 30 60-minute normal bookings succeeded against two consecutive synthetic 30-minute slots. Both counters and both membership counts were one after each trial. No fault was injected between slot updates; these successful runs do not prove rollback behavior if a later slot or appointment operation fails.

### E7 — Capacity reduction vs create

In all 30 trials, capacity reduction to zero succeeded and create returned a conflict. No over-capacity was observed. The final slot had `capacity = 0`, `bookedCount = 0`, `isAvailable = false`, and `status = AVAILABLE`; this differs from the fixture's derived expected state. Capacity zero may or may not be an allowed business value and requires policy clarification. This execution did not produce the alternate interleaving where create wins. The update implementation is in [appointment-slots.service.ts](./nova-care-backend/src/modules/appointment-slots/appointment-slots.service.ts#L263).

### E8 — Duplicate cancellation

Both cancellation calls completed successfully in all 30 trials. Each trial ended with appointment status `CANCELLED`, counter zero, one retained historical membership row, and two cancellation history rows. The synthetic slot ended `BLOCKED` and unavailable in all trials. Thus duplicate history/slot-state effects were observed; a second counter decrement below zero was not observed.

## 5. Source findings vs runtime and unresolved policy

| Classification | Finding |
|---|---|
| Runtime + database observation | E2 produced `bookedCount = 2` against capacity 1 in 30/30 trials when normal and AI pre-exam creation competed. |
| Runtime + database observation | E4 produced `PAID` appointment/payment with zero slot counter after expiry processed the appointment in 30/30 trials. Business handling of late payment remains unresolved. |
| Runtime + database observation | E5 produced duplicate payment history and notification attempts in 30/30 trials. |
| Runtime + database observation | E8 produced duplicate cancellation history in 30/30 trials; no negative counter was observed. |
| Runtime + database observation | E3, E4, E7, and E8 each showed the fixture-specific slot-state signal in all 30 trials. |
| Runtime + database observation | E1 had one winner/one conflict in each trial; E6's two slots were both updated on all successful runs; E7's capacity reduction consistently won in this run. |
| Source-level, not independently established for all schedules | Booking actors use separate code paths for normal and AI creation; payment and expiry have independent lifecycle operations; cancellation and capacity updates modify related state through their respective service code. See source links above. |
| Not verified | HTTP status distribution, actual API/auth path, production or multi-instance behavior, Redis/BullMQ runtime, real payment provider retry/ACK behavior, and database state in any non-test environment. |
| Not established by this experiment | Multi-slot rollback on injected failure; all possible payment/expiry/cancel orderings; whether historical memberships should be retained; whether capacity zero or each observed status tuple violates an approved business policy. |

No measured result is inferred from source alone. Conversely, a source-level race possibility is not labeled a runtime failure unless the database readback reproduced it.

## 6. Reproduction and artifacts

Artifacts:

- [V0_EXPERIMENT_RESULTS.json](./V0_EXPERIMENT_RESULTS.json) — per-trial database observations, raw per-call latencies, errors, environment, and source hashes.
- [V0_EXPERIMENT_RESULTS.csv](./V0_EXPERIMENT_RESULTS.csv) — one row per trial; 240 data rows plus header.
- [occupancy-v0.harness.ts](./nova-care-backend/test/occupancy-v0.harness.ts) — rerunnable direct-service harness.

The run used a separate copied backend source tree and a dedicated PostgreSQL test container. To rerun, first create a fresh database/container using the same loopback-only port and database name, apply the copied repository migrations, then synchronize that empty test database to the copied `prisma/schema.prisma` if necessary. Set `DATABASE_URL` to that isolated database only, set `V0_REPETITIONS=30`, and run from the backend copy:

```powershell
npx ts-node -r tsconfig-paths/register test/occupancy-v0.harness.ts
```

Set `V0_OUTPUT_DIR` to the desired results directory. The harness refuses any connection not matching `127.0.0.1:55439/novacare_occupancy_test`; do not weaken that guard to point at a development or production database. The test-only HMAC signing key is generated in memory for each process.

## 7. Conclusion and readiness

- **Experiments executed:** E1–E8, 30 trials each; 240 trials and 450 service invocations.
- **Repeatably reproduced:** E2 over-capacity; E4 paid-after-expiry/zero-counter state tuple; E5 duplicate payment history and notifications; E3/E8 slot-state signal; E8 duplicate cancellation history.
- **Not reproduced:** negative counter or database deadlock/transaction conflict; over-capacity in E1 or E7.
- **Not established:** atomic rollback of multi-slot failure, HTTP behavior, production topology, and real provider callback behavior.
- **V0 limitations:** separate normal and AI booking paths can contend inconsistently; duplicate payment/cancellation calls repeat some side effects; expiry and payment can leave an observed state tuple whose business meaning is undecided; slot `status` and `isAvailable` may not agree with the synthetic fixture's derived availability after these operations.
- **V1 readiness:** the results provide a concrete correctness baseline for an isolated V1 prototype, but they are **not sufficient to implement or claim a final business contract**. Before comparing V1 with V0, approve occupancy treatment for AI pre-exam, expiry/late payment, cancellation/retry, capacity reduction including zero, multi-slot failure behavior, and the authoritative slot availability/status rules. Then use the same schema baseline, fixture rules, repetitions, result checks, and concurrency start strategy for both versions; add injected rollback/fault tests and HTTP-level tests as separate scopes.
