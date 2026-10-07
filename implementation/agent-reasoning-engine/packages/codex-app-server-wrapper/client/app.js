import {clearPendingTurn, migratePendingTurnStorage, preparePendingTurn, reconcileTurnReceipt} from "./pending-turn.js";
import {adoptPendingSteer, clearPendingSteer, preparePendingSteer} from "./pending-steer.js";
import {clearPendingThread, preparePendingThread, readPendingThread} from "./pending-thread.js";
import {adoptPendingFeedbackReview, clearPendingFeedback, markFeedbackPendingReview, preparePendingFeedback, readPendingFeedback} from "./pending-feedback.js";
import {readVerifiedRuntime} from "./runtime-verification.js";
import {prepareRequirementEntry} from "./requirements-entry.js";
import {requirementPostureView} from "./requirement-posture.js";

const token = new URLSearchParams(location.hash.slice(1)).get("token");
const state = {threadId: null, turnId: null, runtime: "uncertain", streamConnected: false, lastSequence: 0, pending: null,
  runtimeRevision: 0,
  pendingSteer: null, checkingSteer: false, steerNotice: null,
  pendingThread: null, creatingThread: false,
  pendingFeedback: null, feedbackNotice: null, feedbackAvailable: false, lastResult: null, recoveryConfirmationRequired: false, repeatConfirmation: null,
  revisionLessons: new Map(), revisionThreadId: null,
  transportFailure: null, turnExecutionBlockedReason: null, hookRelay: null, approvals: new Map(), userInputs: new Map(), elicitations: new Map(), agentNodes: new Map(), messageNodes: new Map()};
state.rejoinBlockedReason = null;
state.rejoinRequired = false;
const elements = Object.fromEntries(["status", "transport-note", "turn-execution-note", "mode-note", "hook-relay-note", "cwd", "start-thread", "pending-thread-note", "pending-steer-note", "steer", "check-steer", "feedback-note", "find-feedback", "pending-feedback-list", "feedback-review-fields", "review-quote", "review-instruction", "load-lessons", "review-lesson", "review-lesson-note", "forget-thread", "resume-id", "resume-thread", "resume-recovery-note", "thread-label", "recovery-mode", "history-note", "accepted-turn-note", "pending-turn-note", "approvals", "user-inputs", "elicitations", "messages", "composer", "prompt", "requirement-seed-options", "requirement-posture-note", "requirements", "requirements-confirm", "send", "save-feedback", "discard-feedback", "dismiss-feedback", "apply-feedback", "interrupt", "diagnostics"].map((id) => [id, document.getElementById(id)]));

const REJOIN_REFUSALS = Object.freeze({
  "windows-client.reasoning-recovery-unverified": "ARE cannot verify this thread's latest accepted turn against a matching terminal Reasoning State after restart. Rejoin was refused; no turn was resent or marked complete. Keep the private recovery state for reconciliation.",
  "windows-client.zero-turn-rejoin-unverified": "ARE has no accepted turn receipt for this recovered thread, but cannot verify its first-turn state after restart. Rejoin and Send remain blocked; no turn was resent or marked complete. Keep the private recovery state. If you do not need to recover this thread, use New thread to continue in a separate ARE thread; this does not delete the old one.",
  "windows-client.pending-turn-recovery-required": "An earlier turn still has a recovery obligation. Rejoin was refused and no turn was resent. Use Check recovery if it is offered; otherwise keep the private recovery state for review.",
  "windows-client.hosted-effect-resume-rebind-unverified": "ARE cannot verify this thread's original workspace and effect binding. Rejoin was refused. Keep the private recovery state; do not bypass this stop through another client.",
  "windows-client.rejoin-preflight-unavailable": "ARE could not check this thread's rejoin evidence. Rejoin readiness is unknown; no turn was resent or marked complete. Keep the private recovery state and retry the check after the connection is restored.",
});
const STEER_PREDISPATCH_REFUSALS = new Set([
  "windows-client.hook-boundary-unverified", "windows-client.recovery-confirmation-required",
  "windows-client.pending-turn-recovery-required", "windows-client.pending-steer-recovery-required",
  "windows-client.thread-not-loaded",
  "windows-client.hosted-effect-resume-rebind-unverified", "windows-client.steer-turn-not-accepted",
  "windows-client.turn-start-pending", "windows-client.turn-not-current",
  "windows-client.restricted-mcp-catalog-unavailable",
]);

function showRejoinRefusal(reason) {
  const message = Object.hasOwn(REJOIN_REFUSALS, reason) ? REJOIN_REFUSALS[reason] : "";
  elements["resume-recovery-note"].textContent = message;
  elements["resume-recovery-note"].hidden = !message;
  return Boolean(message);
}

async function checkLoadedThreadRejoin() {
  if (!state.threadId) return;
  if (!elements["resume-id"].value.trim()) elements["resume-id"].value = state.threadId;
  try {
    const preflight = await api(`/api/threads/${encodeURIComponent(state.threadId)}/rejoin-check`);
    state.rejoinBlockedReason = null;
    state.rejoinRequired = preflight.requires_resume === true;
    showRejoinRefusal(null);
    if (state.rejoinRequired) {
      elements["resume-recovery-note"].textContent = "This owned thread passed the read-only recovery check but has not been rejoined in this host session. Rejoin it before sending; this check does not activate another desktop task.";
      elements["resume-recovery-note"].hidden = false;
      setStatus("Rejoin required before work");
    }
  } catch (error) {
    state.rejoinBlockedReason = Object.hasOwn(REJOIN_REFUSALS, error.reason)
      ? error.reason : "windows-client.rejoin-preflight-unavailable";
    state.rejoinRequired = true;
    showRejoinRefusal(state.rejoinBlockedReason);
    setStatus("Rejoin paused — recovery verification required");
  }
  updateComposer();
}

function renderHookRelay() {
  const note = elements["hook-relay-note"];
  note.hidden = state.hookRelay?.required !== true;
  if (note.hidden) return;
  const check = state.hookRelay.last_check;
  if (!check || check.thread_id !== state.threadId) {
    note.textContent = "MCP hook relay check is enabled. No pre-turn catalog check has been recorded for this thread yet.";
    return;
  }
  const time = Number.isSafeInteger(check.checked_at_unix_ms)
    ? new Date(check.checked_at_unix_ms).toLocaleTimeString() : "an unknown time";
  note.textContent = check.status === "listed"
    ? `Required MCP hook tool was listed at ${time}. This is a pre-turn snapshot, not continuous availability or complete tool coverage.`
    : `MCP hook relay was not ready at ${time}; no turn was started by that attempt. Check the relay before retrying. This is not a diagnosis of every host tool path.`;
}

async function refreshHookRelay() {
  const snapshot = await api("/api/state");
  state.hookRelay = snapshot.hook_relay ?? null;
  renderHookRelay();
}

function resetRevisionSelection() {
  state.revisionLessons.clear();
  state.revisionThreadId = null;
  elements["review-lesson"].replaceChildren(new Option("New instruction (no revision)", ""));
  elements["review-lesson-note"].textContent = "To correct an existing instruction, load and select it. ARE will require proof it was used in the answer being corrected.";
}

function requestKey(prefix) {
  return `${prefix}:${crypto.randomUUID()}`;
}

async function api(path, options = {}) {
  if (!token) throw new Error("Missing launch token. Open the exact URL printed by the host.");
  const response = await fetch(path, {
    ...options,
    headers: {authorization: `Bearer ${token}`, "content-type": "application/json", ...(options.headers ?? {})},
  });
  const result = await response.json();
  if (!response.ok || result.ok === false) {
    const error = new Error(result.detail ?? result.reason ?? `HTTP ${response.status}`);
    error.reason = result.reason;
    error.value = result.value;
    throw error;
  }
  return result.value ?? result;
}

