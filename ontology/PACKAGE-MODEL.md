# Ontology Package Model

Status: candidate
Owner: CyberAlchemy v2 ontology route
Invoke mode: design

## Purpose

The ontology package is the CyberAlchemy base repository's candidate authority
model package. It makes authority structure explicit enough for downstream
projects to construct above the base without treating ontology as the owner of
authority.

The package models authority. It does not decide authority.

Private project witness material may support package modeling through
[SOURCE-SURFACE-CROSSWALK.md](SOURCE-SURFACE-CROSSWALK.md). Such material is
source context only unless an owner route promotes a specific claim, pattern, or
projection.

## Source Contracts

| Contract | Source | Use |
| --- | --- | --- |
| SC-1 | [../authority/definitions/DEFINITIONS.md](../authority/definitions/DEFINITIONS.md) | Local definitions for CyberAlchemy v2, ontology, typed coupling, residue, and stable repository objective. |
| SC-2 | [../authority/promotion-policy.md](../authority/promotion-policy.md) | Promotion ladder and owner gates. |
| SC-3 | [../development/research/2026-06-21-ontology-package-consolidation-model/findings.md](../development/research/2026-06-21-ontology-package-consolidation-model/findings.md) | Revised verdict for the candidate authority-model package. |
| SC-4 | [../development/research/2026-06-21-authority-node-relationship-taxonomy/findings.md](../development/research/2026-06-21-authority-node-relationship-taxonomy/findings.md) | Authority-kind, posture, lifecycle, relation, and projection boundary. |
| SC-5 | [../development/refinement-runs/20260621T043600Z-authority-artifact-lifecycle-placement/RESULT.md](../development/refinement-runs/20260621T043600Z-authority-artifact-lifecycle-placement/RESULT.md) | Authority artifact lifecycle envelope and multi-provenance rule. |
| SC-6 | [SOURCE-SURFACE-CROSSWALK.md](SOURCE-SURFACE-CROSSWALK.md) | Private-parent `projects/ontology` witness map; source-context only, not package law or promotion authority. |

## Package Boundary

In scope:

- candidate authority object model
- candidate relation model
- candidate lifecycle model
- authority-kind and authority-posture models
- taxonomy and relationship crosswalks
- ontology, system, and bridge views
- read-model projection rules
- promotion-request staging rules

Out of scope:

- live vault `node_type` creation
- vault `## Connections` edge creation
- schema amendment
- movement-edge creation
- runtime contract definition
- generated mirror authority
- promotion verdicts
- public/private release decisions

## Authority Law

The package may create candidate concepts and read-model rows. Every transition
from candidate meaning into authority remains owned by the relevant route:

| Authority movement | Owner route |
| --- | --- |
| Candidate term -> local definition | definitions-governance |
| Candidate structural rule -> local constitution | constitution-governance |
| Candidate recurring practice -> discipline | discipline-governance |
| Contested scope, ownership, naming, or public/private posture | decision-gate |
| Ready implementation mutation | task-session after owner gates pass |
| Schema, edge, or vault-type change | schema governance / decision-gate before task-session |

## Core Package Model

```text
source evidence
  -> inventory/import evidence
  -> ontology candidate concept
  -> authority artifact lifecycle envelope
  -> owner route/profile
  -> owner decision or PromotionRecord-compatible record
  -> authority artifact or blocked/deferred record
  -> optional ontology projection/read model
```

Ontology participates twice:

- before the gate, as candidate meaning and relation modeling;
- after the gate, as an optional read model of allowed authority state.

It does not sit inside the owner decision.

## Candidate Record Shape

```yaml
candidate_id:
artifact_kind:
authority_kind:
authority_posture:
source_refs:
owner_route:
evidence_posture:
current_status:
confidence:
  evidence_confidence:
  commitment_confidence:
promotion_handle:
challenge_contract:
  challenge_response:
  valid_challenge_modes:
  contradiction_edges:
  validation_edges:
  owner_route:
  resolution_gate:
  blocking_questions:
  challenge_residue_route:
conflicts:
drift_owner:
ontology_refs:
  candidates:
  projections:
projection_effect:
residue:
```

This is a package-level model shape. It is not a live schema.

## Design Views

| View | File | Responsibility |
| --- | --- | --- |
| Ontology view | [views/ontology-view.md](views/ontology-view.md) | Candidate meaning, typed concepts, and authority structure. |
| System view | [views/system-view.md](views/system-view.md) | Runtime, envelope, ledger, projection, and evidence boundaries. |
| Bridge view | [views/bridge-view.md](views/bridge-view.md) | Links meaning to evidence and owner gates without authority-by-proximity. |

## Dispatch Technique Trace

| Technique | Applied to | Validation expectation |
| --- | --- | --- |
| `sequence` | Source evidence -> model docs -> projections -> promotion requests. | Later files consume earlier model boundaries. |
| `owner_boundary_check` | All authority claims. | Files state which owner decides. |
| `artifact_contract_bridge` | Package files and crosswalks. | Each artifact states whether it is candidate, projection, or deferred schema. |
| `concrete_path_evidence` | Source contracts. | Load-bearing claims cite local paths. |
| `authority_split_gate` | Authority vs ontology boundary. | Ontology models; owner routes decide. |
| `residue_ledger` | Deferred schema, movement, and validator work. | Gaps name owner and next route. |

Full dispatch JSON was not required because this design run writes one bounded
artifact package and does not delegate execution.

## Gate Result

Status: flag

Reason: the candidate authority-model package is coherent and source-backed,
but live schemas, movement edges, append-only authority-ledger validation, and
standalone extraction remain gated follow-up work.
