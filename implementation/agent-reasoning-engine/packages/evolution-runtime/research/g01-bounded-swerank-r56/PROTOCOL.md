# G01 bounded semantic reranking r56 protocol

Status: frozen before r56 semantic scoring or label evaluation  
Population: 48 exposed BugsInPy r1+r2b cases  
Claim ceiling: mechanism selection only

## Hypothesis

Issue-localization fine-tuning adds useful early-rank signal beyond the generic
CodeRankEmbed model when both score the same bounded evidence. Full-repository
semantic retrieval and GLM query expansion are excluded because r55 rejected
their CPU and validity envelopes.

## Frozen representation

For each case, take the first-occurrence union of the unchanged ARE top 10 and
raw chunk-BM25 top 10, capped at 20 paths. For each path select one 80-line
window by maximum case-folded lexical-token overlap with the authenticated raw
failure query; ties choose the earliest start. Prefix the exact path. Models use
normalized float32 embeddings, the published query prefix, maximum sequence
length 512, batch size 16, and exact-path tie breaking.

## Arms

- **A — raw fusion:** unweighted `RRF(k=60)` of full ARE and chunk-BM25 ranks.
- **B — CodeRank:** A plus pinned CodeRankEmbed. Its top-20 semantic ranking is
  completed with A's remaining paths before three-channel RRF.
- **C — SweRank:** A plus pinned SweRankEmbed-Small under the identical rule.

The primary contrast is C-minus-B. C-minus-A measures value added to ARE's
existing retrieval. No per-case arm selection is allowed.

## Advancement gate

C advances to a fresh source-disjoint confirmation only if all 48 cases are
valid, C MRR@8 exceeds B by at least 0.03 and A by at least 0.05, both
repository-cluster bootstrap 95% lower bounds exceed zero, C does not reduce
Hit@3 or recall@20 against either comparator, and C beats B in at least 14 of
the 24 `(cohort, repository)` clusters. Bootstrap uses 100,000 deterministic
cluster resamples.

## Boundaries

SweRankEmbed-Small is CC-BY-NC-4.0 and trained on public Python issue/patch
data. A positive result is private pretrained-component evidence, not a
commercial dependency, contamination-free result, or superiority claim.

## Open questions

- Does issue-localization fine-tuning transfer to failure-log queries?
- Is a structure-aware window needed after the encoder effect is isolated?
- Can a permissively licensed model reproduce any SweRank advantage?
