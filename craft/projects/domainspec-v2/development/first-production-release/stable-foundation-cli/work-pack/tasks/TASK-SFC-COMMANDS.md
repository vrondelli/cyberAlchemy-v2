# TASK-SFC-COMMANDS — Supported command behavior

Layer/slice/wave: L1 / SFC-S2 / W1.

## Objective

Expose only `lint` and `receipt` over the closed L0 contracts with correct exits,
atomic result channels, deterministic output, and zero product/project writes.

## Implementation flow

Decode argv → runtime/input preflight → source/profile/C2 bind → structural
evaluate → normalize → schema-check complete result → one channel write → exit.
Errors are typed before rendering; a render/size/write failure cannot leave
partial stdout.

## SWU-SFC-007 — deterministic lint command

- Primary behavior: execute `lint <project-root>` and emit deterministic paginated
  DiagnosticReport JSON with exact exits.
- Independent acceptance: green, structural red, profile/path/usage/resource/token,
  ordering, page, unknown flag/command, fallback, and no-write fixtures pass.
- Split analysis: grammar/evaluation/pagination/channel mapping are one externally
  observable lint behavior; receipt projection can pass independently and remains 008.
- Dependencies: SWU-SFC-006.
- Write scope:
  - `projects/domainspec-v2/impl/cli/src/cli/invocation.ts`
  - `projects/domainspec-v2/impl/cli/src/cli/lint.ts`
  - `projects/domainspec-v2/impl/cli/src/evaluation/structural-evaluator.ts`
  - `projects/domainspec-v2/impl/cli/src/output/atomic-result-writer.ts`
  - `projects/domainspec-v2/impl/cli/test/commands/lint.test.ts`
- Done: only declared flags, one stdout report, typed stderr faults, exact exits,
  no partial JSON, no project/output writes.
- Validation: `VC-SFC-007`.
- Execution owner: Task Session.
- Expected receipt: `runs/SWU-SFC-007/TASK-SESSION-RESULT.json`.

## SWU-SFC-008 — compact receipt command

- Primary behavior: execute `receipt <project-root>` and emit one compact closed
  StructuralReceipt whose exit reflects structural acceptance.
- Independent acceptance: green and structural red receipts close-decode; red exits
  4; `--out`/unknown flags fail 1; serializer/output-cap/internal failures leave no
  success-looking partial stdout; filesystem census proves no writes.
- Split analysis: receipt projection and atomic channel behavior are one externally
  reviewable result contract; lint pagination remains independently accepted in 007.
- Dependencies: SWU-SFC-007.
- Write scope:
  - `projects/domainspec-v2/impl/cli/src/cli/receipt.ts`
  - `projects/domainspec-v2/impl/cli/src/cli/main.ts`
  - `projects/domainspec-v2/impl/cli/src/output/fault-writer.ts`
  - `projects/domainspec-v2/impl/cli/test/commands/receipt.test.ts`
  - `projects/domainspec-v2/impl/cli/test/commands/no-write.test.ts`
- Done: exact command/bin wiring, authority-none compact receipt, one closed
  stdout document, stderr faults, no runtime install/write/network behavior.
- Validation: `VC-SFC-008`.
- Execution owner: Task Session.
- Expected receipt: `runs/SWU-SFC-008/TASK-SESSION-RESULT.json`.

## Unsupported surfaces

Current `roundtrip`, `derive`, `check`, `emit-tests`, `self-check`, factory,
write flags, and source import API remain unavailable through the product bin.

