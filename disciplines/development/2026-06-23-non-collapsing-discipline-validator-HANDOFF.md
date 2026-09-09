# Handoff: Deterministic Non-Collapsing-Discipline Validator

- **Observed capability:** invoke (handoff mode) — authoring only; does not own the target lifecycle
- **Target artifact:** a deterministic **non-collapsing-discipline validator** — owner route: discipline-governance (the rule) + sigil-development/tools (the build); **gated by OQ-1**
- **Source session:** this session — the authority-lifecycle / cav2-schema / governance-boundary thread (2026-06-23)
- **Handoff type / split reason:** **new lifecycle idea** (deterministic non-collapse validation for disciplines)
- **Context selection:** obligation-linked excerpts below (NOT the whole transcript)

## New-thread objective (the prompt)

Develop a way to **deterministically validate that a discipline does not collapse
boundaries** — a check enforcing `forbidden_collapse` / `CAV2-D22` orthogonal
classification / the `AUTHORITY-MODEL` non-collapse rules, so a discipline (e.g. a
future `tracking` discipline) **cannot trespass into another kind's scope**. Today
those rules are review-mode; this is their deterministic half.

## Why now (trigger)

This session established the **Craft (work) vs governance-lifecycle boundary** and
is building a governance stack (ledger primitive → `tracking` discipline →
validating constitution). Before authoring the `tracking` discipline, we want a
deterministic way to *prove* a discipline stays in its lane (doesn't collapse into
"work," or into another authority kind). The trespass risk is concrete: the user
caught the proposal to track governance to-dos in the Craft (work) ledger as a
boundary violation.

## Context to carry (obligation-linked)

- **Boundary:** Craft (`CAV2-D20` method / `CAV2-D12` execution surface) = operational
  **work** state ("turns bounded work into project state"; "does not make authority").
  Governance-lifecycle to-dos = authority routes (promotion queue `CAV2-D13`,
  `DEFINITION-DRIFT-AUDIT` remediation, per-doc OQ-N). **Disciplines are an authority
  KIND, not work.** Putting governance state into Craft = trespass.
- **Governance stack being built:** `ledger` primitive (`CAV2-D26` append-only event
  ledger + the **deferred unified `ledger` candidate**, `authority/definitions/reviews/ledger-primitive-review.md`)
  → a `tracking` discipline (discipline-governance; none exists yet) → a validating
  constitution rule. **One primitive, many instances, never collapsed** (mirror of how
  `CAV2-D48` generalizes `CAV2-D43`/`D46`).
- **Self-application guard:** a discipline that tracks the governance system's own
  to-dos is **bounded recursive self-application (`CAV2-D30`)** — must carry
  label / boundary / reviewer / way-back.
- **Sibling validator + OQ-1:** this non-collapse validator is a sibling of the
  **closure validator** (`CAV2-D49` / proposed `CAV2-C16`) — both are OQ-1-gated
  deterministic authority checks. `AUTHORITY-MODEL` **OQ-1**: build deterministic
  checks only **after** the authority object schema stabilizes. The relevant schema is
  `ontology/promotion-requests/2026-06-23-authority-object-schema-proposal.md` (gaps
  G1–G9; the **kind-declaration `instantiates` field G2** is likely the precondition
  for a deterministic trespass check, just as it is for the closure check).

## Sequenced roadmap (preserve — user's order)

1. **(this handoff)** Validator approach — design the deterministic non-collapse check.
2. **Definitions check** — do we need to **define** terms first? candidates: `non-collapse`, `discipline`, `tracking`, `boundary trespass`. → definitions-governance.
3. **Define + create the disciplines** for the rest of the governance stack (`tracking`, …). → discipline-governance.
4. **Promote the deferred `ledger` primitive** (user judges it ready) — resolve `ledger-primitive-review.md` (relation-inheritance + Craft-ledger-conformance blockers). → definitions-governance.

## Owner routes (so the next thread does not trespass)

| Step | Owner |
|---|---|
| validator design/build | sigil-development / tools (OQ-1-gated) |
| term definitions | definitions-governance |
| `tracking` + stack disciplines | discipline-governance |
| validating constitution rule | constitution-governance |
| `ledger` primitive promotion | definitions-governance (+ ledger-primitive-review) |

