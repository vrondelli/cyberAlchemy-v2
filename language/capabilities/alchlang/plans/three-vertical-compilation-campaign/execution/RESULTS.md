# AlchLang Three-Vertical Results

Status: historical source-local campaign complete and exact-byte independent
user validation accepted; current integrated replay PASS.

The campaign produced three executable TypeScript reference verticals through
the existing DomainSpec v2 compiler. The immutable historical aggregate receipt
is [campaign-validation.json](evidence/campaign-validation.json). The current
integrated replay is [current-integration-replay.json](evidence/current-integration-replay.json).
The immutable approval is recorded in
[INDEPENDENT-VALIDATION-DECISION.v1.json](INDEPENDENT-VALIDATION-DECISION.v1.json).

## Result summary

| Vertical | DomainSpec nodes | Relations | Source files | Runtime tests | Result |
| --- | ---: | ---: | ---: | ---: | --- |
| Customer credit release | 8 | 9 | 19 | 8/8 | source-local PASS |
| Inventory reservation | 11 | 15 | 28 | 9/9 | source-local PASS |
| Production rollback | 11 | 16 | 29 | 9/9 | source-local PASS |

Across the campaign: 30 compiled nodes, 40 typed relations, 76 bound DomainSpec
source files, 27 planned generated artifacts, and 26/26 runtime tests passed.
Nine hostile source mutations were rejected.

## Exact generated bundles

- [Customer credit release](build/customer-credit-release/generated/)
  — [accepted binding](evidence/accepted/customer-credit-release.construction-binding.candidate.json),
  [accepted conformance](evidence/accepted/customer-credit-release.source-local-conformance.json).
- [Inventory reservation](build/inventory-reservation/generated/)
  — [accepted binding](evidence/accepted/inventory-reservation.construction-binding.candidate.json),
  [accepted conformance](evidence/accepted/inventory-reservation.source-local-conformance.json).
- [Production rollback](build/production-rollback/generated/)
  — [accepted binding](evidence/accepted/production-rollback.construction-binding.candidate.json),
  [accepted conformance](evidence/accepted/production-rollback.source-local-conformance.json).

Every bundle contains:

```text
domain.types.ts
domain.schema.ts
domain.machine.ts
domain.events.ts
domain.tools.ts
domain.test.ts
domain.graph.json
system-ontology.json
traceability.json
```

## Validation performed

At the time of acceptance, the historical final replay used the
DomainSpec-declared Node `26.8.1` runtime with this command (which now targets
the successor current replay):

```bash
PATH=/home/vrondelli/.nvm/versions/node/v26.8.1/bin:$PATH npm test
```

It passed:

- exact authorization and six predecessor digest checks;
- DomainSpec source decoding and graph compilation for all three verticals;
- two clean byte-identical generations per vertical, recorded in
  [determinism.json](evidence/determinism.json);
- strict TypeScript typechecking;
- 26 generated runtime tests;
- nine dangling-edge, unresolved-question, and missing-authority hostile cases;
- graph-to-system-ontology and artifact traceability closure;
- the then-existing AlchLang package validator and its three negative mutations.

The current package-level validator also passes its expanded set of six negative
mutations. The successor replay preserves the same 26 generated runtime tests
and nine campaign hostile mutations.

The `tsx` dependency emits a Node deprecation warning for `module.register()`;
it does not change any test result or generated digest.

## Safety boundary

All adapters are injected and in-memory. The rollback adapter exposes a fixed
`null` endpoint and the generated tool contains no HTTP, socket, process, or
credential surface. No real external effect was attempted.

## Independent validation decision

On 2026-09-01, the user accepted all three exact candidate bindings as governed
AlchLang reference examples. The decision binds the reviewed pre-acceptance
receipt and each ConstructionBinding digest. Validator replay fails closed if
any approved binding bytes drift.

## Remaining boundary

The DomainSpec profile/compiler remain private candidates with release admission
not granted. The accepted artifacts are now indexed by the AlchLang capability
material set as references, while its canonical construction stages remain
absent/not evaluable.

The three ConstructionBinding records remain candidates accepted for reference
integration. Acceptance closes this campaign's independent-review gate but does
not grant canonical admission, publication, release, deployment, production,
product-value proof, or external-effect authority.

## Post-integration currentness

Integrating these examples into the governed AlchLang material set revised the
AlchLang `product-capability.json`. That file is one of this campaign's frozen
predecessors. Consequently, the original authorization remains superseded and
its historical-currentness diagnostic demonstrates the expected failure:

```text
ALCHLANG_VALIDATE:predecessor-drift:cyberAlchemy-v2/language/capabilities/alchlang/product-capability.json
```

This does not revoke or rewrite the exact historical acceptance. The bounded
[CURRENT-INTEGRATION-REPLAY.v1.json](CURRENT-INTEGRATION-REPLAY.v1.json) binds
the revised package bytes for local replay without extending acceptance. Under
Node `26.8.1`, `npm test` now requires both the current replay to pass and the
historical diagnostic to observe exactly that one superseded predecessor.
