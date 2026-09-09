# KEP acknowledgement clock correction — 2026-09-06

**PASS for the scoped clock repair: 31 regular tests, seven PostgreSQL tests, and three real HTTP trials.**

Route: CA2-ROUTE-IMPLEMENT. Product construction: implementation and product-test evidence. Operational support: isolated local database/server test orchestration, owned by this task; no production stage change.

## Repair

The previous real HTTP evidence epoch reproduced a fresh acknowledgement rejected as expired when the host wall clock moved backward. Application constructors now sample UTC once and advance lifecycle time using monotonic elapsed time. Access and acknowledgement sample time after acquiring the state write lock. A backward or forward wall-clock correction during process uptime therefore cannot reverse or jump the active acknowledgement clock.

A persisted attempt from a later clock epoch still fails closed after restart: HTTP 503 with a clock-behind explanation, without recording an acknowledgement. Once time catches up, the original deadline governs. No grace period was added and no stored deadline was rewritten. Completed acknowledgement receipts remain idempotent. Retention remains one calendar year after the latest server-recorded successful acknowledgement.

## Validation

See rust-tests.txt: 31 regular tests passed. Seven separately invoked PostgreSQL tests passed on fresh databases, including persisted-attempt restart behavior; see postgres-*.txt. Deterministic regression coverage includes backward and forward wall corrections, success at 899 seconds, rejection at exactly 900 seconds, no false acknowledgement during clock-behind recovery, and receipt idempotence.

All three real HTTP trials passed: 72 acknowledgements each, 216 total, reconciled against PostgreSQL journals. Each trial retained three payload rows and returned 32 expected HTTP 429 responses with Retry-After. Health probes passed during all bursts. See results.json and client-*.txt. The three owned servers stopped cleanly and their ports are closed (cleanup.json). run.py is copied from the previous epoch and uses fresh databases, real loopback TCP, optimized client/server binaries, synthetic signing keys and no public RPC. Tests verify ciphertext fixture bytes, acknowledgements, PostgreSQL journal counts, default admission limits and health under concurrent requests. They do not exercise recipient grants, browser downloads or actual content decryption.

## Limits and next frontier

Startup UTC accuracy remains an operational prerequisite. During uptime, later wall-clock corrections are deliberately not applied to lifecycle timestamps. Monotonic elapsed time across system suspension is platform-dependent; this is not a suspend-proof or globally synchronized clock. After restart the persisted UTC comparison remains authoritative, and a clock-behind response requires a later retry; no automatic client retry was added. Deterministic injected-clock tests establish the correction behavior; successful load tests alone do not establish that the host clock stepped during those runs.

Next runnable construction validation: bounded longer soak plus slow-reader/disconnect cases. Five-second idle samples do not distinguish allocator retention from a leak. TLS/reverse-proxy behavior, production capacity, database memory and public-chain transactions are outside this evidence.

Operational residue belongs to the deployment operator: host time synchronization investigation, exact candidate review, coherent database/binary recovery rehearsal and a separately scoped rollout. The previous database migration still makes binary-only rollback unsafe. These tests do not grant product approval, admission or deployment authority.

## Preserved historical residue

The prior http-load-20260906 FAIL report and its failed databases remain historical evidence, unchanged. scope.json compares pre-turn fingerprints for source, tests, migrations and evidence: four existing files changed, one new clock module added, all previous evidence and migrations unchanged. Existing unrelated dirty work, alchLang, keys, running preview and production were not modified by this task. New test databases are retained. No commit, push, approval, release or deployment occurred.

## HTTP measurements

| Trial | Peak server RSS (MiB) | Pre-shutdown idle RSS (MiB) | 10 MB upload (ms) | Access p95 at concurrency 4 (ms) |
|---|---:|---:|---:|---:|
| 1 | 144.4 | 144.4 | 401.7 | 189.1 |
| 2 | 196.4 | 184.7 | 516.1 | 353.5 |
| 3 | 165.2 | 165.2 | 491.1 | 3473.9 |

The shared host produced substantial latency variation, including a 3.47-second access p95 in trial 3. No latency SLO is established. RSS excludes PostgreSQL and the client. Samples cover short trials and five seconds idle, not a long-term memory stability claim. binaries.json binds the tested optimized binaries; SHA256SUMS binds the source/test/migration inputs and this evidence epoch.
