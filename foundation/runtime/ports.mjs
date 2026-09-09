export const foundationPorts = Object.freeze([
  Object.freeze({
    id: "definition_dependency_diagnostics",
    owner: "ontology-governance-dependency-kernel",
    operations: Object.freeze(["check_selected_source"]),
    effectAuthority: false,
  }),
  Object.freeze({
    id: "construction_stage_observation",
    owner: "continuous-construction",
    operations: Object.freeze(["observe_stage"]),
    effectAuthority: false,
  }),
  Object.freeze({
    id: "work_routing",
    owner: "work-orchestration",
    operations: Object.freeze(["prepare_work_request"]),
    effectAuthority: false,
  }),
  Object.freeze({
    id: "persistence",
    owner: "durable-storage",
    operations: Object.freeze(["prepare_record"]),
    effectAuthority: false,
  }),
  Object.freeze({
    id: "principal_evidence",
    owner: "tauri-agent-control-plane",
    operations: Object.freeze(["principal_evidence"]),
    effectAuthority: "host-owned",
  }),
  Object.freeze({
    id: "host_execution",
    owner: "tauri-agent-control-plane",
    operations: Object.freeze(["execute"]),
    effectAuthority: "host-owned-and-not-bound-by-this-candidate",
  }),
]);

export function portById(id) {
  return foundationPorts.find((port) => port.id === id) ?? null;
}
