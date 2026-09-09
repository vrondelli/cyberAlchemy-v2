export interface WorkerEvidence { threadId: string; turnId: string; completionDigest: string; commandIdentity: string; graphIdentity: string }
export interface WorkerTask { id: string; run: string; role: string; stage: string; status: string; evidence?: WorkerEvidence }
export interface WorkerSnapshot { source: string; generatedAt: string; tasks: WorkerTask[]; pool: { id: string; name: string; availability: string; active: number | null }[] }
const record = (v: unknown): Record<string, unknown> => {
  if (!v || typeof v !== "object" || Array.isArray(v)) throw new Error("Invalid orchestrator state");
  return v as Record<string, unknown>;
};
const string = (v: unknown): string => { if (typeof v !== "string") throw new Error("Invalid orchestrator field"); return v; };
function executionEvidence(value: unknown): WorkerEvidence {
  const evidence = record(value);
  if (evidence.history_verified !== true) throw new Error("Unverified RWO history");
  const completionDigest = string(evidence.completion_binding_digest);
  if (!/^[a-f0-9]{64}$/.test(completionDigest)) throw new Error("Invalid ARE completion digest");
  return { threadId: string(evidence.thread_id), turnId: string(evidence.turn_id), completionDigest,
    commandIdentity: string(evidence.command_intent_identity), graphIdentity: string(evidence.graph_identity) };
}
export function workerEndpoint(input: string): string {
  const url = new URL(input);
  if (url.protocol !== "http:" || !["localhost", "127.0.0.1", "[::1]"].includes(url.hostname) || url.username || url.password || url.search || url.hash) throw new Error("Use a loopback HTTP origin without credentials");
  if (url.pathname !== "/" && url.pathname !== "/api/v1/state") throw new Error("Use the orchestrator origin or /api/v1/state");
  return `${url.origin}/api/v1/state`;
}
export function projectWorkers(value: unknown): WorkerSnapshot {
  const root = record(value);
  if (!Array.isArray(root.runs) || !Array.isArray(root.executor_pool)) throw new Error("Worker projection unavailable");
  const tasks: WorkerTask[] = [];
  for (const item of root.runs) {
    const run = record(item);
    if (!run.strategy) continue;
    const strategy = record(run.strategy);
    if (strategy.model !== "gpt-5.6-luna") continue;
    if (!Array.isArray(strategy.nodes)) throw new Error("Invalid strategy nodes");
    for (const item of strategy.nodes) {
      const node = record(item);
      tasks.push({ id: `${string(run.run_key)}:${string(node.node_id)}`, run: string(run.title), role: string(node.role_id), stage: string(node.stage), status: string(node.status),
        ...(node.execution_evidence === undefined ? {} : { evidence: executionEvidence(node.execution_evidence) }) });
    }
  }
  const pool = root.executor_pool.map(record).filter(item => item.model === "gpt-5.6-luna").map(item => ({ id: string(item.id), name: string(item.name), availability: string(item.availability), active: typeof item.active === "number" && Number.isFinite(item.active) && item.active >= 0 ? item.active : null }));
  return { source: string(root.source_mode), generatedAt: string(root.generated_at), tasks, pool };
}
