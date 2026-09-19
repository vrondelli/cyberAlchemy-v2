---
title: Ontology Materialization Glossary Consistency
status: design-flag
mode: invoke-design
created: 2026-06-18
---

# Glossary Consistency

This report checks the architecture terms against the approved research packet and records naming collisions without promoting glossary terms.

## Checked Terms

| Term | Use In Architecture | Consistency | Notes |
| --- | --- | --- | --- |
| `source selector` | Pointer to source path/anchor used as evidence. | pass | Source/evidence only; not ontology authority. |
| `InventoryEvidence` | Cataloged reusable evidence. | pass | Non-authority until downstream promotion. |
| `OntologyCandidate` | Thick candidate node with claim, branch, evidence, confidence, owner, invalidation, and agent use. | pass | Must not be pointer-only. |
| `PromotionRecord` | Governing transition object for one claim or decision. | pass | Not an ontology node and not a raw evidence container. |
| `governed projection` | Agent-usable read/projection over candidates or promoted entries. | pass | Avoids overclaiming branch-as-view. |
| `branch-as-view` | Candidate OD-1 projection where artifact tree materializes branch views. | flag | Not canonical until owner ratifies OD-1. |
| `meaning-view` | Candidate B1 artifact name if OD-1 lands. | flag | Keep `ontology-view` as method/skill name unless explicitly renamed. |
| `engineer-view` | Candidate B2 artifact name if OD-1 lands. | flag | `system-view` remains a method role; B2 naming is not fully settled. |
| `run-view` | Candidate B3 artifact name if OD-1 and OD-2 land. | flag | Requires legal subject-run evidence; cannot use research-session traces. |
| `bridge-view` | Neutral B4 projection name in this architecture. | pass | Do not rename to `residue-view` until OD-3. |
| `residue-view` | Candidate B4 extraction name. | flag | Open OD-3; extraction can create single-owner conflict. |
| `Operational Ontology` | CyberAlchemy cross-run agent-operation ontology. | pass | Not the same as Ontologize B3 run-context. |

## Conflicts And Resolutions

| Conflict | Resolution |
| --- | --- |
| `ontology-view` vs `meaning-view` | Use `meaning-view` only inside OD-1 candidate projection. Keep `ontology-view` as method/skill name. |
| `system-view` vs `engineer-view` | Do not promote either as canonical B2 artifact name in this architecture. Candidate projection currently uses `engineer-view`; method roles may still include `system-view`. |
| `bridge-view` vs `residue-view` | Use `bridge-view` for neutral architecture projection. Keep `residue-view` as OD-3 candidate extraction. |
| `run-context` vs `Operational Ontology` | Keep Ontologize B3 run-context as subject-run evidence. Keep CyberAlchemy Operational Ontology as cross-run method/runtime guidance. |
| `PromotionRecord` vs ontology node | PromotionRecord governs transition; candidate/promoted ontology entries carry meaning. |
| File as node vs file as source | A file is a node only when it satisfies node eligibility; otherwise it is source, evidence, decision, promotion record, projection, or generated read model. |

## Result

- Status: flag
- Reason: no blocking glossary contradiction, but OD-1/OD-2/OD-3 names remain candidate-level and must not be promoted by architecture alone.
