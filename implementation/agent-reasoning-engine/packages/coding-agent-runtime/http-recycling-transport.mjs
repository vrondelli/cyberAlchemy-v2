import {createHash} from "node:crypto";
import {request as httpRequest} from "node:http";
import {request as httpsRequest} from "node:https";
import {createStatelessRecyclingTransport} from "./context-recycling.mjs";
import {projectSecretReference} from "./secret-provider.mjs";

const hash = (text) => createHash("sha256").update(text).digest("hex");
const integer = (v) => Number.isSafeInteger(v) && v >= 0;
const need = (ok, reason) => { if (!ok) throw new Error(`http-recycling.${reason}`); };

// Exactly one POST. Node's request API does not follow redirects; agent:false
// prevents reuse/recovery of stale pooled connections. The deadline includes
// response headers and the complete body, including stalled body delivery.
function postOnce(url, body, {timeout_ms, maximum_response_bytes, apiKey, signal}) {
  return new Promise((resolve, reject) => {
    let settled = false;
    let response;
    let request;
    const finish = (error, result) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      signal.removeEventListener("abort", aborted);
      if (error) { response?.destroy(); request?.destroy(); reject(error); }
      else resolve(result);
    };
    const fail = (code) => finish(new Error(`http-recycling.${code}`));
    const aborted = () => fail("request-cancelled");
    const timer = setTimeout(() => fail("deadline-exceeded"), timeout_ms);
    signal.addEventListener("abort", aborted, {once: true});
    if (signal.aborted) return aborted();
    const headers = {"content-type": "application/json", accept: "application/json", "content-length": Buffer.byteLength(body)};
    if (apiKey !== null) headers.authorization = `Bearer ${apiKey}`;
    try {
      request = (url.protocol === "https:" ? httpsRequest : httpRequest)(url, {method: "POST", agent: false, headers}, (incoming) => {
        response = incoming;
        incoming.on("error", () => fail("response-interrupted"));
        incoming.on("aborted", () => fail("response-interrupted"));
        if (incoming.statusCode !== 200) return fail(`status-${incoming.statusCode}`);
        if (!/^application\/json(?:;|$)/i.test(incoming.headers["content-type"] ?? "")) return fail("content-type-invalid");
        if (incoming.headers["content-encoding"] && incoming.headers["content-encoding"] !== "identity") return fail("encoding-unsupported");
        const declared = incoming.headers["content-length"];
        if (declared !== undefined && (!/^\d+$/.test(declared) || Number(declared) > maximum_response_bytes)) return fail("response-too-large");
        let size = 0;
        const chunks = [];
        incoming.on("data", (chunk) => {
          size += chunk.length;
          if (size > maximum_response_bytes) return fail("response-too-large");
          if (!settled) chunks.push(chunk);
        });
        incoming.on("end", () => {
          if (settled) return;
          try {
            const text = new TextDecoder("utf-8", {fatal: true}).decode(Buffer.concat(chunks));
            finish(null, {payload: JSON.parse(text), bytes: size});
          } catch { fail("response-json-invalid"); }
        });
      });
      request.on("error", () => fail("request-failed"));
      request.end(body);
    } catch { fail("request-failed"); }
  });
}

/** Text-only chat-completions wire contract. Token counting remains an explicit
 * provider/model-specific dependency; no guessed tokenizer default is supplied.
 * The callback must include server-side message framing, not just JSON bytes. */
