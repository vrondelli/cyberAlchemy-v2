import {
  PROGRAM_ID,
  base64ToBytes,
  buildFulfillReissueInstruction,
  buildGrantInstruction,
  buildInitializeInstruction,
  buildRequestReissueInstruction,
  decryptKnowledge,
  encryptKnowledge,
  generateEncryptionIdentity,
  messages,
  openContentKey,
  parseHandoffCard,
  publicCardDigest,
  randomHex,
  sealContentKey,
  sha256Hex,
  submitAndFinalize,
  verifyFinalizedSignature,
} from "./protocol.js";
import { normalizeFailure } from "./errors.js";
import { initializeLocale, localize, translate } from "./i18n.js";

const requestedCopyVersion = new URLSearchParams(window.location.search).get("copy");
if (["1", "2", "3"].includes(requestedCopyVersion)) {
  document.documentElement.dataset.copyVersion = requestedCopyVersion;
}

const LEGACY_SESSION_KEY = "ca2-kep-hosted-workbench-v1";
const SESSION_STORE_KEY = "ca2-kep-hosted-workbench-sessions-v1";
const HOSTED_REQUEST_TIMEOUT_MS = 15_000;
const tasks = {
  share: { label: "Share as A", role: "originator", chapters: ["Identity", "Knowledge", "Recipient", "Confirm", "Complete"] },
  receive: { label: "Receive as B", role: "recipient", chapters: ["Identity", "Handoff", "Confirm", "Open", "Complete"] },
  restore: { label: "Restore access", role: null, chapters: ["Role", "Identity", "Request", "Reissue", "Complete"] },
  inspect: { label: "Inspect exchange", role: null, chapters: ["Reference", "Evidence"] },
};

const flows = {
  start: ["task"],
  share: ["a-wallet", "a-name", "a-key", "a-register", "a-knowledge", "a-boundary", "a-seal", "a-create-review", "a-create", "a-recipient", "a-grant-review", "a-grant", "a-finalize", "a-complete"],
  receive: ["b-wallet", "b-name", "b-key", "b-register", "b-card", "b-artifact", "b-review", "b-open", "b-complete"],
  "restore-recipient": ["restore-role", "b-wallet", "b-name", "b-key", "b-register", "r-b-artifact", "r-b-review", "r-b-request", "r-b-submit", "r-b-complete"],
  "restore-originator": ["restore-role", "a-wallet", "a-name", "a-key", "a-register", "r-a-card", "r-a-review", "r-a-fulfill", "r-a-complete"],
  inspect: ["inspect-reference", "inspect-result"],
};

const sceneChapters = {
  "a-wallet": 0, "a-name": 0, "a-key": 0, "a-register": 0,
  "a-knowledge": 1, "a-boundary": 1, "a-seal": 1, "a-create-review": 1, "a-create": 1,
  "a-recipient": 2, "a-grant-review": 3, "a-grant": 3, "a-finalize": 3, "a-complete": 4,
  "b-wallet": 0, "b-name": 0, "b-key": 0, "b-register": 0, "b-card": 1, "b-artifact": 1,
  "b-review": 2, "b-open": 3, "b-complete": 4,
  "restore-role": 0, "r-b-artifact": 2, "r-b-review": 2, "r-b-request": 2, "r-b-submit": 3, "r-b-complete": 4,
  "r-a-card": 2, "r-a-review": 2, "r-a-fulfill": 3, "r-a-complete": 4,
  "inspect-reference": 0, "inspect-result": 1,
};

const initialState = (overrides = {}) => ({
  sessionId: null,
  createdAt: null,
  task: null,
  sceneIndex: 0,
  recoveryRole: null,
  role: "originator",
  onboardingVersion: 4,
  walletPublicKey: null,
  identities: {},
  draftIdentityId: {},
  draftKnowledge: "",
  draftArtifactId: "",
  draftPolicyId: "",
  boundaryAccepted: false,
  recoveryKeyAcknowledged: false,
  artifact: null,
  grant: null,
  importedArtifact: null,
  reissue: null,
  importedReissue: null,
  pendingFulfillment: null,
  finalizedRevision: 0,
  decryptedPlaintext: null,
  draftEvidenceArtifact: "",
  evidenceResult: null,
  activity: [],
  activeError: null,
  pendingErrorEvents: [],
  operations: {},
  ...overrides,
});

function readSessionStore() {
  try {
    const value = JSON.parse(sessionStorage.getItem(SESSION_STORE_KEY) || "{}");
    if (value.version === 1 && value.sessions && typeof value.sessions === "object") return value;
  } catch { /* Start with an empty local store. */ }
  return { version: 1, activeSessionId: null, sessions: {} };
}

let sessionStore = readSessionStore();
let state;
try {
  const active = sessionStore.sessions[sessionStore.activeSessionId];
  if (active?.onboardingVersion === 4) {
    state = { ...initialState(), ...active };
  } else {
    const legacy = JSON.parse(sessionStorage.getItem(LEGACY_SESSION_KEY) || "{}");
    if (legacy.task) {
      const sessionId = `session-${randomHex().slice(0, 18)}`;
      state = { ...initialState(), ...legacy, onboardingVersion: 4, sessionId, createdAt: new Date().toISOString(), operations: legacy.operations || {} };
      sessionStore.sessions[sessionId] = state;
      sessionStore.activeSessionId = sessionId;
      sessionStorage.removeItem(LEGACY_SESSION_KEY);
    } else {
      state = initialState();
    }
  }
} catch {
  state = initialState();
}

const $ = (selector) => document.querySelector(selector);
const stage = $("#stage");
const encoder = new TextEncoder();

function save() {
  if (state.sessionId) {
    sessionStore.sessions[state.sessionId] = state;
    sessionStore.activeSessionId = state.sessionId;
  }
  sessionStorage.setItem(SESSION_STORE_KEY, JSON.stringify(sessionStore));
}

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function short(value, size = 6) {
  if (!value) return "not connected";
  return value.length > size * 2 ? `${value.slice(0, size)}…${value.slice(-size)}` : value;
}

function isArtifactVersionId(value) {
  return /^[0-9a-f]{64}$/i.test(String(value || "").trim());
}

function frozenOperation(kind) {
  state.operations ||= {};
  state.operations[kind] ||= {
    operationId: `${kind}-${randomHex().slice(0, 18)}`,
    kind,
    stage: "frozen",
  };
  save();
  return state.operations[kind];
}

function setOperationStage(kind, stage, fields = {}) {
  const operation = frozenOperation(kind);
  Object.assign(operation, fields, { stage });
  save();
  return operation;
}

function notify(message, isError = false) {
  if (isError) {
    void recordClientError(new Error(message), { operationKind: "client_interface" });
    return;
  }
  const toast = $("#toast");
  toast.textContent = translate(message);
  toast.className = `toast show${isError ? " error" : ""}`;
  clearTimeout(notify.timer);
  notify.timer = setTimeout(() => { toast.className = "toast"; }, 3800);
}

