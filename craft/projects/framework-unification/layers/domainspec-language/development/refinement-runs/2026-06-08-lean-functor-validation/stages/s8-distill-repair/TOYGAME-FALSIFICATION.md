---
node_type: refinement-artifact
stage: s8-distill-repair
role: residue-skeptic
lane: adversarial
round: 2
status: falsification-design
honesty_boundary: Craft PCRA — residue named/governed, never zero; no full-faithfulness
---

# Toy-Game Falsification — residue-skeptic (adversarial lane), round 2

Stage: s8 · Role: residue-skeptic · Lane: ADVERSARIAL
Template: `internal_tools/lean-code-validator/examples/FaultInject.lean` (the existing
adversarial harness — it already proves P1 fail, P5 fail, and R_CF accept by `#eval`).
Goal: a **low-cost** falsification that tries to make the validator **silently accept a
non-functorial lift**. If it can, the Stage-B abstraction is falsified.

This game extends FaultInject's pattern: build deliberately broken `Spec` records, `#eval
gradeFor`, and assert the verdict. Crucially it also probes the **gap between framing and
build** found in the design review (P4 stub, uniform provenance, no commutativity).

---

## 0. What the harness can and cannot construct today (read before designing faults)

The single most important falsification fact comes straight from `Richness.lean` line 50:

```lean
structure EdgeRow (p : Profile) (C : ConceptSpace) where
  ...
  wellTyped : sigmaValid p edge (C.metaOf src) (C.metaOf tgt) = true
```

A σ-violating edge **cannot be constructed** — `wellTyped := rfl` fails to typecheck. So a
"sigmaValid-violating edge" is a **Lean compile error, not a runtime WARN/FAIL**. This means
Fault A below is a *compile-time* test (the file must fail to build), not a grader verdict.
That is itself a load-bearing property and the toy game must assert it as such, not pretend
the grader rejects it.

Likewise: a "code unit with no Meta" and a "spec obligation with no code edge" cannot exist
*inside a single Spec record at all* — `metaOf` is total (`Concept → Meta`) and the grader
sees only `S.edges`. They only become representable once the **deterministic translator T**
lifts code into a Spec AND P3/P4 are real. So Faults 3 & 4 are **future-coverage faults**:
today their honest expected verdict is "**NOT DETECTABLE — silently passes**", which is the
*falsifier the design must avoid shipping as "done"*, not a current pass.

---

## 1. Faults, constructions, and expected verdicts

### Fault A — σ-violating edge (non-functorial on object-typing)
- **Construction:** attempt an `EdgeRow` whose `(edge, metaOf src, metaOf tgt)` is not a valid
  σ-triple, e.g. `{ src := .EvA, edge := .performs, tgt := .OpA, … }` (performs is
  Entity→Operation; Event→Operation is not in `sigmaValid`).
- **Expected verdict:** **COMPILE-TIME REJECTION.** `wellTyped := rfl` fails to elaborate; the
  file does not build. This is P2/Theorem-1 doing its job *by construction*.
- **Which predicate trips:** none at runtime — the type checker (`EdgeRow.wellTyped`) is the
  gate. Mirrors no FaultInject case (FaultInject only builds *constructible* specs); the toy
  game adds this as a `-- expected: does NOT compile` negative case (e.g. a commented block + a
  note, since a non-compiling line cannot sit in a passing file).
- **Honesty note:** this is the ONE genuinely *proved* obligation. Tag operational+formal.

### Fault B — cycle in the codegen-dependency subgraph (non-functorial on generation order)
- **Construction:** reuse FaultInject Case 2 verbatim — `compositionExtension`, edges
  `OpA --producesFor--> EvA` and `EvA --triggersCross--> OpA`. Both are `isCodegenDependency`
  (`Profiles.lean` 88), so they form a cycle in the dep subgraph.
- **Expected verdict:** **P5 = fail → overallGrade = fail.** (`graphHasCycle` true →
  `gradeP5Acyclic` fail; `aggregateOverall` worst-component → fail.)
- **Which predicate trips:** P5. Identical to FaultInject's proven `specP5Fail`.
- **Honesty note:** real today, but `#eval`/`partial def`, not a verified theorem (see
  DESIGN-REVIEW G3). Tag operational.

