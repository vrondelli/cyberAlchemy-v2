# Agent reasoning engine — Craft view

> Derived human view. Authority remains in [`.craft/ledger.yml`](.craft/ledger.yml).
> This scoped ledger does not validate or repair the parent `cyberAlchemy-v2` ledger.

## Quick links

- Next move: [revise the ACI-subordinate plan](#next-move)
- Active blockers: [`BLK-ARE-ACI-MATURITY-001`](#active-external-maturity-blocker)
- Blocking decisions: none
- Active gaps: [downstream residue](#active-gaps-and-residue)
- Terminal artifacts: [L0 promotion](decisions/g-are-l0-promotion/PROMOTION-RECEIPT.json), [binding decision](decisions/aci-reasoning-binding/BINDING-RECEIPT.json)

## Context CTX-ARE-ROOT

- **Stage / gate:** `aci-binding-selected-plan-revision` / `pass`
- **L0:** `SWU-ARE-001` completed and its bounded private witness is promoted.
- **Binding:** `G-ARE-ACI-BINDING` passed with option A, selecting an
  ACI-subordinate target and an explicitly local-only interim.
- **Selected work:** none. No downstream SWU is authorized.
- **Current route:** `invoke:plan ACI-subordinate conformance revision`.

## Closed ACI binding decision

`DEC-ARE-ACI-BINDING` selected the ACI-subordinate target. Integrated journal
facts, canonical acceptance identity, replay cursor, and effect intents belong
to ACI; semantic derivation and reasoning-receipt content remain
evaluator-owned. The decision is evidenced by
[`ART-ARE-ACI-BINDING-RECEIPT`](decisions/aci-reasoning-binding/BINDING-RECEIPT.json).

This closes the local ownership-disposition blocker only. It does not establish
runtime compatibility or authorize implementation.

## Active external maturity blocker

`BLK-ARE-ACI-MATURITY-001` blocks integrated execution. ACI runtime remains
blocked, Bus has no later post-remediation `PASS`, ACP is discovery, APT
mutation is blocked, and cross-repository conformance receipts do not exist.
Local-only evidence must remain explicitly non-integrated.

## Active gaps and residue

- **GAP-ARE-ARTIFACT-DURABILITY:** artifact admission and production durability remain L2 work.
- **GAP-ARE-INCIDENT-READINESS:** incident behavior and operational response remain downstream.
- **GAP-ARE-ROLLOUT-READINESS:** private rollout and the general-engine label remain unsupported.
- **GAP-ARE-INTENT-EVIDENCE:** revision-history and inter-rater evidence remain outside L0.
- **GAP-ARE-ANTI-BIAS-EFFICACY:** anti-bias efficacy remains explicitly excluded.

## Artifacts

| ID | Status | Meaning |
|---|---|---|
| ART-ARE-L0-PROMOTION-RECEIPT | pass | Bounded L0 admission; no implementation authority |
| ART-ARE-ACI-BINDING-DESIGN | pass | Accepted ACI-subordinate target architecture |
| ART-ARE-ACI-BINDING-RECEIPT | pass | Explicit option-A owner selection |
| ART-ARE-ACI-ADR-001 | accepted-w0-only | External decision evidence; runtime remains blocked |
| ART-ARE-ACI-WORK-PACK | blocked | External runtime-maturity evidence |
| ART-ARE-BUS-ASSESSMENT | fix | Candidate publication seam; no later PASS |
| ART-ARE-APT-WORK-PACK | mutation-blocked | Candidate lineage seam; no mutation authority |

## Next move

Run `invoke:plan ACI-subordinate conformance revision`. Do not select an
implementation SWU until external-maturity and task-specific gates pass.
