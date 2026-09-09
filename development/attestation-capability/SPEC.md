---
node_type: spec
is_session: false
status: candidate
boundary: INTERNAL — moat-adjacent (verification RESULTS demonstrable; mechanism stays private)
created: 2026-06-29
authored_by: invoke (mode=define)
owner_next: sigil-development
lineage:
  - decision: cyberAlchemy-v2/authority/decisions/2026-06-29-mint-signer-and-boundary.md (Decision 1 — build a dedicated signer/attestation capability)
  - moat thesis: .arcanum/inventory/entries/machine-map-and-moat-synthesis.md (attestation + governance-data is the wall)
  - demonstration lesson: .arcanum/inventory/entries/kodamai-smithe-correctness-layer-synthesis.md (a runnable specimen/verifier, not the idea)
  - boundary rule: cyberAlchemy-v2/authority/decisions/2026-06-24-engine-moat-and-free-paid-boundary.md (cite results, withhold mechanism)
note: Paths are repo-root-relative from domainspec-core/.
---

# Attestation / Signer Capability — SPEC (define)

## Purpose
A planned cav2-native capability that **upgrades a "signed governance act" from an
attributional, committed markdown record into a verifiable attestation**. Today a cav2
governance act is only owner-authored + git-attributed (e.g. `authority/decisions/*.md`,
the resonantos decisions): authentic-by-convention, but **not tamper-evident and not
externally verifiable** (review C7 gap). This capability closes that gap.

It is **the moat infrastructure**, not a Mint sub-task: the deliberate "attestation IS the
moat" bet (`machine-map-and-moat-synthesis` — attestation + governance-data is the wall;
provability is a conjectural amplifier). It is greenlit and sequenced — **intended,
not shipped** — by `2026-06-29-mint-signer-and-boundary.md` Decision 1.

## The capability contract
```
attest(governance-act) → attestation-artifact
verify(attestation-artifact, claimed-state) → { valid | tampered | bad-signature | unknown-actor }
```
`attest` is the producer; `verify` is the **runnable third-party checker** — and `verify`,
per the Kodamai lesson, is where the differentiator lives (demonstration over assertion: a
specimen + a checker someone can run, not a claim that a proof exists).

### What a governance act is
A consequential, owner-ratified cav2 act that today lands as a committed record:
- a **decision record** (`authority/decisions/<date>-*.md`),
- a **promotion** (a candidate crossing a promotion gate in the authority lifecycle, D48),
- a **mint act** (Mint casting the authority spine onto a domain — `development/mint/`).

### What gets attested (the attested tuple)
`⟨ actor , act , artifact-state , timestamp ⟩` —
- **actor**: the ratifying identity (the cav2 authority owner; for a mint, the mint + the owner who ratified);
- **act**: which governance act (decision / promotion / mint), by id;
- **artifact-state**: the exact content the act ratified, fixed so it cannot drift silently;
- **timestamp**: when the act was attested.

The attestation **binds these together** so a third party can later check that *this actor*
ratified *this exact artifact state* at *this time* — and detect if any of it was altered.

## The upgrade ladder (honest about cost)
| Rung | What it gives | What it costs | Owned? |
|---|---|---|---|
| **L0 — attributional record** | Owner-authored decision/promotion/mint record; git author + decision-record owner line. Authentic *by social/repo convention*. | ~zero (the current cav2 way). | **Owned today** (the decision-record convention; git attribution). |
| **L1 — integrity seal (MVP)** | A **content-hash over the attested tuple** → tamper-evidence. Any edit to the artifact-state breaks the seal; `verify` becomes a real runnable check (hash recompute + compare). | Low — owned crypto primitive (hash), one canonicalization rule, one verifier. | **Build-from-owned** (primitive owned; the canonicalize+seal+verify wiring is new). |
| **L2 — external signature (the moat)** | A signature binding **actor identity** to the sealed tuple + a **verification procedure** a third party (auditor/board) runs to confirm *who* attested. This is the auditor-accepted, WTP wall. | Real — key/identity management, signing, an externally-runnable verifier + published verification procedure. | **Genuinely net-new** (see Build-from-owned). |

- **MVP rung = L1** (the integrity seal). It is buildable now, owned-primitive-based, and it is
  the first rung that makes `verify` a *runnable check* rather than a *convention*. It already
  upgrades Mint's "signed decision-gate record" from "committed markdown" to "tamper-evident".
- **Moat rung = L2** (external signature + verification procedure). This is the wall the strategy
  bets on; it is sequenced *after* the MVP and is the genuinely net-new commitment.

