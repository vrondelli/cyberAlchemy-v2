# Design layering seed

| Layer | Decision unlocked | Minimum coherent proof | Deferred |
| --- | --- | --- | --- |
| L0 | Can one closed contract and explicit project-root source binding be implemented without authority collapse? | foundation-contract validator, explicit resolver, closed receipt/diagnostic decoders, killed mutants | npm migration, full commands, build/release campaigns |
| L1 | Can the two supported commands run repeatably as compiled JS with deterministic results? | lint/receipt engine, atomic channel writer, one-lock build and two-root equality | security/resource/compatibility campaigns |
| L2 | Do security, limits, invalidation, and N-1 reading fail closed? | canary, no-network, script, resource, decoder, mutation campaigns | release archive and operator handoff |
| L3 | Is the exact private candidate operable and recoverable? | immutable archive, rollback/withdrawal/quarantine drills, independent green/red pilot | complete July product and release authorization |

Plan must refine these into exact tasks/SWUs and preserve earlier guarantees at
every promotion.

