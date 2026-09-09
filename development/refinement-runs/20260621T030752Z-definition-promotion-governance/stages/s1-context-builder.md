# Context Builder Evidence Baseline

Status: pass
Capability: `context-builder`
Mode: `standard`
Dispatch step: `s1`
Handoff pack: runtime evidence for this Refine run

## Context Pack Summary

- Task: define a CyberAlchemy v2 definition elevation protocol.
- Mode: standard.
- Files selected: 9.
- Snippets selected: 18.
- Obligation coverage: 100%.
- Noise ratio: low.
- Output markdown: this file.
- Output index: [../evidence-index.json](../evidence-index.json).
- Handoff pack: runtime.
- Session evidence path: `cyberAlchemy-v2/development/refinement-runs/20260621T030752Z-definition-promotion-governance/`.
- Strict coverage: pass.
- Blockers: 0.

## Obligations

| ID | Obligation | Status |
| --- | --- | --- |
| O1 | Preserve Arcanum `schema` as Arcanum source authority. | covered |
| O2 | Explain how one definition moves upward without relocation. | covered |
| O3 | Keep source-cluster rows evidence/routing only. | covered |
| O4 | Name typed relations for non-orthogonal authority crossings. | covered |
| O5 | Separate definitions-governance from constitution-governance. | covered |
| O6 | Record origin references and drift handling. | covered |
| O7 | Keep inventory and ontology as read/candidate layers only. | covered |
| O8 | Produce a non-executed next-route plan. | covered |

## Included Context

| Path | Why included | Selectors | Obligations |
| --- | --- | --- | --- |
| `arcanum/definitions/DEFINITIONS.md` | Source authority for `schema` and contract/schema boundary. | `DEF-ARC-SCHEMA`, schema boundary | O1, O4 |
| `cyberAlchemy-v2/authority/definitions/DEFINITION-LOCALIZATION-ROUTE.md` | Existing route for local representation without canonical promotion. | layers, rule, first execution contract | O2, O3 |
| `cyberAlchemy-v2/authority/definitions/source-clusters/arcanum.md` | Arcanum source cluster and representation-only rule. | authority rule, `DEF-ARC-SCHEMA` row | O1, O3, O6 |
| `cyberAlchemy-v2/authority/promotion-policy.md` | Promotion ladder and owner gates. | promotion ladder, required gates | O2, O5, O8 |
| `cyberAlchemy-v2/authority/definitions/DEFINITIONS.md` | Existing local terms used by the protocol. | `CAV2-D5`, `CAV2-D10`, `CAV2-D13`, `CAV2-D16` | O2, O4, O5 |
| `cyberAlchemy-v2/authority/definitions/DEFINITION-TOWERS.md` | Tower map and tower boundary. | authority rule, tower stack, T1 boundary | O2, O3 |
| `cyberAlchemy-v2/authority/definitions/DEFINITION-DRIFT-AUDIT.md` | Existing drift findings and unresolved relationship-invariant route. | schema/relationship finding, undefined critical terms | O4, O6, O7 |
| `.arcanum/inventory/queries/2026-06-21-schema-relationship-invariants/search-sequence.md` | Search sequence and read-model authority boundary. | purpose, candidate synthesis, boundary rules | O4, O7 |
| `REFINE-DISPATCH.json` | Approved route, two novelty lanes, gates, receipts. | subagent roles, gates, stop conditions | O5, O8 |

## Excluded Candidates

| Path | Why excluded |
| --- | --- |
| generated `.agents/skills/` mirrors beyond named skill contracts | Generated from canonical sources; not needed for source semantics. |
| repo-wide `rg` backstop | Deferred because current local evidence covers the requested mechanism. |
| external web research | No named external gap appeared after local evidence review. |

## Receipt

```yaml
dispatch_id: 20260621T030752Z-definition-promotion-governance
step_id: s1
capability_ref: context-builder
status: pass
artifact: stages/s1-context-builder.md
validation: strict coverage pass
observer_status: not_emitted
blockers: []
residue:
  - canonical promotion deferred to definitions-governance and constitution-governance
handoff_note: use selected evidence to define, review, distill, design, and plan the elevation protocol
```