export function createHttpRecyclingTransport({endpoint, model, measurement_ref, measure_input_tokens,
  maximum_output_tokens, timeout_ms = 30000, maximum_request_bytes = 1048576,
  maximum_response_bytes = 1048576, api_key_ref, secret_registry} = {}) {
  let url;
  try { url = new URL(endpoint); } catch { throw new Error("http-recycling.endpoint-invalid"); }
  need(!url.username && !url.password && !url.search && !url.hash, "endpoint-credentials-or-query-forbidden");
  need(url.protocol === "https:" || (url.protocol === "http:" && ["127.0.0.1", "[::1]"].includes(url.hostname)), "https-or-literal-loopback-required");
  need(typeof model === "string" && model.length > 0, "model-required");
  need(typeof measurement_ref === "string" && measurement_ref.length > 0 && typeof measure_input_tokens === "function", "measurement-required");
  for (const v of [maximum_output_tokens, timeout_ms, maximum_request_bytes, maximum_response_bytes]) need(integer(v) && v > 0, "limits-invalid");
  need(timeout_ms <= 2147483647, "timeout-overflow");
  const authenticated = api_key_ref !== undefined || secret_registry !== undefined;
  need(!authenticated || (api_key_ref && typeof secret_registry?.consume === "function"), "secret-binding-incomplete");
  const secretReference = authenticated ? projectSecretReference(api_key_ref) : null;
  const identity = hash(JSON.stringify({version: 1, endpoint: url.href, model, measurement_ref,
    maximum_output_tokens, timeout_ms, maximum_request_bytes, maximum_response_bytes, secretReference}));
  const bodyFor = (prompt) => {
    const body = JSON.stringify({model, messages: [{role: "user", content: prompt}], max_completion_tokens: maximum_output_tokens, stream: false});
    need(Buffer.byteLength(body) <= maximum_request_bytes, "request-too-large");
    return body;
  };
  const measure = (body) => {
    const count = measure_input_tokens(Object.freeze({serialized_body: body, model}));
    need(integer(count), "input-bound-unknown");
    return count;
  };
  return createStatelessRecyclingTransport({adapter_id: `http:${identity}`, source_ref: `http-recycling-transport/v1:${identity}`, maximum_output_tokens,
    measure_request: ({prompt}) => measure(bodyFor(prompt)),
    async request_once({prompt, run_id, dispatch}) {
      const body = bodyFor(prompt);
      need(measure(body) === dispatch.input_upper_bound, "measurement-drift");
      let response;
      let sent = false;
      let active = true;
      const cancellation = new AbortController();
      const invoke = async (apiKey) => {
        need(active && !sent, "duplicate-or-late-credential-dispatch");
        sent = true;
        response = await postOnce(url, body, {timeout_ms, maximum_response_bytes, apiKey, signal: cancellation.signal});
      };
      try {
        if (authenticated) {
          try {
            await secret_registry.consume({secret_ref: api_key_ref, consumer_id: "http-recycling-transport", request_digest: hash(body),
              consumer: (material) => {
                const pending = invoke(Buffer.from(material).toString("utf8"));
                // A broken credential provider may neglect to await its callback.
                // Keep that rejection handled; the missing response still fails closed.
                pending.catch(() => {});
                return pending;
              }});
          } catch { throw new Error("http-recycling.secret-or-request-failed"); }
        } else await invoke(null);
      } finally { active = false; cancellation.abort(); }
      need(response, "response-missing");
      const {payload, bytes} = response;
      need(payload?.model === model, "response-model-mismatch");
      need(Array.isArray(payload.choices) && payload.choices.length === 1, "response-choice-invalid");
      const choice = payload.choices[0];
      need(choice.finish_reason === "stop" && !choice.message?.tool_calls && !choice.message?.function_call, "response-incomplete-or-tools-forbidden");
      const final_bytes = choice.message?.content;
      need(typeof final_bytes === "string" && final_bytes.length > 0, "response-text-required");
      const usage = payload.usage;
      need(integer(usage?.prompt_tokens) && usage.prompt_tokens <= dispatch.input_upper_bound, "input-bound-violated");
      need(integer(usage?.completion_tokens) && usage.completion_tokens <= maximum_output_tokens, "output-bound-violated");
      return {final_bytes, receipt: {schema_version: "are.model-turn-transport-receipt/v1", transport_kind: "bounded-stateless-http",
        adapter_id: identity, run_id, model, request_body_sha256: hash(body), response_bytes: bytes,
        input_tokens: usage.prompt_tokens, output_tokens: usage.completion_tokens, measurement_ref,
        request_count: 1, automatic_retries: 0, redirects_followed: 0, authority_effect: "none"}};
    }});
}
