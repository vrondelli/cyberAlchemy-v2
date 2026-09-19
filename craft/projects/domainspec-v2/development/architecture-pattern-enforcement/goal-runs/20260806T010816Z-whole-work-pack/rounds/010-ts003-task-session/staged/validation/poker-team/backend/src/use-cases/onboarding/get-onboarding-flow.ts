import {
  buildRuleScreenGroups,
  resolveRuleScreenGroupingPolicy,
} from "../../domain/onboarding/rule-screen-grouping-policy.service";
import {
  queryCacheHit,
  queryCacheHitRatio,
  queryCacheLookup,
  queryDuration,
  queryResultSize,
} from "../../infrastructure/telemetry/instruments";

export type OnboardingFlowGroup = {
  id: string;
  title: string;
  sections: string[];
};

export type OnboardingFlowPayload = {
  regulationVersion: string;
  groups: OnboardingFlowGroup[];
  acceptanceRequired: true;
  lgpdConsentRequired: true;
};

export type GetOnboardingFlowInput = {
  regulationVersion?: string;
  compactMode?: boolean;
};

const FEATURE = "player-onboarding";
const QUERY = "GetOnboardingFlow";

export const getOnboardingFlowUseCase =
  async (input: GetOnboardingFlowInput = {}): Promise<OnboardingFlowPayload> => {
    const startedAt = performance.now();
    let resultSize = 0;

    try {
      const policy = resolveRuleScreenGroupingPolicy({
        regulationVersion: input.regulationVersion,
        maxSectionsPerGroup: input.compactMode ? 1 : undefined,
      });

      const payload: OnboardingFlowPayload = {
        regulationVersion: policy.regulationVersion,
        groups: buildRuleScreenGroups(policy.maxSectionsPerGroup),
        acceptanceRequired: true,
        lgpdConsentRequired: true,
      };

      resultSize = payload.groups.length;
      return payload;
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
      queryCacheHit.add(1, {
        feature: FEATURE,
        query: QUERY,
      });
      queryCacheHitRatio.record(1, {
        feature: FEATURE,
        query: QUERY,
      });
    }
  };
