# R04 Operation replay ledger

R04 implements an Operation-owned local SQLite adapter for one example Operation, adjust-balance. It uses the unchanged R02 Operation schema. It imports the pinned D40 identity function, not the coordination store.

## Behavior

The adapter checks the exact Operation, adapter/schema binding digest, occurrence identity and payload digest. Its closed payload names an existing balance row and a nonzero integer adjustment bounded to one million in magnitude. The resulting balance must remain between zero and the signed 64-bit maximum.

One BEGIN IMMEDIATE transaction recognizes an already-recorded success or updates business state, stores the successful invocation result and appends the Operation outbox event. Repeated invocation returns the original result, including the original before/after values, even after another invocation changes the balance. A repeated identity with different payload, Operation or binding rejects. Different occurrence identities may each apply once.

Read-only recognize returns None for observed absence, not for unreadable evidence. Lost commit response, unreadable storage, corrupt result digest or missing outbox evidence remain explicit unknown failures until reconciliation. The caller must not interpret absence as proof that an in-flight stale invocation cannot commit; apply_or_recognize repeats the lookup under the write lock.

No callback or remote business action is executed. Initialization exclusively creates a new local database and seeds explicitly provided example balances. Existing storage gets read-only schema/profile/resource preflight; it is never silently migrated. Runtime connections use DELETE journaling, synchronous EXTRA and foreign keys. The adapter's timestamp is receipt metadata and grants no claim/lease authority.

## Integration contract

ledger.py exposes Ledger.initialize, Ledger, make_invocation, recognize and apply_or_recognize. Results contain evidence and replayed. The evidence object has the exact fields accepted by R03 reconcile: invocation_id, binding_digest, payload_digest, result_digest and result_json. Named methods and LedgerFailure exceptions specialize R02's proposed generic Protocol; no drop-in Protocol conformance is claimed.

The binding digest includes the adapter and schema bytes. R05 must resolve the exact Workflow Operation binding and pair distinct coordination and business resources before invocation. R04 verifies its own resource/schema and D40 inputs; it does not prove plan admission, authorize callers or replace worker preflight. Full store-to-worker integration remains pending.

## Tests

The final recorded suite passed 21 tests: repeat/reopen, original-result retention, payload/binding/identity mismatch, distinct occurrences, closed payload and integer guards, rollback after business mutation, unknown-response reconciliation, busy writers, read-only resource/schema failure, missing/unreadable storage, missing outbox evidence, concurrent duplicate processes and SIGKILL before/after commit. Concurrent duplicate calls produced one business change, one result and one outbox event. Before-commit process death left no partial application; after-commit death was recognized without a second effect.

Run from the repository root:

    python3 -B projects/domainspec-v2/development/completion-dag/v1/evidence/r04-recovery-v1/test_ledger.py
    python3 -B projects/domainspec-v2/development/completion-dag/v1/evidence/r04-recovery-v1/verify.py

Tests use temporary local files. This is bounded adapter evidence, not the complete R01 recovery product suite, remote payment correctness, universal exactly-once delivery, reboot/power-loss durability, independent review or production approval.

## Construction frontier

R04 is complete for the bounded ledger candidate. R03 and R04 now supply the inputs for R05 fenced-worker integration. U00 and L00 remain independently ready. Recovery product approval remains pending.

Operational residue remains separate with the prior owners: architecture/source-index maintenance; repository/release owner O01; EVF package owner O06; EVF/TLC environment and stability follow-up. None blocks R05 prototype construction. No publication, deployment or external business effect occurred.
