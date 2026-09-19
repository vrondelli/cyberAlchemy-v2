# Context Pack — SWU-SFOL-006

Selected `SWU-SFOL-006` after the passing SWU-005 owner receipt. Scope is only
`src/sfol/bindings/`, its adopter-neutral negative matrix, and this evidence.

The new DS-SFOL registry is separate from the legacy first-match binding
sidecar. It must decode only exact module/clause/case/role selectors plus their
compatible digests, normalize deterministically, and resolve exactly one pure
target. Missing, multiple, stale, subset, predicate, first-match, wrong-adapter,
wrong-type, and oracle-bearing entries must fail closed.

The registry may describe a module, symbol, argument projection, observation
projection, and runtime/target digests. It may never carry expected values,
expected diagnostics, predicates, acceptance rules, or implementation-derived
truth. Case derivation, execution, observations, effects, adopters, authority,
release, and production remain excluded.
