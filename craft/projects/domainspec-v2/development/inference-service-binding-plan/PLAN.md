# DomainSpec v2 inference service binding plan

## vLLM engine configuration

Real Qwen/Qwen3.8-27B integration verified through the existing SSH tunnel and Alch/DomainSpec service: JSON and SSE completed with nonempty text and usage, about 2.35 seconds each. Local 228-test candidate remains verified. Prototype is usable at the running local endpoint; broader workloads, remote cancellation and deployment remain separate.
[Setup, protocol limits and open questions](../../../../../cyberAlchemy-v2/language/capabilities/alchlang/plans/general-compiler-v1/extensions/inference-router-v1/local-pattern/vllm/README.md).

## Complete mocked reference product

Operator review follow-up complete: nested SIGINT/SIGTERM cancellation and failed-suite receipts tested; 217 tests pass against the revised 1465-file workspace candidate. No remaining implementation blocker in the documented mock reference scope. Live issuer/engine, standalone protected distribution and deployment remain separate.
[Operator guide and open questions](../../../../../cyberAlchemy-v2/language/capabilities/alchlang/plans/general-compiler-v1/extensions/inference-router-v1/local-pattern/product/OPERATOR.md). This is a workspace kit; the public bundle is standalone, while protected/durable rehearsal uses the paired source checkouts.

## Protected/durable product rehearsal

Combined protected/durable HTTP rehearsal passed all 15 checks using Auth Foundation signature verification and Rust authorization, mock inference, encrypted SQLite, clean process restart and SIGKILL recovery. Next: consolidate operator instructions and package/validate the complete reference product for review. No LLM or live issuer required for this fixture rehearsal.
[Evidence and open questions](../../../../../cyberAlchemy-v2/language/capabilities/alchlang/plans/general-compiler-v1/extensions/inference-router-v1/local-pattern/protected-rehearsal/README.md). The accepted public/memory bundle remains unchanged. Online introspection is a fixture; live issuer behavior is not claimed.

## Mock product demo follow-up

Mock product demo and API walkthrough complete: one command verifies the accepted bundle, starts two mock engines, runs 11 API checks and cleans up; five lifecycle tests pass. Next construction: integrated protected/durable API rehearsal with existing Auth Foundation and mocks, then consolidated product acceptance evidence. No local LLM required.
[Instructions and open questions](../../../../../cyberAlchemy-v2/language/capabilities/alchlang/plans/general-compiler-v1/extensions/inference-router-v1/local-pattern/demo/README.md). The accepted bundle and acceptance decision are unchanged.

## Accepted local inference reference pattern

The user accepted the exact tested reference pattern. [Decision](../../../../../cyberAlchemy-v2/language/capabilities/alchlang/plans/general-compiler-v1/extensions/inference-router-v1/local-pattern/ACCEPTANCE.json) binds the verified bundle and evidence. LP-06 is complete; no required pattern work remains. Actual engine compatibility and deployment remain separate.

## Current local inference scope

The owner selected the [local inference pattern](../../../../../cyberAlchemy-v2/language/capabilities/alchlang/plans/general-compiler-v1/extensions/inference-router-v1/local-pattern/DESIGN-AND-PLAN.md).
Local inference pattern validated: 205 tests plus standalone launcher smoke; explicit loopback/auth policy, opt-in outbound v2 deadlines, generated portable Node bundle and canonical protocol. Next: review the exact candidate. Actual local-engine compatibility, context/tokenizer evidence and hardware budgets are optional operational follow-ups; no commercial provider selection required.

Earlier follow-up sections below are chronological evidence, not the current work queue.
Existing Auth Foundation and durable custody semantics are preserved.

Status: ISB-01 through ISB-09 completed as local candidates, 2026-09-07. Authority effect: none.
Craft context: `CTX-DSV2-INFERENCE-SERVICE-BINDINGS`.

The [shared Alch/DomainSpec plan](../../../../../cyberAlchemy-v2/language/capabilities/alchlang/plans/general-compiler-v1/extensions/inference-router-v1/SERVICE-PLAN.md) owns the sequence, acceptance checks,
operational residue and open questions. The paired Alch Craft context is
`CTX-LANGUAGE-ALCH-INFERENCE-SERVICE`. This is a linked workstream, not a duplicate
plan or an update to the admitted meta-type baseline.

