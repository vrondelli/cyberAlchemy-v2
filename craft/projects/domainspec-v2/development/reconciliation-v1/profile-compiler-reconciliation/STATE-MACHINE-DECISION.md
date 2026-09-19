# State Machine trigger/output compatibility decision

Date: 2026-09-09. Task: PCR-06 / DSR-016. Decision: DEC-08 (State Machine portion).
Status: selected by the user's explicit `yes` on 2026-09-09. Product-construction lane.
Authority effect: none. This selects construction, not product approval or admission.

## Observed conflict at discovery

- `../DECISIONS.md#dec-08` explicitly gates finalizing versioned transition and
  step schemas. Its recommendation was unselected at discovery; the State
  Machine portion is now selected below.
- `definitions/relationships/relationships.yml`, signature `transitions`, says
  an Event is the transition input symbol: Event -> State Machine. Current
  source SHA-256: `82c55ea1ad031d3135c5b8a85162e44b4e85f296b54057fda0dc38131ab376a1`.
- `impl/cli/src/input/project-model.ts`, `requireStateTransitionArray`, accepts
  transition_id, source_state, target_state, guard_ref and effect_event_ref.
  There is no trigger Event binding.
- The same file's `validateSelectedNodeRelationships` State Machine branch
  matches incoming canonical `transitions` edges against effect_event_ref.
  Thus the current source validator conflates a trigger relationship with an
  output intent. The compiled-graph validator inherits that behavior.
- DSR-016 requires separate trigger, guard and output bindings; V24 must
  demonstrate that trigger Event A cannot silently become output Event B.

## Decision required

How should the corrected source contract coexist with current State Machine files?

### Recommended: versioned corrected source and explicit legacy migration

Construct a new opt-in State Machine contract with distinct trigger Event,
declared Rule arguments, source/target states and output intents. Canonical
`transitions` edges must match triggers, not outputs. Output intents remain
composition bindings, not a newly invented canonical edge. Compile a pure
checked reducer; no Event publication or storage occurs in the reducer.

Keep existing files under explicitly legacy behavior. Moving them to the new
contract requires an authored trigger binding; missing information produces a
migration diagnostic, never an inferred trigger. Do not silently reinterpret
effect_event_ref or switch existing CLI defaults.

Benefit: new source and generated semantics agree with the canonical graph;
current files retain their version-bound behavior. Cost: explicit migration
and two compatibility paths until legacy support is separately retired.
Choose this for a corrected public compiler contract.

### Alternative: adapter-only prototype for now

Leave the source parser unchanged and accept separate compiler-side trigger
bindings for a bounded experimental reducer. Preserve the old graph's output
interpretation as legacy provenance, never claim its edge proves the trigger.

Benefit: a smaller local experiment and no source-schema migration yet.
Cost: graph semantics remain unreconciled, callers must maintain an extra
binding artifact, and public CLI source integration still requires a successor.
Choose this only to defer the corrected public source contract.

## Gate and continuation

Selected option: versioned corrected source and explicit legacy migration.
Source of selection: the user answered `yes` to implementing the corrected
versioned State Machine contract, separating trigger/output Events and requiring
explicit migration of legacy files. No implementation crossed the gate before
that answer. The State Machine gate is resolved for this construction scope.
Workflow's occurrence schema also consumes DEC-08 but is not decided here.

Constructed version: `domainspec.typed-state-machine/v1`, defined by
[state-machine-contract.json](state-machine-contract.json), SHA-256
`024cddb7ebf6c61e569053ef48a059b675fe89cbe484bebe93c40fd4b9ef63a8`.
The input Event remains a symbol; facts for Rule arguments are explicit inputs.
One source-state/trigger pair selects at most one transition. Output slots name
ordered unexecuted Event intents, not constructed payloads or published events.

Operational support: no present environment blocker. Publication, admission,
default cutover and deployment remain separate owner-controlled residue and
are not prerequisites for choosing or testing this construction candidate.

After selection: author exact versioned prototype definitions and ontology,
implement validation and generation, then run migration, trigger/output
non-collapse, guard ordering, rejection/no-effect, native compilation,
independent observation and compiling-mutation tests. Full PCR-06..14 remains
active; a TypeScript reducer alone cannot close the CLI goal.

## Task-session evidence

Context mode: standard, bounded to the completion ledger, DSR-016/DEC-08/V24,
the current transition decoder/relationship checks, canonical transitions
signature, configured Rule/Policy/Operation composition patterns and selected
TypeScript State Machine profile. No runtime handoff or subagent was used.
The decision-gate skill paused consequential implementation at the explicit
schema gate on the original discovery turn. That turn changed no code and ran
no executable tests. Successor implementation and current test evidence are in
[STATE-MACHINE-GENERATION.md](STATE-MACHINE-GENERATION.md).

ARE request: `ds-cli-continuation-20260909-044`; route CA2-ROUTE-IMPLEMENT.
Route receipt: `3d2a723719c93db6b6624dc0276127d8bbb9d1b7e9f9081f78ed4daaff733a95`.
Context result: `2340764b088f29a8b1755f2852742beec27d5ccd854635ac5a8f47cad1547112`.
Exact effect: this decision note only; effect digest
`96058957d5b0bef5865b2120e2cfa84a5364afd781e15e66ca895c689c91c06b`.
The adapter reported structurally admissible with no additional owner gate
references. That assessment does not select DEC-08 or authorize code changes
across the unresolved semantic boundary.
