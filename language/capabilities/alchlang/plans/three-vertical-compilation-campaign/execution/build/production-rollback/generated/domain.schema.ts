export function validateSubject(input: Record<string, unknown>): void {
  if (typeof input["service-id"] !== "string") throw new Error("SCHEMA_REQUIRED:service-id");
  if (typeof input["current-revision"] !== "string") throw new Error("SCHEMA_REQUIRED:current-revision");
  if (typeof input["status"] !== "string") throw new Error("SCHEMA_REQUIRED:status");
}
