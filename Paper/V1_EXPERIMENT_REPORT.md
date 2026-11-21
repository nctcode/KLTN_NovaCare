# V1 unified occupancy experiment report

## 1. Executive summary

V1 tested a PostgreSQL row-locking occupancy claim shared by normal and AI pre-exam appointment creation. It ran against a fresh synthetic PostgreSQL 16 database and a separate V1 source copy made from the V0 snapshot. No original booking source, V0 source copy, V0 result, schema, or migration was modified.

The final run completed **210 trials and 360 service calls**:

- E1 normal create vs normal create: 30 trials.
- E2 normal vs AI pre-exam: 30 baseline trials plus 90 controlled-interleaving trials.
- E6 multi-slot success: 30 trials.
- E6 injected failure after the first counter write: 30 trials.

V1 had **0 over-capacity observations, 0 negative counters, 0 counter/membership mismatches, 0 duplicate membership rows, and 0 recognized database deadlocks/serialization conflicts**. All 120 E2 trials had exactly one successful booking and one service-level 409 conflict. Normal and AI pre-exam winners followed the controlled priority in the corresponding test variants. The simultaneous barrier variant split winners 16/14.

The fault-injection test verified transaction rollback in **30/30 trials**: both slot counters and memberships remained zero, with no appointment or status-history row persisted for the affected patient.

V1 is not claimed to be faster. Comparable V1 E1 and E6 latencies were descriptively lower than V0 in this local run, but the experiment is not a performance benchmark and does not support a performance-improvement claim. E2 has different success/failure outcomes in V0 and V1, so its latency is not an apples-to-apples performance comparison.

## 2. Baseline, environment, and comparability

### Source baseline

- Git branch: `develop`
- Git HEAD: `585dcd8db9d612b4d35d758fe7d285b4762298b6`
- V0 working-tree status hash: `AFE46AD7117743BCEB0A3934B4A27A91B1702D0B3F78D040EA6F86B449ACAC68`
- The V1 copy was created from the V0 isolated source copy. All seven V0 source hashes from `V0_EXPERIMENT_RESULTS.json` were verified before editing the V1 copy.
- V1 implementation and harness are in the isolated session copy recorded in the JSON file. The repository's existing uncommitted changes were preserved.

### Database

- V1 database: `novacare_occupancy_v1_test`, PostgreSQL 16.14, loopback-only `127.0.0.1:55440`.
- V0 database: `novacare_occupancy_test`, PostgreSQL 16.14, loopback-only `127.0.0.1:55439`.
- Each run used a newly created, separate disposable PostgreSQL container and synthetic fixture rows only.
- Both used the same Prisma schema hash: `a5a45a82b6a672737270b807301c94ec4ef86a8a157013303900bf60d76fecb5`.
- In both runs, repository migrations were applied to an empty database and then Prisma schema synchronization was performed on that isolated database only. Thus comparison is against the same schema-synchronized Prisma snapshot, not migrations-only state.
- No production/development DB, Redis, live payment provider, or actual patient data was used.

### Harness and metric definitions

Both experiments directly invoked service methods, not HTTP routes. Both used synthetic users/profiles, a synthetic hospital/workplace, slot capacity one, 30 repetitions, and database readback after each trial. The measurement unit is service-call latency, with setup/readback excluded, average over individual calls, and nearest-rank P50/P95 (`ceil(p*n)`). `http_5xx` is null/not measured, not zero.

V1 additionally checked the database identity before each test fixture write and service call. Controlled E2 interleaving variants deliberately gate calls around the shared occupancy claim; their latency includes that test-only wait and is reported separately, not compared to V0 latency. The V1 fault scenario includes a forced exception and is also excluded from performance comparison.

Membership consistency is assessed against successful scenario operations. The experiment also directly detects duplicate `(appointmentId, slotId)` rows. It does not interpret historical membership as universal occupancy truth outside these isolated fixtures.

## 3. V1 results

| Scenario | Trials | Calls | Success | Failed | Over capacity | Negative counter | Counter/membership mismatch | Missing/extra membership | Duplicate membership | Rollback verified | Deadlocks / transaction conflicts |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| E1 Concurrent normal create | 30 | 60 | 30 | 30 | 0 | 0 | 0 | 0 | 0 | N/A | 0 |
| E2 Normal vs AI, baseline | 30 | 60 | 30 | 30 | 0 | 0 | 0 | 0 | 0 | N/A | 0 |
| E2 Controlled normal-first | 30 | 60 | 30 | 30 | 0 | 0 | 0 | 0 | 0 | N/A | 0 |
| E2 Controlled AI-first | 30 | 60 | 30 | 30 | 0 | 0 | 0 | 0 | 0 | N/A | 0 |
| E2 Shared barrier release | 30 | 60 | 30 | 30 | 0 | 0 | 0 | 0 | 0 | N/A | 0 |
| E6 Multi-slot success | 30 | 30 | 30 | 0 | 0 | 0 | 0 | 0 | 0 | N/A | 0 |
| E6 Fault after first counter write | 30 | 30 | 0 | 30 | 0 | 0 | 0 | 0 | 0 | 30/30 | 0 |
| **Total** | **210** | **360** | **180** | **180** | **0** | **0** | **0** | **0** | **0** | **30/30 injected failures** | **0** |

The 150 non-injected failed calls were expected occupancy conflicts (HTTP-style service exception 409): 30 in E1 and 120 across the four E2 test variants. The other 30 failures were the deliberate injected transaction faults. No P2002 booking-code conflicts or PostgreSQL deadlocks were observed in the final measured run.

### E2 interleaving results

