# G01 exposed r9 — failed-test query channel result

Status, 2026-10-04: **source-only development gate passed; no r9 GLM call or fresh confirmation.** The 24 r8 repositories were already evaluator-exposed. This screen transfers the query-type-aware idea from [LLmiRQ](https://arxiv.org/abs/2412.03754) into a bounded, deterministic failed-test-only BM25 channel; it does not reproduce LLmiRQ's model or published evaluation.

The [prospective r9 protocol](G01-BUGSWARM-EXPOSED-R9-TEST-QUERY-PROTOCOL-2026-10-04.md) fixed the channel and candidate priority before execution. The unchanged ARE BM25 file ranker ran on the exact failed-commit code roots using only the sealed `failed tests:` field, not the full log tail. Twenty-three cases had a nonempty test field and complete source-index rankings; the one missing-test-field case preserved the old candidate list. The candidate selector retained each graph/test-edge top-30 union, then took up to 20 new non-test channel hits, then old stratified additions up to 80 paths. All 24 selections were sealed before evaluator access at `CANDIDATES.jsonl` SHA-256 `7cdd714d5aca367b7ed9a24681391ac3ebd0e8b3e125d0eae1d5d12ce22840f5` and seal SHA-256 `05204ebcab4b1157c524a474f22ea2ff04e7538d5644a73a604b49675e7cdac0`.

Evaluator-only direct-tree patch-path reach improved **18/24→21/24**, with new reaches at ordinals **10, 15, 23** and **zero reach losses**. All 24 lists were identity-matched, unique, source-only, and at most 80 paths. The evaluator receipt at `graph-confirm-r4/exposed-r9/EVALUATION.json` in the private archive has SHA-256 `65d51f3ee1e5ce14d44a111d4f04a464bdf4662825546517434f94043e4fe78b`; its conjunctive source-only gate passed. The old lists had 1,068 candidate placements; the new lists have **1,382**. This is reach, not MRR or GLM quality. No model call was made for r9.

Next: a separately frozen 8K packet and raw-listwise GLM development test on this same exposed cohort, with full tokenizer/generation cost and matched score. The three remaining candidate misses (19, 20, 22) motivate a separate structural/symbol channel; they are not a reason to amend r9 after observing its score. Any superiority claim still requires a new repository-disjoint cohort.

## Open Questions

- Can 80-file r9 packets fit same-account 8K tokenization, and will GLM use the three newly reachable candidates effectively?
- Which source-only structural signal reaches OntologyConfigurator, module-info, and Metric2RegistryModule without losing existing reach?
- How large is the remaining unexposed BugSwarm repository-disjoint population after all previous G01 selections?
