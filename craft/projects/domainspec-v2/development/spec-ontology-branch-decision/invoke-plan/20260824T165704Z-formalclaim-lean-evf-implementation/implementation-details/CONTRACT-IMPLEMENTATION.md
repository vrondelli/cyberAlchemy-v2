# Contract Implementation Detail

All schemas use JSON Schema Draft 2020-12, deny unknown authority-bearing
fields, require stable IDs/versions and raw SHA-256 digests, and separate schema
shape from semantic cross-artifact validation.

- Source envelope forbids proof terms, theorem results, provider admission,
  executable assessment, evidence, discharge, promotion, and a second
  co-canonical proposition.
- Lean profile identity binds normalized proposition bytes plus exact
  toolchain, project configuration, lock, source/import closure, namespace,
  universe, scoped/open declarations, elaboration options, type, and environment.
- Translation binding is a tagged union. Native requires identity equality.
  Translated requires a separately versioned projection with direction, loss,
  assumptions, owners, independent validator, current acceptance, and digests.
- Category admission requires objects, morphisms, typing, equality, identity,
  composition/domain/closure, associativity/identity laws, interpretation of
  claimed structure, witnesses, owner, ceiling, and environment.
- Theorem receipt is total over checked, checked-counterexample, unresolved, and
  stale; only checked outcomes may carry a proposition result.
