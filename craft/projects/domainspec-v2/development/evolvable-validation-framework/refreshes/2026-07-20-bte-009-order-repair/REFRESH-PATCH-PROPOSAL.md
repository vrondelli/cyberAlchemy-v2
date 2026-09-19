# Refresh Patch Proposal — BTE-009 Order Repair

Status: proposal-only
Apply gate: explicit `apply-approved` Invoke Refresh

## Corrected Route In One Line

```text
SWU-BTE-001..004 + SWU-BTE-009 + SWU-BTE-005..007
  -> SWU-BTE-008 / verify:bte:core
  -> independently owned IOLM and Body War runs
  -> SWU-BTE-010 / verify:bte:consumers
  -> terminal verify:bte
```

The exact serial order among dependency-ready SWUs remains Task Session-owned. The
load-bearing constraints are that 009 closes before 008, 008 closes before consumer
runs, and fresh consumer receipts exist before 010.

## Proposed Authored Deltas

### Review `findings.md`

Signals: `RS-EVF-BTE009-001`, 002, 004, 005, 006, 007.

- Change the document status from `FINAL CANDIDATE — PENDING AUDIT` to
  `CORRECTED CANDIDATE — PENDING RE-AUDIT`; preserve the original audit link and
  rejection reason.
- Keep `ICR-BTE-002R`, but bind it explicitly to existing `SWU-BTE-009` and W2.
- Change `ICR-BTE-004` so `SWU-BTE-008` depends on 004-007 plus 009 and emits only
  `verify:bte:core` and its non-admitting core receipt.
- Change `ICR-BTE-005` so independently governed IOLM and Body War owners run after
  core. Remove the sentence that makes `SWU-BTE-009` execute those gates.
- State that `SWU-BTE-010` validates fresh external receipt handles and owns
  `verify:bte:consumers`; terminal `verify:bte` composes it with core.
- Replace backend order step 5 with external consumer runs and preserve 009 at W2.
- Preserve every S1 candidate, `DEC-GCP-001`, verifier disposition, Lean reuse
  classification, and exit denominator unchanged.

### BTE `PLAN.md`

Signals: `RS-EVF-BTE009-003`, 004, 006.

- Make the implementation sequence explicit: exact node/edge breadth including 009,
  independent obligations/tests, 008 core, external consumer executions, 010
  manifest/consumer validation, terminal verification.
- Update the `sequence` technique effect to name edge proof before core and consumer
  receipts after core.
- Do not change the 13-kind/16-signature denominator, claim boundary, or first
  executable SWU.

### BTE `WORK-PACK.md`

Signals: `RS-EVF-BTE009-002`, 003, 004, 006.

- Rename the integration task description to “fail-closed backend core validation
  and receipt”; keep the integrated-consumer-manifest task separate.
- Change `SWU-BTE-008` dependencies from `004-007` to `004-007,009`.
- Change its goal/done criteria/validation to `verify:bte:core`, excluding consumer
  execution and consumer receipt completion.
- Preserve `SWU-BTE-009` under `TASK-BTE-EDGE-COVERAGE`, with its existing edge-root,
  traversal, causal removal, provenance, and typed-negative scope.
- Change `SWU-BTE-010` dependencies to 008 plus fresh IOLM and Body War receipt
  handles; 009 remains transitively required through core.
- State that 010 validates external receipts and exposes `verify:bte:consumers`;
  terminal `verify:bte` composes core and consumer validation.
- Split validation strategy into core, external-consumer, and terminal checks.
- Preserve all SWU statuses as blocked/not-selected and all active consumer gaps.

### `TASK-BTE-INTEGRATION.md`

Signals: `RS-EVF-BTE009-003`, 004, 006.

- Narrow the objective to backend core completeness.
- Set dependencies to 004-007 and 009; earlier SWUs remain transitive.
- Name the canonical command `verify:bte:core`.
- Remove consumer receipts from the core required-check manifest, exact-set
  reconciliation, done criteria, and receipt claim.
- Require kinds, signatures, criteria, obligations, tests, execution, mutants, zero
  residue, and raw digest replay in the core receipt.
- Handoff a green core receipt to the independent IOLM and Body War owners, then to
  the integrated manifest task.

### `TASK-BTE-INTEGRATED-CONSUMER-MANIFEST.md`

Signals: `RS-EVF-BTE009-004`, 006.