| E2 mode | Trials | Normal wins | AI wins | Over-capacity | Counter/membership mismatch |
|---|---:|---:|---:|---:|---:|
| Baseline concurrent start | 30 | 0 | 30 | 0 | 0 |
| Normal-first controlled gate | 30 | 30 | 0 | 0 | 0 |
| AI-first controlled gate | 30 | 0 | 30 | 0 | 0 |
| Both released at barrier | 30 | 16 | 14 | 0 | 0 |

The controlled winner ordering confirms that either booking actor can win, while the other observes the occupied slot and conflicts. The simultaneous split is a result of these 30 local interleavings, not a fairness guarantee.

### Multi-slot rollback observation

In every injected-fault trial, the harness threw immediately after the first guarded slot counter update, before appointment and membership insertion. PostgreSQL readback found both slot counters at zero, no membership rows for either slot, no appointment for the test patient, and no appointment status-history row. This establishes rollback for this injected point; it does not test a failure specifically during the membership insert or slot-status resolver.

## 4. V0 vs V1 comparison

The table below compares only corresponding scenarios with matching schema, fixture shape, repetition count, call-level latency semantics, and direct service invocation.

| Scenario | Version | Trials | Calls | Success | Failed | Over-capacity trials | Counter/membership mismatch trials | Avg ms | P50 ms | P95 ms |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| E1 Concurrent normal create | V0 | 30 | 60 | 30 | 30 | 0 | 0 | 49.08 | 45.66 | 70.41 |
| E1 Concurrent normal create | V1 | 30 | 60 | 30 | 30 | 0 | 0 | 42.17 | 38.43 | 54.37 |
| E2 Normal vs AI pre-exam | V0 | 30 | 60 | 60 | 0 | 30 | 30 | 49.13 | 44.12 | 76.77 |
| E2 Normal vs AI pre-exam | V1 | 30 | 60 | 30 | 30 | 0 | 0 | 22.03 | 19.70 | 39.81 |
| E6 Multi-slot success | V0 | 30 | 30 | 30 | 0 | 0 | 0 | 47.11 | 41.52 | 60.76 |
| E6 Multi-slot success | V1 | 30 | 30 | 30 | 0 | 0 | 0 | 44.64 | 42.51 | 55.49 |

The E2 success counts are intentionally different: V0 accepted both normal and AI bookings in every trial, while V1 accepted one and rejected the competing claim. Therefore E2 latency is not a comparable performance workload. E1/E6 measured latency differences are descriptive only; this was not a controlled benchmark and no performance improvement is claimed.

V1's full run included more scenarios and controlled waits. Across all 360 calls, including the barrier and fault-injection tests, aggregate latency was average 40.83 ms, P50 35.40 ms, P95 84.66 ms. This overall figure must not be compared to V0's aggregate because the scenario mix differs.

## 5. Runtime verification and database readback

The final V1 test database read-only inventory returned:

- Appointments: 180.
- Appointment slots: 270.
- `AppointmentSlotBooking` rows: 210.
- Slots where `bookedCount > capacity`: 0.
- Slots where `bookedCount < 0`: 0.

For the tested successful operations, the number of memberships matched the number of accepted slot claims, including AI pre-exam appointments. All 30 multi-slot successful trials had both slots incremented and both membership rows present. All 30 fault trials rolled back.

The result JSON contains each trial's final slot state, membership counts, per-call latency array, error information, source hashes, and database identity. The CSV contains one row per trial.

## 6. Development finding and final-run status

An initial one-repetition smoke run exposed a deadlock in the first V1 ordering: appointment insertion took a foreign-key key-share lock before both booking actors attempted `FOR UPDATE`. The implementation was changed so both flows acquire and update occupancy rows before appointment insertion, with all writes still inside the same transaction. The smoke run was discarded and the measured run used a fresh database. After this correction, the 210-trial measured run reported zero deadlocks or serialization conflicts.

This correction and the smoke finding are documented rather than hidden; the earlier smoke data is not included in the measured V1 result artifacts.

## 7. Scope exclusions and unresolved policy

Not implemented or claimed fixed:

- Payment/expiry races and late successful payment.
- Refund behavior.
- Duplicate payment callback processing or notification side effects.
- Cancellation/expiry release and duplicate cancellation.
- Capacity reduction, including capacity zero.
- Patient overlapping appointments.
- Retention/removal rules for cancelled or expired membership rows.
- Production HTTP/API behavior, provider retries/ACK, deployment topology, or multi-instance runtime.
- Multi-slot failure points other than the injected post-first-counter-update fault.

These policies remain unresolved and outside the E2 occupancy fix. Redis was neither needed nor used as a correctness mechanism.

## 8. Reproduction

Use the isolated V1 copy recorded in `V1_EXPERIMENT_RESULTS.json`, a newly created PostgreSQL 16 test container bound only to `127.0.0.1:55440`, and database name `novacare_occupancy_v1_test`. Apply the source-copy migrations, then synchronize only that empty test database to its Prisma schema as was done here.

Set `DATABASE_URL` to that exact dedicated database, set `V1_REPETITIONS=30` and `V1_OUTPUT_DIR` to an output location, and provide the baseline metadata variables used by the harness. From the V1 copy:

```powershell
npx ts-node -r tsconfig-paths/register test/occupancy-v1.harness.ts
```

The harness refuses a URL whose host, port, or database name differs. Do not weaken this check or point it to any development or production database.

## 9. Conclusion

For the tested E2 interleavings, the unified PostgreSQL claim mechanism eliminated the V0 over-capacity outcome and kept counters and membership rows aligned. The injected multi-slot failure also demonstrated transaction rollback at the tested point. This is runtime evidence for an isolated V1 prototype, not proof for production or all booking writers. A production change would require separate review of test-hook removal, database schema parity, all occupancy writers, cancellation/expiry/payment semantics, and deployment-level behavior.
