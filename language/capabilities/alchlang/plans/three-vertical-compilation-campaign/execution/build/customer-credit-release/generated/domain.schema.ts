export function validateSubject(input: Record<string, unknown>): void {
  if (typeof input["customer-id"] !== "string") throw new Error("SCHEMA_REQUIRED:customer-id");
  if (typeof input["risk-score"] !== "number") throw new Error("SCHEMA_REQUIRED:risk-score");
  if (typeof input["status"] !== "string") throw new Error("SCHEMA_REQUIRED:status");
}