function setStatus(text, ready = false) {
  elements.status.textContent = text;
  elements.status.className = `status ${ready ? "online" : "offline"}`;
}

function showTransportFailure(failure) {
  const code = typeof failure?.code === "string" && /^gateway\.[a-z0-9.-]{1,96}$/.test(failure.code)
    ? failure.code : "gateway.connection-lost";
  const faulted = code === "gateway.session-faulted"
    && /^[0-9a-f]{64}$/.test(failure?.fault_digest ?? "")
    && ["gateway.turn-marker-history-conflict", "gateway.turn-history-status-conflict",
      "gateway.turn-completion-status-conflict", "gateway.compaction-history-conflict",
      "gateway.compaction-item-history-conflict"].includes(failure?.fault_reason_code);
  state.transportFailure = {code, ...(faulted ? {faultDigest: failure.fault_digest,
    faultReasonCode: failure.fault_reason_code} : {})};
  state.streamConnected = false;
  state.runtime = "uncertain";
  state.approvals.clear();
  state.userInputs.clear();
  state.elicitations.clear();
  renderApprovals();
  renderUserInputs();
  renderElicitations();
  elements["transport-note"].hidden = false;
  elements["transport-note"].textContent = faulted
    ? `ARE stopped this client because host history contradicted its durable receipt (${failure.fault_reason_code}). Fault reference: ${failure.fault_digest}. New sends, approvals, and recovery checks are paused. Keep the private recovery state; restarting alone will not clear this fault, and no turn has been retried.`
    : code === "gateway.history-audit-incomplete"
      ? "ARE stopped this client because a host-history check did not finish durably. New sends, approvals, and recovery checks are paused. Keep the private recovery state for review; restarting alone will not clear the quarantine, and no turn has been retried."
    : `ARE gateway connection stopped (${code}). New sends, approvals, and recovery checks are paused. Preserve the private recovery state and diagnose the connection before restarting; this screen has not retried any turn.`;
  setStatus("Gateway stopped");
  updateComposer();
}

async function checkPendingSteerOutcome() {
  const pending = state.pendingSteer;
  if (!pending || state.checkingSteer || state.transportFailure) return;
  state.checkingSteer = true;
  state.steerNotice = "Checking the exact steer key; no guidance is being resent.";
  updateComposer();
  try {
    const result = await api("/api/turns/steer/status", {method: "POST", body: JSON.stringify({
      threadId: pending.thread_id, expectedTurnId: pending.turn_id, requestKey: pending.request_key})});
    if (state.pendingSteer?.request_key !== pending.request_key) return;
    if (result.schema_version !== "are.gateway-steer-outcome/v1" || result.authority_effect !== "none"
      || !["unrecorded", "pending", "settled-accepted", "rejected", "host-accepted-unreconciled",
        "outcome-unknown", "unverified"].includes(result.disposition)) throw new Error("Steer status is incompatible.");
    if (result.disposition === "settled-accepted" || result.disposition === "rejected") {
      await api("/api/turns/steer/ack", {method: "POST", body: JSON.stringify({
        threadId: pending.thread_id, expectedTurnId: pending.turn_id, requestKey: pending.request_key})});
      clearPendingSteer(sessionStorage, pending);
      state.pendingSteer = null;
      state.steerNotice = result.disposition === "settled-accepted"
        ? "ARE confirmed this guidance was accepted for the named turn. It did not start another turn."
        : "ARE confirmed this guidance was rejected. No steer was accepted.";
    } else {
      const labels = {unrecorded: "No durable gateway receipt is visible yet",
        pending: "Gateway receipt is pending", "host-accepted-unreconciled": "Host accepted, ARE reconciliation incomplete",
        "outcome-unknown": "Delivery outcome unknown", unverified: "Steer outcome unverified"};
      state.steerNotice = `${labels[result.disposition]}. New sends and steers stay blocked; check this exact key again. Nothing is resent automatically.`;
    }
    return result.disposition;
  } catch (error) {
    if (state.pendingSteer?.request_key === pending.request_key) {
      state.steerNotice = `Steer outcome could not be verified (${error.message}). Keep this key; no guidance was resent.`;
    }
  } finally { state.checkingSteer = false; updateComposer(); }
}

function updateComposer() {
  const reviewableFeedback = state.pendingFeedback?.schema_version === "are.codex-client-pending-feedback-review/v1";
  const receiptRecovery = state.pending?.schema_version === "are.codex-client-pending-turn/v2"
    || state.recoveryConfirmationRequired;
  elements.send.disabled = Boolean(state.transportFailure || state.rejoinRequired || state.rejoinBlockedReason || state.pendingThread || state.pendingSteer
    || (state.turnExecutionBlockedReason && !receiptRecovery)) || !state.threadId || !state.streamConnected || (!receiptRecovery && state.runtime !== "idle")
    || Boolean(state.pending && state.pending.thread_id !== state.threadId)
    || Boolean(state.pendingFeedback && !reviewableFeedback);
  elements["save-feedback"].disabled = Boolean(state.transportFailure || state.rejoinRequired || state.rejoinBlockedReason || state.pendingSteer) || !state.feedbackAvailable || !state.threadId || !state.streamConnected || state.runtime !== "idle"
    || Boolean(state.pending || state.pendingThread || state.recoveryConfirmationRequired)
    || Boolean(state.pendingFeedback);
  elements["save-feedback"].textContent = state.pendingFeedback && !reviewableFeedback ? "Retry exact feedback" : "Save feedback only";
  elements["discard-feedback"].hidden = !state.pendingFeedback;
  elements["discard-feedback"].textContent = reviewableFeedback ? "Forget pending review" : "Forget feedback retry";
  elements["dismiss-feedback"].hidden = !reviewableFeedback;
  elements["dismiss-feedback"].disabled = !reviewableFeedback || Boolean(state.transportFailure)
    || state.pendingFeedback.thread_id !== state.threadId || !state.streamConnected || state.runtime !== "idle"
    || Boolean(state.pending || state.pendingSteer || state.pendingThread || state.recoveryConfirmationRequired);
  elements["feedback-review-fields"].hidden = !reviewableFeedback;
  elements["apply-feedback"].hidden = !reviewableFeedback;
  elements["apply-feedback"].disabled = elements["dismiss-feedback"].disabled || !state.feedbackAvailable;
  elements["find-feedback"].disabled = Boolean(state.transportFailure) || !state.threadId
    || Boolean(state.pendingFeedback);
  elements["feedback-note"].textContent = state.pendingFeedback
    ? state.pendingFeedback.thread_id !== state.threadId
      ? reviewableFeedback
        ? "Pending review belongs to another or unavailable thread. Rejoin it to review or dismiss the feedback, or explicitly forget this local review key. No feedback text was stored."
        : "Pending feedback belongs to another or unavailable thread. Rejoin that thread to retry, or explicitly forget the retry. No feedback text was stored."
      : reviewableFeedback
        ? "Feedback is pending review in ARE; no lesson was applied. Re-enter the exact text to apply a later-answer instruction or dismiss it. One-time and task-only notes cannot be applied as that instruction; use Send. No feedback text was stored."
        : "Feedback delivery is uncertain. Re-enter the exact text and retry with the same ID, or explicitly forget this retry. No feedback text was stored."
    : state.feedbackNotice ?? (state.feedbackAvailable
      ? "Feedback-only currently recognizes three exact last-answer preferences: “too verbose → keep responses concise,” “too technical → use plain language,” or “too brief → explain in more detail,” each phrased “Your last answer was … From now on, …”. Other feedback gets a pending receipt, not an applied lesson. Use Send for a one-time or task-specific request."
      : "Feedback-only submission is unavailable in this ARE profile. You can still look for an earlier pending review on an owned thread.");
  elements.send.textContent = receiptRecovery ? "Check recovery" : state.repeatConfirmation ? "Confirm new turn"
    : state.pending ? "Recover send" : "Send";
  elements["start-thread"].disabled = Boolean(state.transportFailure || state.pending || state.pendingSteer || state.recoveryConfirmationRequired || state.creatingThread);
  elements["start-thread"].textContent = state.pendingThread ? "Retry exact thread creation" : "New thread";
  elements["forget-thread"].hidden = !state.pendingThread;
  elements["forget-thread"].disabled = state.creatingThread;
  elements["pending-thread-note"].textContent = state.pendingThread
    ? "Thread creation may have reached the host. Keep the same workspace and retry with its saved request ID; a changed workspace is blocked. If ARE reports an unknown outcome, another retry cannot resolve it without exact host evidence. Forgetting may leave a created thread undisplayed; it does not delete it."
    : "";
  elements["resume-thread"].disabled = Boolean(state.transportFailure || state.pendingThread || state.pendingSteer);
  elements["pending-turn-note"].textContent = state.pending
    ? state.repeatConfirmation
      ? "The same message was already accepted. Review the history, then select Confirm new turn only if you intend to send it again."
      : receiptRecovery
        ? "ARE will check verified host history for this send. No message text or redispatch is needed."
      : "A prior send has no confirmed acknowledgement. Rejoin its thread if needed, then re-enter the exact message and Recover send. ARE reuses its request key. No message text was stored."
    : state.recoveryConfirmationRequired ? "A verified turn was recovered; gateway confirmation is still required." : "";
  elements["accepted-turn-note"].textContent = state.lastResult?.thread_id === state.threadId
    ? `${state.lastResult.schema_version === "are.codex-client-recovered-turn/v1" ? "Recovered from verified host history" : "Last accepted send"}: turn ${state.lastResult.turn_id}. Recent history is shown above. Sending identical text again requires confirmation.`
    : "";
  elements["pending-steer-note"].textContent = state.pendingSteer
    ? state.steerNotice ?? "A steer key is saved for this exact turn. Check its outcome; no guidance will be resent automatically."
    : state.steerNotice ?? "";
  elements["check-steer"].hidden = !state.pendingSteer;
  elements["check-steer"].disabled = !state.pendingSteer || state.checkingSteer || Boolean(state.transportFailure);
  elements.steer.disabled = Boolean(state.transportFailure || state.rejoinRequired || state.rejoinBlockedReason
    || state.pending || state.pendingSteer || state.pendingThread || state.pendingFeedback
    || state.recoveryConfirmationRequired || state.turnExecutionBlockedReason || state.checkingSteer)
    || !state.threadId || !state.streamConnected || state.runtime !== "active" || !state.turnId;
  elements.interrupt.disabled = Boolean(state.transportFailure || state.rejoinRequired || state.rejoinBlockedReason
    || state.pendingSteer) || !state.streamConnected || state.runtime !== "active" || !state.turnId;
}

