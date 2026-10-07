# G01 reserved confirmation r4 — exact failed-source archive admission

Status, 2026-10-04: **24/24 exact failed-source archives admitted under a separately frozen source-only r4 rule.** This is not a ranking, GLM, label, score, ContextBench, or superiority result. The original r3 19/24 whole-cohort gate remains terminal failed.

The [r4 protocol](G01-BUGSWARM-GRAPH-CONFIRM-R4-SOURCE-REPAIR-PROTOCOL-2026-10-04.md) pinned the unchanged 24-slot r2 cohort and r3 archive result before any r4 requests. It revalidated 19 r3-admitted archives; accepted three previously rejected complete archives only after one exact TLS-verified 301 redirect from the original repository's full failed-commit URL to the fixed current repository, followed by HTTP 200 and a matching tar root; and fetched only two over-cap archives under the new 512 MiB WSL-only cap. Those two were 198,916,620 and 223,330,636 bytes. All 24 archives passed the strict root/path and code-only projection checks. Their aggregate compressed size is **535,373,820 bytes**, and eligible code members total **149,452,051 bytes** (largest single case 39,132,095), below the fixed per-case bounds. No source checkout was stored on the VPS.

The protocol SHA-256 is `b3963de5ba58f79c1b5d264a68b41de71d7cdc09136aaac33fe5ff45cb5bd01e`, runner SHA-256 `3312115cff9d99dad4c1da54284f2b6c5bd3a0fb4f846d8323b8ffd9de149a5b`, and 24-case result SHA-256 `b23312e777f22ce98191463df25af5d9f1fcef65c863384cc00e521209d98326`. Private WSL receipts and the two new complete tarballs are under `/home/vlad_/are-benchmark-archive/bugswarm-1.3.1-g01-feasibility-20261004/graph-confirm-r4/source-archives/`; r3 complete archives and partial attempts remain at their original private paths. No source evidence was deleted. The exact alias redirect targets and final status are in the r4 result.

Next: materialize and independently verify source-only `.py`/`.java` roots from the pinned archives, then freeze the ARE/graph/raw-listwise selector and cost protocol before GLM calls. Evaluator-only HTTPS Git-tree labels may be opened only after all source-side predictions are sealed. Any later claim remains limited to this availability-selected BugSwarm population and its matched task/metric/cost boundary.

## Open Questions

- Can the 24 code-only projections and deterministic ARE/graph candidate ranks be reproduced without opening labels?
- Does a prospectively selected raw listwise treatment retain its exposed-development advantage on these 24 independent repositories after full cost accounting?
- Can evaluator-only exact Git-tree labels be admitted 24/24 with no source/evaluator leakage?