function snakeCase(value) {
  return String(value || "client_operation")
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .replace(/[^A-Za-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .toLowerCase()
    .slice(0, 128) || "client_operation";
}

function effectLabel(value) {
  return {
    none: "No protocol effect",
    rejected_before_submission: "Rejected before submission",
    submission_attempted_unknown: "Submission attempted · outcome unknown",
    submitted_finality_unknown: "Submitted · finality unknown",
    finalized_failure: "Finalized failure",
    finalized_success: "Finalized success",
    unknown: "Effect unknown",
  }[value] || "Effect unknown";
}

function renderPersistentError() {
  const panel = $("#persistent-error");
  const error = state.activeError;
  panel.hidden = !error;
  if (!error) return;
  $("#persistent-error-stage").textContent = error.stage.replaceAll("_", " ");
  $("#persistent-error-title").textContent = error.title;
  $("#persistent-error-message").textContent = error.message;
  $("#persistent-error-guidance").textContent = error.guidance;
  $("#persistent-error-id").textContent = `Error ${error.attemptId}`;
  $("#persistent-error-effect").textContent = effectLabel(error.effectStatus);
  $("#persistent-error-retry").textContent = (error.retryDisposition || "inspect_before_retry").replaceAll("_", " ");
  $("#persistent-error-receipt").textContent = {
    sending: "Sending evidence…",
    recorded: "Evidence saved by server",
    not_recorded: "Server evidence not saved",
  }[error.serverStatus] || "Evidence pending";
  const evidence = $("#persistent-error-evidence");
  evidence.hidden = !error.attemptProjection;
  if (error.attemptProjection) {
    $("#persistent-error-evidence-value").textContent = JSON.stringify(error.attemptProjection, null, 2);
  }
}

async function recordClientError(error, context = {}) {
  if (error?.__ca2Reported) return state.activeError;
  const normalized = normalizeFailure(error, { ...context, programId: PROGRAM_ID });
  const detail = normalized.detail;
  const attemptId = `attempt-${crypto.randomUUID?.() || randomHex().slice(0, 24)}`;
  const operationKind = snakeCase(context.operationKind || context.action?.name);
  const stageName = snakeCase(normalized.stage);
  const errorCode = snakeCase(normalized.canonicalCode);
  const effectStatus = normalized.effectStatus;
  const safeMessage = normalized.safeMessage.slice(0, 512);
  const activeError = {
    attemptId,
    operationKind,
    stage: stageName,
    errorCode,
    effectStatus,
    sourceLayer: normalized.sourceLayer,
    retryDisposition: normalized.retryDisposition,
    title: normalized.title.slice(0, 180),
    message: safeMessage,
    guidance: normalized.guidance.slice(0, 320),
    serverStatus: "sending",
  };
  state.activeError = activeError;
  save();
  renderPersistentError();
  log(`${activeError.title} [${attemptId}]`, true);
  try { error.__ca2Reported = true; } catch { /* Some host errors are immutable. */ }

  const payload = {
    attempt_id: attemptId,
    operation_kind: operationKind,
    stage: stageName,
    error_code: errorCode,
    effect_status: effectStatus,
    network: "solana-devnet",
    safe_message: safeMessage,
    diagnostic_digest: await sha256Hex(encoder.encode(detail)),
    rpc_request_id: normalized.rpcRequestId,
    transaction_signature: normalized.transactionSignature,
    reporter: "client",
    registry_version: normalized.registryVersion,
    source_layer: normalized.sourceLayer,
    retry_disposition: normalized.retryDisposition,
    http_status: normalized.httpStatus,
    rpc_code: normalized.rpcCode,
    transaction_error: normalized.transactionError,
    instruction_index: normalized.instructionIndex,
    instruction_error: normalized.instructionError,
    program_id: normalized.programId,
    custom_program_code: normalized.customProgramCode,
    correlation_id: normalized.correlationId,
  };
  try {
    await sendErrorEvent(payload);
    activeError.serverStatus = "recorded";
  } catch {
    activeError.serverStatus = "not_recorded";
    state.pendingErrorEvents = [payload, ...(state.pendingErrorEvents || []).filter((item) => item.attempt_id !== attemptId)].slice(0, 10);
  }
  if (state.activeError?.attemptId === attemptId) state.activeError = activeError;
  save();
  renderPersistentError();
  return activeError;
}

async function sendErrorEvent(payload) {
  const response = await fetch("/v1/client-errors", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
}

async function flushPendingErrorEvents() {
  const pending = [...(state.pendingErrorEvents || [])];
  for (const payload of pending) {
    try {
      await sendErrorEvent(payload);
      state.pendingErrorEvents = state.pendingErrorEvents.filter((item) => item.attempt_id !== payload.attempt_id);
      if (state.activeError?.attemptId === payload.attempt_id) state.activeError.serverStatus = "recorded";
    } catch {
      break;
    }
  }
  save();
  renderPersistentError();
}

function log(message, isError = false) {
  state.activity.unshift({ at: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }), message: translate(message), isError });
  state.activity = state.activity.slice(0, 12);
  save();
  renderLog();
}

function renderLog() {
  const rows = state.activity.length
    ? state.activity
    : [{ at: "ready", message: "Workbench loaded. No protocol effect has occurred." }];
  $("#activity-log").innerHTML = rows.map((item) =>
    `<li class="${item.isError ? "error" : ""}"><time>${escapeHtml(item.at)}</time><span>${escapeHtml(item.message)}</span></li>`,
  ).join("");
}

async function run(label, action, context = {}) {
  const buttons = [...stage.querySelectorAll("button")];
  buttons.forEach((button) => { button.disabled = true; });
  try {
    const result = await action();
    log(label);
    notify(label);
    save();
    render();
    return result;
  } catch (error) {
    await recordClientError(error, {
      action,
      operationKind: context.operationKind,
      stage: context.stage,
      mayHaveEffect: context.mayHaveEffect,
      transactionSignature: context.transactionSignature,
    });
    buttons.forEach((button) => { button.disabled = false; });
    throw error;
  }
}

function walletProvider() {
  const provider = window.phantom?.solana || window.solana;
  if (!provider?.isPhantom) throw new Error("A Phantom-compatible Solana wallet is required.");
  return provider;
}

async function connectWallet() {
  const provider = walletProvider();
  const result = await provider.connect();
  state.walletPublicKey = result.publicKey.toString();
  save();
  $("#wallet-button").textContent = short(state.walletPublicKey, 5);
  log(`Wallet connected for this tab: ${short(state.walletPublicKey)}`);
  render();
  return provider;
}

async function requireWallet() {
  const provider = walletProvider();
  if (!provider.publicKey) await connectWallet();
  const current = provider.publicKey.toString();
  state.walletPublicKey = current;
  save();
  return provider;
}

async function authorize(message) {
  const provider = await requireWallet();
  const result = await provider.signMessage(encoder.encode(message), "utf8");
  const bytes = result.signature || result;
  let binary = "";
  for (const value of bytes) binary += String.fromCharCode(value);
  return { message, signature_base64: btoa(binary) };
}

async function api(path, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), HOSTED_REQUEST_TIMEOUT_MS);
  let response;
  try {
    response = await fetch(path, {
      ...options,
      signal: controller.signal,
      headers: options.body ? { "content-type": "application/json", ...(options.headers || {}) } : options.headers,
    });
  } catch (error) {
    if (error?.name === "AbortError") {
      error.code = "transport_timeout";
      error.stage = "hosted_api";
      error.safeMessage = "The hosted request exceeded its 15 second limit.";
      error.guidance = "Inspect the saved operation before resuming. Do not create another transaction.";
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(body.message || `Service returned HTTP ${response.status}`);
    error.serverCode = body.error || "hosted_api_error";
    error.httpStatus = response.status;
    error.correlationId = response.headers.get("x-ca2-error-id");
    error.stage = "hosted_api";
    throw error;
  }
  return body;
}

function identity(role = state.role) {
  const value = state.identities[role];
  if (!value) throw new Error(`${role === "originator" ? "A" : "B"} must create an encryption identity first.`);
  return value;
}

function assertWallet(identityValue) {
  if (identityValue.walletPublicKey !== state.walletPublicKey) {
    const error = new Error(`Connect the wallet registered for ${identityValue.identityId}.`);
    error.code = "wallet_identity_mismatch";
    error.effectStatus = "none";
    throw error;
  }
}

async function parseCard(text, kind) {
  const card = parseHandoffCard(text, kind);
  if (card.cardDigest) {
    const { cardDigest, ...material } = card;
    if (await publicCardDigest(material) !== cardDigest) {
      const error = new Error("The public card digest does not match its fields.");
      error.code = "invalid_handoff_card";
      error.effectStatus = "none";
      throw error;
    }
  }
  return card;
}

