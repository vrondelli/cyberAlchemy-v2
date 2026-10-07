# Exact stage-separated runtime observation joining

Status: E04 bounded candidate. Authority effect: none.

## Boundary

E04 consumes already-produced runtime receipts and their current immutable
DomainSpec integration observations. It never starts an application, invokes a
provider, retries an effect, delivers a message, marks business work complete,
or creates runtime evidence on its own.

The join binds the evidence to the exact authored source, compiled graph,
provider selection, generated artifacts, runtime environment, cleanup report
and one-way ORODI observation binding. Every supplied reference resolves by
path, SHA-256, byte size and currentness before a join forms.

## Independent stages

The four E04 stages are independent evidence slots:

| Join slot | Existing DomainSpec stage | Meaning ceiling |
| --- | --- | --- |
| `application_commit` | `application-committed` | The selected application commit was observed. |
| `provider_acceptance` | `provider-accepted` | The provider acceptance boundary was observed. |
| `transport_delivery` | `transport-delivered` | Transport delivery was observed. |
| `business_completion` | `business-completed` | The declared business completion boundary was observed. |

Every observed slot requires both an exact runtime receipt and an exact
`domainspec.integration-observation/v1-candidate`. Their stage, ceiling,
outcome, timestamp, binding, operation, correlation and canonical receipt
digest must agree. A slot without evidence contains two explicit `null`
references and emits `status: not-observed`; another stage can never fill it.
Every observed receipt must also carry the cleanup report's `run_id` as its
correlation reference. A complete-looking set of stage pairs from different
runs therefore cannot be joined into one run.

`all_stages_independently_observed` is true only when all four slots have their
own valid evidence pairs. It is an accounting fact, not an inferred causal
chain, exactly-once guarantee or production claim.

## Cleanup

The join requires a closed cleanup report that records an observed cleanup,
all task-owned temporary resources removed, and no owned residue. Missing or
dirty cleanup blocks the join rather than being deferred or described as
successful. This is a check of supplied cleanup evidence, not independent
observation that cleanup happened.

## ORODI direction

The exact ORODI binding must declare the sole edge sequence:

```text
runtime -> observer -> orodi-adapter -> orodi-evaluator
```

Its return edge is `prohibited`. Retry selection, provider-state writes, API
calls, deployment and business-effect enactment are all fixed to `false`.
Changing any of those values rejects before output; observation never becomes
runtime control.

## Currentness

The construction trace counts exact static bindings and exact stage-evidence
bindings, names only stages that were independently observed, and records no
stage inference, ORODI return edge, ORODI control, runtime execution by the
join, or cleanup residue. Rebuilding from the same input is byte-deterministic;
the currentness assertion rejects any changed status, inferred stage or
control edge.

## Claim ceiling

This construction establishes only an exact join over the supplied bounded
observations. It does not prove that an unobserved stage happened, establish a
causal or exactly-once chain, demonstrate production behavior, approve a
product, publish, release, deploy, operate production or grant authority.

## Open Questions

E05 owns semantic, non-collapse, orthogonality, oracle, mutation, determinism
and currentness qualification across E01-E04. L3X owns the bounded evidence
closure after E05.
