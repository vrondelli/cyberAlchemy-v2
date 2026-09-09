# Mint — experiment harness (scaffold)

**Status:** scaffold (no examples run yet — Mint is not implemented). Owner: `sigil-development` +
`experiment-harness`. INTERNAL; promotes nothing.

## Falsification target (the gate Mint must pass)
The frozen pre-registration: [`../experiment-foundry-boundary/criterion.md`](../experiment-foundry-boundary/criterion.md)
(`mint-foundry-boundary-criterion`, validity-checked Lakatos-VALID after F1–F4). Each minted repo is
scored at its **mint-act output state** on Obs-A (autonomous localization, lexical-AND-owner-route-new),
Obs-B (no runtime governance leak), Obs-C (non-circular). **FALSIFIED if any observable FAILS on any
tested domain.** This harness exists to produce the HOLDS/FAILS table that the downstream run adjudicates.

## Fixtures / controls
- **`resonantos-economy-research` = NEGATIVE control on Obs-B (not a golden pass).** Its mint-act output
  (`authority/decisions/2026-06-26-standalone-repository.md`) **leaked** — it named cav2 as the method
  authority — and autonomy arrived only via the *separate later* `2026-06-29` decision. So it is the
  canonical example of the failure Mint must avoid: **if Mint reproduces resonantos's mint-act output,
  it FALSIFIES.** Also the structural **template source** (the shape to emit: authority-model / source-spine /
  promotion-policy / constitution / DEFINITIONS / crosswalk).
- **Golden (positive) fixture = `examples/release-approval/` (FIRST ONE — produced by SWU-3, 2026-06-29).**
  A hand-built mint-act output that PASSES all three observables at its mint-act output state (self-standing
  object-policy, no cav2 on any resolution path): a **process** domain (release-approval / change-advisory
  workflow) whose domain-originated kind **Change-class ruling** (owner route `change-class-governance`) is
  lexical-AND-owner-route-new. Self-checked by hand in `TASK-SESSION-SWU3.md` (Obs-A/B/C all HOLD; Obs-A
  carries one flagged contestable edge — a skeptic could re-read the kind as a Decision-subtype). This is
  **N=1, self-scored** — it closes the "none exists yet" gap but is NOT the frozen N=3 run.

## Example regimes (to author at implementation — low / medium / complex)
| regime | domain | tests |
|---|---|---|
| **low** | a minimal process domain (few kinds) | L0 compose + L1 emits ≥1 domain-originated kind (Obs-A); smallest no-leak check (Obs-B) |
| **medium** | the resonantos research domain (re-mint) | does Mint produce a *non-leaky* output where the hand-done precedent leaked? (Obs-B head-to-head vs the negative control) |
| **complex** | a product domain (governs a shipped artifact) | full criterion on a distinct authority shape; Obs-C (operable without cav2 D49 change) |

Per `experiment-harness`: require **real output bodies** (a minted authority surface), not save-summaries.
Codex runs explicit via `development/run-example-with-codex.sh` (to be created at implementation).

## Blocks carried into the harness
- **L2 (signed gate) — BLOCKED** on the new attestation/signer capability ([`../../attestation-capability/`](../../attestation-capability/)) — owner decision 2026-06-29 (build verifiable attestation, the moat); L2 waits on its L1 integrity-seal MVP. Examples cover L0+L1 only.
- **Public-attached mints — BLOCKED** on `BLK-CAV2-PUBLIC-PRIVATE-001`.

## Promotion-readiness gate (not yet met)
Mint may be proposed for promotion (out of `development/`) only after: the experiment **SURVIVES** on the
frozen N=3 domain set; the L2 signer block resolves; and the public/private blocker resolves. Until then:
INTERNAL, intended-not-shipped, in-development.
