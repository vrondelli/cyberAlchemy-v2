const tauri = globalThis.__TAURI__;
const invoke = tauri?.core?.invoke;
const skinNames = new Set(["verdant", "cobalt", "ember"]);
const placementNames = new Set(["top-left", "top-right", "bottom-left", "bottom-right", "center"]);
const diagnosticIssueTargets = Object.freeze({
  product: "diagnostic-product-issue",
  adapter: "diagnostic-adapter-issue",
  thread: "diagnostic-thread-issue",
  decision: "diagnostic-decision-issue",
  evolution: "diagnostic-evolution-issue",
  "evolution-signal": "diagnostic-evolution-signal-issue",
});

function applySkin(skin) {
  if (!skinNames.has(skin)) return;
  document.documentElement.dataset.skin = skin;
  for (const choice of document.querySelectorAll("[data-skin-choice]")) {
    choice.setAttribute("aria-pressed", String(choice.dataset.skinChoice === skin));
  }
}

function applyOrbPlacement(placement) {
  if (!placementNames.has(placement)) return;
  for (const choice of document.querySelectorAll("[data-orb-placement]")) {
    choice.setAttribute("aria-pressed", String(choice.dataset.orbPlacement === placement));
  }
}

async function initialisePreferences() {
  if (!invoke) return;
  let skinChanged = false;
  let placementChanged = false;
  if (tauri?.event?.listen) {
    try {
      await tauri.event.listen("are-skin-changed", event => {
        if (!skinNames.has(event.payload?.skin)) return;
        skinChanged = true;
        applySkin(event.payload.skin);
      });
    } catch { /* A saved preference read remains available without live events. */ }
    try {
      await tauri.event.listen("are-placement-changed", event => {
        if (!placementNames.has(event.payload?.orbPlacement)) return;
        placementChanged = true;
        applyOrbPlacement(event.payload.orbPlacement);
      });
    } catch { /* A saved preference read remains available without live events. */ }
  }
  try {
    const preferences = await invoke("get_preferences");
    if (!skinChanged) applySkin(preferences.skin);
    if (!placementChanged) applyOrbPlacement(preferences.orbPlacement);
  } catch { /* The UI remains usable with its bundled default skin. */ }
}

function setText(id, value) {
  const element = document.getElementById(id);
  if (element) element.textContent = String(value);
}

function validDshPlanHeadSummary(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)
    || Object.keys(value).sort().join(',') !== 'checkpointDigest,planContextDigest,planProgress,schemaVersion,selectionRelation,sources,status'
    || value.schemaVersion !== 'are.dsh-plan-head-summary/v1') return false;
  if (['not-retained', 'unavailable'].includes(value.status)) return value.checkpointDigest === null
    && value.planContextDigest === null && value.planProgress === null
    && value.sources === 'not-checked' && value.selectionRelation === 'not-checked';
  return value.status === 'checkpoint-retained'
    && ['checkpointDigest', 'planContextDigest'].every(key => typeof value[key] === 'string' && /^[0-9a-f]{64}$/u.test(value[key]))
    && validDshPlanProgress(value.planProgress)
    && ['verified-at-read', 'unverified-at-read'].includes(value.sources)
    && ['matches-startup', 'different-from-startup'].includes(value.selectionRelation);
}

function validDshInterpretationSummary(value) {
  const progress = value?.schemaVersion === 'are.dsh-objective-interpretation-summary/v2';
  return value && typeof value === "object" && !Array.isArray(value)
    && Object.keys(value).sort().join(",") === `checkpointDigest,objectiveStateDigest,planContextDigest,${progress ? 'planProgress,' : ''}requirements,schemaVersion,status`
    && ['are.dsh-objective-interpretation-summary/v1', 'are.dsh-objective-interpretation-summary/v2'].includes(value.schemaVersion)
    && (!progress || validDshPlanProgress(value.planProgress)
      && value.planContextDigest !== null && value.requirements === 'continuity-reference-retained')
    && value.status === "checkpoint-retained-no-admission-retained"
    && ["checkpointDigest", "objectiveStateDigest"]
      .every(key => typeof value[key] === "string" && /^[0-9a-f]{64}$/u.test(value[key]))
    && (value.planContextDigest === null
      || typeof value.planContextDigest === "string" && /^[0-9a-f]{64}$/u.test(value.planContextDigest))
    && ["not-selected", "continuity-reference-retained"].includes(value.requirements);
}

function validDshObjectiveCheckpointSummary(value) {
  const progress = value?.schemaVersion === 'are.dsh-objective-checkpoint-summary/v3';
  const selected = progress || value?.schemaVersion === 'are.dsh-objective-checkpoint-summary/v2';
  return value && typeof value === "object" && !Array.isArray(value)
    && Object.keys(value).sort().join(",")
      === (selected
        ? `bindingDigest,checkpointDigest,objectiveStateDigest,planContextDigest,${progress ? 'planProgress,' : ''}requirements,schemaVersion,status`
        : "bindingDigest,checkpointDigest,objectiveStateDigest,requirements,schemaVersion,status")
    && ["are.dsh-objective-checkpoint-summary/v1", "are.dsh-objective-checkpoint-summary/v2", "are.dsh-objective-checkpoint-summary/v3"].includes(value.schemaVersion)
    && (!selected
      || typeof value.planContextDigest === "string" && /^[0-9a-f]{64}$/u.test(value.planContextDigest))
    && (!progress || validDshPlanProgress(value.planProgress) && value.requirements === 'continuity-reference-retained')
    && value.status === "host-retained-reference"
    && ["checkpointDigest", "objectiveStateDigest", "bindingDigest"]
      .every(key => typeof value[key] === "string" && /^[0-9a-f]{64}$/u.test(value[key]))
    && ["not-selected", "continuity-reference-retained"].includes(value.requirements);
}

function validDshPlanProgress(value) {
  return value && typeof value === 'object' && !Array.isArray(value)
    && Object.keys(value).sort().join(',') === 'activeCount,activeSliceOrdinal,activeSliceStatus,completedCount,deferredCount,obligationCount,openCount,openDecisionCount,posture,schemaVersion'
    && value.schemaVersion === 'are.dsh-plan-progress/v1' && value.posture === 'checkpointed-declaration'
    && ['obligationCount', 'completedCount', 'openCount', 'activeCount', 'deferredCount', 'openDecisionCount', 'activeSliceOrdinal']
      .every(key => Number.isSafeInteger(value[key]) && value[key] >= 0 && value[key] <= 32)
    && value.obligationCount > 0 && value.completedCount + value.openCount + value.activeCount + value.deferredCount === value.obligationCount
    && value.activeSliceOrdinal > 0 && value.activeSliceOrdinal <= value.obligationCount
    && ['open', 'active', 'deferred'].includes(value.activeSliceStatus) && value[`${value.activeSliceStatus}Count`] > 0;
}

const SOURCE_DIAGNOSTIC_MEANINGS = Object.freeze({
  product: {
    Reading: "Checking the local product profile; previous values are not current health.",
    "Diagnostic passed": "The local product check passed; it does not test a gateway, backend, or this task.",
    "Diagnostic FAIL": "The local product check failed; inspect its product-scoped findings above.",
    Stale: "The product check has expired; an older PASS is not current health.",
    Unavailable: "The local product check could not be read; other sources retain their own status.",
  },
  adapter: {
    Reading: "Checking the selected gateway path; earlier link states are last seen.",
    Observed: "The selected gateway path responded; inspect each link state. This does not verify this task.",
    "Not configured": "No local gateway-path read is configured; product health is separate.",
    Incompatible: "The gateway-path projection has an incompatible contract; no current link state is claimed.",
    Stale: "The gateway-path reading expired; no current connection is claimed.",
    Unavailable: "The gateway-path read failed; no current connection is claimed.",
  },
  thread: {
    Reading: "Checking gateway backend-thread Reasoning State; earlier rows are last seen.",
    Observed: "Gateway backend-thread rows were observed; these are not all host tasks.",
    "No records": "No backend-thread rows were observed in this gateway process; host tasks remain unknown.",
    Attention: "The gateway reports uncertain steer or dispatch outcomes; this is not a safe-retry signal.",
    "Source changed": "The thread and adapter reads refer to different gateway epochs; their states cannot be joined.",
    "Not configured": "No bounded gateway-thread read is configured; this task's state is unknown.",
    Incompatible: "The backend-thread projection has an incompatible contract; no current state is claimed.",
    Stale: "The backend-thread reading expired; old active phases are historical only.",
    Unavailable: "The backend-thread read failed; current Reasoning State is unknown.",
  },
  decision: {
    Reading: "Checking bounded evaluations for current gateway consumers; earlier records are last seen.",
    Observed: "The gateway reported backend-thread evaluations; file-backed consumers may include recovered records. These are not complete host decisions or effects.",
    "No records": "No backend-thread evaluations were observed for current gateway consumers; host history remains unknown.",
    "No matching records": "No evaluation for the selected backend thread appears in this bounded view; older records may be omitted.",
    "Source changed": "The selected thread and decision readings came from different gateway epochs; their records cannot be joined.",
    "Not configured": "No bounded gateway-decision read is configured.",
    Incompatible: "The decision projection has an incompatible contract; no current history is claimed.",
    Stale: "The gateway decision reading expired; older evaluations are not current.",
    Unavailable: "The gateway decision read failed; host decision history remains unknown.",
  },
  evolution: {
    Reading: "Checking bundled candidate definitions and, when configured, the explicit Evolution root; earlier ledger values are last seen.",
    "Registry only": "Bundled candidate definitions were read. No runtime root is configured, so no cycle or worker state was observed.",
    "Verified ledger": "The durable Evolution ledger was verified; this does not prove a worker is executing now.",
    "Invalid evidence": "Evolution ledger evidence did not verify; no cycle outcome is claimed.",
    "Invalid registry": "The bundled candidate-definition registry did not verify; no definition or cycle outcome is claimed.",
    "No runtime evidence": "The explicit root supplied no verified cycle evidence; candidate definitions are not activity.",
    "Not configured": "No explicit Evolution runtime root is configured.",
    Incompatible: "The Evolution projection has an incompatible contract; no current cycle evidence is claimed.",
    Stale: "The Evolution ledger reading expired; previous cycles are last seen.",
    Unavailable: "The explicit-root Evolution read failed; cycle state is unknown.",
  },
  "evolution-signal": {
    Reading: "Checking the separate gateway candidate inbox; earlier counts are last seen.",
    "Verified candidate inbox": "Checkpointed improvement candidates were observed; none is an admitted cycle.",
    "Not configured": "No gateway improvement-candidate inbox is configured.",
    Incompatible: "The candidate-inbox projection has an incompatible contract; no count is claimed.",
    Stale: "The candidate-inbox reading expired; previous counts are last seen.",
    Unavailable: "The candidate-inbox read failed; Evolution ledger state is independent.",
  },
});

const overviewSources = {
  product: {posture: "Reading", observedAt: null, current: false},
  adapter: {posture: "Not observed", observedAt: null, current: false, claim: null},
  thread: {posture: "Not inspected", observedAt: null, current: false},
  decision: {posture: "Not inspected", observedAt: null, current: false},
  evolution: {posture: "Not inspected", observedAt: null, current: false},
  "evolution-signal": {posture: "Not inspected", observedAt: null, current: false},
};

function renderOverviewSummary() {
  const product = overviewSources.product;
  const adapter = overviewSources.adapter;
  const at = source => source.observedAt === null ? "" : ` at ${new Date(source.observedAt).toLocaleTimeString()}`;
  const productText = product.current
    ? product.posture === "Diagnostic passed" ? `Product diagnostic passed${at(product)}`
      : `Product diagnostic failed${at(product)}`
    : product.posture === "Reading" ? "Reading the product diagnostic"
      : product.posture === "Stale" ? `Product diagnostic last seen${at(product)}; not current`
        : "Product diagnostic unavailable";
  const adapterText = adapter.current
    ? adapter.claim === "Gateway stop observed" ? `gateway fault observed${at(adapter)}`
      : adapter.claim === "Backend connected; turns paused" ? `backend connected; model entry paused${at(adapter)}`
      : adapter.claim === "Backend connected; guard unverified" ? `backend connected; managed guard unverified${at(adapter)}`
      : adapter.claim === "Guarded text-only candidate" ? `guarded text-only candidate observed${at(adapter)}`
      : adapter.claim === "Backend path ready" ? `one backend path ready${at(adapter)}`
        : `gateway path observed${at(adapter)}`
    : adapter.posture === "Reading" ? "gateway path being checked"
      : adapter.posture === "Not configured" ? "gateway observation not configured"
        : adapter.posture === "Stale" ? `gateway path last seen${at(adapter)}; not current`
          : adapter.posture === "Not observed" ? "gateway path not observed"
            : "gateway path unavailable";
  setText("overview-summary", `${productText}; ${adapterText}.`);
}

function renderOverviewNextLink() {
  const link = document.getElementById("overview-next-link");
  if (!link?.dataset) return;
  const product = overviewSources.product;
  const adapter = overviewSources.adapter;
  let panel = "adapters";
  let issue = "adapter";
  let label = "Inspect adapter path ↗";
  if (product.posture !== "Diagnostic passed") {
    panel = "diagnostics";
    issue = "product";
    label = "Explain product diagnostic ↗";
  } else if (adapter.current && adapter.posture === "Observed"
    && adapter.claim !== "Gateway stop observed") {
    const attention = [
      ["thread", "Attention", "threads", "", "Inspect thread attention ↗"],
      ["evolution", "Invalid evidence", "diagnostics", "evolution", "Explain Evolution evidence ↗"],
      ["evolution", "Invalid registry", "diagnostics", "evolution", "Explain Evolution registry ↗"],
    ].find(([source, posture]) => overviewSources[source].posture === posture);
    const failedSource = ["thread", "decision", "evolution", "evolution-signal"].find(source =>
      ["Source changed", "Incompatible", "Unavailable"].includes(overviewSources[source].posture));
    if (attention) [, , panel, issue, label] = attention;
    else if (failedSource) {
      panel = "diagnostics";
      issue = failedSource;
      label = `Explain ${failedSource === "evolution-signal" ? "candidate inbox" : failedSource} source ↗`;
    }
  }
  link.dataset.panelLink = panel;
  link.dataset.diagnosticIssue = issue;
  link.textContent = label;
}

function updateOverviewSource(source, posture, observedAt, current, meaning) {
  if (!Object.hasOwn(overviewSources, source)) return;
  overviewSources[source] = {posture, observedAt, current, ...(source === "adapter" ? {claim: null} : {})};
  if (source !== "product" && source !== "adapter") {
    setText(`overview-${source}-posture`, posture);
    const time = observedAt === null ? "No successful read yet."
      : `${current ? "Observed" : "Last observed"} at ${new Date(observedAt).toLocaleTimeString()}.`;
    setText(`overview-${source}-detail`, `${time} ${meaning}`);
    renderOverviewNextLink();
    return;
  }
  setText(`overview-${source}-title`, posture);
  if (source === "product") setText("overview-product-detail", meaning);
  const stamp = ({posture: state, observedAt: time, current: isCurrent}) => time === null
    ? `${state.toLowerCase()}; not observed` : `${isCurrent ? "observed" : "last observed"} at ${new Date(time).toLocaleTimeString()}`;
  const product = overviewSources.product;
  const adapter = overviewSources.adapter;
  setText("overview-freshness-title", product.current && adapter.current ? "Both readings current"
    : product.current || adapter.current ? "One reading current" : "No current readings");
  setText("overview-freshness-detail", `Product: ${stamp(product)}. Adapter: ${stamp(adapter)}. They expire independently.`);
  renderOverviewNextLink();
  renderOverviewSummary();
}

function setOverviewAdapterClaim(claim) {
  overviewSources.adapter.claim = claim;
  renderOverviewNextLink();
  renderOverviewSummary();
}

function setSourceDiagnostic(source, posture, observedAt = null) {
  setText(`diagnostic-${source}-posture`, posture);
  const sourceMeaning = SOURCE_DIAGNOSTIC_MEANINGS[source]?.[posture]
    ?? "This source has no verified explanation for its current posture.";
  const indexMeaning = source === "evolution" && posture === "Verified ledger"
    ? lastEvolutionIndexStatus === "rebuild-required"
      ? " The disposable operational index requires rebuilding; the ledger remains verified."
      : lastEvolutionIndexStatus === "unavailable"
        ? " The operational index could not be safely read; the ledger remains verified."
        : lastEvolutionIndexStatus === "healthy"
          ? " The operational index matches this verified projection."
          : ""
    : "";
  const meaning = `${sourceMeaning}${indexMeaning}`;
  const current = ["Diagnostic passed", "Diagnostic FAIL", "Observed", "No records", "No matching records", "Attention",
    "Registry only", "Verified ledger", "Invalid evidence", "Invalid registry", "No runtime evidence", "Verified candidate inbox"].includes(posture);
  const time = observedAt === null ? "No successful read yet."
    : `${current ? "Observed" : "Last observed"} at ${new Date(observedAt).toLocaleTimeString()}.`;
  setText(`diagnostic-${source}-detail`, `${meaning} ${time}`);
  updateOverviewSource(source, posture, observedAt, current, meaning);
}

function productReasonMeaning(code) {
  if (code === "product.node-runtime-mismatch") return "The Node runtime differs from the version declared by the ARE product profile.";
  if (code.startsWith("product.component-missing:")) return "A required ARE component directory is missing.";
  if (code.startsWith("product.component-package-invalid:")) return "A required component has no readable package manifest.";
  if (code.startsWith("product.integration-missing:")) return "A required integration directory is missing.";
  if (code === "product.external-language-dependency" || code.startsWith("product.external-language-dependency:")) {
    return "The selected source closure includes a dependency outside this standalone product boundary.";
  }
  if (code === "product.schema-version-invalid" || code === "product.status-invalid"
    || code === "product.authority-effect-invalid" || code.startsWith("product.selection-unknown:")
    || code === "product.research-requires-development-mode" || /^product\.(?:components|integrations|component-id|integration-id|component-path|integration-path|id-duplicate|layer-invalid|maturity-invalid|default-enabled-invalid|install-posture-invalid|install-contract-invalid|core-contract-invalid|optional-layer-required|research-install-posture-invalid)(?::|$)/.test(code)) {
    return "The product profile or selected components do not satisfy their declared contract.";
  }
  return "ARE reported a product diagnostic reason that this Companion does not yet explain. Its scope is not a live-service check.";
}

function safeProductReasonCode(code) {
  return /^[a-z][a-z0-9.-]{0,127}(?::[a-z0-9._-]{1,128})?$/.test(code)
    ? code : "Unclassified product reason (details withheld)";
}

