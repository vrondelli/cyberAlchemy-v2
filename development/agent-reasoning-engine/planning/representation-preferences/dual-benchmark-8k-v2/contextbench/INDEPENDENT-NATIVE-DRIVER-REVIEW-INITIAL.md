# Native driver initial review

Three existing tests pass independently. Two lifecycle races block component approval:

1. Concurrent second close returns immediately after closed is set, while the first close may still wait for HTTP completion and retain the writer lock. Share one close promise.
2. Concurrent dispatch calls both pass identity checks before awaited health returns. Reserve one-use ownership synchronously; reject the second caller. Current promise release prevents duplicate HTTP, but both calls can still return an accepted completion.

Add deterministic held-request/held-health race tests. Native measured admission and persistent arm ledger structure otherwise match the bounded scope. No real provider or tokenizer calls occurred.

## Open Questions

INDEPENDENT-NATIVE-DRIVER.md owns these lifecycle fixes, actual GLM wire/signal integration, bounded histories and later qualification. No live admission.
