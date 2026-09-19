# Completed discovery-study diagnostic

All eight assigned outcomes completed with valid native selections, but the treatment did not meet the scientific target. It used **12.6369% fewer tokens**, improved macro Span-F1 by **5.7531 percentage points**, and reduced macro File-F1 by **12.7793 points**. Neither arm achieved a perfect outcome. The 15% target requires another 7,638 treatment tokens saved at the observed control cost, while preserving quality; merely lowering a budget would not satisfy that condition.

This evaluator-only analysis binds [the sealed results](LIVE-RESULTS.json), all eight source results, task/config/freeze files, source snapshot manifests, source trees and the native evaluator in [LIVE-FAILURE-ANALYSIS.json](LIVE-FAILURE-ANALYSIS.json). The [driver](live-failure-analysis.mjs) made no model or tokenizer calls and changed or removed no source checkout. Gold was loaded only by the existing isolated evaluator subprocess. Final artifacts contain aggregate byte counts, not gold paths, snippets or witness read IDs.

## Fixed-pair cost and quality

| Pair | Control tokens / calls | Treatment tokens / calls | Tokens saved | Span-F1 change, points | File-F1 change, points |
| --- | ---: | ---: | ---: | ---: | ---: |
| 1 | 81,619 / 29 | 83,788 / 32 | −2,169 | 0.00 | −6.35 |
| 2 | 81,634 / 33 | 80,560 / 30 | 1,074 | −1.89 | 0.00 |
| 3 | 79,893 / 26 | 37,092 / 11 | 42,801 | +4.88 | −20.00 |
| 4 | 80,050 / 29 | 80,914 / 28 | −864 | +20.02 | −24.77 |

Net savings are 40,842 tokens. Pair 3 alone saves 42,801; the other three pairs together cost 1,959 more under treatment. Thus the aggregate saving is concentrated in one early-terminating trajectory, not a replicated efficiency advantage across all four tasks. Its file quality also fell.

Seven outcomes entered terminal selection through the shared `token-budget.finalization-reserved` boundary. Only pair 3 treatment reached model-triggered finalization without that budget boundary. Every outcome then made one receipt-bound terminal selection call. There were no hidden missing outcomes in these comparisons. The nominal 96,000-token arm ceiling and 14,000-token finalization reserve explain why many trajectories ended around 80,000 actual tokens; this is not evidence that exploration was complete.

## Discovery, offered evidence and actual selection

The table reports native gold-byte coverage reachable from all eligible delivered reads, then from the actual offered terminal packet, then from the actual selected reads. All selected-stage recall and Span-F1 were reconstructed and checked against the sealed native score. Offered/selected sets use the packet's exact bindings; filtering a deduplicated archive by read ID alone would incorrectly omit equivalent observations with different IDs.

| Pair / arm | Eligible archive coverage | Offered packet coverage | Selected coverage |
| --- | ---: | ---: | ---: |
| 1 control | 11.79% | 5.23% | 0.00% |
| 1 treatment | 9.23% | 0.00% | 0.00% |
| 2 control | 98.91% | 98.58% | 98.58% |
| 2 treatment | 100.00% | 100.00% | 94.93% |
| 3 control | 31.04% | 30.43% | 30.43% |
| 3 treatment | 40.84% | 40.84% | 34.72% |
| 4 control | 29.57% | 20.92% | 4.62% |
| 4 treatment | 24.19% | 24.19% | 24.19% |

Pair 1 demonstrates **two separate deficits**: very little relevant source reached either eligible archive, and treatment's terminal packet omitted every reachable gold byte. More available handles alone therefore cannot establish perfect discovery, but the packet loss also cannot be explained solely by absent discovery. Control additionally discarded all relevant bytes that its packet did offer.

Pair 2 treatment is the counterexample to a blanket missing-discovery explanation: its archive and offered packet contain a gold-pure whole-read union covering every required byte, so perfect span selection is mathematically attainable there without more discovery. Its actual selection omits some of that coverage. This witness is aggregate-only; its read identities were not exported.

