# Archived failure compatibility replay

**Passed five sealed v1 failure archives.** The candidate reconstructed genuine
delivered evidence, excluded edited source, restored valid candidates absent from
the original terminal view, and exported caller-selected structural probes through
the unchanged native exporter. This is not a model-quality or token-efficiency
result. [REPLAY.json](REPLAY.json) binds source hashes, commands and outcomes.

| Archived arm | Delivered reads | Eligible unique reads | Rendered handles | Eligible omitted | Edited reads excluded |
| --- | ---: | ---: | ---: | ---: | ---: |
| Stage1 CB1 control | 34 | 29 | 29 | 0 | 2 |
| Stage1 CB1 treatment | 53 | 53 | 32 | 21 | 0 |
| Stage1 CB3 control | 29 | 19 | 19 | 0 | 8 |
| Stage1 CB3 treatment | 47 | 33 | 32 | 1 | 1 |
| Supplementary CB4 control | 39 | 29 | 29 | 0 | 0 |

The remaining exclusions were duplicate delivered ranges: respectively 3, 0, 2,
13 and 10. Edited observations were excluded whole; unchanged fragments did not
silently become replacement evidence. The two originally empty terminal views
had zero historical IDs visible in their final request, yet their intact archives
yielded 53 and 29 eligible observations. This demonstrates archive recoverability,
not that the model will choose relevant evidence when it is presented again.

Expanded32 state text occupied 1,026–2,378 bytes across these cases. No provider
tokenizer was called. The structural fit callback used a clearly labeled bytes/4
fixture estimate with a loose token bound; it does not establish actual token cost
or8K request admission. The 32-handle limit omitted 21 eligible reads in one case
and one in another. A runtime paging/access policy remains necessary; perfect
scoring cannot be redefined around this rendered subset.

## Integrity and export outcomes

For each archive:

- Exact source delivery was reconstructed from real saved captures and receipts;
  no unmapped delivery was found.
- The original public terminal response was replayed unchanged through the native
  provenance validator. Its original edited-source or empty-selection diagnostic
  reproduced exactly.
- The original response was **rejected** under the newly generated presentation:
  the new handle state/tool was never in its actual provider request. The replay
  did not rewrite history or claim that the old model selected new handles.
- A separate caller-selected engineering envelope using rendered handles passed
  the strict handle schema, native base-provenance validation and native trajectory
  export. The machine receipt marks this `actual_model_prediction: false`; no
  prediction file was submitted to a scorer and no gold was accessed.
- Mutating a private handle binding failed the presentation-integrity check.
- Original result and snapshot hashes remained unchanged.

The structural export probes covered 2, 11, 5, 5 and 21 files, respectively. Those
counts reflect the caller's deliberate all-rendered-handles probe. They are **not**
predicted model choices, relevance estimates, quality scores or evidence that all
needed source context was found.

## Source restoration and storage

The v1 disposable base/work trees had already been removed. Three exact pinned
repository revisions were restored from retained caches using the native
`clone --no-local --no-checkout` plus detached checkout sequence. The replay used
one v2-owned, disk-backed clone at a time, verified its HEAD/tree and clean source
state, then removed only those temporary verification clones. All retained caches
and v1 artifacts remain intact; the temporary replay root is gone. The receipt
records the exact commands and revision identities. No providers, native scorer,
model generations or source edits were performed.

## Open Questions

- Will a real model select relevant restored handles while preserving every native
  metric and completion criterion?
- What actual provider-token cost results once state, schema, history and reserved
  output are jointly admitted at8K?
- How can omitted eligible evidence remain model-accessible without exceeding the
  bounded context or losing15% cumulative savings?
- Does bounded terminal review help enough to justify its complete model cost?
