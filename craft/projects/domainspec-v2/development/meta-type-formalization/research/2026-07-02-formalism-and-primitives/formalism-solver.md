---
node_type: research
is_session: false
status: candidate
created: 2026-07-02
authored_by: research subagent (explorer, angle: SOLVER-FIT / decidability at spec-time)
agent: "Tarski, Alfred"
target_artifact: meta-type formalization + content validator (../../)
corpus: FOL / SMT / Datalog / Cedar + owned Cedar (AgentPermissionKernel), owned Z3-governance thesis
boundary: PUBLIC validation criteria only; engine src/rules δ-rules NEVER encoded/leaked. The validator is the public contract.
claim_discipline: claim ≤ proof — every reuse cites a path; "solver-decidable" is asserted only where a decision procedure demonstrably terminates on the schema-level input.
---

# Formalism & Primitives — the SOLVER-FIT angle

**Question.** Can the meta-type criteria AND the six primitives (identity, field-existence,
typedness, boolean-predicate, purity, edge-signature-admissibility) be expressed as **decidable
auto-checks a solver runs at spec-time**, over the `.schema.yml`-loading validator the package
already committed to (DESIGN §4, DEF-D1 RESOLVED → `meta-types/<category>/<type>.schema.yml`,
"The validator LOADS the `.schema.yml` files")?

**Headline verdict (honest, up front).** For **five of the six primitives** and **two of the three
worked criteria**, the check reduces to a *finite quantifier-free question over the parsed structure
of the aspect file* — decidable, and cheaper than any solver: a **deterministic table walk**
(exactly what the owned `validate-relationships.ts` already is — a pure markdown-table parser +
set-membership test, `projects/domainspec-v2/impl/tools/validate-relationships.ts:141-157` parses
canonical edges, `:72,:98` does `canonicalEdges.has(value)`). A solver (FOL/SMT/Datalog/Cedar) is
**not required** for these; it is over-engineering. The **one genuinely solver-shaped primitive is
`boolean-predicate` (the Rule criterion)** — "does this Formal cell *parse to* and *type-check as* a
BOOLEAN?" — and even there the decidable part is **parse + type-inference**, not satisfiability. The
**one place a solver earns its keep** is a *cross-cutting* check the per-type validator structurally
cannot do — global edge-graph / cross-rule admissibility — which is exactly the owned "FOL/Cedar
constitution-validation Row-2 complement" (MEMORY: `fol-constitution-validation-complement`).

So: lean solver-decidable-is-the-sweet-spot **is right for the cross-cutting layer, wrong for the
per-concept layer**, where a decidable table walk already dominates. I say so plainly rather than
inflate a solver requirement the criteria don't sustain.

---

## 1. Owned FOL/Cedar sweep (do this before proposing net-new — MEMORY: precedent-sweep-owned-in-repo)

Three owned bodies of work bear directly:

1. **Owned Cedar authorizer (Lean, sorry-free).**
   `domainspec-lean-formalization/lean-engineer/AgentPermissionKernel.lean` — a `decide`-based
   **decidable** reference monitor. Key shapes reusable here:
   - `structure Rule (Req) where effect : Effect; applies : Req → Bool` (`:77-80`) — a rule is a
     **decidable Boolean matcher** on a request. This is *exactly* the shape of an
     edge-signature-admissibility check: `admits : (srcType, tgtType) → Bool`.
   - `deny_precedence` / `decidePolicy` (header `:14-18`, `:36-39`) — deny-overrides combining, all
     **executable by construction (no classical oracle)** (`:77-78` comment). The header states the
     surface is "authorization soundness / **decidability** — Cedar (arXiv:2403.04651), which already
     ships a *Lean* formalization of a single-policy-set authorizer."
   - Cross-layer composition: `AgentPermissionKernelComposition.lean`,
     `research-security/cross-layer-policy-composition/research/findings.md` — `decidePolicy (P++Q) r`
     is a **∀-across-layers conjunction**; `layered_not_flattenable` is the certificate that layered
     admissibility is NOT a single flattened rule-set. This is the shape of **multi-constraint edge
     admissibility** (endpoint-type ∧ cardinality ∧ direction all independently granting).

