# Postrun native registration

This additive registrar does not generate, tokenize, evaluate references, or modify frozen sources. It runs only after terminal generation, aggregate native scoring, and independent result-integrity review. It reuses the frozen scorer's `validateSeal`, `nativeMetrics`, and `summarize`, then the existing evolution-runtime observation, decision, DAG and work materializers used by discovery-v1.

Pass one JSON configuration file to `node register-result-bounded-v3.mjs CONFIG.json` with explicit `result_path`, `review_path`, `live_directory`, `freeze_path`, and a nonexistent `output_directory`. The review must have `result_integrity_approved:true`, scope `packet-component-result-bounded-v3`, and exact `source_bindings` covering report, generation seal and freeze. All review bindings are rechecked. The output uses a new shared 32MiB stage guard, ordinary 24MiB capacity, and final reserved 8MiB RESULTS.json; launch also checks the existing bounded physical-D/guest storage policy. No registration was performed during implementation.

The registrar verifies the live freeze and native prospective records, fixed sixteen-slot receipts/costs and report identities, rederives the full summary/classification, and links reported metrics to native aggregate files without reading gold. Native records preserve the eight exposed development donor archives and terminal-component claim ceiling. Supporting component evidence cannot establish whole-trajectory savings, 15% reduction or full-benchmark clearance. Prior stopped-run costs remain 23,914 known tokens plus an 8,000-token unknown reservation.

Output: OBSERVATIONS.json, REGISTRATION.json, RESEARCH-DAG.json, RESEARCH-WORK.json and final RESULTS.json. The work materialization represents the prospective task graph; it does not fabricate task-completion receipts or authority. Partial output remains evidence if persistence fails; a new output path is required for a separately authorized retry.

## Validation

Three synthetic tests pass: report/slot/cost/classification tampering rejects; review requires all three exact bindings and detects drift; native records and DAG/work materialize for all three classifications while retaining predecessor costs and the component claim ceiling. Synthetic native score functions are used; no real provider, tokenizer, reference or registration call occurs.

## Open Questions

Independent code review and independent actual result-integrity review remain required before registration. Actual terminal results may be inconclusive and must not be rewritten into clean mechanism evidence. A subsequent full-trajectory experiment remains a separate prospective decision.
