# N37 Design Context

## Bounded Frontier

The owner selected the authored-concept `emits` tuple
`{source_min: 0, source_max: unbounded, target_min: 0, target_max: 1}` and then
selected N36 A: when no visible target-maximum violation exists but relevant closure
is absent, the whole-boundary verdict is `not-evaluated-incomplete-closure`.

D02 requires every validation envelope to declare boundary identity and kind,
complete eligible source and target populations, and per-relation outgoing and
incoming adjacency completeness. N37 therefore cannot call an Event-only population
plus incoming adjacency sufficient. The minimal target-maximum proof still binds the
complete eligible Entity and Event populations and their boundary placement. It may
leave outgoing `emits` adjacency declared open because the selected target predicate
counts incoming Entity subjects per eligible Event. A stronger symmetric envelope
may close both directions without changing that predicate.

N37 chooses only which of those proof shapes is sufficient for the selected
`emits.target_max = 1` whole-boundary evaluation. It does not choose serialization,
packet vocabulary, positive minima, source-side constraints, runtime behavior, or
implementation.

## Question

What exact D02 closure proof shape is sufficient to evaluate whole-boundary
conformance for the selected authored-concept `emits.target_max = 1` after N36 A?

- **A — minimal incoming-closure envelope (recommended):** bind boundary identity
  and kind, complete eligible Entity and Event populations with boundary placement,
  and complete incoming `emits` adjacency for every eligible Event. Declare outgoing
  adjacency open; it is not consumed by this target-maximum predicate.
- **B — symmetric outgoing-and-incoming closure envelope:** bind the same boundary
  and populations and additionally prove complete outgoing `emits` adjacency for
  every eligible Entity. This is stronger evidence but evaluates the same target
  predicate.
- **C — defer:** keep the closure proof shape unresolved.
- **D — stop:** terminate this continuation without changing the facet.
- **Explain / more context:** non-committal; expands this same gate with decision
  effect none.

## Trade-offs

A is the smallest D02-compliant proof for the selected target maximum. It avoids
requiring unused outgoing-edge completeness while retaining both endpoint populations
needed to define the boundary being judged. B can fit a loader that already closes
both directions uniformly, but it carries proof work that cannot change the selected
target-maximum result. C and D preserve current authority.

Neither A nor B defines how a closure manifest is encoded. The current packet remains
unresolved and is not semantic authority for this Design gate.

## Dispatch Technique Trace

| Technique | Activation | Artifact or gate | Validation |
|---|---|---|---|
| `sequence` | N36 A is closed | N37 consumes the immutable selection receipt | no copied consent |
| `owner_boundary_check` | A/B choose sufficiency of authority evidence | both actions remain authority-gated | selection stays null |
| `residue_ledger` | representation and implementation remain later | exclusions and rejected candidates | no bundled facet |
| `concrete_path_evidence` | exact D02, emits, packet, numeric, and N36 selectors | six views and ladder | no token-as-closure inference |
| `validation_loop` | deterministic artifacts must replay | denominator, selection, prefilter, hostile probes | fail closed on drift |

A full dispatch document is not required: this is one bounded helper continuation
with no delegated wave, external effect, or protected-context transport.

## Scope Ceiling

N37 may select only the sufficient closure-proof coordinates for the selected
authored-concept `emits.target_max = 1`. It cannot select closure serialization,
packet or canonical mutation, positive minima, runtime Event cardinality,
Event-Sourcing behavior, `produces`, representation, implementation, promotion,
publication, release, or deployment.
