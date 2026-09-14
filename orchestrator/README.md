# CyberAlchemy Orchestrator

Status: candidate product package  
Authority effect: none

CyberAlchemy Orchestrator is a standalone product inside CyberAlchemy v2. It
provides one control plane for authoring, reviewing, admitting, executing,
observing, recovering, and reusing bounded multi-agent and tool strategies.

## Package map

- `product/` explains the product thesis, user journey, and roadmap.
- `authority/` owns Orchestrator definitions, constitutions, and decisions across every context.
- `ontology/` models business meaning, system structure, and their explicit bridge.
- `contracts/` owns versioned data and API contracts.
- `capabilities/` owns user-visible orchestration capabilities and their adapters.
- `rwo/` owns the independently tested pure structural kernel.
- `runtime/` owns durable accepted history, scheduling, workers, recovery, and APIs.
- `frontend/` owns the Control Center and embedded run views.
- `deployment/` owns service packaging and operational configuration.
- `examples/` owns reusable product examples such as Robot Talks and Robot World.
- `tests/` owns cross-package and product-journey verification.
- `docs/` explains architecture and operation without redefining authority.
- `migration/` records source provenance, staging, equivalence, and retirement evidence.

`PACKAGE.json` is the machine-readable package map. The current implementation
frontier is recorded by the migration evidence under `migration/`.

## Current boundary

The product package and candidate vocabulary exist. Runtime code has not yet
moved into this root. Candidate definitions remain working hypotheses until
implementation evidence supports review. No legacy path is approved for deletion.

## Open Questions

See `authority/definitions/DEFINITIONS.md#open-questions`.
