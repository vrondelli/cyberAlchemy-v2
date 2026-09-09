---
agent_name: "Tarski, Alfred"
role: explorer
label: E2-formal-methods-field
dispatch_id: 2026-06-28-constitution-fol-validation-path
methodology: formal/external survey
corpus: "external formal methods: FOL/SMT (Z3), Alloy/Kodkod relational logic, Datalog/Cedar policy logic, OWL/DL, TLA+ model-checking, Tarskian satisfaction"
---

# E2 — Formal-methods field: what already validates a governance ruleset cross-rule

I defined the satisfaction relation `⊨`. Model-theoretic validation is my home, so I am
the angle most at risk of *over-crediting the field* — of saying "the tool can express
our constitution, therefore it validates it." I have tried to hold the line **claim ≤
proof**: for each tool I separate "CAN encode the obligation" from "DECIDES the
obligation", and I judge fit to OUR shape (scoped modular rules over an artifact graph:
selector + rule statement + underlying axiom + enforcement gate + Validation mode), not
to generic policy.

## The owned baseline I must beat (the per-rule floor)

The `authority-kind-closure-validator-SPEC.md` is the concrete per-rule validator the
field has to add residue OVER. Read precisely, it does:

- **C-1..C-3** — *presence/location lints*: the catch-all row exists; each kind's
  artifacts live in their home location; no authority artifact sits in a
  non-enumerated location.
- **R-1** — a *review flag* for an unenumerated governing kind (explicitly NOT
  deterministic; review-mode until the kind-declaration convention exists).

