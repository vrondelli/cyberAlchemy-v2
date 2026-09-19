---
node_type: research
angle: sufficiency / minimal (lightest sufficient tool per primitive; first break to logic/proof)
agent: Simon, Herbert (explorer)
is_session: false
status: candidate
created: 2026-07-02
target_artifact: meta-type-formalization package (DEFINE/DESIGN/WORK-PACK/REFRESH/layering)
corpus:
  - projects/domainspec-v2/development/meta-type-formalization/{DEFINE,DESIGN,WORK-PACK,REFRESH-2026-07-02,implementation-layering}.md
  - projects/domainspec-v2/impl/spec/TAXONOMY.md         # the 25 meta-types (descriptive criteria source)
  - projects/domainspec-v2/impl/spec/RELATIONSHIPS.md    # the 29 typed edges + registry Concept Graph format
  - projects/domainspec-v2/impl/tools/validate-relationships.ts  # the EXISTING structural validator idiom
  - arcanum/framework/SCHEMA-CONSTITUTION.md             # .schema.yml format the criterion is authored in
boundary: PUBLIC validation criteria only; engine src/rules δ-rules NEVER imported or encoded (moat).
---

# Formalism & Primitives — the LIGHTEST sufficient tool per primitive

Verdict up front: **you do NOT need FOL/SMT/Lean for the 3 pre-registered criteria (Entity, Rule,
`enforces`) at the fidelity the DEFINE claim asks for.** A structural `.schema.yml` (required-field +
enum + shape checks) + a small **type-tagged expression parser** for one field covers everything. The
first place lightness *bends* (not shatters) is the Rule criterion's phrase **"Formal cell that parses
to a BOOLEAN predicate"** — that needs a real parser and a return-type check, but it is a *parse +
tag-check*, not a *proof*. Lightness only truly **breaks** (needs semantics/logic) at criteria the
package has already deferred or flagged as boundary-outs: **purity** ("no state mutation" /
"deterministic") and **State Machine reachability/exhaustiveness** — and those correctly route to the
engine or to a FALSIFIED record, never to a public FOL layer.

---

## 1. The six primitives, lightest sufficient tool each

The DEFINE claim (lines 39–52) sets the bar: a validator must **accept a positive fixture and reject a
discriminating negative** — nothing more. That bar is *classification/well-formedness*, not
*correctness proof*. It is met structurally for five of six primitives.

