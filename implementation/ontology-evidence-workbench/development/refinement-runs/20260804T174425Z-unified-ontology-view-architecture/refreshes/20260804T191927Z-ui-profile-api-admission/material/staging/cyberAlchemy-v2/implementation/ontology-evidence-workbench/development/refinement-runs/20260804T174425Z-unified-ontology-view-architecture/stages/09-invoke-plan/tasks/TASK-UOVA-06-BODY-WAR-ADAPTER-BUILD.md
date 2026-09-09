# TASK-UOVA-06 — Body War Adapter and Source-Owned Build

Goal: use the full Body War ontology as the exact acceptance fixture while keeping projection authority local and build ownership explicit.

Write scope: `projects/body-war/ontology/whole-system/{views,scripts,tests,frontend,receipts}/**`, named OEW adapter/build source and manifests, generated build evidence, and session receipts. Read ontology node/relation/evidence sources; do not mutate them.

## SWU-UOVA-018 — Candidate-local Body War View Pack

Primary behavior: assign all admitted Body War nodes to exactly one source-referenced cluster for bounded navigation.

Algorithm:

1. Reuse existing six business lenses and system layer/kind evidence as candidate cluster seeds.
2. Add an explicit bridge/gap cluster for nodes whose admitted evidence does not resolve to one seed.
3. Record cluster ID, label, purpose, category icon, source selectors, deterministic membership list, declared entry nodes, default/home choice, and `authority_effect: none`.
4. Validate exactly one membership across all 276 nodes and bind the graph digest.

No graph-layout/community inference may masquerade as ontology authority. Acceptance is total membership, source references, deterministic digest, useful bounded home fixture, and no ontology-source diff. Dependency: 002. Select 019.

## SWU-UOVA-019 — Body War source adapter

Primary behavior: compile the existing Body War graph, sidecar, and View Pack into the same typed Scene/Index contracts.

Algorithm: read existing owned JSON; verify graph/sidecar digests and exact relation mapping; normalize through SWU-001; compile the SWU-018 View Pack; materialize home, representative focus, portal, parallel-edge, and Path fixtures; write only owned generated assets and manifests.

Acceptance: 276 nodes, 301 relations, 39 exact predicate encodings, 577 complete-index rows; internal/cut/portal totality; at least two home predicates and two destination portals; Path/index fixtures preserve exact IDs and every compiled Scene node carries its admitted icon token; repeat generation is byte-equal. Dependencies: 003–005, 008–009, 011, 018. Select 020.

## SWU-UOVA-020 — Source-owned build cutover

Primary behavior: produce the Body War frontend from typed sources and data assets with zero compiled/minified text replacement.

Algorithm:

1. Enumerate all source inputs, dependency/toolchain locks, outputs, and digests.
2. Materialize the pinned upstream workroot and apply owned overlay sources only.
3. Build in an empty workroot, copy declared outputs, and compute canonical tree digest.
4. Scan scripts/manifests for compiled/minified replacement or byte-patching operations and fail if found.
5. Run parity against the retained baseline, perform local cutover, and prove rollback restores the untouched baseline.

Acceptance: `build:l1`, `verify:l1-build`, deterministic Body War test, empty-workroot replay, zero-surgery scan, source manifest, cutover/rollback. Dependencies: 007–019. Select 021.

Each SWU binds every Body War target before write and checks that ontology sources remain byte-identical. Closeout synchronizes row, task, W3, Work Pack. Expected result: candidate-local receipt with source/output hashes, denominator proof, authority ceiling, build identity, and deterministic successor; it is not deployment or release evidence.
