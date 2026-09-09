# S06-A — Lean-native advocate

**Stage:** S06 dialectic/tournament · **role:** Option A advocate — Lean-native bounded
finite-model search, authored IN LEAN · **agent:** Avigad, Jeremy · **status:** argued

> Discipline: claim ≤ proof. I argue for Option A as the right engine for the *Row-2
> first step* (the Gödel-witness `governs`-acyclicity + CAV2-C13 check on the 3-node
> cycle `C2 → C13 → C4 → C2`). I steelman the opposition and concede where Lean-native is
> the wrong call. The falsifier's capability matrix (S08) is the discriminating evidence;
> nothing here pre-decides it.

---

## 0. What is actually being decided

Not "is Lean a good prover" — that is not in dispute. The narrow question is: **which engine
runs the bounded Row-2 search**, first instantiated as deciding `reach(X,X)` (transitive
closure) over a *tiny, fully-enumerated* graph — three nodes, three `governs` edges, each node
individually lint-clean under C-1..C-3 (findings §4; S01). The discriminating predicate is
recursive (acyclicity = a fixpoint over edges). My claim is scoped to **this** decision and
its near recomposition, not to whole-ruleset model-finding at scale (§5, where I concede).

---

## 1. The strongest honest case for Lean-native

### 1a. ONE trust base — and it is already the kernel's

The cav2 spine's Row-1 decider is *already first-order logic written in Lean*: `Satisfies` is
the FOL formula verbatim, `decidePolicy` its sound+complete decider, with `decidePolicy_sound`
a non-`rfl` theorem and `#print axioms` clean (findings §3 Row-1 row; Bourbaki audit item 4
confirmed `decidePolicy_sound` at `AgentPermissionKernel.lean:162`, `#print axioms` at :209,
`grep -c sorry = 0`). Row 2 in the same kernel already has its **template**:
`decidePolicy_flatten_meet` and `layered_not_flattenable` are owned cross-semantics
*distinguishing* theorems — exactly the "different states satisfy different conjuncts" shape
the Row-2 obligation needs (findings §3 Row-2a row, §5b; Bourbaki audit item 4 confirmed
`decidePolicy_flatten_meet` at `AgentPermissionKernelAlgebra.lean:98`, `#print axioms` at
:109). Doing the Row-2 search in Lean means the acyclicity decider sits *in the same file
family, under the same kernel, checked by the same kernel* as the Row-1 decider it must
agree with. There is no import, no translation layer, no "trust that the Alloy/Z3 encoding
faithfully mirrors my Lean semantics" obligation. That faithfulness obligation is itself an
unproven lemma in Options B and C; in Option A it does not exist because there is nothing to
mirror.

### 1b. A Lean-checked result is terminal — no re-verification under a second foundation

This is the decisive asymmetry. When Z3 returns UNSAT, the *trustworthy* consumption of that
result inside a Lean-grounded spine is to either (i) trust the SMT solver as an oracle
(importing its soundness as an axiom — a second trust base, exactly what findings §5d warns
against) or (ii) reconstruct/replay a proof certificate back in Lean. Path (ii) means you pay
for Lean anyway *plus* the solver. Option A skips the round-trip: a `Decidable` instance that
evaluates to `isFalse` for "∃ cycle" **is the proof**, kernel-checked, no certificate to
import. For a governance authority spine whose whole point is that promoted rules are
machine-checked under one foundation, a result that needs no re-verification is not a
convenience — it is the property the spine exists to preserve.

### 1c. `reach` is inductively definable and `decide`-able on a bounded graph — natively

The objection "Lean can't do transitive closure" is false. The `governs` edge relation is a
decidable relation on a `Fintype` of nodes; `Relation.ReflTransGen` (or a hand-rolled
inductive `Reach`) defines reachability directly, and on a finite node type the existence of a
cycle, `∃ x, Reach_excl x x`, is a decidable proposition — `DecidablePred` derivable, and on
the 3-node fixture `decide` settles it by computation. The recursion the predicate needs is
*structural recursion the kernel already supports*; I am not reaching outside Lean to get it.
For the actual fixture (`C2 → C13 → C4 → C2`, with C13's reviewed-exception as a guard on one
edge), this is a few dozen lines: enumerate nodes, list edges, define `reach`, `decide` the
cycle, and — the payoff — `decide` *also* shows the per-rule lints C-1..C-3 return ALL-PASS on
the same fixture, **in one file, one trust base**, exhibiting the exact gap findings §4
witnessed. That co-location of "lints pass" and "cycle exists" under one kernel is something B
and C structurally cannot give: they prove the cycle in a *different* logic than the one the
lints live in.

### 1d. Cedar's "external" core is itself Lean — so the trust-base advantage is broader than it looks

Even Option B's headline ("Cedar shares the trust base because its verified core is Lean") is a
concession *to me*, not to B: it concedes that the thing worth trusting is the Lean kernel. But
B still pays an encoding/translation seam (cav2 rules → Cedar policy syntax → its Lean core),
whereas A writes the cav2 rules as Lean predicates *directly*. If the trust base worth having is
Lean's, the shortest path to it is to never leave it.

---

## 2. Steelman of the opposition — what I concretely GIVE UP

I will not pretend these are small. Each is a real cost paid by choosing A.

### 2a. I hand-build what Alloy and Datalog give natively

