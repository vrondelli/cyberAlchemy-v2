# Bounded GLM repair campaign result

The approved three functional episodes finished without a verified successful repair. M1 remains unmet. M2 (a fresh pressure episode and repeated all-pass evaluation) was not entered because it depends on M1. The small-window chapter is not complete.

| Attempt | Outcome | Model / tokenizer calls |
| --- | --- | --- |
| 1 | Request 15 exceeded its 60-second deadline; no candidate | 15 / 18 |
| 2 | First candidate failed the public probe; request 16 exceeded its 60-second deadline before a completed revision | 16 / 18 |
| 3 | Completed with one candidate; public DOM and hydrate failed; private evaluation rebuild failed | 21 / 24 |

Sources: [campaign](campaign.json), [attempt 1 audit](assessment-attempt-1.json), [attempt 2 audit](assessment-attempt-2.json), [attempt 3 audit](assessment-attempt-3.json). Request deadlines for attempt 3 were separately frozen at 120 seconds; see [latency revision](LATENCY-REVISION.md). All its successful responses took under 23 seconds, so completion does not establish that the longer deadline caused the improvement.

## Implemented and checked

The isolated workflow records competing hypotheses, stages exact source deltas against the initial filesystem, runs a public issue-derived reproducer in fresh containers, and exports the exact model candidate. Whole-schema validation and exact-match edit checks reject invalid operations. Phase gates reserve test and submission steps. Frozen sources and request captures support independent accounting and projection replay.

The public issue-derived fixture is red on baseline and green with the issue-described explicit-parameter control. That control changes only the test fixture and is not a model repair. See [baseline](evidence/probe-baseline/report.json), [control](evidence/probe-control/report.json), [export checks](evidence/export-preflight/report.json), and [offline checks](evidence/offline-checks.json). Phase and latency checks also passed during implementation. Existing frozen baseline/reference evaluator evidence was reused.

## What actually failed

Attempt 3 staged a change in `packages/svelte/src/compiler/phases/2-analyze/visitors/SnippetBlock.js`. The public test still reported `value is not defined` in both modes. After further reads, turns 19 and 20 both proposed literal placeholder edits replacing `y` with `x`. The exact-match validator rejected both. Turn 21 submitted the original failing candidate. These are observed tool events, not an inference about hidden reasoning. See [events](evidence/attempt-3/events.json) and [public probe](evidence/attempt-3/probe-17/report.json).

The exact exported patch, SHA-256 `3a0580bbd56b5c263fd058e984bc100301838c63effbb7602c9de13896df8ddf`, was applied in a fresh private evaluator. Rebuild failed because it references undefined `can_hoist_await`. Therefore there is **no scored repair/regression count for this attempt**. The evaluator labels this `evaluation_error`; the build log identifies a candidate source failure. See [evaluation](evidence/attempt-3/evaluation/report.json) and [build log](evidence/attempt-3/evaluation/build-0.log). An all-pass reproduction was not applicable.

All three accounting/projection audits passed; observed provider input stayed within reservations. Attempt 3 recycled three times and its maximum admitted input-plus-output bound was 11,884, below the local 12,000 threshold. This is local engine admission evidence, not proof about every provider-side behavior or GLM's full context capacity. Rollout, probe and evaluator cleanup receipts passed. No winning patch, private tests or reference repair was supplied to the model loop. No production model policy was promoted.

## Open Questions

- Does a feedback-driven revision phase with an explicit unable-to-revise outcome reduce placeholder edits compared with the fixed turn gates? This is a proposed next hypothesis, not a demonstrated fix.
- Should a bounded public build check accompany the targeted probe to expose undefined helper references earlier?
- How much does recycling contribute to repeated source inspection? These episodes do not isolate that causal effect.
- A new bounded experiment is needed before M1, then M2, can be claimed. Repeating this exhausted campaign unchanged is not evidence of progress.
