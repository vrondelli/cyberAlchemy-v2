---
node_type: template
is_session: false
status: candidate
boundary: INTERNAL — Mint emit-template (addition #11, SWU-6); intended-not-shipped, non-executed
created: 2026-07-01
authored_by: sigil-development (--new, Tier-1 additions build)
swu: SWU-6 (ratify-CLOSE step) — addition #11
source_artifact: projects/domainspec-v2/authority/decisions/2026-06-29-ratify-governance-kinds.md (hand-authored post-mint; witnessed gap)
emits_to: <TARGET_REPO>/authority/decisions/<date>-ratify-mint.md
rationale: >
  Audit finding G1/#11 — the mint flow templated the PROPOSE half (decision-mint) but not the CLOSE
  half, so minted kinds stay PROPOSED forever (the experiment product still is; domainspec-v2 needed a
  hand-authored ratify file). THIS is the close-of the D49 owner-gate: the owner's ratification that
  moves each proposed kind PROPOSED → ratified.
leak_strip: |
  The ratifier is the DOMAIN authority owner, never cav2. cav2 is not a party to the ratification.
  Inherits the close-record FORMAT, localizes the verdicts.
---

<!--
  MINT EMIT-TEMPLATE (intended-not-shipped). INHERITS: the ratify-close record FORMAT (the CLOSE of the
  D49 owner-gate). LOCALIZES: the per-kind verdicts. Emitted at STAGE 3, AFTER the domain owner reviews
  the kinds proposed by decision-mint. It is the close-row to decision-mint's open-row: without it, kinds
  are asserted, not live. Pairs with authority/decisions/<date>-mint.md (the PROPOSE record).
-->

# <DOMAIN> Mint — Kind Ratification (CLOSE of the D49 owner-gate)

Status: <ratified | partially-ratified | blocked>
Owner: <DOMAIN> authority owner
Closes: [<date>-mint.md](./<date>-mint.md) (the PROPOSE record)
Signed record: PLACEHOLDER (L0-attributional) — L2 attestation pending on `../../attestation-capability/`.

## What this record does
The `<date>-mint.md` record **proposed** the domain-originated authority kinds. This record is the cav2
authority owner's / domain owner's **ratification** — the CLOSE of the D49 owner-gate. Every proposed
kind moves to a terminal state here; **no kind is left `PROPOSED`** (audit #11 acceptance).

## Ratification ledger
| Proposed kind | Owner route | Verdict | Ratified state | Note |
| --- | --- | --- | --- | --- |
| **<DOMAIN_ORIGINATED_KIND_1>** | <DOMAIN_NEW_OWNER_ROUTE_1> | `ratify` | **active** | now a live domain-local kind |
| **<DOMAIN_ORIGINATED_KIND_2>** | <DOMAIN_NEW_OWNER_ROUTE_2> | `ratify \| reject \| defer` | active \| withdrawn \| pending | <owner reason> |

## Verdict vocabulary
- `ratify` → the kind becomes **active** in `authority/AUTHORITY-MODEL.md` (drop the `PROPOSED` flag).
- `reject` → the kind is withdrawn from the kinds table (record why; a rejected kind is a typed negative).
- `defer` → the kind stays `PROPOSED` **with a named blocking question + owner + revisit trigger** (not an
  open-ended PROPOSED — a deferral is a decision, not a limbo).

## Gate (audit #11 acceptance)
- `pass`: every proposed kind has a terminal verdict; the AUTHORITY-MODEL is updated so no row reads
  `PROPOSED` without a matching `defer` deferral record here.
- `block`: a proposed kind has no verdict — the mint is not closed until the owner ratifies.

<!-- Emitting the propose record without this close record is exactly the #11 defect. The mint flow
     stage 3 emits BOTH: decision-mint (propose) then decision-ratify (close). -->
