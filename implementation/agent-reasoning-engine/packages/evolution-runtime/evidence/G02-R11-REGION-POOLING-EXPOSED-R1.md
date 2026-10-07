# G02 r11 source-region pooling exposed pilot r1

## Frozen protocol

This private research pilot uses only the twelve already exposed r11 issues and
their pinned clean base checkouts. It does not repair gold, read patches, open
confirmation labels, invoke GLM, or change product behavior.

Hypothesis: whole-file normalization and small-file admission can hide relevant
regions in large source files. Index all tracked regular UTF-8 non-NUL files up
to 4 MiB, including documentation and native code. Treatment indexes overlapping
60-line regions at stride 30, ranks each file by its highest BM25 region score,
and retains the region as a source witness. Control uses whole-file BM25 over
exactly the same admitted bytes. Tokenization is the existing multi-view pilot's
identifier-splitting tokenizer and stop list; no pseudo-feedback or issue rewrite.
Path terms enter both representations once. Require at least two distinct query
terms in a scored unit. BM25 k1=1.2, b=.75, query term frequencies retained.
Exclude selected and delivered paths from both outputs, select up to three each,
break ties by path then earliest region. No task/language-specific overrides.

Seal source, corpus hashes, implementation, tokenizer, protocol, both rankings,
and per-task timing before a separate evaluator logically loads only the twelve
exposed gold contexts. Full parquet byte hashing is identity verification only.

Advancement requires at least three newly reachable gold files across at least
two repositories, proposal precision >= 1/3, nonnegative mean counterfactual
File-F1 against the actual selected files, and at least one additional new gold
hit versus whole-file control at matched width. Equal width is mandatory.
Passing is only a source-opportunity screen: not native Span-F1, executed reads,
DSH superiority, or confirmation evidence. Failure archives this exact policy;
no post-score parameter changes or cherry-picking.

## Terminal result — 2026-10-06

All twelve tasks sealed and scored; five retrieval tests passed, including exact
score equivalence of the bounded-memory token-count representation. Source
indexing took 135.23 seconds locally. No provider requests were made.

Both treatment and equal-width control proposed 36 files and reached two newly
needed gold files across two repositories: zero net gain. Treatment precision
was 5.56%; mean counterfactual File-F1 fell from 0.5359749455 to 0.3526515152,
identical to control. The frozen gate failed. Do not promote this policy, spend
GLM on these automatic selections, or use fresh labels to tune its window size.
These are hypothetical added-file scores, not native benchmark reruns.

Private receipts under
`/home/vlad_/are-benchmark-archive/g02-r11-region-pooling-exposed-r1-20261006/`:

- Frozen `PROTOCOL.md` retains the pre-result document.
- `SOURCE-SEAL.json`: SHA-256
  `2e354fcc4c534307ddb2ee1a5015d562e0b9a93b05eff788970658d3facca070`.
- `EVALUATOR-AUDIT.json`: SHA-256
  `5eb7a676e44abf111734da3edc34f9cfb887af8450247c4058620aa814341d09`.

Implementation: [region ranker](../research/g02-product-r4/region-pooling-r1.py),
[source sealer](../research/g02-product-r4/seal-g02-r11-region-pooling-r1.py),
[isolated evaluator](../research/g02-product-r4/audit-g02-r11-region-pooling-r1.py),
[tests](../research/g02-product-r4/test_region_pooling_r1.py).

## Research consequence

Larger admission and region scoring alone did not establish selective relevance.
A distinct future hypothesis is an active, bounded candidate workspace retaining
source-cited responsibility judgments and unresolved verification questions,
with targeted second observations rather than automatic lexical additions.
[SemNav](https://arxiv.org/html/2609.31176) describes this distinction between
broad retrieval and iterative evidence-based comparison. Its semantic-card
construction also consumes tokens: any ARE implementation must account for all
auxiliary calls, not just the main agent's reduced context. The paper's results
are not ARE results, and its Python language-server implementation does not prove
equivalent C++ support. This is research direction, not an implemented or admitted
quality improvement. Prior one-shot causal-delta and generic hidden-anchor pools
already failed; do not repeat them under this name.

## Open Questions

- Does max pooling over many regions amplify distractors in very large files?
- Would a successful source screen survive actual equal-budget navigation and
  native Span-F1/cost evaluation against DSH?
- What is the all-in indexing/storage cost, including reusable index lifecycle?
- One known missing native gold path remains a fidelity caveat; no alias is used.
