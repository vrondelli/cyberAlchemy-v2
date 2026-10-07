# G02 fresh Flipt ui.enabled matched pair: four-gate pass

The prospectively frozen, untouched `SWE-Bench-Pro__go__maintenance__bugfix__40a717e5`
pair completed on base commit `266e5e143e87519047b9be3202a0aba273b83de3`.
ARE and DSH predictions were [hash-sealed](PAIR-PRE-SCORE-SEAL.json) before
native scoring. The [verified pair decision](verified-pair-r2/PAIR-DECISION.json)
reran the pinned ContextBench scorer after checking the seal, task identity,
run settlements, and complete model-cost accounting.

| Arm | Span-F1 | File-F1 | Known model tokens | Wall seconds |
| --- | ---: | ---: | ---: | ---: |
| ARE GLM treatment | 0.64081 | 0.72727 | 173,361 | 183.94 |
| DSH control | 0.55148 | 0.55556 | 940,674 | 485.71 |

ARE improved Span-F1 by 0.08933 (16.20% relative) and File-F1 by 0.17172
(30.91% relative), while using 81.57% fewer model tokens and 62.13% less wall
time. Both native scores are valid; all four predeclared strict gates pass.
This is a **one-task comparative qualification**, not a full ContextBench
campaign or proof of the high-level cross-benchmark goal.

Mechanism audit: the source-only packet delivered ten receipt-confirmed reads,
including `ui.go`, deprecation methods, defaults, and schemas. The model's
own final selection already beat DSH at Span/File-F1 `0.66498`/`0.70000`.
The frozen focused-read selector added four confirmed reads but only two new
files (`config/default.yml` and `internal/config/testdata/default.yml`); it
raised File-F1 to `0.72727` and reduced Span-F1 to `0.64081`. Do not attribute
the entire gain to the selector: acquisition plus model selection carried a
substantial gain, and the selector traded some span precision for file
coverage. The next test should keep both raw and selected predictions visible.

Source and receipts: [freeze](FRESH-PAIR-FREEZE.json),
[source-only task](source-only-task.json), [ARE pre-score seal](ARE-PRE-SCORE-SEAL.json),
[ARE candidate](candidate-prediction.json), [raw model prediction](model-prediction.json),
[selector receipt](selector-receipt.json), [DSH prediction](dsh-prediction.json),
[DSH export](dsh-EXPORT.json), [ARE settlement](SETTLEMENT.json),
[DSH settlement](dsh-SETTLEMENT.json), [ARE native score](are-native-score.json),
[DSH native score](dsh-native-score.json), and [raw model score](model-native-score.json).
The [ARE receipt archive](are-receipts.tar.gz) has SHA-256
`600297e270b12f754e7764e45489a028ca8922457cffc4ebeed611558d0de3af`;
the [DSH receipt archive](dsh-receipts.tar.gz) has SHA-256
`1a8387c7945904a5f771afa874d077df09c0d9a2065f331d0451d073108d430d`.
Both exclude source checkouts and secret files.

## Open Questions

- Does the result replicate on another untouched configuration task, including
  one where the named-component/deprecation rule abstains or changes shape?
- How much of the span gain persists across a broader ContextBench cohort?
