# Context Pack — SWU-SFOL-005

Selected `SWU-SFOL-005` after the passing SWU-004 owner receipt. Scope is only
`src/sfol/evaluator/`, its adopter-neutral semantic corpus, and this evidence.

The evaluator consumes an already typed module plus a finite value environment.
It must interpret all bounded DS-SFOL v1 pure term formations with exact
integer/rational arithmetic and return a typed `indeterminate` value for every
partial, absent, invalid, or over-budget condition. It may inspect language
contracts but may not import or invoke implementation targets, runners,
bindings, harnesses, consumer adapters, or adopter code.

Bindings, observations, case derivation, effects, canonical-node projection,
adopters, BTE semantic claims, authority, release, and production remain
excluded.
