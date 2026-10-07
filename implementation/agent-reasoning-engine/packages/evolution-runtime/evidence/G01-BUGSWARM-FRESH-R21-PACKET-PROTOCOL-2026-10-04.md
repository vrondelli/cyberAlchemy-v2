# G01 fresh r21 — unchanged r10 raw-listwise packet transfer

Status: fixed before r21 packet construction, tokenizer admission, evaluator access, or model calls. The exact source-only r20 final candidate lists are SHA-256 `051a87aceb886259964e8f8fbddb186b63b560f2cb33f6a72efe6e72c4a39aac`; the candidate seal is `694f4139b079ad0fd74a35ecc96de3ff7d2bca1ae8dde4586777fd8caf5c0a48`. Keep every 1-based candidate ID in that exact order, at most 80 unique projected source paths. Use the unchanged excerpt function SHA-256 `17b209eb80674fff7354ebfb14937af3255f8eb84cdb20dfff4f349894b4608d` and the exact exposed-r10 prompt template, with full authenticated failure query, graph-r2 and test-edge-r3 ranks, and failed-test-channel origin annotation. Preserve the exact failed-source tree and query identity. Do not inspect evaluator gold or passing source.

Require 24 complete source-only packets and each prompt at most 24,000 UTF-8 bytes. If any case exceeds this cap, stop r21 and retain the failed bound; do not silently truncate, shorten the list, or issue partial GLM calls. Seal packet bytes and per-case counts before VPS transfer. VPS sees prompts and receipts only, never full archives or code-only roots. Same-account 8K tokenization and the 512-token output reserve remain a separate later gate.

## Open Questions

- Will all 24 unchanged r10-style packets fit the 24,000-byte bound on this new cohort?
- Will exact same-account GLM tokenization admit 24/24 prompts under 8,192 tokens including reserve?
