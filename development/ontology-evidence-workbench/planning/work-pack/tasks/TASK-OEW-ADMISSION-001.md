# TASK-OEW-ADMISSION-001 — Verifier-Backed Source Admission

Layer/wave: L0 / W0
Dependencies: passing Design result
Task objective: create the only entry path from an existing candidate run into
OEW.

## Implementation Detail

Implement a Node 22 ESM wrapper that:

1. resolves the supplied `terminal-receipt.json` without symlink/path escape;
2. invokes/imports the existing independent
   `verify-terminal-receipt.mjs` contract;
3. requires `verified=true`, exact four-file inventory, supported v1 schemas,
   and `authority_effect:none`;
4. hashes the verified source files and emits an in-memory
   `VerifiedRunHandle`;
5. writes nothing during verification;
6. returns stable sorted diagnostics on failure.

Inputs: receipt path and repository root.
Output: schema-valid handle or non-zero deterministic rejection.
Edge cases: missing file, parse error, symlink escape, extra inventory,
tampered digest, unsupported schema, forbidden authority effect.

## Smallest Working Units

### SWU-OEW-001 — Admit One Verified Candidate Run

- Primary behavior: produce a verified run handle only after the existing
  terminal verifier passes.
- Dependencies: none.
- Target inventory:
  - `cyberAlchemy-v2/implementation/ontology-evidence-workbench/package.json`
  - `cyberAlchemy-v2/implementation/ontology-evidence-workbench/src/source-admission.mjs`
  - `cyberAlchemy-v2/implementation/ontology-evidence-workbench/contracts/verified-run-handle.schema.json`
  - `cyberAlchemy-v2/implementation/ontology-evidence-workbench/test/source-admission.test.mjs`
  - `cyberAlchemy-v2/implementation/ontology-evidence-workbench/fixtures/tampered-result/terminal-receipt.json`
- Source anchors:
  - `../design/ARCHITECTURE.md#view-3--low-level-components`
  - existing `scripts/verify-terminal-receipt.mjs`
  - `../design/VALIDATION-CONTRACTS.md#planned-validation-contracts`
- Done: current SWU-OCGP-008 returns a schema-valid handle; tampered/missing/
  authority-effecting cases fail before any write.
- Validation:
  `node --test cyberAlchemy-v2/implementation/ontology-evidence-workbench/test/source-admission.test.mjs`
- Expected handle: `oew-verified-run-handle/v1`.
- Execution owner: Task Session local fallback; no subagent requirement.
- Split analysis: path containment and terminal verification jointly define
  one admission decision; either alone cannot yield an executable trusted
  handle. Adapter mapping can pass independently and is SWU-002.
- Closeout: exact target inventory plus
  [shared contract](../shared/CLOSEOUT-CONTRACT.md); expected receipt
  `work-pack/session-evidence/SWU-OEW-001/receipt.json`.
- Handoff: return handle path/digest and stop; report SWU-002 eligible, do not
  select it.

## Execution State

- Status: completed.
- Task Session receipt:
  `work-pack/session-evidence/SWU-OEW-001/receipt.json`.
- Specialized output:
  `work-pack/session-evidence/SWU-OEW-001/verified-run-handle.json`.
- Validation: 7 passed, 0 failed; five staged/live hashes match; eight
  protected scopes remain equal.
- Successor candidate: `SWU-OEW-002`, not selected by this inner closeout.

## Open Questions

See [../../../define/SPEC.md](../../../define/SPEC.md#open-questions).
