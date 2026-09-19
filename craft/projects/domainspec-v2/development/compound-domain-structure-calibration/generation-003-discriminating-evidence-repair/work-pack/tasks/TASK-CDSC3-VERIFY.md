# TASK-CDSC3-VERIFY

## Objective

Independently replay and close generation 3 without mutating evidence, results,
source, predecessors, or the generation index.

## SWU-CDSC3-009 - Independent Replay And Closeout

**Goal:** prove exact fresh-process reproduction, authority boundaries, complete
Task Session receipts, and one bounded next route.

**Dependencies:** accepted SWU-CDSC3-008.

**Source anchors:** protected generations 1/2; all generation-3 contracts,
targets, manifests, observations, `D`, overlay, projection, results,
provenance/index; dispatch; Task Session receipts; Inventory contract.

**Audit algorithm:**

1. In a fresh process validate imports, target derivation, browser runtime,
   source manifest, baseline, `M3-P`, `M3-B`, and `D` independently.
2. Rebuild overlay and projection; compare semantic bytes and handles.
3. Re-evaluate F3 and suite from the predecessor prefix; compare exact outputs.
4. Verify the three-entry predecessor chain and one-time append.
5. Prove target statements derive from parent `S`, not browser outcomes.
6. Verify 36 coordinates and every uncertainty resolution/carry row.
7. Verify Savvy, UI repair, and generations 1/2 raw hashes are unchanged.
8. Audit every Task Session receipt, including any blocked runtime decision
   history and its later resolution.
9. Scan machine statuses/routes and human reports for positive authority claims.
10. Append one non-authority Inventory read model and close statuses only after
    all gates pass.

**Write scope:** `runs/SWU-CDSC3-009/`, status-only generation-3 planning
updates, Inventory/observability synchronization. No evidence, result, source,
or generation-index mutation.

**Done criteria:** fresh replay exact; protected bytes pass; target/browser/
usefulness provenance pass; receipts close; chain validates; Inventory indexes
agree; no authority leakage; no current SWU remains.

**Acceptance evidence:** machine replay report, independent replay narrative,
authority audit, closeout receipt, Inventory entry/index validation,
observability signal.

**Verification:**

```sh
node --test projects/domainspec-v2/development/compound-domain-structure-calibration/generation-003-discriminating-evidence-repair/tests/*.test.mjs
git diff --check -- projects/domainspec-v2/development/compound-domain-structure-calibration
```

**Execution owner:** manual independent auditor through Task Session.

**Handoff:** close. Route only the bounded suite recommendation through a new
governed package; never directly to authority mutation.

**Execution status:** complete. Three fresh-process replays pass, the
three-generation chain and all prior receipts close, Inventory indexes agree,
and the authority audit finds zero positive claims. There is no current SWU.

## Synchronization

Work-pack complete with fresh-process and Inventory evidence. The resolved
runtime decision and all receipts remain truthful history.