async function reconcileRuntime(threadId = state.threadId, {completedTurnId = null} = {}) {
  if (state.transportFailure) return;
  const revision = ++state.runtimeRevision;
  if (!threadId) { state.runtime = "uncertain"; updateComposer(); return; }
  state.runtime = "uncertain";
  updateComposer();
  try {
    const runtime = await readVerifiedRuntime(async () => {
      const observed = await api(`/api/threads/${encodeURIComponent(threadId)}/runtime`);
      if (completedTurnId && observed.disposition === "active" && observed.turn_id === completedTurnId) {
        const stale = new Error("Host turn state has not caught up with native completion.");
        stale.reason = "windows-client.history-unavailable";
        throw stale;
      }
      return observed;
    });
    if (state.threadId !== threadId || state.runtimeRevision !== revision) return;
    state.runtime = runtime.disposition;
    state.turnId = runtime.disposition === "active" ? runtime.turn_id : null;
    const label = state.rejoinBlockedReason ? "Rejoin paused — recovery verification required"
      : state.rejoinRequired ? "Rejoin required before work"
      : state.pending && state.pending.thread_id !== threadId ? "Earlier send belongs to another thread"
      : state.pending && runtime.disposition === "idle" ? "Send outcome uncertain — recover the prior send"
      : runtime.disposition === "idle" ? "Ready"
      : runtime.disposition === "active" ? "Working"
      : runtime.host_status === "notLoaded" ? "Rejoin this thread to verify its state"
      : "Turn state uncertain";
    setStatus(label, !state.rejoinRequired && !state.rejoinBlockedReason && runtime.disposition !== "uncertain");
  } catch (error) {
    if (state.threadId === threadId && state.runtimeRevision === revision) setStatus(
      error.reason === "windows-client.history-unavailable" ? "Waiting for verified turn history"
        : `Turn state uncertain: ${error.message}`);
  }
  updateComposer();
}

function diagnostic(value) {
  elements.diagnostics.textContent = `${JSON.stringify(value, null, 2)}\n${elements.diagnostics.textContent}`.slice(0, 24000);
}

function message(role, text, id = crypto.randomUUID()) {
  let node = state.messageNodes.get(id);
  if (!node) {
    node = document.createElement("article");
    node.className = `message ${role}`;
    const label = document.createElement("span");
    label.textContent = role === "user" ? "You" : "ARE";
    const body = document.createElement("div");
    body.className = "message-body";
    node.append(label, body);
    elements.messages.append(node);
    state.messageNodes.set(id, node);
  }
  node.querySelector(".message-body").textContent = text;
  elements.messages.scrollTop = elements.messages.scrollHeight;
  return node;
}

function clearConversation() {
  state.messageNodes.clear();
  state.agentNodes.clear();
  state.turnId = null;
  state.runtime = "uncertain";
  updateComposer();
  elements.messages.replaceChildren();
}

async function hydrateHistory(threadId) {
  if (!threadId) return;
  elements["history-note"].textContent = "Loading recent stored messages…";
  try {
    const history = await api(`/api/threads/${encodeURIComponent(threadId)}/history`);
    if (state.threadId !== threadId) return;
    for (const entry of history.messages) message(entry.role, entry.text, entry.id);
    elements["history-note"].textContent = history.truncated
      ? "Showing a bounded recent history. Older or long messages may be omitted."
      : history.messages.length ? "Recent stored messages" : "No stored messages yet.";
  } catch (error) {
    if (state.threadId === threadId) elements["history-note"].textContent = `Stored history unavailable: ${error.message}`;
  }
}

function renderApprovals() {
  elements.approvals.replaceChildren();
  for (const approval of state.approvals.values()) {
    const card = document.createElement("article");
    card.className = "approval card";
    const title = document.createElement("strong");
    title.textContent = approval.method.split("/").at(-2) ?? "Approval";
    const detail = document.createElement("pre");
    detail.textContent = JSON.stringify(approval.params, null, 2);
    const actions = document.createElement("div");
    actions.className = "row end";
    const decline = document.createElement("button");
    decline.className = "secondary";
    decline.textContent = "Decline";
    decline.onclick = () => decideApproval(approval.request_id, "decline");
    actions.append(decline);
    if (approval.method !== "item/permissions/requestApproval") {
      const accept = document.createElement("button");
      accept.textContent = "Accept once";
      accept.onclick = () => decideApproval(approval.request_id, "accept");
      actions.append(accept);
    }
    card.append(title, detail, actions);
    elements.approvals.append(card);
  }
}

async function decideApproval(id, decision) {
  try {
    await api(`/api/approvals/${encodeURIComponent(id)}`, {method: "POST", body: JSON.stringify({decision})});
    state.approvals.delete(id);
    renderApprovals();
  } catch (error) { setStatus(error.message); }
}

