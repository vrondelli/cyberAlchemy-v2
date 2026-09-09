# KEP hosted file-response integration — 2026-09-06

**PASS for the scoped file-response integration: 43 regular tests, the optimized real-route PostgreSQL test, three PostgreSQL regressions and three hosted HTTP trials.** The optimized close-generation test also passed. No product approval or operational authority is granted.

Route CA2-ROUTE-IMPLEMENT. Product construction: integrate separate bulk capacity and per-response deadlines into the actual file-access route and hosted listener. Operational support: local test orchestration with fresh PostgreSQL databases and owned loopback servers. Preview and production remain untouched.

## Behavior

File access reserves one of four transfer slots after authorization and before payload copying or attempt persistence. A full pool returns HTTP 429 with Retry-After and does not create an access attempt. Payload bytes retain the reservation through Hyper's validated vectored-write path.

The hosted listener supplies a connection-specific TransferClock. Each file response acquires a unique generation, retained alongside its serialized bytes. DeadlineIo observes the active generation, starts timers on its first write, and clears old timers when that generation ends. The default write-progress timeout is 30 seconds; the absolute write budget is 300 seconds. Neither is a promise of client receipt. Kernel-buffered bytes and allocator retention are outside the slot accounting.

An idle keep-alive connection therefore does not retain an expired response deadline. A later bulk response receives a new generation and budget. Normal requests do not activate a bulk write deadline. The existing 15-second incoming-body timeout and handler admission remain intact.

A request queued on the same connection waits before entering its handler while an earlier response owns bytes. Timeout marks that connection closed before releasing its generation; queued requests cannot mistake resource release for permission to enter a database handler. The dedicated test checks both this ordering and a real pipelined registration remaining absent after timeout. Other connections can still acknowledge completed downloads and read accounts while the four transfer slots are occupied.

This integration uses the currently enabled HTTP/1.1 path. http-features.txt confirms Axum HTTP/2 is disabled. The listener preserves vectored writes and rejects unsupported scalar I/O rather than silently using Hyper's copying path. No dependency upgrade or database migration was needed.

## Verification

- Optimized real KEP router + fresh PostgreSQL: four held file responses accepted; next two rejected; no rejected access attempts persisted. A prior successful access could be acknowledged during saturation, and a signed account read succeeded.
- The exact same TCP connection completed two verified full downloads separated by six seconds idle, exceeding the test's five-second previous-response absolute budget.
- Unread responses timed out with clients still holding their sockets open. Partial attempts remained unacknowledged; last_download_at and expires_at exactly matched the prior successful receipt. A full recovery download and acknowledgement succeeded. PostgreSQL held exactly two acknowledgement journal entries.
- A mutation pipelined behind an unread response did not execute after its timeout. The deterministic close-generation test independently confirms a queued waiter returns an error after timeout even when the lease is subsequently dropped.
- Three optimized hosted-binary HTTP trials passed: 72 reconciled acknowledgements each, 216 total. Fixture ciphertext was verified and default admission limits and health checks were exercised. Peak server RSS was 177.2, 196.4 and 197.7 MiB. These short mixed-load trials do not establish a memory plateau or latency SLO.
- PostgreSQL expiry atomicity, backward-clock restart and single-writer fencing regressions passed on three fresh databases. Their test binaries preceded the final connection-close guard; the guard does not change persistence code. Final-source coverage is provided by the optimized integration tests and final regular suite.
- All three standalone HTTP test servers exited and their ports are closed (cleanup.json). Fixture server tasks are scoped to their Rust test runtimes.

Logs: integration-optimized.txt, postgres-*.txt, client-*.txt, results.json, rust-tests-final.txt. build-final.txt is the final optimized build. run.py uses build.txt to locate the executable path; that path is identical in both build logs and binaries.json hashes the final executable actually run. It does not execute a retained old binary.

## Preserved initial fixture failure

The first unoptimized integrated test failed its rejection assertion: a fifth request returned 200. Its retained attempt timestamps show held readers issued over roughly three seconds, exceeding the fixture's two-second idle timeout; this is consistent with the oldest transfer expiring during setup. It was not treated as a successful capacity test.

The initial test source, failing log, database identity and attempt extract are retained as initial-integration-test.rs, integration-test.txt, database.json and initial-attempts.json. The revised test explicitly requires setup under one second and runs against optimized code. Assertions for four successful holders, two rejections, timeout, persistent reuse and state correctness were retained. Its fresh database is recorded separately in optimized-database.json. No failed database was reused or edited to make a test pass.

## Limits and remaining work

The new pool and bulk deadlines cover file-access responses. Legacy artifact access and account-response buffering are not claimed to have the same resource bound. The independent account liveness test is not a resource-budget proof for account payloads.

The original three-minute soak predates this integration and remains historical evidence. A longer soak of this candidate, slow-progress real-network scenarios, peak-allocation/byte-budget analysis and a separate review of the final changes remain runnable product-validation work. Earlier deterministic transport tests cover progress and flush behavior, but do not constitute production link tuning. TLS/proxy handling, HTTP/2, recipient grant/public-chain flows, production capacity and connection-count limits remain outside this epoch.

No claim is made that arbitrary client disconnects can never cancel a handler. The new timeout ordering specifically prevents a successor handler on the same HTTP/1.1 connection from starting while the predecessor's bulk generation can time out. Future multiplexing or connection-level timeout changes require fresh cancellation-scope evidence.

Operational residue belongs to the deployment operator: host time synchronization, proxy policy, coherent database/binary recovery, production timeout tuning and separately authorized rollout. Those tasks do not block local validation. The earlier migration still makes binary-only rollback unsafe.

## Preservation and open questions

Preimages of the five changed files are retained in preimage/. All previous evidence, tests and migrations remain unchanged. A separate src/ui.rs change was detected after validation and preserved; see the post-test drift note below. No alchLang work, wallet keys, preview process, production service, commit, push, approval or deployment was changed. Test databases remain retained for inspection.

Open questions: whether count admission should be complemented by a byte budget, memory behavior during extended load, and which remaining response routes require equivalent protection. Final review and operational decisions remain separate from passing tests.

## Post-test unrelated drift

Final scope inspection detected src/ui.rs changing outside this task's edits. Its recorded filesystem modification time is 13:19:16 local, after the final regular-test log at 13:19:05 and the optimized build log at 13:13:25. No writer identity was inferred and the file was not reverted. scope.json records its before/after hashes separately from this task's five changed source files.

The passing results apply to the tested build and this repair's source, not to the entire current checkout after that UI edit. SHA256SUMS records the final observed files, including the untested UI postimage; it is not a claim that every observed byte was present in the tested binaries. binaries.json separately binds the optimized executables used by the HTTP trials. A coherent whole-checkout candidate requires joining that UI work and revalidating its affected scope before any publication or deployment claim.
