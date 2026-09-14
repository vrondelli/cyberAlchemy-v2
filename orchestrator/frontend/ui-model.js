export const phaseLabels = Object.freeze({
  active: "Active",
  needs_attention: "Needs attention",
  completed: "Structurally complete",
  failed: "Failed",
  cancelled: "Cancelled",
  issued: "Ready",
});

export function phaseLabel(phase) {
  return phaseLabels[phase] ?? String(phase || "Unknown").replaceAll("_", " ");
}

export function parseRoute(pathname) {
  const parts = pathname.split("/").filter(Boolean).map((value) => decodeURIComponent(value));
  if (parts[0] === "adapters") return { view: "adapters" };
  if (parts[0] === "lab") return { view: "lab" };
  if (parts[0] === "ontology") return { view: "ontology" };
  if (parts[0] === "operations") return { view: "operations" };
  if (parts[0] === "runs" && parts[1] === "new") return { view: "new" };
  if (parts[0] === "runs" && parts[1]) return { view: "run", runId: parts[1] };
  return { view: "runs" };
}

export function graphScene(graph) {
  const nodes = Object.values(graph?.nodes ?? {}).sort((a, b) => a.node_id.localeCompare(b.node_id));
  const level = new Map();
  for (let pass = 0; pass < nodes.length; pass += 1) {
    for (const node of nodes) {
      if (level.has(node.node_id) || node.depends_on.some((id) => !level.has(id))) continue;
      level.set(node.node_id, node.depends_on.length ? Math.max(...node.depends_on.map((id) => level.get(id))) + 1 : 0);
    }
  }
  for (const node of nodes) if (!level.has(node.node_id)) level.set(node.node_id, 0);
  const columns = new Map();
  for (const node of nodes) {
    const column = level.get(node.node_id);
    columns.set(column, [...(columns.get(column) ?? []), node]);
  }
  const maxLevel = Math.max(0, ...level.values());
  const maxRows = Math.max(1, ...[...columns.values()].map((items) => items.length));
  const width = Math.max(720, (maxLevel + 1) * 250);
  const height = Math.max(300, maxRows * 116 + 110);
  const positioned = nodes.map((node) => {
    const column = level.get(node.node_id);
    const row = columns.get(column).findIndex((candidate) => candidate.node_id === node.node_id);
    const x = maxLevel === 0 ? width / 2 : 100 + column * ((width - 200) / maxLevel);
    const y = 90 + row * 116 + (maxRows - columns.get(column).length) * 58;
    return { ...node, x, y };
  });
  const byId = new Map(positioned.map((node) => [node.node_id, node]));
  const edges = positioned.flatMap((node) => node.depends_on.map((dependency) => ({ from: byId.get(dependency), to: node })).filter((edge) => edge.from));
  return { nodes: positioned, edges, width, height };
}

export function buildOrchestratorOntology(state, templates, runTemplates, adapters) {
  const nodes = new Map();
  const relations = [];
  const add = (id, kind, label, detail, href = null) => nodes.set(id, { id, kind, label, detail, href });
  const relate = (from, type, to) => relations.push({ id: `${from}:${type}:${to}`, from, type, to });
  for (const adapter of adapters?.adapters ?? []) add(`adapter:${adapter.adapter_ref}`, "adapter", adapter.adapter_ref, adapter.available ? "Available execution adapter" : "Unavailable execution adapter", "/adapters");
  for (const template of templates?.templates ?? []) {
    const id = `strategy:${template.template_id}@${template.version}`;
    add(id, "strategy", template.template_id, `Strategy template ${template.version}`, "/lab");
  }
  for (const template of runTemplates?.run_templates ?? []) {
    const id = `template:${template.run_template_id}@${template.version}`;
    const strategy = `strategy:${template.strategy_template_id}@${template.strategy_template_version}`;
    add(id, "template", template.display_name || template.run_template_id, template.description || `Run template ${template.version}`, "/lab");
    if (nodes.has(strategy)) relate(id, "instantiates", strategy);
  }
  for (const run of state?.runs ?? []) {
    const runId = `run:${run.run_id}`;
    const context = run.bundle?.admission_context ?? {};
    const strategyId = context.strategy_id ? `strategy:${context.strategy_id}@${context.strategy_version || "unknown"}` : null;
    add(runId, "run", run.run_id, `${phaseLabel(run.phase)} · revision ${run.revision}`, `/runs/${encodeURIComponent(run.run_id)}`);
    if (strategyId) {
      if (!nodes.has(strategyId)) add(strategyId, "strategy", context.strategy_id, `Admitted strategy ${context.strategy_version || "version unknown"}`);
      relate(runId, "executes", strategyId);
    }
    for (const node of Object.values(run.bundle?.graph?.nodes ?? {})) {
      const workId = `work:${run.run_id}:${node.node_id}`;
      const roleId = `role:${node.role_id}`;
      add(workId, "work", node.node_id, `${node.contract} · ${phaseLabel(run.history?.cursor?.node_status?.[node.node_id])}`, `/runs/${encodeURIComponent(run.run_id)}`);
      if (!nodes.has(roleId)) add(roleId, "role", node.role_id, "Required agent role");
      relate(runId, "contains", workId);
      relate(workId, "requires", roleId);
      for (const dependency of node.depends_on) relate(`work:${run.run_id}:${dependency}`, "precedes", workId);
    }
    for (const adapterRef of context.selected_adapter_refs ?? []) {
      const adapterId = `adapter:${adapterRef}`;
      if (!nodes.has(adapterId)) add(adapterId, "adapter", adapterRef, "Selected execution adapter", "/adapters");
      relate(runId, "uses", adapterId);
    }
  }
  return { nodes: [...nodes.values()], relations };
}

export function runCounts(run) {
  const statuses = Object.values(run?.history?.cursor?.node_status ?? {});
  return statuses.reduce(
    (result, status) => {
      const bucket = status === "issued" || status === "ready" ? "pending" : status;
      return { ...result, [bucket]: (result[bucket] ?? 0) + 1 };
    },
    { pending: 0, running: 0, succeeded: 0, failed: 0 },
  );
}

export function recoveryInstruction(assessment) {
  const messages = {
    execute: "The command can be offered to a compatible worker.",
    wait: "A worker lease is active. Wait for a receipt or expiry.",
    reconcile: "The attempt began but no receipt arrived. Investigate the external effect before retrying.",
    blocked_unknown_effect: "An owner must resolve whether the external effect happened.",
    accept_recorded_event: "A validated receipt exists and its recorded event can be accepted.",
    complete: "No recovery action remains for this command.",
  };
  return messages[assessment?.action] ?? assessment?.reason ?? "Inspect the command record.";
}

export function runExplanation(run) {
  const source = run?.explanation ?? {};
  return {
    state: source.state || `Run is ${phaseLabel(run?.phase).toLowerCase()}.`,
    why: source.why || "No accepted-history explanation was reported.",
    next: source.next || "Inspect the run contract and recovery state.",
    authority: source.authority || "Structural completion does not accept results or authorize external effects.",
  };
}

export function shortDigest(value) {
  return String(value || "").replace(/^sha256:/, "").slice(0, 12) || "unavailable";
}
