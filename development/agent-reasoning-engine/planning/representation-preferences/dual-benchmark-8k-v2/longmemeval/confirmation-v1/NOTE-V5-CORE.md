# Prospective exact-window note-v5 core

The additive `adapter-note-v5.mjs` and `runner-note-v5.mjs` descend from note-v4. The change removes the inherited uniform6976 input ceiling for ingestion. Actual per-request admission is now input≤8000−output allowance:7232 for768-token ingestion and6976 for1024-token answers. Both successful receipt validation and failure-side overrun checks use that same ceiling. Every model call reserves8000 tokens, so generation reservation equals all qualified ingestion and answer calls multiplied by8000.

Planning counts estimated768 carry once: measured empty-note input + carry +768 output must fit8000. Thus6283 input +768 carry +768 output =7819 is eligible;6465 +768 +768 =8001 fails. Planning remains an estimate and never replaces fresh actual-note tokenization at dispatch. Final answers and judges remain1024; source, prompts, treatment retrieval, cohort/order, tokenizer-call budgets and two-worker semantics are unchanged. Frozen v4 artifacts and failed qualification remain preserved.

Thirty synthetic adapter/runner tests pass. They include exact7819/8001 planning boundaries, actual7051/7232 ingestion acceptance and7233 rejection, unchanged answer6976 boundary, source coverage, bounded tokenizer calls, prompt/projection identity, old v4 qualification budget rejection, received usage/unknown reservations, length truncation, persistence and shared-health failures. A stuck-meter test uses100ms rather than10ms to allow setup under concurrent synthetic suite load; it still requires actual abort and zero generation.

## Required wrapper changes

Use successor adapter/runner imports throughout qualification, provider and generation. Fresh qualification determines chunk counts, model calls and generation reserve; all generation calls reserve8000. Update postrun unknown-ingestion holds and call-allocation checks from7744 to8000, including its plan formula. Keep judge reservation64000 and answer/judge input6976 unchanged. Bind new code/qualification/prospective records in a separate reviewed freeze; do not reuse the failed v4 admission or alter its evidence.

## Open Questions

No provider/tokenizer/network calls or reference-value reads occurred for this core change. Independent review, new measured qualification, wrapper integration and exact freeze remain pending. This eligibility correction does not demonstrate that768-token live notes will complete or improve answer quality. The four already exposed tasks remain development-repair evidence, not untouched confirmation.
