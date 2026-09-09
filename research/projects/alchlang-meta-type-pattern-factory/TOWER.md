# Research tower

## Question

How can CyberAlchemy-v2 extend DomainSpec meta-types and AlchLang architecture
patterns through one coherent, reproducible process while preserving the D65
ordering and the authority boundaries between compilation, proof, admission,
runtime observation, and execution?

## Scope

- The admitted DomainSpec `@10` meta-type baseline and its realization rows.
- DomainSpec meta-type descriptors, factory kits, provider registry, proof DAG,
  instantiation CLI, and provider-neutral system-integration profiles.
- The AlchLang carrier, compiler, operation-pattern registry, and local Outbox
  implementation.
- Official compiler/plugin/provider precedents used only to test the design.
- A proposed profile, architecture, extension lifecycle, and static arrow
  authoring subset.

Implementation, adoption, admission, publication, deployment, and external
effects are excluded.

## Levels

| Level | Purpose | Artifact | Status |
|---|---|---|---|
| L0 | Freeze the observed local and external corpus | [L0 corpus](levels/L0-corpus.md) | complete |
| L1 | Expose seams, contradictions, and unclosed dependencies | [L1 residue map](levels/L1-residue-map.md) | complete |
| L2 | Propose the smallest coherent closure and staged implementation | [L2 closure plan](levels/L2-closure-plan.md) | research-complete; owner decision open |

## Promotion boundary

This tower can seed a Product Capability revision, business ontology,
DomainSpec source, and implementation plan. It cannot itself change any of
those artifacts or call the proposed profile adopted.

