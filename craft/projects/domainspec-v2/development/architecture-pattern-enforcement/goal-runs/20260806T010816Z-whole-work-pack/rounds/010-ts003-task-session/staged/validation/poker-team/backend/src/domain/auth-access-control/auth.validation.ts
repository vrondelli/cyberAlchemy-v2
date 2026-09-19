import { PERMISSION_KEY_PATTERN } from "./auth-context.vo";
import { AuthValidationError } from "./auth.errors";

/** I1: Permission keys are canonical */
export function validatePermissionKey(key: string): void {
  if (!PERMISSION_KEY_PATTERN.test(key)) {
    throw new AuthValidationError(
      "FORBIDDEN",
      `Permission key is not canonical: ${key}`,
    );
  }
}

/** I2: Access token expiry is after issue time */
export function validateTokenExpiry(issuedAt: Date, expiresAt: Date): void {
  if (expiresAt.getTime() <= issuedAt.getTime()) {
    throw new AuthValidationError(
      "INVALID_TOKEN",
      "Token expiresAt must be after issuedAt",
    );
  }
}

/** I3: Revoked token cannot be active */
export function validateRevokedNotActive(
  revokedAt: Date | null,
  status: string,
): void {
  if (revokedAt !== null && status === "ACTIVE") {
    throw new AuthValidationError(
      "TOKEN_REVOKED",
      "Revoked token cannot have ACTIVE status",
    );
  }
}

/** I4: Effective permissions are unique */
export function deduplicatePermissions(permissions: string[]): string[] {
  return [...new Set(permissions)];
}

/** I5: JWT identity claim is session id */
export function validateSidClaim(sid: unknown): asserts sid is string {
  if (typeof sid !== "string" || sid.trim().length === 0) {
    throw new AuthValidationError("INVALID_TOKEN", "Missing sid claim in JWT");
  }
}
