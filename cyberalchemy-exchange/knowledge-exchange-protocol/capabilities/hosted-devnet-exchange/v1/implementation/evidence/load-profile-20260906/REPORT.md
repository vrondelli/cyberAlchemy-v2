# KEP bounded local load profile — 2026-09-06

Route: CA2-ROUTE-IMPLEMENT for the test harness, following read-only validation inspection. Lane: product construction / product-test evidence. No application implementation or deployment changed.

## Outcome

PASS: 18 isolated metadata measurements and three local API/PostgreSQL runs. Every measurement asserted correctness; API runs completed 180 successful acknowledgements in total, each matched to a persisted journal entry. Expected admission backpressure was reported separately from successes. No unexpected API status occurred.

## Metadata processing

Release build; 512 synthetic legacy artifact records with 12,288 raw bytes encoded per ciphertext (about 8 MiB encoded ciphertext plus metadata). These are synthetic retained-state shapes, not chain-verified encrypted exchanges. Each mode/phase uses its own process and 20 iterations, repeated three times with order alternated. The uncached comparator constructs canonical JSON, hashes documents and hashes the whole state; it is a reference kernel, not a complete previous server binary. Both paths check the final digest against the full serializer.

Numbers below are medians of per-run p50s. Parentheses give the minimum–maximum per-run p50. Memory is the maximum process high-water checkpoint across three runs, captured before the verification serializer executes.

| Phase | Uncached ms | Cached ms | Uncached peak MiB | Cached peak MiB |
|---|---:|---:|---:|---:|
| warm | 59.60 (54.77–66.36) | 6.33 (5.77–11.05) | 38.0 | 24.1 |
| edit_identity | 62.20 (59.41–64.62) | 12.01 (5.82–12.73) | 37.9 | 24.1 |
| edit_artifact | 70.25 (47.11–80.58) | 40.28 (37.98–52.01) | 38.0 | 28.3 |

`warm` means repeated unchanged metadata, including the first cold access. Edit phases warm the cache before timing. Artifact edits rebuild the large artifact collection, so they benefit less than identity edits. The full-state hash still scans all bytes. Timing variance is substantial on this shared host; these samples establish neither an SLO nor an exact general speedup. No statistically powered performance claim is made.

## API pipeline plus PostgreSQL

The optimized harness invokes the real Axum router, admission middleware, signed handlers, response serialization and PostgreSQL persistence in-process. It does not traverse HTTP sockets, TLS, a reverse proxy, a browser or public Solana RPC. Synthetic test signers and mock finality are used; no existing wallet keys are read. Timing includes request handling and complete response-body consumption, but upload request construction/signing is outside that timer. Identity-registration measurements include signing.

Three new databases in the existing loopback PostgreSQL container are retained with their names in results.json. Default limits are unchanged: four concurrent requests and 240 requests per minute. Each access cell contains eight offered requests per repetition; acknowledgement calls are sequential and only follow successful accesses. Reported p95s are nearest-rank values for small samples, summarized as the median of the three run-level values. They are descriptive, not production tail estimates.

Upload times:

- 1,024 original bytes: 8.41–12.89 ms across three uploads.
- 1,000,000 original bytes: 34.48–36.65 ms across three uploads.
- 10,000,000 original bytes: 264.63–312.94 ms across three uploads.

| Original bytes | Concurrency | Access p95 ms | Sequential ack p95 ms | Total 429 across three runs |
|---|---:|---:|---:|---:|
| 1,024 | 1 | 7.16 | 6.85 | 0 |
| 1,024 | 4 | 27.79 | 19.40 | 0 |
| 1,024 | 8 | 26.38 | 28.26 | 12 |
| 1,000,000 | 1 | 10.78 | 7.33 | 0 |
| 1,000,000 | 4 | 33.92 | 23.14 | 0 |
| 1,000,000 | 8 | 30.20 | 13.50 | 12 |
| 10,000,000 | 1 | 28.68 | 10.59 | 0 |
| 10,000,000 | 4 | 96.63 | 49.11 | 0 |
| 10,000,000 | 8 | 103.42 | 32.16 | 12 |

Combined API/load-generator process peak: **192.8 MiB**. This includes retained request fixtures and received response buffers, and excludes the separate PostgreSQL process. It is not server-only RSS. Concurrency 8 produced 36 expected 429 responses overall, with Retry-After headers; concurrency 1 and 4 produced none. Each repetition persisted 60 successful acknowledgements.

## Reproduction and retained evidence

The harness is tests/load_profile.rs; build and run commands, environment details, raw JSON, text logs and GNU time output are adjacent. run.py uses only a release harness and fresh loopback test databases, with a 120-second timeout per measurement. Its --metadata-only mode preserves existing API results. GNU time high-water figures include post-measurement correctness verification, so the table uses the earlier /proc/self/status checkpoints instead.

The initial non-isolated metadata trials are preserved under preliminary/ and superseded for memory comparison: verification allocations between phases contaminated later memory readings. The API workload was unchanged by the metadata phase-isolation correction and was not repeated unnecessarily.

## Frontier and limits

Completed product-test frontier: bounded release-mode cache and API pipeline measurements. Next runnable construction work: a real loopback HTTP harness with server and client in separate processes, server-only RSS sampling, and bounded sustained mixed traffic. This should precede server-size recommendations or changes to download buffering. Large response buffering remains a candidate bottleneck, not a confirmed production finding.

Operational support remains with the deployment operator: exact candidate review, database/binary recovery rehearsal and separately authorized rollout. These tests do not authorize those effects. The prior migration still makes binary-only rollback unsafe. No commit, push, approval, release, deployment or preview restart occurred.

## Preserved historical residue

Existing application source, migrations, tests and historical evidence were fingerprinted before the run. Only the new load-profile test and this new evidence directory were written. No existing evidence hashes were refreshed. No alchLang files, unrelated dirty work, wallet keys, preview data or production data were modified by this task. Test databases and preliminary measurements remain available.
