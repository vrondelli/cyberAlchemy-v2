# Distill — Smallest Honest Claim Set (s5)

Format decided: DEC-FMT-01 (executive-narrative + embedded assurance ladder + FAQ).

## The smallest set of claims that is both compelling and survives due diligence
1. We write the *what-it-must-be* (the blueprint) in a precise, machine-checkable
   language — not prose two people read two ways.
2. A mathematical proof-checker (Lean — the family used for chips/aerospace)
   checks the blueprint **holds together** and checks **delivered code matches the
   blueprint** — by calculation, not opinion.
3. The guarantee is honestly tiered: **proven** (structural consistency),
   **machine-checked** (no contradictions, no missing pieces, no broken
   dependencies), **human-judged** (is the blueprint the *right* one — a person
   signs that).
4. What this removes for the buyer: ambiguity, silent drift between spec and code,
   and "trust me" diligence — replaced by reproducible evidence.

## What stays out of the pitch (roadmap, not product)
The obligation-level checks (P3/P4), the code→blueprint translator, and the full
two-way "systems verify each other" coupling are **designed, not shipped** — sold
as roadmap. Built today: the proven typing theorem, the consistency + dependency
checks (P1/P5), the emitter, the fault-test harness, and the first
well-formedness loop.

## The honest hook
The differentiator is not "we prove software is perfect" (nobody can). It is "we
can *show you, by calculation*, exactly which guarantees hold and which stay human
judgment" — a level of diligence transparency most vendors can't offer.
