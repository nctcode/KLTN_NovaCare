# V1 Harness Execution Report

## 1. Execution status

**BLOCKED / FAILED at pre-scenario fixture setup.**

The authorized command was started once and stopped on the first error. No automatic retry, reset, migration, `db push`, seed or data cleanup was performed.

## 2. Environment identity

| Item | Observed value | Status |
|---|---|---|
| Source | `C:\Users\trinh\AppData\Local\Temp\vscode-agent-codex-sandbox-awSb2c\novacare-v1-repro-isolated` | PASS |
| Container | `novacare_v1_experimental_postgres` | PASS |
| Image | `postgres:16.14` | PASS |
| Mapping | `127.0.0.1:55408->5432/tcp` | PASS |
| Volume | `novacare_v1_experimental_pgdata` | PASS |
| Database | `novacare_occupancy_v1_test` | PASS |
| User | `novacare_v1_user` | PASS |
| PostgreSQL | `16.14` | PASS |
| Applied migrations | `10/10` | PASS |

## 3. Command executed

The command was executed once from the source copy:

```powershell
npx ts-node -r tsconfig-paths/register --transpile-only test/occupancy-v1.harness.ts
```

Environment used in the process:

```text
V1_DB_PORT=55408
V1_REPETITIONS=30
V1_OUTPUT_DIR=C:\Users\trinh\AppData\Local\Temp\novacare-v1-harness-run-20261110
DATABASE_URL=postgresql://<v1-user>:<secret>@127.0.0.1:55408/novacare_occupancy_v1_test?schema=public
```

The password is intentionally omitted.

## 4. Failure

The harness failed before the first scenario trial could be recorded:

```text
PrismaClientKnownRequestError: Invalid `prisma.hospital.create()` invocation
code: P2022
The column `images` does not exist in the current database.
```

Failure location:

```text
test/occupancy-v1.harness.ts:301
```

The failing operation was the initial synthetic hospital fixture creation. The harness did not reach `recordTrial`.

## 5. Scenario results

| Scenario | Requested | Executed/recorded | Status |
|---|---:|---:|---|
| E1 concurrent create | 30 | 0 | BLOCKED |
| E2 normal vs AI baseline | 30 | 0 | BLOCKED |
| E2 normal-first | 30 | 0 | BLOCKED |
| E2 pre-exam-first | 30 | 0 | BLOCKED |
| E2 barrier release | 30 | 0 | BLOCKED |
| E6 multi-slot success | 30 | 0 | BLOCKED |
| E6 multi-slot fault rollback | 30 | 0 | BLOCKED |
| **Total** | **210** | **0** | **BLOCKED** |

No latency, success/conflict/failure, over-capacity, counter-membership mismatch or rollback metrics were produced because no trial was recorded.

## 6. Read-only post-failure database state

Queries were read-only and showed:

```text
database: novacare_occupancy_v1_test
user: novacare_v1_user
PostgreSQL: 16.14
finished migrations: 10
appointments: 0
appointment_slots: 0
appointment_slot_bookings: 0
```

The output directory did not exist after failure:

`C:\Users\trinh\AppData\Local\Temp\novacare-v1-harness-run-20261110`

Therefore no new CSV/JSON artifact was created and no old artifact was overwritten.

## 7. Root-cause evidence

The Prisma schema contains:

```prisma
model Hospital {
  images String[] @default([])
}
```

The migrated database `hospitals` table currently has these columns:

```text
id, name, address, phone, description, logoUrl, rating,
isActive, createdAt, updatedAt, deletedAt
```

`images` is absent. This indicates a schema/migration provenance mismatch: the current `schema.prisma` expects a column that is not created by the 10 applied migration files. No source or migration was modified to work around this mismatch.

## 8. Source/artifact status

- Source implementation was not modified.
- Existing CSV/JSON artifacts were not modified.
- No new result artifact was generated.
- No migration was rerun.
- No reset, `db push` or seed was run.
- No automatic retry was attempted.

## 9. Required next action

The run must remain **BLOCKED** until the schema/migration mismatch is resolved by explicit direction. A safe follow-up should first identify the authoritative migration/source snapshot that defines `Hospital.images`, then apply only an approved migration change to the isolated database. The harness must not be rerun against the current database state by guessing or manually altering the schema.

## Final status

**BLOCKED — 0/210 trials completed.**
