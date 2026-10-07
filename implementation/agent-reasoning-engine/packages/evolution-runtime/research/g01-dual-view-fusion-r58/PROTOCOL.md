# G01 r58 — fixed dual-view semantic fusion

Status: prospective exposed-mechanism protocol; no new model calls.  
Population: the same 48 exposed BugsInPy r1+r2b cases as r56/r57.  
Claim ceiling: exposed mechanism selection only; not confirmation or superiority.

## Frozen inputs and treatment

- r56 raw-query rankings SHA-256: `679a46dc1485c5d729c15644ceb795210782371e2d969adc786a07d61942eb28`.
- r57 functionality-query rankings SHA-256: `151079b1c62baec6e723d7bb9bbd125651f4bd5f2daa51cca0f6b923a4eeb70c`.
- Unchanged ARE and chunk-BM25 rankings use the SHA pins in `build.py`.
- Each semantic score map is sorted by descending score, then exact path. The partial order is completed with the unchanged two-channel ARE+chunk baseline remainder, preserving all files exactly once.
- Arm D is unweighted reciprocal-rank fusion, `RRF(k=60)`, over complete ARE, chunk-BM25, raw-query SweRank, and functionality-query SweRank rankings. Ties use exact path order. No per-case choice, learned weight, threshold, or post-hoc repair.
- Arms A, B, C are carried forward unchanged from r57: two-channel baseline, raw-query SweRank fusion, and functionality-query SweRank fusion.

`build.py` verifies input identity and writes all source-only rankings plus a hash seal before `evaluate.py` may open evaluator labels. Existing r57 summary-format validity is carried unchanged. No GLM request, embedding inference, or source checkout is needed.

## Frozen evaluation and advancement gate

Evaluate all 48 cases with MRR@8, Hit@3, and recall@20. Repository is the bootstrap cluster (24 cohort/repository clusters); 100,000 draws and fixed seeds are in `evaluate.py`. D advances only if all conditions hold:

1. All 48 rankings sealed and all 48 prior summaries valid.
2. D minus A MRR@8 at least `+0.05`; D minus C at least `+0.02`.
3. Both paired cluster-bootstrap 95% lower bounds exceed zero.
4. D Hit@3 and recall@20 are not below either A or C.
5. D wins at least 14 of 24 clusters against A.

A failed gate remains a terminal measured development result, not a reason to alter this protocol. Regardless of r58, candidate acquisition remains a separate hypothesis: r56/r57's top-20 union omitted all gold paths in 12/48 exposed cases.

## Open questions

- Does a fixed dual-view fusion retain the functionality gains without its baseline regressions?
- Can separately frozen candidate expansion improve reach under a bounded file/cost budget?