- Add an explicit entry sequence: green `verify:bte:core` receipt -> fresh IOLM run
  receipt -> fresh Body War run receipt -> manifest comparison.
- State that this task consumes receipt handles and never runs or authors consumer
  evidence.
- Add freshness/run identity, profile/obligation/test/result IDs, raw digests,
  posture, and non-admission to required handoffs.
- Name `verify:bte:consumers` as the manifest validator command.
- Name terminal `verify:bte` as `verify:bte:core + verify:bte:consumers`.
- Reject fixture/schema-only substitution for either real consumer receipt.

### BTE `EXECUTION-PACK.md`

Signals: `RS-EVF-BTE009-003`, 004, 006.

- Keep W2 ownership of `SWU-BTE-009` unchanged.
- Expand W4 tasks to: 008 core; external IOLM and Body War receipt gates; 010
  consumer manifest; independent verify.
- State that W4 is sequential across those gates and that consumer work cannot begin
  before core.
- Add closure obligations for `verify:bte:core`, fresh external receipts,
  `verify:bte:consumers`, and terminal `verify:bte`.

### `W4-INTEGRATE-VERIFY.md`

Signals: `RS-EVF-BTE009-003`, 004, 006.

- Change the entry gate to W3 pass plus completed W2 edge/16-signature receipt.
- Replace the sequence with:
  1. 008 emits `verify:bte:core` receipt;
  2. IOLM owner runs and returns a fresh receipt;
  3. Body War owner runs and returns a fresh receipt;
  4. 010 validates both via `verify:bte:consumers` and exposes terminal
     `verify:bte`;
  5. independent verification replays the complete evidence chain.
- Add a stop condition for absent, stale, fixture-only, or BTE-authored consumer
  evidence.

### BTE `EXECUTION-DISPATCH.json`

Signals: `RS-EVF-BTE009-003`, 004, 006.

- In strict context construction, reject selection of 008 until 009 is complete and
  reject selection of 010 until core plus both fresh external receipts exist.
- Add corresponding Task Session stop conditions.
- Make independent verification distinguish the core receipt from IOLM/Body War
  receipts and terminal manifest receipt.
- Add a validation gate for the required order and an
  `execution_receipt_handoff` boundary for IOLM and Body War.
- Add trace events for core verified, consumer receipts joined, and terminal BTE
  verified.
- Preserve one-SWU-at-a-time execution, existing profile/authority gates, and all
  non-admission guardrails.

## Apply-Time Re-audit Manifest

Signals: `RS-EVF-BTE009-001`, 005, 007.

- Do not modify the original review `corpus-manifest.json` or `audit.md`.
- After applying the eight target changes, create
  `reviews/2026-07-20-implementation-completion/corpus-manifest.refresh-001.json`.
- Copy the original 61 path identities and category/ownership fields, recompute all
  current SHA-256 values, and add:
  - `refresh_of` pointing to the original manifest;
  - `refresh_signal_ids` for this proposal;
  - exact changed-path list;
  - apply receipt path;
  - `audit_status: pending`.
- Rerun the final audit against that machine manifest. A new audit result must be a
  new artifact; the rejected audit remains unchanged.

## Explicit No-Ops

- `TASK-BTE-EDGE-COVERAGE.md` remains byte-identical.
- `W2-ALL-BACKEND-KINDS.md` remains byte-identical.
- `TASK-BTE-VERIFY.md` remains byte-identical.
- `work-pack/shared/TRACEABILITY.md` remains byte-identical.
- Original review `audit.md` and `corpus-manifest.json` remain byte-identical.
- S1 rows, `DEC-GCP-001`, engine source, tests, fixtures, schemas, definitions,
  profiles, relationship authority, Craft state, and release state remain unchanged.
- No SWU is selected or executed.

## Apply Stop Conditions

Stop without partial synchronization if:

- any target preimage digest differs;
- any target would reassign, duplicate, rename, or delete `SWU-BTE-009`;
- 008 can run without 009 or 010 can run without a green core and both fresh external
  receipts;
- BTE is made the producer of IOLM or Body War evidence;
- consumer schemas or fixtures could satisfy terminal exit without actual runs;
- the original audit or original corpus manifest would be rewritten;
- Dispatch Spec validation returns a block;
- the refreshed manifest fails exact 61-path identity and digest checks;
- re-audit does not return `ACCEPT`; or
- the patch selects work, changes authority, or claims implementation/release
  completion.
