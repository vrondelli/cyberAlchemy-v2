import {randomUUID} from "node:crypto";

import {digestValue, freezeResult, isRecord, nonEmptyString} from "./canonical.mjs";

export const CONVERSATION_BINDING_SCHEMA = "are.conversation-binding/v1";
export const CONVERSATION_BINDING_EVENT_SCHEMA = "are.conversation-binding-event/v1";
const DIGEST = /^[0-9a-f]{64}$/u;
const HOST_KEYS = ["backend_adapter_id", "backend_thread_ref", "client_instance_ref",
  "creation_receipt_digest", "host_instance_ref", "principal_kind", "principal_ref",
  "workspace_ref", "writer_ref"];
const PROTECTED_STATES = new Set(["bound", "active", "draining"]);
const MAX_TTL_MS = 24 * 60 * 60 * 1000;

function exactKeys(value, keys) {
  return isRecord(value) && Object.keys(value).sort().join(",") === [...keys].sort().join(",");
}

function validHostAssertion(value) {
  return exactKeys(value, HOST_KEYS) && ["account", "local-host"].includes(value.principal_kind)
    && nonEmptyString(value.backend_adapter_id) && value.backend_adapter_id.length <= 256
    && HOST_KEYS.filter((key) => key !== "backend_adapter_id" && key !== "principal_kind")
      .every((key) => DIGEST.test(value[key] ?? ""));
}

function bindingKey(binding) {
  return `${binding.backend_adapter_id}:${binding.backend_thread_ref}`;
}

function validBindingRecord(binding) {
  return exactKeys(binding, ["schema_version", "binding_id", "conversation_id", "principal_kind", "principal_ref",
    "host_instance_ref", "client_instance_ref", "workspace_ref", "backend_adapter_id",
    "backend_thread_ref", "writer_ref", "creation_receipt_digest", "generation",
    "created_at_ms", "expires_at_ms", "status", "authority_effect"])
    && binding.schema_version === CONVERSATION_BINDING_SCHEMA && binding.authority_effect === "none"
    && nonEmptyString(binding.binding_id) && binding.binding_id.length <= 256
    && nonEmptyString(binding.conversation_id) && binding.conversation_id.length <= 256
    && Number.isSafeInteger(binding.generation) && binding.generation >= 1
    && binding.status === "bound"
    && Number.isSafeInteger(binding.created_at_ms) && Number.isSafeInteger(binding.expires_at_ms)
    && binding.expires_at_ms > binding.created_at_ms
    && binding.expires_at_ms - binding.created_at_ms <= MAX_TTL_MS
    && validHostAssertion(Object.fromEntries(HOST_KEYS.map((key) => [key, binding[key]])));
}

function eventDigest(event) {
  const {event_digest: _digest, ...material} = event;
  return digestValue(material);
}

