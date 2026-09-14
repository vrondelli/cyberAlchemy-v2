import { buildOrchestratorOntology, graphScene, parseRoute, phaseLabel, recoveryInstruction, runCounts, runExplanation, shortDigest } from "./ui-model.js";

const main = document.querySelector("main");
const escapeHtml = (value) => String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");

async function request(path, options = {}) {
  const response = await fetch(path, { cache: "no-store", ...options });
  const body = await response.json().catch(() => ({ error: `HTTP ${response.status}` }));
  if (!response.ok) throw new Error(body.error || `HTTP ${response.status}`);
  return body;
}

function navigate(path) { history.pushState({}, "", path); render().catch(showError); }
document.addEventListener("click", (event) => {
  const link = event.target.closest("[data-link]");
  if (!link) return;
  event.preventDefault();
  navigate(link.getAttribute("href"));
});
window.addEventListener("popstate", () => render().catch(showError));

function layout(title, eyebrow, body) {
  document.querySelectorAll(".shell > nav a").forEach((link) => {
    const active = location.pathname === link.pathname || (link.pathname === "/runs" && location.pathname.startsWith("/runs"));
    if (active) link.setAttribute("aria-current", "page"); else link.removeAttribute("aria-current");
  });
  main.innerHTML = `<header class="page-head"><div><p class="eyebrow">${escapeHtml(eyebrow)}</p><h1>${escapeHtml(title)}</h1></div><button class="quiet" id="refresh">Refresh</button></header>${body}`;
  document.querySelector("#refresh")?.addEventListener("click", () => render().catch(showError));
}

function renderDag(graph, statuses = {}) {
  const scene = graphScene(graph);
  const path = (edge) => {
    const x1 = edge.from.x + 82, x2 = edge.to.x - 82, middle = (x1 + x2) / 2;
    return `M ${x1} ${edge.from.y} C ${middle} ${edge.from.y}, ${middle} ${edge.to.y}, ${x2} ${edge.to.y}`;
  };
  const edges = scene.edges.map((edge) => `<path d="${path(edge)}" marker-end="url(#dag-arrow)" />`).join("");
  const nodes = scene.nodes.map((node) => `<article class="dag-node status-${escapeHtml(statuses[node.node_id] || "pending")}" style="left:${node.x}px;top:${node.y}px"><small>${escapeHtml(node.role_id)}</small><strong>${escapeHtml(node.node_id)}</strong><span>${escapeHtml(node.contract)}</span><b>${escapeHtml(phaseLabel(statuses[node.node_id] || "pending"))}</b></article>`).join("");
  return `<div class="dag-scroll" aria-label="Accepted work graph"><div class="dag-canvas" style="width:${scene.width}px;height:${scene.height}px"><svg viewBox="0 0 ${scene.width} ${scene.height}" aria-hidden="true"><defs><marker id="dag-arrow" markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto"><path d="M0,0 L0,6 L7,3 z" /></marker></defs>${edges}</svg>${nodes}</div></div>`;
}

async function renderRuns() {
  const state = await request("/api/v1/state");
  const rows = state.runs.length ? state.runs.map((run) => `<a class="run-card" href="/runs/${encodeURIComponent(run.run_id)}" data-link>
    <div><span class="status status-${escapeHtml(run.phase)}">${escapeHtml(phaseLabel(run.phase))}</span><h2>${escapeHtml(run.bundle.admission_context.strategy_id || run.run_id)}</h2></div>
    <dl><div><dt>Run</dt><dd>${escapeHtml(run.run_id)}</dd></div><div><dt>Revision</dt><dd>${run.revision}</dd></div><div><dt>Pending</dt><dd>${Object.keys(run.history.pending_commands || {}).length}</dd></div></dl>
    <p>${escapeHtml(run.explanation.next)}</p></a>`).join("") : `<section class="empty"><h2>No admitted runs</h2><p>Create a proposal, review its exact graph and limits, then admit it as a run.</p><a class="primary" href="/runs/new" data-link>Create a strategy</a></section>`;
  layout("Runs", "Control Center", `<section class="run-list" aria-label="Runs">${rows}</section>`);
}

