# Durable Compensation Concept Model

Status: admitted definition source; canonical authority lives in D36-D44 and the product ontology

Owner route: DomainSpec v2 definitions owner

Authority effect: none; this development package preserves design evidence and does not replace canonical definitions

This package preserves the concept design used to define how Workflow Compensation survives worker loss and
process restart. The admitted authority is `domainspec-v2-D36..D44` in `definitions/DEFINITIONS.md`; the
private product ontology binds those concepts, and implementation baseline `@7` freezes the validated Recovery Intent terminology and infrastructure-binding epoch.

## Why another concept layer is required

D36 correctly establishes forward recovery: a Workflow emits an immutable intent and plan, and an external
executor invokes exact recovery Operations. Its current five-state vocabulary is sufficient for the in-process
reference contract, but not for durable coordination because it mixes three different questions:

1. Does the failed Workflow still require recovery?
2. Which worker currently holds the exclusive claim to advance durable work?
3. How long does that claim remain valid if the worker disappears?
4. What happened during one Operation invocation attempt?

Durable compensation separates those axes. A failed attempt is not automatically a failed recovery, a lease
expiry is not a business failure, and a retry changes attempt identity without changing semantic identity.

## Admitted D36 refinement

Workflow Compensation remains the umbrella forward-recovery concept:

```text
WorkflowCompensation = immutable RecoveryIntent
                     + frozen compensation plan
                     + exact recovery Operations
                     + external execution
```

`not-required` is a Workflow evaluation result: no Recovery Intent is created. Once an intent exists, it
remains `required` while execution or retry is possible, becomes `satisfied` only when every plan occurrence
completes, and becomes `unresolved` only at terminal `exhausted` or `escalated` disposition. Dispatch state and
attempt outcome are separate operational axes defined below.

## Admitted canonical concepts

### D37 — Recovery Intent

Formal voice:

```text
RecoveryIntent = (
  intent_id,
  workflow_execution_id,
  failure_occurrence_id,
  failed_step_id,
  completed_step_journal_digest,
  plan_digest
)

semantic_status in {required, satisfied, unresolved}
```

There is at most one semantic intent for one immutable Workflow failure occurrence. The intent and plan digest
never change after creation. A new retry, claim, worker, or process does not create a new intent.

Plain-language voice: an intent is the stable statement that one specific Workflow failure still needs a
specific recovery plan. It is the recovery's identity, not a queue message or execution attempt.

Domain-context voice: DomainSpec derives the intent from the D36 completed-step journal and the exact
`Workflow --[orchestrates]--> Operation` plan. `failure_occurrence_id` distinguishes repeated failures of the
same Workflow step without pretending that they are the same recovery.

Non-collapse boundary: `not-required` means no intent exists. An intent is not a dispatch record, attempt,
lease, retry, Event, or new DS-D1 meta-type.

### D38 — Durable Compensation Dispatch

Formal voice:

```text
DurableCompensationDispatch = (
  dispatch_id,
  intent_id,
  frozen_plan_digest,
  durable_progress_journal,
  dispatch_state,
  version
)

dispatch_state in {ready, leased, executing, retry-scheduled, terminal}

ready -> leased -> executing -> terminal
                      |
                      +-> retry-scheduled -> ready

leased | executing -> ready  when authority expires or process loss is recovered
```

Every transition is compare-and-set against the current version and is committed atomically with its dispatch
outbox record. The frozen plan, completed work, and invocation identities survive executor loss and restart.

Plain-language voice: the dispatch is the durable control record that remembers where recovery work is, who
may advance it, and what has already completed.

Domain-context voice: it binds one D37 intent to the D36 plan. It may resume from the first incomplete plan
node after restart, but it may not re-plan, substitute an Operation, or change completed-step evidence.

Non-collapse boundary: the dispatch owns coordination state only. Each recovery Operation still exclusively
owns its guards, reads, writes, effects, state-and-outbox transaction, Events, result, and failure continuation.

### D39 — Compensation Execution Attempt

Formal voice:

```text
CompensationExecutionAttempt = (
  attempt_id,
  dispatch_id,
  plan_occurrence_id,
  attempt_number,
  claim_id,
  lease_id,
  fencing_token,
  started_at,
  finished_at?,
  outcome
)

outcome in {succeeded, failed, unknown}
```

One attempt is one bounded executor episode for one planned Operation occurrence. Starting execution after a
retry or post-expiry reacquisition creates a new `attempt_id`; acquiring a claim or granting or renewing a
lease without starting execution does not.

