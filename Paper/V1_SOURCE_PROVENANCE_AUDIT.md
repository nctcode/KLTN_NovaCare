# V1 Source Provenance Audit

Date: 2026-11-10  
Audit type: read-only provenance and implementation audit  
Scope: V1 experiment artifacts, recorded source metadata, isolated V1 source copy, current workspace, and Git metadata.

## 1. Executive conclusion

The V1 source used by the experiment is identifiable and still exists outside the current workspace:

```text
C:\Users\trinh\.copilot\session-state\c430313c-a6ee-4b4e-b2b7-aac21ab492db\v1-source\nova-care-backend
```

The path exists and the recorded V1 helper file exists at:

```text
C:\Users\trinh\.copilot\session-state\c430313c-a6ee-4b4e-b2b7-aac21ab492db\v1-source\nova-care-backend\src\modules\appointments\occupancy-claim.ts
```

The V1 source provenance is supported by both the implementation report and `V1_EXPERIMENT_RESULTS.json`. The recorded Git metadata is:

- branch: `develop`;
- Git HEAD: `585dcd8db9d612b4d35d758fe7d285b4762298b6`;
- V1 schema hash: `a5a45a82b6a672737270b807301c94ec4ef86a8a157013303900bf60d76fecb5`;
- V1 source copy path: recorded in the JSON artifact and verified to exist.

The current workspace is not the V1 source used by the experiments. The current workspace has no `occupancy-claim.ts`, and its normal/AI service hashes differ from the V1 hashes.

## 2. Provenance evidence

### 2.1 Artifact records

`V1_IMPLEMENTATION_REPORT.md` identifies the V1 copy as an experimental source copy and records the source path, branch, HEAD, schema hash, changed files, experiment database, and validation scope.

`V1_EXPERIMENT_RESULTS.json` records the same provenance under `source`:

```text
branch: develop
gitHead: 585dcd8db9d612b4d35d758fe7d285b4762298b6
isolatedV1SourceCopy: C:\Users\trinh\.copilot\session-state\c430313c-a6ee-4b4e-b2b7-aac21ab492db\v1-source\nova-care-backend
```

It also records that the experiment used direct service invocation, no HTTP transport, no Redis, and 30 repetitions per scenario.

### 2.2 Git provenance

The current repository is on `develop` at the same recorded HEAD `585dcd8db9d612b4d35d758fe7d285b4762298b6`. This establishes a Git ancestry/reference match, but it does not prove that the current working tree equals the V1 copy because the repository has substantial uncommitted changes and the V1 modifications were made in an isolated source copy.

The current repository also contains a `backup/local-work-20260918` branch, but no read-only inspection established that this branch contains the V1 helper. The strongest provenance is the explicit isolated path and file hashes recorded in the V1 artifact.

## 3. Exact V1 implementation

The shared implementation is:

```text
src/modules/appointments/occupancy-claim.ts
```

The helper exports:

- `reserveSlotOccupancy(tx, slotIds, actor)`;
- `createSlotOccupancyMemberships(tx, appointmentId, slotIds)`;
- V1-only test hooks for pre-claim barriers and post-write fault injection.

### 3.1 Normal Booking in V1

V1 `appointments.service.ts` imports both helper functions from `./occupancy-claim`. Inside the existing Prisma transaction, it calls:

```text
reserveSlotOccupancy(tx, requiredSlotIds, 'normal')
```

before appointment creation. After the appointment is created, it calls:

```text
createSlotOccupancyMemberships(tx, appointment.id, requiredSlotIds)
```

The status resolver is applied to the returned claimed slots before the transaction commits.

### 3.2 AI Pre-exam Booking in V1

V1 `pre-exam.service.ts` imports the same helper functions from:

```text
../appointments/occupancy-claim
```

Inside its Prisma transaction, it calls:

```text
reserveSlotOccupancy(tx, [selectedSlotId], 'pre_exam')
```

It then creates the appointment and status history, calls the same membership helper, and resolves slot status through `SlotStatusService`.

Therefore, the V1 source does satisfy the claim that Normal Booking and AI Pre-exam Booking use the same occupancy helper and membership operation.

## 4. V1 mechanism verification

| Component | V1 evidence | Verification level |
|---|---|---|
| Shared helper | `src/modules/appointments/occupancy-claim.ts` is present and referenced by both services | Direct source verification |
| Prisma transaction | Both creation methods call `prisma.$transaction` and execute helper/appointment/history/membership/status writes through `tx` | Direct source verification |
| Row-level locking | Helper executes `SELECT * FROM "appointment_slots" WHERE id = ... FOR UPDATE` for each ordered slot | Direct source verification |
| Stable slot order | Helper deduplicates and sorts slot IDs before locking and membership creation | Direct source verification |
| Post-lock validation | Locked row is checked for active, available, `AVAILABLE`, and below-capacity state | Direct source verification |
| Guarded counter update | SQL update requires `bookedCount < capacity`, active, available, and `AVAILABLE`, then uses `RETURNING *` | Direct source verification |
| Membership | Shared helper creates `AppointmentSlotBooking` rows in sorted slot order | Direct source verification |
| Rollback | All writes occur inside the Prisma transaction; harness injects failure after first occupancy write | Source plus artifact evidence |
| Duplicate membership guard | Schema has unique `(appointmentId, slotId)` | Direct schema verification |
| Test barriers | V1 helper exposes `beforeClaim` and `afterWrite` hooks; harness uses controlled E2 modes and fault injection | Direct source verification |

## 5. Recorded V1 hashes

The following hashes are recorded in `V1_EXPERIMENT_RESULTS.json` and repeated in `V1_IMPLEMENTATION_REPORT.md`:

