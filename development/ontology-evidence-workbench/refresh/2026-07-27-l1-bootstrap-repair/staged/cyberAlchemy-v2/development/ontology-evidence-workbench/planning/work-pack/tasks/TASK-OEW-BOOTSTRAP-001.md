# TASK-OEW-BOOTSTRAP-001 — Private L1 Build Bootstrap

Layer/wave: L1 / W1  
Dependencies: G-OEW-L0 / SWU-OEW-006  
State: planned; unselected  
Authority: private OEW materialization only; `authority_effect:none`

## Purpose

Create one clean, reproducible L1 overlay build interface before feature work.
The unit consumes verified retained L0 inputs, never a workspace installation
or ambient server, and returns an immutable build handle accepted by a distinct
verifier.

## SWU-OEW-006B — Materialize and Verify the L1 Build

- Primary behavior: build the exact pinned dashboard plus OEW overlay in a
  fresh digest-named private workroot and independently verify the handle.
- Inputs:
  - verified L0 upstream build handle and exact upstream lock;
  - OEW overlay manifest and patch bytes;
  - exact Node binary and pnpm `10.6.2` bytes;
  - one declared mode: `online` or admitted `isolated-store`.
- Exact target inventory:
  - `cyberAlchemy-v2/implementation/ontology-evidence-workbench/package.json`
  - `cyberAlchemy-v2/implementation/ontology-evidence-workbench/contracts/l1-build-handle.schema.json`
  - `cyberAlchemy-v2/implementation/ontology-evidence-workbench/contracts/l1-build-verification.schema.json`
  - `cyberAlchemy-v2/implementation/ontology-evidence-workbench/upstream/L1-TOOLCHAIN.lock.json`
  - `cyberAlchemy-v2/implementation/ontology-evidence-workbench/scripts/materialize-l1-build.mjs`
  - `cyberAlchemy-v2/implementation/ontology-evidence-workbench/scripts/verify-l1-build.mjs`
  - `cyberAlchemy-v2/implementation/ontology-evidence-workbench/test/l1-build-bootstrap.test.mjs`
  - `cyberAlchemy-v2/implementation/ontology-evidence-workbench/generated/runs/SWU-OEW-006B/l1-build-handle.json`
  - `cyberAlchemy-v2/implementation/ontology-evidence-workbench/generated/runs/SWU-OEW-006B/l1-build-verification.json`
- Algorithm:
  1. verify retained L0 handle, upstream lock, overlay, Node, and pnpm bytes;
  2. create a fresh digest-named workroot outside repository/workspace package
     graphs and record preimages;
  3. use the declared network/cache mode and effective frozen lock with no
     global/workspace fallback;
  4. verify patch preimages, apply once, record postimages, and reject drift or
     reapplication;
  5. run dashboard Vitest and `tsc -b && vite build`;
  6. emit an immutable build handle;
  7. in `finally`, remove the workroot and record retained/removed residue;
  8. invoke the distinct verifier to recompute inputs, tools, patch images,
     output digest, protected equality, cleanup, residue, and authority ceiling.
- Positive witness: exact input/tool/lock/mode/patch/test/build/output/cleanup
  fields pass and the verifier receipt binds the handle.
- Negative witnesses: wrong tool bytes, missing effective lock, ambient
  workspace fallback, undeclared cache/network use, patch drift or reapply,
  test/build failure, output tamper, retained workroot, protected drift, and
  producer-only verification all block.
- Validation:
  `npm run test:l1-bootstrap && npm run build:l1 && npm run verify:l1-build`.
- Expected handles:
  `oew-l1-build-handle/v1` and `oew-l1-build-verification/v1`.
- Split analysis: clean materialization and independent acceptance close one
  temporal build-interface decision; UI behavior remains independently
  falsifiable in 007–013 and browser execution remains in 014.
- Closeout: shared contract; receipt
  `session-evidence/SWU-OEW-006B/receipt.json`.
- Successor: stop; report `SWU-OEW-007` eligible without selecting it.

## Selection Boundary

This task is planned, not selected. The historical 007 series receipt cannot
authorize it. Execution requires Plan-owner acceptance, explicit human
selection of `SWU-OEW-006B`, and a fresh Task Session preflight.

## Open Questions

See [../../../define/SPEC.md](../../../define/SPEC.md#open-questions).
