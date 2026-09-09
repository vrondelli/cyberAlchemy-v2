export interface PerformanceSample {
  name: string;
  durationMs: number;
  recordedAtUnixMs: number;
  detail?: Record<string, unknown>;
}

declare global {
  interface Window {
    __CA2_PERFORMANCE_SAMPLES__?: PerformanceSample[];
  }
}

const MAX_SAMPLES = 256;
let sequence = 0;

export function recordPerformanceSample(sample: PerformanceSample): void {
  if (typeof window === "undefined") return;
  const samples = window.__CA2_PERFORMANCE_SAMPLES__ ?? [];
  samples.push(sample);
  if (samples.length > MAX_SAMPLES) samples.splice(0, samples.length - MAX_SAMPLES);
  window.__CA2_PERFORMANCE_SAMPLES__ = samples;
}

export function markNextPaint(name: string, detail?: Record<string, unknown>): void {
  if (typeof requestAnimationFrame !== "function" || typeof performance === "undefined") return;
  const startedAt = performance.now();
  const sampleSequence = ++sequence;
  requestAnimationFrame((paintBoundaryMs) => {
    recordPerformanceSample({
      name,
      durationMs: Math.max(0, paintBoundaryMs - startedAt),
      recordedAtUnixMs: Date.now(),
      detail: { ...detail, sequence: sampleSequence, completion: "next-animation-frame-boundary" },
    });
  });
}

export async function measureAsync<Result>(
  name: string,
  operation: () => Promise<Result>,
  detail?: Record<string, unknown>,
): Promise<Result> {
  const startedAt = performance.now();
  try {
    return await operation();
  } finally {
    recordPerformanceSample({
      name,
      durationMs: performance.now() - startedAt,
      recordedAtUnixMs: Date.now(),
      detail,
    });
  }
}

export function installLongTaskObserver(): () => void {
  if (typeof PerformanceObserver === "undefined") return () => undefined;
  try {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        recordPerformanceSample({
          name: "workspace.long-task",
          durationMs: entry.duration,
          recordedAtUnixMs: Date.now(),
          detail: { startTimeMs: entry.startTime },
        });
      }
    });
    observer.observe({ type: "longtask", buffered: true } as PerformanceObserverInit);
    return () => observer.disconnect();
  } catch {
    return () => undefined;
  }
}