function download(name, value) {
  const blob = new Blob([`${JSON.stringify(value, null, 2)}\n`], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = name;
  link.click();
  URL.revokeObjectURL(link.href);
}

function publicIdentityCard(value) {
  return {
    kind: "ca2-kep-public-identity/v1",
    identityId: value.identityId,
    walletPublicKey: value.walletPublicKey,
    encryptionPublicKey: value.publicKeyBase64,
    keyVersion: value.keyVersion,
    network: "solana-devnet",
    programId: PROGRAM_ID,
  };
}

async function withCardDigest(value) {
  const { cardDigest: _ignored, ...material } = value;
  return { ...material, cardDigest: await publicCardDigest(material) };
}

async function publicPreflightCard() {
  const current = identity();
  const registration = frozenOperation(`register-${state.role}`);
  const material = {
    kind: "ca2-kep-public-preflight/v1",
    sessionId: state.sessionId,
    task: state.task,
    role: state.role,
    identityId: current.identityId,
    walletPublicKey: state.walletPublicKey,
    encryptionPublicKey: current.publicKeyBase64,
    keyVersion: current.keyVersion,
    network: "solana-devnet",
    programId: PROGRAM_ID,
    custody: "shared wallet authority does not prove independent custody",
    registrationOperationId: registration.operationId,
  };
  if (state.task === "share") {
    Object.assign(material, {
      artifactId: state.draftArtifactId,
      policyId: state.draftPolicyId,
      epoch: 1,
      knowledgeConsiderationLamports: 0,
      artifactOperationId: frozenOperation("artifact").operationId,
    });
  }
  return withCardDigest(material);
}

function publicArtifactCard(value = state.artifact) {
  if (!value) throw new Error("A must prepare an artifact first.");
  return {
    kind: "ca2-kep-public-artifact/v1",
    artifactId: value.artifactId,
    policyId: value.policyId,
    epoch: value.epoch,
    plaintextCommitment: value.plaintextCommitment,
    ciphertextSha256: value.ciphertextSha256,
    contentNonceBase64: value.contentNonceBase64,
    originatorIdentityId: value.originatorIdentityId,
    artifactAccount: value.artifactAccount || null,
    revision: state.finalizedRevision,
    network: "solana-devnet",
    programId: PROGRAM_ID,
  };
}

function cardTextarea(id, placeholder) {
  return `<div class="field"><label for="${id}">Public card</label><textarea id="${id}" class="textarea card-input" spellcheck="false" placeholder="${placeholder}"></textarea><label class="file-choice" for="${id}-file">Choose a JSON card file</label><input id="${id}-file" class="visually-hidden" type="file" accept="application/json,.json" data-card-target="${id}"><small>Paste or choose a public card. Never provide a private encryption key.</small></div>`;
}

function currentFlowKey() {
  if (!state.task) return "start";
  if (state.task === "restore") return state.recoveryRole ? `restore-${state.recoveryRole}` : "restore-recipient";
  return state.task;
}

function currentFlow() {
  return flows[currentFlowKey()] || flows.start;
}

function currentScene() {
  const flow = currentFlow();
  state.sceneIndex = Math.max(0, Math.min(state.sceneIndex, flow.length - 1));
  return flow[state.sceneIndex];
}

const sceneCopy = {
  task: ["Knowledge Expansion Protocol", "What do you want to do?", "Choose the task that brought you here."],
  "a-wallet": ["Identity · A", "Connect the wallet that represents A", "Your wallet proves who authorizes each operation. This trial uses Devnet."],
  "a-name": ["Identity · A", "Name this knowledge identity", "Use a protocol name, not a legal identity."],
  "a-key": ["Identity · A", "Create the key that protects access", "The public key may be shared. The private key stays in this browser tab."],
  "a-register": ["Identity · A", "Register A’s identity", "This signs one purpose-specific message. It is not a Solana transaction."],
  "a-knowledge": ["Knowledge · A", "What knowledge are you sharing?", "Encryption happens in this browser. Plaintext is never sent to the service."],
  "a-boundary": ["Knowledge · A", "Review how this artifact will work", "A remains an owner. The first recipient joins for 0 SOL."],
  "a-seal": ["Knowledge · A", "Seal the knowledge locally", "Create ciphertext, commitments, and A’s envelope without a chain transaction."],
  "a-create-review": ["Confirm · A", "Review the Devnet artifact", "Check the boundary before asking your wallet to create public state."],
  "a-create": ["Confirm · A", "Create the artifact on Devnet", "Your wallet will ask you to approve one Devnet transaction."],
  "a-recipient": ["Recipient · A", "Add B’s public identity", "Paste the card B sent you. We verify and summarize it before submission."],
  "a-grant-review": ["Confirm · A", "Check the access grant", "A keeps access. B becomes an additional owner for 0 SOL."],
  "a-grant": ["Confirm · A", "Grant B access on Devnet", "Your wallet will ask you to approve one grant transaction."],
  "a-finalize": ["Confirm · A", "Confirm finalized access", "The service must independently match finalized chain state before B’s envelope activates."],
  "a-complete": ["Complete · A", "Send the finalized artifact to B", "Share only this public card. Never send your private encryption key."],
  "b-wallet": ["Identity · B", "Connect B’s wallet", "Use a wallet controlled independently from A."],
  "b-name": ["Identity · B", "Name B’s knowledge identity", "Use a protocol name that A can recognize."],
  "b-key": ["Identity · B", "Create B’s access key", "A will seal B’s envelope to the public half. The private half stays here."],
  "b-register": ["Identity · B", "Register B’s identity", "This signs a message and does not spend SOL."],
  "b-card": ["Handoff · B", "Send B’s public card to A", "A needs this public material to prepare a recipient-specific envelope."],
  "b-artifact": ["Handoff · B", "Continue with A’s artifact card", "Paste the public card A sent after the grant finalized."],
  "b-review": ["Confirm · B", "Check what you are opening", "Verify the artifact and owner state before signing an access request."],
  "b-open": ["Open · B", "Retrieve and decrypt", "The signature authorizes this read. It does not transfer SOL."],
  "b-complete": ["Complete · B", "Knowledge opened in this browser", "Public state proves the bounded grant—not legal ownership or licensing."],
  "restore-role": ["Restore access", "Who are you in this recovery?", "B requests a replacement envelope. A verifies and fulfills it."],
  "r-b-artifact": ["Request · B", "Load the artifact to restore", "Paste the public artifact card; the artifact itself will not change."],
  "r-b-review": ["Request · B", "Review the replacement", "Only B’s key binding and envelope may change. Owners, artifact, policy, and epoch stay fixed."],
  "r-b-request": ["Request · B", "Create a replacement access request", "A new private key stays here while the public replacement is prepared."],
  "r-b-submit": ["Reissue · B", "Record the request on Devnet", "This records a request. It does not change access yet."],
  "r-b-complete": ["Complete · B", "Send the request card to A", "A must verify and fulfill this public request."],
  "r-a-card": ["Verify · A", "Load B’s replacement request", "Paste B’s public request card and verify its bounded effect."],
  "r-a-review": ["Verify · A", "Check what will change", "B’s envelope and revision change. Everything else remains fixed."],
  "r-a-fulfill": ["Reissue · A", "Fulfill B’s request on Devnet", "Seal the unchanged content key to B’s replacement public key."],
  "r-a-complete": ["Complete · A", "Replacement access finalized", "The owner set remains { A, B }; only B’s access material changed."],
  "inspect-reference": ["Read-only evidence", "Which exchange do you want to inspect?", "Enter one artifact ID. This makes no protocol change."],
  "inspect-result": ["Read-only evidence", "Bounded public state", "This is protocol evidence—not legal title, licensing, or production readiness."],
};

function intro(text, boundary) {
  return `<div class="scene-intro"><p>${text}</p>${boundary ? `<span class="boundary-note">${boundary}</span>` : ""}</div>`;
}

function summary(rows) {
  return `<dl class="review-list">${rows.map(([term, value]) => `<div><dt>${term}</dt><dd>${value}</dd></div>`).join("")}</dl>`;
}

function action(label, name, effectful = false, secondary = false, disabled = false) {
  return `<button class="button ${secondary ? "button-secondary" : "button-primary"}${effectful ? " effectful" : ""}" data-action="${name}" type="button"${disabled ? ' disabled aria-disabled="true"' : ""}>${effectful ? '<span aria-hidden="true">↗</span>' : ""}${label}</button>`;
}

function taskView() {
  const resumable = Object.values(sessionStore.sessions)
    .filter((session) => session?.task && session?.sessionId)
    .sort((left, right) => String(right.createdAt).localeCompare(String(left.createdAt)))
    .slice(0, 6);
  const resume = resumable.length ? `<section class="session-resume" aria-labelledby="resume-heading"><h3 id="resume-heading">Resume an exact session</h3><div class="task-list compact">${resumable.map((session) => `<button type="button" data-session="${escapeHtml(session.sessionId)}"><strong>${escapeHtml(tasks[session.task]?.label || session.task)}</strong><small>${escapeHtml(session.identities?.[session.role]?.identityId || "Identity not created")} · ${escapeHtml(short(session.walletPublicKey, 5))} · ${escapeHtml(session.sessionId)}</small></button>`).join("")}</div></section>` : "";
  return `${intro("Start fresh or resume one exact saved session. Fresh tasks never inherit another role, identity, key, or operation.", "Devnet only · no Mainnet SOL")}
    <div class="task-list">
      <button type="button" data-task="share"><span>01</span><strong>Share knowledge</strong><small>Start fresh as A. Encrypt knowledge and add B as an owner.</small></button>
      <button type="button" data-task="receive"><span>02</span><strong>Receive knowledge</strong><small>Start fresh as B. Create access or open A’s artifact.</small></button>
      <button type="button" data-task="restore"><span>03</span><strong>Restore access</strong><small>Start a fresh recovery role or resume its exact saved session.</small></button>
      <button type="button" data-task="inspect"><span>04</span><strong>Inspect an exchange</strong><small>Read bounded public state from an artifact reference.</small></button>
    </div>${resume}`;
}

function walletView(role) {
  const label = role === "originator" ? "A" : "B";
  return `${intro(`Phantom will ask permission to expose the selected Devnet address for ${label}.`, "Public wallet address")}
    ${state.walletPublicKey ? summary([["Connected wallet", escapeHtml(short(state.walletPublicKey, 8))], ["Network", "Solana Devnet"]]) : action("Connect Solana wallet", "connect-wallet")}`;
}

function nameView(role) {
  const defaultId = role === "originator" ? "originator-a" : "recipient-b";
  return `${intro("This stable protocol label helps the other participant recognize you.", "Public identity field")}
    <div class="field"><label for="identity-id">Knowledge identity</label><input id="identity-id" class="input" value="${escapeHtml(state.draftIdentityId[role] || defaultId)}" maxlength="128" autocomplete="off"><small>Letters, numbers, dot, colon, dash, or underscore.</small></div>`;
}

function keyView(role) {
  const current = state.identities[role];
  return `${intro("Closing or clearing this tab can remove the private key. Durable key export is not available yet.", "Private key stays in this tab")}
    ${current ? `${summary([["Encryption key", "Created locally"], ["Public key", escapeHtml(short(current.publicKeyBase64, 10))]])}<details class="technical"><summary>Technical details</summary><code>${escapeHtml(current.publicKeyBase64)}</code></details>` : action("Create encryption key", "generate-identity")}`;
}

function registerView(role) {
  const current = state.identities[role];
  return `${intro("Your wallet signs the exact identity and public encryption key shown below.", "Signed message · no transaction")}
    ${summary([["Session", escapeHtml(state.sessionId)], ["Identity", escapeHtml(current?.identityId || "Not created")], ["Wallet", escapeHtml(short(state.walletPublicKey, 8))], ["Network fee", "None"]])}
    <p class="boundary-note">One person or wallet may operate distinct KEP identities. Shared wallet authority does not prove independent custody.</p>
    <div class="actions">${action("Download public preflight", "export-preflight", false, true)}${action("Copy public preflight", "copy-preflight", false, true)}${current?.registered ? '<span class="success-line">Identity registered or resumed exactly.</span>' : action("Sign identity registration", "register-identity")}</div>`;
}

function sceneView(scene) {
  const artifact = state.importedArtifact || state.artifact;
  const currentRole = scene.startsWith("b-") || scene.startsWith("r-b-") ? "recipient" : "originator";
  if (scene === "task") return taskView();
  if (scene.endsWith("wallet")) return walletView(currentRole);
  if (scene.endsWith("name")) return nameView(currentRole);
  if (scene.endsWith("key")) return keyView(currentRole);
  if (scene === "a-register" || scene === "b-register") return registerView(currentRole);
  if (scene === "a-knowledge") return `${intro("Write or paste one exact knowledge artifact.", "Stays in this browser")}
    <div class="field"><label for="knowledge">Knowledge</label><textarea id="knowledge" class="textarea knowledge" placeholder="Write or paste the knowledge to encrypt.">${escapeHtml(state.draftKnowledge)}</textarea></div>`;
  if (scene === "a-boundary") return `${intro("Only ciphertext and commitments leave this browser. Network fees are separate from the 0 SOL knowledge consideration.", "Owner model · { A } → { A, B }")}
    ${summary([["A", "Remains an owner"], ["B", "Joins after finality"], ["Knowledge price", "0 SOL"], ["Plaintext", "Never sent"]])}
    <label class="acknowledge"><input id="boundary-accepted" type="checkbox" ${state.boundaryAccepted ? "checked" : ""}> <span>I understand this boundary.</span></label>`;
  if (scene === "a-seal") return `${intro("This local operation creates the sealed artifact and A’s own envelope.", "Local cryptography · signed message")}
    <input id="artifact-id" type="hidden" value="${escapeHtml(state.draftArtifactId)}"><input id="policy-id" type="hidden" value="${escapeHtml(state.draftPolicyId)}"><input id="epoch" type="hidden" value="1"><textarea id="knowledge" hidden>${escapeHtml(state.draftKnowledge)}</textarea>
    ${state.artifact ? `${summary([["Artifact", escapeHtml(short(state.artifact.artifactId, 10))], ["Epoch", "1"], ["Status", "Sealed off-chain"]])}<p class="success-line">Knowledge encrypted locally.</p>` : action("Encrypt knowledge", "prepare-artifact")}`;
  if (scene === "a-create-review") return `${intro("The next step creates one public artifact account. B is not an owner yet.", "Review before transaction")}${summary([["Network", "Solana Devnet"], ["Current owners", "{ A }"], ["Artifact", escapeHtml(short(state.artifact?.artifactId, 10))], ["Knowledge price", "0 SOL"], ["Plaintext", "Remains local"]])}`;
  if (scene === "a-create") return `${intro("Your wallet shows the exact fee and rent before approval.", "Recorded on Devnet")}${state.artifact?.artifactAccount ? `${summary([["Artifact account", escapeHtml(short(state.artifact.artifactAccount, 10))], ["Finality", "Finalized"]])}<p class="success-line">Artifact created on Devnet.</p>` : action("Create artifact on Devnet", "initialize-devnet", true)}`;
  if (scene === "a-recipient") return `${intro("The card contains B’s public identity, wallet, and encryption key.", "Public card")}${state.grant ? `${summary([["Recipient", escapeHtml(state.grant.recipient.identityId)], ["Wallet", escapeHtml(short(state.grant.recipient.walletPublicKey, 8))], ["Envelope", "Prepared locally"]])}<p class="success-line">B’s card is valid.</p>` : `${cardTextarea("recipient-card", "Paste B’s public identity card")}${action("Verify B and prepare envelope", "prepare-grant")}`}`;
  if (scene === "a-grant-review") return `${intro("Confirm the exact ownership expansion before the transaction.", "Review before transaction")}${summary([["From", "{ A }"], ["To", "{ A, B }"], ["Recipient", escapeHtml(state.grant?.recipient?.identityId || "B")], ["Knowledge price", "0 SOL"], ["A’s access", "Preserved"]])}`;
  if (scene === "a-grant") return `${intro("This transaction adds B without removing A.", "Recorded on Devnet")}${state.grant?.signature ? `${summary([["Signature", escapeHtml(short(state.grant.signature, 10))], ["Status", "Submitted and finalized by wallet"]])}<p class="success-line">Grant transaction submitted.</p>` : action("Grant B access on Devnet", "submit-grant", true)}`;
  if (scene === "a-finalize") return `${intro("The hosted service activates access only after matching the exact finalized transaction.", "Independent finality observation")}${state.finalizedRevision >= 1 ? `${summary([["Owner set", "{ A, B }"], ["Revision", String(state.finalizedRevision)], ["Access", "Active"]])}<p class="success-line">B’s access is finalized.</p>` : action("Confirm finalized grant", "finalize-grant")}`;
  if (scene === "a-complete") return `${intro("Send the public artifact card to B through your chosen channel.", "Public handoff · no private key")}${summary([["Owner set", "{ A, B }"], ["Artifact", escapeHtml(short(state.artifact?.artifactId, 10))], ["Revision", String(state.finalizedRevision)]])}<div class="actions">${action("Download artifact card", "export-artifact")}${action("Copy public card", "copy-artifact", false, true)}${action("Fulfill a reissue as A", "continue-restore-a", false, true)}${action("Inspect evidence", "go-evidence", false, true)}</div>`;
  if (scene === "b-card") return `${intro("This is safe to send to A. It contains no private encryption key.", "Public handoff")}${summary([["Identity", escapeHtml(state.identities.recipient?.identityId || "B")], ["Wallet", escapeHtml(short(state.walletPublicKey, 8))]])}<div class="actions">${action("Download B’s public card", "export-identity")}${action("Copy public card", "copy-identity", false, true)}</div>`;
  if (scene === "b-artifact" || scene === "r-b-artifact") return `${intro("We validate the card before using it.", "Public artifact reference")}${state.importedArtifact ? `${summary([["Artifact", escapeHtml(short(state.importedArtifact.artifactId, 10))], ["Originator", escapeHtml(state.importedArtifact.originatorIdentityId)], ["Epoch", String(state.importedArtifact.epoch)]])}<p class="success-line">Artifact card loaded.</p>` : `${cardTextarea("artifact-card", "Paste A’s public artifact card")}${action("Verify artifact card", "load-artifact-card")}`}`;
  if (scene === "b-review") return `${intro("Decryption will happen locally after B signs a read request.", "Signed read · no SOL transfer")}${summary([["Artifact", escapeHtml(short(artifact?.artifactId, 10))], ["Originator", escapeHtml(artifact?.originatorIdentityId || "A")], ["Expected owners", "{ A, B }"], ["Plaintext destination", "This browser only"]])}`;
  if (scene === "b-open") return `${intro("A failed commitment check returns no partial plaintext.", "Retrieved sealed · decrypted locally")}${state.decryptedPlaintext !== null ? '<p class="success-line">The exact artifact decrypted successfully.</p>' : action("Sign access request and decrypt", "open-access")}`;
  if (scene === "b-complete") return `${intro("Only this browser recovered the plaintext.", "Private result")}<div class="knowledge-result"><span>Recovered knowledge</span><p>${escapeHtml(state.decryptedPlaintext || "")}</p></div><div class="actions">${action("Request replacement access", "continue-restore-b", false, true)}${action("Inspect evidence", "go-evidence", false, true)}</div>`;
  if (scene === "restore-role") return `${intro("Choose the part of the recovery you are performing now.", "Recovery does not alter ownership")}
    <div class="task-list compact"><button type="button" data-recovery-role="recipient"><strong>I am B</strong><small>Create and send a replacement request.</small></button><button type="button" data-recovery-role="originator"><strong>I am A</strong><small>Verify and fulfill B’s request.</small></button></div>`;
  if (scene === "r-b-review") return `${intro("A replacement key cannot change the artifact or its owners. This trial has same-tab durability only.", "Envelope-only change")}${summary([["Owners", "Remain { A, B }"], ["Artifact", "Unchanged"], ["Policy and epoch", "Unchanged"], ["Revision", "Advances after fulfillment"], ["Replacement private key", "This exact saved browser session"]])}<label class="acknowledge"><input id="recovery-key-acknowledged" type="checkbox" ${state.recoveryKeyAcknowledged ? "checked" : ""}> <span>I will keep and resume this exact session until replacement access is verified.</span></label>`;
  if (scene === "r-b-request") return `${intro("A new key pair is created locally and bound to this exact artifact revision.", "New private key stays here")}${state.reissue ? '<p class="success-line">Replacement request prepared.</p>' : action("Create replacement request", "request-reissue")}`;
  if (scene === "r-b-submit") return `${intro("Current access remains unchanged until A fulfills the request.", "Recorded on Devnet")}${state.reissue?.requestSignature ? '<p class="success-line">Request finalized on Devnet.</p>' : action("Request replacement access on Devnet", "submit-reissue-request", true)}`;
  if (scene === "r-b-complete") return `${intro("Send this public request to A. Keep this browser session for the replacement private key.", "Public request card")}${summary([["Artifact", escapeHtml(short(state.reissue?.artifactId, 10))], ["Owner set", "{ A, B }"], ["Access change", "Not active until A fulfills"]])}<div class="actions">${action("Download reissue request", "export-reissue")}${action("Copy public card", "copy-reissue", false, true)}${action("Check replacement access", "continue-open-b", false, true)}</div>`;
  if (scene === "r-a-card") return `${intro("The request must belong to B and the exact artifact revision.", "Public request card")}${state.importedReissue ? `${summary([["Artifact", escapeHtml(short(state.importedReissue.artifactId, 10))], ["Recipient", escapeHtml(state.importedReissue.recipientIdentityId)], ["Expected revision", String(state.importedReissue.expectedRevision)]])}<p class="success-line">Request card loaded.</p>` : `${cardTextarea("reissue-card", "Paste B’s public reissue card")}${action("Verify replacement request", "load-reissue-card")}`}`;
  if (scene === "r-a-review") return `${intro("Fulfillment replaces only B’s active envelope and advances the revision.", "Review before transaction")}${summary([["Owners", "Remain { A, B }"], ["Artifact, policy, epoch", "Unchanged"], ["B’s envelope", "Replaced"], ["Revision", `${state.importedReissue?.expectedRevision || 1} → ${(state.importedReissue?.expectedRevision || 1) + 1}`]])}`;
  if (scene === "r-a-fulfill") return `${intro("Your wallet approves the exact envelope replacement transaction.", "Recorded on Devnet")}${state.finalizedRevision >= 2 ? '<p class="success-line">Replacement envelope finalized.</p>' : action(state.pendingFulfillment ? "Resume saved fulfillment" : "Fulfill B’s reissue on Devnet", "fulfill-reissue", true)}`;
  if (scene === "r-a-complete") return `${intro("B can now retrieve the replacement envelope using the new key held in B’s browser.", "Finalized envelope-only change")}${summary([["Owner set", "{ A, B }"], ["Revision", String(state.finalizedRevision)], ["Artifact, policy, epoch", "Preserved"]])}`;
  if (scene === "inspect-reference") {
    const validReference = isArtifactVersionId(state.draftEvidenceArtifact);
    return `${intro("Use the 64-character artifact version identifier from a public card.", "Read-only request")}
      <div class="field"><label for="evidence-artifact">Artifact version ID</label><input id="evidence-artifact" class="input" value="${escapeHtml(state.draftEvidenceArtifact)}" minlength="64" maxlength="64" pattern="[0-9A-Fa-f]{64}" autocomplete="off" autocapitalize="none" spellcheck="false" aria-describedby="evidence-artifact-help"${state.draftEvidenceArtifact && !validReference ? ' aria-invalid="true"' : ""}><small id="evidence-artifact-help">Enter exactly 64 hexadecimal characters.</small></div>${action("Inspect current state", "inspect-state", false, false, !validReference)}`;
  }
  if (scene === "inspect-result") {
    if (!state.evidenceResult) return `${intro("No public state has been loaded yet.", "Inspection incomplete")}<p class="error-line">Return to the artifact reference and load a valid exchange before exporting evidence.</p>`;
    return `${intro("The service returned its current public projection.", "Read-only evidence")}${summary([["Artifact", escapeHtml(short(state.evidenceResult.artifact_version_id || state.draftEvidenceArtifact, 10))], ["Owners", escapeHtml(JSON.stringify(state.evidenceResult.owners || []))], ["Revision", escapeHtml(state.evidenceResult.revision ?? "unknown")]])}<details class="technical"><summary>Technical evidence</summary><code>${escapeHtml(JSON.stringify(state.evidenceResult, null, 2))}</code></details><div class="actions">${action("Export local activity", "export-evidence", false, true)}</div>`;
  }
  return "";
}

function sceneCanAdvance(scene) {
  const current = state.identities[state.role];
  if (scene === "task" || scene === "restore-role" || scene.endsWith("complete") || scene === "inspect-result") return false;
  if (scene.endsWith("wallet")) return Boolean(state.walletPublicKey);
  if (scene.endsWith("name")) return true;
  if (scene.endsWith("key")) return Boolean(current);
  if (scene.endsWith("register")) return Boolean(current?.registered);
  if (scene === "a-knowledge") return true;
  if (scene === "a-boundary") return state.boundaryAccepted;
  if (scene === "r-b-review") return state.recoveryKeyAcknowledged;
  if (scene === "a-seal") return Boolean(state.artifact);
  if (scene === "a-create") return Boolean(state.artifact?.artifactAccount);
  if (scene === "a-recipient") return Boolean(state.grant);
  if (scene === "a-grant") return Boolean(state.grant?.signature);
  if (scene === "a-finalize") return state.finalizedRevision >= 1;
  if (scene === "b-artifact" || scene === "r-b-artifact") return Boolean(state.importedArtifact);
  if (scene === "b-open") return state.decryptedPlaintext !== null;
  if (scene === "r-b-request") return Boolean(state.reissue);
  if (scene === "r-b-submit") return Boolean(state.reissue?.requestSignature);
  if (scene === "r-a-card") return Boolean(state.importedReissue);
  if (scene === "r-a-fulfill") return state.finalizedRevision >= 2;
  if (scene === "inspect-reference") return false;
  return true;
}

function captureScene(scene) {
  if (scene.endsWith("name")) state.draftIdentityId[state.role] = $("#identity-id").value.trim();
  if (scene === "a-knowledge") state.draftKnowledge = $("#knowledge").value;
  if (scene === "a-boundary") state.boundaryAccepted = $("#boundary-accepted").checked;
  if (scene === "r-b-review") state.recoveryKeyAcknowledged = $("#recovery-key-acknowledged").checked;
  if (scene === "inspect-reference") state.draftEvidenceArtifact = $("#evidence-artifact").value.trim();
}

function renderProgress(flow, index) {
  const container = $("#chapter-progress");
  if (!state.task) { container.innerHTML = ""; return; }
  const chapters = tasks[state.task].chapters;
  container.style.setProperty("--chapter-count", chapters.length);
  const scene = flow[index];
  const identityChapter = state.task === "restore" && /^(a|b)-(wallet|name|key|register)$/.test(scene) ? 1 : null;
  const current = identityChapter ?? sceneChapters[scene] ?? 0;
  container.innerHTML = chapters.map((chapter, chapterIndex) => `<span class="${chapterIndex < current ? "complete" : chapterIndex === current ? "current" : ""}" ${chapterIndex === current ? 'aria-current="step"' : ""}><i></i><small>${chapter}</small></span>`).join("");
}

function render() {
  const flow = currentFlow();
  const scene = currentScene();
  const [kicker, title, description] = sceneCopy[scene];
  $("#stage-kicker").textContent = kicker;
  $("#stage-title").textContent = title;
  $("#scene-description").textContent = description;
  $("#journey-task").textContent = state.task ? tasks[state.task].label : "Choose a task";
  $("#scene-position").textContent = state.task ? `Step ${state.sceneIndex + 1} of ${flow.length}` : "Start";
  $("#change-task").hidden = !state.task;
  $("#scene-back").hidden = !state.task;
  $("#scene-back").disabled = !state.task;
  $("#scene-next").hidden = !state.task || !sceneCanAdvance(scene);
  $("#scene-next").disabled = !sceneCanAdvance(scene);
  $("#scene-next small").textContent = "Continue";
  $("#wallet-button").textContent = state.walletPublicKey ? short(state.walletPublicKey, 5) : "Connect wallet";
  $("#ownership-state").textContent = state.finalizedRevision >= 1 ? `{ A, B } · rev ${state.finalizedRevision}` : "{ A }";
  document.body.dataset.scene = scene;
  stage.innerHTML = sceneView(scene);
  renderProgress(flow, state.sceneIndex);
  renderLog();
  renderPersistentError();
  localize(document.querySelector(".topbar"));
  localize($("#explore-view"));
}

function startTask(task) {
  const sessionId = `session-${randomHex().slice(0, 18)}`;
  state = initialState({
    sessionId,
    createdAt: new Date().toISOString(),
    task,
    role: tasks[task].role || "originator",
  });
  if (task === "share") {
    state.draftArtifactId = randomHex();
    state.draftPolicyId = randomHex();
  }
  save();
  render();
}

function resumeSession(sessionId) {
  const stored = sessionStore.sessions[sessionId];
  if (!stored) throw new Error("The selected client session is not available in this tab.");
  state = { ...initialState(), ...stored, operations: stored.operations || {} };
  sessionStore.activeSessionId = sessionId;
  save();
  render();
}

function moveScene(offset) {
  const flow = currentFlow();
  const scene = currentScene();
  if (offset > 0) {
    captureScene(scene);
    if (!sceneCanAdvance(scene)) return;
  }
  if (offset < 0 && state.sceneIndex === 0) {
    if (state.sessionId) sessionStore.sessions[state.sessionId] = state;
    sessionStore.activeSessionId = null;
    state = initialState();
  } else {
    state.sceneIndex = Math.max(0, Math.min(flow.length - 1, state.sceneIndex + offset));
  }
  save();
  render();
  document.querySelector(".journey-shell").scrollIntoView({ behavior: "smooth", block: "start" });
}

function viewFromHash() {
  const hash = window.location.hash;
  if (hash === "#explore") return "explore";
  if (hash === "#home" || hash === "") return "home";
  if (hash === "#white-paper" || hash.startsWith("#paper-")) return "paper";
  return "home";
}

function setView(view, { updateHash = true, scroll = true } = {}) {
  const next = ["home", "paper", "explore"].includes(view) ? view : "home";
  document.body.dataset.view = next;
  for (const name of ["home", "paper", "explore"]) {
    const section = $(`#${name}-view`);
    section.hidden = name !== next;
  }
  document.querySelectorAll("[data-view-target]").forEach((control) => {
    const active = control.dataset.viewTarget === next;
    if (active) control.setAttribute("aria-current", "page");
    else control.removeAttribute("aria-current");
  });
  if (updateHash) window.history.pushState(null, "", next === "paper" ? "#white-paper" : `#${next}`);
  if (scroll) {
    window.scrollTo({ top: 0, behavior: "auto" });
    window.requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: "auto" }));
  }
  if (next === "explore") render();
}