Current findings: [ISB-01 support matrix](../../../../../cyberAlchemy-v2/language/capabilities/alchlang/plans/general-compiler-v1/extensions/inference-router-v1/SUPPORT-MATRIX.md).

Contract candidate: [ISB-02 definitions and runtime dependencies](../../../../../cyberAlchemy-v2/language/capabilities/alchlang/plans/general-compiler-v1/extensions/inference-router-v1/service-contracts-v1/README.md).

ISB-03 evidence: [generated discovery and public error policy](../../../../../cyberAlchemy-v2/language/capabilities/alchlang/plans/general-compiler-v1/extensions/inference-router-v1/discovery/README.md).

ISB-04 evidence: [generated public service assembly](../../../../../cyberAlchemy-v2/language/capabilities/alchlang/plans/general-compiler-v1/extensions/inference-router-v1/service/README.md).

ISB-05 evidence: [generated provider invocation](../../../../../cyberAlchemy-v2/language/capabilities/alchlang/plans/general-compiler-v1/extensions/inference-router-v1/invocation/README.md).

ISB-06 evidence: [generated stream lifecycle](../../../../../cyberAlchemy-v2/language/capabilities/alchlang/plans/general-compiler-v1/extensions/inference-router-v1/stream/README.md).
91 inference/service tests, six DomainSpec contract tests and three existing
service compatibility tests pass. The candidate stream contract validates typed
frames and terminal transitions; native adapters own bounded byte I/O.

ISB-07 evidence: [generated request custody](../../../../../cyberAlchemy-v2/language/capabilities/alchlang/plans/general-compiler-v1/extensions/inference-router-v1/custody/README.md).
98 inference/service tests, 14 DomainSpec contract tests and three existing
service compatibility tests pass. Atomic memory reservation, opaque attempt
tokens and independent outcome/settlement retention are bound to generated policy.

ISB-08 evidence: [independent quote service and native responsibility audit](../../../../../cyberAlchemy-v2/language/capabilities/alchlang/plans/general-compiler-v1/extensions/inference-router-v1/reuse/README.md).
106 service tests, 14 DomainSpec contract tests and three compatibility tests pass.
No compiler/runtime changes were needed for this independent Node fixture.

ISB-09 design approval: [approved structural model](../../../../../cyberAlchemy-v2/language/capabilities/alchlang/plans/general-compiler-v1/extensions/inference-router-v1/security/README.md).
ISB-09 is now implemented as the final local candidate: closed DomainSpec security
profile, explicit Alch route access, current Auth Foundation checks and tenant/principal
custody. 121 service tests, 16 contract tests and three compatibility tests pass.
[Implementation and remaining questions](../../../../../cyberAlchemy-v2/language/capabilities/alchlang/plans/general-compiler-v1/extensions/inference-router-v1/security/IMPLEMENTATION.md).

## DomainSpec ownership

- ISB-01: audit existing declarative compiler, system-integration and runtime
  contracts with executable witnesses; classify actual gaps by layer.
- ISB-02: reuse or define normalized service, invocation, stream and custody
  contracts with closed validation and explicit unsupported cases.
- ISB-03–07: extend only proved compiler gaps and supply reusable typed runtime
  ports/conformance; Alch owns syntax, lowering and public service adoption.
- ISB-08: verify generated inference and an independent service fixture against
  the shared contracts and current evidence.
- ISB-09: tenant authentication and authorization last, as the owner requested.

Product frontier: ISB-01 passed 17 support tests and 47 inference regressions.
ISB-02 contracts, ISB-03 discovery and ISB-04 public service assembly are complete.
ISB-05 provider invocation/composition is complete; ISB-07 request custody is complete; ISB-08 independent service reuse is complete; ISB-09 Auth Foundation tenant security is complete as the final local candidate.
ISB-05 passed 79 inference/service tests, 14 DomainSpec contract/composition tests
and three legacy service tests. The sibling compiler now exports the candidate
normalized outbound contract and experimental HTTP dependency types. ISB-04 passed 69 service/inference
tests and three existing multi-entry service tests; no DomainSpec compiler source
was changed by that unit. ISB-03 made no DomainSpec compiler source
changes; the sibling binding was refreshed for existing composition/snapshot updates.
Operational support: compiler owners maintain local build bindings; storage and
platform operators own later durability/deployment choices. None is currently
shown to block the bounded audit. No external effect or frozen-source mutation is
included. Future construction retains the D65 chain in the shared plan.

## Live service-client follow-up

