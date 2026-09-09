# Shared Execution Context

## Fixed Inputs

- [SPEC](../../SPEC.md)
- [Architecture](../../ARCHITECTURE.md)
- [UX plan](../../UX-PLAN.md)
- [Witness contracts](../../WITNESS-CONTRACTS.md)
- [Source contracts](../../SOURCE-CONTRACTS.md)
- [Design selection result](../../DESIGN-SELECTION-RESULT.json)
- [Validation strategy](../../VALIDATION-STRATEGY.md)

## Product Root

`projects/domainspec-v2/development/implementation-conformance/ontology-experiment/`

New projection artifacts live below `learner-projection/`. The only existing
host file in scope is `architecture-ontology-view.html`, and no host mutation
is admitted until A-001 closes.

## Non-Negotiable Invariants

- generated projection, never canonical ontology;
- exact source digest and selector bindings;
- `MaxAmountRule` ceiling is no reported finding only;
- `LegacyLimitRule` decision is `ABSTAIN`;
- exact v2 question text;
- literal destination `TypeScript adapter owner` at candidate-string ceiling;
- `authority_effect: none` and no execution-like fields, controls, requests, or
  events;
- no inferred comprehension or persisted real learner state;
- no standalone generic learning-map product.

## Runtime Constraint

Use the user-global Playwright/Chromium runtime for browser acceptance. Do not
create a package root solely to obtain Playwright and do not make external
network requests.