Pair 4 treatment loses no reachable gold coverage between archive, packet and selection. Its principal span limitations are missing delivered evidence and false-positive selected material: actual selected span precision is 31.06%, and actual Span-F1 is 27.19%, below the 38.95% perfect-precision upper bound at its available recall. Control has all three losses—archive insufficiency, packet omission and further selection loss. Treatment's better span score alongside lower file score means improvements cannot be collapsed into a single “quality preserved” label.

Across all eight archives, only pair 2 treatment permits perfect whole-read span selection. The mathematical bounds concern currently delivered, provenance-valid whole reads, with no presentation-window limit. They do not bound a new exploration trajectory or prove that omitted/edited fragments can never be recovered. Upper bounds are not model predictions or exact whole-read optima unless a gold-pure union witness establishes attainability.

## Repetition, catalog and reminder costs

| Pair | Exact repeated delivered observations, control / treatment | Identical `read_file` output repeats, control / treatment | Treatment discovery reminders |
| --- | ---: | ---: | ---: |
| 1 | 4 / 11 | 0 / 0 | 3 |
| 2 | 11 / 13 | 7 / 6 | 2 |
| 3 | 13 / 2 | 2 / 1 | 0 |
| 4 | 11 / 10 | 1 / 0 | 1 |

An exact repeated observation uses the same source path, range and content hash. It is a repeated tool result, not necessarily wasted work or a measurement of repeated tokens inside later prompts. New source revisions are not counted as the same source observation. The stricter `read_file` comparison hashes the complete tool output. Neither diagnostic accounts for semantically overlapping but nonidentical reads.

Treatment delivered recovery catalogs on 31, 29, 10 and 27 calls respectively, yet made **zero explicit recovery tool calls** in every pair. Catalog availability and actual recovery use must therefore remain distinct. Discovery reminders appeared on six total calls, whose complete input/output costs sum to 10,449 tokens. Those are costs of entire calls containing reminders, **not marginal reminder overhead**; the catalog, history, tools and model reasoning also occupy those calls. No tokenizer counterfactual isolates any component, so these values must not be summed as independent overhead or advertised as removable savings. Recorded history-byte removal is likewise not a measured token-saving counterfactual.

## General next hypotheses

The findings support investigating three distinct bottlenecks, not retaining the current bundled treatment as a proven improvement:

1. Test a task-agnostic packet coverage/diversity policy against the existing bounded ranking, preserving provenance and the same measured request ceiling. The null is that more diverse candidates displace relevant evidence or increase selection noise. Score discovery reach, offered reach and selected precision separately; do not feed evaluator witness locations into ranking.
2. Separately test a source-use selection policy that verifies coverage of the agent's own public-task reasoning claims and rejects unsupported extra selections. The null is that this simply narrows the answer and loses required coverage. Pair 2's attainable-but-missed selection and pair 4's false positives motivate this question without specifying task-specific answers.
3. For efficiency, attribute repeated actual input and observed rereads before choosing one recovery/reuse or stopping ablation. A policy should redirect redundant work toward unresolved task evidence, not merely lower the call cap. The null is that earlier termination produces the pair-3 pattern: fewer tokens with a quality tradeoff.

Any successor must preserve all four fixed pairs or predeclare a new cohort, retain negative outcomes, count every model/judge call and use untouched confirmation for broader claims. One repetition of four exposed tasks cannot identify which component of the bundled discovery/history/catalog intervention caused the observed differences.

## Open questions

Can a generic terminal packet preserve more relevant archive coverage without exceeding 8K or raising false positives? Why were exposed recovery catalogs unused? Which repeated input is unnecessary rather than essential continuity? Can an earlier stopping policy preserve both span and file quality on every assigned task? These are unresolved empirical questions, not grounds to lower the target or substitute a smaller token cap for efficiency evidence.
