# Single-attempt S acquisition wrapper

Status: offline-tested candidate; **not executed against the network**. No upstream dataset or evaluation references were downloaded, and no provider calls occurred. The active ContextBench run must finish, be scored and have disposable source trees cleaned before the coordinator schedules this transfer. Last reported host headroom above the 12 GiB floor was only about 84 MB; a passing virtual-disk check alone is insufficient.

[acquire_source.py](acquire_source.py) connects the pinned S endpoint from [the source plan](FULL-HISTORY-SOURCE.md) to the source-only streaming projector. It opens one request chain, permits at most five validated redirects and implements no transport retries. An exclusive sibling `<destination>.attempt.json` marker prevents replay into the same destination even after failure. Existing output directories are rejected. Dataset bytes go directly through the verified projector; no raw dataset file is created.

## Network and integrity boundaries

The initial URL is the exact immutable Hugging Face S endpoint. Every redirect must remain HTTPS, without user credentials or a nonstandard port, and use one of the explicit hosts in `ALLOWED_HOSTS`; unrelated domains and lookalike suffixes fail. Proxy environment discovery is disabled. TLS verification remains the standard library default. A final status other than 200, content-range response, encoded response or inconsistent Content-Length fails admission. Missing Content-Length does not waive exact stream-size verification.

The projector's exact 277,383,467-byte count and LFS SHA-256 remain authoritative regardless of redirect location. The body is limited to at most 1 MiB/s with no accumulated burst allowance; reads are at most 64 KiB. Each HTTPS connection has a 30-second socket timeout, redirect count is bounded, and a separate POSIX wall timer interrupts the entire attempt after at most 900 seconds, including blocked or trickling headers/body reads. Monotonic checks around individual reads/waits remain an additional bound. The API requires the main thread of an isolated Linux process and refuses an already-active process timer; it restores the previous signal handler when done. Signed redirect query strings are neither persisted nor printed by the CLI; only the final delivery hostname is recorded. A parent embedding the API must also avoid printing exception causes containing transport internals.

## Native storage and bounded publication

[storage_guard.mjs](storage_guard.mjs) calls the existing native `assertStorageCapacity` implementation with explicit minimums: 12 GiB host storage at `/mnt/c` and 8 GiB on the output filesystem. Missing host measurement fails closed. Environment overrides cannot lower these explicit floors. A persistent Node helper starts before the Python CLI sets its 64 MiB address-space limit, so repeated native checks do not require spawning V8 under that limit. The guard helper is a separate process; the 64 MiB cap describes the Python parser/network process, not their combined memory usage.

The wrapper checks storage before opening the network stream, immediately after headers, at most every 4 MiB of received data or 30 seconds of processing, at the same periodic boundary before source writes, after projection before attribution, and again immediately before the final directory rename. Rejected native guard receipts are retained alongside successful checks. The final publication guard is recorded in the sibling attempt receipt, which is finalized after the rename; the source package network receipt records earlier checks. An optional `before_write` hook was added to the projector's staging-file creation, flush and receipt write; it does not change source selection or parsing. The existing 8 MiB row and 32 MiB source-output ceilings remain. Tiny attempt metadata is retained independently; the initial attempt marker is written before the first guard and no dataset/network work occurs if that guard fails.

Only a fully verified source directory can receive its notice and attribution metadata and move to the final destination. Exceptions clean unverified source/projection staging. If final attempt-journal persistence fails after publication, the wrapper removes its newly published source directory and raises a receipt-bearing failure. Its in-memory receipt retains bytes returned to the projector. After a failed partial socket read, that count is explicitly a lower bound on transferred network bytes. Cleanup errors cannot skip the final journal attempt or mask the original error; failed cleanup is recorded and remains a manual cleanup gate. Abrupt process/machine termination still requires orphan staging and attempt-marker audit; it does not authorize automatic resume or retry.

## License and reference separation

The CLI requires a local MIT notice whose SHA-256 is exactly `d3c4b9aa54759df6ded337978a6f3b55b75615e5e4525c3b82d7e2627d4b9732`, previously verified against the pinned official repository license. It reads at most 16,385 notice bytes and refuses a mismatch before networking. The wrapper does not independently download this notice. The coordinator must provide the matching small cached notice and retain its source URL binding.

Successful output includes `LICENSE-MIT.txt`, `ATTRIBUTION.json`, the projector's acquisition receipt, the wrapper's network receipt and four source-only rows. Attribution binds dataset revision, source URL/SHA, notice SHA, selected IDs and a modification notice describing whitelist filtering. Injected synthetic bindings are explicitly marked as unverified production bindings.

The wrapper extracts no evaluator references. Avoid a second large S download for judging: a separately reviewed evaluator lane can reuse the existing sealed oracle references **only after** task identity and question/date compatibility are verified independently. It must bind those references to the S study without exposing them to the generator. This reference-lane work is not implemented here.

## Usage after remaining readiness gates

```text
python3 acquire_source.py NEW_SOURCE_DIRECTORY --license PINNED_LOCAL_MIT_NOTICE
```

This command is intentionally an explicit live network action; it was not run in this implementation task. Importing the module performs no acquisition. The embedding API injects transport, storage guard and clock for testing; production integration must use the native guard and exact default source/notice bindings, and preserve the exclusive attempt marker.

## Offline tests and remaining gates

Twenty-six combined synthetic tests pass: ten original projector tests, four independent parser regressions, and twelve mocked acquisition tests. The acquisition tests cover safe/unsafe redirects, single attempt and retry refusal, pre-network and later storage failure, body-rate/deadline enforcement, cancellation, response identity checks, hash mismatch, notice mismatch, signed-URL suppression, source-only output and final journal failure cleanup, a real signal interrupting mocked blocking headers/trickling reads, cleanup failure preserving the original error and final journal, and a denied publication guard after attribution exists. They make no native storage query, network request or provider call. The native bridge passes a Node syntax check; real host measurement and the real upstream transfer remain pending.

Run synthetic tests with:

```text
python3 -m unittest discover -s development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/longmemeval/confirmation-v1 -p 'test_*.py' -v
```

## Open questions

Has independent review accepted the wrapper and the projector's new write-guard hook? Is the exact local MIT notice available? Has the active ContextBench study reached the required terminal/scored/cleaned state, with measured host and guest headroom? Does the actual S schema pass strict projection, and are all four retained histories genuinely >8K under the target tokenizer? Can the existing sealed references be identity-bound safely to the new S variant? These are readiness and empirical gates within the authorized benchmark work, not a request for new user permission.
