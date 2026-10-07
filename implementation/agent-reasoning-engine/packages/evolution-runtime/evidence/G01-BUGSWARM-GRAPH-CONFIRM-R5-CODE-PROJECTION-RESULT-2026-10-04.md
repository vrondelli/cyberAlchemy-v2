# G01 reserved confirmation r5 — code-only projection result

Status, 2026-10-04: **24/24 exact failed-source code-only roots materialized and sealed** under the [prospective r5 protocol](G01-BUGSWARM-GRAPH-CONFIRM-R5-CODE-PROJECTION-PROTOCOL-2026-10-04.md). All roots are private WSL paths; no full source checkout was transferred to the VPS. This is not a ranking, GLM, evaluator label, score, ContextBench, or superiority result.

The projection is pinned to the r2 final-slot result SHA-256 `a55087a01c1b157ea7fcd6dfa4327037a3e4cb13c72df5e0c31b44d80513c22c` and r4 archive result SHA-256 `b23312e777f22ce98191463df25af5d9f1fcef65c863384cc00e521209d98326`. The protocol SHA-256 is `02c6e236b2bea445cb967308da6dd34a23f6153ecf0868866fd96272a68c62d1`, materializer SHA-256 `8bccfc56769e92d3c54f6c6ce3ab6c6c905c1c02b19542e4574e12ba7a452c41`, and final receipt SHA-256 `3eea3878d6769be39a88c98473cfc7eb0c019e4e33f82b665b7b18271dda4e4a`. It extracted exactly **19,452 tracked `.py`/`.java` files and 149,452,051 source bytes**; each slot's count matched r4's tar inspection, and each Git index matched exactly its extracted path set. The receipt stores a sorted path/content tree hash per slot.

Next: produce bounded failure-side queries from the authenticated r2 logs, then run the unchanged ARE file ranker and graph-r2 acquisition on these exact roots. All baseline and treatment predictions must be sealed before evaluator-only labels are opened. The VPS has about 1 GB free, so send only bounded source-only packets there for GLM generation.

## Open Questions

- Do the 24 source-only failure queries pass the same 1 KiB/redaction rule used in development?
- Do the unchanged ARE and graph-r2 rankers cover all projected files under the memory budget?
- Which raw-listwise treatment and full comparator/cost gate will be frozen before provider requests?
