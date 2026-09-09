# Governance Runtime Intent

Status: perennial candidate. No authority or enforcement effect.
Owner: future governance enforcement runtime owner.

In plain terms: this is a long-lived runtime-intent proposal. No Governance
runtime is implemented or accepted by this document.

## Purpose

The future Governance runtime should evaluate one proposed consequence against
exact adopted governance meaning and authority without extending either. This
document establishes a product-to-runtime boundary for the next design project;
it is not the system-runtime ontology or implementation plan.

## Runtime Intent

For one attempted consequence, the runtime should be able to answer:

```text
Is there an exact adopted and applicable rule,
inside a valid authority envelope,
with an explicit enforcement binding for this subject and effect?
```

If the answer is not established, the runtime must not invent eligibility or
authority.

## Required Inputs

A future evaluation contract is expected to require:

- proposed action and consequence;
- subject and target;
- exact rule and policy versions;
- Constitution identity, version, adoption evidence, scope, and selectors;
- authority holder, action, target, scope, conditions, lifecycle point, and
  effect;
- applicability evidence;
- enforcement binding identity and version;
- requested runtime mode;
- evidence references required by the selected rule; and
- correlation and provenance identifiers.

Exact Rust and DomainSpec v2 types belong to the future system-runtime
ontology.

## Decision Result

The runtime result should distinguish at least:

- `allow` — the accepted contract permits the consequence;
- `deny` — the accepted contract prohibits the consequence;
- `abstain` — applicability, authority, or required evidence is insufficient;
  and
- `error` — the evaluator could not reliably complete its work.

`abstain` is not `allow`. `error` is not a governance verdict. The integration
owner must define how each result affects one specific work surface.

## Enforcement Preconditions

The product rule “Only Adopted Applicable Rules Enforce” requires all of these
before a runtime may affect work:

1. exact semantic rule identity;
2. exact owner adoption into a Constitution;
3. matching Constitution scope and selectors;
4. current applicability to the subject and consequence;
5. valid authority for the intended effect;
6. explicit enforcement binding;
7. accepted runtime and integration contracts; and
8. result-to-effect mapping owned by the integration surface.

Candidate, present, context-loaded, validated, or nearby artifacts do not meet
these conditions by themselves.

`GOV-RULE-D64-BINDING-COMPLETE` is intentionally only a candidate review rule.
It is not a Governance Program, kernel clause, verified fact contract,
Constitution member, enforcement binding, or result-to-effect mapping. A future
runtime design may compile an exact adopted version only after the unresolved
D64 semantic-version, grounding, concrete Project-binding, adoption, and
integration obligations are discharged. The Project package now owns a closed
binding registry shape, but an empty registry is readiness evidence rather than
a runtime binding or enforcement input.

## Observe-Only Posture

The current module has no enforcement edge. A future observe-only adapter may
record a bounded finding while preserving the original work result, command
status, files, lifecycle, owner requests, and external state.

Observe-only is not silently degraded enforcement. It is a distinct effect
mapping that must be explicit and testable. The repository-wide posture is not
currently proved.

## Planned Architecture Boundary

The next design should create three separate surfaces:

```text
business product ontology
    -> business-system bridge
        -> system-runtime ontology
            -> Rust implementation
```

The system ontology should own components, ports, events, value objects,
policies, tests, telemetry, configuration, and deployment constraints. The
bridge should state which runtime artifacts realize, test, observe, or constrain
which business meanings.

No implementation artifact should redefine the product rule or canonical CAV2
authority meaning.

## Failure Behavior

A future runtime should fail closed for its own effect when:

- rule, Constitution, authority, or binding identity is missing;
- applicability is ambiguous;
- referenced evidence is non-current for the claimed selector;
- input shape is invalid;
- evaluation is indeterminate; or
- a runtime error prevents reliable evaluation.

Fail closed does not mean blocking every surrounding operation. The integration
contract must bound the exact effect and preserve unrelated product failures or
successes.

## Telemetry

Candidate runtime telemetry may record:

- evaluation ID and time;
- subject and consequence class;
- selected rule, Constitution, authority, and binding IDs;
- result and typed reason;
- evaluation duration;
- evidence references;
- runtime version; and
- integration surface.

Telemetry is evidence, not authority or product proof. Privacy, retention, and
external transport require separate decisions.

## Non-Goals

The first runtime should not:

- hash the repository as a lifecycle clock;
- discover authority by proximity;
- infer adoption from presence or validation;
- turn product ontology nodes into executable rules;
- automatically tune, prune, or create rules;
- decide Constitution membership;
- open issues, branches, commits, pull requests, or external messages without
  exact separate authority;
- replace product tests; or
- claim safety, correctness, or controlled consequences from one passing run.

## Example

Example only: no runtime exists.

A publish action is proposed. The runtime finds a candidate publication rule
and an assessment, but no exact Constitution adoption or enforcement binding.
The only valid result is `abstain`. The integration must not reinterpret the
assessment or candidate rule as permission or denial.

## Claim Ceiling

This document states candidate runtime intent and boundaries. It is not a
system-runtime ontology, DomainSpec v2 executable contract, Rust design,
implementation, accepted integration, conformance proof, active rule set,
authority grant, deployment plan, or permission to affect work.
