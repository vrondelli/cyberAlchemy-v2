# What the accumulated GLM data says

We improved recovery more clearly than we improved the model's initial proposals. The next useful experiment should isolate the model-facing contract and evidence representation, rather than add another prompt rule or run another identical qualification campaign.

This snapshot contains 461 unique exported trials across 40 experiment folders and 20 named completion policies (seven older trials omit that label). All trials concern just four task families: archive bounds, JSON scoring, tool-pair retention and long-window retention. This is substantial operational evidence but a narrow task corpus. Thirty trials belong to the active fifth qualification campaign at snapshot time; only its first 24 final outcomes were available. They are separated from the four complete campaigns below.

## Observations

| Frozen campaign, in execution order | Initial proposals | Final verified |
| --- | ---: | ---: |
| Original small-window qualification | 29/36 | 34/36 |
| Longer model deadline | 29/36 | 32/36 |
| Initial transport recovery | 29/36 | 35/36 |
| Joint schema/public diagnostics | 30/36 | 35/36 |

The initial proposal rate remains near 81–83%. Later changes mainly affect what happens after an initial failure. These are sequential development campaigns with four different source snapshots; they do not isolate causal effects or establish a service-level probability. See [generated report](REPORT.md), [machine summary](summary.json), and [source-bound trial rows](trials.jsonl).

1. **The current protocol error is concentrated.** All twelve schema-invalid proposals in these four campaigns omitted `/schema_version`; no other schema issue appeared in their complete output reanalysis. Eleven had passing public behavior checks before correction. The twelfth combined schema and semantic defects. Examples: [passing public behavior but correction timeout](../../../evidence/joint-diagnostics-qualification-2026-09-09/run/round-2/feedback/result.json), [combined schema/semantic failure](../../../evidence/transient-recovery-qualification-2026-09-08/run/round-2/feedback/result.json). Full schemas remain necessary; adding another field-specific prompt is unlikely to be the most informative next intervention.

2. **The remaining final failures are mostly transport.** Of eight final failures, six are initial transport failures, one is a correction transport failure, and one is a semantic failure after correction. Across initial and correction stages there were eleven failed physical model attempts and four retries. Interrupted usage is unknown for eleven calls. A retry-assisted success does not mean the initial model proposal improved.

3. **The recent data does not implicate observed recycling as the remaining bottleneck.** All 34 trials that actually recycled passed recorded continuity, and none recorded nonpositive soft headroom. Some initial transport failures ended before recycling could be exercised; these do not count as successful context tests. Earlier development experiments do contain continuity failures, so this finding applies to the recent frozen candidates. Provider-internal compaction remains unobservable.

4. **Semantic errors still deserve separate investigation.** Ten initial failures have a recorded semantic defect, including one with a schema defect. Public counterexamples cluster around archive `start-boundary` and retention `empty-history`. These labels locate weak behavior but do not establish why the model missed it. Delivering a case is not proof of understanding it. Exact JSON scoring passed all 36 recent initial trials, while the long-window task passed 23/36. Compare within task and source version before attributing the difference to context size.

5. **The obvious output-cap and read-loop explanations lack recent support.** No completed qualification receipt reports an output-limit signal, and no exact duplicate read request appears after accounting for page offsets. Older development data includes repeated reads. The current script prevents normal pagination from being mislabeled as a loop.

## Different solution to test

The engine already knows the canonical schema version, authority effect, selected base tree and authorized target. A smaller explicit model-facing tool can ask for proposed source, while a trusted adapter constructs invariant metadata from that bound scope. The canonical patch validator remains the boundary contract. Missing source, malformed native arguments, wrong scope, stale source pins and semantic failures still reject. This changes responsibility by design; it does not silently coerce invalid legacy proposals into valid ones.

This should remove the need for the model to emit the specific constant that caused the twelve recent schema failures. It is a mechanism-based hypothesis, not a measured improvement. It could expose different failures, which is why a fresh controlled comparison is required.

GCF addresses another axis: compact structured input. Its generic profile may help case/contract observations; stateful reference and delta modes require extra lifecycle work. Encoding the same full output contract in GCF does not automatically ensure its required fields are present. The [GCF review](../../GCF-REVIEW.md) documents source evidence, limits and a 2×2 experiment separating input format from output contract.

## What to do before spending on another matrix

Use this analyzer after every candidate, with a new immutable output directory. Start each iteration with a failure distribution and an explicit competing explanation. Choose one bounded intervention and state the primary metric before execution. Track first-proposal schema validity, first-proposal semantic quality, final verified outcomes, physical transport attempts and continuity separately. Do not optimize a single blended pass rate by repeatedly selecting a successful campaign.

First perform offline codec/contract probes on the retained data. If the evidence supports it, compare JSON/GCF input and full/minimal output under identical conditions. The GCF review proposes 48 exploratory trials for all four treatments across the current twelve task/window conditions; exact operating caps require their own implementation plan. Qualification success alone is not permission to skip this discrimination or to claim held-out generalization.

## Reproducibility and limitations

The analyzer passed nine regression tests. It checked canonical manifest bindings and independently reconciled all 144 complete-campaign trial identities, initial/final scores, 1,261 physical model attempts and 1,343 tokenizer attempts. No input drift or integrity diagnostic was recorded in this snapshot. `inputs.json` records all 2,395 read-file hashes plus analyzer and canonical-validator hashes. These bindings are integrity evidence, not signatures or a rerun of the historical oracles.

The earlier 287 development trials are available in `summary.json` and the normalized dataset. Their changing prompts, runtime versions, task versions and incomplete feedback make them unsuitable for pooling into the recent qualification rate. Thirty feedback records remain explicitly unjoined or reused; they cannot replace initial outcomes. The snapshot precedes completion of the active campaign and must remain as recorded.

## Open Questions

- Does moving invariant metadata into a trusted adapter improve first-proposal validity without harming semantic quality? Implementer/evaluator owns the comparison.
- Does stateless GCF improve complete-request GLM token use or comprehension when JSON receives identical information? Evaluator owns tokenizer and behavioral measurements.
- Why are archive start-boundary and retention empty-history cases missed despite visible evidence? Requires controlled evidence-layout probes, not an inferred root cause from counts.
- Which new repository tasks will test transfer beyond these four repeatedly tuned fixtures? User/product owner owns corpus scope; evaluator owns separation of development and held-out data.

No runtime redesign, GCF adoption, new provider campaign, activation or full GLM completion is claimed by this analysis.
