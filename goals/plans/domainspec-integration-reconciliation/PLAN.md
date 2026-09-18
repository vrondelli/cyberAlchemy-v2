# DomainSpec integration reconciliation plan

Status: candidate planning artifact  
Authority effect: none  
Implementation effect: none

## Outcome

Reconcile the 36 integration definitions with the current DomainSpec product so that persistence, messaging, external APIs, and ORODI observation compose through the same provider-neutral graph and generate coherent TypeScript, Python, and Rust projects.

This plan does not add integration concepts to the 13 domain meta-types. It connects existing domain meaning to external mechanics through contracts, mappings, policies, and bindings.

## Current result

The current product is not starting from zero:

- D45–D49 have an admitted provider-neutral formation profile and three language profiles.
- The CLI validates D45–D49 binding sets and renders responsibility-named TypeScript types, Python Protocols, and Rust traits.
- Messaging has a narrow additive candidate for Event publication, at-least-once delivery, provider acceptance, dead-lettering, and a fixed consumer inbox deduplication owner.
- Project composition has separate endpoint and external integration experiments.
- ORODI has bounded observation, replay, and evaluation contracts.
- Reconciled application and project layouts already exist for TypeScript, Python, and Rust.

The pieces do not yet form one coherent integration model. The matrix classifies the 36 concepts as:

| Status | Count | Meaning |
| --- | ---: | --- |
| Bounded | 1 | Current implementation preserves the concept within a narrower claim. |
| Partial | 24 | Some structure exists, but semantic or executable surfaces are incomplete. |
| Absent | 6 | No first-class selected consumer exists. |
| Conflict | 5 | Current structure collapses a distinction required by the definitions. |

## Five conflicts to remove first

1. `Event` is referenced directly by transport bindings instead of mapping to a distinct `Message`.
2. `MessageChannel` uses `delivery` and `dead-letter` purposes instead of distinguishing queue, topic, stream, and dead-letter semantics.
3. `provider-accepted` conflates producer acceptance with consumer acknowledgement and application completion.
4. `TransportFailurePolicy` combines D48 classification with retry and terminal continuation.
5. System-integration artifacts use a separate `src/domainspec/system-integration/<language>` path that is not composed with the reconciled project layout.

## Target composition

```text
Domain graph
  Entity / Value / Enum / Sum / Event / Operation / Query / Workflow
          |
          +---- Mapping --------------------------------------+
          |                                                   |
          v                                                   v
Concern-Specific Dependency Contract (D45)        Inbound Application Boundary
          |                                                   |
          +---------------- Integration Binding --------------+
                                      |
                    +-----------------+------------------+
                    |                 |                  |
             Persistence       Message transport    External API
             D46 / D47         publish / subscribe  inbound / outbound
                    |                 |                  |
                    +-----------------+------------------+
                                      |
                         Provider Realization
                                      |
                          bounded Runtime Receipt
                                      |
                         Integration Observation
                                      |
                         one-way ORODI projection
```

## Product-construction lane

### R1 — Ontology scaffold and traceability

Represent all 36 definitions, specialization edges, and 15 non-collapse laws as agent-facing navigation records. Bind every record to the definition-pack digest. This scaffold has no admission or implementation authority.

Done when:

- all definition IDs resolve exactly once;
- all relationships and non-collapse laws are machine-checkable;
- changed definition bytes fail closed;
- the scaffold contains no provider selection or runtime claim.

### R2 — Shared integration contract kernel

Create the common discriminated envelopes that the specialized concerns reuse:

- `IntegrationBinding`
- `ProviderProfile`
- `ProviderRealization`
- `SerializationProfile`
- `RuntimeReceipt`
- D48-preserving failure mappings

This wave must retain the current D45–D49 profile as a compatible semantic base. It must not create a universal `Port`.

### R3 — Persistence composition

Make `logical_physical_mapping_ref` resolve to a typed mapping model covering entity identity, value objects, enums, sum variants, optional/list/set cardinalities, entity references, indexes, and conversion rules. Add physical migration contracts and preserve D47 as one explicit local commit boundary.

### R4 — Messaging composition

Replace the combined transport record with orthogonal graph nodes:

```text
Event -> Mapping -> Message -> PublicationBinding -> Channel
Channel -> SubscriptionBinding -> Mapping -> Operation
```

