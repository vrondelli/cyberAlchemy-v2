# Orchestrator Product Tests

Status: candidate package boundary  
Authority effect: none

This context owns cross-package contract, differential replay, durability, recovery, adapter, API, frontend, and product-journey verification.

## Current boundary

Package-local unit tests stay near their code; this root covers boundaries involving more than one package.

`verify_standalone.py` constructs a source-only CyberAlchemy v2 copy that omits
the legacy orchestration directories and the external predecessor repository.
It scans active inputs for forbidden predecessor paths, then runs the RWO,
runtime, capability, API, frontend, Trusted Dataset, and Robot World suites.

## Open Questions

See `../authority/definitions/DEFINITIONS.md#open-questions`.