Alloy's `^r` (transitive closure) and Datalog's recursive rules (`reach(X,Z) :- edge(X,Y),
reach(Y,Z)`) are **primitives** — one operator, zero scaffolding, and the engine's bounded
model-finder (Kodkod for Alloy) or fixpoint evaluator (Datalog) is a tuned, decades-hardened
search. In Lean I am *authoring* `Reach`, authoring its `Decidable` instance, and — critically —
authoring the *search* (the enumeration of candidate states for the `∃state.⋀ᵢ` form) by hand.
For the 3-node fixture this is trivial; for anything where I must *find* a violating model
rather than *check* a given one, I am writing a model-finder that Alloy/Datalog already are.
This is the honest core of the opposition: **Option A asks me to build a bounded model-finder;
Options B/C ship one.**

### 2b. `decide` is ergonomically and computationally painful on a real bounded search

`decide` is sound but it is *brute kernel evaluation*. On a tiny enumerated fixture it is
instant; on a real bounded search with a non-trivial domain, `decide` can be slow to the point
of unusable, and worse, it can be ergonomically hostile — opaque "deep recursion" or timeout
failures, no model returned (just `isFalse`/`isTrue`), no counterexample trace. A tuned
SAT/SMT backend (Z3) or Kodkod gives you the witnessing model when it exists — which for a
*governance* tool is exactly what an operator wants ("here is the cyclic state that violates
C13"), not a bare boolean. Lean's `decide` gives the boolean; reconstructing the witness is
more hand-work. So even on expressiveness-I-can-match, the *output ergonomics* favor B/C.

### 2c. I risk reinventing a model-finder — badly

The deep risk: the moment Row-2 grows from "check this fixture" to "search for *any* violating
state across the whole ruleset," a naive Lean `decide` over an enumerated state space is the
worst possible model-finder — no clause learning, no symmetry breaking, no incremental solving,
none of the thirty years of SAT/SMT engineering. If I let Option A creep from the fixture to the
whole ruleset, I am not "doing it in Lean," I am *rebuilding Kodkod in Lean, slower*. That is a
real and tempting failure mode and the opposition is right to name it.

---

## 3. Where the steelman does NOT reach (rebuttal, bounded)

The steelman is strongest about **finding** models at **scale**. It is weakest about the
**decided unit** (S05): the Gödel-witness *check* on a *fixed, tiny, fully-enumerated* fixture.
On that unit, 2a's "I ship a finder" advantage is nearly worthless — there is nothing to
search, the three nodes and three edges are given; you are *checking* `reach(X,X)` on a known
graph, which `decide` does instantly. 2b's "no witness" sting is also blunted: the fixture *is*
the witness; we already hold it (findings §4 constructed it by hand). And 2c's "reinventing
Kodkod" risk only materializes if A is pushed past its bound — which the collapse-test below
forbids. So for the **first step specifically**, the opposition's three best blows land on costs
that the first step does not incur.

---

## 4. Honest concessions — where Lean-native is the WRONG call

Claim ≤ proof requires me to mark the boundary, not defend past it.

- **Whole-ruleset satisfiability at scale → not Lean-native.** When Row 2 becomes "is there
  *any* state satisfying the whole constitution," i.e. genuine `∃state.⋀ᵢ` model-*finding* over
  a large/under-constrained domain, that is a SAT/SMT search problem and a tuned backend (Z3
  UNSAT-check, Alloy/Kodkod bounded SAT) is the right tool. findings §5d itself frames the
  Row-2 solver as earning its place "by search performance on whole-ruleset model-finding, not
  by foundation." At that scale, performance is the criterion and Lean-native `decide` loses.
  I concede this without reservation.
- **Operator-facing counterexample UX → favors B/C.** If the product requirement is "return the
  violating model to a human reviewer," B/C's native witness output is a real advantage A must
  hand-build around.
- **Recursion-heavy cross-rule analyses beyond acyclicity → Datalog's home turf.** Subsumption,
  conditional reachability, redundancy across many rules (FORGE/PCAS, findings §3 Row-2a) are
  what Datalog static analysis is *for*. If the Row-2 program is dominated by those, B is the
  more honest fit and A would be swimming upstream.

---

## 5. The discipline that keeps Option A honest (collapse-test)

Option A is the right call **iff it is held to its bound**. The binding rule I accept:

- **A owns the *check* of an enumerated fixture; A does not own *search* at ruleset scale.**
  The moment the obligation is "find a model over a large domain," hand off the *search* to a
  tuned backend (this is the staged combination S05 anticipated, not a defeat of A).
- **Recomposition without re-deciding:** the Lean acyclicity decider for the fixture recomposes
  into the larger Row-2 obligation as a *checked component* — the bounded check stays in Lean
  (single trust base, terminal result), the unbounded *search* delegates. This is precisely a
  staged A-for-check / C-for-search split, with the trust seam at the one place a certificate
  can be replayed.

If a reviewer shows the *first step itself* (the 3-node fixture) is too large for `decide` to
settle ergonomically, my case collapses to B/C even at step one — that is the falsifiable
prediction the S08 capability matrix should test, and I stake the advocacy on it.

---

## Bottom line

**Lean-native wins for the bounded Row-2 *check* — the Gödel-witness fixture and anything that
*verifies a given* model — because it keeps one terminal, kernel-checked trust base and
co-locates the acyclicity result with the C-1..C-3 lints it must out-decide; it loses the
moment the obligation becomes *finding* a model over a large domain at whole-ruleset scale,
where a tuned SAT/SMT backend (Option C) or Datalog (Option B) is the honest engine.**
