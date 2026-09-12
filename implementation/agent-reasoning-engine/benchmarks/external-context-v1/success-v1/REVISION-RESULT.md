# Outcome-driven revision: first live result

The model-generated patch passes both public reproduction modes and all **67/67 repair labels**, but passes only **5108/5120 regression labels**. Twelve regressions remain; M1 is not achieved. No second evaluation or pressure episode was run because the all-pass prerequisite failed.

[Evaluator report](evidence/revision-1/evaluation/report.json) · [exact model patch](evidence/revision-1/prediction.patch) · [independent audit](assessment-revision-1.json) · [behavior comparison](revision-comparison.json) · [research observation and decision](revision-research-result.json).

## Implementation and verification

New isolated controller phases permit evidence-driven investigation and revision after a failed probe, require testing each staged candidate, and allow explicit inability instead of forced submission. Invalid exact edits receive actionable feedback. Prior frozen sources and all failed attempts remain unchanged. Five new tests passed for revision availability, stage/test/submission binding, limits, whole-schema inability validation, and edit feedback. The live runner and analysis script passed syntax checks.

The fresh episode completed in 126 seconds with nine model calls, ten tokenizer calls, one staged candidate, one public probe and zero rejected edits. Previous attempt 3 used 21 model calls and made two rejected placeholder-edit attempts. However, this run passed its first public candidate, so it **did not exercise revision after failure or the inability path**. It cannot establish that the new revision mechanism caused the improvement. The deterministic tests cover those paths; their live effectiveness remains open.

One context recycle occurred. The maximum admitted input-plus-output bound was 10,849, below 12,000. Accounting and projection replay passed, and rollout, probe and evaluator cleanup were verified. The completed model-call list-price estimate was USD 0.00891745 under the retained assumptions. No private tests or previous model patches were supplied to this fresh model episode. This is one development example under the custom evaluator, not an official leaderboard score or broad model qualification.

## Remaining failure

The model moved `state.instance_level_snippets` into the asynchronous branch of `transform-client.js`, removing them from their previous unconditional placement. The public awaited-variable case now works. Inspection of the exact model diff shows the synchronous branch no longer receives those declarations. The evaluator reports six snippet-related scenarios failing in both DOM and hydrate modes (12 total); its parsed outcomes are retained in [status.json](evidence/revision-1/evaluation/status.json). No expected labels were missing.

Patch SHA-256: `79e0d6e6b783d76f633d7138bb7af6df7f932a7ea4dc2bc39fbb2bc465efcb88`.

## Next intervention and Open Questions

Add an operator-authored public synchronous snippet control beside the asynchronous reproduction, derived from the public language behavior and candidate branch change. Freeze both checks before a fresh bounded model run. Require both to pass before submission, then evaluate privately and repeat only if all 67 repair and 5120 regression labels pass. Keep evaluator-only test bodies and reference patches outside the model loop.

Does the added public control catch this branch-preservation failure before finalization? Can the model then revise a failing candidate correctly? Those questions remain unanswered, as does the fresh pressure milestone after M1.
