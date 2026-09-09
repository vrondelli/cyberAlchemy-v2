# S06-B — External-Solver Advocate (Options B/C)

**Author:** Jackson, Daniel · **role:** external-solver-advocate · **pole:** capability-maximization
**Stage:** Invoke Design — dialectic · **owns:** this memo · **anti-bias axis:** foundation-minimization (S06-A) vs capability-maximization (here)
**Method commitment:** a PRE-BUILT external relational/SMT solver with native transitive closure / recursion is the right engine for the Row-2 search. Claim ≤ proof — I argue from what the cited tools provably decide, concede where the single-trust-base argument wins, and pick one champion within my camp.

---

## 1. The thesis, stated narrowly

The Row-2 first step is the Gödel-witness check (findings §4–5a): on a 3-node `governs` cycle `C2 → C13 → C4 → C2` where every node is individually clean for the unary C-1..C-3 lints, decide `reach(X,X)` (the cycle is present) and the CAV2-C13 reviewed-exception guard. The discriminating predicate is **transitive closure / recursion** (REFINE-SEED §"decisive discriminator"; S01 §"decisive technical axis").

My claim is not "external solvers are better at everything." It is the sharp one: **`reach` / acyclicity is *exactly* the class of predicate these tools were built to decide natively, and they decide it with a mature, fast, well-understood bounded search at near-zero build cost — whereas the Lean-native option must hand-roll that search.** On this predicate the capability gap runs in my favor, and the build-cost gap runs hard in my favor.

## 2. Why the predicate is mine — transitive closure is native, not bolt-on

- **Alloy** has transitive closure as a *first-class operator*: `^r` is the closure of relation `r`, and `r.~r`, `*r`, etc. are primitives of the relational logic. "No cycle in `governs`" is one line: `no x: Node | x in x.^governs`. The Alloy Analyzer compiles this to a bounded SAT problem via Kodkod and returns a model (a witness cycle) or UNSAT (no cycle within the bound). The fixture is 3 nodes; the bound is trivial; the search is instant.
- **Datalog (FORGE/PCAS, arXiv 2602.16708)** expresses reachability as the textbook recursive rule `reach(X,Y) :- governs(X,Y).` / `reach(X,Y) :- governs(X,Z), reach(Z,Y).`, then `cycle(X) :- reach(X,X).` The least-fixpoint semantics computes the closure directly; the auditor (findings §"External citations real") confirmed PCAS already ships static analyses for **contradiction, redundancy, subsumption, and conditional reachability**. This is not a tool I'm hoping can do cross-rule analysis — it is a tool whose *published purpose* is cross-rule policy analysis on exactly the consistency/reachability fibre the findings name as Row 2.

In both, the load-bearing predicate is a **library primitive**, not something I author. That is the whole point: Row 2's defect (findings §4) is precisely "the per-rule lint has no edge variable and no recursion." The fix is a tool whose primitives *are* edges and recursion. I am not stretching a tool to fit; the tool's native expressiveness is the obligation.

## 3. Distinguishing within my own camp — Cedar is out, Datalog is my champion

I refuse to over-sell my own option C/B bundle. The honest internal split:

- **Cedar (arXiv 2403.04651) cannot, on its own, state acyclicity.** Cedar policies are non-recursive by design — the whole reason Cedar Analysis is *decidable/sound/complete* is that the policy language sits in a decidable SMT fragment with no fixpoint. That decidability is bought by *forbidding* recursion. So Cedar is the right tool for **decidable policy comparison** (does policy A subsume B, are two rules in contradiction *as written*) but it **cannot express `reach(X,X)`**. For the Gödel witness specifically, Cedar alone is the wrong instrument — and I will not pretend otherwise to pad my camp. (This matches S01 / REFINE-SEED: "Cedar policies generally cannot.")
- **Alloy can,** via `^r` + bounded SAT. It is the most *ergonomic* single-tool answer to the witness: one operator, one analyzer run, a concrete counterexample cycle as output. Its cost is that it is a **separate SAT trust base** with no Lean lineage.
- **Datalog (FORGE/PCAS) can,** via recursion + least fixpoint, *and* it already owns the surrounding Row-2a analyses (contradiction/subsumption/redundancy) the whole-ruleset search will eventually need.

