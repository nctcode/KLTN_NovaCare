# IEEE Manuscript Final Revision Report

## 1. Files edited

- `main.tex`
- `NOVACARE_FULL_PAPER_DRAFT.md`

No JSON, CSV, experiment report, source code, image asset or PDF was changed.

## 2. Changes applied

### `main.tex`

- Abstract: changed V1 wording from a general confirmation to a preserved historical artifact result; explicitly stated that it is not an independent reproduction.
- Methodology `132–136`: added synthetic fixture generation/reset scope, V0-only synthetic payment clarification, and the three schema layers: Prisma declared schema, ten-migration schema, and original synchronized database schema.
- Methodology `134`: stated that the exact V1 synchronization command is not preserved and that no original PostgreSQL dump/catalog remains.
- Introduction/Results: changed broad “reproduced/elimination/ensured” wording to evidence-aware “recorded/preserved artifact” wording.
- Results `157`: replaced “high contention” with wording limited to tested concurrent contention scenarios.
- Results `181,224,249`: preserved all original numerical values while identifying them as preserved V0/V1 artifact observations.
- Discussion and Limitations `293,305,314`: added historical-artifact scope, synthetic fixture limitation, missing catalog/dump, and migration-only schema mismatch.
- Conclusion `317–319`: explicitly excluded independent reproduction, production readiness, distributed correctness, and performance superiority.

### `NOVACARE_FULL_PAPER_DRAFT.md`

- Abstract: marked V1 as a preserved artifact and added harness-generated synthetic fixture/reset limitations.
- Methodology `92–100`: clarified original artifact port, synthetic payment scope, per-trial reset, three schema layers, missing exact V1 command, and missing original dump/catalog.
- Results `176,218`: associated V1 findings with the preserved artifact.
- Limitations `229`: added no exact environment recovery and no independent reproduction.
- Conclusion `240–242`: added the same provenance limitation and preserved all numerical claims.

## 3. Numerical verification

Read-only recalculation from the original JSON artifacts confirmed:

- V0: 240 rows/trials, 30 repetitions per scenario, 450 service calls.
- V1: 210 rows/trials, 30 repetitions per scenario, 360 service calls.
- V1 E2: four modes × 30 = 120 trials; each trial has one success and one conflict.
- V1 fault rollback: 30 intentional failures.
- Main manuscript latency values for E1, E2 baseline and E6 remain unchanged and match request-level JSON using the stated nearest-rank percentile convention.

No experimental number was added, removed, or changed.

## 4. Citation, table, figure and equation checks

- Existing `cite` keys continue to correspond to bibliography entries.
- Existing table labels and references remain unchanged.
- Existing equation labels and references remain unchanged.
- `img/latency_comparison.pdf` and `img/overcapacity_comparison.pdf` remain referenced by the same paths and were not modified.
- The manuscript still uses the IEEE conference structure and existing reference list.
- PDF compilation was intentionally not run, as requested.

## 5. Evidence that remains unavailable

- Exact V1 terminal log for `migrate deploy` and schema synchronization.
- Original PostgreSQL dump or schema/catalog export.
- Original Docker volume snapshot for the database target at port 55440.
- Complete proof that every field in the current Prisma schema existed in the original V1 database.
- Transaction isolation level of the original experiment connections.

These items are now described as limitations rather than implied as verified facts.

## 6. Change summary

The workspace does not expose a usable Git repository for these manuscript files, so `git diff/stat` is unavailable. The effective change is a wording-only evidence/provenance revision in the two permitted files; numerical tables, equations, citations, references and figure paths were preserved.

Current SHA-256 after editing:

| File | SHA-256 |
|---|---|
| `main.tex` | `B96BC6B529E7491DBB19D5EBD017292E5BAF012A40F5BDA725D12D3A1AD38479` |
| `NOVACARE_FULL_PAPER_DRAFT.md` | `2453BF3DB60B0D4F280263AA12AE84CAE1CC31B5CF8444DFC1649BE19C947E05` |

## 7. Final status

**READY FOR PDF BUILD**, subject to the following next step: compile XeLaTeX and inspect overflow, table/figure placement, hyperlinks, citations and bibliography. The PDF was not built in this revision step and `main.pdf` was not overwritten.