async function generateIdentity() {
  const identityId = (state.draftIdentityId[state.role] || (state.role === "originator" ? "originator-a" : "recipient-b")).trim();
  if (!/^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/.test(identityId)) throw new Error("Use a short protocol identity with letters, numbers, dot, colon, dash, or underscore.");
  const keys = await generateEncryptionIdentity(1);
  state.identities[state.role] = { ...keys, identityId, walletPublicKey: state.walletPublicKey };
}

async function registerIdentity() {
  const provider = await requireWallet();
  const current = identity();
  current.walletPublicKey = provider.publicKey.toString();
  const operationKind = `register-${state.role}`;
  const operationId = frozenOperation(operationKind).operationId;
  const message = messages.register(operationId, current.identityId, current.walletPublicKey, current.publicKeyBase64, current.keyVersion);
  await api("/v1/identities", { method: "POST", body: JSON.stringify({ operation_id: operationId, identity_id: current.identityId, wallet_public_key: current.walletPublicKey, encryption_public_key: current.publicKeyBase64, encryption_key_version: current.keyVersion, authorization: await authorize(message) }) });
  current.registered = true;
  setOperationStage(operationKind, "reconciled");
}

async function prepareArtifact() {
  const current = identity("originator");
  assertWallet(current);
  const artifactId = state.draftArtifactId.trim().toLowerCase();
  const policyId = state.draftPolicyId.trim().toLowerCase();
  const epoch = 1;
  const encrypted = await encryptKnowledge(state.draftKnowledge, artifactId, policyId, epoch);
  const envelopeContext = { artifactId, policyId, epoch, plaintextCommitment: encrypted.plaintextCommitment, ciphertextSha256: encrypted.ciphertextSha256, contentNonceBase64: encrypted.contentNonceBase64, recipientIdentityId: current.identityId, recipientKeyVersion: current.keyVersion, envelopeRevision: 0 };
  const envelope = await sealContentKey(current.publicKeyBase64, encrypted.contentKeyBase64, envelopeContext);
  const operationId = frozenOperation("artifact").operationId;
  const message = messages.artifact(operationId, current.identityId, artifactId, policyId, epoch, encrypted.ciphertextSha256, envelope.envelopeSha256);
  await api("/v1/artifacts", { method: "POST", body: JSON.stringify({ operation_id: operationId, artifact_version_id: artifactId, originator_id: current.identityId, policy_id: policyId, encryption_epoch: epoch, ciphertext_base64: encrypted.ciphertextBase64, ciphertext_sha256: encrypted.ciphertextSha256, originator_envelope_base64: envelope.envelopeBase64, originator_envelope_sha256: envelope.envelopeSha256, authorization: await authorize(message) }) });
  state.artifact = { ...encrypted, ...envelope, artifactId, policyId, epoch, originatorIdentityId: current.identityId, operationId };
  setOperationStage("artifact", "prepared");
}

