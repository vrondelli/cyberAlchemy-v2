# TASK-UOVA-01 — Scene Core

Goal: implement a library-independent semantic core that preserves exact source identities before any renderer participates.

Write scope: OEW overlay `src/oew/scene/**`, focused tests under the same owner, and SWU session evidence. No visual component, ontology source, dependency, or Body War generated output changes.

## SWU-UOVA-001 — Source graph normalization

Primary behavior: normalize nodes, relations, evidence, authority, and source digests into exact-ID maps without tuple deduplication.

Algorithm:

1. Validate the versioned adapter envelope and canonical graph digest.
2. Insert nodes by exact source node ID; reject duplicates.
3. Insert relations by exact source relation ID; preserve endpoint order, exact predicate, mapping status, evidence refs, and authority ceiling.
4. Resolve both endpoints against the node map; reject dangling references.
5. Preserve two distinct relation IDs even when their endpoint/predicate tuple matches.
6. Emit ID-sorted records and a source receipt; never call React Flow `addEdge()`.

Done when positive and negative pure fixtures prove stable ordering, digest replay, duplicate/dangling rejection, exact evidence, and parallel-edge preservation. Validate with the OEW root test command and scoped whitespace check. On pass synchronize the SWU row, this task, W1, and Work Pack; select 002.

## SWU-UOVA-002 — View Pack compiler

Primary behavior: validate one versioned View Pack as the sole stable cluster-membership authority.

Algorithm:

1. Verify graph binding and the View Pack digest over canonical bytes excluding its digest field.
2. Resolve every admitted node and every cluster/default/view/sequence reference.
3. Construct a reverse membership map and require exactly one cluster per admitted node.
4. Reject unknown, repeated, overlapping, or unassigned membership and duplicate/default cluster IDs.
5. Emit an immutable compiled index; do not infer membership from coordinates or graph topology.

Done when the four invalid membership classes fail with stable diagnostics and replay is byte-equal. Dependencies: 001. Select 003.

## SWU-UOVA-003 — Scene partition

Primary behavior: derive a bounded home/focus scene with visible nodes, all internal relations, and all cut relations.

Algorithm:

1. Resolve query scope against the compiled View Pack and enforce the 24/48/12 home or 32/64/16 focus caps.
2. Select visible source nodes in deterministic order.
3. Classify every relevant source relation: both endpoints visible is internal; exactly one visible is cut; neither visible is outside the scene.
4. Retain the full binding in both internal and cut sets and prove disjointness plus totality for the relevant set.
5. Bind denominators and revision digests into `KnowledgeScene`.

Done when total partition, cap, boundary, empty, and parallel-relation fixtures pass. Dependencies: 002. Select 004.

## SWU-UOVA-004 — Lossless Grouped Portals

Primary behavior: group cut relations by declared destination cluster without discarding constituent identity.

Algorithm:

1. For each cut relation determine inside/outside endpoint from scene visibility.
2. Resolve the outside endpoint through the compiled View Pack membership index.
3. Record relation ID, both endpoints, exact predicate, source direction, traversal direction, and destination cluster.
4. Group by destination cluster using stable IDs/order; calculate visible counts and up to three predicate summaries.
5. Prove that the constituent union equals the cut relation set exactly once.

Done when mixed-direction and multi-relation portal fixtures pass and unresolved clusters fail as `PORTAL_DESTINATION_UNRESOLVED`. Dependencies: 003. Select 005.

## SWU-UOVA-005 — Bounded Path service

Primary behavior: return exact relation-bearing paths for `directed-shortest@1.0.0` and `undirected-shortest@1.0.0` only.

Algorithm: run deterministic breadth-first traversal over adjacency entries keyed by relation ID; track visited state without collapsing parallel relations; reconstruct contiguous `{relationId, sourceNodeId, targetNodeId, predicate, traversalDirection}` hops; order ties by canonical relation ID; stop at 8 paths, 8 hops, or 250 ms.

Done when directed/undirected/no-path/parallel/tie/cap/timeout fixtures pass. Dependencies: 001. Select 006.

## SWU-UOVA-006 — Navigation Frame reducer

Primary behavior: commit and restore the complete frame atomically rather than remembering only a node.

Algorithm:

1. Reducer events create immutable frames covering scope, query, filters, index state, panel, selection, portal expansion, viewport, initiating control, and focus fallback.
2. A transition captures the old frame before scene derivation.
3. Restoration checks graph/View Pack revisions, supports cancellation, waits for scene and geometry commit, applies viewport, then resolves focus in declared fallback order.
4. Emit stable success, `failed-stale-revision`, `failed-missing-target`, and cancellation outcomes.

Done when all frame fields round-trip and stale/cancel/focus fixtures pass. Dependencies: 003–005. Select 007.

Task-level evidence: six separate receipts, then G1 only after all six pass. Expected owner: Task Session implementation agent. Result shape: exact file/hash/command inventory plus contract-specific fixture counts and deterministic successor.

