# Synthesis — OEW workbench visual language

Agent: Shannon, Claude  
Action: `spawn-0004`  
Status: pass, read-only

## Selected concept

Select a **bounded business-context home with explicit full-graph access**.

The initial state should show a reversible 3–6-node source-backed Body War context, one-sentence purpose, labeled portals, and a separate action:

`Overview — all 237 nodes`

This removes the implicit all-node black box, retains intentional complete-graph access, reuses the executed focus-scene mechanism, does not require tour completion, and gives search an orienting context.

| Concept | Decision | Reason |
|---|---|---|
| Tour-first shell | KILL as default; KEEP as optional `Learn — guided tour` | Tour works, but forces workflow before orientation |
| Bounded context plus explicit Overview | SELECT | Reuses focus derivation, preserves reversibility, and makes scope explicit |
| Search-first projection | DEFER | Search works, but novice query-formulation evidence is absent |

## Decision matrix

| Area | Decision | Exact binding and status |
|---|---|---|
| Freshness | Replace checkout prose with prototype provenance: pinned upstream/build handle, adapter receipt, `authority_effect=none`. Suppress old warning only with adjacent provenance. | `serve-oew-prototype.mjs#/staleness.json`; `App.tsx:196-216`; `StalenessBanner.tsx:33-39,100-178`; bound current problem, final payload/copy deferred |
| Initial projection | Enter a source-backed bounded context when no tour/focus is active | `knowledgeFocusScene.ts:127-155`; focus-patch display selection; bound |
| Full graph | Add explicit `Overview — all 237 nodes`; do not overload persona or Unfocus | `App.tsx`/`PersonaSelector.tsx`; seam bound, transition unexecuted |
| Primary card icon | Key only from `concept_role`: authority, evidence, workflow, projection; retain exact text | ontology node role; `concept-role:*`; `CustomNode.tsx`; patch node mapping; semantic key bound, artwork deferred |
| Business kind | Exact visible text chip; no kind icons in slice 1 | `business_kind`; `business-kind:*`; bound |
| Candidate/authority/evidence | Separate textual badges/details; no primary-icon collapse | current tags, authority and evidence fields; source-authority/confidence fidelity deferred |
| Edge identity | Preserve source reference independently of styling and predicate | sidecar `source_ref`; bound |
| Relation style | Small deterministic family keyed by presentation relation; color subordinate to line pattern | `EDGE_STYLES`; edge `type`; `presentation_relation`; bound |
| Exact relation name | Source predicate inline in bounded scenes and keyboard/pointer recoverable elsewhere; never hover-only | edge `description`; `source_relation`; bound |
| Direction | Marker(s) plus textual `→`/`↔`; no semantic animation | projected direction; source fidelity deferred pending `source_direction` |
| Legend | Scene-local: presentation styles, predicates present, direction, and status/evidence cues | presentation layer; concept bound, component/copy unresolved |
| Unique-per-edge color | KILL | no source owner, no scaling to 231, semantic collapse, color-only risk |
| Panels | Reserve canvas or collapse one panel on desktop; one focus-managed sheet at narrow widths | portal/right-panel owners; problem bound, breakpoints deferred |
| Forced colors/motion | System-color boundaries/markers/patterns; disable nonessential relation animation | portal CSS plus graph renderer; requirement bound, graph witness unverified |

## Control disposition

- Overview: rename and give explicit complete-graph scope.
- Learn: keep as `Learn — guided tour`.
- Deep Dive: keep as `Deep Dive — code-focused view`; do not imply graph scope.
- Diff OFF: remove from normal home or defer while gateway has no diff.
- All: move under filters and rename `Knowledge nodes`.
- Filter: keep in advanced tools as `Filter — narrow nodes`.
- Export: defer from learning home; retain in advanced tools.
- Path: defer from learning home; retain in advanced tools.
- Theme and keyboard help: keep in utilities.
- Search: keep.
- Fuzzy: make the implementation default rather than a prominent mode.
- Semantic: KILL as a distinct visible capability until it differs from fuzzy.
- Freshness: replace with prototype provenance.
- React Flow controls: keep as canvas navigation.
- Info/Files: keep in evidence/details.
- Start Tour: keep under Learn.

## Smallest separately authorized prototype slice

1. Bounded initial context using the focus-scene state machine.
2. Explicit full-graph Overview.
3. Truthful prototype provenance.
4. Four role icon families plus exact role text; business kind text-only.
5. Two presentation-relation styles (`builds_on`, `related`) using color, pattern, predicate labels, direction markers/text, and scene-local legend.
6. Header truthfulness: remove/defer Diff, hide false Semantic distinction, clarify Overview/Learn/Deep Dive.
7. Desktop and narrow-width panel non-occlusion behavior.

Source targets:

- `packages/dashboard/src/knowledgeFocusScene.ts`
- `packages/dashboard/src/App.tsx`
- `packages/dashboard/src/components/PersonaSelector.tsx`
- `packages/dashboard/src/components/CustomNode.tsx`
- `packages/dashboard/src/components/KnowledgeGraphView.tsx`
- `packages/dashboard/src/components/KnowledgeFocusPortals.tsx`
- `serve-oew-prototype.mjs`
- accepted focus-scene overlay/patch owner

Test targets:

- `test/focus-scene.test.mjs`
- Body War A/B browser runner
- gateway provenance-response tests
- component/state tests for renamed controls and removed false claims

## Acceptance

Automated checks must establish:

- bounded home of 3–6 fixture nodes, never 237;
- explicit Overview restores 237/231;
- Start Tour preserves 4/0/6;
- portal/Back retain exact predicate and direction;
- asserted label, enabled state, and effect for every visible control;
- four deterministic role icon families plus exact text;
- `builds_on` and `related` differ by pattern as well as color;
- predicates and direction available to pointer and keyboard;
- forced-colors retains boundaries, patterns, markers, labels, and focus;
- reduced motion removes nonessential animation without semantic loss;
- desktop/narrow focus not entirely obscured and panel closure restores focus;
- provenance never equates graph-commit availability with ontology validity.

Human evidence requires the counterbalanced eight-person protocol from the UX explorer. Automated success proves mechanics only.

Unresolved: exact home node set, final provenance payload/copy, icon artwork/names, legend owner/copy, full-graph keyboard traversal, lossless source-direction/authority/confidence fields, responsive breakpoints, novice results, and screen-reader results.

No implementation, ontology correctness, promotion, release, deployment, production, comprehension, or accessibility-conformance claim is authorized by this synthesis.
