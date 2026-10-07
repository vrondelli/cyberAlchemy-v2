# Identifier-aware Svelte diagnostic (exposed task)

The exposed `SVG elements in <slot> not rendered as SVG elements` task showed that the previous generic term extraction missed the literal `SVG`/`slot` path. The opt-in identifier-aware acquisition arm queried `SVG`, `slot`, and `elements` at discovery call 4, retrieved `src/compiler/compile/nodes/Element.ts` and `src/runtime/internal/dom.ts`, and ended after discovery call 12 (13 model calls total).

Pinned native diagnostic score: Span-F1 **0.3042488619**, File-F1 **0.25**; known model tokens **43,670**, duration **188.344 s**. On this same exposed task, the native control was Span/File-F1 **0/0**, **83,000** tokens, **305.610 s**. This is a four-gate diagnostic win, not prospective replication, and does not dominate the earlier distinctive candidate on every metric.

Full VPS receipts: `/opt/are/evolution-runtime/g01-identifier-svelte-diagnostic-r1`. Frozen source snapshot: `/opt/are/evolution-runtime/g01-distinctive-identifier-source-r1`. The fresh, predeclared attempt-level campaign is [defined separately](../g01-identifier-itt-campaign-r1/DEFINITION.json).

## Open Questions

- Does the identifier-aware arm replicate over previously unseen C, Go, JavaScript, and Rust tasks under the predeclared attempt-level policy?
