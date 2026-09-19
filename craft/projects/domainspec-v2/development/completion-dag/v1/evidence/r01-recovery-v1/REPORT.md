# R01: local durable recovery product definition

R01 defines a Python + SQLite candidate. It does not implement or approve the recovery runtime.

## Product

One failed Workflow produces a fixed recovery plan. Up to two local workers execute its exact Operations, preserve committed progress across process death, and recognize already-applied local business work. The reference product is bounded to one host boot, one dispatch per test case, 1–8 plan occurrences, and at most three execution starts per occurrence. Two fresh repetitions of each of 30 scenarios are required later.

Reuse the existing Python planner and identity algorithms. The local availability probe observed Python 3.12.3 and SQLite 3.45.1; this is not a pinned runtime compatibility claim. The technology choice is a prototype decision, not production selection.

## State and failure behavior

- Intent and plan stay fixed. Each execution start gets a new attempt ID; retries and takeover retain the same invocation identity.
- Claims use version comparison and increasing fences. A latest active lease is required for worker progress; exact expiry is invalid. Takeover supersedes old authority. Renewal does not create an attempt.
- If authority is lost during invocation, record unknown and reconcile. A late callback cannot authorize a stale commit.
- Retries require an explicit frozen Operation binding policy, a persisted remaining budget and a not-before time. Claims do not reset budgets. Inaccessible or ambiguous evidence stops the run; it is not silently interpreted as failure or success.
- Completed requires durable success for every occurrence. Exhausted requires terminal-failure selection or consumed budget. Escalated records the selected route and launches no successor. Only completed makes the intent satisfied.

## Two transaction owners

`coordination.sqlite` owns dispatch, version, progress, claim/lease, attempts, retry schedule, terminal evidence and dispatch outbox. `operation.sqlite` owns the example business row, successful invocation-result ledger and Operation outbox. Each transaction is local to one file; the coordinator never holds its transaction while invoking an Operation.

An Operation checks its stable identity and exact payload/binding, then atomically applies business state and records the successful result. A matching replay returns that result. This closes the important crash window: business commit succeeded but coordination did not record success. It does not make remote effects idempotent.

