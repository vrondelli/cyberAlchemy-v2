import { useEffect, useRef, useState } from "react";
import { workerEndpoint } from "./workers";

type Task = { schema_version: "are-text-task/v1"; task_id: string; title: string; instruction: string; input: string; objective_kind: "understand" };
type Budget = { provider_calls: number; max_output_tokens: number; tools_enabled: boolean };
type Review = { review_id: string; digest: string; target: string; budget: Budget; task: Task };
type Snapshot = { schema_version: string; target: string; budget: Budget; remaining: number; busy: boolean; tasks: {
  task_id: string; title: string; status: string; output?: string; thread_id?: string; turn_id?: string;
}[] };
const boundedBudget = (budget: Budget) => budget?.provider_calls === 1 && budget.max_output_tokens === 512 && budget.tools_enabled === false;

/** Explicit review and launch through a token-authenticated local bridge. */
export function TaskLauncher() {
  const [address, setAddress] = useState("");
  const [token, setToken] = useState("");
  const [connection, setConnection] = useState<{ origin: string; token: string } | null>(null);
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [title, setTitle] = useState("");
  const [instruction, setInstruction] = useState("");
  const [input, setInput] = useState("");
  const [review, setReview] = useState<Review | null>(null);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");
  const generation = useRef(0);
  async function request(path: string, body?: unknown) {
    if (!connection) throw new Error("Connect to the task bridge first.");
    const response = await fetch(connection.origin + path, {
      method: body === undefined ? "GET" : "POST", headers: { Authorization: `Bearer ${connection.token}`, ...(body === undefined ? {} : { "Content-Type": "application/json" }) },
      body: body === undefined ? undefined : JSON.stringify(body), credentials: "omit", cache: "no-store", redirect: "error", signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) throw new Error(response.status === 401 ? "Bridge token rejected." : `Bridge request failed (${response.status}). Check task status before attempting another launch.`);
    return response.json();
  }
  useEffect(() => {
    if (!connection) return;
    let disposed = false;
    let timer: ReturnType<typeof setTimeout>;
    const poll = async () => {
      try {
        const value = await request("/api/v1/tasks") as Snapshot;
        if (value.schema_version !== "workspace-task-bridge/v1" || !boundedBudget(value.budget) || !Array.isArray(value.tasks)) throw new Error("Unsupported task bridge.");
        if (!disposed) { setSnapshot(value); setError(""); }
      } catch (cause) { if (!disposed) { setSnapshot(null); setError((cause as Error).message); } }
      if (!disposed) timer = setTimeout(poll, 1500);
    };
    void poll();
    return () => { disposed = true; clearTimeout(timer); };
  }, [connection]);
  const editable = !working && !snapshot?.busy;
  const canSubmit = Boolean(snapshot && snapshot.remaining > 0 && !snapshot.busy && !snapshot.tasks.some(task => task.status === "uncertain"));
  const invalidate = () => { generation.current++; setReview(null); };
  return <section className="luna-task-launcher" aria-label="Launch a Luna task">
    <header><strong>Launch a Luna task</strong><span>{snapshot ? `${snapshot.remaining} launches remaining` : "Task bridge disconnected"}</span></header>
    <form onSubmit={event => {
      event.preventDefault();
      try {
        const origin = new URL(workerEndpoint(address)).origin;
        if (!token.trim()) throw new Error("Enter the local bridge token.");
        invalidate(); setSnapshot(null); setError(""); setConnection({ origin, token: token.trim() });
      } catch (cause) {setError((cause as Error).message);}
    }}>
      <label>Task bridge address<input aria-label="Task bridge address" placeholder="http://127.0.0.1:18084" value={address} disabled={!!connection} onChange={event => setAddress(event.target.value)} /></label>
      <label>Bridge token<input aria-label="Bridge token" type="password" autoComplete="off" value={token} disabled={!!connection} onChange={event => setToken(event.target.value)} /></label>
      <button disabled={!!connection}>Connect task bridge</button>
      {connection && <button type="button" onClick={() => {invalidate(); setConnection(null); setToken(""); setSnapshot(null); setWorking(false); setError("");}}>Disconnect task bridge</button>}
    </form>
    {error && <p role="alert">{error}</p>}
    {snapshot && <>
      <p>Task type: explain or summarize supplied text.</p>
      <p>Target: {snapshot.target} · One model call per task · 512 output tokens · Tools disabled</p>
      <form onSubmit={async event => {
        event.preventDefault(); const current = ++generation.current; setWorking(true); setError("");
        const task: Task = { schema_version: "are-text-task/v1", task_id: crypto.randomUUID(), title, instruction, input, objective_kind: "understand" };
        try {
          const value = await request("/api/v1/tasks/review", { task }) as Review;
          if (!boundedBudget(value.budget) || JSON.stringify(value.task) !== JSON.stringify(task) || !/^[a-f0-9]{64}$/.test(value.digest)) throw new Error("Task review binding did not match.");
          if (generation.current === current) setReview(value);
        } catch (cause) {if (generation.current === current) setError((cause as Error).message);}
        finally {if (generation.current === current) setWorking(false);}
      }}>
        <label>Task title<input aria-label="Task title" required maxLength={160} value={title} disabled={!editable} onChange={event => {invalidate(); setTitle(event.target.value);}} /></label>
        <label>Instruction<textarea aria-label="Task instruction" required maxLength={2048} value={instruction} disabled={!editable} onChange={event => {invalidate(); setInstruction(event.target.value);}} /></label>
        <label>Supplied text<textarea aria-label="Supplied text" required maxLength={8192} value={input} disabled={!editable} onChange={event => {invalidate(); setInput(event.target.value);}} /></label>
        <button disabled={!canSubmit || working}>Review task</button>
      </form>
      {review && <article aria-label="Task review">
        <strong>{review.task.title}</strong><p>{review.task.instruction}</p><pre>{review.task.input}</pre>
        <p>Launch on {review.target}: one model call, up to 512 output tokens, no tools.</p>
        <button disabled={!canSubmit || working} onClick={async () => {
          const current = ++generation.current; setWorking(true); setError("");
          try {
            const next = await request("/api/v1/tasks/launch", { review_id: review.review_id, digest: review.digest, budget_accepted: true }) as Snapshot;
            if (generation.current === current) {setSnapshot(next); setReview(null);}
          } catch (cause) {if (generation.current === current) setError((cause as Error).message);}
          finally {if (generation.current === current) setWorking(false);}
        }}>Launch task · 1 model call</button>
      </article>}
      {snapshot.tasks.map(task => <article key={task.task_id} aria-label={`Task ${task.title}`}>
        <strong>{task.title}</strong><p role="status">{task.status}</p>
        {task.status === "uncertain" && <p>Dispatch needs operator inspection. Automatic retry is blocked.</p>}
        {task.output && <pre>{task.output}</pre>}
        {task.turn_id && <details><summary>Execution receipt</summary><code>Thread: {task.thread_id}</code><code>Turn: {task.turn_id}</code></details>}
      </article>)}
    </>}
  </section>;
}
