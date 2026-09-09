# Integration and versioning contract

## Generic agentic runtime adapter

Any runtime integrates through an owner-supplied projection function and frozen
catalog provider:

```text
runtime input
  -> runtime-owned projection
  -> RoutableIntentEnvelope@1
  -> IntentRouteRuntimePort@1
  -> RouteDisposition@1
  -> runtime-owned decision / approval / execution
```

The package imports no runtime SDK. Its add-on manifest declares protocol
versions, package entry points, conformance fixtures, and zero required
permissions. Installation does not grant route authority.

## Selected-local compatibility mapper

The existing private `intent-record.selected-local@1` model is supported by an
explicit mapper and owner-versioned mapping profile. It is not the universal
core input.

## Augmentor adapter

Augmentor supplies raw text, visible projection posture, and user corrections.
It displays the complete disposition or a faithful bounded projection. It does
not silently convert ambiguity to a candidate or a candidate to approval.

## ResonantOS host adapter

The host freezes the catalog input, calls the pure resolver, persists any
host-owned `RouteDecision`, and routes approval/execution to retained owners.
The host adapter is not part of the L0 package.

## Compatibility rules

- Unknown major request, catalog, predicate, or disposition versions fail
  `invalid`.
- Additive optional fields require canonical defaults owned by the new version;
  consumers do not invent them.
- A changed catalog produces a new digest and requires a fresh disposition.
- `RoutableIntentEnvelope@1` is the generic core input.
- `IntentRecord selected-local@1` is accepted only by its explicit mapper and is
  never silently upgraded.
- Semantic evaluator outcomes and Continuation Router receipts are not accepted
  as resolver inputs.

Open questions are owned in [../OPEN-QUESTIONS.md](../OPEN-QUESTIONS.md).
