# Claim ledger

| ID | Claim | Label | Support | Posture |
|---|---|---|---|---|
| C01 | DeepSeek Harness uses an append-only session event log as its canonical interaction record. | primary-source | L0.1 | supported |
| C02 | Model history is derived and cached from the canonical log. | primary-source | L0.2 | supported |
| C03 | The JSONL backend provides append-only durability and torn-tail handling without changing logical event semantics. | primary-source | L0.3 | supported |
| C04 | Projection-cache loss changes replay cost, not canonical truth. | primary-source | L0.4 | supported |
| C05 | Append-only growth preserves a reusable prefix but does not guarantee a provider cache hit. | primary-source plus operator-reading | L0.5, L0.8 | supported |
| C06 | Stable system prompt, tool schemas, route, and earlier messages are part of cache affinity. | primary-source | L0.5–L0.7 | supported |
| C07 | ARE already has most integrity primitives, but not a durable canonical context-event source. | local-inference | current ARE source register | supported for current checkout |
| C08 | Replacing full-envelope regeneration with event-prefix projection can reduce local recomputation and improve prefix stability. | analogy | C01–C07 | plausible; experiment required |
| C09 | This change will reduce Codex cost or latency. | open-residue | no Codex provider measurement | unproven |
| C10 | DeepSeek Harness's exact storage or event schema is suitable for ARE. | open-residue | semantic mismatch | rejected as direct reuse |
| C11 | DSH places durability barriers before requests and effectful tool bodies. | primary-source | L0.9 | supported |
| C12 | Complete dynamic-context snapshots suppress unchanged emissions and append successors for changes. | primary-source | L0.10 | supported |
| C13 | DSH separately reconstructs and verifies request-header and message-history bytes. | primary-source | L0.11–L0.12 | supported |
| C14 | Versioned projection units and exact watermarks can make ARE read models independently cacheable. | primary-source plus analogy | L0.13 | supported pattern; ARE design required |
| C15 | Exact-history retrieval can remain available after model-visible compaction. | primary-source | L0.14 | supported |
| C16 | Retrieved context must not inherit source authority or instructions. | primary-source plus operator-reading | L0.15–L0.16 | supported |
| C17 | Deterministic pruning and spill should precede generative context compaction. | primary-source plus analogy | L0.17 | promotion-candidate |
| C18 | Token/usage observations are reusable only under an exact request-envelope match. | primary-source | L0.18 | supported |
| C19 | Context inheritance and authority inheritance are separable. | primary-source plus operator-reading | L0.19 | supported |
| C20 | Event-derived model replay can test ARE without live provider nondeterminism. | primary-source plus analogy | L0.20 | promotion-candidate |
