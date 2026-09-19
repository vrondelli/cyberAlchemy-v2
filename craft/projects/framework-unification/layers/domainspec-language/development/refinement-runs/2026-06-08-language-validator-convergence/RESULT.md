# Refine Result — Language ↔ Lean Validator Convergence

- Run id: `2026-06-08-language-validator-convergence` (parent: `2026-06-08-clarity-language-fit`)
- Status: **pass** — a safe mutual-dependency architecture is designed; bootstrap falsification green
- Preset: full · Research: research-if-gap-appears (none triggered) · Subagents: 3 (recommended, approved)
- Run manifest: `RUN-MANIFEST.md` · Final synthesis: this file

## What you asked for
Make the DomainSpec language and the Lean validator **converge and depend on each
other**. The run designed exactly that — and showed it can be done **without the
vicious circularity** the prior run flagged.

## The convergence model: COMPILER-PAIR (DEC-CONV-01)
Two deterministic one-way compilers over **disjoint facts**:
- **D1 `K↓` (language → validator):** contract `obligation_id`s compile into the
  validator's `obligationsForMeta` table (lifts P3 from stub); taxonomy derives
  the active `Meta`/`EdgeType`/profile. The validator stops hand-maintaining what
  it checks.
- **D2 `K↑` (validator → language):** `gradeFor`'s verdict binds the language's
  lifecycle — `pass` authorizes `gated→validated`, `warn` holds, `fail` blocks;
  P1–P7 are necessary for promotion, **P8 owner-approval stays the human
  sufficient act.**

Neither system is complete alone → genuine mutual dependency. All three lanes
(architect, mapper, skeptic) converged on this model independently.

## Why it does NOT become a vicious circle
- **Acyclic at the meta level** though bidirectional at the system level: `K↓`
  carries *content* down, `K↑` carries a *verdict* up, over disjoint facts.
  **Barred edge:** verdict/status → obligation *content* (`K↓` is status-blind;
  `K↑` never reads obligation content). So a spec never validates its own content.
- **Two authorities stay separate:** content = language; well-formedness = Lean.
  D2 binds only to well-formedness.
- **Bootstrap order breaks chicken-and-egg:** B0 seed σ-vocab from
  `domainspec-core` (spec-independent) → B1 well-formedness-only validator → B2
  empty/warn obligation table → B3 first spec reaches `validated` → B4 graduate
  obligations warn→fail (as B-1 lands) → **B5 bind promotion last.** The
  bootstrap toy-game traced B0–B5 with **no deadlock**; F1–F3 (the deadlock
  moves) are forbidden by construction.

## The dependency map (s4): 22 edges, 2 exist / 11 designed / 9 missing
- **Highest-leverage missing edge: B-1** (`obligation_id`s) — unblocks 6 of 9
  missing edges and is the same edge that flips DEC-FIT-01 from incidental to
  load-bearing. A language task; the validator side already waits.
- **A first mutual loop closes NOW, without B-1** (Loop 1, well-formedness):
  freeze envelope + 2 fixtures → `gradeFor` (P1/P2/P5 exist) → Lean receipt → the
  verdict guards `gated→validated`. The load-bearing obligation loop is Loop 2,
  gated on B-1.

## Two-loop work pack (s9, non-executed)
- **Loop 1 (now):** prove convergence on well-formedness — L1-1..L1-5, runnable today.
- **Loop 2 (after B-1):** the load-bearing obligation/content dependency — L2-1..L2-5.
- Cross-cutting decision-gates: OD-3 (one schema dialect), DEC-CAT-01 ratification.
- Build-time invariants: I1 `K↓`⊥verdict/status · I2 `K↑`⊥obligation content ·
  I3 warn-before-fail · I4 status never feeds vocab/obligations · I5 P8 human.

## Change-propagation
**Convergent** iff promotion/status never feeds back into the σ-vocab or obligation
content (edge cut at B0/B5) and obligations enter warn-before-fail. Conflicting
obligations surface as a `gap`/`decision` record (halt graduation), not a fail-flip.

## Residue
- R-circularity → **conditioned** (gated by I1/I2 + bootstrap order) — was open, now bounded.
- R-bridge-feasibility (open) — gates obligation graduation (B4); at worst Loop 2 is warn-only.
- R-determinism (open) — close before D1 is fail-capable.
- R-obligation-conflict (new) — multi-contract conflicts → gap record.
- OD-3 (open) — one schema dialect needed.

## Honesty boundary (binding)
The compilers are **designed, not wired**. No claim the systems co-depend at
runtime today. Mutual dependency is *achievable safely* under the stated
invariants + bootstrap order; Loop 1 can demonstrate it now, Loop 2 makes it
load-bearing after B-1.

## Stage evidence
| Stage | Verdict | Artifact |
|---|---|---|
| s1 Context Builder | pass | stages/s1-context-builder/context-pack.md |
| s2 Invoke Define | pass | stages/s2-invoke-define/DEFINE.md |
| s3 Interrogation (coupling dialectic) | pass (converged) | stages/s3-interrogation/REVIEW.md, CIRCULARITY-CRITIQUE.md |
| s4 Research / dependency x-ray | pass | stages/s4-research/DEPENDENCY-MAP.md |
| s5 Distill + convergence decision | pass (g-convergence-decision + g-acyclicity) | stages/s5-distill/DISTILL.md, CONVERGENCE-MODEL-DECISION.md |
| s6 Invoke Design | pass | stages/s6-invoke-design/DESIGN.md, COUPLING-ARCHITECTURE.md |
| s7 Interrogation (circularity re-attack) | pass (provisional) | stages/s7-interrogation/DESIGN-REVIEW.md |
| s8 Distill Repair (bootstrap toy-game) | pass (no deadlock) | stages/s8-distill-repair/BOOTSTRAP-TOYGAME.md |
| s9 Invoke Plan | pass | stages/s9-invoke-plan/PLAN.md |
| s10 Final synthesis | pass | this file |

## Recommended next routes
1. **task-session on Loop 1** — proves the mutual dependency on well-formedness today.
2. **decision-gate** on OD-3 (single dialect) + DEC-CAT-01 ratification.
3. **task-session on L2-1 (B-1)** — the bridge that makes the dependency load-bearing.
4. Append DEC-CONV-01 + the acyclicity invariants to `research/DESIGN-PACKAGE.md` §7/§8.
