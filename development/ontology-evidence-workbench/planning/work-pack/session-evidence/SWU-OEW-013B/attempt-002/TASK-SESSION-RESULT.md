# Task Session Result — SWU-OEW-013B Attempt 002

Result: **BLOCK**

The repaired lock now passes selection, ownership, target, package-root,
protected-set, and all 61 input-binding checks. The strict context pack covers
12/12 obligations, and the closeout inventory was frozen before execution.

The staged final-build contract passes syntax and six fail-closed unit tests.
Its first exact frozen run completed dependency installation, copied the
verified 007 + 008F feature bytes, and applied the entrypoint patch exactly
once. Dashboard Vitest then stopped: 10 suites and 76 tests passed, but five
upstream suites could not resolve `@understand-anything/core/search`.

The pinned root package declares
`prepare: pnpm --filter @understand-anything/core build`; the immutable lock
correctly uses `--ignore-scripts` but does not declare the equivalent explicit
core build step. Running that command implicitly would expand the closed lock
execution contract, so Task Session did not do it.

No mutation-admission receipt was issued, no live implementation target was
written, no retained dashboard archive was created, and the one package root
is unchanged. The digest-named workroot and store are absent. The 12,991-entry
protected set is exactly equal before and after.

The required repair owner is Invoke Refresh: bind one exact core build command
between install and dashboard Vitest, including the pinned core package
path/digest/script, order, expected exit, cleanup, and claim ceiling. `014`
remains unselected and ineligible.