**My champion is Datalog (FORGE/PCAS).** Reasons, in order:
1. **It covers the most of Row 2 as one engine.** The witness check is `reach(X,X)`; the *rest* of Row 2a (contradiction, subsumption, redundancy across rules — findings Row-2a) is the same engine's published analysis surface. Alloy gives me the cycle check but not the off-the-shelf contradiction/subsumption analyses; choosing Alloy means I solve the witness elegantly and then re-tool for the neighbors. Datalog amortizes.
2. **Its trust cost is smaller and more inspectable than Alloy's.** Datalog evaluation is a deterministic least-fixpoint computation — auditable by replaying the derivation (the findings author literally "ran the Datalog fixpoint by hand", §4). Alloy routes through a SAT solver (MiniSat/SAT4J under Kodkod); trusting it means trusting an opaque CDCL engine or differentially testing it. Between two external solvers, I take the one whose result I can re-derive by hand on the fixture.
3. **`Datalog⁻` decidability is well-understood.** Stratified negation (for the C13 reviewed-exception guard: "acyclic *unless* an exception is recorded") is a textbook-decidable extension. The exception guard is `blocked_cycle(X) :- cycle(X), not reviewed_exception(X).` — stratified, terminating, decidable.

So my recommendation inside the external camp is **Datalog (FORGE/PCAS) as primary, Alloy as the escape hatch** if a future check needs full first-order bounded model-finding (genuine `∃state.⋀ᵢ` whole-constitution satisfiability with rich constraints, findings Row-2b) that Datalog's Horn fragment can't shape. Alloy/Kodkod is *the* owner of Row-2b in the findings; it is held in reserve precisely for the satisfiability search Datalog can't express.

## 4. The six criteria, scored honestly

| Criterion | External (Datalog/Alloy) | Verdict |
|---|---|---|
| **Transitive-closure expressiveness** | Native: Datalog recursion / Alloy `^r`. The discriminating predicate is a *primitive*. | **Decisive win.** This is the criterion the seed says adjudicates A/B/C, and it is the one I most clearly take. |
| **Build cost** | Near-zero: encode ~6 edges + a 3-line reachability rule (Datalog) or one `no x: x in x.^governs` (Alloy). No search algorithm authored. | **Strong win.** Lean-native must *implement* a bounded reachability/`decide` procedure and prove it does what `reach` means. |
| **Whole-ruleset performance** | Mature, optimized engines: Datalog semi-naive evaluation scales to large fact sets; Kodkod/SAT is the standard for bounded model-finding. Built for many rules, not three. | **Win** — performance is a *given*, not a thing I build or tune. |
| **Decidability / soundness** | Datalog⁻ (stratified) decidable & terminating; Cedar Analysis sound/complete on its fragment; Alloy sound *within the bound* (bounded SAT — UNSAT means "no cycle ≤ bound", not "no cycle"). | **Qualified win.** Datalog reachability is *unbounded*-complete (real least fixpoint, no bound needed). Alloy's completeness is bound-relative — a genuine caveat I own. |
| **Trust base** | **Second trust base.** Datalog engine OR SAT solver must be trusted or differentially tested. Cedar's verified core is Lean (shares the substrate), but a vanilla Datalog/Alloy engine does not. | **Loss vs Lean-native.** This is the opposition's strongest card; see §5. |
| **Maintenance** | Depend on an external engine (version, availability, encoding drift as rules evolve). Offset: these are stable, widely-used tools with large user bases. | **Mild loss.** A Lean check lives inside the kernel's own CI and `#print axioms` discipline; an external engine is a separate dependency to keep green. |

Net: I win the two criteria the seed calls discriminating (expressiveness, build cost) and the performance criterion outright; I lose trust base and maintenance; decidability is a qualified win that tips to Datalog over Alloy.

## 5. Steelman of the opposition (S06-A, Lean-native) — and my concession

The opposition's case is not weak, and one part of it is genuinely correct:

