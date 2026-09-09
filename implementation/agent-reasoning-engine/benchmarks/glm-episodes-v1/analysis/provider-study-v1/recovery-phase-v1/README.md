# H19: optional bounded recovery before submission

Isolated candidate derived from H15. The implementation keeps read-inspection-evidence offered alongside submission once required inspection is complete, until the existing final reserved turn. Its instruction distinguishes delivery coverage from having enough evidence to repair the code. Archive validation, output schema, required reads, retention, source pins, transport measurement, physical-call budgets and no-effect proposal behavior remain unchanged. No serving activation or provider calls.

## Prospective experiment

The candidate contains no fact values, fixture paths, field names or oracle inputs. The scripted responder uses the same context-only decision rule in both arms: submit the highest visible revision; if the authoritative revision is absent and archive reads are offered, request its recorded source call. The test responder is task-aware, as a real model would need to be; this tests recovery capability, not automatic relevance selection or GLM behavior.

Freeze 90 local trials: baseline and recovery arms, three nominal windows (8K/10K/12K), three values (two revised and one unrevised), five conditions:

1. Immediate synthesis, no pressure: correct answer already visible.
2. Three neutral reads, no pressure: facts are masked.
3. Three neutral reads, synthetic pressure after six model responses.
4. Same pressure, deliberately recover the obsolete fact first, then the revision.
5. Same pressure, deliberately request an unexecuted archive call reference.

Support requires both arms to pass all nine immediate controls, the candidate to pass all 27 valid delayed recovery cases with delivered source evidence, and all nine invalid-reference candidate cases to stop without an accepted proposal or applied effect. The candidate must not exceed the existing 16/12 model and 32/24 tokenizer caps. Baseline delayed failures remain failures. Invalid-reference blocks are a safety control, not a semantic success. Missing exposure is inconclusive. Stop on source drift, wire receipt mismatch or unexpected fixture effects. No retries or replacement trials.

Token counts and responder behavior are scripted. The stale-first sequence explicitly tests that the second recovery remains available. The missing-reference case tests an existing archive validation guard; it is not proof the model detects all missing evidence. This is an affordance change: the host still does not know which facts are decisive and does not guarantee that a model will retrieve them.

## Construction and operational lanes

Product frontier: validate this isolated candidate locally, then design actual GLM relevance/recovery evaluation using the broader finish plan. Owner: ARE implementer. Existing provider study remains in session 28058, independently frozen. User owns later adoption, publication and live-study scope; these do not block local construction and are not granted here. Research ontology dependencies are the H18 result and canonical hypothesis, experiment, observation and learning-decision constructors. Records remain candidate evidence.

## Open Questions

Will GLM choose the right evidence and recover it before exhausting the existing budget? Does keeping submission available allow premature answers anyway? How should genuinely missing evidence be represented instead of a generic runtime block? Natural token pressure, long documents, multiple relevant facts and unseen task families require separate tests before adoption.
