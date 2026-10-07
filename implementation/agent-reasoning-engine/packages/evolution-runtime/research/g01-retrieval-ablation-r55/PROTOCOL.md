# G01 retrieval ablation r55 protocol

Status: exposed development protocol frozen before r55 provider calls or r55
scoring  
Cases: all 48 previously exposed BugsInPy r1+r2b cases  
Claim ceiling: mechanism selection only; no confirmation or superiority claim

## Purpose

Test whether externally researched query reformulation and code-specific
semantic retrieval improve the established ARE retrieval stack. This cohort has
already been scored in prior campaigns. It may select a mechanism for a later
fresh confirmation but cannot confirm that mechanism itself.

## Frozen inputs

The r1/r2b cohort SHA-256 values are
`888952ed833231141fe3c9f86efd357a7f84bcbeeafdcdb790a775f6e9f7df33` and
`77774d6aeffe6d32dd5d12ad512086ef613384909fa853c169b49baf11e5743c`.
The corresponding query SHA-256 values are
`bb35ea15fa9498511e329cd298084c4db7f31a636ca071ef4bb6d142f9b327f2`
and `3dabb5d1571bc852d2234bf55dcbdc1934bd2f68579f1c0a052fcebcba328251`.
Source-projection, ARE-ranking, and raw chunk-ranking hashes are bound in the
packet/source seals.

## Query expansion

One `glm-5.3-flash` call per case receives only the authenticated failure query
and returns a closed JSON object with exactly `identifiers`, `error_types`,
`concepts`, and `causal_hypothesis`. JSON mode is mandatory. Identifiers and
error strings must be literal substrings of the raw query. The client accepts
no missing/extra keys, wrong types, over-limit values, retries, repairs, or
post-hoc normalization.

Ceilings: 48 tokenizer calls, 48 generation calls, 256 output tokens per call,
8,192-token context, 100,000 aggregate prompt tokens, and zero retries.

## Semantic retrieval

CodeRankEmbed is pinned to revision
`3c4b60807d71f79b43f3c4363786d9493691f8b1` and the environment in
`ENVIRONMENT.lock`. Each projected source file is represented by nonoverlapping
120-line windows with `# path: <relative path>` prepended. Empty files receive
one path-only window. Query text uses the model-card prefix
`Represent this query for searching relevant code:`. Embeddings are normalized
float32 vectors, batch size is 8, maximum sequence length is 2,048, and a
file's score is the maximum cosine similarity of its windows. Ties resolve by
exact path. Every source file remains in the ranking.

## Arms

- **A — raw fusion:** unweighted `RRF(k=60)` of frozen ARE and raw chunk BM25.
- **B — expanded fusion:** unweighted RRF of ARE, raw chunk BM25, and chunk
  BM25 from the deterministic expanded query.
- **C — semantic:** complete CodeRankEmbed file ranking.
- **D — all-channel fusion:** unweighted RRF of ARE, raw chunk BM25, expanded
  chunk BM25, and CodeRankEmbed.

Every channel must contain the identical exact-commit file universe. D is the
prospective primary treatment; B and C are causal ablations, not candidates for
per-case selection.

## Metrics and advancement gate

Primary metric is MRR@8; secondary metrics are Hit@3 and recall@20. Uncertainty
uses 100,000 deterministic bootstrap samples over the 24 `(cohort, repository)`
clusters. D advances to fresh confirmation only if:

1. 48/48 expansions and all semantic rankings are valid and reproducible.
2. Every arm uses the identical per-case universe.
3. D MRR@8 is at least 0.05 above A.
4. The cluster-bootstrap 95% lower bound for D-minus-A MRR@8 is above zero.
5. D Hit@3 and recall@20 are not below A.
6. D improves cluster MRR@8 in at least 14 of 24 clusters.
7. D MRR@8 is not below either B or C.

Failure changes the next hypothesis; it does not authorize tuning these fixed
choices against the exposed labels.

## Open questions

- Does semantic retrieval add signal beyond expanded lexical retrieval?
- Is the four-channel fusion improvement broad across cohort/repository
  clusters or concentrated in a few projects?
