# H22 live multiple-fact pressure episode

This diagnostic compares unchanged H15 and H21 candidates on three windows (8K/10K/12K) and three conditions: co-located final evidence, split earlier evidence without pressure, and split evidence with calibrated neutral padding. Eighteen rows form nine matched pairs. Both facts are independently revised; six required reads and the protected export stay the same. Facts and oracle files derive from the verified H22 fixture package; only allowlisted source/notes enter the live fixture. This is a diagnostic task family, not held-out product qualification.

The pressure adapter appends the exact content-derived neutral payload used in actual tokenizer calibration. It is applied before runtime admission, so both tokenizer and model requests carry identical padding. All rendered candidates, including rejected full history, are captured alongside selected model requests. Each fact tracks original delivery, delivery before the first recycle, presence at that first recycled request, final source presence and echoed answer presence separately.

## Frozen diagnostic screen

Require all three co-located controls in each arm and all three unpressured split H21 controls to produce correct proposals. Non-pressure controls must not recycle. Each pressured H21 row must have actual measured full-history rejection while both original facts are present, then a recycled dispatch after prior delivery of both facts, with neither fact body in its first fallback. Unexpected pressure placement, failed controls or transport/delivery uncertainty is inconclusive.

When these mechanism conditions hold, zero successful pressured H21 proposals supports the predicted completion gap; any successful pressured H21 proposal is counterevidence to that completion prediction. Report attributable incorrect code, missing/invalid proposals and transport failures separately. A missing proposal is a completion failure, not proof that returned code was wrong. Unknown raw semantics never become false raw semantics. This diagnostic neither changes H21's earlier frozen screen nor admits a product.

Caps: 240 model/480 tokenizer attempts, one worker, zero retries or failed-row replacement. Each 8K row has16/32 attempts; other windows12/24. Output reserve2048, input margin512 and soft headroom256 remain unchanged. Stop on transport, uncertain reservation, drift or worker cleanup failure; preserve completed rows. No model request is authorized by local replay readiness alone; exact provider execution binding follows freeze and checks.

## Construction and operational lanes

Current frontier: verify padding/receipt identity and exact measured replay; freeze the 18-row schedule and independent evaluator; then separately bind live execution. ARE implementer/evaluator owns construction and evidence review. No model source, serving policy or default is changed. User owns product adoption and publication. Canonical dependencies are H22, actual-token calibration, verified multi-fact fixtures and existing runtime/validator; ontology registration/admission is not inferred.

## Open Questions

Will actual GLM recover either or both facts, abstain, or submit incorrect code under measured pressure? Does a narrow calibrated interval move with a real model trajectory? What evidence representation would repair an observed completion gap without recovery loops? This diagnostic does not finish the broader GLM qualification.