function paintProductReasons(snapshot) {
  const reasons = document.getElementById("reason-codes");
  const meanings = document.getElementById("diagnostic-issue-meanings");
  if (!reasons || !meanings) return;
  reasons.replaceChildren();
  meanings.replaceChildren();
  const codes = Array.isArray(snapshot.reasonCodes)
    ? snapshot.reasonCodes.filter(code => typeof code === "string").slice(0, 32) : [];
  if (codes.length === 0) {
    setText("diagnostic-issue-summary", snapshot.status === "PASS"
      ? "This product diagnostic reported no findings. It does not check gateway or model readiness."
      : "ARE reported a failed product diagnostic without a reason code.");
    const item = document.createElement("li");
    item.textContent = "No reason codes reported.";
    reasons.append(item);
    return;
  }
  setText("diagnostic-issue-summary", `The product diagnostic reported ${codes.length} finding${codes.length === 1 ? "" : "s"}. These do not describe gateway or task readiness.`);
  for (const code of codes) {
    const meaning = document.createElement("li");
    meaning.textContent = productReasonMeaning(code);
    meanings.append(meaning);
    const technical = document.createElement("li");
    technical.textContent = safeProductReasonCode(code);
    reasons.append(technical);
  }
}

const OBSERVATION_MAX_AGE_MS = 10_000;
let lastProductObservationAt = null;
let productObservationCurrent = false;

function freshObservationTime(value, source) {
  const now = Date.now();
  if (!Number.isSafeInteger(value) || value > now + 5_000 || now - value > OBSERVATION_MAX_AGE_MS) {
    throw new Error(`${source}.observation-stale`);
  }
  return value;
}

function keepActiveNavVisible(item) {
  const strip = item?.parentElement;
  if (!strip || strip.scrollWidth <= strip.clientWidth) return;
  const stripBounds = strip.getBoundingClientRect();
  const itemBounds = item.getBoundingClientRect();
  const inset = 8;
  if (itemBounds.left < stripBounds.left + inset) {
    strip.scrollLeft += itemBounds.left - stripBounds.left - inset;
  } else if (itemBounds.right > stripBounds.right - inset) {
    strip.scrollLeft += itemBounds.right - stripBounds.right + inset;
  }
}

function updateNavScrollControls() {
  const strip = document.querySelector?.(".nav-list");
  if (!strip) return;
  const previous = document.getElementById("nav-scroll-prev");
  const next = document.getElementById("nav-scroll-next");
  if (!previous || !next) return;
  const focusedControl = document.activeElement;
  const overflow = strip.scrollWidth > strip.clientWidth + 1;
  previous.hidden = next.hidden = !overflow;
  previous.disabled = !overflow || strip.scrollLeft <= 1;
  next.disabled = !overflow || strip.scrollLeft + strip.clientWidth >= strip.scrollWidth - 1;
  if (focusedControl === previous && previous.disabled) {
    (overflow ? next : document.querySelector(".nav-item.active"))?.focus({preventScroll: true});
  } else if (focusedControl === next && next.disabled) {
    (overflow ? previous : document.querySelector(".nav-item.active"))?.focus({preventScroll: true});
  }
}

function showPanel(name) {
  const target = document.getElementById(`panel-${name}`);
  if (!target) return;
  for (const panel of document.querySelectorAll(".panel")) panel.hidden = panel.id !== `panel-${name}`;
  let activeItem = null;
  for (const item of document.querySelectorAll(".nav-item")) {
    const active = item.dataset.panel === name;
    item.classList.toggle("active", active);
    if (active) { item.setAttribute("aria-current", "page"); activeItem = item; }
    else item.removeAttribute("aria-current");
  }
  keepActiveNavVisible(activeItem);
  updateNavScrollControls();
  window.scrollTo(0, 0);
  const heading = target.querySelector("h1");
  if (heading) {
    heading.tabIndex = -1;
    heading.focus({preventScroll: true});
  }
  if (name === "adapters") void refreshAdapterSnapshot();
  if (name === "threads") { expireThreadObservation(); void refreshAdapterSnapshot(); void refreshThreadSnapshot(); }
  if (name === "decisions") {
    document.getElementById("decision-live").hidden = true;
    document.getElementById("decision-empty").hidden = false;
    setText("decision-empty-detail", decisionFilter
      ? "Checking recent decisions for this backend thread." : "Checking all recent gateway decisions.");
    void refreshDecisionSnapshot();
  }
  if (name === "evolution") { void refreshEvolutionSnapshot(); void refreshEvolutionSignals(); }
  if (name === "diagnostics") {
    void refreshAdapterSnapshot();
    void refreshThreadSnapshot();
    void refreshDecisionSnapshot();
    void refreshEvolutionSnapshot();
    void refreshEvolutionSignals();
  }
}

let adapterReadPending = false;
let lastAdapterObservationAt = null;
let adapterObservationCurrent = false;
let lastAdapterRuntimeEpochId = null;
let adapterInventoryPending = false;

async function refreshAdapterInventory() {
  if (adapterInventoryPending) return;
  adapterInventoryPending = true;
  const section = document.getElementById("adapter-inventory");
  const list = document.getElementById("adapter-inventory-list");
  if (!section || !list || typeof list.replaceChildren !== "function") {
    adapterInventoryPending = false;
    return;
  }
  try {
    if (!invoke) throw new Error("adapter.inventory-unavailable");
    const entries = await invoke("get_adapter_inventory");
    if (!Array.isArray(entries) || entries.length > 4) throw new Error("adapter.inventory-incompatible");
    list.replaceChildren();
    section.hidden = entries.length === 0;
    let running = 0;
    for (const [index, entry] of entries.entries()) {
      const available = entry?.reasonCode === null;
      const observed = entry?.observedAtUnixMs;
      if (entry?.slot !== index + 1
        || !["gateway-in-process", "dsh-web-host-process", null].includes(entry.source)
        || !["running", "unavailable"].includes(entry.gatewayStatus)
        || !["ready", "running", "not-observed"].includes(entry.backendStatus)
        || !["ready", "not-observed", "unknown"].includes(entry.selectedPathStatus)
        || (available ? typeof entry.backendAdapterId !== "string"
          || !entry.backendAdapterId || entry.backendAdapterId.length > 256
          || !Number.isSafeInteger(observed) || Math.abs(Date.now() - observed) > 5000
          || entry.source === null
          || entry.source === "dsh-web-host-process"
            && (entry.backendAdapterId !== "deepseek-harness-web/are-v1"
              || entry.selectedPathStatus !== "not-observed")
          : entry.reasonCode !== "adapter.unavailable" || entry.source !== null
            || entry.backendAdapterId !== null || observed !== null
            || entry.gatewayStatus !== "unavailable" || entry.backendStatus !== "not-observed"
            || entry.selectedPathStatus !== "not-observed")) {
        throw new Error("adapter.inventory-incompatible");
      }
      if (entry.gatewayStatus === "running") running += 1;
      const row = document.createElement("article");
      row.className = "adapter-inventory-row";
      const title = document.createElement("strong");
      title.textContent = available ? entry.backendAdapterId : `Observer ${entry.slot}`;
      const posture = document.createElement("span");
      posture.textContent = available ? `gateway ${entry.gatewayStatus} · backend ${entry.backendStatus}` : "unavailable";
      const detail = document.createElement("small");
      detail.textContent = available
        ? `${entry.source === "dsh-web-host-process" ? "DSH Host" : "ARE gateway"} · selected session path ${entry.selectedPathStatus}`
        : "No current observation; adapter identity and path are not claimed.";
      row.append(title, posture, detail);
      list.append(row);
    }
    setText("adapter-inventory-summary", `${running} of ${entries.length} additional gateway sources running.`);
  } catch {
    section.hidden = false;
    list.replaceChildren();
    setText("adapter-inventory-summary", "Additional adapter inventory unavailable; no combined status is claimed.");
  } finally { adapterInventoryPending = false; }
}

function setSidebarAdapterPosture(posture, label) {
  const footer = document.getElementById("sidebar-adapter");
  if (footer?.dataset) footer.dataset.adapterPosture = posture;
  setText("sidebar-adapter-label", label);
}

function updateThreadAdapterCorrelation() {
  if (threadObservationStale || !lastThreadSnapshot || lastThreadObservationAt === null
    || Date.now() - lastThreadObservationAt > THREAD_OBSERVATION_MAX_AGE_MS) return;
  const sameEpoch = adapterObservationCurrent && lastAdapterObservationAt !== null
    && Date.now() - lastAdapterObservationAt <= OBSERVATION_MAX_AGE_MS
    && lastThreadSnapshot.runtimeEpochId === lastAdapterRuntimeEpochId;
  setText("thread-observation-source", sameEpoch
    ? "Source: same gateway epoch as Adapters · backend-thread Reasoning State only"
    : "Source: gateway backend threads · adapter link not correlated");
}

