# Lossless tool-payload qualification prototype

The codec factors repeated source metadata in successful search results into a shared source dictionary. Each row retains source text, line coordinates, read identity and all unknown JSON fields. The derived retrieval-handle marker reconstructs only the exact observed-read prefix. Distinct source revisions or hashes remain separate dictionary entries. Nonstandard handles survive unchanged.

The prototype uses encoding only when it reduces stable JSON bytes. All other current tool envelopes pass through unchanged, including read_file, list_files, apply_edits, get_patch, failed searches and empty searches. It bounds input/output to 262,144 bytes, structures to 20,000 nodes and depth32, and search observations/sources to30. These are codec bounds, not permission to send a request; complete requests still require actual tokenizer admission within8K including every reserve.

Decoding rejects unknown encodings, out-of-range references, source/row conflicts, malformed observations, unused or duplicate dictionary material, reserved-field collisions and noncanonical encodings. Non-JSON values, getters, sparse/decorated arrays, cycles and oversized structures are rejected rather than silently losing information. Inputs are copied and not mutated.

The companion compact-delivery reader verifies original capture and model-receipt hashes before decoding tool JSON. It never replaces request hashes with hashes of expanded payloads. Successful original-wire receipts are required for evidence credit; tokenizer-only captures, unsuccessful calls and mismatched receipts cannot establish delivery. Existing observation identity, search-argument and token-accounting logic remains intact. This is an additive reader prototype, not a production integration.

Eleven tests pass: six codec tests and five delivery-binding tests. The historical twenty-observation search payload round-trips from10,967 to6,254 bytes, including unknown-field and custom-handle probes. Synthetic successful receipts demonstrate identical twenty native observation identities between raw and encoded forms; they do not claim the historically denied request was delivered. Tokenizer-only and failed-receipt cases yield no credited observations.

PAYLOAD_GUIDE is prospective model-facing protocol text; its tokens must count in follow-up measurement and later task accounting. No model understanding, measured token reduction, complete-request fit, quality or total-token savings has been demonstrated.

## Construction and operations

The reviewed research selection permits this qualification prototype. Current product frontier: independent codec/delivery review, then bounded complete-follow-up reconstruction and actual tokenizer measurement. Runtime imports, prompt integration, native join/scorer selection and a successor full comparison require separate reviewed integration. Existing frozen benchmark code and evidence remain unchanged. Transport diagnostics remain an independent task; no retry policy has changed.

## Open Questions

Can an exact historical follow-up be reconstructed, including retained reasoning, and does the encoded version with guide reduce real tokenizer input enough to fit8K? Does comprehension or later task quality regress? How should broader non-search payloads be bounded when factoring cannot help? The full perfect-quality and15% cumulative-token criteria remain in [the native research plan](COMPARISON-PAYLOAD-RESEARCH-R1.json); independent prototype review is pending.
