# S08 — Toy-game capability matrix (governs-acyclicity)

**Stage:** Empirical capability matrix · **owner:** refine · **status:** pass
**Falsifier:** de Moura, Leonardo — NEUTRAL toy-game falsifier (author of both Z3 and
Lean; no camp). Axis under test is **expressiveness + decidability only** — trust base is
explicitly NOT my axis (that is S05/S04's decision, not this matrix's).

> Claim ≤ proof. For each engine I report what it can *actually* express and decide on the
> bounded fixture, with a concrete mechanism — not what would be convenient for any option.

## The fixture (the toy game)

The **Gödel witness** from the accepted FOL findings §4:

- Three CAV2-C nodes — `C2`, `C13`, `C4` — joined by a `governs` cycle
  `C2 → C13 → C4 → C2`.
- Each node is **individually clean** for the per-rule lints **C-1..C-3**, which are unary
  `(kind, location)` presence predicates with **no edge variable and no recursion**
  (`authority-kind-closure-validator-SPEC.md:19–25`).
- The cross-rule obligation is **`reach(X, X)`** — the existence of a node that reaches
  itself, i.e. a cycle in the `governs` relation. This is a **transitive-closure /
  recursive** predicate over edges. **CAV2-C13 already mandates this acyclicity**
  (`STABLE-REPOSITORY-CONSTITUTION.md` §CAV2-C13, "Value-Cycle Edge Guard").

The EDB is finite and tiny: 3 nodes, 3 directed `governs` edges. The decision question is
"is there `X` with `reach(X, X)`?" — the answer on this fixture is **YES** (the whole
`{C2, C13, C4}` strongly-connected component self-reaches). An eligible engine must be able
to (a) **EXPRESS** transitive closure / `reach`, and (b) **DECIDE** it on this bounded graph.

## Per-engine adjudication

### 1. Lean-native — inductive `reach` + `Decidable` + `decide`

- **EXPRESS: YES.** `reach` is a textbook inductive relation:
  `inductive Reach : Node → Node → Prop | base : governs a b → Reach a b | step :
  governs a b → Reach b c → Reach a c`. Transitive closure is exactly an inductively
  defined predicate; Lean expresses it natively.
- **DECIDE: YES, on the bounded fixture.** Over a `Fintype Node` (here `Fin 3`) with a
  `DecidableEq`, `Reach` is decidable: either derive a `Decidable (Reach a b)` instance via
  a bounded fixpoint (reachable set saturates in ≤ |Node| steps, `Nat.lt_wfRel` / explicit
  fuel = 3) or reduce `∃ x, Reach x x` to a `Finset.decidableExists` over `Finset.univ`.
  `decide` then closes `∃ x : Fin 3, Reach x x` by kernel computation.
- **Ergonomics:** you hand-build the decision procedure (the `Decidable` instance / bounded
  fixpoint) — it does not come for free the way `^r` or a Datalog rule does. For 3 nodes it
  is trivial; the cost is authoring, not running.
- **Soundness:** strongest of the four — `decide` is checked by the Lean kernel, the same
  trust base as the categorical spine and `decidePolicy_sound`. No second foundation, no
  oracle. **Verdict: ELIGIBLE.**

### 2. Cedar (the policy language) — NOT Cedar-bundled-with-Datalog

- **EXPRESS: NO.** Cedar is a **non-recursive** authorization policy language. Its analysis
  story (Cedar Analysis / the symbolic SMT compiler, arXiv 2403.04651) is deliberately a
  **decidable, EPR-ish fragment** built for *policy comparison* (equivalence, shadowing,
  permissiveness) — it gets decidability precisely by **excluding recursion / fixpoints /
  transitive closure**. There is no `reach`-style recursive rule and no built-in TC operator
  in Cedar. A Cedar policy cannot state "no cycle in `governs`."
- **DECIDE: N/A — cannot express, so nothing to decide.** Cedar would happily decide the
  per-rule `(kind, location)` lints (that is its sweet spot, and it is exactly the Row-1
  fibre that already collapses to the owned Lean decider) — but it is **blind to the
  cross-rule acyclicity obligation** in the same structural way C-1..C-3 are.
- **The bundling trap, named:** "Cedar + Datalog (FORGE/PCAS)" is one *row* in the findings
  matrix but **two engines** with different expressive power. The recursion/reachability
  lives **entirely on the Datalog side**, never the Cedar side. Crediting Cedar with
  `reach` because it ships next to Datalog is the error this matrix exists to prevent.
  **Verdict: RULED OUT** for this specific check (decidable policy-comparison engine, no
  recursion).

### 3. Datalog (FORGE/PCAS) — recursion native

- **EXPRESS: YES.** `reach(X, Y) :- governs(X, Y). reach(X, Y) :- governs(X, Z),
  reach(Z, Y).` is the **canonical Datalog reachability idiom** — the textbook example of
  what recursive Datalog is *for*. The acyclicity query is `reach(X, X)?`.
- **DECIDE: YES.** On a finite EDB, Datalog evaluation is a least-fixpoint that always
  terminates (the Herbrand base is finite); reachability is **PTIME-complete** and decidable.
  On the 3-edge fixture the fixpoint saturates immediately and returns
  `reach(C2,C2), reach(C13,C13), reach(C4,C4)` (plus the off-diagonal pairs) — the cycle is
  caught. This is the by-hand fixpoint the findings §4 already ran.
