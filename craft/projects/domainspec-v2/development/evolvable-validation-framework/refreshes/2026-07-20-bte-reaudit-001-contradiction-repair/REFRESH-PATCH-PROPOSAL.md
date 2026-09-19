# Refresh Patch Proposal — re-audit 001 contradiction repair

Status: applied and independently accepted

Approval: explicit `invoke refresh apply-approved`, received and applied on 2026-07-20

## Source verdict

The authoritative [re-audit result](../../reviews/2026-07-20-implementation-completion/audit.refresh-001.json) is `REJECT` with exactly two blockers. It independently accepts the complete SWU-BTE-009 order repair and every frozen-boundary check.

## Apply result

Both exact authored deltas were applied with their declared preimages. The [apply receipt](apply-receipt.json) records the postimages and protected no-ops. [Re-audit 002](../../reviews/2026-07-20-implementation-completion/audit.refresh-002.json) returns `ACCEPT` with zero blockers and `promotion_ready: true` for the corrected review/planning candidate; S1 completion and backend exit remain `BLOCK`.

## Proposed authored deltas

### `PLAN.md`

Signal: `RS-EVF-REAUDIT001-001`.

Preimage SHA-256: `2a665756c12f300b3e205ff7b74903bd1f41d7d748ff269a42f125cf435e4fac`.

Replace exactly:

```text
- Smallest working units: eight SWUs defined; none selected
```

with:

```text
- Smallest working units: ten SWUs defined; none selected
```

No other Plan line changes.

### `WORK-PACK.md`

Signal: `RS-EVF-REAUDIT001-002`.

Preimage SHA-256: `08c7495434d2f65b99dd84734bd7f9cca4c5b52e510f74e442dff5379185d75f`.

Replace the final two sentences of Distill Validation:

```text
Recomposition passes. Mutation readiness remains blocked only because the owner profile gate and contract version/mapping are unresolved. See `DISTILL-VALIDATION.md`.
```

with:

```text
Recomposition passes. The supported-profile and contract-mapping owner gates are accepted and resolved; mutation remains unavailable until one dependency-ready SWU is selected and separately authorized through a bounded Task Session. See `DISTILL-VALIDATION.md`.
```

No blocker row, gate field, SWU row, status, or other Work-Pack line changes.

## Applied machine artifacts

After the two target changes:

1. Created `reviews/2026-07-20-implementation-completion/corpus-manifest.refresh-002.json` as a new immutable 61-path manifest derived from `corpus-manifest.refresh-001.json` identities/category/ownership fields and current bytes.
2. Set `refresh_of` to `corpus-manifest.refresh-001.json`, recorded the two exact changed paths, linked the new machine apply receipt, and retained the manifest's apply-time `audit_status: pending` state.
3. Created `apply-receipt.json` inside this refresh folder with approval evidence, both pre/post digests, validation results, protected no-ops, and no implementation/release mutation.
4. Reran the independent audit into new immutable artifacts `audit.refresh-002.json` and `audit.refresh-002.md`; neither prior audit was rewritten.

## Validation and stop conditions

- Stop if either target preimage differs.
- Stop if any file beyond the two targets and new receipt/manifest/report artifacts would change.
- Assert the Plan contains `ten SWUs defined`, contains no `eight SWUs defined`, and the Work-Pack still defines exactly SWU-BTE-001 through 010 once each.
- Assert the Work-Pack records accepted/resolved supported-profile and contract-mapping gates and a separately authorized bounded Task Session as the remaining mutation gate.
- Re-run deterministic Dispatch Spec validation on unchanged `EXECUTION-DISPATCH.json`.
- Verify `corpus-manifest.refresh-002.json` preserves all 61 identities/categories/owners and matches 61/61 current SHA-256 digests.
- Verify all earlier audit artifacts and corpus manifests remain byte-identical.
- Run scoped `git diff --check`.
- Stop if any SWU becomes selected/executed, any decision is reopened, or any implementation/release claim changes.

## Explicit no-ops

- The prior 009/core/consumer/terminal repair remains unchanged.
- All SWU IDs, dependencies, scopes, owners, and statuses remain unchanged.
- `findings.md`, `audit.md`, `audit.refresh-001.json`, both existing corpus manifests, and the prior apply receipt remain immutable.
- Engine source, tests, schemas, fixtures, definitions, profiles, Craft, Inventory authority, S1/DEC-GCP-001, and release state remain unchanged.
