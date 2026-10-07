# G01 r60 — functionality-query full-repository acquisition

Status: prospective exposed-development protocol; no new provider calls.  
Population: 48 exposed BugsInPy r1+r2b cases.  
Claim ceiling: acquisition mechanism only, not ranking or superiority.

## Frozen mechanism

Reuse the exact full-repository 120-line chunk BM25 implementation and exact
failed-commit source projections used for the original raw-query BM25 ranking.
Replace only its query with the 48 already sealed r57 functionality summaries;
all 48 are shape-valid. One summary may contain a source-like path copied from
its authenticated failure log; do not repair or exclude it. The raw-query
ranking is retained unchanged as an independent control.

For each case:

- A: r56 first-occurrence union of ARE top 10 and raw chunk-BM25 top 10,
  maximum 20 files.
- B: ARE top 10 plus functionality chunk-BM25 top 10, first-occurrence union,
  maximum 20 files. This isolates query replacement in the lexical channel.
- C: A plus functionality chunk-BM25 top 10, unique first-occurrence union,
  maximum 30 files. This retains the raw channel and tests additive reach.

The script checks source receipts, r56 candidate identity, BM25 source-code
hash, and all r57 summary hashes before writing rankings. Rank all files in
each pinned projection; do not inspect evaluator labels until the 48-case
source seal exists. No model inference or new GLM call is permitted.

## Frozen evaluation gate

Report at-least-one-gold reach, mean gold-file recall, number of new and lost
cases versus A, and file counts. Advance B or C for a separately frozen
ranking treatment only if it covers all 48 cases, adds at least four of A's
missed cases, loses zero A-reachable cases, and stays at or under its 20/30
candidate cap. The advancement gate does not itself establish MRR or any
superiority claim.

## Open questions

- Does behavior-oriented retrieval recover the hard cases beyond both raw
  rankers' top 30?
- If reach improves, how should the larger candidate pool be ranked under 8K?
