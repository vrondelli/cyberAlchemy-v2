# Runtime Handoff - Authority Artifact Lifecycle Placement

Status: prepared
Owner: refine
Run ID: 20260621T043600Z-authority-artifact-lifecycle-placement
Dispatch: `REFINE-DISPATCH.json`

## Objective

Run the approved Refine route for lifecycle placement of definitions,
constitutions, disciplines, ontology representation, and multi-provenance
authority artifacts.

## Strategy Permission

- Operator confirmation: approved.
- Subagent strategy: approved.
- Runtime mode: parent-native stage receipts with approved read-only subagent
  critique lanes.
- External research: not approved by default; use only if a named local evidence
  gap appears and the operator confirms.

## Runtime Boundaries

Allowed write scope:

- `cyberAlchemy-v2/development/refinement-runs/20260621T043600Z-authority-artifact-lifecycle-placement/**`

Read-only evidence surfaces:

- `cyberAlchemy-v2/ontology/**`
- `cyberAlchemy-v2/authority/**`
- `cyberAlchemy-v2/disciplines/**`
- `.arcanum/inventory/**`
- `projects/ontology/**`
- prior research under `cyberAlchemy-v2/development/research/**`

Blocked:

- ontology mutation,
- definition mutation,
- constitution mutation,
- discipline catalog mutation,
- schema mutation,
- promotion records,
- source-cluster edits,
- public artifact edits.

## Required Receipts

Each stage must record:

- stage id,
- capability,
- mode,
- status,
- artifact path,
- validation note,
- residue or blocked reason.

Each subagent receipt must record:

- role id,
- runtime agent id,
- verdict,
- evidence paths,
- boundary rule,
- residue,
- reroute.