function renderUserInputs() {
  elements["user-inputs"].replaceChildren();
  for (const [promptIndex, prompt] of [...state.userInputs.values()].entries()) {
    const form = document.createElement("form");
    form.className = "approval card user-input";
    const title = document.createElement("strong");
    title.textContent = "ARE needs your input";
    form.append(title);
    const controls = [];
    for (const question of prompt.questions) {
      const field = document.createElement("div");
      field.className = "user-input-question";
      const controlId = `are-user-input-${promptIndex}-${controls.length}`;
      const header = document.createElement("strong");
      header.textContent = question.header;
      const label = document.createElement("label");
      label.textContent = question.question;
      label.htmlFor = controlId;
      field.append(header, label);
      let selected = null;
      let freeText = null;
      if (question.options?.length) {
        selected = document.createElement("select");
        selected.id = controlId;
        selected.required = true;
        const placeholder = document.createElement("option");
        placeholder.value = "";
        placeholder.textContent = "Choose an answer";
        selected.append(placeholder);
        for (const [index, option] of question.options.entries()) {
          const choice = document.createElement("option");
          choice.value = String(index);
          choice.textContent = option.description ? `${option.label} — ${option.description}` : option.label;
          selected.append(choice);
        }
        if (question.isOther) {
          const other = document.createElement("option");
          other.value = "__are_other__";
          other.textContent = "Other…";
          selected.append(other);
        }
        field.append(selected);
      }
      if (!selected || question.isOther) {
        freeText = document.createElement("input");
        if (selected) freeText.setAttribute("aria-label", `${question.question} — other answer`);
        else freeText.id = controlId;
        freeText.type = question.isSecret ? "password" : "text";
        freeText.autocomplete = question.isSecret ? "off" : "on";
        freeText.maxLength = 4096;
        freeText.placeholder = selected ? "Your answer when Other is selected" : "Your answer";
        freeText.required = !selected;
        if (selected) {
          freeText.disabled = true;
          selected.addEventListener("change", () => {
            freeText.disabled = selected.value !== "__are_other__";
            freeText.required = !freeText.disabled;
          });
        }
        field.append(freeText);
      }
      controls.push({question, selected, freeText});
      form.append(field);
    }
    const actions = document.createElement("div");
    actions.className = "row end";
    const submit = document.createElement("button");
    submit.type = "submit";
    submit.textContent = "Send answers";
    actions.append(submit);
    form.append(actions);
    form.onsubmit = async (event) => {
      event.preventDefault();
      const answers = Object.create(null);
      for (const {question, selected, freeText} of controls) {
        const answer = selected?.value === "__are_other__" || !selected ? freeText.value.trim() : question.options[Number(selected.value)].label;
        if (!answer) return setStatus("Answer every question before sending.");
        answers[question.id] = {answers: [answer]};
      }
      submit.disabled = true;
      try {
        await api(`/api/user-input/${encodeURIComponent(prompt.request_id)}`, {method: "POST", body: JSON.stringify({answers})});
        state.userInputs.delete(prompt.request_id);
        renderUserInputs();
      } catch (error) {
        setStatus(error.message);
        submit.disabled = false;
      }
    };
    elements["user-inputs"].append(form);
  }
}

function renderElicitations() {
  elements.elicitations.replaceChildren();
  for (const [promptIndex, prompt] of [...state.elicitations.values()].entries()) {
    const form = document.createElement("form");
    form.className = "approval card elicitation";
    const title = document.createElement("strong");
    title.textContent = `Input requested by ${prompt.server_name}`;
    const scope = document.createElement("p");
    scope.className = "muted";
    scope.textContent = `ARE task ${prompt.thread_id}${prompt.turn_id ? ` · turn ${prompt.turn_id}` : ""}`;
    const message = document.createElement("p");
    message.textContent = prompt.message;
    form.append(title, scope, message);
    const controls = [];
    for (const [fieldIndex, field] of prompt.fields.entries()) {
      const holder = document.createElement("div");
      holder.className = "elicitation-field";
      const controlId = `are-elicitation-${promptIndex}-${fieldIndex}`;
      let control;
      if (field.kind === "multi-choice") {
        const group = document.createElement("fieldset");
        const legend = document.createElement("legend");
        legend.textContent = field.label;
        group.append(legend);
        const checkboxes = field.options.map((option) => {
          const label = document.createElement("label");
          const checkbox = document.createElement("input");
          checkbox.type = "checkbox";
          label.append(checkbox, document.createTextNode(option.label));
          group.append(label);
          return {checkbox, value: option.value};
        });
        holder.append(group);
        control = {field, checkboxes};
      } else {
        const label = document.createElement("label");
        label.htmlFor = controlId;
        label.textContent = field.label;
        let input;
        if (field.kind === "choice" || field.kind === "boolean") {
          input = document.createElement("select");
          const placeholder = document.createElement("option");
          placeholder.value = "";
          placeholder.textContent = field.required ? "Choose an answer" : "Leave unanswered";
          input.append(placeholder);
          const choices = field.kind === "boolean" ? [{value: "true", label: "Yes"}, {value: "false", label: "No"}] : field.options;
          for (const [index, option] of choices.entries()) {
            const item = document.createElement("option");
            item.value = String(index);
            item.textContent = option.label;
            input.append(item);
          }
        } else {
          input = document.createElement("input");
          input.type = field.kind === "integer" || field.kind === "number" ? "number"
            : field.format === "email" ? "email" : field.format === "uri" ? "url"
              : field.format === "date" ? "date" : "text";
          if (field.kind === "integer" || field.kind === "number") input.step = field.kind === "integer" ? "1" : "any";
          if (field.min !== null && field.min !== undefined) input.min = String(field.min);
          if (field.max !== null && field.max !== undefined) {
            if (field.kind === "string") input.maxLength = field.max;
            else input.max = String(field.max);
          }
          if (field.kind === "string" && field.min) input.minLength = field.min;
          if (field.format === "date-time") input.placeholder = "YYYY-MM-DDTHH:MM:SSZ";
        }
        input.id = controlId;
        input.required = field.required;
        holder.append(label, input);
        control = {field, input};
      }
      if (field.description) {
        const description = document.createElement("p");
        description.className = "muted";
        description.textContent = field.description;
        holder.append(description);
      }
      form.append(holder);
      controls.push(control);
    }
    const actions = document.createElement("div");
    actions.className = "row end";
    const decline = document.createElement("button");
    decline.type = "button";
    decline.className = "secondary";
    decline.textContent = "Decline";
    const cancel = document.createElement("button");
    cancel.type = "button";
    cancel.className = "secondary";
    cancel.textContent = "Cancel";
    const accept = document.createElement("button");
    accept.type = "submit";
    accept.textContent = "Send to server";
    actions.append(decline, cancel, accept);
    form.append(actions);
    const respond = async (action, content = null) => {
      decline.disabled = cancel.disabled = accept.disabled = true;
      try {
        await api(`/api/elicitations/${encodeURIComponent(prompt.request_id)}`, {
          method: "POST", body: JSON.stringify({action, content}),
        });
        state.elicitations.delete(prompt.request_id);
        renderElicitations();
      } catch (error) {
        setStatus(error.message);
        decline.disabled = cancel.disabled = accept.disabled = false;
      }
    };
    decline.onclick = () => respond("decline");
    cancel.onclick = () => respond("cancel");
    form.onsubmit = (event) => {
      event.preventDefault();
      const content = Object.create(null);
      for (const {field, input, checkboxes} of controls) {
        if (checkboxes) {
          const selected = checkboxes.filter(({checkbox}) => checkbox.checked).map(({value}) => value);
          if (selected.length || field.required) content[field.name] = selected;
        } else if (input.value !== "") {
          content[field.name] = field.kind === "boolean" ? input.value === "0"
            : field.kind === "choice" ? field.options[Number(input.value)].value
              : field.kind === "integer" || field.kind === "number" ? Number(input.value) : input.value;
        } else if (field.required) return setStatus(`Answer ${field.label} before sending.`);
      }
      respond("accept", content);
    };
    elements.elicitations.append(form);
  }
}

