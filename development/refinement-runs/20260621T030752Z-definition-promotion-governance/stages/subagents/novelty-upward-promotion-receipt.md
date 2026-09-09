# Subagent Receipt: Novelty Upward Promotion

Status: pass
Role id: `novelty-upward-promotion`
Agent: `019ee82c-64a9-7c40-b662-ea53c9edf811`
Dispatch id: `20260621T030752Z-definition-promotion-governance`

## Proposed Mechanism

Name: upward promotion by local adaptation

Treat each source definition as source-owned evidence represented in a
CyberAlchemy v2 source cluster. A definition may move upward only by creating a
distinct CyberAlchemy v2 local adaptation candidate that references the source
definition, names its tower need, and enters definitions-governance. The source
row remains evidence and provenance, never the promoted canon.

Promotion path:

1. A source-cluster row records source term, source owner, local posture, and
   route.
2. Local posture changes only to `local-adaptation-needed` or
   `project-canonical-candidate`.
3. The adaptation candidate states the v2-specific semantic delta.
4. Definitions-governance decides canonical promotion.
5. Constitution-governance is required only if the mechanism becomes a reusable
   structural rule.

## Required Typed Relations

| Relation | Direction | Purpose |
| --- | --- | --- |
| `represents_source_definition` | cluster row -> source definition | Preserve the source-owned definition reference. |
| `adaptation_candidate_of` | v2 candidate -> source definition | Name what the local candidate adapts from. |
| `preserves_source_authority` | v2 candidate or record -> source owner | Prevent hidden authority transfer. |
| `specializes_for_tower` | v2 candidate -> definition tower | Name the tower-level need. |
| `semantic_delta_from` | v2 candidate -> source definition | State the local difference. |
| `requires_promotion_gate` | candidate -> definitions-governance | Prevent automatic canonical promotion. |
| `may_inform_constitution_rule` | mechanism -> constitution-governance | Route reusable structural constraints. |
| `blocked_by_boundary_review` | candidate -> decision-gate | Hold contested ownership, naming, scope, or boundary cases. |

## Owner Gates

| Gate | Required when |
| --- | --- |
| definitions-governance | Any term becomes a canonical local definition. |
| constitution-governance | Upward-promotion behavior constrains future artifacts. |
| authority import | Source posture and import or cluster hygiene must be staged. |
| decision-gate | Ownership, naming, scope, or boundary is contested. |
| task-session | A bounded mutation plan exists after governance design. |

## Failure Modes

- Hidden authority transfer: a source-cluster row is treated as canonical because
  it is local.
- Semantic copying: CyberAlchemy v2 duplicates the Arcanum definition without
  naming a v2-specific delta.
- Schema overclaim: structural validity is mistaken for promotion proof or
  authority transfer.
- Inventory or ontology overreach: read models condense meaning but are allowed
  to promote definitions.
- Tower inflation: "higher tower" becomes prestige rather than a named local use
  requirement.
- Missing origin linkage: promoted adaptation lacks a stable source id/path
  back-reference.
- Gate bypass: canonical files mutate before definitions-governance or
  constitution-governance.

## Evidence Paths

- `cyberAlchemy-v2/authority/definitions/DEFINITION-LOCALIZATION-ROUTE.md`
- `cyberAlchemy-v2/authority/promotion-policy.md`
- `cyberAlchemy-v2/authority/definitions/source-clusters/arcanum.md`
- `cyberAlchemy-v2/development/refinement-runs/20260621T030752Z-definition-promotion-governance/REFINE-DISPATCH.json`
- `arcanum/definitions/DEFINITIONS.md#DEF-ARC-SCHEMA`

## Handoff Note

Lane A recommends a distinct adaptation-candidate layer: source definitions stay
source-owned, while CyberAlchemy v2 can promote only a typed, gated,
tower-scoped local semantic delta.
