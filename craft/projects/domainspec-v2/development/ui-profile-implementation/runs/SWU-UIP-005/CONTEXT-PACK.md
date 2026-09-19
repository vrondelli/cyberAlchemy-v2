---
task_reference: SWU-UIP-005
parent_task: TASK-UIP-GRAPH
mode: standard
status: pass
created: 2026-07-17
artifact_kind: task-session-evidence
runtime_handoff: false
---

# Context Pack: SWU-UIP-005

## Task And Output

- Task: compile the explicit UI development profile through the existing
  minted-project compiler, view builder, and verifier.
- Output: explicit development registry input, fail-closed handle selection,
  deterministic graph/provenance/views/receipt, traversal report, and generated
  artifacts under the UI feature only.
- Authority: implementation-owned development path. Canonical supported-profile
  registry remains the unchanged default.

## Obligation Matrix

| ID | Obligation | Selected evidence | Status |
| --- | --- | --- | --- |
| O1 | Extend the existing compiler path; create no second graph engine. | `compiler.ts`, `views.ts`, `minter.ts`. | covered |
| O2 | Preserve canonical supported profiles as the default. | Current `supported-profiles.yml` and canonical tests. | covered |
| O3 | Require an explicit registry path and handle for development profiles. | Task algorithm and work-pack stop condition. | covered |
| O4 | Validate all development kinds, formations, and active endpoint pairs. | UI formation schemas, DS-D8 registry, SWU-UIP-004 source. | covered |
| O5 | Emit deterministic graph, provenance, Markdown, and receipt bytes. | Existing compiler/view schemas and byte-equality tests. | covered |
| O6 | Preserve Adapter/State normalization and residue/source handles. | Traceability and representation/residue records. | covered |
| O7 | Traverse from Page and backend endpoints and cover every required representation. | Feature graph, traceability, task done criteria. | covered |
| O8 | Keep canonical tests green and prove implicit activation fails. | Existing compiler/view tests and focused development-profile tests. | covered |

## Included Context

| Source | Selectors | Obligation fit |
| --- | --- | --- |
| `TASK-UIP-GRAPH.md` | SWU-UIP-005 algorithm, failures, done criteria | O1-O8 |
| `compiler.ts` | profile load, formation, edge validation, graph/provenance emission | O1-O6, O8 |
| `views.ts` | Markdown, receipt, verification | O1, O5, O8 |
| `minter.ts` | canonical default profile selection and view invocation | O1-O3, O8 |
| minted-project schemas/tests | stable source/generated contracts | O2, O5, O8 |
| canonical `supported-profiles.yml` | default registry and bindings | O2, O3 |
| UI profile/formations/placements | development kinds and normalization | O3, O4, O6 |
| Create Player machine feature | per-node sources, traceability, residue | O4-O7 |

## Decisions And Assumptions

- `compileMintedProject` and view/verify functions receive an optional explicit
  development-registry selection. Omission retains byte-for-byte canonical
  behavior.
- The development registry is implementation-owned JSON and is never appended
  to canonical `supported-profiles.yml`.
- Existing JSON formation schemas remain preferred. Additional backend/UI kinds
  use attribute-map contracts from `spec/meta-types`.
- The project manifest names `ui-development@0.1`; compilation without the
  explicit handle fails with a dedicated code.
- Minter defaults remain canonical. This SWU does not mint new projects with a
  development profile.
- No blocker decision was required.

## Context Builder Summary

- Source groups selected: 8.
- Obligation coverage: 8/8, 100 percent.
- Blockers: 0.
