# Failed comparison: tool payload research

The reviewed production R1 comparison is inconclusive. Three of twelve slots started; eleven model calls consumed 16,855 known tokens; no valid quality outcome or native evaluator score exists. Current ARE's failed tokenizer request returned no response; its cause is unknown. The minimal-history failure is separately explained by a successfully measured follow-up of 8,337 tokens including output, margin and retained reasoning, exceeding 8K. All eleven dispatched requests themselves stayed within 8K.

## Observed gap

An initial-window preflight does not qualify the next tool-result-bearing request. The failed search returned twenty observations from five sources. Stable JSON serialization is 10,967 bytes, including 1,164 bytes of source text. This is a representation diagnosis, not proof that the architecture lacks useful reasoning ability.

The offline exploratory codec in analyze-comparison-tool-payload.mjs factors repeated source metadata into a shared dictionary and reconstructs the redundant retrieval-handle prefix. It retains all twenty complete observations. Exact decoding reproduces every original field and value, including a synthetic unknown-field/nonstandard-handle case. The encoded payload is 6,254 bytes, a 42.97% byte reduction. No runtime uses the codec. No tokenizer measurement, request-fit, quality or total-token savings claim follows from byte size.

A ten-observation page is 5,499 bytes but defers half the observations. Pagination must count the later calls and model tokens needed to recover omitted evidence; it is not equivalent to the lossless dictionary.

## Competing hypotheses and selection

H1: lossless factoring of repeated provenance reduces measured follow-up input while preserving exact delivered evidence. Select this for bounded qualification first: it directly addresses the observed payload, is reversible and does not discard observations.

H2: measured adaptive pagination is necessary even after factoring. It must preserve cursors and record only actually delivered observations as exposed evidence. Additional calls and tokens count.

H3: a radical retrieval-first architecture reconstructs decision context on demand more efficiently than maintaining a continuous reasoning state. Keep this as a distinct prospective branch, not a silent replacement of the current three-arm experiment.

H0: representation changes reduce bytes but do not improve measured fit or total task tokens/quality, because tokenizer behavior, repeated retrieval or model interpretation offsets the gain.

The original independent-investigation hypothesis remains inconclusive. No model comparison is retroactively repaired. Any common codec added to all arms changes their implementations and requires a new frozen comparison.

## Task DAG

1. Retain the independent failed-run audit and native inconclusive observation/decision.
2. Register competing hypotheses, unchanged initial/enduring objectives and a prospective qualification experiment.
3. Test the lossless codec across tool schemas, repeated/distinct source revisions, unknown fields and malformed encodings; verify captured-delivery reconstruction.
4. In parallel, diagnose the tokenizer transport failure without presuming timeout or adding unaccounted model retries.
5. Measure complete reconstructed follow-up requests with the real tokenizer, including instructions, tools, history, reasoning, margin and output reserves. Reject any overflow; do not infer fit from bytes.
6. Review findings and either reject/revise H1 or propose a separately reviewed runtime integration common to the three arms.
7. Freeze a successor twelve-outcome comparison with two workers, the same 8K and 96K/96-call budgets, exact perfect-quality and 15% total-token gates, then run and record its outcome.
8. Require untouched confirmation and broader benchmark coverage before a general success claim.

## Construction and operations

Current product frontier is prospective payload qualification, not a live architecture change. Coordinator owns codec/evidence contracts and native registration; reviewer owns independent method/evidence review. Operational prerequisites are bounded tokenizer execution, known receipt accounting and fresh D:/WSL capacity. C: stays excluded. No full retry is authorized by the diagnostic artifact alone; existing user benchmark authorization still requires the exact reviewed successor configuration.

## Open Questions

Will the factored representation reduce real tokenizer counts enough? Does it preserve model comprehension and native delivered-evidence reconstruction across schemas? Can it save at least15% total model tokens on completed long tasks without quality loss? What caused the separate tokenizer request failure? The radical branch needs its own bounded protocol before implementation. Native registration and reviewed selection preserve the original GLM qualification and general ARE objective.
