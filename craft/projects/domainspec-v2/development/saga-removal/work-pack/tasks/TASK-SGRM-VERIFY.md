---
task_id: TASK-SGRM-VERIFY
feature_code: SGRM
layer: L3
status: completed
---

# TASK-SGRM-VERIFY: Zero-Active Guard And Closeout

## Objective

Prove no active Saga surface remains, prove history remains reachable, and
synchronize continuation read models.

## SWU-SGRM-007: Classified Reference Guard

### Inputs

The SGRM-001 manifest, final repository tree, and explicit historical path/file
allowlist.

### Algorithm

1. Search case-insensitive whole-word Saga under projects/domainspec-v2.
2. For each match, resolve the file to the manifest classification.
3. Fail if the file is active-authority, active-implementation, current-plan,
   current-projection, unclassified, or missing unless a later accepted receipt
   owns an exact content-digested exception.
4. Allow historical-research, superseded-decision, telemetry/receipt, this
   removal package, reviewed cancelled/historical plan lines, and the
   receipt-backed negative rejection proof. Non-default exceptions must pin
   exact path, count, reason, and matched-line SHA-256.
5. Require each allowed file to have an existing path and classification reason.
6. Seed a temporary fixture under an active test root containing Saga and prove
   the checker fails; remove the temporary fixture within the test harness.
7. Emit a machine JSON report and human summary.

### Contract

- Dependencies: SGRM-006.
- Write scope: removal validation tool/allowlist/tests and run result.
- Done: clean repo passes; seeded active match fails.
- Evidence: positive report, seeded-failure result, receipt.
- Validation: tool test; JSON parse; path checks.
- Owner: local-fallback.

## SWU-SGRM-008: Recomposition And Read Models

### Ordered Rules

1. Run full docs, relationships, content, tool, engine, instance, and type tests.
2. Run the classified reference guard.
3. Verify Workflow same/cross fixtures and Saga rejection.
4. Verify DS-D1 stable IDs and active counts.
5. Sync Craft, Inventory, observability, and affected work-pack statuses from
   receipts only.
6. Produce a final Task Session result separating completed removal from
   preserved historical references and any residual external uncertainty.
7. Index the final result for future lookup.

### Contract

- Dependencies: SGRM-007.
- Write scope: final result plus current read models/indexes/status surfaces.
- Done: all validation green; indexes parse; receipts and statuses agree.
- Evidence: final result, validation logs, Inventory selector.
- Validation: npm validate; instances generate/validate; typecheck; reference
  guard; JSON/YAML/JSONL parse; git diff check.
- Owner: local-fallback.
- Handoff: strict context from all SGRM receipts and read-model owners; return
  standard SWU receipt and no further mutation route unless residue exists.

### Result

Completed by [SWU-SGRM-008](../../runs/SWU-SGRM-008/TASK-SESSION-RESULT.md).
The repository-local validation and read-model gates pass; external consumers
remain bounded residual uncertainty.

## Closeout Invariants

- No active Saga type, signature, schema, fixture, validator expectation, or
  runnable plan remains.
- Orchestrates remains active under Workflow.
- Historical evidence and superseded decisions remain linkable.
- No claim exceeds the receipts.
