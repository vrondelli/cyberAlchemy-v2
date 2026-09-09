export function validateSubject(input: Record<string, unknown>): void {
  if (typeof input["stock-item-id"] !== "string") throw new Error("SCHEMA_REQUIRED:stock-item-id");
  if (typeof input["available-quantity"] !== "number") throw new Error("SCHEMA_REQUIRED:available-quantity");
  if (typeof input["status"] !== "string") throw new Error("SCHEMA_REQUIRED:status");
}
