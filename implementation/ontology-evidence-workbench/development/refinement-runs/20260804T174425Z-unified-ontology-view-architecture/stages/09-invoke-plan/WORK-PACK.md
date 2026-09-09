# Work Pack — Unified Ontology Evidence Workbench

Status: blocked at SWU-UOVA-004; SWU-UOVA-001 through SWU-UOVA-003 completed PASS, while all later units and gates remain incomplete.  
Complexity: high; split output.  
Plan evidence: pass; see [PLAN-DISTILL.md](PLAN-DISTILL.md).  
Selected unit: [SWU-UOVA-004](tasks/TASK-UOVA-01-SCENE-CORE.md#swu-uova-004) remains active but blocked by `BLK-UOVA-004-PORTAL-CONSTITUENT-SCHEMA`.
Completed evidence: [SWU-UOVA-001 terminal Task Session receipt](../../session-evidence/SWU-UOVA-001/20260804T210400Z-attempt-002/receipt.json), [SWU-UOVA-002 terminal Task Session receipt](../../session-evidence/SWU-UOVA-002/20260805T135450Z-attempt-001/receipt.json), and [SWU-UOVA-003 terminal Task Session receipt](../../session-evidence/SWU-UOVA-003/20260805T143141Z-attempt-001/receipt.json). The loader prerequisite is separate evidence; no portal, Path, UI, browser, release, or deployment completion is claimed.
Blocker evidence: [SWU-UOVA-004 terminal Task Session receipt](../../session-evidence/SWU-UOVA-004/20260805T143933Z-attempt-001/receipt.json). Resolving it requires changing either the approved portal constituent schema or the implementation requirement; the fast lane does not authorize either change.

## Objective

Replace the incompatible Body War OEW presentation routes with one lossless Scene Model and source-owned frontend where a digest-bound UI API, real relation paths, arrow markers, exact-predicate colors/patterns/labels, node-kind icons, Grouped Portals, Path, evidence, reversible navigation, and the complete index coexist. Preserve the 276-node/301-relation/39-predicate denominator and eliminate compiled-bundle string surgery.

## Approved design refs

- [Architecture](../06-invoke-design/ARCHITECTURE.md)
- [Scene schema](../06-invoke-design/SCENE-MODEL.schema.json)
- [View Pack schema](../06-invoke-design/VIEW-PACK.schema.json)
- [UI API contract](../06-invoke-design/UI-API-CONTRACT.md)
- [UI API inventory](../06-invoke-design/UI-API-INVENTORY.json)
- [Acceptance](../06-invoke-design/ACCEPTANCE-CONTRACT.md)
- [Build migration](../06-invoke-design/BUILD-MIGRATION.md)
- [R08 repair and toy evidence](../08-distill-repair/DISTILL-REPAIR.md)

## Source boundaries

Permitted product writes are limited to:

- `cyberAlchemy-v2/implementation/ontology-evidence-workbench/upstream/overlay/packages/dashboard/src/**`
- specifically, the OEW-owned compiled UI contract under `src/oew/ui-api/**`; no runtime import from `projects/domainspec-v2/` is permitted;
- `cyberAlchemy-v2/implementation/ontology-evidence-workbench/test/**`
- named OEW overlay/build manifests and locks only when their owning SWU says so;
- `projects/body-war/ontology/whole-system/{views,scripts,tests,frontend,receipts}/**` for Body War-owned adapters, View Packs, generated output, tests, and local receipts.

Forbidden: ontology source mutation, public Arcanum, unrelated projects, credentials, external requests, deployment, promotion, Git publication, and post-build/minified JavaScript patching.

## Task board

| Task | Layer | SWUs | Status |
|---|---|---|---|
| [TASK-UOVA-01 Scene core](tasks/TASK-UOVA-01-SCENE-CORE.md) | L0 | 001–006 | in progress |
| [TASK-UOVA-02 UI API, cues, and geometry](tasks/TASK-UOVA-02-CUES-GEOMETRY.md) | L1 | 007–010 | pending |
| [TASK-UOVA-03 Fallback and spatial renderer](tasks/TASK-UOVA-03-SPATIAL-RENDERER.md) | L1 | 011–012 | pending |
| [TASK-UOVA-04 Navigation surfaces](tasks/TASK-UOVA-04-NAVIGATION-SURFACES.md) | L1 | 013–014 | pending |
| [TASK-UOVA-05 Responsive/accessibility](tasks/TASK-UOVA-05-ACCESSIBILITY-RESPONSIVE.md) | L2 | 015–017 | pending |
| [TASK-UOVA-06 Body War adapter/build](tasks/TASK-UOVA-06-BODY-WAR-ADAPTER-BUILD.md) | L2 | 018–020 | pending |
| [TASK-UOVA-07 Acceptance](tasks/TASK-UOVA-07-ACCEPTANCE.md) | L2 | 021 | pending |
| [TASK-UOVA-08 Reusable projections](tasks/TASK-UOVA-08-REUSABLE-PROJECTIONS.md) | L3 | 022–023 | pending |

Shared unit details: [SWU manifest](SWU-MANIFEST.md). Wave choreography: [Execution Pack](EXECUTION-PACK.md).

## Validation strategy

1. Pure TypeScript/Vitest scene, query, navigation, UI-profile, encoding, and layout fixtures.
2. UI-profile schema/digest validation, action-to-intent bijection, meta-type negative controls, and zero DomainSpec runtime imports.
3. Schema and totality validation against actual Body War graph/sidecar/View Pack.
4. Pinned upstream materialization/build using existing L1 locks.
5. Deterministic Body War generator and zero-surgery scan.
6. Playwright 1.59.1 / Chromium 1217 acceptance at desktop, 390px, 200% text, forced colors, reduced motion, keyboard-only, and renderer-failure fallback.
7. Numeric geometry/path/performance budgets and every named negative fixture.
8. Scoped `git diff --check` only; no commit/push in this pack.

Core commands, refined per SWU without widening scope:

```sh
npm --prefix cyberAlchemy-v2/implementation/ontology-evidence-workbench test
npm --prefix cyberAlchemy-v2/implementation/ontology-evidence-workbench run build:l1
npm --prefix cyberAlchemy-v2/implementation/ontology-evidence-workbench run verify:l1-build
node --test projects/body-war/ontology/whole-system/tests/whole-system-oew-frontend.test.mjs
node projects/body-war/ontology/whole-system/scripts/validate-oew-frontend-browser.mjs
git diff --check -- cyberAlchemy-v2/implementation/ontology-evidence-workbench projects/body-war/ontology/whole-system
```

## Gates

- G0: every SWU contract and admission baseline is current.
- G1: L0 scene compiler proves total IDs, membership, partitions, bounded Path, and frame restoration.
- G1U: the exact development UI profile compiles into an OEW-owned UI API; action bijection and negative controls pass; no runtime dependency or authority transfer exists.
- G2: complete linear/index fallback passes before React Flow activation; the React Flow capability receipt then proves separate parallel paths and canonical ELK geometry.
- G3: one source-owned Body War build passes deterministic, negative, responsive, accessibility-state, geometry, and performance gates.
- G4: static and second-project adapters preserve source identity without expanding ontology authority.

Any acceptance-critical failure blocks the current and downstream wave. Cytoscape is not automatically activated; failure degrades to linear/index and routes a separate adapter decision.

## Common Task Session closeout contract

Every mutation-capable SWU must:

1. bind pre-mutation SHA-256/size for every write target plus this Work Pack, its task file, wave file, and `SWU-MANIFEST.md`;
2. admit only its listed source/test/fixture/receipt delta classes;
3. run the exact unit command plus affected upstream/Body War regression and scoped whitespace check;
4. write `session-evidence/<SWU-ID>/receipt.json` with result, files, hashes, commands, raw measurements, blockers, residue, and capability ceiling;
5. synchronize only the SWU row, parent task, wave gate, and Work Pack task board after owner validation;
6. on pass, select the lowest numbered dependency-satisfied SWU; on block, keep the same SWU active with the exact failing evidence; on scope drift, stop and reroute to Invoke Refresh/Decision Gate.

No receipt, preflight, authored test, or generated artifact is completion by itself.

## Residue

- Human comprehension and formal accessibility conformance remain separate evidence routes.
- Deployment/release and ontology promotion remain excluded.
- A performance-budget revision requires observed data and a new design-owner decision; execution cannot silently relax caps.
