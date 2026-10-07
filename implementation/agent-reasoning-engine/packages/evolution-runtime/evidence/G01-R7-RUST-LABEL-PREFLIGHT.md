# G01 r7 Rust gold-lineage preflight

Status: private evaluator-only preflight, 2026-09-29. No GLM calls, predictions, native scores, cohort freeze, or product claim are made here. This is not an r6 amendment.

The current [cross-branch source-only census](SUPERIORITY-CLAIM-RESEARCH-2026-09-29.md) excludes manifested G01/HEN and G02 task IDs. Its private receipt `/opt/are/evolution-runtime/g01-cross-branch-supply-r3/SOURCE-SUPPLY-AUDIT.json` has SHA-256 `57d26dc84226850d66eeb934ae2c347b038df946b0e9a86e1823ba1e9323a321`: 883 untouched source-only rows, including 12 Rust rows. The separate gold-file-presence receipt has SHA-256 `386888a50e1010a87e5cd4b7c091f8072746e98292f62207690cb07a31779239` and confirms all 12 Rust rows have nonempty native-gold file lists. Presence alone did not establish label integrity.

All 12 exact Rust base commits were fetched into source-only bare caches under `/opt/are-harness-benchmark/g01-r7-label-preflight-rust/`, bound by cache receipt SHA-256 `f7a807d094cf5291ee8bf63fa3a40903ac6c5c7b7f30dbaaa5e50fa1464b1625`. The first strict audit found 1/12 mechanically clean; its r2 parser recognized bare-numbered blank EOF lines but still found 1/12. Those prior results remain unchanged.

The versioned [r3 evaluator-only audit](../research/g01-fast-live-v1/audit-r7-rust-gold-lineage-r3.py), script SHA-256 `0e5e46d69073674e15702265e53b97c03404c2f7da5a4ffe77284032fca8a177`, recognizes source excerpts at the **recorded position** when they differ only in surrounding whitespace, omit a terminal blank source line, or use the pinned scorer's EOF sentinel. It still rejects missing base files, out-of-base ranges, shifted coordinates, absent content, and substantive source mismatches. It exports only per-task eligibility bits/counts, never gold paths or content. Its private receipt `/opt/are/evolution-runtime/g01-r7-rust-gold-lineage-r3/GOLD-LINEAGE-ELIGIBILITY.json` has SHA-256 `ade30d2cbbfa3244e2d46ffaec0f43413d187d20f5894f721c21d9551cdc3c7b`.

Result: **3/12 Rust tasks mechanically clean**—two of five Nushell tasks and the single Rayon task; zero of four Tokio and zero of two Tracing tasks. This is an eligibility screen, not semantic certification or a performance result. The two scripts/results are preserved with the live caches; the r3 script and receipt have a verified compressed addendum archive SHA-256 `dc6e7238296b092763fd016b95b351e452726e77e609eb4c4821420d39ef0914`.

The next G01 cohort must use one prospectively specified gold-lineage rule across all languages and disclose its population effect. The Rust supply can contribute at most three screened tasks under this rule; it cannot support a seven-Rust allocation. Do not choose among those three using outcomes or use already exposed tasks. The matching [C/Go/JavaScript screen](G01-R7-CGOJS-LABEL-PREFLIGHT.md) now finds 41/131 mechanically clean tasks across six more repositories, bringing the current screened pool to 44 across eight. Selection, exact runner/index preflight, and a new freeze remain outstanding. Keep selector/arms blind to gold paths and content.

## Open Questions

- Will a deterministic 24-task source-only selection from the screened pool pass the full runner-cache/index preflight?
- Does a 3-Rust allocation leave enough cross-repository diversity for a useful four-language claim, and what fixed stratification should be frozen before model dispatch?
- Do other ContextBench source families require a distinct, separately named validation study instead of silently broadening this cohort?
