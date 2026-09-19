# Execution Pack: Unified Ontology Canvas

## Control

| Field | Value |
| --- | --- |
| planningGateStatus | pass |
| mutationGateStatus | idle (no selected SWU) |
| complexity | medium |
| baselineWave | W2 |
| activeLayerWindow | L2 |
| readinessProfile | pilot |

## Waves

| Wave | Layer | Serial units | Exit |
| --- | --- | --- | --- |
| [W0](work-pack/waves/W0-BASELINE.md) | admission | none | live baselines/runtime and one explicit selection |
| [W1](work-pack/waves/W1-GRAPH.md) | L0 | 001 -> 002 -> 003 | graph/layout/routing receipts closed |
| [W2](work-pack/waves/W2-CANVAS.md) | L1 | 004P -> 005 -> 006 -> 007 -> 008 | prototype repair and core canvas receipts closed |
| [W3](work-pack/waves/W3-ACCESSIBILITY.md) | L2 | 009 -> 010 -> 011 -> 012 -> 013 -> 014 -> 015 | accessible/responsive/journey receipts closed |
| [W4](work-pack/waves/W4-VERIFY.md) | L2 close | VERIFY | full product-read-only rerun receipt |

Only one SWU executes at a time. Each HTML SWU runs its exact browser-harness
mode before closeout; the harness owns a task-local loopback server and stops it.

## Live Progress

- W0 admission: `pass` for the active first-blocker chain.
- W1: `SWU-UOC-001-003` closed `PASS`.
- W2: historical `SWU-UOC-004` remains `BLOCK` and superseded. Corrective
  `SWU-UOC-004P` closed `PASS`: fixed prototype IDs, structural replay, and the
  local static browser receipt all pass without generated checksums. 005 closed
  `PASS` with fixed-graph visibility projections; 006 closed `PASS` with
  explicit trace focus and named gaps; 007 closed `PASS` with exact node/edge
  inspection; 008 closed `PASS` with bounded reversible viewport transforms
  and all inherited modes. W2 is closed; 009 closed `PASS` with exact HTML
  navigator equivalence and search reachability; 010 closed `PASS` with one
  roving keyboard target and deterministic spatial/relation navigation. 011 is
  eligible but unselected, and later units remain dependency-blocked.

## Runtime Constraints

- Existing Node runtime and dependency-free modules only.
- Shared Playwright installation; no package root/dependency added for it.
- Loopback-only exact experiment directory; zero external requests.
- Fixed prototype IDs and `prototype-unverified`; no browser-generated source,
  graph, node-layout, or layout checksums. A Node hashing server is deferred.
- Preserve unrelated dirty files; no Git action without separate request.

## Completion Ceiling

W4 proves only local candidate recomposition for the supplied bundle and named
assertions. It cannot prove source-adapter behavior, broad accessibility
conformance, ontology promotion, release, deployment, or production readiness.