async function initializeDevnet() {
  if (!confirm("Create this artifact account on public Solana Devnet? Your wallet will show the network fee and rent before approval.")) throw new Error("Devnet initialization cancelled.");
  const provider = await requireWallet();
  const artifact = state.artifact;
  const built = await buildInitializeInstruction({ walletPublicKey: provider.publicKey.toString(), artifactId: artifact.artifactId, policyId: artifact.policyId, epoch: artifact.epoch, ciphertextSha256: artifact.ciphertextSha256, originatorEnvelopeSha256: artifact.envelopeSha256, operationId: artifact.operationId, apiBase: location.origin });
  artifact.initializeSignature = await submitAndFinalize(provider, built.instruction, undefined, {
    onSubmitted: async ({ signature }) => setOperationStage("artifact", "submitted", { transactionSignature: signature }),
  });
  artifact.artifactAccount = built.artifactAccount;
  setOperationStage("artifact", "finalized", { transactionSignature: artifact.initializeSignature });
}

async function prepareGrant() {
  const originator = identity("originator");
  assertWallet(originator);
  if (!state.artifact) throw new Error("Prepare the encrypted artifact first.");
  const recipient = await parseCard($("#recipient-card").value, "ca2-kep-public-identity/v1");
  const artifact = state.artifact;
  const context = { artifactId: artifact.artifactId, policyId: artifact.policyId, epoch: artifact.epoch, plaintextCommitment: artifact.plaintextCommitment, ciphertextSha256: artifact.ciphertextSha256, contentNonceBase64: artifact.contentNonceBase64, recipientIdentityId: recipient.identityId, recipientKeyVersion: recipient.keyVersion, envelopeRevision: 1 };
  const envelope = await sealContentKey(recipient.encryptionPublicKey, artifact.contentKeyBase64, context);
  const operationId = frozenOperation("grant").operationId;
  const message = messages.grant(operationId, artifact.artifactId, originator.identityId, recipient.identityId, 0, envelope.envelopeSha256);
  await api("/v1/grants", { method: "POST", body: JSON.stringify({ operation_id: operationId, artifact_version_id: artifact.artifactId, originator_id: originator.identityId, recipient_id: recipient.identityId, expected_revision: 0, recipient_envelope_base64: envelope.envelopeBase64, recipient_envelope_sha256: envelope.envelopeSha256, knowledge_consideration_lamports: 0, authorization: await authorize(message) }) });
  state.grant = { ...envelope, operationId, recipient };
  setOperationStage("grant", "prepared");
}

