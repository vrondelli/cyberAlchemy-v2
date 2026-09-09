# Planned Acceptance Contract

These are design-time witness contracts, not executed evidence.

## Exact Body War fixture

- Source denominator: 276 nodes, 301 relations, 39 exact predicates.
- Complete index: 577 typed rows with stable source identities.
- Home fixture: source-owner-defined cluster with 4–24 visible nodes, 3–48 internal relations spanning at least 2 predicates, and at least 2 cut relations leading to at least 2 destination clusters. Focus caps are 32 nodes, 64 internal relations, and 16 Grouped Portals.
- Parallel-edge fixture: two different source relation IDs sharing endpoints survive compilation, layout, rendering, inspection, Path, and index.
- Portal fixture: at least one Grouped Portal has 2+ constituent relations with mixed source/traversal direction.

## Deterministic validators

1. Source/view schema and digest validation.
2. Total node/relation/evidence mapping; no tuple deduplication.
3. View Pack is the sole membership authority: every admitted node occurs in exactly one cluster, cluster IDs/default are unique and total, and scene cluster membership equals its visible compiled subset.
4. Internal + cut relation partition equals admitted source relation set for the scene query.
5. Portal constituent union equals cut relation set exactly once; each constituent reconstructs its exact relation, inside/outside endpoint, source/traversal direction, and destination cluster.
6. Canonical SceneGeometry (ID-sorted, 0.25px precision) is byte-equal for pinned scene/options/nonzero seed/ELK 0.9.3/worker mode.
7. Full Index contains 276 nodes + 301 relations.
8. OEW UI API inventory binds `domainspec-ui-profile/v0.1`, its profile schema, all nine UI candidate formation schemas, and canonical DS-D1.13 Mapping formation by exact path/digest with `development-only` and `authority_effect: none`; every typed instance carries all required formation fields using native JSON booleans, individual source confidence, owner module, runtime symbol, realization SWU, and its formation digest.
9. Ten Action instances map bijectively to all ten `SemanticIntent.kind` literals; View Models preserve source refs and reject domain authority; Guards reject decision authority; only durable records become Bindings; `PathRequestForm` owns the complete aggregate while passive filtering remains Component behavior.
10. UI Adapter produces zero node kinds and resolves to six Mapping specializations; every Mapping declares source schema, target schema, direction, and nonempty deterministic field transforms; State Indicator stays split; Scene and Semantic Intent schema digests remain unchanged; owned snapshot digest equals the source profile digest; shipped runtime has no `projects/domainspec-v2/` dependency.
11. Each consumer SWU reports conformance to its exact inventory contract IDs; SWU-021 verifies 57/57 records due through G3 and SWU-023 verifies 58/58 complete records including `StaticProjection` and all six Mappings.

## Browser gates

- Exactly one rendered spatial path per scene relation ID.
- Each path has nonzero geometry, attaches within 4px to both declared endpoint boundaries, and its marker endpoint is within 4px of the target attachment.
- Exact predicate label, color token, pattern token, and direction phrase resolve per relation.
- Every node displays a valid node-kind icon and adjacent text.
- Portals show cluster icon/name/purpose/counts and expose all exact constituents.
- Path view shows every relation-bearing hop and selecting a hop highlights the same relation ID and evidence.
- Inspector does not occlude selected endpoints at desktop widths; narrow sheet is modal, titled, closable, focus-trapped, and returns focus.
- Portal navigation and Back restore every Navigation Frame field and the initiating control, reject stale graph/View Pack digests, and exercise cancellation plus deterministic focus fallback.
- 390px, 200% text, forced-colors, reduced-motion, keyboard-only, no-JS static/print, and graph-renderer failure fallback are tested.
- Page/browser errors, horizontal document overflow, disconnected marker definitions, and inaccessible controls are zero.

## Mandatory negative fixtures

| Mutation | Expected failure |
|---|---|
| Replace spatial relation path with card/pill | `RELATION_GEOMETRY_MISSING` |
| Remove marker | `DIRECTION_MARKER_MISSING` |
| Remove node-kind icon | `NODE_KIND_CUE_MISSING` |
| Flatten portal constituents into individual buttons | `PORTAL_GROUPING_LOST` |
| Generalize exact predicate label | `EXACT_PREDICATE_LOST` |
| Give two exact predicate types one color token | `PREDICATE_COLOR_COLLISION` |
| Restore node only, not full frame | `NAVIGATION_FRAME_NOT_RESTORED` |
| Deduplicate parallel relations by tuple | `RELATION_MAPPING_NOT_TOTAL` |
| Hide complete record from index | `FULL_INDEX_NOT_TOTAL` |
| Cover selected endpoints with inspector | `INSPECTOR_OCCLUSION` |
| Admit a framework-named umbrella Component | `UI_COMPONENT_FORMATION_FAILED` |
| Admit name-only Hook or edge-only Binding | `UI_CONTRACT_FORMATION_FAILED` |
| Give a Guard decision authority | `UI_GUARD_AUTHORITY_VIOLATION` |
| Create Adapter node or collapse State Indicator | `UI_PROFILE_REPRESENTATION_COLLAPSE` |
| Drop or duplicate Action-to-intent mapping | `UI_ACTION_INTENT_NOT_BIJECTIVE` |
| Omit a required formation field, owner module, runtime symbol, or realization SWU | `UI_CONTRACT_FORMATION_FAILED` |
| Encode a formation boolean as a string | `UI_CONTRACT_FORMATION_FAILED` |
| Omit/malformed Mapping source, target, direction, or field transform | `UI_MAPPING_FORMATION_FAILED` |
| Drift 57/57 or 58/58 terminal conformance denominator | `UI_CONFORMANCE_NOT_TOTAL` |
| Change the owned snapshot or import the DomainSpec checkout at runtime | `UI_PROFILE_RUNTIME_BOUNDARY_VIOLATION` |

## Performance and Path admission

Fail-closed prototype caps: Path returns at most 8 paths of 8 hops and completes within 250ms; initial layout completes within 2,000ms; committed focus transition within 500ms; non-layout input-to-visible-state within 100ms; no post-layout long task exceeds 200ms; renderer heap delta is at most 150 MiB. Measure against the exact 276/301 bundle plus worst-case admitted home/focus/Path scenes in pinned Node 22.12.0, pnpm 10.6.2, Playwright 1.59.1, Chromium 1217, React Flow 12.10.1, and ELK 0.9.3.

These numbers are prototype admission budgets, not observed performance claims. Failure blocks React Flow activation and preserves linear/index operation; Cytoscape cannot activate until a separately pinned conformance receipt passes.

## Build migration gate

`BUILD-MIGRATION.md` is mandatory. Static analysis must prove zero compiled/minified asset replacement, the source manifest must enumerate all source inputs/outputs, an empty-workroot rebuild must reproduce the canonical tree digest, and local cutover/rollback must leave the retained baseline untouched.
