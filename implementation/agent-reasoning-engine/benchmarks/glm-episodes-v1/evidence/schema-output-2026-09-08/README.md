# GLM schema-output probes — 2026-09-08

The direct hosted endpoint did not provide a usable schema-enforcement path in this three-call diagnostic. No new completion policy was introduced; runtime, defaults and fixtures remain unchanged.

| Probe | HTTP | Result |
| --- | ---: | --- |
| Text-mode exact copy | 200 | All keys and string contents preserved |
| JSON-object exact copy | 200 | Lowercase `json` removed from description and source code |
| Strict json_schema with conflicting prompt | 200 | Returned `{"unexpected":true}`, violating required fields and additionalProperties:false |

The JSON-mode response changed `application/json` to `application/` inside replacement source. The schema probe shows that HTTP acceptance is insufficient evidence of enforcement. These are single observations from the direct Z.ai endpoint using glm-5.3-flash, low reasoning, preserved thinking and a 2048 output cap; they do not prove universal model behavior or characterize every schema/provider configuration.

The [official structured-output guide](https://docs.z.ai/guides/capabilities/struct-output) demonstrates json_object with prompted structure and client-side schema validation. The [API reference](https://docs.z.ai/api-reference/llm/chat-completion) enumerates text and json_object; json_schema is not a documented choice. Its tool-choice contract lists auto, so strict or forced tool behavior cannot be assumed either. [Issue 133](https://github.com/zai-org/GLM-5/issues/133) reports lowercase-json loss via OpenRouter and is closed; our direct-endpoint observation is separate evidence, not a claim that its closure guarantees a fix.

Implemented a [reusable diagnostic harness](../../schema-probe.mjs) with three fixed requests, exclusive output directory, pre-dispatch attempt markers, response/deadline caps, no retries, and an exact-content classifier. Three [local tests](tests.tap) passed, including ignored schema, missing fields, altered strings, incomplete response and HTTP rejection. [Requests and results](probes/manifest.json) preserve synthetic input and visible output; credentials and provider reasoning are excluded. No generated code was executed. The [construction result](construction-result.json) records the conclusion and [plan](PLAN.md) owns the D65 boundary.

Decision: do not integrate JSON mode or undocumented json_schema as the repair mechanism. The next candidate needs a separately tested output protocol, such as native patch submission through a tool, or a backend with an explicit constrained-decoding contract. This investigation does not claim either alternative is supported or implemented.

## Open Questions

See [plan](PLAN.md#open-questions). Can a native submission-tool protocol reliably supply all required fields while retaining strict validation? Is an exact schema-enforcement contract available from the provider? No compaction or broader repair-rate claims follow from these probes.
