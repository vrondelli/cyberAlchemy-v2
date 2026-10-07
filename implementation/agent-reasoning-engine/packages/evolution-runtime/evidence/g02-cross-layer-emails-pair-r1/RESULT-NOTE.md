# G02 cross-layer email/ACP development pair: quality failure

The second source-only matched pair used the **same candidate ranker hash** (`d5b0f35d35caf526e3438e97ab1146421f60f010a03866b6d1d2f5f5d9a6c2ce`) as the [group-invitations pair](../g02-cross-layer-groups-pair-r1/RESULT-NOTE.md), on NodeBB email-validation/ACP task `4eb0e647`. Both predictions and known costs were sealed before native scoring. The VPS receipt root is `/opt/are-benchmark-runs/g02-cross-layer-emails-r1`; `FREEZE.json` SHA-256 is `61e81b29520cac89fa00cdf1578236b9211c78c3c7a5797c4e6a53d5cbc5b867`, and `PAIR-PRE-SCORE-SEAL.json` is `3ad79e48dde1c11684dada701f9a534df6b47a27452fe7c9454ba945d6c3e0e5`.

| Arm | Native Span-F1 | Native File-F1 | Known model tokens | Arm seconds |
| --- | ---: | ---: | ---: | ---: |
| ARE | 0.27302 | 0.30000 | 153,712 | 185.36 |
| DSH | 0.29480 | 0.30000 | 285,322 | 197.76 |

ARE used **46.13% fewer tokens** and **6.27% less arm time**, but lost Span-F1 by **0.02179** and only tied File-F1. Therefore the predeclared strict four-gate decision is **fail-quality**, not a candidate win. The [decision receipt](PAIR-DECISION.json) is a compact local view; full native score receipts remain under the VPS root (`evidence/run/native-score.json` SHA-256 `ceb404ac8ee9539869a8570b8da1870508d71d1ede0405b0fff33d6f3f2d4d73`; `dsh-export/native-score.json` `e28c2b1872010e49ad2f4102b7451e330df1b1e7c5b741d5c027b8c81d2486e7`).

The initial ARE packet included an email settings template and OpenAPI source, but also a likely irrelevant admin-groups controller. Its final selection covered four files; the gold spans 16, including admin users, email/user code, language files, and several database backends. DSH also selected four files. This indicates a broader dependency-closure problem; merely adding UI/schema hints is insufficient on this task. These labels are now exposed and may guide mechanism diagnosis, not a retrospective win claim.

The two pairs together show strong token savings, one four-gate pass, and one valid quality failure. The candidate is not yet a general G02 improvement.

## Open Questions

- Can source-only dependency closure from the task's email validation behavior recover backend hash/database and language surfaces without flooding the final context?
- Should the next test use an external or otherwise independent holdout, since the prior round-30 campaign already touched ContextBench identities?
