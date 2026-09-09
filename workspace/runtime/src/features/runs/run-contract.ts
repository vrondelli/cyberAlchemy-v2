import type {RunOriginBinding} from './source-context';
import type {RunStrategyView} from './run-strategy';
/** Candidate presentation contract. Open questions: ./README.md#open-questions. */
export const RUN_PROJECTION_SCHEMA = 'workspace-run-projection/v1-candidate' as const;
export type ExecutionStatus = 'preparing' | 'queued' | 'running' | 'blocked' | 'succeeded' | 'failed' | 'cancelling' | 'cancelled' | 'uncertain' | 'unknown';
export type RunIcon = 'text-task' | 'research' | 'workflow';
export interface RunSource {
  /** Stable configured runtime identity, never inferred from a URL or title. */
  runtimeId: string;
  label: string;
  location: 'local' | 'vps' | 'unknown';
  observedAtMs: number;
  nowMs: number;
  maxAgeMs: number;
  available: boolean;
}
export interface RunReference { runtimeId: string; runKey: string }
export interface RunView {
  viewId: string;
  runRef: RunReference | null;
  launchId: string | null;
  taskId: string | null;
  title: string;
  icon: RunIcon;
  workKind: string;
  originRefs: Array<{kind: string; id: string; revision: string | null}>;
  origin?:RunOriginBinding;
  execution: ExecutionStatus;
  scheduling: 'paused' | 'active' | 'unknown';
  mode: 'fixture' | 'live' | 'unknown';
  executor: {contract: string | null; modelTarget: string | null};
  strategy?:RunStrategyView|null;
  progress: {accepted: number; running: number; pending: number; blocked: number; total: number} | null;
  result: {kind: 'fixture-text' | 'provider-output' | 'audited-research' | 'unknown'; content: string | null; verification: 'owner-verified' | 'source-reported' | 'unavailable'; completionDigest: string | null};
  lifecycle: {execution: string | null; acceptance: string | null; promotion: string | null};
  source: {runtimeId: string; label: string; location: RunSource['location']; freshness: 'fresh' | 'stale' | 'offline'; observedAtMs: number; revision: number | null};
  attention: string[];
  /** Actions are advertised by the selected backend, never inferred by the UI. */
  actions: readonly ("cancel" | "reconcile-stop")[];
}
export interface RunProjection {
  schemaVersion: typeof RUN_PROJECTION_SCHEMA;
  authorityEffect: 'none';
  sources: RunView['source'][];
  runs: RunView[];
}
export function runViewId(runtimeId: string, kind: 'run' | 'launch', id: string): string {
  return [runtimeId, kind, id].map(encodeURIComponent).join('/');
}
