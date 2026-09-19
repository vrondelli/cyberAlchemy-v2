# Craft ORODI Ubiquitous Language

Status: candidate. Authority effect: none.

This is the language to use when discussing, modeling, implementing, testing,
and reviewing ORODI inside the `CA2-BC-CRAFT-ORODI` bounded context. It binds
business expressions to the ORODI Definition Pack, DomainSpec symbols, code
names, JSON vocabulary, tests, and receipts without treating those different
representations as identical authorities.

## Core rule

Use the same preferred domain expression everywhere its meaning is intended to
remain the same. When a representation changes—Title Case prose, PascalCase
TypeScript, lower_snake_case JSON—preserve one explicit binding to the same
concept. Shared spelling in another bounded context does not prove shared
meaning.

## Required distinctions

| Say | Meaning | Never collapse into |
| --- | --- | --- |
| Observation | A recorded input about the product | Eligible evidence or a verdict |
| Operational Evidence | Bound observations and evaluations supporting one exact operational claim | Authority or an environment effect |
| Receipt | Immutable output of one operation or evaluation | The evidence itself or owner acceptance |
| Validate | Check declared structure or contract conformance | Evaluate a domain claim |
| Evaluate | Apply a policy to bound evidence and return an Evidence State | Validate shape, authorize, or actuate |
| Passed | Evidence State of one evaluated obligation | Valid, accepted, admitted, authorized, or deployed |
| Runtime Snapshot | Receipt-derived snapshot that may remain denied | Runtime Evidence |
| Analyze Canary | Non-actuating stable/candidate comparison | Shift traffic or deploy |
| Evaluate Rollback | Judge restoration evidence | Actuate rollback |
| Run-Ready | Prepared, statically checked, and not-run | Commissioned or operational |
| Local Commissioning | Separately authorized local exercise through verified teardown | Production deployment or release |

Evidence States are exactly:

```text
passed | failed | missing | invalid | inconclusive | stale | not-run
```

No state aliases another state. `missing`, `invalid`, `inconclusive`, `stale`,
and `not-run` cannot become `passed` through aggregation.

## Naming grammar

- Concepts: singular Title Case in prose and PascalCase in code.
- Operations: imperative domain verbs—`Assemble`, `Record`, `Evaluate`,
  `Aggregate`, `Analyze`, `Observe`, `Project`, `Verify`, `Commission`.
- Events: past-tense facts—`Assembled`, `Recorded`, `Evaluated`, `Aggregated`,
  `Analyzed`, `Observed`, `Projected`, `Verified`, `Commissioned`.
- Rules: complete declarative must-hold phrases.
- JSON: lower_snake_case mechanical projection of the preferred expression.
- Error codes: `ORODI_<SUBJECT>_<CONDITION>` with one stable condition meaning.
- Do not use `result`, `status`, `data`, `manager`, `handler`, `processor`,
  `check`, or `item` as unqualified domain nouns.
- `ORODI` is the only accepted acronym. `ORRI` and `ORDI` are not aliases.

The effect verbs `admit`, `authorize`, `commission`, `deploy`, `inject fault`,
`promote`, `release`, `roll back`, `shift traffic`, and `tear down` are reserved
for operations with an explicit owner and effect authorization. A validator,
observer, evaluator, projection, simulation, plan, or receipt must not use its
name to imply one of those effects.

## DomainSpec implementation surface

The current source has 32 exact model expressions:

- 8 Entities
- 8 Rules
- 8 Operations
- 8 Events

Their exact symbols and definition bindings are in
`ORODI-UBIQUITOUS-LANGUAGE.v1-candidate.json`. This candidate also exposes a
typed gap: `OperationalObservation`, `ControlReceipt`, `TelemetryAccounting`,
`EvaluationClaim`, and `OperationalEvaluationBundle` exist in TypeScript but
have no exact `Value Object` realization in the current DomainSpec source.
Adding them requires a successor DomainSpec profile/source decision; the gap
must not be repaired directly in implementation.

## Current implementation drift

Two names should change only in a future authorized implementation migration:

1. Split `validateOperationalEvidence` into structural validation and domain
   evaluation, or rename the public operation to
   `evaluateOperationalEvidenceBundle`.
2. Prefer `OperationalEvaluationReceipt` over
   `OperationalEvaluationResult` because the output is immutable,
   provenance-bound evidence rather than a generic result.

This file does not authorize those changes.

## Ownership and next gate

- Bounded-context meaning: Craft ORODI Business Ontology owner.
- Language asset: Craft ORODI Ubiquitous Language owner, reviewed by the
  CyberAlchemy v2 Language Project owner.
- Canonical promotion: CyberAlchemy v2 definitions-governance owner.
- DomainSpec realization: DomainSpec v2 language and profile owners.
- Implementation naming adoption: DomainSpec v2 operational-resilience
  implementation owner.

The next safe move is semantic review of the exact language digest. Only after
that review and the earlier definition decision may a successor DomainSpec and
implementation-binding epoch be prepared.

## Claim ceiling

This is a candidate bounded-context language. It does not promote definitions,
prove shared human understanding, admit a Language or DomainSpec profile,
authorize implementation, accept conformance, establish runtime truth, or
authorize commissioning, publication, release, deployment, or external effects.
