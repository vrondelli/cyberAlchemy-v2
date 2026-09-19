# Note-v5 tokenizer and core review

Approved for tokenizer-only qualification at the exact bindings in `QUALIFICATION-NOTE-V5-REVIEW.json`. Independently passed 37 synthetic core and qualifier tests. No generation clearance is granted.

The correction uses the reserved output to derive input capacity while preserving the total 8,000-token ceiling. Ingestion now allows 7,232 input and 768 output; final answers remain 6,976 plus 1,024. Both runtime usage checks and unknown-cost reservations match the new full-window plan. Carry is counted once, and actual carried requests are remeasured. The v4 failed qualification remains intact.

## Open Questions

Fresh successful qualification and native prospective records remain necessary for generation/evaluator review. See `NOTE-V5-PROTOCOL.md`.
