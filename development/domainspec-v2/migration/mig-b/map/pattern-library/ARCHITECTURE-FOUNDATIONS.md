# Architecture Foundations

## System invariant

One selected DomainSpec meaning must remain identifiable across definition, realization selection,
materialization, target bytes, independent observation, and evidence. A step may narrow the claim; it may
not silently widen, reinterpret, or replace the identity.

## Ownership boundaries

- Definitions and ontology own meaning.
- The baseline owns the exact implemented selection set for one frozen epoch.
- The instantiator owns deterministic target planning and writes.
- Target adapters own concrete language and infrastructure bindings.
- Conformance providers own observation, not generation or admission.
- Evidence joins preserve provider truth and unresolved residue.
- Owners decide admission, promotion, release, or retirement separately.

## Layer test

A component belongs in the lowest layer whose responsibility fully explains it. Generated code does not
belong in definitions; validation receipts do not belong in authority; development results do not become
canonical ontology by reference. Cross-layer links must name the consumed contract and preserve its
identity.

## Source navigation

Return to the [observed architecture](../ARCHITECTURE.md),
[pattern library](../ARCHITECTURE-PATTERN-LIBRARY.md), or
[project map index](../README.md).
