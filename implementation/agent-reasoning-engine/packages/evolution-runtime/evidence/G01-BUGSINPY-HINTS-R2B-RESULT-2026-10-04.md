# G01 BugsInPy paired log-path hints r2b result

Status: **r2b completed and independently audited; the frozen hinted-over-
unhinted advancement gate failed.** A separate, bounded file-reranking
advantage over the named local standalone rankers replicated on this task-
and commit-disjoint cohort. Neither finding is general ARE-product,
ContextBench, official RepoMap, exact-Git/live ARE, or efficiency
superiority.

The [r2 source freeze](G01-BUGSINPY-HINTS-R2-SOURCE-FREEZE-2026-10-04.md)
excluded every r1 bug and repository-commit. It selected 24 new cases in
12 repositories, three of them new relative to r1. The original
[r2 protocol](G01-BUGSINPY-HINTS-R2-PROTOCOL.md) failed a no-model 64 MiB
index preflight on two Ansible cases. The separately named
[r2b amendment](G01-BUGSINPY-HINTS-R2B-PROTOCOL.md) kept all cases and
uniformly raised the complete-index cap to 128 MiB *before any model call
or r2 gold opening*. Actual source-only ARE and local chunk-BM25 rankings
then covered 24/24 cases, 42,106 case-files and 85,609 chunks. Their
prediction SHA-256 values are
`2782baa52bf05d6c91f61a76b743f526727aaf1f223f0107771914b290add39d`
and `bfd243faebe96258ff730bc8eb0d2796f25750d33f91c32e1a59e3ed34c5427f`.
The [source-only log-path hints](../research/arb-trace2code-r1/extract-bugsinpy-log-path-hints-r1.py)
were sealed at
`d2f9848dbfb2bca8f09890e16ebbd0d3a202dafc6f151d7f7f57e23d2f0b2092`.

The paired 48-packet file was sealed at SHA-256
`f49de587e08039426ab536afe96e323a511202af27a47a1b89014e07cafcbd18`.
The VPS root is `/opt/are/evolution-runtime/g01-bugsinpy-hints-r2b/`;
its pre-dispatch `FREEZE.json` SHA-256 is
`d087a7d2cbbbaf671a68e6067e5bd17e76d232ee532e9c930c28ebe256b11798`.
The full private run has a checksum-identical WSL cold copy under
`/home/vlad_/are-benchmark-archive/bugsinpy-trace-candidate-20261004/vps-run-r2b/`.
No source archive, patch, or fixed output was sent to the VPS.

All **48/48** paired tokenizer admissions and one-shot GLM-5.3-flash
requests returned valid HTTP 200 JSON selections with zero automatic
retries. The largest prompt was 3,011 tokens, below the 8,192 prompt-plus-
512 reserve cap. The 48 task calls used **104,462 prompt + 1,895 completion
tokens** and **101,887 ms** summed provider-call wall time, excluding
readiness and tokenizer checks. By arm: hinted 53,206 + 784 tokens and
45,732 ms; unhinted 51,256 + 1,111 tokens and 56,155 ms. These are
stochastic, provider-observed task-call quantities, not a matched
end-to-end efficiency win.

All 48 provider responses were independently bound to their exact request
hashes and model-selected IDs, and both full-file rankings per case were
sealed *before* patch evaluation. The prediction SHA-256 is
`45b0abd6cfa39d14299c3cd2e069458c82d84573b1406b8b9d9066f8f89a1130`.
The evaluator found **24/24** nonempty patch-changed source labels within
the frozen universe. Its private `EVALUATOR-AUDIT.json` SHA-256 is
`b8a2d0829aba9d4838af53677d2503cb1c976c5cd3f55d3347f625e513ce1ae2`.
An independent [Git-patch/metric verifier](../research/arb-trace2code-r1/verify-bugsinpy-hints-r2b.py)
matched all 24 patch-path sets, union-hit bits, and per-case and aggregate
metrics.
An independent resampling calculation from the 12 per-repository paired
differences reproduced the reported bootstrap endpoints (within floating-
point rounding); 640 of the 20,000 draws were nonpositive.

| Frozen r2b, 24 paired cases | MRR@8 | Hit@3 | Recall@20 |
| --- | ---: | ---: | ---: |
| Local chunk BM25 | 0.28586 | 11/24 | 0.79861 |
| ARE trace-text file ranker | 0.29415 | 9/24 | 0.76389 |
| Unhinted GLM rerank | 0.74306 | **21/24** | **0.84722** |
| Hinted GLM rerank | **0.83681** | **21/24** | **0.84722** |

The hinted arm raised candidate-union gold-hit coverage from **21/24 to
23/24**, adding httpie/3 and matplotlib/16 with no lost union hit. Mean
hinted-minus-unhinted MRR@8 was **+0.09375**, but the prespecified 20,000-
draw paired repository-cluster 95% interval was **[−0.00347, +0.20139]**.
Four of five advancement checks passed; the positive-lower-bound check
failed. **Do not claim a confirmed hinted-over-unhinted quality gain.**
The per-repository differences include losses in Ansible and FastAPI.
Ten paired cases had byte-identical prompts despite different arm labels;
two of those had different MRR outcomes. This observed stochastic
variation further limits causal attribution of the aggregate +0.09375.

Both rerank arms show a second large advantage over the local ARE file
ranker: unhinted **+0.44891 MRR@8** and hinted **+0.54266**, with
post-evaluation repository-cluster intervals **[+0.31250, +0.58085]** and
**[+0.36558, +0.70337]**, respectively. These intervals are a secondary
follow-up calculation, not the frozen r2b advancement gate. Alongside
[r1](G01-BUGSINPY-FRESH-R1-RESULT-2026-10-04.md), this supports a
repeated **bounded source-projected reranking superiority over the two
named local rankers at additional model cost**, without pooling the two
cohorts or implying fully repository-disjoint confirmation. No product
page or public claim was changed.

## Open Questions

- Can path hints deliver a stable paired GLM gain on a larger untouched
  cohort, or is r2b's +0.09375 largely model variation?
- Does the source-projected reranking advantage hold against official
  RepoMap and inside exact-Git/live ARE episodes with full cost accounting?
- Which separately governed ContextBench/DSH campaign can connect this
  retrieval mechanism to the product's native Span-F1/File-F1 outcomes?
