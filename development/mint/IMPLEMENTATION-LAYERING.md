---
node_type: implementation-layering
is_session: false
status: candidate
boundary: INTERNAL — intended-not-shipped
created: 2026-06-29
authored_by: invoke (mode=plan)
---

# Mint — IMPLEMENTATION LAYERING

Layers are bounded by value/cost boundaries; promotion requires evidence from the prior layer,
not preference. Mint is **one casting organ**, layered minimum-working-unit first.

| Layer | Scope | Value at this layer | Cost / risk | Promotion evidence to next |
|---|---|---|---|---|
| **L0** scaffold compose | Mint wraps `domainspec-new-repo` (`--mode plan`→`apply`) to emit the partition tree + clone-safe attach | proves the compose seam works end-to-end on owned mechanics | low — all owned; the scaffolder is validated (goldenquill) | a minted tree resolves clone-safe (Step-7 verify passes) |
| **L1** authority-spine seed contract **(MVP)** | the emit-template set (from the external resonantos sibling) + emit domain authority-model/kinds (proposed) + source-spine + promotion-policy + constitution stub + definitions skeleton, via authority-triage (review-mode) | **the net-new core** — casts a real (if minimal) domain authority spine | medium — net-new; depends on authority-triage (review-mode, internal) | emitted authority-model parses; every proposed kind has a default-deny row; golden fixture = resonantos reproduced |
| **L2** signed decision-gate + crosswalk | emit signed `authority/decisions/<date>-mint.md`; owner ratifies kinds; emit framework crosswalk | makes the mint a *governance act of record*, not a file drop | medium — needs an actored owner-gate + a signer capability (open) | a committed signed decision record naming ratified kinds; crosswalk covers each domain↔framework concept |
| **L3** adopt-back (deferred) | register cav2 import surface for two-way adoption | closes the mint-out/adopt-back loop | medium — governed by VAULT-CONCEPT-ADOPTION; not MVP | — |

**Committed additions layer placement (decision 2026-07-01 — committed-not-built).** The 13 additions
sit predominantly in **L1** (authority-spine seed contract): definitions-lifecycle equipment (#8),
methods catalogue (#13), the meta patterns (#1/#2/#5/#9/#12), the seed-format contracts
(#3/#4/#6/#7/#17), and cheap nav/schema (#10/#18). The **ratify-CLOSE** (#11) spans **L1→L2** (it closes
the L2 owner-gate). Expanded-L1 promotion evidence: the drift-audit stub resolves the seeded
load-bearing-term rule (#8) and no minted kind is left `PROPOSED` (#11); seed-format items carry the
empty contract, not cav2's rows. Tier-3 surfaces are disclosed non-seeds, out of all layers. SWUs:
[WORK-PACK.md](./WORK-PACK.md) SWU-5..10.

## Layer-boundary heuristics applied
- **L0/L1 split** = owned-mechanism vs net-new-governance (the value jump is the authority casting).
- **L1/L2 split** = emitting artifacts vs the *signed governance act* (the gate is a distinct value + a distinct dependency, the signer capability).
- **L2/L3 split** = mint-out vs adopt-back (deferrable: crosswalk/adopt-back are *outputs about* the spine, not inputs to it).

## Open layer risks (residue)
- L2 needs a **signer/ratifier capability** — `decision-gate` doesn't model one (review C7). Resolve in sigil-development.
- A **public-attached** mint is blocked by `BLK-CAV2-PUBLIC-PRIVATE-001` regardless of layer.
- Emit-templates validated on **one** domain (resonantos); generalization is a layer risk, not proven coverage.

## Pre-L0 runtime gate (refresh 2026-08-07)

| Gate | Scope | Value | Explicit ceiling | Admission evidence |
|---|---|---|---|---|
| **P0** deterministic no-write plan | strict manifest validation, pinned-source and allowlisted-template checks, ordered effect inventory, canonical effect plan | makes the planned Mint contract executable and inspectable before effects | no target-byte rendering, filesystem apply, scaffold, attachment, authority act, journal/recovery, or consumer pilot | deterministic/no-write/refusal-path test suite passes |

P0 is a prerequisite to L0; it does not replace or renumber L0-L3. The next layer may consume P0 only
through the versioned manifest and effect-plan schemas, never by treating a successful plan as
authorization to write.
