# Completed analysis of GLM benchmark history

The engine's recovery improved more clearly than its initial proposal quality. The latest small-window candidate passed36/36 final checks, but only28/36 before correction. This analysis closes the evidence review; it does not select a new implementation or claim a causal explanation.

## Population and integrity

The dataset contains467 unique exported trials across40 experiment folders:287 earlier development trials and180 trials in five complete frozen qualification campaigns. All involve four task families. The completed campaigns use one fixture version per family. There are20 named completion policies in the full history; seven older trials omit that label.

All180 recent initial/final outcomes and1,591 physical model/1,696 tokenizer attempts reconcile with their campaign aggregates. Nineteen current-schema failures also match historical recorded validation. No input drift or integrity diagnostic was found. Thirty feedback records remain unjoined or reused and cannot replace initial outcomes. Earlier snapshots remain historical; this is the complete snapshot after the fifth campaign.

Sources: [generated report](REPORT.md), [summary](summary.json), [trial dataset](trials.jsonl), [call dataset](calls.jsonl), [input/source hashes](inputs.json), and [independent reconciliation](reconciliation.json).

## What improved

| Frozen campaign, in execution order | Before correction | Final verified |
| --- | ---: | ---: |
| Original small-window qualification | 29/36 | 34/36 |
| Longer model deadline | 29/36 | 32/36 |
| Initial transport recovery | 29/36 | 35/36 |
| Joint schema/public diagnostics | 30/36 | 35/36 |
| Complete transport candidate | 28/36 | 36/36 |

Across allfive:145/180 (80.6%) passed before correction and172/180 (95.6%) passed finally. The initial score permits the campaign's declared transport retries:141 passed without either a correction or a transport retry. These are repeated known tasks, not180 independent held-out tasks. Sequential source changes and uncontrolled provider conditions prevent treating the table as a causal comparison.

## What broke

| Observation | Count | Meaning |
| --- | ---: | --- |
| Schema-invalid initial proposals | 19 | 18 omitted `schema_version`; one omitted `authority_effect` |
| Schema-invalid proposals with passing public behavior before correction | 17/19 | The recorded code passed those public checks while invariant metadata was absent |
| Initial failures with observed semantic defects | 12 | Includes two with schema defects; labels overlap |
| Final initial-transport failures | 6 | No accepted initial proposal reached correction |
| Final correction-transport failure | 1 | An otherwise eligible correction timed out |
| Final semantic failure after correction | 1 | The earlier sequential policy spent its correction before resolving behavior |

The19 schema issues all concern constant metadata fields. That is an observation about this corpus, not evidence that other schema fields can be dropped or that a proposed adapter will improve GLM.

Public semantic counterexamples cluster around archive `start-boundary` (five trials) and retention `empty-history` (four). Other failures include archive end/progress boundaries and tool-pair cases inside long-session tasks. The data identifies failures, not the internal reason GLM made them. Passing public prechecks is also narrower than proving all intended semantics.

Examples: [joint-diagnostics correction timeout](../../../evidence/joint-diagnostics-qualification-2026-09-09/run/round-2/feedback/result.json), [earlier combined defect](../../../evidence/transient-recovery-qualification-2026-09-08/run/round-2/feedback/result.json), [latest missing authority-effect field](../../../evidence/complete-transport-qualification-2026-09-09/run/round-3/initial/trial-08/visible-trace.json).

## Context and task effects

| Soft window | Before correction | Final | Recorded recycled continuity |
| --- | ---: | ---: | ---: |
| 8K | 51/60 | 58/60 | 28/28 |
| 10K | 46/60 | 55/60 | 15/15 |
| 12K | 48/60 | 59/60 | Not exercised |

All43 trials that actually recycled passed the recorded continuity metric. None recorded nonpositive soft headroom. Trials that failed before recycling are not credited with successful continuity. The recorded hard window was16384; these are soft-threshold comparisons, not tests of GLM's full advertised context range. Provider-internal compaction is not observable here.

There is no monotonic improvement with larger soft windows in this sample. Task differences are larger: scoring passed45/45 initial trials, tool pairs38/45, archive bounds33/45, and the long-session task29/45. These associations do not isolate task complexity, prompt layout, transport exposure, evidence position, or nominal context size.

Earlier development data contains39 continuity failures among169 recycled trials, while the recent frozen candidates have none. The metrics were measured across changing policies and cannot alone prove the cause of that improvement. The recent history contains no exact duplicate read requests after including page offsets; normal pagination must not be counted as rereading.

## Transport, output and cost evidence

There were12 failed physical model attempts andfive retries across the five campaigns. Usage remains unknown for the12 failed calls. Recorded known usage totals5,245,922 input tokens and166,391 output tokens; these are not billed totals.

Recorded model-call latency p50/p95 was4,967/16,083ms. Initial trial latency p50/p95 was53,782/111,456ms. These include recorded failures and use nearest-rank quantiles. We have no measurement separating provider queue time from network and inference time.

No recorded output-limit signal appeared in the completed qualification calls. This weakens a simple output-cap explanation for the current observed failures; it does not establish that2048 tokens will suffice for broader tasks.

## GCF review and unresolved explanations

The [pinned GCF review](../../GCF-REVIEW.md) identifies a possible structured-input representation to investigate. The reviewed benchmark tables do not include GLM; their workload and token accounting differ from ARE. No GCF library was installed, no codec benchmark was run locally, and no GLM result is attributed to GCF.

We have not determined whether metadata omission arises from model-facing contract burden, instruction/tool-schema handling, or another mechanism. We have not isolated why visible boundary cases are missed. The continuity metric may also cover less than the broader memory behavior we ultimately want. Those questions require competing hypotheses and discriminating tests, not automatic selection of the latest suggested fix.

The earlier proposed smaller output contract and GCF comparison remain unselected possibilities. Per the user's ordering, the ontology/DAG hypothesis stage follows completion of this analysis. No new experiment or runtime change was started after the fifth frozen campaign.

## Validation

Nine regression tests passed, covering canonical manifest hashes, corrupted bindings, duplicate exports versus distinct runs, pagination, incomplete campaigns, overlapping labels, correction timeout classification, full-schema diagnostics and retained replay exclusion. The final full-data reconciliation independently confirms allfive campaign totals and checks that the19 diagnosed schema failures refer to the same protected source strings used by their public prechecks.

## Open Questions

- Which competing mechanism explains missing invariant metadata, and what observation would distinguish it?
- Why are archive boundaries and empty history missed despite visible evidence?
- What additional probes distinguish continuity checks from actual retention of necessary task facts?
- Does an input representation change help after controlling information content, output contract, task and transport?
- How much of the remaining apparent variability is explained by the narrow corpus and repeated candidate selection?

The next stage should use ARE's existing research-learning hypothesis and prospective DAG model. This report supplies observations and limitations; it does not fabricate a supporting HypothesisObservation, register an experiment, or issue a LearningDecision.