function consume(event) {
  state.lastSequence = event.sequence;
  const payload = event.payload ?? {};
  if (event.kind === "transport-failure") {
    showTransportFailure(payload);
    return diagnostic(event);
  }
  if (state.transportFailure) return diagnostic(event);
  if (event.kind === "approval-requested" && payload.approval) {
    state.approvals.set(payload.approval.request_id, payload.approval);
    renderApprovals();
  }
  if (["approval-resolved", "approval-expired", "approval-aborted"].includes(event.kind)) {
    const id = payload.request_id ?? payload.approval?.request_id;
    if (id) state.approvals.delete(id);
    renderApprovals();
  }
  if (event.kind === "user-input-requested" && payload.user_input) {
    state.userInputs.set(payload.user_input.request_id, payload.user_input);
    renderUserInputs();
  }
  if (["user-input-answered", "user-input-expired", "user-input-aborted"].includes(event.kind)) {
    if (payload.request_id) state.userInputs.delete(payload.request_id);
    renderUserInputs();
  }
  if (event.kind === "elicitation-requested" && payload.request_id) {
    api("/api/state").then((snapshot) => {
      const pending = snapshot.pending_elicitations?.find((item) => item.request_id === payload.request_id);
      if (!state.transportFailure && pending) {
        state.elicitations.set(pending.request_id, pending);
        renderElicitations();
      }
    }).catch((error) => setStatus(error.message));
  }
  if (["elicitation-answered", "elicitation-expired", "elicitation-aborted"].includes(event.kind)) {
    if (payload.request_id) state.elicitations.delete(payload.request_id);
    renderElicitations();
  }
  if (event.kind !== "app-server-notification") return diagnostic(event);
  const notification = payload;
  if (notification.params?.threadId && notification.params.threadId !== state.threadId) return;
  if (notification.method === "turn/started") {
    state.runtimeRevision += 1;
    state.turnId = notification.params?.turn?.id ?? state.turnId;
    state.runtime = "active";
    updateComposer();
    setStatus("Working", true);
  }
  if (notification.method === "item/agentMessage/delta") {
    const itemId = notification.params?.itemId ?? notification.params?.turnId ?? "agent-stream";
    const prior = state.agentNodes.get(itemId) ?? "";
    const next = `${prior}${notification.params?.delta ?? ""}`;
    state.agentNodes.set(itemId, next);
    message("agent", next, itemId);
  }
  if (notification.method === "item/completed" && notification.params?.item?.type === "agentMessage") {
    const item = notification.params.item;
    message("agent", item.text ?? "", item.id ?? notification.params?.turnId ?? "agent-complete");
  }
  if (notification.method === "turn/completed") {
    const turn = notification.params?.turn;
    for (const item of turn?.items ?? []) if (item?.type === "agentMessage" && typeof item.text === "string") message("agent", item.text, item.id ?? turn.id);
    state.turnId = null;
    state.runtimeRevision += 1;
    state.runtime = "uncertain";
    updateComposer();
    setStatus("Verifying turn history");
    void reconcileRuntime(state.threadId, {completedTurnId: turn?.id ?? null});
  }
  diagnostic(notification);
}

async function stream() {
  const response = await fetch(`/api/events?after=${state.lastSequence}`, {headers: {authorization: `Bearer ${token}`}});
  if (!response.ok || !response.body) throw new Error(`Event stream failed: HTTP ${response.status}`);
  state.streamConnected = true;
  if (!state.transportFailure) await reconcileRuntime();
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  while (true) {
    const {value, done} = await reader.read();
    if (done) throw new Error("Event stream closed");
    buffer += decoder.decode(value, {stream: true});
    let boundary;
    while ((boundary = buffer.indexOf("\n\n")) >= 0) {
      const frame = buffer.slice(0, boundary);
      buffer = buffer.slice(boundary + 2);
      const data = frame.split("\n").find((line) => line.startsWith("data: "))?.slice(6);
      if (data) consume(JSON.parse(data));
    }
  }
}

async function keepStreaming() {
  while (true) {
    try {
      const snapshot = await api("/api/state");
      const priorPending = state.pending;
      const receipt = reconcileTurnReceipt(sessionStorage, snapshot.pending_turn,
        snapshot.accepted_turn_results ?? snapshot.last_turn_result);
      state.pending = receipt.pending;
      state.lastResult = receipt.accepted;
      state.recoveryConfirmationRequired = snapshot.recovery_confirmation_required === true;
      if (snapshot.transport_failure) showTransportFailure(snapshot.transport_failure);
      state.feedbackAvailable = snapshot.feedback_available === true;
      if (receipt.acknowledged) state.repeatConfirmation = null;
      if (state.pending && !snapshot.thread_ids.includes(state.pending.thread_id)) throw new Error("Pending turn is not owned by this client.");
      if (state.pending && state.pending.thread_id !== state.threadId) {
        state.threadId = state.pending.thread_id;
        elements["pending-feedback-list"].replaceChildren();
        sessionStorage.setItem("are.activeThread", state.threadId);
        elements["thread-label"].textContent = state.threadId;
        if (!state.transportFailure) await checkLoadedThreadRejoin();
        if (!state.transportFailure) await hydrateHistory(state.threadId);
      }
      if (state.pending !== priorPending || receipt.accepted) updateComposer();
      if (snapshot.last_event_sequence < state.lastSequence) state.lastSequence = 0;
      await stream();
    } catch (error) {
      state.streamConnected = false;
      state.runtime = "uncertain";
      updateComposer();
      if (!state.transportFailure) setStatus(`Connection uncertain: ${error.message}`);
      await new Promise((resolve) => setTimeout(resolve, 1500));
    }
  }
}

