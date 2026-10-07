# G01 cross-branch 24-task source-only cohort candidate

Status: **historical source-only preflight, subsequently frozen as r5 and stopped**, 2026-09-29. At the time of this preflight, no GLM calls or native scores were produced. The later [r5 stopped-run record](G01-R5-STOPPED-RESULT-NOTE.md) documents eight pre-model unscored pairs and the cache-origin prerequisite omitted here; all 24 IDs are now conservatively manifested. This note is private benchmark preparation, not superiority evidence.

The [deterministic selector](../research/g01-fast-live-v1/propose-cross-branch-cohort-r1.py) (SHA-256 `dbe2673c7f07fe83682f0003b1cda2165b0584c08f86a47156e4aaa3e696dbcc`) ran on the GLM VPS. Five local unit tests passed. It required the evaluator-only eligibility receipt SHA-256 `53049858bc21ef629e89516e5412456e1aaa932875959f4fb78d36646ff11c53` and the source-supply receipt SHA-256 `66bc896141d634ba8a54ea268cccea585020c4f4adbd45d295f4adda95d5bc99`. It checked the exact currently present G01/HEN/G02 manifest path set and every manifest hash against the supply receipt; no drift was found. It rejected unknown row fields, so gold paths, values, patches, and scores cannot enter this draw. It created no `tasks/*.json` manifests.

The fixed seed `are-g01-cross-branch-cohort-candidate-r1` ranks each eligible ID by SHA-256 of `seed + NUL + instance_id`, with the ID as a tie-breaker. The resulting 24 distinct IDs have set digest `ce6775a4a613e7da24c1dba4682b8a65e9b574b209c7957e3271aebdbc1e61bc`. Re-run the selector against the pinned receipts to recover the ordered IDs; they are **candidate IDs only**, not a frozen benchmark population.

The selector verified the entire pinned parquet SHA-256 `2f56535bdc73eb8a68bf4ebb49789d8e9cd4f219ea60df6290b85278aee61ca8`, projected only the eight source fields, and joined exactly those 24 unique IDs. The private, non-frozen candidate file is `/opt/are-harness-benchmark/g01-source-cache-preflight-20260929-r3/COHORT-CANDIDATE.json` (SHA-256 `175a522753165672fb08aad794b731bfbce3b0bfbb3232c59581254074278b61`). It includes source task text and base commits, but no gold or scores.

| Language | Repository and source quota | Candidate count |
| --- | --- | ---: |
| C | PonyC / Multi | 6 |
| Go | cli / Multi 3; grpc / Multi 3 | 6 |
| JavaScript | Svelte / Multi 3; serverless / Poly 3 | 6 |
| Rust | tracing / Multi 3; fd / Multi 3 | 6 |

This spans seven repositories but is not representative of all ContextBench: C comes from one repository, and the fixed quotas deliberately constrain the claim. The fd quota uses all three remaining eligible fd IDs. The selector does not establish label integrity, model behavior, or cost.

## Source-only readiness result

Ten selected commits were already present in existing caches. Fourteen were absent there; two new repository samples and then twelve remaining exact commits were fetched as independent shallow checkouts, with clean HEADs and no Git alternates. The fresh sample and remaining roots are `/opt/are-harness-benchmark/g01-source-cache-preflight-20260929-r2` and `...-r3`; they occupy approximately **12 MiB and 98 MiB**, respectively. No prior cache or campaign root was mutated or removed.

The [24-task index preflight](../research/g01-fast-live-v1/preflight-cross-branch-cohort-r1.mjs) (SHA-256 `d82be60118cb886ffc76cbc8e353db2fb04ab01c3f1a518aca18bbaed64014b8`) passed two local tests. Its VPS receipt `/opt/are/evolution-runtime/g01-cross-branch-preflight-r1/SOURCE-INDEX-PREFLIGHT.json` has SHA-256 `38151e99f6a0d56a396606d5c74b2abc5fb1a7cb2ee028becf006572ea72241c`, verified after the run. All **24/24** task-specific, 1,024-byte bounded issue-primer indexes passed with `model_calls=0`, local settlement true, process group absent, and no forced termination. Five indexes were complete; **19 were partial** due to excluded files. This is index support, not proof that every relevant source file is available or that model predictions will score. The summed per-task index elapsed times were 166,972 ms with two concurrent workers; that sum is not wall-clock time.

Nine more depth-one checkouts were made from existing read-only cli/Svelte/fd caches solely to measure the remaining exact task commits. A separate read-only audit then verified all **24 selected checkout HEADs**, clean worktrees, and absent alternates. Their summed on-disk size is **348,688 KiB**: PonyC 56,800; cli 15,708; grpc 17,584; Svelte 214,032; serverless 29,528; tracing 11,368; fd 3,668 KiB. Svelte is the main capacity driver. At the r4s runner's four independent checkouts per pair, the simple source-checkout projection is **1,394,752 KiB (~1.33 GiB)**, *before* logs, temporary files, scorer outputs, and a verified raw archive. The VPS had **2,414,120,960 free bytes (~2.25 GiB)** after these samples. This headroom is too narrow to treat a full campaign-plus-archive as capacity-proven; batch and archive mechanics need an exact forecast or verified recoverable relocation of only these new preflight clones. Do not delete predecessor roots or archives. A no-generation transport probe also remains before a live freeze.

The proposed next gate above was historical. It did not include the runner's `git remote get-url origin` prerequisite. R5 was frozen and stopped after that omission surfaced; do not use these IDs again as a fresh cohort. The separately selected [r6 source-only successor](G01-R6-SOURCE-ONLY-CANDIDATE.md) closes the origin/checkout preflight gap while preserving G01's native control and strict 8K window.

## Open Questions

- Do the 19 partial source indexes omit task-relevant files, and can the measured 1.33-GiB four-checkout projection plus archive/temporary overhead fit safely under current headroom?
- Is the fixed seven-repository mix sufficient for the exact bounded claim, given the single-repository C stratum and Poly/Multi source mix?
- Does the current G01 candidate preserve Span-F1 and known-token efficiency across exposed counterexamples strongly enough to justify dispatching this fresh cohort?
