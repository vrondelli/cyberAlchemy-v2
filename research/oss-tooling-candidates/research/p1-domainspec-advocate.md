# OSS Tooling Candidates for domainspec-v2 — Advocate Brief (P1)

**Role:** External-OSS advocate. Corpus = the open-source ecosystem, verified by web search (July 2026). I argue **for** adoption. Every claim below is "this mature, permissively-licensed project already solves a thing domainspec-v2 currently hand-rolls." The internal-codebase skeptic owns the "but does it fit our seams / is the integration cost worth it" rebuttal; I do not pre-concede those here, but I flag license traps and integration surface honestly where they exist.

**Reading key per candidate:** (1) name + one-line what · (2) license · (3) WHY it helps · (4) WHERE (which seam).

---

## Seam 1 — Formal-cell evaluator (hand-rolled AST + BigInt-rational; grammar gaps → `coverage_gap`)

The evaluator is a tiny arithmetic/relational decision procedure. The moment an obligation needs quantifiers, uninterpreted functions, non-linear arithmetic, or "is this range/count constraint even satisfiable," a bespoke evaluator becomes an unbounded maintenance liability. This is exactly the SMT wheelhouse.

### 1. Z3
- **What:** Microsoft Research SMT solver over linear/nonlinear integer & real arithmetic, bitvectors, arrays, quantifiers.
- **License:** MIT — maximally permissive, no copyleft, safe to embed in a private engine. ([repo](https://github.com/Z3Prover/z3), [LICENSE](https://github.com/Z3Prover/z3/blob/master/LICENSE.txt))
- **Why:** Every ternary/range/count/arithmetic obligation the formal-cell evaluator handles is a decidable fragment Z3 handles natively, *plus* the ones outside your grammar that currently emit `coverage_gap`. Z3 turns a `coverage_gap` into a real verdict (SAT/UNSAT/model). Rational arithmetic is first-class (Z3's `Real` sort is exact/BigInt-rational internally), so no precision regression versus your BigInt-rational core. Ships an official WASM build and a typed JS/TS binding (`z3-solver` on npm) — you can call it in-process from the TS engine without a subprocess. Also emits **models** (witnesses) and **unsat cores** (minimal failing sub-constraint) — the latter is a huge upgrade for explaining *why* an obligation failed instead of a boolean.
- **Where:** Formal-cell evaluator. Two adoption postures: (a) **oracle/differential** — keep the hand-rolled evaluator for the fast common path, cross-check against Z3 in CI to prove the hand-rolled path is sound and to auto-detect grammar drift; (b) **fallback** — route anything the grammar can't parse to Z3 instead of emitting `coverage_gap`. Posture (a) is the low-risk on-ramp.

### 2. cvc5
- **What:** Stanford/Iowa SMT solver; sibling to Z3 with strong support for strings, sequences, finite sets/relations, and syntax-guided synthesis (SyGuS).
- **License:** Modified (3-clause) BSD in the default build. ⚠️ *Trap to hand the skeptic:* it can be **configured** to link GPL libraries (e.g. via optional deps) — the default is BSD-clean, but the build flags matter for a private/closed distribution. ([about](https://cvc5.github.io/), [repo](https://github.com/cvc5/cvc5), [COPYING](https://github.com/cvc5/cvc5/blob/main/COPYING))
- **Why:** Two things Z3 is weaker at and that map to your roadmap: (1) **string/sequence theory** — if feature-pack obligations ever constrain identifiers/paths/regex-shaped fields, cvc5 reasons about them directly; (2) **SyGuS synthesis** — cvc5 can *synthesize* a function/predicate satisfying a spec, which is a latent capability for a "system that builds systems." Both solvers speak the **SMT-LIB 2** standard, so targeting SMT-LIB (not a vendor API) lets you run Z3 and cvc5 as independent oracles and cross-validate — a portfolio that catches solver bugs in either.
- **Where:** Formal-cell evaluator (as a second, independent SMT oracle) + a synthesis seam later.

**Strategic note for this seam:** the highest-leverage move is not "pick a solver" but **"emit SMT-LIB 2 as an intermediate target."** Once obligations lower to SMT-LIB, you get Z3, cvc5, and any future solver for free, and the hand-rolled evaluator becomes an optimization, not the ceiling.

---

## Seam 2 — Temporal modeling (TLA+ / tla2tools 1.7.4, SANY+TLC; the .tla example isn't checked yet)

### 3. Apalache
- **What:** Symbolic (SMT-backed, bounded) model checker for TLA+ — translates TLA+ to Z3 instead of TLC's explicit-state enumeration; also checks **inductive invariants**.
- **License:** Apache 2.0. ([repo](https://github.com/apalache-mc/apalache), [site](https://apalache.informal.systems/))
- **Why:** Directly targets your stated pain — *"freshness TLC struggles with."* TLC enumerates the reachable state space; for read-set-freshness / append-condition properties with large or unbounded-ish data domains, that blows up. Apalache reasons **symbolically** via Z3, so it handles large parameter domains that defeat TLC, and — critically — it can prove an **inductive invariant** holds for *all* reachable states (not just up to a bounded depth), which is the difference between "no counterexample found within scope" and an actual safety proof. It consumes standard TLA+ (with type annotations), so your existing `.tla` asset is reusable, not a rewrite.
- **Where:** Temporal modeling seam. Pairs with your DCB freshness invariants (Seam 5) — freshness/append-condition safety is exactly an inductive-invariant question. ⚠️ honest flag: Apalache needs **type annotations** on the spec and is currently maintainer-funded (no corporate backer) — sustainability is a real skeptic point.

### 4. Quint
- **What:** Executable specification language over the same temporal logic as TLA+ (TLA the logic, modern surface syntax), from the Apalache team; runs a random simulator, TLC, **and** Apalache from one CLI.
- **License:** Open source, `informalsystems/quint` (Apache-2.0). ([repo](https://github.com/informalsystems/quint), [site](https://quint.sh/))
- **Why:** The single biggest reason your one `.tla` example "isn't parsed/checked yet" is likely that raw TLA+ tooling (SANY/TLC config, ASCII math) has a steep authoring/ergonomics wall. Quint is TypeScript-native (installs via **npm**, same toolchain as domainspec-v2), has a real type system, a REPL, and an executable simulator you can run like a test — then escalate the *same* spec to Apalache/TLC for exhaustive checking. It closes the "specified but never actually run" gap with a gradient: run → simulate → bounded-check → prove. For a TS-centric deterministic engine this is a far lower-friction on-ramp than tla2tools.
- **Where:** Temporal modeling seam (authoring + CI-runnable checking front-end); feeds Apalache as the heavy checker.

---

## Seam 3 — Deeper proofs (μF/νF duality, catamorphism folds — currently Lean/Coq *cited*, not mechanized)

### 5. Lean 4 (+ Mathlib)
- **What:** Dependently-typed programming language and interactive theorem prover; Mathlib is its large community proof library.
- **License:** Apache 2.0 (Lean and Mathlib both). ([Lean repo](https://github.com/leanprover/lean4), [Mathlib](https://github.com/leanprover-community/mathlib4))
- **Why:** Your μF/νF (initial-algebra / final-coalgebra) duality and catamorphism-fold results are *small, stable* theorems — the ideal target for mechanization: prove once, and the proof is a permanent, machine-checked asset that never regresses. Mathlib already contains category theory, (co)algebras, and universal-property machinery, so you're assembling on existing foundations rather than axiomatizing from scratch. Apache-2.0 means the mechanized proofs can live in the private spine with no license friction. Lean's automation (`ring`, `linarith`, `omega`, `simp`) makes the routine algebra cheap.
- **Where:** The "deeper proofs" research seam. These proofs stay *offline artifacts* (a proof obligation is discharged in Lean, its statement referenced by the engine) — they don't need to run in the hot path.

### 6. Rocq (formerly Coq)
- **What:** Interactive proof assistant based on the Calculus of Inductive Constructions; catamorphisms/folds over inductive types are its native idiom.
- **License:** LGPL 2.1 (core). ([repo](https://github.com/rocq-prover/rocq))
- **Why:** Coauthor alongside or instead of Lean depending on which library ecosystem carries your duality lemmas most directly; Rocq's inductive/coinductive types are a textbook fit for μF/νF and catamorphism reasoning, and its **extraction** mechanism can emit verified code. ⚠️ flag for the skeptic: LGPL (weak copyleft) — fine for keeping proofs as separate artifacts, but note it if you ever *extract* code into the distributed engine.
- **Where:** Same seam as Lean; pick one to avoid split-brain. My recommendation: **Lean 4**, because it's TS-adjacent in community tooling momentum and Apache-licensed, unless a specific lemma is already formalized in Rocq.

---

## Seam 4 — Boundary/coverage emission & the νF drift/trend type (`Stream<CheckResult>`, specified but nonexistent)

### 7. fast-check
- **What:** Property-based testing framework for JS/TS (QuickCheck-style), with shrinking and model-based/stateful testing.
- **License:** MIT. ([repo](https://github.com/dubzzz/fast-check), [docs](https://fast-check.dev/))
- **Why:** Two direct fits. (a) **Boundary emission** — instead of hand-enumerating range/count edge cases, declare the obligation's domain as an *arbitrary* and let fast-check generate + **shrink** to the minimal failing input at each boundary; this is precisely the "does the evaluator emit the right verdict at the edges" question, automated. (b) **νF drift/trend** — fast-check's **model-based / stateful** runner drives a sequence of commands against a system and checks a model invariant across the run; a `Stream<CheckResult>` trend type is a fold over exactly such a sequence, so fast-check both *tests* the future νF type and gives you a reference semantics for what "a stream of checks trending" should mean. It's already the same TS toolchain, zero language boundary.
- **Where:** Boundary emission for the formal-cell evaluator; reference driver + test harness for the νF drift/trend type.

### 8. Hypothesis
- **What:** The property-based testing library for Python, with first-class **stateful** (rule-based state machine) testing.
- **License:** MPL 2.0 (file-level weak copyleft — using it as a test dependency imposes nothing on your engine). ([repo](https://github.com/HypothesisWorks/hypothesis), [docs](https://hypothesis.readthedocs.io/))
- **Why:** Only relevant if any part of the pipeline (or a cross-checking oracle) is Python. Its `RuleBasedStateMachine` is the gold-standard model for expressing "sequence of appends → invariant holds," which maps onto DCB freshness *and* the νF stream. Even if the engine stays pure-TS, Hypothesis's stateful design is the best available *blueprint* for the νF trend semantics. Listed for completeness / cross-language oracle; **fast-check is the primary** given the TS codebase.
- **Where:** νF drift/trend design reference; optional Python-side oracle.

---

## Seam 5 — DCB freshness ledger (bespoke JSONL append-log simulating read-set freshness / append-conditions)

You independently re-derived a pattern the event-sourcing community has now **named and specified**. That's strong validation — and it means there's a spec + reference implementations to conform to instead of a private JSONL format.

### 9. The DCB specification + `dcb-eventstore`
- **What:** Dynamic Consistency Boundary is a formalized pattern (Sara Pellegrini, "Killing the Aggregate"): tag-based consistency across multiple event streams enforced via append-conditions against a queried read-set. `dcb-eventstore` provides interfaces/types per the spec, with adapters (relational, EventSourcingDB, UmaDB).
- **License:** open source (see repo). ([spec/hub](https://dcb.events/), [reference impl](https://github.com/bwaidelich/dcb-eventstore))
- **Why:** Your JSONL log "simulating read-set freshness / append-conditions" *is* DCB. Conforming to the published DCB append-condition semantics gives you: a **standard vocabulary** (tags, read-set, append-condition, consistency boundary) that maps cleanly onto the ontology, a **spec to check your implementation against**, and a **conformance target** — you can validate your bespoke ledger against the reference behavior rather than trusting a private invariant. Even if you keep JSONL as storage, adopting the *semantics* de-risks correctness.
- **Where:** DCB freshness ledger — as the conformance spec your bespoke log implements.

### 10. EventSourcingDB / Marten (DCB-native stores)
- **What:** Purpose-built event stores that implement DCB natively — **EventSourcingDB** documents DCB as a best-practice primitive; **Marten** (PostgreSQL-backed .NET event store) ships first-class DCB support.
- **License:** Marten is MIT (PostgreSQL-backed, OSS); EventSourcingDB per its own terms. ([Marten DCB](https://martendb.io/events/dcb.html), [EventSourcingDB DCB](https://docs.eventsourcingdb.io/best-practices/dynamic-consistency-boundaries/))
- **Why:** If the freshness ledger ever needs to be *durable, queryable, and concurrent* rather than a simulation, these give you battle-tested append-condition enforcement (optimistic concurrency on the read-set) so you don't re-implement conflict detection. Marten-on-Postgres is the pragmatic "graduate the JSONL to a real store" path with an MIT license.
- **Where:** DCB freshness ledger — the production-grade backing store option.

---

## Seam 6 — Bespoke TS regex validators parsing Markdown feature packs

Regex parsing of a structured document is the classic "works until the grammar grows a corner case" trap. Every candidate here replaces regex with a real grammar + typed AST + editor tooling.

### 11. Langium
- **What:** TypeScript-native language-engineering / DSL framework (successor-in-spirit to Xtext), grammar → typed AST + parser + Language Server Protocol, powered by Chevrotain.
- **License:** MIT. ([repo](https://github.com/eclipse-langium/langium), [site](https://langium.org/))
- **Why:** The single best fit for this seam. Your feature packs are a DSL currently parsed by regex; Langium lets you declare that DSL's grammar once and get a **typed AST**, validation hooks, and — for free — **LSP** (autocomplete, go-to-def, live error squiggles in VS Code) for feature-pack authors. It's pure TypeScript/Node, so it drops into the existing toolchain with no language boundary, and the generated AST is exactly the typed structure the engine wants instead of regex match groups. Validation becomes declarative and *composable* with the ontology.
- **Where:** Feature-pack parser/validator — direct replacement for the regex validators.

### 12. Tree-sitter
- **What:** Incremental parsing library + grammar generator producing concrete syntax trees, with an S-expression query language.
- **License:** MIT (core). ([repo](https://github.com/tree-sitter/tree-sitter))
- **Why:** If you want *robust, incremental, error-tolerant* parsing (parses partial/invalid docs and keeps going — great for editor feedback and for extracting structure from imperfect Markdown), Tree-sitter is the standard. Its query system lets you *pattern-match over the syntax tree* declaratively — a clean way to extract obligations from feature packs without procedural regex. Has WASM + Node bindings.
- **Where:** Feature-pack parsing (alternative to Langium when error-tolerance/incrementality matters more than a full DSL toolchain). *Langium vs Tree-sitter:* Langium if feature packs are a first-class DSL you own end-to-end; Tree-sitter if you're extracting structure from looser, human-Markdown-ish input.

### 13. JSON Schema (+ Ajv)
- **What:** Declarative schema/validation standard for JSON; Ajv is the fast TS/JS validator.
- **License:** Ajv is MIT.
- **Why:** The lowest-effort win. If feature packs have (or could have) a structured frontmatter/embedded-JSON representation, JSON Schema replaces regex validators with a declarative, versionable, tool-agnostic contract that also generates TypeScript types (`json-schema-to-typescript`) — keeping the parsed shape and the engine's types in sync automatically. Not a full DSL, but the fastest regex-elimination for the structured slices.
- **Where:** Feature-pack field/shape validation (the structured subset).

### 14. Xtext (mention, for completeness)
- **What:** The mature JVM/Eclipse DSL framework Langium descends from.
- **License:** EPL. **Why not:** JVM-based — a heavier, off-toolchain dependency than Langium for a TS engine. Listed only so the skeptic can confirm Langium is the right TS-native choice over its ancestor.
- **Where:** N/A — Langium supersedes it here.

---

## Extra candidate I was not asked for (strong fit): the spec↔code↔ontology typed graph

You want *"spec↔code↔ontology mapping as one typed graph."* Don't build a bespoke graph model — there's a W3C-standardized typed-graph + **validation** stack.

### 15. RDF + SHACL
- **What:** RDF models the typed graph (nodes = spec/code/ontology entities, typed edges = relations); **SHACL** (W3C Shapes Constraint Language) declaratively validates the graph's shape — cardinality, value types, required properties, path constraints.
- **License:** open W3C standards; multiple OSS engines (Apache Jena — Apache-2.0; pySHACL — Apache-2.0; rdf-ext for JS). ([SHACL overview](https://www.oxfordsemantic.tech/faqs/what-is-shacl))
- **Why:** This is the *exact* problem SHACL was standardized for — a typed graph plus machine-checkable constraints over it ("every spec node must map to ≥1 code node," "every ontology term must own exactly one canonical home"). Those are precisely the invariants the cyberAlchemy-v2 spine already enforces prose-side (single-owner, drift checks); SHACL makes them executable over one graph. It also unifies with Seam 1 conceptually: SHACL constraints are decidable and there's active research reducing SHACL to FOL/SMT, so your solver investment compounds. Adopting RDF/SHACL means the spec↔code↔ontology graph is queryable (SPARQL) and validatable with off-the-shelf engines instead of a bespoke typed-graph library.
- **Where:** The "one typed graph" mapping seam; also the executable substrate for ontology single-owner/drift invariants.

---

## One-screen recommendation (advocate's ranked bets)

| Bet | Tool | Seam | License | Confidence |
|-----|------|------|---------|-----------|
| **Highest leverage** | **Z3** (via SMT-LIB target) | formal-cell evaluator | MIT | very high |
| Temporal, actually run it | **Quint → Apalache** | temporal / freshness | Apache-2.0 | high |
| Regex → real grammar | **Langium** | feature-pack validators | MIT | high |
| Boundary + νF stream | **fast-check** | boundary emission / drift type | MIT | high |
| Conform, don't invent | **DCB spec + dcb-eventstore** | freshness ledger | OSS | high |
| Mechanize the small theorems | **Lean 4 + Mathlib** | μF/νF duality proofs | Apache-2.0 | medium-high |
| One typed graph, validated | **RDF + SHACL** | spec↔code↔ontology map | W3C/Apache | medium |
| Second SMT oracle | **cvc5** | formal-cell evaluator | BSD (⚠️ GPL-link opt) | medium |

**The through-line:** almost every "bespoke" seam in domainspec-v2 corresponds to a *named, specified, permissively-licensed* OSS artifact. The two structural wins that make the rest cheap: **(a) lower obligations to SMT-LIB 2** (unlocks Z3 + cvc5 + future solvers, turns `coverage_gap` into verdicts); **(b) stay on the TS toolchain where possible** (Z3-WASM, Quint, Langium, fast-check all install via npm — no language boundary). Licenses are overwhelmingly MIT/BSD/Apache — clean for a private engine — with only cvc5's optional GPL-link and Rocq/Coq's LGPL-on-extraction as flags to hand the skeptic.

---

### Sources
- Z3 — https://github.com/Z3Prover/z3 · https://github.com/Z3Prover/z3/blob/master/LICENSE.txt
- cvc5 — https://cvc5.github.io/ · https://github.com/cvc5/cvc5 · https://github.com/cvc5/cvc5/blob/main/COPYING
- Apalache — https://github.com/apalache-mc/apalache · https://apalache.informal.systems/
- Quint — https://github.com/informalsystems/quint · https://quint.sh/
- Lean 4 — https://github.com/leanprover/lean4 · Mathlib https://github.com/leanprover-community/mathlib4
- Rocq/Coq — https://github.com/rocq-prover/rocq
- fast-check — https://github.com/dubzzz/fast-check · https://fast-check.dev/
- Hypothesis — https://github.com/HypothesisWorks/hypothesis · https://hypothesis.readthedocs.io/
- DCB — https://dcb.events/ · https://github.com/bwaidelich/dcb-eventstore · https://martendb.io/events/dcb.html · https://docs.eventsourcingdb.io/best-practices/dynamic-consistency-boundaries/
- Langium — https://github.com/eclipse-langium/langium · https://langium.org/
- Tree-sitter — https://github.com/tree-sitter/tree-sitter
- SHACL — https://www.oxfordsemantic.tech/faqs/what-is-shacl