Plain-language voice: an attempt is one try. Losing a worker can leave the result unknown, which is different
from proving that the Operation failed.

Domain-context voice: attempts retain exact Operation binding and evidence references. An `unknown` result is
replayed only through D40's unchanged invocation identity.

Non-collapse boundary: an attempt failure or unknown outcome is not a terminal compensation disposition.

### D40 — Compensation Invocation Identity

Formal voice:

```text
invocation_identity = H(intent_id, plan_digest, operation_id, plan_occurrence_id)

For every attempt a and successor attempt b over the same plan occurrence:
  invocation_identity(a) = invocation_identity(b)
  attempt_id(a) != attempt_id(b)

semantic_application_count(invocation_identity) <= 1
```

The identity excludes worker, process, attempt, claim, lease, and schedule values. It is the idempotency key
presented to the exact recovery Operation on every replay. The Operation or its bound adapter must durably
recognize a previously applied identity and return its recorded result without repeating the business effect.

Plain-language voice: retries are new tries at the same recovery action, so they receive new attempt numbers
but reuse the same business-safe replay key.

Domain-context voice: this refines D36's deterministic idempotency key into a stable per-plan-occurrence
identity. A plan containing the same Operation twice has two distinct occurrence identities.

Non-collapse boundary: one invocation identity does not promise exactly-once invocation. Durable compensation
uses at-least-once invocation with idempotent semantic application.

### D41 — Compensation Claim

Formal voice:

```text
CompensationClaim = (
  claim_id,
  dispatch_id,
  claimant_id,
  acquired_at,
  acquired_dispatch_version,
  fencing_token,
  claim_state
)

claim_state in {current, released, superseded}

current(claim) iff
  claim.claim_state = current
  and claim.fencing_token = greatest_committed_fencing_token(claim.dispatch_id)

may_advance(claim, now) iff
  current(claim)
  and exists active D42 lease for claim at now
```

Claim acquisition is compare-and-set against `acquired_dispatch_version` and atomically exclusive for the
dispatch. It creates a new `claim_id`, a fencing token greater than every previously committed token for that
dispatch, and an initial D42 lease. Releasing a claim or renewing its lease does not create an attempt.
Takeover after release or lease expiry creates a new claim and supersedes every earlier claimant.

Plain-language voice: a claim says which worker is currently allowed to move one recovery record forward.
The fencing token prevents an older worker from committing coordination updates after a newer worker takes
over.

Domain-context voice: DomainSpec uses the claim to serialize durable recovery coordination. The claim grants
authority to advance the D38 dispatch only; D40 replay protection remains responsible for duplicate business
effect prevention.

Non-collapse boundary: a claim is not its time limit, an attempt, Operation authority, domain ownership,
semantic success, or proof that an invocation occurred.

### D42 — Compensation Claim Lease

Formal voice:

```text
CompensationClaimLease = (
  lease_id,
  claim_id,
  lease_generation,
  valid_from,
  expires_at,
  renewed_from_lease_id?
)

active(lease, now) iff
  valid_from <= now < expires_at
  and lease.lease_generation = greatest_committed_generation(lease.claim_id)
  and current(claim(lease.claim_id))
```

A lease is the bounded validity interval of one claim. Renewal creates a newer lease generation for the same
claim and preserves its fencing token. Expiry before execution revokes advancement authority without creating
an attempt or implying success or failure. Expiry after execution began leaves that attempt `unknown`;
takeover creates a new D41 claim, and the next execution episode creates a new attempt.

Plain-language voice: the lease is the claim's deadline. If its worker stops renewing it, another worker can
eventually take over instead of leaving recovery permanently stuck.

Domain-context voice: DomainSpec uses the lease for crash recovery and liveness while the D41 claim and fence
provide exclusive advancement and stale-worker protection.

Non-collapse boundary: a lease is not the claim itself, a retry schedule, an attempt, semantic success, or
business-effect replay protection.

### D43 — Compensation Retry

Formal voice:

```text
CompensationRetry = (
  dispatch_id,
  predecessor_attempt_id,
  successor_attempt_number,
  not_before,
  remaining_budget,
  selected_policy_ref
)

retry preserves:
  intent_id, dispatch_id, plan_digest, durable progress, operation binding,
  plan occurrence, invocation identity

retry changes:
  attempt_id, scheduling metadata

retry may change after authority loss or takeover:
  claim_id, lease_id, fencing_token
```