async function renderRun(runId) {
  const run = await request(`/api/v1/runs/${encodeURIComponent(runId)}`);
  const explanation = runExplanation(run);
  const counts = runCounts(run);
  const recovery = run.recovery.length ? run.recovery.map((item) => `<article class="recovery-card"><header><span>${escapeHtml(item.command_id)}</span><strong>${escapeHtml(phaseLabel(item.action))}</strong></header><p>${escapeHtml(item.reason)}</p><p class="instruction">${escapeHtml(recoveryInstruction(item))}</p>${item.action === "blocked_unknown_effect" ? `<div class="actions"><button data-resolve="not_applied" data-command="${escapeHtml(item.command_id)}">Effect did not happen</button><button data-resolve="applied" data-command="${escapeHtml(item.command_id)}">Effect happened</button></div>` : ""}</article>`).join("") : `<p class="muted">No pending recovery decisions.</p>`;
  const trace = (run.execution?.accepted_events ?? []).map((event) => {
    const command = (run.execution?.commands ?? []).find((item) => item.command_id === event.command_id);
    return `<li><span><strong>${escapeHtml(event.node_id)}</strong> · ${escapeHtml(phaseLabel(event.outcome))}<small>${escapeHtml(event.event_id)}${command?.lease?.worker_id ? ` · ${escapeHtml(command.lease.worker_id)}` : ""}</small></span><code>${escapeHtml(shortDigest(run.history.cursor.accepted_events?.[event.event_id]))}</code></li>`;
  }).join("") || `<li><span>No accepted node events yet.</span></li>`;
  const outputs = Object.entries(run.history.cursor.outputs ?? {}).map(([nodeId, output]) => {
    const preview = run.execution?.result_previews?.[nodeId];
    const content = preview?.content;
    const result = content?.result ?? content;
    const summary = result && typeof result === "object" ? Object.entries(result).filter(([, value]) => ["string", "number", "boolean"].includes(typeof value)).slice(0, 6).map(([key, value]) => `<div><dt>${escapeHtml(key.replaceAll("_", " "))}</dt><dd>${escapeHtml(value)}</dd></div>`).join("") : "";
    return `<article class="record-card result-card"><header><div><strong>${escapeHtml(nodeId)}</strong><span class="status status-${escapeHtml(preview?.status)}">${escapeHtml(phaseLabel(preview?.status || "reference only"))}</span></div><code>${escapeHtml(shortDigest(output.sha256))}</code></header>${summary ? `<dl class="record-grid">${summary}</dl>` : ""}<details><summary>Inspect exact output</summary><pre>${escapeHtml(JSON.stringify(content ?? output, null, 2))}</pre></details></article>`;
  }).join("") || `<p class="muted">No structural outputs have been accepted.</p>`;
  const errors = Object.entries(run.history.cursor.errors ?? {}).map(([nodeId, error]) => `<article class="record-card error-record"><strong>${escapeHtml(nodeId)}</strong><p>${escapeHtml(error)}</p></article>`).join("");
  const commands = (run.execution?.commands ?? []).map((command) => `<article class="command-card"><header><div><span class="status status-${escapeHtml(command.status)}">${escapeHtml(phaseLabel(command.status))}</span><h3>${escapeHtml(command.node_id)}</h3></div><code>${escapeHtml(command.command_id)}</code></header><dl class="record-grid"><div><dt>Contract</dt><dd>${escapeHtml(command.contract)}</dd></div><div><dt>Role</dt><dd>${escapeHtml(command.role_id)}</dd></div><div><dt>Worker</dt><dd>${escapeHtml(command.lease?.worker_id || "Unassigned")}</dd></div><div><dt>Fence</dt><dd>${escapeHtml(command.lease?.fencing_token ?? "—")}</dd></div><div><dt>Receipt</dt><dd>${escapeHtml(command.receipt?.receipt_id || "Not recorded")}</dd></div><div><dt>Effect record</dt><dd>${escapeHtml(phaseLabel(command.effective_disposition || "not recorded"))}</dd></div></dl></article>`).join("") || `<p class="muted">No commands have been issued.</p>`;
  const lifecycle = `<dl class="record-grid"><div><dt>Admitted</dt><dd>${new Date(Number(run.bundle.admitted_at_ms)).toLocaleString()}</dd></div><div><dt>Deadline</dt><dd>${new Date(Number(run.bundle.deadline_at_ms)).toLocaleString()}</dd></div><div><dt>Engine</dt><dd>${escapeHtml(run.bundle.engine_version)}</dd></div><div><dt>Revision</dt><dd>${run.revision}</dd></div><div><dt>Cancelled</dt><dd>${run.history.cursor.cancelled ? "Yes" : "No"}</dd></div><div><dt>Authority references</dt><dd>${run.bundle.authority_refs.map(escapeHtml).join(" · ")}</dd></div></dl>`;
  const tabs = ["overview", "graph", "results", "trace", "workers", "evidence", "recovery", "lifecycle"];
  layout(run.run_id, `Run · ${phaseLabel(run.phase)}`, `
    <nav class="run-tabs" role="tablist" aria-label="Run details">${tabs.map((tab, index) => `<button role="tab" aria-selected="${index === 0}" aria-controls="run-panel-${tab}" id="run-tab-${tab}" data-run-tab="${tab}">${phaseLabel(tab)}</button>`).join("")}</nav>
    <section class="run-tab-panel" id="run-panel-overview" role="tabpanel" aria-labelledby="run-tab-overview" data-run-panel="overview"><section class="explanation-grid" aria-label="Run explanation"><article><span>What is happening</span><p>${escapeHtml(explanation.state)}</p></article><article><span>Why</span><p>${escapeHtml(explanation.why)}</p></article><article><span>What happens next</span><p>${escapeHtml(explanation.next)}</p></article><article class="authority"><span>Decision boundary</span><p>${escapeHtml(explanation.authority)}</p></article></section><section class="metrics" aria-label="Node totals"><div><strong>${counts.succeeded}</strong><span>Succeeded</span></div><div><strong>${counts.running}</strong><span>Running</span></div><div><strong>${counts.pending}</strong><span>Pending</span></div><div><strong>${counts.failed}</strong><span>Failed</span></div></section></section>
    <section class="run-tab-panel" id="run-panel-graph" role="tabpanel" aria-labelledby="run-tab-graph" data-run-panel="graph" hidden><section class="panel graph-panel"><header><div><p class="eyebrow">Accepted structure</p><h2>Work graph</h2></div><code>${shortDigest(run.bundle.graph_digest)}</code></header>${renderDag(run.bundle.graph, run.history.cursor.node_status)}</section></section>
    <section class="run-tab-panel" id="run-panel-results" role="tabpanel" aria-labelledby="run-tab-results" data-run-panel="results" hidden><section class="panel"><header><div><p class="eyebrow">Accepted outputs</p><h2>Results</h2></div><span>${Object.keys(run.history.cursor.outputs ?? {}).length}</span></header>${outputs}${errors}</section></section>
    <section class="run-tab-panel" id="run-panel-trace" role="tabpanel" aria-labelledby="run-tab-trace" data-run-panel="trace" hidden><section class="panel"><header><div><p class="eyebrow">Accepted history</p><h2>Event trace</h2></div><span>${Object.keys(run.history.cursor.accepted_events ?? {}).length}</span></header><ol class="nodes">${trace}</ol></section></section>
    <section class="run-tab-panel" id="run-panel-workers" role="tabpanel" aria-labelledby="run-tab-workers" data-run-panel="workers" hidden><section class="panel"><header><div><p class="eyebrow">Assignment boundary</p><h2>Workers and commands</h2></div><span>${Object.keys(run.history.pending_commands ?? {}).length} pending</span></header><div class="command-list">${commands}</div><p class="muted">Worker identity, fencing token, and receipt are projected from durable coordination records. A lease shows assignment; only an accepted event changes the work graph.</p></section></section>
    <section class="run-tab-panel" id="run-panel-evidence" role="tabpanel" aria-labelledby="run-tab-evidence" data-run-panel="evidence" hidden><section class="panel"><header><div><p class="eyebrow">Content identity</p><h2>Evidence</h2></div></header><dl class="record-grid"><div><dt>Run bundle</dt><dd><code>${escapeHtml(shortDigest(run.bundle.bundle_digest))}</code></dd></div><div><dt>Work graph</dt><dd><code>${escapeHtml(shortDigest(run.bundle.graph_digest))}</code></dd></div><div><dt>Accepted events</dt><dd>${run.execution?.accepted_events?.length ?? 0}</dd></div><div><dt>Worker receipts</dt><dd>${(run.execution?.commands ?? []).filter((command) => command.receipt).length}</dd></div></dl></section></section>
    <section class="run-tab-panel" id="run-panel-recovery" role="tabpanel" aria-labelledby="run-tab-recovery" data-run-panel="recovery" hidden><section class="panel recovery-panel"><header><div><p class="eyebrow">Operator attention</p><h2>Recovery</h2></div><span>${run.recovery.length} item(s)</span></header>${recovery}</section></section>
    <section class="run-tab-panel" id="run-panel-lifecycle" role="tabpanel" aria-labelledby="run-tab-lifecycle" data-run-panel="lifecycle" hidden><section class="panel"><header><div><p class="eyebrow">Durable envelope</p><h2>Lifecycle</h2></div></header>${lifecycle}</section></section>
    <details class="policy"><summary>What this run can and cannot decide</summary><p>The runtime may accept structural events that satisfy the run contract. It cannot declare an output true, accept a result for a domain owner, publish an artifact, or infer that an unknown external effect happened.</p></details>
    ${!["completed", "cancelled"].includes(run.phase) ? `<button class="danger" id="cancel-run">Cancel this run</button>` : ""}`);
  document.querySelectorAll("[data-run-tab]").forEach((button, index, buttons) => {
    button.addEventListener("click", () => {
      document.querySelectorAll("[data-run-panel]").forEach((panel) => { panel.hidden = panel.dataset.runPanel !== button.dataset.runTab; });
      buttons.forEach((candidate) => candidate.setAttribute("aria-selected", String(candidate === button)));
    });
    button.addEventListener("keydown", (event) => {
      if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
      event.preventDefault();
      const next = event.key === "Home" ? 0 : event.key === "End" ? buttons.length - 1 : (index + (event.key === "ArrowRight" ? 1 : -1) + buttons.length) % buttons.length;
      buttons[next].focus(); buttons[next].click();
    });
  });
  document.querySelector("#cancel-run")?.addEventListener("click", async () => {
    document.querySelector(".policy").open = true;
    await request(`/api/v1/runs/${encodeURIComponent(runId)}/cancel`, { method: "POST", headers: { "content-type": "application/json", "x-orchestrator-intent": "cancel-run" }, body: JSON.stringify({ expected_revision: run.revision, control_id: `cancel:${Date.now()}`, reason: "operator request", now_ms: Date.now() }) });
    await renderRun(runId);
  });
  document.querySelectorAll("[data-resolve]").forEach((button) => button.addEventListener("click", async () => {
    document.querySelector(".policy").open = true;
    await request(`/api/v1/runs/${encodeURIComponent(runId)}/recovery/${encodeURIComponent(button.dataset.command)}/resolve`, { method: "POST", headers: { "content-type": "application/json", "x-orchestrator-intent": "resolve-recovery" }, body: JSON.stringify({ disposition: button.dataset.resolve }) });
    await renderRun(runId);
  }));
}

