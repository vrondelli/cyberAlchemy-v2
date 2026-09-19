# Independent tokenizer qualification review

Initial review: five synthetic tests passed; two failure-finalization gaps required correction. The final review below approves the corrected exact hashes for tokenizer-only qualification of the verified acquired source package. Earlier findings and hashes are retained as review history. This review made no network, provider, tokenizer-endpoint or gold calls and did not read a real source package or credentials. Running acquisition was untouched.

## Exact reviewed sources

| File | SHA-256 |
| --- | --- |
| `qualify.mjs` | `3c82f4d518c8afa0662aa8a6fde077ba915b2e55219ca81d9d1621c0d579cd54` |
| `qualify.test.mjs` | `0e9769a8f3fef546fd08027416e624df8d98a87c2dc4bafdc4d5c75ab4683aa9` |
| `adapter.mjs` | `bb1c30998933d15851d906002ec70b9d2ebbccef92e26264886f58dfb5b47226` |

## Verified constraints

The bridge accepts exactly the adapter-supported future generation wire. It sends the native tokenizer payload of model/messages and binds both that payload and the complete future request with SHA-256. No tool schema or retained model reasoning is present in these source-only adapter messages. Output reservation is separately enforced by the adapter; a bound tokenizer response is not a model generation receipt.

`liveExchange` exposes only the fixed HTTPS tokenizer endpoint. `postOnce` makes one POST, no redirects or automatic retries, limits response bytes to 65,536, and enforces a 30-second request deadline. AbortSignal reaches the native request and destroys an outstanding request/response. Secret resolution uses the existing scoped provider registry, and secret material is not written to qualification receipts. Secret resolution itself has its own timeout, rather than accepting the adapter AbortSignal; an already-aborted signal prevents a later POST.

`planConfirmation` creates one shared session for the complete four-row plan: 256 calls and 900,000 ms, including source sizing, ingestion splits, projection fitting and answer framing. The bridge independently rejects concurrent calls and caps itself at 256. Tokenizer HTTP or journal failure prevents another exchange on that meter. There is no generation endpoint, model call or scoring import in this bridge. Tests verify native model/messages payload, complete-wire hash binding, HTTP failure without retry, pre-dispatch journal failure, abort propagation, unsupported wire rejection and storage rejection.

The qualification path requires `/mnt/c` and checks 12 GiB host / 8 GiB guest floors before setup, before each meter call and before final source/code revalidation. It binds the acquired four-ID source package through the existing loader and rechecks it after planning. Source package qualification still depends on successful full upstream hash verification; this bridge does not turn an unverified prefix into input.

`sourceManifest` derives its question/date bindings from S itself. Those hashes detect drift but are not an independent oracle-to-S identity comparison. This is sufficient only for source/tokenizer planning; sealed evaluator-reference compatibility remains an explicit later gate. The output must not imply that compatibility has been established here. Code bindings currently cover qualify/adapter, not all imported prompt/transport dependencies; a later generation freeze must bind the full dependency surface.

## Findings requiring correction

1. Shared-session timeout races terminal meter receipt finalization. An independent synthetic injection with delayed abort rejection returned from the session with only `started`, then recorded `failed` afterward. `qualify` writes RESULTS immediately when the session throws and reports `receipts.length`, so it can persist a zero/fewer-call summary while a dispatched tokenizer attempt still settles. Native secret resolution/registry async unwinding can also outlive the session. Provide bounded meter settlement/finalization, or explicitly persist the active attempt as unresolved with its request binding and report dispatched/started counts. Do not wait indefinitely or claim an unresolved attempt completed. Preserve the session budget snapshot on failure.
2. Final `RESULTS.json` persistence occurs outside the catch and does not attach the in-memory result/receipts to a thrown write error. Earlier setup writes also occur before the result-finalization catch. Model spend remains provably zero, but qualification audit information can be lost. Add a finalization path that preserves the result and known attempt records on persistence failure, with injected writer failure tests. Avoid declaring success or retrying an existing qualification directory.

A related hardening opportunity: `sourceManifest` reads row/acquisition bytes before the loader applies regular-file/size checks. For the exclusively produced verified package this does not change identity, but the exported arbitrary-path helper should apply bounds before reading or explicitly restrict its contract to the verified package.

## Validation and open questions

Ran the five qualification tests independently: all pass. Ran an additional synthetic delayed-abort experiment proving finding 1 without any socket or credentials. No implementation edits were made. Remaining questions: how will unresolved abort/secret-resolution work be recorded before exit, how will journal failure carry the audit receipt, and when will independent evaluator identity and full dependency freeze be bound? Neither fixture success nor tokenizer qualification proves long-task quality, completion, perfect scores or fifteen-percent model-token savings.

## First correction review

The parent added awaiting `meter.settle()` before serializing RESULTS and attaching `{result,persistence_failure:true}` to final write errors. The permitted independent delayed-abort regression verifies the normal terminal journal race is closed: six tests now pass. New reviewed hashes:

- `qualify.mjs`: `df482f183ef6839d5e2ce9754e02f402892ab06be2ea2b424e119bc896ab021d`.
- `qualify.test.mjs`: `9213d56b70859c1ba77f56ef9477de46e140cafd228305a6f5e7f7a78e867a4b`.

Approval remains conditional on bounded settlement (current `await pending` has no independent deadline) and retaining `error.tokenizer_budget` in failure output. Live secret resolution may take up to its configured 300-second bound beyond the session deadline; arbitrary injected exchange/record implementations can otherwise hang settlement. The intended 15-minute planning budget must not be represented as a hard whole-process bound. A bounded audit drain with explicit unresolved status is sufficient. Source/evaluator identity remains separately deferred.

## Final correction review: approved for tokenizer-only qualification

The parent’s final implementation explicitly shares a `createTokenizerSession` across the plan, preserves its budget snapshot on success/failure, and bounds audit settlement to 5,000 ms. An unsettled attempt marks `failed-unresolved-tokenizer` with `admitted:false`; it is not counted as a completed measurement. Final result-write failure carries the in-memory result and a persistence-failure marker. Setup failures occur before meter construction and therefore before tokenizer/model dispatch; their single-use directory is not silently reused.

All seven synthetic qualification tests pass independently, including the added delayed-abort journal and uncooperative-exchange bounded-drain regressions. The latter confirms the original started receipt and one-call/terminal budget snapshot survive while settlement reports unresolved. The console `tokenizer_calls` field counts terminal receipts; on unresolved failure the authoritative attempted-call count is `tokenizer_budget.calls`, with the started receipt binding. The 15-minute session plus 5-second audit drain bounds planning/finalization waiting, not necessarily process lifetime of a separately bounded credential subprocess. No generation can begin from unresolved qualification.

Final approved hashes:

- `qualify.mjs`: `df482f183ef6839d5e2ce9754e02f402892ab06be2ea2b424e119bc896ab021d`.
- `qualify.test.mjs`: `0e661567d6c8a19a86ba66cd67df7c5c56609a32e7f4975a4379812941c0fd00`.
- `adapter.mjs`: `bb1c30998933d15851d906002ec70b9d2ebbccef92e26264886f58dfb5b47226`.

Approval is limited to tokenizer-only qualification using the verified acquired package and runtime storage checks. Independent oracle-to-S evaluator identity, full dependency freeze, generation runner and actual benchmark quality remain pending. No provider/network/source-package reads were performed by this review; only the permitted synthetic test file and this report were edited.
