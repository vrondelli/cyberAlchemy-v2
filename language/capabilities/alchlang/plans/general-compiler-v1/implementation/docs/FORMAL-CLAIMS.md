# AlchLang FormalClaim and sorted first-order logic reference

Status: owner-directed AlchLang authoring reference; successor implementation
required

Consult this page before writing or reviewing an AlchLang example containing a
Rule, Policy, Invariant, Query condition, permission condition, or State Machine
guard. It records the selected AlchLang composition model and identifies the
older implementation surface that must not be mistaken for that target.

This page does not redefine DomainSpec formalization semantics. The canonical
contracts remain the DomainSpec JSON and JSON Schema sources named under
[Authority](#authority). AlchLang owns only its authoring and lowering contract.

## Decision

AlchLang uses the DomainSpec FormalClaim model for formal domain truth. Its
logical source is sorted first-order logic under an explicit formal-language
profile and signature. The older AlchLang `sfol-v1` expression dialect is a
bounded compatibility implementation; it is not the target model for new
language examples.

The following composition is required:

```text
accepted business meaning
  -> exact definition-binding graph
  -> FormalClaim
       - formal-language profile
       - signature: sorts, functions, predicates, constants
       - one canonical proposition
       - assumptions/domain/ceiling that contribute to identity
  -> Rule
  -> Rule consumers
       - Policy case? no: Policy references the Rule
       - State transition guard references the Rule
       - Invariant references the Rule or its FormalClaim
       - Operation enforcement references the Rule
  -> optional preservation-backed provider projection
  -> EVF evidence
```

A FormalClaim is not proof, execution, validation evidence, authorization, or
runtime behavior. A Rule result is not permission to execute an Operation. A
Policy selection returns a declared target identifier and does not execute it.

## Authority

Consult these sources in this order:

1. DomainSpec FormalClaim identity and profile explanation:
   `projects/domainspec-v2/formalization/docs/FORMALCLAIM-AND-PROFILES.md`.
2. Candidate FormalClaim source contract:
   `projects/domainspec-v2/formalization/schemas/formal-claim-source-v4-candidate.schema.json`.
3. Formal-language profile registry:
   `projects/domainspec-v2/formalization/profiles/formal-language-profiles.json`.
4. Definition-binding contract:
   `projects/domainspec-v2/formalization/schemas/formal-claim-definition-binding.schema.json`.
5. Current implemented TDE intake, where compatibility matters:
   `FormalClaimSourcePayload/v2`, as identified by the DomainSpec formalization
   guide and v4 candidate contract.

The first four paths are relative to the private `domainspec-core` repository.
The v4 contract is a candidate. It requires an exact v2 projection before the
current TDE intake can consume it; an adapter may not add or reinterpret
meaning.

## FormalClaim identity

One FormalClaim contains one canonical proposition and one declared formal
signature. Its identity includes:

- accepted BusinessMeaning identity;
- the explicit definition-binding graph and accepted definition closure;
- formal-language profile semantics;
- sorts, functions, predicates, and constants in the formal signature;
- canonical proposition semantic identity;
- meaning-bearing assumptions, domain, universe, time, and currentness rules;
- the claim ceiling.

Changing any of those creates a different claim identity. Changing a provider,
solver version, native syntax, runtime environment, finite execution bound, or
InterpretationModel invalidates the relevant evaluation/projection evidence but
does not by itself create a different FormalClaim.

## Logical profiles

`fol-core/1-candidate` is the canonical source profile for ordinary AlchLang
domain claims that require sorted first-order logic. It provides typed
predicates, universal and existential quantifiers, equality, and explicit
assumptions under an exact signature.

`smt-sfol/1-candidate` is a solver-oriented canonical source or projection
profile. It preserves native `sat`, `unsat`, `unknown`, and timeout meanings.
It must not turn `unknown`, timeout, a bounded result, or absence of a found
witness into a general truth claim.

Lean/DTT, TLA/TLC, Alloy, and Souffle are separate source or projection
profiles. Provider availability never chooses the canonical source profile.

## AlchLang composition contract

### Rule

A Rule is the named DomainSpec consumer of one formal condition. Its condition
must resolve to one FormalClaim or to a lossless, identity-bound projection of
that FormalClaim. It must not introduce a second expression language.

Conceptual target form (the current parser does not yet accept this syntax):

```alch
# TARGET SYNTAX — not current parser syntax
formal-claim OrderCanBeSubmittedClaim:
  profile fol-core/1-candidate
  sort Order
  predicate HasLine(Order)
  predicate HasNonNegativeTotal(Order)
  proposition forall order: Order:
    HasLine(order) and HasNonNegativeTotal(order)

rule OrderCanBeSubmitted:
  ontology "Only a non-empty order with a valid total may be submitted."
  meaning "Submission requires at least one line and a non-negative total."
  claim OrderCanBeSubmittedClaim
```

The sorts and predicate signatures are part of the claim. A bare expression
such as `order.total >= 0` is not equivalent unless its types, definitions,
assumptions, and semantic identity are closed by the same claim contract.

### Policy

A Policy references declared Rules. It does not own inline SFOL formulas.

```alch
# TARGET SYNTAX — not current parser syntax
policy FulfillmentPolicy:
  inputs order
  case HighValueOrder -> ManualReview
  default StandardFulfillment
  applies ManualReview, StandardFulfillment
```

`HighValueOrder` must already be a declared Rule bound to its FormalClaim.
This older form is forbidden in target examples:

```alch
# LEGACY — do not present as the target language
policy FulfillmentPolicy:
  inputs order
  case order.total.amount > 1000 -> ManualReview
  default StandardFulfillment
```

Policy ordering chooses the first Rule that evaluates true. It neither proves
the Rule nor authorizes or executes the selected target.

### State Machine

A transition guard references a declared Rule. An event selector references a
declared Event. The State Machine must not parse either as an inline formula.

```alch
# TARGET SYNTAX — not current parser syntax
state-machine OrderLifecycle:
  subject Order
  initial Draft
  state Draft
  state Submitted

  transition Submit:
    from Draft
    to Submitted
    on OrderPlaced
    guard OrderCanBeSubmitted
```

The required graph is:

```text
OrderPlaced --transitions--> OrderLifecycle
OrderCanBeSubmitted --guards--> Submit
Submit --from/to--> Draft, Submitted
OrderLifecycle --subject--> Order
```

The current compatibility syntax
`Draft -> Submitted when OrderCanBeSubmitted emits OrderPlaced` may remain in
implementation-specific documentation, but it must not be used to imply that
the Event is both a trigger and a resulting event.

### Invariant and Operation

An Invariant references a declared Rule/FormalClaim. An Operation can be
enforced by a declared Rule. Neither duplicates the proposition text.

```alch
# TARGET SYNTAX — not current parser syntax
invariant MoneyIsNonNegative:
  claim NonNegativeMoneyClaim

rule CustomerCanPlaceOrder:
  claim ActiveCustomerClaim
  enforces PlaceOrder
```

### Query and other executable projections

A Query filter or runtime check may consume an executable projection of a
FormalClaim only when the projection declares its domain/bound, losses, result
semantics, and preservation direction. The executable subset is not allowed to
replace the claim or silently narrow its meaning.

## What remains implemented as legacy compatibility

The current general compiler still contains an older path:

- `logic sfol-v1` selects a quantifier-free comparison/presence expression
  dialect in the base parser;
- `parser.ts` parses Policy cases as inline formulas;
- `predicate-parser.ts` implements the bounded expression parser;
- `model.ts` names the resulting AST `SfolFormula`;
- `typed-backend.ts` directly evaluates Policy case formulas;
- `definitions/DEFINITIONS.md`, `docs/TUTORIAL.md`, and `docs/LANGUAGE.md`
  still describe that compatibility surface;
- the declarative-function profile has collection quantifiers, but it does not
  by itself implement FormalClaim identity, definition closure, or profile-bound
  preservation.

These facts describe implementation state, not the accepted successor design.
Until the successor compiler is implemented, examples must say whether they are
`CURRENT COMPATIBILITY SYNTAX` or `TARGET SYNTAX — not current parser syntax`.

## Review checklist

Before accepting an AlchLang example, verify all of the following:

- [ ] Every formal condition has one identifiable FormalClaim source.
- [ ] The claim binds accepted meaning and an explicit definition graph.
- [ ] Sorts and callable signatures are explicit and type-correct.
- [ ] The canonical proposition and profile are identified.
- [ ] Policies reference declared Rules rather than inline formulas.
- [ ] State-machine guards reference declared Rules.
- [ ] Event triggers and resulting events are not collapsed.
- [ ] Invariants and Operations reuse declared Rules/claims.
- [ ] Executable subsets are labeled as projections with exact limits.
- [ ] Solver or runtime evidence is not described as universal proof,
      authorization, execution, admission, or production correctness.
- [ ] Example syntax is labeled accurately as current compatibility or target.

## Drift ledger

| Surface | Current drift | Required successor behavior |
| --- | --- | --- |
| `definitions/DEFINITIONS.md` `ALCH-TB-D5` | Defines the reduced `sfol-v1` kernel as the shared language | Replace or supersede it with the FormalClaim-bound sorted-FOL model |
| `docs/LANGUAGE.md` | Calls `sfol-v1` the only supported logic profile | Keep this only as implementation compatibility and link here |
| `docs/TUTORIAL.md` | Teaches inline formulas in Policy cases | Teach declared Rule references for target Alch |
| `src/parser.ts` | Parses each Policy case as `parseSfolFormula(...)` | Resolve a declared Rule and its claim-bound projection |
| `src/model.ts` | Represents only the reduced formula AST | Carry FormalClaim identity, signature, profile, and projection binding |
| `src/predicate-parser.ts` | Owns formula meaning locally | Become an explicit bounded projection parser or be superseded |
| `src/typed-backend.ts` | Evaluates inline Policy predicates | Evaluate referenced Rules without granting target execution |
| declarative-function expressions | Support finite collection quantifiers without FormalClaim identity | Bind any formal use to an explicit claim/projection contract |

This ledger is a migration map. It does not claim that the successor parser,
lowering, evaluator, or DomainSpec/EVF bridge already exists.
