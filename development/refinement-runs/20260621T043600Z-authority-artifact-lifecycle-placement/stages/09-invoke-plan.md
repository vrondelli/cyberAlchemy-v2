# Stage 09 - Invoke Plan

Status: pass
Capability: invoke
Mode: plan
Run ID: 20260621T043600Z-authority-artifact-lifecycle-placement

## Non-Executed Plan

This plan does not mutate authority artifacts. It names the next owner routes
needed to materialize the design.

## Recommended Sequence

1. `constitution-governance`: define the artifact-kind lifecycle matrix and
   gate rules for definitions, constitutions, disciplines, specs, and decisions.
2. `definitions-governance`: define provenance vocabulary only, especially
   `source authority posture`, `origin role`, `origin constraint`,
   `origin back-reference`, `semantic delta`, `promotion record`, and
   `drift owner`.
3. `discipline-governance`: add discipline-specific provenance/lifecycle
   fields and decide whether disciplines need their own import/source-ledger
   surface.
4. `decision-gate`: use only when source ownership, public/private posture,
   conflict resolution, naming scope, or reuse scope is contested.
5. `task-session`: after owner routes pass, materialize schemas, fixtures,
   relation registry rows, source-cluster origin rows, or generated ontology
   projections.

## Mutation Blockers

- No ontology mutation before lifecycle matrix and provenance vocabulary pass.
- No schema for ARR or lifecycle envelope before owner route.
- No generated projection before the owner-held envelope exists.
- No discipline lifecycle promotion before discipline-governance adds evidence
  posture for recurring practices.

## Minimal Future Work Package Shape

```text
WORK-PACK: authority artifact lifecycle envelope
  SWU-1: lifecycle matrix through constitution-governance
  SWU-2: provenance vocabulary through definitions-governance
  SWU-3: discipline provenance route through discipline-governance
  SWU-4: decision-gate templates for contested source sets
  SWU-5: task-session schema/fixture implementation after gates pass
```

## Plan Verdict

Pass. Ready for final synthesis; not ready for implementation.