### Fault C — unresolved reference (broken schema closure)
- **Construction:** reuse FaultInject Case 1 — `unresolvedRefs := ["MissingThing", "OtherGhost"]`.
- **Expected verdict:** **P1 = fail → overallGrade = fail.**
- **Which predicate trips:** P1. Identical to FaultInject's proven `specP1Fail`.
- **Honesty note:** real today. This is the recomposition/closure check; it catches a *name*
  with no declaration, NOT an *obligation* with no code (that is Fault 4).

### Fault D — M6 codegen ambiguity (two sources, same edge, same non-Entity target)
- **Construction:** in `compositionExtension`, two distinct Operations both
  `producesFor` the **same Event**, with no disambiguating relation between them, e.g.
  `OpA --producesFor--> EvA` and `OpB --producesFor--> EvA`. `EvA` is `.Event` (non-Entity), so
  `m6Witnesses` (`Richness.lean` 85–96) returns a non-empty witness list.
- **Expected verdict TODAY:** `#eval (Spec.m6Witnesses specD)` → **non-empty list** (witness
  computed), BUT `#eval gradeFor specD` → **overallGrade = pass** because **P4 is a `pass`
  stub** (`Report.lean` 80–81). So the *witness exists and is `#eval`-able*, the *grade is
  silent*.
- **Expected verdict WHEN P4 IS REAL:** P4 = warn (or fail) once `gradeP4Ambiguity` consumes
  `m6Witnesses` and grades by `EdgeProvenance` (declared → fail, sigmaFallback → warn, per
  README 75).
- **Which predicate trips:** P4 (today: stubbed pass; future: warn/fail). This is the
  *operational proxy* the decision (mis)labels "η-not-iso witnessed today."
- **Honesty note:** the toy game must assert BOTH facts — `m6Witnesses` non-empty AND
  `gradeFor` currently pass — to make the P4-stub gap visible and prevent overclaim.

### Fault 3 — code unit with no Meta (unspecified-behavior residue, code ∉ spec)
- **Construction:** *not representable in a single Spec today.* It requires the translator T to
  lift a code unit (helper/adapter/glue) that maps to no σ-Meta. The honest toy-game form is a
  **stub fixture** `tMappingResidue : List CodeUnit` carrying a unit T could not place, plus a
  `-- expected: T emits unspecified-behavior residue with provenance` assertion.
- **Expected verdict TODAY:** **NOT DETECTABLE — silently passes.** There is no T, no code
  category, no "objects of C with no image in S" check in `gradeFor`. The grader sees only
  `S.edges`.
- **Expected verdict WHEN T EXISTS:** T must emit this as **unspecified-behavior residue**
  (Craft direction (a), round-1 F2), attributed via `EdgeProvenance` to T-mapping vs codegen.
- **Which predicate trips:** none today; a future T-side residue ledger. Tag: future coverage.

### Fault 4 — spec obligation with no code edge (unimplemented residue, spec ∉ code)
- **Construction:** a declared concept (e.g. an `Operation` requiring a `performs` edge per a
  P3 obligation table) with **no incoming/outgoing edge satisfying it**. Representable today as
  a `Spec` with a lonely concept, but **not graded** — P3 is a `pass` stub (`Report.lean` 71–72).
- **Expected verdict TODAY:** **NOT DETECTABLE — silently passes** (P3 stub returns pass
  unconditionally).
- **Expected verdict WHEN P3 IS REAL:** P3 = warn/fail (obligation table finds the concept's
  required edge missing). This is Craft direction (b), recomposition/coverage residue.
- **Which predicate trips:** P3 (today: stubbed pass; future: warn/fail). Tag: future coverage.

---

## 2. Summary table

| Fault | Non-functorial in | Detector | Verdict TODAY | Verdict when built | Mirrors FaultInject |
|---|---|---|---|---|---|
| A σ-violation | object typing | `EdgeRow.wellTyped` (compile) | **does not compile** | (same — proved) | (new negative case) |
| B codegen cycle | generation order | P5 | **fail** | fail | `specP5Fail` ✓ |
| C unresolved ref | schema closure | P1 | **fail** | fail | `specP1Fail` ✓ |
| D M6 ambiguity | codegen disambiguation | `m6Witnesses` / P4 | witness non-empty, **grade PASS (P4 stub)** | P4 warn/fail | (extends R_CF case) |
| 3 code∉spec (no Meta) | totality of F on objects | T-side ledger (none) | **silently PASS** | T unspecified-behavior residue | — |
| 4 spec∉code (no edge) | coverage / surjectivity | P3 | **silently PASS (P3 stub)** | P3 warn/fail | — |

