---
agent_name: "Gödel, Kurt"
role: skeptic
gate: non-vacuity
dispatch_id: 2026-06-28-constitution-fol-validation-path
claim_under_test: "FOL/formal-methods validation of our governance constitutions catches a CROSS-rule defect the per-rule deterministic validator cannot."
verdict: WITNESSED
---

# S2 — Non-Vacuity Witness (Gödel, Kurt)

Gate: build the SMALLEST CONCRETE WITNESS by hand, or force a closed negative.
E3's prediction under test: the witness SUCCEEDS iff it lands on **Row 2** (cross-rule:
consistency / contradiction / shadowing / `∃ state . state ⊨ whole-constitution`), and
COLLAPSES (vacuous) iff it merely re-skins the per-rule check (`decidePolicy` / a presence-lint).

The per-rule validator under test is the **Authority-Kind Closure Validator** (`authority-kind-closure-validator-SPEC.md`), checks **C-1..C-3**. Read literally, those checks have a single shape:

> C-1: closure catch-all row is present. C-2: each artifact's KIND sits in its HOME location. C-3: no authority artifact in a non-enumerated location.

Every one of C-1..C-3 is a **unary predicate over one artifact's `(kind, location)`**. None reads an **edge between two artifacts**. None compares **two rules' verdicts on a shared model**. That is the structural ceiling I attack.

---

## The witness

### The two real rules

- **R_A** — `house_project/.../framework/edge-acyclicity-constitution.md` §1: the `governs` edge type **must be acyclic** on the populated edge set. Its stated rationale (verbatim): *"A governance loop (rule A governs rule B governs A) collapses L3 separation; no node can be the source of authority."* So R_A = `∀ cycle in governs-edges → VIOLATION`, with **no exception clause**.
- **R_B** — `STABLE-REPOSITORY-CONSTITUTION.md` **CAV2-C13** (Value-Cycle Edge Guard): *"Any … authority transition that can constrain a value, label, authority state, schema field, or validation outcome must be acyclic **unless** schema governance records a contextuality-obstruction review and an explicit exception."* So R_B = `∀ e. value_constraining(e) ∧ cyclic(e) ∧ ¬reviewed(e) → BLOCK(e)` — acyclic **with** a reviewed-exception escape.

These two rules **overlap on the same object**: a `governs` edge between two constitution rules is an *authority transition that constrains an authority state*, so it is squarely in C13's quantifier domain; and it is a `governs` edge, so it is squarely in R_A's domain.

### Formalization (FOL / Datalog)

Acyclicity is the canonical example of a property **no unary presence-lint can express** — it requires a transitive-closure (recursive) predicate, which is exactly what Datalog adds over a flat lint:

```datalog
% R_A — governs must be acyclic
reach(X,Y) :- governs(X,Y).
reach(X,Z) :- governs(X,Y), reach(Y,Z).
violation_RA(X) :- reach(X,X).                 % a governs-cycle = self-reaching node

% R_B — CAV2-C13
block_RB(E) :- value_constraining(E), cyclic(E), not reviewed(E).
allow_RB(E) :- value_constraining(E), cyclic(E), reviewed(E).   % the reviewed exception
```

### Cross-rule check + the defect instance

**Defect 1 — the property is unstateable by C-1..C-3 (mechanically proven).**
Construct three real-shaped CAV2-C nodes, each *individually perfect* for the per-rule validator, joined by a `governs` cycle `C2 → C13 → C4 → C2`:

| node | kind | location | per-rule lint result |
|---|---|---|---|
| C2 | `CAV2-C` | STABLE-REPOSITORY-CONSTITUTION.md | C-1/C-2/C-3 PASS |
| C13 | `CAV2-C` | STABLE-REPOSITORY-CONSTITUTION.md | C-1/C-2/C-3 PASS |
| C4 | `CAV2-C` | STABLE-REPOSITORY-CONSTITUTION.md | C-1/C-2/C-3 PASS |

Ran the actual Datalog fixpoint by hand (script in scratchpad):

```
PER-RULE VALIDATOR (C-1..C-3) findings: ALL PASS (clean)
CROSS-RULE acyclicity self-reaching nodes (governs-cycle): ['C4', 'C13', 'C2']
Witness holds: True
```

The per-rule validator returns **clean** on a constitution that contains a `governs`-cycle. R_A's recursive `reach(X,X)` finds the violation. **C-1..C-3 cannot even state the predicate** — they have no edge variable and no recursion. This is a Row-2 property (`∃ state . each-rule-satisfied-but-whole-violated`) that is *provably outside the per-rule validator's expressive language*, not merely unchecked by it. This is the rock-solid half of the witness.

**Defect 2 — a genuine cross-rule contradiction on the overlap (the sharper residue).**
Take the **one shared model**: an edge `e` that is `governs`, value-constraining, cyclic, AND `reviewed`. Evaluate both rules:

