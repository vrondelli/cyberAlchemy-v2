# Independent exact-wire provider review

Approved offline at the exact bindings below. All10 synthetic provider tests independently pass; no credential resolution, tokenizer endpoint, model provider or gold was accessed.

The initial maximum-call check raced across concurrent requests and admitted two dispatches with maximum_calls=1. The corrected provider reserves global allowance and a per-attempt intent synchronously before awaited dispatch journaling. New regressions verify concurrent max1 admission and duplicate simultaneous dispatch callbacks. Failed intent persistence retains its reservation; no capacity is recycled into extra calls.

Requests must match the adapter exact-wire schema and digest. The reviewed live exchange uses one native postOnce request, no retry loop, bounded secret resolution<=30s, model HTTP<=60s/tokenizer<=30s and262144 response bytes. It checks cancellation before actual dispatch. The generator journals prepared state and intent, preserves known usage after model/capacity/persistence failures, and marks pre-dispatch failures explicitly. The core independently rejects contradictory zero-dispatch claims. Output reasoning remains inside completion usage. Model identity and choice count are checked; the core checks completion, hash binding and actual8K usage.

The default model ceiling153 matches the qualified fixed plan. The existing reviewed meter is reused through the bounded exchange; generation-core serialization enforces its single-flight shared budget. Imports construct no providers. Settlement reports unresolved active operations rather than claiming completion.

| Source | SHA-256 |
| --- | --- |
| [provider.mjs](provider.mjs) | `c8d946dfc811aaf27087cfe7bbc85b6eb159374f8c6d9abc4ddd38d65d785893` |
| [provider.test.mjs](provider.test.mjs) | `e80e09f327856cb77b272debc436a580b51e8747a01044d1f7dc44ab5a5cd199` |
| [runner.mjs](runner.mjs) | `395e6dbeb6b13cb2e6320c2a64cabd583b8529b3b9e1e78048c21180bb78e8e4` |
| [qualify.mjs](qualify.mjs) | `df482f183ef6839d5e2ce9754e02f402892ab06be2ea2b424e119bc896ab021d` |

## Open Questions

This transport review is not live execution approval. The wrapper must bind exact sources, enforce storage/health at actual dispatch, persist all fixed slots and failures, cancel active work and record bounded settlement. A35s drain is meaningful after cancellation, not a guarantee that an uncooperative injected exchange ends. Native transport/secret-provider dependencies require freeze closure. Fresh wire admission and output/usage validation remain core responsibilities; no benchmark outcome or efficiency claim follows from synthetic tests.