function applyEvent(state, event) {
  if (!isRecord(event) || event.schema_version !== CONVERSATION_BINDING_EVENT_SCHEMA
    || event.sequence !== state.events.length + 1
    || event.previous_event_digest !== (state.events.at(-1)?.event_digest ?? null)
    || event.event_digest !== eventDigest(event)) throw new Error("binding.event-invalid");
  if (event.kind === "bound") {
    if (!exactKeys(event, ["schema_version", "sequence", "previous_event_digest", "event_digest", "kind", "binding"])) throw new Error("binding.event-shape-invalid");
    const binding = event.binding;
    if (!validBindingRecord(binding) || binding.generation !== 1) {
      throw new Error("binding.record-invalid");
    }
    if (state.bindings.has(binding.binding_id)
      || [...state.bindings.values()].some((item) => item.conversation_id === binding.conversation_id)
      || state.claimedThreads.has(bindingKey(binding))) {
      throw new Error("binding.writer-conflict");
    }
    state.bindings.set(binding.binding_id, freezeResult(binding));
    // Even a released native thread cannot be silently adopted by a new
    // writer. Existing-thread handover needs a separate release protocol.
    state.claimedThreads.add(bindingKey(binding));
  } else if (event.kind === "handed-over") {
    if (!exactKeys(event, ["schema_version", "sequence", "previous_event_digest", "event_digest",
      "kind", "prior_binding_id", "at_ms", "proof_digest", "binding"])) {
      throw new Error("binding.event-shape-invalid");
    }
    const prior = state.bindings.get(event.prior_binding_id);
    const binding = event.binding;
    if (!prior || prior.status !== "released" || !validBindingRecord(binding)
      || !DIGEST.test(event.proof_digest ?? "")
      || !Number.isSafeInteger(event.at_ms) || event.at_ms < prior.created_at_ms
      || binding.created_at_ms !== event.at_ms
      || binding.binding_id === prior.binding_id || state.bindings.has(binding.binding_id)
      || binding.conversation_id !== prior.conversation_id
      || binding.backend_adapter_id !== prior.backend_adapter_id
      || binding.backend_thread_ref !== prior.backend_thread_ref
      || binding.principal_kind !== prior.principal_kind
      || binding.principal_ref !== prior.principal_ref
      || binding.workspace_ref !== prior.workspace_ref
      || binding.writer_ref === prior.writer_ref
      || binding.generation !== prior.generation + 1
      || !state.claimedThreads.has(bindingKey(prior))
      || [...state.bindings.values()].some((item) => item.conversation_id === prior.conversation_id
        && item.binding_id !== prior.binding_id && item.generation >= binding.generation)) {
      throw new Error("binding.handover-invalid");
    }
    state.bindings.set(binding.binding_id, freezeResult(binding));
  } else {
    if (!exactKeys(event, ["schema_version", "sequence", "previous_event_digest", "event_digest", "kind", "binding_id", "at_ms", "proof_digest"])) throw new Error("binding.event-shape-invalid");
    const prior = state.bindings.get(event.binding_id);
    if (!prior || !Number.isSafeInteger(event.at_ms) || event.at_ms < prior.created_at_ms
      || (event.proof_digest !== null && !DIGEST.test(event.proof_digest ?? ""))) {
      throw new Error("binding.transition-invalid");
    }
    const next = event.kind === "activated" ? "active" : event.kind === "draining" ? "draining"
      : event.kind === "released" ? "released" : event.kind === "quarantined" ? "quarantined" : null;
    const allowed = (next === "active" && prior.status === "bound" && event.at_ms < prior.expires_at_ms && event.proof_digest === null)
      || (next === "draining" && prior.status === "active" && event.proof_digest === null)
      || (next === "released" && prior.status === "draining" && event.proof_digest !== null)
      || (next === "quarantined" && PROTECTED_STATES.has(prior.status) && event.proof_digest !== null);
    if (!allowed) throw new Error("binding.transition-invalid");
    state.bindings.set(event.binding_id, {...prior, status: next});
  }
  state.events.push(freezeResult(event));
}

/** Incremental validator for events read from a trusted owner journal. */
export function createConversationBindingEventReplay(initial_events = []) {
  if (!Array.isArray(initial_events)) throw new TypeError("binding.events-invalid");
  const state = {bindings: new Map(), claimedThreads: new Set(), events: []};
  for (const event of initial_events) applyEvent(state, event);
  return Object.freeze({
    appendEvent(event) { applyEvent(state, event); },
    events: () => freezeResult(state.events),
  });
}

/**
 * Candidate state contract only. A Host adapter must own both verifiers, and
 * a durable owner must persist/replay events before this may guard ingress.
 * Hash chaining detects accidental replay drift; it is not authentication.
 */
