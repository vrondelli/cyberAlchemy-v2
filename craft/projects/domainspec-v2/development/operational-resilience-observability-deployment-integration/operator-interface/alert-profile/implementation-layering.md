# ORODI Alert Profile implementation layering

## Layer 0 — deterministic reusable unit

Decision question: after this layer, we know whether one tool-neutral ORODI
profile can validate and render the existing Body War Grafana alerts exactly.

- Minimum working unit: JSON profile, validator, Grafana renderer, byte-equal
  generated artifact, and focused hostile tests.
- Deferred: live startup, cross-platform renderers, notification delivery.
- Exit evidence: valid instance renders deterministically; invalid state,
  unbounded label, synthesized-health query, action token, and notification
  destination mutations fail closed.

## Layer 1 — D65 traceability

Decision question: after this layer, we know whether the reusable unit has a
closed chain from selected definitions and adopted capabilities through a
business ontology and deterministic DomainSpec system projection.

- Minimum working unit: capability projection, durable business ontology,
  DomainSpec source, generated graph/system ontology, and exact binding.
- Non-regression: Layer 0 bytes and hostile-test outcomes remain unchanged.
- Exit evidence: selector-level source currency, closed ontology relations,
  deterministic two-run DomainSpec build, and exact binding validation.

## Layer 2 — local commissioning

Decision question: after this layer, we know whether the generated-equivalent
rules work in the bounded loopback Body War lab and are ready for human visual
inspection.

- Minimum working unit: existing local stack plus profile/render validation,
  observed firing and recovery, terminal inactive rules, and zero notification
  delivery attempts.
- Deferred: persistence, production traffic, external destinations, release.
- Exit evidence: machine commissioning evidence and a live local Grafana URL.

## Layer 3 — additional platforms and delivery

Decision question: after this layer, we know whether semantic equivalence holds
across a second renderer and whether separately authorized notification
delivery is safe.

- Deferred from the current construction: Prometheus-native renderer,
  destination credentials, paging policy, retries, rate limits, and production
  deployment.
- Promotion requires independent Product Capability and authority decisions.
