import {canonicalJson, digestValue, freezeResult, isRecord, nonEmptyString}
  from "../../codex-app-server-wrapper/src/canonical.mjs";
import {createConversationBindingContract}
  from "../../codex-app-server-wrapper/src/conversation-binding-contract.mjs";

const BINDING_KEYS = ["consumer_id", "binding_id", "generation", "writer_ref", "session_id"].sort().join(',');
const KEYS = ["consumer_id", "binding_id", "generation", "writer_ref", "session_id", "request_id", "content"].sort().join(',');

/** Internal gateway-process boundary, never a browser identity verifier.
 * The caller must be the private Host IPC owner. Only the gateway's journal
 * supplies conversation/principal/workspace identity; hashes are not auth.
 * This read-only join neither admits a prompt nor authorizes model dispatch.
 */
export function createDshOwnedBindingReader({session_store, backend_adapter_id,
  now = Date.now, expected_workspace_ref = null}) {
  if (typeof session_store?.getSession !== "function"
    || typeof session_store?.hasFaultedSession !== "function"
    || !nonEmptyString(backend_adapter_id) || typeof now !== "function"
    || expected_workspace_ref !== null && !/^[0-9a-f]{64}$/u.test(expected_workspace_ref)) {
    throw new TypeError("dsh-web.objective-owned-journal-required");
  }
  return function readBinding(input) {
    if (!isRecord(input) || Object.keys(input).sort().join(",") !== BINDING_KEYS
      || !["consumer_id", "binding_id", "writer_ref", "session_id"]
        .every(key => nonEmptyString(input[key]) && input[key] === input[key].trim()
          && Buffer.byteLength(input[key]) <= 256)
      || !Number.isSafeInteger(input.generation) || input.generation < 1) {
      throw new Error("dsh-web.objective-input-invalid");
    }
    if (session_store.hasFaultedSession(input.consumer_id)) {
      throw new Error("dsh-web.objective-journal-faulted");
    }
    const session = session_store.getSession(input.consumer_id);
    if (session?.status !== "active" || session.backend_adapter_id !== backend_adapter_id
      || !Array.isArray(session.conversation_binding_events)) {
      throw new Error("dsh-web.objective-session-not-active");
    }
    // Replay the entire closed event chain rather than trusting a caller's
    // binding object or a latest-event status label.
    const recovered = createConversationBindingContract({
      verify_host_context: () => null, verify_release: () => null,
      initial_events: session.conversation_binding_events});
    const binding = recovered.get(input.binding_id);
    const thread = digestValue({adapter: backend_adapter_id, session_id: input.session_id});
    const timestamp = now();
    if (!Number.isSafeInteger(timestamp) || !binding || binding.status !== "active"
      || binding.principal_kind !== "local-host" || binding.backend_adapter_id !== backend_adapter_id
      || binding.backend_thread_ref !== thread || binding.writer_ref !== input.writer_ref
      || binding.generation !== input.generation || timestamp < binding.created_at_ms
      || expected_workspace_ref !== null && binding.workspace_ref !== expected_workspace_ref
      || timestamp >= binding.expires_at_ms
      || !session.thread_refs?.includes(`backend-thread:${thread}`)) {
      throw new Error("dsh-web.objective-binding-not-current");
    }
    const consumer = `dsh-host:${digestValue([backend_adapter_id,
      binding.principal_ref, binding.workspace_ref])}`;
    return freezeResult({
      identity: {
        consumer_ref: consumer,
        scope_ref: canonicalJson([consumer, binding.conversation_id]),
        thread_ref: `backend-thread:${thread}`,
        conversation_id: binding.conversation_id,
      },
      binding_evidence: {
        consumer_id: input.consumer_id, binding_id: binding.binding_id,
        generation: binding.generation, writer_ref: binding.writer_ref,
        binding_head_digest: recovered.events().at(-1).event_digest,
        authority_effect: "none",
      },
    });
  };
}

/** Prompt normalization composes the same read-only identity join, never a synthetic request. */
export function createDshOwnedObjectiveNormalizer(configuration) {
  const readBinding = createDshOwnedBindingReader(configuration);
  return function normalize(input) {
    if (!isRecord(input) || Object.keys(input).sort().join(',') !== KEYS
      || !nonEmptyString(input.request_id) || input.request_id !== input.request_id.trim()
      || Buffer.byteLength(input.request_id) > 256
      || !Array.isArray(input.content) || input.content.length < 1 || input.content.length > 64
      || input.content.some(part => !isRecord(part) || Object.keys(part).sort().join(',') !== 'text,type'
        || part.type !== 'text' || typeof part.text !== 'string')
      || Buffer.byteLength(JSON.stringify(input.content)) > 256 * 1024
      || input.content.every(part => part.text.trim() === '')) throw new Error('dsh-web.objective-input-invalid');
    const {content, request_id, ...bindingInput} = input;
    const joined = readBinding(bindingInput);
    const {conversation_id, ...identity} = joined.identity;
    return freezeResult({objective_request: {...identity,
      request_ref: `dsh-objective:${canonicalJson([conversation_id, request_id])}`,
      request: content.map(part => part.text).join('\n')}, binding_evidence: joined.binding_evidence});
  };
}
