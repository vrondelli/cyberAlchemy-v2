# N35 Design Context

## Bounded Frontier

The exact sequencing input selects canonical `emits` and its independently governed
`ordering` facet only. N34 A says occurrence semantics is the authored canonical
`Entity --[emits]--> Event` concept fact; it supplies no ordering choice. Canonical
emits defines the Entity as subject/source of an Event concept and names no sequence
field, position identity, predecessor relation, or comparison contract.

The packet schema admits `ordered`, `unordered`, and `not-applicable` syntactically.
Those enum values are not relation-local semantic authority. The only concrete
`unordered` packet precedent is `creates`, whose rationale is its D27 set-relation
definition. For emits, `unordered` has no distinct validator or generator consequence
from `not-applicable` because no collection, projection, or order-bearing occurrence
substrate is defined. Treating them as two action shapes would manufacture a binary
policy. `ordered` is likewise inadmissible without an authored order identity.

One source-backed action remains: make ordering not applicable to the authored emits
concept fact. Defer and stop are legitimate typed routes, so the canonical prefilter
must form a three-option gate rather than direct the action.

## Question

How should the `ordering` facet of canonical authored
`Entity --[emits]--> Event` facts be resolved?

- **A — ordering not applicable (recommended):** an authored emits fact has no
  semantic order domain; source, array, runtime, timestamp, delivery, retry, replay,
  and payload observations cannot establish order.
- **B — defer:** keep the facet unresolved and preserve the blocker.
- **C — stop:** terminate this continuation without changing the facet.
- **Explain / more context:** non-committal; expands this same gate and has decision
  effect none.

## Trade-offs

A closes the facet with the smallest source-backed meaning and prevents incidental
order from becoming authority. A future ordered emission model would need a separate
authored identity and contract. B avoids closing the facet but leaves constraint
completion blocked. C ends this route and produces no ordering resolution.

`Unordered` is not presented because it would be a label without a distinct current
validator or generator consequence; the D27 `creates` set precedent cannot be
generalized to emits. `Ordered` is not presented because no order-bearing authored
substrate exists.

## Dispatch Technique Trace

| Technique | Activation | Artifact or gate | Validation |
|---|---|---|---|
| `sequence` | exact relation+facet input | immutable N35 sequencing receipt | receipt binds N34 v40 closeout |
| `owner_boundary_check` | A closes a semantic facet | A remains authority-gated | selection remains null |
| `residue_ledger` | runtime and adjacent axes stay separate | exclusions and rejected candidates | no bundled axis |
| `artifact_contract_bridge` | closed eight-source manifest | denominator and selection | two byte-identical passes |
| `concrete_path_evidence` | canonical emits, D01/D08, packet, schema, validator | six views and examples | no enum-as-authority |
| `validation_loop` | deterministic artifacts must replay | phase-aware validator | A/defer/stop and no-unordered regressions |
| `frame_handoff` | Design stops before choice | strict runtime handoff | `authority_effect: none` |

A full dispatch document is not required: this is one local bounded continuation with
no delegation, cross-capability execution, or protected-context transport.

## Scope Ceiling

N35 may present A, defer, and stop. It cannot select ordered or unordered semantics,
source or array order, runtime emission or delivery order, retries, replays,
timestamps, payload ordering, Event-Sourcing semantics, produces coupling, numeric
or runtime cardinality, representation, storage, packet/canonical mutation,
implementation, promotion, publication, or deployment.
