# Public repair feedback result

Implemented an explicit post-submission public-validation stage with at most one corrective model call. The six-submission live evaluation completed, but its target failed: **zero verified corrective repairs**. Two proposals passed unchanged, three blocked, and the first replacement could not complete validation because of child timeouts. Original v20 scores remain unchanged.

## Live schedule and accounting

| Retained proposal | Recorded outcome | Interpretation |
| --- | --- | --- |
| Long recent 1 | REJECTED | Replacement returned; three post-repair checks timed out |
| Archive recent 1 | UNCHANGED | Public checks and separate oracle passed; no model call |
| Scoring clear 1 | BLOCK | Two public validation children timed out; no model call |
| Scoring clear 2 | UNCHANGED | Public checks and separate oracle passed; no model call |
| Archive recent 2 | BLOCK | Tokenizer succeeded; secret bridge timed out before model dispatch |
| Long recent 2 | BLOCK | Six public validation children timed out; no model call |

The ledger records two model attempts and two tokenizer attempts, within caps of two/four. Only one model request was dispatched and returned HTTP 200. The other model attempt was reserved but blocked before dispatch by `secret_resolution_failure: timeout` at 5818 ms. This confirms a bridge timeout in this run; it does not prove why the bridge stalled or retroactively establish the cause of older undifferentiated errors.

The two measured requests reserved 4110 and 1918 input tokens, projecting 6158 and 3966 with the 2048 output cap—both below the effective 7744 soft threshold. No recycling was required for these fresh corrective contexts. This does not measure long-context continuity or provider-internal compaction.

There were eleven public-check child timeouts. Separate oracle checking ran after all feedback requests; it passed the two unchanged accepted proposals. The first replacement's oracle run passed three checks and failed five through child execution, so it cannot establish repair correctness. Blocked proposals without a returned candidate were not rechecked. No hidden oracle inputs or outcomes entered feedback prompts, and no failure was retried or replaced.

## Construction and tests

The stage strictly validates proposal scope, binds public evidence, skips already-passing proposals, blocks initial execution failures, and sends at most one corrective prompt. It validates the replacement through the same public checks and never applies a patch. A fresh exclusive run directory and transport ledger prevent automatic replay. See [component and runner usage](../../PUBLIC-FEEDBACK.md).

Initial six stage tests passed after correcting a source-hash type mismatch. Two subsequent combined test attempts hit the one-second child deadline under high host load (observed load average 49.47); their reports remain preserved. The new feedback stage then explicitly selected 5000 ms per child and 120000 ms per validation; general validator defaults remain 1000/20000 ms. All twelve pre-live affected tests passed before source freeze.

After the live run, a narrow status fix changed post-repair execution failures from `REJECTED` to `BLOCK` with `feedback.validation-execution-failed`. The frozen live record keeps its original `REJECTED` value. The exact evaluated source is retained as `public-feedback.evaluated.mjs` for inspection; the current post-run version has **13/13 affected tests passing** and has not been rerun live. Explicit child timeout/output-limit reasons are also retained. No default agent policy was activated.

Evidence: [live manifest](run/manifest.json), [live aggregate](run/result.json), [pre-live tests](tests.tap), [post-run tests](tests-postrun.tap), [concurrent failure](tests-concurrent-failed.tap), [serial failure](tests-serial-failed.tap), [source verification before the status fix](source-verification.json), and [plan](PLAN.md). Run-local public proposals and validation results are under `run/`; private admission/attempt ledgers remain under `/tmp/are-public-feedback-29`. No provider reasoning was exported. The manifest binds its enumerated implementation sources; it is not an environment snapshot or a freeze of the external secret service.

## Open Questions

What causes the host/child stalls and secret bridge timeout? Host load is associated with these failures but does not prove causality. Before another live batch, isolate and measure validator execution and bridge latency under controlled load. Can a stable host complete the fixed corrective stage without changing semantic checks? Fresh end-to-end tasks, unseen-task transfer, broader windows, feedback integration into the default loop and activation remain unproven. CAV2-D65 candidate construction and local evidence grant no operational authority.
