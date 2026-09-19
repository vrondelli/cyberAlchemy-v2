# N36 Design Context

## Bounded Frontier

The owner selected concept-degree tuple
`{source_min: 0, source_max: unbounded, target_min: 0, target_max: 1}` for
canonical `Entity --[emits]--> Event`. N33 rejects exact duplicate authorship and
N34 fixes the counted unit at the authored canonical concept fact.

D02 says observed maximum violations remain enforceable whenever their evidence is
present. Therefore, two distinct visible Entity subjects for one Event concept are
invalid whether the view is open or closed. But a view showing zero or one subject
can omit another incoming emits fact, so it cannot establish whole-boundary
conformance without relevant closure.

N36 asks only what verdict an open view receives when no violation is visible. It
does not choose the exact incoming-closure proof shape, closure serialization,
packet enum, runtime behavior, or implementation.

## Question

When an incomplete view contains no visible `emits.target_max = 1` violation, what
verdict should it report?

- **A — not evaluated without relevant incoming closure (recommended):** report
  `not-evaluated-incomplete-closure` until the later exact closure proof is present.
- **B — pass the observed subgraph only:** report a local pass that explicitly does
  not claim whole-boundary conformance; a later closed evaluation may still fail.
- **C — defer:** keep the partial-view verdict unresolved.
- **D — stop:** terminate this continuation without changing the facet.
- **Explain / more context:** non-committal; expands the same gate with decision
  effect none.

## Trade-offs

A is fail-closed and least likely to be mistaken for a global responsibility proof,
but it withholds a pass from useful fragments. B gives earlier local feedback while
preserving a non-global ceiling, but consumers must keep local pass distinct from
whole-boundary conformance. C and D preserve current authority.

The current packet `partial_view` enum cannot represent either action exactly. N36
is therefore Design-only; later projection needs a separately governed schema and
validator decision.

## Dispatch Technique Trace

| Technique | Activation | Artifact or gate | Validation |
|---|---|---|---|
| `sequence` | numeric A is closed | N36 consumes the immutable selection receipt | no copied consent |
| `owner_boundary_check` | A/B change verdict semantics | both remain authority-gated | selection stays null |
| `residue_ledger` | closure shape and projection remain open | exclusions and rejected candidates | no bundled facet |
| `concrete_path_evidence` | exact D02, emits, packet, schema, and precedents | six views and ladder | no enum-as-authority |
| `validation_loop` | deterministic artifacts must replay | extractor, selector, prefilter, hostile probes | fail closed on drift |

A full dispatch document is not required: this is one local continuation with no
delegation, external effect, or protected-context transport.

## Scope Ceiling

N36 may select only the open-view verdict for the selected concept-level target
maximum. It cannot select the closure proof shape, closure storage, positive minima,
runtime cardinality, Event-Sourcing behavior, `produces`, representation, packet or
canonical mutation, implementation, promotion, publication, release, or deployment.
