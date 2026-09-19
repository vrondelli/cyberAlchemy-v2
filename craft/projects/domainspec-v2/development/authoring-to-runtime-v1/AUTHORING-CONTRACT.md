# AlchLang application authoring contract, version 1

Status: implementation contract for S01; parser conformance is tracked separately.
Authority effect: none.

This contract implements the settled decisions in `IMPLEMENTATION-DAG.md` and
the target forms in `../../AUTHORING-TO-RUNTIME.md`. DomainSpec's formalization
schemas remain the source of FormalClaim meaning. This document specifies how
Alch authors those meanings; it does not admit a formal profile.

## Profile and compatibility

`profile application-v1` explicitly selects the coherent application surface.
Existing profiles and their invocation contracts retain their current behavior.
An application-v1 source cannot select `logic sfol-v1`, use anonymous conditions,
or silently fall back to an old parser after a failed target parse.

The existing source scanner and parser own source positions and declarations.
Specialized formal-expression parsing is a component of that parser, not a
second application parser. Every error identifies the authored file and line.
Public check/build commands must validate the complete selected profile before
publishing any output. A successful syntax parse alone is not a successful build.

## FormalClaim declarations

```alch
domain commerce "Commerce order management"
profile application-v1
owner commerce

formal-claim OrderCanBeSubmittedClaim:
  profile fol-core/1-candidate
  sort Order
  predicate HasLine(Order)
  predicate HasNonNegativeTotal(Order)
  proposition forall order: Order:
    HasLine(order) and HasNonNegativeTotal(order)
  ceiling "Submission eligibility only."

rule OrderCanBeSubmitted:
  ontology "COMMERCE-RULE-SUBMISSION"
  meaning "Submission requires at least one line and a non-negative total."
  claim OrderCanBeSubmittedClaim
```

Exactly one profile, proposition, and ceiling are required per claim. The
signature contains at least one sort. Functions use `function Total(Order) ->
Amount`; predicates use `predicate HasLine(Order)`; constants use `constant
Zero: Amount`. Declared non-sort symbols must be used. Names are unique in the
claim signature. Parameter and result sorts must resolve locally.

The fol-core expression grammar contains typed variables, constants, function
applications, predicate applications, equality (`=`), `not`, `and`, `or`,
`implies`, `iff`, parentheses, and typed `forall`/`exists` binders. Quantifiers
extend to the end of their expression; parentheses delimit a shorter scope.
Binding precedence is: term application, equality, not, and, or, implies, iff.
Implication associates right; iff chains require parentheses. Terms cannot be
used as booleans. Equality requires terms of the same sort. Free variables,
wrong arity, unknown symbols, wrong argument sorts, and trailing tokens reject.

This is an authoring representation of the selected sorted-FOL profile, not an
independent logic. Other source profiles retain their exact native proposition
contracts; selecting a provider never changes the source profile. Unsupported
profile syntax rejects explicitly rather than being parsed as fol-core.

Whitespace and comments outside quoted metadata do not change the normalized
proposition. Semantic identity is computed using an explicitly versioned
structural algorithm; no general theorem-equivalence algorithm is claimed.
The original proposition bytes remain available for representation identity.

## Meaning closure and lowering

Concise `.alch` declarations do not fabricate business acceptance. The lowering
input must supply exact, current references to BusinessMeaning, its acceptance,
the definition-binding graph, the selected formal profile, and the identity
algorithm required by FormalClaimSource/v4-candidate. These bindings use the
existing companion-binding mechanism extended with a claim section. Missing,
changed, non-current, escaped, or inconsistent bindings reject before output.

The author may parse/check syntax before obtaining those bindings; emission of
a current FormalClaim requires them. Synthetic acceptance in tests is labelled
as fixture data and never reported as product-owner acceptance.

Claim-owned assumptions, domain, universe, time, and currentness semantics must
be explicit in the exact definition closure and canonical proposition where
applicable. They may not be dropped because the current v4 schema has no
top-level assumption field. Adding evaluation bounds belongs to an evaluation
context and does not rewrite the source proposition.

Claim identity includes accepted meaning, definition closure, profile semantics,
signature, proposition, meaning-bearing assumptions, and ceiling. It excludes
operational provider selection, interpretation model, execution limits, runtime
version, and observed outcomes. Their changes invalidate dependent evidence.

Lowering emits the domain partition, FormalClaim v4 sources, typed claim
bindings, and a total source trace. FormalClaim is not a fourteenth backend
meta-type. The binding preserves exact qualified Rule and claim identities.

## Rule and consumer semantics

Each target Rule references exactly one declared claim. Multiple Rules may
reference the same claim and give it distinct application roles. A Rule cannot
also carry a predicate, executable body, or second proposition.

| Consumer | Authoring form | Required resolution |
| --- | --- | --- |
| Rule | `claim ClaimName` | Exactly one FormalClaim |
| Policy | `case RuleName -> TargetName` | Declared Rule and declared target |
| Transition | `guard RuleName` | Declared Rule |
| Invariant | `claim ClaimName` or `rule RuleName` | Exactly one selected condition source |
| Operation | `requires RuleName` or `RuleName --enforces--> OperationName` | Declared Rule and Operation |
| Query / Workflow | Declared Rule binding with explicit input binding | One existing condition, no inline replacement |

Policy evaluates cases in source order and returns the first selected target;
it does not execute that target. Transition `on EventName` identifies a trigger;
resulting events use separately declared output intents. An Invariant remains
a constraint binding, not a data record and not automatic runtime enforcement.

A Rule reference alone is not an executable function. Runtime use requires a
declared executable projection with exact claim identity, input interpretation,
domain and bounds, preservation direction, known losses, and result semantics.
An unavailable projection is not evaluable; it is never replaced by `true`,
`false`, provider choice, or an inferred field comparison. S06 proves a bounded
projection for its concrete example; E02 handles the separate TDE v2 adapter.

## Required negative cases

`syntax-cases.json` records the positive and hostile source cases that parser
and lowering tests must consume. Until their implementation lands, they remain
test obligations, not passing evidence. The cases include mixed legacy/target
syntax, duplicate propositions, unbound claims, inline policy expressions,
inline guards, competing invariant bindings, free variables, incorrect sorts,
undeclared symbols, and wrong callable arity.

Cross-partition binding additionally rejects a non-Rule source, non-FormalClaim
target, duplicate Rule conditions, mismatched claim versions/digests, missing
sources, and unresolved exact references. All claimed-current bytes are
rechecked; supplied digests alone are not evidence of currentness.

## Construction boundary

These declarations, graphs, projections, and tests construct a candidate. They
do not prove the proposition, approve the product, admit the profile, authorize
an Operation, activate a runtime, or publish a release. Layer receipts retain
that boundary and account for every node in the original DAG.
