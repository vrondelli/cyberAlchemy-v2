# CyberAlchemy Language Project — Craft View

Current inference product: Real Qwen/Qwen3.8-27B integration verified through the existing SSH tunnel and Alch/DomainSpec service: JSON and SSE completed with nonempty text and usage, about 2.35 seconds each. Local 228-test candidate remains verified. Prototype is usable at the running local endpoint; broader workloads, remote cancellation and deployment remain separate.

Current inference status: accepted reference pattern. [Acceptance](capabilities/alchlang/plans/general-compiler-v1/extensions/inference-router-v1/local-pattern/ACCEPTANCE.json). Optional real-engine integration remains separate.

This is the human view of [`.craft/ledger.yml`](.craft/ledger.yml), which is the
machine-readable source of truth. All definitions here are candidate-local.

## Inference service bindings plan — CTX-LANGUAGE-ALCH-INFERENCE-SERVICE

Stage: `plan`; gate: `flag`; ISB-01..09 complete as local candidates; live integration remains separately scoped.
[Work plan](capabilities/alchlang/plans/general-compiler-v1/extensions/inference-router-v1/SERVICE-PLAN.md) records the linked DomainSpec v2 and Alch workstream.
[ISB-01 support matrix](capabilities/alchlang/plans/general-compiler-v1/extensions/inference-router-v1/SUPPORT-MATRIX.md): **17 audit tests and 47 regressions pass**.
[ISB-02 contract candidate](capabilities/alchlang/plans/general-compiler-v1/extensions/inference-router-v1/service-contracts-v1/README.md) now includes the validated Define pack,
service schema, dependency signatures and stream state table.
[ISB-03 generated discovery/error policy](capabilities/alchlang/plans/general-compiler-v1/extensions/inference-router-v1/discovery/README.md): **59 tests pass**, including all 47 baseline behaviors.
[ISB-04 generated public service](capabilities/alchlang/plans/general-compiler-v1/extensions/inference-router-v1/service/README.md): **69 tests pass**, plus three existing service compatibility tests.
[ISB-05 generated provider invocation](capabilities/alchlang/plans/general-compiler-v1/extensions/inference-router-v1/invocation/README.md): **79 inference/service tests pass**, plus 14 DomainSpec and three legacy service tests.
[ISB-06 generated stream lifecycle](capabilities/alchlang/plans/general-compiler-v1/extensions/inference-router-v1/stream/README.md): **91 inference/service tests pass**, plus six DomainSpec contract and three existing service compatibility tests.
[ISB-07 generated request custody](capabilities/alchlang/plans/general-compiler-v1/extensions/inference-router-v1/custody/README.md): **98 inference/service tests pass**, plus 14 DomainSpec contract and three existing service compatibility tests.
[ISB-08 independent service reuse](capabilities/alchlang/plans/general-compiler-v1/extensions/inference-router-v1/reuse/README.md): **106 service tests pass**, plus 14 DomainSpec contract and three existing service compatibility tests.
[ISB-09 structural model approved](capabilities/alchlang/plans/general-compiler-v1/extensions/inference-router-v1/security/README.md).
Final security unit implemented: [ISB-09 evidence](capabilities/alchlang/plans/general-compiler-v1/extensions/inference-router-v1/security/IMPLEMENTATION.md).
[Live service-client rehearsal](capabilities/alchlang/plans/general-compiler-v1/extensions/inference-router-v1/security/live/README.md): **12 checks passed**.
[Browser handoff and enrollment](capabilities/alchlang/plans/general-compiler-v1/extensions/inference-router-v1/security/browser/README.md): **13 lifecycle and seven live-browser checks pass**.
[Real HTTPS ingress](capabilities/alchlang/plans/general-compiler-v1/extensions/inference-router-v1/security/ingress/README.md): **eight live checks and all regression suites pass**.
[Durable encrypted session state](capabilities/alchlang/plans/general-compiler-v1/extensions/inference-router-v1/security/durable/README.md) validated with restart, revocation and storage-failure tests.
[Bounded token renewal](capabilities/alchlang/plans/general-compiler-v1/extensions/inference-router-v1/security/renewal/README.md) validated with 164 tests and seven real issuer/browser checks.
[Durable request custody](capabilities/alchlang/plans/general-compiler-v1/extensions/inference-router-v1/security/durable-custody/README.md) validated with 177 tests.
[Operator reconciliation](capabilities/alchlang/plans/general-compiler-v1/extensions/inference-router-v1/security/reconciliation/README.md) validated with 192 tests.
Historical provider-selection follow-up is deferred; current construction is the local inference pattern.
[Source-backed readiness plan](capabilities/alchlang/plans/general-compiler-v1/extensions/inference-router-v1/security/provider-evidence/PLAN.md); management HTTP and audit export remain separate integrations.
Stream lifecycle, request custody and host migration have source-bound local
conformance evidence. Tenant authentication and authorization completed **ISB-09, last**.

