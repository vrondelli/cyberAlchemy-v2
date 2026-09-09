# SWU-OEW-003 Context Pack

Status: strict coverage pass
Mode: Context Builder standard
Artifact class: private session evidence

## Objective

Project each supported Poker relation into one pinned
Understand-Anything-compatible `GraphEdge` plus one exact sidecar edge row,
preserving mapping loss, policy disposition, diagnostics, and grounding state.

## Obligations

| ID | Obligation | Controlling evidence | Status |
| --- | --- | --- | --- |
| O1 | map `derives-from`, `contradicts`, and candidate `specializes` through one closed table | task contract; mappings | covered |
| O2 | preserve exact relation, loss class, disposition, diagnostics, evidence refs, and grounding inclusion in sidecar | architecture; worked Poker example | covered |
| O3 | emit pinned UA `GraphEdge` fields without adding upstream-incompatible fields | pinned upstream types/schema | covered |
| O4 | use stable source-derived sidecar IDs and canonical ordering | task contract; determinism validation | covered |
| O5 | reject unknown/duplicate relations, missing endpoints, malformed state, and authority-effecting input | task acceptance; validation contracts | covered |
| O6 | write only the exact three-target SWU inventory | SWU manifest | covered |
| O7 | preserve protected-scope equality and emit Task Session and Invoke Refresh receipts | closeout contract; protected baseline | covered |

## Selected Evidence

- `planning/work-pack/tasks/TASK-OEW-ADAPTER-001.md`
- `planning/work-pack/swu-manifest.json`
- `planning/WORK-PACK.md`
- `planning/work-pack/shared/CLOSEOUT-CONTRACT.md`
- `planning/work-pack/waves/W0-L0.md`
- `define/domain.md`
- `define/mappings.md`
- `design/EXAMPLE.md`
- `design/VALIDATION-CONTRACTS.md`
- `planning/work-pack/session-evidence/SWU-OEW-002/receipt.json`
- `planning/work-pack/session-evidence/SWU-OEW-002/node-projection-handle.json`
- `cyberAlchemy-v2/implementation/ontology-candidate-graph-prototype/fixtures/cases/carrier-minimal.v1.json`
- `cyberAlchemy-v2/implementation/ontology-candidate-graph-prototype/fixtures/cases/poker-team-o13.v1.json`
- `cyberAlchemy-v2/implementation/ontology-candidate-graph-prototype/generated/runs/SWU-OCGP-008/result.v1.json`
- `cyberAlchemy-v2/implementation/ontology-candidate-graph-prototype/generated/runs/SWU-OCGP-008/projection.v1.json`
- `Egonex-AI/Understand-Anything@2cda14e89535049e49120198886bc0b82e9e630f/understand-anything-plugin/packages/core/src/types.ts`
- `Egonex-AI/Understand-Anything@2cda14e89535049e49120198886bc0b82e9e630f/understand-anything-plugin/packages/core/src/schema.ts`

## Constraints

- Node 22 ESM and built-in modules only.
- UA edge types are presentation vocabulary only.
- Exact source relation and policy state remain recoverable in the sidecar.
- `authority_effect` remains `none`.
- No generalized mapping enters policy evaluation or grounding closure.
- Protected scopes remain byte-identical.

## Write Scope

- `cyberAlchemy-v2/implementation/ontology-evidence-workbench/src/presentation-edges.mjs`
- `cyberAlchemy-v2/implementation/ontology-evidence-workbench/test/presentation-edges.test.mjs`
- `cyberAlchemy-v2/implementation/ontology-evidence-workbench/fixtures/unknown-relation.json`

## Validation

`node --test cyberAlchemy-v2/implementation/ontology-evidence-workbench/test/presentation-edges.test.mjs`

## Exclusions

- adapter output persistence;
- upstream installation/build;
- viewer/UI behavior;
- ontology admission, promotion, publication, or product authority.

## Open Questions

None for SWU-OEW-003. Later gates remain owned by their declared SWUs.
