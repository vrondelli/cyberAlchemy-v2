# Refine Seed Proposal - Authority Artifact Lifecycle Placement

Status: seed
Owner: refine
Run ID: 20260621T043600Z-authority-artifact-lifecycle-placement
Target: `cyberAlchemy-v2`
Preset: standard
Research mode: research-if-gap-appears

## Operator Intent

Question: should disciplines, definitions, and constitutions lifecycle be inside
ontology? Definitions and constitutions can have more than one provenance,
origin, or source.

## Refinement Objective

Decide the design placement for authority-artifact lifecycle and multi-origin
provenance in CyberAlchemy v2 without mutating ontology, definitions,
constitutions, disciplines, schemas, or promotion records.

The target output is a non-executed design result that answers:

1. What ontology may represent.
2. What lifecycle governance owns.
3. How definitions, constitutions, and disciplines record multiple sources.
4. Which next route should materialize the model.

## Evidence Baseline

- `cyberAlchemy-v2/authority/README.md` says authority lives in the narrowest
  responsible surface: definitions for terms, constitutions for structural
  rules, disciplines for practices, decisions for promotion choices, and specs
  after promotion.
- `cyberAlchemy-v2/ontology/README.md` says ontology can condense meaning and
  prepare promotion requests, but cannot promote itself or redefine authority
  artifacts.
- `cyberAlchemy-v2/authority/constitutions/STABLE-REPOSITORY-CONSTITUTION.md`
  requires authority layer separation and inventory/ontology non-promotion.
- `cyberAlchemy-v2/authority/imports/README.md` requires scattered authority
  material to be staged as candidates before promotion through the owning
  governance route.
- `cyberAlchemy-v2/development/research/2026-06-21-authority-movement-ontology-relations/findings.md`
  keeps the witness ladder separate: source evidence -> inventory evidence ->
  ontology candidate -> owner gate -> `PromotionRecord` -> governed projection.

## Write Scope

Allowed:

- This run folder under
  `cyberAlchemy-v2/development/refinement-runs/20260621T043600Z-authority-artifact-lifecycle-placement/`.
- Stage receipts and subagent receipts inside this run folder.
- Final `RESULT.md`.

Blocked:

- No mutation of `cyberAlchemy-v2/ontology/`.
- No mutation of canonical definitions, constitutions, discipline catalog,
  schemas, source clusters, public Arcanum, or inventory ledgers.
- No lifecycle promotion.

## Done Criteria

- Dispatch route validates.
- Context evidence is selector-linked.
- Subagent critique receipts are joined and closed.
- Result answers the lifecycle placement question.
- Result includes a multi-provenance model and next routes.
- Validation confirms no accidental authority mutation.

## Planned Stage Configuration

1. Context Builder evidence baseline.
2. Invoke Define: define the design question and vocabulary.
3. Interrogation refine-review: test whether the question is answerable.
4. Research decision: local-first; external research only if a named gap appears.
5. Distill: reduce to smallest coherent design unit.
6. Invoke Design: produce the lifecycle placement model.
7. Interrogation refine-design-review: critique boundary and provenance model.
8. Distill Repair: repair the model into a concise protocol.
9. Invoke Plan: non-executed next-route plan.
10. Final Interrogation and Refine synthesis.

## Initial Design Hypothesis

Ontology should not own the lifecycle. Ontology should represent meaning,
source links, lifecycle state, and provenance relationships as queryable
candidates or projections. The artifact lifecycle should remain with the
responsible governance route:

- definitions-governance for definitions,
- constitution-governance for constitutions,
- discipline-governance for disciplines,
- decision-gate for contested ownership, public/private scope, or promotion,
- task-session only after an owner gate authorizes implementation.

Multi-origin material should be modeled as source-backed evidence feeding an
authority artifact, not as ontology becoming the authority artifact.
