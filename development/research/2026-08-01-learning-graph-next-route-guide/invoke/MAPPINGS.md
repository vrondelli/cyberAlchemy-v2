# Mappings: Learner Projection And Next-Route Guide

## BoundInputsToProjection

Maps exact source records to projection records without changing owner,
evidence class, proof tier, or invalidation semantics.

| Source | Target record class |
| --- | --- |
| ontology concept | `semantic_concept` |
| profile constraint | `profile_expectation` |
| supplied fact | `source_observation` |
| expected evaluator output | `evaluation_finding` |
| explicit session fixture | `session_confusion` or `session_question` |
| closed-set missing witness | `evidence_gap` |
| display package | `route_suggestion` |

Generic `evidenced_by`, `routes_to`, `understands`, or anthropomorphic edges are
never generated.

## IdentityQuestionToEvidenceQuestion

### Premises

- `binding.concept_id` is empty;
- `binding.current` is false;
- `source_digest` equals `example-only-not-a-product-receipt`; and
- no native-adapter receipt exists.

### Exact output

> What owner-resolved current semantic binding and native TypeScript adapter evidence would be required before LegacyLimitRule could be evaluated for Rule identity?

Any failed premise suppresses this exact mapping and requires regeneration or
a separately specified rule. The mapping never infers learner cognition.

## EvidenceGapToSuggestionPackage

Maps only `gap:typescript-real-source-and-binding` to the literal destination
string `TypeScript adapter owner`, the frozen verification question, proposed
witness, prerequisites, invalidation rule, and `authority_effect: none`.

No executable route identifier, admission state, or lifecycle transition is
emitted.
