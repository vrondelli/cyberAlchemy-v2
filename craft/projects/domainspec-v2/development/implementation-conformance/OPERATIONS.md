# Operations: DomainSpec Implementation Conformance

## AuthorImplementationConformanceProfile

**Type:** Operation
**Actor:** external implementation-conformance owner or delegated profile author
**Triggers:** an admitted semantic profile needs a bounded implementation realization

### Input

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `profile_id` | string | yes | stable implementation-profile identity |
| `semantic_profile_ref` | id/version/digest | yes | existing admission owner reference |
| `source_classes` | array | yes | recognized source classifications |
| `language_realizations` | array | yes | TypeScript, Python, and/or Rust contracts |
| `evaluators` | array | yes | stable evaluator IDs, versions, input/output contracts |
| `obligation_refs` | array | yes | existing obligation/rule references |
| `exclusions` | array | yes | bounded unsupported or out-of-scope constructs |
| `claim_limits` | array | yes | explicit non-claims |

### Rules

| ID | Rule | Formal |
| --- | --- | --- |
| ICP-P1 | Semantic profile must resolve to an existing digest-bound owner record. | `resolve(profileRef) = exactly_one` |
| ICP-P2 | Implementation profile cannot admit a semantic kind or relationship. | `implementationAdmission ⊄ semanticAdmission` |
| ICP-P3 | Every evaluator declares language, version, inputs, outputs, unsupported behavior, and claim limit. | `∀e. complete(e)` |
| ICP-P4 | General exception acceptance is absent from the initial profile. | `acceptanceOwner = none` |

### Postconditions

- A closed candidate profile is produced for owner review.
- No semantic registry, code-tag schema, obligation IR, or authority record changes.

### Error States

| Condition | Result |
| --- | --- |
| stale/missing semantic profile digest | `DSV2-PROFILE-STALE` |
| evaluator lacks unsupported or claim-limit contract | `DSV2-EVALUATOR-INCOMPLETE` |
| profile attempts semantic admission or authority movement | `DSV2-AUTHORITY-COLLAPSE` |

## ReconcileImplementationBinding

**Type:** Operation
**Actor:** implementation-conformance evaluator
**Triggers:** a selected profile supplies admitted concepts and code-tag projections

### Input

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `concept_ref` | canonical id/kind/profile digest | yes | admitted semantic identity |
| `tag_mapping` | code-tag tuple | yes | intended sole mapping owner after reformulation |
| `generated_index_row` | projection | yes | extracted mapping index |
| `derivation_binding` | optional projection | no | strategy, fixtures, coverage; duplicated symbol fields reconciled |
| `source_digest` | SHA-256 | yes | current source unit digest |

### Ordered Rules

1. Resolve semantic profile admission separately from registry membership.
2. Require exactly one code-tag mapping for each in-scope concept.
3. Resolve exactly one language source unit and callable entry point.
4. Recompute and compare source and projection digests.
5. Reconcile duplicated sidecar module/symbol fields or fail closed.
6. Report orphan source leaves and unbound admitted concepts independently.

### Error States

| Condition | Result |
| --- | --- |
| no binding | `DSV2-BINDING-UNRESOLVED` |
| multiple admitted bindings | `DSV2-BINDING-DUPLICATE` |
| stale source/projection digest | `DSV2-GENERATED-STALE` |
| unregistered Rule leaf | `DSV2-RULE-ORPHAN` |
| tag/index/sidecar disagreement | `DSV2-BINDING-DISAGREEMENT` |

## EvaluateImplementationConformance

**Type:** Operation
**Actor:** implementation-conformance evaluator
**Triggers:** a closed profile, reconciled bindings, obligations, and native bundles are supplied

### Input

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `profile` | `ImplementationConformanceProfile` | yes | candidate or admitted implementation profile |
| `bindings` | `ImplementationBinding[]` | yes | exact reconciled bindings |
| `obligations` | existing `Obligation[]`/`RuleSet` ref | yes | owner-held derivation input |
| `native_bundles` | `NativeEvaluationBundle[]` | yes | language-owned evidence |
| `runtime_evidence` | fixture results | conditional | required only for selected runtime contracts |

### Ordered Rules

1. Verify every input/version/digest before interpreting evidence.
2. Evaluate exact binding cardinality and callable shape.
3. Evaluate the selected source-graph contract: direct edge, direction, cycles,
   unresolved targets, barrels/re-exports, and unsupported constructs.
4. Attach native style/type/exhaustiveness evidence without reimplementing it.
5. Evaluate generated freshness and skipped evidence.
6. Evaluate selected runtime contracts against named valid/invalid outcomes.
7. Normalize to `pass`, `fail`, or `unsupported` while retaining raw diagnostics.
8. Emit a generated receipt. Never accept an exception or authorize promotion.

### Error States

| Condition | Result |
| --- | --- |
| Rule root is empty | `DSV2-RULE-ROOT-EMPTY` |
| use edge is indirect under direct-leaf policy | `DSV2-USE-EDGE-NONDIRECT` |
| Rule imports use case/adapter or graph cycles | `DSV2-MODULE-DIRECTION`, `DSV2-MODULE-CYCLE` |
| dynamic/indeterminate source construct | language-specific `fail` or blocking `unsupported` |
| native evidence skipped | `DSV2-EVIDENCE-SKIPPED` |
| native suppression hides a finding | finding retained plus `DSV2-EXCEPTION-INVALID` |
| new state is non-exhaustive | native failure normalized as `DSV2-STATE-NONEXHAUSTIVE` |
| invalid transition succeeds | `DSV2-TRANSITION-ACCEPTED-INVALID` |

## EvaluateStateMachineRuntimeContract

**Type:** Operation
**Actor:** application-owned fixture harness; package consumes its evidence
**Triggers:** the selected profile binds a canonical State Machine to an application fixture

### Input

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `state_machine_ref` | canonical id/profile digest | yes | existing semantic identity |
| `states` | enum/set | yes | admitted runtime states |
| `transitions` | runtime transition rows | yes | nested application contract data |
| `guard_binding` | Rule binding | yes | guard callable |
| `valid_fixture` | named input/expected result | yes | happy path |
| `invalid_fixture` | named input/expected rejection | yes | negative path |
| `effect_intent` | value | yes | intended effect, not delivery proof |

### Postconditions

- Runtime evidence is attached separately from compiler exhaustiveness and
  source topology.
- Persistence, concurrency, retries, cancellation, idempotency, effect delivery,
  and compensation remain outside the initial contract.
