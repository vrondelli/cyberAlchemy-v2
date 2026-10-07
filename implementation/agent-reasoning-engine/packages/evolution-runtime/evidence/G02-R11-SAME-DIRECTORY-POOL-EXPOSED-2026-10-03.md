# G02 r11 same-directory source pool — exposed coverage census

Status, 2026-10-03: **candidate-generator diagnostic only; not an eligible read policy**.

The source-only rule enumerated tracked regular UTF-8 files no larger than 262,144 bytes at the exact parent directory of any file ARE had already read in each of the 12 scored r11 pairs. It excluded those delivered paths, verified each pinned base commit and issue digest, and read no native gold, score, comparator output, or model response. The 12-task source seal contains **1,266** candidate paths and has SHA-256 `58977faf143e620d3f6695d79a58b37c01669a3d7ae239992833d97f37c38dc1`. It is private at `/home/vlad_/are-benchmark-archive/g02-r11-same-directory-pool-exposed-r1-20261003/SOURCE-SEAL.json`.

Only after that seal, the separate evaluator-only audit compared the pool to native references. Of the **22** gold files not delivered in the 12 archived ARE episodes, **7** were in this pool, including **3** outside the union of the earlier raw and structured BM25 top-30 candidate sets. The pool also contains **1,259 non-gold** files. The 7 hits are distributed across tasks 3, 4, 5, and 7; no missing gold is covered for tasks 1, 8, 9, or 12. The counts-only audit SHA-256 is `d540433d844036795bc6e2de7cc50ed14f15a95efa3aee90ede57063a81ec191`.

This relation adds some candidate coverage but has far too little precision to dispatch as a three-read policy or a full GLM chooser packet. No file was newly read by ARE; no native F1, token-cost, independent-cohort, or superiority result follows. The next valid test would require a source-only rank or structural filter that preserves the three incremental hits without opening evaluator paths as policy inputs.

## Open Questions

- Can a repository-general, issue-grounded structural filter reduce the 1,266-file pool to a small read budget while retaining meaningful missing-file coverage?
- Does any such filter transfer across Ansible, Django, Sympy and C++ on exposed development before it is frozen for untouched validation?