SQLite DELETE journaling with synchronous EXTRA, foreign keys enabled and explicit SQL transaction commands is the proposed provider profile. Configuration must be read back before use. Documentation informs this choice; actual guarantees require fault-injection tests. See the [Python transaction documentation](https://docs.python.org/3.12/library/sqlite3.html), [SQLite synchronization documentation](https://www.sqlite.org/pragma.html#pragma_synchronous), and [SQLite isolation documentation](https://www.sqlite.org/isolation.html).

## Limits

At-least-once invocation and at-most-once local business application are separate. Liveness assumes healthy available stores, a progressing clock, polling worker, valid bindings and remaining budget. Power loss, host reboot, network filesystems, multi-host workers, remote business effects, automatic migration and production claims are outside this candidate. A changed boot or schema version stops advancement without fabricating a terminal outcome.

The clock uses a monotonic time source with a boot identity. Tests must cover exact expiry and real subprocess kill/reopen, not merely caught exceptions. Missing observations remain not_evaluable.

## Definition result

All D36–D49 concepts use disposition **reuse**, owned by the DomainSpec definitions-governance owner. Their exact selected text, line selectors, section hashes and whole-file hashes are reproduced in definition-pack.json and below. The local product uses disposition **propose**, owned by the DomainSpec Workflow/runtime owner; its complete candidate content follows below. No canonical definition is replaced.

This local pack records no saved Define session or managed context-evaluator receipt. It uses the explicit conversation and verified R00 baseline. It is not an admitted Define runtime output.

## Construction and operational support

R01 is a product-construction definition stage. R02 is next: model and compile the system scaffold and exact provider contracts. R02, U00 and L00 are dependency-ready; this packet grants no execution or construction-binding admission.

Open construction questions belong to R02 (schema, signatures and version bindings) and successor product-test owners (runtime scenario evidence). They do not block R01 definition completion. Existing operational residue remains separate: architecture owner source-index maintenance, repository/release owner O01, EVF package owner O06, and EVF/TLC owner environment and stability follow-up. None blocks R02 candidate modeling. Recovery product approval remains pending.

## Finite failure matrix

- **R01-F01** — Evaluate a failed Workflow with recovery Operation spy callbacks. Expected: A fixed plan is returned; recovery callback count stays zero until the external worker acts.
- **R01-F02** — Submit the identical failure twice, then resubmit that failure with changed plan material. Expected: One durable intent/dispatch exists for identical input; changed material rejects with no replacement.
- **R01-F03** — Change stored plan order or digest before close/reopen. Expected: Digest check rejects; no Operation call or progress advancement.
- **R01-F04** — Plan two distinct occurrences of the same Operation. Expected: Occurrence IDs and invocation identities differ; each can apply once.
- **R01-F05** — Remove the last required binding before execution. Expected: Preflight rejects the whole plan; first Operation call count remains zero.
- **R01-F06** — Two workers read the same dispatch version and race an advancement. Expected: Exactly one expected-version transition commits; losing worker changes no progress/outbox.
- **R01-F07** — Kill a process before coordination COMMIT, then separately after COMMIT before response. Expected: Reopen observes neither transition nor outbox before commit, and both after; ambiguous client outcome reconciles by version and transition identity.
- **R01-F08** — Finish occurrence one; crash during occurrence two and restart. Expected: Completed prefix remains; no completed occurrence becomes incomplete.
- **R01-F09** — Two workers race acquisition while no current claim exists. Expected: One claim becomes current; the other acquisition is rejected without starting an attempt.
- **R01-F10** — Expire a claim and acquire a replacement twice. Expected: Each replacement fence is greater than its predecessor; exactly one current claim remains.
- **R01-F11** — Try advancement with a current claim but expired lease; then valid lease attached to superseded claim. Expected: Both commits reject; valid current claim plus latest active lease permits bounded advancement.
- **R01-F12** — Renew once and advance using the prior generation at the same clock value. Expected: Renewal keeps fence and increments generation; older generation rejects; no new attempt from renewal.
- **R01-F13** — Pause worker A during invocation, expire lease, let B take over, then resume A. Expected: A cannot commit progress/outcome; B preserves the stable invocation identity and the ledger prevents duplicate application.
- **R01-F14** — Acquire/renew without invocation, then fail and retry an occurrence. Expected: No attempt exists for acquisition/renewal; two execution starts have distinct IDs and consecutive numbers.
- **R01-F15** — Crash after attempt start and retry under a replacement worker. Expected: Intent, plan, Operation binding, occurrence and invocation identity stay equal; attempt identity differs.
- **R01-F16** — Commit the example business effect and replay-ledger result, kill before coordination success, then replay. Expected: Exactly one business effect and Operation outbox record exist; matching replay returns the stored result.
- **R01-F17** — Advance the clock to exact expiry after invocation starts and lose its response. Expected: Attempt is unknown before successor handling; late success cannot commit under stale authority. Expiry before invocation creates no attempt.
- **R01-F18** — Select retry, close/reopen before not-before, then repeatedly fail until budget consumed. Expected: No early invocation; schedule and budget survive restart; maximum three starts per occurrence, then exhausted without a fourth call.
- **R01-F19** — After failure attempt to replace an Operation binding or replan on restart. Expected: Reject drift; retain the original plan and no substituted call.
- **R01-F20** — Run all-success, terminal-failure, budget-exhausted and escalation fixtures, then request another attempt. Expected: Final dispositions are completed/exhausted/exhausted/escalated with evidence; only completed is satisfied; all terminal retry requests reject.
- **R01-F21** — Kill before the example Operation COMMIT and reopen; inspect coordinator responsibilities. Expected: Business change, success ledger and Operation outbox are all absent; coordinator owns no business writes or remote effects.
- **R01-F22** — Complete prefix, kill process, start a fresh process with same boot identity and stores. Expected: First incomplete occurrence resumes; completed progress and exact identities persist. A fully terminal dispatch launches nothing.
- **R01-F23** — Remove a required observation or make its store inaccessible. Expected: Dependent result is not_evaluable/unsupported with causal evidence; never manufacture PASS or terminal disposition.
- **R01-F24** — Replay a committed Operation and redeliver an acknowledged dispatch event after publisher crash. Expected: Invocation/delivery may repeat; business application count stays one through the Operation ledger; no exactly-once process claim.
- **R01-F25** — Fail an attempt while retries remain, then complete or exhaust it. Expected: Attempt failed/unknown does not alone change required; only terminal evidence projects satisfied/unresolved.
- **R01-F26** — Form the selected dependency contracts, then replace one with universal Port. Expected: Concern-specific records form; universal Port rejects; generated signatures do not count as concrete adapters.
- **R01-F27** — Form persistence metadata without an adapter, then exercise a selected adapter through close/reopen. Expected: Formation alone has no runtime guarantee; only exact resource/version observations establish bounded persistence.
- **R01-F28** — Fault each database transaction before commit and fault between their commits. Expected: Each local participant set is all-or-none; business success can coexist temporarily with incomplete coordination; replay reconciles without a cross-file transaction.
- **R01-F29** — Classify a failure retryable under an escalation binding, then under an explicit retry binding. Expected: First records escalation without retry; second uses persisted bounded schedule. Classification alone grants neither.
- **R01-F30** — Remove replay/clock/version binding; change schema version or boot identity on reopen. Expected: Fail closed before invocation/advancement; complete matching composition remains eligible for tests, not automatically proven durable.

## Exact reused definitions

Disposition: reuse. Owner: DomainSpec definitions-governance owner. Source: projects/domainspec-v2/definitions/DEFINITIONS.md at line 1866; SHA-256 f6974f45ef25dfd10a0028a07696dde7f7ae8dfde942bcb16c45dd33cbee4ee6.

## domainspec-v2-D36. Workflow Compensation

Status: active

Source kind: method-vocabulary; owner-admitted forward-recovery model

Evidence: [durable compensation concept model](../development/durable-compensation-concepts/README.md) ·
[canonical runtime contract](../impl/architecture-conformance/targets/typescript/workflow-compensation-v1.md) ·
[reference implementation](../impl/architecture-conformance/targets/typescript/workflow-compensation-v1.ts) ·
[current implementation state](./meta-types/current-implementation.md)

Formal voice:

```text
WorkflowCompensation = (
  immutable D37 RecoveryIntent,
  frozen recovery plan,
  exact recovery Operations,
  external execution through D38..D44
)

workflow_evaluation_result in {not-required, recovery-required}

For one failed Workflow execution w:
  not-required => no RecoveryIntent exists
  recovery-required => exactly one RecoveryIntent exists
  targets(w) is a subset of the Operations orchestrated by that Workflow
  plan(w) is a topological ordering of targets(w)

Ordering precedence:
  explicit Operation dependency edges first;
  otherwise reverse completed-step order;
  reverse completed-step order is also the deterministic tie-breaker.

Workflow evaluation may emit intent and plan but never invokes recovery Operations.
Before the first invocation, the external executor resolves every planned Operation
to one exact binding or rejects the complete plan without mutation.
```

Semantic recovery state is owned by D37, durable coordination state by D38, individual execution outcomes by
D39, replay protection by D40, exclusive worker authority by D41 and D42, retry scheduling by D43, and the
whole recovery's final result by D44. Every recovery target remains an ordinary Operation and retains its
declared reads, writes, effects, guard-before-mutation ordering, atomic state-and-outbox boundary, Events, and
explicit failure continuation. Compensation adds no DS-D1 meta-type and no DS-D2/DS-D8 relationship verb.

Plain-language voice: Workflow Compensation is forward recovery after part of a Workflow completed. The
Workflow records what happened and requests a frozen recovery plan; durable machinery can safely resume that
same plan after retries, crashes, or worker replacement without silently choosing a different action.

Domain-context voice: DomainSpec binds forward and recovery steps through the existing
`Workflow --[orchestrates]--> Operation` relationship. The current three-profile reference implementation
realizes intent planning, exact-binding preflight, external invocation, and deterministic replay keys. Durable
dispatch, claiming, lease renewal, persisted retry scheduling, and restart recovery remain unimplemented and
are recorded separately from the admitted semantics.

Use carefully: a D39 failed or unknown attempt is not the D44 outcome of the whole recovery. Retry preserves
the D37 intent, frozen plan, exact Operation occurrence, durable progress, and D40 invocation identity.

Misuse warning: do not model compensation as a new meta-type, invent a `compensates` edge, execute recovery
inside Workflow evaluation, collapse Claim into Lease or Replay Identity, or infer durable implementation from
canonical semantics.

Challenge contract (CAV2-D40, protocol-only): modes = contradiction / scope; edge = "a Workflow invokes
recovery directly, a target is not one of its orchestrated Operations, binding preflight occurs after mutation,
retry changes semantic identity, or an attempt result is treated as terminal recovery state" -> challenges the
term; owner route = definitions-governance plus the implementation-conformance profile owner; gate = owner
decision plus positive and hostile profile fixtures; blocking question = "which exact intent, plan occurrence,
Operation binding, attempt, claim, lease, and replay identity realize this recovery?"; residue ->
`definitions/reviews/`.

Confirm contract: active by direct owner admission and synchronized D36-D44 definition and ontology
validation. Current implementation coverage remains separately bounded by
`definitions/meta-types/current-implementation.json`. Gate = definitions-governance owner gate.

Promotion boundary: project-local durable Workflow recovery semantics. It grants no claim that durable
dispatch is implemented and no publication, release, deployment, production, or external-effect authority.

Disposition: reuse. Owner: DomainSpec definitions-governance owner. Source: projects/domainspec-v2/definitions/DEFINITIONS.md at line 1943; SHA-256 f6974f45ef25dfd10a0028a07696dde7f7ae8dfde942bcb16c45dd33cbee4ee6.

## domainspec-v2-D37. Recovery Intent

Status: active

Source kind: method-vocabulary; owner-admitted durable-recovery identity

Evidence: [durable compensation concept model](../development/durable-compensation-concepts/README.md) ·
[Workflow Compensation](#domainspec-v2-d36)

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

required   iff execution or an authorized retry remains possible
satisfied  iff D44 disposition = completed
unresolved iff D44 disposition in {exhausted, escalated}
```

There is at most one intent for one immutable Workflow failure occurrence. Its identity and plan digest never
change after creation. `not-required` is a D36 evaluation result and means no intent exists.

Plain-language voice: the intent is the stable statement that one particular Workflow failure still needs one
particular recovery plan. It is the recovery's identity, not a queue message or a worker attempt.

Domain-context voice: DomainSpec derives the intent from the completed-step journal and the exact
`Workflow --[orchestrates]--> Operation` plan. Retries, claims, leases, workers, and restarts preserve it.

Use carefully: `required` may coexist with a failed or unknown D39 attempt while retry remains possible.

Misuse warning: do not create a new intent for retry or infer semantic completion from worker or lease state.

Challenge contract: a mutable plan digest, duplicate intent for one failure occurrence, or attempt state used
as semantic state challenges the term; owner route = definitions-governance; residue -> `definitions/reviews/`.

Confirm contract: active by direct owner admission and synchronized definition/ontology validation.

Promotion boundary: semantic recovery identity only; it is not execution or implementation evidence.

Disposition: reuse. Owner: DomainSpec definitions-governance owner. Source: projects/domainspec-v2/definitions/DEFINITIONS.md at line 1991; SHA-256 f6974f45ef25dfd10a0028a07696dde7f7ae8dfde942bcb16c45dd33cbee4ee6.

## domainspec-v2-D38. Durable Compensation Dispatch

Status: active

Source kind: method-vocabulary; owner-admitted durable coordination aggregate

Evidence: [durable compensation concept model](../development/durable-compensation-concepts/README.md) ·
[Recovery Intent](#domainspec-v2-d37)

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
leased -> ready
executing -> ready | retry-scheduled
retry-scheduled -> ready
```

Every transition compares against the current version and is recorded atomically with its dispatch outbox
record. The intent, frozen plan, completed progress, exact Operation binding, and D40 identity survive worker
loss and restart. A terminal dispatch has no implicit successor.

Plain-language voice: the dispatch is the durable recovery record. It remembers what must run, what already
finished, and where execution can safely resume.

Domain-context voice: DomainSpec binds one D37 intent to the D36 plan. The dispatcher coordinates existing
Operations but never replans, substitutes an Operation, or absorbs its business effects.

Use carefully: dispatch state answers where durable coordination is, not whether recovery is semantically
satisfied or whether one invocation succeeded.

Misuse warning: do not infer a durable dispatcher implementation from this active semantic contract.

Challenge contract: non-atomic transition/outbox recording, mutable plan identity, lost completed progress,
or a successor from terminal challenges the term; owner route = definitions-governance plus runtime owner.

Confirm contract: active as canonical semantics; implementation remains explicit residue until executable
durability evidence exists.

Promotion boundary: durable coordination semantics only; no implementation, deployment, or production claim.

Disposition: reuse. Owner: DomainSpec definitions-governance owner. Source: projects/domainspec-v2/definitions/DEFINITIONS.md at line 2043; SHA-256 f6974f45ef25dfd10a0028a07696dde7f7ae8dfde942bcb16c45dd33cbee4ee6.

## domainspec-v2-D39. Compensation Execution Attempt

Status: active

Source kind: method-vocabulary; owner-admitted execution-episode identity

Evidence: [durable compensation concept model](../development/durable-compensation-concepts/README.md) ·
[Durable Compensation Dispatch](#domainspec-v2-d38)

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
retry or takeover creates a new attempt. Claim acquisition and lease grant or renewal alone do not.

Plain-language voice: an attempt is one try. Losing the worker can make the result unknown, which is different
from proving that the Operation failed.

Domain-context voice: every DomainSpec attempt retains the exact Operation occurrence and evidence references;
an unknown result can be replayed only with D40's unchanged invocation identity.

Use carefully: attempt identity changes per execution episode; semantic recovery identity does not.

Misuse warning: do not turn a failed or unknown attempt directly into a terminal recovery disposition.

Challenge contract: reused attempt identity, missing authority binding, or loss treated as proven failure
challenges the term; owner route = definitions-governance plus runtime owner.

Confirm contract: active as canonical semantics; durable attempt recording remains implementation residue.

Promotion boundary: one execution episode only; not the whole recovery outcome.

Disposition: reuse. Owner: DomainSpec definitions-governance owner. Source: projects/domainspec-v2/definitions/DEFINITIONS.md at line 2091; SHA-256 f6974f45ef25dfd10a0028a07696dde7f7ae8dfde942bcb16c45dd33cbee4ee6.

## domainspec-v2-D40. Compensation Invocation Identity

Status: active

Source kind: method-vocabulary; owner-admitted replay-protection identity

Evidence: [durable compensation concept model](../development/durable-compensation-concepts/README.md) ·
[canonical runtime contract](../impl/architecture-conformance/targets/typescript/workflow-compensation-v1.md)

Formal voice:

```text
invocation_identity = H(intent_id, plan_digest, operation_id, plan_occurrence_id)

For attempts a and b over the same plan occurrence:
  invocation_identity(a) = invocation_identity(b)
  attempt_id(a) != attempt_id(b)

semantic_application_count(invocation_identity) <= 1
```

The identity excludes worker, process, attempt, claim, lease, and scheduling values. The exact recovery
Operation or its bound adapter must durably recognize an already-applied identity and return its recorded
result without repeating the business effect.

Plain-language voice: every retry is a new try at the same recovery action, so it gets a new attempt identity
but reuses the same business-safe replay key.

Domain-context voice: DomainSpec refines D36's deterministic idempotency key into a stable identity for each
planned Operation occurrence. The same Operation appearing twice in one plan receives two occurrence keys.

Use carefully: the guarantee is at-least-once invocation with at-most-once semantic application, not universal
exactly-once delivery.

Misuse warning: do not rotate the key on retry or use a Claim or Lease as business-effect replay protection.

Challenge contract: a retry-specific key or repeated semantic application for one identity challenges the
term; owner route = definitions-governance plus the Operation binding owner.

Confirm contract: active by direct owner admission; current deterministic key evidence is bounded by the
reference runtime, and durable adapter coverage remains independently observable.

Promotion boundary: replay identity and semantic deduplication contract only.

Disposition: reuse. Owner: DomainSpec definitions-governance owner. Source: projects/domainspec-v2/definitions/DEFINITIONS.md at line 2135; SHA-256 f6974f45ef25dfd10a0028a07696dde7f7ae8dfde942bcb16c45dd33cbee4ee6.

## domainspec-v2-D41. Compensation Claim

Status: active

Source kind: method-vocabulary; owner-admitted exclusive advancement authority

Evidence: [durable compensation concept model](../development/durable-compensation-concepts/README.md) ·
[Durable Compensation Dispatch](#domainspec-v2-d38)

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

may_advance(claim, now) iff current(claim) and exists active D42 lease at now
```

Acquisition is compare-and-set against `acquired_dispatch_version` and atomically creates a fencing token
greater than every prior committed token for the dispatch. Takeover creates a new Claim and supersedes every
earlier claimant.

Plain-language voice: the Claim identifies which worker is currently allowed to move one recovery record
forward. Its fence stops an older worker from committing after takeover.

Domain-context voice: DomainSpec uses the Claim to serialize D38 coordination only. D40 protects business
effects, and each Operation retains its own effect authority.

Use carefully: advancing a dispatch requires both the current Claim and an active D42 Lease.

Misuse warning: do not collapse the Claim into its Lease, Replay Identity, attempt, or domain ownership.

Challenge contract: two current claims, non-monotonic fencing, or stale-worker advancement challenges the
term; owner route = definitions-governance plus runtime owner.

Confirm contract: active as canonical semantics; claim-store implementation remains residue.

Promotion boundary: exclusive dispatch advancement authority only; not Operation or business authority.

Disposition: reuse. Owner: DomainSpec definitions-governance owner. Source: projects/domainspec-v2/definitions/DEFINITIONS.md at line 2187; SHA-256 f6974f45ef25dfd10a0028a07696dde7f7ae8dfde942bcb16c45dd33cbee4ee6.

## domainspec-v2-D42. Compensation Claim Lease

Status: active

Source kind: method-vocabulary; owner-admitted bounded claim validity

Evidence: [durable compensation concept model](../development/durable-compensation-concepts/README.md) ·
[Compensation Claim](#domainspec-v2-d41)

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

Renewal creates a newer Lease generation for the same Claim and preserves its fencing token. Expiry before
execution creates no attempt. Expiry after execution begins makes that attempt unknown; takeover creates a new
D41 Claim before any successor attempt.

Plain-language voice: the Lease is the Claim's deadline. If a worker stops renewing it, another worker can
eventually take over instead of leaving recovery stuck forever.

Domain-context voice: DomainSpec uses the Lease for crash-recovery liveness while the Claim and fence preserve
exclusive advancement safety.

Use carefully: Claim and Lease lifecycles are independent of retry; authority loss may occur without retry.

Misuse warning: do not treat Lease renewal as retry or a Lease as business-effect replay protection.

Challenge contract: unbounded validity, renewal changing Claim or fence, or advancement after expiry
challenges the term; owner route = definitions-governance plus runtime owner.

Confirm contract: active as canonical semantics; clock, duration, cadence, and storage remain architecture
choices and implementation residue.

Promotion boundary: time-bounded Claim validity only.

Disposition: reuse. Owner: DomainSpec definitions-governance owner. Source: projects/domainspec-v2/definitions/DEFINITIONS.md at line 2236; SHA-256 f6974f45ef25dfd10a0028a07696dde7f7ae8dfde942bcb16c45dd33cbee4ee6.

## domainspec-v2-D43. Compensation Retry

Status: active

Source kind: method-vocabulary; owner-admitted successor-attempt scheduling

Evidence: [durable compensation concept model](../development/durable-compensation-concepts/README.md) ·
[Compensation Execution Attempt](#domainspec-v2-d39)

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
  intent_id, dispatch_id, plan_digest, durable progress, Operation binding,
  plan occurrence, invocation identity

retry changes:
  attempt_id, scheduling metadata

retry may change after authority loss or takeover:
  claim_id, lease_id, fencing_token
```

Retry exists only when the failed Operation's explicit continuation, or an explicitly selected policy allowed
by that binding, selects retry. Limits and backoff are bounded and persisted before eligibility.

Plain-language voice: retry means “try the same declared recovery action again later,” not “choose a new plan.”

Domain-context voice: the DomainSpec dispatcher enacts the Operation-owned continuation. It cannot invent retry
policy, reset completed progress, or convert escalation into retry.

Use carefully: Claim acquisition and Lease renewal are not Retry; scheduling is not execution.

Misuse warning: do not retry with a new D40 identity, substitute an Operation, or retry after terminal state.

Challenge contract: unbounded retry, replanning, or continuation bypass challenges the term; owner route =
definitions-governance plus the Operation binding owner.

Confirm contract: active as canonical semantics; durable scheduling remains implementation residue.

Promotion boundary: authorized successor-attempt scheduling only.

Disposition: reuse. Owner: DomainSpec definitions-governance owner. Source: projects/domainspec-v2/definitions/DEFINITIONS.md at line 2287; SHA-256 f6974f45ef25dfd10a0028a07696dde7f7ae8dfde942bcb16c45dd33cbee4ee6.

## domainspec-v2-D44. Compensation Terminal Disposition

Status: active

Source kind: method-vocabulary; owner-admitted terminal recovery result

Evidence: [durable compensation concept model](../development/durable-compensation-concepts/README.md) ·
[Durable Compensation Dispatch](#domainspec-v2-d38)

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
route. A terminal dispatch has no implicit successor.

Plain-language voice: Terminal Disposition is the durable final answer for the whole recovery, not the result
of one attempt.

Domain-context voice: DomainSpec records the final attempt and evidence without turning that record into
permission for another Workflow or Operation.

Use carefully: only `completed` makes D37 satisfied; `exhausted` and `escalated` make it unresolved.

Misuse warning: do not treat a failed attempt, exhausted retry budget, or escalation receipt as permission for
implicit successor work.

Challenge contract: terminal state without its required evidence or any implicit successor transition
challenges the term; owner route = definitions-governance plus runtime owner.

Confirm contract: active as canonical semantics; durable terminal recording remains implementation residue.

Promotion boundary: terminal recovery meaning only; no publication, deployment, or successor authority.

Disposition: reuse. Owner: DomainSpec definitions-governance owner. Source: projects/domainspec-v2/definitions/DEFINITIONS.md at line 2333; SHA-256 f6974f45ef25dfd10a0028a07696dde7f7ae8dfde942bcb16c45dd33cbee4ee6.

## domainspec-v2-D45. Concern-Specific Dependency Contract

Status: active

Source kind: method-vocabulary; owner-admitted implementation-boundary model

Evidence: [Operation, Workflow, and Infrastructure-Binding Pattern Research](../development/research/2026-08-20-operation-workflow-infrastructure-binding-patterns/TOWER.md) ·
[System Integration Contract Layer Revision 2](../development/refinement-runs/20260813T153029Z-system-integration-contract-layer-revision-2/RESULT.md) ·
[Infrastructure-Binding Architecture Admission](../development/meta-type-instantiation-cli/OWNER-INFRASTRUCTURE-BINDING-ARCHITECTURE-ADMISSION.json) ·
[Durable Recovery Architecture](../architecture/durable-recovery/README.md)

Research provenance: the Tower supplies the responsibility-specific seam and non-collapse model; Revision 2
confirms the separate system-integration ownership plane; the owner admission makes that model canonical.
Neither research artifact selects a provider or implementation profile.

Formal voice:

```text
ConcernSpecificDependencyContract = (
  contract_id,
  concern,
  consumer_roles,
  operation_signatures,
  failure_surface,
  implementation_profile_ref
)

requires:
  one named concern per contract
  provider mechanics absent from consumer-owned signatures
  concrete realization supplied at a composition boundary
```

A dependency contract is named for the responsibility it exposes, such as a Recovery Repository, Recovery
Unit of Work, Clock, Scheduler, Wakeup capability, or Operation Binding Resolver. DomainSpec does not require
one universal code-level `Port` abstraction, DI container, decorator system, or service locator. A DomainSpec
Interface remains a DS-D1 logical boundary and is not implied merely because code consumes a dependency.

Plain-language voice: name the seam after the job it performs. A store contract, clock, and message sender
have different responsibilities and should not be hidden behind one generic dependency shape.

Domain-context voice: the durable-recovery runtime consumes a Recovery Coordination Repository, a local
Recovery Unit of Work, a Clock, a Wakeup capability, and exact Operation bindings. A TypeScript profile may
express these as structural types supplied through higher-order-function construction; another profile may
choose another language form without changing the concern.

Use carefully: this term governs responsibility and dependency direction, not suffixes, files, framework
choice, or provider technology.

Misuse warning: do not turn every dependency into a DomainSpec Interface or infrastructure-binding record.
Pure helpers and local capabilities may need only an exact implementation binding.

Challenge contract: a generic contract that erases concern-specific failure or evidence obligations, or a
consumer importing concrete provider mechanics, challenges the term; owner route = implementation-profile
owner plus definitions-governance.

Confirm contract: active as the canonical code-seam model; language-specific shapes remain profile-owned.

Promotion boundary: dependency responsibility and direction only; no provider or runtime guarantee.

Disposition: reuse. Owner: DomainSpec definitions-governance owner. Source: projects/domainspec-v2/definitions/DEFINITIONS.md at line 2393; SHA-256 f6974f45ef25dfd10a0028a07696dde7f7ae8dfde942bcb16c45dd33cbee4ee6.

## domainspec-v2-D46. Persistence Binding

Status: active

Source kind: method-vocabulary; owner-admitted infrastructure-binding record

Evidence: [Operation, Workflow, and Infrastructure-Binding Pattern Research](../development/research/2026-08-20-operation-workflow-infrastructure-binding-patterns/TOWER.md) ·
[System Integration Contract Layer Revision 2](../development/refinement-runs/20260813T153029Z-system-integration-contract-layer-revision-2/RESULT.md) ·
[Infrastructure-Binding Architecture Admission](../development/meta-type-instantiation-cli/OWNER-INFRASTRUCTURE-BINDING-ARCHITECTURE-ADMISSION.json) ·
[Durable Recovery Architecture](../architecture/durable-recovery/README.md)

Research provenance: the Tower separates a Repository contract from persistence metadata; Revision 2
introduces the candidate `PersistenceBinding` record and ownership split; the owner admission accepts the
distinction while leaving the adapter and provider open.

Formal voice:

```text
PersistenceBinding = (
  binding_id,
  logical_subject_refs,
  dependency_contract_ref,
  adapter_ref,
  resource_ref,
  implementation_profile_ref,
  logical_physical_mapping_ref,
  evidence_boundary
)
```

The binding connects exact logical persistence roles and one D45 contract to one selected physical
realization and its evidence boundary. `interface_ref` is optional and is present only when an actual DS-D1
Interface owns the logical boundary; Entity, Operation, Query, Workflow-runtime, or other exact subject refs
may bind persistence without inventing an Interface. Database, ORM, schema, migration, connection, locking,
and provider configuration remain implementation-profile or adapter concerns.

Plain-language voice: a Persistence Binding says which repository-shaped contract uses which concrete store
realization, and exactly how far the evidence for that choice reaches.

Domain-context voice: DomainSpec durable recovery binds the Recovery Coordination Repository to the selected
coordination-store adapter. The binding may prove exact reads and writes for that adapter, but it does not by
itself prove atomicity, retry safety, delivery, or production durability.

Use carefully: keep the code contract, metadata binding, concrete adapter, runtime observation, and owner
decision as separate records.

Misuse warning: a Repository shape is not a Persistence Binding, and a passing schema or fixture is not proof
that a database committed or recovered state.

Challenge contract: an unbound adapter, ambiguous logical-to-physical mapping, missing evidence boundary, or
provider detail smuggled into portable semantics challenges the term; owner route = system-integration owner
plus implementation-profile owner.

Confirm contract: active as canonical infrastructure-binding semantics; provider implementation remains
separate evidence.

Promotion boundary: persistence realization identity and bounded evidence only.

Disposition: reuse. Owner: DomainSpec definitions-governance owner. Source: projects/domainspec-v2/definitions/DEFINITIONS.md at line 2451; SHA-256 f6974f45ef25dfd10a0028a07696dde7f7ae8dfde942bcb16c45dd33cbee4ee6.

## domainspec-v2-D47. Transaction Guarantee Binding

Status: active

Source kind: method-vocabulary; owner-admitted local-atomicity binding

Evidence: [Operation, Workflow, and Infrastructure-Binding Pattern Research](../development/research/2026-08-20-operation-workflow-infrastructure-binding-patterns/TOWER.md) ·
[System Integration Contract Layer Revision 2](../development/refinement-runs/20260813T153029Z-system-integration-contract-layer-revision-2/RESULT.md) ·
[Infrastructure-Binding Architecture Admission](../development/meta-type-instantiation-cli/OWNER-INFRASTRUCTURE-BINDING-ARCHITECTURE-ADMISSION.json) ·
[Durable Recovery Architecture](../architecture/durable-recovery/README.md)

Research provenance: the Tower supplies the local-Unit-of-Work and non-Workflow-wide-transaction boundary;
Revision 2 introduces the candidate `TransactionGuaranteeBinding` record; the owner admission accepts only
the portable distinction, not any database guarantee.

Formal voice:

```text
TransactionGuaranteeBinding = (
  binding_id,
  unit_of_work_contract_ref,
  participant_refs,
  atomicity_scope,
  selected_guarantees,
  implementation_profile_ref,
  failure_outcome_binding_ref,
  evidence_boundary
)
```

The binding declares one exact local commit boundary and its participants. It applies only when atomicity or
another named transaction guarantee is claimed. It requires D48 typed failure outcomes and provider-specific
commit, rollback, conflict, partial-commit, and restoration observations. It never creates one transaction
over a multi-step Workflow or across independent resources.

Plain-language voice: a Transaction Guarantee Binding states exactly which writes must succeed or fail
together in one selected local transaction.

Domain-context voice: a durable-recovery coordination transition and its dispatch-outbox record share one
Recovery Unit of Work. Each recovery Operation separately owns its business-state-and-outbox transaction;
the coordinator never combines the two boundaries into a distributed transaction.

Use carefully: declare only guarantees the selected adapter and evidence can observe. Isolation, durability,
or rollback restoration must not be inferred from the word transaction.

Misuse warning: do not describe Workflow compensation as database rollback or claim Workflow-wide atomicity.

Challenge contract: unresolved participants, a missing D48 reference, partial-commit ambiguity, or a claim
beyond the selected local resource challenges the term; owner route = transaction binding owner plus the
Operation or durable-runtime owner.

Confirm contract: active as canonical local-transaction binding semantics; exact provider guarantees remain
profile-bound.

Promotion boundary: one declared local transaction boundary only.

Disposition: reuse. Owner: DomainSpec definitions-governance owner. Source: projects/domainspec-v2/definitions/DEFINITIONS.md at line 2507; SHA-256 f6974f45ef25dfd10a0028a07696dde7f7ae8dfde942bcb16c45dd33cbee4ee6.

## domainspec-v2-D48. Failure Outcome Binding

Status: active

Source kind: method-vocabulary; owner-admitted integration-failure classification

Evidence: [Operation, Workflow, and Infrastructure-Binding Pattern Research](../development/research/2026-08-20-operation-workflow-infrastructure-binding-patterns/TOWER.md) ·
[System Integration Contract Layer Revision 2](../development/refinement-runs/20260813T153029Z-system-integration-contract-layer-revision-2/RESULT.md) ·
[Infrastructure-Binding Architecture Admission](../development/meta-type-instantiation-cli/OWNER-INFRASTRUCTURE-BINDING-ARCHITECTURE-ADMISSION.json) ·
[Durable Recovery Architecture](../architecture/durable-recovery/README.md)

Research provenance: the Tower requires failure evidence to remain distinct from continuation authority;
Revision 2 introduces the candidate `FailureOutcomeBinding` record; the owner admission preserves
`retryable`, `non-retryable`, and `unknown` without turning classification into Retry selection.

Formal voice:

```text
FailureOutcomeBinding = (
  binding_id,
  concern_ref,
  provider_outcome_ref,
  outcome_class,
  evidence_refs,
  continuation_owner_ref
)

outcome_class in {retryable, non-retryable, unknown}
```

The binding classifies one provider or integration failure without selecting the continuation that consumes
it. `unknown` is required when evidence cannot distinguish application, rollback, commit, delivery, or other
relevant outcomes. Retry is permitted only through a separately declared continuation and stable semantic
identity; the binding cannot make an unsafe operation retryable.

Plain-language voice: a Failure Outcome Binding translates a concrete failure into a typed result while
preserving uncertainty instead of guessing what happened.

Domain-context voice: durable recovery maps store conflicts, rollback failures, authority loss, and unknown
Operation outcomes into explicit continuations. A D39 failed or unknown attempt remains distinct from the D44
terminal result of the whole recovery.

Use carefully: preserve the provider observation separately from the classification and the later retry,
escalation, or terminal decision.

Misuse warning: do not turn every failure into retry, collapse `unknown` into failed, or treat classification
as proof that state was restored.

Challenge contract: missing raw evidence, provider-authored continuation authority, or classification that
hides an unknown commit or business-effect outcome challenges the term; owner route = failure-outcome owner
plus continuation owner.

Confirm contract: active as canonical failure-classification semantics; retry mechanics and budgets remain
separately owned.

Promotion boundary: typed failure meaning only; no implicit continuation.

Disposition: reuse. Owner: DomainSpec definitions-governance owner. Source: projects/domainspec-v2/definitions/DEFINITIONS.md at line 2564; SHA-256 f6974f45ef25dfd10a0028a07696dde7f7ae8dfde942bcb16c45dd33cbee4ee6.

## domainspec-v2-D49. Durable Workflow Runtime Binding

Status: active

Source kind: method-vocabulary; owner-admitted durable-profile composition binding

Evidence: [Operation, Workflow, and Infrastructure-Binding Pattern Research](../development/research/2026-08-20-operation-workflow-infrastructure-binding-patterns/TOWER.md) ·
[System Integration Contract Layer Revision 2](../development/refinement-runs/20260813T153029Z-system-integration-contract-layer-revision-2/RESULT.md) ·
[Infrastructure-Binding Architecture Admission](../development/meta-type-instantiation-cli/OWNER-INFRASTRUCTURE-BINDING-ARCHITECTURE-ADMISSION.json) ·
[Durable Recovery Architecture](../architecture/durable-recovery/ARCHITECTURE.md)

Research provenance: the Tower supplies the durable-only composition spine; Revision 2 confirms the sibling
system-integration ownership plane and evidence join; the owner admission accepts the binding concept without
selecting its runtime, database, queue, or provider composition.

Formal voice:

```text
DurableWorkflowRuntimeBinding = (
  binding_id,
  workflow_profile_ref,
  persistence_binding_refs,
  transaction_guarantee_binding_refs,
  failure_outcome_binding_refs,
  scheduler_contract_ref,
  clock_contract_ref,
  wakeup_contract_ref?,
  replay_contract_ref,
  version_compatibility_ref,
  evidence_boundary
)
```

The binding is required only when a selected Workflow profile claims durable progress across process loss or
restart. It composes concern-specific contracts and bindings; it does not replace D46 persistence records or
turn runtime-provider behavior into portable Workflow meaning. A synchronous in-process Workflow profile does
not inherit checkpoint, lease, timer, replay, or version-compatibility obligations merely because the durable
profile has them.

Plain-language voice: a Durable Workflow Runtime Binding is the manifest that names everything a restart-safe
Workflow runtime depends on and the evidence required for that exact combination.

Domain-context voice: DomainSpec durable recovery uses this binding to connect Recovery Intent coordination,
the Recovery Repository and Unit of Work, Claim and Lease timing, retry scheduling, wakeups, restart
reconciliation, and Operation-owned replay safety without selecting a database or queue in the ontology.

Use carefully: bind one exact profile and provider composition. Persistence, scheduling, delivery, replay,
and version evidence retain their own scopes and owners.

Misuse warning: do not apply this binding to every Workflow, use it as a generic service container, or infer
that one passing provider proves every durable runtime.

Challenge contract: missing concern bindings, ambiguous synchronous/durable applicability, replay identity
drift, or absent restart/version evidence challenges the term; owner route = Workflow profile owner plus
system-integration owner.

Confirm contract: active as canonical durable-profile composition semantics; provider selection and runtime
proof remain implementation work.

Promotion boundary: exact durable-runtime composition and evidence boundary only.

<!-- SKELETON note: D1-D2 mint-seeded; D3-D5 consolidated 2026-07-01 into this canonical home (was the
     separate governance surface DSV2-D1/2/3, now removed). Companions backfilled 2026-07-01 to the current
     mint baseline: DEFINITIONS-INDEX + DEFINITION-DRIFT-AUDIT + DEFINITION-LOCALIZATION-ROUTE + reviews/.
     Governance-kind cards for layering-governance and drift-governance were added 2026-07-02 as D16/D17.
     DS-D1 meta-type system lives in meta-types/ (human meta-types.md + machine meta-types.yml), linked above. -->

## Proposed local product definition

normative: The candidate resumes one immutable recovery plan after process loss within one host boot, using exact Operation bindings and separate coordination and Operation-owned transactions. Duplicate invocations must not repeat a committed local business application.

formal: starts(occurrence) <= 3; applications(invocation_identity) <= 1; completed => every occurrence has durable success evidence; worker_advance => current claim and latest active lease and matching version; unknown != failed.

plain_language: After the worker crashes, another worker can continue the same recovery action and recognize business work that already committed.

domain_context: An example reservation compensation updates a local row. If that update commits before the worker records progress, the next attempt recognizes its stable replay key instead of applying the adjustment twice.

Candidate only; no authority effect. Limits and open questions are in the product profile and definition pack.
