// Tokenizer-only client for reviewed prompts that retain historically bound reasoning.
// Historical model receipts are provenance inputs, never new-spend receipts.
import {credentials} from '../../../../../../implementation/agent-reasoning-engine/benchmarks/glm-episodes-v1/analysis/provider-study-v1/calibrate.mjs';
import {retainedReasoning} from '../../../../../../implementation/agent-reasoning-engine/benchmarks/external-context-v1/accounting-v1/accounting.mjs';
import {MODEL, postOnce, stable, hash} from './packet-diversity-v1/transport-admission-v5.mjs';

const need = (value, message) => { if (!value) throw Error('historical-tokenizer.' + message); };

export function createHistoricalPromptTokenizer({credential_path, signal, maximum_calls,
  token_margin, output_cap, before_dispatch, record = async () => {}, post = postOnce,
  resolve_credentials = credentials}) {
  need(signal instanceof AbortSignal && !signal.aborted, 'active-signal');
  need(Number.isSafeInteger(maximum_calls) && maximum_calls >= 1 && maximum_calls <= 512, 'call-limit');
  need(Number.isSafeInteger(token_margin) && token_margin > 0 && Number.isSafeInteger(output_cap) &&
    output_cap > 0 && output_cap <= 2048, 'budget');
  need(typeof before_dispatch === 'function' && typeof record === 'function', 'callbacks');
  const {registry, reference} = resolve_credentials(credential_path), receipts = [], cache = new Map();
  return Object.freeze({model: MODEL, receipts, index_receipts: [],
    async measureHistoricalEnvelope(prompt, historical_receipts) {
      const wire = JSON.parse(prompt);
      need(wire && Array.isArray(wire.messages) && wire.messages.length > 0 && Array.isArray(wire.tools) &&
        Object.keys(wire).every(key => ['messages', 'tools'].includes(key)), 'wire');
      need(Array.isArray(historical_receipts), 'historical-receipts');
      const retained = retainedReasoning(wire.messages, historical_receipts);
      const raw = stable({model: MODEL, messages: wire.messages, tools: wire.tools}), request_sha256 = hash(raw);
      const previous = cache.get(request_sha256);
      if (previous) {
        need(previous.retained_reasoning_reservation === retained.tokens &&
          previous.retained_reasoning_occurrences === retained.message_occurrences, 'cached-provenance-drift');
        return previous.input_tokens + token_margin + retained.tokens + output_cap + 2;
      }
      need(receipts.length < maximum_calls, 'call-limit');
      const receipt = {kind: 'tokenizer', model: MODEL, request_sha256, status: 'started', dispatched: false,
        automatic_retries: 0, redirects_followed: 0, authority_effect: 'none', timeout_ms: 30000,
        retained_reasoning_reservation: retained.tokens,
        retained_reasoning_occurrences: retained.message_occurrences};
      receipts.push(receipt);
      await record({kind: 'historical-prompt-tokenizer', receipt: structuredClone(receipt)});
      let response, failure;
      const started = Date.now();
      try {
        await registry.consume({secret_ref: reference, consumer_id: 'glm-flash-transport',
          request_digest: request_sha256, consumer: async material => {
            await before_dispatch();
            need(!signal.aborted, 'aborted-before-dispatch');
            receipt.dispatched = true;
            await record({kind: 'historical-prompt-tokenizer', receipt: structuredClone(receipt)});
            try {
              response = await post(new URL('https://api.z.ai/api/paas/v4/tokenizer'), raw,
                {apiKey: Buffer.from(material).toString('utf8'), timeout_ms: 30000,
                  maximum_response_bytes: 65536, signal});
            } catch (error) { failure = error; throw error; }
          }});
        receipt.status = response?.status ?? null;
        receipt.response_bytes = response?.bytes ?? 0;
        receipt.provider_code = /^\d{3,6}$/.test(String(response?.payload?.error?.code ?? response?.payload?.code))
          ? String(response.payload.error?.code ?? response.payload.code) : null;
        receipt.input_tokens = response?.payload?.usage?.prompt_tokens;
        need(receipt.status === 200 && Number.isSafeInteger(receipt.input_tokens) && receipt.input_tokens >= 0,
          'invalid-response');
        cache.set(request_sha256, receipt);
        return receipt.input_tokens + token_margin + retained.tokens + output_cap + 2;
      } catch (error) {
        receipt.status = response?.status ?? null;
        receipt.response_bytes = response?.bytes ?? 0;
        receipt.failure_code = failure?.code ?? error?.code ?? 'tokenizer-failed';
        throw error;
      } finally {
        receipt.latency_ms = Date.now() - started;
        await record({kind: 'historical-prompt-tokenizer', receipt: structuredClone(receipt)});
      }
    }});
}