- **The real cost is a second trust base.** A Lean-checked `reach`-acyclicity result is **single-trust-base**: it lives in the same kernel as `decidePolicy_sound`, carries the same `#print axioms` / sorry-free discipline (findings §"Trust-but-verify the Lean"), and needs no differential testing against a separate engine. Every external solver I bring in is a second thing that must be trusted or cross-checked. For a *governance authority spine* whose entire value proposition is trustworthiness, importing an unverified SAT/Datalog engine to police the constitution is in tension with the spine's own standard. The findings say this in plain terms (§5d): "Even Row 2 should first be weighed against doing the finite-model search **in Lean** (single trust base)."
- **Cedar's verified core is itself Lean** (findings §5d, §"External citations real") — so the *one* external option that shares the trust base is Cedar, and Cedar is exactly the option I just conceded cannot express `reach`. That is an awkward fact for my camp: the trust-base-preserving external tool is the one that can't do the job, and the job-capable external tools (Datalog/Alloy) don't share the trust base. The opposition gets to point at that scissor and it is fair.
- **The fixture is tiny.** Three nodes, ~6 edges. A hand-rolled bounded `reach` in Lean over a finite graph is `decide`-able and small; the build cost I tout shrinks when the graph is this small. For the *witness check alone*, "just do it in Lean" is a credible, single-trust-base answer, and my build-cost argument is weakest exactly here.

**Where I concede the single-foundation argument wins:** for the **Row-2 witness check in isolation, on a bounded graph, where the result must carry the kernel's own trust grade and feed Lean-checked downstream theorems** — Lean-native is the right call. The graph is small enough that hand-rolling `reach` is cheap, and single-trust-base is a hard requirement for an authority spine's self-validation. I do not contest that.

## 6. Where I do *not* concede — when the external solver wins

The single-trust-base argument is decisive **only while three conditions all hold**: the search is small, bounded, and its result must be a first-class Lean theorem. The moment any one breaks, my camp wins:

- **Scale / whole-ruleset Row-2a.** The witness is 3 nodes; the *constitution* is dozens of rules with many `governs` edges, and Row-2a wants contradiction/subsumption/redundancy across all of them (findings Row-2a). Hand-rolling and *re-verifying* a performant cross-rule analyzer in Lean is a real project; Datalog/PCAS ships it. As the rule graph grows, the build-and-maintain cost of the Lean search overtakes the trust-base cost of an external engine.
- **Unbounded reachability.** Alloy is bound-relative; **Datalog reachability is not** — its least fixpoint is genuinely complete over the whole edge set with no bound to pick or defend. If the question is "is there *any* cycle anywhere," Datalog gives a real total answer where a Lean bounded `decide` must pick and justify a bound.
- **The result need not be a Lean theorem — only a CI gate.** If the cross-rule check is a *lint gate* ("block the cycle the per-rule validator passes", findings §5a) rather than a premise feeding a categorical proof, then the second trust base can be discharged by **differential testing** (run the check both ways on fixtures) instead of formal verification — cheap, and the maturity/speed of the external engine dominates.

## 7. Recommended posture (my pole's offer to the synthesizer)

A **staged** answer, not a monolith — which the tournament can weigh against S06-A:
1. **Witness check (the §5a first step):** if it must be a Lean-grade theorem in the kernel, concede to Lean-native (S06-A). If it is a CI gate, **Datalog (FORGE/PCAS)** at near-zero build cost, differential-tested on the 3-node fixture.
2. **Row-2a whole-ruleset (contradiction/subsumption/redundancy):** **Datalog (FORGE/PCAS)** — it owns these analyses; re-building them in Lean is not justified.
3. **Row-2b whole-constitution satisfiability (`∃state.⋀ᵢ`):** **Alloy/Kodkod** (the findings' named Row-2b owner) when the constraint shape exceeds Datalog's Horn fragment.

Trust base is handled by tiering: Lean for results that must be theorems; differential testing for results that are gates. That keeps the spine's single-foundation guarantee exactly where it is load-bearing and spends an external engine only where it isn't.

---

**Bottom line:** My champion is **Datalog (FORGE/PCAS)** — native recursion, decidable stratified negation, and it already owns the surrounding Row-2a analyses, with **Alloy/Kodkod** held in reserve for Row-2b satisfiability; the external solver **wins when the Row-2 search is large, unbounded, or only a CI gate**, and **loses to Lean-native when the search is the small bounded witness check whose result must carry the kernel's single-trust-base grade as a first-class theorem.**
