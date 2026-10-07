# G02 cross-layer group-invitations development pair

The source-only generalized cross-layer acquisition hypothesis passed one matched ARE–DSH development pair on NodeBB group invitations (`ad093510`, pinned commit `34d99c15afd9441ab022b8feb203084a61e338b7`). The [pair decision](PAIR-DECISION.json) is based on the **raw ARE model selection**, not a post-score selector variant. The source-only task, candidate hashes, success rule, and arm budgets were frozen before dispatch. Both predictions and complete known costs were sealed before native scoring. The VPS receipt root is `/opt/are-benchmark-runs/g02-cross-layer-groups-r1`; the `FREEZE.json` SHA-256 is `f2a2bcdfe5a5b7943e8583281d3401ddb6c110750e6372415e1fed7c4c84b48b`, and `PAIR-PRE-SCORE-SEAL.json` is `f64fa3499c88ecfe58bbd4a66e708086037cf781899eedd224a88e8b3425a7de`.

| Arm | Native Span-F1 | Native File-F1 | Known model tokens | Arm seconds |
| --- | ---: | ---: | ---: | ---: |
| ARE | 0.48078 | 0.75000 | 124,945 | 177.49 |
| DSH | 0.39672 | 0.62500 | 538,686 | 252.60 |

ARE gained **0.08405 Span-F1** and **0.125 File-F1**, using **76.81% fewer tokens** and **29.73% less arm time**. Both arms returned valid selections on the same task and commit. The native score receipts are `evidence/run/native-score.json` (SHA-256 `0c685fb13ff4287998101932a62cfbbffe662e7ddbf0b2dfedbf1480a3ce24eb`) and `dsh-export/native-score.json` (`8ce9cd4fbc50dc67be6da9a0c145add273f60acc768b490176931567ffbeb656`) under the VPS root.

The same ranker then [failed the strict quality gate](../g02-cross-layer-emails-pair-r1/RESULT-NOTE.md) on a second matched NodeBB email/ACP task. Read this pair as one successful development row, not as a two-task breadth pass.

The live ARE initial packet delivered a group OpenAPI source and client group-details source alongside API/controller reads. Its raw final selection covered six of ten gold files with no false-positive files; DSH covered five of ten with one false positive. This is consistent with, but does not isolate, a contribution from the new acquisition rule: the arms differ in their broader architecture. The dataset was used in earlier round-30 research, so this task is **not globally unseen**, even though no task-specific G02 evidence was found before this pair. One task cannot prove broad accuracy generalization.

After primary scoring, the opt-in final selector added two delivered files. File-F1 increased to **0.77778**, but Span-F1 fell to **0.44909**. That variant is a post-score diagnostic, not the frozen primary result, and should not be adopted on this evidence alone.

## Open Questions

- Will the acquisition candidate pass a second source-only matched task with a different cross-layer objective, without relying on this task's labels?
- Can a final selector improve file recall without systematically adding low-precision spans?
- What independent holdout, outside the round-30-exposed ContextBench identities, is available for a generalization claim?