- R_A → **FORBID** (a `governs`-cycle "collapses L3 separation"; R_A states **no exception**).
- R_B (C13) → **ALLOW** (the reviewed-exception clause fires).

```
SEAM 2 on {value-constraining, cyclic, reviewed, governs-edge}:
  C13 -> ALLOW (reviewed exception)
  R_A -> FORBID (governs-cycle always collapses separation; no exception clause)
  => CONTRADICTION on the shared state: one rule admits what the other forbids.
```

This is an **inconsistency / shadowing defect**: the constitution-as-a-whole has no model on this overlap — the two rules issue opposite verdicts on the same edge. A reviewer who approves a cyclic `governs` edge under C13's exception clause has *believed they satisfied the constitution* while violating R_A. The per-rule validator cannot surface it because **C-1..C-3 never put two rules' verdicts side-by-side on one model** — that join is the thing FOL/SAT does and the lint structurally cannot.

> **Honest caveat (claim ≤ proof).** Defect 2 depends on reading R_A's `governs`-acyclicity as *exceptionless* (it is, as written) and on classifying a rule→rule `governs` edge as "value/authority-constraining" (C13's own text covers "authority transition … authority state", so this holds). It is a real overlap, not a strawman — but it lives in an **imported** constitution (house_project) not yet promoted into the CAV2 spine, so today it is a latent contradiction *across the import boundary*, not yet between two promoted CAV2 rules. Defect 1 needs no such interpretation and stands on CAV2 rules alone (C13 already mandates `governs`/authority-edge acyclicity; nothing in C-1..C-3 can check it).

### The `axiom ⊨ rule` seam (DomainSpec)

Took **A3** (`AXIOMS.md`: "Governance Must Be Computable To Be Reliable") and **C8** (`CONSTITUTION.md`: "Artifact-level signals computed deterministically"), which A3's prose claims to govern:

```fol
A3:  ∀r. critical_governance_check(r) → deterministic(r) ∧ machine_verifiable(r)
C8:  ∀s. artifact_signal(s) → computed_deterministically(s)
```

`A3 ⊨ C8` holds **only if** the linking premise `∀s. artifact_signal(s) → critical_governance_check(s)` is present. **It is nowhere written as a formula** — it lives only in the prose line `Governs: … C8`. So the entailment has a **provable premise gap**: "Governs" is an *asserted, unverified edge*, not a derivable entailment. FOL surfaces exactly the missing premise. And again — the per-rule closure lint never reads the A3→C8 edge at all; it lints `(kind, location)` only. This is a third cross-rule (cross-layer) defect the per-rule validator cannot touch.

---

## Verdict

**WITNESSED.** Row-2 residue is real and non-vacuous. A concrete cross-rule defect surfaces that the per-rule closure-validator (C-1..C-3) provably cannot state:

1. **Unstateable-property defect (airtight).** A `governs`-cycle among three individually-clean CAV2 rules: C-1..C-3 return ALL-PASS while the constitution contains a governance cycle. Acyclicity is a transitive-closure predicate; C-1..C-3 are unary `(kind, location)` lints with no edge variable and no recursion — they **cannot express the predicate**, mechanically demonstrated by hand. CAV2-C13 *already mandates* this exact acyclicity, so the gap is inside our own promoted rules: the validator we own to enforce closure cannot enforce the acyclicity our own rule requires.

2. **Inconsistency/shadowing defect (real, with a stated boundary).** On the overlap edge `{governs, value-constraining, cyclic, reviewed}`, R_A (acyclicity, exceptionless) says FORBID and CAV2-C13 (reviewed-exception) says ALLOW — opposite verdicts on one model. A model-finder/SAT check (Alloy/Cedar) finds this; C-1..C-3 cannot, because they never join two rules' verdicts on a shared model. Boundary: R_A is still an *import*, so today this is a latent cross-boundary contradiction, not yet two promoted CAV2 rules.

3. **Axiom-entailment gap (DomainSpec seam).** `A3 ⊨ C8` is asserted in prose but the linking premise `artifact_signal → critical_governance_check` is written as no formula — FOL exposes "Governs" as an unverified edge. Per-rule lint never reads the edge.

**Exact residue FOL/formal-methods owns that the per-rule validator does not:** *the predicate class requiring an edge relation and/or transitive closure over the rule graph* — acyclicity of authority edges, satisfiability of the whole rule set on a shared model, and entailment of a rule by its axiom. C-1..C-3 are unary node lints; the defect lives on **edges and joins**, which is precisely the expressive gap between a presence-lint and a relational/FOL solver.

This does **not** collapse onto `decidePolicy` or a presence-lint: there is no single-artifact reformulation of "no cycle in the governs relation" or "no model where C13 and R_A disagree." The witness is the gap itself, built and run by hand, not asserted.