async function refreshAdapterSnapshot() {
  if (adapterReadPending) return;
  void refreshAdapterInventory();
  adapterReadPending = true;
  adapterObservationCurrent = false;
  const dshAgentState = document.getElementById("dsh-agent-state");
  if (dshAgentState) dshAgentState.hidden = true;
  updateThreadAdapterCorrelation();
  setText("adapter-observation-status", "Reading…");
  setSidebarAdapterPosture("reading", "Checking adapter");
  setSourceDiagnostic("adapter", "Reading", lastAdapterObservationAt);
  try {
    if (!invoke) throw new Error("adapter.unavailable");
    const snapshot = await invoke("get_adapter_snapshot");
    const managedIngressStatus = snapshot?.managedTurnIngressStatus ?? "unknown";
    const managedIngressSource = snapshot?.managedTurnIngressSource ?? "none";
    const managedIngressReason = snapshot?.managedTurnIngressReasonCode ?? null;
    const modelEntryBoundary = snapshot?.managedModelEntryBoundary ?? "unverified";
    const modelWireGuardStatus = snapshot?.managedModelWireGuardStatus ?? "unknown";
    const guardedPlanInputStatus = snapshot?.managedGuardedPlanInputStatus ?? "unknown";
    const hostedInputAttestationStatus = snapshot?.hostedInputAttestationStatus ?? "unknown";
    const hostedEffectToolStatus = snapshot?.hostedEffectToolStatus ?? "unknown";
    const windowsBackendSandboxStatus = snapshot?.windowsBackendSandboxStatus ?? "unknown";
    const mcpRelayPreflightStatus = snapshot?.mcpHookRelayPreflightStatus ?? "unknown";
    const observationTransport = snapshot?.observationTransport ?? "unknown";
    const hostMethodPolicy = snapshot?.hostMethodPolicy ?? {status: "unknown",
      codexVersion: null, knownRequestCount: null, admittedRequestCount: null};
    const sessionPaths = snapshot?.sessionPaths === undefined
      ? {status: "unknown", total: null, ready: null, initializing: null,
        backendUnavailable: null, detachedBackend: null, inactive: null} : snapshot.sessionPaths;
    const sessionPathFields = ["total", "ready", "initializing", "backendUnavailable", "detachedBackend", "inactive"];
    const sessionPathsValid = sessionPaths && typeof sessionPaths === "object" && !Array.isArray(sessionPaths)
      && ["observed", "unavailable", "unknown"].includes(sessionPaths.status)
      && (sessionPaths.status === "unknown"
        ? sessionPathFields.every((name) => sessionPaths[name] === null)
        : sessionPathFields.every((name) => Number.isSafeInteger(sessionPaths[name])
          && sessionPaths[name] >= 0 && sessionPaths[name] <= 1024)
          && sessionPaths.total === sessionPaths.ready + sessionPaths.initializing
            + sessionPaths.backendUnavailable + sessionPaths.detachedBackend + sessionPaths.inactive
          && (sessionPaths.status === "unavailable"
            ? snapshot.gatewayStatus === "unavailable" && sessionPaths.total === 0
              && snapshot.backendStatus === "not-observed"
            : snapshot.gatewayStatus === "running"
              && (snapshot.selectedPathStatus === "ready") === (sessionPaths.ready > 0)
              && (snapshot.clientLinkStatus === "connected")
                === (sessionPaths.ready + sessionPaths.initializing + sessionPaths.backendUnavailable > 0)
              && (snapshot.backendStatus !== "not-observed")
                === (sessionPaths.ready + sessionPaths.initializing + sessionPaths.detachedBackend > 0)));
    if (snapshot?.schemaVersion !== "are.companion-adapter-observation/v1" || snapshot.authorityEffect !== "none"
      || ![undefined, "gateway-in-process", "dsh-web-host-process"].includes(snapshot.source)
      || (snapshot.source === "dsh-web-host-process"
        && (snapshot.selectedBackendAdapterId !== "deepseek-harness-web/are-v1"
          || snapshot.clientLinkStatus !== "not-observed"
          || snapshot.selectedPathStatus !== "not-observed"
          || sessionPaths.status !== "unknown"))
      || typeof snapshot.runtimeEpochId !== "string" || !snapshot.runtimeEpochId || snapshot.runtimeEpochId.length > 256
      || snapshot.hostTaskControlStatus !== "unverified"
      || !["ready", "not-observed", "unknown"].includes(snapshot.selectedPathStatus)
      || (snapshot.selectedPathStatus === "ready" && (snapshot.clientLinkStatus !== "connected"
        || snapshot.gatewayStatus !== "running" || snapshot.backendStatus !== "ready"))
      || !sessionPathsValid
      || !["observed", "not-observed", "unknown"].includes(snapshot.sessionFaultStatus)
      || !["observed", "not-observed", "unknown"].includes(snapshot.sessionQuarantineStatus ?? "unknown")
      || !["configured", "not-configured", "unknown"].includes(hostedInputAttestationStatus)
      || !["candidate-enabled", "disabled", "unknown"].includes(hostedEffectToolStatus)
      || !["not-configured", "no-active-backend", "pending-or-mixed",
        "passed-all-active-backends", "failed", "unknown"].includes(windowsBackendSandboxStatus)
      || !["required", "not-required", "unknown"].includes(mcpRelayPreflightStatus)
      || !["local-ipc", "loopback-tcp-development", "unknown"].includes(observationTransport)
      || !["pinned-catalog", "not-applicable", "unknown"].includes(hostMethodPolicy.status)
      || (hostMethodPolicy.status === "pinned-catalog"
        ? snapshot.selectedBackendAdapterId !== "codex-app-server/v1"
          || typeof hostMethodPolicy.codexVersion !== "string" || !hostMethodPolicy.codexVersion
          || hostMethodPolicy.codexVersion.length > 128
          || !Number.isSafeInteger(hostMethodPolicy.knownRequestCount)
          || hostMethodPolicy.knownRequestCount < 1 || hostMethodPolicy.knownRequestCount > 4096
          || !Number.isSafeInteger(hostMethodPolicy.admittedRequestCount)
          || hostMethodPolicy.admittedRequestCount < 0
          || hostMethodPolicy.admittedRequestCount > hostMethodPolicy.knownRequestCount
        : hostMethodPolicy.codexVersion !== null || hostMethodPolicy.knownRequestCount !== null
          || hostMethodPolicy.admittedRequestCount !== null)
      || !["unverified", "guarded-text-only-candidate"].includes(modelEntryBoundary)
      || !["parent-heartbeat-observed", "not-observed", "not-declared", "unknown"].includes(modelWireGuardStatus)
      || !["launch-declared-candidate", "not-declared", "unknown"].includes(guardedPlanInputStatus)
      || (guardedPlanInputStatus === "launch-declared-candidate"
        && (modelEntryBoundary !== "guarded-text-only-candidate" || modelWireGuardStatus === "not-declared"))
      || (modelEntryBoundary === "guarded-text-only-candidate"
        && (managedIngressStatus !== "not-paused" || managedIngressSource !== "gateway-in-process"
          || hostedEffectToolStatus !== "disabled" || snapshot.selectedBackendAdapterId !== "codex-app-server/v1"
          || modelWireGuardStatus === "not-declared"))
      || !((managedIngressStatus === "paused" && ["launch-environment", "gateway-in-process"].includes(managedIngressSource)
        && managedIngressReason === "windows-client.hook-boundary-unverified")
        || (managedIngressStatus === "not-paused" && managedIngressSource === "gateway-in-process"
          && managedIngressReason === null)
        || (managedIngressStatus === "unknown" && managedIngressSource === "none" && managedIngressReason === null))) {
      throw new Error("adapter.observation-incompatible");
    }
    const operationPostures = ["turnStart", "turnInterrupt", "turnSteer", "threadResume", "threadCompact", "effectRequests"];
    if (operationPostures.some((operation) => !["supported", "unsupported", "unknown"].includes(snapshot.backendCapabilities?.[operation]))
      || !["durable", "ephemeral", "unknown"].includes(snapshot.backendCapabilities?.historyPersistence)) {
      throw new Error("adapter.observation-incompatible");
    }
    const retainedReceipts = snapshot.retainedHostReceipts ?? {status: "unknown",
      turnStartAccepted: null, turnHistoryVerified: null, steerAccepted: null,
      compactionTurnAccepted: null, compactionItemCompleted: null, compactionHistoryVerified: null};
    const dshActivity = snapshot.source === "dsh-web-host-process"
      ? snapshot.dshWebActivity ?? {status: "unknown", activeAgentCount: null,
        retainedModelEntryCount: null, retainedTurnTerminalCount: null,
        omittedAgentCount: null, agents: []}
      : null;
    if (dshActivity === null ? snapshot.dshWebActivity != null
      : !dshActivity || typeof dshActivity !== "object" || Array.isArray(dshActivity)
        || Object.keys(dshActivity).sort().join(",")
          !== "activeAgentCount,agents,omittedAgentCount,retainedModelEntryCount,retainedTurnTerminalCount,status"
        || !["observed", "unknown"].includes(dshActivity.status)
        || !Array.isArray(dshActivity.agents) || dshActivity.agents.length > 16
        || dshActivity.agents.some((item, index) => !item || typeof item !== "object"
          || Array.isArray(item) || !["lastTurnEvidence,threadRef",
            "lastTurnEvidence,nativeTurnState,threadRef",
            "arePreparation,lastTurnEvidence,threadRef",
            "arePreparation,lastTurnEvidence,nativeTurnState,threadRef"].includes(Object.keys(item)
              .filter(key => !['areInterpretation', 'arePlanHead'].includes(key)).sort().join(","))
          || item.areInterpretation !== undefined && !validDshInterpretationSummary(item.areInterpretation)
          || item.arePlanHead !== undefined && !validDshPlanHeadSummary(item.arePlanHead)
          || !/^backend-thread:[0-9a-f]{64}$/u.test(item.threadRef)
          || !["model-entry-retained", "terminal-retained", "no-retained-turn-event"].includes(item.lastTurnEvidence)
          || item.arePreparation !== undefined && (!item.arePreparation
            || typeof item.arePreparation !== "object" || Array.isArray(item.arePreparation)
            || !["routeId,status", "dispatchRelation,routeId,status",
              "objectiveCheckpoint,routeId,status", "dispatchRelation,objectiveCheckpoint,routeId,status"].includes(
              Object.keys(item.arePreparation).sort().join(","))
            || item.arePreparation.objectiveCheckpoint !== undefined
              && !validDshObjectiveCheckpointSummary(item.arePreparation.objectiveCheckpoint)
            || item.arePreparation.status !== "route-context-prepared"
            || item.arePreparation.dispatchRelation !== undefined
              && !["latest-model-entry", "other-preparation", "not-retained", "legacy-unbound"]
                .includes(item.arePreparation.dispatchRelation)
            || !/^CA2-ROUTE-[A-Z0-9-]{1,80}$/u.test(item.arePreparation.routeId))
          || item.nativeTurnState !== undefined && !["not-started", "open-observed",
            "closed-observed", "unknown"].includes(item.nativeTurnState)
          || index > 0 && dshActivity.agents[index - 1].threadRef >= item.threadRef)
        || (dshActivity.status === "unknown" && (dshActivity.omittedAgentCount !== null
          || dshActivity.agents.length !== 0))
        || (dshActivity.status === "observed" && (!Number.isSafeInteger(dshActivity.omittedAgentCount)
          || dshActivity.omittedAgentCount < 0 || dshActivity.omittedAgentCount > 1024
          || dshActivity.agents.length + dshActivity.omittedAgentCount !== dshActivity.activeAgentCount))
        || ["activeAgentCount", "retainedModelEntryCount", "retainedTurnTerminalCount"].some(field =>
          dshActivity.status === "unknown" ? dshActivity[field] !== null
            : !Number.isSafeInteger(dshActivity[field]) || dshActivity[field] < 0
              || dshActivity[field] > (field === "activeAgentCount" ? 1024 : 262144))) {
      throw new Error("adapter.observation-incompatible");
    }
    const receiptFields = ["turnStartAccepted", "turnHistoryVerified", "steerAccepted",
      "compactionItemCompleted"];
    const compactionTurnCount = retainedReceipts.compactionTurnAccepted ?? null;
    const compactionHistoryCount = retainedReceipts.compactionHistoryVerified ?? null;
    if (!["observed", "not-observed", "unknown"].includes(retainedReceipts.status)
      || receiptFields.some((field) => retainedReceipts.status === "unknown"
        ? retainedReceipts[field] !== null
        : !Number.isSafeInteger(retainedReceipts[field]) || retainedReceipts[field] < 0
          || retainedReceipts[field] > 262_144)
      || (compactionTurnCount !== null
        && (!Number.isSafeInteger(compactionTurnCount) || compactionTurnCount < 0
          || compactionTurnCount > 262_144 || retainedReceipts.status === "unknown"))
      || (compactionHistoryCount !== null
        && (!Number.isSafeInteger(compactionHistoryCount) || compactionHistoryCount < 0
          || compactionHistoryCount > 262_144 || retainedReceipts.status === "unknown"))
      || (retainedReceipts.status !== "unknown" && (retainedReceipts.status === "observed")
        !== (receiptFields.some((field) => retainedReceipts[field] > 0)
          || compactionTurnCount > 0 || compactionHistoryCount > 0))) {
      throw new Error("adapter.observation-incompatible");
    }
    lastAdapterObservationAt = freshObservationTime(snapshot.observedAtUnixMs, "adapter");
    lastAdapterRuntimeEpochId = snapshot.runtimeEpochId;
    adapterObservationCurrent = true;
    setText("adapter-observation-status", "Observed");
    setSourceDiagnostic("adapter", "Observed", lastAdapterObservationAt);
    setText("adapter-observation-source", snapshot.source === "dsh-web-host-process"
      ? "Source: restricted DSH Web Host · sidecar journal checked · browser connection not observed"
      : `Source: selected ARE gateway · model-entry ingress ${managedIngressSource === "gateway-in-process" ? "observed at gateway" : managedIngressSource === "launch-environment" ? "declared by Companion launch environment" : "not observed"}`);
    setText("adapter-observation-transport", observationTransport === "loopback-tcp-development"
      ? "Local loopback TCP · development only" : observationTransport === "local-ipc" ? "Local IPC" : "Not reported");
    setText("adapter-observation-transport-detail", snapshot.source === "dsh-web-host-process"
      ? "Read-only observation from the restricted DSH Web Host over a private local socket. It checks its ARE sidecar but does not establish a browser connection or control of this desktop task."
      : observationTransport === "loopback-tcp-development"
      ? "Read-only gateway observation over this machine's loopback. This is not an installed integration, managed turn, or control of this desktop task."
      : observationTransport === "local-ipc"
        ? "Read-only local gateway observation. The transport does not establish host-task control."
        : "This Companion version does not identify the observer transport; no installed-integration claim is made.");
    setText("adapter-id", snapshot.selectedBackendAdapterId);
    setText("adapter-client-state", snapshot.clientLinkStatus);
    setText("adapter-gateway-state", snapshot.gatewayStatus);
    setText("adapter-backend-state", snapshot.backendStatus);
    setText("adapter-selected-path-state", snapshot.selectedPathStatus);
    const unreadyPaths = [[sessionPaths.initializing, "initializing"],
      [sessionPaths.backendUnavailable, "without backend"],
      [sessionPaths.detachedBackend, "detached backend"], [sessionPaths.inactive, "inactive"]]
      .filter(([count]) => count > 0).map(([count, label]) => `${count} ${label}`);
    setText("adapter-session-paths", sessionPaths.status === "observed"
      ? `${sessionPaths.ready} of ${sessionPaths.total} ready${unreadyPaths.length ? ` · ${unreadyPaths.join(" · ")}` : ""}`
      : sessionPaths.status === "unavailable" ? "Gateway unavailable" : "Not reported by this gateway version");
    const dshActivityRow = document.getElementById("adapter-dsh-activity");
    if (dshActivityRow) dshActivityRow.hidden = dshActivity === null;
    if (dshActivity !== null) {
      setText("adapter-dsh-active-agents", dshActivity.status === "observed"
        ? dshActivity.activeAgentCount : "Not reported");
      setText("adapter-dsh-model-entries", dshActivity.status === "observed"
        ? dshActivity.retainedModelEntryCount : "Not reported");
      setText("adapter-dsh-turn-terminals", dshActivity.status === "observed"
        ? dshActivity.retainedTurnTerminalCount : "Not reported");
      if (dshAgentState) dshAgentState.hidden = dshActivity.status !== "observed";
      if (dshActivity.status === "observed") {
        setText("dsh-agent-observed-at", `Host observation · ${new Date(lastAdapterObservationAt).toLocaleTimeString()}`);
        const lines = dshActivity.agents.map(agent => {
          const nativeTurn = agent.nativeTurnState === "open-observed"
            ? "native turn open at observation" : agent.nativeTurnState === "closed-observed"
              ? "native turn closed at observation" : agent.nativeTurnState === "not-started"
                ? "no native turn started in this Host run" : "native turn state not reported";
          const retained = agent.lastTurnEvidence === "model-entry-retained"
            ? "model entry retained; no later terminal retained" : agent.lastTurnEvidence === "terminal-retained"
              ? "terminal event retained" : "no retained turn event";
          const preparation = agent.arePreparation?.status === "route-context-prepared"
            ? `latest retained ARE route/context preparation · ${agent.arePreparation.routeId}`
            : "ARE route/context preparation not retained";
          const correlation = !agent.arePreparation ? "" : ` · ${
            agent.arePreparation.dispatchRelation === "latest-model-entry"
              ? "included in latest retained model entry"
              : agent.arePreparation.dispatchRelation === "other-preparation"
                ? "different from latest retained model entry"
                : agent.arePreparation.dispatchRelation === "not-retained"
                  ? "no retained model entry to correlate"
                  : "model-entry correlation not reported"}`;
          const checkpoint = agent.arePreparation?.objectiveCheckpoint;
          const progress = checkpoint?.planProgress;
          const objectiveReference = !checkpoint ? "" : ` · objective checkpoint reference ${
            checkpoint.checkpointDigest.slice(0, 8)} · ${checkpoint.requirements === "not-selected"
              ? "requirements not selected" : "requirement continuity reference retained"} · ${
            progress
              ? `checkpointed plan declaration · ${progress.completedCount}/${progress.obligationCount} marked completed · ${progress.openCount} open, ${progress.activeCount} active, ${progress.deferredCount} deferred · current slice ${progress.activeSliceOrdinal}/${progress.obligationCount} (${progress.activeSliceStatus}) · ${progress.openDecisionCount} open decisions · not independently verified product completion`
              : checkpoint.planContextDigest
              ? `selected plan reference ${checkpoint.planContextDigest.slice(0, 8)} (not verified progress)`
              : "plan selection not reported"}`;
          const interpretation = agent.areInterpretation;
          const head = agent.arePlanHead;
          const latestPlan = head === undefined ? ' · latest plan-head read not reported'
            : head.status === 'unavailable' ? ' · latest plan-head read unavailable; older references are not current plan state'
              : head.status === 'not-retained' ? ' · no checkpointed plan head retained at observation'
                : ` · latest retained plan head ${head.planContextDigest.slice(0, 8)} · sources ${head.sources === 'verified-at-read' ? 'verified at read' : 'verification failed at read; counts are checkpoint-time evidence only'} · ${head.selectionRelation === 'matches-startup' ? 'matches startup selection' : 'different from startup selection; no advancement inferred'} · ${head.planProgress.completedCount}/${head.planProgress.obligationCount} declared completed · slice ${head.planProgress.activeSliceOrdinal}/${head.planProgress.obligationCount} (${head.planProgress.activeSliceStatus}) · ${head.planProgress.openDecisionCount} open decisions · not independently verified product completion`;
          const interpretedProgress = interpretation?.planProgress;
          const unadmittedReference = !interpretation ? "" : ` · latest ARE interpretation checkpoint reference ${
            interpretation.checkpointDigest.slice(0, 8)} · no admission retained for this interpretation at observation · ${
            interpretation.requirements === "not-selected" ? "requirements not selected" : "requirement continuity reference retained"}${
            interpretedProgress
              ? ` · plan declaration at interpretation checkpoint · ${interpretedProgress.completedCount}/${interpretedProgress.obligationCount} marked completed · ${interpretedProgress.openCount} open, ${interpretedProgress.activeCount} active, ${interpretedProgress.deferredCount} deferred · slice ${interpretedProgress.activeSliceOrdinal}/${interpretedProgress.obligationCount} (${interpretedProgress.activeSliceStatus}) · ${interpretedProgress.openDecisionCount} open decisions · not independently verified product completion or current source state`
              : interpretation.planContextDigest ? ` · selected plan reference ${interpretation.planContextDigest.slice(0, 8)} (not verified progress)` : ""} · not a rejection verdict or model execution`;
          return `Agent ${agent.threadRef.slice(-8)}${latestPlan} · ${preparation}${correlation}${objectiveReference}${unadmittedReference} · ${nativeTurn} · ${retained}`;
        });
        if (dshActivity.omittedAgentCount > 0) lines.push(`${dshActivity.omittedAgentCount} more active Agents not shown`);
        setText("dsh-agent-state-list", lines.join("\n") || "No active Host-owned Agents observed.");
      }
    }
    setText("adapter-host-method-policy", hostMethodPolicy.status === "pinned-catalog"
      ? `${hostMethodPolicy.admittedRequestCount} of ${hostMethodPolicy.knownRequestCount} known requests admitted`
      : hostMethodPolicy.status === "not-applicable" ? "Not applicable to this backend" : "Not reported");
    setText("adapter-host-method-policy-detail", hostMethodPolicy.status === "pinned-catalog"
      ? `Gateway policy is pinned to ${hostMethodPolicy.codexVersion}. Other known requests are deliberately ungoverned; this count is not desktop compatibility, host-effect coverage, or control of this task.`
      : "This source does not report a Codex host method policy; no desktop compatibility or task-control claim is made.");
    setText("adapter-managed-turn-ingress-state", modelEntryBoundary === "guarded-text-only-candidate"
      ? modelWireGuardStatus === "parent-heartbeat-observed" ? "guarded text-only (candidate)"
        : "guarded text-only (unverified)" : managedIngressStatus);
    setText("adapter-model-wire-guard-state", modelWireGuardStatus);
    setText("adapter-model-wire-guard-detail", modelWireGuardStatus === "parent-heartbeat-observed"
      ? "The gateway received a fresh heartbeat from its managed parent while the guard listener was open. This is not a provider probe or proof of complete host-effect coverage."
      : modelWireGuardStatus === "not-observed"
        ? "The managed guard was declared, but no fresh parent heartbeat reached this gateway. Treat the guarded boundary as unverified."
        : modelWireGuardStatus === "not-declared"
          ? "This gateway did not declare a managed model-wire guard."
          : "This gateway version does not report a managed guard heartbeat.");
    setText("adapter-guarded-plan-input-state", guardedPlanInputStatus === "launch-declared-candidate"
      ? modelWireGuardStatus === "parent-heartbeat-observed" ? "configured at launch (candidate)"
        : "configured at launch (guard unverified)"
      : guardedPlanInputStatus === "not-declared" ? "not declared" : "not reported");
    setText("adapter-guarded-plan-input-detail", guardedPlanInputStatus === "launch-declared-candidate"
      ? modelWireGuardStatus === "parent-heartbeat-observed"
        ? "The managed launcher configured this hosted client for Plan questions. No question is claimed pending; this does not control the current desktop task."
        : "Plan questions were declared at launch, but guard liveness is unverified. Do not assume a question can be delivered."
      : guardedPlanInputStatus === "not-declared"
        ? "This Companion launch did not declare guarded Plan questions. Guarded text-only mode does not imply them."
        : "This Companion version does not report the managed Plan-question setting.");
    setText("adapter-hosted-input-attestation-state", hostedInputAttestationStatus);
    setText("adapter-hosted-effect-tool-state", hostedEffectToolStatus);
    setText("adapter-hosted-effect-tool-detail", hostedEffectToolStatus === "candidate-enabled"
      ? "The gateway opted into the candidate ARE command broker. This does not prove browser approval, a live effect, or control of this desktop task."
      : hostedEffectToolStatus === "disabled"
        ? "The gateway does not admit the candidate hosted command tool."
        : "This gateway version does not report the hosted command setting.");
    setText("adapter-windows-backend-sandbox-state", windowsBackendSandboxStatus);
    setText("adapter-windows-backend-sandbox-detail", windowsBackendSandboxStatus === "passed-all-active-backends"
      ? "Every currently attached backend passed a model-free sandbox probe in its own process. Windows hosted commands remain disabled until the host can bound buffered output; this does not establish control of this desktop task."
      : windowsBackendSandboxStatus === "failed"
        ? "At least one active backend failed its sandbox probe; hosted commands remain denied."
        : windowsBackendSandboxStatus === "pending-or-mixed"
          ? "An active backend is still being checked or active backends disagree; hosted commands remain denied."
          : "No same-backend proof is available; hosted commands remain denied on Windows.");
    setText("adapter-mcp-relay-preflight-state", mcpRelayPreflightStatus);
    setText("adapter-mcp-relay-preflight-detail", mcpRelayPreflightStatus === "required"
      ? "The gateway requires a fresh, one-use backend tool listing before each owned turn. This is not proof that every hook or host effect is covered."
      : mcpRelayPreflightStatus === "not-required"
        ? "This gateway does not require a relay listing before turns."
        : "This gateway version does not report the preflight requirement.");
    setText("adapter-managed-turn-ingress-detail", managedIngressStatus === "paused"
      ? managedIngressSource === "gateway-in-process"
        ? "Gateway blocks model-entry methods before backend dispatch. Relay preflight does not cover later stdin writes or every host tool path; this is not desktop-task control."
        : "Companion launch environment declares Windows hosted sends paused; gateway enforcement is not observed from this version."
      : managedIngressStatus === "not-paused"
        ? modelEntryBoundary === "guarded-text-only-candidate"
          ? "Managed launch declares a guarded text-only candidate; the gateway reports no model-entry pause. The separate guard heartbeat reports only parent/listener liveness, not complete host-effect coverage or control of this desktop task."
          : "No model-entry pause is configured at this gateway. This does not establish a verified effect boundary or permission to control this task."
        : "Gateway model-entry posture is unavailable; backend capability is a separate claim.");
    setText("adapter-host-control-state", snapshot.hostTaskControlStatus);
    setText("adapter-session-fault-state", snapshot.sessionFaultStatus);
    const quarantineStatus = snapshot.sessionQuarantineStatus ?? "unknown";
    setText("adapter-session-quarantine-state", quarantineStatus);
    setText("adapter-turn-start", snapshot.backendCapabilities.turnStart);
    setText("adapter-interrupt", snapshot.backendCapabilities.turnInterrupt);
    setText("adapter-steering", snapshot.backendCapabilities.turnSteer);
    setText("adapter-resume", snapshot.backendCapabilities.threadResume);
    setText("adapter-compaction", snapshot.backendCapabilities.threadCompact);
    setText("adapter-history", snapshot.backendCapabilities.historyPersistence);
    setText("adapter-effects", snapshot.backendCapabilities.effectRequests);
    setText("adapter-receipt-posture", retainedReceipts.status === "unknown" ? "Unknown from this gateway version"
      : retainedReceipts.status === "observed" ? "Retained receipts observed" : "No retained receipts observed");
    setText("adapter-receipt-turn-start", retainedReceipts.turnStartAccepted ?? "—");
    setText("adapter-receipt-history", retainedReceipts.turnHistoryVerified ?? "—");
    setText("adapter-receipt-steer", retainedReceipts.steerAccepted ?? "—");
    setText("adapter-receipt-compaction-turn", retainedReceipts.compactionTurnAccepted ?? "—");
    setText("adapter-receipt-compaction", retainedReceipts.compactionItemCompleted ?? "—");
    setText("adapter-receipt-compaction-history", retainedReceipts.compactionHistoryVerified ?? "—");
    setText("adapter-observed-at", new Date(lastAdapterObservationAt).toLocaleTimeString());
    const livePath = snapshot.selectedPathStatus === "ready" && snapshot.clientLinkStatus === "connected"
      && snapshot.gatewayStatus === "running" && snapshot.backendStatus === "ready";
    const stoppedSessionObserved = snapshot.sessionFaultStatus === "observed" || quarantineStatus === "observed";
    setSidebarAdapterPosture(stoppedSessionObserved ? "stopped" : livePath ? "ready" : "observed",
      stoppedSessionObserved ? "Gateway stop observed" : livePath ? "Adapter path ready" : "Adapter observed");
    const adapterClaim = stoppedSessionObserved ? "Gateway stop observed"
      : livePath && managedIngressStatus === "paused" ? "Backend connected; turns paused"
        : livePath && modelEntryBoundary === "guarded-text-only-candidate"
          ? modelWireGuardStatus === "parent-heartbeat-observed"
            ? "Guarded text-only candidate" : "Backend connected; guard unverified"
        : livePath ? "Backend path ready" : "Path observed";
    setText("overview-adapter-title", adapterClaim);
    setOverviewAdapterClaim(adapterClaim);
    const adapterSummary = stoppedSessionObserved
      ? "Gateway fault or quarantine observed. This chat is not established as ARE-managed."
      : livePath && managedIngressStatus === "paused"
        ? "Backend connected; model-entry turns are paused. This chat is not established as ARE-managed."
        : livePath && modelEntryBoundary === "guarded-text-only-candidate"
          ? modelWireGuardStatus === "parent-heartbeat-observed"
            ? "Guarded text-only launch observed; host-effect coverage remains unverified. This chat is not established as ARE-managed."
            : "Backend connected; guard liveness is unverified. This chat is not established as ARE-managed."
          : livePath
            ? "One same-session backend path is ready. This chat is not established as ARE-managed."
            : "Gateway observed; no ready same-session backend path. This chat is not established as ARE-managed.";
    setText("overview-adapter-detail", adapterSummary);
    setText("overview-adapter-technical", `${snapshot.selectedBackendAdapterId} · client ${snapshot.clientLinkStatus} · gateway ${snapshot.gatewayStatus} · backend ${snapshot.backendStatus}; same-session path ${snapshot.selectedPathStatus}. Observation transport: ${observationTransport === "loopback-tcp-development" ? "local loopback TCP (development-only, read-only)" : observationTransport === "local-ipc" ? "local IPC (read-only)" : "not reported"}. Model-entry ingress: ${managedIngressStatus} (${managedIngressSource}); boundary ${modelEntryBoundary}${modelEntryBoundary === "guarded-text-only-candidate" ? ` (launch-declared); guard heartbeat ${modelWireGuardStatus}` : ""}; Plan questions ${guardedPlanInputStatus} (launch declaration only). Durable fault: ${snapshot.sessionFaultStatus}; history-audit quarantine: ${quarantineStatus}. Desktop task control: ${snapshot.hostTaskControlStatus}. This chat is not established as ARE-managed.`);
    document.getElementById("adapter-empty").hidden = true;
    document.getElementById("adapter-live").hidden = false;
    if (!threadObservationStale && lastThreadSnapshot && lastThreadObservationAt !== null
      && Date.now() - lastThreadObservationAt <= THREAD_OBSERVATION_MAX_AGE_MS
      && lastThreadSnapshot.runtimeEpochId !== lastAdapterRuntimeEpochId) {
      showLastSeenThreads("Source changed");
      setText("thread-observation-source", "Source: gateway process changed since the thread read · refresh Threads");
    } else updateThreadAdapterCorrelation();
    if (decisionObservationCurrent && lastDecisionRuntimeEpochId !== null
      && lastDecisionRuntimeEpochId !== lastAdapterRuntimeEpochId) {
      showDecisionSourceChanged("The selected gateway process changed since these decisions were read. Refresh Decisions to inspect the current process.");
    }
  } catch (error) {
    adapterObservationCurrent = false;
    updateThreadAdapterCorrelation();
    const reason = String(error);
    const posture = reason.includes("adapter.not-configured") ? "Not configured"
      : reason.includes("incompatible") ? "Incompatible"
      : reason.includes("stale") ? "Stale" : "Unavailable";
    setText("adapter-observation-status", posture);
    setSidebarAdapterPosture(posture.toLowerCase().replaceAll(" ", "-"), `Adapter ${posture.toLowerCase()}`);
    setSourceDiagnostic("adapter", posture, lastAdapterObservationAt);
    setText("overview-adapter-title", posture === "Not configured" ? "Not configured" : "Observation unavailable");
    setText("overview-adapter-detail", posture === "Not configured"
      ? "No local adapter observation is configured. Product health is a separate diagnostic."
      : "No current adapter state can be claimed. Open Adapters for the source-specific status.");
    setText("overview-adapter-technical", posture === "Not configured"
      ? "No local adapter observation is configured."
      : "The previous technical path reading is no longer current. Open Adapters for the source-specific status.");
    setText("adapter-observation-source", "Source: selected ARE gateway · no current observation");
    setText("adapter-empty-detail", lastAdapterObservationAt === null
      ? "The development observation path is not currently available. Product health does not establish a live adapter connection."
      : `The previous reading at ${new Date(lastAdapterObservationAt).toLocaleTimeString()} is no longer current. No live state is claimed.`);
    document.getElementById("adapter-live").hidden = true;
    document.getElementById("adapter-empty").hidden = false;
  } finally {
    adapterReadPending = false;
  }
}

