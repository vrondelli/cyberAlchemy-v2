---
module: meta-type-complete-implementation
feature_code: MTCI
status: planned
docType: specification
authority: private-development-candidate
updatedAt: 2026-08-03
---

# Specification: Meta-Type Complete Implementation

## Problem

DomainSpec has ontology formation assets and separate implementation-conformance research, but no single reusable development route proves that one new meta-type moved from an explicit semantic proposal through owner admission, closed design, three language realizations, and parity evidence. Without that route, ontology membership, generated projections, source layout, native type checks, and runtime behavior can be mistaken for one another.

## Objective

Given one complete `MetaTypeInstanceIntent`, produce a fail-closed evidence chain that can end in `complete-witnessed` only when:

- the meta-type has an owner-admitted identity, category, definition card, discriminating formation criterion, non-collapse proof, and relationship delta;
- its implementation design is closed independently of any language syntax;
- an admitted implementation profile binds every applicable obligation to evidence;
- TypeScript, Python, and Rust each provide independent positive and exact-cause negative witnesses; and
- a parity evaluator finds equivalent obligations and outcomes without requiring identical code shape.

## Input contract: MetaTypeInstanceIntent

The first Task Session must create `INSTANCE-INTENT.md` with all of these fields:

| Field | Required meaning |
| --- | --- |
| proposed term and slug | human name and stable filesystem-safe candidate key |
| motivating domain concepts | at least two real concepts that need the category |
| one-line definition | what the category means, not how one language implements it |
| category hypothesis | structural, behavioral, connective, lifecycle, UI, or an explicitly proposed new category |
| positive discriminator | the property every member must exhibit |
| nearest non-collapse rivals | at least two existing meta-types and why the candidate is not either |
| negative examples | at least two plausible concepts the criterion must reject |
| relationship pressure | candidate source/target positions and why existing signatures are insufficient or sufficient |
| behavioral obligations | observable semantics; `not-applicable` must be justified |
| implementation consumers | why TypeScript, Python, and Rust witnesses are useful |
| accountable human owner | the person or role allowed to request definitions-governance admission |

A missing field blocks ontology mutation. The lifecycle may refine an authored candidate; it may not invent the semantic identity from implementation convenience.

## Lifecycle states

`uninstantiated -> candidate-authored -> admission-pending -> ontology-admitted -> design-pending -> design-closed -> realization-pending -> realized -> parity-pending -> complete-witnessed`

Terminal non-success states are `rejected`, `superseded`, and `blocked`. A rejection preserves the candidate and decision evidence; identifiers are never silently reused.

## Hard gates

### G1 — semantic admission

Owned by `definitions-governance`. Requires an owner decision, a definition card, criterion schema with positive and negative fixtures, non-collapse review, category placement, relationship review, and canonical validation. A candidate catalog row, ontology canvas node, or generated projection cannot satisfy G1.

### G2 — design closure

Owned by the meta-type implementation design owner after G1. Requires the language-neutral contract, applicable obligation matrix, mapping of ontology properties to implementation behavior, effect/state boundaries, failure semantics, interface contract, and owner-approved implementation profile. G1 does not authorize language code.

### G3 — per-language evidence

Each language lane must pass its own native static checks, package/module topology checks, positive behavior witnesses, and exact-cause negative mutants. An unsupported required construct is a blocking result, not a skipped check.

### G4 — parity and closeout

The normalized parity evaluator compares obligation IDs, evidence classes, verdicts, and claim ceilings. It does not compare syntax or force the three languages into a lowest-common-denominator design. All three lanes must be joined and closed; no majority vote is allowed.

## Portable invariants

- Ontology authority, implementation design, source evidence, runtime evidence, and generated receipts remain distinct authority kinds.
- The ontology model is authored and admitted before implementation design is declared closed.
- Each semantic obligation has a stable ID and explicit applicability: `required`, `not-applicable-with-rationale`, or `unsupported-blocking`.
- Every required obligation has at least one positive witness and one discriminating negative witness in every language where it applies.
- Native tool output remains reachable from normalized findings; normalization cannot erase raw cause.
- Identical normalized inputs produce byte-identical receipt material, excluding explicitly declared environment observations.
- Generated projections and receipts perform no admission, exception, promotion, release, or deployment transition.

## Enforcement layers

The route evaluates separately: lexical/style, source shape, module topology, native static types, DomainSpec formation/graph rules, implementation binding reconciliation, runtime/temporal behavior, and cross-language parity. Passing one layer never substitutes for another.

## Non-goals and claim ceiling

This package does not define the next meta-type, approve a candidate, choose tool versions, create public Arcanum vocabulary, prove production behavior, or deploy anything. A successful execution proves only that the selected, admitted meta-type has three bounded reference witnesses conforming to the selected profile and observed fixtures.

## Acceptance

The reusable package is planning-complete when its Design selection passes, its dispatch document validates, every SWU has a task specification and closeout contract, layering is explicit, and no first implementation task can start before G1 and G2 receipts exist.
