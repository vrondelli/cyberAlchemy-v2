# G01 ARB: official RepoMap matched exposed comparison

Status: **large exposed source-projected ranking gain, not an independent or
product superiority result.** The 101 ARB `v2_trace2code` labels had already
been used in development. This is file retrieval, not live ARE delivery or
the ContextBench Span-F1 campaign.

The [source-only adapter](../research/arb-trace2code-r1/rank-exposed-official-repomap-r1.py)
ran the public ARB `repomap_eval.py` at pinned commit
`07014c986f3deadb1548c62b32c0ffbe6a81465d`, with its default
0.65/0.25/0.10 query/PageRank/affinity weights, over the **same 98 source
snapshots, 101 candidate universes, and 1,024-byte edge queries** used by
the sealed ARE and GLM rankings. It made no model calls and did not open gold.
The private source seal is
`/home/vlad_/are-benchmark-archive/arb-v2-trace2code-20261004/exposed-official-repomap-r1/SOURCE-SEAL.json`
(SHA-256 `c948ef1bf712f532ad8f2fd166df880b0413a2b6cf9d8274ff058ad10986b841`);
the 101-row prediction is SHA-256
`500af68d77f7dd16cee88feabb03f6d64f48d4f7ddb99b97e1d9f453d54e6b4a`.

The [evaluator](../research/arb-trace2code-r1/audit-exposed-official-repomap-r1.py)
(SHA-256 `e65a2da71eed375f799e73d4ca0be64db32bbcdc9bf4c3cd2f5390dfc638d98c`)
checked the official, pilot, and remaining-89 seals and candidate/identity
parity before opening the pinned release gold. Its private numeric-only audit
is `EVALUATOR-AUDIT.json` (SHA-256
`8a6f2cd530222b1e83608f697db3f8f1a37503d02cd88bfe005a954ba2caf652`).

| Matched exposed 101 cases | MRR@8 | Hit@3 | Recall@20 |
| --- | ---: | ---: | ---: |
| Official RepoMap, adapted to edge query | 0.23608 | 32/101 | 0.84488 |
| ARE file ranking | 0.34475 | 43/101 | 0.72112 |
| ARB chunk BM25 | 0.18284 | 28/101 | 0.57261 |
| Chunk/file union + GLM reranking | **0.58944** | **71/101** | 0.77393 |

Against official RepoMap, GLM gained MRR@8 in 65 cases, lost in 12, and
tied in 24; mean paired delta was **+0.35336**. RepoMap retained higher
Recall@20. Five repositories favored GLM on mean MRR, one was tied, and
singleton `clap-rs/clap` favored RepoMap. An exploratory two-sided
equal-repository sign-flip yields **p=0.625**, so this does not establish a
robust repository-general effect. The GLM arm used **101 task calls** and
**235,322 prompt + 5,104 completion tokens**; RepoMap is model-free. The
adapter is a matched source-projected use of official RepoMap code, **not**
the paper's published all-file leaderboard result.

Claim ceiling: the GLM treatment is descriptively better on MRR@8 and
Hit@3 than three matched rankers on this previously exposed ARB subset.
There is **no** fresh cohort, exact-Git/live ARE read, end-to-end cost win,
ContextBench gain, or broad product superiority here. Do not promote this
to the product page as independent evidence.

## Next gate

Freeze one task-adapted treatment and run it with matched strong baselines
on a genuinely untouched, repository-separated trace population. Before
gold is opened, seal source, queries, rankings, all-in task-call cost, and
the minimum material gain and repository-generalization criteria. A later
live ARE read-delivery test must confirm that file ranking survives the
actual 8K workflow. If no independent trace supply is available, treat
this result as a bounded development finding and advance another G01
mechanism; do not recycle these 101 labels as a confirmation cohort.

## Open Questions

- Which untouched failure-trace population has verified prior-commit source
  and root-cause file labels without reusing these 101 cases or repositories?
- Can the frozen treatment preserve gains in live ARE read delivery under an
  8K admission and all-in cost comparison?