async function renderNew() {
  const [catalog, presets] = await Promise.all([request("/api/v1/templates"), request("/api/v1/run-templates")]);
  const options = catalog.templates.map((template) => `<option value="${escapeHtml(`${template.template_id}/${template.version}`)}">${escapeHtml(template.template_id)} · ${escapeHtml(template.version)}</option>`).join("");
  const buttons = presets.run_templates.map((preset) => `<article class="preset"><div><h2>${escapeHtml(preset.display_name)}</h2><p>${escapeHtml(preset.description)}</p></div><button class="primary" data-run-template="${escapeHtml(`${preset.run_template_id}/${preset.version}`)}">Create proposal</button></article>`).join("") || `<p class="muted">No button-ready Run Templates have been saved.</p>`;
  layout("Create a dispatch", "Strategy authoring", `<section class="panel"><p class="eyebrow">Quick dispatches</p><div class="preset-list">${buttons}</div></section><section class="composer panel"><div class="field"><label for="template">Saved Strategy Template</label><select id="template"><option value="">Choose a template</option>${options}</select></div><div class="field"><label for="parameters">Template parameters</label><textarea id="parameters" rows="5">{}</textarea></div><div class="field"><label for="adapters">Selected adapter references</label><input id="adapters" value="" placeholder="are-gateway/v1" /></div><button class="primary" id="compose-template" ${options ? "" : "disabled"}>Create proposal from template</button><div class="separator"><span>or author exact Strategy JSON</span></div><div class="field"><label for="strategy">Strategy JSON</label><textarea id="strategy" rows="14" placeholder="Paste an orchestrator-strategy/v1 object"></textarea></div><button id="compose-direct">Validate and create proposal</button></section><section id="proposal" class="panel" hidden></section><details class="policy"><summary>Proposal and admission are separate</summary><p>Creating a proposal validates and previews exact bytes. Admitting it creates a durable run. Neither action accepts future results or grants undeclared external effects.</p></details>`);
  const adapters = () => document.querySelector("#adapters").value.split(",").map((value) => value.trim()).filter(Boolean);
  document.querySelector("#compose-template")?.addEventListener("click", async () => {
    const [id, version] = document.querySelector("#template").value.split("/");
    if (!id) return;
    const result = await request(`/api/v1/templates/${encodeURIComponent(id)}/${encodeURIComponent(version)}/proposals`, { method: "POST", headers: { "content-type": "application/json", "x-orchestrator-intent": "compose-template-dispatch" }, body: JSON.stringify({ parameters: JSON.parse(document.querySelector("#parameters").value), selected_adapter_refs: adapters() }) });
    showProposal(result.proposal);
  });
  document.querySelector("#compose-direct").addEventListener("click", async () => {
    const result = await request("/api/v1/proposals/direct", { method: "POST", headers: { "content-type": "application/json", "x-orchestrator-intent": "compose-dispatch" }, body: JSON.stringify({ strategy: JSON.parse(document.querySelector("#strategy").value), selected_adapter_refs: adapters() }) });
    showProposal(result.proposal);
  });
  document.querySelectorAll("[data-run-template]").forEach((button) => button.addEventListener("click", async () => {
    const [id, version] = button.dataset.runTemplate.split("/");
    const result = await request(`/api/v1/run-templates/${encodeURIComponent(id)}/${encodeURIComponent(version)}/proposals`, { method: "POST", headers: { "content-type": "application/json", "x-orchestrator-intent": "compose-run-template-dispatch" }, body: JSON.stringify({ parameter_overrides: {}, adapter_overrides: null }) });
    showProposal(result.proposal);
  }));
  const selectedPreset = new URLSearchParams(location.search).get("run_template");
  if (selectedPreset) document.querySelector(`[data-run-template="${CSS.escape(selectedPreset)}"]`)?.click();
}

