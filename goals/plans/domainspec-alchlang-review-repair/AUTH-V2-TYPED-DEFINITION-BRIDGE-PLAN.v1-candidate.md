# Auth inline definitions to FOL — candidate construction DAG

Status: technical candidate plan. It neither changes nor accepts the exact
`BUSINESS-MEANING.v2-definitions-candidate.json` currently under owner review.
No current FormalClaim, admission, TDE result, F5 result, or runtime guarantee
may be inferred from this plan.

## Problem and selected design

The ten draft `formal.expression` values mix formulae, macro abbreviations,
and English model assertions. The DomainSpec v2 schema treats each as nonempty
text. The existing six-clause FOL translation is parsed, typed, Lean-generated,
proved under one explicit interpretation, and semantic-mutant tested; none of
those checks consumes the ten inline expressions. A hash/regex tie or a second
hand-authored expected AST would not establish correspondence.

Build a **new candidate successor**, leaving the pinned draft untouched, with
a structured typed definition IR owned inline by BusinessMeaning. In the new
schema version, the IR is the **single normative formal body**. Remove the
old free-text `formal.expression`, or require it to be a deterministic renderer
output that is byte-checked against the IR; do not leave two competing formal
voices. `formal.definition`, `operational_interpretation`, `plain_language`,
and `domain_context` are commentary and cannot override the IR. The IR has
explicit constructors for carrier,
fixed scope, list-position occurrence, predicate/function definition,
uniqueness, provenance, ready condition, and two-value decision. A versioned
schema and type checker must reject unknown constructors/fields, omitted or
extra definitions, cycles, wrong sorts/arity, unbound variables, and unused
or uninterpreted abbreviations. This is a candidate contract amendment, not
an automatic promotion of the existing v2 meaning.

Alternative considered: keep prose expressions and attach a handwritten
mapping to six clauses. It is faster but leaves the source meaning unchecked,
so it cannot close this gap. A strict text DSL could work if fully parsed, but
structured IR avoids a second ambiguous grammar and makes the meta-types
first-class values. Existing expression strings remain historical draft
evidence, not silently reinterpreted as typed IR.

## Context pack and obligations

| Obligation | Controlling source | Required evidence |
| --- | --- | --- |
| Preserve accepted READY/DENY and no-call meaning | Accepted clarified v1 BusinessMeaning and owner endpoint-scope decision | New candidate keeps all accepted business facts byte-identical; no-call remains a separate all-native-entrypoint obligation. |
| Bind every inline definition | Current v2 draft and its ten IDs/dependencies | Exact ID coverage and dependency closure; each new IR body typed and consumed. |
| Match the FOL theory | `AUTH-V2-FOL-TRANSLATION.v1-candidate.json` and `formal-claim.ts` parser | Elaborate logical IR into clauses 1–6; compare canonical typed AST to independently parsed clause AST, not just digests. |
| Bind non-FOL semantics | Occurrence InterpretationModel and `AuthFolOccurrenceBridge.lean` | Source-bound model proof for finite ordered lists, position identity, equal duplicates, ghosts, total projections, and fixed Context scope. |
| Preserve existing proof | `auth-v2-fol-theory-proof.test.mjs` | Replay its exact-source theory and hostile semantic mutants after generated-AST comparison. |
| Respect authority | V2/V3/V4 DAG and pending exact owner gate | Revised candidate needs a new exact owner decision; no accepted status or current v4 source before that gate. |

## DAG and exit checks

1. Freeze exact accepted v1, current draft v2, occurrence model, FOL source,
   and Lean proof inputs; verify file hashes and dirty work before edits.
2. Define a versioned typed-IR schema and sort environment, with a generic
   fail-closed validator. The first executable unit is this schema/checker plus
   synthetic pass/fail fixtures for unknown constructors, wrong sort/arity,
   cycles, omitted/extra definitions, orphan IR nodes, and partial macro
   expansion. Review carrier/scope/occurrence constructors against the
   existing interpretation rather than inventing a narrower Context.
3. After that unit is independently reviewed, construct a separate revised
   Auth BusinessMeaning candidate. Preserve accepted v1 business facts;
   express all ten definitions in typed IR with exact IDs and explicit
   dependencies. Do not overwrite the pending draft or claim that it was an
   accepted v2 predecessor. The revised candidate still derives its authority
   lineage from the same accepted clarified v1 meaning, with the older draft
   recorded only as candidate provenance.
4. Elaborate QA/QR, exact-one, provenance, ready, and decision definitions
   compositionally. Produce all six clauses from one IR graph and compare
   their typed ASTs by raw structural equality, or by an explicitly proved
   alpha-normalization, to independent parsing of a **new exact-ref FOL translation
   postimage** bound to the revised candidate. The six clause bodies may stay
   byte-identical, but the old translation's `draft_definitions_ref` names the
   earlier draft and remains historical; replay alone cannot make it current.
   Abbreviations `ExactOneAuth`, `ExactOneRoute`, and `P` may disappear only
   through checked expansion. No unmatched source token or unused IR node may
   pass.
