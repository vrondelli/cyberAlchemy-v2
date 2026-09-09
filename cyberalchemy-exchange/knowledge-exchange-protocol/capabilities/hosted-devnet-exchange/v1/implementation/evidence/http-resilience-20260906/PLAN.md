# Bounded HTTP resilience validation — 2026-09-06

CA2-ROUTE-IMPLEMENT, owner-directed product-test work. This plan grants no product approval or operational authority.

## Product construction frontier

The acknowledgement-clock repair has passed its previous scoped tests. Runnable now: add transport-level slow-consumer and disconnect coverage, and extend the earlier short load trials with a three-minute soak. Exact new files: tests/http_resilience.rs and this evidence directory. Existing implementation, migrations and earlier evidence are preserved.

Dependency graph: existing optimized implementation -> compile new harness -> fresh local database/server -> soak -> fresh local database/server -> bounded slow readers -> recovery/journal assertions -> scope and evidence report. These are test dependencies, not deployment gates.

Soak: 60 sequential 1 MB fixture downloads, each verified and acknowledged, with three seconds between transactions. Probe health and reconcile 60 journal records. Observe memory through six ten-transaction phases and 15 seconds idle. This includes legitimate growth from 60 persisted attempt records.

Slow readers: three cycles, each offering at most six sequentially opened 10 MB responses. Read only 1 KiB per socket every 500 ms for five seconds, then disconnect without acknowledgement. Probe health during the hold, inspect persisted attempts and acknowledgement counts, then complete and acknowledge a normal 10 MB download after each cycle. Observe 15 seconds final idle.

Required observations: no implicit acknowledgement or first expiry after a partial transfer; normal download recovery; health completes within a two-second test timeout; exact journal counts. Desired hardening criterion: no more than four outstanding successful large response bodies, matching the default request-concurrency resource envelope. The implementation currently names this a request limit, not an explicit response-stream guarantee; the test distinguishes that semantic gap instead of treating successful handler admission as proof of bounded transport memory.

## Operational support

This task owns disposable loopback servers and newly created kep_resilience_* PostgreSQL databases inside the existing local test container. Public RPC is disabled by pointing it at unused loopback port 9. Synthetic fixture keys only. Each client has a 360-second process deadline, socket I/O timeouts, and bounded requests. Only owned processes are stopped. Test databases and failure evidence remain retained.

Deployment operator owns host time synchronization investigation, recovery planning, production sizing, TLS/proxy validation and separately scoped rollout. None is a prerequisite for the local tests. Preview and production stay untouched.

## Open questions

Does handler-only admission leave response buffers outstanding beyond the intended memory bound? Does memory settle between identical slow-reader cycles? A short soak cannot establish absence of leaks, production throughput, suspension-safe timekeeping, browser behavior or recipient grant correctness. A failed resource criterion must remain FAIL even if download correctness and recovery pass.
