import {createHash} from "node:crypto";

import {projectSecretReference} from "./secret-provider.mjs";

const DEFAULT_TIMEOUT_MS = 60_000;

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function requireText(value, field) {
  if (typeof value !== "string" || value.length === 0) throw new TypeError(`${field} is required.`);
  return value;
}

function endpointFor(baseUrl) {
  const url = new URL(requireText(baseUrl, "base_url"));
  if (!new Set(["http:", "https:"]).has(url.protocol)) throw new TypeError("base_url must use HTTP or HTTPS.");
  if (url.username || url.password) throw new TypeError("base_url credentials are forbidden; use an API-key reference.");
  url.pathname = `${url.pathname.replace(/\/+$/u, "")}/chat/completions`;
  url.search = "";
  url.hash = "";
  return url.toString();
}

function responseText(payload) {
  const content = payload?.choices?.[0]?.message?.content;
  if (typeof content === "string" && content.length > 0) return content;
  if (Array.isArray(content)) {
    const joined = content
      .filter((part) => part?.type === "text" && typeof part.text === "string")
      .map((part) => part.text)
      .join("");
    if (joined.length > 0) return joined;
  }
  throw new Error("MODEL_RESPONSE_FINAL_BYTES_MISSING");
}

function resolveApiKey({api_key, api_key_env, env}) {
  if (typeof api_key === "string" && api_key.length > 0) return {value: api_key, source: "explicit"};
  if (typeof api_key_env === "string" && api_key_env.length > 0) {
    const value = env?.[api_key_env];
    if (typeof value === "string" && value.length > 0) return {value, source: `environment:${api_key_env}`};
  }
  return {value: null, source: "none"};
}

export function createOpenAICompatibleModelTransport({
  base_url,
  model,
  api_key,
  api_key_env,
  api_key_ref,
  secret_registry,
  secret_consumer_id = "model-transport",
  env = process.env,
  fetch_impl = globalThis.fetch,
  timeout_ms = DEFAULT_TIMEOUT_MS,
  transport_id = "openai-compatible",
  extra_headers = {},
  request_options = {}
}) {
  const endpoint = endpointFor(base_url);
  const modelId = requireText(model, "model");
  if (typeof fetch_impl !== "function") throw new TypeError("fetch_impl must be a function.");
  if (!Number.isSafeInteger(timeout_ms) || timeout_ms <= 0) throw new TypeError("timeout_ms must be a positive safe integer.");
  if (!extra_headers || typeof extra_headers !== "object" || Array.isArray(extra_headers)) throw new TypeError("extra_headers must be an object.");
  if (!request_options || typeof request_options !== "object" || Array.isArray(request_options)) throw new TypeError("request_options must be an object.");
  if (Object.keys(extra_headers).some((name) => name.toLowerCase() === "authorization")) throw new TypeError("Authorization must use an API-key source, not extra_headers.");
  const neutralSecretSelected = api_key_ref !== undefined || secret_registry !== undefined;
  if (neutralSecretSelected && (!api_key_ref || typeof secret_registry?.consume !== "function")) throw new TypeError("api_key_ref and secret_registry must be supplied together.");
  const legacySourceCount = Number(typeof api_key === "string" && api_key.length > 0) + Number(typeof api_key_env === "string" && api_key_env.length > 0);
  if ((neutralSecretSelected && legacySourceCount > 0) || legacySourceCount > 1) throw new TypeError("Exactly one API-key source may be configured.");
  const secretReference = neutralSecretSelected ? projectSecretReference(api_key_ref) : null;
  const secret = neutralSecretSelected
    ? {value: null, source: `secret-provider:${secretReference.provider_id}`}
    : resolveApiKey({api_key, api_key_env, env});

  return Object.freeze({
    kind: "openai-compatible",
    transport_id,
    async generate({prompt, run_id}) {
      const exactPrompt = requireText(prompt, "prompt");
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(new Error("MODEL_REQUEST_TIMEOUT")), timeout_ms);
      let response;
      let secretConsumption = null;
      const invoke = async (apiKey) => {
        const headers = {accept: "application/json", "content-type": "application/json", ...extra_headers};
        if (apiKey !== null) headers.authorization = `Bearer ${apiKey}`;
        response = await fetch_impl(endpoint, {
          method: "POST",
          headers,
          signal: controller.signal,
          body: JSON.stringify({
            ...request_options,
            model: modelId,
            messages: [{role: "user", content: exactPrompt}],
            stream: false
          })
        });
      };
      try {
        if (neutralSecretSelected) {
          const requestDigest = sha256(JSON.stringify({endpoint, model: modelId, prompt_sha256: sha256(exactPrompt), run_id: run_id ?? null}));
          secretConsumption = await secret_registry.consume({
            secret_ref: api_key_ref,
            consumer_id: secret_consumer_id,
            request_digest: requestDigest,
            consumer: async (material) => {
              await invoke(Buffer.from(material).toString("utf8"));
            }
          });
        } else {
          await invoke(secret.value);
        }
      } finally {
        clearTimeout(timer);
      }
      if (!response || typeof response.ok !== "boolean") throw new Error("MODEL_HTTP_RESPONSE_INVALID");
      if (!response.ok) throw new Error(`MODEL_HTTP_ERROR:${response.status ?? "unknown"}`);
      let payload;
      try {
        payload = await response.json();
      } catch {
        throw new Error("MODEL_RESPONSE_JSON_INVALID");
      }
      const finalBytes = responseText(payload);
      return Object.freeze({
        final_bytes: finalBytes,
        receipt: Object.freeze({
          schema_version: "are.model-turn-transport-receipt/v1",
          transport_kind: "openai-compatible",
          transport_id,
          run_id,
          endpoint,
          model: modelId,
          api_key_source: secret.source,
          ...(secretReference ? {secret_reference: secretReference, secret_consumption: secretConsumption} : {}),
          http_status: response.status ?? null,
          prompt_sha256: sha256(exactPrompt),
          final_bytes_sha256: sha256(finalBytes),
          live_model_invoked: true,
          authority_effect: "none"
        })
      });
    }
  });
}
