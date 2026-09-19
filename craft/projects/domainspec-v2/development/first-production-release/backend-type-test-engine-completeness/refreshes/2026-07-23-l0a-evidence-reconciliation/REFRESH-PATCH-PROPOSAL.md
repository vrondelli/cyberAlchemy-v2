# Refresh Patch Proposal — BTE L0A Evidence Reconciliation

Status: `proposal-only`; no target mutation is authorized or applied.

## Proposed Outcome

Preserve the completed historical L0A Task Session receipt, repair the current
published bytes so they reproduce its immutable exact-byte evidence, synchronize
the BTE planning/Craft/read-model state, and expose the validation owner only
after the publication verifier passes.

The current failure is narrow:

- eight contract schemas and `diagnostics.ts` differ from the receipt by one
  additional trailing LF;
- `contract-publication-receipt.v1.schema.json` already matches;
- the deterministic verifier refuses to overwrite the differing historical
  run receipt;
- planning and projection artifacts still describe L0A as unselected; and
- no validation-owner red manifest or freeze receipt exists.

## Stage A — Apply-Approved Planning And State Delta

After explicit approval and material-package validation, apply a small status
delta without implementation mutation:

1. Add target-lifecycle blocker
   `BLK-DSV2-BTE-L0A-RECEIPT-DRIFT-001`.
2. Preserve `SWU-BTE-L0A-001` and all historical receipts unchanged.
3. Record its state as:
   `implementation-present; historical-pass-receipt; current-proof-blocked-on-byte-drift`.
4. Add one dependency-ready, unselected repair unit:
   `SWU-BTE-L0A-REPAIR-001`.
5. Change the active BTE window from `L0A-candidate` to
   `L0A-evidence-repair`.
6. Keep `selectedSWU=none`; selection belongs to a later Task Session.
7. Keep `SWU-BTE-L0B-001` blocked on both:
   - a current passing L0A publication verification; and
   - an independent matching red-manifest freeze.

Target planning/state artifacts:

- `PLAN.md`
- `IMPLEMENTATION-LAYERING.md`
- `WORK-PACK.md`
- `EXECUTION-PACK.md`
- `EXECUTION-DISPATCH.json`
- `DISTILL-VALIDATION.md`
- `work-pack/shared/{CONTEXT,DECISIONS,GAPS,TRACEABILITY}.md`
- `work-pack/tasks/TASK-BTE-L0-PROOF-PRIMITIVES.md`
- `work-pack/waves/W1-L0-PROOF-PRIMITIVES.md`
- `work-pack/waves/W1B-L0-VALIDATION-EXECUTION.md`
- `projects/domainspec-v2/.craft/ledger.yml`
- `projects/domainspec-v2/CRAFT.md`

The apply must index the current L0A execution receipt and handoff in Craft. It
must not overwrite the older blocked `SWU-BTE-001` receipt rows; those remain
historical evidence for the superseded route.

## Stage B — `SWU-BTE-L0A-REPAIR-001`

### Primary Behavior

Restore the current L0A published byte set to the immutable receipt handles and
prove the existing verifier passes without replacing historical run evidence.

### Consumes

- immutable `SWU-BTE-L0A-001` execution receipt;
- immutable run publication receipt and output-write manifest;
- current nine contract schemas and `diagnostics.ts`;
- current verifier source and package script;
- the applied repair work-pack contract.

### Allowed Writes

Append one additional LF to exactly:

1. `artifact-handle.v1.schema.json`
2. `logical-identity.v1.schema.json`
3. `authority-class.v1.schema.json`
4. `diagnostic.v1.schema.json`
5. `exact-set.v1.schema.json`
6. `red-fixture-manifest.v1.schema.json`
7. `red-fixture-freeze-receipt.v1.schema.json`
8. `validation-receipt.v1.schema.json`
9. `validation/diagnostics.ts`

### Forbidden Writes

- `contract-publication-receipt.v1.schema.json`, which already matches;
- all historical Task Session and run receipts;
- `validation-inputs/`;
- semantic validators and L0B source;
- current-v1, formation, compiler, graph, catalogue, proof, consumer, UI,
  admission, release, and public Arcanum surfaces;
- Craft, Inventory, and visibility from inside Task Session.

### Acceptance Evidence

1. Each of the nine repaired surfaces has the exact SHA-256 recorded in the
   immutable L0A execution/publication receipt.
2. `npm --prefix projects/domainspec-v2/impl run
   verify:bte:contract-publication` passes without changing the existing run
   receipt or write manifest.
3. `npx vitest run src/bte/contract-publication.test.ts` passes.
4. `npm --prefix projects/domainspec-v2/impl run engine:test` passes.
5. `npm --prefix projects/domainspec-v2/impl run typecheck` passes.
6. `npm --prefix projects/domainspec-v2/impl run validate:docs` passes.
7. JSON parse, link, exact write-scope, receipt-digest, and
   `git diff --check` checks pass.
8. The Task Session receipt says `admission_granted=false` and
   `production_authorized=false`.

### Stop Conditions

- any mismatch is not explained by the one-LF relation;
- any target outside the nine allowed byte surfaces changes;
- historical evidence would be rewritten;
- the verifier still returns `BTE_OUTPUT_OVERWRITE` or another failure;
- a formatter or commit step strips the restored bytes before the receipt is
  closed.

### Why This Is The Smallest Coherent Unit

The nine writes share one independently reviewable behavior: restore exact
published bytes. Splitting them would leave the receipt partially invalid;
adding planning sync, validation-owner work, L0B semantics, or consumer work
would mix distinct owners and acceptance boundaries.

## Stage C — Receipt Synchronization

After a passing repair receipt, run a second Invoke Refresh:

1. close `BLK-DSV2-BTE-L0A-RECEIPT-DRIFT-001`;
2. mark L0A publication proof current;
3. remove the repair candidate;
4. update Craft, Plan, Work-Pack, dispatch, Inventory, and visibility;
5. route the validation owner to author:
   - `validation-inputs/l0/red-fixture-manifest.v1.json`
   - `validation-inputs/l0/red-fixture-freeze-receipt.json`
6. keep L0B unselected until that freeze matches every L0A contract and
   diagnostic digest.

## Deferred Alternative

If the BTE lifecycle owner rejects restoring executed bytes, open a
Decision Gate before implementation. The alternative is a new run identity and
fresh immutable publication receipt over the current bytes. That route is
larger because the publisher currently fixes the original run output path and
the old receipt must remain historical rather than being overwritten.

## Read-Model Synchronization

After owner state changes:

- update the existing BTE Inventory entry so “L0A unselected” no longer appears
  as current state;
- preserve Inventory as non-authority;
- rebuild and check FPR roadmap visibility;
- keep consumer and production claims unchanged.

## Proposal Boundary

This proposal does not apply the patch, select a Task Session SWU, create a
material package, mutate implementation, freeze validation inputs, execute
L0B, grant admission, close core, update consumers, or authorize production.
