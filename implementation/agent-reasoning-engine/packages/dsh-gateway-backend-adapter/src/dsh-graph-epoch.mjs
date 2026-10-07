import {randomBytes} from "node:crypto";

import {canonicalJson, sha256} from "./dsh-graph-manifest.mjs";

export const DSH_GRAPH_CONTROL_SYMBOL = Symbol.for("are.dsh-graph-control/v1");
export const DSH_GRAPH_EPOCH_SCHEMA = "are.dsh-graph-epoch/v1";
export const DSH_GRAPH_QUALIFICATION_RECEIPT_SCHEMA =
  "are.dsh-graph-qualification-receipt/v1";

const SERVING_STATE = "qualified";
const BOOTSTRAP_KINDS = new Set(["loader", "isolate"]);
const RESOLUTION_BASE_CLASSES = new Set(["entry-tree", "host-config", "host-installed"]);
const TERMINAL_STATES = new Set(["revoked", "stopping", "stopped"]);

export class DshGraphEpochError extends Error {
  constructor(code, message = code) {
    super(message);
    this.name = "DshGraphEpochError";
    this.code = code;
  }
}

function fail(code, message) {
  throw new DshGraphEpochError(code, message);
}

function plain(value, code) {
  if (value === null || typeof value !== "object" || Array.isArray(value)) fail(code);
  return value;
}

function immutable(value) {
  if (Array.isArray(value)) {
    value.forEach(immutable);
    return Object.freeze(value);
  }
  if (value && typeof value === "object") {
    Object.values(value).forEach(immutable);
    return Object.freeze(value);
  }
  return value;
}

function boundedLabel(value, fallback = "unknown") {
  return typeof value === "string" && value.length > 0
    ? value.slice(0, 160)
    : fallback;
}

function same(left, right) {
  return canonicalJson(left) === canonicalJson(right);
}

function normalizeExpectedDelta(value) {
  plain(value, "epoch.agent-delta-invalid");
  if (!Number.isSafeInteger(value.active_fiber_count) || value.active_fiber_count < 0) {
    fail("epoch.agent-delta-invalid");
  }
  plain(value.counts, "epoch.agent-delta-invalid");
  for (const count of Object.values(value.counts)) {
    if (!Number.isSafeInteger(count) || count < 0) fail("epoch.agent-delta-invalid");
  }
  return immutable(structuredClone(value));
}

function publicImportRecord(record) {
  return immutable({
    entry_id: boundedLabel(record.entry_id),
    parent_entry_ids: [...(record.parent_entry_ids ?? [])].map((value) => boundedLabel(value)),
    specifier: boundedLabel(record.specifier),
    base_class: boundedLabel(record.base_class),
    source_selector: boundedLabel(record.source_selector),
    package_name: boundedLabel(record.package_name),
    package_version: boundedLabel(record.package_version),
    relative_path: boundedLabel(record.relative_path),
    byte_count: record.byte_count,
    sha256: record.sha256,
    builtin: Boolean(record.builtin),
  });
}

function activeFibers(rootCtx) {
  const rows = [];
  for (const runtime of rootCtx.registry.values()) {
    for (const fiber of runtime.fibers) {
      if (fiber.uid !== null) rows.push(fiber);
    }
  }
  return rows;
}

export class DshGraphEpochController {
  #state = "new";
  #epoch = 0;
  #rootCtx;
  #bootNonce;
  #sourcePinIndex;
  #manifestIdentity;
  #fingerprintProvider;
  #expectedFingerprints;
  #qualificationObserver;
  #constructionAuthority;
  #bootstrap = new Map();
  #callbackImports = new WeakMap();
  #fiberProvenance = new WeakMap();
  #publicProvenance = new Map();
  #firstRevocation;
  #laterRevocationCount = 0;
  #window;
  #receipt;

