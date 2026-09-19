# Refresh Patch Proposal — FormalClaim Lean/EVF Plan Governance Contracts

## Proposed outcome

Stage, but do not apply, a governance-only update that replaces all 14 legacy flat closeout rows with the current typed mutation-capable contract and records the real execution cursor: SWU-FCL-001 is complete and joined; SWU-FCL-002 is next and remains unexecuted.

The four exact target postimages are under `staged-targets/`. The accepted Plan remains byte-identical.

## Exact target postimages

| Target | Before SHA-256 | Staged SHA-256 | Purpose |
| --- | --- | --- | --- |
| `work-pack/shared/TASK-SESSION-CLOSEOUT-CONTRACTS.json` | `ce8a071cf38b449d6371f9d325940db4c7fdaddd0a58fbc605f7c3e8cd8efcdd` | `ab828bcfddef68b98145e876183a60dcc2e037409042f20f335fd6a0225af313` | Replace 14 legacy rows with typed precloseout, owner-closeout, terminal, continuity, and Continuation Router schema bindings. |
| `readiness/AUDIT-BINDINGS.json` | `cf353362f955cc310c4e961f6a478796fd67475964c3d0fd962474e46dedab1b` | `a9c6a9a17de53a1830fc47a5b5505c99ca08ba78869f03c37c211f110e2ef3ed` | Record only SWU-FCL-001 completed and advance the unexecuted cursor to SWU-FCL-002. |
| `readiness/generate_audit_config.py` | `b48f8727ce9277832f0136d3bbab8d697fbca3031fb00566cf5713ed0d67b198` | `286f7e0f1cc986a246879f3c46be015c5c588d2aba25cf1120847b292bb4ab2d` | Regenerate all 14 typed contracts and the historical completion prefix instead of reintroducing legacy drift. |
| `readiness/audit-config.json` | `7af760e47789ebbb611e05c1adc16229f2b4ec8e48f9c0fd8b3c7439e454934b` | `915715a10073e93e32afc8465fc000205df1eef3e39ac03bbb0236c13dfdaa5b` | Freeze the current typed contracts and truthful continuity projection. |

Every target maps to `RS-FCL-REFRESH-001` or `RS-FCL-REFRESH-002`. `RS-FCL-REFRESH-003` blocks application.

## What the proposal proves

- All 14 typed closeout contracts satisfy the current audit-config v2 schema.
- The legacy-flat regression probe still rejects all 14 missing typed contracts.
- The target-postimage semantic overlay retains canonical semantic digest `a6aa1679575472ab625b773975463dbc839a184a8833ee178a945fe3ed325c5c` and every accepted per-unit digest.
- The 14 SWU IDs, order, dependencies, successors, commands, work scopes, validation contracts, allowed writes, lifecycle owners, authority/publication classes, execution policy, routes, and C12/Victor boundary remain unchanged.
- The SWU-FCL-001 terminal receipt validates against the current terminal schema. Its joined owner receipt remains exact historical evidence under `invoke-refresh-closeout-receipt.v1`; it does not validate as the newer precloseout owner receipt and is exposed as compatibility residue rather than rewritten. No later terminal receipt exists and the successor was not executed.

## Why it cannot be applied yet

The current WPRA runner requires the joined-closeout selector `/lifecycle_owner_validation/status` on the same terminal receipt. The current terminal schema has `additionalProperties: false` and represents closeout through `closeout_join`; the real schema-valid joined result is at `/closeout_join/joined_owner_receipts/0/result` and equals `no-op`.

Two current-run tests make the contradiction explicit:

1. Using the required legacy selector produces one `BINDING_SELECTOR_UNRESOLVED` blocker.
2. Using the actual schema-valid selector produces one `CONTINUITY_RECEIPT_MISSING` blocker because the runner rejects any selector other than the legacy one.

The Refresh must not fabricate the forbidden legacy field, rewrite either completed receipt, recast the historical owner receipt as a current schema, downgrade its owner result, hide completion, or weaken the audit.

## Deferred generated artifacts

`final-audit-output/*`, `trial-audit-output/*`, `IMPLEMENTATION-READINESS-PREFLIGHT.json`, and acceptance manifests/inventories are deliberately not proposed as postimages. They must be regenerated only after the WPRA lifecycle repairs and tests its continuity contract and the exact staged candidate obtains a real current-run readiness result.

## Acceptance and authority boundary

This proposal does not reuse Rondelli’s earlier exact acceptance over new bytes. After the WPRA contract is repaired and a fresh Refresh freezes a complete passing candidate, all acceptance-bound inventories and digests must be regenerated through the current v2 preacceptance closure. Renewed exact Rondelli acceptance is required. Victor Boscaro’s separate approval remains a later pre-merge gate and is not part of Plan-refresh acceptance.

## Next route

Route the one mechanical compatibility contradiction to the lifecycle owner of `work-pack-readiness-audit` through Spellcraft. That route must design and validate how completion continuity consumes the current `closeout_join` terminal structure while explicitly admitting or adapting exact historical joined-owner evidence, including adversarial tests for missing joins, wrong owners, wrong results, wrong schema generations, replay, non-prefix completion, and successor execution.

After that bounded lifecycle repair is independently validated, run a fresh `invoke:refresh:proposal-only` against the same accepted Plan and SWU-FCL-001 receipt. Do not apply these postimages as-is and do not run SWU-FCL-002.
