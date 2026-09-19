---
task: TASK-BTE-L3-COMPILER-GRAPH
layer: L3
status: planned-no-swu-instantiated
updatedAt: 2026-07-22
---

# TASK-BTE-L3-COMPILER-GRAPH — Canonical Build And Replay

## Primary Behavior

Compile one exact successor source set through the admitted-or-candidate v2
formation and relationship route into one deterministic graph v2, source
manifest v2, BuildReceipt, and immutable ProofContext envelope.

## Consumes And Emits

Consumes L1/L2 receipts plus immutable SWU-BTE-001/003 handles. Emits version-
hard compiler modules under `impl/tools/minted-project/v2/`, graph/manifest/
build/proof-context contracts under `impl/spec/minted-project/v2/` and BTE
contract roots, and raw build/replay artifacts under `runs/<run-id>/l3/`.

## Ordered Rules

1. Refuse an unknown or mixed profile version; never try v1 after v2 fails.
2. Apply L1 structural/criterion evaluation and L2 exact relationship checks.
3. Emit graph nodes/edges with direct source handles, governing contract
   handles, scope, provenance, and ordinal where required.
4. Emit a source manifest with an exact node/edge-to-source bijection.
5. Emit a compiler-owned BuildReceipt that stops at contracts, sources,
   compiler, graph, and manifest.
6. Bind all governing IDs/versions/digests into one immutable ProofContext.
7. Independently rebuild/replay and compare raw bytes; do not trust receipt
   counts or `pass` fields.

## Failures And Validation

Reject mixed handles, fallback, filtered formation error, missing provenance,
second authored graph, lossy projection, endpoint/order drift, nondeterministic
bytes, stale 001/003 handle, or a BuildReceipt that judges downstream proof.
Run planned `verify:bte:build`, current tool/engine/type/content regressions, and
two-run byte comparison. Unadmitted but structurally valid output is explicitly
candidate-only and cannot enter core.
