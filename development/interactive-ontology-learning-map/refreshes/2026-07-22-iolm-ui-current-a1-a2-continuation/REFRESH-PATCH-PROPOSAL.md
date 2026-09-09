# Refresh Patch Proposal — current-generation A1 pass to A2 selection

## Authorization state

- Mutation mode: `proposal-only`.
- Apply authorization: missing.
- Exact required route: `invoke:refresh:apply-approved` for this proposal and its twelve-target inventory.
- This document is not mutation approval and does not select A2 until separately applied and validated.

## Controlling receipt

- Result: `work-pack/session-evidence/SWU-IOLM-00C-UI-A1/rebinds/20260723T002902Z-current-fixture-rebind/RESULT.md`.
- Machine receipt: `work-pack/session-evidence/SWU-IOLM-00C-UI-A1/rebinds/20260723T002902Z-current-fixture-rebind/execution-receipt.json`.
- Result: `pass`; validation: `pass`; handle: `iolm-fixture-boundary/v1`.
- Generation: graph `1f0691fac9ed9612605d62d8b390e9b39eca24b6f11a6b0868c7591c6179e7ae`, source manifest `ed4a1fdf4684b26fb5dbf086cf98f80050734ffea1d2c845503f0bf429e9cd6e`, build receipt `14ac660824e8a697ef6ae3e20b18132bf99aa45f9adbe46e46e686db36260fbe`.

## Exact target delta

| Target | Baseline SHA-256 | Proposed delta |
|---|---|---|
| `WORK-PACK.md` | `c3783ab723662c855d12be05e20512adbf3892c1988c24c471612e5a8923df19` | Set workable-example gate to A2-selected; bind the fresh A1 result/receipt; mark current-generation A1 complete; select A2 only; keep A3/A4 gated; resolve the A1 fixture-drift blocker; update task row, gate check, SWU-reduction trace and next handoff. |
| `EXECUTION-PACK.md` | `4875995ee8d542f57513003cb9c2adad687c3d22985b8d9c9088072216359bba` | Replace A1-rebind-current execution posture with fresh-A1-complete/A2-regeneration-selected; keep downstream receipts gated and other execution lanes unchanged. |
| `IMPLEMENTATION-LAYERING.md` | `6fee5d41502ad833f0d22a3438111a01d6ddb5ab9fc49e5d4743f7bae9e024d5` | Record the current A1 boundary as passed evidence and make A2 regeneration the sole active L0C-demo implementation unit; preserve layer and promotion boundaries. |
| `DISTILL-VALIDATION.md` | `75fd25bfaa71655e5d2cb7b08f9b6607371cccca6a92d598b50d27a4610c79b2` | Update the selected smallest unit from A1 rebind to A2 regeneration; preserve unchanged split/recomposition proof and record fresh A1 predecessor evidence. |
| `DISPATCH.json` | `a79fb2f528fcf74dd21e6eaf192f9bf5e8d98f6fdacf04dc1058bafdf8d4651f` | Add/bind a passing native-stage receipt for `s0c-ui-fixture-boundary-rebind-20260722` with the fresh lifecycle paths and handle; leave `s0c-ui-demo-snapshot-regeneration-20260722` `not_run` but selected; update top-level strategy/frontier wording; do not add or execute a new step. |
| `work-pack/shared/context.md` | `4269272e52e388933ffc1adb3d078e693a609c7167ea30aa2a4f60dae1e9416d` | Record the current-generation A1 boundary handle as passed and A2 regeneration as the sole next runtime handoff. |
| `work-pack/shared/cross-task-gaps.md` | `fc97637d09ba7fab945ef775245c0c889fb80224530789227212abb13c07a603` | Mark `B-IOLM-A1-PINNED-FIXTURE-DRIFT` resolved by the exact fresh A1 receipt; preserve all independent blockers. |
| `work-pack/tasks/TASK-IOLM-00C-UI-WORKABLE-EXAMPLE.md` | `d4a2a54b352cda8c21860a945641f9b34fad66cde2623f9885f2f9f0de929358` | Parent status becomes fresh A1 passed/A2 selected; A1 status links the new rebind result and receipt; A2 becomes selected; A3/A4 remain gated; next-stop language remains one Task Session at a time. |
| `work-pack/waves/W0C-UI.md` | `3ef0f4a822f6d7c70293e6ff4c1133f01ba58f70e0e22936e0dcbc431f10e493` | Add fresh A1 to completed current-generation evidence; select A2 only; preserve A3/A4 gates and stop at `iolm-demo-snapshot/v1`. |
| `cyberAlchemy-v2/.craft/ledger.yml` | `c99fa7db7050cfe21e6aa598c8150259056216ae6b7184c8f1bcfe52478de393` | Canonical-first update of both IOLM next moves and task/wave artifact notes: fresh A1 complete, A2 selected, A3/A4 gated, unrelated 00C-B/authority residue unchanged. |
| `cyberAlchemy-v2/.craft/index.json` | `2033debbe946662dd6dbd311760747629b37e12a104f4525125fb623c7f91907` | Regenerate/synchronize the machine projection from the updated ledger and store its new ledger hash. |
| `cyberAlchemy-v2/CRAFT.md` | `71f8068b227132fd1e44957e92e9d589586a8756ed9a4162cc7a3caa002109ec` | Regenerate/synchronize human next moves, pending rows and artifact descriptions from the updated ledger. |

## Preserved state

- Historical A1-A4 results, A3 repair and both blocked A4 attempts remain immutable.
- The seven A1 implementation files and all A2-A4 implementation paths remain unchanged by Refresh.
- DomainSpec inputs, CAV2 authority, public Arcanum, 00C-B/C, G-DSV2-SG, promotion and publication are unchanged.
- The exact six-value `ineligible_for` fence is unchanged.
- Inventory remains a non-authority lookup and is not updated by this proposal.

## Apply order and validation

1. Recheck all twelve baseline hashes; block on drift.
2. Patch the nine canonical planning/Craft targets, with `cyberAlchemy-v2/.craft/ledger.yml` before its two projections.
3. Regenerate/synchronize `.craft/index.json` and `CRAFT.md` from the canonical ledger convention.
4. Validate A1 receipt and handle; JSON/YAML syntax; A2-only selection; A3/A4 preservation; Dispatch receipt references; Craft ledger/index/view parity; resolved drift blocker; stale A1-selection absence; implementation/source/historical boundary; scoped `git diff --check`.
5. Emit `iolm-ui-current-a1-a2-refresh-applied/v1`, route a strict A2 Context Pack and compact Goal, then stop at one A2 Task Session.
