# Validation Ownership and Negative-Control Decision

Status: validation model selected; exact validators and owner admissions pending
Authority effect: none
Implementation effect: none
Promotion effect: none
Parent architecture: `A-one-semantic-graph-owned-branches`
Canonical bytes: `A-branch-canonical-catalogs-generated-integrated-graph`
Decision ID: `DEC-DSV2-VALIDATION-NEGATIVE-CONTROLS-001`

## Recorded selection

- Selected option: `A-owner-local-validators-cross-branch-aggregate`
- Selected by: direct user selection (`A`)
- Selected at: `2026-08-23T19:12:28+01:00`
- Semantic validation: each branch owner supplies and executes the validator
  that interprets its own canonical catalog.
- Cross-branch validation: relationship and provenance validators check typed
  endpoints, two-key formalization acceptance, exact bindings, currentness,
  inverse-edge prohibition, and branch non-collapse without deciding endpoint
  meaning.
- Projection validation: deterministic rebuild binds generator, exact inputs,
  policies, output digest, freshness, and the non-authority claim ceiling.
- Aggregate behavior: one ordered orchestrator executes the owner-local and
  integration validators, runs the fixed twelve-class negative corpus,
  preserves typed results, and fails closed. A later pass cannot mask an
  earlier failure or indeterminate result.
- Decision effect: validation ownership and strategy selected only. No
  validator, fixture, receipt, owner admission, canonical migration, or
  execution is created by this record.

## Decision question

How should the system validate owner-local canonical catalogs and the generated
integrated graph without turning validation into semantic authority?

## Mandatory behavior in every admissible option

The validation design must preserve typed `pass`, `fail`, `block`, and
`indeterminate/error` results; stop at the expected first failing validator;
and prevent a later successful check from masking an earlier failure. A schema,
hash, receipt, fresh projection, or passing test cannot accept meaning,
discharge an obligation, promote a record, or authorize publication.

The minimum fixed negative corpus must reject:

1. unknown owner, namespace, branch, record kind, or relation kind;
2. a forbidden endpoint pair or a duplicate declarable inverse edge;
3. a formalization relation missing either exact endpoint-owner acceptance key;
4. an ontology/composition record attempting to rewrite formal-claim meaning;
5. a proof obligation placed in the formal-claims branch;
6. a missing or digest-mismatched derivation-context manifest;
7. stale endpoint, source, correspondence, signature, predicate, rule, policy,
   or receipt bindings;
8. a generated projection supplied as canonical semantic input;
9. a projection with missing generator/input/output digests or stale inputs;
10. a passing evaluator receipt being treated as obligation discharge;
11. a negative case whose subject is accepted when rejection was expected; and
12. an owner validator failure or indeterminate result normalized to aggregate
    success.

## Options

### A — Execute owner-local validators, then a cross-branch aggregate gate (recommended)

Each semantic owner supplies and executes the validators for its own catalog.
Relationship/provenance validators check cross-branch endpoint admissibility,
two-key acceptance, exact bindings, and currentness. Projection validators
rebuild from exact inputs and check output digest and freshness. One aggregate
orchestrator invokes these layers in a declared order, preserves every typed
owner verdict, runs the fixed negative corpus, and fails closed.

Benefit: validates the connected graph end to end while keeping semantic
interpretation with its owner. Cost/risk: requires orchestration, deterministic
tool/runtime locks, and a maintained cross-owner fixture corpus. Choose it when
one local command should prove integration without becoming a new authority.

### B — One central validator interprets every branch

Implement one validator containing business, formal-claims, proof-bridge,
system, lifecycle, and projection rules, plus the fixed negative corpus.

Benefit: one code path, one invocation, and straightforward aggregate reporting.
Cost/risk: central code becomes de facto semantic authority and must be updated
for every owner-local rule change; a bug can misinterpret all branches at once.
Choose it only if every owner accepts one shared validator authority and change-
control surface.

### C — Compose exact owner validation receipts without re-executing owner validators

Each owner executes its validator independently and publishes an immutable,
version- and digest-exact receipt over its catalog and negative controls. The
aggregate gate validates receipt identity, currency, coverage, cross-branch
bindings, and projection reproducibility but does not re-run or reinterpret
owner semantics.

Benefit: strongest runtime separation for independently operated owners.
Cost/risk: integration depends on current receipts, compatible environments,
and trustworthy coverage declarations; stale or missing receipts block the
whole graph even when local bytes are available. Choose it when owners cannot
share one execution environment.

### D — Defer

Keep the nine prior selections recorded and leave the architecture unadmitted
because non-collapse and stale-binding behavior are unproven.

### E — Stop

Preserve the selected design as non-executed decision evidence and stop before
an admission contract is defined.

## Standing context option

`Explain / more context` does not select an option. It requests aligned low-,
medium-, and complex-example comparisons, after which this same decision will
be presented again.

## Current gate state

- Result: `PASS` for validation-model selection
- Selected option: `A-owner-local-validators-cross-branch-aggregate`
- Remaining architecture blocker-level choices: 0
- Remaining admission work: exact validator contracts, exact negative fixtures,
  executed receipts, and protected owner acceptance
- Protected owner admission: every branch semantic owner,
  validation-governance, ontology-protocol, relationship, lifecycle,
  projection, negative-corpus, and aggregate-command owners must accept the
  exact candidate package
- Consequential product bytes changed: 0
- Override: not requested
