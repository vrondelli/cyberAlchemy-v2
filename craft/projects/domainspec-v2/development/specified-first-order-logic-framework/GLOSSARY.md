---
module: specified-first-order-logic-framework
version: 0.2.0
status: feature-local
updatedAt: 2026-07-23
docType: glossary
---

# Glossary

| Term | Meaning |
| --- | --- |
| DS-SFOL | DomainSpec Specified First-Order Logic: a bounded, typed, executable first-order specification profile over finite domains. |
| logic module | Versioned node-bound set of type declarations and structured logic clauses. |
| logic clause | One stable node-owned function definition, predicate, invariant, precondition, postcondition, transition, or effect relation. |
| node logic payload | Structured `domainspec-node-logic/v1` module stored at `body.logic` of a canonical behavioral node. |
| node logic envelope | Lossless DS-SFOL input joining a node logic payload to canonical graph, manifest, build, profile, and source-set handles. |
| clause denominator | Independently frozen exact set of admitted clause and obligation identities. |
| term | Expression that evaluates to a typed value. |
| predicate | Expression that evaluates to Boolean or typed indeterminate. |
| finite quantifier | `exists` or `forall` evaluated only over an explicitly declared finite universe. |
| fixture universe | Validation-owned finite values used to instantiate variables, quantifiers, and boundary cases. |
| binding | Non-authoritative mapping from a clause-derived executable role to exactly one implementation symbol or harness. |
| pure runner | Invokes a deterministic function and records its returned value without deciding correctness. |
| effect harness | Invokes an operation and records explicit pre-state, post-state, calls, writes, emissions, and errors. |
| raw observation | Immutable returned value or effect trace produced by implementation execution. |
| independent evaluator | Evaluates source logic and compares it with raw observations without importing implementation-under-test code. |
| indeterminate | Typed result for unsupported syntax, unresolved data, partial arithmetic, resource ceiling, or unavailable observation. |
| admitted profile | Exact versioned language features, clause kinds, harness kinds, and residue policy allowed for a proof run. |
| coverage key | Stable identity joining module, clause, derived case, and execution role. |
| proof receipt | Digest-bound causal join across source, denominator, case, binding, observation, evaluation, and replay. |
| adopter | Feature or product that supplies canonical node logic, bindings, fixtures, and harness adapters to the general core. |

These terms are local to this package. No entry is promoted to DomainSpec-wide,
CyberAlchemy, Necronomicon, or public Arcanum definitions by this Invoke run.