let threadReadPending = false;
let queuedThreadFreshStart = false;
let lastThreadObservationAt = null;
let lastThreadSnapshot = null;
let hostedRejoinRows = null;
let threadObservationStale = false;
let threadPageOffset = 0;
let pendingThreadFocus = null;
let selectedThreadDetail = null;
let renderedThreadDetails = [];
const THREAD_OBSERVATION_MAX_AGE_MS = 10_000;
const THREAD_PHASES = new Set(["dispatch-pending", "turn-active", "turn-completed", "recovery-unverified", "recovery-terminal"]);
const THREAD_COMPLETION_LABELS = Object.freeze({
  completed: "Turn completed", failed: "Turn failed", interrupted: "Turn interrupted",
  cancelled: "Turn cancelled", unknown: "Turn outcome unknown",
});

function threadPhaseLabel(thread) {
  if (thread.phase === "dispatch-pending") return "Dispatch pending";
  if (thread.phase === "turn-active") return "Turn active";
  if (thread.phase === "recovery-unverified") return "Recovery unverified";
  if (thread.phase === "recovery-terminal") return "Recovered host terminal";
  if (thread.phase === "turn-completed") return Object.hasOwn(THREAD_COMPLETION_LABELS, thread.lastCompletionStatus)
    ? THREAD_COMPLETION_LABELS[thread.lastCompletionStatus] : "Turn outcome unavailable";
  return "Phase unavailable";
}

function updateThreadDetailVisibility() {
  for (const entry of renderedThreadDetails) {
    const expanded = selectedThreadDetail?.runtimeEpochId === entry.runtimeEpochId
      && selectedThreadDetail?.threadRef === entry.threadRef;
    for (const node of entry.detailNodes) node.hidden = !expanded;
    entry.button.textContent = expanded ? "Close state and evidence ↑" : "Inspect state and evidence ↓";
    entry.button.setAttribute?.("aria-expanded", String(expanded));
    entry.button.setAttribute?.("aria-label", `${expanded ? "Close" : "Inspect"} state and evidence for backend thread ${entry.threadRef.slice(-8)}`);
  }
}

function compatibleLearningFeedback(value) {
  if (value === null || value === undefined) return true;
  const counts = ['pending_feedback_count', 'retained_lesson_count', 'disabled_lesson_count',
    'dispatched_application_count', 'evaluated_application_count'];
  const keys = ['schema_version', 'source', 'binding_ref', 'status', 'mode', 'durability', 'state_digest',
    'checkpoint_digest', ...counts, 'authority_effect', 'observation_digest'];
  const hash = value => typeof value === 'string' && /^[a-f0-9]{64}$/.test(value);
  if (value === null || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).length !== keys.length
    || !keys.every(key => Object.hasOwn(value, key)) || value.schema_version !== 'are.learning-feedback-observation/v1'
    || value.source !== 'learning-owner' || value.authority_effect !== 'none'
    || !hash(value.binding_ref) || !hash(value.observation_digest)) return false;
  if (['disabled', 'unavailable'].includes(value.status)) return value.mode === null && value.durability === null
    && value.state_digest === null && value.checkpoint_digest === null && counts.every(key => value[key] === null);
  if (!['off', 'observe', 'apply-scoped'].includes(value.mode)
    || !counts.every(key => Number.isSafeInteger(value[key]) && value[key] >= 0 && value[key] <= 1_000_000)
    || value.disabled_lesson_count > value.retained_lesson_count
    || value.evaluated_application_count > value.dispatched_application_count) return false;
  if (value.status === 'no-records') return value.durability === null && value.state_digest === null
    && value.checkpoint_digest === null && counts.every(key => value[key] === 0);
  return value.status === 'observed' && ['process-memory', 'append-only-file-fsync'].includes(value.durability)
    && hash(value.state_digest) && hash(value.checkpoint_digest);
}

function learningFeedbackLabel(value, stale = false) {
  if (!value) return 'Feedback · not reported by this source';
  if (stale) return 'Feedback · last seen only; no current counts';
  if (value.status === 'disabled') return 'Feedback · learning disabled';
  if (value.status === 'unavailable') return 'Feedback · checkpoint unavailable; no current counts';
  if (value.status === 'no-records') return 'Feedback · no owner records';
  return `Feedback · ${value.pending_feedback_count} pending review · ${value.retained_lesson_count} retained lessons · policy ${value.mode}`;
}

function paintThreadRows(threads, observedAt, stale = false) {
  const parent = document.getElementById("thread-list");
  if (!parent) return;
  const focusedDetail = renderedThreadDetails.find(entry => entry.button === document.activeElement);
  parent.replaceChildren();
  renderedThreadDetails = [];
  const decisionLinks = [];
  for (const [index, thread] of threads.entries()) {
    const card = document.createElement("article");
    card.className = "thread-card";
    card.classList.toggle("stale", stale);
    const name = document.createElement("h2");
    name.id = `thread-card-title-${index}`;
    name.textContent = `Backend thread ${thread.threadRef.slice(-8)}`;
    card.setAttribute?.("aria-labelledby", name.id);
    const phase = document.createElement("span");
    const observedPhase = threadPhaseLabel(thread);
    phase.textContent = stale ? `Last seen · phase was ${observedPhase.toLowerCase()}` : observedPhase;
    const observed = document.createElement("p");
    observed.textContent = `${stale ? "Last observed" : "Observed"} at ${new Date(observedAt).toLocaleTimeString()}`;
    const frontier = document.createElement("p");
    frontier.textContent = thread.latestFrontierDigest
      ? `Verified completion frontier${["recovery-unverified", "recovery-terminal"].includes(thread.phase) ? " (earlier turn)" : ""} · ${thread.lastCompletionStatus ?? "unknown"}`
      : "No completed frontier observed yet";
    const plan = document.createElement("p");
    plan.className = "thread-plan-progress";
    const activeSlice = Number.isSafeInteger(thread.planActiveSliceOrdinal) && thread.planActiveSliceOrdinal > 0
      && ["open", "active", "deferred"].includes(thread.planActiveSliceStatus)
      ? ` · current slice ${thread.planActiveSliceOrdinal}/${thread.planObligationCount} (${thread.planActiveSliceStatus})`
      : "";
    plan.textContent = thread.planContextDigest
      ? `${stale ? "Last seen · " : ""}Checkpointed plan · ${thread.planCompletedCount}/${thread.planObligationCount} obligations complete${activeSlice} · ${thread.planOpenDecisionCount} open decision${thread.planOpenDecisionCount === 1 ? "" : "s"}`
      : "No bounded plan context recorded for this backend thread";
    const host = document.createElement("p");
    host.className = "thread-host-receipts";
    const markedHostCount = Number.isSafeInteger(thread.markedHostTurnCount) && thread.markedHostTurnCount >= 0
      ? thread.markedHostTurnCount : null;
    const acceptedCompactionCount = Number.isSafeInteger(thread.acceptedCompactionTurnCount)
      && thread.acceptedCompactionTurnCount >= 0 ? thread.acceptedCompactionTurnCount : null;
    const recoveredCompactionCount = Number.isSafeInteger(thread.recoveredCompactionCount)
      && thread.recoveredCompactionCount >= 0 ? thread.recoveredCompactionCount : null;
    host.textContent = Number.isSafeInteger(thread.acceptedTurnStartCount) && Number.isSafeInteger(thread.verifiedHostTurnCount)
      && Number.isSafeInteger(thread.acceptedSteerCount) && Number.isSafeInteger(thread.completedCompactionItemCount)
      ? `Host protocol receipts · ${thread.acceptedTurnStartCount} accepted turn start · ${thread.verifiedHostTurnCount} accepted-turn history verification${markedHostCount === null ? "" : ` · ${markedHostCount} marked host-turn observation${markedHostCount === 1 ? "" : "s"}`} · ${thread.acceptedSteerCount} accepted steer${acceptedCompactionCount === null ? "" : ` · ${acceptedCompactionCount} accepted compaction turn${acceptedCompactionCount === 1 ? "" : "s"}`} · ${thread.completedCompactionItemCount} native completed compaction item${thread.completedCompactionItemCount === 1 ? "" : "s"}${recoveredCompactionCount === null ? "" : ` · ${recoveredCompactionCount} recovered completed compaction${recoveredCompactionCount === 1 ? "" : "s"} from host history`}. Acceptance alone does not prove a completed compaction or restored ARE control.`
      : "Complete host protocol receipt summary not available from this gateway version";
    const hostedEffect = document.createElement("p");
    const unknownHostedEffectCount = thread.unknownHostedEffectDispatchCount;
    if (Number.isSafeInteger(unknownHostedEffectCount) && unknownHostedEffectCount > 0) {
      hostedEffect.textContent = `${stale ? "Last seen · " : ""}${unknownHostedEffectCount} hosted-effect dispatch${unknownHostedEffectCount === 1 ? " has" : "es have"} an unresolved gateway outcome for this backend thread. Host execution is unknown; this is not permission to retry.`;
    }
    const relay = document.createElement("p");
    relay.className = "thread-relay-check";
    if (thread.mcpHookRelayCheck) {
      relay.textContent = `Last MCP relay catalog check · ${thread.mcpHookRelayCheck.status} at ${new Date(thread.mcpHookRelayCheck.checkedAtUnixMs).toLocaleTimeString()}. Snapshot only; this does not prove continuing tool availability or effect coverage.`;
    }
    const confirmedRecovery = document.createElement("p");
    const recoveredDispatchCount = thread.recoveredDispatchCount;
    if (Number.isSafeInteger(recoveredDispatchCount) && recoveredDispatchCount > 0) {
      confirmedRecovery.textContent = `${recoveredDispatchCount} gateway dispatch recover${recoveredDispatchCount === 1 ? "y was" : "ies were"} durably confirmed for this backend thread after exact host-marker and ARE-state checks. This is not a new completion frontier or desktop-task activation.`;
    }
    const recovery = document.createElement("p");
    if (thread.phase === "recovery-unverified") {
      recovery.textContent = thread.recoveryHostStatus
        ? `Exact host history for this turn: ${thread.recoveryHostStatus}. ARE semantic completion is unverified; new turns remain paused.`
        : "Exact host history for this recovered turn is not verified; new turns remain paused.";
    } else if (thread.phase === "recovery-terminal") {
      recovery.textContent = `${markedHostCount > 0 && thread.verifiedHostTurnCount === 0
        ? "A matching marker was observed in returned host history"
        : "Exact host history for this turn"}: ${thread.recoveryHostStatus ?? "unavailable"}. `
        + (thread.recoveryHostStatus === "completed"
          ? "The host completed this turn, but ARE did not observe its completion notification. No semantic completion, Evolution signal, completion frontier, or automatic successor was inferred. A new request is evaluated separately."
          : "ARE checkpointed the terminal recovery without a completion frontier or automatic retry. A new request is evaluated separately.");
    }
    const details = document.createElement("details");
    details.className = "thread-evidence-details";
    const summary = document.createElement("summary");
    summary.textContent = "Protocol receipts and evidence";
    const identifiers = document.createElement("code");
    identifiers.textContent = `Reasoning epoch ${thread.reasoningEpochDigest}\nCheckpoint ${thread.checkpointDigest}${thread.latestFrontierDigest ? `\nFrontier ${thread.latestFrontierDigest}` : ""}${thread.planContextDigest ? `\nPlan context ${thread.planContextDigest}\nPlan event ${thread.planContextEventSequence}` : ""}${thread.latestHostObservationDigest ? `\nLatest host receipt ${thread.latestHostObservationDigest}` : ""}${thread.recoveryHostObservationDigest ? `\nMatched recovered-turn host receipt ${thread.recoveryHostObservationDigest}` : ""}`;
    details.append(summary, host);
    if (relay.textContent) details.append(relay);
    details.append(identifiers);
    card.append(name, phase, observed, frontier, plan);
    const feedbackLine = document.createElement('p');
    feedbackLine.className = 'adapter-claim-limit';
    feedbackLine.textContent = learningFeedbackLabel(thread.learningFeedback, stale);
    if (thread.learningFeedback?.status === 'observed' && !stale) {
      const feedbackEvidence = document.createElement('p');
      const feedback = thread.learningFeedback;
      feedbackEvidence.textContent = `${feedback.disabled_lesson_count} disabled lessons · ${feedback.dispatched_application_count} dispatched applications · ${feedback.evaluated_application_count} evaluated applications. Checkpointed ${feedback.durability} evidence, not improvement or Evolution cycle admission.`;
      details.append(feedbackEvidence);
    }
    const rejoin = !stale ? hostedRejoinRows?.get(thread.threadRef) : null;
    if (rejoin) {
      const rejoinLine = document.createElement("p");
      rejoinLine.className = "adapter-claim-limit";
      const labels = {"hosted-owned": "Owned in this hosted client", rejoined: "Rejoined in this hosted client",
        "rejoin-ready": "Rejoin preflight ready · explicit Rejoin still required",
        blocked: "Rejoin blocked", unverified: "Rejoin unverified"};
      rejoinLine.textContent = `Hosted client · ${labels[rejoin.status]}${rejoin.reasonCode ? ` (${rejoin.reasonCode})` : ""}. This is read-only status, not Send authority.`;
      card.append(rejoinLine);
      if (rejoin.pendingSteerCheckpoint) {
        const steerLine = document.createElement("p");
        steerLine.className = "adapter-claim-limit";
        steerLine.textContent = "Hosted steer checkpoint retained · exact guidance outcome still needs confirmation in the hosted client. No guidance is resent from this view.";
        card.append(steerLine);
      }
    }
    if (hostedEffect.textContent) card.append(hostedEffect);
    if (confirmedRecovery.textContent) card.append(confirmedRecovery);
    if (["recovery-unverified", "recovery-terminal"].includes(thread.phase)) card.append(recovery);
    card.append(details);
    const detailButton = document.createElement("button");
    detailButton.type = "button";
    detailButton.className = "thread-detail-toggle";
    const runtimeEpochId = lastThreadSnapshot?.runtimeEpochId ?? null;
    detailButton.onclick = () => {
      selectedThreadDetail = selectedThreadDetail?.runtimeEpochId === runtimeEpochId
        && selectedThreadDetail?.threadRef === thread.threadRef
        ? null : {runtimeEpochId, threadRef: thread.threadRef};
      updateThreadDetailVisibility();
    };
    card.append(detailButton);
    renderedThreadDetails.push({button: detailButton, runtimeEpochId,
      threadRef: thread.threadRef, detailNodes: [frontier, details, ...(!thread.planContextDigest ? [plan] : [])]});
    if (!stale && /^backend-thread:[0-9a-f]{64}$/.test(thread.threadRef ?? "")
      && /^gateway-consumer:[0-9a-f]{64}$/.test(thread.consumerRef ?? "")
      && typeof lastThreadSnapshot?.runtimeEpochId === "string") {
      const decisions = document.createElement("button");
      decisions.type = "button";
      decisions.className = "text-link";
      decisions.textContent = "View decisions for this backend thread ↗";
      decisions.setAttribute("aria-label", `View decisions for backend thread ${thread.threadRef.slice(-8)}`);
      decisions.addEventListener("click", () => openDecisionsForThread(thread));
      card.append(decisions);
      decisionLinks.push({button: decisions, threadRef: thread.threadRef, consumerRef: thread.consumerRef});
    }
    details.append(feedbackLine);
    parent.append(card);
  }
  updateThreadDetailVisibility();
  if (focusedDetail) {
    const replacement = renderedThreadDetails.find(entry => entry.runtimeEpochId === focusedDetail.runtimeEpochId
      && entry.threadRef === focusedDetail.threadRef)?.button;
    replacement?.focus({preventScroll: true});
    replacement?.scrollIntoView?.({block: "nearest"});
  }
  if (pendingThreadFocus) {
    const link = decisionLinks.find(item => item.threadRef === pendingThreadFocus.threadRef
      && item.consumerRef === pendingThreadFocus.consumerRef)?.button;
    if (link) {
      link.focus({preventScroll: true});
      link.scrollIntoView?.({block: "nearest"});
      pendingThreadFocus = null;
    }
  }
}

