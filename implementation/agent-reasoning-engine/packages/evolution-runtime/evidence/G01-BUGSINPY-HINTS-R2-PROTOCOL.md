# G01 BugsInPy r2 paired log-path-hints protocol

Status: **prospective, before r2 source checkout, packets, GLM calls, or gold.**
The r1 post-hoc diagnosis found a source-only route to candidate files missed
by its 1,024-byte edge excerpt. That diagnosis is development evidence only;
the r1 cohort remains excluded from r2 confirmation.

The r2 [source-only freeze](G01-BUGSINPY-HINTS-R2-SOURCE-FREEZE-2026-10-04.md)
is SHA-256 `77774d6aeffe6d32dd5d12ad512086ef613384909fa853c169b49baf11e5743c`:
24 different bug IDs and commits across 12 repositories. Three repositories
(ansible, cookiecutter, youtube-dl) are new relative to r1; nine recur,
so r2 is task- and commit-disjoint, not fully repository-disjoint. Never
replace a case after gold or outcome exposure.

Both arms use the r1 exact-commit source projection, 64 MiB complete ARE
trace-text ranker, local 120-line chunk BM25, 1,024-byte edge query, 420-
character query-overlap source excerpts, and identical JSON rerank prompt.
The two GLM arms differ only in the candidate-union rule:

- **Unhinted:** stable unique top ten ARE files followed by top ten chunk-
  BM25 files, maximum 20, as in r1.
- **Hinted:** first take up to four existing non-test Python source files
  extracted from the *full buggy log* by the pinned source-only
  [log-path parser](../research/arb-trace2code-r1/extract-bugsinpy-log-path-hints-r1.py),
  then stable unique top ten ARE and top ten chunk-BM25 files, truncating
  the combined order at 20. The parser matches path-like `.py` tokens to
  the exact source universe, prefers explicit suffix matches, accepts a
  basename only if unique, and orders by mention count, first position,
  then path. No patch, fixed output, or evaluator score enters hints.

Both arms run GLM-5.3-flash with `reasoning_effort: low`, maximum 512 output
tokens, prompt-plus-reserve admission ≤8,192, zero retries, and at most eight
distinct selected IDs. Model-selected paths lead, with the full ARE order
filling the remainder. Use a deterministic SHA-256 order over case and arm
to interleave dispatch, and retain exact per-arm response and cost receipts.
Invalid output, refusal, timeout, or tokenizer rejection remains in the
frozen denominator and fails the 48/48 completeness gate. Source-only
packets and all arm rankings are SHA-256-sealed before provider dispatch;
gold is opened only after *both* arms' predictions are sealed.

Evaluator gold is every patch-changed path already present in the frozen
source universe, as in r1. Primary metric is paired hinted-minus-unhinted
MRR@8 over all 24 frozen cases; secondary measures are Hit@3, Recall@20,
candidate-union gold coverage, ARE/chunk standalone MRR, per-repository
effects, and known task-call tokens/time. Use 20,000 paired bootstrap draws
of the 12 two-case repository clusters, deterministic seed from the first
eight hex digits of the r2 freeze SHA-256; report the 95% percentile
interval. No case replacement or valid-only denominator reduction.

The r2 advancement gate requires 48/48 valid GLM attempts, 24/24 valid
patch labels, at least **two more candidate-union-covered cases** for the
hinted arm, hinted-minus-unhinted MRR@8 **≥+0.05**, and a repository-
cluster 95% lower bound above zero. If the gate fails, report it rather
than reinterpreting r1. Even a pass supports only this paired source-
projected retrieval mechanism at added model cost; official RepoMap,
exact-Git/live ARE, ContextBench Span-F1 and a general product superiority
headline remain separate gates. Vlad/Dave exact-card review is required
before public presentation.

## Open Questions

- Will all 24 new commits and projected file universes pass source-only
  preflight without changing the frozen cohort?
- Does the path-hint gain survive paired GLM dispatch on r2, including the
  three new repositories, with no harmful prompt-budget or cost increase?
- Which independent external population and official comparator can support
  the eventual broad ARE claim?
