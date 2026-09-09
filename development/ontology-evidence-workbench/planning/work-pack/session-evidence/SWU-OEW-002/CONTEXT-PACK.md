# SWU-OEW-002 Context Pack

Status: strict coverage pass
Mode: Context Builder standard
Artifact class: private session evidence

## Objective

Project each supported Poker candidate evidence node into one pinned
Understand-Anything-compatible `GraphNode` and one lossless sidecar node row,
without changing source evidence or authority.

## Obligations

| ID | Obligation | Controlling evidence | Status |
| --- | --- | --- | --- |
| O1 | map Finding, Research artifact, Definition, and Observation through one closed table | task contract; mappings | covered |
| O2 | emit pinned UA `GraphNode` fields using only `claim` and `source` knowledge types | pinned upstream `types.ts` and `schema.ts` | covered |
| O3 | preserve source ID, exact kind, original kind, path, digest, and authority ceiling in the sidecar | architecture data contracts; domain invariants | covered |
| O4 | use stable source-ID-derived presentation IDs and canonical ordering | task contract; determinism validation | covered |
| O5 | reject duplicate IDs, unknown kinds, malformed digests, and authority-effecting inputs with stable diagnostics | task acceptance; validation contracts | covered |
| O6 | write only the exact four-target SWU inventory | SWU manifest | covered |
| O7 | preserve protected-scope equality and emit Task Session and Invoke Refresh closeout receipts | closeout contract; protected baseline | covered |

## Selected Evidence

- `planning/work-pack/tasks/TASK-OEW-ADAPTER-001.md`
- `planning/work-pack/swu-manifest.json`
- `planning/WORK-PACK.md`
- `planning/work-pack/shared/CLOSEOUT-CONTRACT.md`
- `planning/work-pack/waves/W0-L0.md`
- `define/domain.md`
- `define/mappings.md`
- `design/ARCHITECTURE.md`
- `design/VALIDATION-CONTRACTS.md`
- `planning/work-pack/session-evidence/SWU-OEW-001/receipt.json`
- `planning/work-pack/session-evidence/SWU-OEW-001/verified-run-handle.json`
- `cyberAlchemy-v2/implementation/ontology-candidate-graph-prototype/fixtures/cases/carrier-minimal.v1.json`
- `Egonex-AI/Understand-Anything@2cda14e89535049e49120198886bc0b82e9e630f/understand-anything-plugin/packages/core/src/types.ts`
- `Egonex-AI/Understand-Anything@2cda14e89535049e49120198886bc0b82e9e630f/understand-anything-plugin/packages/core/src/schema.ts`

## Constraints

- Node 22 ESM and built-in modules only.
- Pinned UA graph types are presentation vocabulary only.
- Exact source evidence remains recoverable from the sidecar.
- `authority_effect` remains `none`.
- Poker Team, IOLM, Craft, authority, ontology, Arcanum, and the admitted OCGP
  source run remain byte-identical.
- No implementation target may be written before material-package and
  mutation-admission receipts pass.

## Write Scope

- `cyberAlchemy-v2/implementation/ontology-evidence-workbench/contracts/evidence-sidecar.schema.json`
- `cyberAlchemy-v2/implementation/ontology-evidence-workbench/src/presentation-nodes.mjs`
- `cyberAlchemy-v2/implementation/ontology-evidence-workbench/test/presentation-nodes.test.mjs`
- `cyberAlchemy-v2/implementation/ontology-evidence-workbench/fixtures/poker-source-subset.json`

## Validation

`node --test cyberAlchemy-v2/implementation/ontology-evidence-workbench/test/presentation-nodes.test.mjs`

## Exclusions

- relation projection;
- adapter output persistence;
- upstream installation/build;
- viewer/UI behavior;
- ontology admission, promotion, publication, or product authority.

## Open Questions

None for SWU-OEW-002. Later gates remain owned by their declared SWUs.
