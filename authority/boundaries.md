# CyberAlchemy v2 Boundaries

Status: active local boundary rule
Owner: CyberAlchemy v2

## Public And Private

CyberAlchemy v2 is staged inside the private `domainspec-core` parent. It may
reference private evidence while local, but any public derivative must pass a
boundary scrub.

Public Arcanum material may be cited as public framework evidence. Private
DomainSpec implementation, validation, telemetry, sessions, and parent-local
research must not be copied into public artifacts without owner review.

## Source And Read Model

Raw sources remain the highest evidence for their own claims. Inventory pages,
evidence cards, ontology maps, memory summaries, sessions, and observability
signals are read models or evidence carriers.

They help search and context selection. They do not promote themselves.

## Import And Promotion

Import ledgers under [imports/](imports/README.md) stage source paths so the
project can consolidate scattered definitions, constitutions, axioms, and
glossaries without immediately making them canonical.

An import candidate is not a local definition, constitution rule, or spec until
the owning governance route promotes it.

## Generated And Canonical

Generated runtime surfaces, including `.agents/skills/`, `.claude/skills/`, and
command adapters, are projections. Their canonical source must be traced before
they influence a capability contract.

## Research And Specification

Research can propose terms, maps, gates, or implementation ideas. Specs own
contracts only after a promotion decision. Implementation waits for a task
route or execution pack.

## Free / Paid And Engine Mechanism

The free/paid boundary and the engine-mechanism withholding are governed by
[decisions/2026-06-24-engine-moat-and-free-paid-boundary.md](decisions/2026-06-24-engine-moat-and-free-paid-boundary.md):

- **Free:** the layering / tag / alignment audits and the LLM test generator.
- **Moat (paid):** the DomainSpec language and the Lean validations — the
  deterministic derivation engine's algorithm.
- **Cite results, withhold mechanism:** demonstrate engine *results* (determinism,
  byte-stability, mutation/spec-formalization numbers, the self-derive fixpoint)
  publicly; never disclose the `parse → δ → key → emit` pipeline, L0–L4 internals,
  rule/grammar types, id-map, tier split, fenced regions, or Lean proof internals.

## Public Disclosure (Saturn / DomainSpec)

Governed by [decisions/2026-06-24-saturn-domainspec-public-disclosure.md](decisions/2026-06-24-saturn-domainspec-public-disclosure.md):
Saturn and DomainSpec may be **named and explained publicly** (framed
intended-not-shipped, claim ≤ proof); the "research-as-discovery / code-as-probe /
Cybernetics²" framing is approved. **MARS / MOGT / Necronomicon**, the internal
layer-map, and the engine mechanism stay **private**. (This resolves OQ-1 below for
the Saturn/DomainSpec slice.)

## Open Questions

### OQ-1. What is the first public-safe slice?

Context: CyberAlchemy v2 likely wants a public story eventually, but the current
source spine mixes private and public evidence. Recommendation: choose the first
public-safe slice through decision-gate after the local skeleton is reviewed.
Status: **PARTIALLY RESOLVED** — the Saturn/DomainSpec naming + "who we are"
framing slice is approved (see Public Disclosure above); broader slices remain OPEN.