| # | Primitive | What it must decide | LIGHTEST sufficient tool | Why nothing heavier is needed | Moat-risk |
|---|-----------|---------------------|--------------------------|-------------------------------|-----------|
| P1 | **identity** (Entity has ≥1 identity field) | does the field table contain a row flagged as identity? | **schema required-field check** — `.schema.yml` asserts `fields[]` has ≥1 entry with `identity: true` (or a `pk`/`id` marker column). Table-parse already exists in `validate-relationships.ts:225` (`parseTableRow`). | pure presence test over parsed markdown; no logic. The Entity/VO discriminator (DESIGN §3, TAXONOMY:582) is *exactly* "identity present vs absent" — set membership. | none — presence of a column is not the δ-derivation. |
| P2 | **field-existence** (typed fields exist) | is there a non-empty `(name,type,required,desc)` table? | **schema shape check** — `.schema.yml` requires a `fields` table with ≥1 row and the 4 columns present. | header-map + row-count over the parsed table (`toHeaderMap`, `validate-relationships.ts:235`). | none. |
| P3 | **typedness** (each field has a type) | is every field row's `type` cell non-empty (and, optionally, drawn from a known type vocabulary)? | **schema per-row required-cell check** (+ optional **enum/vocab membership** if you want types constrained to Entity/VO/Enum/primitive names). | non-empty-cell test per row; membership is a `Set.has()` — the same trick `validate-relationships.ts:72` uses for canonical edges. | **watch:** constraining the type vocabulary is fine; do NOT let "typedness" grow into checking that the type is *correctly inferred from the impl* — that reaches the engine. Presence, not inference. |
| P4 | **edge-signature** (`enforces`: src=Rule ∧ tgt=Operation) | do both endpoints resolve to declared types matching the signature? | **schema lookup + compare** — a `.schema.yml` edge-signature table `{verb → {source_type, target_type}}` + a join: for each `From|Edge|To` registry row (RELATIONSHIPS.md:401–407), look up each endpoint's declared type and compare. | This is the *existing* validator generalized. `validate-relationships.ts` already parses the graph table and does `canonicalEdges.has(value)` (set membership on the verb). Adding endpoint-typing is one more lookup + two equality checks — **still O(1) table logic, zero semantics.** The 29 signatures are a static lookup table (RELATIONSHIPS.md:11–52 already state every `From → To`). | none — endpoint typing is the PUBLIC contract by definition; it is what `domainspec-v2-D3` admissibility governs. It cannot encode δ-rules because it only reads *declared* types, never derives them. |
| P5 | **boolean-predicate** (Rule's Formal cell parses to a boolean) | does the `Formal` expression parse, AND is its result type boolean (not a strategy/value)? | **small expression PARSER + return-type tag** — parse the Formal cell to an AST; check the top node is a boolean-valued operator (`<=,>=,==,<,>,∧,∨,¬,∈`) rather than a select/branch. NOT a schema check. | **This is the break point — see §2.** A schema can assert the cell is *non-empty*; it CANNOT assert the cell *is boolean* without parsing it. But the parser needed is tiny (comparison + logical connectives over named inputs — see the TAXONOMY examples `amount <= 10000`, `user.age >= 18`, TAXONOMY:170) and the check is a *root-tag* test, not a satisfiability/proof query. Parser + tag ≠ FOL/SMT. | **highest moat-sensitivity of the six.** A *return-type/root-tag* parser is safe (it reads syntax). The danger is scope-creep into **evaluating** or **deriving tests from** the predicate — that IS the engine's δ-step. Keep the check at "parses to a boolean-rooted AST," never "what the predicate implies." |
| P6 | **purity** ("no state mutation" for Rule; "deterministic / same-input→same-output" for Calculation) | does the Formal/formula have no side effects / no mutation? | **NO light tool is sufficient over the SPEC text.** A structural proxy exists (a *syntactic denylist*: reject if the Formal cell contains assignment `:=`/`=`-as-mutation, `emit`, `set`, a state-transition verb) — but that is a heuristic, not a decision. True purity is a **semantic property** requiring effect-typing / dataflow, i.e. running or type-inferring the impl. | see §2/§3: this is where lightness genuinely breaks. | **DO NOT formalize purity in the public layer.** Full purity checking is the engine's job (it already parses per-type structure to derive tests, DESIGN:78). Encoding a purity checker publicly risks re-deriving δ-behavior. Correct move: syntactic-denylist proxy for the *fixture-level* discriminator, and **record a boundary flag** (DEFINE:47–49 FALSIFIED clause) if a type's well-formedness can only be decided by real purity analysis. |

---

## 2. THE BREAKPOINT — where schema/DSL is not enough

**Ranked, the wall arrives in two steps, and the package's own 3 criteria only reach the FIRST:**

**Bend (first thing a bare `.schema.yml` cannot do) → P5, the Rule criterion.**
`.schema.yml` is a *shape* language: required fields, enums, cardinalities, cell-presence. It is
**structurally sufficient for Entity and `enforces` in full** (P1–P4). It is **NOT** sufficient for
"Formal cell parses to a **boolean** predicate," because *boolean-ness is a property of the expression's
parse, not of the row's shape*. A schema can only get you to "the `Formal` cell is present and
non-empty." Distinguishing Rule (boolean) from Policy (selects a strategy) — the MT2 key discriminator
(WORK-PACK:56) — requires actually parsing the cell and inspecting the root.

But this is a **shallow** break: the sufficient tool is a **~100-line typed-expression parser** (a small
DSL/grammar over `named-input (comparison|∈) literal`, closed under `∧ ∨ ¬`), and the check is
"top-level node is boolean-valued." **This is a parser + type-tag, NOT FOL/SMT/Lean.** You do not solve
satisfiability, you do not prove the predicate is *true* or *consistent* — you only classify its return
shape. So P5 escalates *off pure schema* onto a *bespoke mini-parser*, and stops there. **FOL/SMT/Lean
is NOT required for any of the 3 pre-registered criteria.**

**Break (genuine need for semantics/logic) → P6 purity, and beyond it, cross-cutting properties the
package has already deferred.** These need more than a parser:

- **Purity / determinism / "no state mutation"** (Rule's parenthetical, Calculation's property,
  TAXONOMY:150,164,620). Deciding a real absence-of-effect is a semantic/dataflow property — undecidable
  in general, and in practice needs effect-typing or execution. Structurally you can only *proxy* it
  (denylist of mutating tokens). This is the **first primitive where a structural check is provably a
  proxy, not a decision.**
- **State Machine well-formedness beyond shape** — MT3 (WORK-PACK:60). "States + transitions" is a
  schema/table check (light). But *reachability* (no orphan states), *determinism* (no two transitions
  on the same event+guard), and *guard exhaustiveness* are graph/logic properties. Reachability is a
  cheap graph traversal (still light-ish); **guard exhaustiveness/overlap is the one place a real
  solver (SMT over the guard predicates) would be the honest tool** — and it is *deferred/out of the 3
  criteria*, so it does not gate this package.

**Bottom line for the pre-registered set:** Entity = **schema only**. `enforces` = **schema + lookup**.
Rule = **schema + mini-parser (root-tag)**. None needs FOL/SMT/Lean. The heavy math only becomes the
honest tool for purity and guard-overlap — both of which the package correctly routes to the engine or
to a FALSIFIED boundary record (DEFINE:47–49), NOT to a public formal layer.

---

## 3. Over-engineering guard AND moat guard (the two failure modes to avoid)

- **Over-engineering (do not reach for logic you don't need).** The existing `validate-relationships.ts`
  is the proof of sufficiency: it validates the *hardest already-shipped* check (edge canonicity) with
  markdown-table parsing + `Set.has()` + Levenshtein suggestions — **no logic engine.** P1–P4 are
  strictly easier than what that file already does. Adopting `.schema.yml` (SCHEMA-CONSTITUTION,
  arcanum/framework/SCHEMA-CONSTITUTION.md) as the criterion carrier is the right weight: declarative
  shape rules, validator loads them (WORK-PACK:40). **Do not** introduce SMT/Lean to satisfy a
  classification bar the DEFINE claim sets at "accept-positive / reject-negative."
- **Moat-risk (do not let a criterion become the δ-derivation).** The package states the boundary
  crisply (DESIGN:78, DEFINE:14,47–49): the validator's criteria are the *public contract* of "what a
  valid T is," kept *consistent with* the engine but never *importing* its rules. The moat-sensitive
  primitives are **P3 (typedness → don't grow into type-inference), P5 (boolean-predicate → check the
  root tag, never evaluate/derive-tests-from the predicate), P6 (purity → don't build a public purity
  checker).** The DEFINE FALSIFIED clause is the correct escape hatch: if a type can only be decided by
  running derivation, **record it, don't reach into `src/rules`.** Heavy formalism is a *moat risk
  precisely because* a full FOL/SMT encoding of a criterion starts to look like the derivation itself —
  which is the strongest reason to stay light: **structural checks are safer for the moat, not just
  cheaper.**

## 4. Residue / what I did not settle
- I assessed the **3 pre-registered criteria + 6 primitives** the prompt named. The other 22 types
  (esp. Behavioral: Operation "≥1 postcondition + state change", Query "read-only", Workflow/Saga
  orchestration) will re-hit **P6 purity/side-effect** framing — same breakpoint, same routing. Not
  re-derived here.
- Whether the mini-parser for P5 should be a *hand-rolled grammar* vs a *tiny DSL spec in the
  `.schema.yml`* (a `formal_return_type: boolean` key the engine/validator both honor) is a **DES-D3
  design choice** — either is light; the DSL variant keeps the criterion declarative and avoids shipping
  parser code in the public contract (marginally better moat posture). Flagged, not decided.
- I did NOT open the engine `src/rules` (moat) — this analysis is entirely from the public spec +
  package + the existing validator.