---

## 3. PASS criterion for the toy game

The toy game **PASSES** iff, for every fault, the validator's behavior matches the
"Verdict TODAY" column exactly AND the harness asserts each one, specifically:

1. Fault A: the σ-violating `EdgeRow` **fails to compile** (asserted as a documented negative
   case — Theorem-1-by-construction holds).
2. Fault B: `#eval gradeFor specB |>.overallGrade = .fail` via **P5**.
3. Fault C: `#eval gradeFor specC |>.overallGrade = .fail` via **P1**.
4. Fault D: `#eval (Spec.m6Witnesses specD)` is **non-empty** (witness real) AND
   `#eval gradeFor specD |>.overallGrade = .pass` (P4 stub) — both asserted, exposing the gap.
5. Faults 3 & 4: documented as **NOT DETECTABLE today (silently pass)** because T/P3 are
   absent/stubbed — recorded as known coverage residue, NOT as accept.

Provenance/attribution sub-criterion (the design's actual ambition): once T + P4 exist, the
game additionally requires that Fault D's residue be **attributed** (declared → codegen
residue; sigmaFallback/contextInferred → T-mapping residue) so the validator can say *which
owner* the residue belongs to. Today this sub-criterion is **vacuously unmet** (provenance is
uniform `.declared`, README 76) and must be reported as OPEN, never as satisfied.

---

## 4. FALSIFICATION criterion — what would break the whole Stage-B abstraction

The Stage-B abstraction (a partial+lax structure-preserving check that names residue) is
**FALSIFIED** if any of the following occurs:

- **F-accept:** a **non-functorial** translated Spec (Fault A, B, C, or D) is **accepted with
  `overallGrade = pass` AND no witness emitted** — i.e. the validator silently blesses a lift
  that violates σ-typing, generation order, closure, or disambiguation. (Today A→compile-fail,
  B/C→fail, D→witness-non-empty; so the abstraction is *not* falsified today **provided** the
  D witness is acknowledged. It WOULD be falsified if someone shipped P4 still stubbed while
  *claiming* M6 residue is governed.)
- **F-launder:** Fault 3 or 4 is **reported as `pass` and that pass is narrated as
  "verified / functorial / fidelity proven"** rather than as named coverage residue. Silently
  passing is acceptable *only if explicitly logged as residue*; passing-as-verified falsifies
  PCRA (round-1 claims #1, #5, #6).
- **F-misattribute:** once provenance is real, Fault D residue caused by **T's mapping table**
  (a `sigmaFallback` edge T manufactured) is attributed to **codegen** (or vice versa) — the
  validator launders T-residue into codegen-residue. This falsifies FIX-3 / hard constraint 3.
- **F-overclaim:** the harness or any deliverable asserts the Fault-D witness proves "η fails
  to be iso" **today** (no Lan/η object exists) — that imports the open theorem as fact and
  falsifies the honesty boundary (DESIGN-REVIEW G1).

The single sharpest falsifier, stated plainly: **if the validator ever returns `pass` on a
Spec that contains an M6 witness, a dep cycle, or an unresolved ref, and that `pass` is
presented as "the lift is functorial / fidelity established," the Stage-B abstraction is
dead.** The current build avoids the first three (A compile-fails, B/C fail) and exposes D as a
witness — so the abstraction survives *only as long as P4/P3/provenance ship before any
"governed residue" claim is made.* Shipping the claim ahead of the grader IS the falsifier.

---

## 5. Cost

Faults A–D are ~30 lines of Lean appended to a FaultInject-style file (reusing `cs`, `metaOf`,
the `C` inductive). Faults 3 & 4 are documentation + stub fixtures, no new grader code. Total
falsification cost: one `#eval` file + four assertions + two documented coverage gaps. Low.
