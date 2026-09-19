---
task_reference: SWU-UIP-004
parent_task: TASK-UIP-GRAPH
mode: standard
status: pass
created: 2026-07-17
artifact_kind: task-session-evidence
runtime_handoff: false
---

# Context Pack: SWU-UIP-004

## Task And Output

- Task: express Create Player as a per-node DomainSpec machine feature using
  the existing node/connection shape and active DS-D8 signatures.
- Output: feature manifest, one JSON file per node, representation records,
  traceability/residue, synchronized Markdown validator view, and focused
  endpoint tests.
- Authority: synthetic development source only; canonical definitions are
  read-only.

## Obligation Matrix

| ID | Obligation | Selected evidence | Status |
| --- | --- | --- | --- |
| O1 | Use one source file per node with stable IDs and explicit outgoing connections. | Minted-project project/feature/node/connection schemas and Key and Door fixture. | covered |
| O2 | Represent all eleven required concepts without forcing eleven node kinds. | UI profile and synthetic manifest. | covered |
| O3 | Normalize Adapter to Mapping while retaining traceable UI vocabulary. | Adapter placement contract. | covered |
| O4 | Materialize both State Indicator branches without `reflects`. | State placement contract and `reflects` residue. | covered |
| O5 | Author only active DS-D8 endpoint-valid edges. | Current relationship registry signatures. | covered |
| O6 | Preserve every omitted/transformed relation as typed residue. | Work-pack active endpoint gap and task algorithm. | covered |
| O7 | Keep machine nodes authoritative and Markdown as a synchronized validator view. | User machine-view direction; minted-project source/read-model distinction. | covered |
| O8 | Prove positive construction and named endpoint mutations. | Task done criteria and relationship validator helper. | covered |

## Included Context

| Source | Selectors | Obligation fit |
| --- | --- | --- |
| `TASK-UIP-GRAPH.md` | SWU-UIP-004 algorithm, failures, validation | O1-O8 |
| minted-project schemas | per-node source and connection contracts | O1, O7 |
| Key and Door fixture | source layout, stable IDs, generated-model boundary | O1, O7 |
| `profile.yml` | eleven representations | O2-O4 |
| synthetic manifest/specimens | Create Player inputs and provenance | O2 |
| Adapter and State placement contracts | normalization, branches, prohibitions | O3, O4, O6 |
| `relationships.yml` | exact active endpoints | O5, O6, O8 |
| `relationship-signatures.ts` | endpoint validation semantics | O5, O8 |

## Decisions And Assumptions

- The source contains nine UI nodes, one Mapping node carrying Adapter
  traceability, and seven backend nodes needed to close active graph paths.
- Async Request Indicator is a role record on the Component body. Domain State
  Indicator is a separate projection record targeting State Machine. Neither
  becomes a generic State Indicator node.
- `shapes`, `reflects`, Action-to-Binding, Hook-to-Binding, and direct
  Component-to-Form connections are omitted and recorded, not invented.
- `SPEC.md` remains necessary for current content/relationship validators but
  is explicitly a synchronized human view of the per-node machine sources.
- No blocker decision was required.

## Context Builder Summary

- Source groups selected: 8.
- Obligation coverage: 8/8, 100 percent.
- Blockers: 0.
