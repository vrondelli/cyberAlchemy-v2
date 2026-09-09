type Receipt = {
  schema_version: "workspace.handshake-phases/v1"; session_id: string; attempt_id: string;
  clock: "frontend-monotonic"; frame_available: boolean; start_ms: number;
  status_end_ms: number; end_ms: number; status_ipc_ms: number; post_status_frame_ms: number;
  authority_effect: "none";
};
export const receipts: Receipt[] = [];
let settle!: () => void;
export const handshakeSettled = new Promise<void>(resolve => { settle = resolve; });
let sequence = 0;
const sessionId = globalThis.crypto.randomUUID();

export async function measureHandshake<T>(invoke: () => Promise<T>): Promise<T> {
  const attemptId = String(++sequence);
  const start = performance.now();
  try {
    const result = await invoke();
    const statusEnd = performance.now();
    const frameAvailable = typeof requestAnimationFrame === "function";
    if (frameAvailable) await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
    const end = performance.now();
    if ([start, statusEnd, end].every(Number.isFinite) && start >= 0 && statusEnd >= start && end >= statusEnd) {
      receipts.push({schema_version:"workspace.handshake-phases/v1",session_id:sessionId,attempt_id:attemptId,
        clock:"frontend-monotonic",frame_available:frameAvailable,start_ms:start,status_end_ms:statusEnd,end_ms:end,
        status_ipc_ms:statusEnd-start,post_status_frame_ms:end-statusEnd,authority_effect:"none"});
      if (receipts.length > 64) receipts.splice(0, receipts.length - 64);
    }
    return result;
  } finally { settle(); }
}

// Retain original idle/timer scheduling AFTER this barrier. Cleanup covers both
// waiting and already scheduled phases; on-demand imports never use this barrier.
export function scheduleAfterHandshake(
  schedule: () => (() => void),
  ready: Promise<void> = handshakeSettled,
  timers = {set: (fn: () => void) => setTimeout(fn, 1000), clear: (id: ReturnType<typeof setTimeout>) => clearTimeout(id)},
): () => void {
  let disposed = false, started = false;
  let cleanup: (() => void) | undefined;
  const start = () => {
    if (disposed || started) return;
    started = true;
    timers.clear(timer);
    cleanup = schedule();
  };
  const timer = timers.set(start);
  void ready.then(start, start);
  return () => {
    disposed = true;
    timers.clear(timer);
    cleanup?.();
  };
}