  constructor(options) {
    plain(options, "epoch.options-invalid");
    if (!options.source_pin_index || typeof options.source_pin_index.lookup !== "function") {
      fail("epoch.source-index-invalid");
    }
    this.#sourcePinIndex = options.source_pin_index;
    this.#manifestIdentity = immutable({
      manifest_id: boundedLabel(options.manifest_id),
      material_digest: boundedLabel(options.material_digest),
      package_set_sha256: boundedLabel(options.package_set_sha256),
      source_pin_count: options.source_pin_count,
    });
    if (!/^[0-9a-f]{64}$/u.test(this.#manifestIdentity.material_digest)
      || !/^[0-9a-f]{64}$/u.test(this.#manifestIdentity.package_set_sha256)
      || !Number.isSafeInteger(this.#manifestIdentity.source_pin_count)
      || this.#manifestIdentity.source_pin_count < 1) {
      fail("epoch.manifest-identity-invalid");
    }
    this.#bootNonce = options.boot_nonce ?? randomBytes(16).toString("hex");
    if (!/^[0-9a-f]{32}$/u.test(this.#bootNonce)) fail("epoch.boot-nonce-invalid");
    this.#fingerprintProvider = options.fingerprint_provider;
    if (typeof this.#fingerprintProvider !== "function") fail("epoch.fingerprint-provider-invalid");
    this.#expectedFingerprints = immutable(structuredClone(
      plain(options.expected_fingerprints, "epoch.fingerprints-invalid"),
    ));
    this.#qualificationObserver = options.qualification_observer;
    if (typeof this.#qualificationObserver !== "function") {
      fail("epoch.qualification-observer-invalid");
    }
    this.#constructionAuthority = options.agent_construction_authority;
  }

  get state() {
    return this.#state;
  }

  get epoch() {
    return this.#epoch;
  }

  install(rootCtx) {
    if (this.#state !== "new" || this.#rootCtx !== undefined) fail("epoch.install-duplicate");
    if (!rootCtx || rootCtx.root !== rootCtx || rootCtx.fiber?.uid !== 0) {
      fail("epoch.install-root-invalid");
    }
    if (rootCtx[DSH_GRAPH_CONTROL_SYMBOL] !== undefined) fail("epoch.install-owner-present");
    if (rootCtx.registry?.size !== 0) fail("epoch.install-late");
    Object.defineProperty(rootCtx, DSH_GRAPH_CONTROL_SYMBOL, {
      value: this,
      configurable: false,
      enumerable: false,
      writable: false,
    });
    this.#rootCtx = rootCtx;
    this.#state = "capturing-boot";
    return this.snapshot();
  }

  authorizeBootstrap(kind, callback) {
    if (this.#state !== "capturing-boot") fail("epoch.bootstrap-state-invalid");
    if (!BOOTSTRAP_KINDS.has(kind) || typeof callback !== "function") {
      fail("epoch.bootstrap-invalid");
    }
    if (this.#bootstrap.has(kind)) fail("epoch.bootstrap-duplicate");
    if ([...this.#bootstrap.values()].some((row) => row.callback === callback)) {
      fail("epoch.bootstrap-callback-reused");
    }
    this.#bootstrap.set(kind, {callback, consumed: false});
  }

  bindImportedCallback(callback, importRecord) {
    if (typeof callback !== "function") fail("epoch.import-callback-invalid");
    if (this.#state !== "capturing-boot" && this.#state !== "checking-agent") {
      fail("epoch.import-state-invalid");
    }
    plain(importRecord, "epoch.import-record-invalid");
    if (!RESOLUTION_BASE_CLASSES.has(importRecord.base_class)) {
      fail("epoch.import-base-invalid");
    }
    let pin;
    if (importRecord.builtin) {
      pin = this.#sourcePinIndex.builtin(importRecord.specifier);
    } else {
      pin = this.#sourcePinIndex.lookup(importRecord.resolved_url);
    }
    if (!pin) fail("epoch.import-source-unpinned");
    const bound = publicImportRecord({...importRecord, ...pin});
    const previous = this.#callbackImports.get(callback);
    if (previous !== undefined) {
      if (!same(previous, bound)) fail("epoch.import-callback-conflict");
      return previous;
    }
    this.#callbackImports.set(callback, bound);
    return bound;
  }

  beforeRegistration({ctx, callback, runtime_name}) {
    if (typeof callback !== "function" || !ctx?.fiber) fail("epoch.registration-invalid");
    if (TERMINAL_STATES.has(this.#state)) fail("epoch.registration-not-serving");
    if (this.#state === SERVING_STATE) {
      this.revoke("mutation.registry-plugin", {kind: "registry.plugin"});
      fail("epoch.registration-not-serving");
    }
    const parent = ctx.fiber;
    let basis;
    const bootstrap = [...this.#bootstrap.entries()]
      .find(([, row]) => row.callback === callback);
    if (bootstrap !== undefined) {
      const [kind, row] = bootstrap;
      if (row.consumed) fail("epoch.bootstrap-reused");
      if ((kind === "loader" && parent.uid !== 0)
        || (kind === "isolate" && this.#fiberProvenance.get(parent)?.bootstrap_kind !== "loader")) {
        fail("epoch.bootstrap-parent-invalid");
      }
      row.consumed = true;
      basis = {bootstrap_kind: kind};
    } else {
      const imported = this.#callbackImports.get(callback);
      const parentRecord = this.#fiberProvenance.get(parent);
      if (imported !== undefined) basis = {import_record: imported};
      else if (parentRecord !== undefined) basis = {parent_record: parentRecord};
      else fail(parent.uid === 0
        ? "epoch.registration-unknown-root"
        : "epoch.registration-parent-unbound");
    }
    return {
      callback,
      parent,
      runtime_name: boundedLabel(runtime_name, "<unnamed>"),
      basis,
      committed: false,
    };
  }

  commitRegistration(fiber, token) {
    if (!token || token.committed || fiber?.uid === null || fiber?.parent?.fiber !== token.parent) {
      fail("epoch.registration-commit-invalid");
    }
    let chain;
    let publicRecord;
    if (token.basis.bootstrap_kind !== undefined) {
      chain = ["bootstrap", token.basis.bootstrap_kind];
      publicRecord = {bootstrap_kind: token.basis.bootstrap_kind};
    } else if (token.basis.import_record !== undefined) {
      chain = ["import", token.basis.import_record.source_selector,
        token.basis.import_record.entry_id];
      publicRecord = {source: token.basis.import_record};
    } else {
      const parentRecord = token.basis.parent_record;
      chain = [parentRecord.chain_digest, "nested", token.runtime_name];
      publicRecord = {parent_fiber_uid: token.parent.uid};
    }
    const record = immutable({
      fiber_uid: fiber.uid,
      runtime_label: token.runtime_name,
      parent_fiber_uid: token.parent.uid,
      ...publicRecord,
      chain_digest: sha256(canonicalJson(chain)),
    });
    this.#fiberProvenance.set(fiber, record);
    this.#publicProvenance.set(fiber.uid, record);
    token.committed = true;
    return record;
  }

  beforeMutation(kind, subject = "runtime") {
    const fact = {kind: boundedLabel(kind), subject: boundedLabel(subject)};
    if (this.#state === "capturing-boot") return {allowed: true, phase: this.#state};
    if (this.#state === "checking-agent") {
      this.#window.mutations.push(fact);
      return {allowed: true, phase: this.#state};
    }
    if (this.#state === "stopping" || this.#state === "stopped") {
      return {allowed: true, phase: this.#state};
    }
    if (this.#state === SERVING_STATE) this.revoke(`mutation.${fact.kind}`, fact);
    if (this.#state === "checking-host") this.revoke("mutation.during-host-check", fact);
    return {allowed: false, phase: this.#state};
  }

  revoke(reason_code, detail = {}) {
    const fact = immutable({reason_code: boundedLabel(reason_code),
      detail: {kind: boundedLabel(detail.kind), subject: boundedLabel(detail.subject)}});
    if (this.#state === "stopping" || this.#state === "stopped") return this.#firstRevocation;
    if (this.#firstRevocation === undefined) {
      this.#firstRevocation = fact;
      this.#state = "revoked";
      this.#window = undefined;
    } else {
      this.#laterRevocationCount = Math.min(255, this.#laterRevocationCount + 1);
    }
    return this.#firstRevocation;
  }

  assertCurrent() {
    if (this.#state === "stopped") fail("epoch.stopped");
    let actual;
    try {
      actual = this.#fingerprintProvider();
    } catch {
      this.revoke("fingerprint.read-failed");
      fail("epoch.fingerprint-read-failed");
    }
    if (actual && typeof actual.then === "function") {
      this.revoke("fingerprint.async-forbidden");
      fail("epoch.fingerprint-async-forbidden");
    }
    if (!same(actual, this.#expectedFingerprints)) {
      this.revoke("fingerprint.drift");
      fail("epoch.fingerprint-drift");
    }
    return immutable(structuredClone(actual));
  }

  beginAgentConstruction(expectedDelta, authority) {
    if (authority === undefined || authority !== this.#constructionAuthority) {
      fail("epoch.agent-authority-invalid");
    }
    if (this.#state !== SERVING_STATE || this.#window !== undefined) {
      if (this.#state === "checking-agent") this.revoke("agent.window-overlap");
      fail("epoch.agent-window-unavailable");
    }
    this.assertCurrent();
    const window = {
      prior_epoch: this.#epoch,
      expected_delta: normalizeExpectedDelta(expectedDelta),
      mutations: [],
      token: Object.freeze({nonce: randomBytes(16).toString("hex")}),
    };
    this.#window = window;
    this.#state = "checking-agent";
    return window.token;
  }

  commitAgentConstruction(token, actualDelta) {
    if (this.#state !== "checking-agent" || this.#window?.token !== token) {
      this.revoke("agent.window-token-invalid");
      fail("epoch.agent-window-token-invalid");
    }
    if (!same(this.#window.expected_delta, actualDelta)) {
      this.revoke("agent.delta-mismatch");
      fail("epoch.agent-delta-mismatch");
    }
    this.assertCurrent();
    this.#epoch = this.#window.prior_epoch + 1;
    this.#window = undefined;
    this.#state = SERVING_STATE;
    return this.snapshot();
  }

  abortAgentConstruction(token, reason = "agent.window-aborted") {
    if (this.#state !== "checking-agent" || this.#window?.token !== token) {
      this.revoke("agent.window-token-invalid");
    } else this.revoke(reason);
  }

  async qualifyProfile(ctx) {
    if (this.#state !== "capturing-boot" || ctx !== this.#rootCtx) {
      fail("epoch.qualification-state-invalid");
    }
    this.#state = "checking-host";
    try {
      const observation = await this.#qualificationObserver(ctx, this);
      return this.qualifyHost(observation);
    } catch (error) {
      this.revoke(error?.code ?? "qualification.failed");
      throw error;
    }
  }

  qualifyHost(observation) {
    if (this.#state !== "checking-host") fail("epoch.qualification-state-invalid");
    plain(observation, "epoch.qualification-observation-invalid");
    if (observation.ok !== true) fail("epoch.host-comparison-failed");
    this.assertCurrent();
    const fibers = activeFibers(this.#rootCtx);
    const missing = fibers.filter((fiber) => this.#fiberProvenance.get(fiber) === undefined);
    if (missing.length !== 0 || fibers.length !== this.#publicProvenance.size) {
      fail("epoch.provenance-incomplete");
    }
    const provenanceRows = [...this.#publicProvenance.values()]
      .sort((a, b) => a.fiber_uid - b.fiber_uid);
    this.#epoch = 1;
    this.#state = SERVING_STATE;
    this.#receipt = immutable({
      schema_version: DSH_GRAPH_QUALIFICATION_RECEIPT_SCHEMA,
      authority_effect: "none",
      session_admission: "not-established",
      claim_posture: "trusted-import-ancestry",
      boot_nonce: this.#bootNonce,
      epoch: this.#epoch,
      ...this.#manifestIdentity,
      host_graph_digest: observation.host_graph_digest,
      provenance_graph_digest: sha256(canonicalJson(provenanceRows)),
      state: this.#state,
    });
    return this.#receipt;
  }

  qualificationReceipt() {
    return this.#receipt;
  }

  beginStop() {
    if (this.#state === "stopped") return this.snapshot();
    if (this.#state === "new") fail("epoch.stop-before-install");
    this.#state = "stopping";
    this.#window = undefined;
    return this.snapshot();
  }

  finishStop() {
    if (this.#state !== "stopping") fail("epoch.stop-state-invalid");
    this.#state = "stopped";
    return this.snapshot();
  }

  snapshot() {
    return immutable({
      schema_version: DSH_GRAPH_EPOCH_SCHEMA,
      authority_effect: "none",
      state: this.#state,
      serving: this.#state === SERVING_STATE,
      epoch: this.#epoch,
      boot_nonce: this.#bootNonce,
      source_pin_count: this.#manifestIdentity.source_pin_count,
      active_provenance_count: this.#publicProvenance.size,
      first_revocation: this.#firstRevocation,
      later_revocation_count: this.#laterRevocationCount,
      construction_window_open: this.#window !== undefined,
    });
  }
}

export function createDshGraphEpochController(options) {
  return new DshGraphEpochController(options);
}
