# Orchestrator Contracts

Status: implementation candidate  
Authority effect: none

This package now defines closed v1 schemas for Run Bundle, Event Proposal,
Command Intent, Command Receipt, and Accepted Structural History. Rust types in
`../rwo/` and `../runtime/` implement the same boundaries.

Schema validation proves form only. Admission, event acceptance, external effect,
and lifecycle decisions remain owned by their runtime and domain boundaries.

## Open Questions

Strategy, template, dispatch, and API envelope schemas enter during M5 and M6.
