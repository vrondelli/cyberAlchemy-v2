import {postProvider} from './provider-gateway-client.mjs';
import {digest, MODEL, parseProviderResponse, validateModelRequest} from './model-protocol.mjs';

export {MODEL, digest};

// The broker has neither provider egress nor credential custody. It can submit
// only the closed provider envelope to the fixed internal provider gateway.
export function createModel({post = postProvider} = {}) {
  if (typeof post !== 'function') throw new Error('provider-transport-invalid');
  return async function generate(input) {
    if (!input || typeof input !== 'object' || Array.isArray(input) || Object.keys(input).some(key => !['messages', 'json', 'signal'].includes(key))) throw new Error('broker-request-invalid');
    const {messages, json} = validateModelRequest({messages: input.messages, json: input.json ?? false});
    const signal = input.signal;
    signal?.throwIfAborted();
    const body = JSON.stringify({model: MODEL, messages, stream: false, max_tokens: 2048,
      thinking: {type: 'enabled'}, reasoning_effort: 'low',
      ...(json ? {response_format: {type: 'json_object'}} : {})});
    const started = Date.now();
    const result = await post(body, {signal});
    signal?.throwIfAborted();
    if (result.status !== 200) throw new Error(`provider-http-${result.status}`);
    const parsed = parseProviderResponse(result.payload);
    return {text: parsed.text, receipt: {model: MODEL, live_model_invoked: true,
      input_tokens: parsed.usage.prompt_tokens, output_tokens: parsed.usage.completion_tokens,
      reasoning_tokens: parsed.usage.reasoning_tokens, cached_tokens: parsed.usage.cached_tokens,
      elapsed_ms: Date.now() - started, request_digest: digest(body), response_digest: digest(parsed.text)}};
  };
}
