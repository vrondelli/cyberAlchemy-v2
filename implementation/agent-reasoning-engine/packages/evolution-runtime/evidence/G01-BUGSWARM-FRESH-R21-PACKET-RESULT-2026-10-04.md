# G01 fresh r21 — raw-listwise packet transfer result

Status, 2026-10-04: **24/24 source-only r10-style GLM packets sealed under the fixed 24,000-byte prompt cap.** The [prospective protocol](G01-BUGSWARM-FRESH-R21-PACKET-PROTOCOL-2026-10-04.md) pinned the r20 candidate list and seal, r17/r18 source and queries, r19 graph rankings, r20 test-edge ranks, and the unchanged excerpt function. The [builder](../research/arb-trace2code-r1/build-bugswarm-fresh-r21-glm-packets.py) preserved every final candidate's 1-based ID and order, graph/test-edge rank, failed-test-channel origin and exact failed-commit code excerpt. It did not read evaluator gold or passing source.

Private WSL `fresh-r11/packets-r21/PACKETS.jsonl` SHA-256 is `9cf7490d6b21d34b58d0dbb75d1ab262caac061b773a75ab350b54a7291e149c`; `PACKET-SEAL.json` SHA-256 is `f281f62b2073fa61932b4c1823a02445aac88e6edd748dd9d6eeac1e4d89d63f`. There are **1,381** candidate placements, maximum **80** per packet, and maximum prompt **18,666 UTF-8 bytes**. No GLM call or evaluator label entered r21.

Next: transfer only these prompts and minimal receipts to the pinned VPS gateway, verify same-account tokenization for all 24 with a 512-token output reserve under 8,192 tokens and aggregate 220,000 prompt tokens, then run one generation per case without retries if admission passes. Seal all predictions before evaluator-only direct-Git-tree labels. This packet-size gate does not prove token admission, accuracy, or superiority.

## Open Questions

- Will same-account tokenization admit all 24 exact prompts and the frozen aggregate budget?
- Will the matched one-shot GLM run complete with 24 valid normalized responses and authenticated evaluator gold?
