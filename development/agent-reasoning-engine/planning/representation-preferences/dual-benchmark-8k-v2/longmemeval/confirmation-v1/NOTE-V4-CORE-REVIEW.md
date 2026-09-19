# Note-v4 core review

Approved offline at [exact source bindings](NOTE-V4-CORE-REVIEW.json); no live approval. All27synthetic adapter/runner tests independently pass.

The actual diff changes only control ingestion cap384→768, carry estimate384→768, and per-ingestion reservation7360→7744. Final answers remain1024; input<=6976 and input+reservation<=8000 remain enforced. The query-free ingestion prompt, common answer policy and deterministic treatment retrieval are byte-equivalent to the predecessor. Existing two-worker accounting, health and failure handling are retained.

Tests accept a600-token stopped note, continue to fail length-truncated notes while retaining known cost, and reject old384-cap qualification. All previous frozen files are untouched by this implementation.

## Open Questions

Fresh tokenizer-only qualification must determine actual chunks and reserve before wrapper/freeze review;145chunks would require1,186,880generation+64,000judge tokens. This is a development successor on already-exposed tasks, not untouched confirmation or full-benchmark clearance. [NOTE-V4-CORE.md](NOTE-V4-CORE.md) owns remaining integration questions.
