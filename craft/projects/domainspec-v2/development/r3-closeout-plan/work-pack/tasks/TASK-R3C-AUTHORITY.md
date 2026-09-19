# TASK-R3C-AUTHORITY: Closeout, Craft, Observability, And Attestation

Layer: L3.
Slice: S-R3C-005.
Wave: [W3](../waves/W3.md).

## Objective

Keep the project control plane honest after execution and preserve the attestation boundary.

## Source Contracts

- `projects/domainspec-v2/.craft/ledger.yml`
- `projects/domainspec-v2/CRAFT.md`
- `.arcanum/observability/`
- `projects/domainspec-v2/authority/`

## Dependencies

Run after executed SWUs have receipts, or explicitly record which SWUs are deferred.

## Implementation Detail

Closeout must separate:

- R3A complete,
- downstream APE enforcement complete or still active,
- future relation/category-law routes,
- L1 integrity evidence received or absent,
- L2 external actor-signature seal blocked or received.

## Smallest Working Units

### SWU-R3C-009

- Goal: sync Craft and observability after executed SWUs.
- Dependencies: completed/deferred SWU receipts.
- Write scope: `.craft/ledger.yml`, `CRAFT.md`, `.arcanum/observability/` only.
- Done criteria: active gaps/blockers reflect receipts; no stale R3-blocked wording in active surfaces.
- Acceptance evidence: YAML/JSONL parse and stale scan pass.
- Validation: `python3 -c` YAML parse; JSONL parse; `git diff --check`.
- Execution owner: local-fallback.
- Handoff note: do not edit historical receipts except with dated follow-up notes.

### SWU-R3C-010

Status: **completed with FLAG 2026-07-12** — [Task Session receipt](../../task-sessions/2026-07-12-swu-r3c-010/TASK-SESSION-RESULT.md); L1 integrity PASS, external L2 signature blocked.

- Goal: produce the approved DomainSpec L1 integrity receipt without collapsing it into L2 actor authentication.
- Dependencies: SWU-R3C-009.
- Decision input: `DEC-R3C-ATTESTATION-ASSURANCE-PAYLOAD` — L1 now, deterministic mint-proposal→owner-ratification manifest, L2 retained.
- Write scope: dated `authority/attestations/` evidence; receipt-backed Craft/work-pack/authority pointers; no historical-decision rewrite.
- Done criteria:
  - both live governance records match their pinned `attest.canon.v1` digests;
  - deterministic manifest binds their paths, digests, three kind names, and proposal→ratification relation;
  - independent source verification passes before sealing;
  - exact manifest verifies `valid` and a content-mutated manifest verifies `tampered`;
  - receipt calls the result L1 integrity only and retains the L2 blocker.
- Acceptance evidence: manifest, L1 attestation JSON, source-verification and discriminating-control receipt, Task Session result.
- Validation: deterministic manifest rebuild; private `attest.py verify` positive/negative arms; Craft YAML/docs/private-boundary/diff checks.
- Execution owner: local-fallback Task Session.
- Handoff note: L1 unblocks R3 closeout verification with FLAG; it does not close the full L2 authority seal.

## Synchronization

After an L1 PASS, synchronize the receipt and keep `BLK-DSV2-L2-ATTESTATION` active with its refined external-signature closure condition.
