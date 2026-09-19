export { type AuthErrorCode, AUTH_ERROR_CODES } from "./auth-error-code.enum";
export {
  type Principal,
  type PrincipalStatus,
  type SubjectType,
} from "./principal.entity";
export { type Session, type SessionStatus } from "./session.entity";
export { type AccessToken, type TokenStatus } from "./access-token.entity";
export {
  type PermissionGrant,
  type GrantEffect,
} from "./permission-grant.entity";
export {
  type AuthContext,
  type PermissionKey,
  PERMISSION_KEY_PATTERN,
  parsePermissionKey,
  isCanonicalPermissionKey,
} from "./auth-context.vo";
export {
  type AuthSessionRepository,
  type AuthTokenRepository,
  type PrincipalRepository,
  type PermissionGrantRepository,
} from "./auth.repository";
export {
  type LoginSucceededEvent,
  type TokenIssuedEvent,
  type TokenRevokedEvent,
  type LogoutCompletedEvent,
  type AccessDeniedEvent,
  type AuthEvent,
  type AuthEventHandler,
} from "./auth.events";
export { AuthValidationError, AuthInternalError } from "./auth.errors";
export { transitionSession, isTerminalSessionState } from "./session-lifecycle";
export { transitionToken, isTerminalTokenState } from "./token-lifecycle";
export {
  validatePermissionKey,
  validateTokenExpiry,
  validateRevokedNotActive,
  deduplicatePermissions,
  validateSidClaim,
} from "./auth.validation";
