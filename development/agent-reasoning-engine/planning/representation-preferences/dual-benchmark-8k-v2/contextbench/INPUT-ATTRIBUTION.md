# Actual input byte attribution

All **434 dispatched model requests** in the eight amended ContextBench outcomes per arm were matched to actual captures using the native receipt request hash. Control has 233 calls; treatment has 201. The supplemental C4 first exposure replaces its original zero-dispatch infrastructure failure, exactly as in `AMENDED-RESULTS.json`; stage 2 remains the same tasks' second repetition.

**Every size below is UTF-8 bytes, not tokens.** Category sizes reconcile exactly to captured prompt bytes. They do not establish safe removal, provider token savings or causal effects.

| Input component | Control bytes | Control share | Treatment bytes | Treatment share |
|---|---:|---:|---:|---:|
| System messages | 302,900 | 13.58% | 125,826 | 6.41% |
| User messages | 141,628 | 6.35% | 128,253 | 6.53% |
| Assistant messages | 223,204 | 10.00% | 190,010 | 9.68% |
| Tool messages | 832,610 | 37.32% | 936,237 | 47.68% |
| Tool schemas | 723,596 | 32.43% | 577,230 | 29.39% |
| JSON framing | 7,063 | 0.32% | 6,182 | 0.31% |
| Total captured prompt | 2,231,001 | 100% | 1,963,738 | 100% |

Actual wire JSON including model/provider parameters totals 2,262,456 and 1,990,873 bytes. This is transport size, not an estimate of model-visible token count.

## Repeated material

A repeated item is exactly equal to an item in an **earlier matched request in the same trajectory**. Repetition resets for every arm/task/repetition. Same-request duplicates alone do not qualify. Tool schemas are compared as complete arrays; messages as complete serialized objects. Partial overlaps and semantically equivalent text are not detected.

| Repeated component | Control bytes | Treatment bytes |
|---|---:|---:|
| System messages | 292,500 | 120,818 |
| User messages | 107,631 | 98,419 |
| Assistant messages | 93,520 | 81,479 |
| Tool messages | 287,126 | 380,169 |
| Tool schemas | 694,984 | 551,276 |
| Total | 1,475,761 (66.15%) | 1,232,161 (62.75%) |

Source-body UTF-8 is a separate **overlapping submeasure of tool messages**, excluding JSON escaping. It totals 339,577 bytes in control (15.22% of prompt bytes) and 480,338 in treatment (24.46%). Of these, 175,870 and 328,812 bytes respectively repeat a source body previously present in a request. The latter is 16.74% of treatment prompt bytes. There are 472/718 source-body appearances; changed ranges or bodies count separately even when they overlap.

Assistant totals include serialized tool calls and their arguments. Explicit `reasoning_content`/`reasoning` fields account for 57,013 control and 37,384 treatment UTF-8 bytes; these overlap assistant totals. The analyzer emits no field values, hidden reasoning, source contents or message excerpts. It does not assume removing reasoning is supported or quality-neutral.

## Evidence and interpretation

[INPUT-ATTRIBUTION.json](INPUT-ATTRIBUTION.json) contains all 16 arm rows, source hashes, request-match counts, role partitions and repetition counts. [input-attribution.mjs](input-attribution.mjs) reads only the amended result index and sealed native generation artifacts. Native `bodyForReceipt` reconstructs each wire profile before matching its receipt hash. Non-dispatched tokenizer candidates never enter totals. The script asserts exact byte reconciliation. All requests matched; no missing capture was treated as empty. No gold or provider was accessed.

Tool-message retention is a plausible target, but the observations also support competing explanations. Treatment may retrieve or re-present more source because its exploration differs; repeated content may be useful evidence rather than waste. Fewer treatment calls change the denominator and mix of phases. System/schema changes already reduce fixed framing, leaving source bodies a larger share even without harmful repetition. Tool schemas repeat because each stateless request must describe available tools; simply omitting them can remove capabilities. Source repetition may prevent evidence loss after recycling; deleting it may increase rediscovery and total cost.

The data supports a bounded retention experiment, not a 15% token-saving prediction. The proposed test is in [NEXT-EXPERIMENT.md](NEXT-EXPERIMENT.md). Whole-trajectory input **and output** usage, native score, completion and actual 8K admission must decide its value.

## Open Questions

How much repeated tool output can be replaced with recoverable references without losing task-relevant distinctions? Does broader source discovery increase useful coverage or only tool calls? Can the same policy help conversation-history retrieval? Per-category token attribution and causal effects remain unknown; byte measurements do not resolve them.
