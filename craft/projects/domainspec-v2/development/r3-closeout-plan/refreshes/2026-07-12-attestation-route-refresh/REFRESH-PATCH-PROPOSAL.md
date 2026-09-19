---
mode: refresh
mutation_mode: apply-approved
status: applied
created: 2026-07-12
---

# Refresh Patch Proposal: R3C Attestation Route

## Boundary

Approved and applied on 2026-07-12 through the named lifecycle owners. L1 means
tamper-evident integrity; it does not mean external actor authentication or a
full L2 seal. This record does not authorize additional mutations.

## Immediate Task Session deltas

| Target | Proposed delta | Signals |
|---|---|---|
| `development/r3-closeout-plan/WORK-PACK.md` | Set receipt/navigation state through SWU-R3C-009; make SWU-R3C-010 next; record the passed Decision Gate; change the SWU-010 done criteria to deterministic two-record manifest + source verification + L1 positive/tamper receipt; retain L2 FLAG. | 001, 003, 004 |
| `development/r3-closeout-plan/work-pack/tasks/TASK-R3C-AUTHORITY.md` | Replace generic unavailable-capability wording with the selected L1 contract and exact acceptance evidence; preserve L2 external-signature residue. | 001, 002, 004 |
| `.craft/ledger.yml` | Keep `BLK-DSV2-L2-ATTESTATION` active; set refinement status to refined; narrow summary/closure to external actor identity, signature, key model, and third-party verifier; set current next move to SWU-R3C-010 L1 receipt. | 001, 002, 005 |
| `CRAFT.md` | Re-export the refined blocker and current L1 route from the machine ledger. | 005 |

## SWU-R3C-010 new evidence

Create, do not predeclare complete:

1. deterministic manifest binding
   `authority/decisions/2026-06-29-mint.md` to
   `authority/decisions/2026-06-29-ratify-governance-kinds.md`;
2. repository-relative source paths, `attest.canon.v1` content digests, the
   three kind names, and the proposal→ratification edge;
3. independent source-digest recomputation before sealing;
4. L1 attestation JSON using actor metadata
   `domainspec-v2-authority-owner`;
5. `verify` positive arm and a content-mutated negative control;
6. receipt stating L1 integrity PASS and L2 external signature still open.

The verifier must check the live sources against the manifest before it checks
the manifest seal. Sealing an unchecked manifest is vacuous.

## Post-receipt Task Session deltas

| Target | Proposed delta after PASS only | Guard |
|---|---|---|
| `authority/AUTHORITY-MODEL.md` | Add dated pointer: ratified kinds have a DomainSpec L1 integrity receipt; L2 external actor signature remains pending. | Never say externally signed or L2 sealed. |
| `.craft/ledger.yml` / `CRAFT.md` | Record SWU-R3C-010 PASS/FLAG and link the receipt; retain the active L2 blocker. | Receipt required. |
| `development/r3-closeout-plan/WORK-PACK.md` | Mark SWU-010 complete with FLAG and route SWU-011 final verification. | Receipt and validation required. |

Do not rewrite the 2026-06-29 mint or ratification decisions. Store the
manifest, attestation, and receipt alongside them or in a dated authority
evidence folder and add links.

## Sigil Development deltas

| Target | Proposed delta | Signals |
|---|---|---|
| `cyberAlchemy-v2/development/attestation-capability/README.md` | Say L1 is built/demonstrated; link TASK-SESSION-L1 and specimen; change “next L1 build” to L1 consumption/hardening; retain INTERNAL/in-development, L2 intended-not-shipped, and no promotion claim. | 002, 006 |
| `cyberAlchemy-v2/development/attestation-capability/development/HARNESS.md` | Change scaffold/no-examples to L1 PASS; mark low-regime specimen complete; retain medium/complex and all L2 controls as future; keep promotion gate unmet. | 002, 007 |

## Required validation if approved

- `python3 arcanum/formulae/dispatch-spec/scripts/validate-dispatch.py <dispatch>`
- JSON parse and deterministic manifest rebuild.
- Independent recomputation of both canonical source digests.
- L1 `verify` on the exact manifest → `valid`.
- L1 `verify` on a content-mutated manifest → `tampered`.
- Craft YAML/index/human-view agreement.
- `npm --prefix projects/domainspec-v2/impl run validate:docs`.
- Private/public leak scan for new attestation evidence.
- Scoped `git diff --check`.

## Not proposed

- Closing `BLK-DSV2-L2-ATTESTATION`.
- Claiming actor identity, external signature, certification, or L2 seal.
- Designing key custody or a signing scheme.
- Promoting the attestation capability.
- Editing public `arcanum/`.
- Reopening completed backend graph-verification SWUs.
