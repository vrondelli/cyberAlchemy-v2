import {createHash} from "node:crypto";

function sha256(value) { return createHash("sha256").update(value).digest("hex"); }
function text(value, field) { if (typeof value !== "string" || !value) throw new TypeError(`${field} is required.`); return value; }
function freeze(value) { if (!value || typeof value !== "object" || Object.isFrozen(value)) return value; Object.freeze(value); for (const child of Object.values(value)) freeze(child); return value; }

function finalText(provider, response) {
  if (provider === "openai") {
    if (typeof response?.output_text === "string" && response.output_text) return response.output_text;
    const joined = (response?.output ?? []).flatMap((item) => item?.content ?? []).filter((part) => part?.type === "output_text" && typeof part.text === "string").map((part) => part.text).join("");
    if (joined) return joined;
  }
  if (provider === "anthropic") {
    const joined = (response?.content ?? []).filter((part) => part?.type === "text" && typeof part.text === "string").map((part) => part.text).join("");
    if (joined) return joined;
  }
  if (provider === "google") {
    const value = typeof response?.text === "function" ? response.text() : response?.text;
    if (typeof value === "string" && value) return value;
    const joined = (response?.candidates?.[0]?.content?.parts ?? []).filter((part) => typeof part?.text === "string").map((part) => part.text).join("");
    if (joined) return joined;
  }
  throw new Error("MODEL_RESPONSE_FINAL_BYTES_MISSING");
}

function usage(provider, response) {
  if (provider === "openai") return {input_tokens: response?.usage?.input_tokens ?? null, output_tokens: response?.usage?.output_tokens ?? null, cache_read_tokens: response?.usage?.input_tokens_details?.cached_tokens ?? null, cache_write_tokens: null};
  if (provider === "anthropic") return {input_tokens: response?.usage?.input_tokens ?? null, output_tokens: response?.usage?.output_tokens ?? null, cache_read_tokens: response?.usage?.cache_read_input_tokens ?? null, cache_write_tokens: response?.usage?.cache_creation_input_tokens ?? null};
  return {input_tokens: response?.usageMetadata?.promptTokenCount ?? null, output_tokens: response?.usageMetadata?.candidatesTokenCount ?? null, cache_read_tokens: response?.usageMetadata?.cachedContentTokenCount ?? null, cache_write_tokens: null};
}

export function createNativeSdkModelTransport({provider, client, model, transport_id = `native-${provider}`, maximum_output_tokens = 4096} = {}) {
  if (!new Set(["openai", "anthropic", "google"]).has(provider)) throw new TypeError("provider is unsupported.");
  if (!client || typeof client !== "object") throw new TypeError("client is required.");
  const modelId = text(model, "model");
  if (!Number.isSafeInteger(maximum_output_tokens) || maximum_output_tokens < 1) throw new TypeError("maximum_output_tokens is invalid.");
  return freeze({kind: `native-${provider}`, transport_id, async generate({prompt, run_id}) {
    const exactPrompt = text(prompt, "prompt");
    let response;
    if (provider === "openai") {
      if (typeof client.responses?.create !== "function") throw new TypeError("OpenAI SDK client is invalid.");
      response = await client.responses.create({model: modelId, input: exactPrompt, max_output_tokens: maximum_output_tokens});
    } else if (provider === "anthropic") {
      if (typeof client.messages?.create !== "function") throw new TypeError("Anthropic SDK client is invalid.");
      response = await client.messages.create({model: modelId, max_tokens: maximum_output_tokens, messages: [{role: "user", content: exactPrompt}]});
    } else {
      if (typeof client.models?.generateContent !== "function") throw new TypeError("Google SDK client is invalid.");
      response = await client.models.generateContent({model: modelId, contents: exactPrompt, config: {maxOutputTokens: maximum_output_tokens}});
    }
    const final_bytes = finalText(provider, response);
    return freeze({final_bytes, receipt: {schema_version: "are.model-turn-transport-receipt/v1", transport_kind: `native-${provider}`, transport_id, run_id, provider, model: modelId, provider_request_id: response?._request_id ?? response?.id ?? response?.responseId ?? null, usage: usage(provider, response), prompt_sha256: sha256(exactPrompt), final_bytes_sha256: sha256(final_bytes), live_model_invoked: true, authority_effect: "none"}});
  }});
}

export function createOpenAINativeModelTransport(options) { return createNativeSdkModelTransport({...options, provider: "openai"}); }
export function createAnthropicNativeModelTransport(options) { return createNativeSdkModelTransport({...options, provider: "anthropic"}); }
export function createGoogleNativeModelTransport(options) { return createNativeSdkModelTransport({...options, provider: "google"}); }
