/**
 * Base domain error — carries a semantic code, never HTTP status.
 * HTTP mapping lives in infrastructure/http/error-mapper.ts.
 */
export class DomainError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "DomainError";
  }
}
