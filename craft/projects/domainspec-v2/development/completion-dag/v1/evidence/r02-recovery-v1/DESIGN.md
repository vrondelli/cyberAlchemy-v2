# R02 storage and worker prototype

This is a system prototype for the R01 Python/SQLite product. The compiler validates the navigation model and binding formation. It does not generate the SQL implementation or prove worker behavior.

## Storage ownership

Coordination owns metadata, immutable intent and occurrences, dispatch/version, claim and lease history, attempts, completed progress, retries, terminal evidence, transition identities and dispatch outbox. The Operation owns its independent metadata, example business rows, immutable successful invocation results and Operation outbox. No transaction spans these resources. The SQL files initialize fresh prototypes only; the provider contract forbids running initialization against an existing database to erase a version mismatch.

The graph projects 23 architecture components onto 21 Entity/Operation nodes. Names are navigation references; the graph's UUID identity field is a scaffold field, not a replacement for D37/D40 hashes or the SQL identifiers. Operation effect arrays are not executable declarations of provider behavior. SQL, typed contracts, and the worker protocol carry that candidate design explicitly. Binding manifests retain runtime_guarantees_observed=false.

## Worker transition protocol

1. Preflight exact schema/profile, resource pair, boot/clock identity and every Operation binding before any invocation. Read and verify the entire frozen plan. Reuse R00's Python planning and invocation-identity algorithms.
2. Register the intent, dispatch, occurrence rows and initial transition/outbox atomically. Duplicate failure input with identical material returns existing identity; changed material rejects. Registration is the explicit bootstrap exception to worker claim requirements.
3. Acquire through a store arbitration transaction: compare dispatch version, reject a live current claim, supersede expired/released authority, increase the durable fence, create a lease, increment version and record transition/outbox. Takeover marks any unfinished predecessor attempt unknown before successor handling. It cannot change frozen intent or completed progress.
4. A guarded advancement checks version, current claim/fence, latest lease generation and validity inside the serialized transaction. It checks monotonic time again immediately before COMMIT. Keep the transaction short; no Operation callback or external wait inside it. The claim check protects coordination serialization; the local replay ledger separately protects business effects of a worker already executing when its lease expires.
5. Reconcile an existing successful Operation result before starting again. A matching result can be recorded as progress under current authority while preserving the old attempt's unknown outcome. Absence permits replay only through the explicit frozen policy and remaining budget; it does not prove no stale invocation remains in flight.
6. Start the first incomplete occurrence: atomically allocate attempt ID/number, reserve its budget and mark executing before invoking. Claim/lease renewal never allocates an attempt. An unfinished attempt has NULL outcome; NULL means pending evidence, not a fourth terminal attempt outcome.
7. Invoke outside the coordination transaction. The Operation adapter uses its own transaction to return an existing matching result or atomically apply business state, successful result and Operation outbox. Stable replay identity remains unchanged. A callback exception must not be interpreted as proof of no commit.
8. Revalidate current authority before recording an outcome. Stale or expired authority cannot commit progress. The replacement worker retains unknown for a lost execution and reconciles separately; it never changes unknown into a fabricated failed result.
9. Known failed outcomes follow the exact Operation continuation. Retry persists predecessor, not-before, budget and policy before eligibility. Three starts consume the R01 budget. Terminal disposition uses explicit continuation or consumed-budget/all-success evidence. Exhausted may coexist with a business effect and makes no zero-effect promise.
10. Complete terminal evidence and semantic projection in the same coordination transaction. No successor is implicit. Outbox delivery runs after commit; marking delivery changes projection state only. Missing or duplicate wakeup hints never own dispatch truth.

## Enforcement allocation

SQL supplies unique failure identities, one current claim, historical identity joins, bounded attempt numbers, closed state domains and immutable plan/progress/result rows. It does not enforce every transition invariant. R03 must enforce expected-version CAS, exact fence and latest lease, monotonic clock, allowed state transitions, complete frozen-plan verification, prefix progress, budget derivation, retry timing, terminal evidence, and atomic transition/outbox pairing. R04 must implement Operation-owned replay recognition and business transaction behavior. R01's 30 scenarios remain unrun runtime obligations, each assigned in obligations.json.

The terminal table's attempt reference must be checked against the same dispatch by the R03 transition validator; the foreign key alone checks existence. Claims' and attempts' fences must also be joined by the runtime validator. Schema smoke PASS must not be read as proof of these joins.

## Version and resource compatibility

Schema v1 is exact, not a migration range. Reopen checks metadata and PRAGMA user_version before writes. Bind each database to its expected distinct resource identity and the exact product/schema profile. Refuse alias paths, unexpected resource pairs, a changed host boot, regressing clock, malformed stored JSON, altered hashes, unsupported versions or corrupted stores. No repair, reset, migration or new terminal state is implied by an error.

Runtime lock records the observed Python interpreter, sqlite3 adapter and SQLite shared library bytes. Full runtime test environment closure and process-kill harness evidence belong to successor runtime tests. The current compiler archive and Node executable are pinned independently.

## Construction frontier and support residue

R02 completes prototype compilation, schema shape checks and obligation allocation only. R03 (coordination store) and R04 (Operation replay ledger) now have the design input they need; U00 and L00 remain independent. No recovery product approval is claimed.

Operational support remains with its prior owners: recovery architecture/source-index owner for eight stale historical bindings; repository/release owner for O01; EVF package owner for O06; EVF/TLC owners for runtime environment and intermittent TLC investigation. These do not block R03/R04 prototype work. Publication, release, deployment and external business effects are not part of R02.
