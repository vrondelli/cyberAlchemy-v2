# Precedent and ownership review — round 1

Verdict: pass with bounded ownership residue.

Portal cards survive as build-from-owned design inference. The ranked Path comparator has Pathfinder precedent, while Body War relation-bearing derivation, deterministic identity, and selected projection remain novel attempts. Compound regions stay deferred: React Flow grouping supplies relative positioning, not semantic/DOM containment or subflow layout.

Exact owners:

- graph load/store: upstream `App.tsx` and `store.ts`;
- membership, crossings, portal records, pure derivation: `knowledgeFocusScene.ts` or one adjacent bounded module;
- committed navigation/query state: exact new fields in `store.ts`, not a new store;
- portal UI: `KnowledgeFocusPortals.tsx`;
- Path UI: existing `PathFinderModal.tsx`, refactored away from local BFS/result ownership;
- trigger/focus return: `App.tsx` plus `PathFinderModal`;
- layout/viewport/edge orchestration: `KnowledgeGraphView.tsx`;
- concept card: `CustomNode.tsx`;
- lossless adapter preservation: `body-war-adapter-writer.mjs`;
- gateway: current authenticated immutable routes; no new backend;
- tests: extend `focus-scene.test.mjs` and `validate-body-war-focus-ab.mjs`;
- legend: a new stateless `KnowledgeSceneLegend` under `KnowledgeGraphView`, not an existing owner and not a state owner.

Residue:

1. lossless relation identity is implementation-blocking;
2. bind navigation owner to exact `store.ts` fields/reducer;
3. current Back is not exact frame restoration;
4. Path scope/invalidation must be explicit;
5. legend is new, not deployed;
6. keyboard/focus, forced-colors, narrow viewport, Path/no-path, restoration, and legend witnesses are planned only.

Reject generalized cluster engine/layout/state machine/ontology grouping/accessibility manager/gateway route/hidden full graph/imported structural ELK.
