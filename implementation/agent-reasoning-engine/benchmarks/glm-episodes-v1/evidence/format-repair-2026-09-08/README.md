# Bounded missing-field recovery

The sole rejected submission from the frozen twelve-condition matrix was recovered in one new native model response. GLM explicitly supplied `authority_effect: none`; strict parsing passed and the complete change set, including every source byte, matched the original rejected proposal.

The recovered proposal passed **9/9 public checks** in a disposable container and **8/8 separate oracle checks**. Container cleanup was verified. The run used **one model and one tokenizer attempt**, with no retry or patch application. Six recovery tests passed. All frozen source hashes were verified after execution.

[Plan](PLAN.md), [live result](run/result.json), [transport receipts](run/transport.json), [tests](tests.tap), and [construction result](construction-result.json) preserve the evidence. This is CAV2-D65 candidate construction under the existing user authorization recorded by the request and effect receipt; it does not activate a runtime policy.

The original [matrix](../matrix-feedback-2026-09-08/README.md) remains **11/12** first-pass and final verified. This separate retained-failure recovery supplies a verified proposal for the remaining condition, but is not a fresh 12/12 benchmark. Its correction context used the existing 8K admission policy, not a new full 12K episode. No new continuity or compaction claim follows from this one-call recovery.

## Open Questions

Next is integration with semantic feedback under one shared correction budget, followed by a fresh frozen matrix. Can that integrated process reproduce the result across tasks and window sizes? This sample supports only recovery of an absent authority field with no other parser error; other malformed responses and production reliability remain untested.
