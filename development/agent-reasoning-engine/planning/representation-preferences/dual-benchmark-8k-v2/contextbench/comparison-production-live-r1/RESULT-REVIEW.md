# Production R1 independent result review

Result integrity approved; scientific comparison **inconclusive**. Three slots were attempted, nine never started and zero produced valid final outcomes. No native evaluator calls occurred. Launcher `scored` means a report was generated, not that valid quality measurements exist.

Eleven model calls reconcile to **16,855 tokens**: 16,233 input + 622 output, including 6,464 cached input tokens and 76 reasoning output tokens. No unknown model spend appears. Sixteen request-tokenizer attempts include two failures/cancellations; one index-tokenizer attempt succeeded. All eleven dispatched model requests verify below 8K (maximum projected 5,322).

Minimal history stopped after one call/996 tokens: the next request required 5,773 measured + 512 margin + 4 retained reasoning + 2,048 output = **8,337**, so admission denied it. Current ARE used five calls/10,470 tokens before a tokenizer `request-failed` with no HTTP status or response bytes; its cause is unestablished. Shared stop cancelled the independent arm’s tokenizer after five calls/5,389 tokens. Remaining tasks stayed unstarted.

All twelve outcome/receipt bindings and the 288-file freeze verify; process/group are absent after unforced exit zero. The score report has twelve invalid rows and no native metrics. No quality or accepted savings conclusion is supported.

The review binds 377 retained artifacts, including corrected OBSERVATION.json. Six owned source trees are clean at pinned commits; eighteen snapshots verify. After retaining this review and completing any direct-checkout diagnosis, only this run’s source_root is disposable. Preserve all evidence and shared caches. No deletion was performed.

## Open Questions

[The production contract](../COMPARISON-PRODUCTION-LIVE.md) owns native inconclusive registration, prospective tool-result/context investigation and any separately reviewed successor. Provider failure cause remains unresolved; no automatic rerun is admitted.
