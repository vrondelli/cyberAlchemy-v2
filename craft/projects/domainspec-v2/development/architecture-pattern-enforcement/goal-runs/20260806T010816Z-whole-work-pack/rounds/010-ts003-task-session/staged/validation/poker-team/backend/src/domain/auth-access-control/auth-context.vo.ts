export type AuthContext = {
  principalId: string;
  sessionId: string;
  permissions: string[];
  tokenId: string;
  issuedAt: Date;
  expiresAt: Date;
};

export type PermissionKey = {
  microservice: string;
  scope: string;
  action: string;
};

export const PERMISSION_KEY_PATTERN = /^[a-z0-9-]+\.[a-z0-9-]+\.[a-zA-Z0-9*]+$/;

export function parsePermissionKey(raw: string): PermissionKey | null {
  if (!PERMISSION_KEY_PATTERN.test(raw)) {
    return null;
  }
  const [microservice, scope, action] = raw.split(".");
  return { microservice, scope, action };
}

export function isCanonicalPermissionKey(raw: string): boolean {
  return PERMISSION_KEY_PATTERN.test(raw);
}
