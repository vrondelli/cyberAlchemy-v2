# G01 r67 direct-tree label admission

Status: separate label-definition candidate, frozen after r66 admission failure
but before any r67 source ranking, GLM call, or quality scoring.

R66 is terminal at 22/26 under its exact web-diff/direct-tree equality gate.
Four mismatches are retained; GitHub's web diff listed additional Python
paths not changed between the exact failed and passing blob trees. R67 does
not repair r66. It instead uses the same immutable r66 exact-commit archives
and makes direct tree comparison the sole gold-source rule, as in earlier
G01 direct-tree audits. The r66 evaluator receipt SHA-256 is
`ec41ccd36f719d642e5e57c8d762d4281d32e1ab525a087492ab1ea786082bac`.

For all 26 source-order cases, independently re-read the failed and passing
archive bytes, verify their recorded SHA-256 and exact commit roots, and
recompute Git blob OIDs for regular `.py` files. Candidate admission requires
1–3 old-side non-test Python files with changed blob OIDs, zero newly added
non-test Python files, and the r66 source size limits. Ignore web-diff path
disagreement for admission but preserve it in the evaluator receipt. No
quality metric, prediction, or provider response can influence selection.

If at least 24 are admitted, select the first 24 in original source order.
The source-side manifest contains IDs, repository, failed commit, and exact
failed-archive digest only; evaluator-only files contain target paths and
passing-archive evidence. An exact matched quality protocol and comparator
gate must be frozen separately before GLM calls. This label audit alone
supports no superiority claim.

## Open questions

- Will all 24 selected cases pass authenticated failure-log admission and
  bounded source projection?
- Can the unchanged r61 retrieval rule transfer without outcome-guided
  changes, and is its gain large enough on a fresh repository population?