async function load() {
  migratePendingTurnStorage(localStorage, sessionStorage);
  const snapshot = await api("/api/state");
  elements.cwd.value = snapshot.default_cwd;
  state.pendingThread = readPendingThread(localStorage);
  const savedThread = sessionStorage.getItem("are.activeThread");
  state.threadId = snapshot.thread_ids.includes(savedThread) ? savedThread : snapshot.thread_ids.at(-1) ?? null;
  state.hookRelay = snapshot.hook_relay ?? null;
  renderHookRelay();
  const receipt = reconcileTurnReceipt(sessionStorage, snapshot.pending_turn,
    snapshot.accepted_turn_results ?? snapshot.last_turn_result);
  state.pending = receipt.pending;
  state.pendingSteer = adoptPendingSteer(sessionStorage, snapshot.pending_steer);
  state.pendingFeedback = readPendingFeedback(localStorage);
  state.lastResult = receipt.accepted;
  state.recoveryConfirmationRequired = snapshot.recovery_confirmation_required === true;
  state.turnExecutionBlockedReason = snapshot.turn_execution?.enabled === false
    && snapshot.turn_execution.reason_code === "windows-client.hook-boundary-unverified"
    ? snapshot.turn_execution.reason_code : null;
  const requirementPosture = requirementPostureView(snapshot.requirement_tracking);
  elements["requirement-posture-note"].textContent = requirementPosture.text;
  elements["requirement-seed-options"].open = requirementPosture.open;
  elements["turn-execution-note"].hidden = !state.turnExecutionBlockedReason;
  elements["turn-execution-note"].textContent = state.turnExecutionBlockedReason
    ? "New turns are paused on this Windows host: tool hooks did not deliver their input, and read-only sandboxing does not assess every tool call. Existing threads remain available for observation; no fallback execution is enabled."
    : "";
  const guardedPlan = snapshot.collaboration_mode === "plan-with-guarded-user-input";
  elements["mode-note"].hidden = !guardedPlan;
  elements["mode-note"].textContent = guardedPlan
    ? "Plan mode is active for this hosted session. ARE can ask a question here; the model wire allows only request_user_input. This does not control your current desktop task."
    : "";
  if (snapshot.transport_failure) showTransportFailure(snapshot.transport_failure);
  state.feedbackAvailable = snapshot.feedback_available === true;
  if (state.pending) {
    if (!snapshot.thread_ids.includes(state.pending.thread_id)) throw new Error("Pending turn is not owned by this client.");
    state.threadId = state.pending.thread_id;
  }
  if (state.pendingFeedback) {
    if (snapshot.thread_ids.includes(state.pendingFeedback.thread_id)) state.threadId = state.pendingFeedback.thread_id;
  }
  clearConversation();
  elements["thread-label"].textContent = state.threadId ?? "No thread loaded.";
  elements["recovery-mode"].textContent = snapshot.recovery_mode === "private-file"
    ? "Recovery: private client state enabled. Existing desktop tasks remain outside this client."
    : snapshot.recovery_mode === "private-file-stopped"
      ? "Recovery: private client state retained but unavailable while this gateway session is faulted. No thread was resumed."
      : "Recovery: this client is process-only. Its loaded threads are not restored after restart.";
  updateComposer();
  for (const approval of snapshot.pending_approvals) state.approvals.set(approval.request_id, approval);
  renderApprovals();
  for (const prompt of snapshot.pending_user_inputs ?? []) state.userInputs.set(prompt.request_id, prompt);
  renderUserInputs();
  for (const prompt of snapshot.pending_elicitations ?? []) state.elicitations.set(prompt.request_id, prompt);
  renderElicitations();
  if (state.threadId && !state.transportFailure) await checkLoadedThreadRejoin();
  if (state.threadId && !state.transportFailure) await hydrateHistory(state.threadId);
  if (state.pendingSteer && !state.transportFailure) await checkPendingSteerOutcome();
  if (state.threadId && !state.transportFailure && !state.rejoinRequired && !state.rejoinBlockedReason) {
    setStatus("Checking turn state…");
    await reconcileRuntime(state.threadId);
  }
  keepStreaming();
}

elements["start-thread"].onclick = async () => {
  if (state.creatingThread || state.pendingSteer) return;
  state.creatingThread = true;
  updateComposer();
  try {
    if (state.pending) throw new Error("Recover the earlier send before creating another thread.");
    const prepared = await preparePendingThread(localStorage, elements.cwd.value);
    state.pendingThread = prepared.entry;
    updateComposer();
    const result = await api("/api/threads", {method: "POST", body: JSON.stringify({cwd: elements.cwd.value, requestKey: prepared.entry.request_key})});
    clearPendingThread(localStorage, prepared.entry);
    state.pendingThread = null;
    showRejoinRefusal(null);
    state.rejoinBlockedReason = null;
    state.rejoinRequired = false;
    state.threadId = result.thread.id;
    renderHookRelay();
    resetRevisionSelection();
    elements["pending-feedback-list"].replaceChildren();
    state.repeatConfirmation = null;
    clearConversation();
    sessionStorage.setItem("are.activeThread", state.threadId);
    elements["thread-label"].textContent = state.threadId;
    elements["history-note"].textContent = "No stored messages yet.";
    await reconcileRuntime(state.threadId);
  } catch (error) {
    setStatus(error.reason === "windows-client.thread-creation-outcome-unknown"
      ? "Thread creation outcome unknown. ARE has stopped new mutations in this gateway session; keep the retry record for verified recovery."
      : `Thread creation uncertain: ${error.message}`);
  }
  finally { state.creatingThread = false; updateComposer(); }
};

elements["forget-thread"].onclick = () => {
  if (!state.pendingThread || !confirm("Forget this retry? The host may already have created a thread. This does not delete that thread.")) return;
  try {
    clearPendingThread(localStorage, state.pendingThread);
    state.pendingThread = null;
    updateComposer();
    setStatus("Thread-creation retry forgotten; any host-created thread remains untouched.");
  } catch (error) { setStatus(error.message); }
};

elements["resume-thread"].onclick = async () => {
  if (state.pendingSteer) return;
  try {
    const threadId = elements["resume-id"].value.trim();
    const result = await api("/api/threads/resume", {method: "POST", body: JSON.stringify({threadId, requestKey: requestKey("resume")})});
    showRejoinRefusal(null);
    state.rejoinBlockedReason = null;
    state.rejoinRequired = false;
    state.threadId = result.thread.id ?? threadId;
    renderHookRelay();
    resetRevisionSelection();
    elements["pending-feedback-list"].replaceChildren();
    state.repeatConfirmation = null;
    clearConversation();
    sessionStorage.setItem("are.activeThread", state.threadId);
    elements["thread-label"].textContent = state.threadId;
    await hydrateHistory(state.threadId);
    await reconcileRuntime(state.threadId);
  } catch (error) {
    setStatus(showRejoinRefusal(error.reason) ? "Rejoin paused — recovery verification required" : error.message);
  }
};

elements["resume-id"].addEventListener("input", () => showRejoinRefusal(null));

elements["check-steer"].onclick = () => { void checkPendingSteerOutcome(); };

elements.steer.onclick = async () => {
  const text = elements.prompt.value.trim();
  if (!text || !state.threadId || !state.turnId || !state.streamConnected || state.runtime !== "active"
    || state.transportFailure || state.rejoinRequired || state.rejoinBlockedReason || state.pending
    || state.pendingSteer || state.pendingThread || state.pendingFeedback
    || state.recoveryConfirmationRequired || state.turnExecutionBlockedReason) return;
  let entry = null;
  try {
    entry = await preparePendingSteer(sessionStorage, state.threadId, state.turnId, text);
    state.pendingSteer = entry;
    state.steerNotice = "Steer key saved. Waiting for ARE's exact-turn acknowledgement; no retry will be sent automatically.";
    updateComposer();
    const result = await api("/api/turns/steer", {method: "POST", body: JSON.stringify({
      threadId: entry.thread_id, expectedTurnId: entry.turn_id, text, requestKey: entry.request_key})});
    if (result.turnId !== entry.turn_id) throw new Error("Steer acknowledgement did not match the named turn.");
    // A successful HTTP response is not the durability boundary: it may be
    // lost before the browser receives it. Resolve and acknowledge the exact
    // gateway key before clearing either the tab or host checkpoint.
    const disposition = await checkPendingSteerOutcome();
    if (disposition === "settled-accepted" && !state.pendingSteer) {
      elements.prompt.value = "";
      setStatus("Steer accepted for active turn", true);
    } else if (disposition === "rejected" && !state.pendingSteer) {
      setStatus("Steer rejected for active turn");
    } else setStatus("Steer outcome awaits exact confirmation");
  } catch (error) {
    if (entry && state.pendingSteer?.request_key === entry.request_key) {
      if (STEER_PREDISPATCH_REFUSALS.has(error.reason)) {
        clearPendingSteer(sessionStorage, entry);
        state.pendingSteer = null;
        state.steerNotice = `ARE refused this steer before gateway dispatch (${error.reason}). No guidance was sent.`;
      } else await checkPendingSteerOutcome();
    }
    if (state.pendingSteer) setStatus(`Steer outcome unresolved: ${error.message}`);
    else if (entry) setStatus(state.steerNotice ?? "Steer outcome verified");
    else setStatus(error.message);
  }
  updateComposer();
};

