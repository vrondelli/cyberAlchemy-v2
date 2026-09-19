---
tags: [framework-unification, scope, boundary, conventions, honesty]
node_type: conceptual
is_session: false
layer: architecture
nature: reference
status: active
version: 0.1.0
last_updated: 2026-06-15
created_by: victorboscaro@gmail.com
---

# Framework Unification — Scope & Conventions

> **The one place.** Every informational object in this workspace links here instead of
> repeating the aspirational boundary or the open-questions rule per-doc. State it once; harder
> to lose, cheaper than per-doc caveats (IMPROVEMENTS A-3).

---

## 1. Division of labor — where novelty lives vs what this workspace is

| Repo | Owns | Success criterion |
|---|---|---|
| `../../domainspec-lean-formalization` (Lean) | **Novelty** — the typed residue object, the theorems, the sorry-free proofs. | proved / novel |
| **This workspace** (`framework-unification`, incl. `cyber-alchemy-lean-fusion`) | **Operationalization** — making the CyberAlchemy lifecycle *useful* inside Arcanum. | **useful, not novel** |

This is already latent in [`layers/cyber-alchemy-lean-fusion/DESIGN.md`](layers/cyber-alchemy-lean-fusion/DESIGN.md) §2: *Arcanum = the lifecycle machine [here]; the Lean repo = the formal conscience [there]*.

### Consequence — the §5 collapse-test was mis-applied here
The fusion DESIGN §5 collapse-test ("if the residue isn't *typed*, it's the existing
`residuality-spec` renamed → contribution zero") applies a **novelty bar** to the operational
layer — a category error. The right bar **here** is **utility**. The typed-residue object is the
Lean repo's contribution, not this workspace's.

### Consequence — the §7 "residue-type blocker" is reassigned, not abandoned
"What type fires the gate mechanically?" (DESIGN §7) is a **Lean-repo** question (it owns the
type). **Here** it is a **future integration point**, not a blocker: operationalize with the
open-questions discipline (§3) *now*; **import** the Lean type via the bridge **if/when** an
automated mechanical gate (Pass/Flag/Block without a human) is actually needed.

---

## 2. The aspirational boundary — CERTIFIED vs ASSUMED (do not overclaim)

Any doc touching the Lean backing or PermGuard links here instead of restating this.

- **Lean backing.** The proofs certify the **formal residue object** (Lan/colimits over
  presheaves). They do **NOT** certify that an Arcanum run is lossless or correct. Typed residue
  on agent artifacts is bookkeeping *inspired by* the formal object, **not certified by it**
  (DESIGN §4). No sentence may make "the engine / the run / the system" the subject of
  "verified / proved / machine-checked."
- **PermGuard.** A verified **decision core**, **not** security. The `permguard` binary exists
  (sorry-free) but was **never wired** into an Arcanum dispatch. A machine-checked **negative**
  bounds it: `curl` via `Bash` provably evades the egress guard (`isEgress` covers only
  `WebFetch`). It is honesty infrastructure, **not** a security guarantee
  ([`layers/cyber-alchemy-lean-fusion/PERMGUARD-IN-ARCANUM.md`](layers/cyber-alchemy-lean-fusion/PERMGUARD-IN-ARCANUM.md) §4).

---

## 3. Convention — open-questions in every informational object

The **operational residue accounting** for this workspace (the useful form of "what this
transformation did not preserve") is a **well-defined Open Questions section in every
informational object** — research, findings, discovery, views, plan, improvements, and the like.

**Rule.** Each such artifact MUST carry an `## Open Questions` section (an equivalently-named
one — e.g. "Open seams" — counts). Each entry is:

- **OQ-N. <one-line question>** — **Context:** why it is open. **Recommendation:** the next move
  or "defer". **Status:** `OPEN | deferred | resolved-elsewhere`.

**What this discipline is and is not.** It is honest bookkeeping + a human-gated orientation
aid — the *useful* residue ledger for now. It is **not** a mechanical gate: prose OQs do not
auto-reject an artifact. Automated Pass/Flag/Block would require the Lean type (§1) — deferred.

---

## Connections

| Document | Type | Description |
|---|---|---|
| [discovery/discovery.md](discovery/discovery.md) | `relates-to` | The orientation map this scope governs. |
| [IMPROVEMENTS.md](IMPROVEMENTS.md) | `relates-to` | A-3 proposed this doc; A-1/C reprioritized by §1. |
| [layers/cyber-alchemy-lean-fusion/DESIGN.md](layers/cyber-alchemy-lean-fusion/DESIGN.md) | `cites` | §2 division of labor; §4 honesty border; §5/§7 reframed here. |
| [layers/cyber-alchemy-lean-fusion/PERMGUARD-IN-ARCANUM.md](layers/cyber-alchemy-lean-fusion/PERMGUARD-IN-ARCANUM.md) | `cites` | §4 CERTIFIED-vs-ASSUMED border for PermGuard. |
