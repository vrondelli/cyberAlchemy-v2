# G01 fresh BugSwarm claim — Vlad/Dave private review bundle

Status: **prepared for review; no reviewer decision recorded**. This bundle is
private; it neither publishes nor broadens the quantitative gate passed in the
[r25 result](G01-BUGSWARM-FRESH-R25-RESULT-2026-10-04.md).

## Exact proposed claim

“On a fresh, 24-repository BugSwarm file-localization cohort, the frozen 8K
GLM listwise selector over source-only candidates produced by the documented
ARE benchmark pipeline achieved MRR@8
**0.724**, versus **0.531** for the graph-r2 ranker and **0.151** for the ARE
file ranker, using direct failed-commit versus passing-commit Git-tree source
changes as labels. Its candidate list reached gold in **23/24** cases and the
24 generation calls used **89,883 known tokens**.”

Required accompanying caveats: this is a **file-localization accuracy**
comparison on one BugSwarm population, not a patch-resolution or live-ARE
ContextBench, end-to-end speed/cost, G02-versus-DSH, or broad ARE-product
superiority claim. Nine diverged GitHub compare-file lists include paths not
in the direct failed→passing tree difference; those compare lists were not
used as gold. The treatment added GLM calls and has no end-to-end efficiency
advantage established here. No public use follows from review alone.

## Reviewer checks

1. Check the prospective [r11 cohort and quantitative gate](G01-BUGSWARM-FRESH-R11-COHORT-PROTOCOL-2026-10-04.md)
   against the source-only r14/r16 admission, r17–r21 seals, and r22 protocol.
   Verify all 24 final repositories are disjoint and that no source selector
   saw passing source, gold, or score before the prediction seal.
2. Check private `fresh-r11/vps-r22` against its 79-file VPS/WSL manifest
   digest `264f0b2bbcea12f6ae8bfdd153c1dd4c2cbe840381e2a29dd60373c8266d540e`.
   Inspect the 24 provider responses and independently reparse the JSON
   selections. The r22 prediction seal is
   `314cbd80eebf3ea5ca4ab50652802927046a3efbedb918befd2fa0c11b09ed0c`.
3. Check the evaluator-only `fresh-r11/evaluator-only/github-compare-r23`
   and `github-tree-r24` receipts. The direct tree-label result is
   `5c44b28a6c5e4defa6afdaa605f694653cb7cd25b5ab8df3468445b0a25676d2`.
   In particular inspect nine `diverged` comparisons whose compare-file
   lists have extra paths. The independent r26 SHA-1 reconstruction verified
   every saved subtree and all 24 passing root trees; receipt
   `63d42d7d723214dafb7224f5ae5c93f41fc52e8a64ad9a1bac718d34eafc76ef`.
4. Recompute the fixed MRR@8, 20,000-draw paired intervals, 23/24 reach,
   19 ARE wins, and all r11 conjunctive gate bits from private
   `fresh-r11/evaluator-only/EVALUATION-R25.json` SHA-256
   `5961a29f400a2924f79791a9e833c0886e9d12b96fd85d1bcf0fcb431d1ac9f3`.
   Confirm the baseline labels and full path sets are identical across arms.

Review outcome is one of **approve exact bounded wording**, **request a
specific correction/additional check**, or **reject**. Record Vlad's and
Dave's decisions separately against this bundle's SHA-256 after the text is
final. Even two approvals do not authorize publication or a broader claim.

## Open Questions

- Do both reviewers accept direct failed/passing Git-tree changes as the
  bounded task's labels despite the nine diverged compare lists?
- Does any reviewer identify a source-exposure, scorer, or denominator defect
  that changes the r11 gate or requires the claim wording to be narrowed?
