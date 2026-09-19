# Independent acquisition review

**Not ready for real acquisition yet.** This is a read-only implementation review; no network, provider, native storage query or real extraction was performed. All 23 existing synthetic tests pass. Findings were sent to the implementation owner before publication of this review.

## Required fixes

1. **Hard elapsed-time bound.** The 900-second checks surrounding `response.read(65536)` do not interrupt a blocked read. A 30-second socket timeout is generally per blocking operation; a trickling body or header can keep receiving bytes while one high-level read/request exceeds the intended deadline. Add a whole-attempt interruption/watchdog covering request/redirect/header/body phases, with a short synthetic blocking/trickle regression. Preserve the no-retry rule and failure receipt.
2. **Cleanup must not suppress journaling.** `finally` calls `shutil.rmtree(stage)` before the final attempt-journal try. If cleanup raises, the original error/receipt may be masked and the persisted marker can remain `started`, even after source publication. Always attempt final journal persistence, preserve consumed bytes and cleanup errors, and do not report clean success while orphan cleanup is unresolved. Add an injected cleanup-failure regression.
3. **Final publication guard and rejection evidence.** Check native storage immediately before the outer directory publication, after metadata writes. Preserve the native rejected guard receipt in failure metadata; the current generic `native storage guard blocked` error discards it. Test a guard rejection specifically at publication and require no published output.

## Verified boundaries

The initial URL is pinned; redirects use an exact HTTPS hostname allowlist, standard TLS validation, no proxy discovery, no credentials/nonstandard ports and a five-redirect ceiling. The wrapper has one request chain with no transport retry. Final status, encoding, partial content and declared size are checked. Whole-stream exact byte count and SHA remain authoritative through the projector, including unselected data. Reads are capped at64KiB and paced at most1MiB/s without accumulated burst credit.

The explicit native guard retains the12GiB host/8GiB output floors and fails closed when host measurement is unavailable. The Python CLI64MiB address-space cap excludes the separately spawned Node helper, as documented. The projector retains its8MiB row/32MiB output limits. The new `before_write` hook invokes the supplied guard before sink creation, buffered writes and the projection receipt; it does not alter source selection or schema handling.

The locally supplied MIT notice is bounded and hash-checked before networking. Attribution includes immutable source/notice bindings and filtering changes. Injected synthetic bindings do not claim production verification. Attempt markers prevent replay into the same destination; raw dataset bytes and signed redirect query strings are not persisted. Existing tests cover response/hash/notice rejection and final journal failure, but not the required cases above.

## Reviewed hashes

| File | SHA-256 |
| --- | --- |
| acquire_source.py | `c8c598f9ea2ab210c9bab70c85289491ff6c17a4489fb4445cfab45eafd2583b` |
| storage_guard.mjs | `bd73efe258976c2d44992fa153122c6f3e6dbc5ee00a2be038f36f53fb5d150f` |
| project_stream.py | `cc3eb50aee2ceb4828b5ffe9e397346efdc664792e28f072204f570c7cdb232a` |
| test_acquire_source.py | `8d1121091574d938ae87ec8870039cbe2bb95c7bb827bf6e7e7b3ca4b8f26411` |
| ACQUISITION.md | `aacddfd8fef707b665a558468f868363f3c08529996272dbd1e96b0dfe229dda` |

## Open questions

The fixes above require re-review before readiness can be stated. Separately, follow [ACQUISITION.md](ACQUISITION.md): finish, score and clean the active ContextBench study; verify real host/output headroom and the pinned local notice; then explicitly schedule acquisition. Real schema compatibility, target-tokenizer long-history qualification and sealed evaluator-reference binding remain unproven. This review makes no model-quality, efficiency or campaign-success claim.
