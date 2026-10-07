# G02 database-closure bulk-increment development pair

A revised source-only database API-implementation closure candidate passed one matched ARE–DSH development pair on NodeBB bulk field increments (`7b6185af`, pinned commit `a2ebf53b6098635c3abcab3fd9144c766e32b350`). The task had no task-specific G02 result in the evidence tree before selection, but earlier round-30 ContextBench work touched the dataset; this is **not a globally unseen holdout**. The candidate was frozen before either arm dispatched, and both predictions and costs were sealed before native scoring. Full receipts are on the GLM VPS at `/opt/are-benchmark-runs/g02-cross-layer-bulk-r1`.

| Arm | Native Span-F1 | Native File-F1 | Known model tokens | Arm seconds |
| --- | ---: | ---: | ---: | ---: |
| ARE | 0.37360 | 0.63636 | 255,324 | 230.44 |
| DSH | 0.35381 | 0.31579 | 279,477 | 247.77 |

ARE gained **0.01979 Span-F1** and **0.32057 File-F1**, using **8.64% fewer tokens** and **6.99% less arm time**. Thus the predeclared strict four-gate decision is **pass**, with narrow span and efficiency margins. The [decision receipt](PAIR-DECISION.json) is the compact local view. VPS `FREEZE.json` SHA-256 is `0df729775687a405c67356bcb0b7f62e800d39abd6f70ca2230f1be81c0f4f82`; `PAIR-PRE-SCORE-SEAL.json` is `ff7adde3b01f929a4f88492b5df2ac7cd33387a2627230282bb055d785dd8d04`. Native score SHA-256 anchors are `50bd8ca9e9dca64f6b1c014ed3ccf95e2c47ac2167c7ee64c2ce93b1489e7442` for ARE and `e571bcb645dba96d4df63bd450cfd96191a6e026acb2ad5faa5a9b88874dd7c5` for DSH.

The initial ARE packet contained database test and Mongo/Postgres/Redis implementation paths; its raw final selection retained seven database/test files. This verifies the backend-closure mechanism was exercised, but does not isolate its causal contribution from the broader ARE-vs-DSH difference. The predecessor [email pair](../g02-cross-layer-emails-pair-r1/RESULT-NOTE.md) failed quality; its later [ARE-only diagnostic](../g02-db-closure-email-diagnostic-r1/RESULT-NOTE.md) was exposed-task evidence and is not part of this paired pass.

## Open Questions

- Does the fixed backend-closure candidate pass additional task types without erasing the efficiency advantage?
- Can token and wall-time margins be made meaningfully larger while retaining the new file recall?
- What independent holdout outside the round-30-exposed ContextBench identities can support a generalization claim?
