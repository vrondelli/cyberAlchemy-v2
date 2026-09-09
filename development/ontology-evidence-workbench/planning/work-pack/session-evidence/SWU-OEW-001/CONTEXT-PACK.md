# SWU-OEW-001 Context Pack

Status: strict coverage pass
Mode: Context Builder standard
Artifact class: private session evidence

## Objective

Admit exactly one existing candidate run after the independent terminal
verifier passes, and return an in-memory `oew-verified-run-handle/v1` without
writing during verification.

## Obligations

| ID | Obligation | Controlling evidence | Status |
| --- | --- | --- | --- |
| O1 | contain the receipt and every source file within the repository/run directory, rejecting symlinks and escapes | task contract; architecture View 3 | covered |
| O2 | call the existing independent verifier rather than duplicate its verdict | task contract; verifier module | covered |
| O3 | require exact four-file inventory, supported v1 schemas, terminal pass, and `authority_effect:none` | verifier module; validation OEW-V-01/OEW-V-04 | covered |
| O4 | return a deterministic handle with exact file digests and perform no writes | task contract; interfaces | covered |
| O5 | sort stable diagnostics for missing, malformed, tampered, escaped, unsupported, extra, and authority-effecting inputs | task contract; validation contracts | covered |
| O6 | write only the five SWU target paths | SWU manifest | covered |
| O7 | preserve protected-scope equality and emit the exact Task Session receipt/closeout projection | closeout contract; protected-set baseline | covered |

## Selected Evidence

- `planning/work-pack/tasks/TASK-OEW-ADMISSION-001.md`
- `planning/work-pack/swu-manifest.json`
- `planning/WORK-PACK.md`
- `planning/work-pack/shared/CLOSEOUT-CONTRACT.md`
- `planning/work-pack/waves/W0-L0.md`
- `design/ARCHITECTURE.md` — View 3 source-admission boundary
- `design/VALIDATION-CONTRACTS.md` — OEW-V-01, OEW-V-04, OEW-V-10
- `design/DESIGN-SELECTION-RESULT.json`
- `define/interfaces.md` — four-file input and forbidden write interfaces
- `define/states.md` — admission state
- `cyberAlchemy-v2/implementation/ontology-candidate-graph-prototype/scripts/verify-terminal-receipt.mjs`
- `cyberAlchemy-v2/implementation/ontology-candidate-graph-prototype/generated/runs/SWU-OCGP-008/terminal-receipt.json`

## Constraints

- Node 22 ESM and built-in modules only.
- The existing verifier owns terminal truth.
- Admission is read-only and has no ontology, promotion, publication, or
  product authority.
- Poker Team, IOLM, Craft, authority, ontology, Arcanum, and the source run
  remain byte-identical.
- No implementation target may be written before material-package and
  mutation-admission receipts pass.

## Write Scope

- `cyberAlchemy-v2/implementation/ontology-evidence-workbench/package.json`
- `cyberAlchemy-v2/implementation/ontology-evidence-workbench/src/source-admission.mjs`
- `cyberAlchemy-v2/implementation/ontology-evidence-workbench/contracts/verified-run-handle.schema.json`
- `cyberAlchemy-v2/implementation/ontology-evidence-workbench/test/source-admission.test.mjs`
- `cyberAlchemy-v2/implementation/ontology-evidence-workbench/fixtures/tampered-result/terminal-receipt.json`

## Validation

`node --test cyberAlchemy-v2/implementation/ontology-evidence-workbench/test/source-admission.test.mjs`

## Exclusions

- node/edge projection;
- adapter output writing;
- upstream fetch/build;
- viewer/UI behavior;
- any authority or protected-source mutation.

## Open Questions

None for SWU-OEW-001. Later gates remain owned by their declared SWUs.