function showProposal(proposal) {
  const panel = document.querySelector("#proposal");
  panel.hidden = false;
  panel.innerHTML = `<p class="eyebrow">Review before admission</p><h2>${escapeHtml(proposal.intended_outcome)}</h2><dl class="review"><div><dt>Strategy</dt><dd>${escapeHtml(`${proposal.strategy_id}@${proposal.strategy_version}`)}</dd></div><div><dt>Nodes</dt><dd>${Object.keys(proposal.graph.nodes).length}</dd></div><div><dt>Agents needed</dt><dd>${proposal.agent_requirements.length}</dd></div><div><dt>Maximum parallel work</dt><dd>${proposal.limits.max_parallelism}</dd></div><div><dt>Proposal digest</dt><dd><code>${shortDigest(proposal.proposal_id)}</code></dd></div></dl><label for="run-id">Run ID</label><input id="run-id" value="run-${Date.now()}" /><button class="primary" id="admit">Admit exact proposal</button>`;
  document.querySelector("#admit").addEventListener("click", async () => {
    document.querySelector(".policy").open = true;
    const runId = document.querySelector("#run-id").value;
    await request(`/api/v1/proposals/${encodeURIComponent(proposal.proposal_id)}/admit`, { method: "POST", headers: { "content-type": "application/json", "x-orchestrator-intent": "admit-dispatch" }, body: JSON.stringify({ run_id: runId, admitted_at_ms: Date.now(), deadline_at_ms: Date.now() + proposal.limits.deadline_seconds * 1000, admission_authority_ref: "admission:local-operator" }) });
    navigate(`/runs/${encodeURIComponent(runId)}`);
  });
}

