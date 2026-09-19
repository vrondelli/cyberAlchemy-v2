export type AuthSession = {
  id: string;
  principalId: string;
  status: "ACTIVE" | "TERMINATED" | "EXPIRED";
  effectivePermissions: string[];
};

const sessions = new Map<string, AuthSession>();

export const upsertAuthSession = (session: AuthSession): void => {
  sessions.set(session.id, {
    ...session,
    effectivePermissions: Array.from(new Set(session.effectivePermissions)),
  });
};

export const resolveAuthSessionBySid = (sid: string): AuthSession | null => {
  return sessions.get(sid) ?? null;
};

export const clearAuthSessions = (): void => {
  sessions.clear();
};
