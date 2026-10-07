# G01 BugSwarm fresh r11/r22–r25 — private confirmation result

Status, 2026-10-04: **the prospectively fixed r11 quantitative gate passed on
24 repository-disjoint cases**. This is a private candidate for a bounded
BugSwarm 8K file-localization accuracy comparison, pending independent review
by Vlad and Dave. It is not a full ContextBench, live ARE, end-to-end
efficiency, or broad product-superiority result. No publication is authorized.

## Frozen lineage and validity

- The source-only r17 code projection, r18 queries, r19 ARE and graph rankings,
  r20 candidate lists, and r21 packets were sealed before model calls. The
  [r22 protocol](G01-BUGSWARM-FRESH-R22-GLM-PROTOCOL-2026-10-04.md) retained
  the exposed-r10 8K prompt and JSON normalization rules. The VPS received
  only the packet list, its seal, protocol, and pinned runner—no source roots,
  passing source, gold, or credentials. Exact packet SHA-256:
  `9cf7490d6b21d34b58d0dbb75d1ab262caac061b773a75ab350b54a7291e149c`.
- Same-account tokenizer admission passed **24/24**, with a maximum prompt of
  5,153 tokens plus the fixed 512-token reserve. The one-shot GLM run returned
  **24/24 HTTP 200, stop-finished, valid selections**, with no transport stop
  or retry. Known generation usage: **88,559 prompt + 1,324 completion =
  89,883 tokens**; summed generation call time 53,509 ms. The tokenizer was
  called separately 24 times, processing 88,559 prompt tokens in 7,472 ms;
  this is reported separately, not silently merged with generation usage.
  Private `fresh-r11/vps-r22/RUN-RESULT.json` SHA-256 is
  `2835fc19b8aa6fefa50dd5f49d2a998a9b1660328ccf6957f14342de0aac9d3a`.
- The complete **79-file** VPS run was cold-copied to private WSL
  `fresh-r11/vps-r22`. Sorted relative-path SHA-256 manifest digest matched
  VPS and WSL at `264f0b2bbcea12f6ae8bfdd153c1dd4c2cbe840381e2a29dd60373c8266d540e`.
  The VPS original remains intact. The independent prediction seal produced
  **24/24 valid full permutations before gold access**: predictions SHA-256
  `5d4654f81e7266e915e857b52a27df06881af92981b707fa819257d85c05d49b`,
  seal SHA-256 `314cbd80eebf3ea5ca4ab50652802927046a3efbedb918befd2fa0c11b09ed0c`.
- Evaluator-only GitHub comparisons authenticated the exact failed and passing
  commits for all 24 and had nonempty source-path lists. A separate audit
  compared failed-source Git index blob IDs to **24/24 complete passing Git
  trees**, producing nonempty direct changed-old-source labels for every case.
  The direct-tree result SHA-256 is
  `5c44b28a6c5e4defa6afdaa605f694653cb7cd25b5ab8df3468445b0a25676d2`.
  Every direct gold path survived the failed-code projection.
- A later independent, evaluator-only [Git object reconstruction](../research/arb-trace2code-r1/audit-bugswarm-fresh-r26-git-tree-objects.mjs)
  verified the saved compare/tree response hashes, reconstructed **all 4,805
  subtree objects** across 27,179 entries, and matched **24/24 root Git tree
  SHA-1 hashes** to the authenticated passing commits. Its private counts-only
  `TREE-OBJECT-AUDIT-R26.json` SHA-256 is
  `63d42d7d723214dafb7224f5ae5c93f41fc52e8a64ad9a1bac718d34eafc76ef`.
  GitHub's tree response top-level `sha` names the requested commit ref in
  these receipts; the audit derives the actual root tree object hash from
  its entries and compares that with the commit's declared tree hash.

