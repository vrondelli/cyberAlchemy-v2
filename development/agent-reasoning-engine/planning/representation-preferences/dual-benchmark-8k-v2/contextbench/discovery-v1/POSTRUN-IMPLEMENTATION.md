# Additive post-run helpers

`register-result.mjs` and `close-live-work.mjs` are new unbound tools. They do not change the frozen run, invoke providers, score predictions or load gold. Importing them has no execution effect.

Registration requires exact freeze verification, no generation lock, four terminal jobs matching the generation seal, the evaluation-to-report hash, eight fixed outcomes, and an independent `LIVE-POSTRUN-REVIEW.json`. That review must contain `result_integrity_approved:true`, the exact `freeze_sha256`, and verified `source_bindings` including `LIVE-RESULTS.json`. The helper recomputes the report from existing scored/failure artifacts and the frozen summarizer before writing.

Classification is derived from actual results: infrastructure/scoring/accounting gaps yield inconclusive; a clean failed conjunction yields bounded counterevidence; only all exact gates yield supporting evidence. No classification proves individual component effects or campaign success. Native D02/D04 records bind the frozen selected H1/D03. D07 registration/DAG/plan bind evidence and both new helper hashes. All outputs use exclusive creation; `--check` recomputes and compares without writes. Inspect partial output before explicit recovery rather than overwriting it.

After independent review exists:

```sh
D=development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench/discovery-v1
node "$D/register-result.mjs"
node "$D/register-result.mjs" --check
```

After `LIVE-COMPLETION-AUDIT.md` also exists:

```sh
node "$D/close-live-work.mjs"
node "$D/close-live-work.mjs" --check
```

Closure revalidates registration, evidence hashes and all seven continuity tasks through native `replayResearchWork`; it emits events/state separately from the plan. Completion records validated evidence and dispositions, including an honestly rejected experiment. It never promotes authority or changes `campaign_goal_achieved:false`.

Five synthetic tests passed for exact acceptance gates, quality/cost failures, infrastructure/scorer uncertainty, malformed or weakened gates, fixed denominator and native D02/D04 references. Syntax validation passed for the closure helper. No actual registration or closure was executed while generation was active. See `POSTRUN-TEST-RESULTS.json` for tested hashes.

## Open questions

Actual scored results and independent integrity review remain prerequisites, not assumed evidence. Untouched confirmation, full-benchmark perfection, 15% savings and later worker scaling remain owned by [LIVE-PROTOCOL.md](LIVE-PROTOCOL.md). Follow [POSTRUN-CHECKLIST.md](POSTRUN-CHECKLIST.md) for scoring, reconstruction and cleanup order.
