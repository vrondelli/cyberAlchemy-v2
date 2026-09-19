# Validation Strategy

Validation is an exact replay boundary, not a live-system test.

- Contract: TypeScript compile and closed JSON Schema validation.
- Inventory: recompute all source hashes and compare exact path/hash/selector bindings.
- Golden: two supported shapes emit exact deterministic simulation observations and do not mutate inputs.
- Hostile: every non-evidence disposition and malformed/drifted input emits one stable required discriminator and no observations.
- Integration: CLI output matches library output and satisfies the result schema.
- Regression: all existing generic-contract and derived-control tests remain green.
- Hygiene: scoped whitespace, JSON parsing, regular-file, final-newline, conflict-marker, and digest inventory checks.

Any failed command blocks closeout; a later success cannot mask an earlier failure. No validation command contacts a live system or external network.
