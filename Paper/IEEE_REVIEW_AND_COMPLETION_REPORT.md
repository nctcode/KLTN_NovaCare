# IEEE Review and Completion Report

Date: 2026-11-09
Scope: `main.tex`, `NOVACARE_FULL_PAPER_DRAFT.md`, V0/V1 CSV and JSON artifacts.

## 1. Current manuscript review

The LaTeX manuscript has a coherent IEEE conference structure:

1. Abstract and keywords
2. Introduction
3. Related Work and research gap
4. Problem definition and correctness properties
5. Unified occupancy control mechanism
6. Experimental methodology
7. Experimental results
8. Discussion
9. Threats to validity and limitations
10. Conclusion and future work
11. Acknowledgment and references

The abstract, introduction, method, results, limitations, and conclusion consistently restrict the claim to the tested NovaCare source copy, PostgreSQL 16.14, synthetic fixtures, and direct service calls. They do not claim production, HTTP, or multi-instance validation.

## 2. Data cross-check

The reported core values were checked against `V0_EXPERIMENT_RESULTS.csv`, `V1_EXPERIMENT_RESULTS.csv`, `V0_EXPERIMENT_RESULTS.json`, and `V1_EXPERIMENT_RESULTS.json`, together with the experiment reports.

| Check | Result |
|---|---|
| V0 E1: 30 trials, one success and one conflict | Consistent |
| V0 E2: 30/30 over-capacity trials | Consistent |
| V1 E1: 30 trials, one success and one conflict | Consistent |
| V1 E2: 120 trials, one success and one conflict | Consistent |
| V1 E2 winner split in barrier mode: 16/14 | Consistent |
| V1 E6 successful multi-slot trials: 30/30 | Consistent |
| V1 fault injection rollback: 30/30 | Consistent |
| V1 aggregate: 210 trials and 360 service calls | Consistent |
| V1 zero over-capacity, mismatch, duplicate membership, and recognized deadlock outcomes | Consistent |

The E2 latency comparison uses V1's 30-trial baseline only. Controlled interleaving modes are not mixed into the comparable E2 latency row.

## 3. Experimental data completion

The latency table in `main.tex` was extended with a Maximum column. Maximum values were obtained from the JSON `request_latency_ms` arrays:

| Scenario | V0 max (ms) | V1 max (ms) |
|---|---:|---:|
| E1 | 139.54 | 119.12 |
| E2 baseline | 117.06 | 44.94 |
| E6 successful run | 122.97 | 60.46 |

The existing PDF figures were retained and referenced from the manuscript:

- `img/latency_comparison.pdf`
- `img/overcapacity_comparison.pdf`

No TPS benchmark was fabricated. A valid TPS claim requires a new controlled experiment varying concurrency, measuring wall-clock duration, defining successful/failed request accounting, and recording database and connection-pool settings.

## 4. Scientific analysis review

The manuscript explains the relevant mechanism: stable lock ordering, `SELECT ... FOR UPDATE`, post-lock rereading, guarded counter updates, and transaction-scoped appointment/membership writes. It analyzes E1, E2, and E6 separately and explains why E2 latency is not an apples-to-apples performance comparison.

Threats to validity and limitations cover direct service invocation, synthetic data, bounded repetitions, unrecorded isolation level, limited failure injection, incomplete lifecycle coverage, selected related work, and the absence of production/multi-instance validation.

## 5. IEEE content review

References are numbered in citation order and the citation keys in `main.tex` are used consistently. The PostgreSQL documentation references include access dates. Internal artifacts are explicitly labeled unpublished.

Items that still require author input before submission:

- Confirm the exact author order and spelling.
- Add IUH affiliation(s), department, city/country, and author email(s) in the IEEE author block.
- Replace the optional acknowledgment only with approved wording.
- Confirm whether the venue requires English-only prose; the current `main.tex` is English while the Markdown draft is Vietnamese.

## 6. PDF validation

`xelatex` was run successfully and produced `main.pdf` with 6 pages. The build has no fatal errors, unresolved-reference messages, citation errors, or overfull boxes after the E6 table was resized. Remaining non-fatal warnings are mostly underfull bibliography/paragraph boxes and font substitutions; the IEEE template also reports that final column balancing should be checked manually. Author affiliation information is still missing and must be supplied before submission.

## 7. Reviewer-style conclusion

The strongest defensible contribution is an application-specific integration and evaluation of a shared PostgreSQL occupancy-claim protocol across two NovaCare booking workflows. The evidence supports elimination of the reproduced V0 E2 over-capacity outcome under the stated test conditions. The paper should avoid novelty claims about row locks or transactions themselves and should not generalize the result to the full lifecycle, production, or distributed deployment without new evidence.
