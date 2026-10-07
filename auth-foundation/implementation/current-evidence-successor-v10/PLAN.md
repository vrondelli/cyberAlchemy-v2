# Auth v10 compiler-file-input successor plan (candidate)

This plan follows the accepted command-boundary meaning and the passing v9
expanded inventory. It does not modify v5–v9 bindings or claim all-path
no-call behavior.

## DAG

1. Freeze the v9 binding and reconstruct its 86-path inventory; enumerate the
   seven aggregate Rust roots and their Cargo metadata targets.
2. Implement a pure, hostile-tested Cargo artifact and rustc dep-info parser.
   Reject ambiguous package/target/feature/profile identities, cached or
   duplicate artifacts, malformed or unsupported complete dependency rules,
   symlinks, escapes, and missing files. The existing normal-MIR binder is a
   reference, not a reusable multi-target implementation.
3. Run 15 sequential fresh isolated cells, each with a new empty target
   directory: seven normal lib/bin builds,
   seven default-feature all-target test builds, and one API trace-feature
   all-target test build. Pair each reported local compiler artifact with its
   exact dep-info file. Snapshot inputs before and after each cell.
4. Reconcile the union of observed local rustc file dependencies as a subset
   of v9's 86-path map. Reviewed v9 paths may be unused by the compiler; an observed
   path outside the map fails pending an explicit versioned addition.
5. Bind the selected matrix, dep-info-listed path hashes at post-build snapshot,
   Cargo/rustc/toolchain
   identity, manifests and locks, support inputs, and predecessor bytes in a
   v10 candidate. Review it independently. Select it in the aggregate only
   after its replay passes, then rerun the entire aggregate.

## Claim ceiling

Even a passing v10 establishes only enumerated local rustc dep-info-listed file
paths and their post-build hashes, stable at before/after snapshots for those
selected cells. It does not prove the exact bytes rustc read during a cell,
nor close build-script or proc-macro
filesystem access, compiler/Cargo environment inputs, external crate source,
doctest compiler inputs, every reachable native decision effect, all-path
READY dominance, or runtime observation. `runtime_guarantees_observed` stays
false and `authority_effect` stays `none`.

## Open Questions

- Which newly observed local input paths, if any, require a reviewed versioned
  extension beyond v9 before v10 can pass?
- What separate evidence can close non-file build inputs and the all-path
  native decision effects without confusing them with dep-info coverage?
