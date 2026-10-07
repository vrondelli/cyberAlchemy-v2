# G01 reserved confirmation r3 — exact failed-source archive admission

Status: prospective source-only rule fixed before any r3 archive GET. Input is the complete, independently audited [r2 source/log cohort](G01-BUGSWARM-GRAPH-CONFIRM-R2-ADMISSION-RESULT-2026-10-04.md), with `REPAIR-RESULT.json` SHA-256 `a55087a01c1b157ea7fcd6dfa4327037a3e4cb13c72df5e0c31b44d80513c22c` and manifest SHA-256 `1d02d5f561de98088e448a2abc6b7b2ce4df4f8cd6b1fe9e97266ed7383e945e`. The 24 final repositories, failed commits, languages, and original-slot/replacement mapping are fixed. No label, passing-commit source, model output, or score may enter archive acquisition.

## Acquisition and safety

Use private WSL archive storage, not the nearly full VPS root filesystem; GLM generation remains on the approved VPS in a later stage. For each of the exact 24 final cases in slot order, fetch once from `https://codeload.github.com/{repo}/legacy.tar.gz/{failed_commit}` with HTTPS certificate verification, no automatic retry, a 90-second network timeout, and a **100 MiB** compressed-byte cap. Preserve attempt status and any partial bytes in a uniquely named private file. A complete response must be HTTP 200, nonempty gzip, and within the cap. Freeze its SHA-256 and byte length. Do not replace a slot or silently shrink the denominator if acquisition fails.

Read each complete tarball without extracting it. Require exactly one root named `{owner}-{repo}-{first7(failed_commit)}`; reject absolute paths, `..`, backslashes, duplicate code paths, or any member outside that root. Symlinks and special files are never extracted or projected. Require at least one regular `.py`/`.java` member matching the slot language; skip individual code files larger than **1 MiB**, and require at most **64 MiB** total eligible code bytes per case. Cap total regular-member bytes at **4 GiB** and members at **250,000** per archive as a decompression-safety bound. Archive validation is an availability and path-safety check, not proof that a changed file caused the failure.

Preserve all 24 slot receipts, the raw complete archives or partial attempts, source/rule hashes, and a full hash inventory in WSL. The whole r3 gate passes only if all 24 exact failed-source archives and code-only projections are admissible under these fixed limits. Passing r3 does not rank files or open evaluator labels. Any failed slot requires a separately versioned, score-blind repair rule; r3 itself remains terminal as observed.

## Open Questions

- Do all 24 exact archives fit the fixed transport and code-projection bounds?
- Which source-only representation/selector is frozen before prediction generation on these admitted cases?
- How will exact HTTPS Git-tree labels be independently checked after all treatment and comparator predictions are sealed?
