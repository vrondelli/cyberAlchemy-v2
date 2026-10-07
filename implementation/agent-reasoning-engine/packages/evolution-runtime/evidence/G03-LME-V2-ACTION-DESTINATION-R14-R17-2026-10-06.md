# G03 LongMemEval-V2 action destination r14–r17, 2026-10-06

Status: **repeatedly exposed development only; no confirmation or LongMemEval-V2 superiority claim**. This follows the [r13 source audit](G03-LME-V2-TRANSITION-AVAILABILITY-R13-2026-10-06.md).

## Intervention and result

The [r14 exact-action screen](../research/g03-beam-r1/screen-lme-v2-action-witness-r14.py) found five quoted-action cues in the 28 exposed questions and an exact trajectory action witness in four. Its private `ACTION-WITNESSES-R14.json` is SHA-256 `0075d0ec84e4771dabc6d68a792cb4da8014407d4e6c8dbac71599a534e54042`. It is an action-availability screen, not answer reach.

The [r15 packet builder](../research/g03-beam-r1/build-lme-v2-destination-premise-r15.py) kept 27/28 r12 treatment packets and every inherited lexical control packet byte-equivalent. Only exposed Magento question `6a7f0d24` changed: the packet now renders the observed `View Details` click, unchanged `Products` page title, and the resulting dialog's visible fields instead of presuming a new `Result` page. The private `DEV-WIRES-R15.json` is SHA-256 `d3bd2d763beb332d2fdaaee071cbc31f6488f258c33b54ffe16594aec92773f3`. Source selection used question text, source trajectories and action witnesses, not reference answer, evaluator, or confirmation questions.

The [r15 runner](../research/g03-beam-r1/run-lme-v2-dev-destination-r15.mjs) made one admitted-under-8K GLM-5.3-Flash reader request with no retry and one valid answer. Private `RESULT.json` SHA-256: `495f9f7dc7a91d8e34a33aa9e41b1683609b9a781ae39922a985b268b05b22dd`; 484 prompt and 55 completion tokens. Two arm-blind GLM-adapted official-rubric votes from the [r16 runner](../research/g03-beam-r1/run-lme-v2-dev-destination-judges-r16.mjs) both assigned binary correct, with no retry or vote disagreement. Private judge `RESULT.json` SHA-256: `cfd533588c162ef638c21b33afdfdf854991688fc62a63a4fdc96776a113f0eb`. The independent [score audit](../research/g03-beam-r1/score-lme-v2-dev-destination-r16.py) is private `SCORE.json`, SHA-256 `9b313d64a87c92582ab1264f092a54644f0f4fbcc86b3fd0a603cb0381858cf1`.

The cumulative exposed-development treatment is now **13/28**, versus inherited lexical control **3–4/28**. On 27 resolved pairs: 3 both correct, 10 treatment-only, 0 control-only, 14 both wrong; exact two-sided McNemar p=0.001953125. This p-value is **descriptive only** because the same 28 questions have been repeatedly inspected and tuned. Absolute treatment accuracy is only 46.4%. The r15 gain is one repaired item, not a general action-destination improvement.

## Separate development freeze

The [r17 metadata-only cohort selector](../research/g03-beam-r1/freeze-lme-v2-reserve-development-r17.py) froze 26 reserve IDs before reading their question text, gold, or making model calls: two deterministic IDs in each of the **13 strata actually populated in reserve**. `enterprise/procedure-abs` has zero reserve IDs after the original split, so no confirmation ID was borrowed to manufacture a 14-cell design. The private `RESERVE-DEV-R17.json` is SHA-256 `73a339ee139501baf081e3f6f88d51836155e4cbdb4052320a58e00bc9756a20`; four selected questions have images. Their exact public PNGs were downloaded from the pinned dataset revision into private WSL storage; all four match the published `checksums.sha256` (`7586cf7c`, `af2ebaed`, `1d864942`, `77258cda`; 244 KiB combined). No full screenshot bundle was downloaded or sent to the VPS.

The official [LongMemEval-V2 repository](https://github.com/xiaowu0162/LongMemEval-V2) and [leaderboard contract](https://github.com/xiaowu0162/LongMemEval-V2/blob/main/leaderboard/README.md) require different reader/judge and full accuracy-latency protocol. A future matched-GLM result must be labeled as such; these custom-reader, GLM-adapted-judge development scores cannot be relabeled as official V2 performance.

## Next gate

Project only the 26 frozen question texts/images and each ID's small-tier haystack through the already defined source-only retrieval logic; freeze both arms and validity budgets before provider calls. Run a matched, arm-blind comparison on this distinct development cohort, then freeze an advancement threshold before touching the 140-question confirmation partition. Do not tune further against the original 28 or present its repeated-testing p-value as inferential evidence.

Prospective r18 advancement threshold, frozen before any reserve-development provider calls: all **52** paired reader requests must be tokenizer-admitted under 8K and produce valid non-truncated answers; the treatment must score at least **14/26** (53.8%), exceed control by at least **8** correct answers, and the resolved-pair two-sided exact McNemar p-value must be at most **0.05**. Any unresolved judgment affecting these thresholds fails admission until independently resolved without changing reader answers. Passing this is only a gate to the 140-question confirmation comparison, not a superiority claim. The same frozen source-only r15 family and same GLM reader must be used in both arms; no reserve-answer-driven repair is allowed before the confirmation decision.

## Open Questions

- Does the action-destination mechanism transfer beyond the one repaired exposed item, and is the 26-question absolute score high enough for confirmation?
- Which image-bearing questions require visual trajectory evidence in addition to the question screenshot?
- Can the official fixed reader, judge and latency protocol be deployed without exceeding WSL/VPS capacity and without changing the private matched-GLM claim boundary?
