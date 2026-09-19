---
tags: [framework-unification, meta-layers, component-map, index]
node_type: index
status: draft
last_updated: 2026-07-03
dispatch: 2026-07-03-meta-layers-component-map
---

# Meta-Layers ↔ Component Map

Maps our actual components onto the meta-layers theory in `../../../../business-philosopher/assuntos/meta-representations/`.
Assumes the theory is **true** (per the request); the challenge here is only an honesty-audit
of the *mapping*, not of the theory. Produced by dispatch `2026-07-03-meta-layers-component-map`
(extract → map → verify).

- [EXTRACT-META-LAYERS.md](EXTRACT-META-LAYERS.md) — the theory, rendered faithfully (L0–L7 + Δ, Signal Protocol, L1.7).
- [COMPONENT-LAYER-MAP.md](COMPONENT-LAYER-MAP.md) — the charitable component→layer map + end-to-end flow.
- [MAP-RESIDUE.md](MAP-RESIDUE.md) — skeptic audit: forced fits · holes · orphans · overclaims.

## Verdict at a glance

If the theory is true, **the upward build path is real; the downward feedback half is the gap.**

| Part | Component support | Tag |
|---|---|---|
| L0 Domain | none — by design (referent) | n/a |
| L0.5 Elicitation | interview-scope / scope-interview | **using** |
| L1 Formalization | 25 meta-types + DS-D1 cards | **using / built** |
| L1.5 Compilation (Δ) | test-derivation-engine / generate-tests | **built (partial) / using** |
| L2 Implementation | domainspec-implement / pipeline / apps | **using** |
| L2.5 Runtime | app stack built; **operational-signal producer** unbuilt | **partial → HOLE** |
| Signal Protocol | emit-signals + 11-type system | **using** (build-time input only) |
| L3 Governing Rules | axioms→gates, constitutions, governance sigils | **using / designed (cav2)** |
| L4 Epistemic Foundations | Via-Negativa axioms + premise/ + decisions | **using / built** |
| L5 Navigation | vault / ontology / inventory / registry | **using** |
| L6 Enforcement | fail-closed hooks + validators + meta-health | **using — strongest layer** |
| L7 Coherence | none — emergent; measured by meta-health / x-ray | n/a (tentative proxy) |
| Agent Interface | CLAUDE.md + skills + memory | **using** |
| L1.7 Physical Telemetry | agent-dispatch telemetry ≠ trajectory telemetry | **researched — weakest part** |

**10 of 14 parts** map to a genuinely built/using component. L6 (enforcement) is the load-bearing floor.

## The build list (holes, priority order)

1. **L2.5 operational-signal producer** — *the one missing floorboard.* Every built signal path is
   build-time/agent telemetry; nothing captures runtime operators/overrides/workarounds, which
   starves the (built) Signal Protocol of its theorized input.
2. **L2.5⇢L0 evidence loop / Saturn** — the entire intent↔reality return edge is unbuilt (third pillar).
3. **L1.7 compilation-trajectory telemetry** — theory-open, low priority.
4. **Drift detectors L0↔L1 and operational-L1↔architectural-L1** — only L1↔L2 is wired.

## The blind spot the audit surfaced (most important)

The orphans aren't noise — they cluster into **one missing tier the theory has no rung for: the
meta-operation of building the builder.** `mint`, `arcanum-bootstrap`, the `subagents-strategy`
dispatch machinery (the recon's "nervous system"), and the sigil-authoring class
(`sigil-development`, `spellcraft`, `skill-decomposer`, `invoke`) all *build/instantiate/distribute
the stack itself* — and none of them is any L0–L7 layer. Given the project's own objective is **"a
system that builds *systems*,"** the meta-layers theory as extracted describes building **one**
system, not the reproduction layer that makes it build others. Candidate resolution: an explicit
**L8 (meta / reproduction)** rung, or a decision that this tier lives outside the L0–L7 account.

## One caveat on the map (from the audit)

Per-item maturity tags are honest, but layer **breadth** is overcounted where the same capability
lives in two homes: L3-S skills (~148 engine + ~76 Arcanum) are summed additively though the recon
says the governance sigils are the *same* capabilities mirrored (possibly bootstrap-generated) — same
double-count in Signal Protocol and L5. Distinct built evidence per layer is smaller than the tallies imply.