async function submitGrant() {
  if (!confirm("Add B as a co-owner on public Solana Devnet? A remains an owner and your wallet will show network cost.")) throw new Error("Grant transaction cancelled.");
  const provider = await requireWallet();
  const built = await buildGrantInstruction({ walletPublicKey: provider.publicKey.toString(), recipientWalletPublicKey: state.grant.recipient.walletPublicKey, recipientEncryptionPublicKey: state.grant.recipient.encryptionPublicKey, artifactId: state.artifact.artifactId, recipientEnvelopeSha256: state.grant.envelopeSha256, expectedRevision: 0, operationId: state.grant.operationId });
  state.grant.signature = await submitAndFinalize(provider, built.instruction, undefined, {
    onSubmitted: async ({ signature }) => setOperationStage("grant", "submitted", { transactionSignature: signature }),
  });
  state.artifact.artifactAccount = built.artifactAccount;
  setOperationStage("grant", "finalized", { transactionSignature: state.grant.signature });
}

async function finalizeGrant() {
  const result = await api(`/v1/grants/${encodeURIComponent(state.grant.operationId)}/finalize`, { method: "POST", body: JSON.stringify({ transaction_signature: state.grant.signature, artifact_account: state.artifact.artifactAccount }) });
  state.finalizedRevision = result.revision;
  setOperationStage("grant", "reconciled", { revision: result.revision });
}

async function openAccess() {
  const recipient = identity("recipient");
  assertWallet(recipient);
  const artifact = state.importedArtifact;
  if (!artifact) throw new Error("Load A’s public artifact card first.");
  const current = await api(`/v1/artifacts/${encodeURIComponent(artifact.artifactId)}`);
  const revision = current.revision;
  const message = messages.access(artifact.artifactId, recipient.identityId, revision);
  const access = await api(`/v1/artifacts/${encodeURIComponent(artifact.artifactId)}/access`, { method: "POST", body: JSON.stringify({ requester_id: recipient.identityId, authorization: await authorize(message) }) });
  if (await sha256Hex(base64ToBytes(access.ciphertext_base64)) !== access.ciphertext_sha256) {
    const error = new Error("Returned ciphertext commitment does not match.");
    error.code = "ciphertext_commitment_mismatch";
    error.effectStatus = "none";
    throw error;
  }
  const keys = state.reissue?.replacementKeys && revision >= 2 ? state.reissue.replacementKeys : recipient;
  const context = { artifactId: artifact.artifactId, policyId: artifact.policyId, epoch: artifact.epoch, plaintextCommitment: artifact.plaintextCommitment, ciphertextSha256: access.ciphertext_sha256, contentNonceBase64: artifact.contentNonceBase64, recipientIdentityId: recipient.identityId, recipientKeyVersion: keys.keyVersion, envelopeRevision: revision };
  const contentKey = await openContentKey(access.recipient_envelope_base64, keys.privateKeyBase64, context);
  const plaintext = await decryptKnowledge(access.ciphertext_base64, contentKey, artifact);
  if (await sha256Hex(new Uint8Array([...encoder.encode("KEP:PLAINTEXT-CONTENT:v1\0"), ...encoder.encode(plaintext)])) !== artifact.plaintextCommitment) {
    const error = new Error("Plaintext commitment does not match the artifact card.");
    error.code = "plaintext_commitment_mismatch";
    error.effectStatus = "none";
    throw error;
  }
  state.finalizedRevision = revision;
  return plaintext;
}