| V1 file | Recorded SHA-256 |
|---|---|
| `prisma/schema.prisma` | `a5a45a82b6a672737270b807301c94ec4ef86a8a157013303900bf60d76fecb5` |
| `src/modules/appointments/appointments.service.ts` | `a1125e0cad2989aba91cd98fc9c648fccaa6be58efe9ef9c9e7e5bb33bf4aaf5` |
| `src/modules/appointments/occupancy-claim.ts` | `4dbb1d0706f780b1cad36df21cd2dec6fefd11c7e23f388a1da7a30adf06d92c` |
| `src/modules/pre-exam/pre-exam.service.ts` | `b66f45cfa912fe9c1c61efe5fd7948c6c82df301b6e299eb878fff07148bd09f` |
| `src/modules/pre-exam/pre-exam.module.ts` | `91d2b81845055140e36d5a3de8478627d2d590afd0249e861a8737d4b96fa54d` |
| `src/modules/schedules/slot-status.service.ts` | `efaeeb3bfe8f3260b7dc13e9347893cd70829cb7ef8600ecedb96f43e11098e2` |
| `test/occupancy-v1.harness.ts` | `66708f13419bf049d93e9c9702e490071b12e5f760dcd5be423eb576e32d6d0d` |

## 6. V1 versus current workspace

| Area | Recorded V1 source | Current workspace | Difference |
|---|---|---|---|
| Shared helper | `occupancy-claim.ts` exists | File not present in current workspace | V1-only helper is missing |
| Normal booking | Calls shared helper before appointment creation | Uses local locking and updates; no shared helper | Different implementation |
| AI booking | Calls shared helper inside transaction | Reads slot before transaction, then creates appointment and increments counter | Current path lacks V1 locking/guard/membership protocol |
| Row lock | Per-slot `FOR UPDATE` in helper | Normal path has `FOR UPDATE`; AI path not found | Asymmetric current behavior |
| Guarded update | Conditional SQL `UPDATE ... WHERE bookedCount < capacity ... RETURNING` | Current AI increment is unconditional | V1 protection absent in current AI path |
| Membership | Both paths call shared membership helper | Normal path writes membership; current AI path does not | Representation mismatch |
| Slot order | Distinct IDs sorted before lock | Current normal raw lock does not visibly use the V1 helper/order | Cannot equate current source with V1 |
| Module wiring | Pre-exam module provides `SlotStatusService` for V1 path | Current module differs from V1 source | Hash and dependency graph differ |

### Hash comparison

Current workspace hashes observed during this audit:

| Current workspace file | Current SHA-256 | V1 recorded SHA-256 | Match |
|---|---|---|---|
| `prisma/schema.prisma` | `a5a45a82b6a672737270b807301c94ec4ef86a8a157013303900bf60d76fecb5` | same | Yes |
| `src/modules/appointments/appointments.service.ts` | `0de987d992ccfe40d15757db7b0a8785ffa38ed3e81c1f66a85f6c6c421be8da` | `a1125e0c...` | No |
| `src/modules/pre-exam/pre-exam.service.ts` | `8b3fc7c03bbb18a43e3859dce9e877ce9f5875945ef535282c1285e77b2a3e0f` | `b66f45cf...` | No |
| `src/modules/pre-exam/pre-exam.module.ts` | `3aa6063dde1800b767a2af904bb6ed7ea36bf1b38c34a57904630cb28b8a0fea` | `91d2b818...` | No |
| `test/occupancy-v0.harness.ts` | `540f484b70a367b44dd9379b5840720fac72420adb54f3686ecd06dc5975bc87` | V1 harness differs | No |

The matching schema hash and non-matching service hashes show that the V1 experiment used the same schema snapshot but a different application source copy.

## 7. Reproducibility assessment

### Source availability

**Verified available.** The recorded V1 source directory and `occupancy-claim.ts` exist at the artifact-recorded path.

### Source identification

**Strongly verified.** Branch, Git HEAD, source path, schema hash, per-file hashes, V1 harness path, and experiment database identity are recorded in the artifacts.

### Exact experiment replay

**Potentially reproducible, not replayed in this audit.** The V1 source and `test/occupancy-v1.harness.ts` are present, and the harness documents the required isolated database guard, repetitions, interleavings, and fault injection. A replay would still require the original environment/dependencies, a disposable PostgreSQL 16.14 database at the recorded loopback target, and the source-copy configuration used by the harness.

### Result provenance

**Artifact-supported, not independently rerun here.** The 210-trial result, 120 E2 trials, 30 rollback trials, database identity, and source hashes are recorded in JSON/Markdown artifacts. This audit did not alter or rerun those results.

## 8. Evidence still missing

1. A committed Git object or tag containing the V1 helper and all V1 source changes was not located in the current repository history; the isolated source directory and hashes are the primary evidence.
2. The V1 source copy has not been independently rebuilt or replayed in this audit.
3. The original disposable PostgreSQL database is not treated as available evidence; only its recorded identity and results remain.
4. The exact dependency lockfile/environment used inside the V1 source copy was not independently compared against the current installed environment.
5. The recorded V0 working-tree status hash is not itself a cryptographic source tree manifest unless the generating procedure and all inputs are retained.

## 9. Final provenance statement

The evidence is sufficient to identify a concrete V1 source copy and verify, by direct read-only inspection, that both Normal Booking and AI Pre-exam Booking used the shared occupancy helper with row locks, sorted lock order, guarded counter updates, transaction-scoped writes, and `AppointmentSlotBooking` membership. The current workspace is a different source state and should not be used as a byte-for-byte substitute for the measured V1 implementation. The V1 experiments are source-reproducible in principle from the retained copy and harness, but were not rerun during this read-only audit.
