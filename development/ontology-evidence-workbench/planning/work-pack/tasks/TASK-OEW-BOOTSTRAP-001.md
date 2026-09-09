# TASK-OEW-BOOTSTRAP-001 — Private L1 Toolchain Provisioning

Layer/wave: L1 / W1  
Dependencies: G-OEW-L0 / SWU-OEW-006  
State: completed; Task Session and joined owner closeout pass
Authority: private OEW materialization only; `authority_effect:none`

## Purpose

Prove one clean, reproducible L1 materialization interface before feature work.
The unit consumes verified retained L0 inputs, never a workspace installation
or ambient server, and returns an immutable toolchain handle accepted by a
distinct verifier. It deliberately makes no final feature-build claim.

## SWU-OEW-006P — Provision and Verify the L1 Toolchain

- Primary behavior: prove exact tool, effective-lock, workroot, and patch
  mechanics in a fresh digest-named private workroot and independently verify
  the toolchain handle.
- Inputs:
  - verified L0 upstream build handle and exact upstream lock;
  - a 006P-owned fixture overlay manifest and patch probe;
  - exact Node binary and pnpm `10.6.2` bytes;
  - one declared mode: `online` or admitted `isolated-store`.
- Exact target inventory:
  - `cyberAlchemy-v2/implementation/ontology-evidence-workbench/package.json`
  - `cyberAlchemy-v2/implementation/ontology-evidence-workbench/contracts/l1-toolchain-handle.schema.json`
  - `cyberAlchemy-v2/implementation/ontology-evidence-workbench/contracts/l1-toolchain-verification.schema.json`
  - `cyberAlchemy-v2/implementation/ontology-evidence-workbench/upstream/L1-TOOLCHAIN.lock.json`
  - `cyberAlchemy-v2/implementation/ontology-evidence-workbench/fixtures/l1-bootstrap-overlay/overlay-manifest.json`
  - `cyberAlchemy-v2/implementation/ontology-evidence-workbench/fixtures/l1-bootstrap-overlay/0000-bootstrap-probe.patch`
  - `cyberAlchemy-v2/implementation/ontology-evidence-workbench/scripts/materialize-l1-workroot.mjs`
  - `cyberAlchemy-v2/implementation/ontology-evidence-workbench/scripts/verify-l1-toolchain.mjs`
  - `cyberAlchemy-v2/implementation/ontology-evidence-workbench/test/l1-toolchain-bootstrap.test.mjs`
  - `cyberAlchemy-v2/implementation/ontology-evidence-workbench/generated/runs/SWU-OEW-006P/l1-toolchain-handle.json`
  - `cyberAlchemy-v2/implementation/ontology-evidence-workbench/generated/runs/SWU-OEW-006P/l1-toolchain-verification.json`
- Algorithm:
  1. verify retained L0 handle, upstream lock, fixture overlay, Node, and pnpm
     bytes;
  2. create a fresh digest-named workroot outside repository/workspace package
     graphs and record preimages;
  3. use the declared network/cache mode and effective frozen lock with no
     global/workspace fallback;
  4. verify patch preimages, apply once, record postimages, and reject drift or
     reapplication;
  5. run the bounded fixture-patch oracle and reapply negative;
  6. emit an immutable toolchain handle;
  7. in `finally`, remove the workroot and record retained/removed residue;
  8. invoke the distinct verifier to recompute inputs, tools, patch images,
     protected equality, cleanup, residue, and authority ceiling.
- Positive witness: exact input/tool/lock/mode/fixture-patch/cleanup fields pass
  and the verifier receipt binds the handle.
- Negative witnesses: wrong tool bytes, missing effective lock, ambient
  workspace fallback, undeclared cache/network use, patch drift or reapply,
  fixture-oracle failure, handle tamper, retained workroot, protected drift,
  and producer-only verification all block.
- Validation:
  `npm run test:l1-toolchain && npm run materialize:l1-probe && npm run verify:l1-toolchain`.
- Expected handles:
  `oew-l1-toolchain-handle/v1` and
  `oew-l1-toolchain-verification/v1`.
- Split analysis: clean materialization and independent acceptance close one
  toolchain-interface decision; the complete feature build remains
  independently falsifiable in 013B.
- Closeout: shared contract; receipt
  `session-evidence/SWU-OEW-006P/receipt.json`.
- Successor: stop; report `SWU-OEW-007` eligible without selecting it.

## Selection Boundary

This task is selected by `G-OEW-L1-SPLIT-BUILD-SELECTION` option A.
Historical 007/006B receipts do not authorize it; the current decision receipt
does. Execution still requires a fresh Task Session preflight.

## Execution State

`SWU-OEW-006P` passed attempt 001. The retained L0 inputs, exact Node and direct
pnpm bytes, effective frozen lock, online isolated-store mode, fresh external
workroot, self-owned patch images and reapply negative, cleanup, distinct
verifier, 11/11 target parity, 47/47 OEW tests, and 12,989-entry protected
equality all pass. The terminal receipt is
`session-evidence/SWU-OEW-006P/receipt.json`. The result proves the toolchain
seam only; `SWU-OEW-013B` still owns the final feature build.

## Historical 006B Attempt 001 Blocker

The selected attempt stopped before implementation. The overlay manifest and
entrypoint patch required as 006B inputs are absent and assigned to dependent
successor 007. In addition, 007–013 would mutate feature source after the
immutable 006B build handle, while no post-feature build/verifier exists before
014. See
`session-evidence/SWU-OEW-006B/attempt-001/receipt.json` and Decision Gate
`DG-OEW-006B-BUILD-ORDER`, now resolved as option A. The historical 006B
selector is not redefined or retried.

## Open Questions

See [../../../define/SPEC.md](../../../define/SPEC.md#open-questions).
