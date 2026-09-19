---
node_type: define
is_session: false
status: candidate
created: 2026-07-02
authored_by: "invoke (mode: define)"
target_artifact: comprehension novice-witness test — a measurement instrument producing a ranked stall-point dataset
scope: projects/domainspec-v2 (the spec surface; the comprehension model it validates)
owner_route: experiment (the test lifecycle) → feeds validation-governance (the model it prioritizes)
source:
  - research/target-state/2026-07-02-comprehension-narrative-model/findings.md (the model + Gigerenzer's named witness)
  - impl/spec/{TAXONOMY.md,RELATIONSHIPS.md,meta-types/**,__fixtures__/mt/**} (the surface under test)
promotion_boundary: local development; the agent-arm run is a structural PRE-TEST, never proof of human comprehension.
---

# Define — Comprehension Novice-Witness Test

> **Historical baseline notice (2026-07-11):** Saga-specific task assumptions
> below describe the frozen baseline instrument. They are not current authority
> or runnable hardening guidance; a future rerun must use scoped Workflow and a
> freshly versioned instrument.

## Intent
Build the instrument Gigerenzer named in the closed research: a **novice, given only the current
DomainSpec spec surface, authors a real spec** while every point of confusion is logged. The output is a
**ranked stall-point dataset** that does two jobs: (a) **prioritizes** the comprehension moves (M1–M4)
by which confusion is worst, and (b) becomes each move's **promotion evidence** (re-run → did the
targeted stall drop?). It converts "comprehension gain is an untested hypothesis" into a measurement.

## The falsifiable claim (pre-registered — freeze before running)
> A fresh author, given only the current spec surface + a fixed authoring task, produces measurable
> **stall-points concentrated at predicted locations** — the 5 uncrossed meta-types (Enum, Interface,
> Mapping, Event, State Machine), the "which of 25?" type selection, the edge-verb choice, and "what is
> the target-state?". After moves M1–M4 land, the **same protocol on the same task** yields fewer stalls
> at those locations **with no net-new stalls elsewhere**.

- **SURVIVED** iff: baseline stalls appear at (most of) the predicted locations AND a post-move re-run
  drops the targeted stall-class AND no new stall-class is introduced.
- **FALSIFIED** iff: baseline stalls cluster *elsewhere* than predicted (the model mis-targets), OR the
  re-run does not reduce them (the moves don't help), OR the moves introduce new stalls (regression).
- **INVALID** iff: the novice had access to `research/`, `findings.md`, or the type answers
  (contamination), OR the task didn't actually exercise the surface (≥3 core types + a rule + a workflow
  + ≥2 edges + a target-state).

Passing shows the surface is (un)comprehensible at named points — NOT that any human "gets it" (that is
the deferred human arm), and NOT anything about the engine.

## The novice — dual track
- **Track-1 — AGENT novice (runnable now; the data source).** A fresh LLM agent given **only**
  `{TAXONOMY.md, RELATIONSHIPS.md, meta-types/**, __fixtures__/mt/**}`, **blind** to `research/` and
  `findings.md`, told to author the fixed-task spec **and** to emit a stall-log. Produces the baseline
  dataset immediately — this is "start with data already".
- **Track-2 — HUMAN witness (deferred; the gold standard).** A person unfamiliar with the 25 types runs
  the identical protocol. This is the actual human-comprehension validator.

## Boundary (claim ≤ proof — stated so we never over-claim)
The agent arm surfaces **structural** stalls (where the surface is genuinely under-specified — a fresh
reader with the whole doc set still can't decide). It is a **pre-test**, not evidence about human
cognition. Every report header repeats this; only Track-2 supports a human-comprehension claim.

## Glossary
- **stall-point** — a logged moment the novice cannot proceed from the surface alone: `{location, class,
  what_was_missing, guardrail_used}`.
- **stall class** — one of: `selection` (which of 25?) · `discrimination` (A vs its neighbour?) · `edge`
  (which verb?) · `target-state` (what is "done"?) · `vocabulary` (a term undefined).
- **baseline arm / treatment arm** — the run on the current surface vs on a surface after a move landed.
- **stall→move map** — the fixed mapping from a stall class to the comprehension move that would fix it.

## Non-goals
- Proving human comprehension from the agent arm (that is Track-2).
- Testing the engine or δ-rules. UI-11 types (deferred with the model).

## Open decisions (surfaced)
- **DEF-A1 — novice medium: RESOLVED → dual-track** (agent-now / human-deferred); the agent arm produces
  the runnable data. *(Surfaced for owner override — if you want human-only, the agent L0 is skipped and
  Package B loses its "data already" input.)*
- **DEF-A2 — the fixed task:** a compact business-language feature brief that forces ≥3 core types, the
  Entity/VO and Rule/Policy discriminations, a Workflow (vs Saga), ≥2 edges, and a target-state — from a
  domain whose typing the novice cannot have memorized. Authored in DESIGN.
- **DEF-A3 — how many agent runs:** ≥1 baseline now; N≥3 for stability is a flagged nicety, not required
  for the first dataset.