function updateThreadRecoveryDisclosure({current = false, attention = false, partial = false, recovered = 0} = {}) {
  const details = document.getElementById("thread-recovery-details");
  setText("thread-recovery-summary", !current
    ? "Gateway continuity · no current reading"
    : attention
      ? "Gateway continuity needs attention · details shown"
      : partial
        ? "Gateway continuity partly unreported · review details"
        : recovered > 0
          ? `${recovered} confirmed gateway recover${recovered === 1 ? "y" : "ies"} · no unresolved outcomes reported`
          : "Gateway continuity · no unresolved outcomes reported");
  if (!details) return;
  if (attention) details.open = true;
  else if (details.dataset?.autoExpanded === "true") details.open = false;
  if (details.dataset) details.dataset.autoExpanded = attention ? "true" : "false";
}

function showLastSeenThreads(posture) {
  threadObservationStale = true;
  hostedRejoinRows = null;
  setText("thread-rejoin-status", "Hosted-client Rejoin observation is not current. No Rejoin eligibility is claimed.");
  setText("thread-observation-status", posture);
  setSourceDiagnostic("thread", posture, lastThreadObservationAt);
  setText("thread-observation-source", "Source: gateway backend threads · last observation only");
  setText("thread-continuity-status", "Steer continuity is not currently observed.");
  setText("thread-dispatch-status", "Gateway dispatch recovery is not currently observed.");
  setText("thread-hosted-effect-status", "Hosted-effect dispatch outcomes are not currently observed.");
  setText("thread-creation-status", "Thread-creation outcomes are not currently observed.");
  updateThreadRecoveryDisclosure();
  for (const id of ["thread-page-prev", "thread-page-next"]) {
    const button = document.getElementById(id);
    if (button) button.disabled = true;
  }
  if (!lastThreadSnapshot || lastThreadSnapshot.threadCount === 0) {
    if (lastThreadObservationAt !== null) setText("thread-empty-detail",
      `The last read at ${new Date(lastThreadObservationAt).toLocaleTimeString()} had no backend-thread rows. That observation is no longer current; present state is unknown.`);
    document.getElementById("thread-live").hidden = true;
    document.getElementById("thread-empty").hidden = false;
    return;
  }
  paintThreadRows(lastThreadSnapshot.threads, lastThreadObservationAt, true);
  document.getElementById("thread-live").hidden = false;
  document.getElementById("thread-empty").hidden = true;
}

function expireThreadObservation() {
  if (lastThreadObservationAt === null || threadObservationStale
    || Date.now() - lastThreadObservationAt <= THREAD_OBSERVATION_MAX_AGE_MS) return;
  showLastSeenThreads("Stale");
}

async function refreshThreadSnapshot(pageOffset = threadPageOffset, expectedDigest = pageOffset > 0 ? lastThreadSnapshot?.snapshotDigest : null) {
  if (threadReadPending) return;
  threadReadPending = true;
  const focusedPagerAction = ["thread-page-prev", "thread-page-next"]
    .find(id => document.activeElement === document.getElementById(id));
  const focusParkingControl = document.getElementById("thread-page-reset");
  // Keep keyboard focus on an enabled control while the previous page is only last-seen.
  if (focusedPagerAction) focusParkingControl?.focus({preventScroll: true});
  if (lastThreadSnapshot && lastThreadObservationAt !== null) {
    showLastSeenThreads("Reading");
  } else {
    setSourceDiagnostic("thread", "Reading", lastThreadObservationAt);
  }
  setText("thread-observation-status", "Reading…");
  try {
    if (!invoke) throw new Error("thread.unavailable");
    const snapshot = await invoke("get_thread_snapshot", {offset: pageOffset, snapshotDigest: expectedDigest});
    if (snapshot?.schemaVersion !== "are.companion-thread-observation/v1"
      || snapshot.scope !== "gateway-backend-threads-not-host-activation"
      || snapshot.authorityEffect !== "none" || !Array.isArray(snapshot.threads)
      || !Number.isSafeInteger(snapshot.threadCount) || snapshot.threads.length > 32
      || !Number.isSafeInteger(snapshot.pageOffset) || snapshot.pageOffset !== pageOffset
      || (snapshot.threadCount === 0 ? pageOffset !== 0 : pageOffset >= snapshot.threadCount)
      || !/^[0-9a-f]{64}$/.test(snapshot.snapshotDigest ?? "")
      || (expectedDigest !== null && snapshot.snapshotDigest !== expectedDigest)
      || snapshot.nextOffset !== (pageOffset + 32 < snapshot.threadCount ? pageOffset + 32 : null)
      || snapshot.threads.length !== Math.min(32, snapshot.threadCount - pageOffset)
      || !Number.isSafeInteger(snapshot.ongoingThreadCount) || snapshot.ongoingThreadCount < 0
      || snapshot.ongoingThreadCount > snapshot.threadCount
      || !Number.isSafeInteger(snapshot.omittedOngoingThreadCount) || snapshot.omittedOngoingThreadCount < 0
      || snapshot.omittedOngoingThreadCount !== snapshot.ongoingThreadCount
        - snapshot.threads.filter(thread => ["recovery-unverified", "turn-active", "dispatch-pending"].includes(thread?.phase)).length
      || snapshot.threads.some(thread => !thread || !THREAD_PHASES.has(thread.phase)
        || !compatibleLearningFeedback(thread.learningFeedback)
        || (thread.unknownHostedEffectDispatchCount !== undefined
          && thread.unknownHostedEffectDispatchCount !== null
          && (!Number.isSafeInteger(thread.unknownHostedEffectDispatchCount)
            || thread.unknownHostedEffectDispatchCount < 0
            || thread.unknownHostedEffectDispatchCount > 1_000_000
            || !Number.isSafeInteger(snapshot.unknownHostedEffectDispatchCount)
            || thread.unknownHostedEffectDispatchCount > snapshot.unknownHostedEffectDispatchCount))
        || (thread.phase === "turn-completed" && thread.lastCompletionStatus !== null
          && !Object.hasOwn(THREAD_COMPLETION_LABELS, thread.lastCompletionStatus))
        || (thread.mcpHookRelayCheck !== undefined && thread.mcpHookRelayCheck !== null
          && (typeof thread.mcpHookRelayCheck !== "object" || Array.isArray(thread.mcpHookRelayCheck)
            || !["listed", "not-ready"].includes(thread.mcpHookRelayCheck.status)
            || !Number.isSafeInteger(thread.mcpHookRelayCheck.checkedAtUnixMs)
            || thread.mcpHookRelayCheck.checkedAtUnixMs < 0
            || thread.mcpHookRelayCheck.checkedAtUnixMs > snapshot.observedAtUnixMs + 1000)))
      || (snapshot.unknownHostedEffectDispatchCount === null
        || snapshot.unknownHostedEffectDispatchCount === undefined
        ? snapshot.threads.some(thread => thread?.unknownHostedEffectDispatchCount !== undefined
          && thread.unknownHostedEffectDispatchCount !== null)
        : snapshot.threads.reduce((count, thread) => count
          + (thread?.unknownHostedEffectDispatchCount ?? 0), 0)
          > snapshot.unknownHostedEffectDispatchCount)
      || (snapshot.degradedSteerThreadCount !== null
        && (!Number.isSafeInteger(snapshot.degradedSteerThreadCount) || snapshot.degradedSteerThreadCount < 0))
      || (snapshot.unknownDispatchCount !== null
        && (!Number.isSafeInteger(snapshot.unknownDispatchCount) || snapshot.unknownDispatchCount < 0))
      || (snapshot.unknownHostedEffectDispatchCount !== undefined
        && snapshot.unknownHostedEffectDispatchCount !== null
        && (!Number.isSafeInteger(snapshot.unknownHostedEffectDispatchCount)
          || snapshot.unknownHostedEffectDispatchCount < 0
          || snapshot.unknownHostedEffectDispatchCount > 1_000_000
          || !Number.isSafeInteger(snapshot.unknownDispatchCount)
          || snapshot.unknownHostedEffectDispatchCount > snapshot.unknownDispatchCount))
      || (snapshot.unknownThreadCreationCount !== undefined && snapshot.unknownThreadCreationCount !== null
        && (!Number.isSafeInteger(snapshot.unknownThreadCreationCount)
          || snapshot.unknownThreadCreationCount < 0 || snapshot.unknownThreadCreationCount > 1_000_000
          || snapshot.unknownDispatchCount !== null && snapshot.unknownThreadCreationCount > snapshot.unknownDispatchCount))
      || (snapshot.acceptedUnresolvedTurnCount !== undefined && snapshot.acceptedUnresolvedTurnCount !== null
        && (!Number.isSafeInteger(snapshot.acceptedUnresolvedTurnCount)
          || snapshot.acceptedUnresolvedTurnCount < 0 || snapshot.acceptedUnresolvedTurnCount > 1_000_000
          || snapshot.unknownDispatchCount === null
          || snapshot.acceptedUnresolvedTurnCount > snapshot.unknownDispatchCount))
      || (snapshot.recoveredDispatchCount !== undefined && snapshot.recoveredDispatchCount !== null
        && (!Number.isSafeInteger(snapshot.recoveredDispatchCount)
          || snapshot.recoveredDispatchCount < 0 || snapshot.recoveredDispatchCount > 1_000_000))) {
      throw new Error("thread.observation-incompatible");
    }
    if (typeof snapshot.runtimeEpochId !== "string" || !snapshot.runtimeEpochId
      || snapshot.runtimeEpochId.length > 256) throw new Error("thread.observation-incompatible");
    const observedAt = Number(snapshot.observedAtUnixMs);
    if (!Number.isSafeInteger(observedAt) || observedAt > Date.now() + 1000
      || Date.now() - observedAt > 5000) throw new Error("thread.observation-stale");
    if (adapterObservationCurrent && lastAdapterObservationAt !== null
      && Date.now() - lastAdapterObservationAt <= OBSERVATION_MAX_AGE_MS
      && snapshot.runtimeEpochId !== lastAdapterRuntimeEpochId) {
      throw new Error("thread.observation-source-changed");
    }
    lastThreadObservationAt = observedAt;
    lastThreadSnapshot = snapshot;
    hostedRejoinRows = null;
    try {
      const rejoin = await invoke("get_hosted_rejoin_snapshot", {threadRefs: snapshot.threads.map(thread => thread.threadRef)});
      const refs = new Set(snapshot.threads.map(thread => thread.threadRef));
      if (rejoin?.schemaVersion !== "are.companion-hosted-rejoin-observation/v1"
        || rejoin.scope !== "managed-hosted-client-only" || rejoin.authorityEffect !== "none"
        || !Number.isSafeInteger(rejoin.observedAtUnixMs) || Math.abs(Date.now() - rejoin.observedAtUnixMs) > 5000
        || !Array.isArray(rejoin.rows) || rejoin.rows.length > refs.size
        || rejoin.rows.some(row => !refs.has(row?.threadRef)
          || !["hosted-owned", "rejoined", "rejoin-ready", "blocked", "unverified"].includes(row.status)
          || typeof row.pendingSteerCheckpoint !== "boolean"
          || !(row.reasonCode === null || typeof row.reasonCode === "string" && /^windows-client\.[a-z0-9-]+$/.test(row.reasonCode)))
        || new Set(rejoin.rows.map(row => row.threadRef)).size !== rejoin.rows.length) {
        throw new Error("hosted-rejoin.observation-incompatible");
      }
      hostedRejoinRows = new Map(rejoin.rows.map(row => [row.threadRef, row]));
      setText("thread-rejoin-status", `Hosted client · ${rejoin.rows.length} of ${snapshot.threads.length} backend threads on this page are owned here. Rejoin preflight is read-only and current only for this managed client.`);
    } catch (error) {
      setText("thread-rejoin-status", String(error).includes("not-configured")
        ? "Hosted-client Rejoin observation is not configured. Gateway Reasoning State remains separate."
        : "Hosted-client Rejoin observation is unavailable. No Rejoin eligibility is claimed.");
    }
    threadPageOffset = pageOffset;
    threadObservationStale = false;
    const degradedCount = snapshot.degradedSteerThreadCount;
    const unknownDispatchCount = snapshot.unknownDispatchCount;
    const unknownHostedEffectDispatchCount = snapshot.unknownHostedEffectDispatchCount ?? null;
    const unknownThreadCreationCount = snapshot.unknownThreadCreationCount ?? null;
    const acceptedUnresolvedTurnCount = snapshot.acceptedUnresolvedTurnCount ?? null;
    const recoveredDispatchCount = snapshot.recoveredDispatchCount;
    const recoveryAttention = degradedCount > 0 || unknownDispatchCount > 0
      || unknownHostedEffectDispatchCount > 0 || unknownThreadCreationCount > 0
      || acceptedUnresolvedTurnCount > 0;
    const threadPosture = recoveryAttention
      || snapshot.omittedOngoingThreadCount > 0
      ? "Attention" : snapshot.threadCount ? "Observed" : "No records";
    setText("thread-observation-status", threadPosture);
    setSourceDiagnostic("thread", threadPosture, lastThreadObservationAt);
    setText("thread-continuity-status", degradedCount === null
      ? "Steer continuity is not reported by this gateway session."
      : degradedCount > 0
        ? `${degradedCount} backend thread${degradedCount === 1 ? " is" : "s are"} paused after uncertain steer delivery. New turns remain blocked pending reconciliation.`
        : "No degraded steer continuity reported for the observed gateway sessions.");
    const unknownDispatchText = unknownDispatchCount === null
      ? "Gateway dispatch recovery is not reported by this version."
      : unknownDispatchCount > 0
        ? `${unknownDispatchCount} gateway mutation request${unknownDispatchCount === 1 ? " has" : "s have"} an unresolved backend outcome. New mutations in affected sessions remain blocked; read-only inspection is available.`
        : "No unresolved gateway mutation requests reported by the durable session index.";
    const confirmedRecoveryText = recoveredDispatchCount === null || recoveredDispatchCount === undefined
      ? "Confirmed dispatch recovery is not reported by this version."
      : recoveredDispatchCount > 0
        ? `${recoveredDispatchCount} gateway dispatch recover${recoveredDispatchCount === 1 ? "y was" : "ies were"} durably confirmed. This does not establish desktop-task activation.`
        : "No confirmed gateway dispatch recoveries reported.";
    const acceptedUnresolvedText = acceptedUnresolvedTurnCount === null
      ? "Host-accepted unresolved turns are not separately reported by this version."
      : acceptedUnresolvedTurnCount > 0
        ? `${acceptedUnresolvedTurnCount} unresolved turn start${acceptedUnresolvedTurnCount === 1 ? " has" : "s have"} a durable host-acceptance receipt. This is not ARE completion or permission to retry.`
        : "No unresolved turn starts have a retained host-acceptance receipt.";
    setText("thread-dispatch-status", `${unknownDispatchText} ${acceptedUnresolvedText} ${confirmedRecoveryText}`);
    setText("thread-hosted-effect-status", unknownHostedEffectDispatchCount === null
      ? "Hosted-effect dispatch outcomes are not reported by this gateway version."
      : unknownHostedEffectDispatchCount > 0
        ? `${unknownHostedEffectDispatchCount} hosted-effect dispatch${unknownHostedEffectDispatchCount === 1 ? " has" : "es have"} an unresolved gateway outcome. The host may or may not have executed it; this is not a safe-retry signal.`
        : "No unresolved hosted-effect dispatches reported by the gateway session index. This does not prove complete host-effect coverage.");
    setText("thread-creation-status", unknownThreadCreationCount === null
      ? "Unresolved thread-creation count is not reported by this gateway version."
      : unknownThreadCreationCount > 0
        ? `${unknownThreadCreationCount} new or forked thread creation request${unknownThreadCreationCount === 1 ? " has" : "s have"} an unknown backend outcome. No thread identity or safe retry can be inferred from this count.`
        : "No unresolved thread creations reported by the durable session index.");
    updateThreadRecoveryDisclosure({current: true, attention: recoveryAttention,
      partial: [degradedCount, unknownDispatchCount, unknownHostedEffectDispatchCount,
        unknownThreadCreationCount, acceptedUnresolvedTurnCount, recoveredDispatchCount]
        .some(count => count === null || count === undefined),
      recovered: recoveredDispatchCount ?? 0});
    setText("thread-observation-source", adapterObservationCurrent && lastAdapterObservationAt !== null
      && Date.now() - lastAdapterObservationAt <= OBSERVATION_MAX_AGE_MS
      && lastAdapterRuntimeEpochId === snapshot.runtimeEpochId
      ? "Source: same gateway epoch as Adapters · backend-thread Reasoning State only"
      : "Source: gateway backend threads · adapter link not correlated");
    setText("thread-count", snapshot.threadCount);
    setText("thread-observed-at", new Date(lastThreadObservationAt).toLocaleTimeString());
    paintThreadRows(snapshot.threads, lastThreadObservationAt);
    document.getElementById("thread-truncation").hidden = !snapshot.truncated;
    if (snapshot.truncated) setText("thread-truncation",
      `Showing ${pageOffset + 1}–${pageOffset + snapshot.threads.length} of ${snapshot.threadCount} backend threads, with ongoing and recovery-paused states first. `
      + (snapshot.omittedOngoingThreadCount > 0
        ? `${snapshot.omittedOngoingThreadCount} ongoing thread${snapshot.omittedOngoingThreadCount === 1 ? " is" : "s are"} on other pages; use page controls to inspect them.`
        : "All observed ongoing threads are on this page; terminal rows may be on other pages."));
    const pager = document.getElementById("thread-pagination");
    if (pager) pager.hidden = !snapshot.truncated;
    const previous = document.getElementById("thread-page-prev");
    const next = document.getElementById("thread-page-next");
    const focusStillParked = focusedPagerAction && !queuedThreadFreshStart
      && document.activeElement === focusParkingControl;
    const focusedPrevious = document.activeElement === previous
      || (focusStillParked && focusedPagerAction === "thread-page-prev");
    const focusedNext = document.activeElement === next
      || (focusStillParked && focusedPagerAction === "thread-page-next");
    if (previous) previous.disabled = pageOffset === 0;
    if (next) next.disabled = snapshot.nextOffset === null;
    const range = document.getElementById("thread-page-range");
    const rangeText = `Showing ${pageOffset + 1}–${pageOffset + snapshot.threads.length} of ${snapshot.threadCount} backend threads`;
    if (range && range.textContent !== rangeText) range.textContent = rangeText;
    if (focusedPrevious) (previous?.disabled ? next?.disabled ? focusParkingControl : next : previous)
      ?.focus({preventScroll: true});
    if (focusedNext) (next?.disabled ? previous?.disabled ? focusParkingControl : previous : next)
      ?.focus({preventScroll: true});
    document.getElementById("thread-live").hidden = snapshot.threadCount === 0;
    document.getElementById("thread-empty").hidden = snapshot.threadCount !== 0;
    if (snapshot.threadCount === 0) setText("thread-empty-detail", degradedCount > 0
      ? "No current Reasoning State row is available for the paused backend thread. This does not establish control of this desktop chat."
      : unknownDispatchCount > 0
        ? "No current Reasoning State row is available for the unresolved gateway mutation. This does not establish control of this desktop chat."
        : "No backend-thread Reasoning State is observed in this gateway process. This does not mean there are no host tasks or that this desktop chat is ARE-managed.");
  } catch (error) {
    hostedRejoinRows = null;
    setText("thread-rejoin-status", "Hosted-client Rejoin observation is not current. No Rejoin eligibility is claimed.");
    const reason = String(error);
    const posture = reason.includes("source-changed") ? "Source changed"
      : reason.includes("not-configured") ? "Not configured"
      : reason.includes("incompatible") ? "Incompatible"
      : reason.includes("stale") ? "Stale" : "Unavailable";
    setText("thread-observation-status", posture);
    setSourceDiagnostic("thread", posture, lastThreadObservationAt);
    setText("thread-continuity-status", "Steer continuity is not currently observed.");
    setText("thread-dispatch-status", "Gateway dispatch recovery is not currently observed.");
    setText("thread-hosted-effect-status", "Hosted-effect dispatch outcomes are not currently observed.");
    setText("thread-creation-status", "Thread-creation outcomes are not currently observed.");
    setText("thread-empty-detail", lastThreadObservationAt === null
      ? "No bounded gateway-thread read is configured. This page cannot infer this chat's Reasoning State from product health or an adapter connection."
      : `The previous read at ${new Date(lastThreadObservationAt).toLocaleTimeString()} is no longer current. No active thread state is claimed.`);
    showLastSeenThreads(posture);
    setText("thread-observation-source", posture === "Source changed"
      ? expectedDigest !== null
        ? "Source: gateway thread snapshot changed while paging · select Start fresh"
        : "Source: adapter and thread readings came from different gateway epochs · refresh Threads"
      : "Source: gateway backend threads · no current observation");
  } finally {
    threadReadPending = false;
    if (queuedThreadFreshStart) {
      queuedThreadFreshStart = false;
      void refreshThreadSnapshot(0, null);
    }
  }
}

