# TASK-LGP-COMPILER: Exact Projection Compiler

## Objective

Compile the frozen source set into a deterministic normalized learner
projection, then add the accepted positive ceiling and the separately bounded
abstention/question/suggestion response without collapsing their evidence.

## Layer And Slices

- Layer: L0
- Wave: W2
- SWU-LGP-002: exact binding and replay
- SWU-LGP-003: `MaxAmountRule` positive-fixture ceiling
- SWU-LGP-004: `LegacyLimitRule` abstention, exact question, and display-only suggestion

## Shared Constraints

- no network access or repository search beyond the declared input manifest;
- exact source digests/selectors from `SOURCE-CONTRACTS.md`;
- canonical ordering and atomic generated writes;
- generated artifact `authority_effect: none`;
- learner-view mutation admission, owner-resolved semantic-admission evidence,
  and destination-owner identity/admission are disjoint records;
- no HTML or personal session-state changes.

## SWU-LGP-002: Exact Binding And Replay

### Purpose

Own the one behavior “current exact inputs produce one canonical normalized
snapshot and receipt; stale/missing/escaping inputs do not.”

### Algorithm

```text
load and validate input manifest
for binding in stable binding-id order:
  resolve inside repository root
  hash current bytes; block on mismatch
  resolve each required pointer/selector; block on missing
  project only approved fields with owner/proof/invalidation
sort records and relations by stable id
validate normalized snapshot against schema
write temp snapshot and receipt; atomically replace outputs
repeat compile; require byte-identical snapshot and receipt material
```

### Exact Write Scope SWU-LGP-002

1. `projects/domainspec-v2/development/implementation-conformance/ontology-experiment/learner-projection/learner-projection.input.json`
2. `projects/domainspec-v2/development/implementation-conformance/ontology-experiment/learner-projection/compile-learner-projection.mjs`
3. `projects/domainspec-v2/development/implementation-conformance/ontology-experiment/learner-projection/learner-projection.normalized.generated.json`
4. `projects/domainspec-v2/development/implementation-conformance/ontology-experiment/learner-projection/learner-projection.compile-receipt.json`
5. `projects/domainspec-v2/development/implementation-conformance/ontology-experiment/learner-projection/fixtures/stale-input-mutant.json`
6. `projects/domainspec-v2/development/implementation-conformance/ontology-experiment/learner-projection/tests/compiler-replay.test.mjs`

### Validation SWU-LGP-002

```text
node learner-projection/tests/compiler-replay.test.mjs
node compile-learner-projection.mjs --input learner-projection/learner-projection.input.json --output learner-projection/learner-projection.normalized.generated.json --receipt learner-projection/learner-projection.compile-receipt.json
```

Done: accepted paths/digests/selectors resolve; two compilations are byte
identical; stale, missing, escaping, and concurrent-write mutants block; no
derived decision, question, or suggestion exists yet.

## SWU-LGP-003: Positive Fixture Ceiling

### Purpose

Own only the `MaxAmountRule` positive-fixture derivation and its ceiling.

### Algorithm

```text
read owner-accepted normalized snapshot
if expected findings contain no MaxAmountRule subject finding:
  emit FIXTURE_HAS_NO_REPORTED_FINDING
  emit the explicit no-positive-per-assertion/no-identity/no-runtime ceiling
else emit only the reported fixture findings
never infer semantic identity from the absence of a finding
canonicalize output and receipt
```

### Exact Write Scope SWU-LGP-003

1. `projects/domainspec-v2/development/implementation-conformance/ontology-experiment/learner-projection/compile-learner-projection.mjs`
2. `projects/domainspec-v2/development/implementation-conformance/ontology-experiment/learner-projection/learner-projection.generated.json`
3. `projects/domainspec-v2/development/implementation-conformance/ontology-experiment/learner-projection/learner-projection.compile-receipt.json`
4. `projects/domainspec-v2/development/implementation-conformance/ontology-experiment/learner-projection/fixtures/expected-positive-projection.json`
5. `projects/domainspec-v2/development/implementation-conformance/ontology-experiment/learner-projection/fixtures/positive-derivation-mutants.json`
6. `projects/domainspec-v2/development/implementation-conformance/ontology-experiment/learner-projection/tests/positive-derivation.test.mjs`