async function requestReissue() {
  const recipient = identity("recipient");
  assertWallet(recipient);
  const artifactId = state.importedArtifact?.artifactId;
  const revision = Number(state.finalizedRevision || 1);
  if (!artifactId) throw new Error("Load the public artifact card first.");
  const replacementKeys = await generateEncryptionIdentity(recipient.keyVersion + 1);
  const operationId = frozenOperation("reissue").operationId;
  const message = messages.reissueRequest(operationId, artifactId, recipient.identityId, recipient.keyVersion, replacementKeys.publicKeyBase64, replacementKeys.keyVersion, revision);
  await api("/v1/reissues", { method: "POST", body: JSON.stringify({ operation_id: operationId, artifact_version_id: artifactId, recipient_id: recipient.identityId, previous_key_version: recipient.keyVersion, replacement_public_key: replacementKeys.publicKeyBase64, replacement_key_version: replacementKeys.keyVersion, expected_revision: revision, authorization: await authorize(message) }) });
  state.reissue = { operationId, artifactId, expectedRevision: revision, replacementKeys };
  setOperationStage("reissue", "prepared");
}

async function submitReissueRequest() {
  if (!confirm("Record B’s reissue request on public Solana Devnet? Ownership and the current envelope remain unchanged.")) throw new Error("Reissue request transaction cancelled.");
  const provider = await requireWallet();
  const built = await buildRequestReissueInstruction({ walletPublicKey: provider.publicKey.toString(), artifactId: state.reissue.artifactId, expectedRevision: state.reissue.expectedRevision, operationId: state.reissue.operationId, replacementPublicKey: state.reissue.replacementKeys.publicKeyBase64 });
  state.reissue.requestSignature = await submitAndFinalize(provider, built.instruction, undefined, {
    onSubmitted: async ({ signature }) => setOperationStage("reissue", "submitted", { transactionSignature: signature }),
  });
  state.reissue.artifactAccount = built.artifactAccount;
  state.reissue.requestAccount = built.requestAccount;
  setOperationStage("reissue", "finalized", { transactionSignature: state.reissue.requestSignature });
}

function publicReissueCard() {
  const recipient = identity("recipient");
  const value = state.reissue;
  return { kind: "ca2-kep-public-reissue/v1", operationId: value.operationId, artifactId: value.artifactId, expectedRevision: value.expectedRevision, recipientIdentityId: recipient.identityId, recipientWalletPublicKey: recipient.walletPublicKey, replacementPublicKey: value.replacementKeys.publicKeyBase64, replacementKeyVersion: value.replacementKeys.keyVersion, requestSignature: value.requestSignature, artifactAccount: value.artifactAccount, network: "solana-devnet", programId: PROGRAM_ID };
}

async function fulfillReissue() {
  const originator = identity("originator");
  assertWallet(originator);
  const request = state.importedReissue;
  const artifact = state.artifact;
  const provider = await requireWallet();
  let pending = state.pendingFulfillment;
  if (pending && pending.requestOperationId !== request.operationId) {
    const error = new Error("A different reissue fulfillment is already saved in this browser session.");
    error.code = "pending_fulfillment_mismatch";
    error.effectStatus = "none";
    throw error;
  }
  if (!pending) {
    if (!confirm("Fulfil B’s reissue on public Solana Devnet? This replaces only B’s envelope and advances the revision.")) throw new Error("Reissue fulfillment cancelled.");
    const context = { artifactId: artifact.artifactId, policyId: artifact.policyId, epoch: artifact.epoch, plaintextCommitment: artifact.plaintextCommitment, ciphertextSha256: artifact.ciphertextSha256, contentNonceBase64: artifact.contentNonceBase64, recipientIdentityId: request.recipientIdentityId, recipientKeyVersion: request.replacementKeyVersion, envelopeRevision: request.expectedRevision + 1 };
    const envelope = await sealContentKey(request.replacementPublicKey, artifact.contentKeyBase64, context);
    const fulfillOperationId = frozenOperation("fulfill-reissue").operationId;
    const built = await buildFulfillReissueInstruction({ walletPublicKey: provider.publicKey.toString(), recipientWalletPublicKey: request.recipientWalletPublicKey, artifactId: request.artifactId, expectedRevision: request.expectedRevision, fulfillOperationId, replacementEnvelopeSha256: envelope.envelopeSha256 });
    const message = messages.reissueFulfill(request.operationId, request.artifactId, originator.identityId, request.recipientIdentityId, request.expectedRevision, envelope.envelopeSha256);
    pending = {
      requestOperationId: request.operationId,
      fulfillOperationId,
      artifactId: request.artifactId,
      expectedRevision: request.expectedRevision,
      recipientWalletPublicKey: request.recipientWalletPublicKey,
      originatorIdentityId: originator.identityId,
      envelope,
      artifactAccount: built.artifactAccount,
      authorization: await authorize(message),
      transactionSignature: null,
      stage: "prepared",
    };
    state.pendingFulfillment = pending;
    save();
  }
  if (!pending.transactionSignature) {
    const built = await buildFulfillReissueInstruction({ walletPublicKey: provider.publicKey.toString(), recipientWalletPublicKey: pending.recipientWalletPublicKey, artifactId: pending.artifactId, expectedRevision: pending.expectedRevision, fulfillOperationId: pending.fulfillOperationId, replacementEnvelopeSha256: pending.envelope.envelopeSha256 });
    pending.transactionSignature = await submitAndFinalize(provider, built.instruction, undefined, {
      onSubmitted: async ({ signature }) => {
        pending.transactionSignature = signature;
        pending.stage = "submitted";
        setOperationStage("fulfill-reissue", "submitted", { transactionSignature: signature });
        save();
      },
    });
    pending.stage = "finalized";
    setOperationStage("fulfill-reissue", "finalized", { transactionSignature: pending.transactionSignature });
    save();
  } else if (pending.stage !== "finalized" && pending.stage !== "reconciled") {
    await verifyFinalizedSignature(pending.transactionSignature);
    pending.stage = "finalized";
    setOperationStage("fulfill-reissue", "finalized", { transactionSignature: pending.transactionSignature });
    save();
  }
  pending.stage = "hosted_reconciliation";
  save();
  let result;
  try {
    result = await api(`/v1/reissues/${encodeURIComponent(request.operationId)}/fulfill`, { method: "POST", body: JSON.stringify({ originator_id: pending.originatorIdentityId, replacement_envelope_base64: pending.envelope.envelopeBase64, replacement_envelope_sha256: pending.envelope.envelopeSha256, transaction_signature: pending.transactionSignature, artifact_account: pending.artifactAccount, authorization: pending.authorization }) });
  } catch (error) {
    error.transactionSignature = pending.transactionSignature;
    error.stage = "hosted_finality_reconciliation";
    error.effectStatus = "unknown";
    error.retryDisposition = "inspect_before_retry";
    throw error;
  }
  pending.stage = "reconciled";
  pending.revision = result.revision;
  state.finalizedRevision = result.revision;
  setOperationStage("fulfill-reissue", "reconciled", { revision: result.revision });
  save();
}

