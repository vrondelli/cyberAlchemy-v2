# H14 general contract review

The [H13 result](../window-study-v1/review-1/report.json) is counterevidence to strict pager-only replication. At 10K the byte pager recycled twice, recovered the archive and stayed below its effective threshold, but the model omitted `schema_version` and retained the surrogate-start defect. A separate [raw-source audit](../window-study-v1/rejected-source-audit/result.json) passed 5/6 cases. The failed trial remains failed.

[H14](prepared/hypothesis.json) tests a general final check against every inspected behavioral requirement and every required output-schema field. This prompt does not list the hidden case or patch the response. Both arms use the exact H12 byte pager. The only treatment is [adapter.mjs](adapter.mjs), applied before real token measurement on the final submission turn. Reading prompts, tool schemas, response parsing and semantic checks are unchanged.

[Schedule](prepared/schedule.json): 24 fresh trials, 12 pairs across 8K/10K/12K, archive-start/archive-end variants and two repetitions. Arm order alternates. This is a successor study; H13's two failed rows are retained separately and are not silently replaced or pooled. The label counts remain 120/350/680 per window; actual recycling is measured, never inferred from the nominal window.

Predeclared useful-effect screen: at least three net paired wins for complete recovery-qualified initial correctness, with no negative net observed-semantic comparison. Every window and variant is reported. Unknown raw-source semantics after schema rejection remain unknown; observed semantic-pass counts are not conditional estimates of all generated source correctness. Repeat rows are clustered by variant and share a task family. There is no matched-length control here, so this estimates the composite review-prompt effect rather than separating attention, added tokens and wording.

Each qualified result must have valid candidate output, all hidden checks passed, all required reads confirmed, actual recycling, archive recovery, no unknown deliveries, and all dispatched projected bounds below `soft_limit -256`. Hard limit 16,384. Individual schema/semantic failures remain observations; finish the cohort unless transport, source drift or uncertain dispatch stops it.

Maximum 320 model and 640 tokenizer calls for this study, additional to H13's actual 13/17. Concurrency one, no retries or replacement rows. The existing controller reservations and completed-file bindings prevent automatic redispatch. `run.mjs CREDENTIAL_CONFIG MAX_NEW_BLOCKS` uses the designated `live/` directory. `review.mjs NEW_OUTPUT_DIRECTORY` creates an immutable completed-row snapshot and canonical research records.

Three controls cover the schedule and caps, qualification rejection conditions, and treatment isolation including unchanged raw response/schema. Candidate pager identity remains pinned by the [manifest](prepared/manifest.json).

## Completed result

The immutable [final review](review-final/report.json) contains all 24 trials: review qualifies 7/12 and baseline 6/12, with three paired wins, two losses and seven ties. Net +1 misses the predeclared +3 screen; H14 is counterevidence to the claimed useful improvement, not a retained winner. The [canonical research records](review-final/research.json) preserve that decision.

The [receipt and recovery audit](verification.json) passed: 304 model calls, 360 tokenizer calls, 56 actual recycles, required reads and archive recovery confirmed in 24/24 trials, no unknown deliveries, retries, fixture mutations or unsafe dispatches. Peak projected bounds were 7,717 / 9,692 / 11,715 tokens at the 8K / 10K / 12K settings. This demonstrates these measured admission/recovery properties; it does not establish revised-fact retention.

The [complete cause audit](cause-summary.json) independently tested every raw replacement source, including rejected submissions. Baseline has 10/12 raw semantic passes; review has 9/12. There are seven schema failures, four unchanged-source proposals (one also has a schema failure), and one changed but incorrect source. The earlier [transaction diagnostics](diagnostics-final/diagnostics.json) see only three unchanged-source proposals because schema rejection precedes that check. Original failed outcomes remain failed. `summarize-causes.mjs` joins source hashes and container validation evidence without filling fields or retrying trials.

The successor [H15](../source-instruction-v1/README.md) isolates a conflicting source-preservation instruction. The [joined DAG](../research/dag-window-60-final.json) validates 49 canonical records and 63 dependency edges; H15 remains untested.

## Construction boundary

CAV2-D65 candidate research frontier: test whether a general contract review adds benefit after measured admission is repaired. Owner-directed native scope is this package and linked research notes, under request `glm-window-replication-60`, effect `joint-contract60`. ARE-RL-D01/D02/D03/D04/D07 define the canonical records. No serving change, commit or activation. Evaluator owns effect interpretation; user owns later adoption.

## Open Questions

Does review improve behavior across windows and both variants? Does it help semantics as well as structural validity? What part of any effect comes from wording versus added attention/tokens? Can a candidate then pass delayed and revised-fact tests, rather than only retrieve an archive page? New families and natural files remain unqualified.
