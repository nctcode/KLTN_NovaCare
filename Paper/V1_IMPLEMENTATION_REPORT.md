# V1 unified occupancy implementation report

## 1. Scope and isolation

V1 is an experimental source copy, not a production change. It was created from the V0 source copy at:

`C:\Users\trinh\.copilot\session-state\c430313c-a6ee-4b4e-b2b7-aac21ab492db\v0-source\nova-care-backend`

The V1 copy is at:

`C:\Users\trinh\.copilot\session-state\c430313c-a6ee-4b4e-b2b7-aac21ab492db\v1-source\nova-care-backend`

The V0 copy was verified against all seven source hashes recorded in `V0_EXPERIMENT_RESULTS.json` before the V1 edits. The V1 Prisma schema hash remains identical to V0 (`a5a45a82b6a672737270b807301c94ec4ef86a8a157013303900bf60d76fecb5`). No source, schema, migration, configuration, or V0 result file in the repository was edited for V1. Existing unrelated working-tree changes were preserved.

Baseline Git metadata inherited from the V0 experiment:

- Branch: `develop`
- HEAD: `585dcd8db9d612b4d35d758fe7d285b4762298b6`
- V0 working-tree status hash: `AFE46AD7117743BCEB0A3934B4A27A91B1702D0B3F78D040EA6F86B449ACAC68`

## 2. Implemented mechanism

Both normal appointment creation and AI pre-exam creation now call the same occupancy reservation and membership operations in the V1 source copy.

The shared implementation is in:

- `src/modules/appointments/occupancy-claim.ts`
- `src/modules/appointments/appointments.service.ts`
- `src/modules/pre-exam/pre-exam.service.ts`
- `src/modules/pre-exam/pre-exam.module.ts`

### Claim order and transaction boundary

Within each existing Prisma transaction:

1. Determine the slot IDs for the booking.
2. Sort distinct slot IDs in a stable order.
3. For each slot, issue `SELECT ... FOR UPDATE`.
4. Read the row returned after acquiring the lock.
5. Reject the claim unless the slot remains active, available, `AVAILABLE`, and below capacity.
6. Increment `bookedCount` and `version` using a conditional SQL `UPDATE ... WHERE bookedCount < capacity AND isActive AND isAvailable AND status = 'AVAILABLE' RETURNING *`.
7. Create the appointment and its existing status-history row.
8. Insert the corresponding `AppointmentSlotBooking` row or rows.
9. Resolve and persist slot status/availability using the existing `SlotStatusService`.
10. Commit all writes together; any thrown error rolls the transaction back.

The counter update precedes appointment creation intentionally. In the first smoke run, creating the appointment first acquired a foreign-key key-share lock on the slot; concurrent transactions then attempted `FOR UPDATE`, and PostgreSQL reproduced a deadlock. Moving the shared reservation before appointment creation removed that lock-upgrade cycle. The ordering change is part of the occupancy fix; it also keeps the existing normal booking-code generation behind slot serialization.

Multi-slot row locks are acquired in sorted ID order, so overlapping V1 multi-slot claims use a consistent lock order. Counter updates and membership inserts stay inside the appointment transaction. The database's existing unique constraint on `(appointmentId, slotId)` remains the duplicate-membership guard.

### Path-specific effects

- **Normal creation:** replaces its separate per-slot membership/counter updates with the shared reservation and membership helper. Existing appointment status, pricing, idempotency, and payment flow are otherwise unchanged.
- **AI pre-exam creation:** removes the pre-transaction capacity decision as authoritative; capacity is rechecked under the shared lock. It now writes the occupancy membership that this path previously omitted and updates slot status through the existing resolver.
- **Dependency registration:** adds `SlotStatusService` to the pre-exam module providers so the AI path can use the same slot-state resolver.
- **Payment:** no payment source was changed.
- **Schema/migrations:** no schema or migration was changed.
- **Redis:** not added or used.

The V1-only occupancy helper exposes test hooks to control pre-claim barriers and inject a failure after a counter write. These hooks are for this isolated prototype/harness only and must be removed or replaced with a test seam before any production adaptation.

## 3. Source changes and hashes

V1 source hashes are recorded in `V1_EXPERIMENT_RESULTS.json`. Key entries:

| File in isolated V1 copy | SHA-256 |
|---|---|
| `prisma/schema.prisma` | `a5a45a82b6a672737270b807301c94ec4ef86a8a157013303900bf60d76fecb5` |
| `src/modules/appointments/appointments.service.ts` | `a1125e0cad2989aba91cd98fc9c648fccaa6be58efe9ef9c9e7e5bb33bf4aaf5` |
| `src/modules/appointments/occupancy-claim.ts` | `4dbb1d0706f780b1cad36df21cd2dec6fefd11c7e23f388a1da7a30adf06d92c` |
| `src/modules/pre-exam/pre-exam.service.ts` | `b66f45cfa912fe9c1c61efe5fd7948c6c82df301b6e299eb878fff07148bd09f` |
| `src/modules/pre-exam/pre-exam.module.ts` | `91d2b81845055140e36d5a3de8478627d2d590afd0249e861a8737d4b96fa54d` |
| `test/occupancy-v1.harness.ts` | `66708f13419bf049d93e9c9702e490071b12e5f760dcd5be423eb576e32d6d0d` |

`src/modules/schedules/slot-status.service.ts` was not changed. Its hash is also recorded in the JSON results.

## 4. Validation performed

- `npx tsc --noEmit --pretty false` — passed.
- `npm run build` — passed.
- V1 runtime harness — completed 210 scenario trials against a dedicated synthetic PostgreSQL database.
- Read-only final database inventory — 180 appointments, 270 slots, 210 membership rows, 0 slots with `bookedCount > capacity`, and 0 slots with a negative counter.

The database was `novacare_occupancy_v1_test` on PostgreSQL 16.14, bound only to `127.0.0.1:55440`. Repository migrations were applied to the new empty database, followed by Prisma schema synchronization on that database only, matching the V0 procedure. No real patient data, provider payment system, Redis, or production/development database was used.

## 5. Result and limits

The E2 over-capacity state from V0 was not observed in the V1 baseline or controlled interleaving variants: all 120 E2 trials ended with one successful claim, one conflict, a counter of one, and one membership row for capacity one. A forced failure after the first slot counter write in the multi-slot transaction rolled back the counter, membership, appointment, and status history in all 30 fault trials.

This evidence applies to the isolated V1 source copy, direct service invocation, the tested schema, and tested schedules. It is not a production deployment, HTTP, multi-instance, or exhaustive interleaving proof.

The V1 experiment did not test E3, E4, E5, E7, or E8. V1 does not claim to fix cancellation/expiry races, late-payment behavior, duplicate payment callbacks, capacity-reduction races, or duplicate cancellation side effects. Those business policies remain outside this implementation scope.
