# Bounded-v3 postrun reconciliation

`postrun-bounded-v3.mjs` is an additive offline consumer. It does not modify the running generation or freeze. Run only after the global generation seal and final evaluator report exist:

`node postrun-bounded-v3.mjs live-bounded-v3-rN score-bounded-v3-rN postrun-bounded-v3-rN`

The entry point verifies the exact live freeze and its code/source bindings, the evaluator's generation/reference/code identity, the four fixed task IDs and eight unique answer/judge slots. It reconciles per-call, per-pair, per-arm and aggregate input/output tokens against actual generation receipts and public judge transport events, includes ingestion and judging, and recomputes declared window, quality and savings gates independently of the stored summary. An exhaustive model event census rejects omitted dispatches and duplicate intent records, and reconciles held reservations with unknown calls. A terminal provider proof of no dispatch can supersede an intent without erasing positive usage. Frozen per-pair archive/projection hashes, unique ordered call schedules, actual wire digests and answer-to-judge opaque IDs are checked. Output includes exact evidence hashes for generation and public judge events, aggregate-only reconciliation and native evolution-runtime observation/learning-decision records. Reference values, response text and judge prompts are never emitted. No evaluator references are opened.

Supporting evidence requires a clean complete 153-call comparison, all eight completed answers and valid judgments, four correct treatment answers, nonregression, at least 15% total generation-plus-judge savings, verified sources, settled transport and known usage within reservations. Infrastructure, unknown accounting, missing completion, invalid judging or admission failure is inconclusive. A valid complete comparison failing quality or savings is counterevidence. Every result keeps full-benchmark and campaign claims false and authority_effect none; the native decision is candidate evidence for review, not an authority promotion.

Ten synthetic tests pass, including full cost reconciliation, actual native record validation, counterevidence and inconclusive classifications, and rejection of identity, denominator and accounting drift. No live incomplete artifacts, model endpoints, reference values or network were read.

## Open Questions

The actual terminal generation and scored evaluation remain prerequisites. Independent review of the postrun consumer is required before relying on its emitted classification. It records both completed and failed evaluator reports as terminal evidence; failed reports can only be inconclusive. A missing terminal report is an error, not a fabricated judgment or zero-cost result. The native records require a subsequent human/agent review before selecting a new experiment.