- **Caveat on the cited tool, claim ≤ proof:** the FORGE/PCAS paper's *static analyses*
  (contradiction/subsumption/conditional-reachability, arXiv 2602.16708) are stated for the
  **non-recursive Datalog⁻ fragment**. So the **language Datalog** trivially expresses and
  decides `reach(X,X)`; whether the **specific PCAS analysis surface** exposes a *recursive*
  reachability predicate, vs. only non-recursive conditional reachability, is a tool-surface
  question. The eligibility verdict here is for **recursive Datalog as an engine** (which is
  exactly express+decide YES); PCAS-as-shipped may need its recursive evaluation invoked
  directly rather than via its non-recursive analysis API. **Verdict: ELIGIBLE** (recursion
  is native and decidable on the finite EDB; the closure idiom is standard).

### 4. Alloy/Kodkod (or Z3) — native TC / bounded SAT / reachability encoding

- **Alloy: EXPRESS YES.** Alloy has **first-class transitive closure**: `^governs` is the
  transitive closure of the `governs` relation, and `no x : Node | x in x.^governs` is the
  acyclicity assertion stated directly. No hand-rolled fixpoint.
- **Alloy: DECIDE YES.** Alloy compiles to **Kodkod → bounded SAT**. With a scope of 3
  (`run {} for 3 Node` or `check Acyclic for 3`) the model finder is complete *within the
  bound*, and the bound here is the exact fixture size, so the SAT result is decisive: it
  finds the `{C2,C13,C4}` cycle as a counterexample to acyclicity. Soundness is relative to
  the SAT solver (separate trust base — but that is not my axis).
- **Z3: EXPRESS YES, DECIDE YES — with a caveat.** Z3 has **no native unbounded TC**.
  Two routes both work on this fixture: (a) encode the 3 nodes/edges as finite-domain /
  EPR constraints and the reachability matrix as a finite set of ground/quantified clauses
  — decidable, terminating; or (b) use Z3's **Datalog/fixedpoint (`fp`/Spacer) engine**,
  which *does* support recursive Horn reachability and decides it on a finite relation.
  Plain first-order Z3 with an *unbounded* recursive `reach` axiom is undecidable in
  general, but **bounded to 3 nodes it is finite-model and decidable**. **Verdict: ELIGIBLE**
  (Alloy native `^r` + bounded SAT is the cleanest; Z3 eligible via finite encoding or its
  fixedpoint engine).

## Capability matrix (compact)

| Engine | Can EXPRESS `reach`? | Can DECIDE on bounded fixture? | Verdict | Reason |
|---|---|---|---|---|
| **Lean-native** | YES (inductive `Reach`) | YES (`Decidable` inst / bounded fixpoint + `decide` over `Fin 3`) | **ELIGIBLE** | TC = inductive predicate; decidable on `Fintype`; kernel-checked, single trust base |
| **Cedar** (policy lang) | **NO** | N/A (nothing to decide) | **RULED OUT** | Decidable policy-comparison engine, EPR-ish *by excluding recursion*; no TC operator, no recursive rule |
| **Datalog** (FORGE/PCAS) | YES (`reach(X,Y):-governs(X,Y); reach(X,Y):-governs(X,Z),reach(Z,Y)`) | YES (least-fixpoint terminates on finite EDB; reachability PTIME) | **ELIGIBLE** | `reach(X,X)` is the canonical Datalog idiom; decidable on finite EDB (PCAS *analysis API* may expose only the non-recursive fragment — invoke recursive eval directly) |
| **Alloy/Kodkod** | YES (`^governs`, first-class TC) | YES (Kodkod → bounded SAT at scope 3) | **ELIGIBLE** | Native transitive closure + complete-within-bound model finding; bound = fixture size |
| **Z3** | YES (finite EPR encoding, or `fp`/Spacer Horn) | YES (finite-model / fixedpoint; bounded to 3 nodes) | **ELIGIBLE** | No native unbounded TC, but decidable when bounded or via its Datalog/fixedpoint engine |

## ELIMINATION

- **RULED OUT — Cedar alone.** It is the only engine that **cannot even EXPRESS** `reach`.
  By construction it buys decidability of policy-comparison by *excluding* recursion /
  transitive closure (EPR-ish, arXiv 2403.04651). It is structurally blind to
  `governs`-acyclicity in the same way the unary C-1..C-3 lints are — adding Cedar to the
  per-rule sweep would **not close the Row-2 gap**. Eligible only for the Row-1 fibre, which
  already collapses to the owned Lean decider.
- **ELIGIBLE — Lean-native, Datalog, Alloy/Kodkod, Z3.** All four can express *and* decide
  governs-acyclicity on the bounded fixture. They differ on **ergonomics of expression**,
  not on capability: Alloy (`^r`) and Datalog (`reach :- ...`) get `reach` essentially for
  free; Lean and Z3 require a small authored decision procedure (inductive instance / finite
  encoding) but reach the same YES/YES on 3 nodes.

**Bottom line for the engine choice (S05/S09 own the verdict, not this matrix):** the
discriminator that S04 named — "can the engine express transitive closure" — eliminates
**exactly one** candidate (Cedar-the-policy-language), and only because it was *designed* to
exclude recursion. It does **not** eliminate Datalog, which is bundled with Cedar in the
findings' "Option B" row — so the Option-B *row* survives entirely on its Datalog half. The
remaining three+one are all capable; the choice among them is now an axis this matrix does
not adjudicate (trust base, single-foundation, ergonomics — S05's call).

---

*Matrix authored by the neutral falsifier; expressiveness + decidability only. The Cedar
ruling is the load-bearing finding — it is the one place the common "Cedar + Datalog"
bundling hides a real expressive split.*
