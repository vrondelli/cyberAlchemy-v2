# TASK-OEWTP-02: Thin Build Producer

## Objective

Implement one dependency-free Node runner inside the existing OEW
implementation package that produces a receipt-bound immutable Vite dashboard
dist from fresh exact inputs.

- Layer/slice: L0 / S-002
- Wave: W2
- SWU: `SWU-OEWTP-002`
- Dependency: SWU-OEWTP-001 source and owner receipts pass

## Source contracts

- [Architecture workflow and dependency view](../../../design/ARCHITECTURE.md)
- [Validation strategy](../../VALIDATION-STRATEGY.md)
- predecessor Task Session receipt and current two overlay manifests
- existing pinned upstream lock/archive, entry patch, Node/pnpm bindings, and
  `materialize-l1-workroot.mjs` as code precedent

The old `L1-BUILD.lock.json` is read-only precedent. Its historical protected
set and old owner SWU do not govern this fast-lane producer.

## Smallest Working Unit: SWU-OEWTP-002

### Primary behavior

One direct script invocation verifies, materializes, tests, builds, receipts,
and cleans one exact dashboard build.

### Split analysis

Candidate children are input verification, materialization, install/core build,
typed tests, Vite build, receipt creation, and cleanup. None is an independent
build-producer acceptance boundary: a verifier without output and a build
without exact identity/cleanup leave hidden glue. The single output handle is
the coherent unit.

### Write scope

- `scripts/build-thin-prototype.mjs`
- `contracts/thin-prototype-build-handle.schema.json`
- `test/thin-prototype-build.test.mjs`
- `generated/runs/SWU-OEWTP-002/<attempt-id>/dashboard-dist`
- `generated/runs/SWU-OEWTP-002/<attempt-id>/thin-prototype-build-handle.json`
- `../../development/ontology-evidence-workbench-thin-prototype/planning/work-pack/session-evidence/SWU-OEWTP-002/<attempt-id>/receipt.json`

The retained dist and both receipts are explicit execution write scope.
`<attempt-id>` is expanded and collision-checked in W0/predecessor closeout
before mutation. `package.json` remains unchanged; Task Session invokes the
script directly.

### Runtime admission

Use `../../MUTATION-ADMISSION-CONTRACT.json#SWU-OEWTP-002`.
The script, schema, and test are `materialWrites`; the retained dist, build
handle, and terminal receipt are `executionOutputs`. The dist and handle are
created by the admitted validation run, verified against the declared output
inventory, and preserved before the terminal receipt is written last.

### Input/output model

Inputs:

- SWU-OEWTP-001 passing receipt and exact changed-file digests;
- pinned upstream lock and source archive;
- current overlay manifests and entry patch;
- exact Node and pnpm executable identities resolved at preflight;
- pre-bound retained-dist and handle paths under the unique generated-run
  attempt directory.

Output handle includes:

- schema/version/run/predecessor;
- every source path, digest, and size;
- package-manifest before/after inventory;
- temporary root name/digest rule;
- ordered command, cwd, exit, stdout/stderr digest, and duration records;
- explicit typed-test file/name/count discovery;
- core output and dashboard dist tree digests;
- retained dist path, canonical file count, byte size, and immutability rule;
- cleanup results and `authority_effect: none`.

### Algorithm

1. Parse an exact CLI:
   `build --typed-receipt <path> --output <path>`.
2. Resolve every repository input below the implementation root; reject
   absolute, traversal, symlink escape, missing, unexpected, and non-file
   inputs.
3. Verify predecessor result/pass, five-file inventory, manifest bindings, and
   package inventory.
4. Verify the pinned upstream lock/archive and entry patch with existing
   verification functions where compatible.
5. Create a digest-named temporary root outside the repository and a separate
   isolated pnpm store.
6. Extract only safe archive members; verify the expected content root.
7. Copy only manifest-admitted overlay files and apply the entry patch exactly
   once; require reapply failure.
8. Execute in strict order:
   frozen install with `--ignore-scripts` and isolated store; core build;
   explicit typed OEW Vitest paths; dashboard build `tsc -b && vite build`.
9. Require typed-test discovery count/names to match the declared list.
10. Require the Vite dist entrypoint, compute a canonical tree digest, then copy
    the completed dist to the pre-bound
    `generated/runs/SWU-OEWTP-002/<attempt-id>/dashboard-dist` path. Reject an
    existing target, symlink, overwrite, or post-copy digest mismatch.
11. Write the complete handle beside the retained dist only after verifying the
    retained tree path, digest, file count, and byte size. On failure,
    write a blocked diagnostic receipt only if its schema distinguishes it
    from a passing handle.
12. Write the Task Session receipt to its pre-bound session-evidence path.
13. In `finally`, terminate owned children, delete only the scratch workroot and
    isolated store, and verify their absence. The retained dist and completed
    handle must remain immutable for SWU-OEWTP-003. Cleanup failure makes the
    result block.

### Edge cases and negative bank

- upstream/archive/overlay/patch/predecessor drift;
- extra overlay file or package manifest;
- ambient workspace/global package fallback;
- skipped or zero-discovery typed tests;
- core build omitted or reordered;
- Vite output missing, symlinked, or tampered;
- output path collision or receipt overwrite;
- retained-dist copy mismatch or deletion during scratch cleanup;
- cleanup failure and unexpected residue.

### Done criteria

- positive exact build handle validates against the new schema;
- all negative fixtures emit stable blocking diagnostics;
- one real fresh run reaches Vite and retains the immutable dist tree at the
  path consumed by SWU-OEWTP-003;
- package manifest inventory remains unchanged;
- `node --test test/thin-prototype-build.test.mjs` passes;
- no old development package or package manifest is touched.

### Execution handoff

- Owner: one bounded subagent under Task Session
- Source anchors: this file, SWU-001 receipts, Design workflow, existing
  materializer/locks
- Expected result: standard SWU receipt plus build handle path/digest, tests,
  negative bank, cleanup, and residue
- Closeout: exact `SWU-OEWTP-002` row in
  [CLOSEOUT-SYNC-INVENTORY.json](../../CLOSEOUT-SYNC-INVENTORY.json)
- Successor: SWU-OEWTP-003 only after both closeout receipts pass

## Completion evidence

Future result: `../results/SWU-OEWTP-002-RESULT.md`.
