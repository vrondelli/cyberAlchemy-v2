# Completion gate and token calibration

D65 owner-directed continuation: “plan and do it”.

Product DAG: calibrate prior paired usage → explicit completion requirement contract → gate candidate acceptance using confirmed ledger delivery → test negative/positive/resume paths and margin binding → freeze → rerun the previous fixed12-trial schedule → classify every outcome.

Calibration uses108 prior measured model responses; maximum tokenizer undercount262. Add128 slack and round up to128-token boundary:512. Unknown usage is excluded, not treated as zero. This is empirical evidence, not an upper-bound proof. The live underestimate guard remains enabled.

Opt-in verified-completion-v8 inherits reserved-headroom-v7. Typed completion_requirements name required reads, distinct-turn policy and conditional archive recovery. They are validated, bound into scope and checked before candidate acceptance. Confirmed full-file delivery is required; attempted/deferred reads and undelivered archive slices cannot satisfy the gate. Early candidate rejection is terminal, with no automatic retry or rewriting. Archive recovery is required after recycling; this does not force recycling when no recycle occurred. Prompt-only duplicate file progress is replaced by gate state; full ledger evidence remains intact.

Freeze the same12-arm schedule: two repetitions of exact-json-scoring and archive-slice-bounds at8K and retention-long-window at12K, both retention policies. Same task bytes, fixtures, oracles and order. No failure replacement or tuning during the rerun. Per arm12model24tokenizer580seconds; aggregate144/288 attempts. Hard limit16384, output reserve2048, safety margin1024, soft-headroom reservation256; only calibrated token margin becomes512 for v8. Existing policy defaults remain unchanged.

Operational owner: user/operator for provider availability. Provider failures remain in overall results and are classified separately. No operational blocker to local work. Publication/default activation/deployment remain deferred owner decisions. No additional ontology-runtime prerequisites.

## Open Questions

Does the calibrated margin cover new request shapes? Does the model obey gate guidance rather than terminating early? Do the results hold on larger samples? The fixed rerun is not an unbiased evaluation after tuning on related evidence.
