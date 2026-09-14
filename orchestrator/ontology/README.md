# Shared Orchestrator Ontology

Status: candidate ontology package  
Authority effect: none

This root holds shared candidate projections for every Orchestrator context:

- `business/ontology.json` models participants, strategies, proposals, runs, outcomes, decisions, and separation rules.
- `system/ontology.json` models the product components, ports, stores, adapters, and dependency invariants.
- `bridge/business-system.json` maps business obligations to their proposed system realizations and exposes gaps.

These projections reference the candidate definitions in `../authority/` and do
not promote them. They guide M3-M8 implementation and must be refreshed when
implementation evidence contradicts a relationship or boundary.

## Open Questions

See `../authority/definitions/DEFINITIONS.md#open-questions`.
