# Source Inventory — SMT/FOL for Deterministic Test Derivation

Evidence labels: **source-stated** (the source asserts it) · **local-precedent** (already in this repo) · **inferred** (synthesis).

## Local-precedent (primary; harvested 2026-06-21)

| Source | What it establishes | Label |
| --- | --- | --- |
| `domainspec-formalization/docs/domainspec-paper.md` §9.1, §9.3 | THE local SMT/FOL ambition: meta-types → denotational objects (Entity→LTS, **Rule→predicate**, Calculation→pure function); closed taxonomy → Model Checking; translate Γ (axioms) + 𝓜 (taxonomy) into FOL; use SMT to search "failure states"; Model-Theory soundness/completeness `Γ⊢φ ⇒ 𝓜⊨φ`. **Future-work prose, not built.** | source-stated |
| `implementation/domainspec/docs/features/test-derivation-engine/operations.md` (Derive R1–R5) | The actual Formal-cell classifier: `card(invariant) ∈ {EXISTENCE:2, PRESENCE:conjuncts, RANGE:4, COUNT_CAP:2}`; δ pure/total/deterministic; invalid-transition = exact Cartesian remainder. | local-precedent |
| `domainspec-formalization/GLOSSARY.md` | `EdgeLaw 𝓔` = "a **decidable** relation on meta-types" (decidability asserted); Skolem null ↔ Skolemization (∃-elimination). | source-stated |
| `domainspec-formalization/lean-formalization/DomainSpec.lean` | `axiom EdgeLaw : MetaType → MetaType → Prop`; a `DecidableRel EdgeLaw` instance was **deliberately removed as circular** — decision-procedure status named-but-unbuilt. | local-precedent |
| `…/lean-formalization/SchemaTaxonomy.lean` | `Predicate`/`PredicateCat` abbrevs; `Predicate_eq_field` (predicates ARE schema fields) — closest local "predicate" formal object. | local-precedent |

**Local takeaway:** the FOL/SMT thread is a *stated ambition* (paper §9.3) sitting on top of an already-deterministic finite δ. The Lean formalization is category-theoretic / thermodynamic (residue, loss, Spivak Σ⊣Δ*⊣Π), **not** logic-solver work. No SMT-LIB theory chosen, no decidability analysis, no encoding pattern, no solver precedent locally.

## External — solver / tooling (bounded web pass)

| Source | URL | Claim |
| --- | --- | --- |
| SMT-LIB Standard v2.7 | https://smt-lib.org/ | Canonical input language + background theories (EUF, Ints/LIA, Reals/LRA, Arrays, BitVectors, Datatypes) and named logics (QF_UF, QF_LIA, …). |
| Z3 (de Moura & Bjørner, TACAS 2008) | https://link.springer.com/chapter/10.1007/978-3-540-78800-3_24 | Production SMT solver; arithmetic, arrays, datatypes, UF, quantifiers. |
| cvc5 (TACAS 2022) | https://www-cs.stanford.edu/~preiner/publications/2022/BarbosaBBKLMMMN-TACAS22.pdf | Industrial open solver; strings, sets, finite-field, sygus synthesis. |
| KLEE (OSDI 2008) | https://www.usenix.org/legacyurl/klee-unassisted-and-automatic-generation-high-coverage-tests-complex-systems-programs-0 | Symbolic execution: tests are SAT models of a path condition. |
| Dafny→Boogie→Z3 | https://arxiv.org/pdf/1701.04481 | Pre/post/invariants → weakest-precondition VCs discharged by Z3 (contract-checking archetype). |
| Constraint Solving for System Test Data (TOSEM 2020) | https://arxiv.org/pdf/1902.00397 | Metaheuristics + SMT to generate feasible test data from constraints (spec→SMT→test input). |
| Hypothesis / PBT | https://hypothesis.works/articles/what-is-property-based-testing/ | Generator+property+shrinker; random, not solver-backed — the contrast case. |

## External — theory / decidability limits (bounded web pass)

| Source | URL | Claim |
| --- | --- | --- |
| First-order logic (Wikipedia) | https://en.wikipedia.org/wiki/First-order_logic | FOL validity undecidable, semi-decidable once a predicate of arity ≥2 exists. |
| Church's theorem (Routledge) | https://www.rep.routledge.com/articles/thematic/churchs-theorem-and-the-decision-problem/v-1 | Entscheidungsproblem unsolvable (Church 1936, Turing 1937). |
| SMT (Wikipedia) | https://en.wikipedia.org/wiki/Satisfiability_modulo_theories | Presburger (LIA), LRA, EUF, arrays, bitvectors, datatypes decidable (QF); nonlinear integer arithmetic undecidable; SAT is NP-complete. |
| SMT book chapter (Barrett/Seshia) | https://people.eecs.berkeley.edu/~sseshia/pubdir/SMT-BookChapter.pdf | Per-theory decision procedures + DPLL(T); Presburger decidable but 2-exp. |
| Presburger + 1 unary predicate undecidable (arXiv 1703.01212) | https://arxiv.org/pdf/1703.01212 | Decidable arithmetic + a single uninterpreted unary predicate → undecidable. The boundary is razor-thin. |
| Z3 Quantifiers guide | https://microsoft.github.io/z3guide/docs/logic/Quantifiers/ | Quantifier reasoning (E-matching/MBQI) is incomplete; returns `unknown`. |
