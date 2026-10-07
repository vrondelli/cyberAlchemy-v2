# G01 external retrieval-technique scan — 2026-10-04

Status: candidate research evidence; not an implementation admission or result  
Scope: BugSwarm trace-to-code localization under the existing private G01 campaign  
Authority effect: none

## Decision

The best next integration is a **coverage-preserving adaptive retrieval
cascade**. It should combine several cheap, independently auditable source-only
views, fuse them without deleting candidates, and invoke GLM only when the
views disagree or the fused evidence is weak.

This is a synthesis of external techniques, not a claim that ARE implements or
reproduces any cited system.

## Why this fits the current evidence

The existing G01 development history shows two different failure classes:

1. candidate acquisition misses, where the correct file never enters the
   bounded packet; and
2. ordering errors, where a reachable correct file is ranked below a plausible
   distractor.

Increasing the context window does not distinguish those failures. The current
ARE and graph-r2 rankings already provide two complementary views, and the
prospective r27 policy already defines their top-1 disagreement as a cheap,
gold-blind escalation signal. The next stage should first measure that signal
unchanged on the authenticated 24-case cohort, then add one retrieval view at a
time.

## External evidence

| Source | Relevant technique | Transfer to ARE | Important limit |
| --- | --- | --- | --- |
| [AIRCoder, ACL 2026](https://aclanthology.org/2026.acl-long.1166/) | Structure-preserving chunks; eight metrics spanning text, dependency, and structural hierarchy; query-dependent fusion weights | Treat lexical/path, symbol, and dependency rankings as separate views; preserve their provenance and fuse late | The published task is repository-level completion, not failure-trace localization; learned weighting cannot be imported without a clean training split |
| [CodeRAG, EMNLP 2025](https://aclanthology.org/2025.emnlp-main.1187/) | Query construction, multi-path retrieval, and preference-aligned reranking | Split an authenticated failure log into typed query fields and retrieve through multiple paths before reranking | Its log-probability query construction and learned alignment depend on a generator/training setup we do not currently have |
| [LocAgent](https://arxiv.org/abs/2503.09089) | Hierarchical entities plus heterogeneous contain/import/call/inherit edges and controlled multi-hop traversal | Extend graph-r2 from file/import evidence toward entity-level traversal, while retaining direction, relation type, and hop count in receipts | Agentic traversal is more expensive and introduces additional model decisions; start with deterministic graph expansion |
| [DraCo, ACL 2024](https://aclanthology.org/2024.acl-long.431/) | Type-sensitive dataflow dependencies rather than similarity alone | Add a later dataflow/symbol edge channel for cases not resolved by import/call structure | The reported task is Python completion; Java and failure localization need separate validation |
| [Late Code Chunking, ACL 2026](https://aclanthology.org/2026.acl-short.64/) | Separate retrieval context from later comprehension context; asymmetric query/chunk sizes | Rank compact entity representations, then enrich only selected entities with parents, signatures, or neighbors when packing the GLM prompt | Its reported accuracy does not establish an optimal expansion rule for G01 |
| [SweRank](https://arxiv.org/abs/2505.07849) | Retrieve-and-rerank specialized for verbose, failure-descriptive software issues | Keep the raw log for evidence, but derive a compact retrieval query instead of treating all log tokens equally | Training a dense reranker is a later hypothesis and must not use confirmation labels |
| [Adaptive Retrieval study](https://arxiv.org/abs/2501.12835) | Simple uncertainty estimates can match more complicated adaptive pipelines at lower cost | Use observable rank agreement, margins, and candidate stability as escalation features before considering model-internal uncertainty | The evaluation is QA rather than code localization |
| [Lost in the Middle](https://arxiv.org/abs/2307.03172) | Relevant evidence can be used less reliably in the middle of long contexts | Keep packets compact and position the strongest candidates at explicit, stable boundaries instead of assuming an 8K window is uniformly usable | This is a prompt-packing constraint, not a retrieval improvement by itself |

## Candidate architecture

```text
authenticated failure log
        |
        v
typed query projection
  - test / exception / stack symbols
  - path and class stems
  - compact failure text
        |
        +------------+-------------+----------------+
        |            |             |                |
     ARE text     exact symbol   graph-r2      later dataflow
     / path       / filename     dependencies      channel
        |            |             |                |
        +------------+------ late rank fusion ------+
                               |
                    coverage-preserving candidate set
                               |
                 agreement + margin + stability census
                          /                    \
                    confident              uncertain
                       |                        |
                deterministic result      bounded GLM rerank
                          \                    /
                           receipt-sealed output
```

Every channel must emit a complete or explicitly bounded ranking with its own
configuration and source digest. Fusion must retain channel provenance and may
not silently drop the top candidates of an input channel.

## Proposed ablation sequence

### R38 — unchanged disagreement census

Run the already frozen ARE and graph-r2 algorithms on the 24 authenticated,
code-only r36 roots with the r37 queries. Before opening gold, seal:

- both full rankings;
- top-1 agreement/disagreement;
- rank margins or score evidence where the algorithm exposes them; and
- the exact set of cases that would trigger the r27 selective GLM policy.

This is the control for every later retrieval change.

### R39 — deterministic multi-view acquisition

Add one source-only exact-symbol/filename channel derived from the typed r37
query. Fuse ARE, graph-r2, and symbol rankings with fixed reciprocal-rank fusion
or another prospectively fixed, scale-free rule. Do not learn weights on the
24 evaluation cases.

Primary acquisition metric after the gold boundary: top-30 file reach.  
Safety metric: zero loss of any file reachable by either unchanged baseline.

### R40 — adaptive budget and GLM dispatch

Use only pre-gold observables:

- top-1 agreement among views;
- fused top-1 versus top-2 margin;
- stability of the top set across views; and
- number of independent views supporting each candidate.

Freeze thresholds on a separate development split. Compare always-GLM against
selective-GLM with the same frozen candidate packets and predictions. Report
accuracy, MRR, call count, input tokens, elapsed time, and failures.

### R41 — entity enrichment, only if R39/R40 qualify

Retrieve compact symbols first, then enrich only the selected candidates with
their containing class/function, signature, and bounded dependency neighbors.
This tests the Late Code Chunking/LocAgent idea without sending a whole graph or
whole files to the model.

## Admission rules

An integration candidate advances only if it is:

- prospectively frozen before evaluator-only gold is opened;
- deterministic or fully receipt-bound;
- coverage-preserving against its declared input channels;
- evaluated on a separate development split before reserved confirmation;
- compared at matched packet, provider, and scoring conditions; and
- reported with accuracy **and** cost/reliability, not only the best score.

No external paper supports an ARE superiority claim. It supplies hypotheses;
our fresh, authenticated, matched evidence must support any eventual claim.

## Recommendation

Proceed with r38 first. If disagreement is non-trivial, implement r39 as a
small deterministic symbol/path channel plus fixed late fusion. Defer learned
fusion, dense retriever training, dataflow graphs, and agentic multi-hop search
until the cheap ablations show where they are needed.

## Open questions

- Does r38 disagreement identify actual baseline errors, or merely different
  but equally wrong top-1 files?
- Which score normalization, if any, is available from the current ARE and
  graph-r2 rankers without changing their frozen behavior?
- Can exact symbol extraction be made language-neutral for Python and Java
  without a parser dependency, or should r39 use separate pinned extractors?
- What independent development cohort will own any adaptive threshold fitting
  before confirmation?