elements.composer.onsubmit = async (event) => {
  event.preventDefault();
  if (state.pending?.schema_version === "are.codex-client-pending-turn/v2" || state.recoveryConfirmationRequired) {
    try {
      await api("/api/turns/recover", {method: "POST", body: "{}"});
      const snapshot = await api("/api/state");
      const receipt = reconcileTurnReceipt(sessionStorage, snapshot.pending_turn,
        snapshot.accepted_turn_results ?? snapshot.last_turn_result);
      state.pending = receipt.pending;
      state.lastResult = receipt.accepted;
      state.recoveryConfirmationRequired = snapshot.recovery_confirmation_required === true;
      if (state.threadId) await hydrateHistory(state.threadId);
      await reconcileRuntime(state.threadId);
    } catch (error) { setStatus(`Recovery remains unverified: ${error.message}`); }
    updateComposer();
    return;
  }
  const text = elements.prompt.value.trim();
  if (!text || !state.threadId || !state.streamConnected || state.runtime !== "idle" || state.pendingSteer
    || (state.pendingFeedback && state.pendingFeedback.schema_version !== "are.codex-client-pending-feedback-review/v1")) return;
  const requirementEntry = prepareRequirementEntry(elements.requirements.value,
    elements["requirements-confirm"].checked);
  if (!requirementEntry.ok && requirementEntry.reason === "confirmation-required") {
    setStatus("Review and confirm the explicit requirement list before sending.");
    return;
  }
  if (!requirementEntry.ok) {
    setStatus("Requirements must be unique, at most 64 lines, and within the size limit.");
    return;
  }
  let prepared = null;
  try {
    prepared = await preparePendingTurn(sessionStorage, state.threadId, text);
    state.pending = prepared.entry;
    state.runtime = "uncertain";
    updateComposer();
    const result = await api("/api/turns", {method: "POST", body: JSON.stringify({threadId: state.threadId, text,
      ...(requirementEntry.requirements !== undefined ? {requirements: requirementEntry.requirements} : {}),
      requestKey: prepared.entry.request_key, ...(state.repeatConfirmation ? {confirmRepeatOfTurnId: state.repeatConfirmation} : {})})});
    clearPendingTurn(sessionStorage, prepared.entry);
    state.pending = null;
    state.repeatConfirmation = null;
    state.lastResult = {schema_version: "are.codex-client-accepted-turn/v1", thread_id: state.threadId,
      request_key: prepared.entry.request_key, text_digest: prepared.entry.text_digest,
      turn_id: result.turn.id, accepted_at: new Date().toISOString()};
    if (prepared.recovered || result.recovered_from_receipt) await hydrateHistory(state.threadId);
    else message("user", text);
    elements.prompt.value = "";
    elements.requirements.value = "";
    elements["requirements-confirm"].checked = false;
    state.turnId = result.turn?.id ?? state.turnId;
    await refreshHookRelay().catch(() => {});
    await reconcileRuntime(state.threadId);
  } catch (error) {
    if (error.reason === "windows-client.mcp-hook-relay-unavailable" && prepared?.entry
      && state.pending?.request_key === prepared.entry.request_key) {
      clearPendingTurn(sessionStorage, prepared.entry);
      state.pending = null;
      await refreshHookRelay().catch(() => {});
      await reconcileRuntime(state.threadId);
      setStatus("Send not started: the required MCP hook relay tool was not ready at the pre-turn check.");
    } else if (["windows-client.are-preflight-unavailable", "windows-client.are-preflight-blocked"].includes(error.reason)
      && prepared?.entry
      && state.pending?.request_key === prepared.entry.request_key) {
      clearPendingTurn(sessionStorage, prepared.entry);
      state.pending = null;
      const codes = Array.isArray(error.value?.reason_codes)
        ? error.value.reason_codes.filter(code => typeof code === "string" && /^[a-z0-9.-]{1,96}$/.test(code)).slice(0, 8)
        : [];
      diagnostic({kind: "are-preflight-refused", reason_codes: codes});
      await reconcileRuntime(state.threadId);
      setStatus(codes.includes("requirements.explicit-seed-required")
        ? "No model turn started. This new objective needs an explicit requirement list; open the requirements section and confirm it, even if empty."
        : codes.includes("requirements.tracking-not-configured")
          ? "No model turn started. Requirement tracking is unavailable in this session; uncheck the requirement list to send without it."
          : "ARE could not prepare this turn. No model turn started; check Diagnostics before retrying.");
    } else if (error.reason === "windows-client.recent-turn-already-accepted" && typeof error.value?.turn_id === "string") {
      if (state.pending) await reconcileRuntime(state.threadId);
      state.repeatConfirmation = error.value.turn_id;
      await hydrateHistory(state.threadId);
      setStatus("This message was already accepted. Review history before confirming a new turn.");
    } else {
      if (state.pending) await reconcileRuntime(state.threadId);
      setStatus(`Turn delivery uncertain: ${error.message}`);
    }
  }
  updateComposer();
};

elements["save-feedback"].onclick = async () => {
  const text = elements.prompt.value.trim();
  if (!text || !state.feedbackAvailable || !state.threadId || !state.streamConnected || state.runtime !== "idle"
    || state.pending || state.pendingSteer || state.recoveryConfirmationRequired
    || state.pendingFeedback?.schema_version === "are.codex-client-pending-feedback-review/v1") return;
  try {
    const prepared = await preparePendingFeedback(localStorage, state.threadId, text);
    resetRevisionSelection();
    state.pendingFeedback = prepared.entry;
    updateComposer();
    const result = await api("/api/feedback", {method: "POST", body: JSON.stringify({threadId: state.threadId,
      requestKey: prepared.entry.request_key, text})});
    if (result.disposition === "pending") state.pendingFeedback = markFeedbackPendingReview(localStorage, prepared.entry);
    else { clearPendingFeedback(localStorage, prepared.entry); state.pendingFeedback = null; }
    elements.prompt.value = "";
    state.feedbackNotice = result.disposition === "pending"
      ? result.reason_codes?.includes("learning.feedback-scope-conflict")
        ? "This note limits itself to one answer or task, so ARE kept it pending instead of creating a later-answer instruction. Use Send for the request, or dismiss this pending note."
        : "Feedback is pending review; apply it explicitly to the suggested answer or dismiss it. No model turn started."
      : "Feedback saved for this thread; no model turn started.";
    setStatus(state.feedbackNotice, true);
  } catch (error) {
    setStatus(`Feedback delivery uncertain: ${error.message}`);
  }
  updateComposer();
};

elements["find-feedback"].onclick = async () => {
  if (!state.threadId || state.pendingFeedback || state.transportFailure) return;
  const threadId = state.threadId;
  const container = elements["pending-feedback-list"];
  container.replaceChildren();
  try {
    const result = await api(`/api/feedback/pending?threadId=${encodeURIComponent(threadId)}`);
    if (state.threadId !== threadId) return;
    if (result.schema_version !== "are.pending-feedback-list/v1" || result.thread_id !== threadId
      || !Array.isArray(result.items) || result.count !== result.items.length) throw new Error("Invalid pending-review list.");
    if (result.items.length === 0) { container.textContent = "No pending reviews for this thread."; return; }
    const intro = document.createElement("p");
    intro.textContent = `${result.items.length} pending review${result.items.length === 1 ? "" : "s"}. Select one, then re-enter its exact feedback text to apply or dismiss it. No feedback text is stored here.`;
    container.append(intro);
    for (const [index, item] of result.items.entries()) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "secondary";
      button.textContent = `Recover review ${index + 1} (${String(item.feedback_id).slice(-8)})`;
      button.onclick = () => {
        if (state.threadId !== threadId || state.pendingFeedback) return;
        try {
          state.pendingFeedback = adoptPendingFeedbackReview(localStorage, threadId, item);
          resetRevisionSelection();
          container.replaceChildren();
          state.feedbackNotice = "Review key recovered. Re-enter the exact feedback text to apply or dismiss it; no lesson was applied.";
          updateComposer();
        } catch (error) {setStatus(error.message);}
      };
      container.append(button);
    }
  } catch (error) {container.textContent = `Pending-review discovery failed: ${error.message}`;}
};

