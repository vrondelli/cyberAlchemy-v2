# Superseded Refresh Patch Proposal: OEWTP Runtime Admission

> **Do not stage or apply this proposal.** The independent runtime-contract
> review in `runtime-contract-review.json` returned `block`. This document is
> retained as audit evidence for the proposal that was reviewed, not as an
> active apply route. The replacement route is defined by
> `RUNTIME-REPAIR-PLAN.md` and `RUNTIME-REPAIR.dispatch.json`.

## Retired owner route

`invoke:refresh:apply-approved`

This route is retired. Its intended scope was limited to the isolated
`cyberAlchemy-v2/development/ontology-evidence-workbench-thin-prototype/planning/`
package. It does not authorize implementation, package, old-development,
promotion, release, deployment, or production changes.

## Exact proposed target set

1. Update `planning/CLOSEOUT-SYNC-INVENTORY.json`.
2. Update `planning/SWU-MANIFEST.json`.
3. Update `planning/EXECUTION-PACK.md`.
4. Update `planning/WORK-PACK.md`.
5. Update the four files under `planning/work-pack/tasks/TASK-OEWTP-0*-*.md`.
6. Add `planning/MUTATION-ADMISSION-CONTRACT.json`.
7. Regenerate only the planning validation/Distill receipts whose bound inputs
   change.

The exact proposed bytes are produced by
`prepare-planning-repair.mjs`. Its default `--check` mode binds all eight
current source digests, performs every transform in memory, verifies the
material/execution-output recomposition for all four SWUs, and returns the nine
proposed target digests in `repair-check.json` without writing a canonical
target. Its `--stage` mode requires an exact approval record for
`invoke:refresh:apply-approved`, writes only below this run's
`apply-approved/` evidence directory, and has no canonical apply mode.
The approval record must validate against `approval-record.schema.json`, whose
nine-path allowlist and six forbidden-scope entries keep implementation,
package, old-development, authority, publication, deployment, release, and
production outside this repair.

`planning/work-pack/chain-state.json` remains `mutation_authorized=false`
during repair. It may record the preflight blocker and return to
`task-session-preflight` only after the repaired artifacts validate.

## Proposed contract changes

### 1. Separate pre-write admission from closeout

Add one shared `MUTATION-ADMISSION-CONTRACT.json` with a per-attempt template
for every SWU:

- execution mode: `routed-mutation`;
- staging root:
  `planning/work-pack/session-evidence/<swu-id>/<attempt-id>/materialization/`;
- exact staged outputs under `materialization/staging/`;
- material package:
  `materialization/material-package.json`;
- material validator receipt:
  `materialization/material-package-receipt.json`;
- producer receipt schema:
  `.agents/skills/invoke/schemas/material-package-receipt.schema.json`;
- mutation-admission request:
  `materialization/mutation-admission-request.json`;
- mutation-admission receipt:
  `materialization/mutation-admission-receipt.json`;
- request and receipt schemas from
  `.agents/skills/task-session/schemas/`;
- lifecycle owner, `private` authority, `internal` publication, exact allowed
  writes, dependency frontier, and validation commands copied from the
  selected live SWU;
- no canonical implementation write until the material receipt has
  `patchVerdict=pass`, `mutationHandoff=ready`, empty reasons, passing
  dependency/owner/publication evidence, and the Task Session receipt has
  `admissionVerdict=admit`, `mutationReady=true`.

The concrete attempt ID, package ID, package digest, artifact digests, and
baselines are runtime-bound. Planning must not invent them.

The `material_write_scope` contains only staged canonical source/schema/test
files. Generated run trees, handles, ledgers, screenshots, and the terminal
Task Session receipt remain in `execution_output_inventory`; they are written
only after admitted canonical apply and live validation. The two partitions
are disjoint and recompose exactly to each existing SWU write scope.

### 2. Normalize Invoke closeout

In `CLOSEOUT-SYNC-INVENTORY.json`:

- set `lifecycle_owner_route` to
  `invoke:refresh:apply-approved`;
- add `authorization_ceiling: closeout-only`;
- allow only `evidence_added`, `blocker_opened`, `blocker_resolved`,
  `status_changed`, and `route_changed`;
- map created result/receipt/reference evidence to `evidence_added`;
- map successor selection to `route_changed`;
- add an expected owner-receipt contract requiring mode `refresh`,
  `phaseStatus=pass|no-op`, `mutationMode=apply-approved`,
  target/baseline/source-receipt bindings, applied changes, validation,
  `mutationReady=true` for a write or a receipt-backed no-op, and the exact
  returned successor;
- preserve every implementation, authority, promotion, publication,
  deployment, destructive-cleanup, and unrelated-target prohibition.

### 3. Make W0 executable

For each SWU task and manifest row, W0 must:

1. bind one collision-free attempt ID;
2. bind all live control, source, output, staging, and closeout baselines;
3. capture the existing package-manifest inventory, including the already
   modified implementation `package.json`, as a do-not-change baseline;
4. stage exact proposed output bytes without touching canonical targets;
5. construct and validate the Invoke material package;
6. construct and validate the Task Session mutation-admission request;
7. admit canonical application only on the two passing receipts;
8. preserve staged evidence and stop at the first drift, collision, symlink,
   scope, ownership, dependency, validation, or digest failure.

### 4. Revalidate the repaired Plan

Run:

- Dispatch Spec validation for the refreshed route;
- JSON validation for all planning JSON;
- Plan validator;
- Distill validation over the changed Plan/work-pack/SWU contracts;
- Markdown link validation;
- scoped `git diff --check`;
- a no-new-`package.json` inventory comparison.

The repaired Plan may return `selected_swu=SWU-OEWTP-001` and
`next_route=task-session-preflight`. It still does not make implementation
mutation ambiently authorized.

## Explicitly unchanged

- No new `package.json`, lockfile, package root, or Playwright dependency.
- No old `cyberAlchemy-v2/development/ontology-evidence-workbench/**` writes.
- No `cyberAlchemy-v2/implementation/ontology-evidence-workbench/**` writes
  during this repair.
- No SWU merge, parallel execution, authority change, promotion, release,
  deployment, or production claim.

## Replacement authorization gate

Do not authorize or execute the former planning-only route. The next safe gate
is exact user authorization for `RUNTIME-REPAIR.dispatch.json`, which repairs
the shared Task Session and Invoke contracts and stops before OEW planning or
implementation mutation.

Only after that runtime repair validates may Invoke Refresh author a replacement
planning proposal with a new digest-bound apply gate.
