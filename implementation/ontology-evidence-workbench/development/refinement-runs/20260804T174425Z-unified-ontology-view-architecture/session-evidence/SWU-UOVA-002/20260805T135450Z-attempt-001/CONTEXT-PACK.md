# SWU-UOVA-002 Context Pack

Execute exactly the View Pack compiler unit from `TASK-UOVA-01`. The current approved epoch selects only `SWU-UOVA-002`; `SWU-UOVA-001` is a passing dependency.

The compiler must bind the compiled SourceGraph digest and the View Pack digest, treat the View Pack as the only stable cluster-membership authority, require exactly one cluster per admitted node, resolve default and sequence references, emit immutable deterministic indexes, and reject the four membership failures with stable diagnostics. It must never infer grouping from coordinates, layout, topology, community detection, or renderer state.

Product writes are limited to:

- `upstream/overlay/packages/dashboard/src/oew/scene/viewPack.ts`
- `test/view-pack-compiler.test.mjs`

Acceptance requires the focused test, the full OEW regression, and scoped whitespace validation. A need to change the approved schema or architecture stops the run. Authority, promotion, publication, deployment, release, credentials, unrelated network access, destructive cleanup, and Git publication remain outside scope.

On a passing terminal receipt, closeout may update only the SWU manifest, owning task, W1, and Work Pack, and may select only `SWU-UOVA-003`.