2. **Owned Cedar/Datalog precedent map.**
   `research-security/permguard-product-feature-map/research/findings.md` — "Cedar permit/forbid +
   deny-precedence" is **COMMODITY / owned**; "typed actions" (`ToolName` enum matcher) is Cedar's
   typed-action matching = the direct analogue of `source.type = Rule ∧ target.type = Operation`.
   Verdict there: verified per-request authz is commodity — reuse it, don't reinvent.

3. **Owned determinism-at-spec-time thesis.**
   `development/deterministic-retrieval-thesis/Z3-governance-needs-determinism.md` §1 — the load-bearing
   formal result for us: **"default-deny requires a *decidable membership test*… Membership in a finite
   typed enumeration is decidable"** (`:21`). And: a gate verdict is a gate **only if reproducible**
   (`:11`). This is the governing principle for every primitive below: the check must be a decidable
   membership/predicate over a **finite, enumerable** referent (the parsed schema), not over an
   open/continuous space.

**Owned-to-build-from, one line:** the *Cedar matcher pattern* (`applies : X → Bool`, deny-precedence,
typed-action endpoint matching) is the owned reuse for **edge-signature-admissibility**; the *Z3
determinism thesis* is the owned justification for **why finite-enumeration membership is the right
decidable shape** for identity/field/typedness/edge. There is no owned SMT/Datalog *engine* wired into
domainspec-v2 — the reuse is the **pattern and the decidability argument**, not a running solver.

---

## 2. Per-primitive verdict

Notation: "spec-time input" = the parsed `.schema.yml` criterion + the parsed aspect-file structure
(field tables, Formal cells, declared types, edge rows). "QF" = quantifier-free.

| # | Primitive | Expressible in FOL/SMT? | Decidable at spec-time? | Which tool (right-sized) | Owned reuse |
|---|-----------|------------------------|-------------------------|--------------------------|-------------|
| P1 | **identity** ("has ≥1 identity field") | Yes — trivially: `∃f ∈ fields. f.role = identity`, a bounded ∃ over a finite parsed list | **YES** — decidable; bounded existential over a finite table | **Table walk** (no solver); FOL/Datalog *can* but is overkill | Z3-thesis `:21` (finite-enum membership decidable) |
| P2 | **field-existence** ("a field table exists / has ≥1 row") | Yes — `∃f. f ∈ fields` / `|fields| ≥ 1`, EUF/linear-arith on cardinality | **YES** — decidable (parse presence + count) | **Table walk** | same |
| P3 | **typedness** ("every field has a type drawn from the type alphabet") | Yes — `∀f. f.type ∈ TypeAlphabet`, a bounded ∀ over finite fields × finite alphabet = **decidable membership** | **YES** — decidable; the ∀ is bounded, alphabet finite | **Table walk** + set-membership (mirror of `canonicalEdges.has`, `validate-relationships.ts:98`) | Z3-thesis `:21`; validate-relationships pattern |
| P4 | **boolean-predicate** ("Formal cell parses to a BOOLEAN predicate") | **Partially.** Two sub-questions. (a) *Well-typed-as-Bool*: yes — expression type-inference, decidable. (b) *Is-actually-a-predicate-not-a-strategy* (Rule≠Policy): decidable as **return-sort = Bool** via typing; NOT as "is a total/consistent predicate" (that is validity → undecidable in full FOL, needs a decidable fragment) | **YES for the intended check** (return-sort inference). **NO** if reframed as predicate *validity/satisfiability* (that is SMT territory and unnecessary — see §3) | **Parser + type-inference** for the sort check (the sweet spot); an **SMT solver (Z3/cvc5) ONLY if** a future criterion needs "is this predicate satisfiable / non-vacuous", which the current criterion does **not** demand | Cedar `applies : Req → Bool` (`AgentPermissionKernel.lean:77`) — the Bool-return shape |
| P5 | **purity** ("no state mutation" — Rule/Calculation) | **Weakly.** Expressible as a *syntactic* predicate: `∀ node ∈ AST. node.kind ∉ MutatingForms` (bounded ∀ over parsed AST, decidable). NOT expressible as *semantic* purity (referential transparency = undecidable in general) | **YES for the syntactic proxy** (no assignment/IO/mutating-call tokens in the Formal cell). **NO for semantic purity** | **AST/token scan** (decidable syntactic check). A solver adds nothing — purity is a *syntactic-shape* obligation, not a satisfiability one. **Honest flag:** the check is a sound-but-not-complete syntactic proxy | none owned; syntactic-proxy is the honest ceiling (see §4 honesty) |
| P6 | **edge-signature-admissibility** (`admits(srcType, tgtType, verb)`) | **Yes — cleanly.** Ground FOL / Datalog / Cedar: `admits(v,s,t) :- signature(v,s,t)` — a finite relation lookup; or Cedar `permit(action=v) when src.type=s && tgt.type=t`. Bounded ∀ over declared edges × finite signature table | **YES** — decidable; ground relation membership, no recursion needed for per-edge check | **Table walk / set-membership** for per-edge (owned `validate-relationships.ts` already does the *label* half; add the *endpoint-type* half). **Datalog/Cedar** becomes right-sized when checks go **cross-edge/global** (§3) | **Cedar typed-action matcher** (`permguard findings`, `ToolName` enum) + `decidePolicy` deny-precedence; `validate-relationships.ts:141-157,:98` |

