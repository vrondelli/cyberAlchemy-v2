# Context Pack — Unified Ontology View Architecture

This is persisted session evidence for Refine run `20260804T174425Z-unified-ontology-view-architecture`. It is not a canonical ontology or product specification.

## Context Pack Summary

- Task: define, design, and plan a reusable Ontology Evidence Workbench architecture
- Mode: `standard --strict --emit both --handoff runtime`
- Files selected: `14`
- Selector groups: `28`
- Obligation coverage: `100%` for Refine execution
- Approximate noise ratio: `0.10`
- Output markdown: `stages/01-context-builder/CONTEXT-PACK.md`
- Output index: `stages/01-context-builder/CONTEXT-PACK.json`
- Handoff pack: `runtime`
- Strict coverage: `pass`
- Blockers: `0`

## Obligations

| ID | Obligation | Status | Evidence |
|---|---|---|---|
| O1 | Deduplicate all known ontology-view families by architecture, not filename. | covered | Seed inventory plus the confirmed evidence lane. |
| O2 | Explain why the current Body War prototype failed to combine arrows, colors, icons, portals, Path, and evidence. | covered | Full UX audit and exact OEW source components. |
| O3 | Preserve source/view/authority meaning and forbid presentation from becoming ontology authority. | covered | CyberAlchemy ontology-view contract and structured Augmentor/Anime views. |
| O4 | Identify current renderer, layout, navigation, and state ownership seams. | covered | Focus-scene reducer, portal component, evidence workspace, application shell, UOC canvas, and generator. |
| O5 | Use the full Body War graph as an acceptance fixture without making Body War the architecture owner. | covered | 276-node/301-edge presentation graph and whole-system generator. |
| O6 | Compare current graph tools against exact requirements using primary documentation. | covered | Confirmed `graph-tool-evaluator` action; results remain stage-4 evidence. |
| O7 | Keep Refine non-mutating and claim-bounded. | covered | Seed write scope, dispatch boundary evidence, and authority contracts. |
| O8 | Produce a non-executed architecture and atomic implementation Work Pack with real browser gates. | covered | Seed done criteria and audit's required correction/acceptance sections. |

## Selected Context

| Source and selector | Why included | Obligations |
|---|---|---|
| `REFINE-SEED-PROPOSAL.md` — Refined objective, architecture questions, done criteria | Owns this run's exact output and claim ceiling. | O1–O8 |
| `VIEW-SURFACE-CANDIDATES.md` — family table and initial synthesis pressure | Deduplicates 60 discovered surfaces into 10 architectural families. | O1, O4 |
| `STRATEGY-INVENTORY-PACKET.md` — selected evidence, gaps, design consequences | Routes accepted earlier findings without turning Inventory into proof. | O1, O2, O6 |
| `output/playwright/ux-validator/20260804T150915Z-body-war-oew-full-architecture-audit/summary.md` — Outcome, Why it happened, Required architecture correction | Exact negative acceptance baseline: two incompatible renderers and count-only acceptance. | O2, O4, O5, O8 |
| `cyberAlchemy-v2/ontology/views/ontology-view.md` — View Role, Allowed Claims, Forbidden Claims | Establishes that a view represents candidate meaning and cannot promote or mutate ontology authority. | O3, O7 |
| `upstream/overlay/.../knowledgeFocusScene.ts` — `deriveKnowledgeFocusScene`, `toPortal`, `reduceKnowledgeFocusState` | Proves cut edges become one portal each and navigation remembers node IDs, not complete presentation/focus frames. | O2, O4 |
| `upstream/overlay/.../KnowledgeFocusPortals.tsx` — portal list and Back control | Proves flat relation-button rendering, no destination-cluster grouping, icon contract, or exact focus restoration. | O2, O4 |
| `upstream/overlay/.../oew/EvidenceWorkspace.tsx` — fixed `position`, `GraphSurface` | Proves four hard-coded positions and relation `<button>` elements instead of spatial SVG/canvas edges. | O2, O4 |
| `upstream/overlay/.../oew/OewApp.tsx` — Navigator, view state, deep-link state | Locates evidence inspector, full outline/table, filters, tour, receipts, and keyboard ownership that should survive renderer replacement. | O3, O4 |
| `projects/body-war/ontology/whole-system/scripts/generate-oew-frontend.mjs` — normalization, encoding, asset patching | Shows 39 exact predicate tokens and lossless source sidecar coexist with compiled-asset string surgery and compressed presentation relations. | O2, O3, O5, O8 |
| `projects/body-war/ontology/whole-system/frontend/oew-data/presentation-graph.json` — nodes and edges | Full acceptance denominator: 276 presentation nodes and 301 presentation edges; edge descriptions retain exact predicates. | O5, O8 |
| latest UOC candidate `architecture-ontology-view.html` — graphics-document SVG, edge/node layers, roving keyboard, trace derivation | Demonstrates reusable SVG arrow markers, explicit typed edge layer, pan/zoom, deterministic keyboard navigation, dialogs, and trace focus. | O1, O4, O8 |
| `projects/augmentor/ontology/unified-agent/views/README.md` — interpretive views and reading rules | Demonstrates multiple task views over one shared graph with explicit meaning/system/evidence/bridge roles. | O1, O3 |
| `projects/animejs/ontology/agent-knowledge-vault/views/task-recipes.json` — digest-bound derived view | Demonstrates a deterministic non-visual task projection that should remain loadable through the same view-pack seam. | O1, O3 |

