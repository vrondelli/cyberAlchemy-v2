# G03 LongMemEval-V2 reserve development r18–r21, 2026-10-06

Status: **prospective second-development advancement gate failed; confirmation remains closed; no superiority claim**. This follows the [r14–r17 candidate and cohort freeze](G03-LME-V2-ACTION-DESTINATION-R14-R17-2026-10-06.md).

## Frozen setup

The [r18 packet builder](../research/g03-beam-r1/build-lme-v2-reserve-dev-r18.py) projected only the 26 metadata-frozen reserve question texts/images, their small-tier haystack IDs, pinned source trajectories, and pre-existing retrieval indexes. It read no reference answer, evaluator, or confirmation question fields. The private `RESERVE-DEV-WIRES-R18.json` SHA-256 is `f4d01912d4b95a02deec2b4f382bbcf773c8edd9886dda1839a5709335dfac21`. All 26 treatment packets took the existing site-scoped page/action-path branch; none triggered the exposed-development form or exact-action destination overlays. All 26 control/treatment evidence selections differ. This is a transfer test of the frozen r15 *family*, with the r9 branch active for this cohort—not evidence that the one-item r15 repair generalized.

The advancement threshold was [recorded before provider calls](G03-LME-V2-ACTION-DESTINATION-R14-R17-2026-10-06.md): 52/52 admitted valid reader answers; treatment at least 14/26; treatment at least eight correct answers above control; resolved-pair exact McNemar p≤0.05; no unresolved judgment affecting admission. Passing would only authorize consideration of the 140-question confirmation, not a claim.

The [r18 reader runner](../research/g03-beam-r1/run-lme-v2-reserve-dev-r18.mjs) used the same GLM-5.3-Flash 8K reader prompt for both arms, no retry, and the four checksum-verified question images. All **52/52** tokenizer checks passed and all **52/52** generated answers were valid and non-truncated. Private WSL cold-copy `g03-lme-v2-reserve-dev-run-r18/RESULT.json` SHA-256: `5b6b2ee11fa10cd2691fd1cb1a4fb940118ab2909d0ce4212a131e2627baa8ae`.

The [r19 deterministic scorer](../research/g03-beam-r1/score-lme-v2-reserve-deterministic-r19.py) audited every raw reader receipt and applied the pinned official deterministic evaluators: 12 pairs, **3 control versus 3 treatment** correct. Private `DETERMINISTIC-SCORE-R19.json` SHA-256: `c2e9bed37ec4ecaea4193e2a4031748d3cb594285290cd9d5f9e15b03c14877a`.

The [r20 judge builder](../research/g03-beam-r1/build-lme-v2-reserve-judges-r20.py) froze 56 arm-blind wires—two votes for each of 28 pending arm answers—using the pinned official rubric prompts with GLM substituted for the official judge. Private `JUDGE-WIRES-R20.json` SHA-256: `889c5904897d2e222ad4d4c96d62d16b838a24438314999467992adf0953a792`; private arm map SHA-256: `ff11acc1c18c28aa44b7eae85a95b10e8e043236d36ded4d6ebbac9bc72e92ee`. The [r20 runner](../research/g03-beam-r1/run-lme-v2-reserve-judges-r20.mjs) completed **56/56** tokenizer checks and **56/56** judge requests with zero invalid provider responses and no retries. Cold-copy `g03-lme-v2-reserve-judge-run-r20/RESULT.json` SHA-256: `811fc150fc7985ea329c6dd7ca12660c2b86b3cb735eebd4f7a09b5f81c1e10a`.

## Result and decision

The independently implemented [r21 receipt-and-score audit](../research/g03-beam-r1/score-lme-v2-reserve-final-r21.py) reports treatment **5–6/26** (one two-vote disagreement) versus control **3/26**. On 25 resolved pairs: both correct 2, treatment-only 3, control-only 1, both wrong 19; two-sided exact McNemar **p=0.625**. Even assigning the unresolved treatment answer correct yields only 6/26, well below 14/26. Private `SCORE-R21.json` SHA-256: `2887ade8a0098320bfb0eac59c829a4d0c3e4554a1487878cea80b32dc76dd4f`. The preregistered advancement gate **failed**; do not open or run the 140-question confirmation set with this candidate.

By question type, treatment correctly handled 3/4 procedure, 1/4 errors-gotchas, and 1/4 static-environment-abs. It scored 0/4 in both dynamic-environment categories, 0/2 procedure-abs, and 0/4 static-environment. The two-vote disagreement is one enterprise errors-gotchas treatment; resolving it cannot change the failed gate. These are small descriptive cells, not evidence of category superiority.

The official [LongMemEval-V2 leaderboard contract](https://github.com/xiaowu0162/LongMemEval-V2/blob/main/leaderboard/README.md) additionally requires the fixed reader/judge and accuracy-latency protocol. This matched-GLM development result is neither an official V2 result nor a product-page superiority result.

## Next hypothesis boundary

Retire the exact r15/r18 candidate for confirmation. A new mechanism needs source-grounded answer reach for dynamic state and image-bearing questions, not another rank-only tweak to the same textual page-state packets. Any replacement must be designed and source-screened on the exposed 28 and, if necessary, this now-exposed 26; then reserve a **new** independent question cohort before making a superiority claim. Preserve the existing 140-question confirmation IDs until a genuinely frozen candidate passes a separate development gate. Do not weaken the failed 14/26 threshold retroactively or score the same answers under a new rubric to rescue this run.

A metadata-only remaining-supply audit of the original reserve partition, excluding the 26 used here, leaves **257** unopened reserve IDs. The four dynamic strata retain 21 enterprise dynamic, 6 enterprise dynamic-abs, 37 web dynamic, and 7 web dynamic-abs IDs. The enterprise errors-gotchas stratum is exhausted and web errors-gotchas has only one remaining image-bearing ID. Thus a new **dynamic-specific** holdout is feasible, but another 13-cell balanced transfer with meaningful image-error coverage is not; do not borrow confirmation IDs to make it appear balanced. This is partition inventory, not question-text or gold inspection.

The pinned [official AgentRunbook-R implementation](https://github.com/xiaowu0162/LongMemEval-V2/blob/main/memory_modules/agentrunbook_r.py) distinguishes raw state slices, state-transition events, and reusable notes; its event builder sees the exact pre/post AXTree **and screenshots**, and its query generator separates raw-surface queries from event and note queries. That is a concrete research lead for the next source-grounded mechanism, not evidence that importing its recipe would improve ARE. A bounded next test should compare answer-bearing transition reach on the already exposed dynamic questions before paying for event generation or consuming fresh IDs.

## Open Questions

- Which missing answer evidence lives in trajectory screenshots rather than AXTree text, especially for dynamic-environment questions?
- Can an action-conditioned trajectory model retrieve the relevant before/after state and support the official 8K reader without fabricated absence claims?
- What independent reserve supply remains by domain × type after excluding both exposed development cohorts, and should a new holdout be balanced differently?