**Reading the table.** P1–P3, P6-per-edge: pure decidable table walks — a solver is *expressible-but-
unnecessary*. P4: the decidable core is type-inference (parse), not SMT. P5: only a syntactic proxy is
decidable; semantic purity is not — name it. The **only** genuine solver opportunity is P6 lifted to
**global/cross-cutting** (§3).

---

## 3. The three worked criteria (decidable constraint/query form + does a solver decide it at spec-time?)

### (i) Entity-identity — "has ≥1 identity field AND fields are typed" (DESIGN §3, TAXONOMY:11,50)

- **Decidable form (QF over parsed field table):**
  `wellFormedEntity(C) := (∃ f ∈ C.fields. f.role = "identity") ∧ (∀ f ∈ C.fields. f.type ∈ TypeAlphabet)`
- Both quantifiers are **bounded** (finite parsed table; finite alphabet). This is a **decidable
  Boolean over a finite structure** — solver-free.
- **Does a solver decide it at spec-time?** Yes, trivially (any FOL/Datalog engine), but **you don't
  need one** — it is a `.find(role==identity)` + `.every(type ∈ alphabet)` table walk, the MT0 minimal
  validator (WORK-PACK MT0). The **negative fixture** (VO-shape: no identity + equality clause) is
  rejected by the *same* decidable predicate returning false on the `∃-identity` conjunct. Discriminating
  and reproducible → satisfies the Z3-thesis gate criterion (`:11` reproducible ⇒ gateable).

### (ii) Rule-boolean — "a Formal cell that parses to a BOOLEAN predicate, no mutation" (DESIGN §3)

- **Decidable form (two decidable stages, one honest boundary):**
  1. **Parse** the Formal cell → AST. *Decidable* (context-free parse terminates).
  2. **Sort-infer** the AST's return type; require `= Bool`. *Decidable* (Hindley-Milner-style / simple
     typed-expression inference over a fixed operator signature is decidable). This is the
     **Rule≠Policy discriminator**: Policy's Formal returns a *strategy/branch value*, sort ≠ Bool
     (DESIGN §3, WORK-PACK MT2 "boolean-return vs strategy-select").
  3. **Purity proxy** (P5): syntactic scan for mutating forms — decidable, sound-not-complete.
- **Does a solver decide it at spec-time?** The **intended criterion (return-sort = Bool)** is decided
  by the **type-inference pass, not a solver** — this is the sweet spot and I flag over-reach if anyone
  specs "prove the Rule's predicate is satisfiable/total": that flips to **validity checking**, which
  in full FOL is **undecidable**, and even in a decidable SMT fragment (QF-LIA/QF-BV/EUF via Z3/cvc5)
  is (a) unnecessary for the stated criterion and (b) at risk of *encoding δ-semantics* → moat concern.
  **Recommendation: stop at sort-inference; do NOT invoke an SMT solver for the base Rule criterion.**
  Owned shape: Cedar's `applies : Req → Bool` (`AgentPermissionKernel.lean:77`) is the "Bool-returning
  matcher" precedent — reuse the *shape*, not a satisfiability oracle.

