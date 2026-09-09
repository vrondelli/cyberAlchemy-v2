# Full-schema diagnostic recovery: implementation and results

Implemented the immediate [schema-recovery plan](../../SCHEMA-RECOVERY-PLAN.md): one canonical patch schema, complete bounded diagnostics, derived native tool parameters, protected source/scope recovery and the existing one shared correction allowance. [Contract and limits](../../SCHEMA-RECOVERY.md).

The fresh twelve-condition matrix reached **12/12 final verified repairs**, from **9/12 first-pass repairs**, using **three corrective model and three tokenizer attempts**. All12 delivery gates passed;11 original submissions were schema-valid and one required format recovery. All3 recycled initial trials passed continuity. This sample meets the declared final matrix target; it does not establish production reliability.

| Window | First-pass repairs | Final verified | Minimum measured headroom |
| --- | --- | --- | --- |
| 8K | 3/4 | 4/4 | 258 |
| 10K | 4/4 | 4/4 | 303 |
| 12K | 2/4 | 4/4 | 611 |

Long8K recycled five times; scoring8K recycled twice and scoring10K once. All three passed continuity. Trials without recycling are not continuity successes. Observable local admission/recycling cannot prove absence of provider-internal compaction.

## What changed

- [Canonical schema](../../../../packages/coding-agent-runtime/schemas/patch-set-candidate.schema.json) is shared by the parser and generated native submission parameters. The existing wire version is retained, with explicit compatibility tightenings: optional rationale must be a string, non-JSON programmatic values/duplicate raw keys reject, and input/diagnostic bounds apply. A malformed changes object now returns diagnostics rather than throwing.
- [Validator](../../../../packages/coding-agent-runtime/patch-schema.mjs) reports all evaluable violations with instance/schema paths, stable codes and expected constraints. It rejects unsupported keywords and does not coerce, insert or remove fields. It implements the declared patch-schema subset, not a general JSON Schema engine.
- [Format recovery](../../../../packages/coding-agent-runtime/glm-flash-v1/format-repair.mjs) sends the full bounded diagnosis in one native request. Eligibility requires an unambiguous original protected projection of base, operation, path, file hash and exact source. Invalid metadata may be corrected together; missing source/scope is never reconstructed. A repaired format still needs semantic validation.
- Invalid agent submissions now retain structured issues and independently assessed delivery gates. The feedback handoff distinguishes an accepted candidate from a delivery-complete invalid submission. Source snapshots include the schema JSON itself.

## Live correction evidence

In the fresh matrix, long8K failed empty-history semantics and archive12K failed start-boundary semantics. Each passed after one public-feedback correction. Pairs12K omitted schema_version and passed after one schema-driven resubmission preserving the original source. All three then passed the separate oracle. Nine proposals remained unchanged. No retry, patch application or failure replacement occurred.

Final public validation passed87/87 checks across twelve proposals; including the two pre-correction semantic failures, validation recorded97/99 matched checks across14 workers. All14 workers were cleaned up. The final separate oracle passed **96/96 checks**. Initial generation used107 model/115 tokenizer attempts in783909ms; correction used3/3.

The earlier two retained diagnostic cases are separate from matrix scores. Both repaired their schema in one call with exact source preservation. The missing-authority case passed9/9 public and8/8 oracle checks. The missing-schema archive case failed one of3 public checks and stayed REJECTED because its format call consumed the shared allowance. A separately recorded diagnostic oracle passed6/8, confirming independent source defects. These retained runs used2 model/2 tokenizer attempts and cleaned up both containers. Raw results and the supplementary rejected-proposal oracle are preserved.

## Verification and handoff correction

**382 distinct local tests passed**:329 affected tests,51 default GLM entry-point tests, then10 handoff/scoring tests of which8 were already in the affected set. The first broad test run exposed eight exact-shape assertions that did not expect additive diagnostic fields; they were updated to verify both legacy reason codes and structured issues, and the complete affected suite passed. Offline corpus replay preserved22/22 previously accepted proposals and made both retained missing-field proposals eligible. These are replay results, not new live successes.

One integration defect was found before matrix correction calls: the legacy runner assumed a passed delivery gate implied candidate.json existed. The new independently recorded gate made that assumption visible. After the initial batch completed and its frozen sources were verified, the handoff was corrected to inspect explicit submission state. Ten tests and a replay of all12 recorded inputs passed; then the correction-stage sources were frozen and executed. No initial episode was rerun, and schema, prompt, candidate source, recovery budget or validation semantics were tuned after initial execution.

This is a completed initial matrix followed by an explicitly recorded adapter fix and a frozen correction stage, not a claim that the entire orchestration was unchanged end to end. See [pre-fix source verification](pre-handoff-source-verification.json), [handoff fix](handoff-fix.json), [input replay](handoff-replay.json), and [final source verification](source-verification.json).

[Initial result](initial/result.json), [feedback result](feedback/result.json), [retained authority](retained-authority/result.json), [retained schema](retained-schema/result.json), [supplementary oracle](retained-schema/rejected-proposal-oracle.json), [corpus replay](corpus-replay.json), [tests](tests.tap), [default tests](default-tests.tap), [handoff tests](handoff-tests.tap), and [construction result](construction-result.json) preserve the evidence. Previous matrix scores remain unchanged. Recovery remains an opt-in benchmark stage; no default correction policy or production deployment was activated. CAV2-D65 candidate construction under the user's implement instruction, authority effect none.

## Open Questions

Next evaluation should rerun the complete matrix with the corrected handoff frozen from the start, then add withheld tasks and repeated conditions. This run exercises both semantic and schema recovery, but only one fresh schema error and one sample per condition. Multiple simultaneous violations have deterministic test coverage, not yet live reliability evidence. The retained format-plus-semantic failure demonstrates the deliberate limit of one shared correction; changing that budget would require a separately evaluated policy. Tool-argument diagnostics, completion-policy consolidation and declarative public-case coverage remain separate planned work.