async function renderAdapters() {
  const result = await request("/api/v1/adapters");
  const cards = result.adapters.map((adapter) => `<article class="panel"><span class="status ${adapter.available ? "status-active" : "status-needs_attention"}">${adapter.available ? "Available" : adapter.configured ? "Unavailable" : "Not configured"}</span><h2>${escapeHtml(adapter.adapter_ref)}</h2><p>This adapter can execute an agent turn. It does not schedule work, accept its own event, or grant authority.</p><dl class="review"><div><dt>Profile</dt><dd>${escapeHtml(adapter.profile_ref || "Not reported")}</dd></div><div><dt>Authority</dt><dd>${escapeHtml(adapter.authority_effect)}</dd></div></dl></article>`).join("");
  layout("Adapters", "Execution boundary", `<section class="card-grid">${cards}</section>`);
}

async function renderLab() {
  const [state, strategies, presets] = await Promise.all([request("/api/v1/state"), request("/api/v1/templates"), request("/api/v1/run-templates")]);
  const reusable = presets.run_templates.map((template) => `<article class="asset-card"><span class="asset-kind">Run template</span><h2>${escapeHtml(template.display_name || template.run_template_id)}</h2><p>${escapeHtml(template.description || "Reusable dispatch configuration")}</p><dl><div><dt>Version</dt><dd>${escapeHtml(template.version)}</dd></div><div><dt>Strategy</dt><dd>${escapeHtml(template.strategy_template_id)}</dd></div></dl><a class="primary" href="/runs/new?run_template=${encodeURIComponent(`${template.run_template_id}/${template.version}`)}" data-link>Use template</a></article>`).join("");
  const strategyCards = strategies.templates.map((template) => `<article class="asset-card"><span class="asset-kind">Strategy</span><h2>${escapeHtml(template.template_id)}</h2><p>${escapeHtml(template.strategy?.intended_outcome || "Reusable orchestration strategy")}</p><dl><div><dt>Version</dt><dd>${escapeHtml(template.version)}</dd></div><div><dt>Parameters</dt><dd>${template.parameters?.length ?? 0}</dd></div></dl></article>`).join("");
  const experiments = state.runs.map((run) => `<a class="experiment-row" href="/runs/${encodeURIComponent(run.run_id)}" data-link><span class="status status-${escapeHtml(run.phase)}">${escapeHtml(phaseLabel(run.phase))}</span><strong>${escapeHtml(run.run_id)}</strong><small>${Object.keys(run.bundle?.graph?.nodes ?? {}).length} nodes · revision ${run.revision}</small></a>`).join("");
  layout("Orchestration lab", "Compose · inspect · reuse", `<section class="lab-intro"><div><h2>Reusable orchestration assets</h2><p>Inspect saved strategies and button-ready templates, then use them to create another exact proposal.</p></div><a class="primary" href="/runs/new" data-link>Create an experiment</a></section><section class="asset-grid">${reusable || strategyCards ? reusable + strategyCards : `<article class="empty"><h2>No reusable assets</h2><p>Save a strategy template to make it available here.</p></article>`}</section><section class="panel lab-runs"><header><div><p class="eyebrow">Observed runs</p><h2>Experiments and executions</h2></div><span>${state.runs.length}</span></header>${experiments || `<p class="muted">No admitted runs yet.</p>`}</section><details class="policy"><summary>What the Lab means</summary><p>The Lab is a workspace for composing, inspecting, and reusing orchestration assets. A saved template or successful run is evidence; it does not become an accepted result or gain authority by appearing here.</p></details>`);
}

