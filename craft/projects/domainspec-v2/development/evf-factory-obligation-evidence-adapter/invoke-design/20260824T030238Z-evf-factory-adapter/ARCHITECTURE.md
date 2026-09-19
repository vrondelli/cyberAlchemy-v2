---
artifact: invoke-design
module: evf-factory-obligation-evidence-adapter
status: candidate-owner-gated
updatedAt: 2026-08-24
docType: architecture-bundle
authority_effect: none
---

# Architecture: EVF-To-Factory Obligation/Evidence Adapter

## Design intent

Connect one exact EVF obligation to verified factory evidence without moving obligation meaning into the factory, moving the factory lifecycle into EVF, or moving TLA/TLC semantics into the adapter. The adapter is a thin, versioned identity-and-taxonomy bridge. It is absent today.

## Source contracts

See `SOURCE-CONTRACTS.md` and `SOURCE-INVENTORY.json`. The accepted direction is `FMP-EVF-B`; the exact schema bytes and protected owner assignments remain unaccepted.

## View 1: Context

```text
EVF obligation owner
  | exact obligation + bounded claim
  v
versioned obligation/evidence adapter  [proposed; absent]
  | closed factory request binding
  v
architecture-conformance factory       [implemented lifecycle]
  | registered provider invocation
  v
TLA/TLC provider                        [planned semantics]

verified factory evidence
  -> adapter identity/currentness/ceiling checks
  -> immutable bounded EVF evidence handle
```

The consumer sees an EVF-owned handle. The factory remains the owner of lock, run, replay, verification, reproduction, accounting verification, semantic receipt, and atomic evidence publication. The provider remains the owner of solver interpretation and corpus meaning.

## View 2: High-level structure

| Part | Owns | Must not own |
| --- | --- | --- |
| EVF obligation boundary | obligation identity, expected evidence meaning, evaluator vocabulary, consumer handle meaning | TLC execution, factory verification, provider receipt publication |
| obligation translator | exact mapping to a factory request and declared provider selector | expected-outcome invention, provider implementation, factory execution |
| evidence translator | exact join of obligation/request/lock/provider/receipt/currentness; result mapping; narrowest ceiling | replay, accounting verification, receipt repair, wider claims |
| architecture-conformance factory | registry, closure, lock, snapshot, run/repeat, replay, verify, reproduce, accounting validation, receipt, evidence publication | EVF obligation meaning, TLA verdict semantics |
| TLA/TLC provider | model/config decoding, Java/JAR requirements, bounded TLC, total result classification, normalized model evidence, corpora | EVF consumer semantics, generic factory lifecycle |

The two adapter responsibilities share one version and identity relation. They are conceptually separate but cannot be released independently until the exact request-to-receipt join is proven.

## View 3: Low-level components

### `ObligationBinding`

Candidate field classes, not accepted JSON fields:

- adapter version;
- obligation identity and digest;
- EVF expectation/verdict-vocabulary reference;
- obligation claim ceiling;
- declared provider ID/version;
- derived factory request identity/digest;
- authority effect none.

### `VerifiedFactoryEvidenceBinding`

- request digest;
- lock digest;
- semantic-receipt digest and run identity;
- target node ID, provider ID/version, semantic and replay digests;
- complete proof accounting;
- factory-owned verification/currentness binding;
- node and run claim ceilings;
- authority effect none.

### `ProviderVerdictProjection`

- provider-owned total result class;
- recognized EVF temporal-evaluator result class;
- normalized semantic/counterexample handle;
- exact expected-red case/property/result identity when applicable;
- typed rejection for unknown, incomplete, fatal, timeout, signal, output-limit, missing-marker, wrong-property, or unexpected-red results.

### `EVFEvidenceHandle`

- stable identity/digest over the accepted binding fields;
- EVF-owned bounded verdict and residue;
- exact references needed to reproduce the join;
- narrowest applicable claim ceiling;
- authority effect none.

### Three different evidence meanings

1. **Obligation translation** proves only that the exact EVF obligation was mapped to the exact factory request under one adapter version.
2. **Factory lifecycle evidence** proves only that the factory locked, ran, replayed, verified, and recorded the exact provider result under its bounded ceiling.
3. **Provider semantic verdict** explains only what the solver-specific result means for the exact model/case/property.

The adapter output is valid only when all three are bound. None substitutes for another.

## View 4: Workflow process

1. EVF supplies one exact obligation, its digest, expected evidence meaning, and claim ceiling.
2. The adapter validates its supported schema version and declared provider selector.
3. The adapter deterministically derives a closed factory request binding; it does not invent an expectation.
4. The factory resolves the registered provider, closes the lock, snapshots declared material, and invokes the provider.
5. The provider returns a total classified solver result, normalized semantic evidence, accounting, ceiling, and authority none through the common provider seam.
6. The factory repeats, compares, verifies accounting, writes the semantic receipt, verifies the complete run root, and retains replay/reproduction evidence through its existing lifecycle.
7. The adapter consumes only the factory-owner-approved verified/current evidence binding.
8. The adapter rejects any obligation/request/lock/provider/version/receipt/currentness/accounting/result/ceiling mismatch.
9. The adapter maps a recognized provider result into EVF's bounded evaluator vocabulary.
10. EVF exposes a new immutable evidence handle to its consumer.

No step repairs inputs, broadens a claim, publishes authority, or claims model-to-implementation conformance.

## View 5: Decision flow

