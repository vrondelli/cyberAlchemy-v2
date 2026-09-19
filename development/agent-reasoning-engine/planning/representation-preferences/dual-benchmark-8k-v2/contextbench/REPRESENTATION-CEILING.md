# Archived whole-read representation ceiling

Evaluator-only analysis of the five failed cases in the frozen v1 [failure analysis](../../dual-benchmark-8k-v1/contextbench/FAILURE-ANALYSIS.json). **No selection of their provenance-valid delivered reads can reach perfect native SpanF1. Whole-read coarseness is not an additional bottleneck in these five archives; insufficient delivered coverage is.** This result does not measure the successor model or its quality.

## Results

The metric is native **byte-span** F1, not line F1. All unique eligible reads are included, ignoring presentation limits, ranking, handle count and the 8K window. These are generous representation ceilings, not actual predictions.

| Archived case | Eligible reads | Gold bytes | Reachable gold bytes | Maximum recall | Proven SpanF1 upper bound | Gold-pure reads |
|---|---:|---:|---:|---:|---:|---:|
| Stage 1 C1 control | 29 | 2,697 | 317 | 11.75% | 21.04% | 4 |
| Stage 1 C1 treatment | 53 | 2,697 | 249 | 9.23% | 16.90% | 3 |
| Stage 1 C3 control | 19 | 19,044 | 5,771 | 30.30% | 46.51% | 13 |
| Stage 1 C3 treatment | 33 | 19,044 | 5,880 | 30.88% | 47.18% | 31 |
| Supplemental first-exposure C4 control | 29 | 12,812 | 0 | 0% | 0% | 0 |

In every row, the union of individually gold-pure reads contains **all** reachable gold bytes. Thus selecting their union is a mathematical witness that achieves the stated bound in the unrestricted whole-read set model (the zero-intersection case gives F1 zero for any nonempty selection). No exhaustive subset optimizer was needed. The JSON conservatively labels these as proven upper bounds, leaves `exact_optimum_span_f1` null and does not claim an actual native-scored prediction. No witness read identities or gold locations are exported.

Even arbitrary subspan selection from these same valid archives cannot recover the missing gold bytes. The all-read union precisions are 4.40%, 6.39%, 90.17%, 98.49% and 0%, respectively; selecting everything is not a relevance policy. The pure-read analysis is an evaluator-only proof and must not become a gold-driven candidate selector.

## Exact method and proof

Let G be the native gold byte union, each R_i an eligible whole-read byte union, U their union, and P the union of reads individually contained in G. P contains no false positives. Native unions merge inclusive byte intervals per file; native line-to-byte conversion includes precisely the same file-byte behavior as the scorer.

Every selected union S is a subset of U. Therefore recall is at most r = |U intersect G| / |G|. Since precision is at most one, F1 is at most 2r/(1+r). Perfect whole-read selection is possible exactly when P = G: any selected read with bytes outside G would make precision less than one; conversely selecting all pure reads yields G when their union equals G. This is an exact feasibility criterion for unlimited selection, not a heuristic search.

The native `Gold.byte_spans`, `_step_spans`, `merge`, `span_total_bytes` and `span_intersection_bytes` supply the interval rules. The analysis uses `projectDeliveredEvidence` on the full receipt-bound archive, including reads no longer visible after recycling. Entire reads with unmapped edited lines are excluded under the current candidate's native-valid whole-read contract. Duplicate observations do not change their union. Native score artifacts were inspected first to verify the byte-versus-line distinction.

## Isolation and reproducibility

[REPRESENTATION-CEILING.json](REPRESENTATION-CEILING.json) records aggregate results, sealed source-result hashes, pinned repository commits/trees, candidate/evaluator hashes, upstream metric source hashes and dataset hash. [REPLAY.json](REPLAY.json) separately binds the same archive's snapshot manifests and demonstrates native schema/provenance/export compatibility. Candidate projection receives only delivered observations, source snapshots and the pinned source checkout. It receives no gold, no score and no evaluator feedback.

The [driver](evaluator/representation-ceiling.mjs) computes source-only projections, then invokes an isolated [evaluator](evaluator/representation-ceiling.py). Only that subprocess loads gold. It verifies the upstream manifest and gold dataset before calculating aggregate sizes. No gold source text, paths, spans or witness read IDs are written to the report, candidate state or provider prompts. No reference patch is used. No provider or tokenizer calls occur, and no model selection is simulated.

Invocation from repository root (receipt is immutable and the command refuses to overwrite it):

```sh
node development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench/evaluator/representation-ceiling.mjs
```

Three exact pinned checkouts were restored sequentially from retained local caches with native `clone --no-local` and detached checkout. Maximum simultaneous clones: one. All newly created checkouts and source-only payloads were removed. Frozen v1 files and retained caches were not modified. The audit passed.

## Implications and limitations

Terminal handle recovery can repair stale visibility and avoid edited-source selections, but it cannot manufacture undelivered evidence. Achieving perfect retrieval on these cases would require a trajectory that obtains more relevant valid source before terminal selection. This observation motivates general source-coverage and completion-policy hypotheses; it provides no task-specific search hints and does not justify exposing gold to the generator.

These are five outcome-selected failed archives across three task identities, not an unbiased cohort estimate, full ContextBench score, future-trajectory bound or proof that whole-read representation never causes loss. Excluding mixed edited reads can itself reduce coverage; projecting eligible fragments would be a separately specified representation whose native acceptance must be tested. Gold may span more context than a task-solving agent elects to inspect. Unlimited mathematical selection ignores model choice, presentation capacity, complete-request 8K admission and token cost. No claim of perfect score, completion preservation or 15% savings follows.

## Open Questions

Can a source-only discovery policy broaden task-relevant coverage while preserving 8K requests and whole-trajectory token savings? Should a separately versioned receipt-bound subspan mechanism admit unchanged fragments of mixed edited reads? Can paged terminal evidence preserve all useful archived options without exceeding the request budget? These questions remain implementation/evaluation work; this evaluator must not supply task-specific gold locations or selection policies.
