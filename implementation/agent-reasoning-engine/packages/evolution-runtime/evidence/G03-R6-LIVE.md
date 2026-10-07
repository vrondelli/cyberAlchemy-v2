# G03 r6 private accuracy confirmation — live handoff

Status: generation launched on the GLM VPS on 2026-09-28; terminal result and claim gate are **not yet known**. The goal remains active. This campaign is a separate prospective successor to [r5](G03-R5-RESULT-NOTE.md), not a repair or pooled analysis of r5.

The pre-dispatch [protocol](G03-R6-PROTOCOL.md) fixes an accuracy-only five-type, 40-question comparison. The source-only selector excluded 324 prior-exposed/assigned IDs, selected eight untouched questions per type, and read no reference fields. The VPS cohort root is `/opt/are/evolution-runtime/g03-product-replication-r6`; its `SELECTION.json` SHA-256 is `d2f9b218b4242e4960dd460c2d9cdb083bcf89c430993ef92994b0ac3cd061b7`, source manifest SHA-256 is `af04cd3230cd99085fad90c7ad1e0db8654a5ee1a7096345a1d3b8b1b8bae393`, and `FREEZE.json` SHA-256 is `ea3919b6cdffc532283e47dfe31e1a808ce00d2a91a47c683edd76959e03f5f1`. Source-only adapter loading and 40 projections passed before model dispatch.

The frozen code root is `/opt/are/evolution-runtime/g03-product-replication-code-r8`. Runner SHA-256: `7d4236ac89f2d1f0a2f67979d175e39ce7bbe791abbf3b9f238e027b9d90fb78`. Scorer SHA-256: `ca55e85a1f52f903018a0b335590cba88b0927f2a1adcb4f65f320af800b916c`. Reference projector SHA-256: `b5ced823cf11a3b4843cc8610089c0898874bbb5806cb7931019761a1d4f73eb`. The exact local scripts are in `../research/g03-product-r6/` and their hashes are bound in the freeze receipt.

Generation process PID `134634` writes `/opt/are-benchmark-runs/longmemeval-product40-20260928-r6/` and logs to the cohort `RUN-LOG.jsonl`. Finalizer PID `140697` waits for that exact runner process, verifies sealed generation and frozen hashes, then projects evaluator-only references, scores blinded answers, writes an accuracy analysis, and runs an independent receipt/judge/bootstrap audit. Its log is `FINALIZE-LOG.jsonl`; score root is `/opt/are-benchmark-runs/longmemeval-product40-20260928-r6-score`. Confirm both PIDs and current files before treating a timeout or stale log as terminal. Neither process should be restarted based on observation timeouts alone.

The VPS had about 13 GiB free at launch. No raw or archived evidence has been removed. Archive only after a fresh disk and retention check; generation, scoring, and audit roots are distinct and must remain intact.

No product claim or publication is authorized by this handoff. On completion, verify `RESULT.json`, `ANALYSIS.json`, `HASH-AUDIT.json`, their denominators and hashes, all refusals/invalid judgments, and the frozen accuracy gate; then prepare exact wording for Vlad and Dave. If the gate fails, report the failure without changing this cohort or its rule.

## Open Questions

- Will all 40 pairs terminate with reconciled receipts, and will the accuracy-only gate pass?
- How should raw and compressed archives be retained given current VPS headroom?
