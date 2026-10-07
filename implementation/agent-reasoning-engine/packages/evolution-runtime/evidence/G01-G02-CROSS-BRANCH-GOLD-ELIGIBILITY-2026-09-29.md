# G01/G02 cross-branch native-gold eligibility preflight

Status: private evaluator-only feasibility evidence, 2026-09-29. No cohort was frozen, GLM called, native score computed, or product claim made. This is a successor to the [source-only cross-branch supply audit](SUPERIORITY-CLAIM-RESEARCH-2026-09-29.md), not a quality result.

The [eligibility auditor](../research/g01-fast-live-v1/audit-cross-branch-gold-eligibility-r1.py) recomputed the source-only admission set from the pinned ContextBench `full.parquet` (SHA-256 `2f56535bdc73eb8a68bf4ebb49789d8e9cd4f219ea60df6290b85278aee61ca8`), verified the prior supply receipt and G01/HEN+G02 exposure-set digests, then called the pinned `GoldLoader.files()` in an **evaluator-only process**. It exported only `instance_id`, source, repository, language, native-gold file-presence Boolean, and loader-error Boolean. It did not export gold paths, labels, patches, or scores; the output is not a model-runner input.

Private receipt: `/opt/are/evolution-runtime/g01-cross-branch-gold-eligibility-r1/GOLD-ELIGIBILITY-AUDIT.json`, SHA-256 `53049858bc21ef629e89516e5412456e1aaa932875959f4fb78d36646ff11c53`. The [source-supply receipt](SUPERIORITY-CLAIM-RESEARCH-2026-09-29.md) SHA-256 is `66bc896141d634ba8a54ea268cccea585020c4f4adbd45d295f4adda95d5bc99`. Independent read-only shape/count checks found 931 unique rows, exactly the six declared row keys, **929** with native-gold files, **two** without, and **zero** loader errors. Local unit tests for source filtering and Boolean-only projection passed 4/4 across both auditors.

| Language | Source-only rows | Native-gold-eligible |
| --- | ---: | ---: |
| C | 43 | 43 |
| C++ | 60 | 59 |
| Go | 40 | 40 |
| Java | 57 | 57 |
| JavaScript | 95 | 94 |
| Python | 493 | 493 |
| Rust | 24 | 24 |
| TypeScript | 119 | 119 |

The proposed G01 C/Go/JavaScript/Rust population has **201** eligible rows (43/40/94/24). It is not language- or repository-balanced by itself: all 43 C rows are PonyC; the largest Go repository is cli (27); the largest JavaScript repository is Svelte (49); Rust is distributed, led by Nushell and tracing (five each). No PonyC, Nushell, tracing, or Tokio G01 cache was found in a bounded VPS cache-root check. The VPS root had approximately **2.6 GiB free, 99% used**. A source-only deterministic draw, source-index/checkout preflight, and non-destructive storage plan remain necessary before a G01 freeze. File-presence does not prove label consistency, scoreability, or source cache readiness.

For G02 Pro tasks, the earlier [G02-only supply audit](G02-POST-R3-SUPPLY-AUDIT.md) counted 86 eligible unmanifested IDs after excluding G02 manifests. **Cross-branch exclusion reduces this to 84**: Ansible 51, Open Library 17, qutebrowser 9, vuls 4, and NodeBB/Teleport/Flipt one each. The two additional exclusions are G01/HEN-manifested Pro IDs, not native-gold failures. This 84-row set is the appropriate current maximum before further source/index/cost preflight; the original r3 Navidrome and element-web repositories remain exhausted. Do not silently keep the earlier 86 as a joint G01/G02 holdout pool.

## Bounded C/Rust cache sample

A no-generation operational preflight sampled **one** eligible task each from PonyC and tracing. Within each repository, the sample was the lexicographically lowest `(SHA-256(UTF-8("are-g01-cache-preflight-r1") + bytes 5c 30 + UTF-8(instance_id)), instance_id)` across the eligible rows. This exact separator records the escaped `\\0` bytes used by the sample command, not a NUL; the selection was recomputed independently and matched. It is a cache sample, not a future cohort draw or model exposure.

| Repository | Sample ID suffix | Exact commit | Shallow clean checkout | Source-index probe |
| --- | --- | --- | ---: | --- |
| `ponylang/ponyc` | `d22bf206` | `336000f438564ca2863d32685964ccd23ec9d174` | 7.4 MiB | 577 files admitted, no exclusions; worker settled; zero model calls |
| `tokio-rs/tracing` | `2e0110cd` | `d8a46edafd0a51ee20e1d0e38e42274c7ca270ee` | 3.4 MiB | 257 files admitted, three encoding exclusions; worker settled; zero model calls |

The source-only checkouts are under `/opt/are-harness-benchmark/g01-source-cache-preflight-20260929/`. Git verified both exact HEADs, clean worktrees, shallow status, and absent alternates; together they occupy about 11 MiB. The pinned `runSourceIndex` service completed with `local_settled=true`, `process_group_absent=true`, and `forced=false` for each. These generic source-query probes demonstrate initial checkout/index compatibility and rough sample storage, **not** task-specific hint relevance, all-commit fetchability, complete Rust indexing, or 24-task campaign capacity. Tracing's partial index is specifically due to three encoding exclusions, not an index-process failure. No existing campaign root was deleted or modified.

## Open Questions

- Which eligible repositories can be source-indexed at their selected commits under the VPS space budget without removing prior evidence?
- Which 24-task stratification, if any, is representative enough for a bounded G01 claim when C supply is only PonyC and Rust is diffuse?
- Which G02 quality candidate can survive exposed cross-repository tests before a new 84-ID Pro pool is sampled?
