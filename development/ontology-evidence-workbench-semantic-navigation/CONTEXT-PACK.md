# Context Pack: OEW Semantic Navigation

## Context Builder Result

- Task: author a new Invoke Define, Design, and Plan package for the verified
  OEW UX/UI change requests
- Mode: standard
- Files selected: 14
- Obligation coverage: complete for authoring
- Runtime handoff: none; execution-time Context Builder evidence is deferred
- Inventory: `.arcanum/inventory/index.json` validated with
  `lookup_readiness=ready`; Inventory remains a non-authority read model

## Obligations

| ID | Obligation | Evidence | Status |
| --- | --- | --- | --- |
| O-01 | Preserve all 12 verifier-corrected change requests and severity | `../ontology-evidence-workbench-focus-scene/reviews/2026-07-31-ux-ui-quality-loop/findings.md` | covered |
| O-02 | Separate reusable core from Body War profile decisions | `AUDIT-PROTOCOL-CANDIDATE.md`, `BODY-WAR-PROFILE.json` | covered |
| O-03 | Keep exact relation identity/directions/provenance/authority recoverable without color | CR-01, CR-04 | covered |
| O-04 | Use stable color per exact edge type and pattern per presentation relation | CR-01, user clarification | covered |
| O-05 | Replace all-graph entry with projected clusters, portals, Back, and explicit escape | CR-03 | covered |
| O-06 | Make Path complete without implying membership or authority | CR-04 | covered |
| O-07 | Repair focus, contrast, modes, disclosures, copy, counts, and redundant icons | CR-02, CR-05–CR-12 | covered |
| O-08 | Plan a frozen before/after quality-loop rerun without a universal score | `AUDIT-PROTOCOL-CANDIDATE.md` | covered |
| O-09 | Reuse the existing OEW adapter/overlay and shared Playwright runtime | current implementation package and repository policy | covered |
| O-10 | Keep owner choices, human-study residue, and authority ceilings explicit | profile and findings | covered |

## Included selector-level sources

| Source | Selectors | Obligations |
| --- | --- | --- |
| `../ontology-evidence-workbench-focus-scene/reviews/2026-07-31-ux-ui-quality-loop/findings.md` | CR-01–CR-12; Body War versus reusable boundary | O-01–O-10 |
| `../ontology-evidence-workbench-focus-scene/reviews/2026-07-31-ux-ui-quality-loop/BODY-WAR-PROFILE.json` | projection, relation, Path, copy, count, icon and authority contracts | O-02–O-10 |
| `../ontology-evidence-workbench-focus-scene/reviews/2026-07-31-ux-ui-quality-loop/BASELINE-COVERAGE.json` | frozen bindings, task/control/state/mode rows | O-01, O-08 |
| `../ontology-evidence-workbench-focus-scene/reviews/2026-07-31-ux-ui-quality-loop/AUDIT-PROTOCOL-CANDIDATE.md` | repeatable round, matrices, calibration and portability gates | O-02, O-08, O-10 |
| `../ontology-evidence-workbench-focus-scene/design/UX-PLAN.md` | home, portals, Path, edge language, responsive contract | O-03–O-07 |
| `../ontology-evidence-workbench-focus-scene/design/ARCHITECTURE.md` | source/adapter/store/render ownership split | O-03–O-06, O-09 |
| `../../implementation/ontology-evidence-workbench/upstream/overlay/packages/dashboard/src/oew/OewApp.tsx` | current entry shell and controls | O-05, O-07, O-09 |
| `../../implementation/ontology-evidence-workbench/upstream/overlay/packages/dashboard/src/oew/store.ts` | current UI state owner | O-05–O-07, O-09 |
| `../../implementation/ontology-evidence-workbench/upstream/overlay/packages/dashboard/src/oew/oew.css` | current visual tokens/layout | O-04, O-07, O-09 |
| `../../implementation/ontology-evidence-workbench/upstream/overlay/packages/dashboard/src/knowledgeFocusScene.ts` | current focus-scene projection | O-05, O-09 |
| `../../implementation/ontology-evidence-workbench/scripts/validate-body-war-browser.mjs` | current browser witness | O-08, O-09 |
| `../../implementation/ontology-evidence-workbench/scripts/validate-body-war-focus-ab.mjs` | focus-scene A/B precedent | O-05, O-08 |
| `../../implementation/ontology-evidence-workbench/generated/runs/BODY-WAR-ONTOLOGY-001/presentation-graph.json` | admitted Body War presentation fixture | O-03–O-06 |
| `../../implementation/ontology-evidence-workbench/generated/runs/BODY-WAR-ONTOLOGY-001/evidence-sidecar.json` | exact provenance/authority fixture | O-03, O-06 |

## Exclusions

- `projects/body-war/ontology/**` and `cyberAlchemy-v2/ontology/**` are
  read-only authority sources and are not implementation targets.
- The historical focus-scene package is source evidence, not a write target.
- Human comprehension, trust, workload, preference, and task success remain a
  separately authorized human-study lane.
- No package root, dependency topology, external network, promotion, release,
  or deployment work is included.