export function createConversationBindingContract({verify_host_context, verify_release,
  verify_release_current = null, verify_handover = null, verify_handover_current = null,
  initial_events = [], now = Date.now, persist_event = null, verify_current = null} = {}) {
  if (typeof verify_host_context !== "function" || typeof verify_release !== "function"
    || typeof now !== "function" || !Array.isArray(initial_events)
    || (verify_release_current !== null && typeof verify_release_current !== "function")
    || (verify_handover !== null && typeof verify_handover !== "function")
    || (verify_handover_current !== null && typeof verify_handover_current !== "function")
    || (persist_event !== null && typeof persist_event !== "function")
    || (verify_current !== null && typeof verify_current !== "function")) {
    throw new TypeError("binding.trusted-verifiers-required");
  }
  let state = {bindings: new Map(), claimedThreads: new Set(), events: []};
  let persistenceIndeterminate = false;
  for (const event of initial_events) applyEvent(state, event);

  function assertUsable() {
    if (persistenceIndeterminate) throw new Error("binding.persistence-indeterminate");
  }

  function append(kind, content) {
    assertUsable();
    const event = {schema_version: CONVERSATION_BINDING_EVENT_SCHEMA,
      sequence: state.events.length + 1, previous_event_digest: state.events.at(-1)?.event_digest ?? null,
      kind, ...content};
    event.event_digest = eventDigest(event);
    const next = {bindings: new Map(state.bindings), claimedThreads: new Set(state.claimedThreads),
      events: [...state.events]};
    applyEvent(next, event);
    if (persist_event !== null) {
      try {
        const persisted = persist_event(freezeResult(event));
        if (persisted?.ok !== true || persisted?.binding_event_digest !== event.event_digest
          || typeof persisted?.then === "function") throw new Error("binding.persist-failed");
      } catch {
        // A failed fsync may have appended bytes already. Do not authorize or
        // retry from this in-memory view; reopen/reconcile the owned journal.
        persistenceIndeterminate = true;
        throw new Error("binding.persistence-indeterminate");
      }
    }
    state = next;
    return event;
  }

  async function verifiedHost(hostContext) {
    const assertion = await verify_host_context(hostContext);
    if (!validHostAssertion(assertion)) throw new Error("binding.host-assertion-invalid");
    return assertion;
  }

  async function exactBinding(bindingId, hostContext) {
    const binding = state.bindings.get(bindingId);
    if (!binding) throw new Error("binding.unowned");
    const assertion = await verifiedHost(hostContext);
    if (HOST_KEYS.some((key) => assertion[key] !== binding[key])) throw new Error("binding.host-identity-mismatch");
    return binding;
  }

  return Object.freeze({
    async bindNewThread({host_context, ttl_ms}) {
      assertUsable();
      if (!Number.isSafeInteger(ttl_ms) || ttl_ms < 1 || ttl_ms > MAX_TTL_MS) throw new Error("binding.ttl-invalid");
      const assertion = await verifiedHost(host_context);
      const createdAt = now();
      if (!Number.isSafeInteger(createdAt) || createdAt < 0 || !Number.isSafeInteger(createdAt + ttl_ms)) throw new Error("binding.clock-invalid");
      const claimed = [...state.bindings.values()].find((item) => bindingKey(item)
        === `${assertion.backend_adapter_id}:${assertion.backend_thread_ref}`);
      if (claimed) {
        if (PROTECTED_STATES.has(claimed.status) && claimed.writer_ref !== assertion.writer_ref) {
          append("quarantined", {binding_id: claimed.binding_id, at_ms: createdAt,
            proof_digest: digestValue({reason: "binding.writer-conflict", conflicting_writer_ref: assertion.writer_ref})});
        }
        throw new Error("binding.writer-conflict");
      }
      const binding = {schema_version: CONVERSATION_BINDING_SCHEMA, binding_id: randomUUID(),
        conversation_id: randomUUID(),
        ...assertion, generation: 1, created_at_ms: createdAt,
        expires_at_ms: createdAt + ttl_ms, status: "bound", authority_effect: "none"};
      append("bound", {binding});
      return freezeResult(binding);
    },
    async handoverReleasedThread({prior_binding_id, host_context, handover_context, ttl_ms}) {
      assertUsable();
      if (verify_handover === null || !Number.isSafeInteger(ttl_ms)
        || ttl_ms < 1 || ttl_ms > MAX_TTL_MS) throw new Error("binding.handover-unavailable");
      const prior = state.bindings.get(prior_binding_id);
      if (!prior || prior.status !== "released") throw new Error("binding.handover-prior-not-released");
      const assertion = await verifiedHost(host_context);
      if (assertion.backend_adapter_id !== prior.backend_adapter_id
        || assertion.backend_thread_ref !== prior.backend_thread_ref
        || assertion.principal_kind !== prior.principal_kind
        || assertion.principal_ref !== prior.principal_ref
        || assertion.workspace_ref !== prior.workspace_ref
        || assertion.writer_ref === prior.writer_ref) {
        throw new Error("binding.handover-identity-mismatch");
      }
      const proof = await verify_handover(handover_context, prior, assertion);
      if (!exactKeys(proof, ["backend_thread_ref", "previous_writer_ref", "next_writer_ref",
        "outcome_reconciled", "proof_digest"])
        || proof.backend_thread_ref !== prior.backend_thread_ref
        || proof.previous_writer_ref !== prior.writer_ref
        || proof.next_writer_ref !== assertion.writer_ref
        || proof.outcome_reconciled !== true || !DIGEST.test(proof.proof_digest ?? "")) {
        throw new Error("binding.handover-unverified");
      }
      if (verify_handover_current !== null
        && verify_handover_current(handover_context, prior, assertion, proof) !== true) {
        throw new Error("binding.handover-stale");
      }
      const createdAt = now();
      if (!Number.isSafeInteger(createdAt) || createdAt < prior.created_at_ms
        || !Number.isSafeInteger(createdAt + ttl_ms)) throw new Error("binding.clock-invalid");
      const next = {schema_version: CONVERSATION_BINDING_SCHEMA, binding_id: randomUUID(),
        conversation_id: prior.conversation_id, ...assertion,
        generation: prior.generation + 1, created_at_ms: createdAt,
        expires_at_ms: createdAt + ttl_ms, status: "bound", authority_effect: "none"};
      append("handed-over", {prior_binding_id, at_ms: createdAt,
        proof_digest: proof.proof_digest, binding: next});
      return freezeResult(next);
    },
    async activate({binding_id, host_context}) {
      assertUsable();
      const binding = await exactBinding(binding_id, host_context);
      append("activated", {binding_id, at_ms: now(), proof_digest: null});
      return freezeResult({...binding, status: "active"});
    },
    async authorizeTurn({binding_id, host_context, generation = 1}) {
      assertUsable();
      const binding = await exactBinding(binding_id, host_context);
      if (verify_current !== null && verify_current(state.events.at(-1)?.event_digest ?? null,
        state.events.length) !== true) throw new Error("binding.store-drift");
      if (generation !== binding.generation) throw new Error("binding.generation-mismatch");
      if (binding.status !== "active") throw new Error("binding.not-active");
      if (now() >= binding.expires_at_ms) throw new Error("binding.expired");
      return freezeResult({ok: true, binding_id, backend_thread_ref: binding.backend_thread_ref,
        writer_ref: binding.writer_ref, authority_effect: "none"});
    },
    async drain({binding_id, host_context}) {
      assertUsable();
      await exactBinding(binding_id, host_context);
      append("draining", {binding_id, at_ms: now(), proof_digest: null});
      return freezeResult({ok: true, binding_id, status: "draining", authority_effect: "none"});
    },
    async quarantine({binding_id, host_context, reason_code}) {
      assertUsable();
      if (!nonEmptyString(reason_code) || reason_code.length > 256) {
        throw new Error("binding.quarantine-reason-invalid");
      }
      const binding = await exactBinding(binding_id, host_context);
      if (!PROTECTED_STATES.has(binding.status)) {
        throw new Error("binding.quarantine-state-invalid");
      }
      append("quarantined", {binding_id, at_ms: now(),
        proof_digest: digestValue({binding_id, reason_code, writer_ref: binding.writer_ref})});
      return freezeResult({ok: true, binding_id, status: "quarantined", authority_effect: "none"});
    },
    async release({binding_id, host_context, release_context}) {
      assertUsable();
      const binding = await exactBinding(binding_id, host_context);
      if (binding.status !== "draining") throw new Error("binding.release-before-drain");
      const proof = await verify_release(release_context, binding);
      if (!exactKeys(proof, ["backend_thread_ref", "writer_ref", "outcome_reconciled", "proof_digest"])
        || proof.backend_thread_ref !== binding.backend_thread_ref || proof.writer_ref !== binding.writer_ref
        || proof.outcome_reconciled !== true || !DIGEST.test(proof.proof_digest ?? "")) {
        throw new Error("binding.release-unverified");
      }
      // The asynchronous verifier may have yielded while the owner journal
      // advanced. This check must be synchronous and adjacent to persistence.
      if (verify_release_current !== null
        && verify_release_current(release_context, binding, proof) !== true) {
        throw new Error("binding.release-stale");
      }
      append("released", {binding_id, at_ms: now(), proof_digest: proof.proof_digest});
      return freezeResult({ok: true, binding_id, status: "released", authority_effect: "none"});
    },
    get(bindingId) {
      const binding = state.bindings.get(bindingId);
      return binding ? freezeResult(binding) : null;
    },
    events() { return freezeResult(state.events); },
  });
}

