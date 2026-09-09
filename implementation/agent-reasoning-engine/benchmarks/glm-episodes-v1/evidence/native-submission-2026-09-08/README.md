# Native patch submission — six successful live probes

All six direct GLM-5.3-Flash calls returned exactly one submit_patch_candidate tool call, passed the existing strict patch parser and scope checks, and preserved the expected replacement source bytes. Three copied synthetic candidates containing lowercase json, quotes, backslashes and Unicode. Three performed the same small requested string edit independently. Four [local protocol tests](tests.tap) passed.

This is isolated protocol evidence. The adapter is not wired into the coding agent, generated patches were not executed, and no benchmark repair or context-continuity result is claimed. Auto tool selection is not strict schema enforcement. Six simple successes do not establish reliability on long coding tasks.

Implemented [submission schema and parser](../../../../packages/coding-agent-runtime/glm-flash-v1/submission.mjs) and a [bounded live harness](../../native-submission-probe.mjs). The parser rejects multiple calls, wrong tool names, malformed arguments, missing required fields and base/file/path drift. It uses the existing patch parser without inserting defaults or repairing output. Content fidelity is checked separately against synthetic expected source; structural validity alone does not imply a correct repair. No submission is registered with a filesystem executor.

Requests use the documented auto tool-choice mode, without response_format or an assumed strict flag. [Official API contract](https://docs.z.ai/api-reference/llm/chat-completion). The earlier [JSON-mode corruption probes](../schema-output-2026-09-08/README.md) remain separate evidence.

See [manifest](probes/manifest.json), [all results](probes/result.json), [construction result](construction-result.json) and [plan](PLAN.md). The six attempts were fixed before dispatch, used at most 2048 output tokens and 60 seconds per HTTP request, and had no retries. Source hashes matched at completion. Exports retain synthetic requests, visible native calls and usage counts; credentials and provider reasoning are excluded. Runtime defaults and fixtures remain unchanged.

## Next integration DAG

Candidate construction: terminal submission schema and client scope binding -> tokenizer/dispatch accounting for the native tool -> terminal history and confirmed-delivery handling -> strict parsing plus existing completion gate -> resume and negative integration tests -> independent benchmark report support -> fixed paired live evaluation.

The terminal call must remain a proposal, never a filesystem effect. Preserve the native response in evidence, avoid fabricated tool observations, reject mixed inspection/submission calls, and retain all required reads and recovery checks. Operational activation stays with the product owner and is outside this construction chain.

## Open Questions

See [plan](PLAN.md#open-questions). How should a terminal native submission be represented without weakening historical exchange validation? Does schema overhead fit the existing 8K reservation? Will the model select submission only after delivery/recovery? No provider-internal compaction guarantee follows from these probes.
