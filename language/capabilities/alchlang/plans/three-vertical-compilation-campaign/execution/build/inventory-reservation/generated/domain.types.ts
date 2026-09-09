export interface InventoryReservationSubject {
  "stock-item-id": string;
  "available-quantity": number;
  "status": string;
}

export type DomainOutcome = "pass" | "denied" | "blocked" | "failed" | "uncertain";
export interface DomainResult { outcome: DomainOutcome; code: string; event?: string; receipt?: Record<string, unknown>; idempotent?: boolean; }
