# Native measured dispatch adapter

Additive candidate bridge to the existing bounded recycler. Parent: [INDEPENDENT-EPISODE.md](INDEPENDENT-EPISODE.md). No live provider admission. Open questions below own remaining work.

`createNativeInvestigationDriver` holds one guarded arm writer lock and binds one native transport attempt ledger. Each request gets a fresh bounded recycler checkpoint under that arm, sharing the same client receipt list and provider limits. Prompt content is unchanged; this version implements no history trimming or summarization.

Preparation starts the native recycler, which performs the adapter's actual request measurement. Its admission callback validates prompt digest and output reservation, exposes the measured input upper bound and pauses on a one-use decision promise. No model request occurs before the episode reserves its shared phase budget and persists the capture. Dispatch accepts only the exact prepared object, claims it synchronously before the health await, checks shared health and cancellation, then releases admission. The transport owns the final measured-request binding and HTTP receipt. Native per-request checkpoints end terminal after one result; the arm's global ledger never resets.

The wrapper `runNativeIndependentEpisode` always closes this driver when the episode exits, including denied budget, malformed preparation or capture-persistence failure. Concurrent close callers receive the same promise. Close denies any paused admission, awaits settlement and removes the arm lock. Unexpected settlement/lock errors are surfaced. A dispatched HTTP operation must be cancelled using the same signal bound to the client; close alone waits for in-flight completion. Factory integration must prove that shared signal binding and native deadlines.

Recycler policy is context_limit8000, recycle_at7999 and safety_margin1; admitted input plus output is strictly below7999. This is a conservative subset of the8K requirement, not a claim that all8000tokens are usable. Oversized histories fail before model dispatch; they are never silently truncated. Per-request fresh recycler metadata does not reset the phase controller or transport's cumulative attempt limits.

Five test groups use the actual bounded recycler and guarded persistence. They prove preparation pauses before model dispatch; two requests share one ledger binding; close, abort or denied health prevent dispatch; oversized input and foreign prepared objects fail; concurrent dispatch claims once; and concurrent close callers wait for the same in-flight drain. Held promises exercise the races without timing guesses.

The fourth group also uses the actual GLM wire adapter and durable attempt ledger, replacing only HTTP with in-memory responses. It verifies a tokenizer request precedes model dispatch, its100fixture-token result plus the512native margin becomes the612input bound, and the ledger records exactly one tokenizer and one model attempt. These are fixture counts, not real tokenizer measurements. No sockets, credentials or provider calls are used.

## Open questions

Construct the actual reviewed GLM client with matching fixed profile/output cap, one attempt and the same cancellation signal. Extend native GLM mock-wire coverage to tokenizer and in-flight failures, and connect the full multi-phase episode through that adapter. Add a reviewed protocol-valid history strategy for long branches, common baseline, source preparation and shared supervision. Run real tokenizer qualification and exact freeze review before model generation. The complete benchmark and untouched confirmation goals remain open.