A retry exists only when the failed recovery Operation's explicit continuation, or an explicitly selected
runtime policy permitted by that binding, selects `retry`. Limits and backoff are bounded and persisted before
the dispatch becomes eligible again.

Plain-language voice: retry means “try the same declared recovery action again later,” not “choose a different
recovery plan.”

Domain-context voice: the dispatcher enacts the Operation-owned continuation. It cannot invent retry policy,
reset completed progress, or silently convert escalation into retry.

Non-collapse boundary: claim acquisition and lease renewal are not retry; retry scheduling is not execution;
retry exhaustion is a D44 terminal disposition.

### D44 — Compensation Terminal Disposition

Formal voice:

```text
CompensationTerminalDisposition = (
  dispatch_id,
  disposition,
  final_attempt_id?,
  cause,
  evidence_refs,
  recorded_at
)

disposition in {completed, exhausted, escalated}
```

`completed` requires durable success evidence for every plan occurrence. `exhausted` requires an explicit
terminal-failure continuation or consumed retry budget. `escalated` requires the Operation-owned escalation
route. A terminal dispatch has no implicit successor transition.

Plain-language voice: terminal disposition is the durable final answer for the whole recovery, not the result
of one try.

Domain-context voice: DomainSpec records the exact final attempt and evidence without turning a receipt into
permission for another Workflow or Operation.

Non-collapse boundary: terminal recording does not publish, deploy, repair business state by itself, or select
successor work.

## Cross-concept invariants

1. One Workflow failure occurrence creates at most one Recovery Intent.
2. The intent and plan are immutable after durable dispatch creation.
3. Completed plan occurrences are retained in a durable progress journal.
4. At most one current fenced claim exists for a dispatch.
5. Claim acquisition is compare-and-set against the current dispatch version.
6. Dispatch advancement requires both the current claim and its active lease.
7. Lease renewal preserves the claim identity and fencing token while creating a newer lease generation.
8. Takeover creates a new claim with a greater fencing token and supersedes every earlier claimant.
9. An expired, released, or superseded claimant cannot commit a dispatch advancement.
10. Every executor episode has a unique attempt identity.
11. Every replay of one plan occurrence reuses its invocation identity.
12. A recovery Operation or its bound adapter applies the business effect for one invocation identity at most
    once and returns the recorded result on replay.
13. Claim acquisition, lease grant, or lease renewal alone never creates an attempt.
14. An executing attempt whose effective lease expires becomes `unknown` before replay.
15. Binding preflight completes before the first Operation invocation and every invocation uses the selected
   exact binding.
16. Dispatch transitions and their dispatch outbox records share one atomic boundary.
17. Recovery Operation state and outbox effects remain inside that Operation's own atomic boundary.
18. Retry may resume or replay the frozen plan but may never re-plan or substitute an Operation.
19. A failed or unknown attempt cannot become a terminal disposition without the explicit continuation rule.
20. Terminal disposition prevents implicit successor execution.
21. The delivery guarantee is at-least-once invocation with idempotent semantic application, not exactly-once
    process execution.

## Semantic-to-operational projection

| Workflow/intent meaning | Durable dispatch state | Attempt information |
| --- | --- | --- |
| `not-required` | no dispatch | no attempt |
| `required` | `ready`, `leased`, `executing`, or `retry-scheduled` | none, current attempt, or retryable `failed`/`unknown` outcome |
| `satisfied` | `terminal` | disposition `completed` |
| `unresolved` | `terminal` | disposition `exhausted` or `escalated` |

This projection is intentionally not bijective. Semantic meaning must not be inferred from a lease or worker
process state alone.

## Architecture choices deliberately deferred

The later system-architecture slice must select and bind these implementation choices without redefining the
concepts:

- durable store and transaction technology;
- queue or polling transport;
- clock source, lease duration, and renewal cadence;
- worker topology, partitioning, throughput, and backpressure;
- retry-policy representation and configuration owner;
- dispatch Event and observability transport;
- archive and retention policy.

`cancelled`, `abandoned`, and dead-letter semantics are not admitted by this concept model.

## Admission result

This package remains non-authoritative design evidence. Its D36 refinement and D37-D44 concepts are admitted
in `definitions/DEFINITIONS.md`, synchronized through the definition index and drift audit, frozen by immutable
implementation baseline `domainspec-meta-types-current-implemented@7`, and bound into the private product
ontology. No durable dispatcher is implemented by this package or inferred from that semantic admission.
