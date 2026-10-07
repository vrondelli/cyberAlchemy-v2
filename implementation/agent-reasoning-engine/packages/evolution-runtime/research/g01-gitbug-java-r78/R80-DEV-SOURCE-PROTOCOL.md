# G01 r80 — frozen development/confirmation partition and development source

Status: prospective, private. Pin the r78b supply and r79 HEAD result. Rows
1–12 are exposed development; rows 13–36 are the intended untouched 24-case
confirmation block; rows 37–53 are source-order replacements only if an
intended confirmation row later fails prospectively fixed source or old-side
label admission. No performance-based substitutions or post-score exclusions.
The confirmation and reserve blocks must not be scored, ranked, or sent to a
model during development. Their published metadata has already been screened
for overlap and exact-commit HTTP HEAD, which does not expose gold.

For development rows 1–12, perform one exact failed-commit codeload GET per
row, with zero retries. Cap compressed bytes at 128 MiB; audit tar path/root,
100,000 members, 512 MiB declared bytes, 1 MiB per `.java` file, and 64 MiB
projected Java per repository using the pinned Bears r75 source auditor.
Admit only status 200 at the original URL, a safe archive rooted at the exact
commit, and a nonempty bounded Java projection. Keep archives only for
accepted cases in private WSL evidence. Record every attempted row and
failure; do not replace development cases. No patch, fixed-side source,
label, model call, or quality score is used here.

This partition and source admission do not freeze a retrieval treatment or
confirmation claim. Develop against rows 1–12, then independently freeze
source/label admission, comparator, budget, scoring, and claim gate before
touching confirmation performance.

## Open questions

- How many of the 12 development buggy source archives pass fixed caps?
- Can failure-side test evidence be isolated and sanitized reproducibly?
- Which treatment beats a strong matched comparator on development without
introducing the r77 summary-demotion failure?
