import {lstatSync, readFileSync} from 'node:fs';
import {isAbsolute} from 'node:path';
import {postProvider} from './provider-transport.mjs';
import {digest, MODEL, parseProviderResponse, validateModelRequest} from './model-protocol.mjs';

export {MODEL, digest};

function readCredential(path) {
  if (typeof path !== 'string' || !isAbsolute(path) || path.includes('\0')) throw new Error('credential-path-invalid');
  const details = lstatSync(path);
  if (!details.isFile() || details.isSymbolicLink() || details.size < 1 || details.size > 4096) throw new Error('credential-file-invalid');
  const bytes = readFileSync(path);
  try {
    let text = new TextDecoder('utf-8', {fatal: true}).decode(bytes);
    if (text.endsWith('\n')) text = text.slice(0, -1);
    if (!text || /[\u0000-\u0020\u007f]/.test(text)) throw new Error('credential-material-invalid');
    return text;
  } finally {bytes.fill(0);}
}

// Credential custody is broker-only. The request protocol cannot select this
// path or the provider destination; operators mount one dedicated secret file.
export function createModel({credentialPath = process.env.ARE_GLM_API_KEY_FILE ?? '/run/secrets/model_api_key', post = postProvider} = {}) {
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
    const apiKey = readCredential(credentialPath);
    const result = await post(body, {apiKey, signal});
    signal?.throwIfAborted();
    if (result.status !== 200) throw new Error(`provider-http-${result.status}`);
    const parsed = parseProviderResponse(result.payload);
    return {text: parsed.text, receipt: {model: MODEL, live_model_invoked: true,
      input_tokens: parsed.usage.prompt_tokens, output_tokens: parsed.usage.completion_tokens,
      reasoning_tokens: parsed.usage.reasoning_tokens, cached_tokens: parsed.usage.cached_tokens,
      elapsed_ms: Date.now() - started, request_digest: digest(body), response_digest: digest(parsed.text)}};
  };
}
