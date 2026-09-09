---
run_id: 20260629T0000Z-cav2-mint-feature
target: cav2 "Mint" feature
status: pass
preset: standard
research_mode: no-research
final_verdict: design-fork resolved + MVP-ready non-executed plan
boundary: INTERNAL — Mint intended-not-shipped; foundry/moat candidate
---

# Refine Result — cav2 "Mint" feature

> **Superseded note (2026-06-29).** The `mint-design-plan-review` (FIX verdict) cracked this
> document's **C1** ("alters a D49 kind") and **C2** (two-System-5 as decisive) justification legs.
> The *conclusion below stands*, but its current, re-grounded justification (charter clash +
> signed-governance-act; the mint *proposes* kinds, owner ratifies — no D49 change) lives in the
> canonical package **`cyberAlchemy-v2/development/mint/ARCHITECTURE-BUNDLE.md`**. Read that for the
> live design; this file is the refine-run record.

## One-sentence synthesis
**Mint = a NEW cav2-native skill that *composes* `domainspec-new-repo` for the ~30% repo
scaffold and runs the ~70% authority-spine casting as a distinct cav2-owned governance act** —
build-from-owned on the scaffolder's *mechanism* (its clone-safe defect-fixes) without inheriting
its non-authority posture, and respecting the two-System-5 boundary (cav2 MOLD ≠ DomainSpec baseline).

## The resolved design fork (dialectic)
Three positions were argued; the resolution is **B (new skill) via composition**, decided by the
precedent's as-built evidence triggering **both advocates' own concede-conditions**:

| Position | Case | Concede-condition | Met? |
|---|---|---|---|
| A — extend domainspec-new-repo | reuse the validated, defect-paid scaffolder; C17 build-from-owned | "if the mint adds/alters an authority KIND (D49, owner-gated)" | **YES** — resonantos defines **8** authority-kind rows |
| B — new cav2-native skill | the scaffolder "coins no edges, enforces nothing"; the spine is a governance act (D49 default-deny, D48 lifecycle, adopt-back); two-System-5 boundary | "if the spine is inert templates, no governance act" | **NO** — minting required a *signed decision-gate* event |
| miner — ground truth | resonantos = ~30% scaffold / ~70% authority-spine; authority casting written post-copy; **no reference to domainspec-new-repo** | — | supports **B** |

**Verdict: compose, don't extend.** Mint owns the authority-casting; it *calls* `domainspec-new-repo`
for the smaller scaffold half (inheriting its clone-safe + single-sessions + gate-first fixes).

## Plan (non-executed) — the Mint flow

1. **Scaffold (compose, owned ~30%).** Call `domainspec-new-repo --source <framework> --attach submodule --dry-run` → partition tree + clone-safe framework attach. Inherits the Step-7 canon-resolution verify.
2. **Authority-spine seed (the core ~70%, cav2-native).** Emit, via the **authority-triage** front-door (classify → owner-sweep → kind → D49 default-deny → route): the domain `AUTHORITY-MODEL` (kinds), `source-spine`, `promotion-policy` (D48 ladder + gates), a domain constitution, a domain `DEFINITIONS` skeleton.
3. **Decision-gate event.** The mint is a *signed* governance act (decision-gate + constitution-governance), per the resonantos precedent — not a silent file drop. **Kind enumeration is owner-gated:** the mint *proposes* kinds; an owner ratifies (a mint cannot unilaterally alter the D49 enumeration — A's concede-condition (b)).
4. **Crosswalk.** Emit `RELATED-FRAMEWORK-CROSSWALK` with per-concept bridge decisions (borrow-carefully / block / analogy-only / promotion-candidate). Template = the resonantos as-built crosswalk.
5. **Adopt-back (deferred — likely follow-on, not MVP).** Register the cav2 import surface `authority/imports/<domain>/` for two-way adoption (VAULT-CONCEPT-ADOPTION).

### MVP slice (smallest-first)
The **authority-spine seed contract** — the emit-template set reverse-engineered from
resonantos-economy-research (AUTHORITY-MODEL skeleton, source-spine, promotion-policy, a domain
constitution stub, DEFINITIONS skeleton, crosswalk stub). The scaffold is owned; this seed
contract is the net-new core. Stages 1 + 2 + 3 = MVP; stages 4–5 follow.

## Build-from-owned ledger
| Mint part | Owned source | Net-new? |
|---|---|---|
| Scaffold | `domainspec-new-repo` skill | no — composed |
| Authority-triage front-door | authority-triage sigil (candidate, `development/authority-triage/`) | no — reused |
| Emit-templates | reverse-engineered from `resonantos-economy-research` | partial — templated from precedent |
| Adopt-back | `VAULT-CONCEPT-ADOPTION-CONSTITUTION` + `CONSTITUTION-IMPORT-PACK` | no — reused |
| **The mint orchestration skill + seed contract** | — | **YES — the actual feature** |

## Guardrails / blockers
- **`BLK-CAV2-PUBLIC-PRIVATE-001`** blocks a mint that emits a *public-attached* repo until the public/private boundary is resolved (`CTX-CAV2-MINT-BOUNDARY` gate = block).
- **Two-System-5 boundary:** Mint is cav2-owned; do NOT fold it into `domainspec-new-repo` (would make the foundry circular).
- **D49 owner-gate:** a mint proposes domain kinds; an owner ratifies.
- **authority-triage** is not yet promotion-ready (needs 2 more corpora + a boundary scrub, per the moat-stack entry) — a dependency for stage 2.
- **claim ≤ proof:** Mint is **intended-not-shipped**; the machine-map foundry + moat are candidate. Mint is *one casting organ*, not the foundry — do not build the whole machine at once.

## Recommended next routes (NOT part of refine)
- **sigil-development** — build + validate the Mint skill (experiment-harness on the resonantos corpus as the golden fixture).
- **decision-gate** — resolve `BLK-CAV2-PUBLIC-PRIVATE-001` before a public-attached mint.
- **constitution-governance** — own the emit-template set + the kind-proposal/ratify gate.

## Craft
Wired `CTX-CAV2-MINT` + 6 sub-contexts (SCAFFOLD / SPINE / PRECEDENTS / ADOPTION / BOUNDARY / CROSSWALK) into `.craft/ledger.yml` with 9 owned-artifact rows. Promotes nothing.
