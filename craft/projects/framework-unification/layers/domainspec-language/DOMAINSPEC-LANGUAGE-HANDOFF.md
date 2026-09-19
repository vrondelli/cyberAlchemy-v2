# DomainSpec Language Handoff

## Handoff Goal

Design a generic DomainSpec language for writing contracts, schemas, and
iteration records in a formal, validateable way.

The language must not be Craft-specific. Craft is one use case that provides
good evidence for interface contracts, ledger schemas, recursive project state,
blockers, definitions, gaps, open decisions, and cross-capability interaction.
The same language should also work for dispatch routes, invoke handoffs,
refinement seeds, work packs, sigil/spell contracts, and future DomainSpec
systems.

## Problem To Solve

DomainSpec and Arcanum already use many structured artifacts: contracts,
schemas, route definitions, handoffs, ledgers, work packs, validation notes, and
refinement outputs. They are close to a language, but the boundary is not yet
formal.

The missing layer is a small, coherent language model that can say:

- this is the semantic contract
- this is the structural schema
- this is the iteration/change record
- these examples are fixtures
- these validations are authoritative
- these blockers, gaps, definitions, and decisions are open
- this artifact is draft, refined, gated, implemented, validated, promoted, or
  blocked

## Contract Vs Schema

A contract defines the agreement. It is about meaning and obligations:

- purpose
- authority
- ownership
- invariants
- allowed behavior
- lifecycle state
- methods or operations
- blockers and gates
- evidence requirements
- downstream obligations

A schema defines the structure. It is about representation and validation:

- fields
- types
- required keys
- enums
- nesting
- references
- constraints
- examples
- machine-checkable shape

A contract can require one or more schemas. A schema can implement part of a
contract. Neither should replace the other.

## Iteration Layer

The language also needs an iteration record because contracts and schemas evolve.

An iteration record should capture:

- changed artifact
- reason for change
- previous state
- next state
- changed obligations
- changed fields or constraints
- examples added or changed
- validations run
- decisions opened or closed
- blockers created or resolved
- promotion status

This lets the language support refinement and implementation loops without
losing traceability.

## Required Use Cases

The first design should support these use cases:

- Craft project interface contracts and ledgers
- Craft recursive operation, where Craft can describe and operate Craft work
- dispatch-spec route and gate contracts
- invoke define, design, plan, handoff, and refresh artifacts
- task-session work-pack execution boundaries
- refine outputs that start vague and become executable
- decision-gate blockers and chosen options
- generic DomainSpec feature/spec contracts

## Expected First Deliverables

Create a refined design package for the language with:

- language purpose and boundary
- document kinds
- top-level field model
- contract-to-schema relationship
- iteration model
- example and fixture model
- validation strategy
- lifecycle states
- open decisions
- blockers and risks
- first implementation plan

Do not implement a parser before this design exists.

## Non-Goals

- Do not make Craft the canonical scope.
- Do not mutate Craft artifacts as part of this first language handoff.
- Do not choose YAML-only, DSL-only, or dual-surface syntax without a recorded
  decision.
- Do not collapse semantic contracts into structural schemas.
- Do not treat prose documentation as enough for validation.
- Do not require every future DomainSpec system to use Craft terminology.

## Suggested Route

1. Run invoke define on this handoff.
2. Refine the language design from the invoke output.
3. Use decision-gate for syntax and artifact-kind choices.
4. Produce a first work pack for implementation.
5. Build the smallest validateable language surface.
6. Run the first live test using Craft as one fixture, then add at least one
   non-Craft fixture such as dispatch-spec or invoke handoff.

## Source Context

Use `CONTEXT-PACK.md` and `context-index.json` in this folder as the bounded
context pack for the next agent or task-session.

Primary evidence comes from:

- Arcanum dispatch schema
- Arcanum invoke handoff pattern
- Craft interface contract and ledger schema
- Craft interaction contract and ledger schema
- Craft examples and validation notes

## Completion Criteria For The Next Pass

The next pass is complete when it produces a language design that:

- clearly separates contract, schema, and iteration
- supports Craft without being Craft-specific
- identifies a first syntax strategy
- names validation authority
- names lifecycle states
- lists blockers and open decisions
- can be turned into one implementation work pack