5. Derive Lean model declarations and obligations **from the carrier, scope,
   and occurrence IR**, then check the resulting theorems against the fixed
   selected typed Context: every valid position represented once, equal row
   values do not collapse, ghost/foreign positions cannot qualify, projections
   are total, and `InScopeNormal` covers the **entire** fixed representable
   Context carrier before outcomes. Selected-evaluator normal completion and
   totality remain separate correspondence proof obligations, never a
   post-outcome filter on Context. Independently review the
   semantics of every IR constructor and reject a circular model such as
   `ReadyCondition := operation`; a pinned Lean file, digest, or finite witness
   alone is insufficient.
6. Run negative controls for omitted/extra definitions, an IR `or true` branch,
   weakened qualifiers, changed provenance witness, row-value uniqueness,
   ghost membership, outcome reversal, and outcome-dependent scope. Replay
   existing six-clause Lean proof and independent review of parser, model,
   source binding, and tests.
7. Only after exact owner acceptance of the revised candidate may a new v4
   source be attempted. Separately resolve graph-authority wording: the
   current AlchLang mirror equality guard is a projection technique, while
   the DomainSpec graph contract says pointers resolve from accepted meaning.
   Do not silently change v3 claim-identity bytes to hide this difference.

## Ten-definition lowering review (2026-10-06)

The generic logical IR and occurrence-model IR from unit 1 are necessary but
not by themselves an all-ten bridge. The revised candidate must assign each
of the ten source definition IDs exactly one typed record. Definitions 1–4
are model constructors (Context, fixed scope, and the two position-based
occurrence carriers); they do not independently emit FOL clauses. Definition
7 has two named logical exports, `ExactOneAuth` and `ExactOneRoute`, under
one source ID. A checker that assumes one formula and one export per source
definition would either omit an export or misstate the model.

The clause derivation contract is:

| Source definitions | Derived output | Non-negotiable check |
| --- | --- | --- |
| D1–D4 | Typed finite-list interpretation and Lean model obligations | Entire Context carrier; each list position distinct even for equal rows; ghosts/foreign positions excluded; total same-position projections. |
| D5–D6 | FOL clauses 3–4 defining `QA` and `QR` | Treat `QA`/`QR` as *defined predicates*, then retain those symbols in clause 5. Bind Boolean `trusted=true` and `complete=true` to their exact predicate projections. |
| D7–D9 | FOL clause 5 defining `ReadyCondition` | Expand both exact-one exports and same-witness provenance; use position identity, never row-value equality. Bind `P(c)` to `ReadyCondition(c)`. |
| D10 | FOL clauses 1–2 and 6 | Emit distinct/exhaustive outcomes and both decision biconditionals. Eliminate the draft's `InScopeNormal` guard only after the model proves it covers the entire fixed Context carrier. |

Keep two edge types separate: logical `ref` edges must equal body references,
while model/interpretation dependencies may be contextual. The old draft's
`Provenance -> ExactOne` and `Ready -> InScopeNormal` edges are contextual;
inserting artificial formula references would alter the formula. The revised
schema and checker must make this distinction explicit and reject an orphan
export or unconsumed model constructor.

Comparison to the old six-clause translation is a design diagnostic, not a
current source binding: its exact `draft_definitions_ref` points to the old
candidate. A new exact-ref translation postimage must parse independently.
Naive raw AST equality is insufficient because expansion may reorder
conjuncts (`QA, uniqueness-of-auth, QR, uniqueness-of-route` versus the old
`QA, QR, uniqueness-of-auth, uniqueness-of-route`). Either deliberately emit
one fixed conjunction order in both new candidate and postimage and replay
proof, or implement a reviewed associative/commutative normalization with
explicit semantic justification. Binder renaming alone cannot solve that
order difference. Neither a hash nor a handwritten expected AST establishes
the bridge.

The owner-confirmed no-call rule quantifies over **every native
decision-producing Auth entrypoint**, including SQLite transaction/snapshot
authorization and the resolved runtime engine. None of these six pure-decision
FOL clauses proves that effect property. Carry it as a separate all-path
obligation; a zero call count at one service adapter is insufficient.

## Write scope and claim ceiling

The first implementation unit may add only candidate IR schema/checker and
synthetic tests under the local DomainSpec/AlchLang trees, plus this
plan/status. The revised Auth meaning belongs to unit 2 after independent
unit-1 review. Neither unit may edit the accepted v1 meaning, old draft v2,
historical SFOL/TDE evidence, or existing Lean theorem merely to make a check
pass. Any new exact source identity must be explicit and reviewed. No
deployment, publication, authority promotion, or owner acceptance is in scope.

The task is not complete until all ten typed definitions, six generated FOL
clauses, and model obligations have independently checked source bindings and
hostile controls. Even then, full no-call preservation, claim admission,
TDE/F5/EVF, and `runtime_guarantees_observed` remain separate.

## Open Questions

- Which exact candidate schema version and identity should follow the accepted
  v1 lineage after technical review and the owner's decision? The old v2
  draft has no accepted successor identity to inherit.
- Can the existing occurrence Lean proof be source-bound to the new carrier IR
  without a self-asserted bridge, or must it be regenerated from the IR?
- How should DomainSpec's direct accepted-meaning graph-pointer contract be
  reconciled with AlchLang's equality-checked definitions mirror while
  preserving the versioned v3 claim-identity algorithm?
