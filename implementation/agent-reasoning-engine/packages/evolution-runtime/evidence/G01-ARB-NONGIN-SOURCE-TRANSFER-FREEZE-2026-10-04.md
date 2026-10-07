# G01 ARB non-Gin source-only transfer — pre-evaluation freeze

This is a distinct, private, repository-separated **source-only retrieval**
confirmation, not a replacement for G01 ContextBench or a live ARE episode.
The freeze precedes export of any non-Gin query and all non-Gin gold access.

## Population and input

- Pinned public ARB `v2_trace2code` archive SHA-256:
  `19b252e8cfff42107fedc74005dbb6972f2970af33651ce0c1571546819e41c4`.
- Private split receipt SHA-256:
  `dc562df2664fcab9bca079ab502d4402aefec1f1eba48f366ad093bd9c783107`.
  Gin's 56 cases are development; all **45 non-Gin cases in six repositories**
  are confirmation. No case exclusion follows the outcome.
- All source snapshots are from the source-only isolation audit SHA-256
  `1e46c4e41b4f8aa31b8a39c401addcb7b3203a3a95da9a43b12d26304065c77f`.
  Candidate set is every file-level path in the ARB corpus manifest for each
  pinned base commit. This is a source-text projection, not an exact Git checkout.
- The matched input is the fixed first/last failure-excerpt window: for UTF-8
  excerpts above 1,024 bytes, first 509 bytes + `\n...\n` + last 509 bytes,
  dropping split-codepoint replacement characters and trimming whitespace;
  shorter excerpts are trimmed unchanged. The official full-query JSON result
  is separately diagnostic and **not** a matched arm.

## Frozen arms and failure policy

- Comparator: ARB's chunk BM25 (all chunks, deduplicated file order) at code
  commit `07014c986f3deadb1548c62b32c0ffbe6a81465d`, through the local
  replica source SHA-256 `f74e618066629b843ecd4e8fe1c7ccea87bcb86cd6860da58716299811ca6cf1`.
  On exposed Gin, its complete rankings matched the pinned official functions
  in 168/168 checks. That parity is not official package evaluator execution.
- ARE candidate: unchanged Gin-developed `trace-text` ranker source SHA-256
  `52629ca2faddf20db18e78ea8b7debb880d0140413d42c67ec759e5f53aa5788`,
  with its 1,024-byte `rank_sources` contract and default 64 MiB index cap.
  This candidate has Go-specific anchors/penalty and may fail to transfer.
- Source-only candidate ranking uses materialized corpus file rows and a local
  Git index solely to exercise that unchanged code. It is not a live model
  episode or exact pinned Git. Any partial/omitted/incomplete index is a
  **coverage failure counted as zero for the ARE arm**, never excluded from
  the 45-case denominator. Unexpected source/schema/identity drift stops the
  study rather than dropping a case.

## Frozen executable boundary

| Stage | Source SHA-256 |
| --- | --- |
| Query-only projection | `d583f83f2c05e473d5c1cbb13f112d998b84f5c3db2540a6e8b6197355312b5b` |
| ARE source ranking | `1315abd185d5c46bb14428be96b257fce66d09ab3372b7abc8b2287a602ece7c` |
| ARB BM25 source ranking | `9c35e291e873382d3c20a5d74b481ff5d0e808ef2da0e9dbd4276c29b345b3ec` |
| Evaluator-only paired audit | `33fbbafa0ad071b3d915dd4c1dd7d3a08a45036b1004ce4b182e3421d549cecb` |

The scripts live in [the ARB research directory](../research/arb-trace2code-r1/).
They must be hash-checked against this freeze before the confirmation query
projection. If a defect requires changing a frozen file after query exposure,
the result becomes diagnostic and cannot be silently called this confirmation.

## Metrics, uncertainty, and claim boundary

Primary paired metric: ARE edge trace-text minus ARB edge BM25 **MRR@8**,
averaged over all 45 cases. Secondary descriptive metrics: first-root-cause
MRR, hit@3, hit@8, Recall@20, per-repository MRR@8 difference, and coverage
failures. All predictions are sealed before the evaluator reads non-Gin gold.
The evaluator also computes a two-sided exact repository-cluster sign-flip
test over six repository sums and a 20,000-draw seeded repository-cluster
bootstrap percentile interval; both are sensitivity descriptors with only
six clusters, not evidence of representativeness outside this ARB population.

A narrow *source-only retrieval* superiority statement is eligible for review
only if 45/45 cases produce complete all-files ARE rankings, the paired mean
MRR@8 difference is positive, the two-sided cluster sign-flip `p <= 0.05`,
and the bootstrap 95% lower endpoint is positive. Even then, do not claim
live ARE, ContextBench Span-F1, GLM answer quality, broad reasoning-engine
superiority, or production benefit. If a gate fails, report the full negative
or mixed result and use the six-repo breakdown to choose a new development
mechanism; do not tune on these 45 cases and relabel them independent.

## Open Questions

- Will the unchanged 64 MiB candidate produce complete all-files indexes on
  every non-Gin source snapshot?
- Does source-only rank improvement transfer across languages/repositories?
- Can a later exact-Git, live ARE adapter preserve any source-only benefit
  under model and tool cost while separately satisfying G01 ContextBench?