Nine GitHub compare-file lists include source paths not changed between the
exact failed checkout and the passing tree. All nine comparisons have
`status=diverged` and a merge base different from the failed commit; their
extra compare paths are not direct failed→passed blob changes. The predeclared
r11 gold rule is the **direct failed/passing Git-tree difference**, so the
scorer uses that rule and retains the compare discrepancy in the private
receipts. Reviewers should scrutinize this distinction before approving a
claim; compare-file lists must not be substituted as gold.

## Fresh score

The pinned evaluator-only `EVALUATION-R25.json` SHA-256 is
`5961a29f400a2924f79791a9e833c0886e9d12b96fd85d1bcf0fcb431d1ac9f3`.
Each of the 24 cases belongs to a distinct repository, so the fixed paired
20,000-draw repository bootstrap resamples one case per repository. A separate
read-only Node recomputation from the sealed prediction lists, raw ARE/graph
rankings, candidate packets, and r24 tree labels reproduced all three MRR@8
values, candidate reach **23**, and **19** ARE wins.

| Measure | ARE ranker | Graph-r2 | GLM listwise + graph backfill |
| --- | ---: | ---: | ---: |
| MRR@8 | 0.15144 | 0.53090 | **0.72361** |
| Hit@3 | 5/24 | 15/24 | **20/24** |
| Rank-1 gold | 1/24 | 10/24 | **15/24** |

The frozen candidate list reached direct-tree gold in **23/24** cases.
GLM–ARE MRR@8 difference is **+0.57217**, paired 95% percentile interval
**[+0.41245, +0.72594]**, with **19 wins, four ties, one loss**. GLM–graph
difference is **+0.19271**, interval **[+0.07153, +0.33333]**, with ten wins,
twelve ties, two losses. All r11 conjunctive gate checks are true: 24/24
identities/admission/validity, no transport failure, reach ≥20, GLM MRR at
least graph +0.10, ≥16 ARE wins, and positive paired lower bounds versus
both baselines. This is accuracy evidence for the frozen task and population,
not evidence that the extra GLM work is cheaper or faster end-to-end.

Measured ranking component times were 39,639 ms for the ARE ranker and
14,821 ms for graph-r2. The r22 model time above excludes upstream source
acquisition, indexing, candidate construction, evaluator label calls, and
archive transfer; do not use it as an end-to-end latency comparison.

## Claim boundary and next work

The strongest currently supportable *candidate* wording is: “On a fresh,
24-repository BugSwarm file-localization cohort, the frozen 8K GLM listwise
selector over source-only candidates produced by the documented ARE benchmark
pipeline achieved MRR@8 0.724 versus
0.531 for the graph ranker and 0.151 for the ARE file ranker, under the
specified direct Git-tree labels.” Include the 89,883 generation tokens and
the 23/24 reach ceiling. Vlad and Dave must validate this exact wording,
lineage, label divergence, source/log identities, code, and receipts before
it becomes a product claim. Any public artifact needs a separate publication
decision and private-data scrub.

The exact private wording and reviewer checklist are frozen in the
[r26 review bundle](G01-BUGSWARM-FRESH-R26-REVIEW-BUNDLE-2026-10-04.md).
Its SHA-256 is
`2cbb17c11a71e784a34aa90bfa9afd4243aaf7e1e2c154a7c8e9460e2914aee8`.
Reviewer decisions must bind that exact digest; no review decision has yet
been recorded in the repository.

This result does **not** establish G02 versus DSH, G03 beyond its separately
reviewed five-type accuracy claim, original ContextBench clearance, or broad
ARE superiority. The larger goal still needs matched independent comparators,
end-to-end cost and reliability accounting, and replication across branches.

## Open Questions

- Will independent review reproduce the direct-tree labels, scoring, and all
  r11 gate checks, including the nine diverged compare responses?
- Should a later cost-controlled G01 arm test whether a smaller candidate or
  excerpt budget preserves the accuracy gain?
- What additional untouched population and live ARE integration are needed
  before a broader product claim?
