# G01 live source-neighborhood development screen

The [pre-dispatch freeze](FREEZE.json) fixed one already-exposed zstd task,
the opt-in `intent-anchor-source-neighborhood-r1` arm, its source snapshot,
and the prior HEN-11 candidate view. It is a development screen, not an
untouched prospective comparison. The VPS worker completed
`final_context_selected` with a native export at
`/opt/are/evolution-runtime/g01-neighborhood-live-r1/attempt-01`.

The arm executed three bounded base-source neighborhood reads, and all three
were confirmed in model-facing request views and available as terminal handles.
The maximum reserved input upper bound was `5,877`; with `2,048` output tokens
and the runner's two-token margin, the largest full request envelope was
`7,927`, within the 8K limit. The run used 22 dispatched model calls and
82,063 known model tokens. Approximate filesystem start-to-completion elapsed
time was 255.51 seconds. The prior HEN-11 v22 exposed-task row used 24 calls,
83,203 known tokens, and approximately 260.32 seconds by the same file-mtime
method; those small differences are not a controlled efficiency result.

Native scoring of the [sealed prediction](prediction.json) yielded **Span-F1
0 and File-F1 0** in the [score receipt](native-score-network.json). The model
opened `lib/compress/zstd_compress_internal.h` seven times and never opened
`lib/compress/zstd_compress.c` with `read_file`; all three acquired
neighborhoods and the final selection stayed in the header. A subsequent
receipt audit found that `search` **did** deliver one-line observations from
`zstd_compress.c` (27 source-C trajectory steps, including lines near 1295),
but no wider C read followed and none was selected terminally. The failure is
therefore search-hit-to-read follow-through plus terminal use, not complete
absence of source-path discovery. This rejects the hypothesis that expanding
neighborhoods around only model-chosen `read_file` paths is sufficient. The
earlier undelivered upper-bound score expanded a different trajectory that
had selected the C file, so it did not predict this live outcome.

The first scorer attempt with network disabled could not hydrate a missing
sparse Git object from the exact commit and returned `No context extracted`.
The second attempt allowed network fetch of that pinned commit and scored
without error. The successful scorer image remained
`sha256:e592d8dcd42b3218edd36dbf1b959ef5964f203d099f382a301e2ec9bf1941ff`;
the pinned upstream and wrapper were unchanged.

Remote receipt hashes: `result.json`
`ae144154ee401a0171a9bdcd16b00056355e349cbfac1ecafcceff572c9107d4`,
`events.jsonl` `1384f20087ec12a5d46f28cd874c6cbbb3fa2acaef93777c73c3be0f88ad9f9c`,
`prediction.json` `5981beaa38d3e58b6cb90aab6660d6bc33f371348b905fd5c3863a8dc44bb78e`,
and successful native score
`8b721e3aa158304a8ce5869e376bdf2b939488cacd3c00dd81edbae7eee3b466`.
The larger raw journal and result stay on the VPS; only the compact prediction
and score are mirrored here.

Next: test a materially different, gold-blind trigger that follows actual
model `search` hits in implementation files with bounded source reads and
receipt-backed terminal handles. Do not tune another neighborhood radius on
this exposed task or claim prospective improvement.

## Open Questions

- Can deterministic, bounded follow-through turn delivered implementation
  search hits into useful source ranges and terminal context?
- Does that discovery mechanism improve accuracy on an untouched task without
  losing token and elapsed-time efficiency?
