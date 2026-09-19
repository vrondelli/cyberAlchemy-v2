import {
  derivePartitions,
  SFOL_TDE_API_VERSION,
  type DerivePartitionsResponse,
} from "../../../../domainspec-v2/impl/test-derivation-engine/src/sfol/api/index.ts";
import type { ClauseDenominator } from "../../../../domainspec-v2/impl/test-derivation-engine/src/sfol/denominator/index.ts";
import { EXHAUSTIVE_FINITE_RULESET } from "../../../../domainspec-v2/impl/test-derivation-engine/src/sfol/partitions/index.ts";

/**
 * Additive Auth v2 migration boundary. Historical v1 claims and receipts are
 * immutable inputs; this adapter delegates new partition derivation to the
 * capability-neutral TDE API and owns only the Auth case-count constraint.
 */
export function deriveAuthCommandBoundaryPartitionsV2(
  module: unknown,
  denominator: ClauseDenominator,
): DerivePartitionsResponse {
  const result = derivePartitions({
    api_version: SFOL_TDE_API_VERSION,
    module,
    denominator,
    ruleset: { ...EXHAUSTIVE_FINITE_RULESET, max_cases: 8 },
  });
  if (result.ok && result.value.length !== 8) {
    return {
      ok: false,
      diagnostics: [{
        code: "SFOL_PARTITION_DENOMINATOR_MISMATCH",
        stage: "partition-derivation",
        subject: "auth-command-boundary",
        detail: `Auth v2 requires exactly eight exhaustive Boolean valuations; derived ${result.value.length}`,
      }],
    };
  }
  return result;
}
