import type { PermissionGrant } from "./permission-grant.entity";

export type PermissionDecision = "ALLOW" | "DENY";

/**
 * Flat permission matching: segment-by-segment with wildcard support.
 * Moved from infrastructure/http/auth/permission-checker.service.ts to resolve
 * domain→infra dependency inversion (V1, V11).
 */
export const matchPermission = (
  grantedPermission: string,
  requiredPermission: string,
): boolean => {
  const grantedParts = grantedPermission.split(".");
  const requiredParts = requiredPermission.split(".");

  for (let i = 0; i < requiredParts.length; i += 1) {
    const grantedPart = grantedParts[i];
    const requiredPart = requiredParts[i];

    if (!grantedPart) {
      return false;
    }

    if (grantedPart === "*") {
      return true;
    }

    if (grantedPart !== requiredPart) {
      return false;
    }
  }

  return grantedParts.length <= requiredParts.length;
};

export const hasRequiredPermission = (
  grantedPermissions: string[],
  requiredPermission: string,
): boolean => {
  if (grantedPermissions.length === 0) {
    return false;
  }

  return grantedPermissions.some((permission) =>
    matchPermission(permission, requiredPermission),
  );
};

/**
 * Permission resolution with deny-override policy.
 * Precedence: deny > exact allow > scoped wildcard > global wildcard > default deny
 */
export function resolvePermissionDecision(
  grants: Array<{ permissionKey: string; effect: "ALLOW" | "DENY" }>,
  requiredPermission: string,
): PermissionDecision {
  const requiredParts = requiredPermission.split(".");

  let hasDeny = false;
  let hasExactAllow = false;
  let hasScopedWildcard = false;
  let hasGlobalWildcard = false;

  for (const grant of grants) {
    if (matchPermissionKey(grant.permissionKey, requiredParts)) {
      if (grant.effect === "DENY") {
        hasDeny = true;
      } else {
        const grantParts = grant.permissionKey.split(".");
        if (isExactMatch(grantParts, requiredParts)) {
          hasExactAllow = true;
        } else if (isGlobalWildcard(grantParts)) {
          hasGlobalWildcard = true;
        } else {
          hasScopedWildcard = true;
        }
      }
    }
  }

  if (hasDeny) return "DENY";
  if (hasExactAllow || hasScopedWildcard || hasGlobalWildcard) return "ALLOW";
  return "DENY";
}

function matchPermissionKey(
  grantKey: string,
  requiredParts: string[],
): boolean {
  const grantParts = grantKey.split(".");
  for (let i = 0; i < requiredParts.length; i++) {
    const gp = grantParts[i];
    if (!gp) return false;
    if (gp === "*") return true;
    if (gp !== requiredParts[i]) return false;
  }
  return grantParts.length <= requiredParts.length;
}

function isExactMatch(grantParts: string[], requiredParts: string[]): boolean {
  if (grantParts.length !== requiredParts.length) return false;
  return grantParts.every((p, i) => p === requiredParts[i]);
}

function isGlobalWildcard(grantParts: string[]): boolean {
  return grantParts.length >= 1 && grantParts[0] === "*";
}

/**
 * Resolve effective permissions from roleKeys, directPermissions, and grants.
 * Login C2 calculation.
 */
export function resolveEffectivePermissions(
  roleKeys: string[],
  directPermissions: string[],
  grants: PermissionGrant[],
): string[] {
  const allowSet = new Set<string>(directPermissions);

  const granteeKeys = new Set([...roleKeys, ...directPermissions]);

  for (const grant of grants) {
    if (grant.effect === "ALLOW") {
      allowSet.add(grant.permissionKey);
    }
  }

  return [...new Set(allowSet)];
}
