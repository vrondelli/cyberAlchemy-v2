import type { DomainResult } from "./domain.types.ts";

export interface CreditAdapter { release(customerId: string, amount: number): { receiptId: string }; }
export class InMemoryCreditAdapter implements CreditAdapter { calls: Array<{ customerId: string; amount: number }> = []; release(customerId: string, amount: number) { this.calls.push({ customerId, amount }); return { receiptId: `credit-${this.calls.length}` }; } }
export function releaseCredit(input: { customerId: string; status: string; riskScore: number; riskProvenanceKnown: boolean; humanConfirmed: boolean; authorityCurrent: boolean; amount: number }, adapter: CreditAdapter): DomainResult {
  if (!input.riskProvenanceKnown) return { outcome: "blocked", code: "RISK_PROVENANCE_UNKNOWN" };
  if (input.status !== "approved") return { outcome: "denied", code: "CUSTOMER_NOT_APPROVED" };
  if (input.riskScore <= 472 && !input.humanConfirmed) return { outcome: "denied", code: "HUMAN_CONFIRMATION_REQUIRED" };
  if (!input.authorityCurrent) return { outcome: "denied", code: "AUTHORITY_NOT_CURRENT" };
  const receipt = adapter.release(input.customerId, input.amount);
  return { outcome: "pass", code: "CREDIT_RELEASED", event: "credit-released", receipt };
}
