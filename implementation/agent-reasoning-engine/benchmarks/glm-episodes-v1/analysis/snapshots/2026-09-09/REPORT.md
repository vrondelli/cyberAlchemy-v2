# GLM evidence analysis

Snapshot: 2026-09-09T00:48:12.176043+00:00. 461 unique exported trials across 40 campaigns. This is a development history, not held-out model performance.

## Completed frozen qualification campaigns

| Campaign | Initial pass | Final pass | Schema failures | Observed semantic failures |
| --- | ---: | ---: | ---: | ---: |
| joint-diagnostics-qualification-2026-09-09 | 30/36 | 35/36 | 2 | 4 |
| model-deadline-qualification-2026-09-08 | 29/36 | 32/36 | 3 | 0 |
| small-window-qualification-2026-09-08 | 29/36 | 34/36 | 3 | 2 |
| transient-recovery-qualification-2026-09-08 | 29/36 | 35/36 | 4 | 4 |

Across these completed campaigns: 117/144 initial passes; 136/144 final passes. These repeated known tasks do not establish generalization or causality.

## Failure mechanisms

Initial failure labels (may overlap): `{"schema": 12, "semantic": 10, "transport-observed": 7}`.
Final failure categories: `{"correction-transport": 1, "initial-transport": 6, "semantic-after-correction": 1}`.
Schema paths: `{"/schema_version": 12}`.
12 schema failures involve only schema_version, authority_effect or rationale; 11 of those have recorded passing public checks before correction.
34 trials recycled; 0 failed recorded continuity after recycling. 0 trials recorded nonpositive soft headroom.
11 failed physical model attempts; 4 retries. Usage is unknown for 11 model attempts. Recorded known tokens are not a billing total.
Model latency p50/p95: 4994/15891 ms. Initial trial latency p50/p95: 54794/111456 ms. Output-limit signals: 0.

## Window and task breakdown

| Task / soft limit | Initial | Final observed | Schema failures |
| --- | ---: | ---: | ---: |
| archive-slice-bounds / 10000 | 9/12 | 11/12 | 1 |
| archive-slice-bounds / 12000 | 10/12 | 12/12 | 1 |
| archive-slice-bounds / 8000 | 8/12 | 12/12 | 2 |
| exact-json-scoring / 10000 | 12/12 | 12/12 | 0 |
| exact-json-scoring / 12000 | 12/12 | 12/12 | 0 |
| exact-json-scoring / 8000 | 12/12 | 12/12 | 0 |
| retention-long-window / 10000 | 7/12 | 9/12 | 1 |
| retention-long-window / 12000 | 8/12 | 12/12 | 1 |
| retention-long-window / 8000 | 8/12 | 10/12 | 2 |
| retention-tool-pairs / 10000 | 10/12 | 11/12 | 1 |
| retention-tool-pairs / 12000 | 10/12 | 11/12 | 2 |
| retention-tool-pairs / 8000 | 11/12 | 12/12 | 1 |

## Interpretation and next experiment

Use the separate [decision note](FINDINGS.md) for hypotheses and proposed alternatives. This generated report describes associations; the historical changes were not randomized controlled comparisons.

The most direct architectural hypothesis to test is a smaller model-facing submission contract: let the model generate the proposed source and let a trusted adapter construct invariant metadata from the authorized scope. That is a new explicit contract, not silently repairing invalid output. Preserve strict schema, scope, public and oracle validation at the boundary.

Before more broad repeats, compare that candidate with the existing full patch contract under identical source, task, context, deadline and retry settings. Use fresh matched trials and keep transport failures, semantic errors and protocol errors separate. A passing retry-assisted campaign cannot by itself show better first-proposal model behavior.

## Coverage and limitations

Excluded duplicate exports: 0. Unjoined feedback/reuse records: 30. Other diagnostics: 0.
Incomplete campaigns are isolated in summary.json and never pooled into the completed qualification table. Older development results are retained separately. Missing fields remain unknown. Current-schema reanalysis is separate from recorded historical validation. No model-generated code is executed and no private reasoning is exported.
Inputs are bound by relative path and SHA-256 in inputs.json. The snapshot is a file-by-file export, not an atomic snapshot of an active campaign. Source records changing during the read are reported. Original canonical-JSON manifest bindings and completed qualification aggregate counts are checked; historical runtime sources and oracles are not rerun.

## Open Questions

Does the smaller model-facing contract reduce protocol errors without increasing semantic errors? Do results generalize beyond the four tuned fixtures? Are remaining transport faults provider-side or network-side? Provider-internal compaction cannot be determined from these records.
