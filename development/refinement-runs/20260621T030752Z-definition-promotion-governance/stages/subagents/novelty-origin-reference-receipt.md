# Subagent Receipt: Novelty Origin Reference

Status: pass
Role id: `novelty-origin-reference`
Agent: `019ee82c-77c4-7f51-9e4e-228d210b6910`
Dispatch id: `20260621T030752Z-definition-promotion-governance`

## Proposed Mechanism

Add an Origin Reference Ledger alongside source-cluster rows. When a source
definition is promoted into a CyberAlchemy v2 local adaptation, the origin
cluster keeps a non-canonical back-reference record that points to the promoted
local definition, records drift state, and preserves source ownership.

The source-cluster row remains evidence and routing only. The canonical
definition lives only in `authority/definitions/DEFINITIONS.md` after
definitions-governance promotion.

## Required Fields

| Field | Purpose |
| --- | --- |
| `source_id` | Original source definition id, such as `DEF-ARC-SCHEMA`. |
| `source_term` | Source term label. |
| `source_path` | Stable source path or selector. |
| `source_authority_owner` | Owner of source semantics. |
| `origin_cluster_path` | Source-cluster row location. |
| `local_definition_id` | Nullable until promoted. |
| `local_definition_path` | Canonical target only after promotion. |
| `relation_kind` | One of `represented-by-local-adaptation`, `superseded-by-local-adaptation`, `blocked-from-local-promotion`, or `external-authority-only`. |
| `relation_direction` | Usually `source -> local_adaptation`. |
| `promotion_record_id` | Durable promotion decision reference. |
| `promotion_owner` | Usually `definitions-governance`. |
| `promotion_route` | Definitions-governance, constitution-governance, decision-gate, or blocked. |
| `drift_status` | One of `in-sync`, `source-changed`, `local-adaptation-diverged`, `authority-conflict`, or `boundary-review-required`. |
| `drift_checked_at` | Date or run id of latest drift check. |
| `drift_evidence_ref` | Evidence used for drift state. |
| `boundary_review_ref` | Required when private/public or owner authority is contested. |

## Owner Gates

| Gate | Required when |
| --- | --- |
| definitions-governance | Any term becomes canonical local authority. |
| constitution-governance | The protocol becomes a future-constraining structural rule. |
| decision-gate | Owner conflict, public/private boundary, naming, or contested promotion appears. |
| inventory | Lookup or evidence selectors are needed; inventory cannot promote. |
| ontology-vault | Candidate meaning condensation is useful; ontology cannot promote. |
| source authority owner | Original source semantics are inspected or changed. |

## Drift Failure Modes

- Source-cluster row is mistaken for a canonical CyberAlchemy definition.
- Local adaptation silently overwrites Arcanum source meaning.
- Back-reference points to a promoted definition without a promotion record.
- Drift state is stale after source authority changes.
- Inventory or ontology read models are treated as authority.
- DomainSpec wedge terms are routed into the Arcanum cluster instead of a
  DomainSpec or bridge cluster.
- Structural promotion rules are enforced before constitution-governance
  validates them.
- Private or external evidence is referenced without boundary review.

## Evidence Paths

- `cyberAlchemy-v2/authority/definitions/DEFINITION-LOCALIZATION-ROUTE.md`
- `cyberAlchemy-v2/authority/definitions/source-clusters/arcanum.md`
- `cyberAlchemy-v2/authority/promotion-policy.md`
- `cyberAlchemy-v2/development/refinement-runs/20260621T030752Z-definition-promotion-governance/REFINE-DISPATCH.json`
- `.arcanum/inventory/queries/2026-06-21-schema-relationship-invariants/search-sequence.md`

## Handoff Note

Parent synthesis should model origin-reference as a typed, gated back-reference
ledger: source clusters preserve provenance and drift state, while only
definitions-governance may promote a CyberAlchemy v2 local adaptation into canon.
