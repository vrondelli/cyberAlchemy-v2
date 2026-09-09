# Provider schema evidence

Reviewed 2026-09-09 during the live research loop; no request configuration changed.

Z.ai's structured-output guide enables JSON mode with `response_format.type = json_object`, puts the requested schema in the prompt, and demonstrates client-side `jsonschema.validate` with explicit validation-error handling. That example does not establish server-enforced required fields. [Official structured-output guide](https://docs.z.ai/guides/capabilities/struct-output).

The Chat Completion reference lists `text` and `json_object` response-format options. Function parameters use JSON Schema, while returned function arguments must be validated by the caller. The inspected function object does not document a `strict` switch. [Official API reference](https://docs.z.ai/api-reference/llm/chat-completion), [function-calling guide](https://docs.z.ai/guides/capabilities/function-calling).

Inference: these documents do not justify treating the current GLM native-tool arguments as guaranteed schema-valid, nor treating JSON mode as a fix for omitted fields. This is an absence of verified support, not proof that every provider/backend rejects strict-schema features. Any capability probe needs its own exact request and retained response; an accepted parameter alone would not prove enforcement.

The actual local evidence remains stronger for the current configuration: complete JSON arguments repeatedly omit a required envelope field and are rejected by the canonical full-schema validator. Keep validation and field ownership explicit; do not silently fill model-owned values or change a frozen cohort.

## Open Questions

Does the exact GLM-5.3-Flash endpoint offer a documented or experimentally verifiable constrained-decoding mode? If so, does it cover native tool arguments and the full schema subset used here? Could host-owned invariant metadata reduce failures without harming semantic behavior? The original H2 study and future capability tests own those questions.
