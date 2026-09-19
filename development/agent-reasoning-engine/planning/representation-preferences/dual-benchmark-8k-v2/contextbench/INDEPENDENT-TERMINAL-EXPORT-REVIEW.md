# Independent terminal export review

Approved as an offline adapter. All three integration groups pass independently; no blocking scoped defect found.

The adapter reconstructs the branch join, preserves its global receipt prefix and separately binds later join requests. It checks terminal response/receipt/request identity, exact delivered packet text/tool, common handle schema and each offered source projection. The unchanged native validator/exporter receives only explicitly selected IDs. A one-file selection excludes the other file despite colliding branch tool IDs; all-file selection also succeeds. Corrupted join/response/packet/prefix, unknown handles and source drift reject.

Version 1 correctly rejects novel source observations during joining. This is not complete runtime or live admission: phase-ledger assignment, durable transport capture provenance, cumulative accounting, exact tokenizer fit and supervising freeze/source persistence remain pending. Response integrity uses the existing native capture trust model; it is not a provider signature.

Exact transitive source bindings accompany the review. No provider calls, evaluator/reference access or frozen edits occurred.

## Open Questions

INDEPENDENT-TERMINAL-EXPORT.md owns actual branch histories/findings delivery, common baselines, complete accounting, tokenizer qualification and independently reviewed runtime freeze.