### (iii) Edge `enforces` — `source.type = Rule ∧ target.type = Operation` (DESIGN §3, DS-D2/DS-D8)

- **Decidable form (ground relation membership):**
  `admissible(e) := signature(e.verb, type(e.src), type(e.tgt))` where `signature` is the finite
  29-row table (WORK-PACK MT3). For `enforces`: `signature(enforces, Rule, Operation) = true`, all
  else false. Per-edge check = **bounded ∀ over declared edges, each a finite lookup** → decidable.
- **Does a solver decide it at spec-time?** Per-edge: yes and **a table walk suffices** (extend
  `validate-relationships.ts`, which already checks the *verb label* is canonical `:98`, with the
  *endpoint-type* conjunct). Negative fixture (`enforces` with a Calculation source) → `signature`
  lookup false → rejected. **Where a solver (Datalog/Cedar) genuinely earns its place:** when the
  question becomes **global/relational** — e.g. "no cycle of `enforces`/`applies` edges", "every
  Operation reachable-via-enforces has a governing Rule", "the edge set is closed under DS-D3
  admissibility across ALL rules simultaneously." Those are **recursive / cross-rule** queries the
  per-edge table walk structurally cannot express — and they are **exactly** the owned
  **"FOL/Cedar constitution-validation Row-2 complement"** (MEMORY): the per-rule validator can't
  catch cross-rule violations; Datalog's recursive closure or Cedar's policy-set evaluation can.
  This is the one place to build from owned Cedar (`decidePolicy` composition,
  `cross-layer-policy-composition/findings.md`).

---

## 4. Expressiveness honesty (where a solver / logic CANNOT capture the property)

- **"has an identity field" (P1):** fully FOL-expressible and decidable — **no gap**. The only subtlety
  is *what counts as* an identity field, which is a **schema-authoring decision** (a `role: identity`
  marker in the `.schema.yml`), not a logic-expressiveness limit. Push the semantics into the schema
  data, keep the check a membership test.
- **"Formal parses to boolean" (P4):** *return-sort* is decidable; **"is a genuine, non-vacuous,
  total predicate" is NOT** captured by parse/type-inference and would require validity/satisfiability
  reasoning (undecidable in full FOL; only semi-decidable / fragment-decidable in SMT). The current
  criterion (DESIGN §3) asks only for *parses-to-boolean* — so we are safely inside the decidable
  zone. Flag: do not let the criterion drift into "prove the rule is consistent."
- **"pure" (P5):** the honest ceiling. Semantic purity (referential transparency, no observable
  effect) is **undecidable** in general (reduces to halting-flavoured reasoning about arbitrary
  expression semantics). What is decidable — and what the validator should claim — is a **syntactic
  no-mutation proxy**: the Formal cell's AST contains no assignment / IO / mutating-call forms. This is
  **sound-for-rejection-of-obvious-impurity, not complete**. Claim ≤ proof: the schema criterion must
  say "syntactically pure (no mutating forms)", never "pure function", to avoid overclaiming a property
  no spec-time check can decide.
- **The δ-rule / moat boundary (governs all of the above).** An SMT/validity check that reasons about
  *what a Rule's predicate actually computes* starts to reconstruct engine derivation semantics — a
  **moat-leak risk**. The public validator's job is **shape and typing** (decidable, table-walk +
  parse + sort), NOT **derivation** (the private δ-rules). Every primitive above stays on the public
  side precisely because it is a *structural* decidable check. This is consistent with DEFINE's
  FALSIFIED condition: "if well-formedness cannot be checked without running the implementation → moat
  boundary flag" — the solver-fit analysis *confirms* that line: the moment you need
  satisfiability/derivation, you have left the decidable public contract.

---

## 5. Fit to a `.schema.yml`-loading validator

