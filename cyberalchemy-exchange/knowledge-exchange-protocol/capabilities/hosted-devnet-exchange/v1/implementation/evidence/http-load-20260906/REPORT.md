# KEP real HTTP / isolated server load test — 2026-09-06

**Overall: FAIL — acknowledgement timing failed under a backward wall-clock change.** Two initial trials passed; the third failed. One bounded diagnostic trial reproduced the failure and captured its error response. Testing stopped. This is not production-readiness evidence.

Route: CA2-ROUTE-IMPLEMENT for the new product-test harness. Product construction / validation lane. Existing application code, policy and database migrations were not changed.

## Finding requiring repair

The diagnostic request successfully received and verified its fixture ciphertext, then acknowledgement returned HTTP 409:

`{"error":"state_conflict","message":"download acknowledgement window expired"}`

For attempt `http-8-6-3`, the response's acknowledgement deadline was 1788691907. The 900-second window and persisted record put issuance at **1788691007**. The client captured the same host's wall clock as **1788691005.605227138** at failure, approximately **1.395 seconds earlier than issuance**. The retained database record confirms the issue time and has no acknowledgement timestamp.

`src/file_routes.rs` captures `(app.clock)()` and rejects acknowledgement if `now < attempt.issued_at` or the 900-second deadline is reached. `Application::postgres` supplies `SystemTime` as that clock. A backward wall-clock change therefore makes a fresh attempt fail with an "expired" error. This is the observed failure path; the underlying reason the host clock changed has not been investigated or attributed to a particular host service.

The first failure discarded its error response. Its retained attempt existed, had revision 0 and was unacknowledged. A diagnostic-only harness change captured error bodies, deadline and client epoch; the fresh diagnostic run reproduced the timing failure. The initial failure is consistent with the same cause, but its missing response cannot be reconstructed with certainty.

No retry weakened the acceptance assertion. No failed database was reused or modified to make a test pass. Both failed databases and their journals remain available; failed-trial-state.json and diagnostic/failed-attempt.json contain bounded read-only extracts.

## Completed-run measurements

Actual optimized `hosted` binary, separate optimized client process, real loopback HTTP sockets and PostgreSQL. Default quotas/admission limits were retained. External RPC was overridden to unused loopback port 9; the exercised owner upload/access/acknowledgement paths made no public-chain calls. Fixtures use synthetic signed commands and known ciphertext bytes; this does not test recipient grants or real content decryption.

Each completed trial uploads 1,024 bytes, 1 MB and 10 MB, then sends eight bursts each at concurrency 1, 4 and 8. File sizes rotate between bursts; each burst also probes health, acknowledges verified downloads sequentially and registers a test identity. One-second pauses bound the traffic. A five-second idle period follows. Each complete run validated 72 successful acknowledgements against PostgreSQL and retained three payload rows: **144 reconciled acknowledgements across the two complete trials**.

| Measurement | Trial 1 | Trial 2 |
|---|---:|---:|
| Server lifetime peak RSS | 163.7 MiB | 178.2 MiB |
| Median RSS during idle-labelled samples | 163.6 MiB | 169.0 MiB |
| 10 MB upload | 623.8 ms | 775.3 ms |
| Mixed access p95, concurrency 1 | 194.0 ms | 542.7 ms |
| Mixed access p95, concurrency 4 | 310.2 ms | 1,633.3 ms |
| Mixed access p95, concurrency 8 | 400.5 ms | 353.6 ms |
| Expected 429 responses | 32 | 32 |

All expected 429 responses occurred at concurrency 8 and carried Retry-After. Health probes succeeded during bursts; per-phase health p95 ranged from 3.0 to 24.7 ms in completed runs. Latency variation was large on this shared host; these small samples are not an SLO or throughput guarantee. Latencies include sending requests and consuming response bodies, excluding request preparation except where the raw identity metric explicitly includes signing.

Memory was sampled every 50 ms from `/proc/<server-pid>/status`. Kernel VmHWM preserves peaks between polls. Figures exclude client and PostgreSQL processes. Idle-labelled samples in the initial runner include a short shutdown tail; the median reflects the stable five-second idle level rather than the misleading final teardown sample. The runner now explicitly labels shutdown for future runs. Five seconds cannot distinguish allocator retention from a leak or establish long-term stability.

## Evidence and reproduction

- tests/http_load_profile.rs: bounded real HTTP client, byte verification, limits, health probes and journal checks; error assertions retain failure details.
- run.py: fresh disposable database per trial; starts only a loopback server; disables public RPC; reads only that server PID for memory; 90-second client timeout; always stops its own processes. `KEP_HTTP_DIAGNOSTIC=1` selects one diagnostic trial.
- initial/http_load_profile.rs and initial/run.py: original harness versions before diagnostic instrumentation.
- client-1.txt and client-2.txt plus initial-successes.json: complete successful outcomes recovered from retained logs after the aggregate runner stopped on trial 3.
- client-3.txt and diagnostic/client-1.txt: retained failing runs. There is deliberately no all-pass aggregate results.json.
- server-memory-*.json, server logs, environment.json and build logs: measurement context.
- cleanup.json: all four test listening ports were closed after shutdown.

## Frontier and operational residue

The requested real HTTP measurements are complete, but the correctness gate failed. Next runnable construction work: define backward-clock handling for acknowledgement windows, add a deterministic injected-clock regression test, implement the selected behavior and rerun this workload. Preserve one-year retention semantics and durable restart behavior; do not merely remove a timing guard without defining its replacement.

After that repair, longer bounded soak and slow-reader/disconnect tests can distinguish transient response-buffer peaks from retained memory. Server sizing, TLS/reverse-proxy capacity, database memory and production load remain untested.

Operational support remains with the deployment operator: exact candidate review, coherent database/binary recovery rehearsal and separately authorized rollout. These measurements grant no approval or deployment authority. The earlier migration still makes binary-only rollback unsafe.

## Preserved historical residue

Before/after fingerprints show no changes to any pre-existing source, test, migration or evidence file. Only the new HTTP harness and this evidence directory were written. Previous evidence epochs, unrelated dirty work, alchLang, wallet keys, the running preview and production were untouched. Four disposable databases remain recorded in initial-databases.json and diagnostic/failed-attempt.json. No commit, push, approval, release or deployment occurred.
