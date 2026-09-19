# BMC-REL-NUMERIC-EMITS-01 — `emits` concept-degree bounds

Status: blocked at post-prefilter owner selection.

Question: should canonical `Entity --[emits]--> Event` use concept-degree tuple `{source_min: 0, source_max: unbounded, target_min: 0, target_max: 1}`, defer, or stop?

Counting unit: distinct authored canonical Entity-ID to Event-ID propositions after exact-duplicate rejection. Runtime Event instances, payloads, delivery, retries, replay, ordering, and Event-Sourcing behavior are outside this decision.

The earlier exact `A` response authorized preparation of this gate. It predates the canonical prefilter receipt and is not a selection here.

## A — Optional many outgoing; optional single Entity subject

Tuple: `{source_min: 0, source_max: unbounded, target_min: 0, target_max: 1}`.

- Benefit: an Entity may emit no Event concepts or many distinct Event concepts; operation/process Events may have no Entity subject; any Event that does have an Entity subject has at most one, preserving responsibility.
- Cost/risk: generic Event concepts cannot be shared as the subject fact of several Entities; they must be made responsibility-specific or left without an `emits` subject.
- Choose when: responsibility belongs to zero or one Entity per Event concept, while Entity participation remains optional and unbounded outward.
- Downstream: permits a later owner-selected packet projection and closure-aware fixtures. It does not itself mutate the packet.

## B — Defer

- Benefit: preserves current authority and avoids premature projection.
- Cost/risk: numeric enforcement and dependent generation remain blocked.
- Choose when: the assembled owner intent needs more domain review.

## C — Stop

- Benefit: ends this route without semantic change.
- Cost/risk: `emits.numeric_bounds` remains unresolved indefinitely.
- Choose when: no further relationship-constraint work should proceed here.

Standing choice: `Explain / more context` is non-committal and does not resolve the gate.

Recommendation: A, because it exactly reflects the four owner clarifications and preserves the D08 distinction between Entity-subject `emits` and operation-cause `produces`. Recommendation is not selection.

Selection: null.

Authority effect: none. No packet, canonical, implementation, promotion, publication, release, deployment, or production effect is authorized.
