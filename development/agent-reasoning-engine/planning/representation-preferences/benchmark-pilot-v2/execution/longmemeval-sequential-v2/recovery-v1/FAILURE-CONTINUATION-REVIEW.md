# Independent remaining-slot continuation review

Reviewer: `/root/pilot_selectivity`. Date: 2026-09-18. Authority effect: none.
Recommendation: a separately frozen, explicitly disclosed continuation of the sole
remaining independent control slot is scientifically defensible for completing fixed
slot accounting. It must not be presented as a clean completion of the original
preregistered run or as erasing its global-stop failure. No calls were made here.

## Verified boundary

Read only stopped-boundary metadata and the failed receipt, not answer content.
The authoritative result records 57 successful generations, 14 final answers,
139074 known sequential-v2 tokens, and `incomplete-output` at repetition 2,
abstention task, treatment ingestion step 1. Its failed receipt has `length`,
3629 input plus 384 completion tokens, including 60 reasoning tokens: **4013 tokens**.
Those tokens are already included in 139074 and must not be added a second time.
The treatment's step 0 succeeded; step 1 failed; the later ingestion and final answer
are blocked by that failure. They cannot be silently converted into attempted passes.

## Scientific judgment

The proposed control slot is a separate task/arm episode with empty initial notes
under the original design. It does not consume failed treatment notes, need recovery
of partial treatment state, or require any changed input. Finishing its originally
scheduled three ingestion calls and answer measures a predetermined missing slot;
it is not selection of a better-looking substitute. No retry of the failed treatment,
cap increase, output repair or change to scored examples is justified by this review.

However, this departs from the original global-stop rule after results became
available. Preserve the original run's stopped status and primary stopped-run report.
Label subsequent evidence as an amended continuation, document when and why the
amendment was made, and keep the executed schedule and all failures visible. Any
arm comparison combining the continuation with prior answers is descriptive under
this amendment, not an untouched preregistered completion.

## Required accounting and execution conditions

1. Freeze exactly the remaining repetition-2 abstention control slot, unchanged
   prompts, model, notes/answer caps, source chunks, order and rubric. No other
   outstanding or failed generation is admitted. Verify no model start already
   exists for any of those four IDs before dispatch.
2. Keep treatment's final-answer slot as completion failure, with ingestion-step-1
   failure and subsequent ingestion/answer blocked as its causal explanation.
   If the new control succeeds, report **15 completed answers and 1 failed slot
   out of 16**, not 15/15 or 16 successful answers. A further failure remains visible.
3. For quality-with-completion metrics, failed task slots count as failures in the
   fixed eight-per-arm denominator. Conditional accuracy among completed outputs
   may be supplementary with its explicit smaller denominator. Do not score a
   missing answer as a generated abstention or exclude the failed treatment pair
   when describing overall task success.
4. Preserve generation disposition counts. At this boundary there are 57 successful,
   1 failed, 2 blocked-by-treatment-failure, and 4 remaining planned generation slots.
   If the control finishes, the schedule has 61 successful, 1 failed and 2 blocked
   slots, totaling the originally planned 64; it does not have 64 successful calls.
5. Carry 139074 tokens into continuation accounting. The remaining v2 allowance is
   **60425** under 199499; add the v1 5301 once for the full branch ceiling of 204800.
   The four new calls must pass actual tokenizer and cumulative-budget admission.
   Preserve unknown-usage stops and no automatic retry.
6. Blind-review the new answer under the same pinned native rubric, without using
   prior answer scores to alter the remaining task. Record completion and quality
   separately; a completed control cannot repair treatment's missing outcome.

No new quality hypothesis or model improvement is proved by this operational step.
A future confirmatory study could preregister per-independent-task failure isolation
and run all fixed slots under that rule. This amendment supplies useful diagnostic
evidence while preserving the limitations of the current episode.

## Reviewed boundary hashes

Paths relative to this directory; SHA-256 byte hashes.

| File | SHA-256 |
| --- | --- |
| `live/result.json` | `9091e790c74ee10daf330b17549523222659a0b39d2e7ea67c6dde19acd68e28` |
| `live/r2-longmemeval-eeda8a6d_abs-treatment-ingestion-1-receipt.json` | `47ba39d4f4e832f6fd7eeb92d60e19912e365a70a399b6122f307b8c0d82aecf` |

## Open Questions

Coordinator owns implementation review and immutable amendment freeze, suffix start
checks, actual token admission, blind review, and full disposition synthesis. The
reason for note verbosity/exhaustion and any model-quality advantage remain empirical
questions; no further treatment retry is recommended by this review.
