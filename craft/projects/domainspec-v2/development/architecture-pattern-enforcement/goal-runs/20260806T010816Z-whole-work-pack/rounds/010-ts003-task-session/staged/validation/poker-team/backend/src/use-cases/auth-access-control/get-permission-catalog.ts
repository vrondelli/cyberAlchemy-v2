import type { PermissionGrantRepository } from "../../domain/auth-access-control/auth.repository";
import {
  queryCacheHit,
  queryCacheHitRatio,
  queryCacheLookup,
  queryDuration,
  queryResultSize,
} from "../../infrastructure/telemetry/instruments";

export type GetPermissionCatalogInput = {
  namespace?: string;
  includeDeprecated?: boolean;
};

export type PermissionCatalogEntry = {
  key: string;
  description: string;
  status: "active" | "deprecated";
};

export type GetPermissionCatalogResult = {
  permissions: PermissionCatalogEntry[];
};

const FEATURE = "auth-access-control";
const QUERY = "GetPermissionCatalog";

export const getPermissionCatalogUseCase =
  (grantRepo: PermissionGrantRepository) =>
  async (
    input: GetPermissionCatalogInput,
  ): Promise<GetPermissionCatalogResult> => {
    const startedAt = performance.now();
    let resultSize = 0;
    let cacheHit = 0;
    const includeDeprecated = input.includeDeprecated ?? false;

    try {
      const grants = await grantRepo.findAll({
        namespace: input.namespace,
        includeDeprecated,
      });

      // Deduplicate by permissionKey
      const seen = new Set<string>();
      const permissions: PermissionCatalogEntry[] = [];

      for (const grant of grants) {
        if (seen.has(grant.permissionKey)) {
          cacheHit += 1;
          continue;
        }
        seen.add(grant.permissionKey);

        permissions.push({
          key: grant.permissionKey,
          description: "", // Description sourced from registry metadata
          status: "active",
        });
      }

      resultSize = permissions.length;
      return { permissions };
    } finally {
      const durationSec = (performance.now() - startedAt) / 1000;

      queryDuration.record(durationSec, {
        feature: FEATURE,
        query: QUERY,
      });
      queryResultSize.record(resultSize, {
        feature: FEATURE,
        query: QUERY,
      });

      queryCacheLookup.add(1, {
        feature: FEATURE,
        query: QUERY,
      });
      queryCacheHit.add(cacheHit > 0 ? 1 : 0, {
        feature: FEATURE,
        query: QUERY,
      });
      queryCacheHitRatio.record(cacheHit > 0 ? 1 : 0, {
        feature: FEATURE,
        query: QUERY,
      });
    }
  };
