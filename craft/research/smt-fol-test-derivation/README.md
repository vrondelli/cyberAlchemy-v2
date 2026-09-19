# SMT / FOL for Deterministic Test Derivation — Research Tower

Status: active starter tower
Promotion scope: local-research-only
Date checked: 2026-06-21

## Research Target

Study how **satisfiability modulo theories (SMT) solvers** and **first-order logic (FOL)** relate to the [deterministic test-derivation engine](../../implementation/domainspec/tools/test-derivation-engine/) — specifically whether the engine's `Formal` cells (e.g. `exists(Player.id == playerId)`, `startDate <= stats.date <= endDate`, `count(tx[type=PAYOUT]) <= 1`) can be treated as FOL/SMT-checkable predicates, and where the boundary lies between what a deterministic engine can formally derive/verify and what must stay `needs_formal`.

## Why this tower exists

The engine compiles canonical feature docs into test obligations by classifying `Formal` expressions (EXISTENCE / PRESENCE / RANGE / COUNT_CAP). That classifier is an ad-hoc fragment of FOL. SMT/FOL theory tells us: which fragments are decidable, how solvers (Z3, cvc5) check/generate models, and how spec→SMT pipelines do model-based test generation — directly informing the engine's δ rules, the `needs_formal` boundary, and a possible solver-backed verification mode.

## Source Boundary

- **Local-first** (primary): `domainspec-formalization/` (Lean formalization + paper + glossary), `projects/framework-unification/research/`, `.arcanum/inventory/`.
- **Bounded external**: a limited web research pass (SMT solvers, FOL decision procedures, spec→SMT test generation) — only to fill named gaps the local sweep leaves open.

## Layout

- [TOWER.md](TOWER.md) — layer model + research lanes + dispatch state
- [sources/](sources/) — source inventory (local + external), with evidence labels
- [DEFINITIONS.md](DEFINITIONS.md) — local concept definitions
- [residue/](residue/) — open research questions / tension lanes
- [tracks/](tracks/) — per-lane working notes
- [_dispatch/](_dispatch/) — bounded research dispatch sheet

## Boundary

Local-research-only. No empirical claim or canonical promotion from this tower without separate validation. It informs the engine's design; it does not mutate the engine.
