# Define Complexity Example Ladder

## Complexity Example Ladder Result

- Status: `pass`
- Subject: orthogonal relationship-constraint authoring over canonical facts
- Mode: `explanatory`
- Invariant: a canonical relationship fact and its duplicate, occurrence, inverse, topology, per-fact qualifier, runtime-cardinality, numeric, and partial-view policies remain distinct; an example cannot resolve any of those policies.
- Complexity basis: interacting concepts, declared occurrences, type buckets, registry boundaries, partial evidence, and cross-verb non-collapse
- Evidence: DS-D8; fixed D01-D08 contracts; D29/D30 registries; canonical `produces`, `orchestrates`, `maps`, `emits`, `owns`, and `belongs-to` signatures
- Assumptions: every scenario-specific concept name and fact is labelled hypothetical

### Low

- Scenario: Hypothetical `CapturePayment` is an Operation and `PaymentCaptured` is an Event.
- Example: the simple concept edge `CapturePayment --[produces]--> PaymentCaptured` fits the canonical `Operation --[produces]--> Event` endpoint signature.
- Demonstrates: one canonical concept edge can be discussed without deriving a numeric maximum, duplicate rule, runtime event count, or representation choice from `one_to_many`.
- Limits: it does not prove that the fact exists in an application, that the Event occurs at runtime, or that any unresolved packet facet has a valid value.

### Medium

- Added complexity: declared occurrences, endpoint-type buckets, and repeated references to one concept.
- Scenario: Hypothetical `SettlementWorkflow` has two differently identified Operation-bound step declarations that both reference `ValidateSettlement`. Separately, hypothetical `SettlementMap` is canonically adjacent to one Entity and one Interface and has three distinct role-assignment occurrences, two of which reference the same Entity.
- Example: D04 keeps Workflow-to-Operation concept degree separate from the two declared steps; D05 keeps Mapping endpoint concept degree, bucketed by D03 endpoint type, separate from the three declared roles. Neither repeated declaration duplicates the canonical concept fact by itself.
- Demonstrates: a workflow/mapping occurrence distinction requires more than counting adjacent concepts, and design-time occurrence is not runtime multiplicity.
- Limits: it does not choose ordered-occurrence serialization, duplicate policy, role labels, role storage, role coverage, numeric bounds, or runtime-cardinality semantics.

### Complex

- Added complexity: several canonical verbs, distinct registries, a partial view, and a cross-verb inference hazard.
- Scenario: In one hypothetical graph, `Library --[owns]--> Copy`, `Copy --[belongs-to]--> Branch`, `Checkout --[produces]--> CopyCheckedOut`, and `Copy --[emits]--> CopyCheckedOut`. The scenario says only that a future author intends one admitted ownership dimension and one admitted membership kind; it does not encode where either qualifier lives. A partial consumer view sees the Event edges but not the Entity-to-Entity edges.
- Example: `owns` and `belongs-to` remain independent canonical facts governed by separate D29 and D30 vocabularies; `produces` records Operation-cause provenance while `emits` records Entity-subject/source provenance. The shared Event target does not imply equality, pairing, existence, uniqueness, or a new D08 cross-row constraint. Missing edges in the partial view do not establish validity or invalidity without the applicable closure and partial-view policy.
- Demonstrates: the invariant survives multiple actors, registries, evidence boundaries, and a failure path where a consumer might incorrectly collapse verbs or infer absence.
- Limits: it does not assign a real dimension or kind to a fact, choose per-fact representation, decide self-edge/cycle or inverse behavior, choose partial-view outcomes, set runtime or numeric cardinality, accept the packet, or prove application behavior.

### Coverage

- Rungs produced: `3/3`
- Structural increase: `pass`
- Invariant preserved: `pass`
- Required examples: simple concept edge; workflow/mapping occurrence distinction; complex `owns`/`belongs-to`/`produces`/`emits` graph — all present
- Hypothetical scenarios: `3`
- Unsupported claims: `0`
- Decision effect: `none`
- Next step: return to Invoke Define approval; do not select, record, admit, execute, or authorize a remaining policy.
