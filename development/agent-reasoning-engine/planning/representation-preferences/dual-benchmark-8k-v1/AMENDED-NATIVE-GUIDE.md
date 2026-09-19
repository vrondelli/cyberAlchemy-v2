# Amended native research records

These additive post-run helpers preserve every original native artifact and make
no provider calls. They do not invent observations before measured results exist.

After the amended result and passing raw audit exist:

```sh
node research-amended-results.mjs
node research-amended-results.mjs --check
```

The helper reuses the existing selected D01 hypotheses and D03 experiments. It
creates separate native D02 observations and D04 decisions in each benchmark's
`amended-observations.json`, plus `amended-registrations.json`,
`amended-research-dag.json` (D07) and `amended-research-work-plan.json` (D08).
Original results and observations remain source-bound counterevidence. Both
freezes, the original zero-exposure exception and the independently reconstructed
amended audit are verified before emission. Outputs cannot be overwritten.

After independent `AMENDED-FINAL-REVIEW.json` records `complete:true` and
`AMENDED-COMPLETION-AUDIT.md` exists:

```sh
node close-work-amended.mjs
node close-work-amended.mjs --check
```

This validates the records and replays native D08 into
`amended-research-work-state.json`. Completed work means evidence-backed task
disposition; a negative benchmark or explicit scaling non-admission can complete
its reporting task without becoming an empirical success. The record set is
retrospective amended evidence, not a newly preregistered experiment.

## Open Questions

Actual amended outcomes, quality ambiguity and future untouched confirmation
remain owned by [AMENDMENT.md](AMENDMENT.md#open-questions) and the final review.
The helpers have passed syntax checks; data-dependent validation awaits results.
