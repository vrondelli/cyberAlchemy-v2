# G03 LongMemEval-V2 coverage screen r11 and form hybrid r12, 2026-10-05

Status: **audited exposed development improvement; no confirmation or superiority claim**. This follows the [r9–r10 state/transition result](G03-LME-V2-STATE-TRANSITION-R9-R10-2026-10-05.md).

## r11 source-only screen

The [r11 builder](../research/g03-beam-r1/build-lme-v2-evidence-coverage-r11.py) reused the pinned r9 state index and source trajectories and produced 28 bounded, field-ranked packets. It did not read evaluator gold, question types, or confirmation question fields. Its private `DEV-WIRES-R11.json` SHA-256 is `f97f924ebf9d781a1375566ab9aecfccc189db5e74e1cea03db0b8f92a4ce8ff` under `/home/vlad_/are-benchmark-archive/g03-lme-v2-feasibility-20261005/`.

Source-only inspection failed the evidence-coverage screen: the forum search gotcha packet lost its answer-bearing search result; the Outlook form packet ranked a task panel containing an Outlook instruction above the actual User form; and the problem-category packet ranked generic cross-record search results rather than a create-Problem state transition. The five-item catalog form packet did recover the earlier specialized view. Because the broad selector displaced known source evidence, **r11 was rejected before tokenizer or GLM calls**. Its packets remain private diagnostic artifacts, not scored answers.

## r12 narrowed source-only hybrid

The [r12 builder](../research/g03-beam-r1/build-lme-v2-form-hybrid-r12.py) preserved r9 treatment and control packets except where question text explicitly requested (1) an A–E `Order Now` item-form comparison or (2) integration among a slash-delimited list of forms. The latter selector accepts the question's `intergrates` spelling and requires observed, matching page-state fields on a listed form; generic task panels and search results are excluded. No answer, evaluator, question-type label, or confirmation question field entered selection. The first packet-build pass missed that spelling and changed only the item comparison; it was not run. The corrected private `DEV-WIRES-R12B.json` changed exactly two treatment packets and has SHA-256 `a4acebf4dde831d8fbc249f364b4b266bdace8a74d8e0aca295672108e14ebbd`.

The five-item packet is byte-identical to the previously valid r3 source-grounded form evidence and produced the same reader request SHA-256 `fc565dcef59f4f86df5ca9139cb6c5f3de6749cf519266de8c70cf82fcad36ab`. Its earlier valid, deterministic-rule-correct answer was inherited, not billed again. The newly selected User-form packet shows observed `Calendar integration` value `Outlook` on two User page states. The [r12 runner](../research/g03-beam-r1/run-lme-v2-dev-form-hybrid-r12.mjs) admitted its one new request under 8K and completed one valid, zero-retry GLM-5.3-Flash answer call. Private VPS raw receipts have a WSL cold copy at `/home/vlad_/are-benchmark-archive/g03-lme-v2-dev-form-run-r12b/`; `RESULT.json` SHA-256 is `177e8849fa28852060cd58d7d8dd2a07a559f1b3bffd9cc7fa5528c95e456b0a`. That call consumed 375 known prompt and 7 completion tokens and 3,231 ms provider elapsed time; it does not imply campaign efficiency superiority.

The [r12 scorer](../research/g03-beam-r1/score-lme-v2-dev-form-hybrid-r12.py) verified source, packet, r9 score, r5/r4 inherited request and raw-answer receipts, and the new tokenizer/answer hashes. It applied the pinned official deterministic phrase-set rule to the new answer. Both changed cases were correct. The private `SCORE.json` SHA-256 is `cb485266348ca21a1bf0ea249a73558191363eec494c9a1a9d68d02089b0e9d9`.

On the **same repeatedly exposed 28-question development set**, r12 treatment is **12/28**, versus r9 **10/28** and the unchanged inherited lexical control **3–4/28**. On 27 resolved control/r12 pairs: 3 both correct, 9 treatment-only, 0 control-only, and 15 both wrong; exact two-sided McNemar p = **0.00390625**. This p-value is descriptive for a repeatedly tuned development set, **not** confirmatory. The 140 confirmation questions remain unopened for answering or scoring. The shared 200 source trajectories mean the split is a question holdout, not a trajectory-content holdout.

Absolute development accuracy is only 42.9%; the candidate was tuned after multiple exposed rounds, the reader and GLM-adapted judge are custom rather than the official V2 backend/reader/latency protocol, one inherited control judgment remains split, and no fresh independent comparator was run. Therefore neither native V2 leaderboard superiority nor a product-page/general ARE superiority claim follows.

## Next boundary

Stop spending repeated GLM calls on the same 28 development questions without a new mechanism and a prospective freeze. The next research step is source-only evidence sufficiency for dynamic form transitions and search-result gotchas, plus native official-comparator feasibility and cost measurement. A confirmation dispatch would require a frozen candidate, validity/cost thresholds, and an explicit claim target; the present 12/28 absolute result is not by itself a strong reason to consume the reserved 140 questions. G01, G02 and the BEAM r13 human-review gate remain separate.

## Open Questions

- Can transition-specific before/after field evidence solve dynamic form questions without task-panel leakage?
- What absolute accuracy and cost thresholds should be required before spending the independent question holdout?
- Which native official V2 comparator can be reproduced under the same provider and latency constraints?