function requestThreadFreshStart() {
  if (threadReadPending) {
    queuedThreadFreshStart = true;
    setText("thread-observation-status", "Reading… · Start fresh queued");
    return;
  }
  void refreshThreadSnapshot(0, null);
}

let decisionReadPending = false;
let lastDecisionObservationAt = null;
let decisionObservationCurrent = false;
let lastDecisionRuntimeEpochId = null;
let decisionFilter = null;
let renderedDecisionDetails = [];
let renderedDecisionRuntimeEpochId = null;

function clearDecisionDetails() {
  const focusedDetail = renderedDecisionDetails.some(entry => entry.summary === document.activeElement);
  renderedDecisionDetails = [];
  renderedDecisionRuntimeEpochId = null;
  if (focusedDetail) {
    const heading = document.getElementById("decisions-title");
    if (heading) {
      heading.tabIndex = -1;
      heading.focus({preventScroll: true});
    }
  }
}

function showDecisionSourceChanged(detail) {
  clearDecisionDetails();
  decisionObservationCurrent = false;
  setText("decision-observation-status", "Source changed");
  setSourceDiagnostic("decision", "Source changed", lastDecisionObservationAt);
  setText("decision-observation-source", "Source: gateway process changed · no current decision join");
  setText("decision-empty-detail", detail);
  document.getElementById("decision-live").hidden = true;
  document.getElementById("decision-empty").hidden = false;
  if (decisionFilter) showDecisionFilter(`Backend thread ${decisionFilter.threadRef.slice(-8)} · gateway process changed`);
}

function selectDecisions(snapshot, filter) {
  if (!filter) return {kind: "all", rows: snapshot.decisions};
  if (snapshot.runtimeEpochId !== filter.runtimeEpochId) return {kind: "source-changed", rows: []};
  return {kind: "filtered", rows: snapshot.decisions.filter(decision =>
    decision.threadRef === filter.threadRef && decision.consumerRef === filter.consumerRef)};
}

function showDecisionFilter(summary = null) {
  const banner = document.getElementById("decision-filter");
  if (banner) banner.hidden = !decisionFilter;
  if (decisionFilter) setText("decision-filter-label", summary
    ?? `Backend thread ${decisionFilter.threadRef.slice(-8)} · current gateway process only`);
}

function clearDecisionFilter() {
  decisionFilter = null;
  showDecisionFilter();
}

function openDecisionsForThread(thread) {
  if (threadObservationStale || lastThreadObservationAt === null
    || Date.now() - lastThreadObservationAt > THREAD_OBSERVATION_MAX_AGE_MS) {
    showLastSeenThreads("Stale");
    return;
  }
  decisionFilter = {threadRef: thread.threadRef, consumerRef: thread.consumerRef,
    runtimeEpochId: lastThreadSnapshot.runtimeEpochId};
  showDecisionFilter();
  showPanel("decisions");
}

function paintDecisionRows(decisions, runtimeEpochId) {
  const parent = document.getElementById("decision-list");
  if (!parent) return;
  const prior = renderedDecisionRuntimeEpochId === runtimeEpochId ? renderedDecisionDetails : [];
  const expanded = new Set(prior.filter(entry => entry.details.open).map(entry => entry.key));
  const focusedOldDetail = renderedDecisionDetails.some(entry => entry.summary === document.activeElement);
  const focusedKey = prior.find(entry => entry.summary === document.activeElement)?.key;
  renderedDecisionDetails = [];
  renderedDecisionRuntimeEpochId = runtimeEpochId;
  parent.replaceChildren();
  const labels = {"turn-preflight": "Turn preflight", "effect-evaluation": "Effect evaluation", "turn-continuation": "Turn continuation"};
  for (const decision of decisions) {
    const card = document.createElement("article");
    card.className = "thread-card decision-card";
    const title = document.createElement("strong");
    title.textContent = labels[decision.decisionType] ?? "Decision evaluation";
    const outcome = document.createElement("span");
    outcome.textContent = `Evaluated · ${decision.outcome}`;
    const thread = document.createElement("p");
    thread.textContent = `Backend thread ${decision.threadRef.slice(-8)} · ${new Date(decision.eventObservedAtUnixMs).toLocaleTimeString()}`;
    const boundary = document.createElement("p");
    boundary.textContent = "Evaluation only · authorization and execution not observed here";
    const details = document.createElement("details");
    const summary = document.createElement("summary");
    summary.textContent = "Reason and technical evidence";
    const key = JSON.stringify([decision.consumerRef, decision.threadRef, decision.eventSequence,
      decision.decisionDigest, decision.evidenceEventDigest]);
    details.open = expanded.has(key);
    const reason = document.createElement("p");
    reason.textContent = decision.reasonCodes.length
      ? `Reason codes: ${decision.reasonCodes.join(" · ")}`
      : "No reason code recorded for this evaluation";
    const identifiers = document.createElement("code");
    identifiers.textContent = `Decision ${decision.decisionDigest}\nEvidence event ${decision.evidenceEventDigest}\nJournal sequence ${decision.eventSequence}`;
    details.append(summary, reason, identifiers);
    card.append(title, outcome, thread, boundary, details);
    parent.append(card);
    renderedDecisionDetails.push({key, summary, details});
  }
  if (focusedOldDetail) {
    const replacement = focusedKey
      ? renderedDecisionDetails.find(entry => entry.key === focusedKey)?.summary : null;
    if (replacement) replacement.focus({preventScroll: true});
    else {
      const heading = document.getElementById("decisions-title");
      if (heading) {
        heading.tabIndex = -1;
        heading.focus({preventScroll: true});
      }
    }
  }
}

async function refreshDecisionSnapshot() {
  if (decisionReadPending) return;
  decisionReadPending = true;
  setText("decision-observation-status", "Reading…");
  setSourceDiagnostic("decision", "Reading", lastDecisionObservationAt);
  try {
    if (!invoke) throw new Error("decision.unavailable");
    const snapshot = await invoke("get_decision_snapshot");
    if (snapshot?.schemaVersion !== "are.companion-decision-observation/v1"
      || snapshot.scope !== "gateway-backend-decisions-not-durable-host-history"
      || snapshot.authorityEffect !== "none" || !Array.isArray(snapshot.decisions)
      || !Number.isSafeInteger(snapshot.decisionCount) || snapshot.decisions.length > 32
      || typeof snapshot.runtimeEpochId !== "string" || !snapshot.runtimeEpochId
      || snapshot.runtimeEpochId.length > 256) {
      throw new Error("decision.observation-incompatible");
    }
    lastDecisionObservationAt = freshObservationTime(snapshot.observedAtUnixMs, "decision");
    lastDecisionRuntimeEpochId = snapshot.runtimeEpochId;
    const selected = selectDecisions(snapshot, decisionFilter);
    if (selected.kind === "source-changed") {
      showDecisionSourceChanged("The gateway process changed since this thread was observed. Refresh Threads before linking decisions.");
      return;
    }
    if (adapterObservationCurrent && lastAdapterObservationAt !== null
      && Date.now() - lastAdapterObservationAt <= OBSERVATION_MAX_AGE_MS
      && snapshot.runtimeEpochId !== lastAdapterRuntimeEpochId) {
      throw new Error("decision.observation-source-changed");
    }
    decisionObservationCurrent = true;
    const posture = selected.rows.length ? "Observed" : snapshot.decisionCount ? "No matching records" : "No records";
    setText("decision-observation-status", posture);
    setSourceDiagnostic("decision", posture, lastDecisionObservationAt);
    setText("decision-observation-source", "Source: current gateway consumers · backend-thread evaluations only");
    setText("decision-count", snapshot.decisionCount);
    setText("decision-observed-at", new Date(lastDecisionObservationAt).toLocaleTimeString());
    paintDecisionRows(selected.rows, snapshot.runtimeEpochId);
    document.getElementById("decision-truncation").hidden = !snapshot.truncated;
    document.getElementById("decision-live").hidden = selected.rows.length === 0;
    document.getElementById("decision-empty").hidden = selected.rows.length !== 0;
    if (decisionFilter && selected.rows.length === 0) setText("decision-empty-detail", snapshot.truncated
      ? "No match in the 32 most recent gateway decisions. Older records may be omitted; this does not prove no decisions exist."
      : "No decision for this backend thread appears in this bounded snapshot. Host-task history remains unknown.");
    else if (snapshot.decisionCount === 0) setText("decision-empty-detail", "No backend-thread decisions are observed for current gateway consumers. This does not imply no host task decisions exist.");
    showDecisionFilter(decisionFilter
      ? `Backend thread ${decisionFilter.threadRef.slice(-8)} · ${selected.rows.length} of ${snapshot.decisions.length} recent records` : null);
  } catch (error) {
    decisionObservationCurrent = false;
    const reason = String(error);
    if (reason.includes("source-changed")) {
      showDecisionSourceChanged("The decision and adapter readings came from different gateway processes. Refresh Decisions and Adapters before treating them as one path.");
      return;
    }
    clearDecisionDetails();
    const posture = reason.includes("not-configured") ? "Not configured"
      : reason.includes("incompatible") ? "Incompatible"
      : reason.includes("stale") ? "Stale" : "Unavailable";
    setText("decision-observation-status", posture);
    setSourceDiagnostic("decision", posture, lastDecisionObservationAt);
    setText("decision-observation-source", "Source: gateway backend decisions · no current observation");
    setText("decision-empty-detail", lastDecisionObservationAt === null
      ? "No bounded gateway-decision read is configured. This page cannot infer history or authorization from product health."
      : `The previous reading at ${new Date(lastDecisionObservationAt).toLocaleTimeString()} is no longer current. No complete host decision history is claimed.`);
    document.getElementById("decision-live").hidden = true;
    document.getElementById("decision-empty").hidden = false;
  } finally {
    decisionReadPending = false;
  }
}

let evolutionReadPending = false;
let lastEvolutionObservationAt = null;
let evolutionObservationCurrent = false;
let lastEvolutionVerifiedAt = null;
let lastEvolutionIndexStatus = null;

function showEvolutionLastSeen(posture) {
  const retained = lastEvolutionVerifiedAt !== null && (posture === "Stale" || posture === "Unavailable");
  document.getElementById("evolution-live").hidden = !retained;
  document.getElementById("evolution-empty").hidden = retained;
  document.getElementById("evolution-history-note").hidden = !retained;
  if (!retained) return;
  setText("evolution-history-note", `Last verified ledger read at ${new Date(lastEvolutionVerifiedAt).toLocaleTimeString()}. Definitions, counts, cycle events, and coordination below are historical; current cycle and worker state are unknown.`);
  setText("evolution-evidence-status", "Last verified · not current");
  document.getElementById("evolution-index-line").hidden = !retained || lastEvolutionIndexStatus === null;
  if (retained && lastEvolutionIndexStatus !== null) {
    setText("evolution-index-status", `Last seen · ${lastEvolutionIndexStatus === "healthy" ? "matched"
      : lastEvolutionIndexStatus === "rebuild-required" ? "rebuild required" : "unavailable"}`);
    setText("evolution-index-detail", "This is the prior index posture, not a current health check. No recovery was run.");
  }
}

function paintEvolutionRows(id, rows) {
  const parent = document.getElementById(id);
  if (!parent) return;
  parent.replaceChildren();
  for (const [name, detail, posture] of rows) {
    const row = document.createElement("div");
    row.className = posture ? `evolution-row evolution-phase-row phase-${posture}` : "evolution-row";
    const title = document.createElement("strong");
    title.textContent = name;
    const description = document.createElement("span");
    description.textContent = detail;
    row.append(title, description);
    parent.append(row);
  }
}

function evolutionPhasePosture(states) {
  if (states.blocked > 0) return ["blocked", "Blocked work recorded"];
  if (states.ready > 0) return ["ready", "Ready work recorded"];
  if (states.leased > 0) return ["leased", "Lease recorded; worker status unknown"];
  if (states.planned > 0) return ["planned", "Planned work recorded"];
  if (states.completed > 0) return ["completed", "Recorded work completed"];
  return ["empty", "No work items recorded"];
}

const EVOLUTION_DEFINITION_EXPLANATIONS = Object.freeze({
  "benchmark-research": "Designed to qualify experiments and candidate changes against recorded benchmark results.",
  "research-learning": "Designed to follow a research question through evidence, hypotheses, and findings.",
  "engine-improvement": "Designed to compare technique variants before any recommendation is considered.",
  "interaction-learning": "Designed to record, apply, and revoke lessons from interactions.",
  "controlled-upgrade": "Designed to track separately authorized activation, verification, and rollback.",
});

function paintEvolutionDefinitions(definitions) {
  const parent = document.getElementById("evolution-definitions");
  if (!parent) return;
  parent.replaceChildren();
  if (definitions.length === 0) {
    paintEvolutionRows("evolution-definitions", [["No verified definitions", "Registry unavailable"]]);
    return;
  }
  for (const definition of definitions) {
    const row = document.createElement("article");
    row.className = "evolution-definition";
    const title = document.createElement("h3");
    title.textContent = definition.cycleKind.replaceAll("-", " ").replace(/^./, letter => letter.toUpperCase());
    const status = document.createElement("span");
    status.textContent = `Registry status: ${definition.admissionStatus} · Admission ${definition.admitted ? "yes" : "no"} · Enabled ${definition.enabled ? "yes" : "no"}`;
    const explanation = document.createElement("p");
    explanation.textContent = Object.hasOwn(EVOLUTION_DEFINITION_EXPLANATIONS, definition.cycleKind)
      ? EVOLUTION_DEFINITION_EXPLANATIONS[definition.cycleKind]
      : "Definition purpose is not described in this Companion version; inspect its source registry before drawing a conclusion.";
    const source = document.createElement("small");
    source.textContent = `Registry ref: ${definition.definitionRef}`;
    row.append(title, status, explanation, source);
    parent.append(row);
  }
}

function setEvolutionSummaryMode(verified, registryOnly, definitionCount) {
  document.getElementById("evolution-evidence-line").hidden = registryOnly;
  document.getElementById("evolution-evidence-metrics").hidden = !verified;
  document.getElementById("evolution-registry-summary").hidden = verified;
  if (!verified) {
    setText("evolution-registry-summary", `${definitionCount} registry definition${definitionCount === 1 ? "" : "s"} · ${registryOnly ? "No runtime root configured" : "No verified ledger evidence"}. Cycle and commit counts are not available.`);
  }
}

