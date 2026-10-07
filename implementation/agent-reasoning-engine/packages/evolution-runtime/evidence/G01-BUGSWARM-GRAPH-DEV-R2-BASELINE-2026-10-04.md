# G01 BugSwarm graph development r2 — admitted corpus and ARE baseline

Status, 2026-10-04: **24/24 development cases admitted for a source-projected
retrieval experiment; 24/24 unchanged ARE baseline rankings sealed and
scored.** This is a new *development* cohort, not a fresh claim cohort,
ContextBench, official RepoMap, or live ARE. No graph treatment or GLM call
has run here. Original BugSwarm logs and diffs remain HTTP-transport
provisional. The separately reserved 24-repository confirmation partition
has not had its source, logs, or labels opened.

The r1 admission stop is preserved in the [r1 note](G01-BUGSWARM-GRAPH-DEV-R1-ADMISSION-2026-10-04.md).
The [score-blind r2 repair](../research/arb-trace2code-r1/repair-bugswarm-graph-dev-r2.py)
retained 22 cases and replaced only the two GitHub-404 failing commits:
Python position 11 with `Lightning-AI/lightning-thunder` and Java position 21
with `apache/shiro`. They were the first eligible development-partition,
repository-disjoint source-order candidates after the original selections;
both returned exact GitHub commits and job-matched nonempty logs. No model
score or patch path governed replacement. Private r2 candidate SHA-256:
`c8fd7c57f75243cf613cfd22c23ec7c025582981d9d7ec4115c4a3efb0f43332`.

The [evaluator-only diff audit](../research/arb-trace2code-r1/audit-bugswarm-graph-dev-r2-gold.py)
admitted **24/24** patch-derived non-test source labels, receipt SHA-256
`454c8d74fb30f4a0dcaeea4eb7fd2a0fdf8d77b3d46c0f568a86a3e74a90322d`.
The [source-only acquisition](../research/arb-trace2code-r1/acquire-bugswarm-graph-dev-r2-source.py)
obtained **24/24** exact failed-commit GitHub HTTPS archives, receipt SHA-256
`4c3b553195a9edd3c5d61457592a8c75ef5d203c130cb70382012b529b054a68`.
All 24 passed safe-path and <=64 MiB per-case code-projection validation,
receipt SHA-256 `8db116f8ee57a050ba609ac69dd40b70f864b1c8d46a4df421bc9e6c91f7c71d`.
The separate [gold/projection join](../research/arb-trace2code-r1/audit-bugswarm-graph-dev-r2-projection-gold.py)
verified **26/26** gold files survive across **24/24** cases, evaluator-only
receipt SHA-256 `c4d2c61f61028c9abbef6f41bc37c455223aa6fd84fceb3793704dcf72e93093`.
No gold path entered source acquisition or projection.

The [source-only code materializer](../research/arb-trace2code-r1/materialize-bugswarm-graph-dev-r2-code.py)
sealed 24 isolated, Git-indexed pre-fix code roots at private WSL archive
`/home/vlad_/are-benchmark-archive/bugswarm-1.3.1-g01-feasibility-20261004/graph-dev-r2/code-projection/`,
receipt SHA-256 `201f4ba4d31d93dbfbff5f808307c079d46f4db2319cb40a4df08e7d0bb9bf51`.
The [query projector](../research/arb-trace2code-r1/project-bugswarm-graph-dev-r2-queries.py)
made 24 <=1 KiB failure-side queries from failed-test names and original-log
tails, SHA-256 `9ccaeb5a21d3391f819eddb151a38cb3d2a287562abe1850df2a4cc8ab81a561`;
one case had no parsed test name and all retained log text. The output and
seal are private, source-only, and contain no patch paths.

The [unchanged ARE trace-text ranker](../research/arb-trace2code-r1/ranked-source-acquisition-bm25-r1.mjs)
ranked every projected file for each case, one process per case, with the
same 128 MiB maximum index bound. The 24 rankings were source-only sealed at
SHA-256 `45600cfba313f530d2357fb30ec3304fe8ea23ea02c0fcb21b30d210c9a95824`
before the [evaluator-only scorer](../research/arb-trace2code-r1/evaluate-bugswarm-graph-dev-r2-are.py)
read labels. Its private evaluation receipt SHA-256 is
`81ad5eff53849c5e31c0825c8548abd1682088947e046d19820f3bb4068e73bf`.
An independent `jq` recomputation matched macro MRR@8 and Hit@3 counts.

| Same 24 development cases | Result |
| --- | ---: |
| ARE file-ranker MRR@8 | **0.21875** |
| ARE Hit@3 | **7/24** |
| ARE top-30 candidate reach | **16/24** |
| Sum of measured ARE ranking time | **43.409 s** |

## Prospective graph-treatment gate

The next source-only treatment will be inspired by [LocAgent's typed code
relations](https://aclanthology.org/2025.acl-long.426.pdf),
[OrcaLoca's failure-seeded exploration](https://arxiv.org/abs/2502.00350),
and [Agentless's hierarchical localization](https://arxiv.org/abs/2407.01489).
It must extract failure anchors without evaluator paths, traverse bounded
source-code relationships, and produce a complete file ranking on these same
24 code/query inputs. The exact algorithm, source inputs, and runtime budget
must be frozen before its evaluator reads labels. A source-only advancement
candidate requires all 24 valid rankings, top-30 reach at least **20/24**,
MRR@8 at least **0.31875** (+0.10 versus this ARE baseline), at least **16/24**
case wins versus ARE, and a positive lower bound of a paired repository-unit
20,000-draw bootstrap 95% interval. Failure of any component fails this
development gate. Any later GLM rerank needs a separate frozen 8K/token/call
budget and cannot be inferred from source-only reach.

This is a deliberately demanding *development* gate; passing it would only
justify testing a fixed mechanism on the still-reserved, independently
label-screened confirmation cohort. It would not itself permit a product
superiority or efficiency claim.

## Open Questions

- Does failure-seeded symbol/relationship traversal find files missing from
  ARE's top 30 without displacing its strong cases or exceeding a bounded
  source-only runtime cost?
- Can the HTTP log/diff provenance be authenticated or independently
  reproduced before confirmation scoring?
- What exact matched official RepoMap and live-ARE comparisons are needed
  before any broader product-page wording?
