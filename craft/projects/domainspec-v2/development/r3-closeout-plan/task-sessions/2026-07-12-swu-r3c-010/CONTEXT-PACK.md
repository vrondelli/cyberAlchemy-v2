---
artifact_role: task-session-context-pack
task: SWU-R3C-010
mode: lean
strict_coverage: pass
created: 2026-07-12
dispatch_id: domainspec-v2-r3c-attestation-route-refresh
---

# Context Pack — SWU-R3C-010

## Objective

Apply the approved R3/Craft attestation-route refresh, create a deterministic
manifest binding the DomainSpec v2 mint proposal to its owner ratification,
produce and discriminate an L1 integrity seal, then synchronize receipt-backed
state without claiming L2 actor authentication.

## Obligation matrix

| ID | Obligation | Evidence | Coverage |
|---|---|---|---|
| O1 | Use L1 now and retain L2 as a separate active blocker. | `DEC-R3C-ATTESTATION-ASSURANCE-PAYLOAD` | covered |
| O2 | Bind both governance acts, not the whole authority tree. | selected payload option 2 | covered |
| O3 | Recompute live source digests before accepting or sealing the manifest. | private `attest.py`; source records | covered |
| O4 | Prove both positive and content-tampered verification arms. | L1 capability contract and passing prior specimen | covered |
| O5 | Keep actor as role metadata, not identity proof. | decision assumption | covered |
| O6 | Refine, never close, `BLK-DSV2-L2-ATTESTATION`. | Craft machine/human views | covered |
| O7 | Preserve historical mint/ratification records byte-for-byte. | Task Session handoff boundary | covered |
| O8 | Route capability projection correction through sigil-development. | approved refresh dispatch | covered |
| O9 | Update authority model only after a real DomainSpec L1 receipt exists. | patch proposal post-receipt guard | covered |

## Canonical source pin

Canonicalization: `attest.canon.v1` from the private attestation implementation.

| Role | Repository-relative source | Canonical SHA-256 | Kind-name check |
|---|---|---|---|
| proposal | `authority/decisions/2026-06-29-mint.md` | `66e715417231c4756756e6cfc1484d21201de910673737cf616156c1e123bf36` | validation, layering, drift present |
| ratification | `authority/decisions/2026-06-29-ratify-governance-kinds.md` | `c94b530de5e889f428dcc86b14e9627287136536be91f84e0e9b46c2e78ba1da` | validation, layering, drift present |

Any live-source mismatch blocks the run; the manifest must not silently absorb
source drift.

## Selected context

- R3 work-pack and `TASK-R3C-AUTHORITY` SWU-010 contract.
- Approved refresh report, patch proposal, and validated dispatch.
- Passed attestation assurance/payload decision.
- Craft machine ledger and human projection.
- DomainSpec authority model plus immutable proposal/ratification decisions.
- Private attestation README, harness, L1 receipt, specimen, and implementation.

## Write scope

- `development/r3-closeout-plan/WORK-PACK.md` and
  `work-pack/tasks/TASK-R3C-AUTHORITY.md`.
- `.craft/ledger.yml` and `CRAFT.md`.
- new dated evidence under `authority/attestations/`.
- dated pointer/status delta in `authority/AUTHORITY-MODEL.md` after PASS only.
- this Task Session context/receipt.
- private attestation `README.md` and `development/HARNESS.md` only through the
  sigil-development update lane.
- repository-local observability after validation.

## Non-goals and hard constraints

- Do not edit the 2026-06-29 proposal or ratification records.
- Do not close the L2 blocker or claim external signature, actor authentication,
  certification, or L2 seal.
- Do not design keys, custody, or identity scheme.
- Do not promote the attestation sigil.
- Do not copy private mechanism or DomainSpec authority prose into public
  `arcanum/`.
- No subagents: approved dispatch strategy is `none`.

## Done criteria

1. Immediate R3/Craft projections name SWU-R3C-010 as the selected L1 route.
2. Deterministic manifest source digests recompute from both live records.
3. Rebuilding the manifest yields identical bytes.
4. L1 attestation verifies the exact manifest as `valid`.
5. A content-mutated manifest verifies as `tampered`.
6. Receipt explicitly preserves L2 residue.
7. Craft YAML/human view, work-pack, authority pointer, and docs agree.
8. Capability README/HARNESS reflect built L1 and unbuilt L2 without promotion.

## Gate verdict

PASS. Two operator decisions are resolved, apply approval is confirmed, both
source digests and three-kind membership checks pass, validation surfaces exist,
and no unresolved blocker prevents L1 execution. Full L2 remains out of scope.
