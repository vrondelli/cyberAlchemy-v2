# G01 r61 — fixed ranking of the expanded functionality pool

Status: prospective exposed-development protocol; no provider calls.  
Population: the same 48 BugsInPy r1+r2b exposed cases.  
Claim ceiling: ranking mechanism evidence only.

R60 arm C is the fixed candidate set. Keep the r56 two-channel ARE+raw
chunk-BM25 full ranking as arm A. Complete r60's functionality-BM25 top-30
partial ranking by appending unseen paths in arm-A order. Compute unweighted
`RRF(k=60)` over the complete ARE, raw chunk-BM25, and completed
functionality-BM25 rankings. Arm D orders only the r60 C candidate files by
that three-channel score (exact path tie-break) and appends non-C paths in
unchanged A order. No per-case selection, learned weight, or post-hoc guard.

`build.py` must verify all pinned input hashes, preserve each case's full file
universe, and seal 48 source rankings before `evaluate.py` opens gold labels.
No extra source checkout, model inference, or GLM call is allowed.

Evaluate MRR@8, Hit@3, recall@20, and paired repository-cluster bootstrap
over 24 cohort/repository clusters. D advances only if all hold: 48 sealed;
MRR@8 at least `+0.05` versus A; 95% paired lower bound above zero; Hit@3
and recall@20 not below A; and at least 14 cluster wins. Passing would still
be exposed mechanism evidence, not fresh confirmation or superiority.

## Open questions

- Can unweighted lexical fusion promote the seven newly reachable files early
  enough, or is bounded code-evidence reasoning required?
- Does the selected acquisition channel transfer to a fresh source-disjoint
  cohort under the same 8K and cost limits?
