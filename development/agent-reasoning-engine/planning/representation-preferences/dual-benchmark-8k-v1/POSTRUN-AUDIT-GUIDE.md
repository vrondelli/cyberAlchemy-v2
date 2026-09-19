# Additive post-run audit

These helpers were added after the execution freeze. They never call models or
change frozen artifacts. Their code is review tooling, not part of the intervention.

After `RESULTS.json` exists and every executed stage has terminal jobs, run from
this directory:

```sh
node audit-postrun.mjs --write
node audit-postrun.mjs --check
```

The first call creates `POSTRUN-AUDIT.json` without overwriting an earlier audit.
The second independently reconstructs it. The audit checks frozen hashes, eight
planned slots per arm, raw generator and judge receipts, incomplete started calls,
arm/report costs, reduction arithmetic and conservative physical budget ceilings.
A failed benchmark may pass the accounting audit; `ok` never means 15% was achieved.
Output includes findings and exits nonzero for a discrepancy. It reads receipt
ledgers and summaries, not captured model prompts.

After native observations, registrations and research-work-plan are materialized,
`COMPLETION-AUDIT.md` exists, and independent `FINAL-REVIEW.json` has `complete:true`:

```sh
node close-work-postrun.mjs
node close-work-postrun.mjs --check
```

This verifies the research reconstruction and source-bound evidence, then replays
native D08 into `research-work-state-postrun.json`. A properly recorded stage-two
non-admission completes its disposition task, not the unexecuted experiment.
Neither helper edits the frozen plan, lowers a threshold, or retries a model call.

The final reviewer must additionally check native metric reconstruction, ambiguous
LongMemEval rubric judgments, protocol deviations and the inference drawn from
only one >8K LongMemEval task. A same-model yes/no judge is not an independent
human ground truth. Untouched confirmation and full benchmark clearance remain open.

## Open Questions

Live savings, quality, completion and actual worker capacity are owned by the
results and final review. [REVIEW.md](REVIEW.md#open-questions) preserves the
remaining scientific limits. These helpers have passed syntax checks only before
the results exist; run the commands above for actual evidence validation.