- The committed architecture (DEF-D1: validator LOADS `.schema.yml`) is a **perfect fit for the
  table-walk model**: each `.schema.yml` declares its criterion as **structured, finite predicates**
  over field-tables / Formal-cells / edge-rows. The validator interprets them as bounded ∀/∃ over
  parsed structure — decidable by construction, reproducible (Z3-thesis gate requirement `:11`).
- **Owned precedent it extends:** `validate-relationships.ts` is *already* this shape (deterministic
  parse + finite set-membership, no solver). The per-type content validator (DESIGN §4
  `validate-content`) is the **same engine with a richer per-type predicate table** — a natural,
  proven extension, not a new solver dependency.
- **When to reach for a real solver:** only for §3(iii)'s **global/recursive** edge-graph checks. There,
  a **Datalog** engine (Soufflé, or a small embedded Datalog) or **Cedar** policy-set evaluation is
  right-sized and *owned-adjacent* (Cedar `decidePolicy` / composition). Keep it a **separate,
  cross-cutting validator layer** (the Row-2 complement), never folded into the per-concept check.

---

## 6. Recommendation (recorded, claim ≤ proof)

1. **Per-concept + per-edge criteria (P1–P6, criteria i/ii/iii single-edge): NO solver.** Implement as
   the decidable **table-walk / parse / sort-infer** validator that loads `.schema.yml` — the proven
   `validate-relationships.ts` pattern, extended. Decidable, reproducible, cheapest, moat-safe.
2. **Rule-boolean (ii): parser + type-inference for return-sort = Bool.** Stop there. **Do not** invoke
   SMT for the base criterion (unnecessary + moat-risk). Reuse the Cedar `applies : Req → Bool` shape.
3. **Purity (P5): syntactic no-mutation proxy**, labelled sound-not-complete. Never claim semantic purity.
4. **ONE solver opportunity, cross-cutting only:** a **Datalog/Cedar-shaped global edge-graph validator**
   (cycles, reachability, cross-rule DS-D3 admissibility) — build from owned Cedar
   (`AgentPermissionKernel` `decidePolicy`/composition; `cross-layer-policy-composition/findings.md`)
   and the owned **FOL/Cedar Row-2 complement**. This is the honest home for "lean solver-decidable."
5. **Owned to build from:** the Cedar decidable-matcher pattern (endpoint-type admissibility ≈ typed
   actions + deny-precedence) and the Z3-governance decidability thesis (finite-enumeration membership).
   No owned running solver exists in domainspec-v2 — reuse the *pattern + decidability argument*, and
   wire an actual Datalog/Cedar engine ONLY for the cross-cutting layer, as a separate validator.

**Recommended solver:** for the per-concept layer — **none** (decidable table walk dominates). For the
cross-cutting edge-graph layer — **Datalog (recursive closure) or Cedar policy-set evaluation**,
built from the owned Lean Cedar kernel; **SMT (Z3/cvc5) is NOT recommended** for any current criterion
(unnecessary for the stated checks, and its natural use — predicate satisfiability — approaches the
δ-rule moat).

---

## Citations

- Meta-type package: `../../DEFINE.md`, `../../DESIGN.md` (§3 worked criteria, §4 validator, DES-D1/D2/D3),
  `../../WORK-PACK.md` (SWU MT0–MT4), `../../implementation-layering.md`.
- Owned Cedar kernel: `domainspec-lean-formalization/lean-engineer/AgentPermissionKernel.lean:14-18,36-39,77-80`;
  `AgentPermissionKernelComposition.lean`.
- Owned Cedar/Datalog precedent: `domainspec-lean-formalization/research-security/permguard-product-feature-map/research/findings.md`;
  `.../cross-layer-policy-composition/research/findings.md`.
- Owned determinism thesis: `development/deterministic-retrieval-thesis/Z3-governance-needs-determinism.md:11,21`.
- Owned validator precedent: `projects/domainspec-v2/impl/tools/validate-relationships.ts:98,141-157`.
- TAXONOMY structure: `projects/domainspec-v2/impl/spec/TAXONOMY.md:11,50,168,180` (Rule = "pure predicate function (boolean)", `:620`).
- MEMORY: `fol-constitution-validation-complement`, `precedent-sweep-owned-in-repo`, `engine-algorithm-proprietary`, `lean-kernel-location-and-status`.