Channel is a closed discriminated family: queue, topic, stream, or dead-letter. Delivery, producer acceptance, consumer acknowledgement, ordering, deduplication, and D48 failure classification remain separately selectable.

Compatibility rule: the current narrow publish/subscribe JSON can be decoded only through an explicit legacy-to-v2 projection that preserves its weaker claims. It cannot silently acquire topic, subscription, application-commit, or exactly-once semantics.

### R5 — External API composition

Move the useful project-composition endpoint and transport experiments behind the shared kernel:

- inbound endpoint binding;
- outbound external API contract and binding;
- webhook specialization;
- authentication binding containing references, never secret values;
- resilience policy with retry safety and idempotency requirements;
- protocol/provider failure mapping to D48 outcomes.

Application operations remain protocol-independent, and request/response conversions remain declared Mappings.

### R6 — Receipts and ORODI observation

Create one bounded integration receipt shape and one disclosure-safe integration observation shape. Connect them through a one-way ORODI projection:

```text
runtime -> receipt/observer -> ORODI adapter -> ORODI evaluator
```

No reverse control edge is permitted. ORODI cannot select retries, write provider state, call APIs, deploy, or enact business effects through this binding.

### R7 — Three-language generation and coherent layout

Generate equivalent contracts and binding composition for TypeScript, Python, and Rust. Project every artifact through the existing reconciled project layout instead of creating a generic runtime directory.

Expected responsibility placement:

| Responsibility | Project role |
| --- | --- |
| Domain contracts and logical types | feature/domain |
| Application dependency contracts and operation bindings | feature/application |
| Provider adapters | integrations/providers |
| Serialization and physical mappings | integrations/mappings |
| Configuration and credential references | config/integrations |
| Database migrations | migrations |
| Runtime receipts and observation adapters | observability/integrations |

Each language profile chooses idiomatic file and module spellings while preserving those responsibilities and dependency direction.

### R8 — Cross-language product tests

Keep only tests that protect product meaning or an executable boundary:

- positive formation and generated-code compile tests;
- hostile non-collapse tests;
- TypeScript/Python/Rust semantic-equivalence fixtures;
- deterministic output and import-closure checks;
- one persistence provider fixture, one queue/topic fixture, and one HTTP fixture for bounded runtime observation;
- ORODI no-return-edge tests;
- legacy compatibility tests for the current narrow messaging input.

Fixture repositories must be disposed after each run; generated dependency caches must not be copied into per-case output.

### R9 — Exact product candidate

Freeze one exact candidate only after R8 passes. Bind its source digest, generated artifacts, test denominator, environment, and claim ceiling. Then present it for product review. Product review does not grant admission, release, deployment, or provider authority.

## Operational-support lane

| Task | Owner | Affected stage | Current posture |
| --- | --- | --- | --- |
| Disposable PostgreSQL, broker, and HTTP fixtures | DomainSpec test-environment owner | R8 | Deferred; not a blocker before R8. |
| Packaging and release integration | DomainSpec release owner | After R9 | Deferred; not part of product construction. |

No operational task currently blocks R1.

## Implementation sequence

```text
R1 -> R2 -> R3 ─┐
          -> R4 ─┼-> R6 -> R7 -> R8 -> R9
          -> R5 ─┘
```

R3, R4, and R5 can run in parallel after the shared R2 kernel is stable. R6 joins their receipts/failures. R7 is the first point where all three language generators change together.

## Settled decisions

- Supported implementation languages are TypeScript, Python, and Rust. Kotlin is not in the denominator.
- Integration contracts and bindings are not new domain meta-types.
- Providers cannot redefine domain meaning.
- Queue, topic, stream, and dead-letter are different semantics.
- Mapping owns Event-to-Message and protocol-to-application conversion.
- Calculations do not become mapper dependencies unless their results are explicitly passed as mapper inputs.
- D48 classifies failures; workflow or caller policy selects continuation.
- ORODI observes only.

## Validation

```bash
python3 validate.py
```

The validator checks exact 36-definition coverage, source-byte currency, status totals, evidence closure, work-package dependency closure, language denominator, and the no-authority/no-implementation ceiling.

## Claim ceiling

This is a current-source reconciliation and candidate construction sequence. It is not an admitted Goal plan, implementation authorization, product approval, canonical definition promotion, provider selection, publication, release, deployment, or production evidence.
