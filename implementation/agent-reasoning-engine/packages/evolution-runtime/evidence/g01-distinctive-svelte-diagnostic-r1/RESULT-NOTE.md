# G01 distinctive-source Svelte diagnostic

Status: completed exposed-task mechanism diagnostic, not a prospective benchmark or ARE-vs-control result. The candidate ran on the GLM VPS against the previously exposed Svelte `:nth-of-type(xn+b)` task. Source snapshot: `/opt/are/evolution-runtime/g01-distinctive-source-r1`; freeze and full receipts: `/opt/are/evolution-runtime/g01-distinctive-svelte-diagnostic-r1`.

The opt-in `intent-anchor-terminal-shortlist-distinctive-r1` arm completed with 21 model calls. It issued two distinctive searches and two bounded base source reads. The receipt-bound final selection included `packages/svelte/src/compiler/phases/1-parse/read/style.js` and `packages/svelte/src/compiler/phases/2-analyze/css/Selector.js`; the first is among the native gold files. Pinned native scoring gave Span-F1 `0.246068`, File-F1 `0.285714`, and 52,278 known model tokens. The previous objective-anchor campaign's Svelte candidate was unscored and offered no eligible wide source range, but this post-hoc diagnostic does not repair that campaign or establish a matched comparison.

The live receipts also showed the old substantive-hint gate could delay acquisition. A subsequent local-only guarded revision triggers acquisition after two anchors and permits terminal construction from a verified, delivered wide source read when the hint gate remains unavailable. That revision passed the provider-free fixture but was **not** the code in this diagnostic; it requires its own frozen source snapshot and fresh tasks.

## Open Questions

- Will the guarded revision produce scoreable, quality-improving, lower-cost results on a predeclared untouched multi-repository cohort?
- How often does the distinctive source search return only test or documentation hits on other languages?
