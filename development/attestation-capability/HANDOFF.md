---
node_type: handoff
is_session: false
status: candidate
boundary: INTERNAL — moat-adjacent (intended-not-shipped; results demonstrable, mechanism private)
created: 2026-06-29
authored_by: invoke (mode=define/design)
next_owner: sigil-development
chain: invoke (authoring) → sigil-development (build the attestation/signer capability) → task-session (execute SWUs)
note: Paths repo-root-relative from domainspec-core/.
---

# Attestation / Signer Capability — HANDOFF (invoke → sigil-development)

## What invoke authored (this package)
`cyberAlchemy-v2/development/attestation-capability/`:
- `SPEC.md` (define) — purpose, the capability contract, what's attested (the `⟨actor, act, artifact-state, timestamp⟩` tuple), the L0/L1/L2 upgrade ladder with **L1 as MVP** and **L2 as the moat**, the verification procedure, build-from-owned split, boundary, and how it gates Mint L2.
- `ARCHITECTURE.md` (design) — the design for the **MVP rung (L1 integrity seal) + the runnable `verify`**; the mandatory specimen; L2 sketched not designed.
- this `HANDOFF.md`.

## Why this is first-class (not a Mint sub-task)
Greenlit by `cyberAlchemy-v2/authority/decisions/2026-06-29-mint-signer-and-boundary.md` Decision 1
as a **strategic initiative**: the deliberate "attestation IS the moat" bet
(`.arcanum/inventory/entries/machine-map-and-moat-synthesis.md`). Treat it as the moat infrastructure,
sequenced ahead of Mint L2 — not a quick unblock.

## What sigil-development owns next
Build the **attestation/signer capability** from this package:
- the `attest` (L1 seal) producer and the **runnable `verify` checker** (decidable, total, sound `valid`);
- the frozen **canonicalization rule** + `canon_version` governance;
- the **checked-in specimen** + a demonstrable `verify → valid` / `verify → tampered` run (the differentiator — demonstration over assertion);
- observability + promotion-readiness for the capability;
- then the L2 rung (external-actor signature + published verification procedure) as the moat hardening.

Invoke does **not** claim the lifecycle is complete or that the capability is built — this is a handoff.

## Build-from-owned (carry this forward honestly)
- **Owned (L0):** the decision-record convention (`authority/decisions/*.md`, owner line + git attribution) — already the "signed governance act".
- **Owned template for `verify`:** `domainspec-lean-formalization/lean-engineer/AgentPermissionKernel.lean`'s sound-decidable-judgment discipline (`decidePolicy_sound` / `decidePolicy_allow_iff`) — inherit the *independently-defined, soundness-pinned* posture.
- **Owned primitive (L1):** content-hash; we own the wiring, not novelty.
- **Net-new (L2):** binding **external actor identity** to the sealed tuple via signature + a third-party-runnable verification procedure. This is the moat work — name it as net-new, not build-from-owned.

## Boundary to honor
INTERNAL, moat-adjacent. **Demonstrate results** (specimen, verdicts, passing/tampered runs);
**withhold mechanism** (canon rule, hash construction, serialization, L2 signing/identity) — per
`2026-06-24-engine-moat-and-free-paid-boundary.md`. intended-not-shipped; never leak into public `arcanum/`.

## How it gates Mint L2 (the consuming dependency)
Mint's L2 "signed decision-gate" stage (`cyberAlchemy-v2/development/mint/` — SPEC §5, HANDOFF
"signer/ratifier ... blocks L2 SWU-4") consumes `attest(mint-act)`. Mint L2 stays **blocked** until
this capability's MVP (L1) exists; Mint's own L0+L1 MVP remain buildable meanwhile. When this lands,
update Mint's L2 block reason from "gated on the attestation/signer capability (decided 2026-06-29 to
build)" to "attestation capability available (L1)".

## Open questions routed forward (not resolved here)
| item | owner | gate |
|---|---|---|
| hash/canonicalization primitive choice + `canon_version` governance | sigil-development (design) | blocks L1 build |
| storage of attestation artifact (inline vs sidecar) | sigil-development (design) | L1 detail |
| machine-check L1's no-false-`valid` soundness now vs after L2 | lean-formalization (amplifier) | not on MVP critical path |
| L2 actor-identity model (per-owner vs org key; public-identity distribution) | sigil-development + decision-gate | blocks L2 (the moat rung) |

## Recommended next route
**sigil-development --new** (build the attestation/signer capability), then **task-session** for the
L1 MVP SWUs (`attest` + `verify` + specimen). Do not start L2 until the actor-identity model is decided.
Mint L2 should not resume until this capability's L1 is available.