function ontologyScene(ontology) {
  const kinds = ["template", "strategy", "run", "work", "role", "adapter"];
  const groups = new Map(kinds.map((kind) => [kind, ontology.nodes.filter((node) => node.kind === kind)]));
  const maxRows = Math.max(1, ...[...groups.values()].map((group) => group.length));
  const width = kinds.length * 230 + 120, height = Math.max(420, maxRows * 88 + 120);
  const positions = new Map();
  kinds.forEach((kind, column) => groups.get(kind).forEach((node, row) => positions.set(node.id, { x: 80 + column * 230, y: 76 + row * 88 })));
  return { width, height, positions };
}

async function renderOntology() {
  const [state, templates, runTemplates, adapters] = await Promise.all([request("/api/v1/state"), request("/api/v1/templates"), request("/api/v1/run-templates"), request("/api/v1/adapters")]);
  const ontology = buildOrchestratorOntology(state, templates, runTemplates, adapters);
  const scene = ontologyScene(ontology);
  const paths = ontology.relations.map((relation) => {
    const from = scene.positions.get(relation.from), to = scene.positions.get(relation.to);
    if (!from || !to) return "";
    const middle = (from.x + to.x) / 2;
    return `<path d="M ${from.x + 72} ${from.y} C ${middle} ${from.y}, ${middle} ${to.y}, ${to.x - 72} ${to.y}" data-relation="${escapeHtml(relation.type)}"><title>${escapeHtml(relation.type)}</title></path>`;
  }).join("");
  const cards = ontology.nodes.map((node) => { const point = scene.positions.get(node.id); return `<${node.href ? "a" : "button"} class="ontology-node kind-${node.kind}" style="left:${point.x}px;top:${point.y}px" ${node.href ? `href="${escapeHtml(node.href)}" data-link` : `type="button"`} data-ontology-id="${escapeHtml(node.id)}"><small>${escapeHtml(node.kind)}</small><strong>${escapeHtml(node.label)}</strong></${node.href ? "a" : "button"}>`; }).join("");
  const list = ontology.relations.map((relation) => `<li><code>${escapeHtml(relation.from)}</code><strong>${escapeHtml(relation.type.replaceAll("_", " "))}</strong><code>${escapeHtml(relation.to)}</code></li>`).join("");
  layout("Orchestrator ontology", "Runtime relationship projection", `<section class="ontology-summary"><p>This map is calculated from saved templates, admitted run bundles, work nodes, roles, and adapters. Select linked records to inspect their owning surface.</p><dl><div><dt>Records</dt><dd>${ontology.nodes.length}</dd></div><div><dt>Relations</dt><dd>${ontology.relations.length}</dd></div></dl></section><section class="ontology-scroll" aria-label="Orchestrator ontology graph"><div class="ontology-canvas" style="width:${scene.width}px;height:${scene.height}px"><svg viewBox="0 0 ${scene.width} ${scene.height}" aria-hidden="true">${paths}</svg>${cards}</div></section><details class="relation-list"><summary>Browse exact relationships</summary><ul>${list || "<li>No relations are available yet.</li>"}</ul></details><p class="ontology-boundary"><strong>Projection, not authority.</strong> This view explains recorded relationships. It cannot create, admit, execute, accept, or promote them.</p>`);
}

