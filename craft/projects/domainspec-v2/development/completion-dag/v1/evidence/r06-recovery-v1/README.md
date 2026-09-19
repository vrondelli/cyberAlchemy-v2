# R06 retry, terminal and restart candidate

`DSV2-R06-RETRY-RESTART-001` adds persisted recovery orchestration to the frozen R05 worker, R03 coordination store and R04 Operation ledger. It is a product-construction implementation prototype under the R01 same-host, same-boot Python/SQLite profile. Prior candidate bytes and approvals are unchanged.

## Runtime API

```python
from recovery import Recovery

runtime = Recovery(coordination_path, operation_path, 'dispatch', 'worker-a')
result = runtime.poll()  # invoke again on the caller's 1000 ms polling cadence
```

The databases must already be initialized and the exact intent and bindings registered. Reconstructing `Recovery` reopens those databases without migration or initialization. Every poll reads the durable dispatch, attempts, progress, schedule and terminal evidence. It acquires or takes over a claim when allowed and renews an owned lease after 1000 ms. A live foreign claim is a waiting result. An unfinished attempt is allowed to expire rather than being renewed forever; takeover durably records it as unknown.

A poll performs at most one execution attempt, reconciliation, retry scheduling or terminal step, in addition to necessary claim/lease preparation. It does not run the successor after an unknown result or failure in the same call. Polling is caller-driven; there is no background service or wall-clock sleeping loop. A blocking Operation can outlive its lease, as in R05.

Results distinguish `succeeded`, `failed`, `unknown`, `blocked`, `waiting`, `retry-scheduled`, `reconciled`, `terminal-recorded` and previously recorded `terminal`. These are local runtime observations, not product acceptance or operational authorization.

## Retry and completion behavior

The runtime resolves the exact Operation result before any successor of a failed or unknown attempt. Unreadable or contradictory result evidence stops that poll. Observed absence permits a retry only under the frozen `retry` continuation, with a persisted 1000 ms delay and a maximum of three execution starts per occurrence. Claim changes consume no attempts; restarting does not reset the schedule or budget. D40 invocation identity remains unchanged across those starts.

The R06 `RecoveryStore` subclasses the exact R03 store for a consistent read view, observed-result reconciliation and outbox projection. Its reconciliation method extends the R03 latest-unknown prerequisite to accept a latest failed attempt as well: an older in-flight Operation may commit after a newer attempt has failed. The caller must supply evidence recognized by the pinned ledger. The transaction validates occurrence/binding/payload, claim, lease, version and predecessor, then adds progress without changing either attempt's recorded outcome. This is a successor implementation, not a modification to R03 or a claim that the generic R02 Protocol was implemented verbatim.

Before completion, every progress record is checked against the current Operation-owned result and outbox evidence. `completed` is recorded with semantic status `satisfied` only after all occurrences have progress. `exhausted` follows the selected terminal-failure continuation or the consumed retry budget; `escalated` follows the selected escalation continuation. Both are `unresolved`. The terminal evidence, semantic projection, transition and dispatch event commit together. Escalation records a disposition; it sends no message or successor workflow. Unresolved does not prove absence of a late business effect.

## Dispatch outbox

`pending_hints()` returns undelivered local events with their payload digests. `poll(event_id)` validates an optional event ID, then rereads current durable truth rather than replaying the old command. The same event can wake the runtime repeatedly. Polling without an event is supported.

`acknowledge(event_id, payload_digest)` marks that exact local hint observed. It verifies dispatch ownership and payload, updates only delivery projection and clock high-water metadata, and creates no recovery transition, attempt, version increment or successor event. Repeated acknowledgement returns the original observation. It also works after a terminal result. This is local consumption bookkeeping, not external delivery. A missing notification is harmless; a missing or mismatched durable outbox row is an evidence failure and blocks advancement.

## Validation and limits

Twenty focused tests run twice, with complete output and source hashes in `TEST-RESULTS.json`. They cover restart from partial progress, retained retry delay, three-attempt exhaustion, escalation, terminal-failure policy, stable identity, committed and absent unknown results, a late older success after newer failure, active-attempt expiry, missing result/outbox evidence, clock/boot failure, SQLite contention and competing processes. Actual SIGKILL tests cover before and after schedule, terminal and acknowledgement commits. No required R06 focused test is skipped.

Verify the packet without mutations or rerunning tests:

```sh
python3 -B projects/domainspec-v2/development/completion-dag/v1/evidence/r06-recovery-v1/verify.py
```

The verifier checks source/runtime currency, recorded test bindings, file closure and receipt/progress joins. The candidate assumes trusted in-process callers and local filesystem ownership, as R05 does; no hostile database editing, remote effects, cross-boot recovery, power-loss guarantee, multi-host behavior or production readiness is claimed. The complete R01 failure matrix and independent replay have not been executed by R06.

## Remaining construction and operational support

R06 is complete as this bounded implementation candidate. R07 is next: exercise the complete failure matrix and produce the product-test manifest and independent replay report. U00 and L00 remain independently runnable. Full recovery-product approval remains outstanding; compiler and EVF approvals remain historical and unchanged.

`progress.json` preserves separate operational-support residue with owners and affected stages: Repository/release owner for compiler release preparation; existing portable EVF package owner for distribution publication; E03/E04 execution owner for test-environment verification; Portable EVF/TLC owner for the prior stability cause; and DomainSpec recovery architecture/source-index owner for source-index maintenance. These do not block the runnable construction frontier. No publication, deployment, owner decision or operational authority is granted.
