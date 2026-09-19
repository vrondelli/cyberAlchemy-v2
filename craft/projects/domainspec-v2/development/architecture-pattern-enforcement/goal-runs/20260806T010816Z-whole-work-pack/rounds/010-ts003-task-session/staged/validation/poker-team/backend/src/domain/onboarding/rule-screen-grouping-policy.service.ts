export type RuleScreenGroupingPolicyInput = {
  regulationVersion?: string;
  maxSectionsPerGroup?: number;
};

export type RuleScreenGroupingPolicy = {
  regulationVersion: string;
  maxSectionsPerGroup: number;
  enforceAcceptanceGate: boolean;
  requireProgressIndicator: boolean;
};

export type RuleScreenGroup = {
  id: string;
  title: string;
  sections: string[];
};

const DEFAULT_REGULATION_VERSION = "2026-04";
const DEFAULT_MAX_SECTIONS_PER_GROUP = 2;

const DEFAULT_SECTION_SEQUENCE = [
  "Introducao",
  "Compromisso com o Estudo",
  "Pontualidade",
  "Disciplina de Bankroll",
  "Comunicacao",
  "Conduta Profissional",
];

const DEFAULT_GROUP_TITLES = [
  "Introducao e Compromissos",
  "Regras Operacionais",
  "Comunicacao e Conduta",
];

const toPositiveInt = (value: string | undefined): number | null => {
  if (!value) return null;
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

const trimToOptional = (value: string | undefined): string | undefined => {
  if (!value) return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

export const resolveRuleScreenGroupingPolicy = (
  input: RuleScreenGroupingPolicyInput,
  env: NodeJS.ProcessEnv = process.env,
): RuleScreenGroupingPolicy => {
  const configuredVersion = trimToOptional(env.ONBOARDING_REGULATION_VERSION);
  const inputVersion = trimToOptional(input.regulationVersion);

  const configuredMax = toPositiveInt(env.ONBOARDING_MAX_SECTIONS_PER_GROUP);
  const inputMax = input.maxSectionsPerGroup;

  return {
    regulationVersion:
      inputVersion ?? configuredVersion ?? DEFAULT_REGULATION_VERSION,
    maxSectionsPerGroup:
      typeof inputMax === "number" && Number.isInteger(inputMax) && inputMax > 0
        ? inputMax
        : configuredMax ?? DEFAULT_MAX_SECTIONS_PER_GROUP,
    enforceAcceptanceGate: true,
    requireProgressIndicator: true,
  };
};

export const buildRuleScreenGroups = (
  maxSectionsPerGroup: number,
): RuleScreenGroup[] => {
  const chunkSize = Number.isInteger(maxSectionsPerGroup) && maxSectionsPerGroup > 0
    ? maxSectionsPerGroup
    : DEFAULT_MAX_SECTIONS_PER_GROUP;

  const groups: RuleScreenGroup[] = [];

  for (let offset = 0; offset < DEFAULT_SECTION_SEQUENCE.length; offset += chunkSize) {
    const index = groups.length;
    groups.push({
      id: `group-${index + 1}`,
      title:
        chunkSize === DEFAULT_MAX_SECTIONS_PER_GROUP
          ? (DEFAULT_GROUP_TITLES[index] ?? `Grupo ${index + 1}`)
          : `Grupo ${index + 1}`,
      sections: DEFAULT_SECTION_SEQUENCE.slice(offset, offset + chunkSize),
    });
  }

  return groups;
};