claim ≤ proof: only L0 is owned-and-done. L1 is the buildable MVP. L2 is intended-not-shipped.
Nothing here asserts the moat is built — it asserts the ladder and which rung is which.

## The verification procedure (the moat — demonstration over assertion)
What a third party runs against an attestation artifact:
1. **Canonicalize** the claimed artifact-state by the one fixed canonicalization rule.
2. **Recompute the content-hash** and compare to the seal in the artifact (**L1 tamper-check**:
   pass ⇒ the artifact-state is exactly what was attested; fail ⇒ `tampered`).
3. **(L2)** Verify the **signature** over the sealed tuple against the actor's published identity
   (pass ⇒ that actor attested it; fail ⇒ `bad-signature` / `unknown-actor`).
4. Emit a verdict: `valid | tampered | bad-signature | unknown-actor`.

The Kodamai lesson, applied: their corpus markets a "proof artifact" but ships **no runnable
checker, no specimen, no named proof system**. Our edge is the inverse — a **runnable `verify` +
a checked-in specimen attestation**. The *results* of verify are demonstrable (we can show a
third party a passing run and a tamper-detected run); the *mechanism* stays private.

## Build-from-owned (claim ≤ proof)
**Owned, cited:**
- **The decision-record convention** = L0: `authority/decisions/<date>-*.md` with an owner line +
  git attribution (the resonantos decisions; `authority/decisions/README.md`). This is the existing
  "signed governance act" the capability upgrades.
- **The sound-verifier discipline** (the *template* for `verify`, not the attestation itself):
  `domainspec-lean-formalization/lean-engineer/AgentPermissionKernel.lean` shows the owned posture —
  a **decidable judgment defined independently of what it checks, with soundness machine-checked**
  (`decidePolicy` / `decidePolicy_sound` / `decidePolicy_allow_iff`). The attestation **verifier**
  should inherit that discipline: an independently-defined decidable check whose pass-condition is
  pinned, so "verify says valid" is a sound statement, not a vibe. (Owned by Victor Boscaro, Apache 2.0.)
- **The content-hash / integrity primitive** (L1) — standard owned crypto; we own the *wiring*, not novelty.

**Genuinely net-new (name it honestly):**
- **L2 — binding an external actor identity to the sealed tuple via signature, plus a published,
  third-party-runnable verification procedure.** Nothing owned today binds *actor identity* to *act*
  in an externally-verifiable way; git attribution is repo-internal and not a cryptographic actor
  proof. This rung — actor-identity signature + the verifier+specimen a stranger can run — is the
  net-new moat work. (Consistent with the Kodamai finding: the differentiator is the runnable
  verifier+specimen, not the idea.)

## Boundary — INTERNAL, moat-adjacent
- Per `2026-06-24-engine-moat-and-free-paid-boundary.md` (cite-results-withhold-mechanism): the
  **verification results are demonstrable** (show a passing verify, a tamper-detected verify, a
  specimen attestation) but the **attestation/signing/verifier mechanism stays private** — same
  posture as the deterministic engine algorithm.
- **intended-not-shipped.** Greenlit + sequenced by Decision 1; this package defines+designs it and
  hands off. No stage may describe it as built.
- Never leak into public `arcanum/` (Arcanum is public; cav2 is private).

## How it gates Mint L2
Mint's contract (`development/mint/SPEC.md` §5) requires a **signed decision-gate record** because
"minting is a governance act, not a file drop." Mint's HANDOFF + the greenlighting decision route
Mint **L2 (the signed decision-gate stage / SWU-4)** through this capability:
- Mint's L2 stage calls `attest(mint-act)` to produce the verifiable attestation of the mint
  governance act (actor = mint + ratifying owner; artifact-state = the minted authority spine it cast).
- **Until this capability exists, Mint L2 is blocked** (the MVP L0+L1 of Mint stay buildable). This
  capability is Mint L2's **NEW upstream dependency**, by Decision 1.
- The MVP rung of *this* capability (L1 integrity seal) is sufficient to unblock Mint L2 with a
  tamper-evident record; L2 (external signature) hardens it to the full moat.

## Glossary
- **governance act** — a consequential owner-ratified cav2 act (decision / promotion / mint act) that lands as a committed record.
- **attestation artifact** — the output of `attest`: the sealed (and, at L2, signed) `⟨actor, act, artifact-state, timestamp⟩` tuple.
- **integrity seal (L1)** — a content-hash over the attested tuple; tamper-evidence.
- **attestation (L2)** — an external-actor-identity signature over the sealed tuple + a third-party verification procedure.
- **verify** — the runnable third-party checker; the differentiator (specimen + checker, not a claim).