function prioritizeEvolutionEvidence(hasVerifiedCycles) {
  const metrics = document.getElementById("evolution-evidence-metrics");
  const definitions = document.getElementById("evolution-definition-card");
  const cycles = document.getElementById("evolution-cycle-card");
  const parent = definitions?.parentElement;
  if (!parent || metrics?.parentElement !== parent || cycles?.parentElement !== parent) return;
  const placeBefore = (item, before) => {
    const children = [...parent.children];
    if (children[children.indexOf(item) + 1] !== before) parent.insertBefore(item, before);
  };
  if (hasVerifiedCycles) {
    placeBefore(cycles, metrics);
    placeBefore(metrics, definitions);
  } else {
    placeBefore(metrics, definitions);
    placeBefore(definitions, cycles);
  }
  const panel = document.getElementById("panel-evolution");
  const teaser = document.querySelector("#panel-evolution .evolution-signal-teaser");
  const empty = document.getElementById("evolution-empty");
  const live = document.getElementById("evolution-live");
  if (!panel || !teaser || !empty || !live) return;
  const siblings = [...panel.children];
  const teaserIndex = siblings.indexOf(teaser);
  const anchorIndex = siblings.indexOf(hasVerifiedCycles ? live : empty);
  if (teaserIndex < 0 || anchorIndex < 0
    || (hasVerifiedCycles ? teaserIndex === anchorIndex + 1 : teaserIndex === anchorIndex - 1)) return;
  const focused = teaser.contains(document.activeElement) ? document.activeElement : null;
  panel.insertBefore(teaser, hasVerifiedCycles ? (siblings[anchorIndex + 1] ?? null) : empty);
  focused?.focus({preventScroll: true});
}

let evolutionVisibleCycles = [];
let evolutionLedgerCycleCount = 0;
let evolutionCyclesTruncated = false;
let renderedEvolutionCycles = [];

function paintSelectedEvolutionCycles() {
  const select = document.getElementById("evolution-cycle-definition");
  const selected = select?.value ?? "";
  const rows = selected ? evolutionVisibleCycles.filter(cycle => cycle.cycleDefinitionRef === selected)
    : evolutionVisibleCycles;
  paintEvolutionCycles(rows, true);
  const scope = evolutionCyclesTruncated ? ` of ${evolutionVisibleCycles.length} projected cycles; ledger total ${evolutionLedgerCycleCount}`
    : ` of ${evolutionLedgerCycleCount} verified cycles`;
  setText("evolution-cycle-filter-status", `Showing ${rows.length}${scope}. This filters only the bounded rows shown here, not the ledger or worker state.`);
}

function setEvolutionCycleProjection(cycles, verified, registryOnly, cycleCount = 0, truncated = false) {
  const container = document.getElementById("evolution-cycle-filter");
  const select = document.getElementById("evolution-cycle-definition");
  if (!container || !select) return;
  if (!verified) {
    evolutionVisibleCycles = [];
    evolutionLedgerCycleCount = 0;
    evolutionCyclesTruncated = false;
    select.value = "";
    container.hidden = true;
    paintEvolutionCycles([], false, registryOnly);
    return;
  }
  evolutionVisibleCycles = cycles;
  evolutionLedgerCycleCount = cycleCount;
  evolutionCyclesTruncated = truncated;
  const definitions = [...new Set(cycles.map(cycle => cycle.cycleDefinitionRef))].sort();
  const previous = select.value;
  select.replaceChildren();
  for (const definition of ["", ...definitions]) {
    const option = document.createElement("option");
    option.value = definition;
    option.textContent = definition || "All visible definitions";
    select.append(option);
  }
  container.hidden = definitions.length < 2;
  select.value = !container.hidden && definitions.includes(previous) ? previous : "";
  paintSelectedEvolutionCycles();
}

function paintEvolutionCycles(cycles, verified, registryOnly = false) {
  const parent = document.getElementById("evolution-cycles");
  if (!parent) return;
  const expanded = new Set(renderedEvolutionCycles.filter(entry => entry.details.open).map(entry => entry.key));
  const focusedOldDetail = renderedEvolutionCycles.some(entry => entry.summary === document.activeElement);
  const focusedKey = renderedEvolutionCycles.find(entry => entry.summary === document.activeElement)?.key;
  renderedEvolutionCycles = [];
  parent.replaceChildren();
  if (cycles.length === 0) {
    paintEvolutionRows("evolution-cycles", [["No observed cycles", verified ? "Verified ledger is empty"
      : registryOnly ? "Runtime root not configured; no cycle ledger was read" : "No verified ledger projection"]]);
  }
  for (const cycle of cycles) {
    const details = document.createElement("details");
    details.className = "evolution-cycle";
    const summary = document.createElement("summary");
    const key = JSON.stringify([cycle.cycleRef, cycle.cycleDefinitionRef, cycle.eventRevision,
      cycle.derivedDisposition, cycle.lastEventType, cycle.eventCount, cycle.recentEventTypes, cycle.eventsTruncated]);
    details.open = expanded.has(key);
    const title = document.createElement("strong");
    title.textContent = cycle.cycleRef;
    const meta = document.createElement("span");
    meta.textContent = `${cycle.cycleDefinitionRef} · Recorded disposition: ${cycle.derivedDisposition ?? "undetermined"} · Latest verified event type: ${cycle.lastEventType ?? "none"} · ${cycle.eventCount} verified event${cycle.eventCount === 1 ? "" : "s"}`;
    summary.append(title, meta);
    const timeline = document.createElement("ol");
    timeline.setAttribute("aria-label", `Recent verified events for ${cycle.cycleRef}`);
    const firstEvent = cycle.eventCount - cycle.recentEventTypes.length + 1;
    for (const [index, eventType] of cycle.recentEventTypes.entries()) {
      const item = document.createElement("li");
      item.textContent = `Event ${firstEvent + index} · ${eventType}`;
      timeline.append(item);
    }
    if (cycle.eventsTruncated) {
      const note = document.createElement("p");
      note.textContent = `${cycle.eventCount - cycle.recentEventTypes.length} earlier verified events omitted from this bounded view.`;
      details.append(summary, note, timeline);
    } else {
      details.append(summary, timeline);
    }
    const limit = document.createElement("p");
    limit.textContent = "Event types only; this is ledger history, not proof of a worker running now.";
    details.append(limit);
    parent.append(details);
    renderedEvolutionCycles.push({key, summary, details});
  }
  if (focusedOldDetail) {
    const replacement = renderedEvolutionCycles.find(entry => entry.key === focusedKey)?.summary;
    if (replacement) replacement.focus({preventScroll: true});
    else {
      const heading = document.getElementById("evolution-title");
      if (heading) {
        heading.tabIndex = -1;
        heading.focus({preventScroll: true});
      }
    }
  }
}

function compatibleEvolutionSnapshot(snapshot) {
  const registryOnly = snapshot?.source === "candidate-registry-only";
  const rootStatuses = registryOnly ? ["not-configured"] : ["absent", "present", "invalid", "unknown"];
  const evidenceStatuses = ["not-observed", "verified", "corrupt", "unavailable", "registry-invalid"];
  const coordination = snapshot?.coordinationSummary;
  const counts = coordination?.workStateCounts;
  const phaseSummaries = snapshot?.phaseSummaries;
  const phaseDetailsAbsent = phaseSummaries === undefined && snapshot?.phaseSummariesTruncated === undefined;
  const validPhaseDetails = phaseDetailsAbsent || (Array.isArray(phaseSummaries)
    && phaseSummaries.length <= 8
    && typeof snapshot.phaseSummariesTruncated === "boolean"
    && phaseSummaries.length === Math.min(coordination?.phaseCount ?? 0, 8)
    && snapshot.phaseSummariesTruncated === ((coordination?.phaseCount ?? 0) > 8)
    && phaseSummaries.every(row => row !== null && typeof row === "object"
      && (row.cycleRef === null || typeof row.cycleRef === "string"
        && Array.isArray(snapshot.cycles)
        && snapshot.cycles.some(cycle => cycle?.cycleRef === row.cycleRef))
      && typeof row.phase === "string" && row.phase.length > 0 && row.phase.length <= 256
      && Number.isSafeInteger(row.eventCount) && row.eventCount > 0 && row.eventCount <= 1_000_000
      && row.workStateCounts !== null && typeof row.workStateCounts === "object"
      && ["planned", "ready", "leased", "completed", "blocked"].every(key =>
        Number.isSafeInteger(row.workStateCounts[key]) && row.workStateCounts[key] >= 0
        && row.workStateCounts[key] <= 1_000_000))
    && (coordination === null ? phaseSummaries.length === 0 && !snapshot.phaseSummariesTruncated
      : ["planned", "ready", "leased", "completed", "blocked"].every(key => {
      const projected = phaseSummaries.reduce((sum, row) => sum + row.workStateCounts[key], 0);
      const total = coordination?.workStateCounts?.[key];
      return Number.isSafeInteger(total) && (coordination.phaseCount <= 8
        ? projected === total : projected <= total);
    })));
  const validCoordination = snapshot?.evidenceStatus === "verified"
    ? coordination !== null && typeof coordination === "object"
      && Number.isSafeInteger(coordination.phaseCount) && coordination.phaseCount >= 0
      && counts !== null && typeof counts === "object"
      && ["planned", "ready", "leased", "completed", "blocked"].every(key => Number.isSafeInteger(counts[key]) && counts[key] >= 0)
      && (coordination.phaseCount > 0 || ["planned", "ready", "leased", "completed", "blocked"].every(key => counts[key] === 0))
    : coordination === null;
  return snapshot?.schemaVersion === "are.companion-evolution-observation/v1"
    && (registryOnly || snapshot.source === "durable-ledger-and-candidate-registry")
    && snapshot.authorityEffect === "none"
    && rootStatuses.includes(snapshot.rootStatus)
    && evidenceStatuses.includes(snapshot.evidenceStatus)
    && (snapshot.evidenceStatus === "verified"
      ? ["healthy", "rebuild-required", "unavailable"].includes(snapshot.operationalIndexStatus)
      : snapshot.operationalIndexStatus === "not-observed")
    && validCoordination
    && validPhaseDetails
    && (snapshot.evidenceStatus !== "verified" || snapshot.rootStatus === "present")
    && (!registryOnly || (["not-observed", "registry-invalid"].includes(snapshot.evidenceStatus)
      && snapshot.cycles?.length === 0 && snapshot.cycleCount === 0 && snapshot.commitCount === 0
      && snapshot.cyclesTruncated === false && snapshot.projectionDigest === null))
    && Array.isArray(snapshot.definitions) && snapshot.definitions.length <= 5
    && snapshot.definitions.every(item => typeof item.definitionRef === "string" && item.definitionRef.length > 0
      && item.definitionRef.length <= 128 && typeof item.cycleKind === "string" && item.cycleKind.length > 0
      && item.cycleKind.length <= 128 && typeof item.admissionStatus === "string" && item.admissionStatus.length > 0
      && item.admissionStatus.length <= 32 && typeof item.admitted === "boolean" && typeof item.enabled === "boolean")
    && Array.isArray(snapshot.cycles) && snapshot.cycles.length <= 24
    && Number.isSafeInteger(snapshot.cycleCount) && snapshot.cycleCount >= snapshot.cycles.length
    && Number.isSafeInteger(snapshot.commitCount) && snapshot.commitCount >= 0
    && typeof snapshot.cyclesTruncated === "boolean"
    && snapshot.cyclesTruncated === (snapshot.cycleCount > 24)
    && snapshot.cycles.every(cycle => typeof cycle.cycleRef === "string" && cycle.cycleRef.length > 0
      && cycle.cycleRef.length <= 256 && typeof cycle.cycleDefinitionRef === "string"
      && cycle.cycleDefinitionRef.length > 0 && cycle.cycleDefinitionRef.length <= 128
      && Number.isSafeInteger(cycle.eventRevision) && cycle.eventRevision >= 0
      && (cycle.derivedDisposition === null || (typeof cycle.derivedDisposition === "string"
        && cycle.derivedDisposition.length > 0 && cycle.derivedDisposition.length <= 256))
      && Number.isSafeInteger(cycle.eventCount) && cycle.eventCount >= 0
      && Array.isArray(cycle.recentEventTypes) && cycle.recentEventTypes.length <= 8
      && cycle.recentEventTypes.every(type => typeof type === "string" && type.length > 0 && type.length <= 128)
      && (cycle.lastEventType === null || (typeof cycle.lastEventType === "string"
        && cycle.lastEventType.length > 0 && cycle.lastEventType.length <= 256))
      && typeof cycle.eventsTruncated === "boolean"
      && cycle.eventCount >= cycle.recentEventTypes.length
      && (cycle.eventCount > cycle.recentEventTypes.length) === cycle.eventsTruncated
      && (cycle.eventCount === 0) === (cycle.recentEventTypes.length === 0)
      && (cycle.lastEventType ?? null) === (cycle.recentEventTypes.at(-1) ?? null));
}

async function refreshEvolutionSnapshot() {
  if (evolutionReadPending) return;
  evolutionReadPending = true;
  setText("evolution-observation-status", "Reading…");
  setSourceDiagnostic("evolution", "Reading", lastEvolutionObservationAt);
  if (lastEvolutionVerifiedAt !== null) showEvolutionLastSeen("Stale");
  try {
    if (!invoke) throw new Error("evolution.unavailable");
    const snapshot = await invoke("get_evolution_snapshot");
    if (!compatibleEvolutionSnapshot(snapshot)) {
      throw new Error("evolution.observation-incompatible");
    }
    lastEvolutionObservationAt = freshObservationTime(snapshot.observedAtUnixMs, "evolution");
    if (snapshot.evidenceStatus === "unavailable") {
      evolutionObservationCurrent = false;
      setText("evolution-observation-status", "Unavailable");
      setSourceDiagnostic("evolution", "Unavailable", lastEvolutionObservationAt);
      setText("evolution-observation-source", "Source: explicit Evolution runtime root · no current observation");
      setText("evolution-empty-detail", "The Evolution source could not verify its ledger. No current cycle or worker state is claimed.");
      if (lastEvolutionVerifiedAt === null) setEvolutionCycleProjection([], false, false);
      showEvolutionLastSeen("Unavailable");
      return;
    }
    evolutionObservationCurrent = true;
    const registryOnly = snapshot.source === "candidate-registry-only";
    const verified = snapshot.evidenceStatus === "verified";
    lastEvolutionVerifiedAt = verified ? lastEvolutionObservationAt : null;
    lastEvolutionIndexStatus = verified ? snapshot.operationalIndexStatus : null;
    const posture = snapshot.evidenceStatus === "registry-invalid" ? "Invalid registry"
      : registryOnly ? "Registry only" : verified ? "Verified ledger"
        : snapshot.evidenceStatus === "corrupt" ? "Invalid evidence" : "No runtime evidence";
    setText("evolution-observation-status", posture);
    setSourceDiagnostic("evolution", posture, lastEvolutionObservationAt);
    setText("evolution-observation-source", registryOnly
      ? "Source: bundled candidate registry · runtime root not configured; no worker observed"
      : "Source: explicit Evolution root · durable ledger + candidate registry; no worker liveness observed");
    setText("evolution-evidence-status", registryOnly ? "runtime not configured" : snapshot.evidenceStatus);
    document.getElementById("evolution-index-line").hidden = !verified;
    if (verified) {
      const indexStatus = snapshot.operationalIndexStatus;
      setText("evolution-index-status", indexStatus === "rebuild-required" ? "Rebuild required"
        : indexStatus === "healthy" ? "Matches verified ledger" : "Unavailable");
      setText("evolution-index-detail", indexStatus === "rebuild-required"
        ? "The disposable query index differs from verified ledger history. Ledger evidence remains verified; no recovery was run."
        : indexStatus === "healthy"
          ? "The query index matches this verified ledger projection; this does not prove a worker is running."
          : "The query index could not be safely read without side effects. Ledger evidence remains verified; no recovery was run.");
    }
    setText("evolution-observed-at", new Date(lastEvolutionObservationAt).toLocaleTimeString());
    setText("evolution-definition-count", snapshot.definitions.length);
    setText("evolution-cycle-count", verified ? snapshot.cycleCount : "—");
    setText("evolution-commit-count", verified ? snapshot.commitCount : "—");
    setEvolutionSummaryMode(verified, registryOnly, snapshot.definitions.length);
    paintEvolutionDefinitions(snapshot.definitions);
    setEvolutionCycleProjection(verified ? snapshot.cycles : [], verified, registryOnly,
      snapshot.cycleCount, snapshot.cyclesTruncated);
    prioritizeEvolutionEvidence(verified && snapshot.cycles.length > 0);
    if (verified) {
      const {phaseCount, workStateCounts: counts} = snapshot.coordinationSummary;
      const rows = [
        ["Phases", `${phaseCount} admitted phase${phaseCount === 1 ? "" : "s"} in the verified ledger`],
        ["Work items", `Planned ${counts.planned} · Ready ${counts.ready} · Leased ${counts.leased} · Completed ${counts.completed} · Blocked ${counts.blocked}`],
      ];
      if (Array.isArray(snapshot.phaseSummaries)) {
        snapshot.phaseSummaries.forEach((phase, index) => {
          const states = phase.workStateCounts;
          const [posture, postureNote] = evolutionPhasePosture(states);
          rows.push([`Phase ${index + 1} · ${phase.phase}`,
            `${phase.cycleRef ?? "Cycle outside this bounded cycle view"} · Planned ${states.planned} · Ready ${states.ready} · Leased ${states.leased} · Completed ${states.completed} · Blocked ${states.blocked} · ${phase.eventCount} recorded event${phase.eventCount === 1 ? "" : "s"} · ${postureNote}`,
            posture]);
        });
        if (snapshot.phaseSummariesTruncated) rows.push(["More phases omitted", "Showing the first eight phases in canonical order; the verified ledger contains more."]);
      } else if (phaseCount > 0) {
        rows.push(["Phase detail unavailable", "This observer version provides only aggregate coordination counts."]);
      }
      paintEvolutionRows("evolution-coordination", rows);
    } else {
      paintEvolutionRows("evolution-coordination", [["No coordination projection", registryOnly
        ? "Runtime root not configured" : "No verified ledger projection"]]);
    }
    document.getElementById("evolution-truncation").hidden = !verified || !snapshot.cyclesTruncated;
    document.getElementById("evolution-history-note").hidden = true;
    document.getElementById("evolution-empty").hidden = true;
    document.getElementById("evolution-live").hidden = false;
  } catch (error) {
    evolutionObservationCurrent = false;
    const reason = String(error);
    const posture = reason.includes("not-configured") ? "Not configured"
      : reason.includes("incompatible") ? "Incompatible"
      : reason.includes("stale") ? "Stale" : "Unavailable";
    if (posture === "Not configured" || posture === "Incompatible") {
      lastEvolutionVerifiedAt = null;
      lastEvolutionIndexStatus = null;
    }
    if (lastEvolutionVerifiedAt === null) setEvolutionCycleProjection([], false, false);
    setText("evolution-observation-status", posture);
    setSourceDiagnostic("evolution", posture, lastEvolutionObservationAt);
    setText("evolution-observation-source", "Source: explicit Evolution runtime root · no current observation");
    setText("evolution-empty-detail", lastEvolutionObservationAt === null
      ? "No safe Evolution observation is configured. Candidate definitions are not evidence of an executing cycle."
      : `The previous reading at ${new Date(lastEvolutionObservationAt).toLocaleTimeString()} is no longer current. No live state is claimed.`);
    showEvolutionLastSeen(posture);
  } finally {
    evolutionReadPending = false;
  }
}

