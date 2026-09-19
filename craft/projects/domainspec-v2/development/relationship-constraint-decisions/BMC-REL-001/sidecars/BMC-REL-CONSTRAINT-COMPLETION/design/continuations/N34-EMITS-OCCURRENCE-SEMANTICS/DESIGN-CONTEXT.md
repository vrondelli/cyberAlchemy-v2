# N34 Design Context

## Bounded Frontier

The exact sequencing input selects canonical `emits` and its independently governed
`occurrence_semantics` facet only. N33 A already rejects exact duplicate authorship;
it supplies no occurrence choice. Canonical `Entity --[emits]--> Event` records a
concept-level subject/source relationship. D08 preserves that provenance, says it is
broader than Event Sourcing, and withholds runtime Event occurrences and causal
chains. The packet asks for concept-level emits semantics while leaving the
occurrence field unresolved.

The generic packet schema admits several tokens syntactically. That vocabulary is
not relation-local authority. The validator binds the declared-step token only to
`orchestrates` and the declared-role token only to `maps`; the exact emits evidence
defines no declaration occurrence object or identifier. Runtime-only, combined
concept/runtime bounds, invented declaration axes, and token reuse are therefore
structurally inadmissible. The legitimate typed defer and stop routes remain
admissible, so the canonical prefilter forms a three-option gate.

## Question

How should the `occurrence_semantics` facet of canonical authored
`Entity --[emits]--> Event` facts be resolved?

- **A — retain concept-level authored emits semantics (recommended):** the occurrence
  axis applies to the authored Entity-to-Event concept fact; runtime Event instances,
  deliveries, retries, replays, and payloads remain outside it.
- **B — defer:** keep the facet unresolved and preserve the blocker.
- **C — stop:** terminate this continuation without changing the facet.
- **Explain / more context:** non-committal; expands the same gate and has decision
  effect none.

## Trade-offs

A has the smallest semantic footprint and follows the exact canonical and D08
boundary, but any future runtime-occurrence model must be designed independently.
B avoids a premature semantic close but leaves constraint completion blocked. C
avoids further work on this route but produces no occurrence-semantics resolution.

## Dispatch Technique Trace

| Technique | Activation | Artifact or gate | Validation |
|---|---|---|---|
| `sequence` | exact relation+facet input | immutable N34 sequencing receipt | receipt binds prior N33 closeout |
| `owner_boundary_check` | A changes semantic admission | A remains authority-gated | selection remains null |
| `residue_ledger` | runtime, declared, numeric, and representation axes stay separate | exclusions and rejected candidates | no bundled axis |
| `artifact_contract_bridge` | closed eight-source manifest | denominator and selection | two byte-identical passes |
| `concrete_path_evidence` | canonical emits card, D08, packet row, schema, validator | six views and examples | no Event-Sourcing/runtime collapse |
| `validation_loop` | request and prefilter must replay | phase-aware validator | A/defer/stop cardinality regression check |
| `frame_handoff` | Design stops before choice | strict runtime handoff | `authority_effect: none` |

A full dispatch document is not required: this is one local bounded continuation with
no delegation, cross-capability execution, or protected-context transport.

## Scope Ceiling

N34 may present A, defer, and stop. It cannot select runtime occurrence identity,
separate bounds, declared emission occurrences, Event-Sourcing semantics, payload
identity, produces coupling, numeric/runtime cardinality, representation, storage,
packet/canonical mutation, implementation, promotion, or publication.
