# Compact campaign and independent scoring

Status: additive offline candidate; no live campaign admission.

The compact generation worker selects the compact three-arm dispatcher and the
V4 live factory. The separate scorer reconstructs saved predictions with the
matching receipt-first decoders before any native evaluator invocation.

## Explicit component selection

- comparison-compact-generation-worker.mjs selects comparison-compact-campaign-runner.mjs.
- The runner selects comparison-compact-arm.mjs and comparison-compact-live-client.mjs.
- The live factory selects packet-diversity-v1/live-client-bounded-v4.mjs, which selects transport-bounded-v4.mjs.
- score-comparison-compact-campaign.mjs selects comparison-compact-prediction.mjs.
- Prediction reconstruction selects compact-current-v1/terminal-evidence.mjs,
  compact-terminal-export.mjs and compact-repair-terminal-export.mjs for the
  current-ARE, minimal and independent arms respectively.

All other production behavior is inherited unchanged from the R2 campaign/scorer
and prior live factory. Original frozen components remain unchanged. Index
tokenizer failure receipts retain their existing representation; selection of V4
does not add the model/request-tokenizer diagnostic fields to that separate path.

## Verification scope

Twenty-eight scoped offline tests cover encoded twenty-observation source
delivery and saved prediction reconstruction in all three arms, current-ARE
eager/demand recovery, forged predictions/receipts, changed snapshots/captures,
omitted journals, shared cancellation and dispatch admission. Scoring tests use
injected evaluator outcomes and check the fixed twelve assignments, failure cost
retention and rejection of post-score source drift. They do not measure model
quality. Repair fixtures use real isolated Git sources and scripted transport;
current-ARE fixtures use synthetic tool responses with real native export.

The production launcher, generation-process default worker, production-stage
worker, qualification component selection and source freeze still need explicit
successor integration and review. Merely adding these modules does not update
the production entry point.

## Objective and method

The unchanged target is perfect native span/file coverage and precision on all
four exposed development tasks, twelve valid outcomes, complete 8K request
accounting and at least 15% cumulative model-token savings against both controls,
followed by untouched confirmation. Current-ARE full-field presentation remains
an explicit treatment difference; historical control scores cannot be reused.

The recorded fresh canary has qualification_passed=false because no retained
reasoning was returned. Preserve its native observation and define a prospective
reasoning-bearing qualification before full live comparison. The radical
retrieval-first hypothesis remains a separate prospective experiment.

## Open Questions

- Does the complete new entry-point freeze select only the intended compact
  worker, factory, qualification and scorer components?
- Can the same GLM/profile exercise retained reasoning under a prospectively
  registered workload?
- Will quality and total-task token results satisfy the original gates on
  development tasks and then untouched confirmation?
