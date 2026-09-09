# TASK-LGP-CONTRACT: Projection Structural Contract

## Objective

Freeze the allowed generated projection shape and prove invalid record classes,
relations, endpoints, and authority-like suggestion fields fail before any
compiler or host integration exists.

## Layer And Slice

- Layer: L0
- Slice: S-001
- Wave: W1
- SWU: SWU-LGP-001

## Dependencies And Admission

- A-001 learner-view mutation-admission receipt bound in W0.
- A-002 explicit selection of SWU-LGP-001.
- Current Design selection fixed point and source-contract digests.

## Implementation Detail

### Inputs

- accepted projection record/relation classes from the revised synthesis;
- killed vocabulary list;
- required `authority_effect: none` suggestion package fields;
- endpoint closure and validity-state rules.

### Output Contract

- one input-manifest schema;
- one generated-projection schema;
- one deterministic validator;
- one minimal valid fixture;
- three focused negative fixture families.

### Ordered Algorithm

1. Parse schema and candidate fixture without network or implicit file search.
2. Reject unknown top-level, record, relation, decision, or authority fields.
3. Require stable IDs and exactly one declared record class per record.
4. Require every relation endpoint to resolve to an included record.
5. Reject killed vocabulary and generic/executable relation names.
6. Require suggestion status, literal destination contract, invalidation, and
   `authority_effect: none`; forbid action/admission/execution handles.
7. Require current/stale/invalid validity enum and suppress-current flag rules.
8. Emit deterministic `pass` or `block` with sorted diagnostics.

### Edge Cases And Failure Modes

- duplicate IDs, unknown endpoint, missing owner/proof tier/invalidation;
- canonical `QuestionNode`/`UnknownNode` or `understands`;
- generic `evidenced_by`/`routes_to`;
- suggestion with URL, command, action, admission, dispatch, or execution field;
- authority effect not `none`;
- validator accepting additional properties silently.

## Exact Write Scope

Product mutation is limited to:

1. `projects/domainspec-v2/development/implementation-conformance/ontology-experiment/learner-projection/learner-projection-input.schema.json`
2. `projects/domainspec-v2/development/implementation-conformance/ontology-experiment/learner-projection/learner-projection.schema.json`
3. `projects/domainspec-v2/development/implementation-conformance/ontology-experiment/learner-projection/validate-learner-projection.mjs`
4. `projects/domainspec-v2/development/implementation-conformance/ontology-experiment/learner-projection/fixtures/valid-structural.json`
5. `projects/domainspec-v2/development/implementation-conformance/ontology-experiment/learner-projection/fixtures/invalid-killed-vocabulary.json`
6. `projects/domainspec-v2/development/implementation-conformance/ontology-experiment/learner-projection/fixtures/invalid-authority-effect.json`
7. `projects/domainspec-v2/development/implementation-conformance/ontology-experiment/learner-projection/fixtures/invalid-endpoint.json`
8. `projects/domainspec-v2/development/implementation-conformance/ontology-experiment/learner-projection/tests/projection-contract.test.mjs`

No other ontology experiment, canonical ontology/profile, HTML host, Plan, or
telemetry file is in product scope.

## Done Criteria

- schemas reject additional/unknown semantics;
- all four fixture families return exact expected verdicts/diagnostics;
- validator output is deterministic across two runs;
- no compiler, generated snapshot, or host behavior is introduced.

## Validation

Planned commands from the ontology-experiment directory:

```text
node learner-projection/tests/projection-contract.test.mjs
node learner-projection/validate-learner-projection.mjs --input learner-projection/fixtures/valid-structural.json --expect pass
node learner-projection/validate-learner-projection.mjs --input learner-projection/fixtures/invalid-killed-vocabulary.json --expect block
node learner-projection/validate-learner-projection.mjs --input learner-projection/fixtures/invalid-authority-effect.json --expect block
node learner-projection/validate-learner-projection.mjs --input learner-projection/fixtures/invalid-endpoint.json --expect block
```

## Acceptance Evidence

- task-session receipt with exact file hashes;
- deterministic structural-validation receipt;
- separately produced learner-view owner receipt preserving the candidate-only
  ceiling under `work-pack/owner-evidence/SWU-LGP-001/owner-receipt.json`.

## Closeout Sync Scope

Use the common exact inventory in
[CLOSEOUT-CONTRACT.md](../shared/CLOSEOUT-CONTRACT.md) with `<SWU-ID>` =
`SWU-LGP-001`. Allowed deltas are evidence/status only. Success makes
SWU-LGP-002 eligible, not selected.

## Expected Result Shape

Use the shared Task Session terminal receipt. Any undeclared file, passing
killed/authority mutant, or missing owner receipt returns `block`.