```text
Exact supported EVF obligation and digest?
  no -> block: OBLIGATION_UNBOUND
  yes
    Declared provider ID/version accepted by both boundaries?
      no -> block: PROVIDER_UNSUPPORTED
      yes
        Exact factory request binding reproduced?
          no -> block: REQUEST_BINDING_MISMATCH
          yes
            Factory lock and semantic receipt bind the same request/provider/node?
              no -> block: FACTORY_IDENTITY_MISMATCH
              yes
                Factory-owned verification/currentness/replay evidence passes?
                  no -> block: FACTORY_EVIDENCE_NOT_CURRENT
                  yes
                    Accounting complete and provider taxonomy recognized?
                      no -> block: PROVIDER_EVIDENCE_INCOMPLETE
                      yes
                        Output ceiling no wider than every input ceiling?
                          no -> block: CLAIM_CEILING_INFLATION
                          yes -> emit bounded immutable EVF evidence handle
```

Expected-red is accepted evidence only for the exact declared case, property, and expected result. It is not a generic pass.

## View 6: Dependency and interface

| Interface | Producer owner | Consumer owner | Version/binding rule | Failure rule |
| --- | --- | --- | --- | --- |
| EVF obligation input | EVF | adapter | exact accepted schema/version and obligation digest | missing/stale/unsupported blocks |
| factory request binding | adapter with factory contract | factory | deterministic request digest and declared provider ID/version | mismatch or ambient provider choice blocks |
| provider semantic result | TLA/TLC provider | factory | registered provider contract and total taxonomy | fatal/partial/unknown never passes |
| factory verified evidence | factory | adapter | request/lock/receipt/node/provider/currentness/replay exact join | stale, unverified, incomplete, or foreign blocks |
| EVF evidence handle | adapter under EVF contract | EVF consumer boundary | immutable exact join and narrowest ceiling | any wider or unreproducible handle blocks |

### Dependency rules

1. The adapter references factory evidence; it does not copy or recreate factory lifecycle behavior.
2. The adapter references provider semantic meaning; it does not classify raw TLC logs itself.
3. EVF owns the final vocabulary and consumer-facing meaning; the adapter cannot promote a provider-local result into a broader EVF claim.
4. Versions are explicit data at both boundaries. Ambient discovery or “latest” selection is forbidden.
5. A receipt from a different request, lock, run, node, provider, or adapter version is foreign evidence.
6. The exact factory verification/currentness representation is accepted only by the factory and EVF owners.

## Significant behavior scenario

| Stimulus | Preconditions | Ordered response | Failure/recovery | Observable evidence | Acceptance owner |
| --- | --- | --- | --- | --- | --- |
| EVF asks for temporal evidence for one exact ordering obligation | accepted adapter schemas; registered compatible TLA provider; exact obligation digest and ceiling | map obligation -> factory request; factory runs/verifies provider; adapter joins exact identities and maps recognized verdict; EVF receives immutable handle | any mismatch returns typed block; no automatic retry, repair, fallback provider, or weaker pass | obligation/request binding, lock digest, semantic receipt digest, node semantic/replay digests, accounting, verification/currentness binding, output handle digest | EVF contract owner with factory and provider owner acceptance on their surfaces |

## Concern-to-view trace

| Concern | Class | Disposition | Owners | Views/extensions | Evidence |
| --- | --- | --- | --- | --- | --- |
| `concern:authority` | authority | required | DomainSpec primary owner; EVF/factory/provider contributors | all views; `architecture:authority-trust` | accepted decision; authority-none contracts |
| `concern:failure` | failure | required | EVF contract owner; factory/provider contributors | workflow and decision flow; `architecture:failure-compensation` | fail-closed rules and planned negatives |
| `concern:integration` | integration | required | EVF contract owner; factory/provider contributors | low-level and dependency views; `architecture:integration-versioning` | versioned boundary and exact digests |
| `concern:validation` | validation | required | adapter Design owner; EVF/factory/provider contributors | all views; `validation-contracts` | deterministic Design selection and planned witnesses |

## Planned witness contracts

All witnesses in `PLANNED-WITNESSES.json` are unimplemented and unexecuted Design contracts. They include one positive exact round-trip and negatives for stale/foreign identities, unsupported versions, incomplete accounting, unknown provider verdicts, expected-red mismatch, verification/currentness failure, and ceiling inflation.

## Triggered extensions

- `architecture:authority-trust`: explicit authority-none and role boundaries.
- `architecture:failure-compensation`: fail closed; no repair, retry, fallback provider, or weakened verdict.
- `architecture:integration-versioning`: exact version/digest compatibility at both adapter interfaces.
- `validation-contracts`: planned schema, fixture, and validator contracts only.

No UX, persistence/concurrency, migration/rollout, data lifecycle, security/abuse, or performance extension is selected by the closed denominator.

## Design decisions and risks

See `DECISIONS-RISKS.md`.

## Downstream planning notes

Normal Plan is not ready. Before Plan, exact schema bytes and negative fixtures require EVF-owner acceptance; the exact verification/currentness handle requires factory-owner acceptance; provider taxonomy/version compatibility requires provider-owner acceptance; and the primary owner must assign protected roles. Planned witnesses begin Plan at `plan-evidence-pending` and must be materialized and run there.

## Design transport

This candidate may be handed only to those owner gates or a bounded Design repair. It must not be treated as an accepted schema, work pack, implementation task, selected SWU, runtime invocation, or evidence that EVF currently invokes FMP.

## Gate result

- Phase status: `flag`
- Design selection evidence: pending deterministic validation at author time
- Reason: the architecture unit is coherent and source-bound, but exact protected schema/fixture/owner choices remain unaccepted
- Plan evidence: `plan-evidence-pending`
- Authority effect: `none`
