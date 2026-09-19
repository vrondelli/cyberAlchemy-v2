import { DomainError } from "../../domain/errors";

const CODE_TO_STATUS: Record<string, number> = {
  VALIDATION_ERROR: 400,
  LGPD_CONSENT_REQUIRED: 400,
  NOT_FOUND: 404,
  PLAYER_NOT_FOUND: 404,
  DUPLICATE_CANDIDATE: 409,
  PLAYER_ALREADY_ASSIGNED: 409,
  NO_CHANGES_DETECTED: 400,
};

/**
 * Maps a DomainError code to an HTTP status.
 * Falls back to legacy statusCode if present, then 500.
 */
export function domainErrorToHttpStatus(error: unknown): number {
  if (error instanceof DomainError) {
    return CODE_TO_STATUS[error.code] ?? 500;
  }

  // Legacy compatibility: errors with statusCode property
  const legacy = error as { statusCode?: number };
  if (typeof legacy.statusCode === "number") {
    return legacy.statusCode;
  }

  return 500;
}

export function domainErrorCode(error: unknown): string {
  if (error instanceof DomainError) return error.code;
  const legacy = error as { code?: string };
  return typeof legacy.code === "string" ? legacy.code : "INTERNAL_ERROR";
}

export function domainErrorDetails(error: unknown): unknown {
  if (error instanceof DomainError) return error.details;
  const legacy = error as { details?: unknown };
  return legacy.details;
}
