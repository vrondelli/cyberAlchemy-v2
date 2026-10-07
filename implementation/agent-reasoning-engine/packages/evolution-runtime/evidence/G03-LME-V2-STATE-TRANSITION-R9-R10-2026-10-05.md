# G03 LongMemEval-V2 state/transition r9–r10, 2026-10-05

Status: **audited exposed development improvement; no confirmation, native leaderboard result, or superiority claim**. This succeeds the [r7–r8 site-scope study](G03-LME-V2-SITE-SCOPE-R7-R8-2026-10-05.md).

## Frozen mechanism and receipts

The [r9 source-only builder](../research/g03-beam-r1/build-lme-v2-state-transition-r9.py) indexed 5,095 observed page states and 200 trajectory action-path ledgers from the pinned small-tier source. For each of the same 28 exposed development questions, it used question text, that question's small-tier haystack IDs, URL-derived site scope, lexical/quoted-anchor state retrieval, and labeled action paths. It did **not** read evaluator gold, question type for selection, or confirmation question fields. It left the original lexical control packets unchanged. The private state index SHA-256 is `52b47b9f32283b58c64f69a5eb83cce0d1886c28283f42374103a94cd63f6ff4` and `DEV-WIRES-R9.json` SHA-256 is `ec1c38232e217281958ad9976c2d519012c75882cd3de26962856573ed6eb9a5` under `/home/vlad_/are-benchmark-archive/g03-lme-v2-feasibility-20261005/`. Every treatment packet stayed within the prior 12,000-character evidence cap and every reader request was admitted under 8K.

The [r9 reader runner](../research/g03-beam-r1/run-lme-v2-dev-state-r9.mjs) made 28 zero-retry GLM-5.3-Flash answer calls, all valid. Its raw VPS receipts have a private WSL cold copy at `/home/vlad_/are-benchmark-archive/g03-lme-v2-dev-state-run-r9/`; `RESULT.json` SHA-256 is `1a79cee5fb8ef53cc0c2ff28b51f08d665ed19451f0e66c1ac3c1d7bb91fabeb`. The [r9 partial scorer](../research/g03-beam-r1/score-lme-v2-dev-state-r9.py) audited raw answer hashes and applied the pinned official deterministic rules to 12 questions (`PARTIAL-SCORE.json` SHA-256 `2d7b4fc1e8356ca196c3df1b3ca782b38efdf38a3ecbfef379d3add798903522`).

The [r10 judge-wire builder](../research/g03-beam-r1/build-lme-v2-dev-state-judges-r10.py) emitted official-rubric, arm-blind prompts for the remaining 16 questions, twice each. `JUDGE-WIRES-R10.json` SHA-256 is `beb3d7a5567a98a7c4eb2fe8d8a8e3e553df9111b745338bd762f910dd99b0f4`. The [r10 judge runner](../research/g03-beam-r1/run-lme-v2-dev-state-judges-r10.mjs) completed 32 admitted, zero-retry GLM judge calls with zero invalid responses. The cold copy is `/home/vlad_/are-benchmark-archive/g03-lme-v2-dev-state-judge-run-r10/`; `RESULT.json` SHA-256 is `fb66a324f7edf0ca5b24719579567f1afecbf8723f80045e798d3823d1c13bb5`. This GLM judge is an adaptation, not the official default GPT-5.2 judge.

## Audited result and cost

The [r10 final scorer](../research/g03-beam-r1/score-lme-v2-dev-state-final-r10.py) independently verified the tokenizer, reader, and judge raw-receipt hashes, applied the official binary parser, and required agreement between two blind votes. All 16 new judgment pairs resolved. Its private `SCORE.json` SHA-256 is `627690ef89dc59fca5949a7448732efd19d3f80a91209dad2d8fdb5f0ccb6a2e`.

On the **same exposed 28 development questions**, r9 treatment was **10/28** correct, versus the prior r8 site-scoped treatment **7–9/28** and the unchanged r5 lexical control **3–4/28**. Among 27 fully resolved control/r9 pairs, 2 were both correct, 8 treatment-only, 1 control-only, and 16 both wrong. Exact two-sided McNemar p = **0.0390625**. One inherited control judgment remains split, and the control answers were inherited from identical frozen r5 requests, not rerun contemporaneously. This is a favorable development signal, not a confirmatory p-value or a superiority claim.

The 28 r9 reader calls consumed 85,954 known prompt tokens and 2,347 known completion tokens, with 117,991 ms summed provider-call elapsed time, 3,921 ms median and 9,318 ms maximum per call. The 32 r10 judge calls consumed another 15,702 known prompt and 1,858 known completion tokens. These totals exclude index build, retrieval, transport, and official online memory-query latency; they do not establish an efficiency or accuracy-latency advantage.

## Failure analysis and next boundary

Relative to r8, six questions became correct but three previously correct questions regressed. The Outlook-calendar form comparison `19367bc7` surfaced irrelevant incident and change-request page snippets rather than the discriminating integration field. The problem-category priority question `571b841c` surfaced a Hardware-category problem page and unrelated dashboard path, not an observed Database-to-priority transition. The catalog-item procedure comparison `7e32e4a2` lost the earlier specialized multi-item form view; the r9 packet showed only three item pages and cut off configuration controls after generic navigation lines. These are evidence-selection/presentation failures, not evidence that the answers are absent from the source.

Next development candidate: use source-only query cues and coverage diagnostics to route multi-item form comparisons to the existing specialized form view; suppress unrelated paths; allocate excerpt budget to answer-bearing field neighborhoods before navigation chrome. Recheck evidence reach and 8K admission on the **same exposed development set** before more provider calls. Any such tuning remains development-only. Freeze a candidate and cost/quality threshold before opening the reserved 140 confirmation questions. The split is a question holdout, **not** a trajectory-content holdout: all partitions share the same 200 source trajectories.

No product-page or general ARE superiority wording follows. The native official V2 backend/reader/latency comparator is still absent, absolute accuracy remains low, and G01/G02/r13 have separate unresolved gates.

## Open Questions

- Can the source-only coverage repair recover the three regressions without sacrificing the six new gains or exceeding the 8K/cost ceiling?
- What frozen effect size, validity, and cost threshold merits the first confirmation dispatch?
- Which native official V2 comparator and latency measurement would support a public benchmark claim?