### Validation SWU-LGP-003

```text
node learner-projection/tests/positive-derivation.test.mjs
node learner-projection/validate-learner-projection.mjs --input learner-projection/learner-projection.generated.json --expect pass
cmp learner-projection/learner-projection.generated.json learner-projection/fixtures/expected-positive-projection.json
```

Done: the exact no-reported-finding result and ceiling pass; positive identity
and per-assertion mutants block; no LegacyLimitRule response is added.

## SWU-LGP-004: Abstention And Evidence-Route Response

### Purpose

Own one coherent response to the frozen `LegacyLimitRule` evidence gap:
mandatory abstention, the exact four-premise question revision, and the
display-only suggestion package.

### Algorithm

```text
read owner-accepted SWU-LGP-003 projection
semantic_gap = no native-adapter receipt
               OR no owner-resolved semantic-admission receipt
if semantic_gap:
  emit ABSTAIN and the exact evidence-gap record
question_premises = binding.concept_id empty
                    AND binding.current false
                    AND source_digest == example-only-not-a-product-receipt
                    AND no native-adapter receipt
if all four question_premises:
  emit the literal v2 question from MAPPINGS.md
else:
  suppress automatic question revision
if the declared gap mapping is current:
  emit the literal TypeScript adapter owner candidate string, witness,
  prerequisites, invalidation, and authority_effect none
never treat learner-view mutation admission as semantic evidence
never infer destination-owner identity or admission from the candidate string
canonicalize output and receipt
```

### Required Negative Control

LGP-FIX-014 supplies a valid learner-view mutation-admission receipt while the
native-adapter and owner-resolved semantic-admission receipts remain absent.
The result must still be `ABSTAIN`, the exact four-premise v2 question, and the
display-only suggestion package.

### Exact Write Scope SWU-LGP-004

1. `projects/domainspec-v2/development/implementation-conformance/ontology-experiment/learner-projection/compile-learner-projection.mjs`
2. `projects/domainspec-v2/development/implementation-conformance/ontology-experiment/learner-projection/learner-projection.generated.json`
3. `projects/domainspec-v2/development/implementation-conformance/ontology-experiment/learner-projection/learner-projection.compile-receipt.json`
4. `projects/domainspec-v2/development/implementation-conformance/ontology-experiment/learner-projection/fixtures/expected-projection.json`
5. `projects/domainspec-v2/development/implementation-conformance/ontology-experiment/learner-projection/fixtures/derivation-mutants.json`
6. `projects/domainspec-v2/development/implementation-conformance/ontology-experiment/learner-projection/fixtures/mutation-admission-not-semantic-evidence.json`
7. `projects/domainspec-v2/development/implementation-conformance/ontology-experiment/learner-projection/tests/abstention-route-derivation.test.mjs`

### Validation SWU-LGP-004

```text
node learner-projection/tests/abstention-route-derivation.test.mjs
node learner-projection/validate-learner-projection.mjs --input learner-projection/learner-projection.generated.json --expect pass
cmp learner-projection/learner-projection.generated.json learner-projection/fixtures/expected-projection.json
```

Done: exact abstention, gap, question, destination string, witness,
prerequisites, invalidation, and authority effect pass; premise, admission-
substitution, killed-vocabulary, endpoint, and authority mutants block or
suppress exactly as specified.

## Acceptance Evidence And Closeout

Task Session writes only `work-pack/session-evidence/<SWU-ID>/`; the lifecycle
owner writes only `work-pack/owner-evidence/<SWU-ID>/owner-receipt.json`.
Invoke Refresh consumes both. A passing predecessor makes only its declared
successor eligible; no successor is selected.
