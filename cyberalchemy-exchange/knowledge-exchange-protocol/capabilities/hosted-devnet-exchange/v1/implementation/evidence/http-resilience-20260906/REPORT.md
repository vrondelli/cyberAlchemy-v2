# KEP HTTP soak and slow-reader evidence — 2026-09-06

**Overall FAIL: the desired bound on outstanding response bodies is not enforced.** The three-minute soak passed. Partial-transfer retention, health and recovery checks passed. The slow-reader resource assertion failed in all three observed cycles. No implementation repair is claimed by this epoch.

Route: CA2-ROUTE-IMPLEMENT. Product construction: new product-test harness and evidence. Operational support: isolated local server/database orchestration owned by this task. See PLAN.md for the dependency graph, exact scope and deferred operations.

## Finding

The default `Limits.concurrent_requests` is four. In `src/api.rs`, `bound_request` holds an owned semaphore permit only until `next.run(...).await` returns the response. The permit drops before transport consumption of the response body finishes. Thus the existing limit bounds handler execution, not outstanding large response buffers.

The harness opened six signed 10 MB file-access responses sequentially and kept all six sockets open. Every response returned HTTP 200 with a content length exceeding 13 MB (base64 JSON). Clients consumed only 10 KiB per socket over five seconds, then disconnected without acknowledgement. All six were admitted in each of three cycles, exceeding the desired four-response resource envelope. This is a newly tested hardening criterion; the old request-limit setting did not explicitly promise a response-stream bound.

The test emits its complete observations before asserting the resource criterion. Exit 101 in client-2.txt is the deliberate failed assertion, not a server crash. The runner stops after that failure and retains both databases. No assertion was weakened and no failed run was replaced with a passing claim.

## Verified outcomes

| Check | Result | Evidence |
|---|---|---|
| 60 sequential 1 MB downloads over at least three minutes | PASS | Verified fixture bytes, 60 successful acknowledgements, 60 matching PostgreSQL journal records |
| Calendar-year renewal on successful acknowledgement | PASS | Checked every soak and recovery receipt |
| Partial downloads do not acknowledge | PASS | 18 persisted partial attempts have null acknowledgement timestamps; journal counts unchanged before recovery |
| First partial transfer does not start expiry | PASS | last_download_at and expires_at remain null before first recovery |
| Normal download after each disconnect cycle | PASS | Three complete 10 MB recovery downloads and exactly three acknowledgements |
| Health during slow consumption | PASS | 30 probes completed within two-second test timeout; observed maximum 13.23 ms |
| At most four outstanding successful response bodies | FAIL | Six admitted in each cycle |
| Owned server cleanup | PASS | Both processes absent and listening ports closed; cleanup.json |

The soak took 197.8 seconds including 15 seconds final idle. Access p95 was 41.26 ms, acknowledgement p95 25.85 ms, and health p95 2.71 ms. This workload is paced and sequential, not a throughput or production latency guarantee.

## Server memory

Memory was sampled from the owned server process every 50 ms; kernel VmHWM records lifetime peaks. Client and PostgreSQL memory are excluded.

| Phase | Median RSS (MiB) |
|---|---:|
| Soak first ten downloads | 19.6 |
| Soak last ten downloads / final idle | 23.5 |
| Slow-reader cycle 1 | 171.3 |
| Recovery after cycle 1 | 107.8 |
| Slow-reader cycle 2 | 222.3 |
| Recovery after cycle 2 | 171.5 |
| Slow-reader cycle 3 | 235.1 |
| Recovery after cycle 3 / final idle | 184.2 |

Soak lifetime peak: 23.5 MiB. Slow-reader lifetime peak: 235.1 MiB. Post-cycle retained RSS increases across this short sample. These observations do not distinguish allocator retention from a leak; the soak also legitimately adds persisted attempt metadata. There is no long-term stability or memory plateau claim. Raw phase and sample data are retained.

## Next construction work and open questions

Runnable repair: bind the admission permit to the response body's lifetime, releasing it on completion or disconnect. Add a bounded response deadline or equivalent slow-consumer policy so stalled readers cannot hold the available slots indefinitely. Preserve health access, request-body limits, recovery and acknowledgement semantics. Review whether a separate response-byte budget is needed in addition to a count limit. Re-run the frozen failure workload against a new evidence epoch after implementation.

Unresolved: does response-lifetime admission plus a deadline sufficiently bound retained buffers under repeated cycles? How much of residual RSS is allocator retention? Larger concurrency, long-duration soak, TLS/proxy behavior, recipient grant flows, browser auto-download and public-chain behavior remain outside this test. Public RPC was set to unused loopback port 9 and synthetic fixture keys were used.

Operational support remains with the deployment operator: host clock synchronization investigation, coherent database/binary recovery rehearsal, production sizing and separately scoped rollout. These pending operations did not block the local product-test work and this evidence grants no approval, admission or deployment authority.

## Preserved historical residue and reproduction

Only tests/http_resilience.rs and this new evidence directory were added. scope.json verifies all pre-existing source, test, migration and evidence fingerprints remained unchanged. Previous clock-fix PASS and earlier HTTP FAIL epochs remain intact. Unrelated dirty work, alchLang, wallet keys, running preview and production were not changed. No commit, push, release or deployment occurred.

Retained database/server targets: target-1.json and target-2.json. Test processes are stopped; databases remain available for inspection. results.json retains both the successful soak and failing resource result. binaries.json binds the optimized server and client. SHA256SUMS binds this epoch and the implementation inputs.

Reproduction: build with `cargo test --offline --locked --release --features ui --test http_resilience --no-run`, capturing its output as build.txt in a new evidence directory; run a copy of run.py there against the existing local PostgreSQL test container. The runner creates fresh databases and has a 360-second per-client deadline. Do not rerun into this frozen evidence directory.