## Architecture Guidance

### Evidence

- The existing semantic data path already preserves source nodes, source relation IDs, exact predicates, evidence refs, authority effect, and mapping loss in the sidecar.
- The implementation split occurs after that boundary: focus navigation and evidence inspection project different scene shapes into different rendering mechanisms.
- The focus portal reducer stores only a target node and source-node history. It cannot restore cluster, selected relation, filter, viewport, panel, initiating control, or focus target.
- The Body War generator generates data deterministically, then patches a retained minified frontend. This makes data evidence stronger than frontend ownership.
- The latest UOC canvas proves repository-local SVG mechanics for arrow markers, typed edge layers, pan/zoom, roving focus, and relation-directed keyboard navigation, but remains a separate fixed-canvas candidate.
- Augmentor and Anime.js show why the workbench needs a view-pack contract: a view can be meaning, system, evidence, bridge, task, coverage, or gaps without becoming a separate ontology.

### Inference to test

One lossless `KnowledgeScene` should sit between governed view/source records and all presentation surfaces. A renderer adapter should consume spatial scene primitives, while inspectors, table/outline, Path, portals, and static export consume the same scene/query state without owning semantic truth.

## Constraints and Non-goals

- No ontology, product, dependency, generated bundle, lockfile, Git, deployment, or external-state mutation in Refine.
- No selection by tool popularity or generic feature checklist.
- Do not collapse exact predicate into display class, source direction into traversal direction, source view into focus scene, cluster into tour step, portal into cut edge, or Inspector into semantic authority.
- Do not claim human comprehension, screen-reader quality, full WCAG conformance, production readiness, or a working frontend.

## Gaps and resolutions

| Gap | Resolution for this run |
|---|---|
| Tool capabilities are temporally unstable. | Confirmed bounded primary-source evaluator; stage 4 owns current citations. |
| Sixty discovered surfaces contain generated duplicates. | Local cartographer must classify families and retain exact source posture. |
| Current working tree contains user-owned changes. | Read-only inputs; Refine writes only inside this run folder. |
| Human comprehension is unproved. | Keep separate learner protocol and human-study residue after structural acceptance. |

## Authority precedence

Direct source and current browser evidence outrank Inventory summaries. Ontology/view owner contracts outrank presentation convenience. Refine can author design and plan evidence but cannot promote or implement them.

## Fallback exploration rule

Expand beyond selected files only to close a named obligation, cite the exact path/selector, and preserve read-only scope. Generated/staged duplicates must never become independent architecture candidates.
