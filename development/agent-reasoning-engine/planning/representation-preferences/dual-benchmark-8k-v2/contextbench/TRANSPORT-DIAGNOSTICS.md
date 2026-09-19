# Bounded transport failure diagnostics

The historical failed tokenizer returned no HTTP response and retained only request-failed. Its cause remains unknown. The additive packet-diversity-v1/transport-bounded-v4.mjs records bounded local error categories for future failures without changing failure codes, retry decisions, token accounting or dispatch policy.

transport-diagnostics.mjs inspects only own data properties for code and errors. It retains codes from a fixed allowlist and derived categories; unknown values become counts. At most eight direct aggregate children are inspected. It never stores raw error messages, stack traces, addresses, hostnames, paths, headers, credentials, arbitrary code strings or nested error objects. Accessor properties are not invoked. Nested/unknown causes remain unknown rather than triggering unbounded traversal.

Request construction exceptions, asynchronous request errors and response-stream errors carry distinct phases. Existing deadline-exceeded and cancelled outcomes remain separate and do not acquire invented network causes. A category records a local observation, not proof of a remote root cause.

The diagnostic is added to the tokenizer/model receipt before the existing guarded attempt ledger persists it. Existing original transport and all frozen runs remain unchanged. Model retries stay disabled in the benchmark; this module adds no retry or provider request.

## Validation

Five in-memory HTTP fault tests cover allowlist/privacy bounds and hostile accessors, construction/request/response phases, deadline/cancellation, and actual native tokenizer/model failure receipts persisted into the guarded ledger. Five additional compact-runtime tests pass with the V4 transport, covering successful exact wire admission, retained reasoning, real source edit and native export, as well as failed delivery and altered reasoning. Ten tests total, no sockets or provider calls.

## Open Questions

Initial review found that a revoked aggregate proxy could throw during array classification. The classifier now guards that operation, records an uninspectable aggregate as unknown and passes a regression through all three HTTP error phases. Successor technical review and exact selection in a fresh live qualification remain pending. Index-tokenizer failures use their separate transport and are outside this revision. No cause is retroactively assigned to the historical failure. Current ARE and both candidate arms still need their production campaign and scorer reconstruction integration, then prospective full comparison and untouched confirmation under the unchanged perfect-quality and at least15% cumulative-model-token savings criteria.
