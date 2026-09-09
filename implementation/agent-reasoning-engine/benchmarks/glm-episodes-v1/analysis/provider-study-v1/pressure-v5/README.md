# Byte-bounded paging with persistent context

[H12](hypothesis.json) is a prospective successor to [H11 counterevidence](../pressure-v4/evaluation.json). H10 triggered one recycle, then blocked at `recycling.fresh-context-too-large`: the fallback retained the same oversized newest exchange. Its baseline passed. The failed dense trial dispatched only its initial request, so the oversized observation was not sent to the model.

H11 treatment passed all hidden checks at peak 7,300 tokens but did not recycle, so it did not satisfy the stronger hypothesis. H12 adds the same 120 deterministic synthetic scope labels to the persistent request in both arms. They contain no repair facts. The pager and dense fixture remain unchanged.

Both H12 arms inspect the same dense fixture: the archive repair plus 13,000 deterministic CJK code points. Baseline uses the original pager. Treatment imports an isolated pager that caps each page by UTF-8 bytes as well as UTF-16 units. It retains the existing real-tokenizer admission checks, full-file hash verification, exact offsets, confirmed-delivery accounting and hard window bound. The original serving modules and main study freeze are unchanged.

[Prepared manifest](prepared/manifest.json) binds both identical fixtures, candidate pager/agent, runner, hypothesis and experiment. The [builder](prepare.mjs) rejects drift at the exact source substitution and import sites. Treatment identity binds the compiled candidate; the manifest binds the imported pager bytes.

The full predeclared hypothesis remains demanding: baseline admission failure, treatment semantic pass, at least one recycle, confirmed archive recovery and all dispatched projected token bounds at most 16,384. Improved paging without recycling is useful evidence but does not satisfy the retained falsifier about recycling exposure. Exactly two trials, original then candidate, with at most 32 model and 64 tokenizer calls total; no retries or overwritten trial directories.

Three [paging tests](paging.test.mjs) pass: unchanged ASCII paging, dense CJK and surrogate-pair byte bounds, exact gap-free assembly, and refusal to count an unconfirmed last page as delivered. Three [evaluation controls](evaluate.test.mjs) reject repair-only success, oversized dispatches and missing recovery; transport and zero-call harness failures remain inconclusive.

## Observed live result

[Verification](verification.json) passes. Original pager blocked after one model call on the identical fixture/request. The byte-bounded candidate completed all required reads, passed the canonical schema and all six hidden checks, recycled three times, and confirmed meaningful archive delivery with zero unknown deliveries. Its 14 model calls and 17 tokenizer calls had no retries; peak dispatched projected bound was 7,698, below the effective 7,744 threshold and the 16,384 hard limit. The validation worker was verified absent.

The [canonical evaluation](evaluation.json) records supporting evidence for H12 and selects replication as the next action. One successful pair is not completion of the 8K/10K/12K chapter.

## Construction boundary

Owner-directed candidate experiment under CA2-ROUTE-IMPLEMENT request `glm-live-hypotheses-59`, effect `pressure59-v5`. Only this isolated package is changed. The evaluator owns evidence classification; runtime adoption and broader qualification remain separate. Uses ARE-RL-D01/D02/D03/D04/D07 from the [research ontology](../../../../../packages/evolution-runtime/ontology/research-learning-v1.json). Counterevidence is retained in predecessor records; no LearningDecision activates code.

## Open Questions

Can conservative byte paging complete the dense fixture within the unchanged 16-call budget? Will longer retained metadata trigger recycling, and can archive recovery then complete? A single successful pair would not establish reliability, natural-task generalization, or completion of the 8K/10K/12K chapter. Byte limits are not tokenizer equivalence; actual provider measurement remains required.
