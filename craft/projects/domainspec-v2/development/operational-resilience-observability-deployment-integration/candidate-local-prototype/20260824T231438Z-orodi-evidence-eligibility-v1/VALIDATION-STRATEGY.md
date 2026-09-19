# Validation Strategy

- Compile: strict TypeScript over all contracts, sources, and tests.
- Contract: every emitted eligibility result validates against one closed Draft 2020-12 schema with an absolute offline URN.
- Golden: two WP3 normalization results classify replay-only, produce zero runtime admissions, and derive exactly C01 passed, C05 missing, C11 not-run, C12 not-run, C14 passed, C15 missing.
- Hostile: rejected normalization, live mode, deployment effect, independent-observation claim, nonzero telemetry, workflow plane, source drift, unknown shape, legacy-family drift, duplicate observation, empty normalization set, future replay, and C05/C11 claim forgery.
- Purity: identical bytes and evaluation time emit identical JSON; inputs remain unchanged.
- Integration: CLI/library parity and existing derived evaluator invocation over the admitted set.
- Regression: all WP1-WP3 tests remain green.
- Hygiene: all owned JSON parses, exact schema replay passes offline, source pins remain current, scoped whitespace/conflict/final-newline/regular-file checks pass, and a sorted product digest is recorded.

Any failed acceptance-critical command blocks closeout. No later success masks an earlier failure.