[Live rehearsal](../../../../../cyberAlchemy-v2/language/capabilities/alchlang/plans/general-compiler-v1/extensions/inference-router-v1/security/live/README.md) passed 12 checks against
the existing HTTPS Keycloak issuer, with a disposable policy and provider. Browser
handoff and explicit session enrollment remain next product work.

## Browser consumer follow-up

[Browser handoff and enrollment](../../../../../cyberAlchemy-v2/language/capabilities/alchlang/plans/general-compiler-v1/extensions/inference-router-v1/security/browser/README.md) pass 13 lifecycle tests
and seven live-browser checks. Application request interception is explicit test
transport; trusted TLS ingress/callback-origin integration remains next.

## Trusted HTTPS ingress follow-up

[Real HTTPS ingress](../../../../../cyberAlchemy-v2/language/capabilities/alchlang/plans/general-compiler-v1/extensions/inference-router-v1/security/ingress/README.md) passed eight live checks
without application request interception. The temporary callback registration was
restored. Regression suites: 121 service, 13 lifecycle, two socket and three
compatibility tests. Durable session/revocation design remains next.

## Durable application authentication state follow-up

[Encrypted SQLite state](../../../../../cyberAlchemy-v2/language/capabilities/alchlang/plans/general-compiler-v1/extensions/inference-router-v1/security/durable/README.md) preserves established sessions and
revocation across restart. Independent connections, abrupt writer exit and
fail-closed storage pass. Validation: 27 authentication, 121 service, two TLS
and three compatibility tests. Current operator policy and Rust authorization
remain owners of grants. Next construction work: bounded token renewal.
Operational support: key custody, backup policy and deployment are operator-owned
residue; no running service was switched.

## Bounded browser renewal follow-up

[OIDC renewal](../../../../../cyberAlchemy-v2/language/capabilities/alchlang/plans/general-compiler-v1/extensions/inference-router-v1/security/renewal/README.md) preserves original session deadlines,
rotates cookie/CSRF and revokes the previous token. Expired access tokens cannot
invoke inference; no inference replay occurs automatically. Validation: 38
authentication, 121 service, two TLS, three compatibility tests and seven real
Keycloak/browser checks with encrypted SQLite reopening. The application browser
transport is intercepted locally; no running host was replaced.
Next construction: durable inference request custody. Operator key operations,
issuer-wide logout and deployment remain separate residue.

## Durable inference request custody follow-up

[Explicit bounded-sqlite custody](../../../../../cyberAlchemy-v2/language/capabilities/alchlang/plans/general-compiler-v1/extensions/inference-router-v1/security/durable-custody/README.md) preserves scoped reservations,
attempts and JSON replay across restart. Generated policy remains the decision
owner; current authorization still gates replay. Interrupted requests remain
unresolved and cannot automatically execute again. Validation: 13 durability,
121 service, 38 authentication, two TLS and three compatibility tests.
Next construction: operator reconciliation of uncertain outcomes. Key/backup
operations and deployment are separate operator-owned residue.

## Trusted operator reconciliation follow-up

[The reconciliation port](../../../../../cyberAlchemy-v2/language/capabilities/alchlang/plans/general-compiler-v1/extensions/inference-router-v1/security/reconciliation/README.md) requires current operator
authorization, trusted terminal evidence and an unchanged reviewed record. Atomic
closure fences late workers, preserves write-once outcomes and records encrypted
operator/evidence metadata under existing retention. Reconciliation does not
dispatch another inference. Validation: 28 custody/reconciliation, 121 service,
38 authentication, two TLS and three compatibility tests.
Next construction: provider-specific evidence verification. Management HTTP,
audit export, keys and deployment remain separately owned integrations.

## Provider evidence readiness

[Source inspection and plan](../../../../../cyberAlchemy-v2/language/capabilities/alchlang/plans/general-compiler-v1/extensions/inference-router-v1/security/provider-evidence/PLAN.md) confirm that the current
provider protocol is fixture-only and lacks durable provider-operation correlation.
The first real provider/API product must be selected before provider-specific
verification can be implemented. Existing reconciliation remains the tested
candidate; this planning step changes no runtime behavior.

## Open Questions

Owned by the [shared plan's Open Questions](../../../../../cyberAlchemy-v2/language/capabilities/alchlang/plans/general-compiler-v1/extensions/inference-router-v1/SERVICE-PLAN.md#open-questions).
