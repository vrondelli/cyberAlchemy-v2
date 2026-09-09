# SWU-OEW-004 Context Pack

Status: strict coverage block
Mode: Context Builder standard
Artifact class: private session evidence

## Objective

Write and independently verify one immutable, deterministic three-file adapter
run with receipt-last semantics.

## Selected Evidence

- `planning/work-pack/tasks/TASK-OEW-ADAPTER-001.md`
- `planning/work-pack/swu-manifest.json`
- `planning/WORK-PACK.md`
- `planning/work-pack/shared/CLOSEOUT-CONTRACT.md`
- `planning/work-pack/waves/W0-L0.md`
- `define/operations.md`
- `define/interfaces.md`
- `design/ARCHITECTURE.md`
- `design/VALIDATION-CONTRACTS.md`
- `planning/work-pack/session-evidence/SWU-OEW-003/receipt.json`
- `cyberAlchemy-v2/implementation/ontology-evidence-workbench/package.json`

## Bound Validation

The SWU manifest requires:

`npm test && npm run verify:adapter`

Live preflight returns:

`npm error Missing script: "verify:adapter"`

## Blocker

`package.json` is the owner of npm script entrypoints, but it is not in
SWU-OEW-004's exact target inventory. Therefore the required validation command
cannot be made runnable without either:

1. expanding the approved SWU target inventory and updating `package.json`; or
2. changing the approved validation command to invoke the in-scope verifier
   script directly.

Both options mutate Plan-level scope or acceptance wiring and require the
work-pack owner. No implementation target was staged or written.

## Current Authorized Write Scope

- `contracts/adapter-receipt.schema.json`
- `src/canonical-json.mjs`
- `src/adapter-run-writer.mjs`
- `scripts/verify-adapter-receipt.mjs`
- `src/cli.mjs`
- `test/adapter-run.test.mjs`
- `generated/runs/SWU-OEW-004/presentation-graph.json`
- `generated/runs/SWU-OEW-004/evidence-sidecar.json`
- `generated/runs/SWU-OEW-004/adapter-receipt.json`

## Result

`BLOCK` before material staging, mutation admission, or implementation writes.
