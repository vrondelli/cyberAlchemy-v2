# Whole-application repair plan (candidate)

Scope: repair the reviewed Commerce application and its TypeScript reference
projection. This is owner-directed product construction, not runtime admission,
release, or deployment.

## Dependency DAG

```text
R0 Baseline: preserve current inputs and identify existing failures
  ├─> R1 Bind SubmitOrder to the request identity with an authored keyed read
  │     └─> R2 Regenerate the exact review application and test cross-ID rejection
  ├─> R3 Carry the authored HTTP route into the provider-generation contract
  │     └─> R4 Generate that route, bound bodies, and hostile HTTP tests
  └─> R5 Audit the provider and integration execution contracts
        ├─> R6 Prevent unimplemented provider commits/outbox drains from claiming success
        └─> R7 Design and test real state/outbox, event production, publication,
              subscription, and outbound execution before runtime claims
R2 + bounded-body portion of R4 + R6 -> R8 Run focused checks, typecheck,
                                           review test, and full suite
R7 + R8 -> R9 Seek separately scoped provider observations and qualification
```

R7 is further ordered as: R7a author payment state and a stable submission
identity; R7b generate and retain the Event occurrence with the state-and-outbox
commit; R7c drain and publish without changing payment state; R7d consume with
a durable inbox and invoke PaymentGateway using that submission identity as its
idempotency key; R7e commit an explicit authorization outcome before message
acknowledgement; R7f test duplicates, restart, publish failure, and ambiguous
provider timeout. The provider payload decision is a prerequisite for R7d,
not for documenting or checking the earlier transaction boundaries.

## Plan review

- R1 uses `read Order key request.id`. An `id` argument on the existing Query
  would not constrain its Rule filter, so it would preserve the cross-ID bug.
- R3 uses an explicit route argument from AlchLang's authored endpoint to the
  provider composer. The composer validates one static POST route and replaces
  the one generated default route in the selected TypeScript, Python, or Rust
  inbound artifact. Direct DomainSpec callers retain their existing `/webhook`
  default. The 64 KiB body bound is currently TypeScript-only.
- R6 is fail-closed containment, not a substitute for R7. A transaction that
  cannot apply a batch must never return `committed`; an outbox drain that
  cannot publish must not imply that it did so.
- R7 needs an exact mapping between logical identities, physical columns,
  Event occurrence construction, outbox rows, and outbound ordering. The
  current generated adapter and source do not supply executable evidence for
  those relationships. The owner has selected post-commit authorization through
  the outbox and runtime-generated Event ID and time; the candidate
  [payment outbox contract](PAYMENT-OUTBOX-CONTRACT.md) fixes the ordered behavior.
  No synthetic PostgreSQL/NATS/payment receipt is invented.
- R8 reports failures by cause. Current P03 source drift, a missing ARE
  semantic adapter, and local-host startup failures are separate from this
  Commerce repair until their owners and exact changes are selected.

The graph is acyclic. The current product frontier is R1–R6 and R8. R7 is a
separately visible construction dependency; R9 is deferred operational qualification.
Nothing in R1–R8 admits production behavior.

## D65 construction and operational lanes

| Field | Current position |
| --- | --- |
| Product frontier | R1–R6 are implemented as a candidate; R8 checks their exact outputs. R7 is the next product-construction frontier. |
| Runnable product work | Specify and implement the logical-to-physical identity/write mapping, Event occurrence source, state-and-outbox transaction, publisher drain, subscriber inbox, outbound call ordering, and equivalent Python/Rust request bounds. |
| Product owner | CyberAlchemy v2 product owner for semantics; AlchLang and DomainSpec compiler owners for projection and tests. |
| Affected stages | Alch source/Realization, typed operation generation, provider composition, PostgreSQL adapter, broker adapter, HTTP adapter, and qualification evidence. |
| Causal blocker | R7 cannot claim execution while Event occurrence and outbound ordering remain un-authored and the generated provider lacks write/outbox implementation. |
| Operational tasks and owner | Product owner selects a local provider environment, credentials, and exact observation scope before live PostgreSQL/NATS/payment tests; no such operational effect is part of this repair. |
| Deferred operational residue | Runtime-guarantee admission, production exposure, deployment, release, and external payment calls remain separate decisions after R7 and exact provider observations. |

The R7a source-model candidate now exists separately from the runnable app:
`candidate/payment-outbox.alch` declares amount/currency and payment states
using first-class meta types, and its parser test passes. The generated
TypeScript outbound boundary now rejects absent/invalid idempotency keys before
HTTP. Neither change implements the transactional outbox, generated event ID,
payment worker, or durable outcome transition; those remain R7 construction.

## Acceptance and limits

R2 must reject a request for one identity when only a different identity is
stored. R4 must reject an oversized signed body before calling the handler
and accept the authored route, not `/webhook`. R6 must not return a successful persistence or
publication receipt from an unimplemented path. Generated bytes must verify
against the source, and the focused review test and TypeScript check must pass.

## Verification at this frontier

The generated-artifact check passes for 58 artifacts and reports
`runtime_guarantees_observed: false`. The focused Commerce review test,
AlchLang TypeScript check, DomainSpec CLI build, and focused generator tests
pass. With the two payment-model parser checks added, the full AlchLang suite
has 406 passing and 14 failing tests out of 420, matching the pre-repair
failure count and categories: P01/P02/P03
qualification/currentness, local-host execution, and module configuration.
These failures are not waived or reclassified as Commerce successes.

## Open Questions

- Should a future source-authored Query support an explicit identity Rule,
  instead of using a keyed Entity read for this operation?
- Which exact payment payload, provider idempotency/reconciliation contract,
  and resubmission identity should be authored before R7 is implemented for
  all three language targets?
- Which real provider observations will be required to claim R9?
