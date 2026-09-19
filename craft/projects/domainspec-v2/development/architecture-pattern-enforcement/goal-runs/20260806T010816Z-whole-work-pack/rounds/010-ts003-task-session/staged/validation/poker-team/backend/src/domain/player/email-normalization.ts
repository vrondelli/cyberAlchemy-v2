export const normalizeEmail = (email: string): string =>
  email.trim().toLowerCase();

export const canonicalEmailKey = (email: string): string =>
  normalizeEmail(email).replace(/[^a-z0-9]/g, "");

export const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

export const ALLOWED_LIMITS = [
  "NL20",
  "NL40",
  "NL60",
  "NL80",
  "NL100",
] as const;

export const isAllowedLimit = (limit: string): boolean =>
  ALLOWED_LIMITS.includes(limit as (typeof ALLOWED_LIMITS)[number]);
