import type { AuthErrorCode } from "./auth-error-code.enum";

export class AuthValidationError extends Error {
  constructor(
    public readonly code: AuthErrorCode,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "AuthValidationError";
  }
}

export class AuthInternalError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthInternalError";
  }
}
