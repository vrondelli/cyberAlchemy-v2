import { describe, expect, it } from "vitest";
import {
  buildRuleScreenGroups,
  resolveRuleScreenGroupingPolicy,
} from "./rule-screen-grouping-policy.service";

describe("rule-screen-grouping policy", () => {
  it("resolves default regulation version and grouping", () => {
    const policy = resolveRuleScreenGroupingPolicy({}, {});

    expect(policy.regulationVersion).toBe("2026-04");
    expect(policy.maxSectionsPerGroup).toBe(2);
    expect(policy.enforceAcceptanceGate).toBe(true);
    expect(policy.requireProgressIndicator).toBe(true);
  });

  it("uses input regulation version and max sections override", () => {
    const policy = resolveRuleScreenGroupingPolicy(
      {
        regulationVersion: "2026-05",
        maxSectionsPerGroup: 1,
      },
      {
        ONBOARDING_REGULATION_VERSION: "2026-04",
        ONBOARDING_MAX_SECTIONS_PER_GROUP: "3",
      },
    );

    expect(policy.regulationVersion).toBe("2026-05");
    expect(policy.maxSectionsPerGroup).toBe(1);
  });

  it("falls back to defaults for invalid max sections env", () => {
    const policy = resolveRuleScreenGroupingPolicy(
      {},
      {
        ONBOARDING_REGULATION_VERSION: "2026-06",
        ONBOARDING_MAX_SECTIONS_PER_GROUP: "invalid",
      },
    );

    expect(policy.regulationVersion).toBe("2026-06");
    expect(policy.maxSectionsPerGroup).toBe(2);
  });

  it("builds deterministic default groups", () => {
    const groups = buildRuleScreenGroups(2);

    expect(groups).toHaveLength(3);
    expect(groups[0]).toMatchObject({
      id: "group-1",
      title: "Introducao e Compromissos",
      sections: ["Introducao", "Compromisso com o Estudo"],
    });
    expect(groups[2]).toMatchObject({
      id: "group-3",
      title: "Comunicacao e Conduta",
      sections: ["Comunicacao", "Conduta Profissional"],
    });
  });

  it("builds compact groups when max sections per group is one", () => {
    const groups = buildRuleScreenGroups(1);

    expect(groups).toHaveLength(6);
    expect(groups[0].title).toBe("Grupo 1");
    expect(groups[5].title).toBe("Grupo 6");
  });
});
