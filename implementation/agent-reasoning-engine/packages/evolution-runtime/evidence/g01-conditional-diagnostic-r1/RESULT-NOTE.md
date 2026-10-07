# G01 conditional-stop diagnostics

Status: exposed-task diagnostics only. Full receipts are on the GLM VPS at `/opt/are/evolution-runtime/g01-conditional-go-diagnostic-r1` and `/opt/are/evolution-runtime/g01-conditional-svelte-diagnostic-r1`.

The opt-in `intent-anchor-terminal-shortlist-distinctive-conditional-r1` checked the four-range stop from call 6 when no runtime acquisition occurred, but delayed that first check until eight calls after a runtime acquisition. Both provider-free branches passed.

On exposed GitHub CLI Go, the candidate scored native Span/File-F1 `0.057542/0.285714`, used 33,877 known tokens, and took 158.081s in 12 model calls. It improved accuracy and tokens against the original control (`0/0`, 36,761 tokens) but was slower than control (137.800s). On exposed Svelte, it scored `0/0`, used 45,120 tokens, and took 259.393s in 13 calls; the prior candidate had scored `0.347903/0.285714` in 169.592s. **Reject this conditional stop as a balanced improvement.**

The Svelte source-only title explicitly contained `SVG` and `<slot>`, but the old distinctive query extractor used generic `elements` and `rendered`. A subsequent, separately named identifier-acquisition hypothesis tests exact short acronyms, HTML tags, and CLI flags while prioritizing core source paths. No completed campaign is changed.

## Open Questions

- Can exact objective identifiers recover Svelte's accuracy with less dependence on exploratory luck?
- How much repeated-run variance remains after fixing source acquisition and stopping policy?
