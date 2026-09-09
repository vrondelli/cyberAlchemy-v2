# Decision: Engine Moat + Free/Paid Boundary

Status: pass
Owner route: decision-gate + boundaries
Timestamp: 2026-06-24 (records operator decisions made 2026-06-21 → 2026-06-22)
Promoted from: Claude Code operator memory (`engine-algorithm-proprietary`) — a low-authority
capture surface; this record is the governed form. Routed via `authority-triage`.

## Consequential Work

Records the operator's free/paid boundary and the **moat = the deterministic
derivation engine's algorithm** decision as governed authority, so it does not
live only in per-user memory. This is a **boundary + product decision**, not a
definition or constitution rule.

## Decision 1: Free / Paid Split

Selected option:

- **FREE (offer openly, drive adoption):** the **layering audit**, **tag audit**,
  and **alignment audit**; and the **LLM test generator** (the free reference path).
- **MOAT (sell):** the **DomainSpec language** and the **Lean validations** — i.e.
  the **deterministic derivation engine's algorithm** and the formal (Lean)
  verification.

Rationale: "it can be cited and demonstrated but not the whole algorithm because
it's what we can use to sell. I'll leave the LLM generator as a free version."

## Decision 2: Cite-Results-Withhold-Mechanism (the trade-secret rule)

On all public/shareable surfaces (paper, Arcanum Pages, decks):

- **DO** cite that a deterministic engine exists and **demonstrate its results**:
  determinism (same docs in → byte-identical out), validation (95 tests,
  byte-stable), E3 mutation numbers (38.75% → 54.37%), spec-formalization metric
  (96%), the self-derive fixpoint. These are *results/properties* — fine to show.
- **DO NOT** disclose the moat **mechanism**: the `parse → δ → key → emit`
  pipeline, the L0–L4 internals, rule/grammar types, the Option-C id-map, the tier
  split, fenced regions, or the Lean proof internals. Those stay in the private
  `implementation/domainspec` and `domainspec-lean-formalization` repos only.
- **Positioning:** the framework/calculus (paper C1–C4, 25 meta-types, 29 edges,
  `T = f(C, R, Δ)`) is open; the audits + LLM generator are **free**; the language
  + Lean validations are the **product** (results shown, algorithm withheld).

## Result

Decision gate result: PASS (operator decision, recorded as governed authority).

Downstream effect: the deterministic engine algorithm is a **withheld trade
secret**, not a published artifact. This **refines** the moat-stack analysis
(`development/moat-stack.md`): "cav2/DomainSpec design" is *not* simply
"copyable from the public docs" — the load-bearing engine mechanism is
deliberately **not** in the public docs, so it is a genuine trade-secret moat
(demonstrate results, withhold mechanism). Note that this is distinct from the
*categorical-probability provability* (Perrone-owned, conjectural) the moat-stack
correctly demoted to an amplifier — the trade-secret moat is the **deterministic
engine algorithm**, not the formal entropy/MI theorems.

Remaining residue:

- A public-boundary scrub must run on every outward artifact (per `boundaries.md`).
- The moat-stack ratings should be updated to distinguish the **withheld engine
  algorithm** (trade-secret moat) from **formal provability** (amplifier).

## See also

- [boundaries.md](../boundaries.md) — the public/private + free/paid boundary it amends.
- [2026-06-24 Saturn/DomainSpec public disclosure](2026-06-24-saturn-domainspec-public-disclosure.md) — the companion disclosure decision.
- `development/moat-stack.md` — the moat analysis this refines.
