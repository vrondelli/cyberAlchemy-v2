export interface ProductionRollbackSubject {
  "service-id": string;
  "current-revision": string;
  "status": string;
}

export type DomainOutcome = "pass" | "denied" | "blocked" | "failed" | "uncertain";
export interface DomainResult { outcome: DomainOutcome; code: string; event?: string; receipt?: Record<string, unknown>; idempotent?: boolean; }