/**
 * Candidate same-writer projection over the existing fsynced gateway journal.
 * It does not supply a Host identity verifier or connect to live dispatch.
 */
export function createGatewayBackedConversationBindingContract({session_store, consumer_id,
  verify_host_context, verify_release, verify_release_current = null,
  verify_handover = null, verify_handover_current = null, now = Date.now} = {}) {
  if (!nonEmptyString(consumer_id) || typeof session_store?.append !== "function"
    || typeof session_store?.getSession !== "function"
    || typeof session_store?.inspect !== "function"
    || !session_store.inspect()?.durability?.startsWith("append-only-file-fsync")) {
    throw new TypeError("binding.durable-gateway-store-required");
  }
  const session = session_store.getSession(consumer_id);
  if (session?.status !== "active" || !Array.isArray(session.conversation_binding_events)) {
    throw new Error("binding.gateway-session-not-active");
  }
  const current = (head, count) => {
    const stored = session_store.getSession(consumer_id);
    const events = stored?.conversation_binding_events;
    return stored?.status === "active" && Array.isArray(events)
      && events.length === count && (events.at(-1)?.event_digest ?? null) === head;
  };
  return createConversationBindingContract({verify_host_context, verify_release,
    verify_release_current, verify_handover, verify_handover_current,
    initial_events: session.conversation_binding_events, now,
    verify_current: current,
    persist_event(event) {
      if (!current(event.previous_event_digest, event.sequence - 1)) {
        return {ok: false};
      }
      const result = session_store.append({event_kind: "conversation-binding-event",
        consumer_id, content: {binding_event: event}});
      return {ok: result.ok, binding_event_digest: result.ok ? event.event_digest : null};
    },
  });
}
