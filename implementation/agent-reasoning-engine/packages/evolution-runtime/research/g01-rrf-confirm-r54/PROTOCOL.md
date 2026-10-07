# G01 r54 confirmation protocol

Status: frozen before provider calls and before gold-label access  
Scope: private confirmation on 24 fresh BugsInPy exact-commit cases from 12 repositories

## Inputs and treatment

The cohort SHA-256 is
`85226a48b5c5cbbbfb7edd725038e576ac7e5e0e9541f002fc5d3ac89a29ca9d`.
Source projection, query, ARE ranking, and chunk-ranking SHA-256 values are,
respectively, `c1b9e7b39a36a1dc7844e2d53c05fdf6286c15fbca733959987dd61f3da3775a`,
`049d2325bf5ccb9d1889da94f0f74da987ce41c29b6fb805882859e908289e12`,
`cb38cb3c14cfde3d70fdc18d80340879bccdc7e6964107936ecb74f6ca652aca`,
and `5e8ef415d617585d75cbf2171947b43c95df321b6fc196e1e76a3a58372764af`.

Each case uses the first-occurrence union of the ARE top 10 and chunk-BM25
top 10, capped at 20 files. The same candidates and excerpts appear in three
views: original, reverse, and half-rotated. Candidate order is explicitly
declared non-evidence. GLM may return up to eight distinct numeric display IDs
or exact candidate paths. Both forms are normalized to exact paths. No retries,
repairs, or response reinterpretation are permitted.

For each view, the partial GLM ranking is completed with the deterministic ARE
ranking after removing duplicates. The treatment is unweighted reciprocal-rank
fusion of the deterministic ARE ranking and all three completed GLM rankings,
with `k=60`. Ties are resolved by the deterministic ARE rank and then exact
path. Baselines are the already-frozen deterministic ARE and chunk-BM25 file
rankings over the exact same source universe.

## Provider and resource ceiling

- Model: `glm-5.3-flash`
- Maximum tokenizer calls: 72
- Maximum generation calls: 72
- Maximum output: 512 tokens per generation
- Context admission: tokenizer count plus 512 must be at most 8192
- Aggregate prompt-token ceiling: 500,000
- Automatic retries: zero; stop on transport, HTTP, cap, or integrity failure
- Raw provider payloads remain private benchmark evidence

## Metrics and fixed gates

Evaluation opens labels only after all predictions and their hashes are sealed.
Relevance is the exact set of files changed by the benchmark fix. Primary
metric is case-level MRR@8. Secondary metrics are Hit@3 and candidate reach@20.
Uncertainty uses a deterministic repository-stratified bootstrap over the 12
repositories (100,000 replicates; fixed seed recorded by the evaluator).

The bounded superiority claim passes only if every gate passes:

1. 72/72 tokenizer admissions and 72/72 valid generations.
2. 24/24 labels and source universes validate against exact commits.
3. Treatment and both baselines use identical per-case universes.
4. Treatment MRR@8 is at least 0.10 above the stronger baseline.
5. The repository-bootstrap 95% lower confidence bound is above zero against
   each baseline.
6. Treatment Hit@3 is not below the stronger baseline.
7. Treatment improves MRR@8 in at least 8 of 12 repositories relative to the
   stronger baseline.
8. Candidate reach@20 is not below either baseline.

Passing supports only: on this frozen, fresh 24-case BugsInPy exact-commit
trace-to-file cohort, the fixed ARE+three-view GLM RRF treatment outperformed
the frozen ARE and chunk-BM25 baselines under the metrics above. It does not
support general software-engineering, model, or product superiority.

## Open questions

- Will the prospective response schema remain valid for all 72 generations?
- Will the effect replicate with the fixed margin and repository-level breadth?