elements["load-lessons"].onclick = async () => {
  const threadId = state.threadId;
  if (!threadId || !state.pendingFeedback || state.transportFailure) return;
  resetRevisionSelection();
  try {
    const result = await api(`/api/feedback/lessons?threadId=${encodeURIComponent(threadId)}`);
    if (state.threadId !== threadId) return;
    if (result.schema_version !== "are.current-lessons-list/v1" || result.thread_id !== threadId
      || !Array.isArray(result.items) || result.count !== result.items.length) throw new Error("Invalid current-lessons list.");
    for (const item of result.items) {
      if (typeof item.lesson_id !== "string" || !/^lesson:[0-9a-f]{64}$/.test(item.lesson_id)
        || typeof item.lesson_digest !== "string" || !/^[0-9a-f]{64}$/.test(item.lesson_digest)
        || !Number.isSafeInteger(item.revision) || item.revision < 1 || typeof item.instruction !== "string") {
        throw new Error("Invalid current lesson.");
      }
      state.revisionLessons.set(item.lesson_id, item);
      elements["review-lesson"].add(new Option(`Revision ${item.revision}: ${item.instruction}`, item.lesson_id));
    }
    state.revisionThreadId = threadId;
    elements["review-lesson-note"].textContent = result.items.length
      ? "Select the exact instruction to correct, or leave New instruction selected. ARE checks whether it affected the answer being corrected."
      : "No current lessons in this conversation. Apply as a new instruction.";
  } catch (error) {
    resetRevisionSelection();
    elements["review-lesson-note"].textContent = `Current lessons unavailable: ${error.message}`;
  }
};

elements["discard-feedback"].onclick = () => {
  const reviewable = state.pendingFeedback?.schema_version === "are.codex-client-pending-feedback-review/v1";
  if (!state.pendingFeedback || !confirm(reviewable
    ? "Forget this local review key? The feedback remains pending in ARE. You can later find its ID again on this owned thread, but will still need the exact original text to dismiss it."
    : "Forget this retry? The feedback may already have been saved. This does not remove any saved preference.")) return;
  try {
    clearPendingFeedback(localStorage, state.pendingFeedback);
    state.pendingFeedback = null;
    resetRevisionSelection();
    state.feedbackNotice = reviewable
      ? "Review key forgotten. The feedback remains pending in ARE; no lesson was applied."
      : "Retry forgotten. A previously saved preference, if any, remains in ARE.";
    updateComposer();
  } catch (error) {setStatus(error.message);}
};

elements["dismiss-feedback"].onclick = async () => {
  const entry = state.pendingFeedback;
  if (entry?.schema_version !== "are.codex-client-pending-feedback-review/v1"
    || entry.thread_id !== state.threadId || !state.streamConnected || state.runtime !== "idle"
    || state.pending || state.pendingSteer || state.pendingThread || state.recoveryConfirmationRequired) return;
  const text = elements.prompt.value.trim();
  if (!text) return;
  try { await preparePendingFeedback(localStorage, entry.thread_id, text); }
  catch (error) { setStatus(`Feedback text does not match: ${error.message}`); return; }
  try {
    const result = await api("/api/feedback/dismiss", {method: "POST", body: JSON.stringify({threadId: entry.thread_id,
      requestKey: entry.request_key, text})});
    if (result.disposition !== "dismissed") throw new Error("ARE did not confirm dismissal.");
    clearPendingFeedback(localStorage, entry);
    state.pendingFeedback = null;
    resetRevisionSelection();
    elements.prompt.value = "";
    state.feedbackNotice = "Pending feedback dismissed. No lesson was applied and no model turn started.";
    setStatus(state.feedbackNotice, true);
  } catch (error) { setStatus(`Pending feedback dismissal uncertain: ${error.message}`); }
  updateComposer();
};

elements["apply-feedback"].onclick = async () => {
  const entry = state.pendingFeedback;
  if (entry?.schema_version !== "are.codex-client-pending-feedback-review/v1"
    || entry.thread_id !== state.threadId || !state.feedbackAvailable || !state.streamConnected
    || state.runtime !== "idle" || state.pending || state.pendingSteer || state.pendingThread || state.recoveryConfirmationRequired) return;
  const text = elements.prompt.value.trim();
  const quote = elements["review-quote"].value.trim();
  const instruction = elements["review-instruction"].value.trim();
  if (!text || !quote || !text.includes(quote) || !instruction) {
    setStatus("Enter the exact feedback text, one phrase from it, and the instruction to apply.");
    return;
  }
  try { await preparePendingFeedback(localStorage, entry.thread_id, text); }
  catch (error) { setStatus(`Feedback text does not match: ${error.message}`); return; }
  try {
    const listed = await api(`/api/feedback/pending?threadId=${encodeURIComponent(entry.thread_id)}`);
    const candidate = listed.items?.find((item) => item.feedback_id === entry.request_key
      && item.text_digest === entry.text_digest);
    if (!candidate?.candidate_episode_ref) throw new Error("No completed answered episode is available for explicit review.");
    const selectedId = elements["review-lesson"].value;
    let revisionFields = {};
    if (selectedId) {
      const selected = state.revisionThreadId === entry.thread_id ? state.revisionLessons.get(selectedId) : null;
      if (!selected) throw new Error("Reload current lessons before revising.");
      const current = await api(`/api/feedback/lessons?threadId=${encodeURIComponent(entry.thread_id)}`);
      if (state.threadId !== entry.thread_id || current.schema_version !== "are.current-lessons-list/v1"
        || current.thread_id !== entry.thread_id || !Array.isArray(current.items)
        || !current.items.some((item) => item.lesson_id === selected.lesson_id
          && item.lesson_digest === selected.lesson_digest)) {
        throw new Error("Selected lesson changed. Reload current lessons before revising.");
      }
      revisionFields = {revisesLessonId: selected.lesson_id, expectedLessonDigest: selected.lesson_digest};
    }
    const result = await api("/api/feedback/apply", {method: "POST", body: JSON.stringify({threadId: entry.thread_id,
      requestKey: entry.request_key, text, episodeRef: candidate.candidate_episode_ref, quote, instruction, ...revisionFields})});
    if (result.disposition !== "applied" || result.retention_scope !== "current-interaction") {
      throw new Error("ARE did not confirm a thread-scoped application.");
    }
    clearPendingFeedback(localStorage, entry);
    state.pendingFeedback = null;
    elements.prompt.value = "";
    elements["review-quote"].value = "";
    elements["review-instruction"].value = "";
    resetRevisionSelection();
    state.feedbackNotice = "Pending feedback applied to the selected completed answer for this conversation. No model turn started.";
    setStatus(state.feedbackNotice, true);
  } catch (error) { setStatus(`Pending feedback application uncertain: ${error.message}`); }
  updateComposer();
};

elements.interrupt.onclick = async () => {
  if (!state.threadId || !state.turnId || state.pendingSteer) return;
  try { await api("/api/turns/interrupt", {method: "POST", body: JSON.stringify({threadId: state.threadId, turnId: state.turnId})}); }
  catch (error) { setStatus(error.message); }
};

load().catch((error) => setStatus(error.message));
