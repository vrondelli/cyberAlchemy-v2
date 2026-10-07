# G01 r59 — bounded candidate-acquisition diagnostic

Status: prospective exposed-development protocol. No model, provider, or test execution.  
Population: the same 48 exposed BugsInPy r1+r2b cases.  
Claim ceiling: acquisition mechanism evidence only.

## Inputs and arms

The source-only script pins the r56 source windows/queries, full ARE and
chunk-BM25 rankings, and exact source-projection receipts by SHA-256. It must
seal every candidate list before the evaluator opens gold labels.

- A: unchanged first-occurrence union of ARE top 10 and chunk-BM25 top 10,
  maximum 20 files. This is r56/r57's candidate pool.
- B: first-occurrence union of ARE top 15 and chunk-BM25 top 15, maximum 30
  files. This tests whether a modest depth increase recovers misses.
- C: A plus up to ten unique Python siblings in the exact parent directory of
  each A file, ordered first by seed rank, then by descending raw-query token
  overlap with the sibling's path, then exact path. Root-level seed files do
  not expand. The unchanged A prefix is always preserved; maximum 30 files.

All paths must exist inside the exact pinned source projection. Existing A/B
rankings include some non-Python files and are preserved; only C's additions
are required to be `.py` paths. C is
a deliberately cheap LinuxFL+-inspired directory expansion, not a replica of
that system. No gold paths, passing source, patch history, or evaluator data
can influence candidate construction.

## Evaluation and gate

Report at-least-one-gold reach at 20 (A) and 30 (B/C), number of newly reached
cases, reach losses, mean candidate count, and gold count recall at the arm
cap. Advance an acquisition arm for a separate ranking experiment only if it
adds at least four of A's missed cases, loses zero A-reachable cases, covers
all 48 source cases, and uses no more than 30 candidates per case. A union
cannot qualify for an MRR or superiority claim without a separately frozen
ranking/selection stage and fresh confirmation.

## Open questions

- Which misses remain beyond shallow rank depth and same-directory neighbors?
- Can structural/behavioral query channels find the remainder under a bounded
  index and inference budget?