## Validator approach: SMT / first-order logic (assessed 2026-06-23)

**Verdict: SMT/FOL solves the deterministic CORE of non-collapse — not the whole problem.**

Encoding: represent each authority kind/artifact as a **typed attribute record** built
from the schema fields (`instantiates` / `concept_role` / scope / owner_route / … —
schema proposal **G2** supplies the FOL vocabulary). Then `non_collapse(A, B)` is an SMT query:

1. **Orthogonality (decidable):** `∃ axis . A.axis ≠ B.axis` — equality/disequality over
   records; SMT decides trivially. (= `CAV2-D29` axis orthogonality.)
2. **Non-thinness witness (decidable, relative):** `∃ x, y . classifier(x)=classifier(y) ∧ x.axis ≠ y.axis`
   — two artifacts agreeing on a shared/coarser classifier `C` but differing on the
   distinguishing axis → the axis is **not `C`-derivable** → the distinction is real
   relative to `C`. SMT searches the witness pair. **This is the FOL shadow of the lean
   repo's `functorial_strictly_dominates_count` / `count_blind_agrees`** (count cannot
   separate equal-fiber inputs).
3. **Counter-witness on failure:** when non-collapse FAILS, the SMT model **is** the
   collapsing pair (two artifacts indistinguishable on the declared axes) — a concrete,
   actionable "these two collapse" report.

**Decidability:** full FOL is undecidable, but the needed fragment — finite artifact set,
equality/datatypes, ∃ over the finite set — is **decidable** (SMT-friendly; EPR /
finite-domain). SMT is the right engine.

**Boundary (what SMT/FOL does NOT decide → stays review / open):**
- **Which axes/classifiers to encode** = the modeling judgment (owner/review). SMT decides
  distinctness *given* the encoding; it does not choose it.
- **Absolute non-thinness** (is the distinction "really" structural vs a thin re-skin) =
  the **open count-collapse frontier** from the lean repo. SMT gives the *relative* answer
  (w.r.t. a chosen `C`); the absolute call stays review.

So the **hybrid holds, now precise:** SMT/FOL = deterministic core (orthogonality +
relative non-thinness witness + counter-witnesses); prose `forbidden_collapse` + owner
judgment = the encoding/absolute layer. **Dependency:** needs schema typed kind-declaration
(`instantiates` + fields, **G2**) as its vocabulary — exactly OQ-1's "stabilize the schema
before the deterministic check." **Bridge:** SMT/FOL realization of `CAV2-D29` + the lean
residue distinctness; **shareable with the closure validator** (both reduce to SMT queries
over schema-typed records).

## Open questions the next thread inherits (residue)

- **~~Is "non-collapse" deterministically checkable?~~ ANSWERED (see Validator approach):**
  the CORE is **SMT-decidable** over schema-typed records (orthogonality + relative
  non-thinness witness, with counter-witnesses on failure). What stays review/open: the
  *encoding choice* (which axes) and *absolute* non-thinness (the count-collapse frontier).
  Still gated on schema **G2** (the FOL vocabulary).
- Should the non-collapse validator and the closure validator **share one adapter**
  (both OQ-1-gated deterministic authority-kind checks)?
- Does a `tracking` discipline need `non-collapse` / `tracking` defined first (step 2),
  or can the validator be specced against existing `CAV2-D22` + `forbidden_collapse`?

## Dispatch technique trace

- `frame_handoff` — frames this session's boundary work as the next thread's input (the core).
- `owner_boundary_check` — routes each roadmap step to its owner; invoke does **not** own the validator/discipline/ledger lifecycles.
- `residue_ledger` — carries the open questions + the deferred `ledger` primitive forward.
- `handle_handoff` — names the native owner-route handles for the next thread.
- Full dispatch JSON: **not needed** (single capability, no subagents, no protected context).

## Recommended next route

`sigil-development` for the validator design (OQ-1-gated), **or** definitions-governance
first (roadmap step 2) if the term-definition check blocks. Distill: **skipped** —
handoff packet is narrow and locally bounded.
