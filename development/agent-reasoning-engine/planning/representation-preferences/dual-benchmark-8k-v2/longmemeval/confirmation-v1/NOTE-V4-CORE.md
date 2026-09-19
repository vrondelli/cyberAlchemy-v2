# Prospective 768-token note core

`adapter-note-v4.mjs` and `runner-note-v4.mjs` are additive descendants of the frozen adapter and runner. Only control ingestion output allowance changes from 384 to 768 tokens, with corresponding carry planning and reservations. Note instructions and content policy, source order, cohort, treatment selection, common answer prompt, model settings, final-answer cap 1024 and two-worker execution remain unchanged. Exact input admission still requires at most 6976 measured input tokens and input plus reserved output at most 8000. Actual notes are freshly tokenized at every dispatch; planning carry remains an estimate.

Ingestion reservation is now 6976 + 768 = 7744. Each pair reserves `7744 * qualified_chunk_count + 16000`. Generation calls are the sum of newly qualified chunk counts plus eight answers. Judging remains eight slots and 64000 reserved tokens. Larger carry may split chunks differently; no old actual chunk count, call ceiling or generation total is asserted for this unqualified successor. Old 384-note qualification fails the new reservation check.

Twenty-seven synthetic tests pass across the two successor suites. They cover original source-only behavior, strict 8K admission, complete source coverage, bounded tokenizer calls, unknown and known failure costs, carry remeasurement, persistence, two workers and no retries. Additional regressions prove exact prompt/treatment projection equality, acceptance of a stopped 600-token note under the 768 cap, retained failure/cost for a length-truncated note, and rejection of predecessor qualification.

## Required wrapper integration

- Create an additive qualification entry point importing `adapter-note-v4.mjs`; preserve the original source manifest/IDs and obtain fresh actual measurements before freezing.
- Create an additive provider importing the successor adapter's `wire`; the old provider permits only 384/1024 and will reject 768. Keep transport/tokenizer semantics unchanged.
- Generation wrapper imports `runner-note-v4.mjs` and the successor provider. Derive exact model-call and generation-token ceilings from fresh qualification; do not retain old 153/1131200 constants without evidence.
- Freeze and review bind all successor files, fresh qualification, unchanged source/reference identity and the prospective scientific amendment. Use new single-use names and preserve completed v3 artifacts.
- Scoring can retain final-answer/judge1024 policy, but successor reporting and postrun auditing must derive generation call/reservation gates from the new verified plan, using7744 for unknown ingestion reservations. Preserve all prior research costs separately.

## Open Questions

No external/tokenizer/provider calls or gold reads occurred. Independent core review, actual qualification, provider/wrapper integration, new reviewed freeze and dispatch remain pending. Doubling allowance is a prospective completion repair hypothesis; these tests do not establish live completion, answer quality or savings.
