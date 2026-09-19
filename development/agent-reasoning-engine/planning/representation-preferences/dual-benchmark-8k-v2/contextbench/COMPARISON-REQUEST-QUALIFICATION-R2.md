# Initial request qualification R2

Additive successor to the [rejected R1](COMPARISON-REQUEST-QUALIFICATION-REVIEW.md). The original implementation and review remain unchanged.

The qualifier rejects explicit infrastructure and persistence failures, unknown accounting, unhealthy provider flags, and failed provider receipts independently of the expected model-disabled stop. Failed rows retain client receipt arrays. If the final report cannot be saved, the exception carries all twelve rows in `error.result`, with `qualified: false`, `status: incomplete`, and the persistence error. A caller must retain that result and treat the stage as failed.

A pending phase reservation alone is expected when model dispatch is deliberately disabled. It is not a dispatched model call or evidence of provider failure; model receipts remain forbidden. Initial qualification does not establish generation accounting.

Seven tests pass through actual prepared runners with temporary Git sources and a scripted tokenizer, including eight explicit failure variants, auxiliary provider failure, and final report write failure after twelve successful measurements. No real provider calls or evaluator scores were produced. Tests: `node --test comparison-request-qualification-r2.test.mjs` from this directory.

## Construction and operations

Product frontier: independent successor review, then bounded tokenizer-only process integration. Operational prerequisites for actual measurement: exact source freeze, fresh D:/WSL storage admission, credentials, and bounded process settlement. Production generation retains its separate exact review and later native scoring gates. No publication or release effect is authorized by this change.

## Open Questions

Independent review is pending. Actual initial-request measurements, production freeze, full twelve-outcome generation and untouched confirmation remain outstanding. [The original contract](COMPARISON-REQUEST-QUALIFICATION.md) owns the measurement scope and [current progress](../CURRENT-PROGRESS.md) owns the broader research objective.
