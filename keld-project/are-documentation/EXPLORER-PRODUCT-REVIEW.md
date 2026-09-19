# Explorer product plan: independent review

Status: candidate planning review, 2026-09-18. No implementation or release claim.
Scope: [product plan](EXPLORER-PRODUCT-PLAN.md), current graph, navigation, saved
state, walkthrough and browser checks. This review makes no source-code changes.

## Assessment

The proposed direction matches the request: one complete connected semantic graph,
workflow focus within that graph, node-attached stories, and explicit highlighted
tour paths. Existing React Flow infrastructure can support it. Current code does
not implement it: one renderer still swaps the selected feature's nodes. Existing
passing tests intentionally assert that smaller graph and cannot establish readiness
for the complete graph. No new tour framework is needed on the available evidence.

The user's confirmed text rule is precise: remove persistent connection labels and
redundant badges; keep node titles. Preserve relationship meaning and capability
limits in accessible descriptions, node stories, and the full guides.

## Findings and required plan corrections

| Severity | Finding and source | Correction and completion condition |
| --- | --- | --- |
| High | Task C finalizes story/tour references while B is still defining canonical IDs and typed relations. Current [featureMaps.ts](src/featureMaps.ts) uses local array identity. | Require B before final C, or split C into drafting after A and binding/validation after B. Every tour node and edge must resolve against the completed canonical graph before F. |
| High | Full-graph fit is not specified. [CanvasGraph.tsx](src/CanvasGraph.tsx) clamps zoom at .35; [canvasWorkspace.ts](src/canvasWorkspace.ts) rejects lower saved zoom. Nine feature regions will exceed the currently tested map dimensions. | D must define total bounds, overview level of detail, focused readable zoom and recovery from an off-screen selection. Coordinate zoom limits with E validation. Prove Show all contains the semantic graph on desktop/mobile; focus restores readable titles and explanation text. Do not make all 88 current parts permanently tiny to claim fit. |
| Medium | Core selection currently opens whole guides through `select`, `route.node` and `documentForNode` in [main.tsx](src/main.tsx). Changing only node rendering leaves legacy/search behavior inconsistent. | A/E must specify navigation precedence and aliases. Direct node selection and search inspect a node; explicit card actions open manuals. Test old `node`, `page=1`, `feature`, `guide`, `card`, article origin and malformed routes individually. Keep explicit full-reader links working. |
| Medium | Camera coordination is assigned to E while D independently builds focus/recovery. Current timers in `CanvasFocus`, `FeatureFocus` and reader return can compete. | Assign a single coordinator contract before integrating D/E: route, tour, manual return and direct selection priorities; cancellation on new requests/unmount; manual-pan handling; measured-node readiness; reduced-motion behavior. Test rapid workflow/step changes and back/forward while a camera move is pending. |
| Medium | The narrative says paused/running/completed, but persistence and URL policy for those states is not defined. Current storage binds all saved state to the generated documentation version. | Define which state survives navigation, reload and content changes. Persist stable tour/step IDs and user layout, not transient DOM state. Validate removed tour steps/graph IDs, prune invalid references, and retain unaffected cards/positions. A reload must not resume motion unexpectedly. Full-reader return must restore focus and the same tour step. |
| Medium | Node-attached content is feasible, but a toolbar alone does not settle keyboard or mobile behavior. [FeatureGraph.tsx](src/FeatureGraph.tsx) currently renders static sections; only some have links. | F/G must define one inspection activation target per node, focus entry/return, Escape behavior, node/edge relation descriptions and non-color emphasis. Test 320px/390px screens, browser zoom, long text and orientation changes. Explanation scrolling must remain inside its own panel; fitting/clamping must keep its owner visibly identifiable without a modal or backdrop. |
| Medium | Current budgets have little decoded-byte space. [documentationContent.ts](src/documentationContent.ts) imports complete generated guide content, while the new node stories add more prose. Existing tests measure scrolling, not complete-graph tour transitions. | Audit route import boundaries before adding all stories. If lazy loading is used, include visited workflow/tour payloads in measurements; do not conceal transfer behind initial-route checks. Start a full-graph layout/render spike after B, before polishing F/G. Use the final H gate for regression and measured interaction timing. |
| Medium | Existing [feature-map-proof.mjs](scripts/feature-map-proof.mjs) and [explorer-layout-proof.mjs](scripts/explorer-layout-proof.mjs) assert selected-map counts. They also require prototype status in the toolbar that the design intends to simplify. | Replace those assumptions with stable full-graph ID sets and real connectivity checks across all workflows. Test prototype/off-by-default facts in the relevant node explanation rather than requiring the redundant badge to remain. Retain single-renderer, saved-card, scrolling, mobile and no-modal regressions. |
| Medium | Complete-page failure/recovery states are underspecified. [main.tsx](src/main.tsx) has loading text and unknown-route notices, but a new content/state model adds more ways to lose the user's place. | Add reachable empty-search, unknown/removed node or tour, corrupt/blocked storage, failed lazy-load with retry, completed/restarted tour and hidden-sidebar states to G/H. Test keyboard focus remains recoverable after reset, sidebar hiding and reader return. |
| Low | [GuidedWalkthrough.tsx](src/GuidedWalkthrough.tsx) is a landing illustration. [ExplanationPaths.tsx](src/ExplanationPaths.tsx) defaults to live chat and selects that illustration only with `?explanation=walkthrough`. | Explicitly inventory and distinguish Start tour, Try ARE and the existing illustration. Route intended guided-tour CTAs to the explorer controller without replacing live chat. Do not claim an existing explorer modal must be deleted; current code opens a guide card, not a modal. |

