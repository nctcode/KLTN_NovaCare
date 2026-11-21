# V1 Original Experiment Provenance Recovery

## Phạm vi và an toàn

Audit chỉ đọc trên workspace, source copy, session artifacts và Docker metadata. Không sửa source/database/container/volume, không chạy migration, `db push`, reset, seed hoặc harness; không ghi đè artifacts cũ.

## Kết luận tổng quát

### Trạng thái: **B — Có thể khôi phục một phần, còn thiếu bằng chứng**

Có bằng chứng trực tiếp khá mạnh về source implementation, schema hash, Git HEAD được ghi trong artifact và database target của lần chạy cũ. Tuy nhiên không có dump/schema dump/volume snapshot của database cũ, không có Git history trong snapshot hiện còn, và không có log command đầy đủ để xác định chính xác cách schema được đồng bộ. Vì vậy không thể khôi phục chính xác toàn bộ môi trường ban đầu chỉ từ dữ liệu hiện có.

## 1. Artifacts V1 cũ đã tìm thấy

### Full artifact

`D:\KLTN_NovaCare\V1_EXPERIMENT_RESULTS.json` ghi nhận:

- generated at `2026-11-09T07:53:46.588Z`;
- database `novacare_occupancy_v1_test`;
- PostgreSQL `16.14`;
- connection target `127.0.0.1:55440/novacare_occupancy_v1_test`;
- `syntheticOnly: true`;
- identity check trước mỗi service call/fixture write;
- `repetitionsPerScenario: 30`;
- 210 rows: 7 scenario × 30.

CSV tương ứng và các báo cáo `V1_EXPERIMENT_REPORT.md`, `V1_IMPLEMENTATION_REPORT.md` cũng còn trong workspace.

### Smoke artifacts

Hai artifact session được tìm thấy:

- `files/v1-smoke/V1_EXPERIMENT_RESULTS.json`: 1 trial mỗi scenario, source implementation hashes khác final V1.
- `files/v1-smoke2/V1_EXPERIMENT_RESULTS.json`: 1 trial mỗi scenario, source hashes của final V1, database target vẫn `127.0.0.1:55440`.

Smoke artifacts chứng minh có các lần chạy trung gian; không phải bằng chứng cho một database snapshot riêng được bảo tồn.

## 2. Source/hash provenance

### Schema hash

Artifacts cũ lặp lại schema hash:

```text
prisma/schema.prisma = a5a45a82b6a672737270b807301c94ec4ef86a8a157013303900bf60d76fecb5
```

Hash này khớp source V1 hiện tại. Đây là **CONFIRMED** cho nội dung file schema, nhưng không chứng minh database cũ đã được tạo đúng bằng migration-only.

### Source implementation hashes

Full artifact ghi nhận final implementation:

| File | Hash trong full artifact |
|---|---|
| `appointments.service.ts` | `a1125e0cad2989aba91cd98fc9c648fccaa6be58efe9ef9c9e7e5bb33bf4aaf5` |
| `occupancy-claim.ts` | `4dbb1d0706f780b1cad36df21cd2dec6fefd11c7e23f388a1da7a30adf06d92c` |
| `pre-exam.service.ts` | `b66f45cfa912fe9c1c61efe5fd7948c6c82df301b6e299eb878fff07148bd09f` |
| `pre-exam.module.ts` | `91d2b81845055140e36d5a3de8478627d2d590afd0249e861a8737d4b96fa54d` |
| `slot-status.service.ts` | `efaeeb3bfe8f3260b7dc13e9347893cd70829cb7ef8600ecedb96f43e11098e2` |
| `occupancy-v1.harness.ts` | `66708f13419bf049d93e9c9702e490071b12e5f760dcd5be423eb576e32d6d0d` |

These match the final V1 source before the later approved port-configuration edit. Therefore source implementation provenance is **CONFIRMED** for the final artifact, while the smoke1 hashes show an earlier intermediate implementation.

Artifacts also record:

- branch: `develop`;
- Git HEAD: `585dcd8db9d612b4d35d758fe7d285b4762298b6`;
- V1 source path in the original run: the session `v1-source` copy.

## 3. How was the original database schema created?

### Direct evidence

`V1_IMPLEMENTATION_REPORT.md` and `V1_EXPERIMENT_REPORT.md` state that the original run used an empty test database, applied repository migrations, and then performed “Prisma schema synchronization” on that isolated database.

This directly establishes the sequence conceptually:

```text
empty test database → repository migrations → Prisma schema synchronization → harness
```

### Exact command evidence

No preserved stdout/stderr log contains the exact schema-synchronization command. The available reports do not distinguish conclusively between:

- `prisma db push`;
- a Prisma schema synchronization operation run through another wrapper;
- `prisma db execute` plus ad hoc SQL;
- another unrecorded procedure.

`package.json` contains `db:push`, but that only proves the command was available, not that it was used for the old run. Therefore the exact method is **UNKNOWN**, not asserted.

### Supplemental SQL evidence

The source contains unnumbered files:

- `prisma/migrations/add_missing_cols.sql`;
- `prisma/migrations/rename_col.sql`.

