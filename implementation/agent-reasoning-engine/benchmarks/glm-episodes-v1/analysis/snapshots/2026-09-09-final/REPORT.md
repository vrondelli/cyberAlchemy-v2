# GLM evidence analysis

Snapshot: 2026-09-09T01:03:33.015797+00:00. 467 unique exported trials across 40 campaigns. This is a development history, not held-out model performance.

## Completed frozen qualification campaigns

| Campaign | Initial pass | Final pass | Schema failures | Observed semantic failures |
| --- | ---: | ---: | ---: | ---: |
| complete-transport-qualification-2026-09-09 | 28/36 | 36/36 | 7 | 2 |
| joint-diagnostics-qualification-2026-09-09 | 30/36 | 35/36 | 2 | 4 |
| model-deadline-qualification-2026-09-08 | 29/36 | 32/36 | 3 | 0 |
| small-window-qualification-2026-09-08 | 29/36 | 34/36 | 3 | 2 |
| transient-recovery-qualification-2026-09-08 | 29/36 | 35/36 | 4 | 4 |

Across these completed campaigns: 145/180 initial passes; 172/180 final passes. These repeated known tasks do not establish generalization or causality.

## Failure mechanisms

Initial failure labels (may overlap): `{"schema": 19, "semantic": 12, "transport-observed": 7}`.
Final failure categories: `{"correction-transport": 1, "initial-transport": 6, "semantic-after-correction": 1}`.
Schema paths: `{"/authority_effect": 1, "/schema_version": 18}`.
19 schema failures involve only schema_version, authority_effect or rationale; 17 of those have recorded passing public checks before correction.
43 trials recycled; 0 failed recorded continuity after recycling. 0 trials recorded nonpositive soft headroom.
12 failed physical model attempts; 5 retries. Usage is unknown for 12 model attempts. Recorded known tokens are not a billing total.
Model latency p50/p95: 4967/16083 ms. Initial trial latency p50/p95: 53782/111456 ms. Output-limit signals: 0.

## Window and task breakdown

| Task / soft limit | Initial | Final observed | Schema failures |
| --- | ---: | ---: | ---: |
| archive-slice-bounds / 10000 | 11/15 | 14/15 | 2 |
| archive-slice-bounds / 12000 | 11/15 | 15/15 | 3 |
| archive-slice-bounds / 8000 | 11/15 | 15/15 | 2 |
| exact-json-scoring / 10000 | 15/15 | 15/15 | 0 |
| exact-json-scoring / 12000 | 15/15 | 15/15 | 0 |
| exact-json-scoring / 8000 | 15/15 | 15/15 | 0 |
| retention-long-window / 10000 | 9/15 | 12/15 | 2 |
| retention-long-window / 12000 | 9/15 | 15/15 | 2 |
| retention-long-window / 8000 | 11/15 | 13/15 | 2 |
| retention-tool-pairs / 10000 | 11/15 | 14/15 | 3 |
| retention-tool-pairs / 12000 | 13/15 | 14/15 | 2 |
| retention-tool-pairs / 8000 | 14/15 | 15/15 | 1 |

## Interpretation and next experiment

Use the separate [decision note](FINDINGS.md) for hypotheses and proposed alternatives. This generated report describes associations; the historical changes were not randomized controlled comparisons.

No causal explanation or runtime intervention is selected by this analyzer. Sequential source changes, provider conditions and repeated use of the same tasks confound before/after comparisons. The hypothesis/DAG stage must examine alternatives before registering another experiment.

## Coverage and limitations

Excluded duplicate exports: 0. Unjoined feedback/reuse records: 30. Other diagnostics: 0.
Incomplete campaigns are isolated in summary.json and never pooled into the completed qualification table. Older development results are retained separately. Missing fields remain unknown. Current-schema reanalysis is separate from recorded historical validation. No model-generated code is executed and no private reasoning is exported.
Inputs are bound by relative path and SHA-256 in inputs.json. The snapshot is a file-by-file export, not an atomic snapshot of an active campaign. Source records changing during the read are reported. Original canonical-JSON manifest bindings and completed qualification aggregate counts are checked; historical runtime sources and oracles are not rerun.

## Open Questions

Does the smaller model-facing contract reduce protocol errors without increasing semantic errors? Do results generalize beyond the four tuned fixtures? Are remaining transport faults provider-side or network-side? Provider-internal compaction cannot be determined from these records.
