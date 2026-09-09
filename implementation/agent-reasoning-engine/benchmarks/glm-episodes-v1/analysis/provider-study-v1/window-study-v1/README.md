# H13 window and variant replication

[H13](prepared/hypothesis.json) succeeds the [verified H12 pair](../pressure-v5/verification.json), using the canonical ARE hypothesis, experiment, observation and learning-decision APIs. Selected ontology definitions: ARE-RL-D01/D02/D03/D04/D07 in [research-learning-v1](../../../../../packages/evolution-runtime/ontology/research-learning-v1.json). No registry or serving authority is claimed.

The [frozen schedule](prepared/schedule.json) has 24 trials: original versus the exact H12 byte-bounded candidate, three windows, two archive repair variants and two repetitions. Arm order alternates. Each pair shares fixture bytes, prompt, request limit and window; only the pager changes. The [manifest](prepared/manifest.json) pins source and artifact bytes and the parent engine freeze.

Pressure is intentionally synthetic: a 13,000-code-point inspected inventory plus 120, 350 or 680 persistent synthetic labels at 8K, 10K or 12K. The latter two label counts are prospective extrapolations, not previously calibrated results. Actual measured exposure is an endpoint. A repair without actual recycling does not qualify for recovery success.

Acceptance: all 12 candidate trials pass semantic checks and the canonical output contract, confirm every required read and archive recovery, contain no unknown delivery, and keep all dispatched projected bounds below `soft_limit - 256`. The hard limit is 16,384. This is a strict replication screen, not a population-level reliability estimate. Delayed/revised facts and new task families remain separate.

Maximum study spend: 320 model calls and 640 tokenizer calls. Concurrency one; no retries or replacement rows. Existing transport enforces 16/32 attempts at 8K and 12/24 at 10K/12K. The controller finishes a matched block and stops for review after a candidate failure; transport failure stops immediately. An interrupted reservation cannot automatically rerun. A retained stop requires a separately reviewed successor, not deleting state.

From the repository root, `run.mjs CREDENTIAL_CONFIG MAX_NEW_BLOCKS` resumes the same designated `live/` directory. `review.mjs NEW_OUTPUT_DIRECTORY` emits a bound immutable snapshot and canonical research records for completed trials. Pending spending must be read from transport ledgers, not inferred from completed-row totals.

Two controls in `check.test.mjs` verify schedule coverage/budgets/order and prevent missing exposure, unknown delivery, threshold equality or failed receipts from qualifying. The H12 pager's exact-byte/Unicode tests remain applicable because the candidate bytes are unchanged.

## Observed stop

The first 10K pair completed and triggered the predeclared stop. Original pager blocked on oversized fresh context; byte pager recycled twice and recovered, but its final output omitted `schema_version` and retained the surrogate-start defect. The [canonical review](review-1/research.json) records counterevidence. The [raw-source audit](rejected-source-audit/result.json) passed 5/6 cases. Remaining rows were not dispatched or replaced.

The [H14 successor](../contract-window-v1/README.md) tests a general final contract review on the same byte pager. It is a new cohort with its own declared cap.

## Construction boundary

CAV2-D65 frontier: replicate the candidate across windows and variants. Owner: ARE implementer; evaluator owns count and endpoint integrity. Owner-directed native experiment under CA2-ROUTE-IMPLEMENT request `glm-window-replication-60`, effect `window-replication60`. Scope is this package and source-linked research notes. No serving change, commit, publication or activation. The credential bridge and pinned container are available operational prerequisites; later adoption remains user-owned.

## Open Questions

Do the extrapolated pressure settings actually cause recovery at 10K and 12K? Does the byte cap preserve semantics and fit the unchanged turn budget on the second variant? Does archive retrieval imply enough retained task knowledge to pass delayed and revised-fact checks? Is the effect reproducible on natural Unicode-heavy files and other families?