stage.addEventListener("click", async (event) => {
  const button = event.target.closest("button");
  if (!button) return;
  if (button.dataset.task) { startTask(button.dataset.task); return; }
  if (button.dataset.session) { resumeSession(button.dataset.session); return; }
  if (button.dataset.recoveryRole) {
    state.recoveryRole = button.dataset.recoveryRole;
    state.role = button.dataset.recoveryRole;
    state.sceneIndex = 1;
    save();
    render();
    return;
  }
  const action = button.dataset.action;
  try {
    if (action === "connect-wallet") await connectWallet();
    if (action === "generate-identity") await run("Encryption identity generated locally", generateIdentity, { operationKind: "generate_encryption_identity", stage: "client_cryptography" });
    if (action === "register-identity") await run("Identity registered with wallet authorization", registerIdentity, { operationKind: "register_identity", stage: "hosted_identity_registration" });
    if (action === "export-preflight") download(`${state.sessionId}-public-preflight.json`, await publicPreflightCard());
    if (action === "copy-preflight") await navigator.clipboard.writeText(JSON.stringify(await publicPreflightCard(), null, 2)).then(() => notify("Public preflight copied"));
    if (action === "export-identity") download(`${identity().identityId}-public.json`, await withCardDigest(publicIdentityCard(identity())));
    if (action === "copy-identity") await navigator.clipboard.writeText(JSON.stringify(await withCardDigest(publicIdentityCard(identity())), null, 2)).then(() => notify("Public identity card copied"));
    if (action === "prepare-artifact") await run("Knowledge encrypted and artifact prepared", prepareArtifact, { operationKind: "prepare_artifact", stage: "hosted_artifact_preparation" });
    if (action === "initialize-devnet") await run("Artifact account finalized on Devnet", initializeDevnet, { operationKind: "initialize_artifact", stage: "devnet_submission", mayHaveEffect: true });
    if (action === "export-artifact") download(`${state.artifact.artifactId}-public.json`, await withCardDigest(publicArtifactCard()));
    if (action === "copy-artifact") await navigator.clipboard.writeText(JSON.stringify(await withCardDigest(publicArtifactCard()), null, 2)).then(() => notify("Public artifact card copied"));
    if (action === "prepare-grant") await run("Recipient envelope and pending grant prepared", prepareGrant, { operationKind: "prepare_grant", stage: "hosted_grant_preparation" });
    if (action === "submit-grant") await run("Co-ownership grant finalized on Devnet", submitGrant, { operationKind: "grant_co_ownership", stage: "devnet_submission", mayHaveEffect: true });
    if (action === "finalize-grant") await run("Service activated finalized recipient access", finalizeGrant, { operationKind: "finalize_grant", stage: "hosted_finality_reconciliation", mayHaveEffect: true, transactionSignature: state.grant?.signature });
    if (action === "load-artifact-card") { state.importedArtifact = await parseCard($("#artifact-card").value, "ca2-kep-public-artifact/v1"); save(); render(); notify("Artifact card loaded"); }
    if (action === "open-access") {
      const plaintext = await run("Recipient decrypted the exact artifact locally", openAccess, { operationKind: "open_access", stage: "recipient_access" });
      state.decryptedPlaintext = plaintext;
      save();
      render();
    }
    if (action === "request-reissue") await run("Replacement key and signed reissue request prepared", requestReissue, { operationKind: "prepare_reissue", stage: "hosted_reissue_preparation" });
    if (action === "submit-reissue-request") await run("Reissue request finalized on Devnet", submitReissueRequest, { operationKind: "request_reissue", stage: "devnet_submission", mayHaveEffect: true });
    if (action === "export-reissue") download(`${state.reissue.operationId}-public.json`, await withCardDigest(publicReissueCard()));
    if (action === "copy-reissue") await navigator.clipboard.writeText(JSON.stringify(await withCardDigest(publicReissueCard()), null, 2)).then(() => notify("Public reissue card copied"));
    if (action === "load-reissue-card") { state.importedReissue = await parseCard($("#reissue-card").value, "ca2-kep-public-reissue/v1"); save(); render(); notify("Reissue card loaded"); }
    if (action === "fulfill-reissue") await run("Reissue finalized; owners and epoch preserved", fulfillReissue, { operationKind: "fulfill_reissue", stage: "devnet_submission", mayHaveEffect: true });
    if (action === "continue-restore-a") { state.task = "restore"; state.recoveryRole = "originator"; state.role = "originator"; state.sceneIndex = 5; save(); render(); }
    if (action === "continue-restore-b") { state.task = "restore"; state.recoveryRole = "recipient"; state.role = "recipient"; state.sceneIndex = 5; save(); render(); }
    if (action === "continue-open-b") { state.task = "receive"; state.recoveryRole = null; state.role = "recipient"; state.sceneIndex = 6; save(); render(); }
    if (action === "inspect-state") {
      state.draftEvidenceArtifact = $("#evidence-artifact").value.trim();
      if (!isArtifactVersionId(state.draftEvidenceArtifact)) {
        notify("Enter a 64-character hexadecimal artifact version ID.", true);
        return;
      }
      const value = await run("Current public projection retrieved", () => api(`/v1/artifacts/${encodeURIComponent(state.draftEvidenceArtifact)}`));
      state.evidenceResult = value;
      state.finalizedRevision = value.revision;
      state.sceneIndex = 1;
      save();
      render();
    }
    if (action === "export-evidence") download("kep-local-activity.json", { kind: "ca2-kep-local-activity/v1", programId: PROGRAM_ID, activity: state.activity, authorityEffect: "none" });
    if (action === "go-evidence") {
      const artifactId = state.importedArtifact?.artifactId || state.artifact?.artifactId || "";
      startTask("inspect");
      state.draftEvidenceArtifact = artifactId;
      save();
      render();
    }
  } catch (error) {
    if (!error?.__ca2Reported) {
      await recordClientError(error, { operationKind: action || "client_interface" });
    }
  }
});

stage.addEventListener("input", (event) => {
  if (event.target.id !== "evidence-artifact") return;
  state.draftEvidenceArtifact = event.target.value.trim();
  state.evidenceResult = null;
  const valid = isArtifactVersionId(state.draftEvidenceArtifact);
  event.target.toggleAttribute("aria-invalid", Boolean(state.draftEvidenceArtifact) && !valid);
  const inspectButton = stage.querySelector('[data-action="inspect-state"]');
  if (inspectButton) {
    inspectButton.disabled = !valid;
    inspectButton.setAttribute("aria-disabled", String(!valid));
  }
  $("#scene-next").hidden = true;
  $("#scene-next").disabled = true;
  save();
});

stage.addEventListener("change", (event) => {
  if (event.target.dataset.cardTarget) {
    const file = event.target.files?.[0];
    if (!file) return;
    file.text().then((value) => {
      const target = document.getElementById(event.target.dataset.cardTarget);
      if (target) target.value = value;
    }).catch(() => notify("The selected card could not be read.", true));
    return;
  }
  if (!["boundary-accepted", "recovery-key-acknowledged"].includes(event.target.id)) return;
  if (event.target.id === "boundary-accepted") state.boundaryAccepted = event.target.checked;
  if (event.target.id === "recovery-key-acknowledged") state.recoveryKeyAcknowledged = event.target.checked;
  save();
  const allowed = sceneCanAdvance(currentScene());
  $("#scene-next").hidden = !allowed;
  $("#scene-next").disabled = !allowed;
});

$("#scene-back").addEventListener("click", () => moveScene(-1));
$("#scene-next").addEventListener("click", () => moveScene(1));
$("#change-task").addEventListener("click", () => {
  if (state.sessionId) sessionStore.sessions[state.sessionId] = state;
  sessionStore.activeSessionId = null;
  state = initialState();
  save();
  render();
});

document.addEventListener("click", (event) => {
  const control = event.target.closest("[data-view-target]");
  if (!control) return;
  event.preventDefault();
  setView(control.dataset.viewTarget);
});

window.addEventListener("hashchange", () => setView(viewFromHash(), { updateHash: false, scroll: false }));

$("#wallet-button").addEventListener("click", () => connectWallet().catch((error) => notify(error.message, true)));
$("#clear-session").addEventListener("click", () => {
  if (!state.sessionId) return;
  if (!confirm("Clear this exact session’s encryption keys, frozen operations, and unfinished exchange state? Public Solana and hosted records are not deleted. This cannot be undone.")) return;
  delete sessionStore.sessions[state.sessionId];
  sessionStore.activeSessionId = null;
  state = initialState();
  save();
  render();
  notify("Exact client session cleared");
});
$("#copy-log").addEventListener("click", () => navigator.clipboard.writeText(state.activity.map((item) => `${item.at} ${item.message}`).join("\n")).then(() => notify("Activity copied")));
$("#dismiss-error").addEventListener("click", () => {
  state.activeError = null;
  save();
  renderPersistentError();
});
$("#copy-error-id").addEventListener("click", () => {
  if (!state.activeError) return;
  navigator.clipboard.writeText(state.activeError.attemptId).then(() => notify("Error ID copied"));
});
$("#inspect-error-id").addEventListener("click", async () => {
  if (!state.activeError) return;
  try {
    state.activeError.attemptProjection = await api(`/v1/client-errors/${encodeURIComponent(state.activeError.attemptId)}`);
    save();
    renderPersistentError();
  } catch (error) {
    notify(error.message, true);
  }
});

api("/health").then(() => {
  $("#service-status").textContent = translate("Service online");
  $("#service-status").classList.add("online");
  void flushPendingErrorEvents();
}).catch(() => {
  $("#service-status").textContent = translate("Service unavailable");
  $("#service-status").classList.add("offline");
});

window.addEventListener("error", (event) => {
  if (event.error?.__ca2Reported) return;
  void recordClientError(event.error || new Error(event.message), { operationKind: "browser_runtime", stage: "client_runtime" });
});
window.addEventListener("unhandledrejection", (event) => {
  if (event.reason?.__ca2Reported) return;
  void recordClientError(event.reason || new Error("Unhandled browser rejection"), { operationKind: "browser_runtime", stage: "client_runtime" });
});

function startOrbMotion() {
  const video = $("#home-orb-motion");
  const frozen = document.querySelector(".home-orb-still");
  if (!video || !frozen || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const loadMotion = () => {
    if (video.dataset.loading === "true") return;
    video.dataset.loading = "true";
    const source = document.createElement("source");
    source.src = video.dataset.src;
    source.type = "video/webm";
    video.append(source);
    video.addEventListener("canplay", () => {
      video.play().then(() => {
        window.requestAnimationFrame(() => {
          video.classList.add("is-active");
          video.parentElement.classList.add("has-motion");
        });
      }).catch(() => {});
    }, { once: true });
    video.load();
  };

  if (frozen.complete) window.requestAnimationFrame(loadMotion);
  else frozen.addEventListener("load", () => window.requestAnimationFrame(loadMotion), { once: true });
}

initializeLocale();
render();
setView(viewFromHash(), { updateHash: false, scroll: !window.location.hash.startsWith("#paper-") });
startOrbMotion();
