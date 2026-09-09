# Invoke Design: Promotion Governance

Status: pass
Capability: `invoke`
Mode: `design`
Dispatch step: `s6`

## Invoke Result

- Mode: design.
- Spell: invoke.
- Canonical ID: invoke.
- Scope: library.
- Phase status: pass.
- Mode contract: `.agents/skills/invoke/design.md`.
- Outputs: this design artifact.
- Design views: context, high-level structure, low-level components, workflow
  process, decision flow, dependency interface.
- Template/profile selection: local architecture design inside Refine run
  evidence; no canonical template promotion.
- Dispatch techniques: `handle_handoff`, `authority_split_gate`,
  `state_namespace_boundary`, `owner_boundary_check`.
- Distill validation: stage `s8` queued.
- Decisions: use a mixed protocol with typed relation profile and origin
  reference ledger.
- Unresolved gaps: whether to promote the protocol as one definition, one
  constitution rule, or both.
- Next route: interrogation design review.

## Context View

CyberAlchemy v2 needs a mechanism for definitions that appear in lower or source
towers, such as Arcanum `schema`, to inform higher local tower semantics without
being copied into CyberAlchemy canon. The current evidence already separates:

- source authority;
- local representation;
- canonical local definitions;
- promotion gates;
- inventory and ontology candidate/read layers.

The design must add the missing bridge: a typed elevation route.

## High-Level Structure View

```text
source definition
  -> source-cluster row
  -> adaptation candidate
  -> promotion gate
  -> local canonical definition
  -> origin reference ledger
  -> drift audit / constitution rule if needed
```

The route is one-way for authority promotion. The origin reference may point
from source to local adaptation, but it does not send CyberAlchemy v2 authority
back into the source project.

## Low-Level Components View

| Component | Required fields | Authority |
| --- | --- | --- |
| Source reference | `source_id`, `source_term`, `source_path`, `source_authority_owner` | source-owned |
| Local representation | `origin_cluster_path`, `tower`, `local_posture`, `local_action` | evidence/routing |
| Adaptation candidate | `candidate_id`, `tower_need`, `semantic_delta`, `candidate_owner`, `evidence_refs` | candidate only |
| Relation profile | typed relations and endpoint roles | candidate governance |
| Promotion record | `promotion_record_id`, `promotion_owner`, `verdict`, `validation_refs` | owner-gate evidence |
| Local definition | `local_definition_id`, `local_definition_path`, definition voices | definitions-governance |
| Origin reference | `relation_kind`, `relation_direction`, `drift_status`, `drift_checked_at`, `drift_evidence_ref` | evidence/routing |
| Constitution rule | rule id, scope, validation model | constitution-governance |

## Workflow Process View

1. Inventory or local search identifies a source definition.
2. A source-cluster row represents the definition locally.
3. A reviewer asks whether CyberAlchemy v2 has a tower-specific semantic need.
4. If no local need exists, the row stays `external-authority-represented`.
5. If a local need exists, create an adaptation candidate with semantic delta.
6. Definitions-governance reviews the candidate.
7. If promoted, update local definitions and index through definitions-governance.
8. Add a non-canonical origin reference record with drift state.
9. If the route should constrain future artifacts, route a rule to
   constitution-governance.
10. If ownership, naming, public/private, or source authority is contested,
    route to decision-gate.

## Decision Flow View

| Decision | Pass | Flag | Block |
| --- | --- | --- | --- |
| Is source authority known? | Continue. | Continue with source-owner gap. | Stop. |
| Is local representation present? | Continue. | Add cluster row before promotion. | Stop if missing representation hides provenance. |
| Is there a tower-specific semantic delta? | Create candidate. | Defer and record residue. | Stop if candidate only copies source. |
| Is owner gate identified? | Submit to owner. | Carry risk. | Stop. |
| Is drift/back-reference specified? | Continue. | Carry repair task. | Stop before canon if source link would be lost. |
| Is structural enforcement needed? | Route constitution-governance. | Defer rule. | Stop if rule is already enforced without owner. |

## Dependency Interface View

| Interface | Producer | Consumer | Contract |
| --- | --- | --- | --- |
| Source-cluster row | authority import / Craft | definitions-governance | Evidence/routing only. |
| Adaptation candidate | definitions review work | definitions-governance | Local semantic delta and source reference. |
| Promotion record | owner gate | definitions, drift audit, source cluster | Decision evidence, not semantic content alone. |
| Origin reference ledger | definitions-governance + source-cluster maintenance | Craft, drift audit, future search | Back-reference and drift state; non-canonical. |
| Constitution rule proposal | Refine or definitions-governance | constitution-governance | Future-constraining rule candidate. |

## Relation Profile

| Relation | Endpoint A | Endpoint B | Owner route |
| --- | --- | --- | --- |
| `represents_source_definition` | source-cluster row | source definition | authority import / definitions-governance |
| `adaptation_candidate_of` | adaptation candidate | source definition | definitions-governance |
| `semantic_delta_from` | adaptation candidate | source definition | definitions-governance |
| `specializes_for_tower` | adaptation candidate | definition tower | definitions-governance |
| `requires_promotion_gate` | adaptation candidate | owner gate | definitions-governance |
| `promoted_as_local_authority` | promotion record | local canonical definition | definitions-governance |
| `origin_backreference_for` | origin reference record | local canonical definition | definitions-governance |
| `drift_checked_against` | origin reference record | source definition | definitions-governance / drift audit |
| `blocked_by_boundary_review` | candidate or origin record | decision-gate | decision-gate |
| `structural_rule_candidate_for` | protocol | constitution rule | constitution-governance |

## Design Boundary

This design does not create or update canonical definitions, source clusters,
or constitutions. It is a proposal artifact for later owner-governed mutation.

## Receipt

```yaml
dispatch_id: 20260621T030752Z-definition-promotion-governance
step_id: s6
capability_ref: invoke
mode: design
status: pass
artifact: stages/s6-invoke-design.md
validation: six views complete; owner boundaries explicit
observer_status: not_emitted
blockers: []
residue:
  - final schema shape deferred
  - canonical owner mutation deferred
handoff_note: review design for hidden authority transfer and drift failure modes
```
