import {createHash} from 'node:crypto';

const MESSAGE_FIELDS = new Set(['role', 'content', 'reasoning_content']);
const CHOICE_FIELDS = new Set(['index', 'message', 'finish_reason', 'logprobs']);
const HEX_64 = /^[a-f0-9]{64}$/;

export const MODEL = 'glm-5.3-flash';

export const digest = value => createHash('sha256')
  .update(typeof value === 'string' ? value : JSON.stringify(value))
  .digest('hex');

function fail(code, issues = []) {
  const error = new Error(code);
  error.code = code;
  error.issues = issues;
  throw error;
}

function exactObject(value, code) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) fail(code);
  return value;
}

function boundedCount(value, maximum, code) {
  if (!Number.isSafeInteger(value) || value < 0 || value > maximum) fail(code);
  return value;
}

function optionalCount(container, field, maximum, code) {
  if (!Object.hasOwn(container, field)) return null;
  return boundedCount(container[field], maximum, code);
}

export function validateModelRequest(value) {
  const request = exactObject(value, 'broker-request-invalid');
  if (Object.keys(request).some(key => !['messages', 'json'].includes(key)) || typeof request.json !== 'boolean' ||
      !Array.isArray(request.messages) || request.messages.length < 1 || request.messages.length > 64) fail('broker-request-invalid');
  for (const message of request.messages) {
    if (!message || typeof message !== 'object' || Array.isArray(message) ||
        Object.keys(message).some(key => !['role', 'content'].includes(key)) ||
        !['system', 'user', 'assistant'].includes(message.role) || typeof message.content !== 'string' ||
        !message.content.trim() || Buffer.byteLength(message.content) > 20000) fail('broker-request-invalid');
  }
  if (Buffer.byteLength(JSON.stringify(request)) > 32768) fail('broker-request-invalid');
  return structuredClone(request);
}

export function validateBrokerReply(value) {
  const reply = exactObject(value, 'broker-response-invalid');
  if (Object.keys(reply).some(key => !['text', 'receipt'].includes(key)) || typeof reply.text !== 'string' || !reply.text.trim()) fail('broker-response-invalid');
  const receipt = exactObject(reply.receipt, 'broker-response-invalid');
  const fields = new Set(['model', 'live_model_invoked', 'input_tokens', 'output_tokens', 'reasoning_tokens', 'cached_tokens', 'elapsed_ms', 'request_digest', 'response_digest']);
  if (Object.keys(receipt).some(key => !fields.has(key)) || receipt.model !== MODEL || receipt.live_model_invoked !== true ||
      receipt.response_digest !== digest(reply.text) || !HEX_64.test(receipt.request_digest) ||
      !Number.isSafeInteger(receipt.elapsed_ms) || receipt.elapsed_ms < 0) fail('broker-response-invalid');
  boundedCount(receipt.input_tokens, 34800, 'broker-response-invalid');
  boundedCount(receipt.output_tokens, 2048, 'broker-response-invalid');
  for (const field of ['reasoning_tokens', 'cached_tokens']) if (receipt[field] !== null) boundedCount(receipt[field], field === 'reasoning_tokens' ? 2048 : 34800, 'broker-response-invalid');
  return structuredClone(reply);
}

// This is the complete protocol admitted by the public-chat adapter. It returns
// text and bounded accounting only; tool/function/audio/refusal payloads and
// future message variants fail closed before the conversation runtime sees them.
export function parseProviderResponse(payload) {
  const root = exactObject(payload, 'provider-response-invalid');
  if (!Array.isArray(root.choices) || root.choices.length !== 1) fail('provider-response-invalid', ['choices.exactly-one-required']);

  const choice = exactObject(root.choices[0], 'provider-response-invalid');
  const unknownChoice = Object.keys(choice).filter(key => !CHOICE_FIELDS.has(key));
  if (unknownChoice.length) fail('provider-response-invalid', unknownChoice.map(key => `choice.unknown:${key}`));
  if (choice.finish_reason === 'length') fail('provider-output-limit');
  if (choice.finish_reason !== 'stop') fail('provider-response-invalid', ['choice.finish-reason-stop-required']);
  if (Object.hasOwn(choice, 'index') && choice.index !== 0) fail('provider-response-invalid', ['choice.index-zero-required']);
  if (Object.hasOwn(choice, 'logprobs') && choice.logprobs !== null) fail('provider-response-invalid', ['choice.logprobs-null-required']);

  const message = exactObject(choice.message, 'provider-response-invalid');
  const unknownMessage = Object.keys(message).filter(key => !MESSAGE_FIELDS.has(key));
  if (unknownMessage.length) fail('provider-response-invalid', unknownMessage.map(key => `message.unsupported:${key}`));
  if (message.role !== 'assistant') fail('provider-response-invalid', ['message.role-assistant-required']);
  if (typeof message.content !== 'string' || !message.content.trim()) fail('provider-response-invalid', ['message.nonempty-content-required']);
  if (Object.hasOwn(message, 'reasoning_content') && message.reasoning_content !== null && typeof message.reasoning_content !== 'string') {
    fail('provider-response-invalid', ['message.reasoning-content-string-or-null-required']);
  }

  const usage = exactObject(root.usage, 'provider-usage-invalid');
  const promptTokens = boundedCount(usage.prompt_tokens, 34800, 'provider-usage-invalid');
  const completionTokens = boundedCount(usage.completion_tokens, 2048, 'provider-usage-invalid');
  const reasoning = usage.completion_tokens_details === undefined ? null
    : optionalCount(exactObject(usage.completion_tokens_details, 'provider-usage-invalid'), 'reasoning_tokens', 2048, 'provider-usage-invalid');
  const cached = usage.prompt_tokens_details === undefined ? null
    : optionalCount(exactObject(usage.prompt_tokens_details, 'provider-usage-invalid'), 'cached_tokens', 34800, 'provider-usage-invalid');

  return Object.freeze({
    text: message.content,
    usage: Object.freeze({prompt_tokens: promptTokens, completion_tokens: completionTokens, reasoning_tokens: reasoning, cached_tokens: cached}),
  });
}
