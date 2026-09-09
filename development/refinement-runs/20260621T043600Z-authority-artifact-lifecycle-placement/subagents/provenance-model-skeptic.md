# Subagent Receipt - Provenance Model Skeptic

Status: completed
Dispatch ID: 20260621T043600Z-authority-artifact-lifecycle-placement
Agent ID: 019ee87a-6c03-7ef0-8268-2b9e322aab03
Role ID: provenance-model-skeptic
Spawn status: spawned
Join status: completed
Close status: closed
Verdict: FIX

## Evidence Paths

- `cyberAlchemy-v2/development/refinement-runs/20260621T043600Z-authority-artifact-lifecycle-placement/REFINE-SEED-PROPOSAL.md`
- `cyberAlchemy-v2/authority/imports/README.md`
- `cyberAlchemy-v2/authority/constitutions/CONSTITUTION-IMPORT-PACK.md`
- `cyberAlchemy-v2/authority/definitions/DEFINITIONS.md`
- `cyberAlchemy-v2/development/research/2026-06-21-authority-movement-ontology-relations/findings.md`
- `projects/ontology/ARCHITECTURE.md`

## Boundary Rule

Ontology may represent source links, typed meaning, provenance, candidate
lifecycle state, and promotion requests, but lifecycle authority stays with the
owning governance route and its `PromotionRecord` or owner decision.

## Minimal Multi-Provenance Field Model

```yaml
artifact_id:
artifact_kind: definition | constitution | discipline | other
authority_owner: definitions-governance | constitution-governance | discipline-governance | decision-gate
current_status: candidate | active | blocked | deprecated | superseded
sources:
  - source_id:
    source_path:
    source_family:
    source_authority_posture: original-authority | evidence | template | research | generated | unknown
    origin_role: authoring-source | precedent | derivative-source | conflict-source | validation-source
    extraction_scope:
    semantic_delta:
    public_private_posture:
    confidence:
promotion:
  gate_route:
  promotion_record:
  verdict:
  decided_by:
  decided_at:
conflicts:
  - source_id:
    conflict_kind:
    resolution_status:
drift_owner:
ontology_refs:
  candidates:
  projections:
```

## Failure Modes If Lifecycle Lives Inside Ontology

- Authority-by-proximity returns.
- Multiple provenance collapses into one origin.
- Definitions, constitutions, and disciplines lose different owner routes.
- Ontology edges become fake gates.
- Generated maps/read models overwrite canonical authority.
- Unknown-source candidates become easier to reuse than to block.
- Public/private boundary review gets bypassed by a graph projection.
- Lifecycle state drifts away from the artifact owner.

## Residue

- The seed hypothesis is directionally right, but needs an explicit lifecycle
  matrix per artifact kind before schema work.
- ARR-style metadata remains design-scope only.
- The multi-source model needs conflict rules: precedence, derivative wording,
  unknown-source blocking, and drift ownership.
- Disciplines need the same provenance pattern with practice evidence and
  recurring-use validation.

## Reroute

Run constitution-governance for lifecycle matrix and gate rules,
definitions-governance for provenance vocabulary, discipline-governance for
discipline-specific provenance/lifecycle fields, decision-gate for conflicts,
and task-session only after those owner routes pass.
