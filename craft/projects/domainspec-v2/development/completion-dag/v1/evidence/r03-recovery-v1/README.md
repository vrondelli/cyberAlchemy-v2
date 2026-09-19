# R03 atomic coordination store

R03 implements a repository-local Python/SQLite coordination provider candidate using the unchanged R02 schema. It does not execute Operations or access their business database.

## Implemented behavior

- Register and reopen a frozen intent, ordered plan, payload/binding digests and dispatch. Reuse the hash-bound Python D37/D40 verifier. Identical registration returns the existing identity; conflicting identities or duplicate transition IDs reject.
- Acquire and renew claims/leases, reserve bounded attempts, record outcomes and monotonic progress, persist retry schedules, and record evidence-bound terminal state through named store methods.
- Serialize each transition through BEGIN IMMEDIATE, compare the expected version, and atomically write state, incremented version, transition identity and dispatch outbox. Check current claim and latest active lease before writes and immediately before commit.
- On takeover preserve the old attempt as unknown. Reconciliation can record a caller-verified matching Operation result without rewriting that attempt. The store does not independently prove the supplied business evidence.
- Read-only preflight rejects schema/profile/resource/boot mismatches. Mutable connections verify foreign keys and synchronous EXTRA; all use DELETE journaling. Existing databases are never initialized or migrated on reopen.
- Lookup of a stable transition ID plus command digest returns its original committed response for ambiguous-commit reconciliation. It does not implicitly retry the command.

## API and dependencies

Use Store.initialize(path, resource_id) only for a new file; Store(path, resource_id) opens existing storage. Tests use an injected clock, while the default clock reads the current Linux boot ID and monotonic milliseconds. The R02 provider profile and SQL, and the original Python recovery identity implementation, remain the exact pinned inputs.

The named methods register, acquire, renew, start, outcome, reconcile, schedule and terminal specialize R02's generic command seam. No raw SQL transaction callback is exposed. Failures use StoreFailure exceptions with explicit code and classification rather than R02's proposed return-value union. The inherited reference identity validator can raise its existing WorkflowRecoveryError on malformed identity. Neither interface adaptation claims conformance to the unimplemented generic Protocol as written.

Result evidence is an input supplied by the future bound worker/Operation adapter. A store PASS does not establish that a business effect happened. Paired resource identity validation, actual replay-result observation, binding-to-callable verification and Operation-owned at-most-once application remain R04/R05 obligations. Outbox rows are persisted; an outbox delivery service is not implemented here.

## Validation

Run from the repository root:

    python3 -B projects/domainspec-v2/development/completion-dag/v1/evidence/r03-recovery-v1/test_store.py
    python3 -B projects/domainspec-v2/development/completion-dag/v1/evidence/r03-recovery-v1/verify.py

The final recorded suite passed 24 tests. It covers immutable registration, duplicates, incomplete bindings, tampered identities, competing processes, expected-version conflict, busy writers, rollback after progress/outbox writes, claim takeover, lease generation and exact expiry, retry timing/budget, completion evidence, clock/resource/schema mismatch, unknown-result reconciliation and SIGKILL before/after commit. Tests use only temporary local databases and mock result evidence. TEST-RESULTS.json preserves the final raw output and the two corrected development failures.

These are bounded store tests, not the complete R01 30-scenario product test suite. No full worker, remote effect, OS reboot, power-loss or production guarantee is established. No independent source review is claimed.

## Construction frontier

R03 storage implementation criteria are complete. R04 Operation replay ledger is next. R05 worker integration depends on both R03 and R04; it remains pending. U00 and L00 are independently ready. The recovery product is not approved.

Operational residue stays with its recorded owners: recovery architecture/source-index maintenance; repository/release owner O01; EVF package owner O06; EVF/TLC environment and stability follow-up. None blocks the next R04 prototype. No publication, release, deployment or external business effect occurred.
