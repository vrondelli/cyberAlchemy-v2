# H22 live measured-pressure result

All 18 frozen live trials completed. The independent audit supports the predicted pressure completion gap: **H21 passed all six unpressured tasks and completed none of the three pressured tasks correctly**. Both original facts were delivered before the first recycle in every pressured H21 row, then absent in its first fallback. Full history was rejected using actual provider token counts. Session 8528 exited 0 after final review and DAG assembly.

| Condition | Baseline correct | H21 correct | H21 model/tokenizer attempts |
| --- | --- | --- | --- |
| Co-located final facts | 3/3 | 3/3 | 21/21 |
| Earlier split facts, no pressure | 0/3 | 3/3 | 21/21 |
| Earlier split facts, calibrated pressure | 0/3 | 0/3 | 24/30 |

The pressured H21 outcomes are two attributable, schema-valid but semantically incorrect proposals and one missing/invalid final proposal. The latter is a failed completion with **unknown raw code semantics**, not an incorrect-code measurement. This distinction was frozen before execution and is retained in the report. There were no transport failures, retries or replaced rows. Total traffic:129 model and135 tokenizer attempts, below the240/480 caps; all17 attributable sources received independent sandbox checks and cleanup verification.

## Mechanism observed

At each window the first recycle occurred at model sequence7, after all six reads. Both facts had been delivered and were present in the full prompt rejected by admission. Neither original fact body remained in the first fallback or at the final selected request. Each pressured candidate used one archive read and two recycles before its final response.

Archive choices were inventory-a.md at8K, subject.mjs at10K, and inventory-a.md at12K. These reads did not restore the two routing values. The existing gate confirms bounded archive use; it does not establish that the evidence needed for the repair has been restored. Tool/schema completion alone remains insufficient for semantic success.

The first full requests exceeded their effective limits by106,121 and97 tokens respectively. [The process analysis](process-analysis.json) identifies612 bytes of repeated envelope digests and byte counts in each rejected full request that could be omitted while keeping every complete output object identical. Actual token savings and improved model behavior are unmeasured. Because the workload was calibrated near a boundary, that byte observation does not establish a solution for payload-heavy contexts whose source content genuinely cannot fit.

## Evidence and next research decision

- [Frozen final report](review-final/report.json) and [canonical observation/decision](review-final/research.json).
- [Complete DAG](../research/dag-pressure-81-final.json):109 records/181 edges; schema and dependency validation passed.
- [Execution completion](completed-82.json), [source binding](execution-binding-82.json) and [local readiness](readiness.json).
- [Full pressure-subset process analysis](process-analysis.json); the earlier one-row prefix analysis remains exploratory history.

The next candidate hypothesis is that separating model-visible tool payloads from audit-envelope metadata can avoid some premature fallback without losing source content, provenance or increasing model calls. Design an explicit validated projection contract, rather than weakening the canonical tool-result schema or removing source evidence. Measure token savings on these retained exact requests before any new model run, and include payload-heavy negative controls so this optimization cannot be mistaken for a general solution to capacity pressure.

A genuine-pressure working-evidence policy remains necessary if the essential source payload itself does not fit. Keep that question separate from avoidable envelope overhead. H21's successful ordinary-masking result remains intact; neither this failure diagnosis nor a future representation optimization completes the broader GLM product plan.

## Open Questions

Can a lossless payload projection keep all required evidence admitted on these same inputs? Which provenance fields must remain model-visible, and how should unknown tool-result schemas behave? How will essential evidence survive payload-heavy pressure? Can task-relevant recovery replace the current irrelevant archive choices without introducing loops? These remain research and construction work; no serving policy changed.
