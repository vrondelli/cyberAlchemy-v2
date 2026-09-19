# L1 — Residue And Claim Map

## The Audience Problem

A DDD team may achieve shared meaning in a workshop, then lose the visible chain
between that meaning and the implementation. A rule becomes prose, code branches,
tests, architecture decisions, and later changes. Each artifact may be locally
reasonable while the relationship among them becomes difficult to challenge.

This is the talk's problem statement. It is an `operator-reading` grounded in DDD
model-driven design and the private product thesis, not a measured industry rate.

## DDD Bridge

| DDD concern | DomainSpec/EVF experiment | Defensible statement |
| --- | --- | --- |
| Ubiquitous language | Typed concepts and relationships preserve names and intended roles. | The model gives selected terms a machine-checkable representation; it does not replace conversation. |
| Bounded context | Source identity, scope, and relationship placement remain explicit. | Evidence applies only inside the declared semantic and execution boundary. |
| Model-driven design | A rule is linked to the operation it gates and to an implementation binding. | The experiment makes one model-to-implementation path inspectable. |
| Knowledge crunching | Counterexamples and surviving mutations expose weak or wrong interpretations. | Verification output can return questions to domain modeling. |
| Tactical patterns | Rule, Operation, Entity, Event, Workflow, Policy, and other typed nodes form the modeling alphabet. | The talk can use familiar tactical ideas without claiming one-to-one identity with every DDD pattern. |
| Strategic design | Ownership and context boundaries control where meaning applies and who may change it. | The architecture respects separate meaning, evidence, and decision owners. |

## Central Claim Ladder

| Claim | Source kind | Status | Ceiling |
| --- | --- | --- | --- |
| Business meaning can be represented as selected typed claims and relationships. | primary-source | supported in the current DomainSpec vocabulary | Only declared meaning is represented; completeness is not established. |
| A selected claim can generate or bind a formal obligation and executable cases. | primary-source | observed for the narrow EVF proving ground | One admitted path, not arbitrary business prose. |
| Positive and deliberately wrong cases can test whether the evaluator discriminates the modeled rule. | primary-source | observed candidate-local evidence | Mutation survival identifies a weakness; mutation death is not general correctness. |
| Formal or bounded providers can strengthen evidence for selected high-risk properties. | primary-source + related-source | observed for one bounded graph property; broader path incomplete | Provider results retain their exact assumptions and scope. |
| The loop can improve domain modeling by producing counterexamples and visible residue. | local-inference | plausible and talk-worthy | Product/user outcome still needs participant evidence. |
| The loop is ergonomic for domain experts and teams. | open-residue | unproven product hypothesis | Must be presented as a design goal and experiment question. |

## Terminology Correction

Avoid saying:

> Business meaning becomes formal verification.

Prefer:

> A selected business rule becomes a typed claim, then an explicit obligation,
> then bounded executable or formal evidence. The evidence can challenge the
> model, but it cannot decide whether the model captured all intended meaning.

This preserves the distinction among business meaning, formal specification,
evidence, proof, runtime conformance, and owner decision.

## Related-Work Residue

The literature already demonstrates domain DSLs, executable semantics, and
formal-method transformations. Therefore, novelty cannot rest only on connecting
DDD and formal methods. The proposal should differentiate itself through:

- an evidence chain that remains traceable to the source domain claim;
- positive and negative cases, not only a successful solver result;
- exact claim ceilings and visible unresolved states;
- a return path from evidence to the domain conversation; and
- work ergonomics for people who should not need to become theorem-prover experts.
