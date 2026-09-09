# Context Pack — OEW UI Profile API Admission

- Task: Invoke Refresh of the UOVA Work Pack
- Mode: standard, strict
- Files selected: 9
- Obligation coverage: 7/7
- Authority: session evidence only

## Obligations

| ID | Obligation | Evidence selectors | Status |
|---|---|---|---|
| O1 | Keep `KnowledgeScene` as the renderer-neutral semantic API | UOVA `ARCHITECTURE.md` sections 2–3; `SCENE-MODEL.schema.json` | covered |
| O2 | Use the implemented DomainSpec development UI profile, not invented UI kinds | `profile.yml`; `profile.schema.json` | covered |
| O3 | Map Page, Layout, Component, View Model, Hook, Form, Action, Guard, and durable Binding | `meta-types.md` UI cards; UI profile architecture representation decisions | covered |
| O4 | Preserve Adapter-as-Mapping and State Indicator split | `profile.yml` DS-D1.24/25; UI profile architecture | covered |
| O5 | Add the smallest independently testable planning unit and dependency gate | UOVA `WORK-PACK.md`, `SWU-MANIFEST.md` | covered |
| O6 | Preserve candidate/development-only/authority-none claims | `meta-types.md` maturity ledger; UI profile result | covered |
| O7 | Define mechanical and negative validation before visible UI implementation | UI profile schema/result; UOVA acceptance and semantic-intent schemas | covered |

## Selected context

1. `projects/domainspec-v2/definitions/meta-types/meta-types.md` — UI maturity ledger and exact candidate laws.
2. `projects/domainspec-v2/impl/spec/ui-profile/profile.yml` — current 11-concept development registry and node/alias/split dispositions.
3. `projects/domainspec-v2/impl/spec/ui-profile/profile.schema.json` — closed machine representation vocabulary.
4. `projects/domainspec-v2/development/ui-profile-implementation/ARCHITECTURE.md` — reuse-the-existing-engine and authority boundaries.
5. `projects/domainspec-v2/development/ui-profile-implementation/runs/SWU-UIP-007/TASK-SESSION-RESULT.md` — mechanical completion and empirical/canonical ceiling.
6. `stages/06-invoke-design/ARCHITECTURE.md` — OEW service/component/API boundaries.
7. `stages/06-invoke-design/SCENE-MODEL.schema.json` — source-owned semantic scene contract.
8. `stages/06-invoke-design/SEMANTIC-INTENT.schema.json` — admitted user-intent vocabulary.
9. `stages/09-invoke-plan/{WORK-PACK.md,SWU-MANIFEST.md}` — current execution frontier and dependency graph.

Inventory lookup was ready and passed all source/projection checks with historical-tag warnings only. Inventory entries were discovery evidence; the direct files above were checked as authority.

## Exclusions

- Candidate experiment corpora: excluded because the implemented profile and terminal task result already state the current mechanical/authority posture.
- UI implementation source: excluded because Refresh changes planning only.
- Body War ontology: excluded because the Scene denominator and acceptance fixture do not change.
- Refine Define/Design outputs: read-only historical inputs; Refresh does not rewrite their fixed-point evidence.

## Resolution

The smallest safe change is a new `SWU-UOVA-007` that materializes and validates an OEW-specific development UI profile after G1 semantic trust. `SWU-UOVA-001` remains the first selected unit because SourceGraph/Scene semantics do not depend on candidate UI types. The new unit gates all visible UI work; current SWUs 007–022 shift to 008–023.
