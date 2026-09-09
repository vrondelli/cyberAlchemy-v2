---
document_id: cav2-domainspec-v2-product-thesis/v1
status: legacy-name-source
owner: DomainSpec v2 owner
visibility: private
authority_scope: product-positioning-candidate
authority_effect: none
source_snapshot_digest: 13e2eeb7b59cd89c02283d8e54bbb85ed0b0d0d7479f5c666ad289ff5f28a171
updated_at: 2026-08-30
---

# Craft Product Thesis — DomainSpec v2 legacy name

> Craft is the current name of this Product lineage. This document preserves the DomainSpec-v2-named thesis
> projection as migration provenance; it does not define a separate predecessor or successor Product and does not
> prove that physical paths or authority bindings have moved.

## Thesis

Software intent should survive its translation into architecture, implementation, validation, and change.
DomainSpec makes that intent an explicit typed graph, selects one exact implementation realization for every
supported concept, materializes the selection deterministically, and compares the observed project with the
selected contract using bounded evidence.

```text
domain intent
  -> typed concepts and relationships
  -> selected architecture profile and exact realizations
  -> deterministic project artifacts
  -> independent observations
  -> non-inflating conformance evidence
  -> an external owner decision
```

No single document, template, generator, test, ontology, or receipt is the product. The product is the machinery
that preserves identity and meaning across the whole chain.

## Product promise

For one exact DomainSpec source, profile, implementation baseline, target snapshot, and toolchain, DomainSpec
answers five separate questions:

1. **Meaning:** Which concepts exist and which semantic roles do they play?
2. **Structure:** Which typed relationships between those concepts are allowed?
3. **Realization:** Which exact language and architecture implementation was selected?
4. **Observation:** What did the named observer find in the exact target?
5. **Evidence:** Which obligations are supported, failed, unsupported, or stale?

The result is a reproducible bounded statement. It is not universal correctness, business approval, or release
authority.

## Product model

| Layer | Responsibility |
| --- | --- |
| Language | Own meta-types, formation criteria, and typed relationship signatures. |
| Source | Record project-owned concepts, properties, intent, and relationships. |
| Profiles and realizations | Select portable architecture constraints and exact language-specific forms. |
| Instantiation | Produce a deterministic contained plan, publish it atomically, and emit a baseline-bound receipt. |
| Conformance | Observe the target independently and compare it with the selected realization. |
| Evidence and decision | Preserve gaps and claim ceilings; keep owner decisions separate. |

Term semantics remain in the current DomainSpec definition authority. This document explains product purpose;
it does not redefine DS-D1 meta-types, DS-D8 relationships, or D36–D49 recovery/integration concepts.

## Identity separations

### Meta-type, realization, and instance

A meta-type defines a semantic role such as Operation or Workflow. A realization selects the exact language and
architecture form for that role. An instance is a project concept materialized using that selection. Name or
syntax similarity never collapses these identities.

### Generation, conformance, and release

Generation records what DomainSpec wrote. Conformance records whether an observed target satisfies the selected
contract. Release is an external authorized decision. A PASS at one boundary grants no next-boundary authority.

### Meaning, evidence, and decision

Project source owns intended meaning. Providers and tests produce evidence about exact inputs. An owner makes a
bounded decision. Evidence cannot make itself authoritative.

## Current product state

- Thirteen backend meta-types are active.
- Each has one selected TypeScript, Python, and Rust realization: 39 exact realization rows.
- DS-D8 owns the active relationship signatures and endpoint constraints.
- The private CLI authors a closed Operation source node, instantiates supported nodes, emits baseline-bound
  receipts, rereads targets, and performs bounded static conformance.
- Operation realization owns declared reads, writes, effects, pre-mutation guards, state-and-outbox atomicity,
  explicit failure continuation, and rejection of undeclared effects.
- Workflow realization owns orchestration and deterministic forward-recovery planning while every recovery target
  remains an ordinary Operation.
- Recovery planning and exact-binding in-process execution exist across TypeScript, Python, and Rust.
- Provider-neutral D45–D49 system-integration contract formation exists across the three language profiles.

Durable dispatch storage, fenced Claim/Lease coordination, Attempt journaling, persisted Retry, restart recovery,
Operation-owned durable replay recognition, provider runtime observation, publication, and release remain open.

## Product success criterion

DomainSpec succeeds when a consuming project can declare a supported graph, instantiate the selected realizations
in a clean target, reproduce the same artifact and receipt identities, and obtain independent conformance evidence
that proves the bounded contract or names every unsupported obligation—without rediscovering the architecture
from prose.

## Non-goals

DomainSpec does not invent business meaning, decide whether a requirement is desirable, replace an application
framework, turn static checks into production proof, inflate unsupported evidence, or imply publication,
deployment, release, or production readiness.

## Source binding and rename continuity

This candidate is a CyberAlchemy-native restatement of the current canonical thesis at
`projects/domainspec-v2/PRODUCT-THESIS.md`, inventoried at SHA-256
`13e2eeb7b59cd89c02283d8e54bbb85ed0b0d0d7479f5c666ad289ff5f28a171`. Craft is the current Product name; until
the rename migration closes, the old path remains a legacy product-positioning source and this document has no
authority effect.

## Open Questions

- Which migration mode moves or aliases the legacy-named source without breaking Product-lineage continuity?
- Which accepted baseline first binds CyberAlchemy-native implementation paths?