These are not timestamped Prisma migration directories and are not applied by `prisma migrate deploy`. They contain ad hoc `ALTER TABLE`/rename operations, providing indirect evidence that schema repair outside the numbered migration chain was part of the surrounding development history. However, `add_missing_cols.sql` does not add `hospitals.images`, so these files alone do not reconstruct the original database.

**Classification:** migration-then-schema-sync sequence **CONFIRMED**; exact CLI/method **UNKNOWN**; use of supplemental SQL **LIKELY possible but not proven for the V1 run**.

## 4. Old database schema evidence

### What artifacts record

The old JSON records only database identity, source hashes, per-trial observations and result metrics. They do not include:

- a PostgreSQL catalog dump;
- `pg_dump` output;
- enum inventory;
- full table/column manifest;
- Prisma migration table contents;
- Docker volume ID/snapshot ID.

### What can be inferred

Because the old harness completed hospital fixture creation and 210 trials, the old runtime database necessarily had at least the columns read/written by the final harness, including the schema fields required by the final Prisma Client. In particular, it must have had `hospitals.images` or an equivalent schema accepted by the generated client.

This is an inference from successful execution, not a direct catalog observation.

**Classification:** exact old table/enum/column inventory **UNKNOWN**; presence of fields needed by successful harness execution **LIKELY**.

## 5. Current database versus old database

The current V1 database is not the original database snapshot:

- It was created later during the reproducibility preparation.
- It uses host port `55408`, while old artifacts record `55440`.
- Its volume was created/recreated as `novacare_v1_experimental_pgdata` during the current preparation.
- It was populated by the current 10 numbered migrations.
- It lacks `hospitals.images`, causing the new harness to fail with P2022.

Therefore current PostgreSQL state cannot be used as a proxy for the original experiment database.

## 6. Dump, backup and volume search

Read-only file search found no PostgreSQL `.dump`, schema dump, backup archive or V1-specific volume snapshot preserving the old catalog. Docker currently exposes the new V1 volume and NovaCare development volumes, but no separately identifiable original V1 experiment volume snapshot.

**Classification:** preserved original database snapshot **UNKNOWN / not found**.

## 7. Evidence of missing migration or out-of-chain schema

Evidence supporting an out-of-chain schema step:

1. `schema.prisma` includes `Hospital.images` at line 517.
2. None of the 10 numbered migration SQL files contains `images`.
3. Current migration-only database lacks `images`.
4. Internal experiment reports state that Prisma schema synchronization followed migrations.
5. Unnumbered ad hoc SQL files exist in the source tree.
6. The old artifact completed successfully despite the current migration-only database failing before trial 1.

The strongest explanation is:

```text
The old experiment database was synchronized beyond the numbered migration chain,
or the old run used a different schema/migration snapshot than the current 10 migrations.
```

It is **LIKELY** that schema synchronization (possibly `db push`) created the missing schema, but the exact command and complete schema state are **UNKNOWN**.

No evidence proves a specific missing migration #11. The evidence proves only that the numbered migration chain is insufficient for the schema used by the final source.

## 8. Impact on reproducibility

The old V1 artifact is internally coherent at the application/source level:

- full artifact has 210 rows;
- source hash and Git HEAD are recorded;
- final implementation hashes match the preserved V1 source;
- database identity and synthetic-only status are recorded.

But exact environment reproducibility is not established because:

- original catalog/schema dump is missing;
- exact schema synchronization command is missing;
- original volume/database snapshot is missing;
- current migration-only database is not schema-compatible with the final Prisma schema;
- old artifact does not record complete enum/table/column metadata.

The old 210-trial result should therefore be treated as a historical artifact with strong source/hash provenance, but not as fully reproducible from the currently available 10 migration files alone.

## 9. Classification table

| Question | Conclusion | Classification |
|---|---|---|
| Old database identity | `novacare_occupancy_v1_test`, PostgreSQL 16.14, old target `127.0.0.1:55440` | CONFIRMED |
| Schema hash used by old artifact | `a5a45a82...`, matches current schema file | CONFIRMED |
| Final source implementation hashes | Match preserved V1 source | CONFIRMED |
| Exact command creating final schema | Not recorded | UNKNOWN |
| Migrations applied before run | Reports explicitly say repository migrations were applied | CONFIRMED |
| Schema synchronization after migrations | Reports explicitly state it | CONFIRMED |
| Exact synchronization method (`db push` vs other) | No command log | UNKNOWN |
| Old full database catalog | No dump/snapshot found | UNKNOWN |
| Missing numbered migration #11 | Not proven | UNKNOWN |
| Schema existed outside numbered migration chain | Strongly supported by reports/current mismatch | LIKELY |
| Exact recovery from current files | Not possible | BLOCKED |

## 10. Final conclusion

**Status B:** Có thể khôi phục một phần, còn thiếu bằng chứng.

Có thể khôi phục source implementation, schema file hash, recorded Git HEAD, database name/version/old port và scenario/result artifacts. Không thể khôi phục chính xác database catalog ban đầu hoặc phương thức schema synchronization từ dữ liệu hiện có. Cần tìm thêm old PostgreSQL dump/volume snapshot/command log hoặc source snapshot chứa schema-sync evidence trước khi tuyên bố tái lập chính xác.

Không thực hiện bất kỳ thay đổi nào trong audit này.