let evolutionSignalReadPending = false;
let lastEvolutionSignalObservationAt = null;
let evolutionSignalObservationCurrent = false;

function setEvolutionSignalTeaser(status, count = null) {
  setText("evolution-signal-teaser-status", status);
  setText("evolution-signal-teaser-count", count === null
    ? "No current count" : `${count} recorded candidate${count === 1 ? "" : "s"}`);
}

function compatibleEvolutionSignalSnapshot(snapshot) {
  const keys = ["schemaVersion", "source", "evidenceStatus", "authorityEffect", "observedAtUnixMs",
    "candidateCount", "candidatesTruncated", "candidates", "logDigest"];
  const hash = value => typeof value === "string" && /^[a-f0-9]{64}$/.test(value);
  return snapshot !== null && typeof snapshot === "object" && !Array.isArray(snapshot)
    && Object.keys(snapshot).length === keys.length && keys.every(key => Object.hasOwn(snapshot, key))
    && snapshot.schemaVersion === "are.companion-evolution-signal-observation/v1"
    && snapshot.source === "gateway-candidate-inbox" && snapshot.evidenceStatus === "verified"
    && snapshot.authorityEffect === "none" && hash(snapshot.logDigest)
    && Number.isSafeInteger(snapshot.observedAtUnixMs) && snapshot.observedAtUnixMs >= 0
    && Number.isSafeInteger(snapshot.candidateCount) && snapshot.candidateCount >= 0
    && Array.isArray(snapshot.candidates)
    && snapshot.candidates.length === Math.min(snapshot.candidateCount, 16)
    && snapshot.candidatesTruncated === (snapshot.candidateCount > 16)
    && snapshot.candidates.every(item => item !== null && typeof item === "object" && !Array.isArray(item)
      && Object.keys(item).length === 2 && Object.hasOwn(item, "kind") && Object.hasOwn(item, "recordDigest")
      && item.kind === "semantic-evaluation-blocked" && hash(item.recordDigest))
    && new Set(snapshot.candidates.map(item => item.recordDigest)).size === snapshot.candidates.length;
}

async function refreshEvolutionSignals() {
  if (evolutionSignalReadPending) return;
  evolutionSignalReadPending = true;
  setText("evolution-signal-status", "Reading…");
  setEvolutionSignalTeaser("Reading…");
  setSourceDiagnostic("evolution-signal", "Reading", lastEvolutionSignalObservationAt);
  try {
    if (!invoke) throw new Error("evolution.signals-unavailable");
    const snapshot = await invoke("get_evolution_signal_snapshot");
    if (!compatibleEvolutionSignalSnapshot(snapshot)) {
      throw new Error("evolution.signals-incompatible");
    }
    lastEvolutionSignalObservationAt = freshObservationTime(snapshot.observedAtUnixMs, "evolution.signals");
    evolutionSignalObservationCurrent = true;
    setText("evolution-signal-status", "Verified candidate inbox");
    setEvolutionSignalTeaser("Verified candidate inbox", snapshot.candidateCount);
    setSourceDiagnostic("evolution-signal", "Verified candidate inbox", lastEvolutionSignalObservationAt);
    setText("evolution-signal-source", "Separate checkpointed gateway inbox · no cycle admission");
    setText("evolution-signal-count", snapshot.candidateCount);
    setText("evolution-signal-observed-at", new Date(lastEvolutionSignalObservationAt).toLocaleTimeString());
    paintEvolutionRows("evolution-signal-list", snapshot.candidates.length
      ? snapshot.candidates.map(item => ["Semantic evaluation blocked", `Candidate ${item.recordDigest.slice(0, 12)}…`])
      : [["No candidates recorded", "Verified inbox is empty"]]);
    document.getElementById("evolution-signal-truncation").hidden = !snapshot.candidatesTruncated;
  } catch (error) {
    evolutionSignalObservationCurrent = false;
    const reason = String(error);
    const posture = reason.includes("not-configured") ? "Not configured"
      : reason.includes("stale") ? "Stale" : reason.includes("incompatible") ? "Incompatible" : "Unavailable";
    setText("evolution-signal-status", posture);
    setEvolutionSignalTeaser(posture);
    setSourceDiagnostic("evolution-signal", posture, lastEvolutionSignalObservationAt);
    setText("evolution-signal-source", lastEvolutionSignalObservationAt === null
      ? "Separate gateway candidate inbox · no current observation"
      : `Previous reading at ${new Date(lastEvolutionSignalObservationAt).toLocaleTimeString()} is no longer current`);
    setText("evolution-signal-count", "—");
    setText("evolution-signal-observed-at", "—");
    paintEvolutionRows("evolution-signal-list", []);
    document.getElementById("evolution-signal-truncation").hidden = true;
  } finally {
    evolutionSignalReadPending = false;
  }
}

function expireOtherObservations() {
  const expired = observedAt => observedAt !== null && Date.now() - observedAt > OBSERVATION_MAX_AGE_MS;
  if (productObservationCurrent && expired(lastProductObservationAt)) {
    productObservationCurrent = false;
    const banner = document.getElementById("connection-banner");
    banner?.classList.remove("healthy", "unhealthy");
    setText("connection-title", "ARE diagnostic stale");
    setSourceDiagnostic("product", "Stale", lastProductObservationAt);
    setText("connection-detail", "The previous product diagnostic has expired. Values below are last seen, not current health.");
    setText("observed-at", `Last observed ${new Date(lastProductObservationAt).toLocaleTimeString()}`);
    setText("diagnostic-issue-summary", "The product diagnostic has expired. Findings below are last seen, not current health.");
  }
  if (adapterObservationCurrent && expired(lastAdapterObservationAt)) {
    adapterObservationCurrent = false;
    const dshAgentState = document.getElementById("dsh-agent-state");
    if (dshAgentState) dshAgentState.hidden = true;
    updateThreadAdapterCorrelation();
    setText("adapter-observation-status", "Stale");
    setSidebarAdapterPosture("stale", "Adapter stale");
    setSourceDiagnostic("adapter", "Stale", lastAdapterObservationAt);
    setText("adapter-observation-source", "Source: selected ARE gateway · last observation only");
    setText("adapter-empty-detail", `The previous reading at ${new Date(lastAdapterObservationAt).toLocaleTimeString()} is no longer current. No live state is claimed.`);
    setText("overview-adapter-title", "Observation stale");
    setText("overview-adapter-detail", "The previous adapter reading has expired. Refresh to check the selected path again.");
    setText("overview-adapter-technical", "The previous technical path reading has expired. Refresh to check the selected path again.");
    document.getElementById("adapter-live").hidden = true;
    document.getElementById("adapter-empty").hidden = false;
  }
  if (decisionObservationCurrent && expired(lastDecisionObservationAt)) {
    decisionObservationCurrent = false;
    clearDecisionDetails();
    setText("decision-observation-status", "Stale");
    setSourceDiagnostic("decision", "Stale", lastDecisionObservationAt);
    setText("decision-observation-source", "Source: gateway backend decisions · last observation only");
    setText("decision-empty-detail", `The previous reading at ${new Date(lastDecisionObservationAt).toLocaleTimeString()} is no longer current. No complete host decision history is claimed.`);
    document.getElementById("decision-live").hidden = true;
    document.getElementById("decision-empty").hidden = false;
  }
  if (evolutionObservationCurrent && expired(lastEvolutionObservationAt)) {
    evolutionObservationCurrent = false;
    setText("evolution-observation-status", "Stale");
    setSourceDiagnostic("evolution", "Stale", lastEvolutionObservationAt);
    setText("evolution-observation-source", "Source: explicit Evolution runtime root · last observation only");
    setText("evolution-empty-detail", `The previous reading at ${new Date(lastEvolutionObservationAt).toLocaleTimeString()} is no longer current. No live state is claimed.`);
    showEvolutionLastSeen("Stale");
  }
  if (evolutionSignalObservationCurrent && expired(lastEvolutionSignalObservationAt)) {
    evolutionSignalObservationCurrent = false;
    setText("evolution-signal-status", "Stale");
    setEvolutionSignalTeaser("Stale");
    setSourceDiagnostic("evolution-signal", "Stale", lastEvolutionSignalObservationAt);
    setText("evolution-signal-source", `Previous reading at ${new Date(lastEvolutionSignalObservationAt).toLocaleTimeString()} is no longer current`);
    setText("evolution-signal-count", "—");
    setText("evolution-signal-observed-at", "—");
    paintEvolutionRows("evolution-signal-list", []);
    document.getElementById("evolution-signal-truncation").hidden = true;
  }
}

function refreshVisibleObservations() {
  if (document.hidden) return;
  const visible = name => document.getElementById(`panel-${name}`)?.hidden === false;
  if (visible("overview") || visible("adapters") || visible("threads") || visible("diagnostics")) void refreshAdapterSnapshot();
  if (visible("threads") || visible("diagnostics")) void refreshThreadSnapshot();
  if (visible("decisions") || visible("diagnostics")) void refreshDecisionSnapshot();
  if (visible("evolution") || visible("diagnostics")) {
    void refreshEvolutionSnapshot();
    void refreshEvolutionSignals();
  }
}

function paintSnapshot(snapshot) {
  const observedAt = freshObservationTime(snapshot.observedAtUnixMs, "product");
  lastProductObservationAt = observedAt;
  productObservationCurrent = true;
  const healthy = snapshot.status === "PASS";
  const banner = document.getElementById("connection-banner");
  banner?.classList.toggle("healthy", healthy);
  banner?.classList.toggle("unhealthy", !healthy);
  setText("connection-title", healthy ? "ARE diagnostic passed" : `ARE reports ${snapshot.status}`);
  setSourceDiagnostic("product", healthy ? "Diagnostic passed" : `Diagnostic ${snapshot.status}`, lastProductObservationAt);
  setText("connection-detail", "Fresh local product snapshot · no service readiness claim");
  setText("observed-at", new Date(observedAt).toLocaleTimeString());
  setText("product-status", snapshot.productStatus);
  setText("selected-components", snapshot.selectedComponentCount);
  setText("node-match", snapshot.nodeVersionMatch ? "Exact" : "Mismatch");
  setText("product-version", snapshot.productVersion);
  setText("product-id", snapshot.productId);
  setText("component-count", snapshot.componentCount);
  setText("integration-count", snapshot.integrationCount);
  setText("closure-digest", snapshot.closureDigest ?? "Unavailable");
  paintProductReasons(snapshot);
}

async function refreshSnapshot() {
  const refresh = document.getElementById("refresh");
  if (refresh) refresh.disabled = true;
  document.getElementById("connection-banner")?.classList.remove("healthy", "unhealthy");
  setText("connection-title", "Reading ARE…");
  setSourceDiagnostic("product", "Reading", lastProductObservationAt);
  setText("connection-detail", lastProductObservationAt === null
    ? "Running a bounded local diagnostic" : "Checking again. Previous values are last seen until this read completes.");
  setText("diagnostic-issue-summary", lastProductObservationAt === null
    ? "Waiting for a product diagnostic." : "Checking again. Previous findings are last seen until this read completes.");
  setText("observed-at", lastProductObservationAt === null
    ? "NOT OBSERVED" : `Last observed ${new Date(lastProductObservationAt).toLocaleTimeString()}`);
  try {
    if (!invoke) throw new Error("Open this dashboard through the ARE desktop companion.");
    let snapshot;
    try {
      snapshot = await invoke("get_snapshot");
    } catch (error) {
      if (!String(error).includes("ARE diagnostic timed out")) throw error;
      setText("connection-detail", "The first diagnostic timed out; retrying once. No current health is claimed yet.");
      setText("diagnostic-issue-summary", "The first product read timed out. A bounded retry is in progress.");
      snapshot = await invoke("get_snapshot");
    }
    if (snapshot?.schemaVersion !== "are.companion-health/v1") throw new Error("Incompatible ARE snapshot.");
    paintSnapshot(snapshot);
  } catch (error) {
    productObservationCurrent = false;
    const stale = String(error).includes("product.observation-stale");
    const posture = stale ? "Stale" : "Unavailable";
    const banner = document.getElementById("connection-banner");
    banner?.classList.toggle("unhealthy", !stale);
    setText("connection-title", stale ? "ARE diagnostic stale" : "Product diagnostic unavailable");
    setSourceDiagnostic("product", posture, lastProductObservationAt);
    const detail = error instanceof Error ? error.message : String(error);
    setText("connection-detail", `${detail}${lastProductObservationAt === null ? "" : " Previous values are last seen, not current health."}`);
    setText("diagnostic-issue-summary", lastProductObservationAt === null
      ? "The product diagnostic could not be read; there are no current findings."
      : "The product diagnostic could not be refreshed. Findings below are last seen, not current health.");
    setText("observed-at", lastProductObservationAt === null
      ? "NOT OBSERVED" : `Last observed ${new Date(lastProductObservationAt).toLocaleTimeString()}`);
  } finally {
    if (refresh) refresh.disabled = false;
  }
}

function initialiseDashboard() {
  const navStrip = document.querySelector?.(".nav-list");
  navStrip?.addEventListener("scroll", updateNavScrollControls, {passive: true});
  const syncNavigationViewport = () => {
    keepActiveNavVisible(document.querySelector(".nav-item.active"));
    updateNavScrollControls();
  };
  if (typeof window !== "undefined") window.addEventListener("resize", () => {
    syncNavigationViewport();
    window.requestAnimationFrame(syncNavigationViewport);
  });
  for (const [id, direction] of [["nav-scroll-prev", -1], ["nav-scroll-next", 1]]) {
    document.getElementById(id)?.addEventListener("click", () => {
      navStrip?.scrollBy({left: direction * Math.max(120, navStrip.clientWidth * .75), behavior: "auto"});
      updateNavScrollControls();
    });
  }
  updateNavScrollControls();
  document.getElementById("thread-page-next")?.addEventListener("click", () => {
    if (Number.isSafeInteger(lastThreadSnapshot?.nextOffset) && !threadObservationStale) {
      void refreshThreadSnapshot(lastThreadSnapshot.nextOffset, lastThreadSnapshot.snapshotDigest);
    }
  });
  document.getElementById("thread-page-prev")?.addEventListener("click", () => {
    if (threadPageOffset > 0 && !threadObservationStale) {
      void refreshThreadSnapshot(threadPageOffset - 32, lastThreadSnapshot?.snapshotDigest);
    }
  });
  document.getElementById("thread-page-reset")?.addEventListener("click", () => {
    requestThreadFreshStart();
  });
  setInterval(() => {
    expireThreadObservation();
    expireOtherObservations();
    refreshVisibleObservations();
  }, THREAD_OBSERVATION_MAX_AGE_MS);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) return;
    expireThreadObservation();
    expireOtherObservations();
    refreshVisibleObservations();
  });
  for (const item of document.querySelectorAll(".nav-item")) {
    item.addEventListener("click", () => {
      if (item.dataset.panel === "decisions") clearDecisionFilter();
      showPanel(item.dataset.panel);
    });
  }
  for (const link of document.querySelectorAll("[data-panel-link]")) {
    link.addEventListener("click", () => {
      const panel = link.dataset.panelLink;
      const issueTarget = panel === "diagnostics"
        ? diagnosticIssueTargets[link.dataset.diagnosticIssue] : null;
      if (panel === "decisions") clearDecisionFilter();
      showPanel(panel);
      if (issueTarget) document.getElementById(issueTarget)?.focus();
    });
  }
  document.getElementById("decision-filter-clear")?.addEventListener("click", () => {
    clearDecisionFilter();
    document.getElementById("decision-live").hidden = true;
    document.getElementById("decision-empty").hidden = false;
    setText("decision-empty-detail", "Checking all recent gateway decisions.");
    void refreshDecisionSnapshot();
  });
  document.getElementById("decision-filter-back")?.addEventListener("click", () => {
    pendingThreadFocus = decisionFilter && {threadRef: decisionFilter.threadRef, consumerRef: decisionFilter.consumerRef};
    showPanel("threads");
  });
  document.getElementById("evolution-cycle-definition")?.addEventListener("change", paintSelectedEvolutionCycles);
  document.getElementById("evolution-signal-jump")?.addEventListener("click", () => {
    const heading = document.getElementById("evolution-signals-title");
    heading?.focus({preventScroll: true});
    heading?.scrollIntoView({block: "start"});
  });
  for (const choice of document.querySelectorAll("[data-skin-choice]")) {
    choice.addEventListener("click", async () => {
      if (!invoke) return;
      try {
        const preferences = await invoke("set_skin", {skin: choice.dataset.skinChoice});
        applySkin(preferences.skin);
        setText("appearance-feedback", "");
      } catch (error) { setText("appearance-feedback", `Skin preference could not be saved: ${error}`); }
    });
  }
  for (const choice of document.querySelectorAll("[data-orb-placement]")) {
    choice.addEventListener("click", async () => {
      if (!invoke) return;
      try {
        const preferences = await invoke("set_orb_placement", {placement: choice.dataset.orbPlacement});
        applyOrbPlacement(preferences.orbPlacement);
        setText("appearance-feedback", preferences.orbPlacement === "center" ? "Floating mark reset to the center of this screen." : "Floating mark placement saved.");
      } catch (error) { setText("appearance-feedback", `Floating mark could not be placed: ${error}`); }
    });
  }
  document.getElementById("refresh")?.addEventListener("click", () => {
    void refreshSnapshot();
    const evidenceOpen = !document.getElementById("panel-diagnostics")?.hidden;
    if (evidenceOpen || !document.getElementById("panel-overview")?.hidden
      || !document.getElementById("panel-adapters")?.hidden) void refreshAdapterSnapshot();
    if (evidenceOpen || !document.getElementById("panel-threads")?.hidden) void refreshThreadSnapshot(0, null);
    if (evidenceOpen || !document.getElementById("panel-decisions")?.hidden) void refreshDecisionSnapshot();
    if (evidenceOpen || !document.getElementById("panel-evolution")?.hidden) {
      void refreshEvolutionSnapshot();
      void refreshEvolutionSignals();
    }
  });
  void refreshSnapshot();
  void refreshAdapterSnapshot();
}

void initialisePreferences();
if (document.documentElement.dataset.page === "dashboard") initialiseDashboard();
