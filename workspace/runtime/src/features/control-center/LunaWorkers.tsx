import { useEffect, useState } from "react";
import { projectWorkers, workerEndpoint, type WorkerSnapshot } from "./workers";
import connectionObservation from "./are-luna-observation.json";
import { TaskLauncher } from "./TaskLauncher";

/** Read-only monitor alongside explicit, separately authenticated task controls. */
export function LunaWorkers() {
  const [address, setAddress] = useState("");
  const [endpoint, setEndpoint] = useState("");
  const [snapshot, setSnapshot] = useState<WorkerSnapshot | null>(null);
  const [error, setError] = useState("");
  const [updated, setUpdated] = useState("");
  useEffect(() => {
    if (!endpoint) return;
    let disposed = false;
    let timer: ReturnType<typeof setTimeout>;
    let controller: AbortController;
    const poll = async () => {
      controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 4000);
      try {
        const response = await fetch(endpoint, { signal: controller.signal, credentials: "omit", cache: "no-store", redirect: "error" });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const next = projectWorkers(await response.json());
        if (!disposed) { setSnapshot(next); setUpdated(new Date().toLocaleTimeString()); setError(""); }
      } catch {
        if (!disposed) setError("Runtime unavailable — check the endpoint and browser/native access. Previous observations are stale.");
      } finally {
        clearTimeout(timeout);
        if (!disposed) timer = setTimeout(poll, 3000);
      }
    };
    void poll();
    return () => { disposed = true; clearTimeout(timer); controller?.abort(); };
  }, [endpoint]);
  return <>
    <aside className="luna-workers luna-pool" aria-label="Luna worker pool">
      <header><strong>Luna workers</strong><span>{!endpoint ? "Orchestrator disconnected" : error ? "Stale / unavailable" : snapshot ? "Orchestrator connected" : "Connecting…"}</span></header>
      <article aria-label="ARE Luna connection evidence">
        <strong>ARE → {connectionObservation.model}</strong>
        <p>Connection verified · test session closed</p>
        <small>Historical read-only canary · {connectionObservation.completed_at}</small>
        <details><summary>Connection receipt</summary>
          <p>{connectionObservation.response}</p>
          <code>Thread: {connectionObservation.thread_id}</code>
          <code>Turn: {connectionObservation.turn_id}</code>
          <small>{connectionObservation.effect_requests} approval requests · no active worker implied</small>
          <code>Profile: {connectionObservation.profile_sha256}</code>
        </details>
      </article>
      <form onSubmit={event => { event.preventDefault(); try { const next = workerEndpoint(address); setSnapshot(null); setUpdated(""); setError(""); setEndpoint(next); } catch (cause) { setError((cause as Error).message); } }}>
        <label>Local orchestrator<input aria-label="Local orchestrator address" placeholder="http://127.0.0.1:PORT" value={address} onChange={event => setAddress(event.target.value)} /></label>
        <button type="submit" disabled={!!endpoint}>Connect</button>
        {endpoint && <button type="button" onClick={() => { setEndpoint(""); setSnapshot(null); setUpdated(""); setError(""); }}>Disconnect</button>}
      </form>
      {error && <p role="status">{error}</p>}
      {snapshot?.pool.map(worker => <article key={worker.id}><strong>{worker.name}</strong><p>{worker.availability} · {worker.active ?? "Unknown"} active</p></article>)}
      {snapshot && !snapshot.pool.length && <p>No Luna executor reported.</p>}
      <small>{snapshot ? `Source: ${snapshot.source} · observed ${updated} · generated ${snapshot.generatedAt}` : "Connect to follow real assignments. This panel does not launch workers."}</small>
    </aside>
    <aside className="luna-workers luna-tasks" aria-label="Luna task activity">
      <TaskLauncher />
      <header><strong>Delegated work</strong><span>{error ? "Stale" : snapshot ? `${snapshot.tasks.length} tasks` : "Not connected"}</span></header>
      {!snapshot && <p>Worker tasks will appear here when the orchestrator reports them.</p>}
      {snapshot && !snapshot.tasks.length && <p>No Luna tasks reported.</p>}
      {snapshot?.tasks.map(task => <article key={task.id}><strong>{task.role}</strong><span className="luna-task-status">{task.status}</span><p>{task.run}</p><small>{task.stage}</small><code>{task.id}</code>
        {task.evidence && <details><summary>RWO / ARE completion receipt</summary>
          <small>Runtime reports replay-verified history</small>
          <code>Thread: {task.evidence.threadId}</code><code>Turn: {task.evidence.turnId}</code>
          <code>Completion: {task.evidence.completionDigest}</code>
          <code>Command: {task.evidence.commandIdentity}</code><code>Graph: {task.evidence.graphIdentity}</code>
        </details>}
      </article>)}
      <small>Runtime snapshot · no inferred progress · no approval authority</small>
    </aside>
  </>;
}
