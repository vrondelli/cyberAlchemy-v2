# Recovered-result native registration

This is an additive descendant of register-result-bounded-v3.mjs. It does not alter frozen generation, original registration, or recovery artifacts. It makes no model, tokenizer, gold/reference or native scorer calls.

CLI: `node register-result-recovered-v3.mjs CONFIG.json`. Explicit configuration fields are `result_path`, `review_path`, `live_directory` (original generation directory), `freeze_path`, `recovery_manifest_path` (RECOVERED-GENERATION.json), and a new `output_directory`.

The independent result review must have `result_integrity_approved:true`, scope `packet-component-result-recovered-v3`, and exact bindings for the report, compact recovery manifest, original freeze, and every durable manifest source: original stage census/slot files, started receipt, durable exception-log copy and recovery acceptance review. Original temporary log location is informational provenance only. Hydration rechecks the original freeze and all recovery proof; the report must contain the identical recovery manifest and explicit verified-reference-recovery posture. Frozen validateSeal/summarize and native aggregate metric linkage are reused.

Native observations retain the original final-write failure and the limitation that recovery reconstructs persisted evidence, not the exact lost wrapper object/time. Predecessor costs remain 23,914 known plus 8,000 unknown reservation. All conclusions remain about eight exposed development donor archives and terminal-component quality, without 15% or full-benchmark clearance. A new shared 32MiB postrun stage holds observations, registration, DAG/work and reserved final RESULTS.json. No actual registration occurred during implementation.

## Validation

Four synthetic tests pass: terminal summary tampering rejects, independent review bindings cannot be missing/stale, native records retain component/recovery limitations across dispositions, and every durable recovery source must be independently bound. Native research materializers execute only on synthetic score fixtures.

## Open Questions

Independent exact code review and actual result-integrity review are required before publication. Recovery acceptance alone does not approve scoring results or establish a scientific conclusion. Complete-trajectory and benchmark-level confirmation remain separate prospective experiments.
