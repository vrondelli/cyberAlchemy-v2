import {createHash} from "node:crypto";

export {createOpenAICompatibleModelTransport} from "./openai-compatible-transport.mjs";
export {createEnvironmentSecretProvider, createInjectedSecretProvider, createSecretProviderRegistry, createSecretReference, projectSecretReference} from "./secret-provider.mjs";
export {createSopsAgeProcessSecretProvider} from "./sops-age-secret-provider.mjs";
export {createNativeSdkModelTransport, createOpenAINativeModelTransport, createAnthropicNativeModelTransport, createGoogleNativeModelTransport} from "./native-provider-transports.mjs";

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function requireFinalBytes(value) {
  if (typeof value !== "string" || value.length === 0) throw new TypeError("Model transport must return non-empty final_bytes.");
  return value;
}

export function createScriptedModelTransport({final_bytes, transport_id = "scripted-model"}) {
  const captured = requireFinalBytes(final_bytes);
  return Object.freeze({
    kind: "scripted",
    transport_id,
    async generate({prompt}) {
      return Object.freeze({
        final_bytes: captured,
        receipt: Object.freeze({
          schema_version: "are.model-turn-transport-receipt/v1",
          transport_kind: "scripted",
          transport_id,
          prompt_sha256: sha256(prompt),
          final_bytes_sha256: sha256(captured),
          live_model_invoked: false,
          authority_effect: "none"
        })
      });
    }
  });
}

export function createCodexAppServerModelTransport({client, thread_id, transport_id = "codex-app-server", turn_options = {}, request_key_prefix = null, on_before_turn = null, on_turn_completed = null}) {
  if (!client || typeof client.runTurn !== "function") throw new TypeError("A Codex App Server RPC client with runTurn is required.");
  if (typeof thread_id !== "string" || thread_id.length === 0) throw new TypeError("thread_id is required.");
  if (request_key_prefix !== null && (typeof request_key_prefix !== "string" || !request_key_prefix || request_key_prefix.length > 240)) {
    throw new TypeError("request_key_prefix must be a non-empty string of at most 240 characters.");
  }
  let turnOrdinal = 0;
  return Object.freeze({
    kind: "codex-app-server",
    transport_id,
    async generate({prompt, run_id}) {
      turnOrdinal += 1;
      const requestKey = request_key_prefix ? `${request_key_prefix}:${turnOrdinal}` : null;
      const turnIdentity = Object.freeze({thread_id, request_key: requestKey, prompt_sha256: sha256(prompt)});
      if (on_before_turn) await on_before_turn(turnIdentity);
      const turn = await client.runTurn({
        threadId: thread_id,
        input: [{type: "text", text: prompt}],
        ...turn_options,
        approvalPolicy: "on-request",
        sandboxPolicy: {type: "readOnly", networkAccess: false}
      }, requestKey ? {idempotency_key: requestKey} : {});
      const status = turn?.completed?.turn?.status ?? null;
      if (status !== null && status !== "completed") throw new Error(`MODEL_TURN_NOT_COMPLETED:${status}`);
      const finalBytes = requireFinalBytes(turn?.text);
      const turnId = turn?.started?.turn?.id ?? turn?.completed?.turn?.id ?? null;
      if (on_turn_completed) {
        if (status !== "completed" || typeof turnId !== "string" || !turnId) throw new Error("MODEL_TURN_COMPLETION_UNVERIFIED");
        await on_turn_completed(Object.freeze({...turnIdentity, turn_id: turnId}));
      }
      return Object.freeze({
        final_bytes: finalBytes,
        receipt: Object.freeze({
          schema_version: "are.model-turn-transport-receipt/v1",
          transport_kind: "codex-app-server",
          transport_id,
          run_id,
          thread_id,
          turn_id: turnId,
          turn_status: status,
          prompt_sha256: sha256(prompt),
          final_bytes_sha256: sha256(finalBytes),
          live_model_invoked: true,
          authority_effect: "none"
        })
      });
    }
  });
}
