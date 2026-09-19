# Independent acquisition review — R2

**Implementation ready for the explicitly scheduled, single-attempt acquisition, subject to the native runtime storage and pinned-notice checks.** The original [review](ACQUISITION-REVIEW.md) is preserved. This review performed no network request, provider call, native storage query or real dataset extraction.

All **26 synthetic tests pass under a 64 MiB Python address-space limit**. The native guard bridge also passes Node syntax validation. The reviewed wrapper/projector hashes match the implementation owner's supplied hashes exactly.

## Previous findings resolved

- **Blocking/trickling request deadline:** the public acquisition entrypoint installs a POSIX wall timer before request work. Its signal interrupts mocked blocked headers and a trickling body within the short regression deadline, records failure and cleans staging. The production timer is at most 900 seconds; use the documented isolated main-thread process, without another active process timer. Cleanup/failure finalization still follows the interrupt; this is not a guarantee against an uninterruptible OS/filesystem operation or machine termination.
- **Cleanup and final journaling:** wrapper cleanup failures are collected instead of bypassing the journal. The receipt preserves consumed bytes and cleanup diagnostics, and the projector preserves its original parsing/hash error when its own cleanup fails. The regression verifies original SHA failure and persisted failure status survive an injected cleanup error. A remaining orphan is an explicit cleanup issue, not reported success or permission to retry.
- **Publication storage guard:** checks now occur after response headers, periodically during reads/writes, after projection, and immediately before the outer directory rename. The final-check regression fails after attribution exists and verifies that no final source directory is published.
- **Rejected guard evidence:** the native bridge carries the blocked receipt through the wrapper. The attempt journal retains its measured blocked status/host bytes. The final publication check is recorded in the sibling attempt receipt; the source-package network receipt intentionally contains earlier checks. Keep both artifacts.

The existing HTTPS allowlist, TLS verification, five-redirect ceiling, single request chain/no retry, bounded read/rate policy, exact whole-source size/SHA, source-only projector limits and notice/attribution binding remain intact. The Python memory limit excludes the separate Node guard process. Network-byte counts are explicitly a lower bound after a failed partial socket read; they do not claim exact network billing.

## Exact reviewed hashes

| File | SHA-256 |
| --- | --- |
| acquire_source.py | `5fe4a1f11d244044b4799357b03f6b491c7531ec3b43737047278025aa780aee` |
| storage_guard.mjs | `bd73efe258976c2d44992fa153122c6f3e6dbc5ee00a2be038f36f53fb5d150f` |
| project_stream.py | `c6699be296300998834104880bd434152ec850cf76a318e75a55f7545f69c794` |
| test_acquire_source.py | `f95da189dcd00d6ae6f0aa4c065a935e5205e948726297161e04890e4ba1da61` |
| ACQUISITION.md | `13e052af9daf03a2cbfbfacb8058750adc575b7ca0d08ad5b2cec692efdd9d6f` |
| ACQUISITION-REVIEW.md | `ab74034a5e28cce6e778ace67249ffa37c457beaac07b20c7b77d3af590ce6d3` |
| implementation/agent-reasoning-engine/benchmarks/contextbench-v1/storage-lifecycle.mjs | `544dfbe3d85e672bfd5ef7b4911e7af5ecf5e2df4a5af18c23d20a761abc79ec` |

## Remaining runtime and empirical gates

Approval does not waive the unchanged **12 GiB host / 8 GiB output** floors, local pinned MIT-notice hash, exclusive destination/attempt marker, or the single-attempt rule. The coordinator must use the public `acquire` entrypoint/CLI with production defaults and the native guard. Do not call the internal `_acquire` directly to bypass the wall timer. Preserve failure receipts and inspect any orphan state before any separately declared new attempt.

The coordinator reports ContextBench scoring, independent review and cleanup complete; this review did not re-audit that closeout or remeasure current host space. Real-source schema acceptance, target-tokenizer long-history qualification, sealed evaluator-reference compatibility and subsequent model evaluation remain pending. No acquisition result, benchmark quality, token saving or campaign completion is claimed.

## Open questions

Runtime readiness and follow-up ownership remain in [ACQUISITION.md](ACQUISITION.md) and [FULL-HISTORY-SOURCE.md](FULL-HISTORY-SOURCE.md). All earlier implementation blockers are resolved for the hashes above; new code changes require a correspondingly updated review.