Every deterministic check there is **one-rule-at-a-time, syntactic/structural** ("is row
X present", "is artifact in location L"). It NEVER asks: do two rules contradict? does the
axiom this rule cites actually entail the rule? does the whole repo state satisfy the
whole constitution at once? That gap — **the cross-rule residue** — is what the field
must supply to be build-worthy, and it is the only thing I score below.

## Tool survey

Check-class legend: **PR** = per-rule decidable (what we already own) · **XC** = cross-rule
*consistency* (do rules contradict / shadow / subsume each other) · **EN** = *entailment*
(does axiom ⊨ rule; does ruleset₁ ⊨ ruleset₂ / equivalence) · **MC** = *model-checking*
(`state ⊨ ruleset`, incl. reachable-state / transition-system satisfaction).

| Tool | Check-class it actually DECIDES | Decidability | Fit to our (selector + rule + axiom + gate) shape | Cross-rule residue it adds over our per-rule validator |
|---|---|---|---|---|
| **Cedar + Cedar Analysis** (AWS; symbolic compiler verified in Lean) | XC + EN, fully decided. Decides policy-set **equivalence**, **permissiveness/implication** (set₁ allows everything set₂ does + more), incomparability; single-set: shadowed permits, impossible conditions, forbid-overrides, complete-denials. | **Decidable** — *the* differentiator. Cedar is deliberately restricted to a decidable SMT fragment: quantifier-free, **ground** constraints, finite domains, decidable theories; sound+complete. UNSAT = the property holds for all requests/entity-stores. | **Tightest semantic fit.** Cedar's model = principal/action/resource/context over an **entity hierarchy** — structurally our selector (which artifacts) + rule + an artifact graph. Deny-overrides (`forbid` beats `permit`) is exactly our enforcement-gate precedence. The gap: our rules also carry an *underlying axiom* and a *Validation mode* tag, which Cedar has no slot for. | **REAL, and decidable.** "Do these two constitution rules contradict / does this rule shadow that one / does the new rule version permit strictly more than the old" — Cedar *decides* this with a counterexample request. Our validator cannot express it at all. |
| **Datalog + stratified negation** (FORGE: "Formal Policy Enforcement for Real-World Agentic Systems", arXiv 2602.16708 — a near-isomorph of our problem) | XC: **contradiction** (Allow(v) ∧ Deny(v,m) from same state), **redundancy** (rule removable with no verdict change), **subsumption** (specific rule superseded by general). EN: reachability ("which states permit/deny action A"). | **Decidable on the restricted fragment they use** — analyses run over a **non-recursive** fragment via query-containment/reachability (polynomial data complexity). NB: containment over *fully* recursive Datalog is **undecidable**; consistency of general Datalog⁻ is undecidable. Rule *evaluation* (stratified) is PTIME and total. | **Strong fit, and it's a worked precedent for the whole pipeline.** FORGE takes NL policy → Datalog rules → static cross-rule defect analysis — the exact "constitution as ruleset over substrate state" we have. Recursion handles transitive structure (our promotion edges / authority-kind hierarchy). Same missing slots as Cedar (no axiom-entailment, no mode tag). | **REAL, decidable on the non-recursive fragment.** Contradiction + redundancy + subsumption + reachability are precisely the cross-rule checks our per-rule lints lack. This is the closest *published, end-to-end* match to our problem. |
| **Alloy / Kodkod** (bounded relational model-finding over a SAT backend) | XC + MC, but **bounded**: `check` hunts a counterexample instance violating the conjoined constraints within a finite scope; `run` finds a satisfying instance (consistency witness). | **Bounded-decidable only.** Sound for *finding* counterexamples up to scope k; a clean `check` is **NOT** a proof — "no counterexample within scope k" ≠ "no counterexample". Relational FOL + transitive closure is otherwise undecidable. | **Excellent EXPRESSIVE fit, weakest GUARANTEE.** Our constitution *is* an artifact graph + relational constraints — Alloy's native object. You can model authority-kinds as sigs, promotion edges as relations, every rule as a fact, and ask "is there a repo instance satisfying all rules but violating intent". Best tool to *author and explore* the model; the answer is a bounded witness, not a theorem. | **REAL as counterexample-finding, NOT as a guarantee.** Adds genuine cross-rule + state⊨ruleset *bug-finding* our validator lacks — but delivers refutation-up-to-scope, not verified consistency. Complements Cedar/Datalog (use Alloy to discover the property, Cedar to decide it). |
| **SMT / Z3 (general FOL/theory)** | XC + EN expressible: assert all rules, check `sat` (consistency); assert ruleset ∧ ¬rule, `unsat` = entailment. | **Undecidable in general** with quantifiers; modern SMT quantifier instantiation is **not refutationally complete** even for pure FOL. Decidable only on restricted theory fragments — which is *exactly the discipline Cedar imposes*. | Fit is "the raw engine, unconstrained." Encoding our rules in full FOL buys expressiveness but loses the decision guarantee — you get sat/unsat/**unknown**. | **REAL but un-guaranteed.** Same cross-rule residue as Cedar, minus the decidability. Z3 is the *backend*; the win comes from constraining the encoding (Cedar's lesson), not from raw Z3. |
| **OWL / Description Logic** (HermiT, SROIQ; ABox/TBox consistency + subsumption) | XC (ontology **consistency**) + EN (**subsumption**, instance-checking). | **Decidable**, with known complexity: ALC subsumption/consistency EXPTIME-complete; OWL 2 (SROIQ) higher but decidable; EL fragment PTIME. | **Partial fit — only the ontology-shaped slice.** Our **authority-kind enumeration** (CAV2-D49 closed kinds + default-deny catch-all) is literally a TBox: a closed class hierarchy. DL decides "is this kind-hierarchy consistent / is kind A subsumed by B / is this artifact a well-typed instance". But our rules are *deontic/enforcement* (permit/forbid/gate), which DL does NOT model — DL is about class membership, not authorization verdicts. | **REAL but NARROW.** Adds decided consistency/subsumption for the *authority-kind ontology layer specifically* — directly relevant to R-1 (the unenumerated-governing-kind flag the validator punts to review). Does NOT cover rule-vs-rule authorization contradiction. |
| **TLA+ / TLC (model-checking)** | MC: `state ⊨ spec` over a transition system — BFS all reachable states, report any state violating an invariant with a counterexample trace. | **Decidable for finite/bounded models** (TLC explicit-state); Apalache adds symbolic; TLAPS for unbounded proof. State-space explosion is the practical limit. | **Fits ONE aspect only: the promotion lifecycle.** Our authority-promotion is a state machine (candidate → review → promoted, gated). TLA+ decides "every reachable promotion state satisfies the constitution's invariants" — the genuine *temporal* `state ⊨ ruleset`. But most of our constitution is a *static* artifact-graph predicate, not a transition system; TLA+ is overkill there. | **REAL for the lifecycle/temporal slice.** Adds reachable-state `state ⊨ invariant` checking the per-rule (and even Cedar's static) analysis lacks — but only where the object is genuinely a transition system. For static structure it reduces to what Alloy/Cedar already give. |

## Honest read

**Is the cross-rule residue real? Yes — unambiguously, and not a relabel.** Our owned
closure-validator is per-rule **syntactic presence/location lints** (C-1..C-3) plus a
review flag (R-1). None of its checks can even *state* "rule A and rule B contradict",
"this rule is redundant given that one", "the axiom entails its rule", or "this repo state
satisfies the whole constitution". Those are *different logical objects* — cross-rule
consistency, entailment, and `state ⊨ ruleset` — and at least two field tools **DECIDE**
them, not merely express them. So "FOL/formal-methods-validate the constitution" does
**not** collapse into the per-rule validators we already spec. It is **build-from-owned on
the field's tools**, with a real residue.

**Tightest tool to build-from-owned on: Cedar (with Datalog/FORGE as the direct design
precedent for the full pipeline).** My reasoning, claim ≤ proof:

1. **Cedar is the only tool that DECIDES the cross-rule properties on a fragment proven
   sound+complete+decidable** (quantifier-free, ground, finite domains), and its
   verification core is checked in **Lean** — which means it does not fork from E3's
   categorical Lean spine; it shares the substrate. Its entity-hierarchy + deny-overrides
   model is the closest structural match to "selectors over an artifact graph with gate
   precedence." Residue: decided equivalence / implication / shadowing / contradiction.

2. **Datalog-with-stratified-negation (FORGE) is the closest published *end-to-end* match
   to our exact problem** — NL governance policy → rules over substrate state →
   *decidable cross-rule defect analysis* (contradiction, redundancy, subsumption,
   reachability) on a non-recursive fragment. If we want recursion over the
   promotion-edge / authority-kind hierarchy, this is the model to copy. It is the better
   *blueprint*; Cedar is the better *verified engine*.

3. **Alloy is the right tool to AUTHOR and EXPLORE the model and find the first
   counterexample**, but I refuse to credit it as a guarantee: a clean `check` is
   refutation-up-to-scope, **not** a consistency proof. Use it to *discover* the cross-rule
   defect on a real cav2 rule pair, then have Cedar/Datalog *decide* it.

4. **OWL/DL is a real but narrow add** — it decides exactly the authority-kind *ontology*
   layer (CAV2-D49 closed enumeration), which is precisely the R-1 case our validator
   currently sends to review. Worth pulling in for that slice only.

5. **TLA+ earns its keep only for the promotion-lifecycle transition system**, where
   reachable-state `state ⊨ invariant` is a genuinely distinct check. For the static
   artifact-graph bulk it is overkill and reduces to Alloy/Cedar.

**The honest caveat (where I check my own over-crediting bias):** every one of these tools
models **selector + rule + gate**, but **none has a native slot for our "underlying
axiom" and "Validation mode" fields.** The axiom→rule **entailment** check (does the axiom
this rule cites actually entail the rule?) is the one cross-rule obligation in our shape
that the policy tools do *not* hand us for free — Cedar/Datalog check rule-vs-rule, not
axiom-vs-rule. That specific entailment is where E3's categorical/Lean register or a
TLAPS/Lean proof obligation may be the right home, and it is the seam where FOL and the
categorical path most plausibly **complement** rather than one subsuming the other. So my
field-positive verdict is bounded: the field decisively gives us cross-rule
**consistency/contradiction/equivalence + state⊨ruleset**; it does **not** hand us
**axiom⊨rule** on a plate.

**Buildable first step (my recommendation to the synthesizer):** encode ONE real cav2 rule
+ its sibling (the closure rule CAV2-D49 + an authority-kind rule that could shadow it) as
Cedar policies (or Datalog à la FORGE), and run the equivalence/permissiveness check to
see if it surfaces a contradiction the per-rule C-1..C-3 lints structurally cannot. That
is the witness G2/Gödel needs; my prediction is it WILL surface one, because the validator
has no cross-rule check-class at all.

### Sources
- Cedar Analysis (decided cross-policy equivalence/implication; verified-in-Lean compiler): https://aws.amazon.com/blogs/opensource/introducing-cedar-analysis-open-source-tools-for-verifying-authorization-policies/
- Cedar decidable SMT fragment (quantifier-free, ground, finite domains, sound+complete): https://arxiv.org/pdf/2403.04651 ; https://lean-lang.org/use-cases/cedar/ ; https://arxiv.org/pdf/2407.01688
- FORGE — Datalog/stratified-negation governance policy + cross-rule contradiction/redundancy/subsumption/reachability on a non-recursive decidable fragment: https://arxiv.org/html/2602.16708
- Datalog⁻ stratified negation, PTIME eval, undecidable consistency in general: https://arxiv.org/pdf/1804.09473
- Alloy/Kodkod bounded relational model-finding (counterexample-up-to-scope, not proof): https://en.wikipedia.org/wiki/Alloy_(specification_language) ; https://www.researchgate.net/publication/220852111_Kodkod_A_Relational_Model_Finder
- SMT/Z3 undecidable with quantifiers, instantiation not refutationally complete: https://en.wikipedia.org/wiki/Satisfiability_modulo_theories ; https://arxiv.org/pdf/2306.09436
- OWL/DL consistency + subsumption decidability (ALC EXPTIME-complete, EL PTIME, SROIQ): https://arxiv.org/html/2504.19023v1 ; https://www.researchgate.net/publication/221218516_HermiT_A_highly-efficient_OWL_reasoner
- TLA+/TLC model-checking state⊨invariant with counterexample traces: https://lamport.azurewebsites.net/pubs/yuanyu-model-checking.pdf ; https://arxiv.org/pdf/2211.07216