async function renderOperations() {
  const operations = await request("/api/v1/operations");
  const capacity = operations.capacity;
  const phaseRows = Object.entries(operations.runs.by_phase).map(([phase, count]) => `<li><span>${escapeHtml(phaseLabel(phase))}</span><strong>${count}</strong></li>`).join("");
  const percent = capacity.max_active_assignments ? Math.round(capacity.active_assignments * 100 / capacity.max_active_assignments) : 0;
  layout("Operations", "System observability", `<section class="capacity-card"><div><p class="eyebrow">Assignment capacity</p><h2>${capacity.available_assignments} slot(s) available</h2><p>The scheduler holds capacity through active leases. Waiting commands stay in their accepted run state.</p></div><div class="capacity-meter" role="meter" aria-label="Active assignment capacity" aria-valuemin="0" aria-valuemax="${capacity.max_active_assignments}" aria-valuenow="${capacity.active_assignments}"><span style="width:${percent}%"></span></div><dl><div><dt>Active</dt><dd>${capacity.active_assignments}</dd></div><div><dt>Maximum</dt><dd>${capacity.max_active_assignments}</dd></div><div><dt>Status</dt><dd>${escapeHtml(phaseLabel(capacity.status))}</dd></div></dl></section><section class="operations-grid"><article><span>Gateway</span><strong>${operations.gateway.reachable ? "Reachable" : operations.gateway.configured ? "Unavailable" : "Not configured"}</strong><p>${escapeHtml(operations.gateway.profile_ref || "No execution profile reported")}</p></article><article><span>Durable runtime</span><strong>${escapeHtml(phaseLabel(operations.storage.runtime))}</strong><p>${escapeHtml(operations.storage.durability)}</p></article><article><span>Pending commands</span><strong>${operations.runs.pending_commands}</strong><p>Across ${operations.runs.total} admitted run(s)</p></article><article><span>Recovery items</span><strong>${operations.runs.recovery_items}</strong><p>Items requiring observation or action</p></article><article><span>Durable leases</span><strong>${operations.runs.durable_leases}</strong><p>Assignment records retained across restarts</p></article><article><span>Durable receipts</span><strong>${operations.runs.durable_receipts}</strong><p>Worker completions recorded before event acceptance</p></article></section><section class="panel"><header><div><p class="eyebrow">Run population</p><h2>Runs by phase</h2></div><span>${operations.runs.total}</span></header><ul class="nodes">${phaseRows || "<li><span>No admitted runs</span><strong>0</strong></li>"}</ul></section><details class="policy"><summary>Observation boundary</summary><p>Operations reports runtime, capacity, gateway, and recovery facts. Reading this dashboard does not mutate runs or grant external-effect authority.</p></details>`);
}

async function render() { const route = parseRoute(location.pathname); if (route.view === "run") return renderRun(route.runId); if (route.view === "new") return renderNew(); if (route.view === "adapters") return renderAdapters(); if (route.view === "lab") return renderLab(); if (route.view === "ontology") return renderOntology(); if (route.view === "operations") return renderOperations(); return renderRuns(); }
function showError(error) { layout("The request could not be completed", "Control Center", `<section class="error"><p>${escapeHtml(error.message)}</p><button id="retry">Try again</button></section>`); document.querySelector("#retry")?.addEventListener("click", () => render().catch(showError)); }
render().catch(showError);
