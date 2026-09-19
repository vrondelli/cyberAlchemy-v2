# DomainSpec Language Context Pack

Generated for a generic DomainSpec language project. This pack selects current
Arcanum evidence for contracts, schemas, ledgers, handoffs, route validation,
and iterative refinement. Craft appears here as one concrete use case, not as
the owner of the language.

## Goal

Create a formal language for writing contracts, schemas, and iteration records
that can be validated, refined, composed, and reused across DomainSpec and
Arcanum projects.

The language should let an agent or tool answer:

- What agreement is being made?
- What structure represents that agreement?
- What validations prove it is well-formed?
- What lifecycle or iteration state is open?
- What changed between versions?
- Which use cases depend on this contract?

## Selected Evidence

### Generic Route And Validation Evidence

`/home/vrondelli/projects/domainspec-core-language-research/arcanum/formulae/dispatch-spec/dispatch.schema.yml`

Shows how Arcanum already expresses a structured, validator-facing contract for
routes: required fields, route steps, subagent strategy, evidence contracts,
boundary contracts, and gate behavior.

Use it as evidence for:

- schema-backed contract surfaces
- route composition fields
- required-vs-optional validation boundaries
- how validators become the authority for accepted shape

`/home/vrondelli/projects/domainspec-core-language-research/arcanum/spells/invoke/handoff.md`

Shows the handoff pattern used to transfer implementation intent while keeping
scope, stage, evidence, and completion expectations explicit.

Use it as evidence for:

- handoff as a first-class contract form
- stage and receipt metadata
- downstream execution readiness
- non-executed planning artifacts

### Craft Use Case Evidence

`/home/vrondelli/projects/domainspec-core-language-research/arcanum/development/craft/CRAFT-INTERFACE.md`

Defines the Craft interface concept: starting a Craft project, operating a
ledger, surfacing state, description, blockers, enables, next actions, open
decisions, gaps, and definitions.

Use it as one example of a contract language target:

- a project interface contract
- recursive Craft-of-Craft behavior
- operation-level methods
- ledger-backed state

`/home/vrondelli/projects/domainspec-core-language-research/arcanum/development/craft/CRAFT-INTERFACE-LEDGER-SCHEMA.yml`

Shows the structural schema for Craft interface ledger entries.

Use it as evidence for:

- method/event records
- state snapshots
- blockers and gaps
- validation status
- recursive references

`/home/vrondelli/projects/domainspec-core-language-research/arcanum/development/craft/CRAFT-INTERACTION-CONTRACT.md`

Defines how Craft should interact with external sigils and spells such as
refine, decision-gate, invoke, task-session, and dispatch-spec.

Use it as one example of:

- cross-capability contract
- route compatibility
- authority boundaries
- lifecycle coordination

`/home/vrondelli/projects/domainspec-core-language-research/arcanum/development/craft/CRAFT-INTERACTION-LEDGER-SCHEMA.yml`

Shows the structural schema for cross-sigil interaction ledger entries.

Use it as evidence for:

- external capability calls
- trigger and output records
- open decisions
- unresolved gaps

`/home/vrondelli/projects/domainspec-core-language-research/arcanum/development/craft/CRAFT-INTERFACE-EXAMPLE.yml`

Example instance of the Craft interface ledger schema.

Use it to derive example-driven validation needs.

`/home/vrondelli/projects/domainspec-core-language-research/arcanum/development/craft/CRAFT-INTERACTION-EXAMPLE.yml`

Example instance of Craft interaction with other capabilities.

Use it to derive example-driven cross-contract validation needs.

`/home/vrondelli/projects/domainspec-core-language-research/arcanum/development/craft/CRAFT-INTERFACE-VALIDATION.md`

Documents validation expectations for the Craft interface.

Use it as evidence for:

- validation narratives alongside schemas
- readiness criteria
- failure modes

`/home/vrondelli/projects/domainspec-core-language-research/arcanum/development/craft/CRAFT-INTERACTION-VALIDATION.md`

Documents validation expectations for Craft interaction.

Use it as evidence for:

- cross-capability validation
- gate readiness
- unresolved gap surfacing

## Derived Language Requirements

The DomainSpec language should support at least four artifact families:

- `contract`: semantic obligations, authority, invariants, lifecycle, methods,
  states, gates, and expected evidence.
- `schema`: structural fields, types, enums, references, required keys,
  validation constraints, and example bindings.
- `iteration`: versioned changes, open gaps, decisions, validation deltas,
  accepted residue, and promotion state.
- `use_case`: concrete binding from a generic contract to a project, sigil,
  route, or workflow.

The language should be able to express:

- recursive composition, where a contract can describe a system that produces
  or refines more contracts
- source authority, where a field or rule can point to its canonical owner
- validation authority, where schemas and validators decide accepted structure
- semantic obligations, where contracts say what must remain true beyond shape
- lifecycle state, including draft, refined, gated, implemented, validated,
  promoted, superseded, and blocked
- gaps and blockers as first-class records, not prose hidden in notes
- definitions as reusable terms with source and confidence
- examples as validation fixtures
- handoffs as bounded contracts for another agent, tool, or project

## Design Risks

- Collapsing contract and schema into one thing would make the language either
  too rigid for design or too vague for validation.
- Treating Craft as the canonical scope would overfit the language to one
  project interface use case.
- Choosing syntax too early could hide the deeper model question: what
  agreement is being represented?
- Prose-only definitions would not satisfy the user's goal of a formal language
  that can be validated.
- Schema-only definitions would miss behavior, lifecycle, authority, and
  iteration semantics.

## Recommended First Refinement

Run an invoke define pass on `DOMAINSPEC-LANGUAGE-HANDOFF.md`, then refine the
language model before implementing parser or validator code.

The first refinement should decide:

- minimal document kinds
- canonical top-level fields
- how contract and schema refer to each other
- whether initial syntax should be YAML-first, DSL-first, or dual-surface
- how iteration records attach to contracts and schemas
- how examples become validation fixtures
