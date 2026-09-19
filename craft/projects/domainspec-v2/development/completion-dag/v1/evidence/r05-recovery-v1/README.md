# R05 fenced worker candidate

`DSV2-R05-FENCED-WORKER-001` implements the bounded Python/SQLite worker step using the exact frozen R03 coordination store and R04 Operation ledger. This is product construction at the implementation-prototype stage. The candidate is not a full recovery product approval.

`Worker(coordination_path, operation_path, claimant_id)` opens existing resources with the required resource IDs `coordination` and `operation`. `acquire(dispatch_id)` validates the entire immutable plan against the pinned `adjust-balance` adapter, payload and D40 invocation identity before acquiring a lease. `renew()` replaces the lease generation. `run_one()` starts one uniquely identified attempt and records one occurrence's progress from the real Operation result. Calls on one instance serialize; separate workers coordinate through SQLite transactions and fencing.

```python
worker = Worker(coordination_path, operation_path, 'worker-a')
worker.acquire('dispatch')
worker.renew()  # caller drives the selected 1000 ms renewal cadence
result = worker.run_one()
```

The two resources must be distinct files; identical paths and hard links fail before database use. Existing schema/profile/resource mismatches fail read-only. Paths and the filesystem remain under the local trusted host owner; this candidate does not defend against concurrent filesystem replacement or hostile in-process modification.

Every coordination write validates the current claim, fence, lease generation, version and expiry in R03. An Operation can finish after the lease expires: its own atomic ledger transaction may commit, but the stale worker cannot commit coordination progress. The worker reports unknown in that case. A new claimant can recognize the exact result and reconcile an unknown predecessor without rewriting the old attempt or applying the effect twice. Fencing is coordination authority, not cancellation of an already running business transaction.

Renewal is explicit, not a background heartbeat. Calls serialize, so a blocking Operation can exceed the lease and take the unknown-result path. The selected 1000 ms cadence is caller responsibility; no autonomous polling service is claimed. `progress-complete` means every occurrence has evidence; it does not record a terminal disposition.

Validation: 16 focused tests, each run twice, including two actual-process claim competition and delayed-result takeover tests. Tests also cover whole-plan missing binding, invalid payload, resource aliases, expiry, renewal generation, unique attempts, ordered stable invocation identities, known failure without implicit retry, lost response recognition, missing outbox evidence and unsupported preexisting results. Raw results and the corrected test-helper development failure are retained in `TEST-RESULTS.json`. No independent review is claimed.

Run the read-only evidence verifier with `python3 -B projects/domainspec-v2/development/completion-dag/v1/evidence/r05-recovery-v1/verify.py`. It checks source/runtime currency, test bindings, packet file closure and receipt joins; it does not rerun tests. The test command is recorded in `TEST-RESULTS.json`.

Construction frontier: R05 is the worker candidate; R06 next owns persisted retry scheduling, terminal recording and restart/outbox orchestration. U00 and L00 remain independently runnable. The full recovery matrix and product approval remain outstanding. Historical compiler and EVF approvals are unchanged.

Operational support remains separate in `progress.json`, with existing owners and affected stages: release preparation, distribution coordination, EVF environment/stability evidence and recovery source-index maintenance. None is a causal blocker for this bounded worker. No publication, deployment, operational authority, or owner-controlled acceptance is granted.