Construction and operational-support queues are separate in the plan. Live
providers, durable storage and deployment do not currently block local support
witnesses. Existing project frontiers and frozen baseline decisions are unchanged.
Open Questions are owned by the linked plan.

## Current state

The package now separates one concept into the meanings needed by different
participants:

| Surface | Term | Meaning |
| --- | --- | --- |
| Business | Recommendation | Evidence-backed advice that does not make or authorize a decision. |
| Governance domain | Rule Review Recommendation | Advice about how a reviewed Governance Rule should be treated. |
| Product | Decision Support Output | The review result shown to help an authorized owner decide. |
| System | Open realization | `DS-D1.2 Value Object` and `DS-D1.1 Entity` remain candidates. |

The root gate is `flag`, not `block`: language work can continue, but DomainSpec
modeling, formalization, and implementation binding cannot select a realization
until the Governance owner answers the identity and lifecycle question.

The Governance kernel input slice now uses one preferred expression across
business, domain, and product language:

| Term | Meaning | DomainSpec candidate realization | Authority boundary |
| --- | --- | --- | --- |
| Governance Program | Named, versioned evaluation instructions. | `DS-D1.1 Entity` | Declares required authority; grants none. |
| Governance Request | One exact proposed consequence. | `DS-D1.2 Value Object` | Is not an owner request, permission, or action. |
| Governance Fact | One verifier-admitted scoped proposition. | `DS-D1.2 Value Object` | Is not Evidence, Authority, or universal truth. |
| Governance Fact Set | Bounded Facts for one Program and Request. | `DS-D1.2 Value Object` | Is not repository state or a lifecycle hash. |

This slice is owner-reviewed candidate language. Its context remains `flag`
because the system-runtime ontology, verifier contracts, Rust types, Runtime
Contract acceptance, and effect adapters do not yet exist.

## Contexts

- `CTX-LANGUAGE-MEANING` owns business, domain, and product meanings.
- `CTX-LANGUAGE-EDGES` owns proposed edge verbs and collision records.
- `CTX-LANGUAGE-REALIZATION` owns the open DomainSpec classification.
- `CTX-LANGUAGE-GOVERNANCE-KERNEL` owns Program, Request, Fact, Fact Set, and
  their CyberAlchemy authority bindings.

## Candidate edge vocabulary

- `offers`: Governance Assessment → Rule Review Recommendation.
- `informs`: Rule Review Recommendation → Governance Decision.
- `requires_facts`: Governance Program → Governance Fact Set.
- `is_evaluated_under`: Governance Request → Governance Program.
- `contains_fact`: Governance Fact Set → Governance Fact.

Both are proposed. Each has a business sentence, product consequence, and a
non-collapse witness in [`edge-vocabulary.json`](edge-vocabulary.json).

## Open decisions

### `DEC-LANGUAGE-REALIZATION-001`

Does Rule Review Recommendation require independent identity and lifecycle, or
is immutable field equality sufficient? Until the owner answers, neither
`Value Object` nor `Entity` is selected.

### `DEC-LANGUAGE-PRODUCES-001`

The Governance product ontology uses `produces` for Capability → Output, while
DomainSpec DS-D2 uses it for Operation → Event. The shared spelling is not
shared meaning. A qualified business verb, explicit bridge, scoped homonym, or
deferral needs owner review.

## Next move

Use the Program–Request–Fact language and
[`authority-bindings.json`](authority-bindings.json) as Define input for the
candidate Governance system-runtime ontology and verifier-contract design. The
Recommendation exercise and `produces` collision remain open independently.

## Boundary

Craft tracks work and residue. This package does not promote definitions, admit
a Discipline, accept a Definition Pack, promote a candidate DomainSpec semantic
mapping into DomainSpec authority, accept a Runtime Contract, authorize
implementation, enforce governance, publish, or deploy anything.