## Semantic and layout review constraints

The inventory reports nine maps, 88 local parts and 95 local relations before
deduplication. Names such as Runtime journal, Reasoning State and Secret provider
repeat. Identical titles alone do not prove identical lifecycle roles; different
titles can also refer to the same concept. A must produce an explicit identity
mapping and source-backed edge classification. Shared concepts should connect
regions; decorative associations must not impersonate execution flow. Exclude
optional guide cards from semantic connectivity and Show all bounds unless the
user explicitly chooses a workspace-wide fit.

The engine graph can contain cycles. Only the implementation plan is required to
be a DAG. Weak connectivity is appropriate for the conceptual overview, while
directed tour transitions need separate documented support. A tour can explain a
branch or recovery transition, but should not invent a causal edge to form a line.

Node identity, graph membership and stored positions should remain stable while
workflow emphasis changes. If view-level culling or overview detail reduction is
needed for performance, retain the complete semantic model and accessible node
index; do not revert to swapping feature datasets.

## Recommended dependency adjustment

A → B → C (final story/tour bindings). B also unlocks D and E after their shared
camera/state contract is fixed. Add an early full-graph layout/download/render
check after B/D; F depends on C, D and E. G follows integrated F; H remains the
complete verification gate; I remains product review and candidate preparation.
Story drafts may proceed after A, but are not final references until B resolves.

## Review completion and limits

Source inspection and plan review are complete. Findings are recommendations for
the parent planner to integrate. No browser benchmarks were rerun and no new UI
behavior was implemented by this review. Product readiness requires the planned
implementation and measured evidence; previous selected-map scores do not suffice.

## Final consistency check

The updated plan incorporates the two high, seven medium and one low findings.
The DAG, task dependency table and execution order now agree: final story bindings
follow B, layout/zoom evidence precedes E, and F waits for C/D/E. The explicit route
and state contract resolves competing focus requests, reload behavior and full-reader
return. The early full-graph spike, complete-graph assertions and payload accounting
address the scale and budget risks. Whole-page recovery and input-method checks
are included. No unresolved planning blocker was found in this final review.

Disposition: coherent candidate plan, ready to present for implementation direction.
This is a planning review only, not implementation acceptance or release approval.
During F/G, keep Escape/close and one clear keyboard activation target per node
explicit in component acceptance checks. The no-remount requirement across manual
return also needs an intentional route-lifetime design: current `main.tsx` unmounts
the explorer on article navigation, so preserving only saved data is not proof of
preserving the renderer. Both belong to the planned navigation/attachment work.

## Open Questions

- Canonical concept merges and source-backed region connections remain owned by A/B.
- The minimum supported viewport and reference timing device remain owned by G/H.
- Exact state/URL precedence and tour restoration policy must be resolved in E
  before F integration; these are implementation decisions within the stated plan.
