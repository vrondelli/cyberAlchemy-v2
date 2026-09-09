---
node_type: handoff
is_session: false
status: candidate
boundary: INTERNAL — intended-not-shipped
created: 2026-06-29
authored_by: invoke (mode=define/design/plan)
next_owner: sigil-development
chain: invoke (authoring) → sigil-development (build the Mint sigil) → task-session (execute SWUs)
note: Paths repo-root-relative from domainspec-core/.
---

# Mint — HANDOFF (invoke → sigil-development)

## What invoke authored (this package)
`cyberAlchemy-v2/development/mint/`: `SPEC.md` (define) · `ARCHITECTURE-BUNDLE.md` (design, re-grounded) ·
`EXECUTION-PACK.md` (plan) · `IMPLEMENTATION-LAYERING.md` · `WORK-PACK.md` · this `HANDOFF.md`.
All carry the `mint-design-plan-review` FIX changes (C1 re-grounded, C2 demoted, C3–C11 applied).
**Refreshed 2026-07-01** (invoke mode=refresh) with the Mint⟵cav2 inheritance-audit additions — see
[SPEC §Committed additions](./SPEC.md) and `development/2026-07-01-additions-refresh-report.md`.

## Supersession (honesty)
This package **supersedes the C1/C2 justification** of `development/refinement-runs/20260629T0000Z-cav2-mint-feature/RESULT.md`
(its "alters a D49 kind" + "two-System-5 decisive" legs were cracked by review). RESULT.md remains the
refine-run record; the *current* justification is ARCHITECTURE-BUNDLE §Re-grounded justification.

## What sigil-development owns next
Build the **Mint sigil** from this authoring package: the skill body, the compose-call to
`domainspec-new-repo`, the authority-triage emit step, the actored owner-gate, validation
(experiment-harness, **resonantos as the golden fixture**), observability, and promotion-readiness.
Invoke does **not** claim the sigil lifecycle is complete — this is a handoff.

## Open items routed forward (not resolved here)
| item | owner | gate |
|---|---|---|
| signer/ratifier capability for the owner-gate (decision-gate models none — review C7) | sigil-development (design) | blocks L2 SWU-4 |
| `BLK-CAV2-PUBLIC-PRIVATE-001` (public-attached mint) | decision-gate | blocks public mints |
| emit-templates validated on **one** domain only | sigil-development (validation) | generalization risk, not coverage |
| `ART-MINT-AUTHORITY-TRIAGE` craft row (review C9) | applied to `.craft/ledger.yml` this run | — |
| **13 authority-inheritance additions + 6 disclosed non-seeds** (audit + decision 2026-07-01) | sigil-development (build) | none — owner-approved scope; Tier-1 (#8/#11/#13) first (close live defects) |

## Recommended next route
**sigil-development --new** (build the Mint sigil), then **task-session** for SWU-1..SWU-3 (the L0+L1 MVP),
then **SWU-5..10** (the 2026-07-01 committed additions — Tier-1 SWU-5/6/7 first, they close live defects).
Do not start L2 until the signer-capability gap is closed; do not emit a public-attached mint until `BLK-CAV2-PUBLIC-PRIVATE-001` resolves.

## Connection + scope guard (attestation · body-war candidate witness)
- **Attestation L1 gates Mint L2** (the moat rung) — see `../attestation-capability/` (the discriminating verify).
- **body-war (TROQAR zone-control) is a PLANNED, runnable witness of the discriminating-verify pattern's
  generality** — a non-cav2, playable specimen of `verify(valid) ∧ verify(tampered)`. **INTENDED-NOT-BUILT.**
- **Scope guard (claim ≤ proof):** body-war witnesses *verify-pattern generality* — a DIFFERENT claim from
  the **FROZEN** N=3 foundry-H (`experiment-foundry-boundary/criterion.md`, Obs-A/B/C autonomy). **Do NOT**
  fold body-war into the §5 domain set (research/product/process is frozen) and **do NOT edit the frozen
  criterion** (any edit = a new criterion).

## Runtime-first handoff refresh (2026-08-07)

The next admitted unit is `SWU-MINT-RUNTIME-PLAN-01`, owned by sigil-development for contract/runtime
revision and Task Session for bounded execution. Its exact behavior is `strict manifest -> canonical
no-write effect plan`. Implementation Readiness must confirm the declared runtime-only write scope and
validation commands before execution.

Zagr is deliberately deferred. After P0 passes, a separate plan may use Zagr only as a read-only domain
corpus and mint into a new disposable private target. P0 success is not a mint, L0/L1 proof, governance
act, release, or permission to apply effects.
